import fs from 'fs';
import path from 'path';
import { 
  UserAccount, 
  LedgerTransaction, 
  Agent, 
  CantonmentRecord, 
  BankGuarantee, 
  AuditLog,
  KycLevel,
  KycStatus,
  TransactionType
} from '../types';

const DB_FILE = path.join(process.cwd(), 'data', 'db.json');

// Interface for the DB structure
interface Schema {
  accounts: UserAccount[];
  transactions: LedgerTransaction[];
  agents: Agent[];
  cantonmentRecords: CantonmentRecord[];
  guarantee: BankGuarantee;
  auditLogs: AuditLog[];
  totpSecrets: { [email: string]: string };
}

// Generate an Algerian-like IBAN: DZ54 [BankCode 3-digit] [BranchCode 5-digit] [AccountNum 12-digit] [CheckDigit 2-digit]
export function generateAlgerianIBAN(index: number = 1): string {
  const bankCode = '007'; // Mock DinarFlow Bank Code
  const branchCode = '00123';
  const accountNum = String(100023450000 + index).slice(0, 12);
  const checkDigit = String((97 - (index % 97))).padStart(2, '0');
  return `DZ54 ${bankCode} ${branchCode} ${accountNum} ${checkDigit}`;
}

const DEFAULT_GUARANTEE: BankGuarantee = {
  id: 'g-1',
  amount: 50000000, // 50 Million DA
  issueDate: '2025-06-01',
  expiryDate: '2026-09-15',
  status: 'ACTIVE'
};

const INITIAL_DB: Schema = {
  accounts: [
    {
      id: 'acc-1',
      name: 'Sofiane Brahimi',
      email: 'sofiane.b@gmail.com',
      phoneNumber: '0550123456',
      kycLevel: 1,
      kycStatus: 'ACTIVE',
      balance: 45000,
      iban: generateAlgerianIBAN(1),
      dailyDebitSum: 0,
      dailyDebitLimit: 100000,
      balanceCap: 100000,
      createdAt: '2026-05-10T14:30:00Z'
    },
    {
      id: 'acc-2',
      name: 'Amine Meziane',
      email: 'amine.meziane@outlook.com',
      phoneNumber: '0661987654',
      kycLevel: 2,
      kycStatus: 'ACTIVE',
      balance: 230000,
      iban: generateAlgerianIBAN(2),
      dailyDebitSum: 0,
      dailyDebitLimit: 500000,
      balanceCap: 500000,
      idCardNumber: '109823451',
      documentUrl: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=400&auto=format&fit=crop',
      createdAt: '2026-04-18T10:15:00Z'
    },
    {
      id: 'acc-3',
      name: 'Lydia Ould',
      email: 'lydia.ould@gmail.com',
      phoneNumber: '0770246810',
      kycLevel: 3,
      kycStatus: 'ACTIVE',
      balance: 680000,
      iban: generateAlgerianIBAN(3),
      dailyDebitSum: 0,
      dailyDebitLimit: 1000000,
      balanceCap: 1000000,
      idCardNumber: '201948572',
      documentUrl: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=400&auto=format&fit=crop',
      proofOfAddressUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400&auto=format&fit=crop',
      createdAt: '2026-03-01T09:00:00Z'
    }
  ],
  transactions: [
    {
      id: 'tx-1',
      timestamp: '2026-06-25T11:20:00Z',
      type: 'CASH_IN',
      amount: 45000,
      senderIban: 'EXTERNAL_CASH',
      receiverIban: generateAlgerianIBAN(1),
      reference: 'DEP-SOFIANE-INITIAL',
      ipAddress: '105.103.24.12',
      deviceId: 'iPhone-14-Pro',
      otpVerified: true,
      fee: 0
    },
    {
      id: 'tx-2',
      timestamp: '2026-06-26T15:45:00Z',
      type: 'AGENT_CASH_IN',
      amount: 150000,
      senderIban: 'AGENT_REGISTER',
      receiverIban: generateAlgerianIBAN(2),
      reference: 'AGT-DEP-ALGIERS-01',
      ipAddress: '197.112.5.31',
      deviceId: 'Android-Tablet-Agent',
      otpVerified: true,
      agentId: 'agt-1',
      fee: 150
    },
    {
      id: 'tx-3',
      timestamp: '2026-06-27T09:30:00Z',
      type: 'TRANSFER',
      amount: 20000,
      senderIban: generateAlgerianIBAN(3),
      receiverIban: generateAlgerianIBAN(2),
      reference: 'TX-LYDIA-TO-AMINE',
      ipAddress: '105.96.14.2',
      deviceId: 'MacBook-Pro-16',
      otpVerified: true,
      fee: 50
    }
  ],
  agents: [
    {
      id: 'agt-1',
      name: 'Khelil Mandataire El-Harrach',
      location: '12 Rue Bouamama, El-Harrach, Alger',
      cashRegisters: {
        'df-psp': 400000
      },
      commissionBalance: 1250,
      contractDate: '2026-01-15',
      isActive: true,
      contractFileUrl: '/contracts/agt-1-signed.pdf',
      contractFileName: 'Agent_Contract_Article20_Harrach.pdf',
      contractExpiryDate: '2026-07-14', // Expires in exactly 15 days from 2026-06-29
      contractModificationDate: '2026-01-15'
    },
    {
      id: 'agt-2',
      name: 'Meziane Multi-Services Oran',
      location: 'Avenue de la Soummam, Oran',
      cashRegisters: {
        'df-psp': 250000,
        'other-psp': 150000
      },
      commissionBalance: 820,
      contractDate: '2026-02-10',
      isActive: true,
      contractFileUrl: '/contracts/agt-2-signed.pdf',
      contractFileName: 'Agent_Contract_Article20_Oran.pdf',
      contractExpiryDate: '2026-12-31',
      contractModificationDate: '2026-02-10'
    }
  ],
  cantonmentRecords: [
    {
      id: 'cr-1',
      timestamp: '2026-06-27T23:59:00Z',
      userBalancesSum: 955000, // 45k + 230k + 680k
      externalCantonmentBalance: 955000,
      difference: 0,
      status: 'RECONCILED',
      reconciledBy: 'Reconciliation Cron Engine'
    }
  ],
  guarantee: DEFAULT_GUARANTEE,
  auditLogs: [
    {
      id: 'log-1',
      timestamp: '2026-06-28T01:00:00Z',
      action: 'SYSTEM_START',
      details: 'DinarFlow Core Banking & Compliance Ledger initialized successfully.',
      severity: 'INFO',
      ipAddress: '127.0.0.1'
    }
  ],
  totpSecrets: {
    'sofiane.b@gmail.com': 'JBSWY3DPEHPK3PXP',
    'amine.meziane@outlook.com': 'KVKVE43VNVGHE23M',
    'lydia.ould@gmail.com': 'MZXXE23FNBXGYZJA'
  }
};

