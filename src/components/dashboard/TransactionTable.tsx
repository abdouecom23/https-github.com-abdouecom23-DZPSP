import React, { useState } from 'react';
import { Search, Filter, ArrowDownLeft, ArrowUpRight, DollarSign } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

interface TransactionTableProps {
  transactions: any[];
}

export function TransactionTable({ transactions }: TransactionTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'failed'>('all');

  const filtered = transactions.filter((tx) => {
    const matchesSearch = 
      tx.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || 
      tx.status?.toLowerCase() === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4" id="merchant_tx_table_container">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search reference, payer name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-800 bg-white"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-4 h-4 text-slate-400 shrink-0 hidden sm:inline" />
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider shrink-0 hidden sm:inline">Filter:</span>
          {(['all', 'pending', 'confirmed', 'failed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-all shrink-0 ${
                statusFilter === status
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Table Element */}
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider">
                <th className="p-4">Transaction ID</th>
                <th className="p-4">Reference</th>
                <th className="p-4">Date & Time</th>
                <th className="p-4">Payer / Customer</th>
                <th className="p-4">Gateway</th>
                <th className="p-4 text-right">Amount</th>
                <th className="p-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-xs font-semibold">
              {filtered.length > 0 ? (
                filtered.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-mono text-slate-400 text-[10px] select-all">{tx.id || tx.cibTransactionId}</td>
                    <td className="p-4 text-slate-900 font-extrabold">{tx.reference || tx.memo}</td>
                    <td className="p-4 text-slate-500 font-medium">{new Date(tx.createdAt || tx.timestamp || Date.now()).toLocaleString()}</td>
                    <td className="p-4">
                      <div>
                        <p className="text-slate-900 font-bold">{tx.fullName || 'Retail Customer'}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{tx.email || 'customer@email.dz'}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="bg-indigo-50 border border-indigo-100/50 text-indigo-700 font-bold text-[9px] px-2 py-0.5 rounded-md">
                        {tx.pspProvider || 'CIB/Dahabia'}
                      </span>
                    </td>
                    <td className="p-4 text-right text-slate-900 font-black text-sm">
                      {tx.amount?.toLocaleString()} DA
                    </td>
                    <td className="p-4 text-center">
                      <StatusBadge status={tx.status} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400 font-medium">
                    No transactions found matching the filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
