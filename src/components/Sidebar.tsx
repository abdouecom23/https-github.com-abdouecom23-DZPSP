import React from 'react';
import {
  LayoutDashboard,
  FileSpreadsheet,
  UserCheck,
  Users,
  Scale,
  ShieldCheck,
  Shield,
} from 'lucide-react';
import { NavTab } from '../types';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  kycPendingCount: number;
  showMismatchWarning: boolean;
  pendingComplianceCount?: number;
}

export default function Sidebar({ activeTab, setActiveTab, kycPendingCount, showMismatchWarning, pendingComplianceCount }: SidebarProps) {
  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col justify-between shrink-0" id="sidebar_nav">
      <div>
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-lg text-white shadow-md shadow-indigo-900/30">
              DF
            </div>
            <div>
              <span className="font-extrabold tracking-tight text-xl text-white">DinarFlow</span>
              <p className="text-[10px] text-slate-400 font-mono tracking-widest font-semibold uppercase mt-0.5">Algerian PSP Console</p>
            </div>
          </div>
        </div>

        <nav className="py-6 px-3 space-y-1">
          <SidebarButton
            id="tab_overview"
            active={activeTab === 'DASHBOARD'}
            onClick={() => setActiveTab('DASHBOARD')}
            icon={<LayoutDashboard className="w-4.5 h-4.5" />}
            label="Dashboard Overview"
          />

          <SidebarButton
            id="tab_ledger"
            active={activeTab === 'LEDGER'}
            onClick={() => setActiveTab('LEDGER')}
            icon={<FileSpreadsheet className="w-4.5 h-4.5" />}
            label="Double-Entry Ledger"
          />

          <SidebarButton
            id="tab_kyc"
            active={activeTab === 'KYC'}
            onClick={() => setActiveTab('KYC')}
            icon={<UserCheck className="w-4.5 h-4.5" />}
            label="KYC Review Pipeline"
            badge={kycPendingCount > 0 ? kycPendingCount : undefined}
          />

          <SidebarButton
            id="tab_agents"
            active={activeTab === 'AGENTS'}
            onClick={() => setActiveTab('AGENTS')}
            icon={<Users className="w-4.5 h-4.5" />}
            label="Agent Network"
          />

          <SidebarButton
            id="tab_reconcile"
            active={activeTab === 'RECONCILIATION'}
            onClick={() => setActiveTab('RECONCILIATION')}
            icon={<Scale className="w-4.5 h-4.5" />}
            label="Safeguarding Sync"
            indicator={showMismatchWarning}
          />

          <SidebarButton
            id="tab_audits"
            active={activeTab === 'AUDITS'}
            onClick={() => setActiveTab('AUDITS')}
            icon={<ShieldCheck className="w-4.5 h-4.5" />}
            label="Audit Logs"
          />

          <SidebarButton
            id="tab_compliance"
            active={activeTab === 'COMPLIANCE'}
            onClick={() => setActiveTab('COMPLIANCE')}
            icon={<Shield className="w-4.5 h-4.5 text-rose-400" />}
            label="Compliance Center"
            badge={pendingComplianceCount && pendingComplianceCount > 0 ? pendingComplianceCount : undefined}
          />
        </nav>
      </div>
      {/* Operational Officer Profile footer */}
      <div className="p-6 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-indigo-400 border border-slate-700">
            HB
          </div>
          <div>
            <p className="text-sm font-bold text-slate-100">H. Brahimi</p>
            <p className="text-xs text-slate-400 font-medium">Compliance Officer</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

interface SidebarButtonProps {
  id: string;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  indicator?: boolean;
}

function SidebarButton({ id, active, onClick, icon, label, badge, indicator }: SidebarButtonProps) {
  return (
    <button
      id={id}
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
        active
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
      }`}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span>{label}</span>
      </div>
      {badge !== undefined && (
        <span className="bg-amber-500 text-slate-900 text-[10px] px-2 py-0.5 rounded-full font-bold">
          {badge}
        </span>
      )}
      {indicator && (
        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
      )}
    </button>
  );
}
