const fs = require('fs');

const code = `import React, { useState, useEffect } from 'react';
import { Home, User, ChevronRight, Zap, Share2, Copy, X, ArrowRightLeft, Wallet, Gift, ArrowUpRight, TrendingUp, Sparkles } from 'lucide-react';
import { TonConnectUIProvider, TonConnectButton, useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import WebApp from '@twa-dev/sdk';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchUserData, submitFreeTonTask, submitSellOrder } from './api';

const initialGraphData = [
  { time: '10:00', price: 118.5 },
  { time: '10:05', price: 119.2 },
  { time: '10:10', price: 118.8 },
  { time: '10:15', price: 119.5 },
  { time: '10:20', price: 120.1 },
  { time: '10:25', price: 119.9 },
  { time: 'Now', price: 120.0 },
];

const PremiumGiftBox = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl chest-float">
     <defs>
        <linearGradient id="box-top" x1="0" y1="0" x2="1" y2="1">
           <stop offset="0%" stopColor="#ffffff" />
           <stop offset="100%" stopColor="#f0fdf4" />
        </linearGradient>
        <linearGradient id="box-left" x1="0" y1="0" x2="1" y2="1">
           <stop offset="0%" stopColor="#e2e8f0" />
           <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
        <linearGradient id="box-right" x1="0" y1="0" x2="1" y2="1">
           <stop offset="0%" stopColor="#f8fafc" />
           <stop offset="100%" stopColor="#f1f5f9" />
        </linearGradient>
        <linearGradient id="ribbon" x1="0" y1="0" x2="1" y2="1">
           <stop offset="0%" stopColor="#10b981" />
           <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
           <stop offset="0%" stopColor="#fbbf24" />
           <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
           <feGaussianBlur stdDeviation="6" result="blur" />
           <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
     </defs>
     <circle cx="50" cy="50" r="35" fill="#10b981" opacity="0.15" filter="url(#glow)" className="pulse-glow" />
     <path d="M50 75 L20 60 L20 35 L50 50 Z" fill="url(#box-left)" />
     <path d="M50 75 L80 60 L80 35 L50 50 Z" fill="url(#box-right)" />
     <path d="M50 20 L20 35 L50 50 L80 35 Z" fill="url(#box-top)" />
     <path d="M40 70 L30 65 L30 40 L40 45 Z" fill="url(#ribbon)" />
     <path d="M60 70 L70 65 L70 40 L60 45 Z" fill="url(#ribbon)" />
     <path d="M35 27.5 L65 42.5 L75 37.5 L45 22.5 Z" fill="url(#ribbon)" />
     <path d="M65 27.5 L35 42.5 L25 37.5 L55 22.5 Z" fill="url(#ribbon)" opacity="0.8" />
     <circle cx="50" cy="35" r="7" fill="url(#gold)" filter="url(#glow)" />
     <path d="M50 35 L40 25 L45 20 Z" fill="url(#gold)" />
     <path d="M50 35 L60 25 L55 20 Z" fill="url(#gold)" />
  </svg>
);

const AbstractWalletIcon = () => (
    <svg viewBox="0 0 64 64" className="w-16 h-16 opacity-10">
      <rect x="8" y="16" width="48" height="32" rx="6" fill="#10B981" />
      <path d="M8 28h48v20a6 6 0 01-6 6H14a6 6 0 01-6-6V28z" fill="#047857" />
      <circle cx="44" cy="32" r="4" fill="#fbbf24" />
      <rect x="8" y="24" width="48" height="4" fill="#064e3b" opacity="0.5" />
    </svg>
);

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState({ id: 0, first_name: 'User', username: '' });
  const [balance, setBalance] = useState(0);

  const loadData = async (userId) => {
    const data = await fetchUserData(userId);
    setBalance(data.balance);
  };

  useEffect(() => {
    try {
        if (WebApp.initDataUnsafe?.user) {
          setUser(WebApp.initDataUnsafe.user);
          loadData(WebApp.initDataUnsafe.user.id);
        } else {
          loadData(8799135330);
        }
    } catch(e) {
        loadData(8799135330);
    }
  }, []);

  return (
    <TonConnectUIProvider manifestUrl="https://maruf-teach-bot.onrender.com/tonconnect-manifest.json">
      <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] pb-28 relative overflow-x-hidden font-sans selection:bg-[var(--color-brand)]/20">
        
        <div className="relative z-10 p-4 max-w-md mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6 pt-2">
             <div className="flex items-center gap-3">
                 <div className="w-[42px] h-[42px] bg-white rounded-full flex items-center justify-center font-bold text-[var(--color-text-primary)] premium-shadow border border-[var(--color-border)]">
                    {user.first_name.charAt(0).toUpperCase()}
                 </div>
                 <div>
                    <h1 className="text-base font-semibold text-[var(--color-text-primary)] leading-tight">Maruf Earn Bot</h1>
                    <p className="text-[10px] font-medium text-[var(--color-brand)] uppercase tracking-[0.15em]">Welcome back</p>
                 </div>
             </div>
             {/* Styling the TonConnect button is limited, but we wrap it to constrain it */}
             <div className="scale-90 origin-right">
                <TonConnectButton />
             </div>
          </div>

          {activeTab === 'home' && <HomePage balance={balance} user={user} onGoToClaim={() => setActiveTab('claim')} />}
          {activeTab === 'sell' && <SellPage />}
          {activeTab === 'profile' && <ProfilePage user={user} balance={balance} />}
          {activeTab === 'claim' && <ClaimPage user={user} onBack={() => setActiveTab('home')} />}
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 w-full z-50 flex justify-center">
          <div className="w-full max-w-md bg-white rounded-t-[24px] flex justify-between items-end px-8 pb-5 pt-4 floating-nav-shadow">
            <button onClick={() => setActiveTab('home')} className={\`flex flex-col items-center p-2 transition-all duration-300 \${activeTab === 'home' ? 'text-[var(--color-brand)]' : 'text-[var(--color-text-secondary)]'}\`}>
              <Home size={22} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
              <span className="text-[10px] mt-1.5 font-medium tracking-wide">HOME</span>
            </button>

            <button onClick={() => setActiveTab('sell')} className={\`relative -top-5 flex flex-col items-center justify-center w-[56px] h-[56px] rounded-full bg-[var(--color-brand)] border-[4px] border-[var(--color-bg-primary)] sell-btn-shadow text-white transition-transform active:scale-95\`}>
              <ArrowRightLeft size={24} strokeWidth={2.5} className={activeTab === 'sell' ? 'animate-pulse' : ''} />
            </button>

            <button onClick={() => setActiveTab('profile')} className={\`flex flex-col items-center p-2 transition-all duration-300 \${activeTab === 'profile' ? 'text-[var(--color-brand)]' : 'text-[var(--color-text-secondary)]'}\`}>
              <User size={22} strokeWidth={activeTab === 'profile' ? 2.5 : 2} />
              <span className="text-[10px] mt-1.5 font-medium tracking-wide">PROFILE</span>
            </button>
          </div>
        </div>
      </div>
    </TonConnectUIProvider>
  );
}

function HomePage({ balance, user, onGoToClaim }) {
  const [graphData, setGraphData] = useState(initialGraphData);

  useEffect(() => {
    const interval = setInterval(() => {
        setGraphData(prev => {
            const newData = [...prev.slice(1)];
            const lastPrice = prev[prev.length - 1].price;
            const change = (Math.random() - 0.5) * 2.5; 
            newData.push({
                time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: "numeric", minute: "numeric", second: "numeric" }),
                price: Number((lastPrice + change).toFixed(2))
            });
            return newData;
        });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      
      {/* Total Balance Card */}
      <div className="bg-white p-6 rounded-[24px] premium-shadow border border-[var(--color-border)] relative overflow-hidden">
         <div className="absolute top-4 right-4 pointer-events-none">
            <AbstractWalletIcon />
         </div>
         <p className="text-[11px] font-medium text-[var(--color-text-secondary)] tracking-widest uppercase mb-1">Total Balance</p>
         <div className="flex items-baseline gap-1">
            <h2 className="text-4xl font-bold text-[var(--color-text-primary)]">{balance}</h2>
            <span className="text-xl font-semibold text-[var(--color-brand)]">TK</span>
         </div>
         <p className="text-[11px] text-[var(--color-text-secondary)] mt-2">Available for withdrawal</p>
      </div>

      {/* Live Chart Card */}
      <div className="bg-white p-5 rounded-[24px] premium-shadow border border-[var(--color-border)]">
         <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2 text-[var(--color-text-primary)]">
                <TrendingUp size={16} className="text-[var(--color-text-secondary)]" />
                <h3 className="text-sm font-semibold">USDT/TK Live Chart</h3>
            </div>
            <div className="flex items-center gap-1.5 bg-[var(--color-success)]/10 px-2 py-1 rounded-full border border-[var(--color-success)]/20">
                <div className="w-1.5 h-1.5 bg-[var(--color-success)] rounded-full animate-pulse" />
                <span className="text-[9px] font-bold text-[var(--color-success)] tracking-wide">LIVE</span>
            </div>
         </div>
         
         <div className="flex items-baseline gap-1.5 mb-6">
            <span className="text-2xl font-bold text-[var(--color-text-primary)]">{graphData[graphData.length-1].price.toFixed(2)}</span>
            <span className="text-xs font-medium text-[var(--color-text-secondary)]">TK/USDT</span>
         </div>

         <div className="h-32 w-full ml-[-15px]">
            <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={graphData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                 <defs>
                   <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="var(--color-brand)" stopOpacity={0.15}/>
                     <stop offset="95%" stopColor="var(--color-brand)" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <YAxis domain={['dataMin - 0.5', 'dataMax + 0.5']} hide />
                 <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                 <Area type="monotone" dataKey="price" stroke="var(--color-brand)" strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" isAnimationActive={true} animationDuration={300} />
               </AreaChart>
            </ResponsiveContainer>
         </div>
         <div className="flex justify-between mt-2 px-2">
            <span className="text-[10px] text-[var(--color-text-secondary)] font-medium">1H</span>
            <span className="text-[10px] text-[var(--color-text-secondary)] font-medium">1D</span>
            <span className="text-[10px] text-[var(--color-brand)] font-bold">LIVE</span>
            <span className="text-[10px] text-[var(--color-text-secondary)] font-medium">1W</span>
            <span className="text-[10px] text-[var(--color-text-secondary)] font-medium">1M</span>
         </div>
      </div>

      {/* Premium Reward Card */}
      <div onClick={onGoToClaim} className="bg-gradient-to-br from-emerald-50 to-white p-5 rounded-[24px] premium-shadow border border-emerald-100 cursor-pointer active:scale-[0.98] transition-transform relative overflow-hidden group">
         
         <div className="absolute top-0 right-0 bg-[var(--color-brand)] text-white text-[9px] font-bold px-3 py-1 rounded-bl-xl tracking-wider">
            BONUS
         </div>

         <div className="flex items-center gap-4">
            <div className="w-20 h-20 shrink-0">
               <PremiumGiftBox />
            </div>
            <div>
               <h3 className="text-[15px] font-bold text-[var(--color-text-primary)] mb-1 flex items-center gap-1">
                  Free TON Reward <Sparkles size={14} className="text-amber-400" />
               </h3>
               <p className="text-[11px] text-[var(--color-text-secondary)] mb-3 leading-relaxed">
                  Connect your wallet and claim your reward instantly.
               </p>
               <button className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--color-brand)] bg-[var(--color-brand)]/10 px-3 py-1.5 rounded-full group-hover:bg-[var(--color-brand)] group-hover:text-white transition-colors">
                  Claim Reward <ArrowUpRight size={12} />
               </button>
            </div>
         </div>
      </div>
    </div>
  );
}

function ClaimPage({ user, onBack }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const userTonAddress = useTonAddress();

  const handleClaim = async () => {
    if (!userTonAddress) return;
    setLoading(true);
    try {
      await submitFreeTonTask({
        userId: user.id || 8799135330,
        wallet: userTonAddress
      });
      setSuccess(true);
    } catch(e) {
      alert('Failed to submit. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-[var(--color-bg-primary)] z-[100] animate-in slide-in-from-bottom-full duration-300 flex flex-col">
       <div className="p-4 flex items-center justify-between bg-white border-b border-[var(--color-border)]">
          <button onClick={onBack} className="w-10 h-10 flex items-center justify-center text-[var(--color-text-secondary)] active:bg-gray-100 rounded-full transition-colors">
             <X size={24} />
          </button>
          <span className="font-semibold text-[var(--color-text-primary)]">Claim Reward</span>
          <div className="w-10" />
       </div>

       <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
          <div className="w-48 h-48 mb-8 mt-4 relative">
             <div className="absolute inset-0 bg-emerald-100/50 rounded-full blur-3xl" />
             <PremiumGiftBox />
          </div>

          <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2 text-center">Exclusive TON Bonus</h2>
          <p className="text-[13px] text-[var(--color-text-secondary)] text-center mb-10 max-w-xs leading-relaxed">
             Submit your TON wallet address to participate in our mining campaign and receive instant rewards.
          </p>

          <div className="w-full max-w-sm space-y-4">
             {!userTonAddress ? (
                <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-500 shrink-0">
                      <Wallet size={18} />
                   </div>
                   <div>
                      <p className="text-sm font-semibold text-red-700">Wallet Not Connected</p>
                      <p className="text-[11px] text-red-500 mt-0.5">Please connect your wallet first</p>
                   </div>
                </div>
             ) : (
                <div className="bg-white p-4 rounded-2xl border border-[var(--color-border)] flex items-center gap-3 premium-shadow">
                   <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-[var(--color-brand)] shrink-0">
                      <Wallet size={18} />
                   </div>
                   <div className="overflow-hidden">
                      <p className="text-[11px] font-medium text-[var(--color-text-secondary)]">Connected Wallet</p>
                      <p className="text-sm font-mono font-bold text-[var(--color-text-primary)] truncate">{userTonAddress}</p>
                   </div>
                </div>
             )}

             <div className="pt-4">
                 <TonConnectButton className="w-full !flex !justify-center mb-4" />
             </div>

             {userTonAddress && !success && (
                <button onClick={handleClaim} disabled={loading} className="w-full bg-[var(--color-text-primary)] text-white font-semibold py-4 rounded-2xl premium-shadow active:scale-[0.98] transition-all disabled:opacity-50">
                   {loading ? 'SUBMITTING...' : 'CLAIM NOW'}
                </button>
             )}

             {success && (
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-center animate-in fade-in zoom-in duration-300">
                   <p className="text-emerald-600 font-semibold text-sm">🎉 Successfully submitted!</p>
                   <p className="text-emerald-500 text-[11px] mt-1">Your reward is being processed.</p>
                </div>
             )}
          </div>
       </div>
    </div>
  );
}

function SellPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [asset, setAsset] = useState('USDT');
  const [amount, setAmount] = useState('');
  const userTonAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();

  const rate = asset === 'USDT' ? 120 : (asset === 'GRAM' ? 0.8 : 800);
  const estimatedTk = (parseFloat(amount || 0) * rate).toFixed(2);

  const handleSell = async () => {
    if(!userTonAddress || !amount) return;
    setLoading(true);
    try {
      const tx = {
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [
          {
            address: "UQC7hYHfrVJ_uT_esMr7vCv1bVh5ytQxYUUjRDiTUiG9s5Fb",
            amount: (parseFloat(amount) * 1e9).toString()
          }
        ]
      };
      await tonConnectUI.sendTransaction(tx);
      await submitSellOrder({
        userId: WebApp.initDataUnsafe?.user?.id || 8799135330,
        asset,
        amount: parseFloat(amount),
        estimatedTk: parseFloat(estimatedTk),
        wallet: userTonAddress
      });
      setSuccess(true);
    } catch(e) {
      alert('Transaction failed or cancelled.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300 max-w-md mx-auto">
      <div className="bg-white p-6 rounded-[24px] premium-shadow border border-[var(--color-border)] relative">
         
         <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-[var(--color-brand)]">
                <ArrowRightLeft size={18} strokeWidth={2.5} />
            </div>
            <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Swap to Taka</h2>
         </div>
         <p className="text-[var(--color-text-secondary)] text-xs mb-6 font-medium leading-relaxed">Instantly convert your Crypto to TK. Securely connected via Tonkeeper.</p>
         
         {!userTonAddress && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3">
               <div className="w-2 h-2 bg-[var(--color-danger)] rounded-full animate-pulse" />
               <p className="text-[11px] font-semibold text-red-600">Connect wallet to trade.</p>
            </div>
         )}

         <div className="space-y-5">
            <div>
               <label className="block text-[11px] font-semibold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wide">Select Asset</label>
               <select value={asset} onChange={e=>setAsset(e.target.value)} className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] p-4 rounded-xl outline-none focus:border-[var(--color-brand)] transition-colors text-[var(--color-text-primary)] font-semibold appearance-none">
                  <option value="USDT">USDT (Tether)</option>
                  <option value="GRAM">GRAM Token</option>
                  <option value="TON">TON Coin</option>
               </select>
            </div>
            
            <div>
               <label className="block text-[11px] font-semibold text-[var(--color-text-secondary)] mb-2 uppercase tracking-wide">Pay Amount</label>
               <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00" className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] p-4 rounded-xl outline-none focus:border-[var(--color-brand)] transition-colors text-[var(--color-text-primary)] font-bold text-lg" />
            </div>

            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex justify-between items-center">
               <span className="text-[var(--color-brand)] text-[11px] font-semibold uppercase tracking-wide">Receive</span>
               <span className="text-2xl font-bold text-[var(--color-brand)]">{estimatedTk} TK</span>
            </div>

            <button onClick={handleSell} disabled={!userTonAddress || !amount || loading} className="w-full bg-[var(--color-text-primary)] text-white font-semibold py-4 rounded-xl shadow-lg shadow-gray-200 mt-2 active:scale-[0.98] transition-all disabled:opacity-50">
               {loading ? 'PROCESSING...' : 'CONFIRM SWAP'}
            </button>
            
            {success && (
                <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center gap-2">
                    <p className="text-[var(--color-success)] text-xs font-semibold">Swap order placed successfully!</p>
                </div>
            )}
         </div>
      </div>
    </div>
  );
}

function ProfilePage({ user, balance }) {
  return (
    <div className="space-y-4 animate-in fade-in duration-300 max-w-md mx-auto">
      <div className="bg-white p-6 rounded-[24px] premium-shadow border border-[var(--color-border)] flex items-center gap-5">
         <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center text-[var(--color-brand)] font-bold text-2xl">
            {user.first_name.charAt(0).toUpperCase()}
         </div>
         <div>
            <h2 className="text-xl font-bold text-[var(--color-text-primary)]">{user.first_name}</h2>
            <p className="text-[var(--color-text-secondary)] text-sm font-medium">@{user.username || 'user'}</p>
         </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
         <div className="bg-white p-5 rounded-[20px] premium-shadow border border-[var(--color-border)] flex flex-col justify-center">
            <p className="text-[10px] font-semibold text-[var(--color-text-secondary)] mb-1 uppercase tracking-wide">Balance</p>
            <p className="text-xl font-bold text-[var(--color-text-primary)]">{balance} <span className="text-[var(--color-brand)] text-sm">TK</span></p>
         </div>
         <div className="bg-white p-5 rounded-[20px] premium-shadow border border-[var(--color-border)] flex flex-col justify-center">
            <p className="text-[10px] font-semibold text-[var(--color-text-secondary)] mb-1 uppercase tracking-wide">User ID</p>
            <p className="text-sm font-mono font-bold text-[var(--color-text-primary)] flex items-center gap-2">
               {user.id} <Copy size={12} className="text-[var(--color-text-secondary)]" />
            </p>
         </div>
      </div>

      <div className="bg-white p-5 rounded-[24px] premium-shadow border border-[var(--color-border)] flex justify-between items-center mt-2 group active:scale-[0.98] transition-transform">
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-[var(--color-brand-secondary)] group-hover:scale-110 transition-transform">
               <Share2 size={20} />
            </div>
            <div>
               <span className="font-semibold text-[var(--color-text-primary)] block text-sm">Refer & Earn</span>
               <span className="text-[10px] text-[var(--color-text-secondary)] font-medium">Invite friends for bonus</span>
            </div>
         </div>
         <ChevronRight size={18} className="text-[var(--color-text-secondary)] group-hover:text-[var(--color-brand-secondary)] transition-colors" />
      </div>
    </div>
  );
}
`

fs.writeFileSync('miniapp/src/App.jsx', code);
console.log('App.jsx patched successfully');
