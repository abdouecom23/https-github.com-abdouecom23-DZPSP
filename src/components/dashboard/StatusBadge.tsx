import React from 'react';
import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

interface StatusBadgeProps {
  status: 'pending' | 'success' | 'failed' | 'confirmed' | 'PENDING' | 'CONFIRMED' | 'FAILED';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const norm = (status || '').toLowerCase();

  if (norm === 'success' || norm === 'confirmed') {
    return (
      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
        <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
        <span>Confirmed</span>
      </span>
    );
  }

  if (norm === 'pending') {
    return (
      <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider animate-pulse">
        <Clock className="w-3 h-3 text-amber-500 shrink-0" />
        <span>Pending</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-100 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
      <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
      <span>Failed</span>
    </span>
  );
}
