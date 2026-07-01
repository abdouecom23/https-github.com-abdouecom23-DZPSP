import React from 'react';
import { Sparkles, ArrowRight, ArrowLeft, ShieldCheck, Cpu } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

interface HeroProps {
  onGetStarted: () => void;
  onExploreApis: () => void;
}

export function Hero({ onGetStarted, onExploreApis }: HeroProps) {
  const { t, isRtl } = useTranslation();

  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:py-32" id="marketing_hero">
      {/* Background visual decorations */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-50/60 rounded-full blur-3xl -z-10" />
      <div className="absolute top-10 right-10 w-72 h-72 bg-emerald-50/40 rounded-full blur-3xl -z-10 animate-pulse" />

      <div className="max-w-5xl mx-auto px-5 text-center space-y-6">
        {/* Animated Badge */}
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-black tracking-wide uppercase shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
          <span>{t('hero.badge')}</span>
        </div>

        {/* Display Typography */}
        <h1 className="font-extrabold text-4xl sm:text-5xl md:text-6xl text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto">
          {t('hero.title')}
        </h1>

        {/* Description Subtext */}
        <p className="text-slate-500 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          {t('hero.subtitle')}
        </p>

        {/* Buttons / CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={onGetStarted}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm px-8 py-3.5 rounded-2xl shadow-lg shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>{t('hero.cta_primary')}</span>
            {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </button>
          <button
            onClick={onExploreApis}
            className="w-full sm:w-auto bg-white border border-slate-200 hover:border-slate-300 text-slate-800 font-extrabold text-sm px-8 py-3.5 rounded-2xl shadow-sm active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Cpu className="w-4 h-4 text-slate-500" />
            <span>{t('hero.cta_secondary')}</span>
          </button>
        </div>

        {/* Compliance trust signals */}
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 pt-10 text-slate-400 font-bold text-[10px] uppercase tracking-widest border-t border-slate-100/80 mt-12">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
            <span>PCI-DSS Facilitation</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Banque d'Algérie Framework</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
            <span>Dahabia & CIB Direct Gateway</span>
          </div>
        </div>
      </div>
    </section>
  );
}
