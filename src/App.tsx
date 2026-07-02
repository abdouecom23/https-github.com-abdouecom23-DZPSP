import React, { useEffect, useState } from 'react';
import useDebounce from './hooks/useDebounce';
import Home from './pages/Home';
import Features from './pages/Features';
import Pricing from './pages/Pricing';
import Docs from './pages/Docs';
import Terms from './pages/Terms';
import Overview from './pages/dashboard/Overview';
import Transactions from './pages/dashboard/Transactions';
import Invoices from './pages/dashboard/Invoices';
import PaymentLinks from './pages/dashboard/PaymentLinks';
import KYB from './pages/dashboard/KYB';
import Settings from './pages/dashboard/Settings';
import SimulatedCheckout from './components/SimulatedCheckout';
import { useTranslation } from './hooks/useTranslation';
import FocusTrap from './components/FocusTrap';
import { useAppStore } from './store';
import { ApiService } from './apiService';
import {
  LayoutDashboard,
  FileSpreadsheet,
  UserCheck,
  Users,
  Scale,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Plus,
  Send,
  Building,
  Calendar,
  Lock,
  Search,
  CheckCircle,
  XCircle,
  Video,
  FileText,
  DollarSign,
  Smartphone,
  Globe,
  Clock,
  Eye,
  Camera,
  History,
  Shield,
  Menu,
  X,
  Upload,
  Download,
  Trash2,
  Sparkles
} from 'lucide-react';
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
  NavTab
} from './types';
import Sidebar from './components/Sidebar';
import UserView from './components/UserView';
import ComplianceView from './components/ComplianceView';
import LedgerTab from './components/LedgerTab';
import AuditsTab from './components/AuditsTab';
import PerformanceView from './components/PerformanceView';
import { ApiClient } from './apiClient';

