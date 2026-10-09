import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Users, CreditCard, Activity, LayoutDashboard, LogOut, Bot, Wallet, Settings, ArrowDownToLine, Send, Copy, CheckCircle2, XCircle , List, AlertTriangle} from 'lucide-react';
import { TonConnectUIProvider, TonConnectButton, useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';

function Sidebar() {
  const location = useLocation();
  const navItems = [
    { path: '/', name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/bot-wallet', name: 'Bot Wallet & Stats', icon: <Wallet size={20} /> },
    { path: '/bot-settings', name: 'Bot Settings', icon: <Bot size={20} /> },
    { path: '/users', name: 'Users List', icon: <Users size={20} /> },
    { path: '/fraud', name: 'Fraud Logs', icon: <AlertTriangle size={20} className="text-red-400" /> },
    { path: '/transactions', name: 'Transactions', icon: <List size={20} /> },
  ];

  return (
    <div className="w-64 bg-gray-900 border-r border-gray-800 h-screen fixed flex flex-col shadow-2xl overflow-y-auto">
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
  return (
    <div className="min-h-screen bg-gray-950 flex">
      <Sidebar />
      <div className="flex-1 ml-64 p-8 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}

// Global data fetching hook
function useBotData() {
    const [data, setData] = useState({ users: [], tonBalance: "0.00", evmBalance: "0.00", evmAddress: "Loading...", tonAddress: "Loading..." });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = () => {
            fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/stats?_t=${Date.now()}`)
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

  const handleWithdrawClick = (network) => {
      if (network === 'TON' && !userTonAddress) {
          showStatus('error', 'Wallet Not Connected', 'Please connect your Telegram Wallet first (button on sidebar)!');
          return;
      }
      setWithdrawModal({ isOpen: true, network });
  };

  const executeWithdraw = async () => {
      if (!amount) return;
      setWithdrawing(true);
      try {
          const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/withdraw`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  network: withdrawModal.network,
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
                    <span className="text-cyan-400">Withdraw</span> {withdrawModal.network}
                  </h3>
                  
                  <div className="mb-5 space-y-2">
                      <label className="text-cyan-200/70 font-bold uppercase tracking-widest text-xs">Amount to withdraw</label>
                      <div className="relative flex items-center">
                        <input type="text" inputMode="decimal" value={amount} onChange={e => { const v = e.target.value; if(v === '' || /^[0-9]*\.?[0-9]*$/.test(v)) setAmount(v); }} className="w-full bg-black/50 border border-cyan-900/50 p-4 pl-6 pr-24 rounded-2xl text-2xl font-black text-white outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-mono tracking-wider" placeholder="0.00" />
                        <div className="absolute right-4 flex items-center gap-2">
                          <button onClick={() => setAmount(withdrawModal.network === 'TON' ? data.tonBalance : data.evmBalance)} className="px-2 py-1 bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/40 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors">
                            MAX
                          </button>
                          <span className="text-cyan-500 font-bold">{withdrawModal.network}</span>
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
        
        {/* BEP20 Wallet Card */}
        <div className="relative group bg-[#081021] p-8 rounded-[2rem] border border-blue-900/50 shadow-[0_20px_50px_rgba(37,99,235,0.1)] overflow-hidden transition-all hover:border-blue-500/50 hover:shadow-[0_20px_50px_rgba(37,99,235,0.2)]">
          {/* Background Glow */}
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-600/20 blur-[80px] rounded-full pointer-events-none group-hover:bg-blue-500/30 transition-all duration-700"></div>
          {/* 3D Coin Image */}
          <img src="https://cryptologos.cc/logos/bnb-bnb-logo.png" className="absolute -right-6 top-12 w-40 opacity-80 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-700 pointer-events-none drop-shadow-[0_0_30px_rgba(59,130,246,0.6)]" alt="BNB" />
          
          <div className="relative z-10">
            <div className="text-blue-300/80 font-bold tracking-[0.2em] text-xs uppercase mb-6 flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20">
                <Wallet size={18} className="text-blue-400" />
              </div>
              Secret BEP20 Wallet
            </div>
            
            <div className="flex flex-col mb-6">
              <div className="text-5xl font-black text-white tracking-tight drop-shadow-lg">{data.evmBalance}</div>
              <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400 mt-1">BNB / USDT</div>
            </div>
            
            <div className="flex items-center gap-3 mb-8 w-max">
              <div className="text-gray-400 font-mono text-xs bg-[#0b1731] py-2.5 px-4 rounded-xl border border-blue-900/50 truncate max-w-[200px]">
                {data.evmAddress}
              </div>
              <button onClick={() => copyToClipboard(data.evmAddress)} className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl hover:bg-blue-500/20 hover:text-white transition-all border border-blue-500/20 active:scale-90">
                <Copy size={16} />
              </button>
            </div>
            
            <button onClick={() => handleWithdrawClick('EVM')} className="w-full relative overflow-hidden group/btn flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 rounded-2xl shadow-[0_10px_30px_rgba(37,99,235,0.3)] transition-all hover:shadow-[0_10px_40px_rgba(37,99,235,0.5)] hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full duration-1000 transition-transform"></div>
              <Send size={18} className="group-hover/btn:-translate-y-1 group-hover/btn:translate-x-1 transition-transform" /> WITHDRAW TO MAIN WALLET
            </button>
          </div>
        </div>

        {/* TON Wallet Card */}
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
              Secret TON Wallet
            </div>
            
            <div className="flex flex-col mb-6">
              <div className="text-5xl font-black text-white tracking-tight drop-shadow-lg">{data.tonBalance}</div>
              <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400 mt-1">GRAM / TON</div>
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
              <button onClick={() => handleWithdrawClick('TON')} className="flex-[1.5] relative overflow-hidden group/btn flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold py-4 rounded-2xl shadow-[0_10px_30px_rgba(16,185,129,0.3)] transition-all hover:shadow-[0_10px_40px_rgba(16,185,129,0.5)] hover:-translate-y-1">
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
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/settings`)
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
          const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/settings`, {
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
            {data.users.length === 0 ? (
              <tr><td colSpan="4" className="p-8 text-center text-gray-500 font-bold">NO USERS FOUND. HIT /START IN THE BOT!</td></tr>
            ) : data.users.map(u => (
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
          const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/approve-fraud`, {
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
    <TonConnectUIProvider manifestUrl="https://ton-connect.github.io/demo-dapp-with-react-ui/tonconnect-manifest.json">
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/bot-wallet" element={<BotWallet />} />
            <Route path="/bot-settings" element={<BotSettings />} />
            <Route path="/users" element={<UsersList />} />
            <Route path="/fraud" element={<FraudList />} />
              <Route path="/transactions" element={<OrdersList />} />
          </Routes>
        </Layout>
      </Router>
    </TonConnectUIProvider>
  );
}



function OrdersList() {
  const [buys, setBuys] = React.useState([]);
  const [sells, setSells] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [tab, setTab] = React.useState('buy');

  React.useEffect(() => {
    fetchOrders();
  }, []);

  const [withdraws, setWithdraws] = React.useState([]);
  const [bonusUser, setBonusUser] = React.useState('');
  const [bonusAmt, setBonusAmt] = React.useState('');
  const [dailyLimit, setDailyLimit] = React.useState('');
    const [bonusUser, setBonusUser] = React.useState('');
    const [bonusAmt, setBonusAmt] = React.useState('');
    const [dailyLimit, setDailyLimit] = React.useState('');
    const fetchOrders = () => {
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/admin/orders`)
        .then(r => r.json())
        .then(d => {
          setBuys(d.buys || []);
          setSells(d.sells || []);
          setWithdraws(d.withdrawals || []);
          setLoading(false);
        })
        .catch(e => { console.error(e); setLoading(false); });
    };
    
    const handleApproveWithdraw = async (userId) => {
      if(!window.confirm("Approve this Withdrawal and notify user?")) return;
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/admin/approve-withdraw`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        });
        const data = await res.json();
        if(data.success) {
          alert("Withdrawal Approved & User Notified!");
          fetchOrders();
        } else {
          alert(data.error);
        }
      } catch(e) {
        alert("Error approving withdrawal");
      }
    };

  const handleApprove = async (id) => {
    if(!window.confirm("Approve this Buy Order manually?")) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/admin/approve-buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if(data.success) {
        alert('Approved!');
        fetchOrders();
      } else {
        alert(data.error);
      }
    } catch(e) {
      alert('Error approving');
    }
  };

  if (loading) return <div className="p-8 text-2xl font-bold text-white">Loading Orders...</div>;

  return (
    <div className="p-8">
      <h2 className="text-3xl font-extrabold text-blue-400 mb-6">Orders History</h2>
      
      <div className="flex gap-4 mb-6">
        <button onClick={() => setTab('buy')} className={`px-6 py-2 rounded-xl font-bold transition-all ${tab === 'buy' ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-400'}`}>Buy Orders</button>
        <button onClick={() => setTab('sell')} className={`px-6 py-2 rounded-xl font-bold transition-all ${tab === 'sell' ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-400'}`}>Sell Orders</button>
      </div>

      <div className="bg-gray-900 rounded-2xl p-6 shadow-2xl border border-gray-800 overflow-x-auto">
        {tab === 'buy' ? (
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-400 border-b border-gray-800">
                <th className="pb-4 font-bold">TrxID</th>
                <th className="pb-4 font-bold">User</th>
                <th className="pb-4 font-bold">Amount</th>
                <th className="pb-4 font-bold">Method</th>
                <th className="pb-4 font-bold">Wallet</th>
                <th className="pb-4 font-bold">Status</th>
                <th className="pb-4 font-bold">Action</th>
              </tr>
            </thead>
            <tbody>
              {buys.map(b => (
                <tr key={b.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                  <td className="py-4 font-mono text-sm text-gray-300">{b.trxId}</td>
                  <td className="py-4 font-medium text-white">{b.userId}</td>
                  <td className="py-4 font-bold text-emerald-400">{b.amount} {b.asset} <span className="text-xs text-gray-500 block">৳{b.totalBdt} BDT</span></td>
                  <td className="py-4 text-gray-300">{b.paymentMethod}</td>
                  <td className="py-4 text-xs text-gray-400 break-all max-w-[150px]">{b.receiveAddress}</td>
                  <td className="py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${b.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {b.status ? b.status.toUpperCase() : 'PENDING'}
                    </span>
                  </td>
                  <td className="py-4">
                    {b.status === 'pending' && (
                      <button onClick={() => handleApprove(b.id)} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold shadow-md">
                        Accept
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {buys.length === 0 && <tr><td colSpan="7" className="py-8 text-center text-gray-500">No buy orders yet</td></tr>}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-400 border-b border-gray-800">
                <th className="pb-4 font-bold">User</th>
                <th className="pb-4 font-bold">Sold Asset</th>
                <th className="pb-4 font-bold">BDT Credit</th>
                <th className="pb-4 font-bold">Sender Wallet</th>
                <th className="pb-4 font-bold">Date</th>
              </tr>
            </thead>
            <tbody>
              {sells.map(s => (
                <tr key={s.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                  <td className="py-4 font-medium text-white">{s.userId}</td>
                  <td className="py-4 font-bold text-amber-400">{s.amount} {s.asset}</td>
                  <td className="py-4 font-bold text-emerald-400">৳{s.estimatedTk}</td>
                  <td className="py-4 text-xs text-gray-400 break-all">{s.wallet}</td>
                  <td className="py-4 text-gray-500 text-sm">{s.timestamp?._seconds ? new Date(s.timestamp._seconds * 1000).toLocaleString() : ''}</td>
                </tr>
              ))}
              {sells.length === 0 && <tr><td colSpan="5" className="py-8 text-center text-gray-500">No sell orders yet</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
