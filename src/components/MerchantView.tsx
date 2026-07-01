import React, { useState } from 'react';
import { CreditCard, FileText, Link2, QrCode, Receipt, ArrowUpCircle, X, Copy, Check, ExternalLink, Info, CheckCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { UserAccount } from '../types';

interface MerchantViewProps {
  user: UserAccount;
  accounts: UserAccount[];
}

export function MerchantView({ user, accounts }: MerchantViewProps) {
  const [showQrModal, setShowQrModal] = useState(false);
  const [amount, setAmount] = useState('1500');
  const [reference, setReference] = useState('INV-2026-089');
  const [merchantIban, setMerchantIban] = useState(user?.iban || '');
  const [copiedLink, setCopiedLink] = useState(false);

  if (!user) {
    return (
      <div className="p-8 text-center text-slate-400 font-semibold text-xs">
        No active merchant user selected.
      </div>
    );
  }

  const selectedMerchant = accounts.find(a => a.iban === merchantIban) || user;

  // Generate dynamic absolute payment link pointing back to this app with parameters
  const getPaymentLink = () => {
    const origin = window.location.origin;
    const path = window.location.pathname;
    return `${origin}${path}?payAmount=${encodeURIComponent(amount)}&payToName=${encodeURIComponent(selectedMerchant.name)}&payIban=${encodeURIComponent(selectedMerchant.iban)}&payRef=${encodeURIComponent(reference)}`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getPaymentLink());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSimulatePayment = () => {
    // Navigate to the payment link which triggers the URL params detection in App/UserView
    window.location.href = getPaymentLink();
  };

  const features = [
    { 
      title: "Accept Payments via Dahabia", 
      icon: CreditCard, 
      description: "Receive funds directly from customers using Dahabia cards with complete reliability and speed." 
    },
    { 
      title: "Invoice Management", 
      icon: FileText, 
      description: "Easily create and manage invoices with real-time payment tracking." 
    },
    { 
      title: "Generate Payment Links", 
      icon: Link2, 
      description: "Create secure payment links instantly for your clients to pay via Dahabia, CIB.",
      action: () => setShowQrModal(true)
    },
    { 
      title: "QR Code Payments", 
      icon: QrCode, 
      description: "Let customers pay using QR codes for fast, contactless transactions.", 
      action: () => setShowQrModal(true) 
    },
    { 
      title: "Digital Receipts", 
      icon: Receipt, 
      description: "Provide instant digital receipts with full transaction details to your customers." 
    },
    { 
      title: "Instant Withdrawals to Bank", 
      icon: ArrowUpCircle, 
      description: "Withdraw your funds instantly to your bank account or CCP with zero delays." 
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-8 shadow-sm space-y-8" id="merchant_services_view">
      <div className="max-w-xl">
        <h3 className="font-extrabold text-2xl text-slate-900 tracking-tight">Powerful Business Tools</h3>
        <p className="text-slate-500 mt-2 text-sm leading-relaxed">
          Designed to help Algerian businesses accept contactless payments, generate secure payment links, and manage transactions.
        </p>
      </div>

      {/* Quick Alert Banner */}
      <div className="bg-indigo-50/50 border border-indigo-100/80 rounded-2xl p-4 flex gap-3 text-xs text-indigo-800">
        <Info className="w-5 h-5 text-indigo-600 shrink-0" />
        <div>
          <span className="font-bold">Contactless Payments Enabled:</span> Under the DinarFlow Merchant Program, you can generate direct payment links and dynamic QR codes. When scanned or clicked by any user on this platform, they will be prompted to instantly confirm and authorize the payment from their secure digital wallet.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f, i) => (
          <div 
            key={i} 
            onClick={f.action}
            className={`p-6 bg-slate-50 border border-slate-100 rounded-3xl space-y-4 hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer`}
          >
            <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 inline-block">
              <f.icon className="w-6 h-6" />
            </div>
            <h4 className="font-extrabold text-slate-900">{f.title}</h4>
            <p className="text-xs text-slate-500 leading-relaxed">{f.description}</p>
            {f.action && (
              <span className="inline-block text-[10px] font-bold text-indigo-600 bg-indigo-100/50 px-2 py-1 rounded-md uppercase tracking-wider">
                Click to open
              </span>
            )}
          </div>
        ))}
      </div>

      {showQrModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" id="qr_payment_creator_modal">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="text-lg font-extrabold flex items-center gap-2">
                <QrCode className="w-5 h-5 text-indigo-400" /> QR Code & Payment Link Generator
              </h3>
              <button onClick={() => setShowQrModal(false)} className="text-slate-400 hover:text-white text-xl font-bold">×</button>
            </div>
            
            <div className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Receiving Merchant</label>
                  <select
                    value={merchantIban}
                    onChange={(e) => setMerchantIban(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.iban}>
                        {acc.name} ({acc.id === user.id ? 'You' : 'Partner'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Payment Reference / Invoice</label>
                  <input 
                    type="text"
                    placeholder="e.g. INV-2026-12"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Amount to Collect (DA)</label>
                <div className="relative">
                  <input 
                    type="number"
                    min="1"
                    placeholder="Amount (DA)"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-lg text-slate-800"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-sm text-slate-400">
                    DA
                  </div>
                </div>
              </div>
              
              {amount && Number(amount) > 0 ? (
                <div className="space-y-4">
                  <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center">
                      <QRCodeSVG value={getPaymentLink()} size={180} />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 mt-3 uppercase tracking-wider">Dynamic QR Code</span>
                  </div>

                  {/* Generated Link Section */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500 uppercase">Direct Payment Link</label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        readOnly
                        value={getPaymentLink()}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-600 outline-none truncate"
                      />
                      <button
                        onClick={handleCopyLink}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 transition-all"
                      >
                        {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copiedLink ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400">Share this link directly. Opening it will prompt any user on this app to complete the payment instantly.</p>
                  </div>

                  {/* Simulation / Instant Click Trigger */}
                  <div className="pt-2">
                    <button
                      onClick={handleSimulatePayment}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                      <ExternalLink className="w-4 h-4" /> Simulator: Pay this link now with active account
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 text-xs">
                  Please specify a valid collection amount to generate QR and Payment link.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
