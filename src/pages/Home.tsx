import React from 'react';
import { Hero } from '../components/marketing/Hero';
import { FeatureGrid } from '../components/marketing/FeatureGrid';
import { LiveCodeDemo } from '../components/marketing/LiveCodeDemo';
import { useTranslation } from '../hooks/useTranslation';

interface HomeProps {
  onGetStarted: () => void;
  onExploreApis: () => void;
}

export default function Home({ onGetStarted, onExploreApis }: HomeProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-12 pb-20" id="marketing_home_page">
      {/* Hero Section */}
      <Hero onGetStarted={onGetStarted} onExploreApis={onExploreApis} />

      {/* Code Playground / Live terminal trust signal */}
      <div className="max-w-5xl mx-auto px-5">
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
          <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">Simple Developer Integration</h3>
          <p className="text-slate-500 text-xs sm:text-sm">Kickstart your merchant application with standard curls and responses. No complex SDKs needed.</p>
        </div>
        <LiveCodeDemo />
      </div>

      {/* Structured Feature Cards */}
      <FeatureGrid />
    </div>
  );
}
