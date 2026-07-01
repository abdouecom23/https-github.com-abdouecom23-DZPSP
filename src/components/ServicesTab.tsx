import React, { useEffect, useState } from 'react';
import { PlugZap, Smartphone, Wifi, Gamepad2, Bolt, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { ApiClient } from '../apiClient';
import { useAppStore } from '../store';

type ServiceType = 'PHONE' | 'INTERNET' | 'GAME' | 'BILL';

interface ProductItem {
  id: string;
  name: string;
  operator: string;
  amount: number;
  offer: string;
}

const DEFAULT_PRODUCTS: Record<ServiceType, ProductItem[]> = {
  PHONE: [
    { id: 'p1', name: 'Mobilis Flexy 200', operator: 'Mobilis', amount: 200, offer: '200 DA Credit' },
    { id: 'p2', name: 'Mobilis Flexy 500', operator: 'Mobilis', amount: 500, offer: '500 DA Credit' },
    { id: 'p3', name: 'Mobilis Flexy 1000', operator: 'Mobilis', amount: 1000, offer: 'PixX 1000 Plan' },
    { id: 'p4', name: 'Djezzy Flexy 200', operator: 'Djezzy', amount: 200, offer: '200 DA Credit' },
    { id: 'p5', name: 'Djezzy Flexy 500', operator: 'Djezzy', amount: 500, offer: '500 DA Credit' },
    { id: 'p6', name: 'Djezzy Flexy 1000', operator: 'Djezzy', amount: 1000, offer: 'Hayla Bezzat 1000' },
    { id: 'p7', name: 'Ooredoo Storm 200', operator: 'Ooredoo', amount: 200, offer: '200 DA Credit' },
    { id: 'p8', name: 'Ooredoo Storm 500', operator: 'Ooredoo', amount: 500, offer: '500 DA Credit' },
    { id: 'p9', name: 'Ooredoo Storm 1000', operator: 'Ooredoo', amount: 1000, offer: 'Laalaj 1000 Plan' }
  ],
  INTERNET: [
    { id: 'i1', name: 'Idoom ADSL 15 Mbps', operator: 'Idoom ADSL', amount: 1600, offer: '30 Days Internet' },
    { id: 'i2', name: 'Idoom ADSL 20 Mbps', operator: 'Idoom ADSL', amount: 2200, offer: '30 Days Internet' },
    { id: 'i3', name: 'Idoom ADSL 50 Mbps', operator: 'Idoom ADSL', amount: 3600, offer: '30 Days Internet' },
    { id: 'i4', name: 'Idoom Fiber 10 Mbps', operator: 'Algerie Telecom', amount: 1500, offer: '30 Days Fiber' },
    { id: 'i5', name: 'Mobilis 4G Internet Pass', operator: 'Mobilis', amount: 1000, offer: '15 GB for 30 Days' }
  ],
  GAME: [
    { id: 'g1', name: 'Free Fire 100 Diamonds', operator: 'Free Fire', amount: 180, offer: '100+10 Diamonds' },
    { id: 'g2', name: 'Free Fire 210 Diamonds', operator: 'Free Fire', amount: 360, offer: '210+21 Diamonds' },
    { id: 'g3', name: 'PUBG Mobile 60 UC', operator: 'PUBG Mobile', amount: 200, offer: '60 UC Pack' },
    { id: 'g4', name: 'PUBG Mobile 325 UC', operator: 'PUBG Mobile', amount: 1000, offer: '325 UC Pack' },
    { id: 'g5', name: 'PlayStation $10 Voucher', operator: 'Sony', amount: 1500, offer: 'PlayStation Store $10' }
  ],
  BILL: [
    { id: 'b1', name: 'Sonelgaz Algiers Central', operator: 'Sonelgaz', amount: 2500, offer: 'Quarterly Invoice' },
    { id: 'b2', name: 'Sonelgaz Algiers Central', operator: 'Sonelgaz', amount: 5000, offer: 'Quarterly Invoice' },
    { id: 'b3', name: 'ADE Water Invoice', operator: 'ADE', amount: 1200, offer: 'ADE Water Service' }
  ]
};

export default function ServicesTab() {
  const [activeSubTab, setActiveSubTab] = useState<ServiceType>('PHONE');
  const [products, setProducts] = useState<Record<ServiceType, ProductItem[]>>(DEFAULT_PRODUCTS);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const { currentUser, setCurrentUser } = useAppStore();

  const [formOperator, setFormOperator] = useState('');
  const [formOffer, setFormOffer] = useState('');
  const [formAmount, setFormAmount] = useState<number>(0);
  const [phoneTarget, setPhoneTarget] = useState('');
  const [playerTarget, setPlayerTarget] = useState('');
  const [billTarget, setBillTarget] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await ApiClient.get('/ledger-bridge/products');
        if (res.success && res.data) {
          // If bridge service returns catalog, merge or replace
          setProducts(res.data);
        }
      } catch (err) {
        console.warn("Could not fetch remote products catalog. Falling back to default high-fidelity offline catalog.", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  // Reset fields when changing sub-tab
  useEffect(() => {
    setFormOperator('');
    setFormOffer('');
    setFormAmount(0);
    setErrorMsg(null);
    setSuccessMsg(null);
  }, [activeSubTab]);

  // Handle operator change to pre-fill offers
  const availableOperators = Array.from(new Set(products[activeSubTab].map(p => p.operator)));

  const handleOperatorChange = (op: string) => {
    setFormOperator(op);
    setFormOffer('');
    setFormAmount(0);
  };

  const handleOfferChange = (offerName: string) => {
    setFormOffer(offerName);
    const prod = products[activeSubTab].find(p => p.operator === formOperator && p.name === offerName);
    if (prod) {
      setFormAmount(prod.amount);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!formOperator || !formOffer || formAmount <= 0) {
      setErrorMsg("Please select an operator and a valid offer/amount.");
      return;
    }

    if (currentUser.balance < formAmount) {
      setErrorMsg(`Insufficient balance. You have ${currentUser.balance.toLocaleString()} DA, but this costs ${formAmount.toLocaleString()} DA.`);
      return;
    }

    const targetVal = activeSubTab === 'PHONE' ? phoneTarget :
                      activeSubTab === 'GAME' ? playerTarget :
                      activeSubTab === 'BILL' ? billTarget : 'Internet Subscription';

    if (!targetVal) {
      setErrorMsg("Please specify the destination identifier (phone number, game account, or bill reference).");
      return;
    }

    setProcessing(true);

    try {
      const res = await ApiClient.post('/ledger-bridge/recharge', {
        accountId: currentUser.id,
        serviceType: activeSubTab,
        operator: formOperator,
        phone: activeSubTab === 'PHONE' ? phoneTarget : undefined,
        playerId: activeSubTab === 'GAME' ? playerTarget : undefined,
        billId: activeSubTab === 'BILL' ? billTarget : undefined,
        amount: formAmount,
        offer: formOffer
      });

      if (res.success) {
        setSuccessMsg(`Recharge successful! ${formAmount} DA deducted. reference ID: ${res.data?.operation_id || 'SVC-SUCCESS'}`);
        // Deduct balance locally
        setCurrentUser({
          ...currentUser,
          balance: currentUser.balance - formAmount
        });
        // Clear inputs
        setPhoneTarget('');
        setPlayerTarget('');
        setBillTarget('');
        setFormOperator('');
        setFormOffer('');
        setFormAmount(0);
      } else {
        throw new Error(res.error || "Operation failed");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "The payment gateway failed to execute your recharge.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl mx-auto">
      {/* Title Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
              <PlugZap className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-800 text-lg">Digital & Utility Services</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">Directly recharge your phone, pay ADSL internet bills, and top up game credits using your secure DinarFlow balance.</p>
        </div>
        
        {currentUser && (
          <div className="mt-4 md:mt-0 text-right bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">DinarFlow Balance</span>
            <span className="text-lg font-extrabold text-slate-800">{currentUser.balance.toLocaleString()} DA</span>
          </div>
        )}
      </div>

      {/* Micro-Navigation tabs for the four sub-sections */}
      <div className="grid grid-cols-4 gap-2 bg-slate-100 p-1.5 rounded-2xl max-w-xl">
        <button
          onClick={() => setActiveSubTab('PHONE')}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'PHONE' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Phone</span>
        </button>
        <button
          onClick={() => setActiveSubTab('INTERNET')}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'INTERNET' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Wifi className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Internet</span>
        </button>
        <button
          onClick={() => setActiveSubTab('GAME')}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'GAME' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Gamepad2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Gaming</span>
        </button>
        <button
          onClick={() => setActiveSubTab('BILL')}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'BILL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bolt className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Bills</span>
        </button>
      </div>

      {/* Layout Grid: Left Form, Right Dynamic Preview Panel */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Left Form Panel */}
        <div className="md:col-span-3 bg-white border border-slate-200/50 rounded-3xl p-6 shadow-sm space-y-6">
          <h4 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">
            {activeSubTab === 'PHONE' && 'Recharge Mobile Credit'}
            {activeSubTab === 'INTERNET' && 'Renew Broadband Internet'}
            {activeSubTab === 'GAME' && 'Gaming Account Recharge'}
            {activeSubTab === 'BILL' && 'Pay National Utility Invoice'}
          </h4>

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-100 text-rose-800 p-4 rounded-2xl flex items-center gap-3 text-xs font-semibold">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-4 rounded-2xl flex items-center gap-3 text-xs font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. SELECT OPERATOR / PROVIDER */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Operator / Service Provider</label>
              <select
                required
                value={formOperator}
                onChange={(e) => handleOperatorChange(e.target.value)}
                className="w-full p-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-indigo-600 focus:bg-white transition-all font-semibold text-slate-700"
              >
                <option value="">-- Choose Operator --</option>
                {availableOperators.map(op => (
                  <option key={op} value={op}>{op}</option>
                ))}
              </select>
            </div>

            {/* 2. SELECT OFFER */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Choose Offer / Plan</label>
              <select
                required
                disabled={!formOperator}
                value={formOffer}
                onChange={(e) => handleOfferChange(e.target.value)}
                className="w-full p-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-indigo-600 focus:bg-white transition-all font-semibold text-slate-700 disabled:opacity-50"
              >
                <option value="">-- Choose Offer Plan --</option>
                {products[activeSubTab]
                  .filter(p => p.operator === formOperator)
                  .map(p => (
                    <option key={p.id} value={p.name}>{p.name} ({p.amount} DA)</option>
                  ))
                }
              </select>
            </div>

            {/* 3. CONDITIONAL IDENTIFIERS */}
            {activeSubTab === 'PHONE' && (
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Phone Number (Target)</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 0550123456"
                  value={phoneTarget}
                  onChange={(e) => setPhoneTarget(e.target.value)}
                  className="w-full p-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-indigo-600 focus:bg-white transition-all font-bold tracking-wider text-slate-700"
                />
              </div>
            )}

            {activeSubTab === 'GAME' && (
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Game Account/Player ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 548194851"
                  value={playerTarget}
                  onChange={(e) => setPlayerTarget(e.target.value)}
                  className="w-full p-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-indigo-600 focus:bg-white transition-all font-bold text-slate-700"
                />
              </div>
            )}

            {activeSubTab === 'BILL' && (
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Invoice / Contract ID Reference</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SON-9281-9923"
                  value={billTarget}
                  onChange={(e) => setBillTarget(e.target.value)}
                  className="w-full p-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-indigo-600 focus:bg-white transition-all font-bold text-slate-700"
                />
              </div>
            )}

            {/* Submit payment button */}
            <button
              type="submit"
              disabled={processing || !formOffer || formAmount <= 0}
              className={`w-full py-4 rounded-2xl text-xs font-bold tracking-widest uppercase transition-all shadow-md mt-6 flex items-center justify-center gap-2 ${
                processing
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-indigo-600/10 active:scale-[0.98]'
              }`}
            >
              {processing ? 'Processing Secure Settlement...' : `Confirm Payment: ${formAmount.toLocaleString()} DA`}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Right Preview Panel (Real-time computation) */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-sm flex flex-col justify-between h-full min-h-[300px]">
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-950/80 px-2.5 py-1 rounded-full">Secure Settlement Receipt</span>
              <h5 className="font-extrabold text-sm mt-4 text-slate-100">Deduction Summary</h5>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">DinarFlow is an electronic money institution authorized by the Bank of Algeria. Ledger settlement is instant.</p>
            </div>

            <div className="border-t border-slate-800/80 my-5 pt-5 space-y-3.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-semibold">Service Type</span>
                <span className="font-extrabold text-slate-200 uppercase tracking-wider text-[10px]">{activeSubTab}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-semibold">Operator</span>
                <span className="font-extrabold text-slate-200">{formOperator || 'Not Selected'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-semibold">Offer Package</span>
                <span className="font-bold text-indigo-300 text-right max-w-[150px] truncate">{formOffer || 'Not Selected'}</span>
              </div>
              
              <div className="border-t border-dashed border-slate-800 my-4 pt-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-slate-400 font-semibold">Total Cost</span>
                  <span className="text-xl font-black text-white">{formAmount.toLocaleString()} DA</span>
                </div>
              </div>

              {currentUser && (
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 block uppercase">Projected Balance</span>
                    <span className="font-black text-slate-300">
                      {(currentUser.balance - formAmount).toLocaleString()} DA
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-bold text-slate-500 block uppercase">Status</span>
                    <span className={`font-extrabold text-[10px] uppercase ${
                      currentUser.balance >= formAmount ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {currentUser.balance >= formAmount ? 'APPROVED' : 'INSUFFICIENT'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="text-[9px] text-slate-500 text-center mt-3 font-semibold leading-relaxed">
              Protected by Bank of Algeria regulations. All charges require secure ledger authorization.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
