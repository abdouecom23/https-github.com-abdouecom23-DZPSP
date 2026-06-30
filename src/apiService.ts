import { ApiClient } from './apiClient';
import {
  UserAccount,
  LedgerTransaction,
  Agent,
  CantonmentRecord,
  BankGuarantee,
  AuditLog,
  CommissionSettlement,
  GuaranteeRenewalRequest,
  BlockedEntity,
  TrustedBeneficiary,
  HeldTransaction,
  MultiSigTransaction,
  FailedTransactionRetry,
  ComplianceReport,
  SWIFTMessage,
  SanctionsCheckResult
} from './types';

export class ApiService {
  // === Dashboard & Platform Stats ===
  static async getStats(): Promise<any> {
    return ApiClient.get(`/stats?t=${Date.now()}`);
  }

  // === Account Endpoints ===
  static async getAccounts(): Promise<UserAccount[]> {
    return ApiClient.get(`/accounts?t=${Date.now()}`);
  }

  static async getAccount(id: string): Promise<UserAccount> {
    return ApiClient.get(`/accounts/${id}?t=${Date.now()}`);
  }

  static async openAccount(body: {
    name: string;
    email: string;
    phoneNumber: string;
    kycLevel: number;
    idCardNumber: string;
    documentUrl?: string;
    idCardBackUrl?: string;
    proofOfAddressUrl?: string;
  }): Promise<UserAccount> {
    return ApiClient.post('/accounts/open', body);
  }

  static async upgradeKyc(
    id: string,
    body: {
      level: number;
      idCardNumber?: string;
      idCardUrl?: string;
      idCardBackUrl?: string;
      addressUrl?: string;
    }
  ): Promise<any> {
    return ApiClient.post(`/accounts/${id}/kyc-upgrade`, body);
  }

  static async reviewKyc(id: string, body: { status: string; notes?: string }): Promise<any> {
    return ApiClient.post(`/accounts/${id}/kyc-review`, body);
  }

  static async simulateKycCooldown(id: string): Promise<any> {
    return ApiClient.post(`/accounts/${id}/kyc-cooldown-simulate`, {});
  }

  static async simulateKycReject(id: string): Promise<any> {
    return ApiClient.post(`/accounts/${id}/kyc-reject-simulate`, {});
  }

  static async requestKycException(id: string, body: { reason: string }): Promise<any> {
    return ApiClient.post(`/accounts/${id}/kyc-exception-request`, body);
  }

  static async approveKycException(id: string, body: { supervisorName: string }): Promise<any> {
    return ApiClient.post(`/accounts/${id}/kyc-exception-approve`, body);
  }

  static async updateAccountExpiry(
    id: string,
    body: { idCardExpiryDate?: string; proofOfAddressExpiryDate?: string; documentStatusAlert?: string }
  ): Promise<any> {
    return ApiClient.post(`/accounts/${id}/update-expiry`, body);
  }

  static async getOtpSecret(email: string): Promise<{ secret: string }> {
    return ApiClient.get(`/otp-secret?email=${encodeURIComponent(email)}`);
  }

  // === Transactions ===
  static async getTransactions(): Promise<LedgerTransaction[]> {
    return ApiClient.get(`/transactions?t=${Date.now()}`);
  }

  static async getTransaction(id: string): Promise<LedgerTransaction> {
    return ApiClient.get(`/transactions/${id}?t=${Date.now()}`);
  }

  static async searchTransactions(params: Record<string, string>): Promise<LedgerTransaction[]> {
    const query = new URLSearchParams(params).toString();
    return ApiClient.get(`/transactions/search?${query}&t=${Date.now()}`);
  }

  static async executeTransaction(body: {
    type: string;
    amount: number;
    senderIban: string;
    receiverIban: string;
    reference: string;
    otpCode?: string;
    agentId?: string;
  }): Promise<LedgerTransaction> {
    return ApiClient.post('/transactions/execute', body);
  }

  // === Agents ===
  static async getAgents(): Promise<Agent[]> {
    return ApiClient.get(`/agents?t=${Date.now()}`);
  }

  static async registerAgent(body: {
    name: string;
    location: string;
    initialCashRegister: string;
    contractExpiryDate: string;
    contractFileName?: string;
    contractFileUrl?: string;
  }): Promise<Agent> {
    return ApiClient.post('/agents/register', body);
  }

  static async updateAgentContract(
    id: string,
    body: {
      contractExpiryDate: string;
      contractFileName?: string;
      contractFileUrl?: string;
      contractModificationDate?: string;
      contractResiliationDate?: string;
    }
  ): Promise<any> {
    return ApiClient.post(`/agents/${id}/contract`, body);
  }

  static async updateAgentStatus(id: string, body: { isActive: boolean }): Promise<any> {
    return ApiClient.post(`/agents/${id}/status`, body);
  }

  // === Commission Settlements ===
  static async getCommissionSettlements(): Promise<CommissionSettlement[]> {
    return ApiClient.get(`/agents/commission/settlements?t=${Date.now()}`);
  }

  static async requestCommission(body: { agentId: string; amount: number }): Promise<any> {
    return ApiClient.post('/agents/commission/request', body);
  }

  static async approveCommission(body: { settlementId: string }): Promise<any> {
    return ApiClient.post('/agents/commission/approve', body);
  }

