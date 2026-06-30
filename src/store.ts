import { create } from 'zustand';
import { 
  UserAccount, 
  LedgerTransaction, 
  Agent, 
  CantonmentRecord, 
  BankGuarantee, 
  AuditLog, 
  KycLevel, 
  TransactionType,
  NavTab
} from './types';
import { ApiService } from './apiService';

interface AppState {
  // Navigation
  activeTab: NavTab;
  appMode: 'ADMIN' | 'USER';
  currentUser: UserAccount | null;

  // Backend state
  stats: any;
  accounts: UserAccount[];
  transactions: LedgerTransaction[];
  agents: Agent[];
  cantonment: CantonmentRecord[];
  guarantee: BankGuarantee | null;
  auditLogs: AuditLog[];
  commissionSettlements: any[];
  guaranteeRenewals: any[];
  loading: boolean;
  pendingComplianceCount: number;

  // Modals & Active Action States
  showOpenAccountModal: boolean;
  showTransactionModal: boolean;
  showAgentModal: boolean;
  showGuaranteeModal: boolean;
  showReconciliationModal: boolean;

  // KYC Selection for Video Interview & Document Review
  selectedKycAccount: UserAccount | null;
  showVisioModal: boolean;
  visioStep: 'IDLE' | 'CALLING' | 'CONNECTED' | 'APPROVED' | 'REJECTED';
  visioComments: string;
  citizenHoldingCard: boolean;

  // New Account Form State
  newAccForm: {
    name: string;
    email: string;
    phoneNumber: string;
    kycLevel: KycLevel;
    idCardNumber: string;
    documentUrl: string;
    idCardBackUrl: string;
    proofOfAddressUrl: string;
  };

  // Mobile sidebar state
  isSidebarOpen: boolean;

  // Agents sub tab state ('LIST' or 'REPOSITORY' or 'SETTLEMENTS')
  agentsSubTab: 'LIST' | 'REPOSITORY' | 'SETTLEMENTS';

  // Sandbox Transaction Form State
  txForm: {
    type: TransactionType;
    amount: string;
    senderIban: string;
    receiverIban: string;
    reference: string;
    otpCode: string;
    agentId: string;
  };

  // Agent Form State
  agentForm: {
    name: string;
    location: string;
    initialCashRegister: string;
    contractExpiryDate: string;
    contractFileName: string;
    contractFileUrl: string;
  };

  // Selected Agent for contract editing / repository detail
  selectedAgentForContract: Agent | null;
  showContractEditModal: boolean;
  contractEditForm: {
    contractExpiryDate: string;
    contractFileName: string;
    contractFileUrl: string;
    contractModificationDate: string;
    contractResiliationDate: string;
  };

  // Guarantee Form State
  guaranteeForm: {
    amount: string;
    expiryDate: string;
  };

  // Reconciliation Form State
  reconcileForm: {
    externalBalance: string;
  };

  // OTP Validation Helpers
  userOtpSecret: string;
  otpSentMessage: string;

  // AI OCR simulator states
  ocrScanning: boolean;
  ocrResult: any;
  ocrDocumentType: 'NATIONAL_ID' | 'PASSPORT';

  // UI Search filters
  accountSearch: string;
  txSearch: string;

  // Status Alerts/Notifications
  alertMsg: { type: 'success' | 'error'; text: string } | null;
}

interface AppActions {
  setActiveTab: (tab: NavTab) => void;
  setAppMode: (mode: 'ADMIN' | 'USER') => void;
  setCurrentUser: (user: UserAccount | null | ((current: UserAccount | null) => UserAccount | null)) => void;
  
  setStats: (stats: any) => void;
  setAccounts: (accounts: UserAccount[]) => void;
  setTransactions: (transactions: LedgerTransaction[]) => void;
  setAgents: (agents: Agent[]) => void;
  setCantonment: (cantonment: CantonmentRecord[]) => void;
  setGuarantee: (guarantee: BankGuarantee | null) => void;
  setAuditLogs: (auditLogs: AuditLog[]) => void;
  setCommissionSettlements: (settlements: any[]) => void;
  setGuaranteeRenewals: (renewals: any[]) => void;
  setLoading: (loading: boolean) => void;
  setPendingComplianceCount: (count: number) => void;

  setShowOpenAccountModal: (show: boolean) => void;
  setShowTransactionModal: (show: boolean) => void;
  setShowAgentModal: (show: boolean) => void;
  setShowGuaranteeModal: (show: boolean) => void;
  setShowReconciliationModal: (show: boolean) => void;

  setSelectedKycAccount: (account: UserAccount | null) => void;
  setShowVisioModal: (show: boolean) => void;
  setVisioStep: (step: 'IDLE' | 'CALLING' | 'CONNECTED' | 'APPROVED' | 'REJECTED') => void;
  setVisioComments: (comments: string) => void;
  setCitizenHoldingCard: (holding: boolean) => void;

