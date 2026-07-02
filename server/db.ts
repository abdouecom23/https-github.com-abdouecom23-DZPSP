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
  TransactionType,
  KycEscalationStatus,
  CommissionSettlement,
  GuaranteeRenewalRequest,
  DeviceFingerprint,
  RiskScore,
  BlockedEntity,
  TrustedBeneficiary,
  HeldTransaction,
  SanctionsCheckResult,
  SWIFTMessage,
  ApprovalSignature,
  MultiSigTransaction,
  FailedTransactionRetry,
  ComplianceReport,
  FeeBreakdown,
  ComplianceDecision,
  DinarBridgeWallet,
  CIBDepositRecord,
  ServiceRecharge
} from '../src/types';

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
  commissionSettlements: CommissionSettlement[];
  guaranteeRenewals: GuaranteeRenewalRequest[];
  deviceFingerprints: DeviceFingerprint[];
  blockedEntities: BlockedEntity[];
  trustedBeneficiaries: TrustedBeneficiary[];
  heldTransactions: HeldTransaction[];
  swiftMessages: SWIFTMessage[];
  multiSigTransactions: MultiSigTransaction[];
  failedTransactionRetries: FailedTransactionRetry[];
  complianceReports: ComplianceReport[];
  complianceDecisions: ComplianceDecision[];
  dinarBridgeWallets: { [accountId: string]: DinarBridgeWallet };
  cibDeposits: CIBDepositRecord[];
  serviceRecharges: ServiceRecharge[];
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
  },
  commissionSettlements: [],
  guaranteeRenewals: [],
  deviceFingerprints: [],
  blockedEntities: [],
  trustedBeneficiaries: [],
  heldTransactions: [],
  swiftMessages: [],
  multiSigTransactions: [],
  failedTransactionRetries: [],
  complianceReports: [],
  complianceDecisions: [],
  dinarBridgeWallets: {},
  cibDeposits: [],
  serviceRecharges: []
};

import { EventEmitter } from 'events';

class JSONDatabase {
  private data: Schema = INITIAL_DB;
  private auditListeners: ((log: AuditLog) => void)[] = [];
  public events = new EventEmitter();

  constructor() {
    this.load();
  }

