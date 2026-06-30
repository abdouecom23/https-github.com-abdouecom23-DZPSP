import React from 'react';
import { AuditLog } from '../types';

interface AuditsTabProps {
  auditLogs: AuditLog[];
}

export default function AuditsTab({ auditLogs }: AuditsTabProps) {
  return (
    <div className="space-y-8 animate-fadeIn" id="audits_tab">
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-extrabold text-slate-800 text-base">Immutable System Audits</h3>
            <p className="text-xs text-slate-500 mt-0.5">Chronological trail of core compliance activities, OCR logs, and critical triggers.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-3">Timestamp</th>
                <th className="px-6 py-3">Severity</th>
                <th className="px-6 py-3 font-mono">Event Type</th>
                <th className="px-6 py-3">Action Description Summary</th>
                <th className="px-6 py-3">Host Origin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-xs">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-3.5 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="px-6 py-3.5 text-center">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      log.severity === 'CRITICAL' 
                        ? 'bg-rose-100 text-rose-800 border border-rose-300' 
                        : log.severity === 'WARNING' 
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-slate-100 text-slate-800 border border-slate-300'
                    }`}>
                      {log.severity}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-slate-900 font-bold">{log.action}</td>
                  <td className="px-6 py-3.5 font-sans text-slate-600">{log.details}</td>
                  <td className="px-6 py-3.5 text-slate-400">{log.ipAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
