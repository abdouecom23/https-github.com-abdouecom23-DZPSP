import React from 'react';
import { CreditCard, Link2, Search, Cpu, ShieldAlert, FileText, Zap, BarChart2 } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

export default function Features() {
  const { t } = useTranslation();

  const details = [
    {
      title: "Direct Dahabia & CIB Gateways",
      description: "Direct connection to Algerian payment switches, bypassing intermediate delays or manual transaction checks.",
      icon: CreditCard,
      color: 'bg-indigo-50 text-indigo-600',
    },
    {
      title: "Customized Payment Links",
      description: "Generate unique, single-use payment URLs for invoices, service deliveries, or custom client subscriptions.",
      icon: Link2,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      title: "Intelligent Status Poller",
      description: "A background job automatically queries SATIM/CIB transaction states to ensure database updates occur reliably.",
      icon: Search,
      color: 'bg-amber-50 text-amber-600',
    },
    {
      title: "Developer First Sandboxes",
      description: "Robust testing API credentials and sandbox checkout simulators for rapid development iteration.",
      icon: Cpu,
      color: 'bg-sky-50 text-sky-600',
    },
    {
      title: "KYB Document Flow",
      description: "Fully integrated business onboarding process to capture Registre de Commerce and NIF documentation seamlessly.",
      icon: FileText,
      color: 'bg-rose-50 text-rose-600',
    },
    {
      title: "AML & Fraud Screening",
      description: "Automated PEP sanctions checking and velocity limit controls built directly into payment creations.",
      icon: ShieldAlert,
      color: 'bg-indigo-50 text-indigo-700',
    },
    {
      title: "Zero Ledger Gas Fees",
      description: "Unlike outdated blockchain architectures, DinarFlow charges zero internal token or network execution fees.",
      icon: Zap,
      color: 'bg-yellow-50 text-yellow-600',
    },
    {
      title: "Real-time Metrics Dashboard",
      description: "Analyze success rates, average payment response speeds, and active volumes instantly from your portal.",
      icon: BarChart2,
      color: 'bg-teal-50 text-teal-600',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-5 py-12 sm:py-20 space-y-12 animate-fade-in" id="marketing_features_page">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Features Built for Success</h1>
        <p className="text-slate-500 text-sm leading-relaxed">Everything Algerian merchants need to accept, manage, and scale digital operations in full regulatory alignment.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
        {details.map((detail, idx) => (
          <div
            key={idx}
            className="p-6 bg-white border border-slate-100 rounded-3xl hover:border-indigo-200 hover:shadow-sm transition-all duration-300 flex items-start gap-4"
          >
            <div className={`p-3.5 rounded-xl shrink-0 ${detail.color}`}>
              <detail.icon className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">{detail.title}</h3>
              <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">{detail.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
