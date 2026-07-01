import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Link2, QrCode, Copy, Check, ExternalLink, Plus, Trash2, ArrowUpRight } from 'lucide-react';

interface LinkRecord {
  id: string;
  reference: string;
  amount: number;
  email: string;
  name: string;
  url: string;
  createdAt: string;
}

interface PaymentLinksProps {
  initialAmount?: number;
  initialRef?: string;
  initialEmail?: string;
  initialName?: string;
  onPayLink: (url: string) => void;
}

export default function PaymentLinks({ initialAmount, initialRef, initialEmail, initialName, onPayLink }: PaymentLinksProps) {
  const [links, setLinks] = useState<LinkRecord[]>([
    {
      id: "lnk-1",
      reference: "SVC-FEES-101",
      amount: 1500,
      email: "fatiha.oul@gmail.com",
      name: "Fatiha Oulmi",
      url: `${window.location.origin}/checkout/simulation?payAmount=1500&payToName=Merchant%20Hub&payIban=DZ5400700123100023450001&payRef=SVC-FEES-101`,
      createdAt: "2026-07-01 12:00:00"
    }
  ]);

  const [amount, setAmount] = useState(initialAmount ? String(initialAmount) : '1500');
  const [reference, setReference] = useState(initialRef || 'INV-REF-909');
  const [customerEmail, setCustomerEmail] = useState(initialEmail || '');
  const [customerName, setCustomerName] = useState(initialName || '');
  
  const [showQrModal, setShowQrModal] = useState<LinkRecord | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const getGeneratedUrl = (amt: number, refVal: string, cName: string) => {
    const origin = window.location.origin;
    return `${origin}/checkout/simulation?payAmount=${amt}&payToName=${encodeURIComponent(cName || 'Merchant Hub')}&payIban=DZ5400700123100023450001&payRef=${encodeURIComponent(refVal)}`;
  };

  const handleCreateLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;

    const amt = Number(amount);
    const cName = customerName || 'Retail Customer';
    const cEmail = customerEmail || 'customer@email.dz';
    const uniqueUrl = getGeneratedUrl(amt, reference, cName);

    const newLnk: LinkRecord = {
      id: `lnk-${Date.now()}`,
      reference,
      amount: amt,
      email: cEmail,
      name: cName,
      url: uniqueUrl,
      createdAt: new Date().toLocaleString()
    };

    setLinks([newLnk, ...links]);
    
    // Reset forms
    setAmount('1500');
    setReference(`INV-REF-${Math.floor(100 + Math.random() * 900)}`);
    setCustomerEmail('');
    setCustomerName('');
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const deleteLink = (id: string) => {
    setLinks(links.filter(l => l.id !== id));
  };

  return (
    <div className="space-y-6 animate-fade-in" id="merchant_dashboard_payment_links">
      <div className="max-w-2xl">
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Payment Links & QRs</h2>
        <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
          Create customized, single-use checkout links or QR codes. When scanned or clicked by any user on this platform, they can authorize the transfer securely.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Creation Form */}
        <div className="lg:col-span-1 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4 h-fit">
          <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
            <Plus className="w-4.5 h-4.5 text-indigo-600" /> Generate Link
          </h3>

          <form onSubmit={handleCreateLink} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Collection Amount (DA)</label>
              <input
                type="number"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-black text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Payment Reference</label>
              <input
                type="text"
                required
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Customer Name (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Salim Yazid"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-semibold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Customer Email (Optional)</label>
              <input
                type="email"
                placeholder="e.g. salim@email.dz"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-semibold text-slate-800"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-3 rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Link2 className="w-4 h-4" /> Create Payment Link
            </button>
          </form>
        </div>

        {/* Links List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-extrabold text-sm sm:text-base text-slate-900">Active Links ({links.length})</h3>

          {links.length > 0 ? (
            <div className="space-y-4">
              {links.map((lnk) => (
                <div key={lnk.id} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-[9px] px-2 py-0.5 rounded-md">
                          {lnk.reference}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">{lnk.createdAt}</span>
                      </div>
                      <h4 className="font-extrabold text-slate-800 text-sm sm:text-base mt-2">Bill: {lnk.name}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold">{lnk.email}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-slate-900 text-base sm:text-lg">{lnk.amount.toLocaleString()} DA</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100 justify-between">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowQrModal(lnk)}
                        className="bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 text-slate-600 hover:text-indigo-600 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5" /> View QR
                      </button>
                      <button
                        onClick={() => copyToClipboard(lnk.id, lnk.url)}
                        className="bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 text-slate-600 hover:text-emerald-600 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                      >
                        {copiedId === lnk.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedId === lnk.id ? 'Copied' : 'Copy Link'}
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onPayLink(lnk.url)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Pay Now
                      </button>
                      <button
                        onClick={() => deleteLink(lnk.id)}
                        className="p-1.5 bg-slate-50 hover:bg-rose-50 border border-slate-100 hover:border-rose-200 text-slate-400 hover:text-rose-600 rounded-xl transition-all cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-100 rounded-3xl p-12 text-center text-slate-400 font-semibold text-xs leading-relaxed">
              No custom payment links created yet. Complete the left form to build one.
            </div>
          )}
        </div>
      </div>

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 w-full max-w-sm overflow-hidden flex flex-col">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="text-sm sm:text-base font-extrabold flex items-center gap-2">
                <QrCode className="w-5 h-5 text-indigo-400" /> Payment Scan Reticle
              </h3>
              <button onClick={() => setShowQrModal(null)} className="text-slate-400 hover:text-white font-bold text-xl">×</button>
            </div>

            <div className="p-6 flex flex-col items-center justify-center space-y-4">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center">
                <QRCodeSVG value={showQrModal.url} size={180} />
              </div>
              <div className="text-center">
                <p className="font-extrabold text-slate-900 text-sm">Collect {showQrModal.amount.toLocaleString()} DA</p>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Reference: {showQrModal.reference}</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <button
                onClick={() => copyToClipboard(showQrModal.id, showQrModal.url)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-3 rounded-xl shadow-sm transition-all cursor-pointer flex justify-center items-center gap-2"
              >
                {copiedId === showQrModal.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedId === showQrModal.id ? 'Copied to Clipboard' : 'Copy Absolute URL'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
