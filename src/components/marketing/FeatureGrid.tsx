import React from 'react';
import { CreditCard, Link2, Search, Cpu } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

export function FeatureGrid() {
  const { t } = useTranslation();

  const features = [
    {
      title: t('features_section.f1_title'),
      description: t('features_section.f1_desc'),
      icon: CreditCard,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    },
    {
      title: t('features_section.f2_title'),
      description: t('features_section.f2_desc'),
      icon: Link2,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    {
      title: t('features_section.f3_title'),
      description: t('features_section.f3_desc'),
      icon: Search,
      color: 'bg-amber-50 text-amber-600 border-amber-100',
    },
    {
      title: t('features_section.f4_title'),
      description: t('features_section.f4_desc'),
      icon: Cpu,
      color: 'bg-sky-50 text-sky-600 border-sky-100',
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-white border-t border-b border-slate-100/80" id="marketing_features">
      <div className="max-w-5xl mx-auto px-5">
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {t('features_section.title')}
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            {t('features_section.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="p-8 rounded-3xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-indigo-200 hover:shadow-sm transition-all duration-300 flex gap-5"
            >
              <div className={`p-4 rounded-2xl shrink-0 h-14 w-14 flex items-center justify-center border ${feature.color}`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="font-extrabold text-lg text-slate-900">{feature.title}</h3>
                <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
