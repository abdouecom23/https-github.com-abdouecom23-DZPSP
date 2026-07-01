import React from 'react';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

interface PricingProps {
  onSelectPlan: () => void;
}

export default function Pricing({ onSelectPlan }: PricingProps) {
  const { t } = useTranslation();

  const tiers = [
    {
      name: t('pricing_section.standard_plan'),
      price: t('pricing_section.rate_standard'),
      description: t('pricing_section.standard_desc'),
      features: [
        "Accept Dahabia & CIB cards",
        "Instant webhooks & api access",
        "Automated background status polling",
        "Standard KYC Limit: 1M DA/daily",
        "Sandbox testing credentials"
      ],
      popular: true,
      actionText: "Get Started Free"
    },
    {
      name: t('pricing_section.enterprise_plan'),
      price: t('pricing_section.rate_enterprise'),
      description: t('pricing_section.enterprise_desc'),
      features: [
        "All Standard capabilities",
        "Dedicated account manager",
        "Custom billing intervals",
        "Custom higher daily transaction caps",
        "Advanced direct API integrations"
      ],
      popular: false,
      actionText: "Contact Sales"
    }
  ];

  return (
    <div className="max-w-5xl mx-auto px-5 py-12 sm:py-20 space-y-12 animate-fade-in" id="marketing_pricing_page">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">{t('pricing_section.title')}</h1>
        <p className="text-slate-500 text-sm leading-relaxed">{t('pricing_section.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto pt-6">
        {tiers.map((tier, idx) => (
          <div
            key={idx}
            className={`p-8 rounded-3xl border transition-all duration-300 relative flex flex-col justify-between ${
              tier.popular
                ? 'bg-white border-indigo-600 shadow-lg shadow-indigo-600/5'
                : 'bg-slate-50/50 border-slate-200'
            }`}
          >
            {tier.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full">
                Most Popular
              </span>
            )}
            
            <div className="space-y-6">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900">{tier.name}</h3>
                <p className="text-xs text-slate-400 mt-1 font-semibold">{tier.description}</p>
              </div>

              <div className="space-y-1">
                <span className="text-3xl sm:text-4xl font-black text-slate-900">{tier.price}</span>
                <p className="text-xs text-slate-400">{t('pricing_section.per_tx')}</p>
              </div>

              <ul className="space-y-3.5 pt-4">
                {tier.features.map((feat, fIdx) => (
                  <li key={fIdx} className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-600 font-medium">
                    <CheckCircle className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={onSelectPlan}
              className={`w-full mt-8 py-3.5 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                tier.popular
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/10'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              <span>{tier.actionText}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
