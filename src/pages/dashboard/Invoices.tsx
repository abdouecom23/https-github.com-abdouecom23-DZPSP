import React, { useState } from 'react';
import { Plus, Search, FileText, Calendar, Check, Send, Sparkles, Trash2, Link, ExternalLink } from 'lucide-react';
import { StatusBadge } from '../../components/dashboard/StatusBadge';

interface Invoice {
  id: string;
  reference: string;
  customerName: string;
  customerEmail: string;
  description: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'success' | 'failed';
}

interface InvoicesProps {
  onGenerateLink: (amount: number, ref: string, email: string, name: string) => void;
}

export default function Invoices({ onGenerateLink }: InvoicesProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([
    {
      id: "INV-2026-001",
      reference: "INV-2026-001",
      customerName: "Mohamed Belkacem",
      customerEmail: "m.belkacem@gmail.com",
      description: "Algerian SaaS Plan Subscription",
      amount: 4500,
      dueDate: "2026-07-15",
      status: "success"
    },
    {
      id: "INV-2026-002",
      reference: "INV-2026-002",
      customerName: "Fatiha Oulmi",
      customerEmail: "fatiha.oul@gmail.com",
      description: "Custom E-Commerce Product delivery",
      amount: 12500,
      dueDate: "2026-07-20",
      status: "pending"
    }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [ref, setRef] = useState(`INV-2026-00${invoices.length + 1}`);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('2500');
  const [dueDate, setDueDate] = useState('2026-07-30');

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !amount) return;

    const newInv: Invoice = {
      id: ref,
      reference: ref,
      customerName,
      customerEmail: customerEmail || 'customer@email.dz',
      description: desc || 'Services rendered',
      amount: Number(amount),
      dueDate,
      status: 'pending'
    };

    setInvoices([newInv, ...invoices]);
    setShowModal(false);
    
    // Reset fields
    setCustomerName('');
    setCustomerEmail('');
    setDesc('');
    setAmount('2500');
    setRef(`INV-2026-00${invoices.length + 2}`);
  };

  const deleteInvoice = (id: string) => {
    setInvoices(invoices.filter(inv => inv.id !== id));
  };

  return (
    <div className="space-y-6 animate-fade-in" id="merchant_dashboard_invoices">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Invoice Center</h2>
          <p className="text-slate-500 text-xs sm:text-sm">Generate structured invoices and receive payments immediately from local Dinar accounts.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" /> Create Invoice
        </button>
      </div>

      {/* Grid of Invoices */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {invoices.map((inv) => (
          <div key={inv.id} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-slate-400 font-bold">{inv.id}</span>
                  <StatusBadge status={inv.status} />
                </div>
                <h4 className="font-black text-slate-900 text-sm sm:text-base">{inv.customerName}</h4>
                <p className="text-[10px] text-slate-400 font-semibold">{inv.customerEmail}</p>
              </div>
              <div className="text-right">
                <span className="font-black text-slate-900 text-lg">{inv.amount?.toLocaleString()} DA</span>
                <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1 justify-end">
                  <Calendar className="w-3 h-3 text-slate-300" /> Due: {inv.dueDate}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-xs text-slate-500 font-medium">
              <strong>Item:</strong> {inv.description}
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => deleteInvoice(inv.id)}
                className="p-2 bg-slate-50 hover:bg-rose-50 border border-slate-100 hover:border-rose-200 text-slate-400 hover:text-rose-600 rounded-xl transition-all cursor-pointer"
                title="Delete invoice"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              {inv.status === 'pending' && (
                <button
                  onClick={() => onGenerateLink(inv.amount, inv.reference, inv.customerEmail, inv.customerName)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 uppercase tracking-wider"
                >
                  <Send className="w-3.5 h-3.5" /> Collect Payment Link
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Invoice creation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateInvoice} className="bg-white rounded-3xl shadow-xl border border-slate-100 w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="text-sm sm:text-base font-extrabold flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" /> Create Business Invoice
              </h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white font-bold text-xl">×</button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Invoice Reference</label>
                  <input
                    type="text"
                    required
                    value={ref}
                    onChange={(e) => setRef(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Customer Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Abderrahmane Daoudi"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Customer Email</label>
                <input
                  type="email"
                  placeholder="e.g. customer@email.dz"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Billing Amount (DA)</label>
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
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Item Description</label>
                <textarea
                  placeholder="Details of services/products..."
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-semibold text-slate-800 h-20 resize-none"
                />
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold text-xs py-3 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-3 rounded-xl shadow-sm transition-all cursor-pointer"
              >
                Create Invoice
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
