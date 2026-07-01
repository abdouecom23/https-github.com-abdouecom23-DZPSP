import React, { useState } from 'react';
import { FileText, ShieldCheck, AlertTriangle, Check, Upload, ArrowUpRight, RotateCw, FileCheck } from 'lucide-react';

interface KYBProps {
  kybStatus: 'APPROVED' | 'PENDING' | 'REJECTED' | 'NOT_STARTED';
  onUpdateStatus: (newStatus: 'APPROVED' | 'PENDING' | 'REJECTED' | 'NOT_STARTED') => void;
}

export default function KYB({ kybStatus, onUpdateStatus }: KYBProps) {
  const [rcNumber, setRcNumber] = useState('26/00-098734A16');
  const [nifNumber, setNifNumber] = useState('198234509123498');
  const [rcFile, setRcFile] = useState<string | null>('registre_de_commerce.pdf');
  const [nifFile, setNifFile] = useState<string | null>('nif_certificate.pdf');
  const [bankFile, setBankFile] = useState<string | null>('releve_identite_bancaire.pdf');

  const [submitting, setSubmitting] = useState(false);
  const [screening, setScreening] = useState(false);
  const [sanctionsResult, setSanctionsResult] = useState<any | null>(null);

  const handleSubmitKyb = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      onUpdateStatus('PENDING');
    }, 1500);
  };

  const handleRunScreening = () => {
    setScreening(true);
    setSanctionsResult(null);
    setTimeout(() => {
      setScreening(false);
      setSanctionsResult({
        passed: true,
        scrutinizedAt: new Date().toLocaleString(),
        pepCheck: "CLEARED - No political exposure matches found.",
        ofacCheck: "CLEARED - Entity is not on active global sanction lists.",
        localBlacklist: "CLEARED - Not on Banque d'Algérie non-compliant blacklists."
      });
      onUpdateStatus('APPROVED');
    }, 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in" id="merchant_dashboard_kyb">
      <div className="max-w-2xl">
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Know Your Business (KYB) Verification</h2>
        <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
          In compliance with Algerian monetary regulation, we must perform secure business onboarding and compliance screening of your corporate officers before settling live funds.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Verification Status Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">KYB Onboarding Status</h3>

            {kybStatus === 'APPROVED' && (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs sm:text-sm font-semibold">
                  <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-black">KYB Approved</p>
                    <p className="text-[10px] text-emerald-600 mt-0.5">Verification completed on compliance log</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">Your account is fully verified. Settled dinars will be transferred automatically to your banking IBAN.</p>
              </div>
            )}

            {kybStatus === 'PENDING' && (
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-3 text-amber-800 text-xs sm:text-sm font-semibold animate-pulse">
                  <RotateCw className="w-6 h-6 text-amber-600 shrink-0 animate-spin" />
                  <div>
                    <p className="font-black">Pending Auditor Review</p>
                    <p className="text-[10px] text-amber-600 mt-0.5">Documents submitted. Audits take ~1 hour.</p>
                  </div>
                </div>
                <button
                  onClick={handleRunScreening}
                  disabled={screening}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {screening ? <RotateCw className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4 text-emerald-400" />}
                  <span>Simulate Auditor Approval</span>
                </button>
              </div>
            )}

            {kybStatus === 'NOT_STARTED' && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3 text-slate-600 text-xs sm:text-sm font-semibold">
                  <AlertTriangle className="w-6 h-6 text-slate-400 shrink-0" />
                  <div>
                    <p className="font-black">Not Started</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Limits capped at 50,000 DA</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">Please upload corporate documents to start the business onboarding process.</p>
              </div>
            )}
          </div>

          {sanctionsResult && (
            <div className="bg-slate-950 text-slate-200 border border-slate-900 rounded-3xl p-6 shadow-md space-y-4 font-mono text-[11px]">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-900 pb-2">
                <span>Sanctions screening</span>
                <span className="text-emerald-400">PASSED</span>
              </div>
              <p>Checked at: <strong className="text-slate-300">{sanctionsResult.scrutinizedAt}</strong></p>
              <p className="text-emerald-400">{sanctionsResult.pepCheck}</p>
              <p className="text-emerald-400">{sanctionsResult.ofacCheck}</p>
              <p className="text-emerald-400">{sanctionsResult.localBlacklist}</p>
            </div>
          )}
        </div>

        {/* Upload Form */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
          <h3 className="font-extrabold text-sm sm:text-base text-slate-900 mb-6">Corporate Document Submission</h3>

          <form onSubmit={handleSubmitKyb} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Registre du Commerce (RC) Number</label>
                <input
                  type="text"
                  required
                  value={rcNumber}
                  onChange={(e) => setRcNumber(e.target.value)}
                  disabled={kybStatus === 'APPROVED'}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-800 disabled:bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Numéro d'Identification Fiscale (NIF)</label>
                <input
                  type="text"
                  required
                  value={nifNumber}
                  onChange={(e) => setNifNumber(e.target.value)}
                  disabled={kybStatus === 'APPROVED'}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-800 disabled:bg-slate-50"
                />
              </div>
            </div>

            {/* Document upload nodes */}
            <div className="space-y-4">
              {/* Document 1 */}
              <div className="border border-slate-100 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex gap-3 items-center">
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><FileText className="w-5 h-5" /></div>
                  <div>
                    <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">Registre du Commerce PDF</h4>
                    <p className="text-[10px] text-slate-400 font-semibold">{rcFile || 'No file selected'}</p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={kybStatus === 'APPROVED'}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" /> Upload
                </button>
              </div>

              {/* Document 2 */}
              <div className="border border-slate-100 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex gap-3 items-center">
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><FileText className="w-5 h-5" /></div>
                  <div>
                    <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">NIF Certificate PDF</h4>
                    <p className="text-[10px] text-slate-400 font-semibold">{nifFile || 'No file selected'}</p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={kybStatus === 'APPROVED'}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" /> Upload
                </button>
              </div>

              {/* Document 3 */}
              <div className="border border-slate-100 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex gap-3 items-center">
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><FileText className="w-5 h-5" /></div>
                  <div>
                    <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">Relevé d'Identité Bancaire (RIB)</h4>
                    <p className="text-[10px] text-slate-400 font-semibold">{bankFile || 'No file selected'}</p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={kybStatus === 'APPROVED'}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" /> Upload
                </button>
              </div>
            </div>

            {kybStatus !== 'APPROVED' && (
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white font-extrabold text-xs py-3.5 rounded-2xl shadow-sm transition-all cursor-pointer flex justify-center items-center gap-2"
              >
                {submitting ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    Submitting Documents...
                  </>
                ) : (
                  <>Submit Business Documents</>
                )}
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