export default function App() {
  // Sandbox multi-domain states
  const [activeDomain, setActiveDomain] = React.useState<'MARKETING' | 'MERCHANT' | 'CLIENT_WALLET' | 'ADMIN_CONSOLE'>('MARKETING');
  const [marketingPage, setMarketingPage] = React.useState<'HOME' | 'FEATURES' | 'PRICING' | 'DOCS' | 'TERMS'>('HOME');
  const [merchantPage, setMerchantPage] = React.useState<'OVERVIEW' | 'TRANSACTIONS' | 'INVOICES' | 'LINKS' | 'KYB' | 'SETTINGS'>('OVERVIEW');
  const [kybStatus, setKybStatus] = React.useState<'APPROVED' | 'PENDING' | 'REJECTED' | 'NOT_STARTED'>('NOT_STARTED');
  const [checkoutSession, setCheckoutSession] = React.useState<{
    amount: number;
    toName: string;
    ref: string;
    iban: string;
  } | null>(null);
  const [linksPrefill, setLinksPrefill] = React.useState<{
    amount?: number;
    ref?: string;
    email?: string;
    name?: string;
  } | null>(null);

  const { t, lang, setLang, isRtl } = useTranslation();

  const {
    activeTab, setActiveTab,
    appMode, setAppMode,
    currentUser, setCurrentUser,
    stats, setStats,
    accounts, setAccounts,
    transactions, setTransactions,
    agents, setAgents,
    cantonment, setCantonment,
    guarantee, setGuarantee,
    auditLogs, setAuditLogs,
    commissionSettlements, setCommissionSettlements,
    guaranteeRenewals, setGuaranteeRenewals,
    loading, setLoading,
    pendingComplianceCount, setPendingComplianceCount,
    showOpenAccountModal, setShowOpenAccountModal,
    showTransactionModal, setShowTransactionModal,
    showAgentModal, setShowAgentModal,
    showGuaranteeModal, setShowGuaranteeModal,
    showReconciliationModal, setShowReconciliationModal,
    selectedKycAccount, setSelectedKycAccount,
    showVisioModal, setShowVisioModal,
    visioStep, setVisioStep,
    visioComments, setVisioComments,
    citizenHoldingCard, setCitizenHoldingCard,
    newAccForm, setNewAccForm,
    isSidebarOpen, setIsSidebarOpen,
    agentsSubTab, setAgentsSubTab,
    txForm, setTxForm,
    agentForm, setAgentForm,
    selectedAgentForContract, setSelectedAgentForContract,
    showContractEditModal, setShowContractEditModal,
    contractEditForm, setContractEditForm,
    guaranteeForm, setGuaranteeForm,
    reconcileForm, setReconcileForm,
    userOtpSecret, setUserOtpSecret,
    otpSentMessage, setOtpSentMessage,
    ocrScanning, setOcrScanning,
    ocrResult, setOcrResult,
    ocrDocumentType, setOcrDocumentType,
    accountSearch, setAccountSearch,
    txSearch, setTxSearch,
    alertMsg, setAlertMsg,
    showToast,
    fetchData
  } = useAppStore();

  const [showReviewDocsModal, setShowReviewDocsModal] = useState(false);

  const debouncedAccountSearch = useDebounce(accountSearch, 250);
  const debouncedTxSearch = useDebounce(txSearch, 250);

  useEffect(() => {
    fetchData(true); // Show loading spinner on initial mount

    let ws: WebSocket | null = null;
    import('./apiClient').then(({ ApiClient }) => {
      ApiClient.getToken().then(token => {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        ws = new WebSocket(`${protocol}//${window.location.host}/api/ws?token=${token}`);
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'DATA_CHANGED') {
              fetchData(false);
            }
          } catch (e) {
            console.error("Failed to parse websocket message", e);
          }
        };

        ws.onclose = () => {
          console.warn("WebSocket closed");
        };
      });
    });

    const handleVisibilityChange = () => {
      if (!document.hidden) fetchData(false);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (ws) ws.close();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Auto-select first account as current user if none selected
  useEffect(() => {
    if (!currentUser && accounts.length > 0) {
      setCurrentUser(accounts[0]);
    }
  }, [currentUser, accounts, setCurrentUser]);

  // Pre-fill fields depending on selected transaction type
  useEffect(() => {
    if (txForm.senderIban) {
      const selectedAcc = accounts.find(a => a.iban === txForm.senderIban);
      if (selectedAcc) {
        // Fetch simulated OTP secret
        ApiService.getOtpSecret(selectedAcc.email)
          .then(data => {
            setUserOtpSecret(data.secret);
          })
          .catch(() => setUserOtpSecret('JBSWY3DPEHPK3PXP'));
      }
    }
  }, [txForm.senderIban, accounts]);

  // Handle Opening Account
  const handleOpenAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await ApiService.openAccount(newAccForm);

      showToast('success', `Account opened successfully for ${data.name}! Assigned IBAN: ${data.iban}`);
      setShowOpenAccountModal(false);
      // Reset
      setNewAccForm({
        name: '',
        email: '',
        phoneNumber: '',
        kycLevel: 1,
        idCardNumber: '',
        documentUrl: '',
        idCardBackUrl: '',
        proofOfAddressUrl: ''
      });
      fetchData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // Run AI OCR Simulator on sample document
  const triggerAIOcrSimulation = async (sampleType: 'DZ_NATIONAL_ID_SAMPLE' | 'DZ_PASSPORT_SAMPLE') => {
    setOcrScanning(true);
    try {
      const mockImgUrl = sampleType === 'DZ_NATIONAL_ID_SAMPLE' 
        ? 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=400&auto=format&fit=crop'
        : 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400&auto=format&fit=crop';

      const parsed = await ApiService.ocrExtract({ imageUrl: mockImgUrl });
      setOcrResult(parsed);

      // Pre-fill the open account form with OCR data
      setNewAccForm(prev => ({
        ...prev,
        name: parsed.name,
        idCardNumber: parsed.idCardNumber,
        documentUrl: mockImgUrl,
        kycLevel: 2 // Prompt high level KYC directly
      }));
      showToast('success', `AI OCR extraction complete! Prefilled credentials for ${parsed.name}.`);
    } catch (err: any) {
      showToast('error', 'AI OCR failed: ' + err.message);
    } finally {
      setOcrScanning(false);
    }
  };

  // Submit Transaction
  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await ApiService.executeTransaction({
        ...txForm,
        amount: Number(txForm.amount)
      });

      showToast('success', `Transaction success! Ref: ${data.reference}. Balance updated on Double-Entry Ledger.`);
      setShowTransactionModal(false);
      setTxForm({
        type: 'TRANSFER',
        amount: '',
        senderIban: '',
        receiverIban: '',
        reference: '',
        otpCode: '',
        agentId: ''
      });
      fetchData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // Submit Agent Registration
  const handleAgentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await ApiService.registerAgent({
        name: agentForm.name,
        location: agentForm.location,
        initialCashRegister: String(agentForm.initialCashRegister),
        contractExpiryDate: agentForm.contractExpiryDate,
        contractFileUrl: agentForm.contractFileUrl || '/contracts/mock-signed.pdf',
        contractFileName: agentForm.contractFileName || 'Article_20_Signed_Contract.pdf'
      });

      showToast('success', `Agent ${data.name} successfully onboarded under Article 20 mandates.`);
      setShowAgentModal(false);
      setAgentForm({ 
        name: '', 
        location: '', 
        initialCashRegister: '300000', 
        contractExpiryDate: '2027-06-29', 
        contractFileName: '', 
        contractFileUrl: '' 
      });
      fetchData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // Update Agent Contract Details
  const handleUpdateAgentContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgentForContract) return;
    try {
      await ApiService.updateAgentContract(selectedAgentForContract.id, {
        contractFileUrl: contractEditForm.contractFileUrl || '/contracts/mock-updated.pdf',
        contractFileName: contractEditForm.contractFileName || 'Article_20_Signed_Contract_Modified.pdf',
        contractExpiryDate: contractEditForm.contractExpiryDate,
        contractModificationDate: contractEditForm.contractModificationDate || new Date().toISOString().split('T')[0],
        contractResiliationDate: contractEditForm.contractResiliationDate || undefined
      });

      showToast('success', `Contract for agent ${selectedAgentForContract.name} successfully updated.`);
      setShowContractEditModal(false);
      setSelectedAgentForContract(null);
      fetchData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const openContractEdit = (agent: Agent) => {
    setSelectedAgentForContract(agent);
    setContractEditForm({
      contractExpiryDate: agent.contractExpiryDate || '2027-06-29',
      contractFileName: agent.contractFileName || 'Article_20_Signed_Contract.pdf',
      contractFileUrl: agent.contractFileUrl || '/contracts/mock-signed.pdf',
      contractModificationDate: agent.contractModificationDate || new Date().toISOString().split('T')[0],
      contractResiliationDate: agent.contractResiliationDate || ''
    });
    setShowContractEditModal(true);
  };

  const getContractExpiryStatus = (expiryDate?: string) => {
    if (!expiryDate) return { label: 'No Contract', color: 'text-slate-400 bg-slate-50 border-slate-200', remainingDays: null, level: 'info' };
    
    const baselineNow = import.meta.env.VITE_REPLAY_DATE ? new Date(String(import.meta.env.VITE_REPLAY_DATE)) : new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - baselineNow.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { label: 'Expired', color: 'text-rose-700 bg-rose-50 border-rose-200', remainingDays: diffDays, level: 'expired' };
    } else if (diffDays <= 15) {
      return { label: `Expiring Soon (${diffDays}d)`, color: 'text-amber-700 bg-amber-50 border-amber-200 animate-pulse', remainingDays: diffDays, level: 'warning' };
    } else {
      return { label: 'Valid', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', remainingDays: diffDays, level: 'valid' };
    }
  };

  // Toggle Agent Active Status
  const toggleAgentStatus = async (id: string, currentStatus: boolean) => {
    try {
      await ApiService.updateAgentStatus(id, { isActive: !currentStatus });
      showToast('success', `Agent operational status updated.`);
      fetchData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // --- Commission Settlements Actions ---
  const handleRequestCommissionPayout = async (agentId: string) => {
    try {
      await ApiService.requestCommission({ agentId, amount: 0 }); // 0 means request all
      showToast('success', `Commission payout requested successfully.`);
      fetchData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleApproveCommissionPayout = async (settlementId: string) => {
    try {
      await ApiService.approveCommission({ settlementId });
      showToast('success', `Commission payout approved.`);
      fetchData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handlePayCommissionPayout = async (settlementId: string, ref: string) => {
    try {
      await ApiService.payCommission({ settlementId, paymentReference: ref });
      showToast('success', `Commission payout successfully settled.`);
      fetchData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // --- KYC Appeals Exceptions Actions ---
  const handleRequestKycException = async (accountId: string, reason: string) => {
    try {
      await ApiService.requestKycException(accountId, { reason });
      showToast('success', `KYC supervisor review appeal submitted successfully.`);
      fetchData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleApproveKycException = async (accountId: string) => {
    try {
      await ApiService.approveKycException(accountId, { supervisorName: 'Chief Compliance Officer (Admin)' });
      showToast('success', `KYC bypass exception approved. Cooldown cleared!`);
      fetchData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // --- Guarantee Renewals Actions ---
  const handleRequestGuaranteeRenewal = async (amount: number, expiry: string) => {
    try {
      await ApiService.requestGuaranteeRenewal({ amount, expiryDate: expiry });
      showToast('success', `Guarantee renewal request submitted.`);
      fetchData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleApproveGuaranteeRenewal = async (renewalId: string) => {
    try {
      await ApiService.approveGuaranteeRenewal({ renewalId, bankOfficer: 'Bank of Algeria Officer' });
      showToast('success', `Guarantee renewal approved by bank officer.`);
      fetchData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleIssueGuaranteeRenewal = async (renewalId: string) => {
    try {
      await ApiService.issueGuaranteeRenewal({ renewalId });
      showToast('success', `Bank Guarantee renewed successfully! Platform active.`);
      fetchData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // Submit Safeguarding Balance Reconciliation
  const handleReconcileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await ApiService.reconcileCantonment({
        reconciledBy: 'H. Brahimi (Compliance Officer)',
        externalBalanceOverride: Number(reconcileForm.externalBalance)
      });

      if (data.status === 'MISMATCH') {
        showToast('error', `RECONCILIATION FAULT DETECTED: Variance of ${data.difference} DA between internal ledger and bank statement.`);
      } else {
        showToast('success', 'Perfect alignment! Safeguarding accounts reconcile flawlessly.');
      }
      setShowReconciliationModal(false);
      setReconcileForm({ externalBalance: '' });
      fetchData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // Submit Guarantee Updates
  const handleGuaranteeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiService.updateGuarantee({
        amount: Number(guaranteeForm.amount),
        expiryDate: guaranteeForm.expiryDate
      });
      showToast('success', 'Bank guarantee details refreshed in accordance with Bank of Algeria instructions.');
      setShowGuaranteeModal(false);
      fetchData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // Review & Approve/Reject User KYC
  const processKycReview = async (id: string, status: KycStatus) => {
    try {
      await ApiService.reviewKyc(id, {
        status,
        notes: visioComments || 'Standard operator compliance review'
      });
      showToast('success', `KYC review submitted. Account status set to ${status}.`);
      setShowVisioModal(false);
      setShowReviewDocsModal(false);
      setSelectedKycAccount(null);
      setVisioStep('IDLE');
      setVisioComments('');
      setCitizenHoldingCard(false);
      fetchData();
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // Launch Video Interview Room
  const startVideoConference = (acc: UserAccount) => {
    setSelectedKycAccount(acc);
    setVisioStep('CALLING');
    setShowVisioModal(true);

    // Simulate connecting
    setTimeout(() => {
      setVisioStep('CONNECTED');
    }, 2000);
  };

  // ISO 20022 Export Simulator (Generates real pain.001.001.03 compliant XML)
  const triggerISO20022Export = () => {
    const msgId = `DIF${Date.now()}`;
    const creDtTm = new Date().toISOString();
    const nbOfTxs = transactions.length;
    const ctrlSum = transactions.reduce((sum, t) => sum + t.amount, 0).toFixed(2);

    let txMarkup = '';
    transactions.forEach((t) => {
      txMarkup += `
      <CdtTrfTxInf>
        <PmtId>
          <EndToEndId>${t.id}</EndToEndId>
          <UETR>${t.id.replace('tx-', 'uetr-')}</UETR>
        </PmtId>
        <Amt>
          <InstdAmt Ccy="DZD">${t.amount.toFixed(2)}</InstdAmt>
        </Amt>
        <Dbtr>
          <Nm>${t.senderIban.includes('DZ54') ? 'Algerian Citizen Sender' : 'External Remitter'}</Nm>
        </Dbtr>
        <DbtrAcct>
          <Id>
            <IBAN>${t.senderIban.replace(/\s/g, '')}</IBAN>
          </Id>
        </DbtrAcct>
        <Cdtr>
          <Nm>${t.receiverIban.includes('DZ54') ? 'Algerian Citizen Receiver' : 'External Beneficiary'}</Nm>
        </Cdtr>
        <CdtrAcct>
          <Id>
            <IBAN>${t.receiverIban.replace(/\s/g, '')}</IBAN>
          </Id>
        </CdtrAcct>
        <RmtInf>
          <Ustrd>${t.reference || 'Interbank Settlement'}</Ustrd>
        </RmtInf>
      </CdtTrfTxInf>`;
    });

    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03">
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>${msgId}</MsgId>
      <CreDtTm>${creDtTm}</CreDtTm>
      <NbOfTxs>${nbOfTxs}</NbOfTxs>
      <CtrlSum>${ctrlSum}</CtrlSum>
      <InitgPty>
        <Nm>DinarFlow Algérie PSP</Nm>
      </InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>PMTINF-${Date.now()}</PmtInfId>
      <PmtMtd>TRF</PmtMtd>
      <ReqdExctnDt>${creDtTm.split('T')[0]}</ReqdExctnDt>
      <Dbtr>
        <Nm>DinarFlow Clearing Agent</Nm>
      </Dbtr>
      ${txMarkup}
    </PmtInf>
  </CstmrCdtTrfInitn>
</Document>`;

    const dataStr = "data:text/xml;charset=utf-8," + encodeURIComponent(xmlContent);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ISO_20022_pain_001_${new Date().toISOString().split('T')[0]}.xml`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast('success', 'ISO 20022 pain.001 XML payment report generated and downloaded successfully.');
  };

  // Filtered lists
  const filteredAccounts = accounts.filter(a => 
    a.name.toLowerCase().includes(debouncedAccountSearch.toLowerCase()) || 
    a.email.toLowerCase().includes(debouncedAccountSearch.toLowerCase()) ||
    a.iban.replace(/\s/g, '').includes(debouncedAccountSearch.replace(/\s/g, ''))
  );

  const filteredTransactions = transactions.filter(t => 
    (t.reference || '').toLowerCase().includes(debouncedTxSearch.toLowerCase()) ||
    (t.senderIban || '').includes(debouncedTxSearch) ||
    (t.receiverIban || '').includes(debouncedTxSearch)
  );

  // Get status class for badge
  const getKycStatusBadge = (status: KycStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-100 text-emerald-800 border border-emerald-300';
      case 'PENDING':
        return 'bg-amber-100 text-amber-800 border border-amber-300';
      case 'VISIO_PENDING':
        return 'bg-purple-100 text-purple-800 border border-purple-300';
      case 'REJECTED':
        return 'bg-rose-100 text-rose-800 border border-rose-300';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const currentCantonmentRecord = cantonment[0] || null;

  const renderOriginalApp = () => {
    return (
      <div className="flex h-full w-full overflow-hidden bg-slate-50 text-slate-800 font-sans" id="app_container">
      
      {/* Dynamic Toast Alert */}
      {alertMsg && (
        <div 
          id="toast_notification"
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl transition-all duration-300 transform translate-y-0 max-w-md border ${
            alertMsg.type === 'success' 
              ? 'bg-white border-emerald-200 text-emerald-900 shadow-emerald-100' 
              : 'bg-white border-rose-200 text-rose-900 shadow-rose-100'
          }`}
        >
          {alertMsg.type === 'success' ? (
            <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0" />
          ) : (
            <AlertTriangle className="w-6 h-6 text-rose-500 shrink-0" />
          )}
          <div>
            <h4 className="font-bold text-sm">{alertMsg.type === 'success' ? 'Operation Success' : 'Compliance Warning'}</h4>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{alertMsg.text}</p>
          </div>
          <button onClick={() => setAlertMsg(null)} className="text-slate-400 hover:text-slate-600 font-bold ml-2">×</button>
        </div>
      )}

      {appMode === 'USER' ? (
        <UserView 
          user={currentUser!} 
          transactions={transactions} 
          accounts={accounts}
          agents={agents}
          onRefresh={fetchData}
          setAppMode={setAppMode}
          setCurrentUser={setCurrentUser}
        />
      ) : (
        <>
          {/* Sidebar Layout */}
          <div className={`${isSidebarOpen ? 'fixed inset-0 z-50 flex' : 'hidden'} md:block md:static md:z-0 md:w-64 shrink-0 h-full`}>
             {/* Overlay for mobile */}
             <div className="md:hidden fixed inset-0 bg-black/50 -z-10" onClick={() => setIsSidebarOpen(false)} />
             <div className="relative z-10 h-full w-64 bg-slate-900 shadow-2xl md:shadow-none">
               <Sidebar 
                  activeTab={activeTab} 
                  setActiveTab={(tab) => {
                    setActiveTab(tab);
                    setIsSidebarOpen(false);
                  }}
                  kycPendingCount={accounts.filter(a => a.kycStatus === 'PENDING' || a.kycStatus === 'VISIO_PENDING').length} 
                  showMismatchWarning={currentCantonmentRecord?.status === 'MISMATCH'} 
                  pendingComplianceCount={pendingComplianceCount}
                />
             </div>
          </div>

          {/* Main View Area */}
          <main className="flex-1 flex flex-col overflow-hidden" id="main_content_area">
        
        {/* Global Operational Header */}
        <header className="bg-white border-b border-slate-200 px-4 md:px-8 flex flex-col md:flex-row md:h-16 items-start md:items-center justify-between shrink-0 py-4 md:py-0 gap-4 md:gap-0 z-10">
          <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto justify-between md:justify-start">
             <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden p-2 -ml-2 text-slate-600">
               {isSidebarOpen ? <X /> : <Menu />}
             </button>
            <h1 className="text-sm md:text-lg font-bold text-slate-800 flex items-center gap-2 truncate">
              System Status: 
              {guarantee?.status === 'EXPIRED' ? (
                <span className="text-rose-600 flex items-center gap-1 truncate">
                  <AlertTriangle className="w-4 h-4 shrink-0" /> <span className="hidden sm:inline">SUSPENDED (Guarantee Expired)</span>
                </span>
              ) : (
                <span className="text-emerald-600 flex items-center gap-1 truncate">
                  <CheckCircle className="w-4 h-4 shrink-0" /> <span className="hidden sm:inline">Operational</span>
                </span>
              )}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3 md:gap-6 w-full md:w-auto justify-between md:justify-end">
            <button 
              onClick={() => {
                setAppMode(appMode === 'ADMIN' ? 'USER' : 'ADMIN');
                if (appMode === 'ADMIN' && accounts.length > 0) setCurrentUser(accounts[0]);
              }} 
              className="text-[10px] md:text-xs font-bold bg-slate-200 text-slate-800 p-2 rounded hover:bg-slate-300 transition-all"
            >
              {appMode === 'ADMIN' ? 'USER VIEW' : 'ADMIN VIEW'}
            </button>
            <div className="text-right hidden xl:block">
              <p className="text-[10px] uppercase font-bold text-slate-400 leading-none">Cantonnement Status</p>
              {currentCantonmentRecord?.status === 'RECONCILED' ? (
                <p className="text-sm font-bold text-emerald-600">Reconciled (100% Matched)</p>
              ) : (
                <p className="text-sm font-bold text-rose-600 animate-pulse">Discrepancy Alarm</p>
              )}
            </div>
            
            <div className="h-8 w-px bg-slate-200 hidden md:block"></div>

            <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
              <button 
                id="btn_new_transaction"
                onClick={() => setShowTransactionModal(true)}
                className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 text-white px-3 md:px-4 py-2 rounded-lg text-[10px] md:text-sm font-bold flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-600/10 transition-all"
              >
                <Plus className="w-4 h-4 shrink-0" /> Execute Tx
              </button>
            </div>
          </div>
        </header>

        {/* View Router */}
        <div className="flex-1 relative overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8" id="scrolling_view_container">
          
          {loading && (
            <div className="absolute inset-0 bg-white/80 z-30 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
              <p className="text-sm text-slate-600 font-bold font-mono">Syncing double-entry ledger status...</p>
            </div>
          )}

          {activeTab === 'DASHBOARD' && (
            <div className="space-y-8" id="dashboard_tab">
              
              {/* Alert for expired/warning bank guarantee */}
              {guarantee && (guarantee.status === 'WARNING' || guarantee.status === 'EXPIRED') && (
                <div className={`p-4 rounded-xl border flex items-center justify-between ${
                  guarantee.status === 'EXPIRED' 
                    ? 'bg-rose-50 border-rose-200 text-rose-900' 
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}>
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-6 h-6 text-rose-500 animate-bounce" />
                    <div>
                      <h4 className="font-extrabold text-sm">
                        {guarantee.status === 'EXPIRED' ? 'CRITICAL BANK GUARANTEE EXPIRED' : 'BANK GUARANTEE EXPIRING SOON'}
                      </h4>
                      <p className="text-xs mt-0.5 text-slate-600 leading-relaxed">
                        Article 34 of the Bank of Algeria instructions mandates maintaining a bank guarantee. Current guarantee of {guarantee.amount.toLocaleString()} DA expires on {guarantee.expiryDate}.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Real-time Statistics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" id="dashboard_metrics_row">
                
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">User Liabilities</p>
                      <span className="p-2 bg-slate-100 rounded-lg text-slate-600"><DollarSign className="w-4 h-4" /></span>
                    </div>
                    <p className="text-2xl font-black mt-2 text-slate-900">
                      {(stats?.totalUserBalances || 0).toLocaleString()} <span className="text-xs font-normal text-slate-400">DA</span>
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-500 italic font-mono">
                    <span>Active deposits ledger</span>
                    <span>Live</span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Cantonment Balance</p>
                      <span className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><Shield className="w-4 h-4" /></span>
                    </div>
                    <p className="text-2xl font-black mt-2 text-indigo-600">
                      {(currentCantonmentRecord?.externalCantonmentBalance || 0).toLocaleString()} <span className="text-xs font-normal text-indigo-400">DA</span>
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-[10px] font-bold">
                    {currentCantonmentRecord?.status === 'RECONCILED' ? (
                      <span className="text-emerald-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> MATCHED</span>
                    ) : (
                      <span className="text-rose-600 flex items-center gap-1 animate-pulse"><AlertTriangle className="w-3 h-3" /> MISMATCH AT DIAL</span>
                    )}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Active Mandataires</p>
                      <span className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><Users className="w-4 h-4" /></span>
                    </div>
                    <p className="text-2xl font-black mt-2 text-slate-900">{stats?.totalUsers || 0}</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                    <span className="text-emerald-600 font-bold">+{stats?.pendingKYC || 0} Pending KYC</span>
                    <span>100% compliant</span>
                  </div>
                </div>

                <div className="bg-indigo-900 text-white p-6 rounded-xl border border-indigo-800 shadow-md flex flex-col justify-between relative overflow-hidden">
                  <div className="relative z-10">
                    <p className="text-xs font-bold text-indigo-300 uppercase tracking-wider font-mono">Active Bank Guarantee</p>
                    <p className="text-2xl font-black mt-2">
                      {(guarantee?.amount || 0).toLocaleString()} <span className="text-xs font-normal text-indigo-300">DA</span>
                    </p>
                  </div>
                  <div className="relative z-10 mt-4 pt-4 border-t border-indigo-800 flex justify-between items-center text-[10px]">
                    <span className="font-semibold uppercase tracking-wider bg-indigo-800 text-indigo-200 px-1.5 py-0.5 rounded">
                      Status: {guarantee?.status}
                    </span>
                    <button 
                      onClick={() => {
                        setGuaranteeForm({ amount: String(guarantee?.amount || ''), expiryDate: guarantee?.expiryDate || '' });
                        setShowGuaranteeModal(true);
                      }}
                      className="text-white font-bold underline hover:text-indigo-200"
                    >
                      Renew
                    </button>
                  </div>
                  <div className="absolute -bottom-6 -right-6 text-indigo-950 opacity-20">
                    <ShieldCheck className="w-24 h-24" />
                  </div>
                </div>

              </div>

              {/* Main Split Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Core Accounts Registry */}
                <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl flex flex-col shadow-sm" id="accounts_section">
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-base">User Accounts Registry</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Compliant Level 1-3 tiered Payment Accounts in Dinar Algérien (DA).</p>
                    </div>
                    <div className="flex gap-2">
                      <div className="relative w-64">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          placeholder="Search citizen name, email, IBAN..."
                          value={accountSearch}
                          onChange={(e) => setAccountSearch(e.target.value)}
                          className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                        />
                      </div>
                      <button 
                        onClick={() => setShowOpenAccountModal(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" /> Open Account
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                        <tr>
                          <th className="px-6 py-3">Citizen / IBAN</th>
                          <th className="px-6 py-3 text-center">Tier Level</th>
                          <th className="px-6 py-3 text-right">Balance (DA)</th>
                          <th className="px-6 py-3 text-center">Status</th>
                          <th className="px-6 py-3 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredAccounts.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center py-8 text-slate-400 text-xs">No payment accounts match search filters.</td>
                          </tr>
                        ) : (
                          filteredAccounts.map((acc) => (
                            <tr key={acc.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4">
                                <div>
                                  <button
                                    onClick={() => {
                                      setCurrentUser(acc);
                                      setAppMode('USER');
                                    }}
                                    className="text-sm font-bold text-slate-900 hover:text-indigo-600 hover:underline transition-colors focus:outline-none text-left block"
                                    title="Switch to this User View"
                                  >
                                    {acc.name}
                                  </button>
                                  <p className="text-xs text-slate-500 font-mono">{acc.email} • {acc.phoneNumber}</p>
                                  <p className="text-[10px] text-indigo-600 font-mono mt-1 font-semibold">{acc.iban}</p>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">
                                  Level {acc.kycLevel}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right font-mono font-bold text-slate-900 text-sm">
                                {acc.balance.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${getKycStatusBadge(acc.kycStatus)}`}>
                                  {acc.kycStatus === 'VISIO_PENDING' ? 'VISIO REQ' : acc.kycStatus}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => {
                                      setTxForm(prev => ({
                                        ...prev,
                                        senderIban: acc.iban,
                                        type: 'TRANSFER'
                                      }));
                                      setShowTransactionModal(true);
                                    }}
                                    disabled={acc.kycStatus !== 'ACTIVE'}
                                    className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                                      acc.kycStatus === 'ACTIVE'
                                        ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    }`}
                                  >
                                    Debit Account
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Compliance Sidebar */}
                <div className="lg:col-span-4 space-y-6 flex flex-col" id="dashboard_compliance_sidebar">
                  
                  {/* Real-time Limits Rule Tracker Card */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                    <h3 className="font-extrabold text-slate-800 text-sm mb-4 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-indigo-600" />
                      Tiered Balances &amp; Limit Rules
                    </h3>
                    <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                      Algerian Central Bank regulations enforce strict balance and debit limits per citizen:
                    </p>
                    <div className="space-y-4">
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="flex justify-between items-center text-xs font-extrabold">
                          <span className="text-slate-800">Level 1 (Basic)</span>
                          <span className="text-indigo-600">100,000 DA</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 leading-normal">Requires basic info validation. Daily out-limits capped at balance capacity.</p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="flex justify-between items-center text-xs font-extrabold">
                          <span className="text-slate-800">Level 2 (Verified)</span>
                          <span className="text-indigo-600">500,000 DA</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 leading-normal">Requires National ID scan review. Facilitates larger everyday transactions.</p>
                      </div>

                      <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                        <div className="flex justify-between items-center text-xs font-extrabold">
                          <span className="text-indigo-900">Level 3 (Premium)</span>
                          <span className="text-indigo-600">1,000,000 DA</span>
                        </div>
                        <p className="text-[10px] text-indigo-500 mt-1 leading-normal">Requires ID verification AND manual Live Visioconference. Strict KYC audit.</p>
                      </div>
                    </div>
                  </div>

                  {/* Operational Sandbox Shortcuts */}
                  <div className="bg-slate-900 text-slate-100 rounded-xl p-6 shadow-md relative overflow-hidden">
                    <h3 className="font-bold text-sm mb-3 uppercase tracking-wider text-slate-400 font-mono">Sandbox Operations Hub</h3>
                    <p className="text-xs text-slate-300 leading-relaxed mb-4">
                      Simulate regulatory events, trigger instant audits, or model inter-bank clearing cycles.
                    </p>
                    <div className="space-y-3">
                      <button 
                        onClick={() => {
                          setActiveTab('KYC');
                          triggerAIOcrSimulation('DZ_NATIONAL_ID_SAMPLE');
                        }}
                        className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-between transition-all"
                      >
                        <span className="flex items-center gap-1.5"><Camera className="w-3.5 h-3.5" /> Sample ID Card OCR Scan</span>
                        <span className="bg-indigo-600 text-[9px] px-1.5 py-0.5 rounded font-mono">AI Mode</span>
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

          {activeTab === 'LEDGER' && (
            <LedgerTab transactions={transactions} />
          )}

          {activeTab === 'KYC' && (
            <div className="space-y-8 animate-fadeIn" id="kyc_pipeline_tab">
              
              {/* OCR Scanner Tool Block */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-base">Regulatory AI OCR Scanner (Gemini 3.5 Flash)</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Automated citizen identification verification. Upload or select sample IDs to extract verified details.</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => triggerAIOcrSimulation('DZ_NATIONAL_ID_SAMPLE')}
                      disabled={ocrScanning}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {ocrScanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                      Scan Sample Algiers ID Card
                    </button>
                    <button 
                      onClick={() => triggerAIOcrSimulation('DZ_PASSPORT_SAMPLE')}
                      disabled={ocrScanning}
                      className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {ocrScanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                      Scan Sample Passport
                    </button>
                  </div>
                </div>

                {ocrScanning && (
                  <div className="p-8 border border-dashed border-indigo-200 bg-indigo-50/20 rounded-xl flex flex-col items-center justify-center gap-3">
                    <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
                    <p className="text-sm font-bold text-indigo-900">Calling Server-Side OCR Pipeline...</p>
                    <p className="text-xs text-slate-500">Gemini 3.5 is analyzing document structural geometry &amp; extracting compliance metadata...</p>
                  </div>
                )}

                {ocrResult && !ocrScanning && (
                  <div className="bg-slate-900 text-slate-100 p-6 rounded-xl border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-8 font-mono text-xs">
                    <div>
                      <h4 className="font-bold text-indigo-400 mb-3 text-sm flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" /> AI OCR Metadata Extracted
                      </h4>
                      <div className="space-y-2 text-slate-300">
                        <p><span className="text-slate-500 font-bold">FULL NAME:</span> {ocrResult.name}</p>
                        <p><span className="text-slate-500 font-bold">NATIONAL ID CARD:</span> {ocrResult.idCardNumber}</p>
                        <p><span className="text-slate-500 font-bold">DATE OF BIRTH:</span> {ocrResult.birthDate}</p>
                        <p><span className="text-slate-500 font-bold">NATIONALITY:</span> {ocrResult.nationality}</p>
                        <p><span className="text-slate-500 font-bold">OCR ENGINE SOURCE:</span> <span className="text-emerald-400 font-bold">{ocrResult.source}</span></p>
                      </div>
                    </div>
                    <div className="flex flex-col justify-between border-l border-slate-800 pl-8">
                      <div>
                        <span className="bg-indigo-600 text-white px-2 py-0.5 rounded text-[10px] font-bold">Action Prefilled</span>
                        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                          The values have been mapped directly into the registration buffer. Click the button to confirm Level 2 registration instantly.
                        </p>
                      </div>
                      <button
                        onClick={() => setShowOpenAccountModal(true)}
                        className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg text-center"
                      >
                        Open Pre-Filled Account
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Pending Approvals Table */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-base">KYC Queue (Manual Review)</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Citizens awaiting compliance evaluation, ID checks, or video interviews before activation.</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-3">Citizen Name</th>
                        <th className="px-6 py-3">Target Tier</th>
                        <th className="px-6 py-3">Scanned proof</th>
                        <th className="px-6 py-3">Verification Step Required</th>
                        <th className="px-6 py-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {accounts.filter(a => a.kycStatus === 'PENDING' || a.kycStatus === 'VISIO_PENDING').length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-12 text-slate-400 text-sm">Every account is fully verified. KYC queue is empty.</td>
                        </tr>
                      ) : (
                        accounts.filter(a => a.kycStatus === 'PENDING' || a.kycStatus === 'VISIO_PENDING').map((acc) => (
                          <tr key={acc.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div>
                                <p className="text-sm font-bold text-slate-900">{acc.name}</p>
                                <p className="text-xs text-slate-500 font-mono">{acc.email} • {acc.phoneNumber}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">
                                Level {acc.kycLevel}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col gap-1.5">
                                {acc.documentUrl && (
                                  <a href={acc.documentUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline flex items-center gap-1 font-medium">
                                    <Eye className="w-3.5 h-3.5 text-slate-400" /> ID Card (Front)
                                  </a>
                                )}
                                {acc.idCardBackUrl && (
                                  <a href={acc.idCardBackUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline flex items-center gap-1 font-medium">
                                    <Eye className="w-3.5 h-3.5 text-slate-400" /> ID Card (Back)
                                  </a>
                                )}
                                {acc.proofOfAddressUrl && (
                                  <a href={acc.proofOfAddressUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline flex items-center gap-1 font-medium">
                                    <Eye className="w-3.5 h-3.5 text-rose-400" /> Address Proof (PDF)
                                  </a>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {acc.kycStatus === 'VISIO_PENDING' ? (
                                <span className="text-purple-700 font-bold text-xs flex items-center gap-1">
                                  <Video className="w-3.5 h-3.5" /> Interactive Visioconference Interview
                                </span>
                              ) : (
                                <span className="text-amber-700 font-bold text-xs flex items-center gap-1">
                                  <FileSpreadsheet className="w-3.5 h-3.5" /> ID Doc &amp; Signature Review
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {acc.kycStatus === 'VISIO_PENDING' ? (
                                <button
                                  onClick={() => startVideoConference(acc)}
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg inline-flex items-center gap-1 shadow-sm"
                                >
                                  <Video className="w-3.5 h-3.5" /> Connect Call
                                </button>
                              ) : (
                                <div className="flex gap-2 justify-center">
                                  <button
                                    onClick={() => {
                                      setSelectedKycAccount(acc);
                                      setShowReviewDocsModal(true);
                                    }}
                                    className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg"
                                  >
                                    Review ID
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

              </div>

              {/* Supervisor Review Queue (Appeals / Exceptions) */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">KYC Exception Appeals &amp; Supervisor Bypass (Cooldown Gate)</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Under Bank of Algeria guidelines, rejected KYC applications trigger a 30-day cooldown period. Supervisors can review exception requests and bypass the cooldown gate.</p>
                </div>

                {/* Sub-section 1: Rejected accounts that can appeal */}
                <div className="mt-6 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Step 1: File an Exception Appeal (For Rejected Accounts)</h4>
                  <div className="overflow-x-auto border border-slate-100 rounded-lg">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                        <tr>
                          <th className="p-3">Rejected Account</th>
                          <th className="p-3">Rejected At</th>
                          <th className="p-3">Appeal Status</th>
                          <th className="p-3">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {accounts.filter(a => a.kycUpgradeRejected).length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-4 text-center py-8 text-slate-400">No accounts are currently under KYC cooldown rejection. To test this, you can click "Simulate KYC Rejection" inside the sandbox or on a citizen's profile.</td>
                          </tr>
                        ) : (
                          accounts.filter(a => a.kycUpgradeRejected).map(acc => (
                            <tr key={acc.id} className="hover:bg-slate-50/40">
                              <td className="p-3 font-semibold text-slate-800">
                                <div>
                                  <p className="font-bold">{acc.name}</p>
                                  <p className="text-[10px] text-slate-500 font-mono">{acc.email}</p>
                                </div>
                              </td>
                              <td className="p-3 text-slate-500 font-mono">{acc.kycRejectedAt ? new Date(acc.kycRejectedAt).toLocaleDateString() : 'N/A'}</td>
                              <td className="p-3">
                                {acc.kycEscalationStatus === 'ESCALATED_TO_SUPERVISOR' ? (
                                  <span className="bg-amber-100 text-amber-800 p-1 px-2 rounded font-bold text-[10px]">Escalated to Supervisor</span>
                                ) : (
                                  <span className="text-slate-400">No active appeal</span>
                                )}
                              </td>
                              <td className="p-3">
                                {acc.kycEscalationStatus !== 'ESCALATED_TO_SUPERVISOR' ? (
                                  <button
                                    onClick={() => {
                                      const reason = prompt(`Enter reason for supervisor exception appeal for ${acc.name}:`, "DinarFlow high-volume corporate partner exception bypass request");
                                      if (reason) handleRequestKycException(acc.id, reason);
                                    }}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-1 px-2.5 rounded text-[10px] transition-all"
                                  >
                                    Request Bypass Exception
                                  </button>
                                ) : (
                                  <span className="text-slate-400 text-[10px]">Pending Supervisor review</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Sub-section 2: Supervisor approval queue */}
                <div className="mt-8 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-indigo-600" /> Step 2: Supervisor Decision Board (Bypass Cooldown Gate)
                  </h4>
                  <div className="overflow-x-auto border border-slate-100 rounded-lg">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-indigo-50/50 text-slate-500 font-bold uppercase">
                        <tr>
                          <th className="p-3">Appealing Citizen</th>
                          <th className="p-3">Reason / Escalation Notes</th>
                          <th className="p-3">Decision</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {accounts.filter(a => a.kycEscalationStatus === 'ESCALATED_TO_SUPERVISOR').length === 0 ? (
                          <tr>
                            <td colSpan={3} className="p-4 text-center py-8 text-slate-400">No active exception appeals awaiting supervisor review. Escalated reviews appear here.</td>
                          </tr>
                        ) : (
                          accounts.filter(a => a.kycEscalationStatus === 'ESCALATED_TO_SUPERVISOR').map(acc => (
                            <tr key={acc.id} className="hover:bg-indigo-50/10">
                              <td className="p-3 font-semibold text-slate-800">{acc.name}</td>
                              <td className="p-3 text-slate-600 leading-relaxed italic">"{acc.kycEscalationNotes || 'No notes provided.'}"</td>
                              <td className="p-3">
                                <button
                                  onClick={() => handleApproveKycException(acc.id)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-1 px-3 rounded text-[10px] transition-all shadow-sm shadow-emerald-600/10"
                                >
                                  Approve &amp; Clear Cooldown
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'AGENTS' && (() => {
            const expiringSoonAgents = agents.filter(agent => {
              if (!agent.contractExpiryDate || agent.contractResiliationDate) return false;
              const baselineNow = import.meta.env.VITE_REPLAY_DATE ? new Date(String(import.meta.env.VITE_REPLAY_DATE)) : new Date();
              const expiry = new Date(agent.contractExpiryDate);
              const diffTime = expiry.getTime() - baselineNow.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              return diffDays >= 0 && diffDays <= 15;
            });

            return (
              <div className="space-y-8 animate-fadeIn" id="agents_tab">
                
                {/* 15 Days Automatic Notification Alert Banner */}
                {expiringSoonAgents.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 shadow-sm space-y-3" id="contract_expiration_notifications">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-amber-100 rounded-lg text-amber-800 shrink-0">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-extrabold text-amber-900 text-sm">Critical Compliance Alert: Expiring Agent Contracts (Article 20)</h4>
                        <p className="text-xs text-amber-700 mt-0.5">
                          The following agent contracts are expiring within the 15-day compliance threshold. Under Bank of Algeria rules, agents must renew their Article 20 mandates immediately to maintain active vault processing permissions.
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                      {expiringSoonAgents.map(agent => {
                        const expiry = new Date(agent.contractExpiryDate!);
                        const baselineNow = import.meta.env.VITE_REPLAY_DATE ? new Date(String(import.meta.env.VITE_REPLAY_DATE)) : new Date();
                        const diffDays = Math.ceil((expiry.getTime() - baselineNow.getTime()) / (1000 * 60 * 60 * 24));
                        return (
                          <div key={agent.id} className="bg-white border border-amber-200 rounded-xl p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-400 font-mono">ID: {agent.id}</span>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-mono animate-pulse">
                                  {diffDays} days left
                                </span>
                              </div>
                              <p className="text-sm font-extrabold text-slate-800 mt-1">{agent.name}</p>
                              <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Expiry: {agent.contractExpiryDate}
                              </p>
                            </div>
                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                              <span className="text-xs text-slate-400">Article 20 Compliance</span>
                              <button
                                onClick={() => openContractEdit(agent)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all"
                              >
                                <RefreshCw className="w-3 h-3" /> Renew Contract
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Sub-tab Navigation */}
                <div className="flex border-b border-slate-200">
                  <button
                    onClick={() => setAgentsSubTab('LIST')}
                    className={`px-5 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                      agentsSubTab === 'LIST'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Users className="w-4 h-4" /> Agent Outlets Directory
                  </button>
                  <button
                    onClick={() => setAgentsSubTab('REPOSITORY')}
                    className={`px-5 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                      agentsSubTab === 'REPOSITORY'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <FileText className="w-4 h-4" /> Signed Contracts Repository (Article 20)
                  </button>
                  <button
                    onClick={() => setAgentsSubTab('SETTLEMENTS')}
                    className={`px-5 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                      agentsSubTab === 'SETTLEMENTS'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <DollarSign className="w-4 h-4 text-emerald-600" /> Commission Settlement Directory
                  </button>
                </div>

                {agentsSubTab === 'LIST' ? (
                  <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
                    
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                      <div>
                        <h3 className="font-extrabold text-slate-800 text-base">Agents Network Management (Mandataires)</h3>
                        <p className="text-xs text-slate-500 mt-0.5">PSP licensed retail agents onboarding cash registers. Separated vault accounts enforced.</p>
                      </div>
                      <button
                        onClick={() => setShowAgentModal(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1 transition-all"
                      >
                        <Plus className="w-4 h-4" /> Add Agent Mandataire
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                          <tr>
                            <th className="px-6 py-3">Agent Name / Contract Code</th>
                            <th className="px-6 py-3">Headquarters Location</th>
                            <th className="px-6 py-3">Contract Info (Art 20)</th>
                            <th className="px-6 py-3">Multi-PSP Cash Separation</th>
                            <th className="px-6 py-3 text-right">Commission (DA)</th>
                            <th className="px-6 py-3 text-center">Status</th>
                            <th className="px-6 py-3 text-center">Operations Toggle</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {agents.map((agent) => {
                            const contractStatus = getContractExpiryStatus(agent.contractExpiryDate);
                            return (
                              <tr key={agent.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4">
                                  <div>
                                    <p className="text-sm font-bold text-slate-900">{agent.name}</p>
                                    <p className="text-xs text-slate-500 font-mono">ID: {agent.id} • Created: {agent.contractDate}</p>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-xs font-semibold text-slate-600">
                                  {agent.location}
                                </td>
                                <td className="px-6 py-4">
                                  <div className="space-y-1">
                                    {agent.contractFileName ? (
                                      <div className="flex items-center gap-1">
                                        <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                        <span className="text-xs font-medium text-slate-700 truncate max-w-[150px]">{agent.contractFileName}</span>
                                      </div>
                                    ) : (
                                      <span className="text-xs text-slate-400">No Document Uploaded</span>
                                    )}
                                    <div className="flex items-center gap-1.5">
                                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold border uppercase ${contractStatus.color}`}>
                                        {contractStatus.label}
                                      </span>
                                      {agent.contractExpiryDate && (
                                        <span className="text-[10px] text-slate-400 font-mono">Exp: {agent.contractExpiryDate}</span>
                                      )}
                                    </div>
                                    {agent.contractResiliationDate && (
                                      <p className="text-[9px] text-rose-600 font-bold bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded">Resiliated: {agent.contractResiliationDate}</p>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="space-y-1 font-mono text-xs">
                                    {Object.entries(agent.cashRegisters).map(([psp, bal]) => (
                                      <div key={psp} className="flex items-center gap-2">
                                        <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase">{psp} Register</span>
                                        <span className="font-bold text-slate-800">{bal.toLocaleString()} DA</span>
                                      </div>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-right font-mono font-bold text-emerald-600 text-xs">
                                  {agent.commissionBalance.toLocaleString()} DA
                                </td>
                                <td className="px-6 py-4 text-center">
                                  {agent.isActive ? (
                                    <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                                      Active
                                    </span>
                                  ) : (
                                    <span className="bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                                      {agent.contractResiliationDate ? 'Resiliated' : 'Suspended'}
                                    </span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => toggleAgentStatus(agent.id, agent.isActive)}
                                      disabled={!!agent.contractResiliationDate}
                                      className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border transition-all ${
                                        agent.contractResiliationDate
                                          ? 'border-slate-100 text-slate-300 bg-slate-50 cursor-not-allowed'
                                          : agent.isActive
                                          ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                                          : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                                      }`}
                                    >
                                      {agent.isActive ? 'Suspend' : 'Activate'}
                                    </button>
                                    <button
                                      onClick={() => openContractEdit(agent)}
                                      className="text-xs font-bold px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center gap-1 transition-all"
                                    >
                                      <FileText className="w-3.5 h-3.5 text-indigo-500" /> Manage Contract
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                  </div>
                ) : agentsSubTab === 'REPOSITORY' ? (
                  /* ============================================================= */
                  /* CENTRALIZED REPOSITORY: Signed Contracts (Article 20 Compliance) */
                  /* ============================================================= */
                  <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-6 animate-fadeIn" id="contracts_repository">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <div>
                        <h3 className="font-extrabold text-slate-800 text-base">Signed Mandate Contracts (Article 20 Repository)</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Centralized, unmodifiable record of signed partner agent agreements. Under Bank of Algeria regulations, separate accounts and physical contract uploads are mandated.</p>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-xs font-mono font-bold text-slate-600 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-500" />
                        Total Uploaded: {agents.filter(a => a.contractFileUrl).length} / {agents.length} Contracts
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {agents.map(agent => {
                        const contractStatus = getContractExpiryStatus(agent.contractExpiryDate);
                        return (
                          <div 
                            key={agent.id} 
                            className={`border rounded-xl p-5 hover:shadow-md transition-all flex flex-col justify-between ${
                              contractStatus.level === 'warning'
                                ? 'border-amber-200 bg-amber-50/20'
                                : contractStatus.level === 'expired' || agent.contractResiliationDate
                                ? 'border-rose-200 bg-rose-50/20'
                                : 'border-slate-200 bg-white'
                            }`}
                          >
                            <div className="space-y-4">
                              <div className="flex items-start justify-between">
                                <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                                  <FileText className={`w-6 h-6 ${
                                    agent.contractResiliationDate 
                                      ? 'text-slate-400' 
                                      : contractStatus.level === 'warning'
                                      ? 'text-amber-500 animate-pulse'
                                      : contractStatus.level === 'expired'
                                      ? 'text-rose-500'
                                      : 'text-indigo-600'
                                  }`} />
                                </div>
                                <div className="text-right">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border tracking-wider ${contractStatus.color}`}>
                                    {agent.contractResiliationDate ? 'Resiliated' : contractStatus.label}
                                  </span>
                                  <p className="text-[10px] text-slate-400 font-mono mt-1">ID: {agent.id}</p>
                                </div>
                              </div>

                              <div>
                                <h4 className="font-extrabold text-slate-800 text-sm leading-tight">{agent.name}</h4>
                                <p className="text-xs text-slate-500 truncate mt-1 flex items-center gap-1 font-mono">
                                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Date Signed: {agent.contractDate}
                                </p>
                              </div>

                              <div className="bg-slate-50/50 border border-slate-100 rounded-lg p-3 space-y-1.5 text-xs font-mono">
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Signed File:</span>
                                  {agent.contractFileName ? (
                                    <span className="text-slate-700 font-bold truncate max-w-[150px]">{agent.contractFileName}</span>
                                  ) : (
                                    <span className="text-rose-500 font-extrabold">Missing Signed Contract</span>
                                  )}
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Expiry Date:</span>
                                  <span className="text-slate-700 font-bold">{agent.contractExpiryDate || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Last Modified:</span>
                                  <span className="text-slate-700 font-semibold">{agent.contractModificationDate || agent.contractDate}</span>
                                </div>
                                {agent.contractResiliationDate && (
                                  <div className="flex justify-between text-rose-600 font-bold border-t border-rose-100 pt-1.5 mt-1">
                                    <span>Resiliated Date:</span>
                                    <span>{agent.contractResiliationDate}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="mt-5 pt-4 border-t border-slate-100 flex gap-2">
                              {agent.contractFileUrl ? (
                                <a
                                  href={agent.contractFileUrl}
                                  download
                                  onClick={(e) => {
                                    e.preventDefault();
                                    showToast('success', `Downloading Signed Copy: ${agent.contractFileName}`);
                                  }}
                                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1 transition-all border border-slate-200"
                                >
                                  <Download className="w-3.5 h-3.5" /> Download
                                </a>
                              ) : (
                                <div className="flex-1 bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-1.5 rounded-lg border border-amber-200 flex items-center justify-center gap-1">
                                  <span>⚠ Missing Contract</span>
                                </div>
                              )}
                              
                              <button
                                onClick={() => openContractEdit(agent)}
                                className="flex-1 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1 transition-all border border-slate-200"
                              >
                                <RefreshCw className="w-3.5 h-3.5 text-indigo-500" /> Manage Contract
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* ============================================================= */
                  /* COMMISSION SETTLEMENT DIRECTORY */
                  /* ============================================================= */
                  <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-6 animate-fadeIn" id="commission_settlements">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <div>
                        <h3 className="font-extrabold text-slate-800 text-base">Agent Commission Payout Directory</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Under Article 20, commissions are calculated as a percentage of agent transaction volumes. Payouts require supervisor approval before settlement.</p>
                      </div>
                    </div>

                    {/* Step 1: Agent side - Request payout */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Step 1: Outlets Accrued Commission &amp; Payout Triggers</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {agents.map(agent => (
                          <div key={agent.id} className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 flex items-center justify-between text-xs">
                            <div>
                              <p className="font-bold text-slate-800">{agent.name}</p>
                              <p className="text-[10px] text-slate-500">Accrued Commission: <span className="font-mono font-bold text-slate-700">{(agent.commissionBalance || 0).toLocaleString()} DA</span></p>
                            </div>
                            <button
                              onClick={() => handleRequestCommissionPayout(agent.id)}
                              disabled={(agent.commissionBalance || 0) <= 0}
                              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold p-1 px-3 rounded text-[10px] transition-all"
                            >
                              Request Payout
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Step 2: Admin/Supervisor side - Approvals and Settlements */}
                    <div className="space-y-3 pt-4 border-t border-slate-100">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600">Step 2: Settlement Requests &amp; Compliance Approvals</h4>
                      <div className="overflow-x-auto border border-slate-100 rounded-lg">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                            <tr>
                              <th className="p-3">Payout ID</th>
                              <th className="p-3">Agent</th>
                              <th className="p-3">Amount</th>
                              <th className="p-3">Status</th>
                              <th className="p-3">Approvals</th>
                              <th className="p-3 text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {commissionSettlements.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="p-4 text-center py-8 text-slate-400">No payout requests have been initiated. Accrue commissions by executing agent cash-in/cash-out transactions, then click "Request Payout" above.</td>
                              </tr>
                            ) : (
                              commissionSettlements.map((settlement: any) => {
                                const agent = agents.find(a => a.id === settlement.agentId);
                                return (
                                  <tr key={settlement.id} className="hover:bg-slate-50/50">
                                    <td className="p-3 font-mono text-[10px] text-slate-500">{settlement.id}</td>
                                    <td className="p-3 font-bold text-slate-800">{agent?.name || settlement.agentId}</td>
                                    <td className="p-3 font-mono font-bold text-slate-900">{settlement.amount.toLocaleString()} DA</td>
                                    <td className="p-3">
                                      <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border ${
                                        settlement.status === 'PAID'
                                          ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                          : settlement.status === 'APPROVED'
                                          ? 'text-indigo-700 bg-indigo-50 border-indigo-200'
                                          : 'text-amber-700 bg-amber-50 border-amber-200'
                                      }`}>
                                        {settlement.status}
                                      </span>
                                    </td>
                                    <td className="p-3 text-slate-600">
                                      <div>
                                        <p>Requested: {new Date(settlement.requestedAt).toLocaleDateString()}</p>
                                        {settlement.approvedAt && <p className="text-[10px] text-emerald-600 font-semibold">Approved by: {settlement.approvedBy}</p>}
                                        {settlement.paidAt && <p className="text-[10px] text-slate-500 font-mono">Ref: {settlement.paymentReference}</p>}
                                      </div>
                                    </td>
                                    <td className="p-3 text-center">
                                      <div className="flex gap-1 justify-center">
                                        {settlement.status === 'PENDING' && (
                                          <button
                                            onClick={() => handleApproveCommissionPayout(settlement.id)}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold p-1 px-2.5 rounded transition-all"
                                          >
                                            Approve Request
                                          </button>
                                        )}
                                        {settlement.status === 'APPROVED' && (
                                          <button
                                            onClick={() => {
                                              const ref = prompt(`Enter payment reference (e.g., Algiers Bank Transfer Ref):`, `FT-DZ-${Date.now().toString().slice(-6)}`);
                                              if (ref) handlePayCommissionPayout(settlement.id, ref);
                                            }}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold p-1 px-2.5 rounded transition-all"
                                          >
                                            Settle Payout (Pay)
                                          </button>
                                        )}
                                        {settlement.status === 'PAID' && (
                                          <span className="text-slate-400 text-[10px]">Fully Settled</span>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            );
          })()}

          {activeTab === 'RECONCILIATION' && (
            <div className="space-y-8 animate-fadeIn" id="reconciliation_tab">
              
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-base">Safeguarding ("Cantonnement") Reconciliation</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Verify that user asset liabilities match the external bank account balance. Required by Article 12 for daily compliance reporting.
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowReconciliationModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg"
                  >
                    Post External Statement Balance
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Total System Liabilities</p>
                    <p className="text-xl font-bold mt-1 text-slate-900">
                      {(stats?.totalLiabilities || 0).toLocaleString()} <span className="text-xs text-slate-400">DA</span>
                    </p>
                  </div>
                  <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 text-center">
                    <p className="text-[10px] font-bold text-indigo-400 uppercase font-mono">Safeguarded Balance (Cantonnement)</p>
                    <p className="text-xl font-bold mt-1 text-indigo-900">
                      {(currentCantonmentRecord?.externalCantonmentBalance || 0).toLocaleString()} <span className="text-xs text-indigo-400">DA</span>
                    </p>
                  </div>
                  <div className={`p-4 rounded-xl border text-center ${
                    currentCantonmentRecord?.difference === 0 
                      ? 'bg-emerald-50 border-emerald-100' 
                      : 'bg-rose-50 border-rose-100'
                  }`}>
                    <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Ledger Variance</p>
                    <p className={`text-xl font-bold mt-1 ${
                      currentCantonmentRecord?.difference === 0 ? 'text-emerald-700' : 'text-rose-700 animate-pulse'
                    }`}>
                      {(currentCantonmentRecord?.difference || 0).toLocaleString()} <span className="text-xs">DA</span>
                    </p>
                  </div>
                </div>

                <h4 className="font-extrabold text-slate-800 text-sm mb-4">Historical Daily Sync Reports</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse font-mono text-xs">
                    <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-3">Timestamp</th>
                        <th className="px-6 py-3">Total Internal (DA)</th>
                        <th className="px-6 py-3">External Bank (DA)</th>
                        <th className="px-6 py-3">Discrepancy (DA)</th>
                        <th className="px-6 py-3 text-center">Reconciliation Status</th>
                        <th className="px-6 py-3">Audited By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {cantonment.map((rec) => (
                        <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-3 text-slate-500">{new Date(rec.timestamp).toLocaleString()}</td>
                          <td className="px-6 py-3 font-bold text-slate-950">{rec.userBalancesSum.toLocaleString()}</td>
                          <td className="px-6 py-3 text-indigo-600 font-bold">{rec.externalCantonmentBalance.toLocaleString()}</td>
                          <td className={`px-6 py-3 font-bold ${rec.difference === 0 ? 'text-slate-400' : 'text-rose-600 font-black animate-pulse'}`}>
                            {rec.difference.toLocaleString()}
                          </td>
                          <td className="px-6 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              rec.status === 'RECONCILED' 
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}>
                              {rec.status}
                            </span>
                          </td>
                          <td className="px-6 py-3 font-sans text-slate-600">{rec.reconciledBy}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>

              {/* Bank Guarantee Renewal Management Board (Article 34) */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-base">Bank Guarantee Renewal Hub (Article 34 Compliance)</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Bank of Algeria regulations require a valid bank guarantee. If the guarantee expires, outbound transactions are blocked. Initiate renewal procedures here.
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      const amountStr = prompt("Enter bank guarantee renewal amount (DA):", "50000000");
                      const expiryStr = prompt("Enter new guarantee expiry date (YYYY-MM-DD):", "2027-06-29");
                      if (amountStr && expiryStr) {
                        handleRequestGuaranteeRenewal(Number(amountStr), expiryStr);
                      }
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all"
                  >
                    <Plus className="w-4 h-4" /> Request Guarantee Renewal
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-100 rounded-lg text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                      <tr>
                        <th className="p-3">Renewal ID</th>
                        <th className="p-3">Target Amount</th>
                        <th className="p-3">New Expiry Date</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Signatures / Proof</th>
                        <th className="p-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {guaranteeRenewals.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-slate-400 py-8">No bank guarantee renewal requests are currently on file. Click "Request Guarantee Renewal" above to file.</td>
                        </tr>
                      ) : (
                        guaranteeRenewals.map((renewal: any) => (
                          <tr key={renewal.id} className="hover:bg-slate-50/50">
                            <td className="p-3 font-mono text-slate-500">{renewal.id}</td>
                            <td className="p-3 font-bold text-slate-900">{renewal.amount.toLocaleString()} DA</td>
                            <td className="p-3 font-mono">{renewal.expiryDate}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border ${
                                renewal.status === 'ISSUED'
                                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                  : renewal.status === 'APPROVED'
                                  ? 'text-indigo-700 bg-indigo-50 border-indigo-200 font-bold animate-pulse'
                                  : 'text-amber-700 bg-amber-50 border-amber-200'
                              }`}>
                                {renewal.status}
                              </span>
                            </td>
                            <td className="p-3 text-slate-600 space-y-0.5">
                              <p>Initiated: {new Date(renewal.requestedAt).toLocaleDateString()}</p>
                              {renewal.approvedAt && <p className="text-[10px] text-emerald-600 font-semibold">Approved by: {renewal.approvedBy}</p>}
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex gap-1 justify-center">
                                {renewal.status === 'PENDING' && (
                                  <button
                                    onClick={() => handleApproveGuaranteeRenewal(renewal.id)}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-1 px-2.5 rounded text-[10px] transition-all"
                                  >
                                    Approve (Bank Officer)
                                  </button>
                                )}
                                {renewal.status === 'APPROVED' && (
                                  <button
                                    onClick={() => handleIssueGuaranteeRenewal(renewal.id)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-1 px-2.5 rounded text-[10px] transition-all shadow-sm shadow-emerald-600/10"
                                  >
                                    Issue Renewal
                                  </button>
                                )}
                                {renewal.status === 'ISSUED' && (
                                  <span className="text-slate-400 text-[10px]">Successfully Issued &amp; Active</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'AUDITS' && (
            <AuditsTab auditLogs={auditLogs} />
          )}

          {activeTab === 'COMPLIANCE' && (
            <ComplianceView 
              accounts={accounts}
              transactions={transactions}
              onRefreshAll={() => fetchData(false)}
            />
          )}

          {activeTab === 'PERFORMANCE' && (
            <PerformanceView />
          )}

        </div>

      </main>
        </>
      )}

      {/* MODAL: Open Account Form */}
      {showOpenAccountModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-40 flex items-center justify-center p-4 backdrop-blur-sm" id="open_account_modal">
          <FocusTrap onClose={() => setShowOpenAccountModal(false)} className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base" id="modal-title">Register Citizen Payment Account</h3>
                <p className="text-[10px] text-slate-400">Strict Single-Account rule (Bank of Algeria Article 12) verified.</p>
              </div>
              <button aria-label="Close" onClick={() => setShowOpenAccountModal(false)} className="text-slate-400 hover:text-white font-bold text-lg">×</button>
            </div>

            <form onSubmit={handleOpenAccountSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[500px]">
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs text-slate-600 mb-2">
                <span className="font-bold text-slate-900 block mb-1">AI Assist tip:</span>
                You can run the AI OCR Scanner in the <span className="font-bold">KYC Review Pipeline</span> tab to extract and prefill these details instantly.
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Full Citizen Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mourad Chibane"
                  value={newAccForm.name}
                  onChange={(e) => setNewAccForm({...newAccForm, name: e.target.value})}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="mourad@gmail.com"
                    value={newAccForm.email}
                    onChange={(e) => setNewAccForm({...newAccForm, email: e.target.value})}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Phone (Algeria)</label>
                  <input
                    type="tel"
                    required
                    placeholder="0550XXXXXX"
                    value={newAccForm.phoneNumber}
                    onChange={(e) => setNewAccForm({...newAccForm, phoneNumber: e.target.value})}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Target Account Tier</label>
                <select
                  value={newAccForm.kycLevel}
                  onChange={(e) => setNewAccForm({...newAccForm, kycLevel: Number(e.target.value) as KycLevel})}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-indigo-500"
                >
                  <option value={1}>Level 1 (Basic / 100,000 DA Cap)</option>
                  <option value={2}>Level 2 (Verified / 500,000 DA Cap)</option>
                  <option value={3}>Level 3 (Visioconference / 1,000,000 DA Cap)</option>
                </select>
              </div>

              {newAccForm.kycLevel > 1 && (
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">National Identity Number (NIN)</label>
                    <input
                      type="text"
                      required={newAccForm.kycLevel > 1}
                      placeholder="e.g. 1098273419"
                      value={newAccForm.idCardNumber}
                      onChange={(e) => setNewAccForm({...newAccForm, idCardNumber: e.target.value})}
                      className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {/* ID Card Front */}
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">ID Card Scan (Front Side) <span className="text-rose-500">*</span></label>
                        <div className="flex flex-col gap-1.5">
                          <input
                            type="file"
                            id="reg-id-front"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setNewAccForm(p => ({
                                  ...p,
                                  documentUrl: URL.createObjectURL(file)
                                }));
                              }
                            }}
                          />
                          <label htmlFor="reg-id-front" className="border border-dashed border-slate-300 rounded-lg p-2 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-50">
                            <span className="text-slate-600 truncate">{newAccForm.documentUrl ? "Image Loaded" : "Upload Front Side"}</span>
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">Browse</span>
                          </label>
                          <input
                            type="text"
                            placeholder="Or enter front image URL..."
                            value={newAccForm.documentUrl}
                            onChange={(e) => setNewAccForm({...newAccForm, documentUrl: e.target.value})}
                            className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      {/* ID Card Back */}
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">ID Card Scan (Back Side) <span className="text-rose-500">*</span></label>
                        <div className="flex flex-col gap-1.5">
                          <input
                            type="file"
                            id="reg-id-back"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setNewAccForm(p => ({
                                  ...p,
                                  idCardBackUrl: URL.createObjectURL(file)
                                }));
                              }
                            }}
                          />
                          <label htmlFor="reg-id-back" className="border border-dashed border-slate-300 rounded-lg p-2 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-50">
                            <span className="text-slate-600 truncate">{newAccForm.idCardBackUrl ? "Image Loaded" : "Upload Back Side"}</span>
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">Browse</span>
                          </label>
                          <input
                            type="text"
                            placeholder="Or enter back image URL..."
                            value={newAccForm.idCardBackUrl}
                            onChange={(e) => setNewAccForm({...newAccForm, idCardBackUrl: e.target.value})}
                            className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Address Proof PDF */}
                    {newAccForm.kycLevel === 3 && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <label className="block text-xs font-bold uppercase text-rose-600 mb-1">Address Proof Document (PDF required) <span className="text-rose-500">*</span></label>
                        <div className="flex flex-col gap-2 mt-1.5">
                          <input
                            type="file"
                            id="reg-address-pdf"
                            accept=".pdf"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
                                  alert("Error: Address proof must be a PDF file.");
                                  return;
                                }
                                setNewAccForm(p => ({
                                  ...p,
                                  proofOfAddressUrl: URL.createObjectURL(file)
                                }));
                              }
                            }}
                          />
                          <label htmlFor="reg-address-pdf" className="border-2 border-dashed border-slate-200 bg-white rounded-lg p-3 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-100">
                            <span className="text-slate-600 font-medium">{newAccForm.proofOfAddressUrl ? "PDF File Loaded" : "Upload Proof of Address PDF"}</span>
                            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded">Choose PDF</span>
                          </label>
                          <input
                            type="text"
                            placeholder="Or enter PDF Document URL..."
                            value={newAccForm.proofOfAddressUrl}
                            onChange={(e) => setNewAccForm({...newAccForm, proofOfAddressUrl: e.target.value})}
                            className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    )}

                    {/* Pre-fill Simulator buttons for faster demo/review */}
                    <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2">
                      <span>Propose biometric match and PDF proof</span>
                      <button
                        type="button"
                        onClick={() => {
                          setNewAccForm(p => ({
                            ...p,
                            documentUrl: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=400&auto=format&fit=crop',
                            idCardBackUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=400&auto=format&fit=crop',
                            proofOfAddressUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
                          }));
                        }}
                        className="text-indigo-600 hover:underline font-bold"
                      >
                        ⚡ Simuler les documents d'identité
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowOpenAccountModal(false)}
                  className="px-4 py-2 text-sm text-slate-500 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-6 py-2 rounded-lg"
                >
                  Open Ledger Account
                </button>
              </div>

            </form>
          </FocusTrap>
        </div>
      )}

      {/* MODAL: Execute Transaction */}
      {showTransactionModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-40 flex items-center justify-center p-4 backdrop-blur-sm" id="transaction_modal">
          <FocusTrap onClose={() => setShowTransactionModal(false)} className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base" id="modal-title">Compliance-Proof Sandbox Transaction</h3>
                <p className="text-[10px] text-slate-400">Ledger-level validation check against daily debit limits and tier limits.</p>
              </div>
              <button aria-label="Close" onClick={() => setShowTransactionModal(false)} className="text-slate-400 hover:text-white font-bold text-lg">×</button>
            </div>

            <form onSubmit={handleTransactionSubmit} className="p-6 space-y-4">
              
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Transaction Type</label>
                <select
                  value={txForm.type}
                  onChange={(e) => setTxForm({...txForm, type: e.target.value as TransactionType, agentId: ''})}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-indigo-500"
                >
                  <option value="TRANSFER">P2P Bank Transfer (0.5% Fee)</option>
                  <option value="CASH_IN">Manual Direct Cash Deposit (No Fee)</option>
                  <option value="CASH_OUT">Direct Cash Withdrawal (SCA 2FA Required)</option>
                  <option value="AGENT_CASH_IN">Agent Cash-In (Article 20 Separation)</option>
                  <option value="AGENT_CASH_OUT">Agent Cash-Out (Article 20 Separation)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Sender IBAN</label>
                  <select
                    value={txForm.senderIban}
                    onChange={(e) => setTxForm({...txForm, senderIban: e.target.value})}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-indigo-500 font-mono"
                  >
                    <option value="">-- Choose Sender Account --</option>
                    <option value="EXTERNAL_CASH">External Bank Statement Cash Reserve</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.iban}>{acc.name} ({acc.balance.toLocaleString()} DA)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Recipient IBAN</label>
                  <select
                    value={txForm.receiverIban}
                    onChange={(e) => setTxForm({...txForm, receiverIban: e.target.value})}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-indigo-500 font-mono"
                  >
                    <option value="">-- Choose Recipient Account --</option>
                    <option value="EXTERNAL_CASH">External Bank Statement Cash Reserve</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.iban}>{acc.name} ({acc.balance.toLocaleString()} DA)</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Amount (Dinar Algérien)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 25000"
                    value={txForm.amount}
                    onChange={(e) => setTxForm({...txForm, amount: e.target.value})}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Memo / Purpose Reference</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MONTHLY-RENT"
                    value={txForm.reference}
                    onChange={(e) => setTxForm({...txForm, reference: e.target.value})}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {txForm.type.includes('AGENT_') && (
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Performing Mandataire Agent</label>
                  <select
                    value={txForm.agentId}
                    onChange={(e) => setTxForm({...txForm, agentId: e.target.value})}
                    required={txForm.type.includes('AGENT_')}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Select Agent Point --</option>
                    {agents.map(a => (
                      <option key={a.id} value={a.id} disabled={!a.isActive}>{a.name} ({a.isActive ? 'Active' : 'Suspended'})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Strong Customer Authentication Multi-factor validator */}
              {(txForm.type === 'TRANSFER' || txForm.type === 'CASH_OUT' || txForm.type === 'AGENT_CASH_OUT') && txForm.senderIban && txForm.senderIban !== 'EXTERNAL_CASH' && (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
                  <span className="text-xs font-bold text-amber-900 block flex items-center gap-1">
                    <Lock className="w-4 h-4 text-amber-600" /> Strong Customer Authentication (SCA 2FA) Mandated
                  </span>
                  <p className="text-[10px] text-slate-600 leading-normal">
                    Article 22 compliance requires multi-factor confirmation for active de-credits. 
                    Simulated citizen seed Authenticator Secret: <span className="font-mono font-bold text-slate-800">{userOtpSecret || 'JBSWY3DPEHPK3PXP'}</span>.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter 6-digit verification OTP (e.g. 123456)"
                      value={txForm.otpCode}
                      onChange={(e) => setTxForm({...txForm, otpCode: e.target.value})}
                      required
                      maxLength={6}
                      className="flex-1 text-sm border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setTxForm({...txForm, otpCode: String(100000 + Math.floor(Math.random() * 899999))});
                        showToast('success', 'Citizens mobile device generated OTP token.');
                      }}
                      className="bg-indigo-600 text-white font-bold px-3 py-2 rounded-lg text-xs"
                    >
                      Receive App Token
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTransactionModal(false)}
                  className="px-4 py-2 text-sm text-slate-500 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-6 py-2 rounded-lg"
                >
                  Verify &amp; Commit Ledger
                </button>
              </div>

            </form>
          </FocusTrap>
        </div>
      )}

      {/* MODAL: Add Agent Mandataire */}
      {showAgentModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-40 flex items-center justify-center p-4 backdrop-blur-sm" id="agent_modal">
          <FocusTrap onClose={() => setShowAgentModal(false)} className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base" id="modal-title">Onboard Authorized Agent</h3>
                <p className="text-[10px] text-slate-400">Legally separates multi-PSP customer vaults dynamically.</p>
              </div>
              <button aria-label="Close" onClick={() => setShowAgentModal(false)} className="text-slate-400 hover:text-white font-bold text-lg">×</button>
            </div>

            <form onSubmit={handleAgentSubmit} className="p-6 space-y-4">
              
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Agent Outlet Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Algiers Retail Cash Point"
                  value={agentForm.name}
                  onChange={(e) => setAgentForm({...agentForm, name: e.target.value})}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Physical Address</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 45 Rue Didouche Mourad, Alger"
                  value={agentForm.location}
                  onChange={(e) => setAgentForm({...agentForm, location: e.target.value})}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Initial Cash Register Allocation (DA)</label>
                <input
                  type="number"
                  required
                  placeholder="300000"
                  value={agentForm.initialCashRegister}
                  onChange={(e) => setAgentForm({...agentForm, initialCashRegister: e.target.value})}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Article 20 Contract Expiry Date</label>
                <input
                  type="date"
                  required
                  value={agentForm.contractExpiryDate}
                  onChange={(e) => setAgentForm({...agentForm, contractExpiryDate: e.target.value})}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">Under Article 20, mandates must be renewed annually. Compliance notifications begin 15 days before.</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Signed Contract PDF (Upload Simulation)</label>
                <div className="border-2 border-dashed border-slate-200 rounded-lg p-3 text-center hover:bg-slate-50 transition-colors relative cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setAgentForm({
                          ...agentForm,
                          contractFileName: file.name,
                          contractFileUrl: `/contracts/uploaded-${encodeURIComponent(file.name)}`
                        });
                        showToast('success', `Simulated Upload of ${file.name}`);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-1">
                    <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                    <p className="text-[11px] font-bold text-slate-700">
                      {agentForm.contractFileName ? `Ready: ${agentForm.contractFileName}` : 'Drag & drop or click to upload PDF'}
                    </p>
                    <p className="text-[9px] text-slate-400">Article 20 signed mandate contract PDF</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAgentModal(false)}
                  className="px-4 py-2 text-sm text-slate-500 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-6 py-2 rounded-lg"
                >
                  Approve Contract (Art. 20)
                </button>
              </div>

            </form>
          </FocusTrap>
        </div>
      )}

      {/* MODAL: Manage Agent Contract (Article 20 Compliance) */}
      {showContractEditModal && selectedAgentForContract && (
        <div className="fixed inset-0 bg-slate-900/50 z-40 flex items-center justify-center p-4 backdrop-blur-sm" id="contract_edit_modal">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base">Manage Agent Contract</h3>
                <p className="text-[10px] text-slate-400">Update signed Article 20 contract details & dates for {selectedAgentForContract.name}</p>
              </div>
              <button 
                onClick={() => {
                  setShowContractEditModal(false);
                  setSelectedAgentForContract(null);
                }} 
                className="text-slate-400 hover:text-white font-bold text-lg"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUpdateAgentContract} className="p-6 space-y-4">
              
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Signed Contract PDF (Upload / Replace)</label>
                <div className="border-2 border-dashed border-slate-200 rounded-lg p-3 text-center hover:bg-slate-50 transition-colors relative cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setContractEditForm({
                          ...contractEditForm,
                          contractFileName: file.name,
                          contractFileUrl: `/contracts/uploaded-${encodeURIComponent(file.name)}`
                        });
                        showToast('success', `Signed contract selected: ${file.name}`);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-1">
                    <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                    <p className="text-[11px] font-bold text-slate-700">
                      {contractEditForm.contractFileName ? `Ready: ${contractEditForm.contractFileName}` : 'Drag & drop or click to replace contract PDF'}
                    </p>
                    <p className="text-[9px] text-slate-400">Ensure the signed physical document contains wet ink/biometric signature</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Contract Expiry Date</label>
                <input
                  type="date"
                  required
                  value={contractEditForm.contractExpiryDate}
                  onChange={(e) => setContractEditForm({...contractEditForm, contractExpiryDate: e.target.value})}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Contract Modification Date (Logging)</label>
                <input
                  type="date"
                  value={contractEditForm.contractModificationDate}
                  onChange={(e) => setContractEditForm({...contractEditForm, contractModificationDate: e.target.value})}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">Leave as-is to use today's date for this revision log.</p>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase text-rose-500">Contract Resiliation (Termination)</label>
                  {contractEditForm.contractResiliationDate && (
                    <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded uppercase">Resiliated</span>
                  )}
                </div>
                <div className="flex gap-2 items-center">
                  <input
                    type="date"
                    value={contractEditForm.contractResiliationDate}
                    onChange={(e) => setContractEditForm({...contractEditForm, contractResiliationDate: e.target.value})}
                    placeholder="YYYY-MM-DD"
                    className="flex-1 text-sm border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-rose-500"
                  />
                  {contractEditForm.contractResiliationDate ? (
                    <button
                      type="button"
                      onClick={() => setContractEditForm({...contractEditForm, contractResiliationDate: ''})}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-2 rounded-lg text-xs font-bold"
                    >
                      Clear
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setContractEditForm({...contractEditForm, contractResiliationDate: new Date().toISOString().split('T')[0]})}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-700 py-2 px-3 rounded-lg text-xs font-bold border border-rose-200"
                    >
                      Set Today
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Setting a resiliation date terminates the active contract and suspends the agent immediately.</p>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowContractEditModal(false);
                    setSelectedAgentForContract(null);
                  }}
                  className="px-4 py-2 text-sm text-slate-500 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-6 py-2 rounded-lg"
                >
                  Save Changes
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL: Safeguarding Manual Reconcile */}
      {showReconciliationModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-40 flex items-center justify-center p-4 backdrop-blur-sm" id="reconcile_modal">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base">Bank Statement Reconciliation</h3>
                <p className="text-[10px] text-slate-400">Log physical safeguarding reserves to check mismatch difference.</p>
              </div>
              <button onClick={() => setShowReconciliationModal(false)} className="text-slate-400 hover:text-white font-bold text-lg">×</button>
            </div>

            <form onSubmit={handleReconcileSubmit} className="p-6 space-y-4">
              
              <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600 leading-relaxed border border-slate-100">
                <span className="font-bold text-slate-900 block mb-0.5">Current Internal Liabilities:</span>
                Total aggregate of user balances &amp; agent cash registers is <span className="font-bold text-indigo-600">{(stats?.totalLiabilities || 0).toLocaleString()} DA</span>. Entering any other value will trigger a Compliance Violation Audit Alarm.
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">External Bank Safeguarding Statement Balance (DA)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 1360000"
                  value={reconcileForm.externalBalance}
                  onChange={(e) => setReconcileForm({ externalBalance: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReconciliationModal(false)}
                  className="px-4 py-2 text-sm text-slate-500 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-6 py-2 rounded-lg"
                >
                  Submit Audit Record
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL: Bank Guarantee Update */}
      {showGuaranteeModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-40 flex items-center justify-center p-4 backdrop-blur-sm" id="guarantee_modal">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base">Update Central Bank Guarantee</h3>
                <p className="text-[10px] text-slate-400">Upload bank proof to renew operational license validation.</p>
              </div>
              <button onClick={() => setShowGuaranteeModal(false)} className="text-slate-400 hover:text-white font-bold text-lg">×</button>
            </div>

            <form onSubmit={handleGuaranteeSubmit} className="p-6 space-y-4">
              
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Guarantee Sum Amount (DA)</label>
                <input
                  type="number"
                  required
                  placeholder="50000000"
                  value={guaranteeForm.amount}
                  onChange={(e) => setGuaranteeForm({...guaranteeForm, amount: e.target.value})}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Central Bank Expiry Date</label>
                <input
                  type="date"
                  required
                  value={guaranteeForm.expiryDate}
                  onChange={(e) => setGuaranteeForm({...guaranteeForm, expiryDate: e.target.value})}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowGuaranteeModal(false)}
                  className="px-4 py-2 text-sm text-slate-500 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-6 py-2 rounded-lg"
                >
                  Confirm Renewal
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL: Level 2 Document Review Modal */}
      {showReviewDocsModal && selectedKycAccount && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-6 backdrop-blur-md" id="document_review_modal">
          <div className="bg-slate-900 text-slate-100 rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-800 overflow-hidden flex flex-col h-[650px]">
            {/* Header */}
            <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full"></span>
                  <h3 className="font-bold text-sm tracking-wide">LEVEL 2 DOCUMENT COMPLIANCE CHECK</h3>
                </div>
                <p className="text-[10px] text-slate-400 font-mono">Citizen ID verification: {selectedKycAccount.name} ({selectedKycAccount.idCardNumber || 'N/A'})</p>
              </div>
              <button 
                onClick={() => {
                  setShowReviewDocsModal(false);
                  setSelectedKycAccount(null);
                  setVisioComments('');
                }} 
                className="text-slate-400 hover:text-white font-bold"
              >
                Close
              </button>
            </div>

            {/* Document display */}
            <div className="flex-1 bg-slate-950 p-6 grid grid-cols-2 gap-6 min-h-0 overflow-y-auto">
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 flex flex-col justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono mb-2 block font-medium">National ID Recto (Front)</span>
                <div className="flex-1 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center relative min-h-60">
                  <img 
                    src={selectedKycAccount.documentUrl || 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=400&auto=format&fit=crop'} 
                    alt="National ID Front" 
                    className="max-h-full max-w-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 flex flex-col justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono mb-2 block font-medium">National ID Verso (Back)</span>
                <div className="flex-1 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center relative min-h-60">
                  <img 
                    src={selectedKycAccount.idCardBackUrl || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=400&auto=format&fit=crop'} 
                    alt="National ID Back" 
                    className="max-h-full max-w-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            </div>

            {/* Footer with decision and comments */}
            <div className="p-5 bg-slate-950 border-t border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="w-full md:w-1/2 text-left">
                <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono mb-1">Compliance Notes / Comments</label>
                <input 
                  type="text"
                  placeholder="Enter notes (e.g. ID matches registry, birth date verified)..."
                  value={visioComments}
                  onChange={(e) => setVisioComments(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
              <div className="flex gap-3 w-full md:w-auto justify-end">
                <button
                  onClick={() => processKycReview(selectedKycAccount.id, 'REJECTED')}
                  className="flex-1 md:flex-none bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition-all"
                >
                  Reject Application
                </button>
                <button
                  onClick={() => processKycReview(selectedKycAccount.id, 'ACTIVE')}
                  className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition-all"
                >
                  Approve Application
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Video Conference Interview Simulator */}
      {showVisioModal && selectedKycAccount && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-6 backdrop-blur-md" id="visioconference_modal">
          <div className="bg-slate-900 text-slate-100 rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-800 overflow-hidden flex flex-col h-[600px]">
            
            {/* Header */}
            <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse"></span>
                  <h3 className="font-bold text-sm tracking-wide">LEVEL 3 COMPLIANCE INTERVIEW</h3>
                </div>
                <p className="text-[10px] text-slate-400 font-mono">Citizen ID verification: {selectedKycAccount.name} ({selectedKycAccount.idCardNumber || 'N/A'})</p>
              </div>
              <button 
                onClick={() => {
                  setShowVisioModal(false);
                  setSelectedKycAccount(null);
                }} 
                className="text-slate-400 hover:text-white font-bold"
              >
                End Call
              </button>
            </div>

            {/* Video Streams */}
            <div className="flex-1 bg-slate-950 p-6 grid grid-cols-2 gap-6 min-h-0 relative">
              
              {/* Operator View */}
              <div className="bg-slate-900 rounded-xl border border-slate-800 relative overflow-hidden flex items-center justify-center">
                <div className="absolute top-3 left-3 bg-slate-950/80 text-[10px] uppercase font-bold py-1 px-2.5 rounded text-indigo-400 font-mono tracking-wider">
                  You (Compliance Officer)
                </div>
                {/* Simulated Webcam */}
                <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                  <ShieldCheck className="w-8 h-8 text-indigo-400" />
                </div>
                <div className="absolute bottom-3 left-3 text-[10px] text-slate-400">
                  Algiers Core Node HD Camera
                </div>
              </div>

              {/* Citizen View */}
              <div className="bg-slate-900 rounded-xl border border-slate-800 relative overflow-hidden flex flex-col items-center justify-center">
                <div className="absolute top-3 left-3 bg-slate-950/80 text-[10px] uppercase font-bold py-1 px-2.5 rounded text-amber-400 font-mono tracking-wider">
                  Citizen Feed: {selectedKycAccount.name}
                </div>

                {visioStep === 'CALLING' ? (
                  <div className="text-center space-y-3 animate-pulse">
                    <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
                    <p className="text-xs text-slate-400">Establishing secure WebRTC tunnel to citizen mobile client...</p>
                  </div>
                ) : visioStep === 'CONNECTED' ? (
                  <div className="flex flex-col items-center justify-center gap-4 text-center">
                    
                    {citizenHoldingCard ? (
                      <div className="space-y-3">
                        <div className="flex gap-2.5 justify-center">
                          <div className="text-center">
                            <img 
                              src={selectedKycAccount.documentUrl || 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=400&auto=format&fit=crop'} 
                              alt="ID Front" 
                              className="w-32 h-20 rounded border border-indigo-500 shadow-lg object-cover mx-auto"
                            />
                            <p className="text-[9px] text-slate-400 mt-1 uppercase font-mono font-semibold">ID FRONT</p>
                          </div>
                          <div className="text-center">
                            <img 
                              src={selectedKycAccount.idCardBackUrl || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=400&auto=format&fit=crop'} 
                              alt="ID Back" 
                              className="w-32 h-20 rounded border border-indigo-500 shadow-lg object-cover mx-auto"
                            />
                            <p className="text-[9px] text-slate-400 mt-1 uppercase font-mono font-semibold">ID BACK</p>
                          </div>
                        </div>
                        <p className="text-[11px] font-bold text-emerald-400">NID document verified under biometric facial match.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto border border-slate-700">
                          <Users className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="text-xs text-slate-300 font-bold">Citizen is connected to the virtual queue.</p>
                        <p className="text-[10px] text-slate-500">Instruct citizen to display physical ID card.</p>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setCitizenHoldingCard(!citizenHoldingCard)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all"
                    >
                      {citizenHoldingCard ? 'Hide ID Document' : 'Ask Citizen to Hold Up ID'}
                    </button>
                  </div>
                ) : null}

                <div className="absolute bottom-3 left-3 text-[10px] text-slate-400">
                  Secure video pipeline • Latency: 22ms
                </div>
              </div>

            </div>

            {/* Operator Control Panel */}
            <div className="p-5 bg-slate-950 border-t border-slate-800 flex flex-col md:flex-row items-center gap-4 shrink-0">
              <div className="flex-1 w-full">
                <input
                  type="text"
                  placeholder="Enter audit validation comments (e.g. ID matches citizen face exactly)"
                  value={visioComments}
                  onChange={(e) => setVisioComments(e.target.value)}
                  className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg p-2.5 focus:outline-none focus:border-indigo-500 text-slate-100 font-sans"
                />
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => processKycReview(selectedKycAccount.id, 'REJECTED')}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2.5 px-5 rounded-lg whitespace-nowrap"
                >
                  Reject &amp; Suspend
                </button>
                <button
                  type="button"
                  disabled={!citizenHoldingCard && selectedKycAccount.kycLevel === 3}
                  onClick={() => processKycReview(selectedKycAccount.id, 'ACTIVE')}
                  className={`font-bold text-xs py-2.5 px-6 rounded-lg whitespace-nowrap ${
                    !citizenHoldingCard && selectedKycAccount.kycLevel === 3
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  Approve KYC Level {selectedKycAccount.kycLevel}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
    );
  };

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-slate-50">
      {/* Sandbox Multi-Domain Browser Bar */}
      <div className="bg-slate-900 text-slate-300 border-b border-slate-950 px-4 py-3 flex flex-col md:flex-row items-center gap-3 justify-between select-none shrink-0" id="sandbox_browser_bar">
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex gap-1.5 mr-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
          </div>
          <span className="text-[9px] font-black tracking-widest bg-indigo-600/30 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded uppercase">AI Sandbox</span>
        </div>
        
        {/* Address bar input */}
        <div className="flex-1 max-w-xl bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 flex items-center gap-2 text-xs font-mono text-slate-400 select-all font-bold w-full md:w-auto shadow-inner text-center md:text-left">
          <span className="text-slate-600 select-none">https://</span>
          <span>
            {activeDomain === 'MARKETING' && `dzpsp.com/${marketingPage === 'HOME' ? '' : marketingPage.toLowerCase()}`}
            {activeDomain === 'MERCHANT' && `app.dzpsp.com/${merchantPage.toLowerCase()}`}
            {activeDomain === 'CLIENT_WALLET' && `client.dzpsp.com/hub`}
            {activeDomain === 'ADMIN_CONSOLE' && `admin.dzpsp.com/compliance`}
          </span>
        </div>

        {/* Domain Selection Tabs */}
        <div className="flex flex-wrap gap-1.5 justify-center">
          <button
            onClick={() => { setActiveDomain('MARKETING'); setAppMode('USER'); }}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeDomain === 'MARKETING' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-950/60 text-slate-400 hover:text-white'
            }`}
          >
            <span>🌐 dzpsp.com</span>
          </button>
          <button
            onClick={() => { setActiveDomain('MERCHANT'); setAppMode('USER'); }}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeDomain === 'MERCHANT' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-950/60 text-slate-400 hover:text-white'
            }`}
          >
            <span>💼 app.dzpsp.com</span>
          </button>
          <button
            onClick={() => { setActiveDomain('CLIENT_WALLET'); setAppMode('USER'); }}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeDomain === 'CLIENT_WALLET' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-950/60 text-slate-400 hover:text-white'
            }`}
          >
            <span>👤 client.dz</span>
          </button>
          <button
            onClick={() => { setActiveDomain('ADMIN_CONSOLE'); setAppMode('ADMIN'); }}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeDomain === 'ADMIN_CONSOLE' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-950/60 text-slate-400 hover:text-white'
            }`}
          >
            <span>🛡️ admin.dz</span>
          </button>
        </div>
      </div>

      {/* Main Viewport Router */}
      <div className="flex-1 overflow-hidden relative">
        {/* MARKETING SITE VIEWPORT */}
        {activeDomain === 'MARKETING' && (
          <div className="h-full flex flex-col overflow-hidden bg-slate-50" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
            <nav className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between shrink-0 z-10 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-indigo-600 text-white rounded-xl font-black text-xs leading-none">DF</span>
                <span className="font-black text-slate-900 tracking-tight text-sm sm:text-base">DinarFlow Payments</span>
              </div>

              <div className="hidden md:flex items-center gap-6">
                {(['HOME', 'FEATURES', 'PRICING', 'DOCS', 'TERMS'] as const).map((page) => (
                  <button
                    key={page}
                    onClick={() => setMarketingPage(page)}
                    className={`text-xs font-extrabold capitalize transition-all cursor-pointer ${
                      marketingPage === page ? 'text-indigo-600 font-black border-b-2 border-indigo-600 pb-1' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {t(`nav.${page.toLowerCase()}`)}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 border border-slate-100 rounded-xl p-1 bg-slate-50 shrink-0">
                  {(['en', 'fr', 'ar'] as const).map((l) => (
                    <button
                      key={l}
                      onClick={() => setLang(l)}
                      className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase transition-all cursor-pointer ${
                        lang === l ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setActiveDomain('MERCHANT')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] sm:text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm shadow-indigo-600/10"
                >
                  {t('nav.login')}
                </button>
              </div>
            </nav>

            <div className="flex-1 overflow-y-auto">
              {marketingPage === 'HOME' && (
                <Home
                  onGetStarted={() => { setActiveDomain('MERCHANT'); setMerchantPage('KYB'); }}
                  onExploreApis={() => setMarketingPage('DOCS')}
                />
              )}
              {marketingPage === 'FEATURES' && <Features />}
              {marketingPage === 'PRICING' && (
                <Pricing onSelectPlan={() => { setActiveDomain('MERCHANT'); setMerchantPage('KYB'); }} />
              )}
              {marketingPage === 'DOCS' && <Docs />}
              {marketingPage === 'TERMS' && <Terms />}
            </div>
          </div>
        )}

        {/* MERCHANT PORTAL VIEWPORT */}
        {activeDomain === 'MERCHANT' && (
          <div className="h-full flex bg-slate-50 overflow-hidden">
            <aside className="w-64 bg-slate-900 text-slate-400 shrink-0 hidden md:flex flex-col justify-between p-5 border-r border-slate-950">
              <div className="space-y-8">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-indigo-500 text-white rounded-xl font-black text-xs leading-none">DF</span>
                  <span className="font-black text-white tracking-tight text-sm">Merchant Hub</span>
                </div>

                <nav className="space-y-1.5">
                  {[
                    { id: 'OVERVIEW', label: 'Overview / Stats' },
                    { id: 'TRANSACTIONS', label: 'Payment Logs' },
                    { id: 'INVOICES', label: 'Invoice Center' },
                    { id: 'LINKS', label: 'Payment Links & QRs' },
                    { id: 'KYB', label: 'KYB Onboarding' },
                    { id: 'SETTINGS', label: 'Store Settings' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => { setMerchantPage(item.id as any); setLinksPrefill(null); }}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                        merchantPage === item.id
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                          : 'hover:bg-slate-800/50 hover:text-white text-slate-400'
                      }`}
                    >
                      <span>{item.label}</span>
                    </button>
                  ))}
                </nav>
              </div>

              <div className="border-t border-slate-800/85 pt-4 space-y-2 text-[10px] font-semibold text-slate-500">
                <p>Verified Store: <strong className="text-slate-300">Oran Tech Hub</strong></p>
                <p>Merchant Ref: <strong className="text-slate-300">mch_82bc19a8</strong></p>
              </div>
            </aside>

            <div className="flex-1 flex flex-col overflow-hidden">
              <header className="bg-white border-b border-slate-200 px-6 h-16 flex items-center justify-between shrink-0">
                <h1 className="font-extrabold text-slate-900 text-sm sm:text-base capitalize">
                  {merchantPage.toLowerCase()} Panel
                </h1>

                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100/50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                    ● Sandbox Provider
                  </span>
                  <button
                    onClick={() => { setActiveDomain('ADMIN_CONSOLE'); setAppMode('ADMIN'); }}
                    className="text-[10px] font-black text-indigo-600 hover:underline cursor-pointer"
                  >
                    Switch to compliance admin
                  </button>
                </div>
              </header>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {merchantPage === 'OVERVIEW' && (
                  <Overview
                    stats={stats}
                    transactions={transactions}
                    kybStatus={kybStatus}
                    onWithdraw={() => showToast('success', 'Withdrawal request of dinar settlement submitted to compensation partner bank.')}
                  />
                )}
                {merchantPage === 'TRANSACTIONS' && (
                  <Transactions transactions={transactions} onRefresh={fetchData} />
                )}
                {merchantPage === 'INVOICES' && (
                  <Invoices
                    onGenerateLink={(amt, reference, email, name) => {
                      setLinksPrefill({ amount: amt, ref: reference, email, name });
                      setMerchantPage('LINKS');
                    }}
                  />
                )}
                {merchantPage === 'LINKS' && (
                  <PaymentLinks
                    initialAmount={linksPrefill?.amount}
                    initialRef={linksPrefill?.ref}
                    initialEmail={linksPrefill?.email}
                    initialName={linksPrefill?.name}
                    onPayLink={(url) => {
                      const parsed = new URL(url);
                      const payAmount = Number(parsed.searchParams.get('payAmount') || '1500');
                      const payToName = parsed.searchParams.get('payToName') || 'Merchant Hub';
                      const payIban = parsed.searchParams.get('payIban') || 'DZ5400700123100023450001';
                      const payRef = parsed.searchParams.get('payRef') || 'INV-REF-909';

                      setCheckoutSession({
                        amount: payAmount,
                        toName: payToName,
                        iban: payIban,
                        ref: payRef
                      });
                    }}
                  />
                )}
                {merchantPage === 'KYB' && (
                  <KYB kybStatus={kybStatus} onUpdateStatus={(stat) => setKybStatus(stat)} />
                )}
                {merchantPage === 'SETTINGS' && <Settings />}
              </div>
            </div>
          </div>
        )}

        {/* ORIGINAL WALLET & COMPLIANCE PORTS */}
        {(activeDomain === 'CLIENT_WALLET' || activeDomain === 'ADMIN_CONSOLE') && renderOriginalApp()}
      </div>

      {/* SECURE SATIM AUTHORIZATION GATEWAY OVERLAY MODAL */}
      {checkoutSession && (
        <SimulatedCheckout
          amount={checkoutSession.amount}
          toMerchantName={checkoutSession.toName}
          reference={checkoutSession.ref}
          merchantIban={checkoutSession.iban}
          onSuccess={() => {
            setCheckoutSession(null);
            showToast('success', `Payment of ${checkoutSession.amount} DA cleared and recorded successfully under ledger bridge status callback.`);
            setMerchantPage('OVERVIEW');
          }}
          onCancel={() => setCheckoutSession(null)}
        />
      )}
    </div>
  );
}
