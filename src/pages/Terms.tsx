import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { ShieldCheck, Scale, FileText } from 'lucide-react';

export default function Terms() {
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto px-5 py-12 sm:py-20 space-y-12 animate-fade-in" id="marketing_terms_page">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">{t('terms_section.title')}</h1>
        <p className="text-slate-500 text-sm leading-relaxed">{t('terms_section.subtitle')}</p>
      </div>

      <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-10 space-y-8 shadow-sm">
        <div className="flex gap-4 items-start pb-6 border-b border-slate-100">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-extrabold text-base text-slate-900">1. Regulatory Framework</h3>
            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">{t('terms_section.p1')}</p>
          </div>
        </div>

        <div className="flex gap-4 items-start pb-6 border-b border-slate-100">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-extrabold text-base text-slate-900">2. Safeguarding Funds</h3>
            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">{t('terms_section.p2')}</p>
          </div>
        </div>

        <div className="flex gap-4 items-start">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-extrabold text-base text-slate-900">3. KYB & AML Controls</h3>
            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
              We operate strictly under Algerian AML policies. Merchant accounts are subject to mandatory identity verification, document validation (including Registre de Commerce, NIF, and active bank status checks), and structural velocity limit monitoring.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
