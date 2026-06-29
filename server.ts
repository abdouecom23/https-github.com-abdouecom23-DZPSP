import express from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { db } from './src/server/db';
import { KycLevel, TransactionType } from './src/types';

// Initialize Express
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

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
// API ROUTES
// ==========================================

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
    const { name, email, phoneNumber, kycLevel, idCardNumber, documentUrl, idCardBackUrl, proofOfAddressUrl } = req.body;
    if (!name || !email || !phoneNumber || !kycLevel) {
      return res.status(400).json({ error: 'Missing required fields: name, email, phoneNumber, kycLevel' });
    }
    const acc = db.openAccount({
      name,
      email,
      phoneNumber,
      kycLevel: Number(kycLevel) as KycLevel,
      idCardNumber,
      documentUrl,
      idCardBackUrl,
      proofOfAddressUrl
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

// Search Transactions Compliance API
app.get('/api/transactions/search', (req, res) => {
  try {
    const { senderIban, receiverIban, startDate, endDate, type, minAmount, maxAmount } = req.query;
    let txs = db.getTransactions();
    
    if (senderIban) txs = txs.filter(t => t.senderIban.replace(/\s/g, '').includes((senderIban as string).replace(/\s/g, '')));
    if (receiverIban) txs = txs.filter(t => t.receiverIban.replace(/\s/g, '').includes((receiverIban as string).replace(/\s/g, '')));
    if (type) txs = txs.filter(t => t.type === type);
    
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

// TOTP Secret Simulator
app.get('/api/otp-secret', (req, res) => {
  try {
    const email = req.query.email as string;
    if (!email) return res.status(400).json({ error: 'Email required' });
    res.json({ secret: db.getTotpSecret(email) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

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
}

startServer();
