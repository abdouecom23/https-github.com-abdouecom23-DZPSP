import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAppStore } from '../store';
import { ApiService } from '../apiService';

vi.mock('../apiService', () => {
  return {
    ApiService: {
      getStats: vi.fn(),
      getAccounts: vi.fn(),
      getTransactions: vi.fn(),
      getAgents: vi.fn(),
      getCantonment: vi.fn(),
      getGuarantee: vi.fn(),
      getAuditLogs: vi.fn(),
      getCommissionSettlements: vi.fn(),
      getGuaranteeRenewals: vi.fn(),
      getHeldCompliance: vi.fn(),
      getMultisigCompliance: vi.fn(),
    },
  };
});

describe('useAppStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state to initial
    useAppStore.setState({
      activeTab: 'DASHBOARD',
      appMode: 'ADMIN',
      currentUser: null,
      stats: null,
      accounts: [],
      transactions: [],
      agents: [],
      cantonment: [],
      guarantee: null,
      auditLogs: [],
      commissionSettlements: [],
      guaranteeRenewals: [],
      loading: true,
      pendingComplianceCount: 0,
      showOpenAccountModal: false,
      showTransactionModal: false,
      showAgentModal: false,
      showGuaranteeModal: false,
      showReconciliationModal: false,
      selectedKycAccount: null,
      showVisioModal: false,
      visioStep: 'IDLE',
      visioComments: '',
      citizenHoldingCard: false,
      newAccForm: {
        name: '',
        email: '',
        phoneNumber: '',
        kycLevel: 1,
        idCardNumber: '',
        documentUrl: '',
        idCardBackUrl: '',
        proofOfAddressUrl: '',
      },
      isSidebarOpen: false,
      agentsSubTab: 'LIST',
      txForm: {
        type: 'TRANSFER',
        amount: '',
        senderIban: '',
        receiverIban: '',
        reference: '',
        otpCode: '',
        agentId: '',
      },
      agentForm: {
        name: '',
        location: '',
        initialCashRegister: '300000',
        contractExpiryDate: '2027-06-29',
        contractFileName: '',
        contractFileUrl: '',
      },
      selectedAgentForContract: null,
      showContractEditModal: false,
      contractEditForm: {
        contractExpiryDate: '',
        contractFileName: '',
        contractFileUrl: '',
        contractModificationDate: '',
        contractResiliationDate: '',
      },
      guaranteeForm: {
        amount: '50000000',
        expiryDate: '2026-09-15',
      },
      reconcileForm: {
        externalBalance: '',
      },
      userOtpSecret: '',
      otpSentMessage: '',
      ocrScanning: false,
      ocrResult: null,
      ocrDocumentType: 'NATIONAL_ID',
      accountSearch: '',
      txSearch: '',
      alertMsg: null,
    });
  });

  it('should set active tab', () => {
    useAppStore.getState().setActiveTab('KYC');
    expect(useAppStore.getState().activeTab).toBe('KYC');
  });

  it('should set app mode', () => {
    useAppStore.getState().setAppMode('USER');
    expect(useAppStore.getState().appMode).toBe('USER');
  });

  it('should set current user', () => {
    const user = { id: 'acc-1', name: 'Sofiane', email: 'sof@sof.com', kycLevel: 1, kycStatus: 'ACTIVE' as const, balance: 1000, iban: 'DZ1', dailyDebitSum: 0, dailyDebitLimit: 10000, balanceCap: 10000, createdAt: '' };
    useAppStore.getState().setCurrentUser(user as any);
    expect(useAppStore.getState().currentUser).toEqual(user);
  });

  it('should merge new account form state', () => {
    useAppStore.getState().setNewAccForm({ name: 'test name' });
    expect(useAppStore.getState().newAccForm.name).toBe('test name');
    expect(useAppStore.getState().newAccForm.email).toBe('');
  });

  it('should merge transaction form state', () => {
    useAppStore.getState().setTxForm({ amount: '500' });
    expect(useAppStore.getState().txForm.amount).toBe('500');
    expect(useAppStore.getState().txForm.type).toBe('TRANSFER');
  });

  it('should set loading state', () => {
    useAppStore.getState().setLoading(false);
    expect(useAppStore.getState().loading).toBe(false);
  });

  it('should trigger toasts correctly', () => {
    vi.useFakeTimers();
    useAppStore.getState().showToast('success', 'Operations Completed');
    expect(useAppStore.getState().alertMsg).toEqual({ type: 'success', text: 'Operations Completed' });

    vi.advanceTimersByTime(6000);
    expect(useAppStore.getState().alertMsg).toBeNull();
    vi.useRealTimers();
  });

  it('should fetch all platform data and update state successfully', async () => {
    const mockStats = { volume: 10000 };
    const mockAccounts = [{ id: 'acc-1', balance: 5000 }];
    const mockTransactions = [{ reference: 'ref-1' }];
    const mockAgents = [{ id: 'agent-1' }];
    const mockCantonment = [{ id: 'cantonment-1' }];
    const mockGuarantee = { amount: 50000000 };
    const mockAuditLogs = [{ id: 'log-1' }];
    const mockSettlements = [{ id: 'set-1' }];
    const mockRenewals = [{ id: 'ren-1' }];
    const mockHeld = [{ decision: 'PENDING' }, { decision: 'APPROVED' }];
    const mockMsig = [{ status: 'PENDING_APPROVAL' }];

    vi.mocked(ApiService.getStats).mockResolvedValue(mockStats);
    vi.mocked(ApiService.getAccounts).mockResolvedValue(mockAccounts as any);
    vi.mocked(ApiService.getTransactions).mockResolvedValue(mockTransactions as any);
    vi.mocked(ApiService.getAgents).mockResolvedValue(mockAgents as any);
    vi.mocked(ApiService.getCantonment).mockResolvedValue(mockCantonment as any);
    vi.mocked(ApiService.getGuarantee).mockResolvedValue(mockGuarantee as any);
    vi.mocked(ApiService.getAuditLogs).mockResolvedValue(mockAuditLogs as any);
    vi.mocked(ApiService.getCommissionSettlements).mockResolvedValue(mockSettlements as any);
    vi.mocked(ApiService.getGuaranteeRenewals).mockResolvedValue(mockRenewals as any);
    vi.mocked(ApiService.getHeldCompliance).mockResolvedValue(mockHeld as any);
    vi.mocked(ApiService.getMultisigCompliance).mockResolvedValue(mockMsig as any);

    await useAppStore.getState().fetchData();

    expect(useAppStore.getState().stats).toEqual(mockStats);
    expect(useAppStore.getState().accounts).toEqual(mockAccounts);
    expect(useAppStore.getState().transactions).toEqual(mockTransactions);
    expect(useAppStore.getState().agents).toEqual(mockAgents);
    expect(useAppStore.getState().cantonment).toEqual(mockCantonment);
    expect(useAppStore.getState().guarantee).toEqual(mockGuarantee);
    expect(useAppStore.getState().auditLogs).toEqual(mockAuditLogs);
    expect(useAppStore.getState().commissionSettlements).toEqual(mockSettlements);
    expect(useAppStore.getState().guaranteeRenewals).toEqual(mockRenewals);
    expect(useAppStore.getState().pendingComplianceCount).toBe(2); // 1 PENDING held + 1 PENDING_APPROVAL msig
    expect(useAppStore.getState().loading).toBe(false);
  });
});
