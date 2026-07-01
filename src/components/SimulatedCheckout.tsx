import React, { useState } from 'react';
import { CreditCard, ShieldCheck, CheckCircle2, RotateCw, AlertTriangle, Key } from 'lucide-react';
import { useAppStore } from '../store';

interface SimulatedCheckoutProps {
  amount: number;
  toMerchantName: string;
  reference: string;
  merchantIban: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function SimulatedCheckout({
  amount,
  toMerchantName,
  reference,
  merchantIban,
  onSuccess,
  onCancel
}: SimulatedCheckoutProps) {
  const { accounts, transactions, fetchData } = useAppStore();

  const [cardType, setCardType] = useState<'DAHABIA' | 'CIB'>('DAHABIA');
  const [cardNumber, setCardNumber] = useState('6072 0451 9081 2345');
  const [expiry, setExpiry] = useState('08/29');
  const [cardHolder, setCardHolder] = useState('RETAIL CLIENT');
  const [cvv, setCvv] = useState('123');

  const [status, setStatus] = useState<'IDLE' | 'AUTHORIZING' | 'OTP_SENT' | 'SUCCESS' | 'FAILED'>('IDLE');
  const [otpCode, setOtpCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('AUTHORIZING');
    setTimeout(() => {
      setStatus('OTP_SENT');
    }, 1500);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode !== '123456') {
      setErrorMsg('Invalid SMS authorization code. Please use 123456');
      return;
    }

    setStatus('AUTHORIZING');
    setErrorMsg('');

    // Execute payment simulated inside the store
    setTimeout(async () => {
      try {
        // Find merchant account
        const mAcc = accounts.find(a => a.iban === merchantIban) || accounts.find(a => a.kycLevel === 3) || accounts[0];
        
        // Find paying retail client or fallback to account index 0
        const payerAcc = accounts.find(a => a.iban !== mAcc.iban && a.balance >= amount) || accounts[0];

        if (payerAcc.balance < amount) {
          setErrorMsg('Insufficient funds on paying card account.');
          setStatus('FAILED');
          return;
        }

        // We can execute via local fetch to /api/cib/checkout or simulate inside the store:
        // Let's execute the actual transaction via API client post or store update
        const rawResponse = await fetch('/api/ledger-bridge/cib/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accountId: payerAcc.id,
            amount: amount,
            fullName: cardHolder,
            phone: '0550123456',
            email: 'customer@email.dz',
            memo: reference
          })
        });

        const resData = await rawResponse.json();
        
        if (resData.success) {
          const cibId = resData.data?.cib_transaction_id || resData.cib_transaction_id;
          if (cibId) {
            await fetch(`/api/ledger-bridge/cib/confirm/${cibId}`);
          }
          await fetchData(); // Pull fresh database records
          setStatus('SUCCESS');
          setTimeout(() => {
            onSuccess();
          }, 2000);
        } else {
          setErrorMsg(resData.message || 'Payment processing failed.');
          setStatus('FAILED');
        }
      } catch (err) {
        console.error(err);
        setErrorMsg('Network error executing SATIM authorization.');
        setStatus('FAILED');
      }
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto" id="checkout_simulation_canvas">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden flex flex-col my-8 animate-fade-in">
        {/* Gateway Title */}
        <div className="bg-gradient-to-r from-indigo-950 to-slate-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[9px] font-black tracking-widest uppercase text-indigo-400">SATIM Central Secure Gateway</span>
            <h3 className="font-extrabold text-base flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-400 animate-pulse" /> Unified Card Checkout
            </h3>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400 uppercase font-bold">Total Amount</p>
            <p className="font-black text-white text-lg">{amount.toLocaleString()} DA</p>
          </div>
        </div>