class JSONDatabase {
  private data: Schema = INITIAL_DB;

  constructor() {
    this.load();
  }

  private load() {
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        // Sync guarantee status on load
        this.updateGuaranteeStatus();
      } else {
        this.data = INITIAL_DB;
        this.save();
      }
    } catch (e) {
      console.error("Error loading JSON database, using initial in-memory dataset", e);
      this.data = INITIAL_DB;
    }
  }

  public save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error("Failed to persist database file", e);
    }
  }

  private updateGuaranteeStatus() {
    const todayStr = new Date().toISOString().split('T')[0];
    const expiry = new Date(this.data.guarantee.expiryDate);
    const today = new Date(todayStr);

    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      this.data.guarantee.status = 'EXPIRED';
    } else if (diffDays <= 30) {
      this.data.guarantee.status = 'WARNING';
    } else {
      this.data.guarantee.status = 'ACTIVE';
    }
  }

  // --- Audit Logging ---
  public logAudit(action: string, details: string, severity: 'INFO' | 'WARNING' | 'CRITICAL' = 'INFO', ip: string = '127.0.0.1') {
    const log: AuditLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      action,
      details,
      severity,
      ipAddress: ip
    };
    this.data.auditLogs.unshift(log);
    // Keep max 200 logs
    if (this.data.auditLogs.length > 200) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 200);
    }
    this.save();
  }

  // --- Accounts Queries ---
  public getAccounts() {
    return this.data.accounts;
  }

  public getAccountByIban(iban: string) {
    return this.data.accounts.find(a => a.iban.replace(/\s/g, '') === iban.replace(/\s/g, ''));
  }

  public getAccountById(id: string) {
    return this.data.accounts.find(a => a.id === id);
  }

  public getAccountByEmail(email: string) {
    return this.data.accounts.find(a => a.email.toLowerCase() === email.toLowerCase());
  }

  public getAccountByPhone(phone: string) {
    return this.data.accounts.find(a => a.phoneNumber === phone);
  }

  // --- KYC Workflow ---
  public openAccount(params: {
    name: string;
    email: string;
    phoneNumber: string;
    kycLevel: KycLevel;
    idCardNumber?: string;
    documentUrl?: string;
    idCardBackUrl?: string;
    proofOfAddressUrl?: string;
  }): UserAccount {
    // Check if account already exists (strict single account constraint per user email/phone as per Algerian rules)
    const existingEmail = this.getAccountByEmail(params.email);
    const existingPhone = this.getAccountByPhone(params.phoneNumber);

    if (existingEmail || existingPhone) {
      throw new Error("PROHIBITED_DUPLICATE_ACCOUNT: A user is strictly limited to ONE Payment Account under Bank of Algeria regulations.");
    }

    const index = this.data.accounts.length + 1;
    const iban = generateAlgerianIBAN(index);

    // Limit rules: Level 1 (100k DA), Level 2 (500k DA), Level 3 (1M DA)
    let limit = 100000;
    let status: KycStatus = 'ACTIVE';

    if (params.kycLevel === 2) {
      limit = 500000;
      status = 'PENDING'; // Needs operator manual approval
    } else if (params.kycLevel === 3) {
      limit = 1000000;
      status = 'VISIO_PENDING'; // Needs video interview
    }

    const newAccount: UserAccount = {
      id: `acc-${Date.now()}`,
      name: params.name,
      email: params.email,
      phoneNumber: params.phoneNumber,
      kycLevel: params.kycLevel,
      kycStatus: status,
      balance: 0,
      iban,
      dailyDebitSum: 0,
      dailyDebitLimit: limit,
      balanceCap: limit,
      idCardNumber: params.idCardNumber,
      documentUrl: params.documentUrl,
      idCardBackUrl: params.idCardBackUrl,
      proofOfAddressUrl: params.proofOfAddressUrl,
      createdAt: new Date().toISOString()
    };

    this.data.accounts.push(newAccount);
    
    // Auto-generate TOTP Secret
    const secrets = ['JBSWY3DPEHPK3PXP', 'KVKVE43VNVGHE23M', 'MZXXE23FNBXGYZJA', 'NB2W443FNDXGYZJO', 'OBQXE23FNBXGYZJO'];
    this.data.totpSecrets[params.email.toLowerCase()] = secrets[Math.floor(Math.random() * secrets.length)];

    this.logAudit(
      'ACCOUNT_OPENED', 
      `Opened Level ${params.kycLevel} account for ${params.name}. IBAN: ${iban}. Status: ${status}`,
      params.kycLevel > 1 ? 'WARNING' : 'INFO'
    );
    this.save();
    return newAccount;
  }

  public updateKycStatus(id: string, status: KycStatus, notes?: string) {
    const account = this.getAccountById(id);
    if (!account) throw new Error("Account not found");

    // Adjust caps based on level if approved
    if (status === 'ACTIVE') {
      account.kycStatus = 'ACTIVE';
      account.kycUpgradeRejected = false;
      account.balanceCap = account.kycLevel === 1 ? 100000 : account.kycLevel === 2 ? 500000 : 1000000;
      account.dailyDebitLimit = account.balanceCap;
    } else if (status === 'REJECTED') {
      // Revert KYC level if rejected but keep user active at lower tier
      if (account.kycLevel === 3) {
        account.kycLevel = 2;
        account.kycStatus = 'ACTIVE';
        account.kycUpgradeRejected = true;
      } else if (account.kycLevel === 2) {
        account.kycLevel = 1;
        account.kycStatus = 'ACTIVE';
        account.kycUpgradeRejected = true;
      } else {
        account.kycStatus = 'REJECTED';
      }
      account.kycRejectedAt = new Date().toISOString();
      account.balanceCap = account.kycLevel === 1 ? 100000 : account.kycLevel === 2 ? 500000 : 1000000;
      account.dailyDebitLimit = account.balanceCap;
    } else {
      account.kycStatus = status;
    }

    this.logAudit(
      'KYC_STATUS_UPDATED',
      `KYC status for ${account.name} updated. Level: ${account.kycLevel}, Status: ${account.kycStatus}. Notes: ${notes || 'None'}`,
      status === 'REJECTED' ? 'WARNING' : 'INFO'
    );
    this.save();
    return account;
  }

  public submitKycUpgrade(id: string, level: KycLevel, files: { idCardNumber?: string, idCardUrl?: string, idCardBackUrl?: string, addressUrl?: string }) {
    const account = this.getAccountById(id);
    if (!account) throw new Error("Account not found");

    // Enforce 1-month waiting time for rejected upgrades
    if (account.kycUpgradeRejected && account.kycRejectedAt) {
      const rejectedTime = new Date(account.kycRejectedAt).getTime();
      const oneMonthMs = 30 * 24 * 60 * 60 * 1000;
      const cooldownRemaining = (rejectedTime + oneMonthMs) - Date.now();
      if (cooldownRemaining > 0) {
        const remainingDays = Math.ceil(cooldownRemaining / (24 * 60 * 60 * 1000));
        throw new Error(`COOLDOWN_ACTIVE: Your previous upgrade request was rejected. You must wait 1 month after your rejection before re-applying. Remaining: ${remainingDays} days.`);
      }
    }

    account.kycLevel = level;
    if (files.idCardNumber) account.idCardNumber = files.idCardNumber;
    if (files.idCardUrl) account.documentUrl = files.idCardUrl;
    if (files.idCardBackUrl) account.idCardBackUrl = files.idCardBackUrl;
    if (files.addressUrl) account.proofOfAddressUrl = files.addressUrl;

    account.kycStatus = level === 2 ? 'PENDING' : 'VISIO_PENDING';

    this.logAudit(
      'KYC_UPGRADE_REQUEST',
      `User ${account.name} requested upgrade to Level ${level}. Documents pending review.`,
      'INFO'
    );
    this.save();
    return account;
  }

  public simulateKycCooldownBypass(id: string) {
    const account = this.getAccountById(id);
    if (!account) throw new Error("Account not found");
    
    if (account.kycRejectedAt) {
      // Set the rejection time to 31 days ago to end the cooldown
      account.kycRejectedAt = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();
      this.logAudit(
        'KYC_COOLDOWN_BYPASSED',
        `Simulated 1 month passing for ${account.name}'s KYC rejection cooldown.`,
        'INFO'
      );
      this.save();
    }
    return account;
  }

  public simulateKycRejection(id: string) {
    const account = this.getAccountById(id);
    if (!account) throw new Error("Account not found");
    
    account.kycUpgradeRejected = true;
    account.kycRejectedAt = new Date().toISOString();
    account.kycStatus = 'ACTIVE';
    this.logAudit(
      'KYC_REJECTION_SIMULATED',
      `Simulated a fresh KYC rejection for ${account.name} to test cooldown.`,
      'WARNING'
    );
    this.save();
    return account;
  }

  // --- Transactions / Double-Entry Ledger Engine ---
  public executeTransaction(params: {
    type: TransactionType;
    amount: number;
    senderIban: string;
    receiverIban: string;
    reference: string;
    ipAddress: string;
    deviceId: string;
    otpCode?: string;
    agentId?: string;
  }): LedgerTransaction {
    // 1. Check Compliance: Guarantee renewal check
    this.updateGuaranteeStatus();
    if (this.data.guarantee.status === 'EXPIRED') {
      throw new Error("SYSTEM_SUSPENDED: The mandatory Bank of Algeria Guarantee (Article 34) has expired. Outgoing transactions are suspended until renewal.");
    }

    // 2. Validate inputs
    if (params.amount <= 0) {
      throw new Error("INVALID_AMOUNT: Transaction amount must be positive.");
    }

    const timestamp = new Date().toISOString();
    const isCashIn = params.type === 'CASH_IN' || params.type === 'AGENT_CASH_IN';
    const isCashOut = params.type === 'CASH_OUT' || params.type === 'AGENT_CASH_OUT';
    const isTransfer = params.type === 'TRANSFER';

    let senderAcc = isTransfer || isCashOut ? this.getAccountByIban(params.senderIban) : null;
    let receiverAcc = isTransfer || isCashIn ? this.getAccountByIban(params.receiverIban) : null;

    // Verify Sender Account Active
    if ((isTransfer || isCashOut) && senderAcc && senderAcc.kycStatus !== 'ACTIVE') {
      throw new Error(`ACCOUNT_INACTIVE: Sender account is currently ${senderAcc.kycStatus}. KYC validation is required to debit funds.`);
    }

    // Verify Receiver Account Active
    if ((isTransfer || isCashIn) && receiverAcc && receiverAcc.kycStatus !== 'ACTIVE') {
      throw new Error(`ACCOUNT_INACTIVE: Receiver account is currently ${receiverAcc.kycStatus}. KYC validation is required to credit funds.`);
    }

    // Calculated Fee: 0.5% for transfers, capped at 1000 DA. Agent cash actions have dynamic commission.
    const fee = isTransfer ? Math.min(Math.floor(params.amount * 0.005), 1000) : 0;

    // 3. SECURE LEDGER CHECKS (Debit Limit, Balance Caps, Cantonnement Check)

    // A. DEBIT SUM CHECK & OVERDRAFT SHIELD
    if (senderAcc) {
      // Overdraft shield (Strictly balance >= 0, Article 18)
      const totalDebitRequired = params.amount + fee;
      if (senderAcc.balance < totalDebitRequired) {
        throw new Error(`INSUFFICIENT_FUNDS: Insufficient balance. Available: ${senderAcc.balance} DA. Required: ${totalDebitRequired} DA (Amount + Fee).`);
      }

      // Check daily debit limits (Level limits: 100k for L1, 500k for L2, 1M for L3)
      // Reset dailyDebitSum if it's a new day
      const todayStr = timestamp.split('T')[0];
      const todayDebits = this.data.transactions
        .filter(t => t.timestamp.startsWith(todayStr) && t.senderIban === senderAcc!.iban)
        .reduce((sum, t) => sum + t.amount + t.fee, 0);

      senderAcc.dailyDebitSum = todayDebits;

      if (senderAcc.dailyDebitSum + params.amount + fee > senderAcc.dailyDebitLimit) {
        throw new Error(`DAILY_LIMIT_EXCEEDED: This transaction of ${params.amount} DA exceeds your Level ${senderAcc.kycLevel} daily limit of ${senderAcc.dailyDebitLimit} DA. Today's debit sum so far: ${senderAcc.dailyDebitSum} DA.`);
      }
    }

    // B. RECEIVER BALANCE CAP CHECK (Article 12)
    if (receiverAcc) {
      if (receiverAcc.balance + params.amount > receiverAcc.balanceCap) {
        throw new Error(`BALANCE_CAP_EXCEEDED: Crediting ${params.amount} DA would exceed the beneficiary's Level ${receiverAcc.kycLevel} maximum balance limit of ${receiverAcc.balanceCap} DA. Current Balance: ${receiverAcc.balance} DA.`);
      }
    }

    // C. AGENT CASH VAULT CHECK (For Agent transactions)
    let agent: Agent | null = null;
    if (params.agentId) {
      agent = this.data.agents.find(a => a.id === params.agentId) || null;
      if (!agent) throw new Error("Agent not found.");
      if (!agent.isActive) throw new Error("Agent is suspended or inactive.");

      const pspRegister = agent.cashRegisters['df-psp'] || 0;

      if (params.type === 'AGENT_CASH_OUT') {
        // Agent is GIVING cash to user, user is debited, Agent's PSP register is credited
        // Check if agent register + amount exceeds any local limit, usually registers just hold cash
      } else if (params.type === 'AGENT_CASH_IN') {
        // User is GIVING cash to agent, user is credited, Agent's PSP register is debited (Agent must have register cash)
        if (pspRegister < params.amount) {
          throw new Error(`AGENT_INSUFFICIENT_LIQUIDITY: Agent register has insufficient cash balance (${pspRegister} DA) to accept this cash deposit of ${params.amount} DA.`);
        }
      }
    }

    // 4. TRANSACTION MUTATION (Double-Entry Balance Updates)
    if (senderAcc) {
      senderAcc.balance -= (params.amount + fee);
      senderAcc.dailyDebitSum += (params.amount + fee);
    }

    if (receiverAcc) {
      receiverAcc.balance += params.amount;
    }

    // Process Agent commission and balance
    if (agent && params.agentId) {
      const commRate = agent.commissionRate || 0.002; // 0.2% commission
      const commission = Math.floor(params.amount * commRate);
      
      agent.commissionBalance += commission;

      if (params.type === 'AGENT_CASH_IN') {
        // Agent takes physical cash, register balance decreases (must be remitted back to PSP)
        agent.cashRegisters['df-psp'] = (agent.cashRegisters['df-psp'] || 0) - params.amount;
      } else if (params.type === 'AGENT_CASH_OUT') {
        // Agent gives cash to user, register balance increases
        agent.cashRegisters['df-psp'] = (agent.cashRegisters['df-psp'] || 0) + params.amount;
      }
    }

    // Write Ledger Entry
    const tx: LedgerTransaction = {
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      timestamp,
      type: params.type,
      amount: params.amount,
      senderIban: params.senderIban,
      receiverIban: params.receiverIban,
      reference: params.reference,
      ipAddress: params.ipAddress,
      deviceId: params.deviceId,
      otpVerified: !!params.otpCode,
      agentId: params.agentId,
      fee
    };

    this.data.transactions.unshift(tx);

    // Dynamic audit log
    this.logAudit(
      'TRANSACTION_EXECUTED',
      `Ledger execution [${tx.id}]: ${params.type} of ${params.amount} DA. Sender: ${params.senderIban}, Beneficiary: ${params.receiverIban}. Fee: ${fee} DA.`,
      params.amount >= 500000 ? 'WARNING' : 'INFO',
      params.ipAddress
    );

    // Auto-update safeguarding cantonment reconciliation data (simulated auto-track)
    this.reconcileCantonment("System Autocron Reconciliation");

    this.save();
    return tx;
  }

  // --- Cantonnement Reconciliation ---
  public getCantonmentRecords() {
    return this.data.cantonmentRecords;
  }

  public reconcileCantonment(reconciledBy: string, externalBalanceOverride?: number): CantonmentRecord {
    const userSum = this.data.accounts.reduce((sum, a) => sum + a.balance, 0);
    const agentRegisterSum = this.data.agents.reduce((sum, a) => sum + (a.cashRegisters['df-psp'] || 0), 0);
    const totalInternalLiabilities = userSum + agentRegisterSum;

    // Use current stored balance or override with custom value entered by compliance/finance team
    let extBalance = totalInternalLiabilities;
    if (externalBalanceOverride !== undefined) {
      extBalance = externalBalanceOverride;
    } else {
      // default matching previous external record
      const lastRec = this.data.cantonmentRecords[0];
      extBalance = lastRec ? lastRec.externalCantonmentBalance : totalInternalLiabilities;
    }

    const difference = totalInternalLiabilities - extBalance;
    const status = difference === 0 ? 'RECONCILED' : 'MISMATCH';

    const record: CantonmentRecord = {
      id: `cr-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userBalancesSum: totalInternalLiabilities,
      externalCantonmentBalance: extBalance,
      difference,
      status,
      reconciledBy
    };

    this.data.cantonmentRecords.unshift(record);

    if (status === 'MISMATCH') {
      this.logAudit(
        'CANTONMENT_MISMATCH_ALERT',
        `RECONCILIATION FAULT: Internal liabilities (${totalInternalLiabilities} DA) do not match external bank safeguarding account (${extBalance} DA). Diff: ${difference} DA!`,
        'CRITICAL'
      );
    } else {
      this.logAudit(
        'CANTONMENT_RECONCILED',
        `Reconciliation success: Total safeguarding ledger balanced perfectly at ${extBalance} DA.`,
        'INFO'
      );
    }

    this.save();
    return record;
  }

  // --- Agents Manager ---
  public getAgents() {
    return this.data.agents;
  }

  public registerAgent(name: string, location: string, initialCashRegister: number, contractData?: {
    contractFileUrl?: string;
    contractFileName?: string;
    contractExpiryDate?: string;
    contractModificationDate?: string;
    contractResiliationDate?: string;
  }): Agent {
    const newAgent: Agent = {
      id: `agt-${Date.now()}`,
      name,
      location,
      cashRegisters: {
        'df-psp': initialCashRegister
      },
      commissionBalance: 0,
      contractDate: new Date().toISOString().split('T')[0],
      isActive: true,
      ...contractData
    };
    this.data.agents.push(newAgent);
    this.logAudit(
      'AGENT_REGISTERED',
      `Onboarded agent mandataire ${name} in ${location}. Base register initialized with ${initialCashRegister} DA.`,
      'INFO'
    );
    this.save();
    return newAgent;
  }

  public updateAgentContract(id: string, contractDetails: {
    contractFileUrl?: string;
    contractFileName?: string;
    contractExpiryDate?: string;
    contractModificationDate?: string;
    contractResiliationDate?: string;
  }) {
    const agent = this.data.agents.find(a => a.id === id);
    if (!agent) throw new Error("Agent not found");
    
    if (contractDetails.contractFileUrl !== undefined) {
      agent.contractFileUrl = contractDetails.contractFileUrl;
      agent.contractFileName = contractDetails.contractFileName;
    }
    if (contractDetails.contractExpiryDate !== undefined) {
      agent.contractExpiryDate = contractDetails.contractExpiryDate;
    }
    if (contractDetails.contractModificationDate !== undefined) {
      agent.contractModificationDate = contractDetails.contractModificationDate;
    }
    if (contractDetails.contractResiliationDate !== undefined) {
      agent.contractResiliationDate = contractDetails.contractResiliationDate;
      if (contractDetails.contractResiliationDate) {
        // If contract is resiliated, mark agent as inactive
        agent.isActive = false;
      }
    }
    
    this.logAudit(
      'AGENT_CONTRACT_UPDATED',
      `Updated contract details for Agent ${agent.name} (Article 20 Compliance).`,
      'INFO'
    );
    this.save();
    return agent;
  }

  public updateAgentStatus(id: string, isActive: boolean) {
    const agent = this.data.agents.find(a => a.id === id);
    if (!agent) throw new Error("Agent not found");
    agent.isActive = isActive;
    
    // Clear resiliation date if reactivating
    if (isActive && agent.contractResiliationDate) {
      agent.contractResiliationDate = undefined;
    }
    
    this.logAudit(
      'AGENT_STATUS_CHANGED',
      `Agent ${agent.name} is now ${isActive ? 'ACTIVE' : 'SUSPENDED'}.`,
      isActive ? 'INFO' : 'WARNING'
    );
    this.save();
    return agent;
  }

  // --- Bank Guarantee Manager ---
  public getGuarantee() {
    this.updateGuaranteeStatus();
    return this.data.guarantee;
  }

  public updateGuarantee(amount: number, expiryDate: string) {
    this.data.guarantee.amount = amount;
    this.data.guarantee.expiryDate = expiryDate;
    this.updateGuaranteeStatus();
    this.logAudit(
      'GUARANTEE_UPDATED',
      `Bank Guarantee updated to ${amount} DA. Expiry set to ${expiryDate}. Current status: ${this.data.guarantee.status}`,
      'WARNING'
    );
    this.save();
    return this.data.guarantee;
  }

  // --- Global Stats ---
  public getGlobalStats() {
    const accounts = this.data.accounts;
    const txs = this.data.transactions;
    const agents = this.data.agents;

    const userSum = accounts.reduce((sum, a) => sum + a.balance, 0);
    const agentRegisterSum = agents.reduce((sum, a) => sum + (a.cashRegisters['df-psp'] || 0), 0);

    const totalVolume = txs.reduce((sum, t) => sum + t.amount, 0);
    const totalFees = txs.reduce((sum, t) => sum + t.fee, 0);

    return {
      totalUsers: accounts.length,
      activeUsers: accounts.filter(a => a.kycStatus === 'ACTIVE').length,
      pendingKYC: accounts.filter(a => a.kycStatus === 'PENDING' || a.kycStatus === 'VISIO_PENDING').length,
      totalLiabilities: userSum + agentRegisterSum,
      totalUserBalances: userSum,
      totalAgentLiquidity: agentRegisterSum,
      transactionVolume: totalVolume,
      feesCollected: totalFees,
      guarantee: this.getGuarantee()
    };
  }

  // --- Export Logs / Transactions ---
  public getTransactions() {
    return this.data.transactions;
  }

  public getAuditLogs() {
    return this.data.auditLogs;
  }

  public getTotpSecret(email: string) {
    return this.data.totpSecrets[email.toLowerCase()] || 'JBSWY3DPEHPK3PXP';
  }
}

export const db = new JSONDatabase();
