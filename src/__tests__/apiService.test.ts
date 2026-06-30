import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiService } from '../apiService';
import { ApiClient } from '../apiClient';

vi.mock('../apiClient', () => {
  return {
    ApiClient: {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      put: vi.fn(),
    },
  };
});

describe('ApiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should getStats correctly', async () => {
    vi.mocked(ApiClient.get).mockResolvedValue({ status: 'ok' });
    const result = await ApiService.getStats();
    expect(ApiClient.get).toHaveBeenCalledWith(expect.stringContaining('/stats?t='));
    expect(result).toEqual({ status: 'ok' });
  });

  it('should getAccounts correctly', async () => {
    vi.mocked(ApiClient.get).mockResolvedValue([{ id: 'acc-1' }]);
    const result = await ApiService.getAccounts();
    expect(ApiClient.get).toHaveBeenCalledWith(expect.stringContaining('/accounts?t='));
    expect(result).toEqual([{ id: 'acc-1' }]);
  });

  it('should getAccount by ID correctly', async () => {
    vi.mocked(ApiClient.get).mockResolvedValue({ id: 'acc-1' });
    const result = await ApiService.getAccount('acc-1');
    expect(ApiClient.get).toHaveBeenCalledWith(expect.stringContaining('/accounts/acc-1?t='));
    expect(result).toEqual({ id: 'acc-1' });
  });

  it('should openAccount correctly', async () => {
    vi.mocked(ApiClient.post).mockResolvedValue({ id: 'new-acc' });
    const payload = { name: 'Ali', email: 'ali@test.com', phoneNumber: '0550112233', kycLevel: 1, idCardNumber: '123' };
    const result = await ApiService.openAccount(payload);
    expect(ApiClient.post).toHaveBeenCalledWith('/accounts/open', payload);
    expect(result).toEqual({ id: 'new-acc' });
  });

  it('should upgradeKyc correctly', async () => {
    vi.mocked(ApiClient.post).mockResolvedValue({ success: true });
    const payload = { level: 2, idCardNumber: '999' };
    const result = await ApiService.upgradeKyc('acc-1', payload);
    expect(ApiClient.post).toHaveBeenCalledWith('/accounts/acc-1/kyc-upgrade', payload);
    expect(result).toEqual({ success: true });
  });

  it('should reviewKyc correctly', async () => {
    vi.mocked(ApiClient.post).mockResolvedValue({ success: true });
    const payload = { status: 'APPROVED', notes: 'all clear' };
    const result = await ApiService.reviewKyc('acc-1', payload);
    expect(ApiClient.post).toHaveBeenCalledWith('/accounts/acc-1/kyc-review', payload);
    expect(result).toEqual({ success: true });
  });

  it('should simulateKycCooldown correctly', async () => {
    vi.mocked(ApiClient.post).mockResolvedValue({ success: true });
    await ApiService.simulateKycCooldown('acc-1');
    expect(ApiClient.post).toHaveBeenCalledWith('/accounts/acc-1/kyc-cooldown-simulate', {});
  });

  it('should simulateKycReject correctly', async () => {
    vi.mocked(ApiClient.post).mockResolvedValue({ success: true });
    await ApiService.simulateKycReject('acc-1');
    expect(ApiClient.post).toHaveBeenCalledWith('/accounts/acc-1/kyc-reject-simulate', {});
  });

  it('should requestKycException correctly', async () => {
    vi.mocked(ApiClient.post).mockResolvedValue({ success: true });
    const payload = { reason: 'No document' };
    await ApiService.requestKycException('acc-1', payload);
    expect(ApiClient.post).toHaveBeenCalledWith('/accounts/acc-1/kyc-exception-request', payload);
  });

  it('should approveKycException correctly', async () => {
    vi.mocked(ApiClient.post).mockResolvedValue({ success: true });
    const payload = { supervisorName: 'M. Brahimi' };
    await ApiService.approveKycException('acc-1', payload);
    expect(ApiClient.post).toHaveBeenCalledWith('/accounts/acc-1/kyc-exception-approve', payload);
  });

  it('should updateAccountExpiry correctly', async () => {
    vi.mocked(ApiClient.post).mockResolvedValue({ success: true });
    const payload = { idCardExpiryDate: '2030-01-01', proofOfAddressExpiryDate: '2027-01-01', documentStatusAlert: 'WARNING' };
    await ApiService.updateAccountExpiry('acc-1', payload);
    expect(ApiClient.post).toHaveBeenCalledWith('/accounts/acc-1/update-expiry', payload);
  });

  it('should getOtpSecret correctly', async () => {
    vi.mocked(ApiClient.get).mockResolvedValue({ secret: 'ABCD' });
    const result = await ApiService.getOtpSecret('test@test.com');
    expect(ApiClient.get).toHaveBeenCalledWith('/otp-secret?email=test%40test.com');
    expect(result).toEqual({ secret: 'ABCD' });
  });

  it('should getTransactions correctly', async () => {
    vi.mocked(ApiClient.get).mockResolvedValue([]);
    await ApiService.getTransactions();
    expect(ApiClient.get).toHaveBeenCalledWith(expect.stringContaining('/transactions?t='));
  });

  it('should getTransaction by ID correctly', async () => {
    vi.mocked(ApiClient.get).mockResolvedValue({ id: 'tx-1' });
    const result = await ApiService.getTransaction('tx-1');
    expect(ApiClient.get).toHaveBeenCalledWith(expect.stringContaining('/transactions/tx-1?t='));
    expect(result).toEqual({ id: 'tx-1' });
  });

  it('should searchTransactions correctly', async () => {
    vi.mocked(ApiClient.get).mockResolvedValue([]);
    await ApiService.searchTransactions({ type: 'TRANSFER' });
    expect(ApiClient.get).toHaveBeenCalledWith(expect.stringContaining('/transactions/search?type=TRANSFER&t='));
  });

  it('should executeTransaction correctly', async () => {
    vi.mocked(ApiClient.post).mockResolvedValue({ reference: 'ref-1' });
    const payload = { type: 'TRANSFER', amount: 500, senderIban: 'DZ1', receiverIban: 'DZ2', reference: 'test' };
    const result = await ApiService.executeTransaction(payload);
    expect(ApiClient.post).toHaveBeenCalledWith('/transactions/execute', payload);
    expect(result).toEqual({ reference: 'ref-1' });
  });

  it('should getAgents correctly', async () => {
    vi.mocked(ApiClient.get).mockResolvedValue([]);
    await ApiService.getAgents();
    expect(ApiClient.get).toHaveBeenCalledWith(expect.stringContaining('/agents?t='));
  });

  it('should registerAgent correctly', async () => {
    vi.mocked(ApiClient.post).mockResolvedValue({ id: 'agent-1' });
    const payload = { name: 'Agent 1', location: 'Algiers', initialCashRegister: '50000', contractExpiryDate: '2028-01-01' };
    const result = await ApiService.registerAgent(payload);
    expect(ApiClient.post).toHaveBeenCalledWith('/agents/register', payload);
    expect(result).toEqual({ id: 'agent-1' });
  });

  it('should updateAgentContract correctly', async () => {
    vi.mocked(ApiClient.post).mockResolvedValue({ success: true });
    const payload = { contractExpiryDate: '2029-01-01' };
    await ApiService.updateAgentContract('agent-1', payload);
    expect(ApiClient.post).toHaveBeenCalledWith('/agents/agent-1/contract', payload);
  });

  it('should updateAgentStatus correctly', async () => {
    vi.mocked(ApiClient.post).mockResolvedValue({ success: true });
    const payload = { isActive: false };
    await ApiService.updateAgentStatus('agent-1', payload);
    expect(ApiClient.post).toHaveBeenCalledWith('/agents/agent-1/status', payload);
  });

  it('should getCommissionSettlements correctly', async () => {
    vi.mocked(ApiClient.get).mockResolvedValue([]);
    await ApiService.getCommissionSettlements();
    expect(ApiClient.get).toHaveBeenCalledWith(expect.stringContaining('/agents/commission/settlements?t='));
  });

  it('should requestCommission correctly', async () => {
    vi.mocked(ApiClient.post).mockResolvedValue({ success: true });
    const payload = { agentId: 'agent-1', amount: 1200 };
    await ApiService.requestCommission(payload);
    expect(ApiClient.post).toHaveBeenCalledWith('/agents/commission/request', payload);
  });

  it('should approveCommission correctly', async () => {
    vi.mocked(ApiClient.post).mockResolvedValue({ success: true });
    const payload = { settlementId: 'set-1' };
    await ApiService.approveCommission(payload);
    expect(ApiClient.post).toHaveBeenCalledWith('/agents/commission/approve', payload);
  });

  it('should payCommission correctly', async () => {
    vi.mocked(ApiClient.post).mockResolvedValue({ success: true });
    const payload = { settlementId: 'set-1', paymentReference: 'pay-1' };
    await ApiService.payCommission(payload);
    expect(ApiClient.post).toHaveBeenCalledWith('/agents/commission/pay', payload);
  });

  it('should getCantonment correctly', async () => {
    vi.mocked(ApiClient.get).mockResolvedValue([]);
    await ApiService.getCantonment();
    expect(ApiClient.get).toHaveBeenCalledWith(expect.stringContaining('/cantonment?t='));
  });

  it('should reconcileCantonment correctly', async () => {
    vi.mocked(ApiClient.post).mockResolvedValue({ status: 'MATCH' });
    const payload = { reconciledBy: 'A. Brahimi', externalBalanceOverride: 10000 };
    const result = await ApiService.reconcileCantonment(payload);
    expect(ApiClient.post).toHaveBeenCalledWith('/cantonment/reconcile', payload);
    expect(result).toEqual({ status: 'MATCH' });
  });

  it('should getGuarantee correctly', async () => {
    vi.mocked(ApiClient.get).mockResolvedValue({ id: 'g-1' });
    await ApiService.getGuarantee();
    expect(ApiClient.get).toHaveBeenCalledWith(expect.stringContaining('/guarantee?t='));
  });

  it('should updateGuarantee correctly', async () => {
    vi.mocked(ApiClient.post).mockResolvedValue({ success: true });
    const payload = { amount: 60000, expiryDate: '2028-12-31' };
    await ApiService.updateGuarantee(payload);
    expect(ApiClient.post).toHaveBeenCalledWith('/guarantee/update', payload);
  });

  it('should getGuaranteeRenewals correctly', async () => {
    vi.mocked(ApiClient.get).mockResolvedValue([]);
    await ApiService.getGuaranteeRenewals();
    expect(ApiClient.get).toHaveBeenCalledWith(expect.stringContaining('/guarantee/renewals?t='));
  });

  it('should requestGuaranteeRenewal correctly', async () => {
    vi.mocked(ApiClient.post).mockResolvedValue({ success: true });
    const payload = { amount: 70000, expiryDate: '2029-01-01' };
    await ApiService.requestGuaranteeRenewal(payload);
    expect(ApiClient.post).toHaveBeenCalledWith('/guarantee/renewal-request', payload);
  });

  it('should approveGuaranteeRenewal correctly', async () => {
    vi.mocked(ApiClient.post).mockResolvedValue({ success: true });
    const payload = { renewalId: 'ren-1', bankOfficer: 'Officer' };
    await ApiService.approveGuaranteeRenewal(payload);
    expect(ApiClient.post).toHaveBeenCalledWith('/guarantee/renewal-approve', payload);
  });

  it('should issueGuaranteeRenewal correctly', async () => {
    vi.mocked(ApiClient.post).mockResolvedValue({ success: true });
    const payload = { renewalId: 'ren-1' };
    await ApiService.issueGuaranteeRenewal(payload);
    expect(ApiClient.post).toHaveBeenCalledWith('/guarantee/renewal-issue', payload);
  });

  it('should getAuditLogs correctly', async () => {
    vi.mocked(ApiClient.get).mockResolvedValue([]);
    await ApiService.getAuditLogs();
    expect(ApiClient.get).toHaveBeenCalledWith(expect.stringContaining('/audit-logs?t='));
  });

  it('should searchAuditLogs correctly', async () => {
    vi.mocked(ApiClient.get).mockResolvedValue([]);
    await ApiService.searchAuditLogs({ action: 'LOGIN' });
    expect(ApiClient.get).toHaveBeenCalledWith(expect.stringContaining('/audit-logs/search?action=LOGIN&t='));
  });

  it('should ocrExtract correctly', async () => {
    vi.mocked(ApiClient.post).mockResolvedValue({ success: true });
    const payload = { imageUrl: 'url' };
    await ApiService.ocrExtract(payload);
    expect(ApiClient.post).toHaveBeenCalledWith('/kyc/ocr', payload);
  });

  it('should getBlockedCompliance correctly', async () => {
    vi.mocked(ApiClient.get).mockResolvedValue([]);
    await ApiService.getBlockedCompliance();
    expect(ApiClient.get).toHaveBeenCalledWith(expect.stringContaining('/compliance/blocked?t='));
  });

  it('should createBlockedCompliance correctly', async () => {
    vi.mocked(ApiClient.post).mockResolvedValue({ id: 'blocked-1' });
    const payload = { entityType: 'ACCOUNT' as const, entityValue: 'acc-1', reason: 'Fraud' };
    const result = await ApiService.createBlockedCompliance(payload);
    expect(ApiClient.post).toHaveBeenCalledWith('/compliance/blocked', payload);
    expect(result).toEqual({ id: 'blocked-1' });
  });

  it('should updateBlockedComplianceStatus correctly', async () => {
    vi.mocked(ApiClient.post).mockResolvedValue({ success: true });
    const payload = { status: 'LIFTED' as const, reason: 'Cleared' };
    await ApiService.updateBlockedComplianceStatus('b-1', payload);
    expect(ApiClient.post).toHaveBeenCalledWith('/compliance/blocked/b-1/status', payload);
  });

  it('should getTrustedAccountCompliance correctly', async () => {
    vi.mocked(ApiClient.get).mockResolvedValue([]);
    await ApiService.getTrustedAccountCompliance('acc-1');
    expect(ApiClient.get).toHaveBeenCalledWith(expect.stringContaining('/compliance/trusted/acc-1?t='));
  });

  it('should createTrustedAccountCompliance correctly', async () => {
    vi.mocked(ApiClient.post).mockResolvedValue({ id: 't-1' });
    const payload = { accountId: 'acc-1', beneficiaryIban: 'DZ12', beneficiaryName: 'Cherif' };
    const result = await ApiService.createTrustedAccountCompliance(payload);
    expect(ApiClient.post).toHaveBeenCalledWith('/compliance/trusted', payload);
    expect(result).toEqual({ id: 't-1' });
  });

  it('should getHeldCompliance correctly', async () => {
    vi.mocked(ApiClient.get).mockResolvedValue([]);
    await ApiService.getHeldCompliance();
    expect(ApiClient.get).toHaveBeenCalledWith(expect.stringContaining('/compliance/held?t='));
  });

  it('should reviewHeldCompliance correctly', async () => {
    vi.mocked(ApiClient.post).mockResolvedValue({ success: true });
    const payload = { decision: 'APPROVED' as const, notes: 'OK', reviewer: 'H. B' };
    await ApiService.reviewHeldCompliance('h-1', payload);
    expect(ApiClient.post).toHaveBeenCalledWith('/compliance/held/h-1/review', payload);
  });

  it('should getMultisigCompliance correctly', async () => {
    vi.mocked(ApiClient.get).mockResolvedValue([]);
    await ApiService.getMultisigCompliance();
    expect(ApiClient.get).toHaveBeenCalledWith(expect.stringContaining('/compliance/multisig?t='));
  });

  it('should signMultisigCompliance correctly', async () => {
    vi.mocked(ApiClient.post).mockResolvedValue({ success: true });
    const payload = { signerName: 'Chief', status: 'APPROVED' as const, reason: 'Approved' };
    await ApiService.signMultisigCompliance('msig-1', payload);
    expect(ApiClient.post).toHaveBeenCalledWith('/compliance/multisig/msig-1/sign', payload);
  });

  it('should getComplianceRetries correctly', async () => {
    vi.mocked(ApiClient.get).mockResolvedValue([]);
    await ApiService.getComplianceRetries();
    expect(ApiClient.get).toHaveBeenCalledWith(expect.stringContaining('/compliance/retries?t='));
  });

  it('should getComplianceReports correctly', async () => {
    vi.mocked(ApiClient.get).mockResolvedValue([]);
    await ApiService.getComplianceReports();
    expect(ApiClient.get).toHaveBeenCalledWith(expect.stringContaining('/compliance/reports?t='));
  });

  it('should createSarReport correctly', async () => {
    vi.mocked(ApiClient.post).mockResolvedValue({ id: 'sar-1' });
    const payload = { accountId: 'acc-1', reason: 'High volume' };
    const result = await ApiService.createSarReport(payload);
    expect(ApiClient.post).toHaveBeenCalledWith('/compliance/reports/sar', payload);
    expect(result).toEqual({ id: 'sar-1' });
  });

  it('should submitSarReport correctly', async () => {
    vi.mocked(ApiClient.post).mockResolvedValue({ success: true });
    await ApiService.submitSarReport('sar-1');
    expect(ApiClient.post).toHaveBeenCalledWith('/compliance/reports/sar-1/submit', {});
  });

  it('should getSwiftCompliance correctly', async () => {
    vi.mocked(ApiClient.get).mockResolvedValue([]);
    await ApiService.getSwiftCompliance();
    expect(ApiClient.get).toHaveBeenCalledWith(expect.stringContaining('/compliance/swift?t='));
  });

  it('should checkSanctions correctly', async () => {
    vi.mocked(ApiClient.post).mockResolvedValue({ hit: false });
    const payload = { name: 'Osama' };
    const result = await ApiService.checkSanctions(payload);
    expect(ApiClient.post).toHaveBeenCalledWith('/compliance/sanctions-check', payload);
    expect(result).toEqual({ hit: false });
  });

  it('should getPerformanceMetrics correctly', async () => {
    const mockMetrics = { totalRequests: 5, averageDurationMs: 12.3 };
    vi.mocked(ApiClient.get).mockResolvedValue(mockMetrics);
    const result = await ApiService.getPerformanceMetrics();
    expect(ApiClient.get).toHaveBeenCalledWith(expect.stringContaining('/performance/metrics?t='));
    expect(result).toEqual(mockMetrics);
  });
});
