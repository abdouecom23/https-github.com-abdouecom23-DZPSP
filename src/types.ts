export type KycLevel = 1 | 2 | 3;
export type KycStatus = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'VISIO_PENDING';
export type NavTab = 'DASHBOARD' | 'LEDGER' | 'KYC' | 'AGENTS' | 'RECONCILIATION' | 'AUDITS' | 'COMPLIANCE';

export enum KycEscalationStatus {
  NONE = 'NONE',
  ESCALATED_TO_SUPERVISOR = 'ESCALATED_TO_SUPERVISOR',
  ESCALATED_TO_DIRECTOR = 'ESCALATED_TO_DIRECTOR',
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  kycLevel: KycLevel;
  kycStatus: KycStatus;
  balance: number; // in Dinar Algérien (DA)
  iban: string;
  dailyDebitSum: number;
  dailyDebitLimit: number; // L1: 100K DA, L2: 500K DA, L3: 1M DA
  balanceCap: number;      // L1: 100K DA, L2: 500K DA, L3: 1M DA
  documentUrl?: string;
  idCardBackUrl?: string;
  idCardNumber?: string;
  proofOfAddressUrl?: string;
  kycUpgradeRejected?: boolean;
  kycRejectedAt?: string;
  createdAt: string;
  kycEscalationStatus?: KycEscalationStatus;
  kycEscalationNotes?: string;
  idCardExpiryDate?: string;
  proofOfAddressExpiryDate?: string;
  documentStatusAlert?: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED';
  status?: 'ACTIVE' | 'SUSPENDED' | 'RELATED_SUSPEND_RISK';
}

export type TransactionType = 'CASH_IN' | 'CASH_OUT' | 'TRANSFER' | 'AGENT_CASH_IN' | 'AGENT_CASH_OUT';

export interface RiskScore {
  transactionId: string;
  score: number; // 0-100
  factors: string[]; // ["HIGH_VOLUME", "RAPID_FREQUENCY", "UNUSUAL_PATTERN", ...]
  flaggedAt: string;
  reviewed: boolean;
  reviewedBy?: string;
}

export interface LedgerTransaction {
  id: string;
  timestamp: string;
  type: TransactionType;
  amount: number;
  senderIban: string; // or 'EXTERNAL_CASH' / 'AGENT_REGISTER'
  receiverIban: string; // or 'EXTERNAL_CASH' / 'AGENT_REGISTER'
  reference: string;
  ipAddress: string;
  deviceId: string;
  otpVerified: boolean;
  agentId?: string;
  fee: number;
  riskScore?: RiskScore;
  feeBreakdown?: FeeBreakdown;
}

export interface Agent {
  id: string;
  name: string;
  location: string;
  cashRegisters: { [pspId: string]: number }; // Separate cash vaults per PSP (Article 20 separation)
  commissionBalance: number;
  commissionRate?: number;
  contractDate: string;
  isActive: boolean;
  contractFileUrl?: string; // Article 20 signed contract path/mock URL
  contractFileName?: string; // Filename of the uploaded contract
  contractExpiryDate?: string; // Contract expiration date
  contractModificationDate?: string; // Contract modification date
  contractResiliationDate?: string; // Contract resiliation date
}

export interface CantonmentRecord {
  id: string;
  timestamp: string;
  userBalancesSum: number;
  externalCantonmentBalance: number; // manual entry by finance team representing safeguarding account
  difference: number;
  status: 'RECONCILED' | 'MISMATCH';
  reconciledBy: string;
}

export interface BankGuarantee {
  id: string;
  amount: number;
  issueDate: string;
  expiryDate: string;
  status: 'ACTIVE' | 'WARNING' | 'EXPIRED';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  ipAddress: string;
}

export interface CommissionSettlement {
  id: string;
  agentId: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'PAID';
  requestedAt: string;
  approvedAt?: string;
  paidAt?: string;
  approvedBy?: string;
  paymentReference?: string;
}

export interface GuaranteeRenewalRequest {
  id: string;
  currentGuaranteeId: string;
  newAmount: number;
  newExpiryDate: string;
  requestedAt: string;
  status: 'PENDING' | 'APPROVED' | 'ISSUED';
  approvedAt?: string;
  issuedAt?: string;
  approvedBy?: string;
}

export interface DeviceFingerprint {
  deviceId: string;
  lastSeenAt: string;
  lastSeenIp: string;
  lastSeenLocation: string;
  accountId: string;
}

export interface FeeBreakdown {
  regulatoryFee: number; // % for Bank of Algeria compliance (0.1%)
  operationalFee: number; // Network/infrastructure (0.2%)
  profitMargin: number; // PSP margin (0.2%)
  total: number;
}

export interface BlockedEntity {
  id: string;
  entityType: 'ACCOUNT' | 'IBAN' | 'IP' | 'DEVICE_ID';
  entityValue: string;
  reason: string;
  blockedAt: string;
  blockedBy: string;
  status: 'ACTIVE' | 'APPEAL_PENDING' | 'LIFTED';
  appealReason?: string;
}

export interface TrustedBeneficiary {
  id: string;
  accountId: string;
  beneficiaryIban: string;
  beneficiaryName: string;
  addedAt: string;
  lastTransactionAt?: string;
  transactionCount: number;
  totalAmountSent: number;
}

export interface HeldTransaction {
  id: string;
  originalTx: LedgerTransaction;
  riskScore: number;
  holdReason: string;
  heldAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  decision: 'PENDING' | 'APPROVED' | 'REJECTED';
  decisionNotes?: string;
  holdExpiryTime?: string;
}

export interface SanctionsCheckResult {
  sanctioned: boolean;
  listName: 'OFAC' | 'EU' | 'UN' | 'INTERPOL' | 'ALGERIAN_WATCHLIST';
  matchReason?: string;
}

export interface SWIFTMessage {
  id: string;
  messageType: 'MT101' | 'MT103' | 'MT202'; // 101=request, 103=single payment, 202=general financial
  txId: string;
  senderBIC: string; // e.g., ALATDZAG001
  receiverBIC: string;
  amount: number;
  currency: string; // DZD
  description: string;
  priority: 'NORM' | 'HIGH'; // URGENT = STP (Straight-Through Processing)
  createdAt: string;
  status: 'PENDING_CLEARANCE' | 'CLEARED' | 'FAILED';
}

export interface ApprovalSignature {
  signerName: string;
  signedAt: string;
  approvalStatus: 'APPROVED' | 'REJECTED';
  reason?: string;
}

export interface MultiSigTransaction {
  id: string;
  originalTx: LedgerTransaction;
  requiredApprovals: number; // 2 or 3
  currentApprovals: ApprovalSignature[];
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'EXECUTED';
  createdAt: string;
}

export interface FailedTransactionRetry {
  id: string;
  originalTx: Partial<LedgerTransaction>;
  failureReason: string;
  retryCount: number;
  maxRetries: number;
  nextRetryAt: string;
  status: 'PENDING' | 'RETRIED' | 'ABANDONED';
}

export interface ComplianceReport {
  id: string;
  reportType: 'CTR' | 'SAR'; // Currency Transaction Report / Suspicious Activity Report
  reportDate: string;
  fiuSubmittedAt?: string;
  transactions: LedgerTransaction[];
  totalAmount: number;
  suspiciousIndicators?: string[];
  status: 'DRAFT' | 'SUBMITTED' | 'ACKNOWLEDGED';
  targetEntity?: string;
}

export interface ComplianceDecision {
  id: string;
  operator: string;
  targetTransactionId: string;
  decision: 'APPROVED' | 'REJECTED';
  reason: string;
  decidedAt: string;
}

