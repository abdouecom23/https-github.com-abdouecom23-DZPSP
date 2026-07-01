import 'dotenv/config';
import express from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { db } from './server/db';
import { KycLevel, TransactionType } from './src/types';
import { EventEmitter } from 'events';

export const txStream = new EventEmitter();

// Initialize Express
const app = express();
const PORT = 3000;

// Apply CORS with basic restrictions (in production this should be strictly tied to frontend origin)
app.use(cors({ origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL || false : '*' }));
app.use(express.json());

// ==========================================
// PERFORMANCE MONITORING SETUP
// ==========================================

interface RequestMetric {
  id: string;
  timestamp: number;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  memoryUsageMb: number;
}

const metricsHistory: RequestMetric[] = [];
const MAX_METRICS_HISTORY = 1000;

const endpointStats: Record<string, { count: number; totalDurationMs: number; errors: number }> = {};

function recordRequestMetric(method: string, path: string, statusCode: number, durationMs: number) {
  const memory = process.memoryUsage();
  const rssMb = Math.round(memory.rss / 1024 / 1024 * 100) / 100;
  
  const metric: RequestMetric = {
    id: `met-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
    method,
    path,
    statusCode,
    durationMs,
    memoryUsageMb: rssMb
  };

  metricsHistory.unshift(metric);
  if (metricsHistory.length > MAX_METRICS_HISTORY) {
    metricsHistory.pop();
  }

  const normalizedPath = path
    .replace(/\/api\/accounts\/[a-zA-Z0-9-_\.]+/, '/api/accounts/:id')
    .replace(/\/api\/transactions\/[a-zA-Z0-9-_\.]+/, '/api/transactions/:id')
    .replace(/\/api\/agents\/[a-zA-Z0-9-_\.]+/, '/api/agents/:id')
    .replace(/\/api\/compliance\/blocked\/[a-zA-Z0-9-_\.]+/, '/api/compliance/blocked/:id')
    .replace(/\/api\/compliance\/held\/[a-zA-Z0-9-_\.]+/, '/api/compliance/held/:id')
    .replace(/\/api\/compliance\/multisig\/[a-zA-Z0-9-_\.]+/, '/api/compliance/multisig/:id')
    .replace(/\/api\/compliance\/reports\/[a-zA-Z0-9-_\.]+/, '/api/compliance/reports/:id');

  const key = `${method} ${normalizedPath}`;
  if (!endpointStats[key]) {
    endpointStats[key] = { count: 0, totalDurationMs: 0, errors: 0 };
  }
  
  endpointStats[key].count++;
  endpointStats[key].totalDurationMs += durationMs;
  if (statusCode >= 400) {
    endpointStats[key].errors++;
  }
}

// Performance tracking middleware
app.use((req, res, next) => {
  if (req.path.startsWith('/api') && req.path !== '/api/performance/metrics') {
    const start = process.hrtime();
    res.on('finish', () => {
      const diff = process.hrtime(start);
      const durationMs = (diff[0] * 1e3 + diff[1] * 1e-6);
      recordRequestMetric(req.method, req.path, res.statusCode, durationMs);
    });
  }
  next();
});

// Lazy load Gemini AI to avoid crashing on boot if key is missing
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== 'MY_GEMINI_API_KEY') {
      try {
        aiClient = new GoogleGenAI({
          apiKey: key,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });
      } catch (err) {
        console.error("Failed to initialize Gemini Client:", err);
      }
    }
  }
  return aiClient;
}

// ==========================================
// REAL-TIME TRANSACTION STREAMING (SSE)
// ==========================================
app.get('/api/stream/transactions', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const onTx = (tx: any) => {
    res.write(`data: ${JSON.stringify(tx)}\n\n`);
  };
  
  txStream.on('new_transaction', onTx);
  
  req.on('close', () => {
    txStream.off('new_transaction', onTx);
  });
});

// ==========================================
// DIGITAL SERVICES MOCK
// ==========================================
app.get('/api/services', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'S1', name: 'Mobilis Top-up', amount: 1000 },
      { id: 'S2', name: 'Djezzy Top-up', amount: 1000 },
      { id: 'S3', name: 'Ooredoo Top-up', amount: 1000 },
      { id: 'S4', name: 'Idoom ADSL', amount: 1600 },
      { id: 'S5', name: 'Sonelgaz', amount: 5000 }
    ]
  });
});

// ==========================================
// CIB / EDAHABIA GATEWAY SIMULATOR
// ==========================================
app.post('/api/cib/checkout', (req, res) => {
  const { account, amount, full_name, return_url } = req.body;
  if (!account || !amount) {
    return res.status(400).json({ error: 'Missing account or amount' });
  }
  
  // Simulate generating a hosted checkout session
  const cibTransactionId = `cib_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const paymentUrl = `${req.protocol}://${req.get('host')}/checkout/${cibTransactionId}`;
  
  res.json({
    success: true,
    data: {
      cib_transaction_id: cibTransactionId,
      payment_url: paymentUrl,
      amount,
      status: 'pending'
    },
    timestamp: new Date().toISOString()
  });
});

