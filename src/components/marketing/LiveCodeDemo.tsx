import React, { useState, useEffect } from 'react';
import { Play, RotateCw, Check, Terminal, Code } from 'lucide-react';

export function LiveCodeDemo() {
  const [activeTab, setActiveTab] = useState<'curl' | 'nodejs'>('curl');
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showResponse, setShowResponse] = useState(false);

  const curlCode = `curl -X POST "https://api.dinarflow.com/v1/payments" \\
  -H "Authorization: Bearer sec_live_9a8f21bc" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 2500,
    "currency": "DZD",
    "reference": "INV-2026-901",
    "customer": {
      "email": "customer@email.dz",
      "name": "Kaddour Benziane"
    },
    "return_url": "https://my-store.dz/success"
  }'`;

  const nodejsCode = `const dinarflow = require('dinarflow')('sec_live_9a8f21bc');

const payment = await dinarflow.payments.create({
  amount: 2500,
  currency: 'DZD',
  reference: 'INV-2026-901',
  customer: {
    email: 'customer@email.dz',
    name: 'Kaddour Benziane'
  },
  returnUrl: 'https://my-store.dz/success'
});

console.log(payment.payment_url);`;

  const responseJson = `{
  "success": true,
  "transaction_id": "tx_8f912cd30a9e",
  "reference": "INV-2026-901",
  "amount": 2500,
  "currency": "DZD",
  "status": "pending",
  "psp_provider": "SATIM",
  "psp_reference": "SATIM-90F3B4A2",
  "payment_url": "https://payment.dinarflow.com/checkout/SATIM-90F3B4A2",
  "created_at": "2026-07-01T16:20:00Z"
}`;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      setShowResponse(false);
      setProgress(0);
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsRunning(false);
            setShowResponse(true);
            return 100;
          }
          return prev + 15;
        });
      }, 150);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  return (
    <div className="bg-slate-950 text-slate-100 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden font-mono text-xs max-w-3xl mx-auto" id="live_code_demo">
      {/* Terminal Title Bar */}
      <div className="bg-slate-900 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-rose-500"></div>
          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
          <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
          <span className="text-slate-400 font-bold ml-2 flex items-center gap-1">
            <Terminal className="w-4 h-4 text-indigo-400" /> API Playground
          </span>
        </div>
        <div className="flex gap-2 bg-slate-950/60 rounded-xl p-1 border border-slate-800">
          <button
            onClick={() => { setActiveTab('curl'); setShowResponse(false); }}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${activeTab === 'curl' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            cURL / Shell
          </button>
          <button
            onClick={() => { setActiveTab('nodejs'); setShowResponse(false); }}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${activeTab === 'nodejs' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Node.js
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800 h-[340px]">
        {/* Request Side */}
        <div className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-3">
              <span>Request Body</span>
              <span className="text-indigo-400 flex items-center gap-1">
                <Code className="w-3.5 h-3.5" /> POST /payments
              </span>
            </div>
            <pre className="text-slate-300 leading-relaxed overflow-x-auto whitespace-pre-wrap select-all">
              {activeTab === 'curl' ? curlCode : nodejsCode}
            </pre>
          </div>
          
          <button
            onClick={() => setIsRunning(true)}
            disabled={isRunning}
            className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-indigo-600/10"
          >
            {isRunning ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin text-indigo-300" />
                Executing Request ({progress}%)
              </>
            ) : (
              <>
                <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                Run Code Demo
              </>
            )}
          </button>
        </div>

        {/* Response Side */}
        <div className="p-5 bg-slate-950/60 flex flex-col justify-between">
          <div className="w-full">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-3">
              <span>Response Console</span>
              <span className={`flex items-center gap-1 font-bold ${showResponse ? 'text-emerald-400' : 'text-slate-500'}`}>
                {showResponse ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> 201 Created
                  </>
                ) : (
                  'Status Idle'
                )}
              </span>
            </div>
            {isRunning && (
              <div className="space-y-2 mt-4">
                <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full transition-all duration-150" style={{ width: `${progress}%` }}></div>
                </div>
                <p className="text-[10px] text-slate-500 text-center animate-pulse">Contacting Algerian PSP Core Gateway...</p>
              </div>
            )}
            {showResponse ? (
              <pre className="text-emerald-400 leading-relaxed overflow-x-auto whitespace-pre-wrap select-text animate-fade-in">
                {responseJson}
              </pre>
            ) : (
              !isRunning && (
                <div className="h-44 flex flex-col items-center justify-center text-slate-600 text-center select-none">
                  <Terminal className="w-8 h-8 mb-2 opacity-50" />
                  <p>Execute the shell command to</p>
                  <p className="mt-0.5">simulate a digital payment loop.</p>
                </div>
              )
            )}
          </div>

          <div className="text-[10px] text-slate-500 font-bold border-t border-slate-900 pt-3 flex justify-between items-center">
            <span>Unified PSP API</span>
            <span>No Ledger Fee</span>
          </div>
        </div>
      </div>
    </div>
  );
}
