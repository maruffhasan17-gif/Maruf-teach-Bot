import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Users, CreditCard, Activity, LayoutDashboard, LogOut, Bot, Wallet, Settings, ArrowDownToLine, Send, Copy, CheckCircle2, XCircle , List, AlertTriangle, PlusCircle, X, RefreshCw } from 'lucide-react';
import { TonConnectUIProvider, TonConnectButton, useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';

export const API_BASE = import.meta.env.VITE_API_URL || 
  (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1'))
    ? 'http://localhost:3000' 
    : 'https://maruf-teach-bot.onrender.com');

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6 text-white">
          <div className="bg-gray-900 border border-red-500/30 p-8 rounded-3xl max-w-lg w-full text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-black">
              ⚠️
            </div>
            <h2 className="text-2xl font-black text-red-400 mb-2">Interface Error Recovered</h2>
            <p className="text-xs text-gray-400 mb-6 font-mono bg-gray-950 p-3 rounded-xl break-all">
              {this.state.error?.message || String(this.state.error)}
            </p>
            <button 
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/transactions'; }}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-black text-sm tracking-wide shadow-lg transition-all cursor-pointer"
            >
              Reload Orders & Transactions
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function Sidebar({ onOpenCreateTrx }) {
  const location = useLocation();
  const navItems = [
    { path: '/', name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/bot-wallet', name: 'Bot Wallet & Stats', icon: <Wallet size={20} /> },
    { path: '/bot-settings', name: 'Bot Settings', icon: <Bot size={20} /> },
    { path: '/users', name: 'Users List', icon: <Users size={20} /> },
    { path: '/withdraw', name: 'Fiat Withdrawals', icon: <ArrowDownToLine size={20} className="text-emerald-400" /> },
    { path: '/fraud', name: 'Fraud Logs', icon: <AlertTriangle size={20} className="text-red-400" /> },
    { path: '/transactions', name: 'Orders & Trx', icon: <List size={20} /> },
  ];

  return (
    <div className="w-64 bg-gray-900 border-r border-gray-800 h-screen fixed flex flex-col shadow-2xl overflow-y-auto z-30">
      <div className="p-6 border-b border-gray-800 flex items-center gap-3">
        <img src="/logo.png" alt="Maruf Teach Logo" className="w-10 h-10 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.5)] object-cover" />
        <div>
          <h1 className="font-black text-white leading-tight text-lg">Admin Panel</h1>
          <p className="text-xs text-blue-400 font-bold tracking-widest">PRO</p>
        </div>
      </div>
      
      <div className="p-4 border-b border-gray-800 flex justify-center">
        <TonConnectButton />
      </div>

      {/* PROMINENT CREATE TRXID MENU BUTTON WITH CREATE ICON */}
      <div className="px-4 pt-4">
        <button
          onClick={onOpenCreateTrx}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl font-black bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/30 transition-all active:scale-95 border border-purple-400/30 cursor-pointer"
        >
          <PlusCircle size={20} />
          <span>Create TrxID</span>
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
              location.pathname === item.path 
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            {item.icon}
            {item.name}
          </Link>
        ))}

        {/* Extra Nav Item For Create Trx */}
        <button
          onClick={onOpenCreateTrx}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-purple-400 hover:bg-purple-600/20 hover:text-purple-300 transition-all text-left cursor-pointer"
        >
          <PlusCircle size={20} />
          <span>Create TrxID</span>
        </button>
      </nav>
      <div className="p-4 border-t border-gray-800">
        <button className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 w-full transition-all border border-transparent hover:border-red-500/20">
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </div>
  );
}