  setNewAccForm: (form: Partial<AppState['newAccForm']> | ((current: AppState['newAccForm']) => AppState['newAccForm'])) => void;
  setIsSidebarOpen: (open: boolean) => void;
  setAgentsSubTab: (tab: 'LIST' | 'REPOSITORY' | 'SETTLEMENTS') => void;
  setTxForm: (form: Partial<AppState['txForm']> | ((current: AppState['txForm']) => AppState['txForm'])) => void;
  setAgentForm: (form: Partial<AppState['agentForm']> | ((current: AppState['agentForm']) => AppState['agentForm'])) => void;

  setSelectedAgentForContract: (agent: Agent | null) => void;
  setShowContractEditModal: (show: boolean) => void;
  setContractEditForm: (form: Partial<AppState['contractEditForm']> | ((current: AppState['contractEditForm']) => AppState['contractEditForm'])) => void;

  setGuaranteeForm: (form: Partial<AppState['guaranteeForm']> | ((current: AppState['guaranteeForm']) => AppState['guaranteeForm'])) => void;
  setReconcileForm: (form: Partial<AppState['reconcileForm']> | ((current: AppState['reconcileForm']) => AppState['reconcileForm'])) => void;

  setUserOtpSecret: (secret: string) => void;
  setOtpSentMessage: (message: string) => void;

  setOcrScanning: (scanning: boolean) => void;
  setOcrResult: (result: any) => void;
  setOcrDocumentType: (type: 'NATIONAL_ID' | 'PASSPORT') => void;

  setAccountSearch: (search: string) => void;
  setTxSearch: (search: string) => void;

  setAlertMsg: (msg: { type: 'success' | 'error'; text: string } | null) => void;
  showToast: (type: 'success' | 'error', text: string) => void;

  fetchData: (showLoadingSpinner?: boolean) => Promise<void>;
}

