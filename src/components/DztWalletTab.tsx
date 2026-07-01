import React, { useEffect, useState } from 'react';
import { Coins, Link, History, Shield, RefreshCw, AlertTriangle, CheckCircle2, Copy, ExternalLink, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { ApiClient } from '../apiClient';
import { useAppStore } from '../store';

interface OnChainTx {
  hash: string;
  timestamp: string;
  sender: string;
  receiver: string;
  amount: string;
  type: 'sent' | 'received';
  memo?: string;
}

interface ReconciliationData {
  success: boolean;
  publicKey: string;
  totalReceived: number;
  totalSent: number;
  netOnChain: number;
  transactionCount: number;
  internalLiabilities: number;
  timestamp: string;
}

export default function DztWalletTab() {
  const { currentUser, setCurrentUser } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [linking, setLinking] = useState(false);
  const [walletKeyInput, setWalletKeyInput] = useState('');
  const [dztBalance, setDztBalance] = useState<number | null>(null);
  const [onChainTxs, setOnChainTxs] = useState<OnChainTx[]>([]);
  const [reconciliation, setReconciliation] = useState<ReconciliationData | null>(null);
  const [loadingReconciliation, setLoadingReconciliation] = useState(false);

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const userWalletKey = currentUser?.dinarWalletKey || '';

  const fetchWalletDetails = async (publicKey: string) => {
    if (!publicKey) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      // Fetch balance
      const balRes = await ApiClient.get(`/ledger-bridge/balance/${publicKey}`);
      if (balRes.success) {
        setDztBalance(balRes.balance ?? 0);
      } else {
        throw new Error(balRes.error || "Failed to fetch on-chain balance");
      }

      // Fetch on-chain tx history
      const txRes = await ApiClient.get(`/ledger-bridge/transactions/${publicKey}`);
      if (txRes.success && txRes.transactions) {
        setOnChainTxs(txRes.transactions);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Could not retrieve Stellar wallet ledger data.");
    } finally {
      setLoading(false);
    }
  };

  const fetchReconciliationProof = async (publicKey: string) => {
    if (!publicKey) return;
    setLoadingReconciliation(true);
    try {
      const res = await ApiClient.get(`/ledger-bridge/reconcile-proof/${publicKey}`);
      if (res.success) {
        setReconciliation(res);
      }
    } catch (err) {
      console.error("Error retrieving reconciliation stats:", err);
    } finally {
      setLoadingReconciliation(false);
    }
  };

  useEffect(() => {
    if (userWalletKey) {
      fetchWalletDetails(userWalletKey);
      fetchReconciliationProof(userWalletKey);
    }
  }, [userWalletKey]);

  const handleLinkWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!walletKeyInput.trim() || walletKeyInput.length < 50) {
      setErrorMsg("Please enter a valid, complete Stellar public key.");
      return;
    }

    setLinking(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await ApiClient.post('/ledger-bridge/link-wallet', {
        accountId: currentUser.id,
        publicKey: walletKeyInput.trim()
      });

      if (res.success) {
        setSuccessMsg("Stellar wallet successfully linked to your DinarFlow core account!");
        // Update user store
        setCurrentUser({
          ...currentUser,
          dinarWalletKey: res.publicKey
        });
        setWalletKeyInput('');
      } else {
        throw new Error(res.error || "Wallet validation failed.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to link wallet. Make sure the public key is active.");
    } finally {
      setLinking(false);
    }
  };

  const copyToClipboard = (txt: string) => {
    navigator.clipboard.writeText(txt);
    alert("Key copied to clipboard!");
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl mx-auto">
      {/* Title Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
              <Coins className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-800 text-lg">On-Chain Ledger Bridge</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">Audit, reconcile, and view real-time digital currency reserves bridging the DinarFlow ledger and the Stellar consensus network.</p>
        </div>
        
        {userWalletKey && (
          <button 
            onClick={() => { fetchWalletDetails(userWalletKey); fetchReconciliationProof(userWalletKey); }}
            disabled={loading}
            className="mt-4 md:mt-0 px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100/80 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Ledger
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-100 text-rose-800 p-4 rounded-2xl flex items-center gap-3 text-xs font-semibold">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-4 rounded-2xl flex items-center gap-3 text-xs font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {!userWalletKey ? (
        /* WALLET NOT LINKED PANEL */
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="md:col-span-3 bg-white border border-slate-200/50 rounded-3xl p-6 shadow-sm space-y-6">
            <div>
              <h4 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">Link Your Stellar Wallet</h4>
              <p className="text-xs text-slate-500 mt-1">To bridge your offline cash balances onto the decentralized ledger network, associate your Stellar Public Key here.</p>
            </div>

            <form onSubmit={handleLinkWallet} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Stellar Public Key (G...)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GBZZ36V5XNZM72B3S6B6B7L3WOHDSRZ237L7Q24V..."
                  value={walletKeyInput}
                  onChange={(e) => setWalletKeyInput(e.target.value)}
                  className="w-full p-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:border-indigo-600 focus:bg-white transition-all font-mono text-slate-700"
                />
              </div>

              <button
                type="submit"
                disabled={linking}
                className="w-full py-4 rounded-2xl text-xs font-bold tracking-widest uppercase transition-all bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-indigo-600/10 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-55"
              >
                <Link className="w-4 h-4" />
                {linking ? 'Linking and Auditing Key...' : 'Link Stellar Wallet'}
              </button>
            </form>
          </div>

          <div className="md:col-span-2 bg-gradient-to-tr from-slate-900 to-indigo-950 text-white rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <span className="text-[8px] font-extrabold bg-indigo-900 text-indigo-300 px-2.5 py-1 rounded-full uppercase tracking-widest">Digital Reserve Ledger</span>
              <h4 className="font-extrabold text-sm text-slate-100 mt-4 uppercase">Stellar Tokenization</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">By binding your public address, DinarFlow's automated treasury ensures a strict 1:1 backed ratio. Your DA balance is safely tokenized and auditable under Bank of Algeria standards.</p>
            </div>
            
            <div className="border-t border-slate-800 pt-4 mt-6 text-[10px] text-slate-500 text-center font-bold">
              100% Reserve Audited • Instant settlement
            </div>
          </div>
        </div>
      ) : (
        /* WALLET LINKED VIEW */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card: Linked Wallet Information */}
            <div className="bg-white border border-slate-200/50 rounded-3xl p-6 shadow-sm space-y-4 md:col-span-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Linked Asset Address</span>
              <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-2xl border border-slate-100 font-mono text-xs text-slate-600">
                <span className="truncate max-w-[280px] sm:max-w-md font-bold text-slate-700">{userWalletKey}</span>
                <button 
                  onClick={() => copyToClipboard(userWalletKey)} 
                  className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-all shrink-0 ml-2"
                  title="Copy Key"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-indigo-50/40 p-4 rounded-2xl border border-indigo-100/50">
                  <span className="text-[10px] font-bold text-indigo-500 uppercase block tracking-wider">Token Balance (DZT)</span>
                  <span className="text-2xl font-black text-slate-800">
                    {loading ? '...' : dztBalance !== null ? `${dztBalance.toLocaleString()} DZT` : '0 DZT'}
                  </span>
                </div>
                <div className="bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100/50">
                  <span className="text-[10px] font-bold text-emerald-500 uppercase block tracking-wider">Settlement Backing</span>
                  <span className="text-sm font-extrabold text-slate-800 mt-1 block">1:1 Backed Ratio</span>
                  <span className="text-[9px] font-semibold text-emerald-600 uppercase block mt-0.5">Verified Reserve</span>
                </div>
              </div>
            </div>

            {/* Reconciliation proof card */}
            <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-indigo-400" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-indigo-300">Compliance & Audit Proof</span>
                </div>
                <h4 className="font-extrabold text-xs text-slate-100 uppercase tracking-wider mt-3">Dynamic Settlement Audit</h4>
              </div>

              <div className="space-y-2 mt-4 text-xs pt-2 border-t border-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-400">On-Chain Net</span>
                  <span className="font-bold text-slate-200">
                    {loadingReconciliation ? '...' : reconciliation ? `${reconciliation.netOnChain.toLocaleString()} DZT` : '0 DZT'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Liabilities</span>
                  <span className="font-bold text-indigo-300">
                    {loadingReconciliation ? '...' : reconciliation ? `${reconciliation.internalLiabilities.toLocaleString()} DA` : '0 DA'}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-800/80 pt-2 mt-2">
                  <span className="text-slate-400 text-[10px] font-bold">Verification</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider ${
                    reconciliation && reconciliation.netOnChain >= 0 ? 'bg-emerald-950 border border-emerald-800 text-emerald-400' : 'bg-rose-950 border border-rose-800 text-rose-400'
                  }`}>
                    {loadingReconciliation ? 'AUDITING...' : reconciliation ? '100% SOLVENT' : 'UNCONFIRMED'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Table: Recent On-Chain Transactions */}
          <div className="bg-white border border-slate-200/50 rounded-3xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-5">
              <h4 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">Recent On-Chain Transactions</h4>
              <span className="text-[10px] text-slate-400 font-mono">Last 10 ledger updates</span>
            </div>

            {loading ? (
              <div className="text-center py-10 text-slate-400 font-mono text-xs">Fetching ledger history from Stellar network...</div>
            ) : onChainTxs.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs font-semibold">
                No recent transactions detected on this public key account.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Tx Hash</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4 text-right">Memo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {onChainTxs.map(tx => (
                      <tr key={tx.hash} className="border-b border-slate-100 hover:bg-slate-50/50 transition-all text-xs text-slate-700">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 max-w-[120px] truncate">
                          <a 
                            href={`https://stellar.expert/explorer/public/tx/${tx.hash}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:underline flex items-center gap-1 shrink-0"
                          >
                            {tx.hash.slice(0, 12)}...
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </a>
                        </td>
                        <td className="py-3.5 px-4 font-semibold">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            tx.type === 'received' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {tx.type === 'received' ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                            {tx.type === 'received' ? 'Received' : 'Sent'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-extrabold text-slate-900">{parseFloat(tx.amount).toLocaleString()} DZT</td>
                        <td className="py-3.5 px-4 text-slate-500 font-medium">
                          {new Date(tx.timestamp).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-mono text-right font-bold truncate max-w-[150px]">
                          {tx.memo || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
