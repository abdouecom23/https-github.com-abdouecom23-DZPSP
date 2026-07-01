import React, { useState, useEffect } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  CreditCard, 
  History, 
  Send,
  User,
  LayoutDashboard,
  Wallet,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  ArrowUpDown,
  Copy,
  Check,
  Info,
  Shield,
  MapPin,
  Eye,
  Upload,
  Sparkles,
  Smartphone,
  Landmark,
  Plus,
  QrCode,
  FileText,
  Briefcase,
  Menu,
  X,
  Bell,
  ChevronDown,
  LayoutGrid,
  Code2,
  PlugZap,
  Coins
} from 'lucide-react';
import { UserAccount, LedgerTransaction, Agent, KycLevel } from '../types';
import { ApiService } from '../apiService';
import { MerchantView } from './MerchantView';
import DeveloperApiTab from './DeveloperApiTab';
import ServicesTab from './ServicesTab';
import DztWalletTab from './DztWalletTab';

interface UserViewProps {
  user: UserAccount;
  transactions: LedgerTransaction[];
  accounts: UserAccount[];
  agents: Agent[];
  onRefresh: () => void;
  setAppMode: (mode: 'ADMIN' | 'USER') => void;
  setCurrentUser: (user: UserAccount) => void;
}

export default function UserView({ 
  user, 
  transactions, 
  accounts, 
  agents, 
  onRefresh, 
  setAppMode, 
  setCurrentUser
}: UserViewProps) {
  // Navigation tabs inside User Panel
  const [activeUserTab, setActiveUserTab] = useState<'HOME' | 'ACCOUNTS' | 'CARDS' | 'TRANSACTIONS' | 'LIMITS' | 'MERCHANT' | 'DEVELOPER' | 'SERVICES' | 'DZT_WALLET'>('HOME');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Dialog modal states
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [showSendMoneyModal, setShowSendMoneyModal] = useState(false);
  const [showKycUpgradeModal, setShowKycUpgradeModal] = useState(false);
  const [kycUpgradeTargetLevel, setKycUpgradeTargetLevel] = useState<KycLevel>(3);
  const [showVirtualCardModal, setShowVirtualCardModal] = useState(false);

  // Form states
  const [transferForm, setTransferForm] = useState({
    recipientIban: '',
    amount: '',
    reference: '',
    otpCode: ''
  });
  const [addMoneyForm, setAddMoneyForm] = useState({
    amount: '',
    method: 'AGENT' as 'AGENT' | 'CARD',
    agentId: '',
    cardNumber: '',
    expiry: '',
    cvv: ''
  });
  const [kycUpgradeForm, setKycUpgradeForm] = useState({
    idNumber: '',
    docType: 'NATIONAL_ID' as 'NATIONAL_ID' | 'PASSPORT',
    idCardFrontUrl: '',
    idCardFrontName: '',
    idCardBackUrl: '',
    idCardBackName: '',
    addressPdfUrl: '',
    addressPdfName: ''
  });

  // Action feedback states
  const [copiedIban, setCopiedIban] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [simulatedOtp, setSimulatedOtp] = useState<string>('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);

  // QR contactless payment states
  const [showQrPaymentModal, setShowQrPaymentModal] = useState(false);
  const [qrPaymentForm, setQrPaymentForm] = useState({
    amount: 0,
    recipientName: '',
    recipientIban: '',
    reference: '',
    otpCode: ''
  });
  const [qrOtpTimer, setQrOtpTimer] = useState(0);
  const [simulatedQrOtp, setSimulatedQrOtp] = useState<string>('');

  // Filter transactions for this user using space-stripped comparisons
  const cleanIban = (iban: string) => (iban || '').replace(/\s/g, '').toLowerCase();
  const userTxs = user ? transactions.filter(t => 
    cleanIban(t.senderIban) === cleanIban(user.iban) || 
    cleanIban(t.receiverIban) === cleanIban(user.iban)
  ) : [];

  // Simulated OTP logic for outbound transfers
  useEffect(() => {
    if (otpTimer > 0) {
      const interval = setInterval(() => {
        setOtpTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setSimulatedOtp('');
    }
  }, [otpTimer]);

  const triggerOtpGeneration = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setSimulatedOtp(code);
    setTransferForm(prev => ({ ...prev, otpCode: code })); // Auto-fill for friction-free sandbox testing
    setOtpTimer(60);
    setActionSuccess('Secure 2FA OTP code generated successfully!');
    setTimeout(() => setActionSuccess(null), 4000);
  };

  // Simulated OTP logic for QR Contactless Payment
  useEffect(() => {
    if (qrOtpTimer > 0) {
      const interval = setInterval(() => {
        setQrOtpTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setSimulatedQrOtp('');
    }
  }, [qrOtpTimer]);

  const triggerQrOtpGeneration = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setSimulatedQrOtp(code);
    setQrPaymentForm(prev => ({ ...prev, otpCode: code })); // Auto-fill for friction-free sandbox testing
    setQrOtpTimer(60);
    setActionSuccess('Secure payment OTP code generated successfully!');
    setTimeout(() => setActionSuccess(null), 4000);
  };

  // Detect incoming QR payment link / redirect parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payAmount = params.get('payAmount');
    const payToName = params.get('payToName');
    const payIban = params.get('payIban');
    const payRef = params.get('payRef');

    if (payAmount && payIban) {
      const amountNum = Number(payAmount);
      if (amountNum > 0) {
        setQrPaymentForm({
          amount: amountNum,
          recipientName: payToName || 'DinarFlow Partner Merchant',
          recipientIban: payIban,
          reference: payRef || 'QR Contactless Payment',
          otpCode: ''
        });
        setShowQrPaymentModal(true);
        
        // Remove parameters to avoid duplicate payment prompts on page refresh
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    }
  }, []);

  const handleQrPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);
    setLoadingAction(true);

    try {
      if (!qrPaymentForm.recipientIban) throw new Error("L'IBAN du destinataire est requis.");
      if (qrPaymentForm.amount <= 0) throw new Error("Veuillez spécifier un montant valide.");
      if (!qrPaymentForm.otpCode) throw new Error("Le code de validation OTP (2FA) est requis.");

      if (user.balance < qrPaymentForm.amount) {
        throw new Error(`Solde insuffisant! Votre solde actuel est de ${user.balance.toLocaleString()} DA.`);
      }

      const totalDebitSum = (user.dailyDebitSum || 0) + qrPaymentForm.amount;
      if (totalDebitSum > user.dailyDebitLimit) {
        throw new Error(`Limite de débit quotidienne dépassée! Limite restante: ${(user.dailyDebitLimit - (user.dailyDebitSum || 0)).toLocaleString()} DA. Mettez à niveau votre KYC pour augmenter vos limites.`);
      }

      const payload = {
        type: 'TRANSFER',
        amount: qrPaymentForm.amount,
        senderIban: user.iban,
        receiverIban: qrPaymentForm.recipientIban,
        reference: qrPaymentForm.reference || 'QR Contactless Payment',
        otpCode: qrPaymentForm.otpCode
      };

      const data = await ApiService.executeTransaction(payload);

      setActionSuccess(`Paiement de ${qrPaymentForm.amount.toLocaleString()} DA envoyé avec succès à ${qrPaymentForm.recipientName} ! Réf : ${data.reference}`);
      onRefresh();
      setTimeout(() => {
        setShowQrPaymentModal(false);
        setActionSuccess(null);
      }, 3000);
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  // Copy IBAN feedback
  const handleCopyIban = (iban: string) => {
    navigator.clipboard.writeText(iban);
    setCopiedIban(true);
    setTimeout(() => setCopiedIban(false), 2000);
  };

  // Add Money (Deposit via Agent or Mock Card)
  const handleAddMoneySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);
    setLoadingAction(true);

    try {
      const amountNum = Number(addMoneyForm.amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error("Veuillez saisir un montant valide.");
      }

      if (addMoneyForm.method === 'CARD') {
        const payload = {
          accountId: user.id,
          amount: amountNum,
          fullName: user.name,
          phone: user.phoneNumber || '0550112233',
          email: user.email || 'user@dinarflow.dz',
          memo: `CIB-TOPUP-${Date.now()}`,
          returnUrl: window.location.origin
        };
        const res = await fetch('/api/ledger-bridge/cib/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const checkoutData = await res.json();
        
        if (checkoutData.success) {
          const cibId = checkoutData.data?.cib_transaction_id || checkoutData.cib_transaction_id;
          setActionSuccess(`Passerelle de paiement CIB Initialisée. Réf: ${cibId}. Règlement du Grand Livre en cours...`);
          
          // Poll the confirmation endpoint after 2.5s to simulate 3D Secure checkout completion
          setTimeout(async () => {
            const confirmRes = await fetch(`/api/ledger-bridge/cib/confirm/${cibId}`);
            const confirmData = await confirmRes.json();
            
            if (confirmData.success) {
              onRefresh();
              setAddMoneyForm({ amount: '', method: 'AGENT', agentId: '', cardNumber: '', expiry: '', cvv: '' });
              setShowAddMoneyModal(false);
              setActionSuccess(null);
            } else {
              setActionError("Échec du règlement de la transaction du Grand Livre.");
            }
          }, 2500);
          return; // Early return to let simulation run
        } else {
          throw new Error("Échec de la génération du lien CIB.");
        }
      }

      // If Agent method, verify an active agent is selected
      if (addMoneyForm.method === 'AGENT' && !addMoneyForm.agentId) {
        throw new Error("Veuillez sélectionner un agent agréé pour le dépôt d'espèces.");
      }

      // Execute CASH_IN on the ledger
      // Source is Agent or Mock Central Pool (DZ54 007 00123 000000000000 00)
      const mockSystemIban = 'DZ54 007 00123 000000000000 97';
      const payload = {
        type: addMoneyForm.method === 'AGENT' ? 'AGENT_CASH_IN' : 'CASH_IN',
        amount: amountNum,
        senderIban: mockSystemIban,
        receiverIban: user.iban,
        reference: `Cash Deposit via Agent ID ${addMoneyForm.agentId}`,
        agentId: addMoneyForm.method === 'AGENT' ? addMoneyForm.agentId : undefined,
        otpCode: 'MOCK_BYPASS_FOR_INBOUND' // Inbounds don't strictly require 2FA
      };

      const data = await ApiService.executeTransaction(payload);

      setActionSuccess(`Fonds déposés avec succès ! Réf : ${data.reference}`);
      setAddMoneyForm({ amount: '', method: 'AGENT', agentId: '', cardNumber: '', expiry: '', cvv: '' });
      onRefresh();
      setTimeout(() => {
        setShowAddMoneyModal(false);
        setActionSuccess(null);
      }, 2000);
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  // Send Money / External Transfer
  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);
    setLoadingAction(true);

    try {
      if (!transferForm.recipientIban) throw new Error("L'IBAN du bénéficiaire est requis.");
      const amountNum = Number(transferForm.amount);
      if (isNaN(amountNum) || amountNum <= 0) throw new Error("Veuillez saisir un montant valide.");
      if (!transferForm.otpCode) throw new Error("La validation OTP (2FA) est obligatoire pour ce transfert sortant.");

      const payload = {
        type: 'TRANSFER',
        amount: amountNum,
        senderIban: user.iban,
        receiverIban: transferForm.recipientIban,
        reference: transferForm.reference || 'Mobile Transfer',
        otpCode: transferForm.otpCode
      };

      const data = await ApiService.executeTransaction(payload);

      setActionSuccess(`Transfert effectué avec succès ! Réf : ${data.reference}`);
      setTransferForm({ recipientIban: '', amount: '', reference: '', otpCode: '' });
      setOtpTimer(0);
      setSimulatedOtp('');
      onRefresh();
      setTimeout(() => {
        setShowSendMoneyModal(false);
        setActionSuccess(null);
      }, 2000);
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  // Upgrade KYC status via ID doc submission
  const handleKycUpgradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);
    setLoadingAction(true);

    try {
      if (!kycUpgradeForm.idNumber) throw new Error("Le numéro de la pièce d'identité est requis.");
      
      const payload = {
        level: kycUpgradeTargetLevel, // Request level upgrade
        idCardNumber: kycUpgradeForm.idNumber,
        idCardUrl: kycUpgradeForm.idCardFrontUrl || 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=400&auto=format&fit=crop',
        idCardBackUrl: kycUpgradeForm.idCardBackUrl || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=400&auto=format&fit=crop',
        addressUrl: kycUpgradeForm.addressPdfUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
      };

      await ApiService.upgradeKyc(user.id, payload);

      setActionSuccess(`Documents soumis avec succès pour la mise à niveau KYC Niveau ${kycUpgradeTargetLevel} (Mandat de conformité)`);
      setKycUpgradeForm({
        idNumber: '',
        docType: 'NATIONAL_ID',
        idCardFrontUrl: '',
        idCardFrontName: '',
        idCardBackUrl: '',
        idCardBackName: '',
        addressPdfUrl: '',
        addressPdfName: ''
      });
      onRefresh();
      setTimeout(() => {
        setShowKycUpgradeModal(false);
        setActionSuccess(null);
      }, 3000);
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  // Simulators for testing the 1-month wait rule
  const handleSimulateCooldownBypass = async () => {
    setActionError(null);
    setActionSuccess(null);
    try {
      await ApiService.simulateKycCooldown(user.id);
      onRefresh();
      setActionSuccess("Simulation : 1 mois s'est écoulé depuis la rejection. Le délai d'attente est terminé !");
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const handleSimulateRejection = async () => {
    setActionError(null);
    setActionSuccess(null);
    try {
      await ApiService.simulateKycReject(user.id);
      onRefresh();
      setActionSuccess("Simulation : L'upgrade KYC a été rejeté aujourd'hui. Le délai d'attente de 1 mois est actif.");
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  // Generate simulated chart points based on user's current balance and historic transaction deltas
  const generateBalanceChartPoints = () => {
    const dates = ['Aug 3', 'Aug 8', 'Aug 13', 'Aug 18', 'Aug 23', 'Aug 28', 'Sep 2'];
    const result = [];
    let currentBal = user.balance;
    
    // Sort transactions reverse-chronologically to calculate historic steps backwards
    const sortedTxs = [...userTxs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    // Last point (index 6, 'Sep 2') is user's exact current balance
    result.push({
      date: dates[6],
      balance: currentBal
    });
    
    for (let i = 5; i >= 0; i--) {
      const tx = sortedTxs[5 - i];
      if (tx) {
        // Going backwards in time:
        // If it was a debit, we add it back. If it was a credit, we subtract it.
        const isDebit = cleanIban(tx.senderIban) === cleanIban(user.iban);
        currentBal = isDebit ? currentBal + tx.amount + (tx.fee || 0) : currentBal - tx.amount;
      }
      result.push({
        date: dates[i],
        balance: Math.max(currentBal, 0)
      });
    }
    
    return result.reverse();
  };

  const chartPoints = generateBalanceChartPoints();
  const maxVal = Math.max(...chartPoints.map(p => p.balance)) * 1.15;
  const minVal = Math.min(...chartPoints.map(p => p.balance)) * 0.85;

  // Generate SVG coordinates for a elegant smooth line graph
  const getSvgCoordinates = () => {
    const width = 600;
    const height = 180;
    const paddingLeft = 60;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 30;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const valRange = (maxVal - minVal) || 1;

    const points = chartPoints.map((p, idx) => {
      const x = paddingLeft + (idx / (chartPoints.length - 1)) * chartWidth;
      const y = paddingTop + chartHeight - ((p.balance - minVal) / valRange) * chartHeight;
      return { x, y, balance: p.balance, date: p.date };
    });

    // Create path d attribute with smooth curves (Sextic Bézier Approximation)
    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 3;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (2 * (p1.x - p0.x)) / 3;
      const cpY2 = p1.y;
      pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }

    // Create shadow fill path
    const fillD = `${pathD} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`;

    return { pathD, fillD, points, width, height, paddingLeft, paddingBottom, chartWidth, chartHeight };
  };

  const svgData = getSvgCoordinates();

  // Active user list for switching
  const alternativeUsers = user ? accounts.filter(a => a.id !== user.id) : [];

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-50 h-full w-full">
        <div className="max-w-md p-6 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <p className="text-sm font-semibold text-slate-500">No client account selected. Please open an account first or select an existing client in the Compliance Admin panel.</p>
          <button
            onClick={() => setAppMode('ADMIN')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all"
          >
            Go to Admin Panel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-[#f8fafc] text-slate-800 flex flex-col font-sans overflow-hidden" id="user_portal_root">
      
      <div className="hidden md:flex flex-1 overflow-hidden relative w-full h-full">
        {/* SIDEBAR matches Aurelia/Grey fin-tech style perfectly */}
        <div className={`${isMobileSidebarOpen ? 'fixed inset-0 z-50 flex' : 'hidden'} md:flex md:static md:z-0 md:w-64 shrink-0 h-full`}>
          <div className="md:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm -z-10" onClick={() => setIsMobileSidebarOpen(false)} />
          <aside className="w-64 bg-white border-r border-slate-100 flex flex-col justify-between shrink-0 h-full relative z-10 shadow-lg md:shadow-none" id="user_sidebar">
            <div>
              {/* Header / Brand */}
              <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center font-bold text-base text-white shadow-md shadow-emerald-900/10">
                    <Sparkles className="w-5 h-5 text-emerald-100" />
                  </div>
                  <div>
                    <span className="font-extrabold tracking-tight text-lg text-slate-900">DinarFlow</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded font-bold uppercase tracking-wider">PREMIUM</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Menus */}
              <div className="py-6 px-4">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider px-3 block mb-3">MAIN</span>
                <nav className="space-y-1">
                  <button
                    id="user_menu_home"
                    onClick={() => { setActiveUserTab('HOME'); setIsMobileSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      activeUserTab === 'HOME'
                        ? 'bg-slate-100 text-slate-900 font-bold'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-950'
                    }`}
                  >
                    <LayoutDashboard className="w-4.5 h-4.5" />
                    <span>Home</span>
                  </button>

                  <button
                    id="user_menu_accounts"
                    onClick={() => { setActiveUserTab('ACCOUNTS'); setIsMobileSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      activeUserTab === 'ACCOUNTS'
                        ? 'bg-slate-100 text-slate-900 font-bold'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-950'
                    }`}
                  >
                    <Wallet className="w-4.5 h-4.5" />
                    <span>Accounts</span>
                  </button>

                  <button
                    id="user_menu_services"
                    onClick={() => { setActiveUserTab('SERVICES'); setIsMobileSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      activeUserTab === 'SERVICES'
                        ? 'bg-slate-100 text-slate-900 font-bold'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-950'
                    }`}
                  >
                    <PlugZap className="w-4.5 h-4.5" />
                    <span>Digital Services</span>
                  </button>

                  <button
                    id="user_menu_dzt_wallet"
                    onClick={() => { setActiveUserTab('DZT_WALLET'); setIsMobileSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      activeUserTab === 'DZT_WALLET'
                        ? 'bg-slate-100 text-slate-900 font-bold'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-950'
                    }`}
                  >
                    <Coins className="w-4.5 h-4.5" />
                    <span>DZT Bridge Wallet</span>
                  </button>

                  <button
                    id="user_menu_txs"
                    onClick={() => { setActiveUserTab('TRANSACTIONS'); setIsMobileSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      activeUserTab === 'TRANSACTIONS'
                        ? 'bg-slate-100 text-slate-900 font-bold'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-950'
                    }`}
                  >
                    <History className="w-4.5 h-4.5" />
                    <span>Transactions</span>
                  </button>

                  <button
                    id="user_menu_limits"
                    onClick={() => { setActiveUserTab('LIMITS'); setIsMobileSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      activeUserTab === 'LIMITS'
                        ? 'bg-slate-100 text-slate-900 font-bold'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-950'
                    }`}
                  >
                    <Shield className="w-4.5 h-4.5" />
                    <span>Limits &amp; KYC</span>
                  </button>

                  <button
                    id="user_menu_merchant"
                    onClick={() => { setActiveUserTab('MERCHANT'); setIsMobileSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      activeUserTab === 'MERCHANT'
                        ? 'bg-slate-100 text-slate-900 font-bold'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-950'
                    }`}
                  >
                    <Briefcase className="w-4.5 h-4.5" />
                    <span>Merchant</span>
                  </button>
                  
                  <button
                    id="user_menu_services"
                    onClick={() => { setActiveUserTab('SERVICES'); setIsMobileSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      activeUserTab === 'SERVICES'
                        ? 'bg-slate-100 text-slate-900 font-bold'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-950'
                    }`}
                  >
                    <PlugZap className="w-4.5 h-4.5" />
                    <span>Digital Services</span>
                  </button>

                  <button
                    id="user_menu_developer"
                    onClick={() => { setActiveUserTab('DEVELOPER'); setIsMobileSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      activeUserTab === 'DEVELOPER'
                        ? 'bg-slate-100 text-slate-900 font-bold'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-950'
                    }`}
                  >
                    <Code2 className="w-4.5 h-4.5" />
                    <span>Developer API</span>
                  </button>
                </nav>

                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider px-3 block mt-8 mb-3">COMPANY</span>
                <nav className="space-y-1">
                  <div className="flex items-center justify-between px-3 py-2 text-slate-400 text-xs font-semibold">
                    <span>SCA Compliance</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 text-slate-400 text-xs font-semibold">
                    <span>Double-Entry Sec.</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  </div>
                </nav>
              </div>
            </div>

            {/* Compliance officer Quick Switch Footer */}
            <div className="p-4 border-t border-slate-50 bg-slate-50/50">
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-slate-100 shadow-sm">
                <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-xs text-indigo-600 shrink-0">
                  HB
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wider leading-none">Sandbox Mode</p>
                  <p className="text-xs font-bold text-slate-800 truncate mt-0.5">H. Brahimi (Compliance)</p>
                </div>
              </div>
            </div>
          </aside>
          {/* Overlay for mobile with modern blur */}
          <div className="md:hidden flex-1 bg-slate-900/40 backdrop-blur-sm z-40" onClick={() => setIsMobileSidebarOpen(false)} />
        </div>

        {/* MAIN BODY AREA matches image with clean off-white background */}
        <div className="hidden md:flex flex-1 flex-col overflow-hidden">
          
          {/* HEADER BAR matches image layout with page title, conversions rates, notification, profile switcher */}
          <header className="h-16 bg-white border-b border-slate-100 px-4 md:px-8 flex items-center justify-between shrink-0" id="user_header">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                className="md:hidden p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-all"
                id="user_mobile_toggle"
              >
                <Menu className="w-5.5 h-5.5" />
              </button>
              <h1 className="text-sm md:text-xl font-extrabold text-slate-900 truncate">
                {activeUserTab === 'HOME' && 'Home'}
                {activeUserTab === 'ACCOUNTS' && 'My Accounts'}
                {activeUserTab === 'DZT_WALLET' && 'DZT Bridge Wallet'}
                {activeUserTab === 'SERVICES' && 'Digital Services'}
                {activeUserTab === 'TRANSACTIONS' && 'My Ledger Statements'}
                {activeUserTab === 'LIMITS' && 'Compliance & KYC Limits'}
                {activeUserTab === 'MERCHANT' && 'Merchant Services'}
                {activeUserTab === 'DEVELOPER' && 'Developer API'}
                {activeUserTab === 'SERVICES' && 'Digital Services'}
              </h1>
            </div>

            {/* Middle and Right Header Actions */}
            <div className="flex items-center gap-3 md:gap-6">
              
              <button 
                onClick={() => setAppMode('ADMIN')}
                className="bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold px-2.5 py-2 md:px-3 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
              >
                <Shield className="w-3.5 h-3.5" /> 
                <span className="hidden sm:inline">Back to Compliance Admin</span>
                <span className="sm:hidden">Admin</span>
              </button>

              {/* Notification bell icon as shown in image */}
              <div className="relative cursor-pointer hover:bg-slate-50 p-1.5 md:p-2 rounded-full transition-all shrink-0">
                <div className="w-2.5 h-2.5 bg-rose-500 rounded-full absolute top-1.5 right-1.5 border-2 border-white animate-pulse"></div>
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>

              {/* Profile Avatar / Quick User Switcher dropdown as shown in image */}
              <div className="flex items-center gap-2 md:gap-3 border-l border-slate-100 pl-2 md:pl-4 shrink-0">
                <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-slate-800 text-slate-100 flex items-center justify-center font-bold text-xs md:text-sm shadow-sm border border-slate-200">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="hidden sm:block text-left shrink-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-slate-800 leading-tight block max-w-[100px] truncate">{user.name}</span>
                    <select 
                      value={user.id}
                      onChange={(e) => {
                        const nextU = accounts.find(a => a.id === e.target.value);
                        if (nextU) setCurrentUser(nextU);
                      }}
                      className="bg-transparent text-[10px] text-slate-400 font-semibold focus:outline-none cursor-pointer hover:text-indigo-600"
                    >
                      <option value={user.id} disabled>Change User</option>
                      {alternativeUsers.map(u => (
                        <option key={u.id} value={u.id}>{u.name.split(' ')[0]} (Lvl {u.kycLevel})</option>
                      ))}
                    </select>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-bold leading-none block font-mono">KYC Level {user.kycLevel}</span>
                </div>
                {/* Mobile visible mini switcher */}
                <div className="sm:hidden relative">
                  <select
                    value={user.id}
                    onChange={(e) => {
                      const nextU = accounts.find(a => a.id === e.target.value);
                      if (nextU) setCurrentUser(nextU);
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  >
                    {alternativeUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.name.split(' ')[0]} (Lvl {u.kycLevel})</option>
                    ))}
                  </select>
                  <span className="text-[10px] text-emerald-600 font-bold font-mono border border-emerald-200 px-1.5 py-0.5 rounded-md bg-emerald-50">L{user.kycLevel}</span>
                </div>
              </div>

            </div>
          </header>

          {/* MAIN PAGE VIEW CONTROLLER */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8" id="user_scrolling_canvas">
            
            {/* Feedback notification alerts */}
            {actionError && (
              <div className="p-4 bg-rose-50 border border-rose-100 text-rose-900 rounded-2xl flex items-center justify-between shadow-sm animate-fade-in">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 animate-bounce" />
                  <p className="text-xs font-semibold leading-relaxed">{actionError}</p>
                </div>
                <button onClick={() => setActionError(null)} className="text-rose-500 font-bold hover:text-rose-800 text-base px-2">×</button>
              </div>
            )}

            {actionSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-900 rounded-2xl flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                  <p className="text-xs font-semibold leading-relaxed">{actionSuccess}</p>
                </div>
                <button onClick={() => setActionSuccess(null)} className="text-emerald-500 font-bold hover:text-emerald-800 text-base px-2">×</button>
              </div>
            )}

            {/* TAB CONTENT: HOME (Matches Aurelia Capital layout from image) */}
            {activeUserTab === 'HOME' && (
              <>
                {/* 1. Action Pills: Add, Send, Convert as shown in image */}
                <div className="flex items-center gap-3" id="quick_action_bar">
                  <button 
                    onClick={() => setShowAddMoneyModal(true)}
                    className="bg-white border border-slate-200 hover:border-slate-300 text-slate-800 text-xs font-extrabold px-5 py-3 rounded-xl shadow-sm transition-all flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4 text-slate-500" /> Add money
                  </button>

                  <button 
                    onClick={() => setShowSendMoneyModal(true)}
                    className="bg-white border border-slate-200 hover:border-slate-300 text-slate-800 text-xs font-extrabold px-5 py-3 rounded-xl shadow-sm transition-all flex items-center gap-2"
                  >
                    <Send className="w-4 h-4 text-slate-500" /> Send money
                  </button>
                </div>

                {/* 2. Main Balance Visualization Card with bezier sparkline */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 relative overflow-hidden" id="main_balance_card">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">TOTAL BALANCE</span>
                        <div className="group relative">
                          <Info className="w-3.5 h-3.5 text-slate-300 cursor-help hover:text-slate-500" />
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-56 p-2 bg-slate-900 text-white text-[10px] rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-all z-20">
                            Fonds protégés sur compte de cantonnement DZ71 conforme à la loi.
                          </div>
                        </div>
                      </div>
                      
                      {/* Giant Balance display */}
                      <div className="mt-2 flex items-baseline">
                        <span className="text-4xl font-extrabold tracking-tight text-slate-900">
                          {Math.floor(user.balance).toLocaleString()}
                        </span>
                        <span className="text-xl font-bold text-slate-400 ml-1">
                          .{(user.balance % 1).toFixed(2).split('.')[1]} DA
                        </span>
                      </div>
                    </div>

                    {/* Timeline range dropdown */}
                    <div className="flex items-center gap-1.5 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-500 font-bold cursor-pointer hover:bg-slate-50 transition-all">
                      <span>Last 30 days</span>
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Elegant custom line chart using scalable SVG coords */}
                  <div className="h-44 w-full relative -mx-4">
                    <svg viewBox={`0 0 ${svgData.width} ${svgData.height}`} className="w-full h-full overflow-visible">
                      <defs>
                        {/* Gradient for smooth graph area fill */}
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity="0.12" />
                          <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* X and Y Grid lines */}
                      <line x1={svgData.paddingLeft} y1="20" x2={svgData.width - 20} y2="20" stroke="#f1f5f9" strokeWidth="1" />
                      <line x1={svgData.paddingLeft} y1="75" x2={svgData.width - 20} y2="75" stroke="#f1f5f9" strokeWidth="1" />
                      <line x1={svgData.paddingLeft} y1="130" x2={svgData.width - 20} y2="130" stroke="#f1f5f9" strokeWidth="1" />

                      {/* Left side axis values */}
                      <text x={svgData.paddingLeft - 10} y="24" className="text-[10px] font-mono font-bold text-slate-400" textAnchor="end">
                        {Math.floor(maxVal / 1000)}k
                      </text>
                      <text x={svgData.paddingLeft - 10} y="79" className="text-[10px] font-mono font-bold text-slate-400" textAnchor="end">
                        {Math.floor(((maxVal + minVal) / 2) / 1000)}k
                      </text>
                      <text x={svgData.paddingLeft - 10} y="134" className="text-[10px] font-mono font-bold text-slate-400" textAnchor="end">
                        {Math.floor(minVal / 1000)}k
                      </text>

                      {/* Area Fill */}
                      <path d={svgData.fillD} fill="url(#chartGradient)" />

                      {/* Line Path */}
                      <path d={svgData.pathD} fill="none" stroke="rgb(16, 185, 129)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                      {/* Interactive Circles / Dots on hover */}
                      {svgData.points.map((pt, idx) => (
                        <g key={idx} className="group/dot cursor-pointer">
                          <circle cx={pt.x} cy={pt.y} r="5" fill="rgb(16, 185, 129)" stroke="#white" strokeWidth="2" className="transition-all hover:r-7" />
                          <circle cx={pt.x} cy={pt.y} r="12" fill="rgb(16, 185, 129)" fillOpacity="0" />
                          {/* Tooltip on hovering point */}
                          <foreignObject x={pt.x - 50} y={pt.y - 45} width="100" height="36" className="opacity-0 group-hover/dot:opacity-100 transition-opacity pointer-events-none">
                            <div className="bg-slate-900 text-white text-[9px] font-bold px-2 py-1 rounded shadow text-center font-mono">
                              {pt.balance.toLocaleString()} DA
                            </div>
                          </foreignObject>
                        </g>
                      ))}

                      {/* X Axis dates labels */}
                      {svgData.points.map((pt, idx) => (
                        <text key={idx} x={pt.x} y={svgData.height - 10} className="text-[9px] font-bold text-slate-400 uppercase font-mono" textAnchor="middle">
                          {pt.date}
                        </text>
                      ))}
                    </svg>
                  </div>
                </div>

                {/* Secondary Grid layout matching image details */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  
                  {/* Left Column: My active wallets */}
                  <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <Wallet className="w-4.5 h-4.5 text-slate-500" /> Accounts &amp; IBAN Details
                      </h3>
                      <button 
                        onClick={() => handleCopyIban(user.iban)}
                        className="text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5"
                      >
                        {copiedIban ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedIban ? 'Copied !' : 'Copy IBAN'}</span>
                      </button>
                    </div>

                    <div className="space-y-4">
                      {/* DZD Wallet (Primary) */}
                      <div className="p-4 border border-slate-100 rounded-2xl flex items-center justify-between hover:bg-slate-50/50 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-600">
                            🇩🇿
                          </div>
                          <div>
                            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider font-mono">Algerian Dinar Wallet</span>
                            <span className="block text-sm font-bold text-slate-900 mt-0.5">{user.iban}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="block text-base font-black text-slate-900">{(user.balance).toLocaleString()} DA</span>
                          <span className="text-[10px] text-emerald-600 font-bold">Primary Account</span>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Right Column: Limit tracking & KYC progress */}
                  <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
                    <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Shield className="w-4.5 h-4.5 text-slate-500" /> Compliance Limit Tracker
                    </h3>

                    <div className="space-y-4">
                      {/* Current level display */}
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-slate-500 font-bold">Regulatory Limit Level</span>
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">Active</span>
                        </div>
                        <span className="text-lg font-extrabold text-slate-800">KYC Level {user.kycLevel} / 3</span>
                        <p className="text-[10px] text-slate-400 font-medium mt-1">Conforme à la circulaire 24-02 de la Banque d'Algérie.</p>
                      </div>

                      {user.kycUpgradeRejected && (
                        <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2.5 animate-fadeIn">
                          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="block text-[11px] font-bold text-rose-800 leading-none">Upgrade Limit Request Rejected</span>
                            <span className="block text-[10px] text-rose-600 mt-1 font-medium leading-normal">
                              The compliance department has rejected your high-tier upgrade request after visioconference. Your account remains active under standard Level {user.kycLevel} limits.
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Spend Limit progress bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-500">Daily Debit Limit used:</span>
                          <span className="text-slate-800">{(user.dailyDebitSum || 0).toLocaleString()} / {user.dailyDebitLimit.toLocaleString()} DA</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              ((user.dailyDebitSum || 0) / user.dailyDebitLimit) > 0.85 ? 'bg-rose-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(((user.dailyDebitSum || 0) / user.dailyDebitLimit) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Maximum Balance Cap check */}
                      <div className="space-y-1.5 pt-2">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-500">Balance Cap Threshold:</span>
                          <span className="text-slate-800">{(user.balance).toLocaleString()} / {user.balanceCap.toLocaleString()} DA</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min((user.balance / user.balanceCap) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Upgrade Limits CTA */}
                      {user.kycLevel < 3 && (
                        <button 
                          onClick={() => setShowKycUpgradeModal(true)}
                          className="w-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs font-extrabold py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 mt-4"
                        >
                          <Sparkles className="w-4 h-4" /> Request Level 3 limit upgrade (1M DA)
                        </button>
                      )}

                    </div>
                  </div>

                </div>

                {/* 3. Recent activity list */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <History className="w-4.5 h-4.5 text-slate-500" /> Recent Activities
                    </h3>
                    <span className="text-xs font-bold text-slate-400">{userTxs.length} Transactions found</span>
                  </div>

                  <div className="space-y-3">
                    {userTxs.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-xs font-semibold">
                        No transactions registered yet. Try executing an transfer or deposit.
                      </div>
                    ) : (
                      userTxs.map(tx => {
                        const isDebit = tx.senderIban === user.iban;
                        return (
                          <div key={tx.id} className="p-3.5 border border-slate-50 rounded-xl flex items-center justify-between hover:bg-slate-50/50 transition-all">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                                isDebit ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                              }`}>
                                {isDebit ? <ArrowUpRight className="w-4.5 h-4.5" /> : <ArrowDownLeft className="w-4.5 h-4.5" />}
                              </div>
                              <div>
                                <span className="text-xs font-bold text-slate-900 block">{tx.reference}</span>
                                <span className="text-[10px] text-slate-400 font-mono font-medium block mt-0.5">
                                  {new Date(tx.timestamp).toLocaleString('fr-FR')} | Ref: {tx.id.toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`text-sm font-black block ${
                                isDebit ? 'text-rose-600' : 'text-emerald-600'
                              }`}>
                                {isDebit ? '-' : '+'}{tx.amount.toLocaleString()} DA
                              </span>
                              {tx.fee > 0 && isDebit && (
                                <span className="text-[9px] text-slate-400 font-semibold font-mono">Commission: {tx.fee} DA</span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </>
            )}

            {/* TAB CONTENT: ACCOUNTS list */}
            {activeUserTab === 'ACCOUNTS' && (
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
                <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">Account overview</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  DinarFlow double-entry core ledger guarantees that for every transaction, funds are safely accounted for. Check your assigned IBAN and active balances below.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 border border-slate-100 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 text-white shadow-md relative overflow-hidden">
                    <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
                      <Wallet className="w-48 h-48 -mr-10 -mb-10" />
                    </div>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 font-mono">PRIMARY WALLET (DZD)</span>
                        <h4 className="text-2xl font-black mt-2">{(user.balance).toLocaleString()} DA</h4>
                      </div>
                      <span className="text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md">ACTIVE</span>
                    </div>
                    <div className="mt-12 pt-4 border-t border-slate-700/50 flex justify-between items-center">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">IBAN REFERENCE</p>
                        <p className="text-xs font-mono font-bold tracking-wider mt-1">{user.iban}</p>
                      </div>
                      <button onClick={() => handleCopyIban(user.iban)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all">
                        <Copy className="w-4 h-4 text-slate-300" />
                      </button>
                    </div>
                  </div>

                  <div className="p-6 border border-slate-100 rounded-2xl bg-slate-50 space-y-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">REGULATORY BALANCES SEGREGATION</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Conformément à la réglementation algérienne (Article 20), vos dépôts sont séparés des fonds d'exploitation du PSP et placés sur le compte de cantonnement sécurisé ci-dessous.
                    </p>
                    <div className="p-3 bg-white border border-slate-100 rounded-xl flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-500">Safeguarding Trustee Bank</span>
                      <span className="text-slate-800">Banque d'Algérie (Central)</span>
                    </div>
                    <div className="p-3 bg-white border border-slate-100 rounded-xl flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-500">User Fund Segregation Status</span>
                      <span className="text-emerald-600 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> GUARANTEED 100%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: SERVICES */}
            {activeUserTab === 'SERVICES' && (
              <ServicesTab />
            )}

            {/* TAB CONTENT: CARDS Matches beautiful debit card visuals */}
            {activeUserTab === 'DZT_WALLET' && (
              <DztWalletTab />
            )}

            {/* TAB CONTENT: TRANSACTIONS logs */}
            {activeUserTab === 'TRANSACTIONS' && (
              <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-6 shadow-sm space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">Account ledger statements</h3>
                  <button onClick={onRefresh} className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
                    <RefreshCw className="w-4 h-4 text-slate-500" />
                  </button>
                </div>

                <div className="space-y-3">
                  {userTxs.map(tx => {
                    const isDebit = tx.senderIban === user.iban;
                    return (
                      <div key={tx.id} className="p-4 border border-slate-50 rounded-xl flex flex-col md:flex-row md:items-center justify-between hover:bg-slate-50 transition-all gap-4">
                        <div className="flex items-start gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isDebit ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                          }`}>
                            {isDebit ? <ArrowUpRight className="w-4.5 h-4.5" /> : <ArrowDownLeft className="w-4.5 h-4.5" />}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-900 block">{tx.reference}</span>
                            <span className="text-[10px] text-slate-400 font-mono font-medium block mt-1">
                              ID: {tx.id.toUpperCase()} | Timestamp: {tx.timestamp}
                            </span>
                          </div>
                        </div>

                        <div className="flex md:flex-col items-center md:items-end justify-between md:justify-start pt-2 md:pt-0 border-t md:border-none border-slate-100">
                          <span className={`text-sm font-black block ${
                            isDebit ? 'text-rose-600' : 'text-emerald-600'
                          }`}>
                            {isDebit ? '-' : '+'}{tx.amount.toLocaleString()} DA
                          </span>
                          <span className="text-[9px] text-slate-400 font-semibold font-mono">
                            Sender: {tx.senderIban === user.iban ? 'Me' : tx.senderIban.slice(0, 12) + '...'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB CONTENT: LIMITS */}
            {activeUserTab === 'LIMITS' && (() => {
              const getCooldownRemainingDays = () => {
                if (!user.kycRejectedAt) return 0;
                const rejectedTime = new Date(user.kycRejectedAt).getTime();
                const oneMonthMs = 30 * 24 * 60 * 60 * 1000;
                const remainingMs = (rejectedTime + oneMonthMs) - Date.now();
                if (remainingMs <= 0) return 0;
                return Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
              };

              const cooldownDays = getCooldownRemainingDays();
              const isCooldownActive = user.kycUpgradeRejected && cooldownDays > 0;

              return (
                <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-6 shadow-sm space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="max-w-xl">
                      <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">Compliance limits</h3>
                      <p className="text-xs text-slate-500 leading-relaxed mt-1">
                        DinarFlow adheres strictly to the bank regulation of the Republic of Algeria regarding anti-money laundering (AML) and counter-terrorism financing (CFT).
                      </p>
                    </div>

                    {/* Simulation Panel for Easy Testing */}
                    <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-3 text-xs max-w-sm w-full">
                      <span className="font-bold text-slate-700 block uppercase tracking-wider text-[10px] font-mono">Sandbox compliance testbed</span>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={handleSimulateRejection}
                          className="w-full text-left bg-rose-50 hover:bg-rose-100/80 text-rose-700 font-extrabold px-3 py-2.5 rounded-lg border border-rose-100 transition-all flex items-center gap-2 cursor-pointer"
                        >
                          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                          Simulate KYC Rejection
                        </button>
                        {user.kycUpgradeRejected && (
                          <button
                            onClick={handleSimulateCooldownBypass}
                            className="w-full text-left bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 font-extrabold px-3 py-2.5 rounded-lg border border-emerald-100 transition-all flex items-center gap-2 cursor-pointer"
                          >
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            Simulate 30-Day Pass (Skip Cooldown)
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Cooldown Active Banner */}
                  {isCooldownActive && (
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 animate-pulse">
                      <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider">Upgrade Lock (Regulatory Cooldown)</h4>
                        <p className="text-xs text-rose-700 font-semibold mt-1">
                          Your previous KYC upgrade request was rejected. Per Bank of Algeria compliance guidelines, you must wait 1 month from the date of rejection before you can submit a new application.
                        </p>
                        <p className="text-[11px] text-rose-800 font-extrabold mt-1.5">
                          Remaining wait period: <span className="underline">{cooldownDays} days</span> (cooldown is currently active).
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Level 1 Card */}
                    <div className={`p-5 rounded-2xl border transition-all duration-300 ${user.kycLevel === 1 ? 'border-indigo-500 bg-indigo-50/20 shadow-sm' : 'border-slate-100 bg-slate-50/10'}`}>
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] font-bold text-slate-400 uppercase font-mono block">LEVEL 1 (Basic)</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                          Actif
                        </span>
                      </div>
                      <h4 className="text-base font-extrabold text-slate-800 mt-2">Dépôts mineurs</h4>
                      <div className="space-y-2 mt-4 text-xs font-medium text-slate-600">
                        <p>• Max Balance Cap: 100,000 DA</p>
                        <p>• Daily Debit Limit: 100,000 DA</p>
                        <p>• Requirements: Valid Email + SMS</p>
                      </div>
                    </div>

                    {/* Level 2 Card */}
                    <div className={`p-5 rounded-2xl border transition-all duration-300 ${user.kycLevel === 2 ? 'border-indigo-500 bg-indigo-50/20 shadow-sm' : 'border-slate-100 bg-slate-50/10'}`}>
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] font-bold text-slate-400 uppercase font-mono block">LEVEL 2 (Standard)</span>
                        {user.kycLevel >= 2 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                            Actif
                          </span>
                        ) : user.kycStatus === 'PENDING' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wider animate-pulse">
                            En cours...
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 uppercase tracking-wider">
                            Non Activé
                          </span>
                        )}
                      </div>
                      <h4 className="text-base font-extrabold text-slate-800 mt-2">Compte validé</h4>
                      <div className="space-y-2 mt-4 text-xs font-medium text-slate-600">
                        <p>• Max Balance Cap: 500,000 DA</p>
                        <p>• Daily Debit Limit: 500,000 DA</p>
                        <p>• Requirements: National ID Verification</p>
                      </div>

                      {/* Level 2 upgrade button */}
                      {user.kycLevel === 1 && (
                        <div className="mt-5 pt-4 border-t border-slate-100">
                          {user.kycStatus === 'PENDING' ? (
                            <div className="text-center text-xs font-bold text-amber-600 bg-amber-50/50 py-2 rounded-xl">
                              Demande en cours d'examen
                            </div>
                          ) : isCooldownActive ? (
                            <div className="p-2 bg-rose-50/50 border border-rose-100 rounded-xl text-[10px] text-rose-800 font-medium text-center">
                              Délai d'attente actif ({cooldownDays}j)
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setKycUpgradeTargetLevel(2);
                                setShowKycUpgradeModal(true);
                              }}
                              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold py-3.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <Sparkles className="w-4 h-4" /> Apply for Level 2 Upgrade
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Level 3 Card */}
                    <div className={`p-5 rounded-2xl border transition-all duration-300 ${
                      user.kycLevel === 3
                        ? 'border-indigo-500 bg-indigo-50/20 shadow-sm' 
                        : (user.kycStatus === 'REJECTED' || user.kycUpgradeRejected)
                        ? 'border-rose-300 bg-rose-50/40 shadow-sm'
                        : 'border-slate-100 bg-slate-50/10'
                    }`}>
                      <div className="flex justify-between items-start gap-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase font-mono block">LEVEL 3 (High-Tier)</span>
                        {user.kycLevel === 3 && user.kycStatus === 'ACTIVE' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                            Actif
                          </span>
                        ) : user.kycStatus === 'VISIO_PENDING' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 uppercase tracking-wider animate-pulse">
                            Visio Requise
                          </span>
                        ) : user.kycStatus === 'PENDING' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wider animate-pulse">
                            En cours...
                          </span>
                        ) : (user.kycStatus === 'REJECTED' || user.kycUpgradeRejected) ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-rose-100 text-rose-800 uppercase tracking-wider">
                            Rejeté (Visio)
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 uppercase tracking-wider">
                            Non Activé
                          </span>
                        )}
                      </div>
                      <h4 className="text-base font-extrabold text-slate-800 mt-2">Premium / Merchant</h4>
                      <div className="space-y-2 mt-4 text-xs font-medium text-slate-600">
                        <p>• Max Balance Cap: 1,000,000 DA</p>
                        <p>• Daily Debit Limit: 1,000,000 DA</p>
                        <p>• Requirements: Proof of Address + Visio</p>
                      </div>

                      {/* Level 3 upgrade button */}
                      {user.kycLevel < 3 && (
                        <div className="mt-5 pt-4 border-t border-slate-100">
                          {user.kycStatus === 'PENDING' || user.kycStatus === 'VISIO_PENDING' ? (
                            <div className="text-center text-xs font-bold text-indigo-700 bg-indigo-50/50 py-2 rounded-xl animate-pulse">
                              {user.kycStatus === 'VISIO_PENDING' ? "Entretien visio requis" : "Demande en cours d'examen"}
                            </div>
                          ) : isCooldownActive ? (
                            <div className="p-2 bg-rose-50/50 border border-rose-100 rounded-xl text-[10px] text-rose-800 font-medium text-center">
                              Délai d'attente actif ({cooldownDays}j)
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setKycUpgradeTargetLevel(3);
                                setShowKycUpgradeModal(true);
                              }}
                              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold py-3.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <Sparkles className="w-4 h-4" /> Apply for Level 3 Upgrade
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {activeUserTab === 'MERCHANT' && <MerchantView user={user} accounts={accounts} />}

            {/* LOWER COMPLIANCE DISCLAIMER BANNER EXACTLY LIKE THE PROVIDED IMAGE */}
            <footer className="mt-12 bg-slate-100 rounded-3xl p-6 text-center text-xs text-slate-500 font-semibold max-w-5xl mx-auto border border-slate-200/50 shadow-sm leading-relaxed" id="compliance_footer_banner">
              "DinarFlow" est une entreprise de technologie financière agréée par la Banque d'Algérie en tant qu'établissement de monnaie électronique, et non une banque commerciale de dépôt. Les services bancaires et la garde des dépôts de cantonnement réglementés sont fournis par notre partenaire de compensation bancaire agréé.
            </footer>

          </div>
        </div>
      </div>

      {/* MOBILE COMPLIANT NATIVE VIEW - Matches the provided design 100% */}
      <div className="md:hidden flex-1 flex flex-col bg-slate-50 relative overflow-hidden h-full pb-20">
        
        {/* Top Header Bar */}
        <div className="px-5 pt-4 pb-2 flex items-center justify-between z-10">
          {/* Left top circle button */}
          <button 
            onClick={() => setIsMobileSidebarOpen(true)}
            className="w-11 h-11 rounded-full bg-indigo-950 flex items-center justify-center text-white cursor-pointer shadow-sm hover:opacity-90 active:scale-95 transition-all"
          >
            <LayoutGrid className="w-5 h-5 text-indigo-100" />
          </button>

          {/* Center Wallet/Account Capsule Selector */}
          <div className="relative">
            <select
              value={user.id}
              onChange={(e) => {
                const nextU = accounts.find(a => a.id === e.target.value);
                if (nextU) setCurrentUser(nextU);
              }}
              className="absolute inset-0 opacity-0 cursor-pointer z-20"
            >
              {accounts.map(u => (
                <option key={u.id} value={u.id}>{u.name.split(' ')[0]} (Wallet)</option>
              ))}
            </select>
            <button className="flex items-center gap-1.5 bg-white border border-slate-200/60 rounded-full px-4 py-2 text-xs font-bold text-slate-700 shadow-sm relative z-10">
              <Wallet className="w-3.5 h-3.5 text-indigo-600" />
              <span>Wallet {user.id.replace('acc-', '')}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>

          {/* Right top circle button */}
          <button 
            onClick={() => setAppMode('ADMIN')}
            className="w-11 h-11 rounded-full bg-indigo-950 flex items-center justify-center text-white cursor-pointer shadow-sm hover:opacity-90 active:scale-95 transition-all relative"
          >
            <div className="w-2.5 h-2.5 bg-rose-500 rounded-full absolute top-1 right-1 border-2 border-indigo-950"></div>
            <Bell className="w-5 h-5 text-indigo-100" />
          </button>
        </div>

        {/* Scrollable Mobile Body Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-10 space-y-6">
          
          {/* Main Dashboard Panel inside home tab */}
          {activeUserTab === 'HOME' && (
            <div className="space-y-6">
              
              {/* Giant Balance Visualization Card exactly matching the blue gradient curves in the image */}
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/60 rounded-3xl p-6 relative overflow-hidden shadow-sm border border-indigo-100 flex flex-col justify-between h-48">
                {/* Visual background curve overlays */}
                <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-indigo-200/20 blur-xl pointer-events-none"></div>
                <div className="absolute -left-10 -top-10 w-44 h-44 rounded-full bg-indigo-100/40 blur-2xl pointer-events-none"></div>

                <div className="text-center mt-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Balance</span>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <span className="text-3xl font-black text-indigo-900 leading-none">
                      {Math.floor(user.balance).toLocaleString()}
                    </span>
                    <span className="text-xl font-bold text-indigo-700">DZD</span>
                    <button className="text-indigo-600 hover:text-indigo-800 focus:outline-none ml-1">
                      <Eye className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Pill-shaped buttons side by side at the bottom */}
                <div className="grid grid-cols-2 gap-3.5 mt-auto">
                  <button
                    type="button"
                    onClick={() => setShowAddMoneyModal(true)}
                    className="bg-[#10B981] hover:bg-emerald-600 text-white font-extrabold text-xs py-3.5 rounded-full flex items-center justify-center gap-2 shadow-md shadow-emerald-700/10 active:scale-95 transition-all cursor-pointer"
                  >
                    <ArrowDownLeft className="w-4 h-4 text-emerald-100" />
                    <span>Receive</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowSendMoneyModal(true)}
                    className="bg-[#3B82F6] hover:bg-blue-600 text-white font-extrabold text-xs py-3.5 rounded-full flex items-center justify-center gap-2 shadow-md shadow-blue-700/10 active:scale-95 transition-all cursor-pointer"
                  >
                    <ArrowUpRight className="w-4 h-4 text-blue-100" />
                    <span>Send</span>
                  </button>
                </div>
              </div>

              {/* Recent Transactions List mimicking the exact card structure, badges and colors in the image */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-900 text-sm">Recent Transactions</h4>
                  <button 
                    onClick={() => setActiveUserTab('TRANSACTIONS')} 
                    className="text-indigo-600 hover:text-indigo-800 text-xs font-bold flex items-center gap-1"
                  >
                    <span>View All</span>
                    <RefreshCw className="w-3 h-3 text-indigo-500" />
                  </button>
                </div>

                <div className="space-y-3">
                  {userTxs.length === 0 ? (
                    <div className="text-center py-8 bg-white border border-slate-100 rounded-3xl text-slate-400 text-xs">
                      No recent activities found.
                    </div>
                  ) : (
                    userTxs.map((tx) => {
                      const isDebit = tx.senderIban === user.iban;
                      const truncatedHash = `${tx.id.slice(0, 10).toUpperCase()}...${tx.id.slice(-10).toUpperCase()}`;
                      
                      return (
                        <div 
                          key={tx.id} 
                          className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-xs hover:border-slate-200 transition-all"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                              isDebit ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                            }`}>
                              {isDebit ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-xs text-slate-800 truncate block">
                                  {truncatedHash}
                                </span>
                                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded uppercase shrink-0">
                                  {tx.type === 'CASH_IN' || tx.type === 'AGENT_CASH_IN' ? 'CC' : 'TR'}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                                {new Date(tx.timestamp).toLocaleString('en-US', {
                                  month: 'numeric',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true
                                })}
                              </span>
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-[10px] text-yellow-600 font-semibold flex items-center gap-0.5">
                                  🪙 {tx.fee || '0'} fee
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className={`text-sm font-black block ${
                              isDebit ? 'text-rose-600' : 'text-emerald-600'
                            }`}>
                              {isDebit ? '-' : '+'}{tx.amount.toLocaleString()}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">DZD</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>
          )}

          {/* Active tabs sections adapted beautifully for mobile screen height and widths */}
          {activeUserTab === 'ACCOUNTS' && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider">My Accounts</h3>
              <div className="bg-white rounded-3xl border border-slate-100 p-5 space-y-4">
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Primary Account IBAN</span>
                  <span className="text-xs font-mono font-bold text-slate-700 mt-1 block select-all break-all">{user.iban}</span>
                </div>
                <div className="flex justify-between text-xs py-2 border-b border-slate-50">
                  <span className="text-slate-400">Available Balance</span>
                  <span className="font-extrabold text-slate-800">{user.balance.toLocaleString()} DA</span>
                </div>
                <div className="flex justify-between text-xs py-2 border-b border-slate-50">
                  <span className="text-slate-400">Daily Debit Remaining</span>
                  <span className="font-extrabold text-emerald-600">{(user.dailyDebitLimit - (user.dailyDebitSum || 0)).toLocaleString()} DA</span>
                </div>
              </div>
            </div>
          )}

          {activeUserTab === 'CARDS' && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider">Virtual Cards</h3>
              <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-3xl p-6 text-white relative overflow-hidden shadow-lg h-44 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">DinarFlow Card</span>
                    <p className="text-xs font-mono font-bold tracking-widest mt-1">4215 •••• •••• 1082</p>
                  </div>
                  <span className="text-xs bg-indigo-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider text-indigo-300 border border-indigo-500/30">Visa</span>
                </div>
                <div className="flex justify-between items-end mt-4">
                  <div>
                    <span className="text-[8px] text-slate-400 block uppercase">Cardholder</span>
                    <span className="text-xs font-bold">{user.name}</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-400 block uppercase">Expiry / CVV</span>
                    <span className="text-xs font-mono font-bold">06/29 •••</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setShowVirtualCardModal(true)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-3.5 rounded-2xl shadow-sm transition-all text-center block"
              >
                View Virtual Card Details
              </button>
            </div>
          )}

          {activeUserTab === 'TRANSACTIONS' && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider">Full Ledger Statements</h3>
              <div className="space-y-3">
                {userTxs.map((tx) => {
                  const isDebit = tx.senderIban === user.iban;
                  return (
                    <div key={tx.id} className="bg-white border border-slate-100 rounded-2xl p-4 flex justify-between items-center">
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">{tx.reference}</span>
                        <span className="text-[9px] text-slate-400 block mt-0.5 font-mono">{tx.id}</span>
                      </div>
                      <span className={`text-xs font-black ${isDebit ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {isDebit ? '-' : '+'}{tx.amount.toLocaleString()} DA
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeUserTab === 'LIMITS' && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider">Limits &amp; KYC</h3>
              <div className="bg-white rounded-3xl border border-slate-100 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Current KYC Level</span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md uppercase">Level {user.kycLevel}</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Daily limit usage:</span>
                    <span className="font-bold text-slate-800">{(user.dailyDebitSum || 0).toLocaleString()} / {user.dailyDebitLimit.toLocaleString()} DA</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(user.dailyDebitSum / user.dailyDebitLimit) * 100}%` }}></div>
                  </div>
                </div>
                {user.kycLevel < 3 && (
                  <button 
                    onClick={() => setShowKycUpgradeModal(true)}
                    className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-extrabold text-xs py-3.5 rounded-2xl transition-all"
                  >
                    Request Level 3 Upgrade (1,000,000 DA)
                  </button>
                )}
              </div>
            </div>
          )}

          {activeUserTab === 'MERCHANT' && (
            <MerchantView user={user} accounts={accounts} />
          )}

          {activeUserTab === 'DEVELOPER' && (
            <DeveloperApiTab />
          )}

          {activeUserTab === 'SERVICES' && (
            <ServicesTab />
          )}

        </div>

        {/* Floating backdrop-blurred Glass Bottom Navigation Dock exactly like the image */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none z-40">
          <div className="max-w-md mx-auto bg-white/80 backdrop-blur-md shadow-lg border border-slate-200/50 rounded-full p-2 flex justify-around items-center pointer-events-auto relative">
            
            {/* Nav Item: Home */}
            <button
              onClick={() => setActiveUserTab('HOME')}
              className={`flex flex-col items-center justify-center p-2 rounded-full transition-all relative ${
                activeUserTab === 'HOME' ? 'text-indigo-600 bg-indigo-50/80 px-4' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className="flex items-center gap-1">
                <LayoutDashboard className="w-5 h-5" />
                {activeUserTab === 'HOME' && <span className="text-[10px] font-black tracking-tight">Home</span>}
              </div>
            </button>

            {/* Nav Item: Hub */}
            <button
              onClick={() => setActiveUserTab('MERCHANT')}
              className={`flex flex-col items-center justify-center p-2 rounded-full transition-all relative ${
                activeUserTab === 'MERCHANT' ? 'text-indigo-600 bg-indigo-50/80 px-4' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className="flex items-center gap-1">
                <Briefcase className="w-5 h-5" />
                {activeUserTab === 'MERCHANT' && <span className="text-[10px] font-black tracking-tight">Hub</span>}
              </div>
            </button>

            {/* Floating Scanning Reticle Center Trigger */}
            <button
              onClick={() => setShowQrPaymentModal(true)}
              className="w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex flex-col items-center justify-center shadow-lg shadow-indigo-600/30 active:scale-90 transition-all z-50 -translate-y-4"
            >
              <QrCode className="w-6 h-6" />
              <span className="text-[8px] font-extrabold uppercase tracking-wider mt-0.5">Scan</span>
            </button>

            {/* Nav Item: Ledger */}
            <button
              onClick={() => setActiveUserTab('LIMITS')}
              className={`flex flex-col items-center justify-center p-2 rounded-full transition-all relative ${
                activeUserTab === 'LIMITS' ? 'text-indigo-600 bg-indigo-50/80 px-4' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className="flex items-center gap-1">
                <Shield className="w-5 h-5" />
                {activeUserTab === 'LIMITS' && <span className="text-[10px] font-black tracking-tight">Limits</span>}
              </div>
            </button>

            {/* Nav Item: Cards */}
            <button
              onClick={() => setActiveUserTab('CARDS')}
              className={`flex flex-col items-center justify-center p-2 rounded-full transition-all relative ${
                activeUserTab === 'CARDS' ? 'text-indigo-600 bg-indigo-50/80 px-4' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className="flex items-center gap-1">
                <CreditCard className="w-5 h-5" />
                {activeUserTab === 'CARDS' && <span className="text-[10px] font-black tracking-tight">Cards</span>}
              </div>
            </button>

          </div>
        </div>

      </div>

      {/* MODAL 1: ADD MONEY (Cash-In) */}
      {showAddMoneyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 w-full max-w-md p-6 overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" /> Dépôt de fonds
              </h3>
              <button onClick={() => setShowAddMoneyModal(false)} className="text-slate-400 hover:text-slate-700 text-xl font-bold">×</button>
            </div>

            <form onSubmit={handleAddMoneySubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1.5">Méthode de dépôt</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAddMoneyForm(p => ({ ...p, method: 'AGENT' }))}
                    className={`py-3 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center gap-2 ${
                      addMoneyForm.method === 'AGENT' 
                        ? 'border-indigo-600 bg-indigo-50/30 text-indigo-900' 
                        : 'border-slate-100 bg-white hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <MapPin className="w-5 h-5" />
                    <span>Agent d'espèces agréé</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddMoneyForm(p => ({ ...p, method: 'CARD' }))}
                    className={`py-3 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center gap-2 ${
                      addMoneyForm.method === 'CARD' 
                        ? 'border-indigo-600 bg-indigo-50/30 text-indigo-900' 
                        : 'border-slate-100 bg-white hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                    <span>Carte CIB / Visa</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1.5">Montant (DA)</label>
                <input 
                  type="number" 
                  required
                  placeholder="Saisissez le montant en Dinar Algérien" 
                  value={addMoneyForm.amount}
                  onChange={(e) => setAddMoneyForm(p => ({ ...p, amount: e.target.value }))}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-600 font-bold"
                />
              </div>

              {addMoneyForm.method === 'AGENT' ? (
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase block mb-1.5">Sélectionnez l'Agent d'espèces (Article 20)</label>
                  <select
                    required
                    value={addMoneyForm.agentId}
                    onChange={(e) => setAddMoneyForm(p => ({ ...p, agentId: e.target.value }))}
                    className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-600 font-semibold"
                  >
                    <option value="">-- Sélectionnez un agent physique --</option>
                    {agents.filter(a => a.isActive).map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({a.location}) - Vault: {(a.cashRegisters['df-psp'] || 0).toLocaleString()} DA</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase block mb-1.5">Numéro de carte CIB</label>
                    <input 
                      type="text" 
                      required
                      placeholder="4000 1234 5678 9010" 
                      value={addMoneyForm.cardNumber}
                      onChange={(e) => setAddMoneyForm(p => ({ ...p, cardNumber: e.target.value }))}
                      className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-600 font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase block mb-1.5">Date d'expiration</label>
                      <input 
                        type="text" 
                        required
                        placeholder="MM/AA" 
                        value={addMoneyForm.expiry}
                        onChange={(e) => setAddMoneyForm(p => ({ ...p, expiry: e.target.value }))}
                        className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase block mb-1.5">CVV</label>
                      <input 
                        type="text" 
                        required
                        placeholder="123" 
                        value={addMoneyForm.cvv}
                        onChange={(e) => setAddMoneyForm(p => ({ ...p, cvv: e.target.value }))}
                        className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              <button 
                type="submit"
                disabled={loadingAction}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3 rounded-xl shadow-md shadow-indigo-600/10 transition-all flex items-center justify-center gap-1.5 mt-6"
              >
                {loadingAction ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                <span>Confirmer le dépôt sécurisé</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SEND MONEY (Transfer) */}
      {showSendMoneyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 w-full max-w-md p-6 overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Send className="w-5 h-5 text-indigo-600" /> Transfert sécurisé
              </h3>
              <button onClick={() => setShowSendMoneyModal(false)} className="text-slate-400 hover:text-slate-700 text-xl font-bold">×</button>
            </div>

            <form onSubmit={handleTransferSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1.5">IBAN du bénéficiaire</label>
                <input 
                  type="text" 
                  required
                  placeholder="DZ54 007 00123 10002345000X XX" 
                  value={transferForm.recipientIban}
                  onChange={(e) => setTransferForm(p => ({ ...p, recipientIban: e.target.value }))}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-600 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1.5">Montant à envoyer (DA)</label>
                <input 
                  type="number" 
                  required
                  placeholder="Saisissez le montant" 
                  value={transferForm.amount}
                  onChange={(e) => setTransferForm(p => ({ ...p, amount: e.target.value }))}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-600 font-bold"
                />
                <span className="text-[10px] text-slate-400 font-semibold block mt-1">Sujet à des frais de transfert de 0,5% (Plafonné à 1000 DA)</span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1.5">Motif ou référence</label>
                <input 
                  type="text" 
                  placeholder="Ex : Remboursement, cadeau..." 
                  value={transferForm.reference}
                  onChange={(e) => setTransferForm(p => ({ ...p, reference: e.target.value }))}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-600 font-semibold"
                />
              </div>

              {/* SCA 2FA Validation Box */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                    <Smartphone className="w-4 h-4 text-indigo-600" /> Validation 2FA OTP
                  </span>
                  <button 
                    type="button" 
                    onClick={triggerOtpGeneration}
                    className="text-xs font-extrabold text-indigo-600 hover:text-indigo-800"
                  >
                    Obtenir le code OTP
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <input 
                    type="text" 
                    required
                    maxLength={6}
                    placeholder="Saisissez le code à 6 chiffres" 
                    value={transferForm.otpCode}
                    onChange={(e) => setTransferForm(p => ({ ...p, otpCode: e.target.value }))}
                    className="flex-1 p-3 rounded-xl border border-slate-200 text-center tracking-[0.25em] text-sm focus:outline-none focus:border-indigo-600 font-mono font-extrabold"
                  />
                  {simulatedOtp && (
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Code de test</span>
                      <span className="text-xs font-mono font-black text-emerald-600">{simulatedOtp}</span>
                    </div>
                  )}
                </div>
                {otpTimer > 0 && (
                  <span className="text-[10px] text-indigo-500 font-semibold block">Expire dans {otpTimer} secondes.</span>
                )}
              </div>

              <button 
                type="submit"
                disabled={loadingAction}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3 rounded-xl shadow-md shadow-indigo-600/10 transition-all flex items-center justify-center gap-1.5 mt-6"
              >
                {loadingAction ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Exécuter le virement Double-Entrée</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: KYC UPGRADE */}
      {showKycUpgradeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 w-full max-w-md p-6 overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" /> Regulatory Upgrade Request (Level {kycUpgradeTargetLevel})
              </h3>
              <button onClick={() => setShowKycUpgradeModal(false)} className="text-slate-400 hover:text-slate-700 text-xl font-bold">×</button>
            </div>

            <form onSubmit={handleKycUpgradeSubmit} className="space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                {kycUpgradeTargetLevel === 2 
                  ? "To upgrade your daily transactional limits to 500,000 DA (Level 2 standard account), you must submit a valid Government ID."
                  : "To upgrade your daily transactional limits to 1,000,000 DA (Level 3 premium account), you must submit a valid Government ID and proof of residence."
                }
              </p>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1.5">Type de document</label>
                <select
                  value={kycUpgradeForm.docType}
                  onChange={(e: any) => setKycUpgradeForm(p => ({ ...p, docType: e.target.value }))}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none"
                >
                  <option value="NATIONAL_ID">Carte Nationale d'Identité Biométrique</option>
                  <option value="PASSPORT">Passeport Biométrique</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1.5">Numéro du document</label>
                <input 
                  type="text" 
                  required
                  placeholder="Saisissez le numéro" 
                  value={kycUpgradeForm.idNumber}
                  onChange={(e) => setKycUpgradeForm(p => ({ ...p, idNumber: e.target.value }))}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-600 font-bold"
                />
              </div>

              {/* ID Front side */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1.5">
                  Recto de la pièce d'identité (Scan Front) <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="file" 
                  id="id-front-upload"
                  accept="image/*"
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setKycUpgradeForm(p => ({
                        ...p,
                        idCardFrontUrl: URL.createObjectURL(file),
                        idCardFrontName: file.name
                      }));
                    }
                  }}
                />
                <label 
                  htmlFor="id-front-upload"
                  className="p-3 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-800">
                        {kycUpgradeForm.idCardFrontName || "Téléverser le Recto"}
                      </p>
                      <p className="text-[10px] text-slate-400">Scanned front side image</p>
                    </div>
                  </div>
                  {kycUpgradeForm.idCardFrontUrl && (
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] px-2.5 py-0.5 rounded-full font-bold">Prêt</span>
                  )}
                </label>
              </div>

              {/* ID Back side */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase block mb-1.5">
                  Verso de la pièce d'identité (Scan Back) <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="file" 
                  id="id-back-upload"
                  accept="image/*"
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setKycUpgradeForm(p => ({
                        ...p,
                        idCardBackUrl: URL.createObjectURL(file),
                        idCardBackName: file.name
                      }));
                    }
                  }}
                />
                <label 
                  htmlFor="id-back-upload"
                  className="p-3 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-800">
                        {kycUpgradeForm.idCardBackName || "Téléverser le Verso"}
                      </p>
                      <p className="text-[10px] text-slate-400">Scanned back side image</p>
                    </div>
                  </div>
                  {kycUpgradeForm.idCardBackUrl && (
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] px-2.5 py-0.5 rounded-full font-bold">Prêt</span>
                  )}
                </label>
              </div>

              {/* Address Proof (PDF only) */}
              {kycUpgradeTargetLevel === 3 && (
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase block mb-1.5">
                    Justificatif de domicile (PDF obligatoire) <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="file" 
                    id="address-pdf-upload"
                    accept=".pdf"
                    className="hidden" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
                          alert("Erreur : Le justificatif de domicile doit impérativement être un fichier au format PDF.");
                          return;
                        }
                        setKycUpgradeForm(p => ({
                          ...p,
                          addressPdfUrl: URL.createObjectURL(file),
                          addressPdfName: file.name
                        }));
                      }
                    }}
                  />
                  <label 
                    htmlFor="address-pdf-upload"
                    className="p-3 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-slate-800">
                          {kycUpgradeForm.addressPdfName || "Téléverser le PDF de résidence"}
                        </p>
                        <p className="text-[10px] text-slate-400">Official proof of address (.pdf)</p>
                      </div>
                    </div>
                    {kycUpgradeForm.addressPdfUrl && (
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] px-2.5 py-0.5 rounded-full font-bold">PDF</span>
                    )}
                  </label>
                </div>
              )}

              {/* Simulated Demo Files Button */}
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {
                    setKycUpgradeForm(p => ({
                      ...p,
                      idCardFrontUrl: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=400&auto=format&fit=crop',
                      idCardFrontName: 'carte_biometrique_recto_scanned.png',
                      idCardBackUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=400&auto=format&fit=crop',
                      idCardBackName: 'carte_biometrique_verso_scanned.png',
                      addressPdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                      addressPdfName: 'certificat_residence_alger.pdf'
                    }));
                  }}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer focus:outline-none"
                >
                  ⚡ Simuler des fichiers conformes (Recto, Verso & PDF)
                </button>
              </div>

              <button 
                type="submit"
                disabled={loadingAction}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 mt-6"
              >
                {loadingAction ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                <span>Soumettre le dossier KYC {kycUpgradeTargetLevel}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: VIRTUAL CARD */}
      {showVirtualCardModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 w-full max-w-md p-6 overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" /> Virtual CIB Card Provisioning
              </h3>
              <button onClick={() => setShowVirtualCardModal(false)} className="text-slate-400 hover:text-slate-700 text-xl font-bold">×</button>
            </div>

            <div className="space-y-4 text-center">
              <div className="p-4 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-2xl">
                Carte de débit virtuelle CIB provisionnée avec succès sous licence réglementaire.
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Votre carte virtuelle DinarFlow a été rattachée à votre solde DZD. Vous pouvez l'utiliser immédiatement pour des transactions en ligne ou des paiements de factures.
              </p>
              <button 
                onClick={() => setShowVirtualCardModal(false)}
                className="w-full bg-slate-900 text-white font-extrabold py-3 rounded-xl hover:bg-slate-800 transition-all"
              >
                Terminer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: QR CODE CONTACTLESS PAYMENT CONFIRMATION */}
      {showQrPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" id="qr_payment_confirm_modal">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 w-full max-w-md overflow-hidden">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="text-base font-extrabold flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-400" /> Confirm QR Code Payment
              </h3>
              <button onClick={() => { setShowQrPaymentModal(false); setActionError(null); setActionSuccess(null); }} className="text-slate-400 hover:text-white text-xl font-bold">×</button>
            </div>

            <form onSubmit={handleQrPaymentSubmit} className="p-6 space-y-4">
              
              {actionError && (
                <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-800 text-xs font-bold rounded-2xl flex items-start gap-2 animate-shake">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{actionError}</span>
                </div>
              )}

              {actionSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-bold rounded-2xl flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{actionSuccess}</span>
                </div>
              )}

              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
                <div className="text-center pb-2 border-b border-slate-100">
                  <span className="text-xs text-slate-400 uppercase font-bold">You are paying</span>
                  <p className="text-2xl font-black text-slate-900 mt-1">{qrPaymentForm.amount.toLocaleString()} DA</p>
                  <span className="text-[10px] text-slate-400 font-medium">Zero processing fees</span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">To Merchant:</span>
                    <span className="text-slate-800 font-extrabold">{qrPaymentForm.recipientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Merchant IBAN:</span>
                    <span className="text-slate-800 font-mono font-bold truncate max-w-[200px]">{qrPaymentForm.recipientIban}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Reference / Invoice:</span>
                    <span className="text-slate-800 font-mono font-bold">{qrPaymentForm.reference}</span>
                  </div>
                  <div className="pt-1.5 border-t border-slate-100 flex justify-between">
                    <span className="text-slate-400 font-medium">Debit Account:</span>
                    <span className="text-indigo-600 font-bold">{user.name} (My Wallet)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Available Balance:</span>
                    <span className="text-slate-800 font-bold">{user.balance.toLocaleString()} DA</span>
                  </div>
                </div>
              </div>

              {/* Secure 2FA Section */}
              <div className="bg-indigo-50/50 border border-indigo-100/50 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold uppercase text-slate-500">Secure Payment Validation OTP</label>
                  <button
                    type="button"
                    onClick={triggerQrOtpGeneration}
                    className="text-[10px] font-bold text-indigo-600 bg-white hover:bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg transition-all"
                  >
                    {qrOtpTimer > 0 ? `Resend (${qrOtpTimer}s)` : 'Send SMS OTP'}
                  </button>
                </div>

                <input
                  type="text"
                  required
                  placeholder="Enter 6-digit OTP code"
                  value={qrPaymentForm.otpCode}
                  onChange={(e) => setQrPaymentForm({ ...qrPaymentForm, otpCode: e.target.value })}
                  className="w-full text-center tracking-widest text-lg font-bold border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                />

                {simulatedQrOtp && (
                  <div className="p-2.5 bg-yellow-50 border border-yellow-100 rounded-xl text-center">
                    <p className="text-[11px] font-medium text-yellow-800 flex items-center justify-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-yellow-600 animate-bounce" />
                      <span>Simulated SMS OTP Code: <strong>{simulatedQrOtp}</strong> (Auto-filled)</span>
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowQrPaymentModal(false); setActionError(null); setActionSuccess(null); }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-xs transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loadingAction || user.balance < qrPaymentForm.amount}
                  className={`flex-1 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all text-white ${
                    user.balance < qrPaymentForm.amount
                      ? 'bg-slate-300 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {loadingAction ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  <span>{user.balance < qrPaymentForm.amount ? 'Solde Insuffisant' : 'Confirmer & Payer'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