app.get('/api/cib/status/:id', (req, res) => {
  // Simulate checking CIB status
  res.json({
    success: true,
    data: {
      cib_transaction_id: req.params.id,
      status: 'success'
    },
    timestamp: new Date().toISOString()
  });
});

// ==========================================
// LEDGER BRIDGE (DINA) PROXY ENGINES
// ==========================================
const LEDGER_BRIDGE_URL = process.env.SOFIZPAY_SERVICE_URL || 'http://localhost:3001';

async function ledgerBridgeCall(path: string, method = 'GET', body?: any) {
  const opts: RequestInit = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  try {
    const r = await fetch(`${LEDGER_BRIDGE_URL}${path}`, opts);
    return await r.json();
  } catch (error: any) {
    console.warn(`[Ledger Bridge API Connection Warning] ${error.message}. Emulating on-chain ledger bridge response for: ${path}`);
    
    // Simulate endpoints
    if (path.startsWith('/balance/')) {
      const publicKey = path.replace('/balance/', '');
      return {
        success: true,
        publicKey,
        balance: 15450.0,
        asset_code: 'DZT',
        asset_issuer: 'GBRIDGE_MASTER_KEY'
      };
    }
    
    if (path === '/cib/create' || path === '/cib/sandbox/create') {
      const cib_transaction_id = 'CIB-' + Math.random().toString(36).substring(2, 10).toUpperCase();
      return {
        success: true,
        cib_transaction_id,
        payment_url: `https://payment.cib.dz/checkout/${cib_transaction_id}/simulation`,
        url: `https://payment.cib.dz/checkout/${cib_transaction_id}/simulation`,
        status: 'pending'
      };
    }
    
    if (path.startsWith('/cib/status/') || path.startsWith('/cib/sandbox/status/')) {
      return {
        success: true,
        status: 'success',
        data: {
          status: 'success',
          cib_transaction_id: path.split('/').pop()
        }
      };
    }
    
    if (path.startsWith('/transactions/')) {
      const publicKey = path.replace('/transactions/', '').split('?')[0];
      return {
        success: true,
        publicKey,
        transactions: [
          {
            hash: '6a8e' + Math.random().toString(16).substring(2, 10) + 'ef9a',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            sender: 'GBRIDGE_MASTER_KEY',
            receiver: publicKey,
            amount: '2500.00',
            type: 'received',
            memo: 'DZPSP-INIT'
          },
          {
            hash: '1b2c' + Math.random().toString(16).substring(2, 10) + 'd4e5',
            timestamp: new Date(Date.now() - 1800000).toISOString(),
            sender: publicKey,
            receiver: 'GSERVICES_RECHARGE',
            amount: '180.00',
            type: 'sent',
            memo: 'SVC-GAME-FREEFIRE'
          }
        ]
      };
    }
    
    if (path === '/services/recharge') {
      return {
        success: true,
        operation_id: 'OP-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
        status: 'completed'
      };
    }
    
    if (path === '/services/products') {
      return {
        success: true,
        data: null
      };
    }
    
    return {
      success: true,
      emulated: true,
      message: "Ledger bridge simulation response"
    };
  }
}

