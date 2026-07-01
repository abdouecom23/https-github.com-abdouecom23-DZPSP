import React, { useState } from 'react';
import { BookOpen, Terminal, Code, Settings, Shield, ChevronRight } from 'lucide-react';

export default function Docs() {
  const [selectedSection, setSelectedSection] = useState<'intro' | 'auth' | 'payments' | 'webhooks'>('intro');

  return (
    <div className="max-w-6xl mx-auto px-5 py-12 animate-fade-in" id="marketing_docs_page">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar Nav */}
        <aside className="md:col-span-1 space-y-2">
          <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider px-3 mb-4">Developer Reference</h3>
          
          <button
            onClick={() => setSelectedSection('intro')}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-between transition-all ${
              selectedSection === 'intro' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 shrink-0" /> Introduction
            </span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setSelectedSection('auth')}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-between transition-all ${
              selectedSection === 'auth' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="flex items-center gap-2">
              <Shield className="w-4 h-4 shrink-0" /> Authentication
            </span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setSelectedSection('payments')}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-between transition-all ${
              selectedSection === 'payments' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="flex items-center gap-2">
              <Code className="w-4 h-4 shrink-0" /> Create Payments
            </span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setSelectedSection('webhooks')}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-between transition-all ${
              selectedSection === 'webhooks' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span className="flex items-center gap-2">
              <Terminal className="w-4 h-4 shrink-0" /> Status Webhooks
            </span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </aside>

        {/* Content Panel */}
        <main className="md:col-span-3 bg-white border border-slate-100 rounded-3xl p-6 sm:p-10 space-y-8 shadow-sm">
          {selectedSection === 'intro' && (
            <div className="space-y-5">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Introduction</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Welcome to the DinarFlow Merchant API. This developer documentation helps you accept online card authorizations (Dahabia & CIB) securely on your website or mobile platform in Algeria.
              </p>
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-xs sm:text-sm text-amber-800 leading-relaxed">
                <span className="font-bold">No Blockchain Overhead:</span> Unlike standard cryptocurrency solutions, DinarFlow is an Algerian payment facilitator operating in complete compliance with Bank of Algeria directives. No gas fees or Stellar tokens are moved; transactions represent direct fiat billing channels.
              </div>
              <h3 className="font-extrabold text-slate-900 pt-3">Core Integration Workflow</h3>
              <ol className="list-decimal pl-5 space-y-2.5 text-xs sm:text-sm text-slate-500 font-semibold">
                <li>Create a transaction from your secure backend using <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded">POST /v1/payments</code></li>
                <li>Redirect the customer to the generated <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded">payment_url</code></li>
                <li>Wait for status callback or active poller updates</li>
                <li>Receive funds directly to your verified CCP/bank merchant accounts</li>
              </ol>
            </div>
          )}

          {selectedSection === 'auth' && (
            <div className="space-y-5">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Authentication</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Authenticate all requests by including your secret API key in the Authorization header. Secret keys start with <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded">sec_live_</code> or <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded">sec_test_</code>.
              </p>
              <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl text-xs font-mono border border-slate-800 shadow-inner">
                Authorization: Bearer sec_live_9a8f21bc...
              </div>
              <p className="text-slate-400 text-xs">
                Warning: Always perform API requests from your backend server. Never expose secret keys in client-side client applications or browser environments.
              </p>
            </div>
          )}

          {selectedSection === 'payments' && (
            <div className="space-y-5">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Create Payments</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                To collect a payment, make a POST request with the amount, currency, unique reference, and success redirect URL.
              </p>
              
              <div className="border-t border-slate-100 pt-4 space-y-2">
                <span className="inline-block bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded-md uppercase">POST</span>
                <span className="font-mono text-xs text-slate-700 ml-2">/v1/payments</span>
              </div>

              <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Request Parameters</h4>
              <div className="border border-slate-100 rounded-2xl overflow-hidden text-xs sm:text-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
                      <th className="p-3">Field</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Required</th>
                      <th className="p-3">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600 font-semibold">
                    <tr>
                      <td className="p-3 font-mono text-indigo-600">amount</td>
                      <td className="p-3 text-slate-400">number</td>
                      <td className="p-3 text-emerald-600">Yes</td>
                      <td className="p-3">Amount in Dinars (DZD)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-indigo-600">reference</td>
                      <td className="p-3 text-slate-400">string</td>
                      <td className="p-3 text-emerald-600">Yes</td>
                      <td className="p-3">Unique internal invoice reference</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-indigo-600">return_url</td>
                      <td className="p-3 text-slate-400">string</td>
                      <td className="p-3 text-emerald-600">Yes</td>
                      <td className="p-3">Redirect URL after customer checks out</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {selectedSection === 'webhooks' && (
            <div className="space-y-5">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Status Webhooks</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Configure your Webhook endpoints inside your Merchant Portal to receive instant POST updates once a payment succeeds or fails.
              </p>
              <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50 text-xs text-slate-500 font-semibold space-y-2">
                <span className="font-extrabold text-slate-800 block">Webhook Event Payload:</span>
                <p>Event: <code className="bg-slate-200 text-slate-800 px-1 py-0.5 rounded">payment.success</code></p>
                <p>Transaction ID: <code className="bg-slate-200 text-slate-800 px-1 py-0.5 rounded">tx_8f912cd30a9e</code></p>
                <p>Reference: <code className="bg-slate-200 text-slate-800 px-1 py-0.5 rounded">INV-2026-901</code></p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