export const useAppStore = create<AppState & AppActions>((set, get) => ({
  // Navigation
  activeTab: 'DASHBOARD',
  appMode: 'ADMIN',
  currentUser: null,

  // Backend state
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

  // Modals & Active Action States
  showOpenAccountModal: false,
  showTransactionModal: false,
  showAgentModal: false,
  showGuaranteeModal: false,
  showReconciliationModal: false,

  // KYC Selection for Video Interview & Document Review
  selectedKycAccount: null,
  showVisioModal: false,
  visioStep: 'IDLE',
  visioComments: '',
  citizenHoldingCard: false,

  // New Account Form State
  newAccForm: {
    name: '',
    email: '',
    phoneNumber: '',
    kycLevel: 1,
    idCardNumber: '',
    documentUrl: '',
    idCardBackUrl: '',
    proofOfAddressUrl: ''
  },

  // Mobile sidebar state
  isSidebarOpen: false,

  // Agents sub tab state
  agentsSubTab: 'LIST',

  // Sandbox Transaction Form State
  txForm: {
    type: 'TRANSFER',
    amount: '',
    senderIban: '',
    receiverIban: '',
    reference: '',
    otpCode: '',
    agentId: ''
  },

  // Agent Form State
  agentForm: {
    name: '',
    location: '',
    initialCashRegister: '300000',
    contractExpiryDate: '2027-06-29',
    contractFileName: '',
    contractFileUrl: ''
  },

  // Selected Agent for contract editing / repository detail
  selectedAgentForContract: null,
  showContractEditModal: false,
  contractEditForm: {
    contractExpiryDate: '',
    contractFileName: '',
    contractFileUrl: '',
    contractModificationDate: '',
    contractResiliationDate: ''
  },

  // Guarantee Form State
  guaranteeForm: {
    amount: '50000000',
    expiryDate: '2026-09-15'
  },

  // Reconciliation Form State
  reconcileForm: {
    externalBalance: ''
  },

  // OTP Validation Helpers
  userOtpSecret: '',
  otpSentMessage: '',

  // AI OCR simulator states
  ocrScanning: false,
  ocrResult: null,
  ocrDocumentType: 'NATIONAL_ID',

  // UI Search filters
  accountSearch: '',
  txSearch: '',

  // Status Alerts/Notifications
  alertMsg: null,

  // Actions
  setActiveTab: (tab) => set({ activeTab: tab }),
  setAppMode: (mode) => set({ appMode: mode }),
  setCurrentUser: (user) => set((state) => ({
    currentUser: typeof user === 'function' ? user(state.currentUser) : user
  })),

  setStats: (stats) => set({ stats }),
  setAccounts: (accounts) => set({ accounts }),
  setTransactions: (transactions) => set({ transactions }),
  setAgents: (agents) => set({ agents }),
  setCantonment: (cantonment) => set({ cantonment }),
  setGuarantee: (guarantee) => set({ guarantee }),
  setAuditLogs: (auditLogs) => set({ auditLogs }),
  setCommissionSettlements: (commissionSettlements) => set({ commissionSettlements }),
  setGuaranteeRenewals: (guaranteeRenewals) => set({ guaranteeRenewals }),
  setLoading: (loading) => set({ loading }),
  setPendingComplianceCount: (pendingComplianceCount) => set({ pendingComplianceCount }),

  setShowOpenAccountModal: (showOpenAccountModal) => set({ showOpenAccountModal }),
  setShowTransactionModal: (showTransactionModal) => set({ showTransactionModal }),
  setShowAgentModal: (showAgentModal) => set({ showAgentModal }),
  setShowGuaranteeModal: (showGuaranteeModal) => set({ showGuaranteeModal }),
  setShowReconciliationModal: (showReconciliationModal) => set({ showReconciliationModal }),

  setSelectedKycAccount: (selectedKycAccount) => set({ selectedKycAccount }),
  setShowVisioModal: (showVisioModal) => set({ showVisioModal }),
  setVisioStep: (visioStep) => set({ visioStep }),
  setVisioComments: (visioComments) => set({ visioComments }),
  setCitizenHoldingCard: (citizenHoldingCard) => set({ citizenHoldingCard }),

  setNewAccForm: (form) => set((state) => ({
    newAccForm: typeof form === 'function' ? form(state.newAccForm) : { ...state.newAccForm, ...form }
  })),
  setIsSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
  setAgentsSubTab: (agentsSubTab) => set({ agentsSubTab }),
  setTxForm: (form) => set((state) => ({
    txForm: typeof form === 'function' ? form(state.txForm) : { ...state.txForm, ...form }
  })),
  setAgentForm: (form) => set((state) => ({
    agentForm: typeof form === 'function' ? form(state.agentForm) : { ...state.agentForm, ...form }
  })),

  setSelectedAgentForContract: (selectedAgentForContract) => set({ selectedAgentForContract }),
  setShowContractEditModal: (showContractEditModal) => set({ showContractEditModal }),
  setContractEditForm: (form) => set((state) => ({
    contractEditForm: typeof form === 'function' ? form(state.contractEditForm) : { ...state.contractEditForm, ...form }
  })),

  setGuaranteeForm: (form) => set((state) => ({
    guaranteeForm: typeof form === 'function' ? form(state.guaranteeForm) : { ...state.guaranteeForm, ...form }
  })),
  setReconcileForm: (form) => set((state) => ({
    reconcileForm: typeof form === 'function' ? form(state.reconcileForm) : { ...state.reconcileForm, ...form }
  })),

  setUserOtpSecret: (userOtpSecret) => set({ userOtpSecret }),
  setOtpSentMessage: (otpSentMessage) => set({ otpSentMessage }),

  setOcrScanning: (ocrScanning) => set({ ocrScanning }),
  setOcrResult: (ocrResult) => set({ ocrResult }),
  setOcrDocumentType: (ocrDocumentType) => set({ ocrDocumentType }),

  setAccountSearch: (accountSearch) => set({ accountSearch }),
  setTxSearch: (txSearch) => set({ txSearch }),

  setAlertMsg: (alertMsg) => set({ alertMsg }),
  showToast: (type, text) => {
    set({ alertMsg: { type, text } });
    setTimeout(() => {
      // Clear alert only if it matches current text to avoid racing conditions
      const current = get().alertMsg;
      if (current && current.text === text && current.type === type) {
        set({ alertMsg: null });
      }
    }, 6000);
  },

  fetchData: async (showLoadingSpinner = false) => {
    try {
      if (showLoadingSpinner) {
        set({ loading: true });
      }
      const [
        resStats,
        resAccounts,
        resTransactions,
        resAgents,
        resCantonment,
        resGuarantee,
        resAuditLogs,
        resSettlements,
        resRenewals
      ] = await Promise.all([
        ApiService.getStats(),
        ApiService.getAccounts(),
        ApiService.getTransactions(),
        ApiService.getAgents(),
        ApiService.getCantonment(),
        ApiService.getGuarantee(),
        ApiService.getAuditLogs(),
        ApiService.getCommissionSettlements(),
        ApiService.getGuaranteeRenewals()
      ]);

      set({
        stats: resStats,
        accounts: resAccounts,
        transactions: resTransactions,
        agents: resAgents,
        cantonment: resCantonment,
        guarantee: resGuarantee,
        auditLogs: resAuditLogs,
        commissionSettlements: resSettlements || [],
        guaranteeRenewals: resRenewals || []
      });

      // Get pending compliance counts
      try {
        const [resHeld, resMsig] = await Promise.all([
          ApiService.getHeldCompliance().catch(() => []),
          ApiService.getMultisigCompliance().catch(() => [])
        ]);
        const heldPending = Array.isArray(resHeld) ? resHeld.filter((h: any) => h.decision === 'PENDING').length : 0;
        const msigPending = Array.isArray(resMsig) ? resMsig.filter((m: any) => m.status === 'PENDING_APPROVAL').length : 0;
        set({ pendingComplianceCount: heldPending + msigPending });
      } catch (e) {
        set({ pendingComplianceCount: 0 });
      }

      // Sync active user dashboard balance & stats in real-time
      const currentUser = get().currentUser;
      if (currentUser) {
        const updated = resAccounts.find((a: any) => a.id === currentUser.id);
        if (updated) {
          set({ currentUser: updated });
        }
      }
    } catch (err) {
      console.error("Failed to load platform data:", err);
      if (showLoadingSpinner) {
        get().showToast('error', 'Error fetching real-time ledger data. Please check if the dev server is active.');
      }
    } finally {
      set({ loading: false });
    }
  }
}));
