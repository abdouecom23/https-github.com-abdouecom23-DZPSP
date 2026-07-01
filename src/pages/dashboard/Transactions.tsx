import React from 'react';
import { TransactionTable } from '../../components/dashboard/TransactionTable';
import { Download, RefreshCw } from 'lucide-react';

interface TransactionsProps {
  transactions: any[];
  onRefresh: () => void;
}

export default function Transactions({ transactions, onRefresh }: TransactionsProps) {
  return (
    <div className="space-y-6 animate-fade-in" id="merchant_dashboard_transactions">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Unified Payment Logs</h2>
          <p className="text-slate-500 text-xs sm:text-sm">Audit and filter direct CIB/Dahabia payment intents created via checkout sessions or merchant APIs.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="p-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-slate-600 transition-all cursor-pointer shadow-sm flex items-center justify-center"
            title="Refresh logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer">
            <Download className="w-4 h-4" /> Export CSV Log
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
        <TransactionTable transactions={transactions} />
      </div>
    </div>
  );
}
