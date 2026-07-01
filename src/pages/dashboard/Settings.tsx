import React, { useState } from 'react';
import { Settings as SettingsIcon, Bell, Key, Shield, HelpCircle, Save, Check } from 'lucide-react';

export default function Settings() {
  const [storeName, setStoreName] = useState('Oran Tech Hub');
  const [webhookUrl, setWebhookUrl] = useState('https://api.orantech.dz/webhooks/payments');
  const [webhookEventSuccess, setWebhookEventSuccess] = useState(true);
  const [webhookEventFailed, setWebhookEventFailed] = useState(true);
  const [webhookEventPending, setWebhookEventPending] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 1200);
  };

  return (
    <div className="space-y-6 animate-fade-in" id="merchant_dashboard_settings">
      <div className="max-w-2xl">
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Merchant Settings</h2>
        <p className="text-slate-500 text-xs sm:text-sm">Configure your store metadata, direct callback URLs, and API webhook configurations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form panel */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-indigo-600" /> Store Profile Settings
            </h3>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Trading Name (Enseigne)</label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-semibold text-slate-800"
              />
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-indigo-600" /> Webhook Callbacks
              </h3>
              <p className="text-xs text-slate-400 font-semibold leading-relaxed">Receive automated POST responses at this URL when transaction statuses are updated by the background poller.</p>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Webhook Endpoint URL</label>
                <input
                  type="url"
                  placeholder="e.g. https://my-site.dz/api/payments/callback"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-slate-800"
                />
              </div>

              <div className="space-y-2.5 pt-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Send Callback For Event:</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs text-slate-600 font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={webhookEventSuccess}
                      onChange={(e) => setWebhookEventSuccess(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>payment.success</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-600 font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={webhookEventFailed}
                      onChange={(e) => setWebhookEventFailed(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>payment.failed</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-600 font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={webhookEventPending}
                      onChange={(e) => setWebhookEventPending(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>payment.pending</span>
                  </label>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-3 rounded-xl shadow-sm transition-all cursor-pointer flex justify-center items-center gap-2"
            >
              {saving ? 'Saving...' : saved ? <><Check className="w-4 h-4" /> Saved Successfully</> : <><Save className="w-4 h-4" /> Save Configuration</>}
            </button>
          </form>
        </div>

        {/* Info panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-4 text-xs text-slate-600 leading-relaxed font-semibold">
            <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5"><HelpCircle className="w-5 h-5 text-indigo-500" /> Webhook Signatures</h4>
            <p>For security, DinarFlow signs webhook request payloads with a cryptographic signature in the header:</p>
            <code className="block bg-white p-2.5 rounded-xl border border-slate-200 text-[10px] font-mono break-all text-indigo-600">
              X-DinarFlow-Signature: sha256=••••••••
            </code>
            <p>Verify this signature using your secret signing webhook key to confirm transactions originate strictly from our system.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