        {/* Dynamic States */}
        {status === 'IDLE' && (
          <form onSubmit={handlePay} className="p-6 sm:p-8 space-y-6">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-1 text-xs">
              <p className="text-slate-400 font-bold uppercase text-[9px]">Billing Merchant</p>
              <p className="font-extrabold text-slate-800 text-sm">{toMerchantName}</p>
              <p className="text-[10px] text-slate-400 font-semibold">Reference: {reference}</p>
            </div>

            {/* Issuer Choice */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">Select Payment Card Network</label>
              <div className="grid grid-cols-2 gap-4">
                {/* Dahabia */}
                <button
                  type="button"
                  onClick={() => { setCardType('DAHABIA'); setCardNumber('6072 0451 9081 2345'); }}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    cardType === 'DAHABIA'
                      ? 'bg-amber-50 border-amber-500 shadow-sm shadow-amber-500/5'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <p className="font-black text-xs text-amber-800">EDAHAIBIA</p>
                  <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Algérie Poste cards</p>
                </button>

                {/* CIB */}
                <button
                  type="button"
                  onClick={() => { setCardType('CIB'); setCardNumber('5892 1102 3456 9082'); }}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    cardType === 'CIB'
                      ? 'bg-indigo-50 border-indigo-500 shadow-sm shadow-indigo-500/5'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <p className="font-black text-xs text-indigo-800">CIB CARD</p>
                  <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Interbank network cards</p>
                </button>
              </div>
            </div>

            {/* Simulated Card Artwork */}
            <div className={`p-6 rounded-2xl text-white shadow-lg space-y-6 relative transition-all duration-300 ${
              cardType === 'DAHABIA'
                ? 'bg-gradient-to-br from-amber-500 to-yellow-600'
                : 'bg-gradient-to-br from-blue-700 to-indigo-950'
            }`}>
              <div className="flex justify-between items-center font-bold text-xs tracking-widest">
                <span>{cardType} ELECTRONIC CARD</span>
                <span className="text-white/80">SATIM</span>
              </div>
              <div className="font-mono text-lg sm:text-xl font-bold tracking-wider">{cardNumber}</div>
              <div className="flex justify-between items-center text-xs">
                <div>
                  <p className="text-[8px] text-white/60 font-bold uppercase">Cardholder</p>
                  <p className="font-bold tracking-wide mt-0.5">{cardHolder}</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] text-white/60 font-bold uppercase">Expires</p>
                  <p className="font-bold mt-0.5">{expiry}</p>
                </div>
              </div>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">CVV2 Code</label>
                <input
                  type="password"
                  maxLength={3}
                  required
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Expiry Date</label>
                <input
                  type="text"
                  placeholder="MM/YY"
                  required
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-800"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold text-xs py-3.5 rounded-xl transition-all cursor-pointer"
              >
                Cancel Checkout
              </button>
              <button
                type="submit"
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-md shadow-indigo-600/10 transition-all cursor-pointer"
              >
                Authorize {amount.toLocaleString()} DA
              </button>
            </div>
          </form>
        )}

        {status === 'AUTHORIZING' && (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-4">
            <RotateCw className="w-10 h-10 text-indigo-600 animate-spin" />
            <h4 className="font-extrabold text-slate-900 text-base">Contacting Card Processing Switch...</h4>
            <p className="text-xs text-slate-400 font-semibold max-w-xs leading-relaxed">Securing SSL tunnel, screening lists, and checking balances with national card clearinghouse.</p>
          </div>
        )}

        {status === 'OTP_SENT' && (
          <form onSubmit={handleVerifyOtp} className="p-8 text-center space-y-6">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto border border-amber-100">
              <Key className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1.5">
              <h4 className="font-extrabold text-slate-900 text-base">Authorize Card Transfer</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">An SMS OTP has been simulated. To authorize this transaction, please enter the test code below.</p>
            </div>

            <div className="max-w-xs mx-auto space-y-2">
              <input
                type="text"
                placeholder="Enter SMS OTP"
                required
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="w-full text-center tracking-widest text-lg px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-0 outline-none font-black text-slate-900 bg-slate-50"
              />
              <span className="text-[10px] text-indigo-600 font-black tracking-wider uppercase">Hint: Type 123456 to approve</span>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2 justify-center">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStatus('IDLE')}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold text-xs py-3 rounded-xl transition-all cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-3 rounded-xl shadow-sm transition-all cursor-pointer"
              >
                Confirm Transfer
              </button>
            </div>
          </form>
        )}

        {status === 'SUCCESS' && (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-4 animate-fade-in">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100 shadow-md">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h4 className="font-extrabold text-slate-900 text-lg">Transaction Complete</h4>
            <p className="text-xs text-emerald-600 font-bold">Authorized Successfully. 200 OK</p>
            <p className="text-[10px] text-slate-400 font-semibold max-w-xs leading-relaxed">Payer account debited, merchant reserves updated. Redirecting back to merchant hub...</p>
          </div>
        )}

        {status === 'FAILED' && (
          <div className="p-8 text-center space-y-6">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto border border-rose-100">
              <AlertTriangle className="w-6 h-6 text-rose-500" />
            </div>
            <div className="space-y-1.5">
              <h4 className="font-extrabold text-slate-900 text-base">Transaction Failed</h4>
              <p className="text-xs text-rose-600 font-bold">{errorMsg || 'SATIM Auth Rejection.'}</p>
            </div>
            <button
              onClick={() => setStatus('IDLE')}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl transition-all cursor-pointer"
            >
              Retry Payment
            </button>
          </div>
        )}

        {/* Footer info banner */}
        <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex items-center justify-between text-[10px] text-slate-400 font-semibold">
          <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4 text-emerald-500" /> SSL Encrypted</span>
          <span>Powered by SATIM-DZPSP core</span>
        </div>
      </div>
    </div>
  );
}
