import React, { useState, useEffect } from 'react';
import {
  Shield,
  Ban,
  UserCheck,
  Pause,
  Key,
  RotateCcw,
  FileText,
  Globe,
  AlertOctagon,
  Check,
  X,
  Search,
  Plus,
  Send,
  User,
  Activity,
  UserMinus,
  Briefcase,
  AlertTriangle,
  FileWarning,
  RefreshCw,
  Clock
} from 'lucide-react';
import { 
  UserAccount, 
  LedgerTransaction, 
  BlockedEntity, 
  TrustedBeneficiary, 
  HeldTransaction, 
  SWIFTMessage, 
  MultiSigTransaction, 
  FailedTransactionRetry, 
  ComplianceReport, 
  AuditLog,
  KycStatus
} from '../types';

interface ComplianceViewProps {
  accounts: UserAccount[];
  transactions: LedgerTransaction[];
  onRefreshAll: () => void;
}

export default function ComplianceView({ accounts, transactions, onRefreshAll }: ComplianceViewProps) {
  // Sub-navigation inside Compliance Tab
  const [subTab, setSubTab] = useState<'OVERVIEW' | 'BLACKLIST' | 'WHITELIST' | 'HELD' | 'MULTISIG' | 'RETRIES' | 'REPORTS' | 'SWIFT' | 'SANCTIONS' | 'DOCS'>('OVERVIEW');

  // Backend States
  const [blockedEntities, setBlockedEntities] = useState<BlockedEntity[]>([]);
  const [heldTransactions, setHeldTransactions] = useState<HeldTransaction[]>([]);
  const [multiSigTransactions, setMultiSigTransactions] = useState<MultiSigTransaction[]>([]);
  const [failedRetries, setFailedRetries] = useState<FailedTransactionRetry[]>([]);
  const [complianceReports, setComplianceReports] = useState<ComplianceReport[]>([]);
  const [swiftMessages, setSwiftMessages] = useState<SWIFTMessage[]>([]);
  const [realtimeLogs, setRealtimeLogs] = useState<AuditLog[]>([]);
  const [sseStatus, setSseStatus] = useState<'CONNECTED' | 'DISCONNECTED' | 'CONNECTING'>('CONNECTING');

  // Form states
  const [blackListForm, setBlackListForm] = useState({
    entityType: 'ACCOUNT' as 'ACCOUNT' | 'IBAN' | 'IP' | 'DEVICE_ID',
    entityValue: '',
    reason: '',
    blockedBy: 'H. Brahimi'
  });

  const [whitelistForm, setWhitelistForm] = useState({
    accountId: '',
    beneficiaryIban: '',
    beneficiaryName: ''
  });

  const [sarForm, setSarForm] = useState({
    accountId: '',
    reason: ''
  });

  const [sanctionsSearch, setSanctionsSearch] = useState('');
  const [sanctionsResult, setSanctionsResult] = useState<any>(null);

  // Review & Signing states
  const [operatorReviewNotes, setOperatorReviewNotes] = useState('');
  const [multiSigSignNotes, setMultiSigSignNotes] = useState('');
  const [signingAsOperator, setSigningAsOperator] = useState('Amine Cherif'); // MultiSig operator 1
  const [coSignerName, setCoSignerName] = useState('Lydia Ould'); // MultiSig operator 2

  // Expiry Simulation Form
  const [expiryForm, setExpiryForm] = useState({
    accountId: '',
    idCardExpiryDate: '',
    proofOfAddressExpiryDate: '',
    documentStatusAlert: 'ACTIVE' as 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED'
  });

  // Load compliance collections
  const fetchComplianceData = async () => {
    try {
      const [resBlk, resHeld, resMsig, resRetries, resRep, resSwift] = await Promise.all([
        fetch('/api/compliance/blocked'),
        fetch('/api/compliance/held'),
        fetch('/api/compliance/multisig'),
        fetch('/api/compliance/retries'),
        fetch('/api/compliance/reports'),
        fetch('/api/compliance/swift')
      ]);

      if (resBlk.ok) setBlockedEntities(await resBlk.json());
      if (resHeld.ok) setHeldTransactions(await resHeld.json());
      if (resMsig.ok) setMultiSigTransactions(await resMsig.json());
      if (resRetries.ok) setFailedRetries(await resRetries.json());
      if (resRep.ok) setComplianceReports(await resRep.json());
      if (resSwift.ok) setSwiftMessages(await resSwift.json());
    } catch (e) {
      console.error("Error fetching compliance data", e);
    }
  };

  // Set up SSE EventStream
  useEffect(() => {
    fetchComplianceData();

    setSseStatus('CONNECTING');
    const eventSource = new EventSource('/api/compliance/stream');

    eventSource.onopen = () => {
      setSseStatus('CONNECTED');
    };

    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.connected) {
          console.log("SSE connected successfully at", parsed.timestamp);
          return;
        }

        const log: AuditLog = parsed;

        // Prepend to realtime logs
        setRealtimeLogs(prev => [log, ...prev].slice(0, 50));
        
        // Dynamic re-triggers
        fetchComplianceData();
        onRefreshAll();
      } catch (err) {
        console.error("Error parsing SSE event data", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE Connection error", err);
      setSseStatus('DISCONNECTED');
    };

    const interval = setInterval(() => {
      fetchComplianceData();
    }, 5000);

    return () => {
      eventSource.close();
      clearInterval(interval);
    };
  }, []);

  // Post methods
  const handleAddBlacklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blackListForm.entityValue || !blackListForm.reason) return;

    try {
      const res = await fetch('/api/compliance/blocked', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blackListForm)
      });
      if (res.ok) {
        setBlackListForm({
          entityType: 'ACCOUNT',
          entityValue: '',
          reason: '',
          blockedBy: 'H. Brahimi'
        });
        fetchComplianceData();
        onRefreshAll();
        alert("Entity added to fraud blacklist successfully!");
      } else {
        const err = await res.json();
        alert(`Failed to block entity: ${err.error}`);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateBlacklistStatus = async (id: string, status: 'ACTIVE' | 'APPEAL_PENDING' | 'LIFTED', appealReason?: string) => {
    try {
      const res = await fetch(`/api/compliance/blocked/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, appealReason })
      });
      if (res.ok) {
        fetchComplianceData();
        onRefreshAll();
      } else {
        const err = await res.json();
        alert(err.error);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddWhitelist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whitelistForm.accountId || !whitelistForm.beneficiaryIban || !whitelistForm.beneficiaryName) return;

    try {
      const res = await fetch('/api/compliance/trusted', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(whitelistForm)
      });
      if (res.ok) {
        setWhitelistForm({ accountId: '', beneficiaryIban: '', beneficiaryName: '' });
        alert("Trusted beneficiary payee registered in white-directory!");
        fetchComplianceData();
      } else {
        const err = await res.json();
        alert(err.error);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReviewHeld = async (holdId: string, decision: 'APPROVED' | 'REJECTED') => {
    if (!operatorReviewNotes) {
      alert("Review notes are required before approving or rejecting compliance holds.");
      return;
    }

    try {
      const res = await fetch(`/api/compliance/held/${holdId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          notes: operatorReviewNotes,
          reviewer: 'H. Brahimi'
        })
      });

      if (res.ok) {
        setOperatorReviewNotes('');
        alert(`Held transaction ${decision} successfully!`);
        fetchComplianceData();
        onRefreshAll();
      } else {
        const err = await res.json();
        alert(err.error);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSignMultiSig = async (msigId: string, decision: 'APPROVED' | 'REJECTED', signer: string) => {
    try {
      const res = await fetch(`/api/compliance/multisig/${msigId}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signerName: signer,
          status: decision,
          reason: multiSigSignNotes || "Dual-control compliance confirmation"
        })
      });

      if (res.ok) {
        setMultiSigSignNotes('');
        alert(`Signed MultiSig proposal as ${signer} with decision: ${decision}!`);
        fetchComplianceData();
        onRefreshAll();
      } else {
        const err = await res.json();
        alert(err.error);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleFileSAR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sarForm.accountId || !sarForm.reason) return;

    try {
      const res = await fetch('/api/compliance/reports/sar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sarForm)
      });
      if (res.ok) {
        setSarForm({ accountId: '', reason: '' });
        alert("Suspicious Activity Report (SAR) successfully created as DRAFT!");
        fetchComplianceData();
      } else {
        const err = await res.json();
        alert(err.error);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSubmitReport = async (reportId: string) => {
    try {
      const res = await fetch(`/api/compliance/reports/${reportId}/submit`, {
        method: 'POST'
      });
      if (res.ok) {
        alert("Report successfully filed and transmitted to the Financial Intelligence Unit (FIU) of Bank of Algeria!");
        fetchComplianceData();
      } else {
        const err = await res.json();
        alert(err.error);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSanctionsScreen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sanctionsSearch) return;

    try {
      const res = await fetch('/api/compliance/sanctions-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: sanctionsSearch })
      });
      if (res.ok) {
        const result = await res.json();
        setSanctionsResult(result);
      } else {
        const err = await res.json();
        alert(err.error);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateExpiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expiryForm.accountId) return;

    try {
      const res = await fetch(`/api/accounts/${expiryForm.accountId}/update-expiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idCardExpiryDate: expiryForm.idCardExpiryDate,
          proofOfAddressExpiryDate: expiryForm.proofOfAddressExpiryDate,
          documentStatusAlert: expiryForm.documentStatusAlert
        })
      });

      if (res.ok) {
        alert("Account Document Expiry Simulated successfully! Document status alert triggered.");
        setExpiryForm({ accountId: '', idCardExpiryDate: '', proofOfAddressExpiryDate: '', documentStatusAlert: 'ACTIVE' });
        fetchComplianceData();
        onRefreshAll();
      } else {
        const err = await res.json();
        alert(err.error);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Safe pending counts
  const pendingMsigCount = multiSigTransactions.filter(m => m.status === 'PENDING_APPROVAL').length;
  const pendingHeldCount = heldTransactions.filter(h => h.decision === 'PENDING').length;
  const totalAlerts = pendingMsigCount + pendingHeldCount;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-8" id="compliance_module_canvas">
      {/* Module Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-rose-600 font-semibold mb-1 text-sm tracking-wide uppercase">
            <Shield className="w-4.5 h-4.5 animate-pulse" />
            <span>Bank of Algeria Regulatory Compliance Center</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Compliance & Safeguarding Command Cockpit</h1>
          <p className="text-slate-500 mt-1 max-w-2xl">
            Integrated compliance system monitoring Article 12 safeguarding, Article 34 guarantee renewals, dual-control MultiSig, PEP/OFAC sanctions, blacklists, and manual holds.
          </p>
        </div>

        {/* Real-time SSE channel health */}
        <div className="flex items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm font-mono text-xs">
          <span className="font-bold uppercase text-slate-500">Compliance Feed:</span>
          {sseStatus === 'CONNECTED' ? (
            <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span>LIVE SSE ACTIVE</span>
            </div>
          ) : sseStatus === 'CONNECTING' ? (
            <div className="flex items-center gap-1.5 text-amber-500 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <span>CONNECTING...</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-rose-500 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>DISCONNECTED</span>
            </div>
          )}
          <button 
            onClick={() => { fetchComplianceData(); onRefreshAll(); }} 
            className="p-1 hover:bg-slate-100 text-slate-500 rounded transition-all ml-1"
            title="Force refresh metrics"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Compliance Cockpit Tab Navigation */}
      <div className="flex flex-wrap gap-1.5 border-b border-slate-200 mb-8" id="compliance_tabs">
        <button
          onClick={() => setSubTab('OVERVIEW')}
          className={`px-4 py-2.5 font-semibold text-sm rounded-t-lg border-b-2 transition-all ${subTab === 'OVERVIEW' ? 'border-rose-500 text-rose-600 bg-rose-50/50' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Overview & Live Logs
        </button>
        <button
          onClick={() => setSubTab('BLACKLIST')}
          className={`px-4 py-2.5 font-semibold text-sm rounded-t-lg border-b-2 transition-all ${subTab === 'BLACKLIST' ? 'border-rose-500 text-rose-600 bg-rose-50/50' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Blacklist Registry
        </button>
        <button
          onClick={() => setSubTab('WHITELIST')}
          className={`px-4 py-2.5 font-semibold text-sm rounded-t-lg border-b-2 transition-all ${subTab === 'WHITELIST' ? 'border-rose-500 text-rose-600 bg-rose-50/50' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Payee Whitelist
        </button>
        <button
          onClick={() => setSubTab('HELD')}
          className={`relative px-4 py-2.5 font-semibold text-sm rounded-t-lg border-b-2 transition-all ${subTab === 'HELD' ? 'border-rose-500 text-rose-600 bg-rose-50/50' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Compliance Holds
          {pendingHeldCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-900 font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center animate-bounce">
              {pendingHeldCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setSubTab('MULTISIG')}
          className={`relative px-4 py-2.5 font-semibold text-sm rounded-t-lg border-b-2 transition-all ${subTab === 'MULTISIG' ? 'border-rose-500 text-rose-600 bg-rose-50/50' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          MultiSig Approvals
          {pendingMsigCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-900 font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center animate-bounce">
              {pendingMsigCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setSubTab('RETRIES')}
          className={`px-4 py-2.5 font-semibold text-sm rounded-t-lg border-b-2 transition-all ${subTab === 'RETRIES' ? 'border-rose-500 text-rose-600 bg-rose-50/50' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Failed Retries
        </button>
        <button
          onClick={() => setSubTab('REPORTS')}
          className={`px-4 py-2.5 font-semibold text-sm rounded-t-lg border-b-2 transition-all ${subTab === 'REPORTS' ? 'border-rose-500 text-rose-600 bg-rose-50/50' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          CTR & SAR Reports
        </button>
        <button
          onClick={() => setSubTab('SWIFT')}
          className={`px-4 py-2.5 font-semibold text-sm rounded-t-lg border-b-2 transition-all ${subTab === 'SWIFT' ? 'border-rose-500 text-rose-600 bg-rose-50/50' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          SWIFT MT103
        </button>
        <button
          onClick={() => setSubTab('SANCTIONS')}
          className={`px-4 py-2.5 font-semibold text-sm rounded-t-lg border-b-2 transition-all ${subTab === 'SANCTIONS' ? 'border-rose-500 text-rose-600 bg-rose-50/50' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Sanctions Check
        </button>
        <button
          onClick={() => setSubTab('DOCS')}
          className={`px-4 py-2.5 font-semibold text-sm rounded-t-lg border-b-2 transition-all ${subTab === 'DOCS' ? 'border-rose-500 text-rose-600 bg-rose-50/50' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Expiry Playground
        </button>
      </div>

      {/* RENDER DYNAMIC COMPLIANCE TABS */}

      {/* OVERVIEW TAB */}
      {subTab === 'OVERVIEW' && (
        <div className="space-y-8 animate-fade-in" id="comp_overview">
          {/* Bento Stats Matrix */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <span className="text-slate-400 font-bold font-mono text-[10px] uppercase tracking-wider">Blacklist Entries</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-black text-slate-900">{blockedEntities.length}</span>
                <Ban className="w-5 h-5 text-rose-500" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <span className="text-slate-400 font-bold font-mono text-[10px] uppercase tracking-wider">Held Reviews</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-black text-amber-500">{heldTransactions.length}</span>
                <Pause className="w-5 h-5 text-amber-500" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <span className="text-slate-400 font-bold font-mono text-[10px] uppercase tracking-wider">MultiSig Vaults</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-black text-indigo-500">{multiSigTransactions.length}</span>
                <Key className="w-5 h-5 text-indigo-500" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <span className="text-slate-400 font-bold font-mono text-[10px] uppercase tracking-wider">Failed Retries</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-black text-rose-600">{failedRetries.length}</span>
                <RotateCcw className="w-5 h-5 text-rose-500" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <span className="text-slate-400 font-bold font-mono text-[10px] uppercase tracking-wider">SWIFT MT103</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-black text-emerald-600">{swiftMessages.length}</span>
                <Globe className="w-5 h-5 text-emerald-600" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <span className="text-slate-400 font-bold font-mono text-[10px] uppercase tracking-wider">CTR / SAR Filed</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-black text-slate-800">{complianceReports.length}</span>
                <FileText className="w-5 h-5 text-slate-700" />
              </div>
            </div>
          </div>

          {/* Core compliance notices / Alert board */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Live SSE Compliance stream events */}
            <div className="lg:col-span-7 bg-slate-900 rounded-2xl border border-slate-800 shadow-lg text-slate-300 flex flex-col h-[520px]">
              <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-extrabold tracking-tight text-white">Live Compliance Event Stream (FIU Proxy)</span>
                </div>
                <span className="text-[10px] bg-indigo-950 text-indigo-300 px-2.5 py-1 rounded-full font-bold font-mono tracking-widest uppercase">SERVER_PUSH</span>
              </div>
              
              <div className="p-4 bg-slate-950 font-mono text-xs text-indigo-400 border-b border-slate-800 flex justify-between">
                <span>EVENT LEVEL BROADCASTER (DAEMON)</span>
                <span>STATUS: 200 SUCCESS</span>
              </div>

              <div className="flex-1 overflow-y-auto p-5 font-mono text-xs space-y-3.5 scrollbar-thin scrollbar-thumb-slate-800">
                {realtimeLogs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2 py-20">
                    <Activity className="w-8 h-8 animate-pulse text-slate-700" />
                    <span>Awaiting compliance events on the ledger...</span>
                    <span className="text-[10px]">Execute a transaction or flag an account to trigger real-time broadcast.</span>
                  </div>
                ) : (
                  realtimeLogs.map((log) => (
                    <div key={log.id} className={`p-3 rounded border transition-all ${
                      log.severity === 'CRITICAL' ? 'bg-rose-950/40 border-rose-900/40 text-rose-300' :
                      log.severity === 'WARNING' ? 'bg-amber-950/30 border-amber-900/30 text-amber-300' :
                      'bg-slate-950/40 border-slate-800 text-slate-400'
                    }`}>
                      <div className="flex items-center justify-between mb-1 text-[10px] font-bold">
                        <span className="font-mono tracking-wide">[{log.action}]</span>
                        <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-sm font-semibold leading-relaxed">{log.details}</p>
                      {log.ipAddress && <div className="text-[9px] text-slate-500 mt-1">LOG SOURCE: IP {log.ipAddress}</div>}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick-action compliance directives summary */}
            <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <span>Executive Directives Checklist</span>
                </h3>
                <div className="space-y-4 font-sans text-sm text-slate-600">
                  <div className="flex gap-3 items-start">
                    <div className="p-1 rounded bg-slate-100 shrink-0 text-slate-800 mt-0.5">✔</div>
                    <div>
                      <strong className="text-slate-900">Anti-Overdraft Shield (Article 18)</strong>
                      <p className="text-xs text-slate-500 mt-0.5">Ledger restricts all transactions forcing balance below zero.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="p-1 rounded bg-indigo-50 shrink-0 text-indigo-600 mt-0.5 font-bold">★</div>
                    <div>
                      <strong className="text-slate-900">Velocity Pattern Tracker (Fraud Scoring)</strong>
                      <p className="text-xs text-slate-500 mt-0.5">Auto-boosts risk score by +35 upon detection of Rapid Fire or Escalating Volume anomalies.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="p-1 rounded bg-indigo-50 shrink-0 text-indigo-600 mt-0.5 font-bold">★</div>
                    <div>
                      <strong className="text-slate-900">New Payee Velocity Caps</strong>
                      <p className="text-xs text-slate-500 mt-0.5">Limits transaction volume to unverified IBANs at 50,000 DA daily.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="p-1 rounded bg-indigo-50 shrink-0 text-indigo-600 mt-0.5 font-bold">★</div>
                    <div>
                      <strong className="text-slate-900">High-Value Gating Limit</strong>
                      <p className="text-xs text-slate-500 mt-0.5">Transfers over 1,000,000 DA automatically queue for MultiSig dual approvals.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="p-1 rounded bg-indigo-50 shrink-0 text-indigo-600 mt-0.5 font-bold">★</div>
                    <div>
                      <strong className="text-slate-900">Automatic CTR Trigger (Article 12)</strong>
                      <p className="text-xs text-slate-500 mt-0.5">Auto-drafts FIU reports for single ledger actions exceeding 10M DA.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick warning state */}
              {totalAlerts > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mt-6 flex gap-3">
                  <AlertOctagon className="w-5 h-5 text-rose-500 shrink-0" />
                  <div>
                    <h4 className="font-bold text-rose-900 text-sm">Regulatory Alerts Pending: {totalAlerts}</h4>
                    <p className="text-xs text-rose-700 mt-1">There are {pendingHeldCount} compliance holds and {pendingMsigCount} large transfers awaiting immediate dual-approval signature or reject decisions.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* BLACKLIST TAB */}
      {subTab === 'BLACKLIST' && (
        <div className="space-y-8 animate-fade-in" id="comp_blacklist">
          {/* Blacklist setup form and table */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
              <h3 className="font-extrabold text-slate-900 text-lg mb-4 flex items-center gap-2">
                <Ban className="w-5 h-5 text-rose-500" />
                <span>Add Blocked Entity</span>
              </h3>
              <p className="text-xs text-slate-500 mb-6">Permanently block IBANs, Accounts, IPs or Devices flagged for anomalous activity or fraud.</p>
              
              <form onSubmit={handleAddBlacklist} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Entity Type</label>
                  <select 
                    value={blackListForm.entityType}
                    onChange={(e) => setBlackListForm({ ...blackListForm, entityType: e.target.value as any })}
                    className="w-full bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="ACCOUNT">ACCOUNT (Account ID)</option>
                    <option value="IBAN">IBAN (Algerian IBAN)</option>
                    <option value="IP">IP ADDRESS</option>
                    <option value="DEVICE_ID">DEVICE ID</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Entity Value</label>
                  <input 
                    type="text" 
                    placeholder="e.g. DZ542109..."
                    value={blackListForm.entityValue}
                    onChange={(e) => setBlackListForm({ ...blackListForm, entityValue: e.target.value })}
                    className="w-full bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Reason for Blacklisting</label>
                  <textarea 
                    placeholder="Provide specific fraud trigger or audit score indicator..."
                    value={blackListForm.reason}
                    onChange={(e) => setBlackListForm({ ...blackListForm, reason: e.target.value })}
                    rows={3}
                    className="w-full bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold p-3 rounded-lg text-sm shadow-md shadow-rose-600/15 transition-all flex items-center justify-center gap-1.5"
                >
                  <Ban className="w-4 h-4" />
                  <span>Enforce Blacklist Restriction</span>
                </button>
              </form>
            </div>

            {/* Blacklisted elements list */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-extrabold text-slate-900 text-lg mb-6 flex items-center justify-between">
                <span>Active Fraud Blacklist Directory</span>
                <span className="text-xs text-rose-600 font-mono tracking-wider font-semibold bg-rose-50 px-3 py-1 rounded-full uppercase">CENTRAL_BLOCKING</span>
              </h3>

              <div className="overflow-x-auto">
                {blockedEntities.length === 0 ? (
                  <div className="text-center py-20 text-slate-400 font-medium">
                    <Ban className="w-10 h-10 mx-auto text-slate-300 mb-2.5" />
                    <span>No blacklisted entities currently registered.</span>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 font-mono text-slate-400 text-[10px] uppercase font-bold">
                        <th className="py-3 px-2">Type</th>
                        <th className="py-3 px-2">Value</th>
                        <th className="py-3 px-2">Reason</th>
                        <th className="py-3 px-2">Status</th>
                        <th className="py-3 px-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-600 text-xs">
                      {blockedEntities.map((b) => (
                        <tr key={b.id} className="border-b border-slate-50 hover:bg-slate-50">
                          <td className="py-4.5 px-2 font-bold font-mono text-[10px] text-slate-500">{b.entityType}</td>
                          <td className="py-4.5 px-2 font-mono font-semibold text-slate-900 break-all">{b.entityValue}</td>
                          <td className="py-4.5 px-2 max-w-xs truncate" title={b.reason}>{b.reason}</td>
                          <td className="py-4.5 px-2">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              b.status === 'ACTIVE' ? 'bg-rose-50 text-rose-700' :
                              b.status === 'APPEAL_PENDING' ? 'bg-amber-50 text-amber-700' :
                              'bg-slate-100 text-slate-500'
                            }`}>{b.status}</span>
                          </td>
                          <td className="py-4.5 px-2 text-right space-x-2">
                            {b.status === 'ACTIVE' && (
                              <button 
                                onClick={() => handleUpdateBlacklistStatus(b.id, 'APPEAL_PENDING')}
                                className="text-amber-600 hover:text-amber-800 font-bold hover:underline"
                              >
                                Request Appeal
                              </button>
                            )}
                            {b.status !== 'LIFTED' ? (
                              <button 
                                onClick={() => handleUpdateBlacklistStatus(b.id, 'LIFTED', 'Legitimate appeal cleared.')}
                                className="text-emerald-600 hover:text-emerald-800 font-bold hover:underline"
                              >
                                Lift Block
                              </button>
                            ) : (
                              <span className="text-slate-400 font-medium">Lifted</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WHITELIST TAB */}
      {subTab === 'WHITELIST' && (
        <div className="space-y-8 animate-fade-in" id="comp_whitelist">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
              <h3 className="font-extrabold text-slate-900 text-lg mb-4 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-500" />
                <span>Register Trusted Payee</span>
              </h3>
              <p className="text-xs text-slate-500 mb-6">Associate verified high-frequency payees to bypass the mandatory daily 50K DA limit to new/unverified accounts.</p>

              <form onSubmit={handleAddWhitelist} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">User Account</label>
                  <select 
                    value={whitelistForm.accountId}
                    onChange={(e) => setWhitelistForm({ ...whitelistForm, accountId: e.target.value })}
                    className="w-full bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select User...</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({a.email})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Trusted Beneficiary IBAN</label>
                  <input 
                    type="text" 
                    placeholder="e.g. DZ54..."
                    value={whitelistForm.beneficiaryIban}
                    onChange={(e) => setWhitelistForm({ ...whitelistForm, beneficiaryIban: e.target.value })}
                    className="w-full bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Trusted Beneficiary Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. S. Bensmail"
                    value={whitelistForm.beneficiaryName}
                    onChange={(e) => setWhitelistForm({ ...whitelistForm, beneficiaryName: e.target.value })}
                    className="w-full bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-3 rounded-lg text-sm shadow-md shadow-indigo-600/15 transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register Trusted Payee</span>
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-extrabold text-slate-900 text-lg mb-6 flex items-center justify-between">
                <span>Trusted Payees Whitelist Directory</span>
                <span className="text-xs text-indigo-600 font-mono tracking-wider font-semibold bg-indigo-50 px-3 py-1 rounded-full uppercase">TRUSTED_WHITELIST</span>
              </h3>

              {/* Display existing whitelist entries dynamically mapping current accounts */}
              <div className="space-y-6">
                {accounts.map(acc => {
                  const trusted = blockedEntities; // just for counting fallback but we query by API
                  return (
                    <div key={acc.id} className="border border-slate-100 rounded-xl p-4 bg-slate-50/50">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
                        <span className="font-bold text-slate-900 text-sm">{acc.name}'s Trusted Directory</span>
                        <span className="text-[10px] text-slate-500 font-mono">{acc.iban}</span>
                      </div>
                      
                      <TrustedList accountId={acc.id} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COMPLIANCE HOLDS TAB */}
      {subTab === 'HELD' && (
        <div className="space-y-8 animate-fade-in" id="comp_holds">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-extrabold text-slate-900 text-lg mb-2 flex items-center justify-between">
              <span>Manual Risk Verification Holds (Risk {'>'}= 75)</span>
              <span className="text-xs text-amber-600 font-mono tracking-wider font-semibold bg-amber-50 px-3 py-1 rounded-full uppercase">MANUAL_REVIEW_QUEUE</span>
            </h3>
            <p className="text-xs text-slate-500 mb-6">All transactions with risk scores exceeding 75 are suspended instantly. Operatives must review anomaly factors and provide formal reasons to Clear or Reject.</p>

            {/* Hold Review Form Notes */}
            {heldTransactions.some(h => h.decision === 'PENDING') && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Operational Review Notes (MANDATORY)</label>
                <textarea 
                  placeholder="Specify review findings, verified credentials, and justification for either clearing or permanently rejecting the transaction..."
                  value={operatorReviewNotes}
                  onChange={(e) => setOperatorReviewNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-white p-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            <div className="space-y-4">
              {heldTransactions.length === 0 ? (
                <div className="text-center py-20 text-slate-400 font-medium">
                  <Pause className="w-10 h-10 mx-auto text-slate-300 mb-2.5 animate-pulse" />
                  <span>No compliance holds currently pending.</span>
                </div>
              ) : (
                heldTransactions.map((h) => (
                  <div key={h.id} className="border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-all flex flex-col md:flex-row justify-between gap-6 bg-slate-50/25">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-slate-500">HOLD ID: {h.id}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wider uppercase ${
                          h.decision === 'PENDING' ? 'bg-amber-100 text-amber-700 animate-pulse' :
                          h.decision === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-rose-100 text-rose-700'
                        }`}>{h.decision}</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-2 gap-x-6 text-xs text-slate-600">
                        <div>
                          <strong className="text-slate-900 block font-sans">Transaction Type</strong>
                          <span className="font-semibold">{h.originalTx.type}</span>
                        </div>
                        <div>
                          <strong className="text-slate-900 block font-sans">Amount</strong>
                          <span className="font-mono font-bold text-slate-900">{h.originalTx.amount.toLocaleString()} DA</span>
                        </div>
                        <div>
                          <strong className="text-slate-900 block font-sans">Held At</strong>
                          <span>{new Date(h.heldAt).toLocaleString()}</span>
                        </div>
                        <div className="sm:col-span-2">
                          <strong className="text-slate-900 block font-sans">Sender IBAN</strong>
                          <span className="font-mono">{h.originalTx.senderIban}</span>
                        </div>
                        <div className="sm:col-span-2">
                          <strong className="text-slate-900 block font-sans">Receiver IBAN</strong>
                          <span className="font-mono">{h.originalTx.receiverIban}</span>
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-lg border border-slate-100 text-xs">
                        <strong className="text-rose-600 font-mono tracking-tight font-bold">HOLD TRIGGER FACTOR:</strong>
                        <p className="text-slate-700 mt-1 font-semibold">{h.holdReason}</p>
                      </div>

                      {h.reviewedAt && (
                        <div className="bg-indigo-50/50 p-3 rounded-lg text-xs space-y-1 text-slate-600">
                          <div><strong>Reviewed By:</strong> {h.reviewedBy} (at {new Date(h.reviewedAt).toLocaleString()})</div>
                          <div><strong>Notes:</strong> "{h.decisionNotes}"</div>
                        </div>
                      )}
                    </div>

                    {h.decision === 'PENDING' && (
                      <div className="flex flex-row md:flex-col justify-end items-center gap-3 shrink-0">
                        <button 
                          onClick={() => handleReviewHeld(h.id, 'APPROVED')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-1 shadow-md shadow-emerald-600/10 transition-all"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve & Clear</span>
                        </button>
                        <button 
                          onClick={() => handleReviewHeld(h.id, 'REJECTED')}
                          className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-1 shadow-md shadow-rose-600/10 transition-all"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject & Cancel</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MULTISIG APPROVALS TAB */}
      {subTab === 'MULTISIG' && (
        <div className="space-y-8 animate-fade-in" id="comp_multisig">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-extrabold text-slate-900 text-lg mb-2 flex items-center justify-between">
              <span>Dual-Control Large Transaction Approvals ({'>'} 1M DA)</span>
              <span className="text-xs text-indigo-600 font-mono tracking-wider font-semibold bg-indigo-50 px-3 py-1 rounded-full uppercase">DUAL_CONTROL_MULTISIG</span>
            </h3>
            <p className="text-xs text-slate-500 mb-6">Transactions exceeding 1M DA require mandatory authorization signatures from 2 separate platform compliance operators before execution.</p>

            {/* Operator selectors for simulation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Signed-In Operator A</label>
                <select 
                  value={signingAsOperator}
                  onChange={(e) => setSigningAsOperator(e.target.value)}
                  className="w-full bg-white p-2 rounded border border-slate-200 font-semibold"
                >
                  <option value="Amine Cherif">Amine Cherif (Director)</option>
                  <option value="H. Brahimi">H. Brahimi (Compliance Principal)</option>
                  <option value="Lydia Ould">Lydia Ould (Supervisor)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Signed-In Operator B</label>
                <select 
                  value={coSignerName}
                  onChange={(e) => setCoSignerName(e.target.value)}
                  className="w-full bg-white p-2 rounded border border-slate-200 font-semibold"
                >
                  <option value="Lydia Ould">Lydia Ould (Supervisor)</option>
                  <option value="Amine Cherif">Amine Cherif (Director)</option>
                  <option value="H. Brahimi">H. Brahimi (Compliance Principal)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">MultiSig Sign Notes</label>
                <input 
                  type="text" 
                  placeholder="Verification details..."
                  value={multiSigSignNotes}
                  onChange={(e) => setMultiSigSignNotes(e.target.value)}
                  className="w-full bg-white p-2 rounded border border-slate-200 font-semibold"
                />
              </div>
            </div>

            <div className="space-y-4">
              {multiSigTransactions.length === 0 ? (
                <div className="text-center py-20 text-slate-400 font-medium">
                  <Key className="w-10 h-10 mx-auto text-slate-300 mb-2.5 animate-pulse" />
                  <span>No multi-signature transfers pending clearance.</span>
                </div>
              ) : (
                multiSigTransactions.map((m) => (
                  <div key={m.id} className="border border-slate-200 rounded-xl p-5 bg-slate-50/10 hover:border-slate-300 transition-all">
                    <div className="flex flex-col lg:flex-row justify-between gap-6">
                      <div className="space-y-3.5 flex-1">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-bold text-slate-500">PROPOSAL: {m.id}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wider uppercase ${
                            m.status === 'PENDING_APPROVAL' ? 'bg-amber-100 text-amber-700 animate-pulse' :
                            m.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                            m.status === 'EXECUTED' ? 'bg-indigo-100 text-indigo-700' :
                            'bg-rose-100 text-rose-700'
                          }`}>{m.status}</span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                          <div>
                            <strong className="text-slate-500 block">Sender</strong>
                            <span className="font-semibold font-mono">{m.originalTx.senderIban}</span>
                          </div>
                          <div>
                            <strong className="text-slate-500 block">Beneficiary</strong>
                            <span className="font-semibold font-mono">{m.originalTx.receiverIban}</span>
                          </div>
                          <div>
                            <strong className="text-slate-500 block">Amount</strong>
                            <span className="font-mono font-black text-slate-900 text-sm">{m.originalTx.amount.toLocaleString()} DA</span>
                          </div>
                          <div>
                            <strong className="text-slate-500 block">Required Signatures</strong>
                            <span className="font-bold">{m.requiredApprovals} Operators</span>
                          </div>
                        </div>

                        {/* Approvals audit list */}
                        <div className="space-y-2 mt-4">
                          <strong className="text-xs text-slate-800 font-bold block">Signature Chain:</strong>
                          {m.currentApprovals.length === 0 ? (
                            <div className="text-xs text-slate-400 font-medium italic">Awaiting first signature co-signing...</div>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {m.currentApprovals.map((sig, i) => (
                                <div key={i} className="bg-white p-2.5 rounded-lg border border-slate-100 text-xs flex items-center gap-2">
                                  <span className={sig.approvalStatus === 'APPROVED' ? 'text-emerald-500' : 'text-rose-500'}>✔</span>
                                  <div>
                                    <span className="font-bold text-slate-900">{sig.signerName}</span>
                                    <span className="text-[10px] text-slate-500 font-mono block">Signed at {new Date(sig.signedAt).toLocaleTimeString()}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {m.status === 'PENDING_APPROVAL' && (
                        <div className="flex flex-row lg:flex-col justify-end items-center gap-3 shrink-0">
                          <button 
                            onClick={() => handleSignMultiSig(m.id, 'APPROVED', signingAsOperator)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-3 rounded-lg flex items-center gap-1.5 shadow-md shadow-emerald-600/10 transition-all"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Co-Sign as A</span>
                          </button>
                          <button 
                            onClick={() => handleSignMultiSig(m.id, 'APPROVED', coSignerName)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-3 rounded-lg flex items-center gap-1.5 shadow-md shadow-indigo-600/10 transition-all"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Co-Sign as B</span>
                          </button>
                          <button 
                            onClick={() => handleSignMultiSig(m.id, 'REJECTED', signingAsOperator)}
                            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-3 rounded-lg flex items-center gap-1.5 shadow-md shadow-rose-600/10 transition-all"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Veto Reject</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* FAILED RETRIES TAB */}
      {subTab === 'RETRIES' && (
        <div className="space-y-8 animate-fade-in" id="comp_retries">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-extrabold text-slate-900 text-lg mb-2 flex items-center justify-between">
              <span>Failed Ledger Operations Retry Policy (3x Threshold)</span>
              <span className="text-xs text-rose-600 font-mono tracking-wider font-semibold bg-rose-50 px-3 py-1 rounded-full uppercase">RETRY_POLICIES</span>
            </h3>
            <p className="text-xs text-slate-500 mb-6">Failed operations are logged with detailed error metadata. System retries standard connection failures up to 3 times before abandoning.</p>

            <div className="overflow-x-auto">
              {failedRetries.length === 0 ? (
                <div className="text-center py-20 text-slate-400 font-medium">
                  <RotateCcw className="w-10 h-10 mx-auto text-slate-300 mb-2.5" />
                  <span>No failed transaction records in retry queue.</span>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 font-mono text-slate-400 text-[10px] uppercase font-bold">
                      <th className="py-3 px-2">Failure ID</th>
                      <th className="py-3 px-2">Type</th>
                      <th className="py-3 px-2">Amount</th>
                      <th className="py-3 px-2">Reason for Failure</th>
                      <th className="py-3 px-2">Attempts</th>
                      <th className="py-3 px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-600 text-xs font-mono">
                    {failedRetries.map((r) => (
                      <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="py-4 px-2 font-bold text-slate-500 text-[10px]">{r.id}</td>
                        <td className="py-4 px-2 font-sans font-semibold">{r.originalTx?.type || 'UNKNOWN'}</td>
                        <td className="py-4 px-2 font-bold text-slate-900">{r.originalTx?.amount?.toLocaleString() || 0} DA</td>
                        <td className="py-4 px-2 font-sans text-rose-600 max-w-sm font-semibold">{r.failureReason}</td>
                        <td className="py-4 px-2 font-bold">{r.retryCount} / {r.maxRetries}</td>
                        <td className="py-4 px-2 font-sans">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            r.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                            r.status === 'RETRIED' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-slate-100 text-slate-500'
                          }`}>{r.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CTR / SAR REPORTS TAB */}
      {subTab === 'REPORTS' && (
        <div className="space-y-8 animate-fade-in" id="comp_reports">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
              <h3 className="font-extrabold text-slate-900 text-lg mb-4 flex items-center gap-2">
                <FileWarning className="w-5 h-5 text-rose-600" />
                <span>File Manual SAR Report</span>
              </h3>
              <p className="text-xs text-slate-500 mb-6">Submit a formal Suspicious Activity Report (SAR) to the Bank of Algeria FIU regarding an account displaying anomaly triggers.</p>

              <form onSubmit={handleFileSAR} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Target Account</label>
                  <select 
                    value={sarForm.accountId}
                    onChange={(e) => setSarForm({ ...sarForm, accountId: e.target.value })}
                    className="w-full bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="">Select Account...</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({a.email})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Suspicious Reason details</label>
                  <textarea 
                    placeholder="Provide detailed description of pattern detection (e.g. structuring behavior, fake documents)..."
                    value={sarForm.reason}
                    onChange={(e) => setSarForm({ ...sarForm, reason: e.target.value })}
                    rows={4}
                    className="w-full bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold p-3 rounded-lg text-sm shadow-md shadow-rose-600/15 transition-all flex items-center justify-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>Draft Suspicious Report</span>
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-extrabold text-slate-900 text-lg mb-6 flex items-center justify-between">
                <span>FIU Compliance Filings (CTR & SAR Reports)</span>
                <span className="text-xs text-rose-600 font-mono tracking-wider font-semibold bg-rose-50 px-3 py-1 rounded-full uppercase">ALGERIA_FIU_TRANSMISSION</span>
              </h3>

              <div className="space-y-4">
                {complianceReports.length === 0 ? (
                  <div className="text-center py-20 text-slate-400 font-medium">
                    <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2.5" />
                    <span>No CTR or SAR reports created.</span>
                  </div>
                ) : (
                  complianceReports.map((rep) => (
                    <div key={rep.id} className="border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-all flex flex-col sm:flex-row justify-between gap-6 bg-slate-50/10">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black font-mono tracking-wider uppercase ${
                            rep.reportType === 'SAR' ? 'bg-rose-100 text-rose-700' : 'bg-slate-900 text-slate-100'
                          }`}>{rep.reportType} REPORT</span>
                          <span className="font-mono text-xs font-bold text-slate-500">{rep.id}</span>
                        </div>

                        <div className="text-xs text-slate-600 grid grid-cols-2 gap-2 mt-2">
                          <div><strong>Target Entity:</strong> {rep.targetEntity}</div>
                          <div><strong>Filing Date:</strong> {new Date(rep.reportDate).toLocaleDateString()}</div>
                          <div className="col-span-2"><strong>Indicator Triggers:</strong></div>
                          <div className="col-span-2 flex flex-wrap gap-1">
                            {rep.suspiciousIndicators?.map((ind, i) => (
                              <span key={i} className="bg-slate-100 text-slate-800 text-[9px] font-semibold px-2 py-0.5 rounded border border-slate-200">{ind}</span>
                            ))}
                          </div>
                        </div>

                        {rep.fiuSubmittedAt && (
                          <div className="text-[10px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 p-2 rounded mt-2">
                            ✔ Transmitted Encrypted to Bank of Algeria FIU at {new Date(rep.fiuSubmittedAt).toLocaleString()}
                          </div>
                        )}
                      </div>

                      <div className="flex sm:flex-col justify-end items-center gap-2 shrink-0">
                        {rep.status === 'DRAFT' ? (
                          <button 
                            onClick={() => handleSubmitReport(rep.id)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-1 shadow-md shadow-indigo-600/10 transition-all"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Transmit to FIU</span>
                          </button>
                        ) : (
                          <span className="text-xs text-emerald-600 font-bold font-mono tracking-wide uppercase bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">SUBMITTED</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SWIFT CLEARING TAB */}
      {subTab === 'SWIFT' && (
        <div className="space-y-8 animate-fade-in" id="comp_swift">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-extrabold text-slate-900 text-lg mb-2 flex items-center justify-between">
              <span>SWIFT Interbank Financial Clearing Ledger (MT103 Message System)</span>
              <span className="text-xs text-indigo-600 font-mono tracking-wider font-semibold bg-indigo-50 px-3 py-1 rounded-full uppercase">SWIFT_MT103</span>
            </h3>
            <p className="text-xs text-slate-500 mb-6">Real-time clearance records generated automatically for all interbank funds transfers inside the Algerian payment ecosystem.</p>

            <div className="overflow-x-auto">
              {swiftMessages.length === 0 ? (
                <div className="text-center py-20 text-slate-400 font-medium">
                  <Globe className="w-10 h-10 mx-auto text-slate-300 mb-2.5" />
                  <span>No SWIFT clearing messages generated yet.</span>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 font-mono text-slate-400 text-[10px] uppercase font-bold">
                      <th className="py-3 px-2">SWIFT Message ID</th>
                      <th className="py-3 px-2">Type</th>
                      <th className="py-3 px-2">Sender BIC</th>
                      <th className="py-3 px-2">Receiver BIC</th>
                      <th className="py-3 px-2">Clearance Vol</th>
                      <th className="py-3 px-2">Priority</th>
                      <th className="py-3 px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-600 text-xs font-mono">
                    {swiftMessages.map((s) => (
                      <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="py-4 px-2 font-bold text-slate-500 text-[10px]">{s.id}</td>
                        <td className="py-4 px-2 font-sans font-bold">{s.messageType}</td>
                        <td className="py-4 px-2 font-semibold text-slate-800">{s.senderBIC}</td>
                        <td className="py-4 px-2 font-semibold text-slate-800">{s.receiverBIC}</td>
                        <td className="py-4 px-2 font-bold text-slate-900">{s.amount.toLocaleString()} {s.currency}</td>
                        <td className="py-4 px-2 font-sans">
                          <span className={`px-2 py-0.5 rounded font-bold text-[9px] ${
                            s.priority === 'HIGH' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                          }`}>{s.priority}</span>
                        </td>
                        <td className="py-4 px-2 font-sans">
                          <span className="text-emerald-600 font-bold">✔ CLEARED</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SANCTIONS SCREENING TAB */}
      {subTab === 'SANCTIONS' && (
        <div className="space-y-8 animate-fade-in" id="comp_sanctions">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-2xl mx-auto">
            <h3 className="font-extrabold text-slate-900 text-lg mb-2 flex items-center gap-2">
              <Shield className="w-5 h-5 text-rose-500" />
              <span>Real-Time Watchlist Screening Playground (OFAC / UN)</span>
            </h3>
            <p className="text-xs text-slate-500 mb-6">Test the screening checker engine. Type names to check matching against active OFAC lists and the Central Bank of Algeria's restricted watchlist.</p>

            <form onSubmit={handleSanctionsScreen} className="flex gap-2.5">
              <input 
                type="text" 
                placeholder="Check citizen name (e.g., Mohamed Terroristes, Abdelmalek Droukdel, Tebboune)..."
                value={sanctionsSearch}
                onChange={(e) => setSanctionsSearch(e.target.value)}
                className="flex-1 bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <button 
                type="submit" 
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-3 rounded-lg text-sm transition-all"
              >
                Screen Name
              </button>
            </form>

            {sanctionsResult && (
              <div className="mt-8 p-6 rounded-xl border transition-all bg-slate-50 border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-slate-500 font-mono">SCREENING RESULT:</span>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase ${
                    sanctionsResult.sanctioned ? 'bg-rose-100 text-rose-700 animate-pulse' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {sanctionsResult.sanctioned ? 'RESTRICTED / MATCH DETECTED' : 'CLEAR / NO HIT'}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-slate-700">
                  <div><strong>Checked Entity Name:</strong> <span className="font-semibold text-slate-900 font-mono">"{sanctionsSearch}"</span></div>
                  <div><strong>Database Scanned:</strong> <span className="font-bold">{sanctionsResult.listName}</span></div>
                  {sanctionsResult.matchReason && (
                    <div className="mt-3 p-3 bg-rose-50/50 border border-rose-100 rounded-lg text-rose-800 text-xs">
                      <strong>ALERT REASON DETAIL:</strong>
                      <p className="mt-1 font-semibold leading-relaxed">{sanctionsResult.matchReason}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* EXPIRY PLAYGROUND TAB */}
      {subTab === 'DOCS' && (
        <div className="space-y-8 animate-fade-in" id="comp_expiry_playground">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
              <h3 className="font-extrabold text-slate-900 text-lg mb-2 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-500" />
                <span>Simulate Document Expiration</span>
              </h3>
              <p className="text-xs text-slate-500 mb-6">Force document expirations to verify Bank of Algeria transaction blocking rules and test cascading deactivations on associated accounts.</p>

              <form onSubmit={handleUpdateExpiry} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">User Account</label>
                  <select 
                    value={expiryForm.accountId}
                    onChange={(e) => setExpiryForm({ ...expiryForm, accountId: e.target.value })}
                    className="w-full bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Account...</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name} (Status: {a.status || 'ACTIVE'})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">ID Card Expiry Date</label>
                  <input 
                    type="date" 
                    value={expiryForm.idCardExpiryDate}
                    onChange={(e) => setExpiryForm({ ...expiryForm, idCardExpiryDate: e.target.value })}
                    className="w-full bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Proof of Address Expiry Date</label>
                  <input 
                    type="date" 
                    value={expiryForm.proofOfAddressExpiryDate}
                    onChange={(e) => setExpiryForm({ ...expiryForm, proofOfAddressExpiryDate: e.target.value })}
                    className="w-full bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Document Alert State</label>
                  <select 
                    value={expiryForm.documentStatusAlert}
                    onChange={(e) => setExpiryForm({ ...expiryForm, documentStatusAlert: e.target.value as any })}
                    className="w-full bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ACTIVE">ACTIVE (Documents valid)</option>
                    <option value="EXPIRING_SOON">EXPIRING_SOON (Alert warning)</option>
                    <option value="EXPIRED">EXPIRED (Forces immediate transaction blocking)</option>
                  </select>
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-3 rounded-lg text-sm shadow-md shadow-indigo-600/15 transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Apply Simulation</span>
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-extrabold text-slate-900 text-lg mb-6 flex items-center justify-between">
                <span>Account Document Health & Cascading Linkages</span>
                <span className="text-xs text-rose-600 font-mono tracking-wider font-semibold bg-rose-50 px-3 py-1 rounded-full uppercase">CASCADING_DEACTIVATIONS</span>
              </h3>

              <div className="space-y-4">
                {accounts.map(acc => {
                  const idCardExpired = acc.idCardExpiryDate ? new Date(acc.idCardExpiryDate) < new Date() : false;
                  return (
                    <div key={acc.id} className="border border-slate-200 rounded-xl p-4.5 bg-slate-50/5 hover:border-slate-300 transition-all">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{acc.name}</h4>
                          <span className="text-[10px] text-slate-500 font-mono block">IBAN: {acc.iban}</span>
                        </div>

                        {/* Badges representing statuses */}
                        <div className="flex gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                            acc.status === 'SUSPENDED' ? 'bg-rose-100 text-rose-700' :
                            acc.status === 'RELATED_SUSPEND_RISK' ? 'bg-amber-100 text-amber-700 animate-pulse' :
                            'bg-emerald-100 text-emerald-700'
                          }`}>{acc.status || 'ACTIVE'}</span>

                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                            idCardExpired || acc.documentStatusAlert === 'EXPIRED' ? 'bg-rose-100 text-rose-700' :
                            acc.documentStatusAlert === 'EXPIRING_SOON' ? 'bg-amber-100 text-amber-700' :
                            'bg-emerald-100 text-emerald-700'
                          }`}>DOCS: {idCardExpired ? 'EXPIRED' : acc.documentStatusAlert || 'ACTIVE'}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-3 text-xs text-slate-600 border-t border-slate-100 pt-3">
                        <div><strong>ID Card Expiry:</strong> <span className={idCardExpired ? 'text-rose-600 font-bold' : 'font-semibold'}>{acc.idCardExpiryDate || 'Not simulated'}</span></div>
                        <div><strong>Proof of Address Expiry:</strong> <span>{acc.proofOfAddressExpiryDate || 'Not simulated'}</span></div>
                        <div className="col-span-2 text-[10px] text-slate-500 font-mono mt-1">
                          EMAIL: {acc.email} | TEL: {acc.phoneNumber}
                        </div>
                      </div>

                      {acc.status === 'RELATED_SUSPEND_RISK' && (
                        <div className="mt-3 bg-amber-50 border border-amber-100 p-2 rounded text-[10px] text-amber-800 font-semibold leading-relaxed">
                          ⚠️ WARNING: Flagged with RELATED_SUSPEND_RISK due to deactivation link (Shared properties with a blacklisted entity).
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Inner Component for querywhitelists
function TrustedList({ accountId }: { accountId: string }) {
  const [list, setList] = useState<TrustedBeneficiary[]>([]);
  
  useEffect(() => {
    fetch(`/api/compliance/trusted/${accountId}`)
      .then(r => r.json())
      .then(data => setList(data))
      .catch(err => console.error("Whitelist sub-fetch error", err));
  }, [accountId]);

  if (list.length === 0) {
    return (
      <div className="text-xs text-slate-400 italic">No trusted beneficiaries added to this account directory.</div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2.5">
      {list.map((b) => (
        <div key={b.id} className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs font-semibold flex items-center gap-2">
          <span className="text-indigo-600">✔ Whitelisted:</span>
          <div>
            <span className="text-slate-900 font-bold">{b.beneficiaryName}</span>
            <span className="text-[10px] text-slate-500 font-mono block">{b.beneficiaryIban}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
