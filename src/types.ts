export type KycLevel = 1 | 2 | 3;
export type KycStatus = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'VISIO_PENDING';
export type NavTab = 'DASHBOARD' | 'LEDGER' | 'KYC' | 'AGENTS' | 'RECONCILIATION' | 'AUDITS';

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
}

export type TransactionType = 'CASH_IN' | 'CASH_OUT' | 'TRANSFER' | 'AGENT_CASH_IN' | 'AGENT_CASH_OUT';

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