  public registerAuditListener(listener: (log: AuditLog) => void) {
    this.auditListeners.push(listener);
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
        // Ensure new fields are initialized
        if (!this.data.commissionSettlements) this.data.commissionSettlements = [];
        if (!this.data.guaranteeRenewals) this.data.guaranteeRenewals = [];
        if (!this.data.deviceFingerprints) this.data.deviceFingerprints = [];
        if (!this.data.blockedEntities) this.data.blockedEntities = [];
        if (!this.data.trustedBeneficiaries) this.data.trustedBeneficiaries = [];
        if (!this.data.heldTransactions) this.data.heldTransactions = [];
        if (!this.data.swiftMessages) this.data.swiftMessages = [];
        if (!this.data.multiSigTransactions) this.data.multiSigTransactions = [];
        if (!this.data.failedTransactionRetries) this.data.failedTransactionRetries = [];
        if (!this.data.complianceReports) this.data.complianceReports = [];
        if (!this.data.complianceDecisions) this.data.complianceDecisions = [];
        if (!this.data.dinarBridgeWallets) this.data.dinarBridgeWallets = {};
        if (!this.data.cibDeposits) this.data.cibDeposits = [];
        if (!this.data.serviceRecharges) this.data.serviceRecharges = [];
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
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const tempFile = DB_FILE + '.tmp';
      fs.writeFileSync(tempFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE); // atomic rename on POSIX
      this.events.emit('data_changed');
    } catch (e) {
      console.error("Failed to persist database file atomically", e);
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

    // Trigger SSE audit listeners
    this.auditListeners.forEach(listener => {
      try {
        listener(log);
      } catch (err) {
        console.error("Failed to notify SSE listener:", err);
      }
    });
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
    idCardExpiryDate?: string;
    proofOfAddressExpiryDate?: string;
  }): UserAccount {
    // Check if account already exists (strict single account constraint per user email/phone as per Algerian rules)
    const existingEmail = this.getAccountByEmail(params.email);
    const existingPhone = this.getAccountByPhone(params.phoneNumber);

    if (existingEmail || existingPhone) {
      throw new Error("PROHIBITED_DUPLICATE_ACCOUNT: A user is strictly limited to ONE Payment Account under Bank of Algeria regulations.");
    }

    // Validate Expiry dates if provided (Issue #2)
    const now = new Date();
    if (params.idCardExpiryDate) {
      const expiry = new Date(params.idCardExpiryDate);
      if (expiry < now) {
        throw new Error("KYC_DOCUMENT_EXPIRED: ID Card must be valid (not expired) to open account.");
      }
    }
    if (params.proofOfAddressExpiryDate) {
      const expiry = new Date(params.proofOfAddressExpiryDate);
      if (expiry < now) {
        throw new Error("KYC_DOCUMENT_EXPIRED: Proof of address document must be valid (not expired) to open account.");
      }
    }

    let index = this.data.accounts.length + 1;
    let iban = generateAlgerianIBAN(index);
    while (this.getAccountByIban(iban)) {
      index++;
      iban = generateAlgerianIBAN(index);
    }

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
      idCardExpiryDate: params.idCardExpiryDate,
      proofOfAddressExpiryDate: params.proofOfAddressExpiryDate,
      documentStatusAlert: 'ACTIVE',
      createdAt: new Date().toISOString()
    };

    this.data.accounts.push(newAccount);
    
    // Auto-generate TOTP Secret securely
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let base32Secret = '';
    for (let i = 0; i < 16; i++) {
      base32Secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.data.totpSecrets[params.email.toLowerCase()] = base32Secret;

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

  // --- KYC Escalation & Supervisor Exception Appeals ---
  public requestKycExceptionBypass(id: string, reason: string) {
    const account = this.getAccountById(id);
    if (!account) throw new Error("Account not found");
    
    if (!account.kycUpgradeRejected) {
      throw new Error("Account has no rejection to appeal.");
    }
    
    account.kycEscalationStatus = KycEscalationStatus.ESCALATED_TO_SUPERVISOR;
    account.kycEscalationNotes = reason;
    
    this.logAudit(
      'KYC_EXCEPTION_REQUEST',
      `${account.name} requested supervisor review for KYC rejection bypass. Reason: ${reason}`,
      'WARNING'
    );
    this.save();
    return account;
  }

  public approveKycExceptionBypass(id: string, supervisorName: string) {
    const account = this.getAccountById(id);
    if (!account) throw new Error("Account not found");
    
    account.kycUpgradeRejected = false;
    account.kycRejectedAt = undefined;
    account.kycEscalationStatus = KycEscalationStatus.NONE;
    
    this.logAudit(
      'KYC_EXCEPTION_APPROVED',
      `Supervisor ${supervisorName} approved KYC rejection bypass for ${account.name}.`,
      'WARNING'
    );
    this.save();
    return account;
  }

  // --- Compliance checking helpers ---
  private checkAgentComplianceGate(agent: Agent) {
    if (!agent.contractExpiryDate) return true;
    const today = new Date().toISOString().split('T')[0];
    const expiryDate = new Date(agent.contractExpiryDate);
    const todayDate = new Date(today);
    
    const daysUntilExpiry = Math.ceil(
      (expiryDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysUntilExpiry <= 0) {
      throw new Error(
        `AGENT_CONTRACT_EXPIRED: Agent "${agent.name}" contract expired on ${agent.contractExpiryDate}. ` +
        `No transactions allowed until contract renewal.`
      );
    }
    
    if (daysUntilExpiry <= 15) {
      this.logAudit(
        'AGENT_CONTRACT_EXPIRING_SOON',
        `Agent "${agent.name}" contract expires in ${daysUntilExpiry} days (${agent.contractExpiryDate}). ` +
        `Recommend renewal action.`,
        'WARNING'
      );
    }
    
    return true;
  }

  public computeTransactionRiskScore(params: {
    type: TransactionType;
    amount: number;
    sender?: UserAccount;
    receiver?: UserAccount;
    hourlyVolumeOfSender?: number;
  }): RiskScore {
    let score = 0;
    const factors: string[] = [];
    
    // Factor 1: High single transaction (> 200K DA)
    if (params.amount > 200000) {
      score += 25;
      factors.push("HIGH_SINGLE_AMOUNT");
    }
    
    // Factor 2: Rapid-fire transactions (> 500K in 1 hour)
    if (params.hourlyVolumeOfSender && params.hourlyVolumeOfSender > 500000) {
      score += 30;
      factors.push("RAPID_VOLUME_SPIKE");
    }
    
    // Factor 3: Transfer to new/unverified receiver
    if (params.receiver && params.receiver.kycLevel === 1) {
      score += 15;
      factors.push("LOW_KYC_RECEIVER");
    }
    
    // Factor 4: CASH_OUT (higher risk than transfer)
    if (params.type === 'CASH_OUT' || params.type === 'AGENT_CASH_OUT') {
      score += 20;
      factors.push("CASH_OUT_TRANSACTION");
    }
    
    // Factor 5: Sender is new account (< 7 days)
    if (params.sender && params.sender.createdAt) {
      const ageMs = Date.now() - new Date(params.sender.createdAt).getTime();
      const ageDays = ageMs / (1000 * 60 * 60 * 24);
      if (ageDays < 7) {
        score += 20;
        factors.push("NEW_ACCOUNT_SENDER");
      }
    }
    
    return {
      transactionId: `risk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      score: Math.min(score, 100),
      factors,
      flaggedAt: new Date().toISOString(),
      reviewed: false
    };
  }

  private checkGeoAnomalies(
    accountId: string,
    currentIp: string,
    currentLocation: string,
    deviceId: string
  ) {
    const fingerprints = this.data.deviceFingerprints.filter(d => d.accountId === accountId);
    
    // Log current device fingerprint
    const newFingerprint: DeviceFingerprint = {
      deviceId,
      lastSeenAt: new Date().toISOString(),
      lastSeenIp: currentIp,
      lastSeenLocation: currentLocation,
      accountId
    };
    this.data.deviceFingerprints.push(newFingerprint);
    
    if (fingerprints.length === 0) return null; // First transaction, no baseline
    
    const lastFingerprint = fingerprints[fingerprints.length - 1];
    
    // Simple mock travel anomaly: if location changes and time is very short
    const timeSinceLastMs = Date.now() - new Date(lastFingerprint.lastSeenAt).getTime();
    const timeSinceLastSec = timeSinceLastMs / 1000;
    
    if (lastFingerprint.lastSeenLocation !== currentLocation && timeSinceLastSec < 3600) {
      // Different cities/regions within 1 hour is highly suspicious (Impossible travel)
      return {
        anomaly: "IMPOSSIBLE_TRAVEL",
        details: `Impossible travel: Geo-location jump from ${lastFingerprint.lastSeenLocation} to ${currentLocation} in ${Math.round(timeSinceLastSec / 60)} minutes.`,
        severity: "HIGH" as const
      };
    }
    
    if (lastFingerprint.lastSeenIp !== currentIp || lastFingerprint.deviceId !== deviceId) {
      return {
        anomaly: "NEW_DEVICE_OR_IP",
        details: `IP/Device changed. Prev: ${lastFingerprint.lastSeenIp} (${lastFingerprint.deviceId}), Curr: ${currentIp} (${deviceId})`,
        severity: "LOW" as const
      };
    }
    
    return null;
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

    // Enforce operational suspension if present
    if (senderAcc && senderAcc.isSuspended) {
      const errorMsg = `ACCOUNT_SUSPENDED: Sender account ${senderAcc.id} is suspended/blocked by compliance.`;
      this.trackFailedTransaction(params, errorMsg);
      throw new Error(errorMsg);
    }
    if (receiverAcc && receiverAcc.isSuspended) {
      const errorMsg = `ACCOUNT_SUSPENDED: Receiver account ${receiverAcc.id} is suspended/blocked by compliance.`;
      this.trackFailedTransaction(params, errorMsg);
      throw new Error(errorMsg);
    }

    // A. CENTRALIZED RISK BLACKLIST CHECK
    if (this.isEntityBlocked(params.senderIban, 'IBAN') || 
        this.isEntityBlocked(params.receiverIban, 'IBAN') ||
        (senderAcc && this.isEntityBlocked(senderAcc.id, 'ACCOUNT')) ||
        (receiverAcc && this.isEntityBlocked(receiverAcc.id, 'ACCOUNT')) ||
        this.isEntityBlocked(params.ipAddress, 'IP') ||
        this.isEntityBlocked(params.deviceId, 'DEVICE_ID')) {
      const errorMsg = "BLOCKED_ENTITY: Access denied. This account/IBAN/device/IP is blacklisted due to fraud detection compliance.";
      this.trackFailedTransaction(params, errorMsg);
      throw new Error(errorMsg);
    }

    // B. KYC DOCUMENT EXPIRY CHECK
    if (senderAcc && senderAcc.idCardExpiryDate) {
      const expiry = new Date(senderAcc.idCardExpiryDate);
      if (expiry < new Date()) {
        const errorMsg = `KYC_DOCUMENT_EXPIRED: Your ID Card expired on ${senderAcc.idCardExpiryDate}. Transactions are blocked under Bank of Algeria rules until valid ID is re-uploaded.`;
        this.trackFailedTransaction(params, errorMsg);
        throw new Error(errorMsg);
      }
    }

    // Verify Sender Account Active
    if (isTransfer || isCashOut) {
      if (senderAcc && senderAcc.kycStatus !== 'ACTIVE') {
        throw new Error(`ACCOUNT_INACTIVE: Sender account is currently ${senderAcc.kycStatus || 'PENDING'}. KYC validation is required to debit funds.`);
      }
      if (senderAcc && (senderAcc.status === 'SUSPENDED' || senderAcc.status === 'RELATED_SUSPEND_RISK')) {
        const errorMsg = `ACCOUNT_SUSPENDED: Sender account is currently suspended (${senderAcc.status}). Transactions are blocked.`;
        this.trackFailedTransaction(params, errorMsg);
        throw new Error(errorMsg);
      }
    }

    // Verify Receiver Account Active
    if ((isTransfer || isCashIn) && receiverAcc && receiverAcc.kycStatus !== 'ACTIVE') {
      throw new Error(`ACCOUNT_INACTIVE: Receiver account is currently ${receiverAcc.kycStatus || 'PENDING'}. KYC validation is required to credit funds.`);
    }

    // C. TRUSTED PAYEE WHITELIST LIMIT
    if (isTransfer && senderAcc) {
      const cleanReceiverIban = params.receiverIban.trim().replace(/\s/g, '');
      const isTrusted = this.data.trustedBeneficiaries.some(
        b => b.accountId === senderAcc!.id && b.beneficiaryIban.trim().replace(/\s/g, '') === cleanReceiverIban
      );
      
      if (!isTrusted) {
        // Check sum of transfers to non-trusted/new payees by this sender in the last 24 hours
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 3600000).toISOString();
        const unverifiedTransfersSum = this.data.transactions
          .filter(t => t.type === 'TRANSFER' && 
                       t.senderIban === senderAcc!.iban && 
                       t.timestamp >= twentyFourHoursAgo &&
                       !this.data.trustedBeneficiaries.some(b => b.accountId === senderAcc!.id && b.beneficiaryIban.trim().replace(/\s/g, '') === t.receiverIban.trim().replace(/\s/g, '')))
          .reduce((sum, t) => sum + t.amount, 0);

        if (unverifiedTransfersSum + params.amount > 50000) {
          const errorMsg = `HIGH_RISK_NEW_PAYEE: Daily volume limit to unverified payees is capped at 50,000 DA. Please add "${params.receiverIban}" to your Trusted Payee Directory first.`;
          this.trackFailedTransaction(params, errorMsg);
          throw new Error(errorMsg);
        }
      }
    }

    // Calculated Fee: 0.5% for transfers, capped at 1000 DA. Agent cash actions have dynamic commission.
    const fee = isTransfer ? Math.min(Math.floor(params.amount * 0.005), 1000) : 0;

    // Detailed Fee Breakdown
    const feeBreakdown: FeeBreakdown = {
      regulatoryFee: isTransfer ? Math.min(Math.floor(params.amount * 0.001), 200) : 0, // 0.1% for regulatory compliance
      operationalFee: isTransfer ? Math.min(Math.floor(params.amount * 0.002), 400) : 0, // 0.2% for core routing/network
      profitMargin: isTransfer ? Math.min(Math.floor(params.amount * 0.002), 400) : 0, // 0.2% for PSP profit margin
      total: fee
    };

    // 3. SECURE LEDGER CHECKS (Debit Limit, Balance Caps, Cantonnement Check)

    // A. DEBIT SUM CHECK & OVERDRAFT SHIELD
    let hourlyVolume = 0;
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

      // Calculate hourly volume for risk scoring
      const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
      hourlyVolume = this.data.transactions
        .filter(t => t.timestamp >= oneHourAgo && t.senderIban === senderAcc!.iban)
        .reduce((sum, t) => sum + t.amount, 0);
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

      // Check agent compliance contract gate
      this.checkAgentComplianceGate(agent);

      const pspRegister = agent.cashRegisters['df-psp'] || 0;

      if (params.type === 'AGENT_CASH_OUT') {
        // Agent is GIVING cash to user, user is debited, Agent's PSP register is credited
      } else if (params.type === 'AGENT_CASH_IN') {
        // User is GIVING cash to agent, user is credited, Agent's PSP register is debited (Agent must have register cash)
        if (pspRegister < params.amount) {
          throw new Error(`AGENT_INSUFFICIENT_LIQUIDITY: Agent register has insufficient cash balance (${pspRegister} DA) to accept this cash deposit of ${params.amount} DA.`);
        }
      }
    }

    // Calculate risk score
    const riskScore = this.computeTransactionRiskScore({
      type: params.type,
      amount: params.amount,
      sender: senderAcc || undefined,
      receiver: receiverAcc || undefined,
      hourlyVolumeOfSender: senderAcc ? hourlyVolume : undefined
    });

    // D. TRANSACTION VELOCITY / ANOMALOUS PATTERN BOOST
    if (senderAcc) {
      const patternAlert = this.detectVelocityPatterns(senderAcc.id);
      if (patternAlert) {
        riskScore.score = Math.min(riskScore.score + 35, 100);
        riskScore.factors.push(`VELOCITY_ALERT_${patternAlert.type}`);
        this.logAudit(
          'VELOCITY_PATTERN_DETECTED',
          `Anomalous velocity pattern on account ${senderAcc.name}: ${patternAlert.pattern}`,
          'WARNING'
        );
      }
    }

    // Check geo anomaly for the sender account
    let currentLocation = 'Algiers, Algeria';
    if (params.ipAddress.startsWith('105.')) {
      currentLocation = 'Oran, Algeria';
    } else if (params.ipAddress.startsWith('197.')) {
      currentLocation = 'Constantine, Algeria';
    }

    if (senderAcc) {
      const anomaly = this.checkGeoAnomalies(
        senderAcc.id,
        params.ipAddress,
        currentLocation,
        params.deviceId
      );
      if (anomaly) {
        this.logAudit(
          'DEVICE_GEO_ANOMALY',
          `Suspicious activity on account ${senderAcc.name} (${senderAcc.id}): ${anomaly.details}`,
          anomaly.severity === 'HIGH' ? 'CRITICAL' : 'WARNING',
          params.ipAddress
        );
        if (anomaly.severity === 'HIGH') {
          riskScore.score = Math.min(riskScore.score + 40, 100);
          riskScore.factors.push("IMPOSSIBLE_TRAVEL_ANOMALY");
        }
      }
    }

    // E. DUAL-CONTROL MULTI-SIG GATING (> 1M DA)
    if (params.amount > 1000000 && isTransfer) {
      const tempTx: LedgerTransaction = {
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
        fee,
        riskScore: riskScore,
        feeBreakdown
      };

      const multiSig: MultiSigTransaction = {
        id: `msig-${Date.now()}`,
        originalTx: tempTx,
        requiredApprovals: 2,
        currentApprovals: [],
        status: 'PENDING_APPROVAL',
        createdAt: timestamp
      };
      this.data.multiSigTransactions.unshift(multiSig);
      this.logAudit('MULTISIG_QUEUED', `High-Value transfer of ${params.amount} DA queued for dual-control operator signature. ID: ${multiSig.id}`, 'WARNING');
      
      const errorMsg = `MULTI_SIG_REQUIRED: Transfers exceeding 1,000,000 DA require dual-control operator authorization. Request has been queued (ID: ${multiSig.id}).`;
      this.trackFailedTransaction(params, errorMsg);
      throw new Error(errorMsg);
    }

    // F. COMPLIANCE REVIEW HOLD GATING (Score >= 75)
    if (riskScore.score >= 75) {
      const tempTx: LedgerTransaction = {
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
        fee,
        riskScore: riskScore,
        feeBreakdown
      };

      const held: HeldTransaction = {
        id: `hold-${Date.now()}`,
        originalTx: tempTx,
        riskScore: riskScore.score,
        holdReason: `High Risk score (${riskScore.score}/100): ${riskScore.factors.join(', ')}`,
        heldAt: timestamp,
        decision: 'PENDING',
        holdExpiryTime: new Date(Date.now() + 24 * 3600000).toISOString() // 24 hours expiry TTL
      };
      this.data.heldTransactions.unshift(held);
      this.logAudit('TRANSACTION_HELD_FOR_REVIEW', `Transaction held for manual compliance review. Anomaly factors: ${riskScore.factors.join(', ')}`, 'CRITICAL');
      
      const errorMsg = `TRANSACTION_HELD: Transaction held for compliance verification due to elevated risk score (${riskScore.score}/100).`;
      this.trackFailedTransaction(params, errorMsg);
      throw new Error(errorMsg);
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
      fee,
      riskScore: riskScore,
      feeBreakdown
    };

    this.data.transactions.unshift(tx);

    // G. SWIFT MT103 LOGGING FOR INTERBANK TRANSFERS
    if (isTransfer && senderAcc && receiverAcc) {
      this.logSwiftMT103(tx);
    }

    // H. CURRENCY TRANSACTION REPORT (CTR) FOR TRANSFERS >= 10M DA
    if (params.amount >= 10000000) {
      this.generateCTRReport(tx);
    }

    // Dynamic audit log
    this.logAudit(
      'TRANSACTION_EXECUTED',
      `Ledger execution [${tx.id}]: ${params.type} of ${params.amount} DA. Sender: ${params.senderIban}, Beneficiary: ${params.receiverIban}. Fee: ${fee} DA. Risk: ${riskScore.score}/100.`,
      riskScore.score >= 50 ? 'CRITICAL' : params.amount >= 500000 ? 'WARNING' : 'INFO',
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

    // Prevent unbounded growth by capping cantonmentRecords to 200 entries
    if (this.data.cantonmentRecords.length > 200) {
      this.data.cantonmentRecords = this.data.cantonmentRecords.slice(0, 200);
    }

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

  // --- Commission Settlements ---
  public getCommissionSettlements() {
    return this.data.commissionSettlements || [];
  }

  public requestCommissionPayout(agentId: string): CommissionSettlement {
    const agent = this.data.agents.find(a => a.id === agentId);
    if (!agent) throw new Error("Agent not found");
    if (agent.commissionBalance <= 0) {
      throw new Error("No commissions to settle.");
    }
    
    const settlement: CommissionSettlement = {
      id: `cs-${Date.now()}`,
      agentId,
      amount: agent.commissionBalance,
      status: 'PENDING',
      requestedAt: new Date().toISOString()
    };
    
    this.data.commissionSettlements.unshift(settlement);
    this.logAudit(
      'COMMISSION_SETTLEMENT_REQUESTED',
      `Agent ${agent.name} requested settlement of ${agent.commissionBalance} DA.`,
      'INFO'
    );
    this.save();
    return settlement;
  }

  public approveCommissionPayout(settlementId: string, approvedBy: string): CommissionSettlement {
    const settlement = this.data.commissionSettlements.find(s => s.id === settlementId);
    if (!settlement) throw new Error("Settlement not found");
    
    settlement.status = 'APPROVED';
    settlement.approvedAt = new Date().toISOString();
    settlement.approvedBy = approvedBy;
    
    this.logAudit(
      'COMMISSION_SETTLEMENT_APPROVED',
      `${approvedBy} approved commission payout of ${settlement.amount} DA for agent ${settlement.agentId}.`,
      'INFO'
    );
    this.save();
    return settlement;
  }

  public markCommissionAsPaid(settlementId: string, paymentRef: string) {
    const settlement = this.data.commissionSettlements.find(s => s.id === settlementId);
    if (!settlement) throw new Error("Settlement not found");
    if (settlement.status !== 'APPROVED') {
      throw new Error("Settlement must be approved before marking as paid.");
    }
    
    settlement.status = 'PAID';
    settlement.paidAt = new Date().toISOString();
    settlement.paymentReference = paymentRef;
    
    const agent = this.data.agents.find(a => a.id === settlement.agentId);
    if (agent) {
      agent.commissionBalance -= settlement.amount; // Zero out commission
    }
    
    this.logAudit(
      'COMMISSION_PAID',
      `Commission payment ${paymentRef} processed for ${settlement.amount} DA. Agent balance reset.`,
      'INFO'
    );
    this.save();
    return settlement;
  }

  // --- Guarantee Renewals ---
  public getGuaranteeRenewals() {
    return this.data.guaranteeRenewals || [];
  }

  public requestGuaranteeRenewal(newAmount: number, newExpiryDate: string): GuaranteeRenewalRequest {
    const renewal: GuaranteeRenewalRequest = {
      id: `gr-${Date.now()}`,
      currentGuaranteeId: this.data.guarantee.id,
      newAmount,
      newExpiryDate,
      requestedAt: new Date().toISOString(),
      status: 'PENDING'
    };
    
    this.data.guaranteeRenewals.unshift(renewal);
    this.logAudit(
      'GUARANTEE_RENEWAL_INITIATED',
      `Guarantee renewal request filed. Current: ${this.data.guarantee.amount} DA (expires ${this.data.guarantee.expiryDate}). ` +
      `Requested: ${newAmount} DA (new expiry: ${newExpiryDate}).`,
      'WARNING'
    );
    this.save();
    return renewal;
  }

  public approveGuaranteeRenewal(renewalId: string, bankOfficer: string) {
    const renewal = this.data.guaranteeRenewals.find(r => r.id === renewalId);
    if (!renewal) throw new Error("Renewal request not found");
    
    renewal.status = 'APPROVED';
    renewal.approvedAt = new Date().toISOString();
    renewal.approvedBy = bankOfficer;
    
    this.logAudit(
      'GUARANTEE_RENEWAL_APPROVED',
      `Bank officer ${bankOfficer} approved guarantee renewal.`,
      'WARNING'
    );
    this.save();
    return renewal;
  }

  public issueGuaranteeRenewal(renewalId: string) {
    const renewal = this.data.guaranteeRenewals.find(r => r.id === renewalId);
    if (!renewal) throw new Error("Renewal request not found");
    if (renewal.status !== 'APPROVED') {
      throw new Error("Renewal must be approved before issuance.");
    }
    
    // Update the guarantee
    this.data.guarantee = {
      ...this.data.guarantee,
      amount: renewal.newAmount,
      expiryDate: renewal.newExpiryDate,
      issueDate: new Date().toISOString().split('T')[0]
    };
    
    renewal.status = 'ISSUED';
    renewal.issuedAt = new Date().toISOString();
    
    this.updateGuaranteeStatus();
    
    this.logAudit(
      'GUARANTEE_RENEWED',
      `Guarantee successfully renewed: ${renewal.newAmount} DA. New expiry: ${renewal.newExpiryDate}.`,
      'INFO'
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

  // --- Blocked Entity Registry (Blacklist) ---
  public getBlockedEntities() {
    return this.data.blockedEntities || [];
  }

  public addBlockedEntity(entityType: 'ACCOUNT' | 'IBAN' | 'IP' | 'DEVICE_ID', entityValue: string, reason: string, blockedBy: string) {
    const cleanValue = entityValue.trim().replace(/\s/g, '');
    const existing = this.data.blockedEntities.find(b => b.entityType === entityType && b.entityValue.trim().replace(/\s/g, '') === cleanValue && b.status === 'ACTIVE');
    if (existing) {
      // Return existing entry so the API caller gets feedback (avoid silent no-op)
      return existing;
    }

    const blocked: BlockedEntity = {
      id: `blk-${Date.now()}`,
      entityType,
      entityValue,
      reason,
      blockedAt: new Date().toISOString(),
      blockedBy,
      status: 'ACTIVE'
    };

    this.data.blockedEntities.unshift(blocked);
    this.logAudit(
      'ENTITY_BLOCKED',
      `Blacklisted ${entityType}: "${entityValue}". Reason: ${reason}. Blocked by: ${blockedBy}`,
      'CRITICAL'
    );

    // If account/IBAN block, mark account as suspended (operational flag) so executeTransaction enforces it
    if (entityType === 'ACCOUNT') {
      const acc = this.getAccountById(entityValue);
      if (acc) {
        acc.isSuspended = true;
        this.cascadingDeactivationCheck(acc.id);
      }
    } else if (entityType === 'IBAN') {
      const acc = this.getAccountByIban(entityValue);
      if (acc) {
        acc.isSuspended = true;
        this.cascadingDeactivationCheck(acc.id);
      }
    }

    this.save();
    return blocked;
  }

  public updateBlockedEntityStatus(id: string, status: 'ACTIVE' | 'APPEAL_PENDING' | 'LIFTED', appealReason?: string) {
    const entry = this.data.blockedEntities.find(b => b.id === id);
    if (!entry) throw new Error("Blocked entity entry not found");

    entry.status = status;
    if (appealReason) entry.appealReason = appealReason;

    this.logAudit(
      'ENTITY_BLOCK_UPDATED',
      `Blacklist status for ${entry.entityType} "${entry.entityValue}" updated to ${status}.`,
      status === 'LIFTED' ? 'INFO' : 'WARNING'
    );

    // If lifted, clear isSuspended operational flag
    if (status === 'LIFTED') {
      if (entry.entityType === 'ACCOUNT') {
        const acc = this.getAccountById(entry.entityValue);
        if (acc) acc.isSuspended = false;
      } else if (entry.entityType === 'IBAN') {
        const acc = this.getAccountByIban(entry.entityValue);
        if (acc) acc.isSuspended = false;
      }
    }

    this.save();
    return entry;
  }

  public isEntityBlocked(value: string, type: 'ACCOUNT' | 'IBAN' | 'IP' | 'DEVICE_ID'): boolean {
    const cleanVal = value.trim().replace(/\s/g, '').toLowerCase();
    return this.data.blockedEntities.some(b => 
      b.entityType === type && 
      b.entityValue.trim().replace(/\s/g, '').toLowerCase() === cleanVal && 
      b.status === 'ACTIVE'
    );
  }

  // --- Trusted Beneficiaries Whitelist ---
  public getTrustedBeneficiaries(accountId: string) {
    return this.data.trustedBeneficiaries.filter(b => b.accountId === accountId);
  }

  public addTrustedBeneficiary(accountId: string, beneficiaryIban: string, beneficiaryName: string): TrustedBeneficiary {
    const account = this.getAccountById(accountId);
    if (!account) throw new Error("Account not found");

    const cleanIban = beneficiaryIban.trim().replace(/\s/g, '');
    const exists = this.data.trustedBeneficiaries.find(b => b.accountId === accountId && b.beneficiaryIban.trim().replace(/\s/g, '') === cleanIban);
    if (exists) return exists;

    const entry: TrustedBeneficiary = {
      id: `tb-${Date.now()}`,
      accountId,
      beneficiaryIban,
      beneficiaryName,
      addedAt: new Date().toISOString(),
      transactionCount: 0,
      totalAmountSent: 0
    };

    this.data.trustedBeneficiaries.push(entry);
    this.logAudit(
      'BENEFICIARY_ADDED_TO_WHITELIST',
      `${account.name} added trusted beneficiary ${beneficiaryName} (${beneficiaryIban})`,
      'INFO'
    );
    this.save();
    return entry;
  }

  // --- Compliance Holds (Held Transactions) ---
  public getHeldTransactions() {
    return this.data.heldTransactions || [];
  }

  public reviewHeldTransaction(id: string, decision: 'APPROVED' | 'REJECTED', notes: string, reviewer: string) {
    const held = this.data.heldTransactions.find(h => h.id === id);
    if (!held) throw new Error("Held transaction not found");
    if (held.decision !== 'PENDING') throw new Error("Transaction already reviewed");

    held.decision = decision;
    held.reviewedAt = new Date().toISOString();
    held.reviewedBy = reviewer;
    held.decisionNotes = notes;

    // Track compliance decision
    const complianceDecision: ComplianceDecision = {
      id: `dec-${Date.now()}`,
      operator: reviewer,
      targetTransactionId: held.originalTx.id,
      decision,
      reason: notes,
      decidedAt: new Date().toISOString()
    };
    if (!this.data.complianceDecisions) this.data.complianceDecisions = [];
    this.data.complianceDecisions.unshift(complianceDecision);

    if (decision === 'APPROVED') {
      // Execute original transaction but bypassing hold block
      this.logAudit('HELD_TX_APPROVED', `Compliance Operator ${reviewer} approved transaction ${id}. Executing...`, 'INFO');
      
      // Mutate balances manually to bypass double execution hold error
      const original = held.originalTx;
      const senderAcc = this.getAccountByIban(original.senderIban);
      const receiverAcc = this.getAccountByIban(original.receiverIban);

      if (senderAcc) {
        senderAcc.balance -= (original.amount + original.fee);
        senderAcc.dailyDebitSum += (original.amount + original.fee);
      }
      if (receiverAcc) {
        receiverAcc.balance += original.amount;
      }

      // Record transaction
      this.data.transactions.unshift(original);
      
      this.logAudit(
        'TRANSACTION_EXECUTED',
        `Ledger execution [${original.id}] (Hold Approved): ${original.type} of ${original.amount} DA. Sender: ${original.senderIban}, Beneficiary: ${original.receiverIban}.`,
        'INFO'
      );

      // SWIFT MT103 logs
      if (original.type === 'TRANSFER' && senderAcc && receiverAcc) {
        this.logSwiftMT103(original);
      }

      // Generate reports if needed
      if (original.amount >= 10000000) {
        this.generateCTRReport(original);
      }

    } else {
      this.logAudit('HELD_TX_REJECTED', `Compliance Operator ${reviewer} REJECTED transaction ${id}. Releasing hold to failed registry. Reason: ${notes}`, 'CRITICAL');
      
      // Save failure record
      const retry: FailedTransactionRetry = {
        id: `retry-${Date.now()}`,
        originalTx: held.originalTx,
        failureReason: `HELD_REJECTED: Operator rejected transaction during review. Notes: ${notes}`,
        retryCount: 0,
        maxRetries: 3,
        nextRetryAt: new Date().toISOString(),
        status: 'ABANDONED'
      };
      this.data.failedTransactionRetries.push(retry);

      // Trigger automatic warning/blacklisting if operator specified
      if (notes.toLowerCase().includes('fraud') || notes.toLowerCase().includes('scam')) {
        this.addBlockedEntity('IBAN', held.originalTx.senderIban, `Fraud reported on held transaction review: ${notes}`, reviewer);
      }
    }

    this.save();
    return held;
  }

  // --- Sanctions Screening (PEP / OFAC watchlist) ---
  public checkSanctionsScreening(name: string, idNumber: string): SanctionsCheckResult {
    const knownTerrorists = [
      'Mohamed Terroristes', 
      'Karim Red', 
      'Al-Zawahiri', 
      'Mokhtar Belmokhtar', 
      'Carlos the Jackal', 
      'Abdelmalek Droukdel',
      'Ben Laden'
    ];
    
    const isPEP = [
      'Tebboune', 
      'Chengriha', 
      'Brahim Merad', 
      'Laaziz Faid'
    ].some(pep => name.toLowerCase().includes(pep.toLowerCase()));

    const matchName = knownTerrorists.find(t => name.toLowerCase().replace(/[\s_-]/g, '').includes(t.toLowerCase().replace(/[\s_-]/g, '')));
    
    if (matchName) {
      return {
        sanctioned: true,
        listName: 'ALGERIAN_WATCHLIST',
        matchReason: `OFAC High-Alert MATCH: "${name}" matches known restricted offender profile "${matchName}" on Global Sanctions Database.`
      };
    }

    if (isPEP) {
      return {
        sanctioned: true, // For simulator, block or alert PEP registration under high-scrutiny rules
        listName: 'ALGERIAN_WATCHLIST',
        matchReason: `PEP MATCH (Politically Exposed Person): "${name}" matches listed high-profile public official. Subject to enhanced regulatory screening.`
      };
    }

    return { sanctioned: false, listName: 'OFAC' };
  }

  // --- SWIFT MT103 Logging ---
  public getSwiftMessages() {
    return this.data.swiftMessages || [];
  }

  private logSwiftMT103(tx: LedgerTransaction) {
    const swift: SWIFTMessage = {
      id: `swift-${tx.id}`,
      messageType: 'MT103',
      txId: tx.id,
      senderBIC: 'ALATDZAG001', // Bank of Algeria BIC
      receiverBIC: 'ALATDZAG002', // Beneficiary PSP clearing BIC
      amount: tx.amount,
      currency: 'DZD',
      description: tx.reference,
      priority: tx.amount >= 500000 ? 'HIGH' : 'NORM',
      createdAt: tx.timestamp,
      status: 'CLEARED'
    };
    this.data.swiftMessages.push(swift);
  }

  // --- Multi-Signature Approval for Large Transfers ---
  public getMultiSigTransactions() {
    return this.data.multiSigTransactions || [];
  }

  public signMultiSigTransaction(id: string, signer: string, status: 'APPROVED' | 'REJECTED', reason: string) {
    const msig = this.data.multiSigTransactions.find(m => m.id === id);
    if (!msig) throw new Error("Multi-signature transaction proposal not found");
    if (msig.status !== 'PENDING_APPROVAL') throw new Error("Proposal is no longer pending approval");

    // Check if signer already signed
    if (msig.currentApprovals.some(a => a.signerName === signer)) {
      throw new Error("You have already signed this transaction request.");
    }

    msig.currentApprovals.push({
      signerName: signer,
      signedAt: new Date().toISOString(),
      approvalStatus: status,
      reason
    });

    this.logAudit(
      'MULTISIG_SIGNED',
      `Operator ${signer} signed MultiSig TX ${id} with: ${status}. Reason: ${reason}`,
      'WARNING'
    );

    if (status === 'REJECTED') {
      msig.status = 'REJECTED';
      
      // Save failure
      this.data.failedTransactionRetries.push({
        id: `retry-${Date.now()}`,
        originalTx: msig.originalTx,
        failureReason: `MULTISIG_REJECTED: Large value transfer rejected by co-signer ${signer}. Reason: ${reason}`,
        retryCount: 0,
        maxRetries: 3,
        nextRetryAt: new Date().toISOString(),
        status: 'ABANDONED'
      });
    } else {
      if (msig.currentApprovals.filter(a => a.approvalStatus === 'APPROVED').length >= msig.requiredApprovals) {
        msig.status = 'APPROVED';
        
        // Execute original transaction bypassing multi-sig check
        this.logAudit('MULTISIG_EXECUTING', `Multi-signature threshold met (2/2). Processing large transfer of ${msig.originalTx.amount} DA...`, 'INFO');
        
        const original = msig.originalTx;
        const senderAcc = this.getAccountByIban(original.senderIban);
        const receiverAcc = this.getAccountByIban(original.receiverIban);

        if (senderAcc) {
          senderAcc.balance -= (original.amount + original.fee);
          senderAcc.dailyDebitSum += (original.amount + original.fee);
        }
        if (receiverAcc) {
          receiverAcc.balance += original.amount;
        }

        // Record transaction
        this.data.transactions.unshift(original);
        msig.status = 'EXECUTED';
        
        this.logAudit(
          'TRANSACTION_EXECUTED',
          `Ledger execution [${original.id}] (MultiSig Clear): Large transfer of ${original.amount} DA. Sender: ${original.senderIban}, Receiver: ${original.receiverIban}.`,
          'INFO'
        );

        // SWIFT MT103 logs
        if (senderAcc && receiverAcc) {
          this.logSwiftMT103(original);
        }

        // Generate reports if needed
        if (original.amount >= 10000000) {
          this.generateCTRReport(original);
        }
      }
    }

    this.save();
    return msig;
  }

  // --- Failed Transaction Retries ---
  public getFailedTransactionRetries() {
    return this.data.failedTransactionRetries || [];
  }

  public trackFailedTransaction(txDetails: Partial<LedgerTransaction>, errorMsg: string) {
    const retry: FailedTransactionRetry = {
      id: `fail-${Date.now()}`,
      originalTx: txDetails,
      failureReason: errorMsg,
      retryCount: 0,
      maxRetries: 3,
      nextRetryAt: new Date(Date.now() + 30000).toISOString(),
      status: 'PENDING'
    };
    this.data.failedTransactionRetries.unshift(retry);
    this.save();
    return retry;
  }

  public getComplianceDecisions() {
    return this.data.complianceDecisions || [];
  }

  public expireOldHeldTransactions() {
    const now = new Date();
    // Default 24h expiration
    const expired = (this.data.heldTransactions || []).filter(h => 
      h.decision === 'PENDING' && 
      new Date(h.holdExpiryTime || new Date(new Date(h.heldAt).getTime() + 24 * 3600000)) < now
    );
    if (expired.length === 0) return;

    expired.forEach(h => {
      h.decision = 'REJECTED';
      h.reviewedAt = now.toISOString();
      h.reviewedBy = 'SYSTEM_AUTO_CLEANUP';
      h.decisionNotes = 'AUTO_EXPIRED: Hold exceeded 24-hour review window.';

      // Track compliance decision
      const complianceDecision: ComplianceDecision = {
        id: `dec-${Date.now()}`,
        operator: 'SYSTEM_AUTO_CLEANUP',
        targetTransactionId: h.originalTx.id,
        decision: 'REJECTED',
        reason: 'AUTO_EXPIRED: Hold exceeded 24-hour review window.',
        decidedAt: now.toISOString()
      };
      if (!this.data.complianceDecisions) this.data.complianceDecisions = [];
      this.data.complianceDecisions.unshift(complianceDecision);

      this.logAudit('HELD_TX_AUTO_EXPIRED', `Held transaction ${h.id} auto-rejected because it exceeded the 24-hour review window.`, 'WARNING');

      // Save failure record
      const retry: FailedTransactionRetry = {
        id: `retry-${Date.now()}`,
        originalTx: h.originalTx,
        failureReason: `HELD_AUTO_EXPIRED: Transaction exceeded compliance review window of 24h.`,
        retryCount: 0,
        maxRetries: 3,
        nextRetryAt: now.toISOString(),
        status: 'ABANDONED'
      };
      this.data.failedTransactionRetries.push(retry);
    });

    this.save();
  }

  public processPendingRetries() {
    const pending = this.getFailedTransactionRetries().filter(r => r.status === 'PENDING');
    if (pending.length === 0) return;

    pending.forEach(retry => {
      if (new Date(retry.nextRetryAt) < new Date()) {
        try {
          this.logAudit('RETRY_PROCESSING', `System attempting automated background retry for transaction fail-record: ${retry.id}...`, 'INFO');
          
          // Re-execute transaction
          const original = retry.originalTx;
          if (!original.type || !original.amount || !original.senderIban || !original.receiverIban) {
            throw new Error("INVALID_RETRY_PAYLOAD: Missing core transaction fields in retry record");
          }

          const result = this.executeTransaction({
            type: original.type,
            amount: original.amount,
            senderIban: original.senderIban,
            receiverIban: original.receiverIban,
            reference: original.reference || 'Automated compliance retry',
            ipAddress: original.ipAddress || '127.0.0.1',
            deviceId: original.deviceId || 'RETRY_WORKER',
            agentId: original.agentId
          });

          retry.status = 'RETRIED';
          retry.retryCount++;
          this.logAudit('RETRY_SUCCESS', `Automated retry successful for ${retry.id}. Ledger transaction [${result.id}] executed.`, 'INFO');
        } catch (e: any) {
          retry.retryCount++;
          if (retry.retryCount >= retry.maxRetries) {
            retry.status = 'ABANDONED';
            this.logAudit('RETRY_ABANDONED', `Automated retry limit reached (${retry.retryCount}/${retry.maxRetries}) for ${retry.id}. Marked as ABANDONED. Reason: ${e.message}`, 'CRITICAL');
          } else {
            // Exponential backoff
            const delayMs = Math.pow(2, retry.retryCount) * 15000; // 15s, 30s, etc.
            retry.nextRetryAt = new Date(Date.now() + delayMs).toISOString();
            this.logAudit('RETRY_FAILED', `Automated retry attempt #${retry.retryCount} failed for ${retry.id}. Next attempt scheduled at ${retry.nextRetryAt}. Reason: ${e.message}`, 'WARNING');
          }
        }
      }
    });

    this.save();
  }

  // --- Compliance Reports (CTR / SAR to FIU) ---
  public getComplianceReports() {
    return this.data.complianceReports || [];
  }

  public generateCTRReport(tx: LedgerTransaction) {
    const report: ComplianceReport = {
      id: `ctr-${Date.now()}`,
      reportType: 'CTR',
      reportDate: new Date().toISOString(),
      transactions: [tx],
      totalAmount: tx.amount,
      targetEntity: tx.senderIban,
      status: 'DRAFT',
      suspiciousIndicators: ['High-Value Cash Movement exceeding 10M DA regulatory threshold.']
    };
    this.data.complianceReports.unshift(report);
    this.logAudit(
      'CTR_GENERATED',
      `Auto-drafted CTR report ${report.id} for transaction of ${tx.amount} DA. Status: DRAFT.`,
      'WARNING'
    );
    this.save();
    return report;
  }

  public generateSARReport(accountId: string, reason: string) {
    const account = this.getAccountById(accountId);
    if (!account) throw new Error("Account not found");

    const txs = this.data.transactions.filter(t => t.senderIban === account.iban);
    const totalAmount = txs.reduce((sum, t) => sum + t.amount, 0);

    const report: ComplianceReport = {
      id: `sar-${Date.now()}`,
      reportType: 'SAR',
      reportDate: new Date().toISOString(),
      transactions: txs.slice(0, 10), // attach last 10 transactions
      totalAmount,
      targetEntity: account.name,
      status: 'DRAFT',
      suspiciousIndicators: [
        'Unusual transactional behavior',
        'Velocity alert pattern trigger',
        `Compliance review flag: ${reason}`
      ]
    };

    this.data.complianceReports.unshift(report);
    this.logAudit(
      'SAR_GENERATED',
      `Compliance team filed Suspicious Activity Report (SAR) ${report.id} for ${account.name}. Reason: ${reason}`,
      'CRITICAL'
    );
    this.save();
    return report;
  }

  public submitReportToFIU(reportId: string) {
    const report = this.data.complianceReports.find(r => r.id === reportId);
    if (!report) throw new Error("Report not found");

    report.status = 'SUBMITTED';
    report.fiuSubmittedAt = new Date().toISOString();

    this.logAudit(
      'FIU_REPORT_SUBMITTED',
      `Compliance report ${reportId} (${report.reportType}) has been encrypted and securely transmitted to the Algerian Financial Intelligence Unit (FIU).`,
      'WARNING'
    );
    this.save();
    return report;
  }

  // --- Cascading Deactivation ---
  public cascadingDeactivationCheck(flaggedAccountId: string) {
    const flaggedAcc = this.getAccountById(flaggedAccountId);
    if (!flaggedAcc) return;

    const emailParts = flaggedAcc.email.split('@');
    const emailDomain = emailParts.length > 1 ? emailParts[1] : '';
    const phonePrefix = flaggedAcc.phoneNumber.substring(0, 7);

    const isGenericDomain = ['gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com', 'mail.ru'].includes(emailDomain.toLowerCase());

    const related = this.data.accounts.filter(a => {
      if (a.id === flaggedAccountId) return false;
      const otherDomain = a.email.split('@')[1] || '';
      const domainMatch = !isGenericDomain && otherDomain.toLowerCase() === emailDomain.toLowerCase();
      const phonePrefixMatch = a.phoneNumber.substring(0, 7) === phonePrefix;
      return domainMatch || phonePrefixMatch;
    });

    related.forEach(acc => {
      acc.status = 'RELATED_SUSPEND_RISK';
      this.logAudit(
        'CASCADING_DEACTIVATION_ALERT',
        `Account ${acc.name} flagged with RELATED_SUSPEND_RISK due to association with suspended account ${flaggedAcc.name}. Shared attributes: ${!isGenericDomain ? `email domain ${emailDomain}` : 'phone prefix match'}.`,
        'WARNING'
      );
    });

    this.save();
  }

  // --- Anomaly Velocity Patterns ---
  public detectVelocityPatterns(accountId: string): { type: string; pattern: string } | null {
    const account = this.getAccountById(accountId);
    if (!account) return null;

    const now = Date.now();
    const oneHourAgo = now - 3600000;

    const recentTxs = this.data.transactions
      .slice(0, 500)
      .filter(t => t.senderIban === account.iban)
      .filter(t => new Date(t.timestamp).getTime() > oneHourAgo)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // 1. Rapid Fire (> 8 transactions in 1 hour)
    if (recentTxs.length > 8) {
      return {
        type: 'RAPID_FIRE',
        pattern: `${recentTxs.length} rapid-fire transactions executed within the last hour.`
      };
    }

    // 2. Escalating amounts (escalation pattern e.g. 3 consecutive transactions in last hour where each amount is >= 1.5x previous)
    if (recentTxs.length >= 3) {
      const amounts = recentTxs.slice(0, 3).map(t => t.amount).reverse(); // oldest to newest
      if (amounts[1] >= amounts[0] * 1.5 && amounts[2] >= amounts[1] * 1.5) {
        return {
          type: 'ESCALATING_PATTERN',
          pattern: `Escalating volume pattern: suspicious progression [${amounts.join(' DA -> ')} DA] executed in rapid succession.`
        };
      }
    }

    return null;
  }

  public getTotpSecret(email: string) {
    return this.data.totpSecrets[email.toLowerCase()] || 'JBSWY3DPEHPK3PXP';
  }

  // --- DinarBridge & CIB / Service Recharge Methods ---

  public linkDinarBridgeWallet(accountId: string, publicKey: string): void {
    if (!this.data.dinarBridgeWallets) this.data.dinarBridgeWallets = {};
    this.data.dinarBridgeWallets[accountId] = {
      publicKey,
      dztBalance: 0,
      lastSynced: new Date().toISOString()
    };
    this.save();
  }

  public getDinarBridgeWallet(accountId: string) {
    if (!this.data.dinarBridgeWallets) this.data.dinarBridgeWallets = {};
    return this.data.dinarBridgeWallets[accountId] || null;
  }

  public recordCIBDeposit(params: {
    accountId: string;
    cibTransactionId: string;
    amount: number;
    fullName: string;
    phone: string;
    email: string;
    memo: string;
    paymentUrl?: string;
  }): CIBDepositRecord {
    const record: CIBDepositRecord = {
      id: `cib-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      accountId: params.accountId,
      cibTransactionId: params.cibTransactionId,
      amount: params.amount,
      fullName: params.fullName,
      phone: params.phone,
      email: params.email,
      memo: params.memo,
      status: 'PENDING',
      paymentUrl: params.paymentUrl,
      createdAt: new Date().toISOString()
    };
    if (!this.data.cibDeposits) this.data.cibDeposits = [];
    this.data.cibDeposits.unshift(record);
    this.save();
    return record;
  }

  public getCIBDepositByTransactionId(cibId: string): CIBDepositRecord | null {
    if (!this.data.cibDeposits) this.data.cibDeposits = [];
    return this.data.cibDeposits.find(d => d.cibTransactionId === cibId) || null;
  }

  public confirmCIBDeposit(cibId: string): CIBDepositRecord {
    if (!this.data.cibDeposits) this.data.cibDeposits = [];
    const record = this.data.cibDeposits.find(d => d.cibTransactionId === cibId);
    if (!record) throw new Error("CIB Deposit not found");
    record.status = 'CONFIRMED';
    record.confirmedAt = new Date().toISOString();
    this.save();
    return record;
  }

  public getCIBDeposits(): CIBDepositRecord[] {
    return this.data.cibDeposits || [];
  }

  public recordServiceRecharge(params: {
    accountId: string;
    serviceType: 'PHONE' | 'INTERNET' | 'GAME' | 'BILL';
    operator: string;
    target: string;
    amount: number;
    offer: string;
    operationId?: string;
  }): ServiceRecharge {
    const record: ServiceRecharge = {
      id: `svc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      accountId: params.accountId,
      serviceType: params.serviceType,
      operator: params.operator,
      target: params.target,
      amount: params.amount,
      offer: params.offer,
      status: 'SUCCESS',
      operationId: params.operationId,
      createdAt: new Date().toISOString()
    };
    if (!this.data.serviceRecharges) this.data.serviceRecharges = [];
    this.data.serviceRecharges.unshift(record);
    this.save();
    return record;
  }

  public getServiceRecharges(): ServiceRecharge[] {
    return this.data.serviceRecharges || [];
  }
}

export const db = new JSONDatabase();
