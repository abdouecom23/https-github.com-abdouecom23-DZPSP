import React, { useState } from 'react';
import { TrendingUp, CreditCard, DollarSign, Activity, ArrowUpRight, ArrowDownLeft, ShieldCheck, Download } from 'lucide-react';
import { TransactionTable } from '../../components/dashboard/TransactionTable';

interface OverviewProps {
  stats: any;
  transactions: any[];
  kybStatus: 'APPROVED' | 'PENDING' | 'REJECTED' | 'NOT_STARTED';
  onWithdraw: () => void;
}

export default function Overview({ stats, transactions, kybStatus, onWithdraw }: OverviewProps) {
  const [copiedKey, setCopiedKey] = useState(false);

  const mockApiKey = "sec_live_9a8f21bc2318cf08ed0199ba17c5b1";

  const handleCopyKey = () => {
    navigator.clipboard.writeText(mockApiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // Compute metrics from the active transactions array
  const totalReceived = transactions
    .filter(t => t.status === 'CONFIRMED' || t.status === 'success')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const pendingReceived = transactions
    .filter(t => t.status === 'PENDING' || t.status === 'pending')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  return (
    <div className="space-y-8 animate-fade-in" id="merchant_dashboard_overview">
      {/* Alert if KYB not approved */}
      {kybStatus !== 'APPROVED' && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-800">
          <div className="flex gap-2 items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
            <div>
              <span className="font-black">KYB Action Required:</span> Your business verification is currently in <strong className="uppercase">{kybStatus}</strong> status. Please complete your KYB document upload to lift limits.
            </div>
          </div>
          <span className="bg-amber-100 text-amber-900 font-bold px-3 py-1 rounded-md uppercase tracking-wider text-[9px]">
            Check KYB Tab
          </span>
        </div>
      )}

      {/* Stats Cards Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1 */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Withdrawable Balance</span>
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><DollarSign className="w-4.5 h-4.5" /></span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl sm:text-3xl font-black text-slate-900">{(totalReceived * 0.985).toLocaleString()} DA</p>
            <p className="text-[10px] text-slate-400 font-semibold">After 1.5% PSP Processing Fee</p>
          </div>
          <button 
            onClick={onWithdraw}
            disabled={totalReceived === 0}
            className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-extrabold text-xs py-2.5 rounded-xl transition-all cursor-pointer shadow-sm shadow-indigo-600/5 flex items-center justify-center gap-1.5"
          >
            <ArrowUpRight className="w-4 h-4" /> Withdraw to Bank / CCP
          </button>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Sales Volume</span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><TrendingUp className="w-4.5 h-4.5" /></span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl sm:text-3xl font-black text-slate-900">{totalReceived.toLocaleString()} DA</p>
            <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
              <span>● ACTIVE GATEWAY SESSIONS</span>
            </p>
          </div>
          <div className="text-[10px] text-slate-400 font-semibold bg-slate-50 border border-slate-100 rounded-lg p-2 text-center">
            Pending Sales: <strong>{pendingReceived.toLocaleString()} DA</strong>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Authorized Success Rate</span>
            <span className="p-2 bg-sky-50 text-sky-600 rounded-xl"><ShieldCheck className="w-4.5 h-4.5" /></span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl sm:text-3xl font-black text-slate-900">98.4%</p>
            <p className="text-[10px] text-slate-400 font-semibold">Average Algerian benchmark is 82%</p>
          </div>
          <div className="text-[10px] text-sky-600 font-bold bg-sky-50 border border-sky-100/50 rounded-lg p-2 text-center">
            Risk Blocked: <strong>0.2%</strong> (Sanctions Match)
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Gateway Latency</span>
            <span className="p-2 bg-amber-50 text-amber-600 rounded-xl"><Activity className="w-4.5 h-4.5" /></span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl sm:text-3xl font-black text-slate-900">224 ms</p>
            <p className="text-[10px] text-slate-400 font-semibold">SATIM handshake direct response</p>
          </div>
          <div className="text-[10px] text-amber-600 font-bold bg-amber-50 border border-amber-100/50 rounded-lg p-2 text-center">
            Status Poll Cycle: <strong>30 seconds</strong>
          </div>
        </div>
      </div>

      {/* SVG Dashboard Chart */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">Sales Velocity (Last 7 Days)</h3>
            <p className="text-[10px] text-slate-400 font-semibold">Direct transaction volumes monitored via CIB/Dahabia channels</p>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl p-1">
            <span className="text-[10px] font-bold text-slate-500 px-2.5 py-1 bg-white rounded-lg shadow-sm">Volume (DA)</span>
          </div>
        </div>

        {/* Responsive Area Chart */}
        <div className="h-48 w-full bg-slate-50/50 rounded-2xl border border-slate-100 relative flex items-end p-4">
          <svg className="absolute inset-0 h-full w-full p-2" preserveAspectRatio="none" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            {/* Area Path */}
            <path
              d="M 5,90 Q 20,40 35,70 T 65,30 T 95,15 L 95,90 L 5,90 Z"
              fill="url(#chartGrad)"
            />
            {/* Line Path */}
            <path
              d="M 5,90 Q 20,40 35,70 T 65,30 T 95,15"
              fill="none"
              stroke="#4f46e5"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute left-4 top-4 text-[10px] font-mono text-slate-400 font-bold bg-white/80 border border-slate-100 px-2 py-1 rounded">Max: {totalReceived > 0 ? (totalReceived * 1.2).toLocaleString() : '15,000'} DA</div>
          
          {/* Chart Labels */}
          <div className="relative w-full flex justify-between text-[9px] font-mono font-bold text-slate-400 pt-2 border-t border-slate-100">
            <span>June 24</span>
            <span>June 26</span>
            <span>June 28</span>
            <span>June 30</span>
            <span>July 01 (Today)</span>
          </div>
        </div>
      </div>

      {/* Live API Key Banner */}
      <div className="bg-slate-950 text-slate-200 rounded-3xl p-6 border border-slate-900 shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <span className="bg-indigo-600 text-white font-black text-[9px] tracking-widest px-2 py-0.5 rounded uppercase">Your Live API Secret Key</span>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xl">Use this key in the header to authenticate API requests. Treat this like a password; never share it.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <input
            type="text"
            readOnly
            value={copiedKey ? "Copied Secret" : "sec_live_9a8f21bc••••••••"}
            className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-mono text-indigo-400 outline-none flex-1 sm:w-56 text-center font-bold"
          />
          <button
            onClick={handleCopyKey}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer shrink-0"
          >
            Copy
          </button>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-extrabold text-base text-slate-900">Direct Gateway Payments Feed</h3>
          <button className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1">
            <Download className="w-3.5 h-3.5" /> Export Logs
          </button>
        </div>
        <TransactionTable transactions={transactions} />
      </div>
    </div>
  );
}