function Layout({ children }) {
  const [isCreateTrxOpen, setIsCreateTrxOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-950 flex relative">
      <Sidebar onOpenCreateTrx={() => setIsCreateTrxOpen(true)} />
      <div className="flex-1 ml-64 p-8 overflow-y-auto">
        {/* Top bar with quick create button */}
        <div className="flex justify-between items-center mb-6 bg-gray-900/60 px-6 py-3.5 rounded-2xl border border-gray-800/80 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Live Admin Panel</span>
          </div>
          <button
            onClick={() => setIsCreateTrxOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-lg shadow-purple-500/25 transition-all active:scale-95 cursor-pointer"
          >
            <PlusCircle size={16} />
            <span>Create TrxID</span>
          </button>
        </div>

        {children}
      </div>

      {/* POPUP MODAL */}
      <CreateTrxModal isOpen={isCreateTrxOpen} onClose={() => setIsCreateTrxOpen(false)} />
    </div>
  );
}

function CreateTrxModal({ isOpen, onClose }) {
  const [trxId, setTrxId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bKash');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  if (!isOpen) return null;

  const handleGenerateRandom = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let res = '';
    for (let i = 0; i < 8; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setTrxId(res);
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!trxId || !amount) {
      alert('Please enter both 8-digit TrxID and Amount!');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/create-mock-trx`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trxId: trxId.trim().toUpperCase(),
          amount: parseFloat(amount),
          method: method
        })
      });
      const data = await res.json();
      if (data.success) {
        setResult(data);
      } else {
        alert(data.error || 'Failed to save to database');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-purple-500/30 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative text-white animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
              <PlusCircle size={22} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">Create Test TrxID</h3>
              <p className="text-xs text-gray-400">Creates SMS & saves directly to Firestore database</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSend} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">
              8-Digit TrxID
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={trxId}
                onChange={(e) => setTrxId(e.target.value.toUpperCase())}
                placeholder="e.g. 9B7X2K4L"
                className="bg-gray-950 border border-gray-700 focus:border-purple-500 text-white px-4 py-3 rounded-xl flex-1 font-mono text-lg font-bold uppercase tracking-widest outline-none transition-all"
                required
              />
              <button
                type="button"
                onClick={handleGenerateRandom}
                className="bg-gray-800 hover:bg-gray-700 text-purple-300 px-3 py-2 rounded-xl text-xs font-bold border border-gray-700 transition-colors whitespace-nowrap cursor-pointer"
              >
                🎲 Random 8
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">
              Amount (BDT)
            </label>
            <input
              type="number"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 500"
              className="bg-gray-950 border border-gray-700 focus:border-purple-500 text-white px-4 py-3 rounded-xl w-full font-mono text-lg font-bold outline-none transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">
              Payment Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMethod('bKash')}
                className={`py-2.5 px-4 rounded-xl font-bold text-sm border transition-all cursor-pointer ${
                  method === 'bKash'
                    ? 'bg-pink-600/20 border-pink-500 text-pink-300 shadow-[0_0_15px_rgba(236,72,153,0.2)]'
                    : 'bg-gray-950 border-gray-800 text-gray-400 hover:border-gray-700'
                }`}
              >
                bKash (TrxID)
              </button>
              <button
                type="button"
                onClick={() => setMethod('nagad')}
                className={`py-2.5 px-4 rounded-xl font-bold text-sm border transition-all cursor-pointer ${
                  method === 'nagad'
                    ? 'bg-orange-600/20 border-orange-500 text-orange-300 shadow-[0_0_15px_rgba(249,115,22,0.2)]'
                    : 'bg-gray-950 border-gray-800 text-gray-400 hover:border-gray-700'
                }`}
              >
                Nagad (TxnID)
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-black py-3.5 rounded-xl shadow-lg shadow-purple-500/25 transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span>Saving to Database...</span>
              ) : (
                <>
                  <Send size={18} />
                  <span>Send & Save to Database</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Success Result Box */}
        {result && (
          <div className="mt-5 p-4 bg-purple-950/60 border border-purple-500/40 rounded-2xl text-sm animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 size={16} /> Saved Successfully to Database!
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(result.trxId);
                  alert('Copied TrxID: ' + result.trxId);
                }}
                className="bg-purple-600 hover:bg-purple-500 text-white text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Copy size={12} /> Copy TrxID
              </button>
            </div>
            <p className="text-xs text-gray-300 font-mono bg-gray-950/80 p-2.5 rounded-xl border border-gray-800 break-all">
              {result.fakeSms}
            </p>
          </div>
        )}

      </div>
    </div>
  );
}

// Global data fetching hook
function useBotData() {
    const [data, setData] = useState({ 
        users: [], 
        tonBalance: "0.00", 
        tonNativeBalance: "0.00",
        tonUsdtBalance: "0.00",
        gramBalance: "0.00",
        evmBalance: "0.00", 
        evmAddress: "Loading...", 
        tonAddress: "Loading..." 
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = () => {
            fetch(`${API_BASE}/api/stats?_t=${Date.now()}`)
                .then(res => res.json())
                .then(json => {
                    setData(json);
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Error fetching stats:", err);
                    setLoading(false);
                });
        };
        fetchData();
        const interval = setInterval(fetchData, 5000); // refresh every 5 seconds
        return () => clearInterval(interval);
    }, []);

    return { data, loading };
}


function BotWallet() {
  const { data, loading } = useBotData();
  const userTonAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();
  
  const [withdrawModal, setWithdrawModal] = useState({ isOpen: false, network: '' });
  const [withdrawAsset, setWithdrawAsset] = useState('USDT');
  const [depositModal, setDepositModal] = useState({ isOpen: false, network: '' });
  const [statusModal, setStatusModal] = useState({ isOpen: false, type: 'success', title: '', message: '' });
  const [amount, setAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  const showStatus = (type, title, message) => {
      setStatusModal({ isOpen: true, type, title, message });
      if (type === 'success') {
          setTimeout(() => setStatusModal(prev => ({ ...prev, isOpen: false })), 3000);
      }
  };

  const copyToClipboard = (text) => {
      navigator.clipboard.writeText(text);
      showStatus('success', 'Copied!', 'Address copied to clipboard.');
  };

  const handleDepositClick = (network) => {
      if (network === 'TON' && !userTonAddress) {
          showStatus('error', 'Wallet Not Connected', 'Please connect your Telegram Wallet first (button on sidebar)!');
          return;
      }
      setAmount('');
      setDepositModal({ isOpen: true, network });
  };

  const executeDepositTON = async () => {
      if (!amount || isNaN(amount)) return;
      const amt = amount;
      setDepositModal({ isOpen: false, network: '' });
      setAmount('');
      
      try {
          const transaction = {
              validUntil: Math.floor(Date.now() / 1000) + 360,
              messages: [
                  {
                      address: data.tonAddress,
                      amount: (parseFloat(amt) * 1e9).toString()
                  }
              ]
          };
          await tonConnectUI.sendTransaction(transaction);
          showStatus('success', 'Deposit Successful', 'Your balance will update shortly.');
      } catch (err) {
          console.error(err);
          showStatus('error', 'Deposit Failed', 'Transaction was cancelled or failed.');
      }
  };
  
  if (loading) {
    return (
      <div className="text-white w-full h-full flex flex-col justify-center items-center py-20">
        <div className="relative w-24 h-24 flex items-center justify-center">
            <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full animate-ping"></div>
            <div className="absolute inset-2 border-4 border-t-blue-500 border-r-emerald-500 border-b-purple-500 border-l-transparent rounded-full animate-spin"></div>
            <div className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">MT</div>
        </div>
        <h3 className="mt-8 text-2xl font-bold text-gray-300 animate-pulse tracking-widest uppercase">Syncing Blockchain...</h3>
      </div>
    );
  }

  const totalUsers = data.users.length;
  const verifiedUsers = data.users.filter(u => u.status === 'verified').length;

  const handleWithdrawClick = (network, asset = 'USDT') => {
      if (network === 'TON' && !userTonAddress) {
          showStatus('error', 'Wallet Not Connected', 'Please connect your Telegram Wallet first (button on sidebar)!');
          return;
      }
      setAmount('');
      setWithdrawAsset(asset);
      setWithdrawModal({ isOpen: true, network });
  };

  const executeWithdraw = async () => {
      if (!amount) return;
      setWithdrawing(true);
      try {
          const res = await fetch(`${API_BASE}/api/withdraw`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  network: withdrawModal.network,
                  asset: withdrawModal.network === 'TON' ? withdrawAsset : 'USDT',
                  amount: parseFloat(amount),
                  destination: withdrawModal.network === 'TON' ? userTonAddress : 'EVM_ADDRESS'
              })
          });
          const json = await res.json();
          if (json.success) {
              setWithdrawModal({ isOpen: false, network: '' });
              showStatus('success', 'Withdrawal Initiated', json.message);
          } else {
              showStatus('error', 'Withdrawal Failed', json.error);
          }
      } catch (err) {
          showStatus('error', 'Network Error', 'Could not process withdrawal. Try again.');
      }
      setWithdrawing(false);
  };

  return (
    <div className="text-white relative">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-5xl font-black mb-2 text-white">
            Live <span className="text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">Crypto</span> Dashboard
          </h2>
          <p className="text-gray-400 font-medium">Track your wallet balance and bot performance in real-time</p>
        </div>
        <div className="px-4 py-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-bold text-sm flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div> System Online
        </div>
      </div>
      
      {withdrawModal.isOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-md animate-in fade-in duration-300">
              <div className="bg-[#0b1426]/90 p-8 rounded-3xl border border-cyan-500/30 max-w-md w-full shadow-[0_0_80px_rgba(34,211,238,0.2)] animate-in zoom-in-95 duration-300 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
                  
                  <h3 className="text-3xl font-black mb-6 text-white flex items-center gap-3">
                    <span className="text-cyan-400">Withdraw</span> {withdrawModal.network} {withdrawModal.network === 'TON' ? `(${withdrawAsset})` : ''}
                  </h3>

                  {withdrawModal.network === 'TON' && (
                    <div className="flex gap-2 mb-5 bg-black/40 p-1.5 rounded-2xl border border-cyan-900/40">
                      <button
                        type="button"
                        onClick={() => { setWithdrawAsset('USDT'); setAmount(''); }}
                        className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all ${
                          withdrawAsset === 'USDT'
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        USDT ({data.tonUsdtBalance || '0.00'})
                      </button>
                      <button
                        type="button"
                        onClick={() => { setWithdrawAsset('TON'); setAmount(''); }}
                        className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all ${
                          withdrawAsset === 'TON'
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        TON Gas ({data.tonNativeBalance || data.tonBalance || '0.00'})
                      </button>
                    </div>
                  )}
                  
                  <div className="mb-5 space-y-2">
                      <label className="text-cyan-200/70 font-bold uppercase tracking-widest text-xs">Amount to withdraw</label>
                      <div className="relative flex items-center">
                        <input type="text" inputMode="decimal" value={amount} onChange={e => { const v = e.target.value; if(v === '' || /^[0-9]*\.?[0-9]*$/.test(v)) setAmount(v); }} className="w-full bg-black/50 border border-cyan-900/50 p-4 pl-6 pr-24 rounded-2xl text-2xl font-black text-white outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-mono tracking-wider" placeholder="0.00" />
                        <div className="absolute right-4 flex items-center gap-2">
                          <button onClick={() => {
                            if (withdrawModal.network === 'TON') {
                              setAmount(withdrawAsset === 'USDT' ? (data.tonUsdtBalance || '0') : (data.tonNativeBalance || data.tonBalance || '0'));
                            } else {
                              setAmount(data.evmBalance || '0');
                            }
                          }} className="px-2 py-1 bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/40 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors">
                            MAX
                          </button>
                          <span className="text-cyan-500 font-bold">{withdrawModal.network === 'TON' ? withdrawAsset : 'USDT'}</span>
                        </div>
                      </div>
                  </div>
                  
                  <div className="mb-8 space-y-2">
                      <label className="text-cyan-200/70 font-bold uppercase tracking-widest text-xs">Destination Address</label>
                      <div className="bg-black/40 p-4 rounded-2xl text-xs font-mono text-cyan-300 break-all border border-cyan-900/30 shadow-inner">
                          {withdrawModal.network === 'TON' ? userTonAddress : 'EVM NOT CONFIGURED YET'}
                      </div>
                  </div>
                  
                  <div className="flex gap-4">
                      <button onClick={() => setWithdrawModal({ isOpen: false, network: '' })} className="flex-1 bg-gray-800/80 hover:bg-gray-700 py-4 rounded-2xl font-bold transition-all text-gray-300">Cancel</button>
                      <button onClick={executeWithdraw} disabled={withdrawing} className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 py-4 rounded-2xl font-bold transition-all shadow-[0_0_30px_rgba(34,211,238,0.4)] text-white hover:scale-[1.02] active:scale-[0.98]">{withdrawing ? 'Processing...' : 'Confirm'}</button>
                  </div>
              </div>
          </div>
      )}

      {depositModal.isOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-md animate-in fade-in duration-300">
              <div className="bg-[#051f15]/90 p-8 rounded-3xl border border-emerald-500/30 max-w-md w-full shadow-[0_0_80px_rgba(16,185,129,0.2)] animate-in zoom-in-95 duration-300 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50"></div>
                  
                  <h3 className="text-3xl font-black mb-6 text-white flex items-center gap-3">
                    <span className="text-emerald-400">Deposit</span> {depositModal.network}
                  </h3>
                  
                  <div className="mb-5 space-y-2">
                      <label className="text-emerald-200/70 font-bold uppercase tracking-widest text-xs">Amount to deposit</label>
                      <div className="relative">
                        <input type="text" inputMode="decimal" value={amount} onChange={e => { const v = e.target.value; if(v === '' || /^[0-9]*\.?[0-9]*$/.test(v)) setAmount(v); }} className="w-full bg-black/50 border border-emerald-900/50 p-4 pl-6 rounded-2xl text-2xl font-black text-white outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all font-mono tracking-wider" placeholder="0.00" />
                        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-emerald-500 font-bold">{depositModal.network}</span>
                      </div>
                  </div>
                  
                  <div className="mb-8 space-y-2">
                      <label className="text-emerald-200/70 font-bold uppercase tracking-widest text-xs">Source Wallet</label>
                      <div className="bg-black/40 p-4 rounded-2xl text-xs font-mono text-emerald-300 break-all border border-emerald-900/30 shadow-inner flex items-center gap-3">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                          {depositModal.network === 'TON' ? userTonAddress : 'EVM NOT CONFIGURED YET'}
                      </div>
                  </div>
                  
                  <div className="flex gap-4">
                      <button onClick={() => setDepositModal({ isOpen: false, network: '' })} className="flex-1 bg-gray-800/80 hover:bg-gray-700 py-4 rounded-2xl font-bold transition-all text-gray-300">Cancel</button>
                      <button onClick={executeDepositTON} className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 py-4 rounded-2xl font-bold transition-all shadow-[0_0_30px_rgba(16,185,129,0.4)] text-white hover:scale-[1.02] active:scale-[0.98]">Pay via Wallet</button>
                  </div>
              </div>
          </div>
      )}

      {statusModal.isOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200] backdrop-blur-md animate-in fade-in duration-300">
              <div className={`p-8 rounded-[2rem] border max-w-sm w-full text-center relative overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 ${statusModal.type === 'success' ? 'bg-[#042415]/90 border-emerald-500/30 shadow-[0_0_80px_rgba(16,185,129,0.3)]' : 'bg-[#2a0808]/90 border-red-500/30 shadow-[0_0_80px_rgba(239,68,68,0.3)]'}`}>
                  
                  <div className="flex justify-center mb-6 relative">
                      <div className={`absolute inset-0 blur-2xl rounded-full ${statusModal.type === 'success' ? 'bg-emerald-500/40' : 'bg-red-500/40'}`}></div>
                      {statusModal.type === 'success' ? (
                          <CheckCircle2 size={80} className="text-emerald-400 relative z-10 animate-[bounce_1s_ease-in-out_infinite]" />
                      ) : (
                          <XCircle size={80} className="text-red-400 relative z-10 animate-pulse" />
                      )}
                  </div>
                  
                  <h3 className={`text-2xl font-black mb-3 ${statusModal.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {statusModal.title}
                  </h3>
                  
                  <p className="text-gray-300 font-medium text-sm leading-relaxed mb-8">
                      {statusModal.message}
                  </p>
                  
                  <button onClick={() => setStatusModal({ ...statusModal, isOpen: false })} className={`w-full py-4 rounded-2xl font-bold transition-all text-white hover:scale-[1.02] active:scale-[0.98] ${statusModal.type === 'success' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-[0_10px_30px_rgba(16,185,129,0.4)]' : 'bg-gradient-to-r from-red-500 to-rose-600 shadow-[0_10px_30px_rgba(239,68,68,0.4)]'}`}>
                      {statusModal.type === 'success' ? 'Awesome!' : 'Try Again'}
                  </button>
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        
        {/* USDT Wallet Card (Left Card) */}
        <div className="relative group bg-[#06181f] p-8 rounded-[2rem] border border-teal-900/50 shadow-[0_20px_50px_rgba(20,184,166,0.1)] overflow-hidden transition-all hover:border-teal-500/50 hover:shadow-[0_20px_50px_rgba(20,184,166,0.2)]">
          {/* Background Glow */}
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-teal-600/20 blur-[80px] rounded-full pointer-events-none group-hover:bg-teal-500/30 transition-all duration-700"></div>
          {/* 3D Coin Image */}
          <img src="https://cryptologos.cc/logos/tether-usdt-logo.png" className="absolute -right-6 top-12 w-40 opacity-80 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-700 pointer-events-none drop-shadow-[0_0_30px_rgba(20,184,166,0.6)]" alt="USDT" />
          
          <div className="relative z-10">
            <div className="text-teal-300/80 font-bold tracking-[0.2em] text-xs uppercase mb-6 flex items-center gap-3">
              <div className="p-2.5 bg-teal-500/10 rounded-xl border border-teal-500/20">
                <Wallet size={18} className="text-teal-400" />
              </div>
              Secret USDT Wallet
            </div>
            
            <div className="flex flex-col mb-6">
              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-black text-white tracking-tight drop-shadow-lg">{data.tonUsdtBalance || '0.00'}</span>
                <span className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-emerald-400">USDT</span>
              </div>
              <div className="mt-2.5 text-xs text-teal-300/80 font-bold">
                TON Jetton Network
              </div>
            </div>
            
            <div className="flex items-center gap-3 mb-8 w-max">
              <div className="text-teal-200/70 font-mono text-xs bg-[#09252a] py-2.5 px-4 rounded-xl border border-teal-900/50 truncate max-w-[200px]">
                {data.tonAddress}
              </div>
              <button onClick={() => copyToClipboard(data.tonAddress)} className="p-2.5 bg-teal-500/10 text-teal-400 rounded-xl hover:bg-teal-500/20 hover:text-white transition-all border border-teal-500/20 active:scale-90">
                <Copy size={16} />
              </button>
            </div>
            
            <button onClick={() => handleWithdrawClick('TON', 'USDT')} className="w-full relative overflow-hidden group/btn flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold py-4 rounded-2xl shadow-[0_10px_30px_rgba(20,184,166,0.3)] transition-all hover:shadow-[0_10px_40px_rgba(20,184,166,0.5)] hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full duration-1000 transition-transform"></div>
              <Send size={18} className="group-hover/btn:-translate-y-1 group-hover/btn:translate-x-1 transition-transform" /> WITHDRAW USDT TO MAIN WALLET
            </button>
          </div>
        </div>

        {/* GRAM Wallet Card (Right Card) */}
        <div className="relative group bg-[#041a13] p-8 rounded-[2rem] border border-emerald-900/50 shadow-[0_20px_50px_rgba(16,185,129,0.1)] overflow-hidden transition-all hover:border-emerald-500/50 hover:shadow-[0_20px_50px_rgba(16,185,129,0.2)]">
          {/* Background Glow */}
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-600/20 blur-[80px] rounded-full pointer-events-none group-hover:bg-emerald-500/30 transition-all duration-700"></div>
          {/* 3D Coin Image */}
          <img src="https://cryptologos.cc/logos/toncoin-ton-logo.png" className="absolute -right-6 top-12 w-40 opacity-90 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-700 pointer-events-none drop-shadow-[0_0_30px_rgba(16,185,129,0.6)]" alt="TON" />
          
          <div className="relative z-10">
            <div className="text-emerald-300/80 font-bold tracking-[0.2em] text-xs uppercase mb-6 flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                <Wallet size={18} className="text-emerald-400" />
              </div>
              Secret GRAM Wallet
            </div>
            
            <div className="flex flex-col mb-6">
              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-black text-white tracking-tight drop-shadow-lg">{data.gramBalance || '0.00'}</span>
                <span className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400">GRAM</span>
              </div>
              <div className="mt-2.5">
                <span className="px-3 py-1 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-bold inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  TON Gas: {data.tonNativeBalance || data.tonBalance || '0.00'} TON
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 mb-8 w-max">
              <div className="text-emerald-200/70 font-mono text-xs bg-[#07241b] py-2.5 px-4 rounded-xl border border-emerald-900/50 truncate max-w-[200px]">
                {data.tonAddress}
              </div>
              <button onClick={() => copyToClipboard(data.tonAddress)} className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl hover:bg-emerald-500/20 hover:text-white transition-all border border-emerald-500/20 active:scale-90">
                <Copy size={16} />
              </button>
            </div>
            
            <div className="flex gap-4">
              <button onClick={() => handleDepositClick('TON')} className="flex-1 relative overflow-hidden group/btn flex items-center justify-center gap-2 bg-gray-800 text-white font-bold py-4 rounded-2xl shadow-lg border border-gray-700 transition-all hover:bg-gray-700 hover:border-gray-600 hover:-translate-y-1">
                <ArrowDownToLine size={18} className="text-emerald-400 group-hover/btn:translate-y-1 transition-transform" /> DEPOSIT
              </button>
              <button onClick={() => handleWithdrawClick('TON', 'TON')} className="flex-[1.5] relative overflow-hidden group/btn flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold py-4 rounded-2xl shadow-[0_10px_30px_rgba(16,185,129,0.3)] transition-all hover:shadow-[0_10px_40px_rgba(16,185,129,0.5)] hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full duration-1000 transition-transform"></div>
                <Send size={18} className="group-hover/btn:-translate-y-1 group-hover/btn:translate-x-1 transition-transform" /> WITHDRAW
              </button>
            </div>
          </div>
        </div>

      </div>
      
      <div className="flex justify-between items-end mb-6 mt-12">
        <h3 className="text-2xl font-bold flex items-center gap-3 text-white">
          <Activity className="text-blue-500" /> Real-Time Bot Analytics
        </h3>
        <div className="px-3 py-1 rounded-full border border-gray-700 bg-gray-800 text-gray-400 font-bold text-xs flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div> Live Data
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="relative bg-[#0b132b] p-6 rounded-2xl border border-blue-900/50 shadow-lg overflow-hidden group hover:border-blue-500/50 transition-colors">
          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-blue-600/10 to-transparent"></div>
          <div className="relative z-10 flex items-start gap-4">
            <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400"><Users size={24} /></div>
            <div>
              <div className="text-gray-400 font-bold mb-1 uppercase tracking-wider text-xs">Total Users Started</div>
              <div className="text-4xl font-black text-white">{totalUsers}</div>
              <div className="text-xs text-emerald-400 font-bold mt-2">â†‘ 100% vs. last 24h</div>
            </div>
          </div>
        </div>

        <div className="relative bg-[#06241b] p-6 rounded-2xl border border-emerald-900/50 shadow-lg overflow-hidden group hover:border-emerald-500/50 transition-colors">
          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-emerald-600/10 to-transparent"></div>
          <div className="relative z-10 flex items-start gap-4">
            <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400"><Activity size={24} /></div>
            <div>
              <div className="text-emerald-200 font-bold mb-1 uppercase tracking-wider text-xs">Verified Members</div>
              <div className="text-4xl font-black text-white">{verifiedUsers}</div>
              <div className="text-xs text-emerald-400 font-bold mt-2">â†‘ 100% vs. last 24h</div>
            </div>
          </div>
        </div>

        <div className="relative bg-[#2b0b13] p-6 rounded-2xl border border-red-900/50 shadow-lg overflow-hidden group hover:border-red-500/50 transition-colors">
          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-red-600/10 to-transparent"></div>
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 opacity-20"><div className="w-24 h-24 border border-red-500 rounded-full animate-ping"></div></div>
          <div className="relative z-10 flex items-start gap-4">
            <div className="p-3 bg-red-500/20 rounded-xl text-red-400"><Bot size={24} /></div>
            <div>
              <div className="text-red-300 font-bold mb-1 uppercase tracking-wider text-xs">AI Fraud Protection</div>
              <div className="text-2xl font-black text-red-500 mt-1">ACTIVE & SCANNING</div>
              <div className="text-xs text-gray-400 font-medium mt-2">Monitoring for suspicious activity</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BotSettings() {
  const [settings, setSettings] = useState({ gramAmount: '', usdtAmount: '', freeLink: '', adminBkash: '01752561935', adminNagad: '01878580320' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusModal, setStatusModal] = useState({ isOpen: false, type: 'success', title: '', message: '' });

  useEffect(() => {
      fetch(`${API_BASE}/api/settings`)
          .then(res => res.json())
          .then(data => { setSettings(data); setLoading(false); })
          .catch(() => setLoading(false));
  }, []);

  const showStatus = (type, title, message) => {
      setStatusModal({ isOpen: true, type, title, message });
      if (type === 'success') {
          setTimeout(() => setStatusModal(prev => ({ ...prev, isOpen: false })), 3000);
      }
  };

  const handleDeploy = async () => {
      setSaving(true);
      try {
          const res = await fetch(`${API_BASE}/api/settings`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(settings)
          });
          const json = await res.json();
          if (json.success) showStatus('success', 'Deployed!', 'Settings instantly pushed to Bot.');
          else showStatus('error', 'Deploy Failed', json.error || 'Unknown error');
      } catch (e) {
          showStatus('error', 'Deploy Failed', 'Network connection error.');
      }
      setSaving(false);
  };

  return (
    <div className="text-white">
      {statusModal.isOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200] backdrop-blur-md animate-in fade-in duration-300">
              <div className={`p-8 rounded-[2rem] border max-w-sm w-full text-center relative overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 ${statusModal.type === 'success' ? 'bg-[#042415]/90 border-emerald-500/30 shadow-[0_0_80px_rgba(16,185,129,0.3)]' : 'bg-[#2a0808]/90 border-red-500/30 shadow-[0_0_80px_rgba(239,68,68,0.3)]'}`}>
                  <div className="flex justify-center mb-6 relative">
                      <div className={`absolute inset-0 blur-2xl rounded-full ${statusModal.type === 'success' ? 'bg-emerald-500/40' : 'bg-red-500/40'}`}></div>
                      {statusModal.type === 'success' ? (
                          <CheckCircle2 size={80} className="text-emerald-400 relative z-10 animate-[bounce_1s_ease-in-out_infinite]" />
                      ) : (
                          <XCircle size={80} className="text-red-400 relative z-10 animate-pulse" />
                      )}
                  </div>
                  <h3 className={`text-2xl font-black mb-3 ${statusModal.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>{statusModal.title}</h3>
                  <p className="text-gray-300 font-medium text-sm leading-relaxed mb-8">{statusModal.message}</p>
                  <button onClick={() => setStatusModal({ ...statusModal, isOpen: false })} className={`w-full py-4 rounded-2xl font-bold transition-all text-white hover:scale-[1.02] active:scale-[0.98] ${statusModal.type === 'success' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-[0_10px_30px_rgba(16,185,129,0.4)]' : 'bg-gradient-to-r from-red-500 to-rose-600 shadow-[0_10px_30px_rgba(239,68,68,0.4)]'}`}>
                      {statusModal.type === 'success' ? 'Awesome!' : 'Try Again'}
                  </button>
              </div>
          </div>
      )}

      <h2 className="text-4xl font-black mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">Global Configuration</h2>
      <div className="bg-gray-900 p-8 rounded-3xl border border-gray-800 max-w-2xl shadow-2xl">
        <div className="space-y-6">
          <div>
            <label className="block text-gray-400 font-bold mb-2 uppercase tracking-wider text-xs">Auto GRAM Send Amount</label>
            <input type="text" value={settings.gramAmount} onChange={e => setSettings({...settings, gramAmount: e.target.value})} className="w-full bg-gray-800 border border-gray-700 text-white p-4 rounded-xl outline-none focus:border-blue-500 font-bold transition-colors" />
          </div>
          <div>
            <label className="block text-gray-400 font-bold mb-2 uppercase tracking-wider text-xs">Minimum USDT Required</label>
            <input type="text" value={settings.usdtAmount} onChange={e => setSettings({...settings, usdtAmount: e.target.value})} className="w-full bg-gray-800 border border-gray-700 text-white p-4 rounded-xl outline-none focus:border-blue-500 font-bold transition-colors" />
          </div>
          <div>
            <label className="block text-gray-400 font-bold mb-2 uppercase tracking-wider text-xs">Free Option Link</label>
            <input type="text" value="https://t.me/VictorsCompanybot/app?startapp=ref_DBF2368328" disabled className="w-full bg-gray-800 border border-gray-700 text-gray-500 p-4 rounded-xl outline-none cursor-not-allowed font-bold" />
          </div>
          
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 font-bold mb-2 uppercase tracking-wider text-xs">Admin bKash</label>
                <input type="text" value={settings.adminBkash || ''} onChange={e => setSettings({...settings, adminBkash: e.target.value})} className="w-full bg-gray-800 border border-gray-700 text-white p-4 rounded-xl outline-none focus:border-blue-500 font-bold transition-colors" />
              </div>
              <div>
                <label className="block text-gray-400 font-bold mb-2 uppercase tracking-wider text-xs">Admin Nagad</label>
                <input type="text" value={settings.adminNagad || ''} onChange={e => setSettings({...settings, adminNagad: e.target.value})} className="w-full bg-gray-800 border border-gray-700 text-white p-4 rounded-xl outline-none focus:border-blue-500 font-bold transition-colors" />
              </div>
            </div>

            <button onClick={handleDeploy} disabled={saving || loading} className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold px-6 py-4 rounded-xl shadow-[0_10px_20px_rgba(37,99,235,0.3)] hover:from-blue-500 hover:to-blue-400 transition-all transform hover:-translate-y-1">
            {saving ? 'DEPLOYING...' : <><Send size={20} /> DEPLOY SETTINGS TO BOT</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function UsersList() {
  const { data, loading } = useBotData();
  if (loading) return <div className="p-8 text-2xl font-bold text-white">Loading Real Users...</div>;

  return (
    <div className="text-white">
      <h2 className="text-4xl font-black mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">Live Users Database</h2>
      <div className="bg-gray-900 rounded-3xl shadow-2xl border border-gray-800 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-900/50 border-b border-gray-800">
            <tr>
              <th className="p-6 font-bold text-gray-400 uppercase tracking-wider text-xs">Telegram ID</th>
              <th className="p-6 font-bold text-gray-400 uppercase tracking-wider text-xs">Username</th>
              <th className="p-6 font-bold text-gray-400 uppercase tracking-wider text-xs">Language</th>
              <th className="p-6 font-bold text-gray-400 uppercase tracking-wider text-xs">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {(!data.users || data.users.length === 0) ? (
              <tr><td colSpan="4" className="p-8 text-center text-gray-500 font-bold">NO USERS FOUND. HIT /START IN THE BOT!</td></tr>
            ) : (data.users || []).map(u => (
              <tr key={u.chatId} className="hover:bg-gray-800/50 transition-colors">
                <td className="p-6 font-mono text-sm text-gray-300">{u.chatId}</td>
                <td className="p-6 font-bold text-blue-400">@{u.username}</td>
                <td className="p-6 text-gray-300">{u.language === 'bn' ? 'ðŸ‡§ðŸ‡© Bangla' : 'ðŸ‡¬ðŸ‡§ English'}</td>
                <td className="p-6">
                  <span className={`px-4 py-2 rounded-full text-xs font-bold ${u.status === 'verified' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                    {u.status ? u.status.toUpperCase() : 'UNKNOWN'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FraudList() {
  const { data, loading } = useBotData();
  if (loading) return <div className="p-8 text-2xl font-bold text-white">Loading Fraud Logs...</div>;

  const handleApprove = async (docId, chatId) => {
      const confirmApprove = window.confirm("Are you sure you want to approve this user's payment manually? They will be asked to submit their TON address.");
      if (!confirmApprove) return;
      
      try {
          const res = await fetch(`${API_BASE}/api/approve-fraud`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ docId, chatId })
          });
          const json = await res.json();
          if (json.success) {
              alert("Successfully approved! User has been notified.");
              window.location.reload();
          } else {
              alert("Error: " + json.error);
          }
      } catch (err) {
          alert("Approval request failed.");
      }
  };

  return (
    <div className="text-white">
      <h2 className="text-4xl font-black mb-8 bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-rose-600">Fraud Attempts & AI Logs</h2>
      <div className="bg-gray-900 rounded-3xl shadow-2xl border border-gray-800 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-900/50 border-b border-gray-800">
            <tr>
              <th className="p-6 font-bold text-gray-400 uppercase tracking-wider text-xs">User</th>
              <th className="p-6 font-bold text-gray-400 uppercase tracking-wider text-xs">Reason</th>
              <th className="p-6 font-bold text-gray-400 uppercase tracking-wider text-xs">Timestamp</th>
              <th className="p-6 font-bold text-gray-400 uppercase tracking-wider text-xs text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {(!data.failedScreenshots || data.failedScreenshots.length === 0) ? (
              <tr><td colSpan="4" className="p-8 text-center text-emerald-500 font-bold">NO FRAUD ATTEMPTS DETECTED YET.</td></tr>
            ) : data.failedScreenshots.map(f => (
              <tr key={f.id} className="hover:bg-gray-800/50 transition-colors">
                <td className="p-6 font-bold text-blue-400">
                    @{f.username} <br/><span className="text-xs text-gray-500 font-mono">{f.chatId}</span>
                </td>
                <td className="p-6 text-red-400 font-bold">{f.reason}</td>
                <td className="p-6 text-gray-400 text-sm">
                    {f.timestamp && f.timestamp._seconds ? new Date(f.timestamp._seconds * 1000).toLocaleString() : 'N/A'}
                </td>
                <td className="p-6 text-right flex justify-end gap-3">
                    <a href={f.imageUrl} target="_blank" rel="noreferrer" className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-all text-xs font-bold">
                        View Image
                    </a>
                    <button onClick={() => handleApprove(f.id, f.chatId)} className="px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 transition-all text-xs font-bold">
                        Approve
                    </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Dashboard() {
  return (
    <div className="text-white">
      <h2 className="text-4xl font-black mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">System Overview</h2>
      <div className="bg-gray-900 p-8 rounded-3xl shadow-2xl border border-gray-800 max-w-3xl">
        <p className="text-xl text-gray-400 font-medium leading-relaxed">
          Welcome to the new <strong className="text-white">Maruf Teach Pro Dashboard</strong>.<br/><br/>
          Navigate to the <span className="text-blue-400 font-bold">Bot Wallet</span> tab to view live blockchain balances and copy your secret bot addresses.<br/><br/>
          Go to the <span className="text-emerald-400 font-bold">Users List</span> to see real-time updates from Firebase.<br/><br/>
          Check <span className="text-red-400 font-bold">Fraud Logs</span> to view failed AI verifications and blocked screenshots.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <TonConnectUIProvider manifestUrl={`${API_BASE}/tonconnect-manifest.json`}>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/admin" element={<Dashboard />} />
              <Route path="/bot-wallet" element={<BotWallet />} />
              <Route path="/bot-settings" element={<BotSettings />} />
              <Route path="/users" element={<UsersList />} />
              <Route path="/fraud" element={<FraudList />} />
              <Route path="/transactions" element={<OrdersList initialTab="buy" />} />
              <Route path="/withdraw" element={<OrdersList initialTab="withdraw" />} />
              <Route path="/withdrawals" element={<OrdersList initialTab="withdraw" />} />
              <Route path="*" element={<Dashboard />} />
            </Routes>
          </Layout>
        </Router>
      </TonConnectUIProvider>
    </ErrorBoundary>
  );
}



function OrdersList({ initialTab = 'buy' }) {
  const [buys, setBuys] = React.useState([]);
  const [sells, setSells] = React.useState([]);
  const [withdraws, setWithdraws] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [tab, setTab] = React.useState(initialTab);
  
  const [bonusUser, setBonusUser] = React.useState('');
  const [bonusAmt, setBonusAmt] = React.useState('');
  const [dailyLimit, setDailyLimit] = React.useState('');

  const [mockId, setMockId] = React.useState('');
  const [mockAmount, setMockAmount] = React.useState('');
  const [mockMethod, setMockMethod] = React.useState('bKash');
  const [mockResult, setMockResult] = React.useState(null);
  const [mockLoading, setMockLoading] = React.useState(false);
  const [mockList, setMockList] = React.useState([]);

  React.useEffect(() => {
    if (initialTab) {
      setTab(initialTab);
    }
  }, [initialTab]);

  React.useEffect(() => {
    fetchOrders();
    fetchMockList();
  }, []);

  const fetchMockList = () => {
    fetch(`${API_BASE}/api/admin/mock-trxs`)
      .then(r => r.json())
      .then(d => { if (d.success) setMockList(d.list || []); })
      .catch(e => console.error(e));
  };

  const generateRandomTrx = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let res = '';
    for (let i = 0; i < 8; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setMockId(res);
  };

  const handleCreateMockTrx = async () => {
    if (!mockId || !mockAmount) return alert("Please enter both 8-digit TrxID and Amount!");
    setMockLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/create-mock-trx`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trxId: mockId, amount: mockAmount, method: mockMethod })
      });
      const data = await res.json();
      if (data.success) {
        setMockResult(data);
        fetchMockList();
        fetchOrders();
      } else {
        alert(data.error || 'Failed to create mock transaction');
      }
    } catch(e) {
      alert('Error creating mock transaction: ' + e.message);
    } finally {
      setMockLoading(false);
    }
  };

  const fetchOrders = () => {
    fetch(`${API_BASE}/api/admin/orders`)
      .then(r => r.json())
      .then(d => {
        setBuys(Array.isArray(d?.buys) ? d.buys : []);
        setSells(Array.isArray(d?.sells) ? d.sells : []);
        setWithdraws(Array.isArray(d?.withdrawals) ? d.withdrawals : []);
        setLoading(false);
      })
      .catch(e => { console.error('fetchOrders error:', e); setLoading(false); });
  };
    
  const handleApproveWithdraw = async (userId) => {
    if(!window.confirm("Approve this Withdrawal and notify user?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/approve-withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await res.json();
      if(data.success) {
        alert("Withdrawal Approved & User Notified!");
        fetchOrders();
      } else {
        alert(data.error || "Approval failed");
      }
    } catch(e) {
      alert("Error approving withdrawal: " + e.message);
    }
  };

  const handleRejectWithdraw = async (userId, refundAmt) => {
    const reason = prompt("Enter rejection reason (optional):", "Verification failed or incorrect number");
    if (reason === null) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/reject-withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, refundAmt, reason })
      });
      const data = await res.json();
      if(data.success) {
        alert("Withdrawal rejected and " + (refundAmt ? refundAmt + " TK " : "") + "refunded to user balance!");
        fetchOrders();
      } else {
        alert(data.error || "Rejection failed");
      }
    } catch(e) {
      alert("Error rejecting withdrawal: " + e.message);
    }
  };

  const handleApprove = async (id) => {
    if(!window.confirm("Approve this Buy Order and automatically send TON on-chain to the user's wallet?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/approve-buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if(data.success) {
        alert(data.message || 'Approved & TON successfully sent on-chain!');
        fetchOrders();
      } else {
        alert(data.error || 'Approval failed');
      }
    } catch(e) {
      alert('Error approving buy order: ' + e.message);
    }
  };

  const handleRejectBuy = async (id) => {
    const reason = prompt("Enter rejection reason (optional):", "Payment verification failed");
    if (reason === null) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/reject-buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, reason })
      });
      const data = await res.json();
      if(data.success) {
        alert(data.message || 'Order rejected and Taka balance refunded to user!');
        fetchOrders();
      } else {
        alert(data.error || 'Rejection failed');
      }
    } catch(e) {
      alert('Error rejecting buy order: ' + e.message);
    }
  };

  if (loading) return <div className="p-8 text-2xl font-bold text-white">Loading Orders...</div>;

  return (
    <div className="p-8">
      <h2 className="text-3xl font-extrabold text-blue-400 mb-6">Orders & Withdrawals</h2>
      
      <div className="flex flex-wrap gap-4 mb-6">
        <button onClick={() => setTab('buy')} className={`px-6 py-2 rounded-xl font-bold transition-all ${tab === 'buy' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>Buy Orders ({buys.length})</button>
        <button onClick={() => setTab('sell')} className={`px-6 py-2 rounded-xl font-bold transition-all ${tab === 'sell' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>Sell Orders ({sells.length})</button>
        <button onClick={() => setTab('withdraw')} className={`px-6 py-2 rounded-xl font-bold transition-all ${tab === 'withdraw' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>Fiat Withdrawals ({withdraws.length})</button>
        <button onClick={() => setTab('bonus')} className={`px-6 py-2 rounded-xl font-bold transition-all ${tab === 'bonus' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>Bonus & Limits</button>
        <button onClick={() => { setTab('mock'); fetchMockList(); }} className={`px-6 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${tab === 'mock' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/30' : 'bg-gray-800 text-purple-400 hover:text-white'}`}>
          <span>⚡</span> Mock TrxID (Test Tool)
        </button>
      </div>

      <div className="bg-gray-900 rounded-2xl p-6 shadow-2xl border border-gray-800 overflow-x-auto">
        {tab === 'mock' && (
          <div className="space-y-8">
            <div className="bg-gradient-to-br from-gray-800/80 to-purple-950/30 p-6 rounded-2xl border border-purple-500/30 shadow-xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-xl">
                  ⚡
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">Mock Transaction Generator (SMS Simulator)</h3>
                  <p className="text-xs text-gray-400">Creates an instant verified TrxID in the database with auto-formatted SMS text for testing your Web App.</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">TrxID / TxnID (8 Digits or Custom)</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={mockId} 
                      onChange={e => setMockId(e.target.value.toUpperCase())} 
                      placeholder="e.g. 9B7X2K4L" 
                      className="bg-gray-950 border border-gray-700 text-white px-4 py-3 rounded-xl flex-1 font-mono uppercase tracking-widest text-lg font-bold focus:outline-none focus:border-purple-500" 
                    />
                    <button 
                      type="button"
                      onClick={generateRandomTrx}
                      className="bg-gray-800 hover:bg-gray-700 text-purple-300 px-3 py-2 rounded-xl text-xs font-bold border border-gray-700 transition-colors"
                      title="Generate Random 8-character TrxID"
                    >
                      🎲 Random
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Amount (BDT)</label>
                  <input 
                    type="number" 
                    value={mockAmount} 
                    onChange={e => setMockAmount(e.target.value)} 
                    placeholder="e.g. 500" 
                    className="bg-gray-950 border border-gray-700 text-white px-4 py-3 rounded-xl w-full font-mono text-lg font-bold focus:outline-none focus:border-purple-500" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Payment Method</label>
                  <select 
                    value={mockMethod} 
                    onChange={e => setMockMethod(e.target.value)}
                    className="bg-gray-950 border border-gray-700 text-white px-4 py-3 rounded-xl w-full font-bold focus:outline-none focus:border-purple-500"
                  >
                    <option value="bKash">bKash (TrxID)</option>
                    <option value="nagad">Nagad (TxnID)</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-4">
                <button 
                  onClick={handleCreateMockTrx}
                  disabled={mockLoading || !mockId || !mockAmount}
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50 text-white font-extrabold px-8 py-3.5 rounded-xl shadow-lg shadow-purple-500/25 transition-all active:scale-95 flex items-center gap-2"
                >
                  {mockLoading ? 'Saving...' : '🚀 Save Mock TrxID to Database'}
                </button>
                <span className="text-xs text-gray-500">
                  Auto-saves to <code className="text-purple-400">verified_trx</code> collection with server timestamp.
                </span>
              </div>

              {mockResult && (
                <div className="mt-6 p-4 bg-purple-950/50 border border-purple-500/40 rounded-xl text-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-emerald-400 flex items-center gap-2">
                      <span>✅</span> {mockResult.message}
                    </span>
                    <button 
                      onClick={() => { navigator.clipboard.writeText(mockResult.trxId); alert("Copied TrxID: " + mockResult.trxId); }}
                      className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-1 rounded-lg font-bold flex items-center gap-1 transition-colors"
                    >
                      📋 Copy TrxID ({mockResult.trxId})
                    </button>
                  </div>
                  <div className="bg-gray-950/80 p-3 rounded-lg font-mono text-xs text-gray-300 border border-gray-800 break-all">
                    <strong>Simulated SMS:</strong> {mockResult.fakeSms}
                  </div>
                  {mockResult.autoCompleted && (
                    <p className="text-xs text-emerald-300 font-bold mt-2">
                      🎉 A matching pending buy order was found and was automatically marked as COMPLETED!
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* List of Recent Mock Transactions */}
            <div className="bg-gray-800/40 p-6 rounded-2xl border border-gray-700/60">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>📋</span> Recently Generated Mock TrxIDs
                </h4>
                <button 
                  onClick={fetchMockList}
                  className="text-xs text-purple-400 hover:text-purple-300 font-bold underline"
                >
                  Refresh List
                </button>
              </div>

              {mockList.length === 0 ? (
                <p className="text-sm text-gray-500 italic py-4">No mock transactions generated yet. Use the form above to generate one.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-300">
                    <thead className="bg-gray-900/60 text-gray-400 font-bold border-b border-gray-700">
                      <tr>
                        <th className="py-3 px-3">TrxID</th>
                        <th className="py-3">Amount</th>
                        <th className="py-3">Method</th>
                        <th className="py-3">Created SMS Preview</th>
                        <th className="py-3 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {mockList.map(item => (
                        <tr key={item?.id || Math.random()} className="hover:bg-gray-800/30 transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-purple-400">{item?.id}</td>
                          <td className="py-3 font-bold text-emerald-400">৳{item?.amount || '0'}</td>
                          <td className="py-3 uppercase text-xs font-semibold text-gray-400">{item?.sender || 'bKash'}</td>
                          <td className="py-3 text-xs text-gray-400 max-w-[320px] truncate" title={item?.message}>{item?.message}</td>
                          <td className="py-3 px-3 text-right">
                            <button 
                              onClick={() => { navigator.clipboard.writeText(item?.id || ''); alert("Copied TrxID: " + item?.id); }}
                              className="bg-purple-600/30 hover:bg-purple-600 text-purple-300 hover:text-white px-3 py-1 rounded-lg text-xs font-bold transition-all"
                            >
                              Copy TrxID
                            </button>
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

        {tab === 'bonus' && (
          <div className="space-y-8">
              <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700">
                  <h3 className="text-xl font-bold text-white mb-4">Give User Bonus</h3>
                  <div className="flex gap-4">
                      <input type="text" value={bonusUser} onChange={e => setBonusUser(e.target.value)} placeholder="@username" className="bg-gray-900 border border-gray-700 text-white px-4 py-2 rounded-lg flex-1 focus:outline-none focus:border-pink-500" />
                      <input type="number" value={bonusAmt} onChange={e => setBonusAmt(e.target.value)} placeholder="Amount (BDT)" className="bg-gray-900 border border-gray-700 text-white px-4 py-2 rounded-lg w-32 focus:outline-none focus:border-pink-500" />
                      <button onClick={async () => {
                          if(!bonusUser || !bonusAmt) return alert("Fill all fields");
                          try {
                              const r = await fetch(`${API_BASE}/api/admin/bonus`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ username: bonusUser, amount: bonusAmt })
                              });
                              const d = await r.json();
                              if(d.success) { alert("Bonus sent! New Balance: " + d.newBalance); setBonusUser(''); setBonusAmt(''); }
                              else alert(d.error);
                          } catch(e) { alert("Error sending bonus"); }
                      }} className="bg-pink-500 text-white font-bold px-6 py-2 rounded-lg hover:bg-pink-600 transition-colors">Send Bonus</button>
                  </div>
              </div>
              
              <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700">
                  <h3 className="text-xl font-bold text-white mb-4">Global Settings</h3>
                  <div className="flex gap-4">
                      <input type="number" value={dailyLimit} onChange={e => setDailyLimit(e.target.value)} placeholder="Daily Fiat Withdraw Limit (e.g. 50)" className="bg-gray-900 border border-gray-700 text-white px-4 py-2 rounded-lg flex-1 focus:outline-none focus:border-blue-500" />
                      <button onClick={async () => {
                          if(!dailyLimit) return;
                          try {
                              const r = await fetch(`${API_BASE}/api/admin/limits`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ limit: dailyLimit })
                              });
                              const d = await r.json();
                              if(d.success) alert("Daily Limit Updated!");
                              else alert(d.error);
                          } catch(e) { alert("Error setting limit"); }
                      }} className="bg-blue-500 text-white font-bold px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors">Set Limit</button>
                  </div>
              </div>
          </div>
        )}

        {tab === 'withdraw' && (
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-gray-800/50 text-gray-400 font-bold border-b border-gray-800">
              <tr>
                <th className="py-3 px-4 rounded-tl-lg">User</th>
                <th className="py-3">Method</th>
                <th className="py-3">Number</th>
                <th className="py-3">Amount</th>
                <th className="py-3">Timestamp</th>
                <th className="py-3 px-4 rounded-tr-lg">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {withdraws.map(w => {
                const info = w?.fiatWithdrawPending || w || {};
                const method = info?.method || w?.method || 'N/A';
                const number = info?.number || w?.number || 'N/A';
                const amount = info?.amount || w?.amount || 0;
                const ts = info?.timestamp || w?.timestamp;
                const formattedTime = (ts && ts._seconds) 
                  ? new Date(ts._seconds * 1000).toLocaleString() 
                  : (ts ? new Date(ts).toLocaleString() : 'Recent');

                return (
                  <tr key={w?.userId || Math.random()} className="hover:bg-gray-800/30 transition-colors">
                    <td className="py-4 px-4 font-bold text-blue-400">{w?.userId || 'Unknown'}</td>
                    <td className="py-4 text-emerald-400 font-bold uppercase">{method}</td>
                    <td className="py-4 font-mono font-semibold">{number}</td>
                    <td className="py-4 font-bold text-white">{amount} TK</td>
                    <td className="py-4 text-xs text-gray-500">{formattedTime}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleApproveWithdraw(w.userId)} 
                          className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-1"
                          title="Approve withdrawal and notify user"
                        >
                          <span>✓</span> Approve
                        </button>
                        <button 
                          onClick={() => handleRejectWithdraw(w.userId, amount)} 
                          className="bg-rose-500 hover:bg-rose-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-1"
                          title="Reject withdrawal and refund balance"
                        >
                          <span>✕</span> Reject & Refund
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {withdraws.length === 0 && <tr><td colSpan="6" className="py-8 text-center text-gray-500 font-bold">No pending withdrawals.</td></tr>}
            </tbody>
          </table>
        )}

        {tab === 'buy' && (
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-gray-800/50 text-gray-400 font-bold border-b border-gray-800">
              <tr>
                <th className="py-3 px-4 rounded-tl-lg">TrxID</th>
                <th className="py-3">User</th>
                <th className="py-3">Amount</th>
                <th className="py-3">Paid (BDT)</th>
                <th className="py-3">Method</th>
                <th className="py-3">Wallet</th>
                <th className="py-3">Status</th>
                <th className="py-3 px-4 rounded-tr-lg">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {buys.map(b => (
                <tr key={b?.id || b?.trxId || Math.random()} className="hover:bg-gray-800/30 transition-colors">
                  <td className="py-4 px-4 font-mono font-bold text-cyan-400">{b?.trxId || 'N/A'}</td>
                  <td className="py-4">{b?.userId || 'N/A'}</td>
                  <td className="py-4 font-bold text-white">{b?.amount || '0'} {b?.asset || 'TON'}</td>
                  <td className="py-4 text-emerald-400 font-bold">৳{b?.totalBdt || '0'}</td>
                  <td className="py-4 capitalize font-semibold">{b?.paymentMethod || 'N/A'}</td>
                  <td className="py-4 text-xs text-gray-400 font-mono break-all max-w-[150px]">{b?.receiveAddress || 'N/A'}</td>
                  <td className="py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      b?.status === 'completed' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                      b?.status === 'verified' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      b?.status === 'rejected' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                      'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {b?.status === 'verified' ? 'AUTO-VERIFIED (READY)' :
                       b?.status === 'pending' ? 'PENDING (WAITING SMS)' :
                       b?.status === 'completed' ? 'COMPLETED (SENT)' :
                       b?.status === 'rejected' ? 'REJECTED (REFUNDED)' :
                       (b?.status || 'PENDING').toUpperCase()}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    {(b?.status === 'pending' || b?.status === 'verified') ? (
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleApprove(b.id)} 
                          className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-1"
                          title="Send TON on-chain and complete order"
                        >
                          <span>✓</span> Accept
                        </button>
                        <button 
                          onClick={() => handleRejectBuy(b.id)} 
                          className="bg-rose-500 hover:bg-rose-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-1"
                          title="Reject and refund paid BDT to user balance"
                        >
                          <span>✕</span> Reject
                        </button>
                      </div>
                    ) : b?.status === 'completed' ? (
                      <span className="text-xs text-blue-400 font-bold flex items-center gap-1">
                        <span>✓</span> Sent (On-Chain)
                      </span>
                    ) : b?.status === 'rejected' ? (
                      <span className="text-xs text-rose-400 font-bold flex items-center gap-1">
                        <span>✕</span> Refunded
                      </span>
                    ) : null}
                  </td>
                </tr>
              ))}
              {buys.length === 0 && <tr><td colSpan="8" className="py-8 text-center text-gray-500 font-bold">No buy orders yet</td></tr>}
            </tbody>
          </table>
        )}

        {tab === 'sell' && (
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-gray-800/50 text-gray-400 font-bold border-b border-gray-800">
              <tr>
                <th className="py-3 px-4 rounded-tl-lg">ID</th>
                <th className="py-3">User</th>
                <th className="py-3">Amount</th>
                <th className="py-3">Pay (BDT)</th>
                <th className="py-3">User Wallet</th>
                <th className="py-3 px-4 rounded-tr-lg">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {sells.map(s => {
                const sId = (s?.id || '').toString();
                const displayId = sId.length > 8 ? `${sId.slice(0, 8)}...` : sId || 'N/A';
                const sTs = s?.timestamp;
                const formattedTime = (sTs && sTs._seconds)
                  ? new Date(sTs._seconds * 1000).toLocaleString()
                  : (sTs ? new Date(sTs).toLocaleString() : 'Just now');

                return (
                  <tr key={s?.id || Math.random()} className="hover:bg-gray-800/30 transition-colors">
                    <td className="py-4 px-4 font-mono text-cyan-400 text-xs">{displayId}</td>
                    <td className="py-4">{s?.userId || 'N/A'}</td>
                    <td className="py-4 font-bold text-white">{s?.amount || 0} {s?.asset || 'TON'}</td>
                    <td className="py-4 text-emerald-400 font-bold">৳{s?.estimatedTk || 0}</td>
                    <td className="py-4 text-xs text-gray-400 font-mono break-all max-w-[150px]">{s?.wallet || 'N/A'}</td>
                    <td className="py-4 px-4 text-xs text-gray-500">{formattedTime}</td>
                  </tr>
                );
              })}
              {sells.length === 0 && <tr><td colSpan="6" className="py-8 text-center text-gray-500 font-bold">No sell orders yet</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

