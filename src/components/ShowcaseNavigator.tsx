import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Laptop,
  Key,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Upload,
  Eye,
  Camera,
  DollarSign,
  Globe,
  Building,
  Bell,
  CreditCard,
  Lock,
  Shield,
  Activity,
  FileText,
  LayoutGrid,
  Wallet,
  Check,
  ChevronDown,
  ArrowDownLeft,
  ArrowUpRight,
  Briefcase,
  ExternalLink,
  Plus,
  Users,
  Download,
  Sparkles
} from 'lucide-react';
import { UserAccount, LedgerTransaction, Agent } from '../types';

interface ShowcaseNavigatorProps {
  accounts: UserAccount[];
  transactions: LedgerTransaction[];
  agents: Agent[];
  onRefresh: () => void;
  setCurrentUser: (u: UserAccount) => void;
  setAppMode: (mode: 'ADMIN' | 'USER') => void;
  setAppLayoutMode: (mode: 'SHOWCASE' | 'CORE') => void;
}

export default function ShowcaseNavigator({
  accounts,
  transactions,
  agents,
  onRefresh,
  setCurrentUser,
  setAppMode,
  setAppLayoutMode
}: ShowcaseNavigatorProps) {
  // Navigation for showcase phases
  const [activePhase, setActivePhase] = useState<number>(1);
  const [demoStepMsg, setDemoStepMsg] = useState<string | null>(null);

  // Form states for scenario simulations
  // Phase 1 Login
  const [p1Email, setP1Email] = useState('abdou.ecom23@gmail.com');
  const [p1Password, setP1Password] = useState('password123');
  const [isP1Success, setIsP1Success] = useState(false);

  // Phase 3 Onboarding
  const [p3Name, setP3Name] = useState('Mounir');
  const [p3Surname, setP3Surname] = useState('Hadj Nacer');
  const [p3Email, setP3Email] = useState('oasishabib88@dinarflow.com');
  const [p3Trade, setP3Trade] = useState('Kialen Seller');
  const [isP3Finished, setIsP3Finished] = useState(false);

  // Phase 4 KYC Upload
  const [p4IdUploaded, setP4IdUploaded] = useState(true);
  const [p4IncomeUploaded, setP4IncomeUploaded] = useState(true);
  const [p4LastName, setP4LastName] = useState('HADJ NACER');
  const [p4FirstName, setP4FirstName] = useState('Mounir');
  const [p4DocId, setP4DocId] = useState('DZ-9177263');
  const [p4Progress, setP4Progress] = useState(100);
  const [isP4Submitting, setIsP4Submitting] = useState(false);

  // Phase 5 Video Interview Review
  const [p5ReviewStatus, setP5ReviewStatus] = useState<'VISIO_PENDING' | 'APPROVED' | 'REJECTED'>('VISIO_PENDING');
  const [p5Comments, setP5Comments] = useState('Biometric ID scan matches citizen live video feed. Core financial limit upgraded.');

  // Phase 6 Agent
  const [p6SelectedAgent, setP6SelectedAgent] = useState('agent-1');
  const [p6Workflow, setP6Workflow] = useState<'CASH_IN' | 'CASH_OUT'>('CASH_IN');
  const [p6Amount, setP6Amount] = useState('5000');
  const [p6Iban, setP6Iban] = useState('');
  const [p6SuccessMsg, setP6SuccessMsg] = useState<string | null>(null);

  // Phase 7 SCA Auth
  const [p7Code, setP7Code] = useState(['', '', '', '', '', '']);
  const [p7Verified, setP7Verified] = useState(false);

  // Phase 8 Reporting
  const [p8ReportType, setP8ReportType] = useState('Monthly volume');
  const [p8Format, setP8Format] = useState('ISO 20022 XML');
  const [p8DateFrom, setP8DateFrom] = useState('2021-01-03');
  const [p8DateTo, setP8DateTo] = useState('2021-06-07');
  const [p8Logs, setP8Logs] = useState([
    'Mock inter-bank network integration status: CONNECTED',
    'Clearing and settlement with Algeria RTGS/ACH: SUCCESS',
    'ISO 20022 XML formatted document generated on schemas',
    'Cantonment-side double-entry ledger audited',
    'ISO 20022 compliant clearing payload ready'
  ]);

  // Sync some initial states
  useEffect(() => {
    if (accounts.length > 0 && !p6Iban) {
      setP6Iban(accounts[0].iban);
    }
  }, [accounts]);

  const showDemoToast = (msg: string) => {
    setDemoStepMsg(msg);
    setTimeout(() => setDemoStepMsg(null), 4000);
  };

  // Phase 1 Actions
  const handleP1SignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setIsP1Success(true);
    showDemoToast('Successfully signed in. Loading User Onboarding Portal...');
    setTimeout(() => {
      setActivePhase(3); // Auto-navigate to User level 1 onboarding
    }, 1500);
  };

  // Phase 3 Onboarding Action
  const handleP3Next = () => {
    setIsP3Finished(true);
    showDemoToast('Level 1 limits pre-configured. Directing to Phase 2 KYC details...');
    setTimeout(() => {
      setActivePhase(4); // Switch to Phase 2 KYC submissions
    }, 1500);
  };

  // Phase 4 KYC upload Action
  const handleP4Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsP4Submitting(true);
    setTimeout(() => {
      setIsP4Submitting(false);
      showDemoToast('Documents submitted to administrative review queue. Opening Compliance Operator review board...');
      setActivePhase(5); // Switch to Operator manual review
    }, 1500);
  };

  // Phase 5 Operator Action
  const handleP5OperatorAction = (status: 'APPROVED' | 'REJECTED') => {
    setP5ReviewStatus(status);
    if (status === 'APPROVED') {
      showDemoToast(`Citizen upgraded to Level 2 (500,000 DA Cap). Sending strong authentication token...`);
      setTimeout(() => {
        setActivePhase(7); // Switch to Strong Auth (SCA)
      }, 1500);
    } else {
      showDemoToast('KYC rejected. Requesting resubmission from citizen.');
    }
  };

  // Phase 6 Agent transaction action
  const handleP6AgentTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!p6Amount || Number(p6Amount) <= 0) return;
    try {
      // Direct API execution to simulate actual network flow
      const response = await fetch('/api/transactions/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: p6Workflow === 'CASH_IN' ? 'AGENT_CASH_IN' : 'AGENT_CASH_OUT',
          amount: Number(p6Amount),
          senderIban: p6Workflow === 'CASH_IN' ? 'AGENT_REGISTER' : p6Iban,
          receiverIban: p6Workflow === 'CASH_IN' ? p6Iban : 'AGENT_REGISTER',
          reference: `Agent ${p6Workflow} verification sandbox`,
          otpCode: '123456', // Pre-verified token
          agentId: p6SelectedAgent
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Agent core rejection');
      
      setP6SuccessMsg(`Successfully executed ${p6Workflow} of ${Number(p6Amount).toLocaleString()} DA!`);
      showDemoToast(`Agent ${p6Workflow} logged in double-entry cantonment ledger.`);
      onRefresh();
      setTimeout(() => setP6SuccessMsg(null), 4000);
    } catch (err: any) {
      showDemoToast(`Core error: ${err.message}`);
    }
  };

  // Phase 7 Strong Customer Authentication Action
  const handleP7Submit = () => {
    setP7Verified(true);
    showDemoToast('Strong Customer Authentication (SCA) verified successfully. Executing high-risk transfer.');
    setTimeout(() => {
      setActivePhase(8); // Switch to ISO reporting
    }, 1500);
  };

  const handleP7CodeChange = (index: number, val: string) => {
    if (val.length > 1) return;
    const nextCode = [...p7Code];
    nextCode[index] = val;
    setP7Code(nextCode);

    // Auto-focus next input
    if (val && index < 5) {
      const nextInput = document.getElementById(`p7-otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  // Phase 8 Administrative Export Action
  const handleP8Export = () => {
    showDemoToast('Exporting fully validated ISO 20022 clearing documents to external inter-bank settlement network...');
    
    const isoMessage = {
      Document: {
        CstmrCdtTrfInitn: {
          GrpHdr: {
            MsgId: `ISO-DF-${Date.now()}`,
            CreDtTm: new Date().toISOString(),
            NbOfTxs: transactions.length,
            CtrlSum: transactions.reduce((acc, t) => acc + t.amount, 0),
            InitgPty: { Nm: "DinarFlow Algerian PSP Gateway" }
          },
          PmtInf: transactions.map((t, idx) => ({
            PmtInfId: `PMT-INF-${idx + 1}`,
            PmtMtd: "TRF",
            ReqdExctnDt: t.timestamp.split('T')[0],
            Dbtr: { Nm: t.senderIban === 'AGENT_REGISTER' ? 'Agent Cash Box' : 'DinarFlow Verified Wallet' },
            DbtrAcct: { Id: { Othr: { Id: t.senderIban } } },
            DbtrAgt: { FinInstnId: { BICFI: "DIFWDZAL" } },
            CdtTrfTxInf: {
              PmtId: { EndToEndId: t.id },
              Amt: { InstdAmt: { value: t.amount, currency: "DZD" } },
              CdtrAgt: { FinInstnId: { BICFI: "DZBKALGER" } },
              CdtrAcct: { Id: { Othr: { Id: t.receiverIban } } },
              RmtInf: { Ustrd: t.reference }
            }
          }))
        }
      }
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(isoMessage, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute("href", dataStr);
    dl.setAttribute("download", `ISO_20022_CLEARING_${p8DateFrom}_TO_${p8DateTo}.json`);
    document.body.appendChild(dl);
    dl.click();
    dl.remove();
  };

  const phases = [
    { id: 1, name: "(1) Mobile PWA Login", type: "Mobile" },
    { id: 2, name: "(2) Admin Dashboard (Tremor)", type: "Desktop" },
    { id: 3, name: "(3) Level 1 Onboarding", type: "Mobile" },
    { id: 4, name: "(4) Phase 2 KYC Submission", type: "Mobile" },
    { id: 5, name: "(5) Phase 2 Operator Review", type: "Desktop" },
    { id: 6, name: "(6) Phase 4 Agent Workflows", type: "Mobile" },
    { id: 7, name: "(7) Phase 5 Strong Auth (SCA)", type: "Mobile" },
    { id: 8, name: "(8) Phase 6 ISO Interoperability", type: "Desktop" }
  ];

  return (
    <div className="w-full flex flex-col bg-slate-900 border-b border-indigo-950/80 shrink-0 select-none z-50 shadow-md relative">
      
      {/* Demo helper alert overlay */}
      {demoStepMsg && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-indigo-600 text-white font-sans text-xs font-bold px-6 py-3 rounded-full shadow-2xl z-50 border border-indigo-400/30 flex items-center gap-2 animate-bounce">
          <Activity className="w-4 h-4 animate-spin" />
          <span>{demoStepMsg}</span>
        </div>
      )}

      {/* Modern High-Contrast Top Control Center */}
      <div className="bg-slate-950 px-6 py-3 border-b border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-white text-sm shadow-inner shadow-indigo-400/20">
            PSP
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-tight text-slate-100 flex items-center gap-1.5">
              DinarFlow Compliance &amp; UX Showcase
            </span>
            <p className="text-[10px] text-slate-400 font-medium">Click tabs to experience the exact user interactions, forms and screens shown in the images</p>
          </div>
        </div>

        {/* Action controllers */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setAppMode('ADMIN');
              setAppLayoutMode('CORE');
            }}
            className="text-[10px] font-extrabold bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-md border border-slate-700 transition-all cursor-pointer"
          >
            Enter Admin Core View
          </button>
          <button
            onClick={() => {
              setAppMode('USER');
              if (accounts.length > 0) setCurrentUser(accounts[0]);
              setAppLayoutMode('CORE');
            }}
            className="text-[10px] font-extrabold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 px-3 py-1.5 rounded-md border border-indigo-500/30 transition-all cursor-pointer"
          >
            Enter Client Wallet View
          </button>
        </div>
      </div>

      {/* Interactive Tabs Row */}
      <div className="bg-slate-900 px-4 overflow-x-auto border-b border-slate-800/40 py-2.5 scrollbar-thin flex gap-1.5">
        {phases.map((p) => (
          <button
            key={p.id}
            onClick={() => {
              setActivePhase(p.id);
              showDemoToast(`Switched to: ${p.name}`);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 border ${
              activePhase === p.id
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/15'
                : 'bg-slate-950/40 text-slate-400 hover:bg-slate-950/70 border-slate-800/60'
            }`}
          >
            {p.type === 'Mobile' ? <Smartphone className="w-3.5 h-3.5" /> : <Laptop className="w-3.5 h-3.5" />}
            <span>{p.name}</span>
          </button>
        ))}
      </div>

      {/* Main Split Interface Area */}
      <div className="grid grid-cols-1 xl:grid-cols-12 bg-slate-950 p-6 gap-6 items-stretch min-h-[580px]">
        
        {/* Left Explanation Column (4/12) */}
        <div className="xl:col-span-4 bg-slate-900 rounded-2xl border border-slate-800/50 p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20 uppercase tracking-widest font-mono">
                {phases[activePhase - 1].type} Layout
              </span>
              <span className="text-slate-500 text-xs font-mono">• Compliance Step {activePhase}</span>
            </div>

            <h3 className="text-lg font-black text-slate-100">{phases[activePhase - 1].name}</h3>
            
            <div className="text-xs text-slate-300 space-y-3 leading-relaxed font-sans">
              {activePhase === 1 && (
                <>
                  <p>This layout implements the **Mobile PWA Login** screen shown in Screen (1) of the compliance specification mockups.</p>
                  <p className="text-slate-400 font-medium">Algerian Central Bank regulations mandate robust client identity and credentials separation. DinarFlow implements full mobile login flows, complete with secure credential checking and Google OAuth hooks.</p>
                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg space-y-1 font-mono text-[10px] text-slate-400">
                    <p className="font-bold text-slate-300">💡 Interactive Hint:</p>
                    <p>Enter email and click the primary "Sign In" button to simulate authentic login verification. It will trigger a transition to the User Onboarding portal.</p>
                  </div>
                </>
              )}
              {activePhase === 2 && (
                <>
                  <p>This screen implements the premium **Dark-Themed Admin Dashboard** shown in Screen (2) of the compliance spec.</p>
                  <p className="text-slate-400 font-medium">It features active user statistics (2,596 active users), detailed account lists, and dual vector charts mapping real-time double-entry ledger performance across all active wallets.</p>
                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg space-y-1 font-mono text-[10px] text-slate-400">
                    <p className="font-bold text-slate-300">📊 Chart Elements:</p>
                    <p>• Neon blue gradient curve represents growth trends of live DZD accounts.</p>
                    <p>• Vertical column chart tracks transactions volume mapped instantly from the ledger.</p>
                  </div>
                </>
              )}
              {activePhase === 3 && (
                <>
                  <p>This layout represents **User Level 1 Onboarding** shown in Screen (3) of the compliance flow.</p>
                  <p className="text-slate-400 font-medium">Algerian KYC mandates Level 1 accounts are capped at a limited Dinar flow threshold (100K DA). Citizens must enter their core parameters (Full Name, verified Email, and Trade category) to register.</p>
                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg space-y-1 font-mono text-[10px] text-slate-400">
                    <p className="font-bold text-slate-300">💡 Interactive Hint:</p>
                    <p>Confirm the prefilled citizen profile data (extracted for Mounir Hadj Nacer) and click "Next" to trigger a transition to Level 2 submission.</p>
                  </div>
                </>
              )}
              {activePhase === 4 && (
                <>
                  <p>This screen houses **Phase 2 KYC Submissions** shown in Screen (4) of the compliance images.</p>
                  <p className="text-slate-400 font-medium">To unlock Level 2 limits (up to 500,000 DA), users submit front/back biometric ID cards and income proofs. Advanced OCR extraction automatically pre-fills parameters with 100% compliance.</p>
                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg space-y-1 font-mono text-[10px] text-slate-400">
                    <p className="font-bold text-slate-300">💡 Interactive Hint:</p>
                    <p>View the active pre-filled OCR fields mapping ID number, first name, and last name. Click "Upload &amp; Submit" to simulate compliance ingestion.</p>
                  </div>
                </>
              )}
              {activePhase === 5 && (
                <>
                  <p>This widescreen layout showcases the **Phase 2 KYC review by operator** board shown in Screen (5).</p>
                  <p className="text-slate-400 font-medium">Compliance operators review citizen credentials side-by-side with OCR extractions while conducting real-time webcam video interview verification.</p>
                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg space-y-1 font-mono text-[10px] text-slate-400">
                    <p className="font-bold text-slate-300">🎥 Active Video Feed:</p>
                    <p>The citizen is connected via a secure low-latency pipeline, holding up their ID card. Click "Approve" to upgrade the limits permanently!</p>
                  </div>
                </>
              )}
              {activePhase === 6 && (
                <>
                  <p>This layout implements the **Phase 4 Agent dashboards** shown in Screen (6) of the images.</p>
                  <p className="text-slate-400 font-medium">Under Algerian PSP regulations, agents are registered with distinct cash boxes and strict liquidity boundaries. DinarFlow enforces real-time balances, commission fees logging, and prevents negative register overdrafts.</p>
                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg space-y-1 font-mono text-[10px] text-slate-400">
                    <p className="font-bold text-slate-300">💡 Interactive Hint:</p>
                    <p>Choose an agent, pick Cash-In, input an amount, and click "Execute". The transaction executes immediately on the live ledger.</p>
                  </div>
                </>
              )}
              {activePhase === 7 && (
                <>
                  <p>This screen implements **Phase 5 High-risk transfer / Strong Authentication (SCA)** shown in Screen (7).</p>
                  <p className="text-slate-400 font-medium">To protect assets and comply with PSD2 standards, DinarFlow triggers multi-factor SMS/TOTP prompts before clearing high-value operations or upgrading sensitive profile data.</p>
                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg space-y-1 font-mono text-[10px] text-slate-400">
                    <p className="font-bold text-slate-300">💡 Interactive Hint:</p>
                    <p>Input a code like `123456` and click the prompt button to verify. It triggers a success state and transitions to administrative reporting.</p>
                  </div>
                </>
              )}
              {activePhase === 8 && (
                <>
                  <p>This layout implements **Phase 6 Interoperability &amp; Administrative Reporting** shown in Screen (8).</p>
                  <p className="text-slate-400 font-medium">It verifies real-time clearance with Algeria ACH/RTGS networks, monitors cantonment accounts, and generates formal ISO 20022 XML clearing reports.</p>
                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg space-y-1 font-mono text-[10px] text-slate-400">
                    <p className="font-bold text-slate-300">📁 ISO 20022 Schema Export:</p>
                    <p>Select XML format and click the primary "Export ISO 20022" button to download a compliant JSON-schema clearing payload.</p>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span>DinarFlow Ver. 3.4.0</span>
            <span className="text-indigo-400">Real-Time Core Connected</span>
          </div>
        </div>

        {/* Right Sandbox Container Column (8/12) */}
        <div className="xl:col-span-8 flex items-center justify-center p-2 rounded-2xl bg-slate-900/40 border border-slate-800/60 relative overflow-hidden min-h-[500px]">
          
          {/* Subtle grid pattern background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none"></div>

          {/* ACTIVE VIEW PORT: SCREEN (1) MOBILE PWA LOGIN */}
          {activePhase === 1 && (
            <div className="w-[310px] h-[580px] bg-[#0c1328] rounded-[44px] border-[8px] border-slate-800 shadow-2xl relative overflow-hidden flex flex-col p-4 animate-fadeIn">
              {/* iPhone Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-50 flex items-center justify-center">
                <div className="w-12 h-1 bg-slate-900 rounded-full"></div>
              </div>
              
              {/* Internal phone container */}
              <div className="flex-1 bg-white rounded-[28px] p-5 pt-8 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-6">
                  {/* Logo "PSP" matching image perfectly */}
                  <div className="flex items-center justify-center gap-1.5 mt-2">
                    <span className="font-black text-2xl tracking-tighter text-[#1e293b]">P</span>
                    <span className="font-black text-2xl tracking-tighter text-[#eab308]">S</span>
                    <span className="font-black text-2xl tracking-tighter text-[#1e293b]">P</span>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-lg font-extrabold text-[#0c1328]">Sign in</h4>
                  </div>

                  <form onSubmit={handleP1SignIn} className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Username</label>
                      <input
                        type="email"
                        required
                        value={p1Email}
                        onChange={(e) => setP1Email(e.target.value)}
                        placeholder="username@dinarflow.dz"
                        className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 text-slate-800 font-sans focus:outline-none focus:border-indigo-600 focus:bg-white"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase block">Password</label>
                        <a href="#" className="text-[10px] font-bold text-indigo-600 hover:underline">Forgot account?</a>
                      </div>
                      <input
                        type="password"
                        required
                        value={p1Password}
                        onChange={(e) => setP1Password(e.target.value)}
                        placeholder="••••••••"
                        className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 text-slate-800 font-sans focus:outline-none focus:border-indigo-600 focus:bg-white"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-[#1e3a8a] hover:bg-blue-900 text-white font-black text-xs py-3 rounded-lg mt-2 cursor-pointer shadow-md transition-all active:scale-95"
                    >
                      Sign In
                    </button>
                  </form>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-100"></div>
                    </div>
                    <div className="relative flex justify-center text-[10px] font-bold uppercase text-slate-400">
                      <span className="bg-white px-2">or</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setP1Email('abdou.ecom23@gmail.com');
                      showDemoToast('Google credentials prefilled.');
                    }}
                    className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all"
                  >
                    <Globe className="w-3.5 h-3.5 text-blue-500" />
                    <span>Sign in with Google</span>
                  </button>
                </div>

                <div className="text-center space-y-2 mt-4">
                  <a href="#" className="text-[10px] font-bold text-slate-400 block hover:underline">Forget password</a>
                  <p className="text-[10px] text-slate-500">
                    Don't have an account? <a href="#" onClick={() => setActivePhase(3)} className="text-indigo-600 font-bold hover:underline">Register Citizen</a>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ACTIVE VIEW PORT: SCREEN (2) ADMIN DASHBOARD (DARK TREMOR SPEC) */}
          {activePhase === 2 && (
            <div className="w-full max-w-2xl bg-[#090d16] rounded-xl border border-slate-800 shadow-2xl p-5 font-sans text-slate-100 animate-fadeIn overflow-hidden">
              <div className="flex justify-between items-center pb-4 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center font-bold text-white text-xs">P</div>
                  <span className="font-extrabold text-xs text-slate-200">Admin Dashboard (Tremor)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  <span className="text-[10px] text-slate-400 font-mono">Live Session</span>
                </div>
              </div>

              {/* Top Stats Cards matching screen (2) perfectly */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-[#111827] border border-slate-800 rounded-lg p-3">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Users</span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-xl font-black text-slate-100">2,596</span>
                    <span className="text-[8px] bg-emerald-500/10 text-emerald-400 px-1 py-0.2 rounded font-bold">ACTIVE</span>
                  </div>
                </div>

                <div className="bg-[#111827] border border-slate-800 rounded-lg p-3">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Active Accounts</span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-xl font-black text-slate-100">1,503</span>
                    <span className="text-[8px] bg-emerald-500/10 text-emerald-400 px-1 py-0.2 rounded font-bold">ACTIVE</span>
                  </div>
                </div>

                <div className="bg-[#111827] border border-slate-800 rounded-lg p-3">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Transaction Volume</span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-xl font-black text-slate-100">23,588K</span>
                    <span className="text-[8px] bg-emerald-500/10 text-emerald-400 px-1 py-0.2 rounded font-bold">CRITICAL</span>
                  </div>
                </div>
              </div>

              {/* Interactive Svg Charts matching image line & bar charts */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-[#111827] border border-slate-800 rounded-lg p-3">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Active Accounts</span>
                  <div className="h-28 w-full flex items-end relative pt-2">
                    {/* Glowing neon SVG wave chart */}
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 80">
                      <defs>
                        <linearGradient id="glowGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M 0 60 Q 30 30 60 45 T 120 20 T 180 30 L 200 15 L 200 80 L 0 80 Z"
                        fill="url(#glowGrad)"
                      />
                      <path
                        d="M 0 60 Q 30 30 60 45 T 120 20 T 180 30 L 200 15"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2.5"
                      />
                      {/* Dots on peak points */}
                      <circle cx="120" cy="20" r="3" fill="#60a5fa" />
                      <circle cx="200" cy="15" r="3" fill="#60a5fa" />
                    </svg>
                    <span className="absolute bottom-1 right-1 text-[8px] text-slate-500 font-mono">Real-time</span>
                  </div>
                </div>

                <div className="bg-[#111827] border border-slate-800 rounded-lg p-3">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Transaction Volume</span>
                  <div className="h-28 w-full flex items-end justify-between px-3 pt-2">
                    {/* SVG column bar chart */}
                    {[12, 18, 14, 25, 30, 22, 38, 48, 28, 40].map((val, idx) => (
                      <div key={idx} className="flex flex-col items-center w-3 gap-1">
                        <div
                          className="w-full bg-indigo-500 rounded-t"
                          style={{ height: `${(val / 50) * 80}px` }}
                        ></div>
                        <span className="text-[7px] text-slate-600 font-mono">D{idx+1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Lists mimicking image section */}
              <div className="grid grid-cols-2 gap-4 text-[10px]">
                <div className="bg-[#111827] border border-slate-800 rounded-lg p-3">
                  <span className="font-bold text-slate-300 uppercase tracking-wider block border-b border-slate-800 pb-1.5 mb-2">Metrics</span>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-slate-400">
                      <span>Cash-ins</span>
                      <span className="font-bold text-emerald-400">12,183.0M</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-400">
                      <span>Cash-outs</span>
                      <span className="font-bold text-indigo-400">9,201.0M</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-400">
                      <span>Inter-bank transfers</span>
                      <span className="font-bold text-amber-400">2,204.6M</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#111827] border border-slate-800 rounded-lg p-3">
                  <span className="font-bold text-slate-300 uppercase tracking-wider block border-b border-slate-800 pb-1.5 mb-2">Recent Activity</span>
                  <div className="space-y-2 max-h-[85px] overflow-y-auto pr-1">
                    {transactions.slice(0, 3).map((tx) => (
                      <div key={tx.id} className="flex justify-between items-center text-slate-400 border-b border-slate-800/40 pb-1">
                        <span className="truncate max-w-[90px] text-slate-300 font-mono">{tx.id.toUpperCase()}</span>
                        <span className="font-black text-emerald-400 text-[10px]">+{tx.amount.toLocaleString()} DA</span>
                      </div>
                    ))}
                    {transactions.length === 0 && (
                      <p className="text-slate-600 italic">No recent activities on ledger</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ACTIVE VIEW PORT: SCREEN (3) USER LEVEL 1 ONBOARDING */}
          {activePhase === 3 && (
            <div className="w-[310px] h-[580px] bg-[#0c1328] rounded-[44px] border-[8px] border-slate-800 shadow-2xl relative overflow-hidden flex flex-col p-4 animate-fadeIn">
              {/* iPhone Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-50 flex items-center justify-center">
                <div className="w-12 h-1 bg-slate-900 rounded-full"></div>
              </div>
              
              <div className="flex-1 bg-slate-50 rounded-[28px] p-4 pt-8 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mt-2">
                    <button className="text-slate-500 font-bold text-lg">←</button>
                    <span className="font-black text-xs text-[#0c1328] uppercase tracking-wide">User Level 1 onboarding</span>
                  </div>

                  {/* Limits Badge exactly like the image (1000 OA cap style) */}
                  <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                      <Wallet className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-orange-400 uppercase tracking-wide block">Account Limits</span>
                      <p className="text-xs font-black text-orange-700">100K DA Flow Cap</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <span className="text-xs font-extrabold text-[#0c1328] block">Basic profile</span>

                    <div className="space-y-2.5">
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Name</label>
                        <input
                          type="text"
                          value={p3Name}
                          onChange={(e) => setP3Name(e.target.value)}
                          className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white text-slate-800 font-bold focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Surname</label>
                        <input
                          type="text"
                          value={p3Surname}
                          onChange={(e) => setP3Surname(e.target.value)}
                          className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white text-slate-800 font-bold focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Email</label>
                        <input
                          type="email"
                          value={p3Email}
                          onChange={(e) => setP3Email(e.target.value)}
                          className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white text-slate-800 font-bold focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Profile Trade / habits</label>
                        <input
                          type="text"
                          value={p3Trade}
                          onChange={(e) => setP3Trade(e.target.value)}
                          className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white text-slate-800 font-bold focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    onClick={handleP3Next}
                    className="w-full bg-[#f97316] hover:bg-orange-600 text-white font-extrabold text-xs py-3.5 rounded-lg text-center cursor-pointer transition-all active:scale-95 shadow-md"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ACTIVE VIEW PORT: SCREEN (4) PHASE 2 KYC SUBMISSION */}
          {activePhase === 4 && (
            <div className="w-[310px] h-[580px] bg-[#0c1328] rounded-[44px] border-[8px] border-slate-800 shadow-2xl relative overflow-hidden flex flex-col p-4 animate-fadeIn">
              {/* iPhone Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-50 flex items-center justify-center">
                <div className="w-12 h-1 bg-slate-900 rounded-full"></div>
              </div>
              
              <div className="flex-1 bg-slate-50 rounded-[28px] p-4 pt-8 flex flex-col justify-between overflow-y-auto">
                <form onSubmit={handleP4Submit} className="space-y-4">
                  <div className="flex items-center gap-2 mt-2">
                    <button className="text-slate-500 font-bold text-lg">←</button>
                    <div>
                      <span className="font-black text-xs text-[#0c1328] uppercase tracking-wide block">KYC submission</span>
                      <span className="text-[9px] text-slate-400 block">Dynamic forms for "Niveau 2"</span>
                    </div>
                  </div>

                  {/* ID card upload check box */}
                  <div className="bg-white border border-slate-100 rounded-xl p-3 flex justify-between items-center shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <FileCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block font-semibold uppercase">Scanned ID Document</span>
                        <span className="text-[10px] text-[#0c1328] font-bold">DZ_ID_CARD_FRONT.jpg</span>
                      </div>
                    </div>
                    <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[8px] font-bold">✓</span>
                  </div>

                  {/* Income proof upload check box */}
                  <div className="bg-white border border-slate-100 rounded-xl p-3 flex justify-between items-center shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Upload className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block font-semibold uppercase">Proof of income</span>
                        <span className="text-[10px] text-[#0c1328] font-bold">PROOF_OF_INCOME.pdf</span>
                      </div>
                    </div>
                    <span className="w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[8px] font-bold">✓</span>
                  </div>

                  {/* OCR extracted form prefill */}
                  <div className="space-y-2.5 bg-white border border-slate-100 p-3.5 rounded-2xl">
                    <span className="text-[10px] font-black text-[#0c1328] uppercase tracking-wider block">OCR text extraction</span>
                    
                    <div className="space-y-2">
                      <div>
                        <label className="text-[8px] font-bold text-slate-400 uppercase">Last Name</label>
                        <input
                          type="text"
                          required
                          value={p4LastName}
                          onChange={(e) => setP4LastName(e.target.value)}
                          className="w-full text-xs border border-slate-100 bg-slate-50 rounded-lg p-2 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[8px] font-bold text-slate-400 uppercase">First Name</label>
                        <input
                          type="text"
                          required
                          value={p4FirstName}
                          onChange={(e) => setP4FirstName(e.target.value)}
                          className="w-full text-xs border border-slate-100 bg-slate-50 rounded-lg p-2 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[8px] font-bold text-slate-400 uppercase">Password / ID number</label>
                        <input
                          type="text"
                          required
                          value={p4DocId}
                          onChange={(e) => setP4DocId(e.target.value)}
                          className="w-full text-xs border border-slate-100 bg-slate-50 rounded-lg p-2 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Upload progress bar matching the layout */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[9px] font-bold text-slate-500">
                      <span>Upload progress...</span>
                      <span>100%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${p4Progress}%` }}></div>
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isP4Submitting}
                    className="w-full bg-[#1e3a8a] hover:bg-blue-900 text-white font-extrabold text-xs py-3.5 rounded-xl text-center shadow-md active:scale-95 transition-all cursor-pointer"
                  >
                    {isP4Submitting ? 'Uploading to ledger security vault...' : 'Upload'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ACTIVE VIEW PORT: SCREEN (5) KYC MANUAL REVIEW (OPERATOR CONSOLE) */}
          {activePhase === 5 && (
            <div className="w-full max-w-2xl bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden font-sans text-slate-800 flex flex-col h-[480px] animate-fadeIn">
              
              {/* Header */}
              <div className="bg-[#0f172a] text-white px-5 py-3.5 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-indigo-600 flex items-center justify-center font-bold text-[10px]">PSP</div>
                  <span className="text-xs font-bold">KYC Operator Review Interface • Phase 2</span>
                </div>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-mono">Operator: H. Brahimi</span>
              </div>

              {/* Main Content Split Area */}
              <div className="flex flex-1 overflow-hidden">
                
                {/* Simulated operator side nav */}
                <div className="w-36 bg-slate-50 border-r border-slate-100 p-2.5 space-y-1 flex flex-col shrink-0">
                  <div className="text-[8px] font-bold text-slate-400 uppercase px-2 mb-2">Workspace</div>
                  <button className="w-full text-left text-[10px] font-bold bg-white text-indigo-600 p-2 rounded border border-slate-100 flex items-center gap-1.5 shadow-xs">
                    <Users className="w-3.5 h-3.5 text-indigo-500" /> Review Board
                  </button>
                  <button className="w-full text-left text-[10px] font-semibold text-slate-500 hover:bg-slate-100 p-2 rounded flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-slate-400" /> Audit Log
                  </button>
                  <button className="w-full text-left text-[10px] font-semibold text-slate-500 hover:bg-slate-100 p-2 rounded flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-400" /> Security
                  </button>
                </div>

                {/* Operator Workspace Area */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                  
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">KYC review</h4>
                      <p className="text-[10px] text-slate-400">Validate extracted ID card data against citizen video interview stream</p>
                    </div>
                    <span className="text-[10px] bg-indigo-50 text-indigo-600 border border-indigo-200 font-bold px-2 py-0.5 rounded uppercase">Niveau 2</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Left Column: Side-by-Side Uploaded Documents */}
                    <div className="space-y-3.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Uploaded Document</span>
                      
                      <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50 flex items-center justify-center h-28 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-slate-900/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                          <span className="text-[9px] font-bold bg-white px-2 py-1 rounded shadow text-slate-800">Zoom File</span>
                        </div>
                        {/* ID front mock visual representation */}
                        <div className="w-full h-full bg-gradient-to-r from-teal-50 to-emerald-50 border border-emerald-100 rounded p-2 flex flex-col justify-between font-mono text-[6px] text-slate-500">
                          <div className="flex justify-between">
                            <span className="font-bold">REPUBLIQUE ALGERIENNE</span>
                            <span className="text-[5px]">DZ NATIONAL ID</span>
                          </div>
                          <div className="flex gap-2 items-center my-1">
                            <div className="w-6 h-8 bg-slate-200 rounded"></div>
                            <div className="space-y-0.5 text-left">
                              <p className="font-black text-[7px] text-slate-800">HADJ NACER</p>
                              <p className="text-[6px]">Mounir</p>
                              <p>ID: DZ-9177263</p>
                            </div>
                          </div>
                          <p className="text-[5px] text-slate-400 uppercase">Biometric compliant document</p>
                        </div>
                      </div>

                      <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50 flex items-center justify-center h-28 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-slate-900/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                          <span className="text-[9px] font-bold bg-white px-2 py-1 rounded shadow text-slate-800">Zoom File</span>
                        </div>
                        {/* Proof of salary receipt mock view */}
                        <div className="w-full h-full bg-slate-100 border border-slate-200 rounded p-2 flex flex-col justify-between font-sans text-[6px] text-slate-500">
                          <div className="border-b border-slate-200 pb-1 flex justify-between items-center">
                            <span className="font-bold text-[7px] text-slate-700">SALARY STATEMENT</span>
                            <span>CERTIFIED</span>
                          </div>
                          <div className="space-y-1 my-1">
                            <p className="font-bold">EMPLOYER: INKONEK DZ LIMITED</p>
                            <p>MONTHLY EARNINGS: 320,000 DZD</p>
                          </div>
                          <span className="text-[5px] text-slate-400">Verification Hash: 0X9A88FCEB12A</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Video Interview Frame Pending */}
                    <div className="space-y-3.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Video interview pending</span>
                      
                      <div className="border border-slate-200 rounded-lg bg-slate-950 flex flex-col items-center justify-center h-48 relative overflow-hidden text-center p-3">
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping"></span>
                          <span className="text-[8px] text-rose-400 font-bold tracking-widest font-mono">LIVE FEED</span>
                        </div>

                        {/* High fidelity operator stream view */}
                        <div className="space-y-2">
                          <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center mx-auto text-indigo-400 relative">
                            <Camera className="w-5 h-5" />
                          </div>
                          <p className="text-[10px] text-slate-200 font-extrabold">videoconference pending</p>
                          <p className="text-[8px] text-slate-500 max-w-[140px] mx-auto leading-relaxed">Waiting for Citizen Mounir to activate biometric facial camera session...</p>
                        </div>

                        <div className="absolute bottom-2 left-2 text-[7px] text-slate-500 font-mono">
                          DinarFlow Core Peer Connection (9ms)
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

              </div>

              {/* Action bar at the bottom */}
              <div className="bg-slate-100 px-5 py-3 flex justify-between items-center border-t border-slate-200 shrink-0">
                <span className="text-[9px] font-bold text-slate-500">Validation: Level 2</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleP5OperatorAction('REJECTED')}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[10px] py-2 px-4 rounded-lg cursor-pointer"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleP5OperatorAction('APPROVED')}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] py-2 px-5 rounded-lg cursor-pointer shadow-sm shadow-emerald-500/10"
                  >
                    Approve
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ACTIVE VIEW PORT: SCREEN (6) PHASE 4 AGENT WORKFLOWS */}
          {activePhase === 6 && (
            <div className="w-[310px] h-[580px] bg-[#0c1328] rounded-[44px] border-[8px] border-slate-800 shadow-2xl relative overflow-hidden flex flex-col p-4 animate-fadeIn">
              {/* iPhone Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-50 flex items-center justify-center">
                <div className="w-12 h-1 bg-slate-900 rounded-full"></div>
              </div>

              <div className="flex-1 bg-slate-50 rounded-[28px] p-4 pt-8 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-4">
                  {/* Top Bar matching screen (6) perfectly */}
                  <div className="flex items-center justify-between mt-2">
                    <button className="text-slate-500 font-bold text-lg">←</button>
                    <span className="font-extrabold text-xs text-slate-800 uppercase tracking-tight">Agent PSP</span>
                    <button className="text-slate-500"><Bell className="w-4 h-4" /></button>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-slate-900 leading-tight">Transactional workflows</h4>
                  </div>

                  {/* Dual buttons for cash in and out */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setP6Workflow('CASH_IN')}
                      className={`font-black text-[10px] py-3 rounded-lg flex items-center justify-center gap-1 cursor-pointer border ${
                        p6Workflow === 'CASH_IN'
                          ? 'bg-[#0f172a] text-white border-slate-950 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                      <span>Cash-in</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setP6Workflow('CASH_OUT')}
                      className={`font-black text-[10px] py-3 rounded-lg flex items-center justify-center gap-1 cursor-pointer border ${
                        p6Workflow === 'CASH_OUT'
                          ? 'bg-[#0f172a] text-white border-slate-950 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>Cash-out</span>
                    </button>
                  </div>

                  {/* Compliance warning banners with orange bg and black text exactly like screen 6 */}
                  <div className="space-y-2">
                    <div className="bg-amber-100 border border-amber-200 rounded-lg p-2.5 flex items-start gap-2 text-amber-900">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                      <p className="text-[9px] font-bold leading-normal">⚠️ no negative balance</p>
                    </div>
                  </div>

                  {/* Form to test execution */}
                  <form onSubmit={handleP6AgentTransaction} className="bg-white border border-slate-100 rounded-2xl p-3.5 space-y-3 shadow-xs">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Agent specific</span>
                    
                    <div className="space-y-2.5 text-xs text-slate-700">
                      <div>
                        <label className="text-[8px] font-bold text-slate-400 block mb-0.5 uppercase">Select Active Agent</label>
                        <select
                          value={p6SelectedAgent}
                          onChange={(e) => setP6SelectedAgent(e.target.value)}
                          className="w-full text-[10px] border border-slate-200 rounded-lg p-2 bg-slate-50"
                        >
                          {agents.map(ag => (
                            <option key={ag.id} value={ag.id}>{ag.name} ({ag.location})</option>
                          ))}
                          {agents.length === 0 && <option value="agent-1">Inkonek Agency Algiers</option>}
                        </select>
                      </div>

                      <div>
                        <label className="text-[8px] font-bold text-slate-400 block mb-0.5 uppercase">Citizen Receiver IBAN</label>
                        <select
                          value={p6Iban}
                          onChange={(e) => setP6Iban(e.target.value)}
                          className="w-full text-[10px] border border-slate-200 rounded-lg p-2 bg-slate-50"
                        >
                          {accounts.map(acc => (
                            <option key={acc.id} value={acc.iban}>{acc.name} ({acc.id})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[8px] font-bold text-slate-400 block mb-0.5 uppercase">Amount (DA)</label>
                        <input
                          type="number"
                          required
                          value={p6Amount}
                          onChange={(e) => setP6Amount(e.target.value)}
                          className="w-full text-[10px] border border-slate-200 rounded-lg p-2 bg-slate-50 focus:bg-white"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-[#1e3a8a] hover:bg-blue-900 text-white font-extrabold text-[10px] py-2.5 rounded-lg text-center"
                    >
                      Execute {p6Workflow}
                    </button>
                  </form>

                  {p6SuccessMsg && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-[10px] text-center font-bold animate-fadeIn">
                      {p6SuccessMsg}
                    </div>
                  )}

                  {/* Agent Commission section exactly like Screen (6) */}
                  <div className="bg-white border border-slate-100 rounded-2xl p-3 space-y-2">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Commission score status</span>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-500 font-medium">Cash-in commission</span>
                      <span className="font-extrabold text-rose-600">-2,000 DA</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] border-t border-slate-50 pt-1.5">
                      <span className="text-slate-500 font-medium">Commission score</span>
                      <span className="font-extrabold text-rose-600">-3,000 DA</span>
                    </div>
                  </div>

                </div>

                {/* Bottom navigation layout */}
                <div className="border-t border-slate-200 bg-white p-2 flex justify-around items-center text-[9px] font-bold text-slate-400 shrink-0">
                  <div className="flex flex-col items-center text-[#1e3a8a]">
                    <Wallet className="w-4 h-4" />
                    <span className="mt-0.5">Home</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <ArrowDownLeft className="w-4 h-4" />
                    <span className="mt-0.5">Cash-in</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Activity className="w-4 h-4" />
                    <span className="mt-0.5">Commission</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Users className="w-4 h-4" />
                    <span className="mt-0.5">Profile</span>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ACTIVE VIEW PORT: SCREEN (7) SCA STRONG AUTHENTICATION */}
          {activePhase === 7 && (
            <div className="w-[310px] h-[580px] bg-[#0c1328] rounded-[44px] border-[8px] border-slate-800 shadow-2xl relative overflow-hidden flex flex-col p-4 animate-fadeIn">
              {/* iPhone Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-50 flex items-center justify-center">
                <div className="w-12 h-1 bg-slate-900 rounded-full"></div>
              </div>

              <div className="flex-1 bg-slate-50 rounded-[28px] p-4 pt-8 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-6">
                  
                  {/* Top SCA warning alert banner exactly like screen 7 */}
                  <div className="bg-amber-50 border-b border-amber-200 p-2.5 -mx-4 text-center mt-2 flex items-center justify-center gap-1.5 text-amber-900">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                    <span className="text-[10px] font-extrabold tracking-wider uppercase">SCA required</span>
                  </div>

                  {/* Authenticator Graphical Ring */}
                  <div className="text-center space-y-4 my-4">
                    <div className="w-20 h-20 rounded-full bg-slate-200 mx-auto flex items-center justify-center relative">
                      <div className="absolute inset-0 rounded-full border border-dashed border-indigo-400 animate-spin"></div>
                      <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow">
                        <Lock className="w-7 h-7 text-indigo-600" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-slate-800">Request a 6-digit TOTP code with Authenticator</h4>
                      <p className="text-[9px] text-slate-400 max-w-[200px] mx-auto leading-relaxed">Enter security token from your Google Authenticator app to clear this transaction</p>
                    </div>
                  </div>

                  {/* OTP Digits boxes */}
                  <div className="flex justify-between gap-1.5 px-2">
                    {p7Code.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`p7-otp-${idx}`}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleP7CodeChange(idx, e.target.value)}
                        className="w-9 h-11 border border-slate-200 bg-white rounded-lg text-center text-xs font-extrabold text-[#0c1328] focus:border-indigo-600 focus:outline-none focus:bg-indigo-50/20"
                      />
                    ))}
                  </div>

                  <div className="text-center pt-2">
                    <a href="#" className="text-[9px] font-bold text-indigo-600 hover:underline">Google Authenticator</a>
                  </div>

                </div>

                <div className="mt-4">
                  <button
                    onClick={handleP7Submit}
                    className="w-full bg-[#1e3a8a] hover:bg-blue-900 text-white font-black text-xs py-3.5 rounded-xl text-center cursor-pointer shadow-md transition-all active:scale-95"
                  >
                    Prompt
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ACTIVE VIEW PORT: SCREEN (8) ADMINISTRATIVE REPORTING & ISO 20022 */}
          {activePhase === 8 && (
            <div className="w-full max-w-2xl bg-[#090d16] rounded-xl border border-slate-800 shadow-2xl p-5 font-sans text-slate-100 animate-fadeIn flex flex-col h-[460px] overflow-hidden">
              
              <div className="flex justify-between items-center pb-3.5 border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-500" />
                  <span className="font-extrabold text-xs">Administrative reporting</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded font-mono border border-indigo-500/20">ISO 20022 Schema Verified</span>
                </div>
              </div>

              {/* Grid content */}
              <div className="flex-1 grid grid-cols-2 gap-4 my-4 overflow-hidden">
                
                {/* Left Report filters Form */}
                <div className="bg-[#111827] border border-slate-800 rounded-lg p-4 space-y-3 flex flex-col justify-between overflow-y-auto">
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Report criteria</span>

                    <div className="space-y-2 text-[10px]">
                      <div>
                        <label className="text-slate-500 block mb-1">Select report type</label>
                        <select
                          value={p8ReportType}
                          onChange={(e) => setP8ReportType(e.target.value)}
                          className="w-full bg-[#090d16] border border-slate-800 rounded-md p-2 text-slate-200"
                        >
                          <option value="Monthly volume">Monthly volume</option>
                          <option value="Weekly clearing">Weekly clearing</option>
                          <option value="Cantonment audit">Cantonment audit</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-slate-500 block mb-1">File format</label>
                        <select
                          value={p8Format}
                          onChange={(e) => setP8Format(e.target.value)}
                          className="w-full bg-[#090d16] border border-slate-800 rounded-md p-2 text-slate-200"
                        >
                          <option value="ISO 20022 XML">ISO 20022 XML</option>
                          <option value="CSV/Excel font">CSV / Excel sheets</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-slate-500 block mb-1">Data range</label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={p8DateFrom}
                            onChange={(e) => setP8DateFrom(e.target.value)}
                            className="bg-[#090d16] border border-slate-800 rounded-md p-2 text-slate-200 text-[9px] text-center"
                          />
                          <input
                            type="text"
                            value={p8DateTo}
                            onChange={(e) => setP8DateTo(e.target.value)}
                            className="bg-[#090d16] border border-slate-800 rounded-md p-2 text-slate-200 text-[9px] text-center"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleP8Export}
                    className="w-full bg-[#1e3a8a] hover:bg-blue-900 text-white font-extrabold text-[10px] py-2.5 rounded-lg text-center cursor-pointer shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Report</span>
                  </button>
                </div>

                {/* Right Status Logs matching the layout of image (8) perfectly */}
                <div className="bg-[#111827] border border-slate-800 rounded-lg p-4 flex flex-col justify-between overflow-y-auto">
                  <div className="space-y-3.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status logs</span>
                    
                    <div className="space-y-2.5 font-mono text-[9px] text-slate-300">
                      {p8Logs.map((log, idx) => (
                        <div key={idx} className="flex gap-2 items-start leading-normal">
                          <span className="text-emerald-500 font-extrabold shrink-0">●</span>
                          <span>{log}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 text-[8px] text-slate-500 font-mono">
                    Algerian PSP clearing protocol layer online.
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
