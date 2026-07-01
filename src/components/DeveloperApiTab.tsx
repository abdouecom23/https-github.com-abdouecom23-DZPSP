import React, { useState } from 'react';
import { Code2, Key, Terminal, Copy, Check, Eye, EyeOff, FileJson } from 'lucide-react';

export default function DeveloperApiTab() {
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const apiKey = 'sk_test_51Mz2' + Math.random().toString(36).substring(2, 12);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center text-sky-600">
              <Code2 className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-800 text-lg">Developer API & Sandbox</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">Manage your API credentials, monitor webhook deliveries, and test DinarFlow integrations safely.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2 mb-4">
              <Key className="w-4 h-4 text-slate-400" />
              API Authentication
            </h4>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Secret Key (Sandbox)</label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input 
                      type={showKey ? "text" : "password"}
                      readOnly
                      value={apiKey}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono text-slate-700"
                    />
                    <button 
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button 
                    onClick={copyToClipboard}
                    className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    title="Copy API Key"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-500" />}
                  </button>
                </div>
                <p className="text-[10px] text-amber-600 mt-2 bg-amber-50 p-2 rounded border border-amber-100">
                  Warning: Never expose this key in client-side code. Use it strictly on your secure backend server.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg overflow-hidden h-full">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <h4 className="font-mono text-sm text-slate-200">Terminal - Quick Start</h4>
            </div>
            
            <div className="space-y-4 text-xs font-mono">
              <div>
                <span className="text-slate-500">// 1. Generate a CIB / Edahabia Payment Link</span><br/>
                <span className="text-emerald-400">curl</span> <span className="text-sky-300">-X</span> POST https://api.dinarflow.com/v1/cib/checkout \<br/>
                &nbsp;&nbsp;<span className="text-sky-300">-H</span> <span className="text-amber-300">"Authorization: Bearer {showKey ? apiKey : 'sk_test_***'}"</span> \<br/>
                &nbsp;&nbsp;<span className="text-sky-300">-H</span> <span className="text-amber-300">"Content-Type: application/json"</span> \<br/>
                &nbsp;&nbsp;<span className="text-sky-300">-d</span> <span className="text-amber-300">'{'{"account":"ACC_123", "amount":5000, "return_url":"https://yoursite.com"}'}'</span>
              </div>
              
              <div className="pt-2 border-t border-slate-800/50">
                <span className="text-slate-500">// 2. Connect to the Real-Time Transaction SSE Stream</span><br/>
                <span className="text-emerald-400">const</span> source = <span className="text-emerald-400">new</span> EventSource(<span className="text-amber-300">"https://api.dinarflow.com/v1/stream/transactions"</span>);<br/>
                source.<span className="text-sky-300">onmessage</span> = (event) =&gt; {'{'}<br/>
                &nbsp;&nbsp;<span className="text-emerald-400">const</span> tx = JSON.parse(event.data);<br/>
                &nbsp;&nbsp;console.log(<span className="text-amber-300">"New transaction:"</span>, tx);<br/>
                {'}'};
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
