import React, { useState } from 'react';
import { Search, FileSpreadsheet, Lock } from 'lucide-react';
import { LedgerTransaction } from '../types';

interface LedgerTabProps {
  transactions: LedgerTransaction[];
}

export default function LedgerTab({ transactions }: LedgerTabProps) {
  const [txSearch, setTxSearch] = useState('');

  const triggerISO20022Export = () => {
    const payload = {
      Document: {
        FIToFICstmrCdtTrf: {
          GrpHdr: { MsgId: `MSG-${Date.now()}`, CreDtTm: new Date().toISOString(), NbOfTxs: transactions.length, SttlmInf: { SttlmMtd: 'CLRG' } },
          CdtTrfTxInf: transactions.map(tx => ({
            PmtId: { EndToEndId: tx.id, InstrId: tx.id },
            Amt: { InstdAmt: { Ccy: 'DZD', Value: tx.amount } },
            Dbtr: { FinInstnId: { Othr: { Id: tx.senderIban } } },
            Cdtr: { FinInstnId: { Othr: { Id: tx.receiverIban } } },
            Purp: { Cd: tx.type },
            RmtInf: { Ustrd: tx.reference || 'N/A' }
          }))
        }
      }
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ISO_20022_SETTLEMENT_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filteredTransactions = transactions.filter(tx => 
    (tx.id || '').toLowerCase().includes(txSearch.toLowerCase()) || 
    (tx.senderIban || '').toLowerCase().includes(txSearch.toLowerCase()) || 
    (tx.receiverIban || '').toLowerCase().includes(txSearch.toLowerCase()) ||
    (tx.reference && tx.reference.toLowerCase().includes(txSearch.toLowerCase()))
  );

  return (
    <div className="space-y-8 animate-fadeIn" id="ledger_tab">
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-slate-800 text-base">Double-Entry Transaction Ledger</h3>
            <p className="text-xs text-slate-500 mt-0.5">Real-time immutable tracing of funds movement. Meets central bank regulatory oversight.</p>
          </div>
          <div className="flex gap-3">
            <div className="relative w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search reference, sender or receiver IBAN..."
                value={txSearch}
                onChange={(e) => setTxSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            <button
              onClick={triggerISO20022Export}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1 transition-all"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Export ISO 20022
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-3">Transaction ID / Date</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Sender / Recipient</th>
                <th className="px-6 py-3">Reference / Purpose</th>
                <th className="px-6 py-3 text-right">Debit (-)</th>
                <th className="px-6 py-3 text-right">Credit (+)</th>
                <th className="px-6 py-3 text-right">Fee (DA)</th>
                <th className="px-6 py-3 text-center">Auth Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-xs">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400 text-xs">No ledger transactions found matching criteria.</td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-slate-900">{tx.id}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{new Date(tx.timestamp).toLocaleString()}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        tx.type.includes('CASH_IN') 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : tx.type.includes('CASH_OUT') 
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <p className="text-slate-600"><span className="text-[10px] font-bold uppercase text-slate-400">From:</span> {tx.senderIban}</p>
                        <p className="text-slate-600"><span className="text-[10px] font-bold uppercase text-slate-400">To:</span> {tx.receiverIban}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-sans font-medium text-slate-800">
                      {tx.reference}
                    </td>
                    <td className="px-6 py-4 text-right text-rose-600 font-bold">
                      {tx.type === 'TRANSFER' || tx.type === 'CASH_OUT' || tx.type === 'AGENT_CASH_OUT' 
                        ? `-${(tx.amount + tx.fee).toLocaleString()} DA` 
                        : '-'}
                    </td>
                    <td className="px-6 py-4 text-right text-emerald-600 font-bold">
                      {tx.type === 'TRANSFER' || tx.type === 'CASH_IN' || tx.type === 'AGENT_CASH_IN'
                        ? `+${tx.amount.toLocaleString()} DA`
                        : '-'}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-500 font-bold">
                      {tx.fee > 0 ? `${tx.fee.toLocaleString()} DA` : '0'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 py-1 px-2 rounded-lg">
                          <Lock className="w-3 h-3 shrink-0" /> Verified 2FA
                        </div>
                        {tx.riskScore ? (
                          <div className={`inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded border ${
                            tx.riskScore.score >= 70
                              ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                              : tx.riskScore.score >= 40
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          }`}>
                            Risk: {tx.riskScore.score}/100
                            {tx.riskScore.factors && tx.riskScore.factors.length > 0 && (
                              <span className="opacity-75 font-normal ml-1">({tx.riskScore.factors.join(', ')})</span>
                            )}
                          </div>
                        ) : (
                          <div className="text-[9px] text-slate-400">Risk: Low</div>
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
  );
}