  static async payCommission(body: { settlementId: string; paymentReference: string }): Promise<any> {
    return ApiClient.post('/agents/commission/pay', body);
  }

  // === Cantonment & Reconciliation ===
  static async getCantonment(): Promise<CantonmentRecord[]> {
    return ApiClient.get(`/cantonment?t=${Date.now()}`);
  }

  static async reconcileCantonment(body: { reconciledBy: string; externalBalanceOverride?: number }): Promise<CantonmentRecord> {
    return ApiClient.post('/cantonment/reconcile', body);
  }

  // === Bank Guarantee ===
  static async getGuarantee(): Promise<BankGuarantee | null> {
    return ApiClient.get(`/guarantee?t=${Date.now()}`);
  }

  static async updateGuarantee(body: { amount: number; expiryDate: string }): Promise<any> {
    return ApiClient.post('/guarantee/update', body);
  }

  static async getGuaranteeRenewals(): Promise<GuaranteeRenewalRequest[]> {
    return ApiClient.get(`/guarantee/renewals?t=${Date.now()}`);
  }

  static async requestGuaranteeRenewal(body: { amount: number; expiryDate: string }): Promise<any> {
    return ApiClient.post('/guarantee/renewal-request', body);
  }

  static async approveGuaranteeRenewal(body: { renewalId: string; bankOfficer?: string }): Promise<any> {
    return ApiClient.post('/guarantee/renewal-approve', body);
  }

  static async issueGuaranteeRenewal(body: { renewalId: string }): Promise<any> {
    return ApiClient.post('/guarantee/renewal-issue', body);
  }

  // === Audit Logs ===
  static async getAuditLogs(): Promise<AuditLog[]> {
    return ApiClient.get(`/audit-logs?t=${Date.now()}`);
  }

  static async searchAuditLogs(params: Record<string, string>): Promise<AuditLog[]> {
    const query = new URLSearchParams(params).toString();
    return ApiClient.get(`/audit-logs/search?${query}&t=${Date.now()}`);
  }

  // === AI OCR ===
  static async ocrExtract(body: { imageUrl: string }): Promise<any> {
    return ApiClient.post('/kyc/ocr', body);
  }

  // === Compliance & Sanctions ===
  static async getBlockedCompliance(): Promise<BlockedEntity[]> {
    return ApiClient.get(`/compliance/blocked?t=${Date.now()}`);
  }

  static async createBlockedCompliance(body: {
    entityType: 'ACCOUNT' | 'IBAN' | 'IP' | 'DEVICE_ID';
    entityValue: string;
    reason: string;
  }): Promise<BlockedEntity> {
    return ApiClient.post('/compliance/blocked', body);
  }

  static async updateBlockedComplianceStatus(
    id: string,
    body: { status: 'ACTIVE' | 'LIFTED'; reason?: string }
  ): Promise<any> {
    return ApiClient.post(`/compliance/blocked/${id}/status`, body);
  }

  static async getTrustedAccountCompliance(accountId: string): Promise<TrustedBeneficiary[]> {
    return ApiClient.get(`/compliance/trusted/${accountId}?t=${Date.now()}`);
  }

  static async createTrustedAccountCompliance(body: {
    accountId: string;
    beneficiaryIban: string;
    beneficiaryName: string;
  }): Promise<TrustedBeneficiary> {
    return ApiClient.post('/compliance/trusted', body);
  }

  static async getHeldCompliance(): Promise<HeldTransaction[]> {
    return ApiClient.get(`/compliance/held?t=${Date.now()}`);
  }

  static async reviewHeldCompliance(
    holdId: string,
    body: { decision: 'APPROVED' | 'REJECTED'; notes: string; reviewer?: string }
  ): Promise<any> {
    return ApiClient.post(`/compliance/held/${holdId}/review`, body);
  }

  static async getMultisigCompliance(): Promise<MultiSigTransaction[]> {
    return ApiClient.get(`/compliance/multisig?t=${Date.now()}`);
  }

  static async signMultisigCompliance(
    msigId: string,
    body: { signerName: string; status: 'APPROVED' | 'REJECTED'; reason?: string }
  ): Promise<any> {
    return ApiClient.post(`/compliance/multisig/${msigId}/sign`, body);
  }

  static async getComplianceRetries(): Promise<FailedTransactionRetry[]> {
    return ApiClient.get(`/compliance/retries?t=${Date.now()}`);
  }

  static async getComplianceReports(): Promise<ComplianceReport[]> {
    return ApiClient.get(`/compliance/reports?t=${Date.now()}`);
  }

  static async createSarReport(body: {
    accountId: string;
    reason: string;
  }): Promise<ComplianceReport> {
    return ApiClient.post('/compliance/reports/sar', body);
  }

  static async submitSarReport(id: string, body: any = {}): Promise<any> {
    return ApiClient.post(`/compliance/reports/${id}/submit`, body);
  }

  static async getSwiftCompliance(): Promise<SWIFTMessage[]> {
    return ApiClient.get(`/compliance/swift?t=${Date.now()}`);
  }

  static async checkSanctions(body: { name: string }): Promise<SanctionsCheckResult> {
    return ApiClient.post('/compliance/sanctions-check', body);
  }

  static async getPerformanceMetrics(): Promise<any> {
    return ApiClient.get(`/performance/metrics?t=${Date.now()}`);
  }
}