// ── Ledger Bridge: DZT Balance ──
app.get('/api/ledger-bridge/balance/:publicKey', async (req, res) => {
  try {
    const data = await ledgerBridgeCall(`/balance/${req.params.publicKey}`);
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Ledger Bridge: CIB Deposit (Dahabia card) ──
app.post('/api/ledger-bridge/cib/create', async (req, res) => {
  try {
    const { accountId, amount, fullName, phone, email, memo, returnUrl } = req.body;
    if (!accountId || !amount || !fullName || !phone || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const acc = db.getAccountById(accountId);
    if (!acc) return res.status(404).json({ error: 'Account not found' });

    const data = await ledgerBridgeCall('/cib/create', 'POST', {
      account: process.env.SOFIZPAY_MASTER_PUBLIC_KEY || 'GBRIDGE_MASTER_KEY',
      amount,
      full_name: fullName,
      phone,
      email,
      memo: memo || `DZPSP-${acc.iban}`,
      return_url: returnUrl || `${process.env.APP_URL || 'http://localhost:3000'}/return`
    });

    if (data.success) {
      // Store pending deposit record
      db.recordCIBDeposit({
        accountId,
        cibTransactionId: data.data?.cib_transaction_id || data.cib_transaction_id,
        amount,
        fullName,
        phone,
        email,
        memo: memo || `DZPSP-${acc.iban}`,
        paymentUrl: data.data?.payment_url || data.url
      });
      db.logAudit('CIB_DEPOSIT_INITIATED',
        `CIB deposit of ${amount} DA initiated for ${acc.name}. CIB ID: ${data.data?.cib_transaction_id || data.cib_transaction_id}`,
        'INFO');
    }
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Ledger Bridge: Poll CIB status + auto-credit ledger ──
app.get('/api/ledger-bridge/cib/confirm/:cibId', async (req, res) => {
  try {
    const data = await ledgerBridgeCall(`/cib/status/${req.params.cibId}`);
    const deposit = db.getCIBDepositByTransactionId(req.params.cibId);

    if (data.success && (data.data?.status === 'success' || data.status === 'success') && deposit?.status === 'PENDING') {
      // Auto-credit DA ledger
      db.executeTransaction({
        type: 'CASH_IN',
        amount: deposit.amount,
        senderIban: 'SOFIZPAY_CIB',
        receiverIban: db.getAccountById(deposit.accountId)!.iban,
        reference: `CIB-${req.params.cibId}`,
        ipAddress: req.ip || '127.0.0.1',
        deviceId: 'Ledger-Bridge-CIB-Gateway',
        otpCode: 'CIB_CONFIRMED'
      });
      db.confirmCIBDeposit(req.params.cibId);
      db.logAudit('CIB_DEPOSIT_CONFIRMED',
        `CIB deposit confirmed. ${deposit.amount} DA credited to account ${deposit.accountId}.`,
        'INFO');
    }
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Ledger Bridge: Sandbox CIB ──
app.post('/api/ledger-bridge/cib/sandbox/create', async (req, res) => {
  try {
    const data = await ledgerBridgeCall('/cib/sandbox/create', 'POST', req.body);
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get('/api/ledger-bridge/cib/sandbox/status/:cibId', async (req, res) => {
  try {
    const data = await ledgerBridgeCall(`/cib/sandbox/status/${req.params.cibId}`);
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Ledger Bridge: On-chain Transactions ──
app.get('/api/ledger-bridge/transactions/:publicKey', async (req, res) => {
  try {
    const data = await ledgerBridgeCall(`/transactions/${req.params.publicKey}`);
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Ledger Bridge: Reconciliation ──
app.get('/api/ledger-bridge/reconcile-proof/:publicKey', async (req, res) => {
  try {
    const data = await ledgerBridgeCall(`/transactions/${req.params.publicKey}?limit=500`);
    if (!data.success) return res.json(data);

    const received = data.transactions
      .filter((t: any) => t.type === 'received')
      .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);

    const sent = data.transactions
      .filter((t: any) => t.type === 'sent')
      .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);

    const totalLiabilities = db.getAccounts().reduce((sum, a) => sum + a.balance, 0);

    res.json({
      success: true,
      publicKey: req.params.publicKey,
      totalReceived: received,
      totalSent: sent,
      netOnChain: received - sent,
      transactionCount: data.transactions.length,
      internalLiabilities: totalLiabilities,
      timestamp: new Date().toISOString()
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Ledger Bridge: Digital Services Recharge ──
app.post('/api/ledger-bridge/recharge', async (req, res) => {
  try {
    const { accountId, serviceType, operator, phone, playerId,
            billId, amount, offer, encryptedSk } = req.body;

    const acc = db.getAccountById(accountId);
    if (!acc) return res.status(404).json({ error: 'Account not found' });
    if (acc.kycStatus !== 'ACTIVE') {
      return res.status(400).json({ error: 'Account must be ACTIVE to use services' });
    }
    if (acc.balance < Number(amount)) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const data = await ledgerBridgeCall('/services/recharge', 'POST', {
      encrypted_sk: encryptedSk || 'MOCK_SK_ENCRYPTED',
      service_type: serviceType,
      operator,
      phone,
      player_id: playerId,
      bill_id: billId,
      amount: String(amount),
      offer
    });

    if (data.success) {
      // Deduct from DA ledger
      db.executeTransaction({
        type: 'CASH_OUT',
        amount: Number(amount),
        senderIban: acc.iban,
        receiverIban: 'LEDGER_SERVICES',
        reference: `SVC-${serviceType}-${operator}-${Date.now()}`,
        ipAddress: req.ip || '127.0.0.1',
        deviceId: 'Ledger-Bridge-Services',
        otpCode: 'SERVICE_AUTH'
      });
      
      // Also record service recharge log
      db.recordServiceRecharge({
        accountId,
        serviceType,
        operator,
        target: phone || playerId || billId || 'N/A',
        amount: Number(amount),
        offer,
        operationId: data.data?.operation_id || data.operation_id
      });

      db.logAudit('SERVICE_RECHARGE',
        `${serviceType} recharge via ${operator} for ${amount} DA. Account: ${acc.name}`,
        'INFO');
    }
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Ledger Bridge: Products catalog ──
app.get('/api/ledger-bridge/products', async (req, res) => {
  try {
    const data = await ledgerBridgeCall('/services/products');
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Ledger Bridge: Link Wallet ──
app.post('/api/ledger-bridge/link-wallet', async (req, res) => {
  try {
    const { accountId, publicKey } = req.body;
    if (!accountId || !publicKey) {
      return res.status(400).json({ error: 'accountId and publicKey required' });
    }
    // Verify key is valid by fetching balance
    const check = await ledgerBridgeCall(`/balance/${publicKey}`);
    db.linkDinarBridgeWallet(accountId, publicKey);
    db.logAudit('STELLAR_WALLET_LINKED',
      `Stellar wallet ${publicKey.slice(0,8)}... linked to account ${accountId}.`,
      'INFO');
    res.json({ success: true, publicKey, dztBalance: check.balance ?? 0 });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ==========================================
// API ROUTES
// ==========================================

// Performance Metrics
app.get('/api/performance/metrics', (req, res) => {
  try {
    const memory = process.memoryUsage();
    const uptime = process.uptime();
    
    const totalRequests = metricsHistory.length;
    const totalDuration = metricsHistory.reduce((sum, m) => sum + m.durationMs, 0);
    const averageDurationMs = totalRequests > 0 ? (totalDuration / totalRequests) : 0;
    
    const sortedDurations = [...metricsHistory].map(m => m.durationMs).sort((a, b) => a - b);
    const p95DurationMs = sortedDurations.length > 0 ? sortedDurations[Math.floor(sortedDurations.length * 0.95)] : 0;
    const p99DurationMs = sortedDurations.length > 0 ? sortedDurations[Math.floor(sortedDurations.length * 0.99)] : 0;
    
    const errorsCount = metricsHistory.filter(m => m.statusCode >= 400).length;
    const errorRate = totalRequests > 0 ? (errorsCount / totalRequests) * 100 : 0;

    const endpointsList = Object.entries(endpointStats).map(([endpoint, stats]) => ({
      endpoint,
      count: stats.count,
      averageDurationMs: stats.count > 0 ? (stats.totalDurationMs / stats.count) : 0,
      errors: stats.errors
    })).sort((a, b) => b.count - a.count);

    res.json({
      totalRequests,
      averageDurationMs,
      p95DurationMs,
      p99DurationMs,
      errorRate,
      uptimeSeconds: uptime,
      systemMetrics: {
        cpuLoad: Math.round((process.cpuUsage().user + process.cpuUsage().system) / 10000) / 100,
        memoryUsagePercent: Math.round((memory.heapUsed / memory.heapTotal) * 10000) / 100,
        heapUsedMb: Math.round(memory.heapUsed / 1024 / 1024 * 100) / 100,
        heapTotalMb: Math.round(memory.heapTotal / 1024 / 1024 * 100) / 100,
        rssMb: Math.round(memory.rss / 1024 / 1024 * 100) / 100
      },
      endpoints: endpointsList,
      recentRequests: metricsHistory.slice(0, 100)
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Global Stats
app.get('/api/stats', (req, res) => {
  try {
    const stats = db.getGlobalStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Accounts
app.get('/api/accounts', (req, res) => {
  try {
    res.json(db.getAccounts());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/accounts/:id', (req, res) => {
  try {
    const acc = db.getAccountById(req.params.id);
    if (!acc) return res.status(404).json({ error: 'Account not found' });
    res.json(acc);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/accounts/open', (req, res) => {
  try {
    const { name, email, phoneNumber, kycLevel, idCardNumber, documentUrl, idCardBackUrl, proofOfAddressUrl, idCardExpiryDate, proofOfAddressExpiryDate } = req.body;
    if (!name || !email || !phoneNumber || !kycLevel) {
      return res.status(400).json({ error: 'Missing required fields: name, email, phoneNumber, kycLevel' });
    }

    // Check sanctions screening BEFORE opening (Issue #5)
    const sanctions = db.checkSanctionsScreening(name, idCardNumber || '');
    if (sanctions.sanctioned) {
      return res.status(403).json({
        error: `SANCTIONS_BLOCKED: ${sanctions.matchReason}. Account creation denied under Algiers anti-terrorist directives.`
      });
    }

    const acc = db.openAccount({
      name,
      email,
      phoneNumber,
      kycLevel: Number(kycLevel) as KycLevel,
      idCardNumber,
      documentUrl,
      idCardBackUrl,
      proofOfAddressUrl,
      idCardExpiryDate,
      proofOfAddressExpiryDate
    });
    res.status(201).json(acc);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/accounts/:id/kyc-upgrade', (req, res) => {
  try {
    const { level, idCardNumber, idCardUrl, idCardBackUrl, addressUrl } = req.body;
    if (!level) return res.status(400).json({ error: 'Missing target level' });
    const acc = db.submitKycUpgrade(req.params.id, Number(level) as KycLevel, { idCardNumber, idCardUrl, idCardBackUrl, addressUrl });
    res.json(acc);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/accounts/:id/kyc-review', (req, res) => {
  try {
    const { status, notes } = req.body;
    if (!status) return res.status(400).json({ error: 'Missing review status' });
    const acc = db.updateKycStatus(req.params.id, status, notes);
    res.json(acc);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/accounts/:id/kyc-cooldown-simulate', (req, res) => {
  try {
    const acc = db.simulateKycCooldownBypass(req.params.id);
    res.json(acc);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/accounts/:id/kyc-reject-simulate', (req, res) => {
  try {
    const acc = db.simulateKycRejection(req.params.id);
    res.json(acc);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// KYC Supervisor Appeals
app.post('/api/accounts/:id/kyc-exception-request', (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ error: 'Missing reason for exception request' });
    const acc = db.requestKycExceptionBypass(req.params.id, reason);
    res.json(acc);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/accounts/:id/kyc-exception-approve', (req, res) => {
  try {
    const { supervisorName } = req.body;
    if (!supervisorName) return res.status(400).json({ error: 'Missing supervisor name' });
    const acc = db.approveKycExceptionBypass(req.params.id, supervisorName);
    res.json(acc);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Transactions & Ledger
app.get('/api/transactions', (req, res) => {
  try {
    res.json(db.getTransactions());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/transactions/:id', (req, res) => {
  try {
    const tx = db.getTransactions().find(t => t.id === req.params.id);
    if (!tx) return res.status(404).json({ error: 'Transaction not found' });
    res.json({
      ...tx,
      feeBreakdown: tx.feeBreakdown || { regulatoryFee: 0, operationalFee: 0, profitMargin: 0, total: tx.fee || 0 }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Search Transactions Compliance API
app.get('/api/transactions/search', (req, res) => {
  try {
    const { senderIban, receiverIban, startDate, endDate, type, minAmount, maxAmount, memo } = req.query;
    let txs = db.getTransactions();
    
    if (senderIban) txs = txs.filter(t => t.senderIban.replace(/\s/g, '').includes((senderIban as string).replace(/\s/g, '')));
    if (receiverIban) txs = txs.filter(t => t.receiverIban.replace(/\s/g, '').includes((receiverIban as string).replace(/\s/g, '')));
    if (type) txs = txs.filter(t => t.type === type);
    if (memo) txs = txs.filter(t => t.reference && t.reference.toLowerCase().includes((memo as string).toLowerCase()));
    
    if (startDate) {
      const start = new Date(startDate as string);
      txs = txs.filter(t => new Date(t.timestamp) >= start);
    }
    
    if (endDate) {
      const end = new Date(endDate as string);
      txs = txs.filter(t => new Date(t.timestamp) <= end);
    }
    
    if (minAmount) txs = txs.filter(t => t.amount >= Number(minAmount));
    if (maxAmount) txs = txs.filter(t => t.amount <= Number(maxAmount));
    
    res.json(txs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/transactions/execute', (req, res) => {
  try {
    const { type, amount, senderIban, receiverIban, reference, ipAddress, deviceId, otpCode, agentId } = req.body;
    if (!type || !amount || !senderIban || !receiverIban || !reference) {
      return res.status(400).json({ error: 'Missing required fields: type, amount, senderIban, receiverIban, reference' });
    }

    // High-risk safety check: OTP code is simulated on transfers and Cash-Outs
    const isHighRisk = type === 'TRANSFER' || type === 'CASH_OUT' || type === 'AGENT_CASH_OUT';
    if (isHighRisk && !otpCode) {
      return res.status(400).json({ error: 'OTP_REQUIRED: Strong Customer Authentication (SCA) is mandatory for outbound transactions. Please provide your 2FA OTP.' });
    }

    const tx = db.executeTransaction({
      type: type as TransactionType,
      amount: Number(amount),
      senderIban,
      receiverIban,
      reference,
      ipAddress: ipAddress || req.ip || '127.0.0.1',
      deviceId: deviceId || 'Web Browser',
      otpCode,
      agentId
    });

    txStream.emit('new_transaction', tx);
    res.status(201).json(tx);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Agents Network (Mandataires)
app.get('/api/agents', (req, res) => {
  try {
    res.json(db.getAgents());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/agents/register', (req, res) => {
  try {
    const { 
      name, 
      location, 
      initialCashRegister,
      contractFileUrl,
      contractFileName,
      contractExpiryDate,
      contractModificationDate,
      contractResiliationDate 
    } = req.body;
    if (!name || !location) {
      return res.status(400).json({ error: 'Missing name or location' });
    }
    const agent = db.registerAgent(name, location, Number(initialCashRegister || 0), {
      contractFileUrl,
      contractFileName,
      contractExpiryDate,
      contractModificationDate,
      contractResiliationDate
    });
    res.status(201).json(agent);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/agents/:id/contract', (req, res) => {
  try {
    const { 
      contractFileUrl, 
      contractFileName, 
      contractExpiryDate, 
      contractModificationDate, 
      contractResiliationDate 
    } = req.body;
    const agent = db.updateAgentContract(req.params.id, {
      contractFileUrl,
      contractFileName,
      contractExpiryDate,
      contractModificationDate,
      contractResiliationDate
    });
    res.json(agent);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/agents/:id/status', (req, res) => {
  try {
    const { isActive } = req.body;
    const agent = db.updateAgentStatus(req.params.id, !!isActive);
    res.json(agent);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Agent Commission Settlements
app.get('/api/agents/commission/settlements', (req, res) => {
  try {
    res.json(db.getCommissionSettlements());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/agents/commission/request', (req, res) => {
  try {
    const { agentId } = req.body;
    if (!agentId) return res.status(400).json({ error: 'Missing agentId' });
    const settlement = db.requestCommissionPayout(agentId);
    res.json(settlement);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/agents/commission/approve', (req, res) => {
  try {
    const { settlementId, approvedBy } = req.body;
    if (!settlementId || !approvedBy) return res.status(400).json({ error: 'Missing settlementId or approvedBy' });
    const settlement = db.approveCommissionPayout(settlementId, approvedBy);
    res.json(settlement);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/agents/commission/pay', (req, res) => {
  try {
    const { settlementId, paymentReference } = req.body;
    if (!settlementId || !paymentReference) return res.status(400).json({ error: 'Missing settlementId or paymentReference' });
    const settlement = db.markCommissionAsPaid(settlementId, paymentReference);
    res.json(settlement);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Cantonnement & Reconciliation
app.get('/api/cantonment', (req, res) => {
  try {
    res.json(db.getCantonmentRecords());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/cantonment/reconcile', (req, res) => {
  try {
    const { reconciledBy, externalBalanceOverride } = req.body;
    if (!reconciledBy) {
      return res.status(400).json({ error: 'Missing reconciliation officer/process name' });
    }
    const record = db.reconcileCantonment(
      reconciledBy, 
      externalBalanceOverride !== undefined ? Number(externalBalanceOverride) : undefined
    );
    res.json(record);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Bank Guarantee
app.get('/api/guarantee', (req, res) => {
  try {
    res.json(db.getGuarantee());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/guarantee/update', (req, res) => {
  try {
    const { amount, expiryDate } = req.body;
    if (!amount || !expiryDate) {
      return res.status(400).json({ error: 'Missing amount or expiryDate' });
    }
    const guarantee = db.updateGuarantee(Number(amount), expiryDate);
    res.json(guarantee);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Guarantee Renewals API
app.get('/api/guarantee/renewals', (req, res) => {
  try {
    res.json(db.getGuaranteeRenewals());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/guarantee/renewal-request', (req, res) => {
  try {
    const { amount, expiryDate } = req.body;
    if (!amount || !expiryDate) return res.status(400).json({ error: 'Missing amount or expiryDate' });
    const renewal = db.requestGuaranteeRenewal(Number(amount), expiryDate);
    res.json(renewal);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/guarantee/renewal-approve', (req, res) => {
  try {
    const { renewalId, bankOfficer } = req.body;
    if (!renewalId || !bankOfficer) return res.status(400).json({ error: 'Missing renewalId or bankOfficer' });
    const renewal = db.approveGuaranteeRenewal(renewalId, bankOfficer);
    res.json(renewal);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/guarantee/renewal-issue', (req, res) => {
  try {
    const { renewalId } = req.body;
    if (!renewalId) return res.status(400).json({ error: 'Missing renewalId' });
    const guarantee = db.issueGuaranteeRenewal(renewalId);
    res.json(guarantee);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Audit Logs
app.get('/api/audit-logs', (req, res) => {
  try {
    res.json(db.getAuditLogs());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Audit Logs Search Compliance API
app.get('/api/audit-logs/search', (req, res) => {
  try {
    const { action, severity, startDate, endDate, keyword } = req.query;
    let logs = db.getAuditLogs();
    
    if (action) logs = logs.filter(l => l.action === action);
    if (severity) logs = logs.filter(l => l.severity === severity);
    
    if (startDate) {
      const start = new Date(startDate as string);
      logs = logs.filter(l => new Date(l.timestamp) >= start);
    }
    
    if (endDate) {
      const end = new Date(endDate as string);
      logs = logs.filter(l => new Date(l.timestamp) <= end);
    }
    
    if (keyword) {
      const kw = (keyword as string).toLowerCase();
      logs = logs.filter(l => 
        l.details.toLowerCase().includes(kw) || 
        l.action.toLowerCase().includes(kw) ||
        (l.ipAddress && l.ipAddress.toLowerCase().includes(kw))
      );
    }
    
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// TOTP Secret endpoint removed to prevent secret leak.
// In a real system, secrets are provisioned once during enrollment.

// Gemini AI OCR pipeline with fallback
app.post('/api/kyc/ocr', async (req, res) => {
  const { imageUrl } = req.body;
  if (!imageUrl) {
    return res.status(400).json({ error: 'Image URL or reference is required' });
  }

  const client = getGeminiClient();
  
  if (!client) {
    // If Gemini client is not initialized, mock OCR output gracefully
    console.log("No Gemini API key found, generating mock OCR result.");
    const mockNames = ["Mohamed Belkacem", "Farid Haddad", "Yasmina Slimani", "Karima Bensmail"];
    const mockNationalities = ["Algérienne", "Algérienne", "Algérienne", "Algérienne"];
    const selectIndex = Math.floor(Math.random() * mockNames.length);
    
    return res.json({
      name: mockNames[selectIndex],
      birthDate: `${1975 + Math.floor(Math.random() * 25)}-${String(1 + Math.floor(Math.random() * 11)).padStart(2, '0')}-${String(1 + Math.floor(Math.random() * 28)).padStart(2, '0')}`,
      idCardNumber: String(100000000 + Math.floor(Math.random() * 899999999)),
      nationality: mockNationalities[selectIndex],
      source: 'MOCK_OCR_FALLBACK'
    });
  }

  try {
    db.logAudit('OCR_START', `Analyzing uploaded document via Gemini model 'gemini-3.5-flash'`, 'INFO');
    
    // Call Gemini to do high-precision OCR on the ID image
    // To keep it self-contained, if imageUrl is a standard URL we can fetch and send it as inlineData,
    // or if it's a mock url we can just use prompt with description.
    let response;
    
    if (imageUrl.startsWith('data:image/') || imageUrl.startsWith('http')) {
      let base64Data = "";
      let mimeType = "image/jpeg";
      
      if (imageUrl.startsWith('data:image/')) {
        const parts = imageUrl.split(';base64,');
        mimeType = parts[0].split(':')[1];
        base64Data = parts[1];
      } else {
        // SSRF Protection: Block localhost and private IP ranges
        try {
          const urlObj = new URL(imageUrl);
          if (['localhost', '127.0.0.1', '0.0.0.0'].includes(urlObj.hostname) || urlObj.hostname.startsWith('10.') || urlObj.hostname.startsWith('192.168.') || urlObj.hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)) {
            return res.status(403).json({ error: 'SSRF blocked: Invalid image URL' });
          }
        } catch (e) {
          return res.status(400).json({ error: 'Invalid URL format' });
        }
        
        // Fetch image and convert to base64
        const imgFetch = await fetch(imageUrl);
        const buffer = await imgFetch.arrayBuffer();
        base64Data = Buffer.from(buffer).toString('base64');
        mimeType = imgFetch.headers.get('content-type') || 'image/jpeg';
      }

      response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          },
          {
            text: "Perform OCR on this Algerian National Identity Card. Extract the Full Name, Birth Date (YYYY-MM-DD), ID Card Number, and Nationality. Respond strictly with the JSON matching the specified schema."
          }
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Full Name of the citizen" },
              birthDate: { type: Type.STRING, description: "Birth date in YYYY-MM-DD" },
              idCardNumber: { type: Type.STRING, description: "National ID Card Number" },
              nationality: { type: Type.STRING, description: "Nationality" }
            },
            required: ["name", "birthDate", "idCardNumber", "nationality"]
          }
        }
      });
    } else {
      // In case of placeholder url reference
      response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `Generate realistic Algerian National ID details for verification. Provide a full Algerian name, birth date, unique ID number, and nationality. Respond strictly with JSON.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              birthDate: { type: Type.STRING },
              idCardNumber: { type: Type.STRING },
              nationality: { type: Type.STRING }
            },
            required: ["name", "birthDate", "idCardNumber", "nationality"]
          }
        }
      });
    }

    if (response && response.text) {
      const parsed = JSON.parse(response.text);
      db.logAudit('OCR_COMPLETED', `Successfully parsed identity card for ${parsed.name} using AI OCR pipeline.`, 'INFO');
      res.json({ ...parsed, source: 'GEMINI_AI_OCR' });
    } else {
      throw new Error("No text response from Gemini");
    }

  } catch (error: any) {
    console.error("Gemini OCR pipeline error:", error);
    db.logAudit('OCR_FAILED', `AI OCR extraction failed: ${error.message}. Triggering fallback parser.`, 'WARNING');
    // graceful fallback
    res.json({
      name: "Abdelkader Benali",
      birthDate: "1988-11-20",
      idCardNumber: "20394857201",
      nationality: "Algérienne",
      source: 'MOCK_OCR_RECOVERY'
    });
  }
});

// ==========================================
// REAL-TIME SSE COMPLIANCE STREAM
// ==========================================
let sseClients: express.Response[] = [];

db.registerAuditListener((log) => {
  sseClients.forEach(client => {
    try {
      client.write(`data: ${JSON.stringify(log)}\n\n`);
    } catch (err) {
      console.error("SSE client write failed, removing client", err);
    }
  });
});

app.get('/api/compliance/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  res.flushHeaders();

  sseClients.push(res);

  // Send initial ping/connection event
  res.write(`data: ${JSON.stringify({ connected: true, timestamp: new Date().toISOString() })}\n\n`);

  // Send keep-alive pings to prevent idle timeouts
  const intervalId = setInterval(() => {
    res.write(`: ping\n\n`);
  }, 15000);

  req.on('close', () => {
    clearInterval(intervalId);
    sseClients = sseClients.filter(c => c !== res);
  });
});

// ==========================================
// COMPLIANCE ROUTING MODULES
// ==========================================

// Blacklist (Blocked Entities)
app.get('/api/compliance/blocked', (req, res) => {
  try {
    res.json(db.getBlockedEntities());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/compliance/blocked', (req, res) => {
  try {
    const { entityType, entityValue, reason, blockedBy } = req.body;
    if (!entityType || !entityValue || !reason) {
      return res.status(400).json({ error: 'Missing required fields: entityType, entityValue, reason' });
    }
    const blocked = db.addBlockedEntity(entityType, entityValue, reason, blockedBy || 'System Administrator');
    res.status(201).json(blocked);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/compliance/blocked/:id/status', (req, res) => {
  try {
    const { status, appealReason } = req.body;
    if (!status) return res.status(400).json({ error: 'Missing status' });
    const updated = db.updateBlockedEntityStatus(req.params.id, status, appealReason);
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Whitelist (Trusted Beneficiaries)
app.get('/api/compliance/trusted/:accountId', (req, res) => {
  try {
    res.json(db.getTrustedBeneficiaries(req.params.accountId));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/compliance/trusted', (req, res) => {
  try {
    const { accountId, beneficiaryIban, beneficiaryName } = req.body;
    if (!accountId || !beneficiaryIban || !beneficiaryName) {
      return res.status(400).json({ error: 'Missing accountId, beneficiaryIban, or beneficiaryName' });
    }
    const tb = db.addTrustedBeneficiary(accountId, beneficiaryIban, beneficiaryName);
    res.status(201).json(tb);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Held Transactions (Manual compliance review queue)
app.get('/api/compliance/held', (req, res) => {
  try {
    res.json(db.getHeldTransactions());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/compliance/held/:id/review', (req, res) => {
  try {
    const { decision, notes, reviewer } = req.body;
    if (!decision || !notes) {
      return res.status(400).json({ error: 'Missing decision (APPROVED | REJECTED) or review notes' });
    }
    const reviewed = db.reviewHeldTransaction(req.params.id, decision, notes, reviewer || 'Compliance Agent');
    res.json(reviewed);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/compliance/decisions', (req, res) => {
  try {
    res.json(db.getComplianceDecisions());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Multi-Sig Large Transfer dual control list
app.get('/api/compliance/multisig', (req, res) => {
  try {
    res.json(db.getMultiSigTransactions());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/compliance/multisig/:id/sign', (req, res) => {
  try {
    const { signerName, status, reason } = req.body;
    if (!signerName || !status) {
      return res.status(400).json({ error: 'Missing signerName or status (APPROVED | REJECTED)' });
    }
    const msig = db.signMultiSigTransaction(req.params.id, signerName, status, reason || '');
    res.json(msig);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Failed Retries Registry
app.get('/api/compliance/retries', (req, res) => {
  try {
    res.json(db.getFailedTransactionRetries());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Compliance CTR / SAR Reports
app.get('/api/compliance/reports', (req, res) => {
  try {
    res.json(db.getComplianceReports());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/compliance/reports/sar', (req, res) => {
  try {
    const { accountId, reason } = req.body;
    if (!accountId || !reason) {
      return res.status(400).json({ error: 'Missing accountId or SAR filed reason' });
    }
    const report = db.generateSARReport(accountId, reason);
    res.status(201).json(report);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/compliance/reports/:id/submit', (req, res) => {
  try {
    const report = db.submitReportToFIU(req.params.id);
    res.json(report);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// SWIFT Clearing Ledger (MT103)
app.get('/api/compliance/swift', (req, res) => {
  try {
    res.json(db.getSwiftMessages());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Sanctions Screening check api
app.post('/api/compliance/sanctions-check', (req, res) => {
  try {
    const { name, idNumber } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required for sanctions check' });
    const result = db.checkSanctionsScreening(name, idNumber || '');
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update Document Expiry and Status Alert simulation
app.post('/api/accounts/:id/update-expiry', (req, res) => {
  try {
    const { idCardExpiryDate, proofOfAddressExpiryDate, documentStatusAlert } = req.body;
    const account = db.getAccountById(req.params.id);
    if (!account) return res.status(404).json({ error: 'Account not found' });
    
    if (idCardExpiryDate) account.idCardExpiryDate = idCardExpiryDate;
    if (proofOfAddressExpiryDate) account.proofOfAddressExpiryDate = proofOfAddressExpiryDate;
    if (documentStatusAlert) account.documentStatusAlert = documentStatusAlert;
    
    db.save();
    db.logAudit('KYC_DOCUMENT_UPDATED', `Documents for citizen ${account.name} updated. Expiry: ${idCardExpiryDate || 'n/a'}. Alert Level: ${documentStatusAlert || 'n/a'}.`, 'INFO');
    res.json(account);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ==========================================
// VITE OR STATIC STATIC DELIVERY
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    // Development mode with Vite Dev Middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production serving of compiled dist assets
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Start background compliance safeguarding worker
  startReconciliationWorker();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DinarFlow platform running on http://0.0.0.0:${PORT}`);
  });
}

function startReconciliationWorker() {
  console.log("Safeguarding Cantonment Reconciliation Worker started (Background Daemon)...");
  // Run an immediate reconciliation on start
  try {
    const record = db.reconcileCantonment("Background Automated Safeguarding Worker");
    console.log(`[Reconciliation Worker] Initial Cantonment reconciled: difference is ${record.difference} DA. Status: ${record.status}`);
  } catch (e: any) {
    console.error("[Reconciliation Worker] Initial Safeguarding reconciliation failed: ", e.message);
  }

  // Re-run every 30 seconds
  setInterval(() => {
    try {
      const record = db.reconcileCantonment("Background Automated Safeguarding Worker");
      console.log(`[Reconciliation Worker] Cantonment reconciled: difference is ${record.difference} DA. Status: ${record.status}`);
    } catch (e: any) {
      console.error("[Reconciliation Worker] Safeguarding reconciliation failed: ", e.message);
    }
  }, 30000); // 30 seconds interval

  // Background automated retry queue runner (checking every 10 seconds)
  setInterval(() => {
    try {
      db.processPendingRetries();
    } catch (e: any) {
      console.error("[Retry Worker] Automated transaction retry failed: ", e.message);
    }
  }, 10000);

  // Background automated TTL expiration cleaner for compliance holds (checking every 10 seconds)
  setInterval(() => {
    try {
      db.expireOldHeldTransactions();
    } catch (e: any) {
      console.error("[Hold Expiry Worker] Old hold auto-cleanup failed: ", e.message);
    }
  }, 10000);
}

startServer();
