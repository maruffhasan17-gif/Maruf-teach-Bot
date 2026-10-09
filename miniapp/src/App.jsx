import React, { useState, useEffect } from 'react';
import { Home, User, ArrowDown, ArrowUp, ChevronRight, Zap, Share2, Copy, X, ArrowRightLeft, Wallet, Gift, ArrowUpRight, TrendingUp, Sparkles, Info, CircleDollarSign, Gem, Coins, Delete, ChevronDown, Clock, Save, CheckCircle2 , Volume2, VolumeX, Check, Settings , ClipboardPaste } from 'lucide-react';
import { TonConnectUIProvider, TonConnectButton, useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import WebApp from '@twa-dev/sdk';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchUserData, submitFreeTonTask, saveFiatWallet, withdrawFiat, submitSellOrder, buildTransaction, submitBuyOrder } from './api';

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

function TonConnectStyles() {
    useEffect(() => {
        const injectStyles = () => {
            const tcRoot = document.getElementById('tc-widget-root');
            if (tcRoot && tcRoot.shadowRoot) {
                const styleId = 'custom-tc-styles';
                if (!tcRoot.shadowRoot.getElementById(styleId)) {
                    const style = document.createElement('style');
                    style.id = styleId;
                    style.textContent = `
                        /* Target TonConnect Toasts */
                        div[data-tc-toast], 
                        [class*="toast-"], 
                        [class*="Toast-"],
                        [class*="notification"] {
                            position: fixed !important;
                            top: 90px !important;
                            left: 50% !important;
                            transform: translateX(-50%) !important;
                            right: auto !important;
                            bottom: auto !important;
                            margin: 0 !important;
                            z-index: 99999 !important;
                            width: max-content !important;
                            max-width: 90vw !important;
                        }
                    `;
                    tcRoot.shadowRoot.appendChild(style);
                }
            }
        };

        const observer = new MutationObserver(() => {
            injectStyles();
        });

        observer.observe(document.body, { childList: true, subtree: true });
        injectStyles(); // initial try

        // Setup interval to catch shadowRoot creation if delayed
        const interval = setInterval(injectStyles, 500);

        return () => {
            observer.disconnect();
            clearInterval(interval);
        };
    }, []);

    return null;
}

export default function App() {
  
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  useEffect(() => {
    const handleFocus = (e) => {
      if (e.target.tagName === 'INPUT') {
        setIsKeyboardVisible(true);
        setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
      }
    };
    const handleBlur = (e) => {
      if (e.target.tagName === 'INPUT') setIsKeyboardVisible(false);
    };
    window.addEventListener('focusin', handleFocus);
    window.addEventListener('focusout', handleBlur);
    return () => {
      window.removeEventListener('focusin', handleFocus);
      window.removeEventListener('focusout', handleBlur);
    };
  }, []);
const [activeTab, setActiveTab] = useState('home');

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [activeTab]);
  const [fiatWallet, setFiatWallet] = useState(null);
  const [fiatWithdrawPending, setFiatWithdrawPending] = useState(null);
  const [mbsId, setMbsId] = useState(null);
  const [user, setUser] = useState({ id: 0, first_name: 'User', username: '' });
  const [balance, setBalance] = useState(0);

  window.reloadGlobalData = () => loadData(user.id || 123456789);
  const loadData = async (userId) => {
    const data = await fetchUserData(userId);
    setBalance(data.balance);
    setFiatWallet(data.fiatWallet || null);
    setFiatWithdrawPending(data.fiatWithdrawPending || null);
      setMbsId(data.mbsId);
  };

  useEffect(() => {
    try {
const GUEST_ID = 123456789;
        const tgWebApp = window.Telegram?.WebApp;
        if (tgWebApp?.initDataUnsafe?.user) {
          setUser(tgWebApp.initDataUnsafe.user);
          loadData(tgWebApp.initDataUnsafe.user.id);
        } else {
          setUser({ id: GUEST_ID, first_name: "Guest", last_name: "Account" });
          loadData(GUEST_ID);
        }
    } catch(e) {
        loadData(123456789);
    }
  }, []);

  const manifestUrl = 'https://maruf-teach-bot.onrender.com/tonconnect-manifest.json';

  return (
    <TonConnectUIProvider manifestUrl={manifestUrl}>
      <TonConnectStyles />
      <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] pb-28 relative overflow-x-hidden font-sans selection:bg-[var(--color-brand)]/20">
        
        <div className="relative z-10 p-4 max-w-md mx-auto">
          {/* Header */}
          <div id="main-app-header" className="flex justify-between items-center mb-6 pt-2 transition-all duration-300">
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

          {activeTab === 'home' && <HomePage balance={balance} user={user} fiatWithdrawPending={fiatWithdrawPending} onGoToClaim={() => setActiveTab('claim')} />}
          {activeTab === 'buy' && <PremiumBuyPage user={user} />}
          {activeTab === 'sell' && <PremiumSellPage user={user} />}
          {activeTab === 'history' && <HistoryPage user={user} onBack={() => setActiveTab('profile')} />}
            {activeTab === 'profile' && <ProfilePage user={user} balance={balance} mbsId={mbsId} fiatWallet={fiatWallet} fiatWithdrawPending={fiatWithdrawPending} onGoToWithdraw={() => setActiveTab('withdraw')} onGoToHistory={() => setActiveTab('history')} setFiatWallet={setFiatWallet} reloadData={() => loadData(user?.id || 123456789)} />}
          {activeTab === 'claim' && <ClaimPage user={user} onBack={() => setActiveTab('home')} />}
          {activeTab === 'withdraw' && <WithdrawFiatPage user={user} balance={balance} fiatWallet={fiatWallet} fiatWithdrawPending={fiatWithdrawPending} onBack={() => setActiveTab('profile')} reloadData={() => loadData(user?.id || 123456789)} />}
        </div>

        {/* PREMIUM BOTTOM NAVIGATION */}
        {!isKeyboardVisible && (
            <div className="fixed bottom-0 left-0 w-full z-50 flex justify-center pb-[env(safe-area-inset-bottom,16px)] px-5 mb-5 pointer-events-none">
                <div className="w-full max-w-[380px] bg-white/90 backdrop-blur-2xl rounded-[32px] flex justify-between items-center px-2 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.06)] border border-gray-100/50 pointer-events-auto">
                    
                    {/* HOME */}
                    <button onClick={() => setActiveTab('home')} className="relative flex flex-col items-center justify-center w-[76px] h-[64px] transition-all duration-300 group active:scale-95">
                        <div className="relative flex flex-col items-center justify-center z-10">
                            <Home size={22} strokeWidth={activeTab === 'home' ? 2.5 : 2} className={`mb-1.5 transition-colors duration-300 ${activeTab === 'home' ? 'text-emerald-500' : 'text-gray-400 group-hover:text-gray-600'}`} />
                            <span className={`text-[9px] font-extrabold tracking-widest transition-colors duration-300 ${activeTab === 'home' ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-600'}`}>HOME</span>
                        </div>
                        {/* Active Indicator & Background */}
                        <div className={`absolute bottom-0 w-5 h-1 bg-emerald-500 rounded-t-full transition-all duration-300 ${activeTab === 'home' ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-50'}`} />
                        <div className={`absolute inset-1 bg-emerald-50/50 rounded-[24px] transition-opacity duration-300 ${activeTab === 'home' ? 'opacity-100' : 'opacity-0'}`} />
                    </button>
  
                    {/* BUY */}
                    <button onClick={() => setActiveTab('buy')} className="relative flex flex-col items-center justify-center w-[76px] h-[64px] transition-all duration-300 group active:scale-95">
                        <div className="relative flex flex-col items-center justify-center z-10">
                            <ArrowDown size={22} strokeWidth={activeTab === 'buy' ? 2.5 : 2} className={`mb-1.5 transition-colors duration-300 ${activeTab === 'buy' ? 'text-emerald-500' : 'text-gray-400 group-hover:text-gray-600'}`} />
                            <span className={`text-[9px] font-extrabold tracking-widest transition-colors duration-300 ${activeTab === 'buy' ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-600'}`}>BUY</span>
                        </div>
                        {/* Active Indicator & Background */}
                        <div className={`absolute bottom-0 w-5 h-1 bg-emerald-500 rounded-t-full transition-all duration-300 ${activeTab === 'buy' ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-50'}`} />
                        <div className={`absolute inset-1 bg-emerald-50/50 rounded-[24px] transition-opacity duration-300 ${activeTab === 'buy' ? 'opacity-100' : 'opacity-0'}`} />
                    </button>
  
                    {/* SELL */}
                    <button onClick={() => setActiveTab('sell')} className="relative flex flex-col items-center justify-center w-[76px] h-[64px] transition-all duration-300 group active:scale-95">
                        <div className="relative flex flex-col items-center justify-center z-10">
                            <ArrowUp size={22} strokeWidth={activeTab === 'sell' ? 2.5 : 2} className={`mb-1.5 transition-colors duration-300 ${activeTab === 'sell' ? 'text-emerald-500' : 'text-gray-400 group-hover:text-gray-600'}`} />
                            <span className={`text-[9px] font-extrabold tracking-widest transition-colors duration-300 ${activeTab === 'sell' ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-600'}`}>SELL</span>
                        </div>
                        {/* Active Indicator & Background */}
                        <div className={`absolute bottom-0 w-5 h-1 bg-emerald-500 rounded-t-full transition-all duration-300 ${activeTab === 'sell' ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-50'}`} />
                        <div className={`absolute inset-1 bg-emerald-50/50 rounded-[24px] transition-opacity duration-300 ${activeTab === 'sell' ? 'opacity-100' : 'opacity-0'}`} />
                    </button>
  
                    {/* PROFILE */}
                    <button onClick={() => setActiveTab('profile')} className="relative flex flex-col items-center justify-center w-[76px] h-[64px] transition-all duration-300 group active:scale-95">
                        <div className="relative flex flex-col items-center justify-center z-10">
                            <User size={22} strokeWidth={activeTab === 'profile' ? 2.5 : 2} className={`mb-1.5 transition-colors duration-300 ${activeTab === 'profile' ? 'text-emerald-500' : 'text-gray-400 group-hover:text-gray-600'}`} />
                            <span className={`text-[9px] font-extrabold tracking-widest transition-colors duration-300 ${activeTab === 'profile' ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-600'}`}>PROFILE</span>
                        </div>
                        {/* Active Indicator & Background */}
                        <div className={`absolute bottom-0 w-5 h-1 bg-emerald-500 rounded-t-full transition-all duration-300 ${activeTab === 'profile' ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-50'}`} />
                        <div className={`absolute inset-1 bg-emerald-50/50 rounded-[24px] transition-opacity duration-300 ${activeTab === 'profile' ? 'opacity-100' : 'opacity-0'}`} />
                    </button>
                </div>
            </div>
        )}
        </div>
      </TonConnectUIProvider>
  );
}

function AppHeader({ user }) {
  const userTonAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();
  
  return (
      <div className="flex justify-between items-center mb-8 pt-2 animate-in fade-in slide-in-from-top-4 duration-500">
         <div className="flex items-center gap-3">
             <div className="w-10 h-10 glass-panel rounded-full flex items-center justify-center font-bold text-[var(--color-text-primary)] hover:scale-105 transition-transform duration-300 shadow-sm cursor-pointer border border-white">
                {user.first_name.charAt(0).toUpperCase()}
             </div>
             <div className="flex flex-col justify-center">
                <p className="text-[9px] font-bold text-[var(--color-text-secondary)] uppercase tracking-[0.2em] mb-0.5 opacity-80">Welcome back</p>
                <h1 className="text-[15px] font-extrabold text-[var(--color-text-primary)] leading-none tracking-tight">Maruf Earn Bot</h1>
             </div>
         </div>
         
         {/* Premium Custom Connect Button */}
         <button onClick={() => {
            if (userTonAddress) {
               tonConnectUI.disconnect();
            } else {
               tonConnectUI.openModal();
            }
         }} className="glass-button flex items-center gap-2 rounded-full px-4 py-2.5 active-scale smooth-transition group">
            <Wallet size={16} className="text-[var(--color-brand)] group-hover:scale-110 transition-transform duration-300" />
            <span className="text-xs font-bold text-[var(--color-text-primary)]">
               {userTonAddress ? `${userTonAddress.slice(0, 4)}...${userTonAddress.slice(-4)}` : 'Connect'}
            </span>
         </button>
            </div>
  );
}

function HomePage({ balance, user, fiatWithdrawPending, onGoToClaim }) {
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
    <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
      
      {fiatWithdrawPending && (
          fiatWithdrawPending.status === 'completed' ? (
              Date.now() - (fiatWithdrawPending.completedAt || Date.now()) < 3 * 60 * 60 * 1000 && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-3xl flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 shrink-0 shadow-inner">
                          <CheckCircle2 size={24} />
                      </div>
                      <div>
                          <h3 className="text-emerald-500 font-extrabold text-sm tracking-widest uppercase">Withdrawal Successful</h3>
                          <p className="text-[var(--color-text-secondary)] text-xs mt-0.5">Your <b>{fiatWithdrawPending.amount} TK</b> has been sent to {fiatWithdrawPending.method} ({fiatWithdrawPending.number}).</p>
                      </div>
                  </div>
              )
          ) : (
              <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-3xl flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-500 shrink-0 shadow-inner">
                      <Clock size={24} />
                  </div>
                  <div>
                      <h3 className="text-amber-500 font-extrabold text-sm tracking-widest uppercase">Withdrawal Pending</h3>
                      <p className="text-[var(--color-text-secondary)] text-xs mt-0.5">Serial <b>#{fiatWithdrawPending.serial || 'N/A'}</b>: <b>{fiatWithdrawPending.amount} TK</b> via {fiatWithdrawPending.method} ({fiatWithdrawPending.number}).</p>
                  </div>
              </div>
          )
      )}
      
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

      {/* Instructions Card */}
      <div className="bg-white p-5 rounded-[24px] premium-shadow border border-[var(--color-border)] mb-4">
         <h3 className="text-[14px] font-bold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
            <Info size={16} className="text-[var(--color-brand)]" />
            How to use this bot
         </h3>
         <ul className="space-y-3">
            <li className="flex items-start gap-2.5">
               <div className="w-5 h-5 rounded-full bg-[var(--color-brand)]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-[var(--color-brand)]">1</span>
               </div>
               <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                  <strong className="text-[var(--color-text-primary)]">Earn TK:</strong> Start the bot and keep it active to accumulate TK points.
               </p>
            </li>
            <li className="flex items-start gap-2.5">
               <div className="w-5 h-5 rounded-full bg-[var(--color-brand)]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-[var(--color-brand)]">2</span>
               </div>
               <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                  <strong className="text-[var(--color-text-primary)]">Connect Wallet:</strong> Link your TON wallet securely to enable withdrawals.
               </p>
            </li>
            <li className="flex items-start gap-2.5">
               <div className="w-5 h-5 rounded-full bg-[var(--color-brand)]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-[var(--color-brand)]">3</span>
               </div>
               <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                  <strong className="text-[var(--color-text-primary)]">Withdraw:</strong> Convert your earned TK balance to USDT directly to your wallet.
               </p>
            </li>
         </ul>
      </div>
    </div>
  );
}

function ClaimPage({ user, onBack }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [network, setNetwork] = useState('TON');
  const userTonAddress = useTonAddress();

  const handleClaim = async () => {
    if (!userTonAddress) return;
    setLoading(true);
    try {
      await submitFreeTonTask({
        userId: user.id || 123456789,
        wallet: userTonAddress,
        network
      });
      setSuccess(true);
    } catch(e) {
      setError('Failed to submit. Please try again.'); setTimeout(() => setError(''), 4000);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-[var(--color-bg-primary)] z-[100] animate-in slide-in-from-right-full duration-300 flex flex-col h-[100dvh]">
       
       {/* Premium Compact Header */}
       <div className="flex justify-between items-center px-5 pt-6 pb-3">
          <div className="flex items-center gap-3">
              <div className="w-[42px] h-[42px] bg-white rounded-full flex items-center justify-center font-bold text-[var(--color-text-primary)] premium-shadow border border-[var(--color-border)]">
                 {user.first_name.charAt(0).toUpperCase()}
              </div>
              <div>
                 <h1 className="text-[15px] font-bold text-[var(--color-text-primary)] leading-tight">Maruf Earn Bot</h1>
                 <p className="text-[9px] font-semibold text-[var(--color-brand)] uppercase tracking-[0.2em]">Welcome back</p>
              </div>
          </div>
          <div className="scale-90 origin-right">
             <TonConnectButton />
          </div>
       </div>

       {/* Back Button */}
       <div className="px-5 pb-4">
           <button onClick={onBack} className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-[14px] premium-shadow border border-[var(--color-border)] text-[var(--color-text-primary)] active:bg-gray-50 transition-colors">
              <ChevronRight size={18} className="rotate-180 text-[var(--color-text-secondary)]" />
              <span className="text-[13px] font-semibold">Back</span>
           </button>
       </div>

       {/* Main Content Area */}
       <div className="flex-1 overflow-y-auto px-5 pb-8 relative w-full max-w-md mx-auto">
          
          <div className="bg-white rounded-[24px] premium-shadow border border-[var(--color-border)] overflow-hidden flex flex-col">
              
              {/* 3D Treasure Chest Hero */}
              <div className="w-full flex justify-center py-6 bg-gradient-to-b from-[var(--color-bg-primary)] to-white relative">
                  <div className="absolute inset-0 bg-[var(--color-brand)]/5 blur-3xl rounded-full scale-150" />
                  <div className="w-[160px] h-[160px] relative z-10">
                     <PremiumGiftBox />
                  </div>
              </div>

              <div className="px-6 pb-8 text-center flex-1 flex flex-col">
                  <h2 className="text-[25px] font-extrabold text-[var(--color-text-primary)] mb-1">Claim Free TON</h2>
                  <p className="text-[12px] text-[var(--color-text-secondary)] font-medium leading-relaxed max-w-[250px] mx-auto mb-8">
                      Submit your wallet to receive VIC mining reward
                  </p>

                  <div className="space-y-4 text-left w-full mx-auto">
                      
                      {/* Full Name Field */}
                      <div>
                          <label className="block text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-[0.1em] mb-2 pl-1">Full Name</label>
                          <div className="relative flex items-center">
                              <div className="absolute left-4 text-[var(--color-text-secondary)]">
                                  <User size={18} />
                              </div>
                              <input 
                                  readOnly 
                                  value={user.first_name} 
                                  className="w-full h-[52px] bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-[16px] pl-11 pr-4 text-[14px] font-medium text-[var(--color-text-primary)] outline-none shadow-inner"
                              />
                          </div>
                      </div>

                      {/* Select Network Field */}
                      <div>
                          <label className="block text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-[0.1em] mb-2 pl-1">Select Network</label>
                          <div className="relative">
                              <select 
                                  value={network} 
                                  onChange={e => setNetwork(e.target.value)}
                                  className="w-full h-[52px] bg-[#E8F8F3] border border-[var(--color-brand)] rounded-[16px] px-4 text-[14px] font-semibold text-[var(--color-text-primary)] outline-none appearance-none transition-colors focus:ring-2 focus:ring-[var(--color-brand)]/20"
                              >
                                  <option value="TON">TON</option>
                                  <option value="GRAM">GRAM</option>
                              </select>
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-brand)] pointer-events-none">
                                  <ChevronRight size={18} className="rotate-90" />
                              </div>
                          </div>
                      </div>

                      {/* Wallet Address Field */}
                      <div>
                          <label className="block text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-[0.1em] mb-2 pl-1">Wallet Address</label>
                          <div className="relative flex items-center">
                              <div className="absolute left-4 text-[var(--color-text-secondary)]">
                                  <Wallet size={18} />
                              </div>
                              <input 
                                  readOnly 
                                  value={userTonAddress || ''} 
                                  placeholder="UQ..."
                                  className="w-full h-[52px] bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-[16px] pl-11 pr-11 text-[14px] font-medium text-[var(--color-text-primary)] outline-none shadow-inner truncate"
                              />
                              <div className="absolute right-4 text-[var(--color-text-secondary)] hover:text-[var(--color-brand)] transition-colors cursor-pointer active:scale-95">
                                  <Copy size={16} />
                              </div>
                          </div>
                      </div>

                  </div>
              </div>
          </div>
       </div>

       {/* Fixed Bottom Action Area */}
       <div className="px-5 pb-8 pt-4 bg-gradient-to-t from-[var(--color-bg-primary)] via-[var(--color-bg-primary)] to-transparent shrink-0 w-full max-w-md mx-auto z-50">
          {!userTonAddress ? (
              <div className="w-full">
                  <TonConnectButton className="w-full !flex !justify-center" />
              </div>
          ) : (
              <button 
                  onClick={handleClaim} 
                  disabled={loading || success} 
                  className="w-full h-[54px] bg-[var(--color-brand)] text-white font-bold text-[15px] rounded-[15px] premium-shadow active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                  {loading ? 'PROCESSING...' : success ? 'CLAIMED SUCCESSFULLY 🎉' : 'CLAIM FREE TON'}
              </button>
          )}
       </div>

    </div>
  );
}




function PremiumBuyPage({ user }) {
    const [step, setStep] = React.useState(1);
    const [asset, setAsset] = React.useState('TON');
    const [amount, setAmount] = React.useState('');
    const [paymentMethod, setPaymentMethod] = React.useState('bKash');
    const [trxId, setTrxId] = React.useState('');
    const [receiveAddress, setReceiveAddress] = React.useState('');
    
    const [showAssetModal, setShowAssetModal] = React.useState(false);
    const [showMethodModal, setShowMethodModal] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [copied, setCopied] = React.useState(false);
    
    const [adminBkash, setAdminBkash] = React.useState("01752561935");
    const [adminNagad, setAdminNagad] = React.useState("01878580320");
    
    React.useEffect(() => {
        fetch((window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://maruf-teach-bot.onrender.com') + '/api/settings')
            .then(res => res.json())
            .then(data => {
                if(data.adminBkash) setAdminBkash(data.adminBkash);
                if(data.adminNagad) setAdminNagad(data.adminNagad);
            }).catch(e => console.log(e));
    }, []);

    const adminNumber = paymentMethod === 'bKash' ? adminBkash : adminNagad;
    
    const handleCopy = () => {
        navigator.clipboard.writeText(adminNumber);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    
    const liveCryptoRate = 1.9;
    const liveUsdBdt = 120;
    const totalCrypto = amount ? (Number(amount) / (asset === 'USDT' ? liveUsdBdt : liveCryptoRate * liveUsdBdt)).toFixed(4) : '0.00';

    const isValidStep1 = amount && paymentMethod && receiveAddress;
    const isValidStep2 = trxId;

    const handleContinue = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (parseFloat(amount) < 20) return window.Telegram?.WebApp?.showAlert("Minimum buy amount is 20 BDT");
        if (parseFloat(amount) > 30000) return window.Telegram?.WebApp?.showAlert("Maximum buy amount is 30000 BDT");
        if(isValidStep1) { setStep(2); window.scrollTo({top:0, behavior:'smooth'}); }
    };

    const handleSubmit = async () => {
        if(!isValidStep2) return;
        setLoading(true);
        try {
            await submitBuyOrder({
                userId: user?.id || 123456789,
                asset,
                amount: parseFloat(totalCrypto),
                totalBdt: parseFloat(amount),
                paymentMethod,
                trxId,
                receiveAddress: receiveAddress
            });
            setStep(3); window.scrollTo({top:0, behavior:'smooth'});
        } catch (e) {
            alert(e.message || 'Failed to submit order'); window.Telegram?.WebApp?.showAlert(e.message || 'Failed to submit order');
        }
        setLoading(false);
    };

    if (step === 3) {
        return (
            <div className="flex flex-col h-full items-center justify-center animate-in fade-in zoom-in-95 duration-500 p-6 text-center">
                <div className="w-24 h-24 bg-[#ECFDF3] rounded-full flex items-center justify-center mb-6 shadow-sm border-[6px] border-[#D1FADF]">
                    <Sparkles size={40} className="text-[#027A48]" />
                </div>
                <h2 className="text-2xl font-extrabold text-[#101828] mb-2">Payment Submitted</h2>
                <p className="text-[#475467] text-sm mb-8 leading-relaxed max-w-[260px]">
                    Your payment is being verified. We’ll process your order once verification is complete.
                </p>
                <div className="bg-white border border-[#E4E7EC] rounded-2xl p-5 w-full max-w-[300px] mb-8 shadow-sm">
                    <p className="text-xs text-[#98A2B3] font-bold uppercase tracking-wider mb-1">Order ID</p>
                    <p className="text-lg font-bold text-[#101828] mb-3">#TON-{Math.floor(Math.random() * 900000) + 100000}</p>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-xs font-bold border border-amber-200">
                        <Clock size={12} />
                        Verification Pending
                    </div>
                </div>
                <button onClick={() => { setStep(1); setAmount(''); setTrxId(''); setReceiveAddress(''); }} className="w-full bg-[#F8FAFC] text-[#475467] font-bold border border-[#E4E7EC] rounded-2xl p-4 transition-all active:scale-95 shadow-sm">
                    BACK TO HOME
                </button>
            </div>
        );
    }

    if (step === 2) {
        return (
            <div className="flex flex-col h-full animate-in slide-in-from-right duration-300 pb-24">
                <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => { setStep(1); window.scrollTo({top:0, behavior:'smooth'}); }} className="p-2 -ml-2 bg-white rounded-full shadow-sm text-[#101828]"><ArrowDown size={20} className="rotate-90" /></button>
                    <div>
                        <h2 className="text-xl font-extrabold text-[#101828] tracking-tight">Payment Verification</h2>
                        <p className="text-[#475467] text-xs mt-0.5">Submit your payment details</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 mb-6 px-2">
                    <div className="h-1.5 flex-1 bg-[#00A878] rounded-full"></div>
                    <div className="h-1.5 flex-1 bg-[#00A878] rounded-full relative">
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-[#00A878] rounded-full ring-4 ring-[#ECFDF3]"></div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl p-5 mb-5 border border-[#E4E7EC] shadow-sm">
                    <h3 className="text-sm font-bold text-[#101828] mb-4">Complete Payment</h3>
                    <div className="bg-[#F8FAFC] rounded-2xl p-4 space-y-3 mb-4">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-[#475467]">Send exactly</span>
                            <span className="text-sm font-extrabold text-[#00A878]">৳{amount} BDT</span>
                        </div>
                        <div className="h-px bg-[#E4E7EC] w-full"></div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-[#475467]">To {paymentMethod} Number</span>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-[#101828] bg-white px-2 py-1 rounded-md shadow-sm border border-[#E4E7EC]">{adminNumber}</span>
                                <button onClick={handleCopy} className={"p-1.5 rounded-md transition-colors shadow-sm " + (copied ? "bg-[#00A878] text-white" : "bg-white text-[#475467] border border-[#E4E7EC] hover:bg-gray-50")}>
                                    {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <h3 className="text-sm font-bold text-[#101828] mb-4 mt-6">Payment Details</h3>
                    <div className="space-y-4">
                        
                        <div>
                            <label className="text-[10px] font-extrabold text-[#98A2B3] block tracking-widest uppercase mb-1.5 ml-1">Transaction ID</label>
                            <div className="relative">
    <input type="text" value={trxId} onChange={e => setTrxId(e.target.value)} placeholder="8ABC123XYZ" className="w-full bg-[#F8FAFC] rounded-2xl p-4 pr-12 text-sm font-bold text-[#101828] border border-[#E4E7EC] focus:border-[#00A878] focus:ring-4 focus:ring-[#00A878]/10 transition-all outline-none" />
    <button onClick={async () => { try { const text = await navigator.clipboard.readText(); setTrxId(text); } catch(e){} }} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white text-[#98A2B3] hover:text-[#00A878] hover:bg-[#ECFDF3] rounded-lg transition-all shadow-sm border border-[#E4E7EC]">
        <ClipboardPaste size={16} />
    </button>
</div>
                        </div>
                    </div>
                </div>

                <div className="bg-[#ECFDF3] border border-[#00A878]/20 rounded-2xl p-4 flex gap-3 mb-6 shadow-sm">
                    <Info size={20} className="text-[#027A48] shrink-0 mt-0.5" />
                    <p className="text-[#027A48] text-xs font-medium leading-relaxed">Your payment will be verified before the {asset} is sent to your wallet.</p>
                </div>

                <div className="mt-auto">
                    <button onPointerDown={(e) => { if (e && e.preventDefault) e.preventDefault(); handleSubmit(); }} disabled={!isValidStep2 || loading} className="w-full bg-[#00A878] disabled:bg-[#E4E7EC] disabled:text-[#98A2B3] text-white font-extrabold rounded-2xl p-[18px] shadow-lg shadow-[#00A878]/20 active:scale-95 transition-all flex justify-center items-center gap-2">
                        {loading ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> VERIFYING...</> : 'SUBMIT FOR VERIFICATION'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
            <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-[#ECFDF3] rounded-full flex items-center justify-center text-[#00A878] border border-[#00A878]/20 shadow-sm">
                    <ArrowDown size={18} strokeWidth={2.5} />
                </div>
                <div>
                    <h2 className="text-xl font-extrabold text-[#101828] tracking-tight">Buy {asset}</h2>
                    <p className="text-[#475467] text-xs mt-0.5">Enter your order details to continue</p>
                </div>
            </div>

            <div className="flex items-center gap-2 mb-6 px-2">
                <div className="h-1.5 flex-1 bg-[#00A878] rounded-full relative">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-[#00A878] rounded-full ring-4 ring-[#ECFDF3]"></div>
                </div>
                <div className="h-1.5 flex-1 bg-[#E4E7EC] rounded-full"></div>
            </div>

            <div className="space-y-4">
                <div className="bg-white rounded-3xl p-5 border border-[#E4E7EC] shadow-sm space-y-4">
    <div>
        <label className="text-[10px] font-extrabold text-[#98A2B3] block tracking-widest uppercase mb-1.5 ml-1">Select Asset</label>
        
    <div className="relative z-50">
        <button onClick={() => setShowAssetModal(!showAssetModal)} className="w-full bg-[#F8FAFC] rounded-2xl p-4 flex items-center justify-between border border-[#E4E7EC] active:bg-gray-100 transition-colors">
            <div className="flex items-center gap-2.5">
                {asset === 'TON' ? <img src="https://cryptologos.cc/logos/toncoin-ton-logo.svg?v=035" className="w-5 h-5" alt="TON" /> : <img src="https://cryptologos.cc/logos/tether-usdt-logo.svg?v=035" className="w-5 h-5" alt="USDT" />}
                <span className="font-bold text-[#101828] text-sm">{asset}</span>
            </div>
            <ChevronDown size={18} className={"text-[#98A2B3] transition-transform " + (showAssetModal ? "rotate-180" : "")} />
        </button>
        {showAssetModal && (
            
    <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-xl shadow-xl border border-[#E4E7EC] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
        <button onClick={() => { setAsset('TON'); setShowAssetModal(false); }} className={"w-full flex items-center gap-2.5 p-4 border-b border-[#E4E7EC] hover:bg-gray-50 transition-colors " + (asset === 'TON' ? "bg-[#ECFDF3]" : "")}>
            <img src="https://cryptologos.cc/logos/toncoin-ton-logo.svg?v=035" className="w-5 h-5" alt="TON" />
            <span className={"font-bold text-sm " + (asset === 'TON' ? 'text-[#027A48]' : 'text-[#101828]')}>TON</span>
        </button>
        <button onClick={() => { setAsset('USDT'); setShowAssetModal(false); }} className={"w-full flex items-center gap-2.5 p-4 hover:bg-gray-50 transition-colors " + (asset === 'USDT' ? "bg-[#ECFDF3]" : "")}>
            <img src="https://cryptologos.cc/logos/tether-usdt-logo.svg?v=035" className="w-5 h-5" alt="USDT" />
            <span className={"font-bold text-sm " + (asset === 'USDT' ? 'text-[#027A48]' : 'text-[#101828]')}>USDT</span>
        </button>
    </div>

        )}
    </div>

    </div>
    <div>
        <label className="text-[10px] font-extrabold text-[#98A2B3] block tracking-widest uppercase mb-1.5 ml-1">Amount to Pay (BDT)</label>
        <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-sm text-[#101828]">৳</span>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full bg-[#F8FAFC] rounded-2xl p-4 pl-10 pr-14 text-sm font-bold text-[#101828] border border-[#E4E7EC] focus:border-[#00A878] focus:ring-4 focus:ring-[#00A878]/10 transition-all outline-none" />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-sm text-[#98A2B3]">BDT</span>
        </div>
        {amount && (
            <div className="mt-3 bg-[#ECFDF3] rounded-xl p-3 flex justify-between items-center border border-[#00A878]/10">
                <span className="text-xs font-bold text-[#027A48]">You will receive</span>
                <span className="text-sm font-extrabold text-[#027A48]">{totalCrypto} {asset}</span>
            </div>
        )}
    </div>
</div>

                <div className="bg-white rounded-3xl p-5 border border-[#E4E7EC] shadow-sm space-y-4">
                    <div>
                        <label className="text-[10px] font-extrabold text-[#98A2B3] block tracking-widest uppercase mb-1.5 ml-1">Payment Method</label>
                        
    
    
    
    <div className="relative z-40">
        <button onClick={() => setShowMethodModal(!showMethodModal)} className="w-full bg-[#F8FAFC] rounded-2xl p-4 flex items-center justify-between border border-[#E4E7EC] active:bg-gray-100 transition-colors">
            <div className="flex items-center gap-2.5">
                {paymentMethod === 'bKash' ? <img src="https://mohammadalinijhoom.com/wp-content/uploads/2024/07/bKash-Logo.png" className="w-5 h-5 object-contain" alt="bKash" /> : <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ1M8VPPADiai-0lEgQMNXBEir230b0dAn61cgVHRVQat7qn3-H0L4m1Zg&s=10" className="w-5 h-5 object-contain" alt="Nagad" />}
                <span className="font-bold text-[#101828] text-sm">{paymentMethod}</span>
            </div>
            <ChevronDown size={18} className={"text-[#98A2B3] transition-transform " + (showMethodModal ? "rotate-180" : "")} />
        </button>
        {showMethodModal && (
            
    <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-xl shadow-xl border border-[#E4E7EC] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-40">
        <button onClick={() => { setPaymentMethod('bKash'); setShowMethodModal(false); }} className={"w-full flex items-center justify-between p-4 border-b border-[#E4E7EC] hover:bg-gray-50 transition-colors " + (paymentMethod === 'bKash' ? "bg-[#ECFDF3]" : "")}>
            <div className="flex items-center gap-2.5">
                <img src="https://mohammadalinijhoom.com/wp-content/uploads/2024/07/bKash-Logo.png" className="w-5 h-5 object-contain" alt="bKash" />
                <span className={"font-bold text-sm " + (paymentMethod === 'bKash' ? 'text-[#027A48]' : 'text-[#101828]')}>bKash</span>
            </div>
            {paymentMethod === 'bKash' && <Sparkles size={14} className="text-[#00A878]"/>}
        </button>
        <button onClick={() => { setPaymentMethod('Nagad'); setShowMethodModal(false); }} className={"w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors " + (paymentMethod === 'Nagad' ? "bg-[#ECFDF3]" : "")}>
            <div className="flex items-center gap-2.5">
                <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ1M8VPPADiai-0lEgQMNXBEir230b0dAn61cgVHRVQat7qn3-H0L4m1Zg&s=10" className="w-5 h-5 object-contain" alt="Nagad" />
                <span className={"font-bold text-sm " + (paymentMethod === 'Nagad' ? 'text-[#027A48]' : 'text-[#101828]')}>Nagad</span>
            </div>
            {paymentMethod === 'Nagad' && <Sparkles size={14} className="text-[#00A878]"/>}
        </button>
    </div>

        )}
    </div>

    </div>
                    <div>
                        <label className="text-[10px] font-extrabold text-[#98A2B3] block tracking-widest uppercase mb-1.5 ml-1">Receive Address ({asset})</label>
                        <input type="text" value={receiveAddress} onChange={e => setReceiveAddress(e.target.value)} placeholder={"Paste your " + asset + " address"} className="w-full bg-[#F8FAFC] rounded-2xl p-4 text-sm font-bold text-[#101828] border border-[#E4E7EC] focus:border-[#00A878] focus:ring-4 focus:ring-[#00A878]/10 transition-all outline-none" />
                    </div>
                </div>
            </div>

            <div className="mt-6">
                <button onPointerDown={handleContinue} disabled={!isValidStep1} className="w-full bg-[#101828] disabled:bg-[#101828]/50 disabled:cursor-not-allowed text-white font-extrabold rounded-2xl p-4 shadow-lg shadow-black/20 active:scale-95 transition-all text-sm tracking-wide">
        PAYMENT
    </button>
            </div>

             

             
        </div>
    );
}



function PremiumSellPage({ user }) {
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState(null);
  const [txMessage, setTxMessage] = useState('');
  const [asset, setAsset] = useState('USDT');
  
  // Bidirectional Input State
  const [inputType, setInputType] = useState('crypto'); // 'crypto' or 'fiat'
  const [cryptoAmount, setCryptoAmount] = useState('');
  const [fiatAmount, setFiatAmount] = useState('');
  
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [liveCryptoRate, setLiveCryptoRate] = useState(1.9);
  const [liveUsdBdt, setLiveUsdBdt] = useState(120);

  const userTonAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();

  useEffect(() => {
     const fetchPrice = async () => {
         try {
             const cached = localStorage.getItem('maruf_crypto_rates');
             if (cached) {
                 const parsed = JSON.parse(cached);
                 const now = Date.now();
                 if (now - parsed.timestamp < 3600000) {
                     setLiveCryptoRate(parsed.tonPrice);
                     setLiveUsdBdt(parsed.usdBdt);
                     return;
                 }
             }

             const resTon = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=TONUSDT');
             const dataTon = await resTon.json();
             const tonPrice = parseFloat(dataTon.price) || 1.9;

             const resBdt = await fetch('https://open.er-api.com/v6/latest/USD');
             const dataBdt = await resBdt.json();
             const usdBdt = dataBdt.rates.BDT || 120;

             localStorage.setItem('maruf_crypto_rates', JSON.stringify({
                 tonPrice, usdBdt, timestamp: Date.now()
             }));

             setLiveCryptoRate(tonPrice);
             setLiveUsdBdt(usdBdt);
         } catch(e) {
             console.error("Failed to fetch live price", e);
             const cached = localStorage.getItem('maruf_crypto_rates');
             if (cached) {
                 const parsed = JSON.parse(cached);
                 setLiveCryptoRate(parsed.tonPrice);
                 setLiveUsdBdt(parsed.usdBdt);
             }
         }
     };
     fetchPrice();
     const interval = setInterval(fetchPrice, 60000);
     return () => clearInterval(interval);
  }, []);

  const profitMargin = 0.90; // We take 10% profit
  const marketRate = asset === 'USDT' ? liveUsdBdt : (liveCryptoRate * liveUsdBdt);
  const rate = marketRate * profitMargin;

  // Sync the inputs whenever one changes or asset changes
  useEffect(() => {
      if (inputType === 'crypto') {
          if (!cryptoAmount) {
              setFiatAmount('');
          } else {
              setFiatAmount(Math.floor(parseFloat(cryptoAmount) * rate).toString());
          }
      } else {
          if (!fiatAmount) {
              setCryptoAmount('');
          } else {
              setCryptoAmount((parseFloat(fiatAmount) / rate).toFixed(4));
          }
      }
  }, [cryptoAmount, fiatAmount, inputType, asset, rate]);

  useEffect(() => {
     if(showKeyboard) {
        setTimeout(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, 100);
     }
  }, [showKeyboard]);

  const handleKeyPress = (key) => {
     if (inputType === 'crypto') {
         if (key === 'del') {
            setCryptoAmount(prev => prev.slice(0, -1));
         } else if (key === '.') {
            if (!cryptoAmount.includes('.')) setCryptoAmount(prev => prev + (prev === '' ? '0.' : '.'));
         } else {
            if (cryptoAmount.length < 10) setCryptoAmount(prev => prev + key);
         }
     } else {
         // Fiat input (no decimals allowed)
         if (key === 'del') {
            setFiatAmount(prev => prev.slice(0, -1));
         } else if (key === '.') {
            // Do nothing, no dot allowed in BDT
         } else {
            if (fiatAmount.length < 10) setFiatAmount(prev => prev + key);
         }
     }
  };

  const handleSell = async (e) => {
    if(e.preventDefault) e.preventDefault();
    if(!userTonAddress || !cryptoAmount || !fiatAmount) return;
    
    if (parseFloat(fiatAmount) < 1) return window.Telegram?.WebApp?.showAlert("Minimum sell amount is 1 BDT");
    if (parseFloat(fiatAmount) > 20000) return window.Telegram?.WebApp?.showAlert("Maximum sell amount is 20000 BDT");
    
    setLoading(true);
    let pendingOrderId = null;
    
    try {
      const txRes = await buildTransaction({
          asset,
          amount: parseFloat(cryptoAmount),
          userAddress: userTonAddress,
          adminWallet: "UQC7hYHfrVJ_uT_esMr7vCv1bVh5ytQxYUUjRDiTUiG9s5Fb"
      });
      if (!txRes.success) throw new Error(txRes.error || "Failed to build transaction");

      // 1. Submit pending order to DB before confirming in wallet (in case app closes)
      const pendingRes = await submitSellOrder({
        userId: user?.id || WebApp.initDataUnsafe?.user?.id || 123456789, 
        asset, 
        amount: parseFloat(cryptoAmount), 
        estimatedTk: parseFloat(fiatAmount), 
        wallet: userTonAddress,
        status: 'pending'
      });
      
      if (pendingRes && pendingRes.orderId) {
          pendingOrderId = pendingRes.orderId;
      }

      // 2. Open wallet and send
      await tonConnectUI.sendTransaction(txRes.tx);

      // 3. Mark completed and add TK to user balance
      await submitSellOrder({
        userId: user?.id || WebApp.initDataUnsafe?.user?.id || 123456789, 
        asset, 
        amount: parseFloat(cryptoAmount), 
        estimatedTk: parseFloat(fiatAmount), 
        wallet: userTonAddress,
        orderId: pendingOrderId,
        status: 'completed'
      });
      
      if (window.reloadGlobalData) window.reloadGlobalData();

      setTxStatus('success');
      setTxMessage('Successfully swapped to TK BDT');
      setCryptoAmount('');
      setFiatAmount('');
      setShowKeyboard(false);
      setTimeout(() => setTxStatus(null), 3000);
    } catch(e) {
      setTxStatus('error');
      setTxMessage('There will be no changes to your account.');
      setTimeout(() => setTxStatus(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const AssetIcon = () => {
      if (asset === 'USDT') return <CircleDollarSign size={14} className="text-emerald-500" />;
      return <Gem size={14} className="text-blue-500" />;
  };

  return (
    <>
      {showKeyboard && (
          <style>{`
              .fixed.bottom-0.z-50.flex.justify-center { display: none !important; }
              #main-app-header { max-height: 0px !important; opacity: 0 !important; pointer-events: none; margin: 0 !important; padding: 0 !important; overflow: hidden; }
              body { overflow: hidden !important; }
          `}</style>
      )}
      <div className={`animate-in fade-in max-w-md mx-auto relative h-full transition-all duration-300 ease-out ${showKeyboard ? 'pb-[280px] pt-4' : 'pb-24'}`}>
        
        {showKeyboard && (
           <div className="flex items-center mb-4 animate-in slide-in-from-top-4 duration-300">
               <button onClick={() => setShowKeyboard(false)} className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-[var(--color-border)] premium-shadow active-scale transition-colors text-[var(--color-text-primary)]">
                  <ChevronDown size={16} className="rotate-90" />
                  <span className="text-[11px] font-bold">Back</span>
               </button>
           </div>
        )}
        <div className="glass-panel p-4 rounded-[28px] relative overflow-visible z-10 transition-all duration-300 hover:premium-shadow">
           
           <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 bg-[var(--color-brand)]/10 rounded-full flex items-center justify-center text-[var(--color-brand)] shadow-inner">
                  <ArrowRightLeft size={16} strokeWidth={2.5} />
              </div>
              <h2 className="text-lg font-extrabold text-[var(--color-text-primary)] tracking-tight">Swap to Taka</h2>
           </div>
           {!showKeyboard && (
              <>
                 <p className="text-[var(--color-text-secondary)] text-[11px] mb-5 font-medium tracking-wide">
                               Instantly convert Crypto to TK. Securely via Tonkeeper.
                            </p>
                            
                            <div className="flex items-center justify-center mb-5">
                               {!userTonAddress ? (
                                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50/80 border border-red-100/50 rounded-full">
                                     <div className="w-1.5 h-1.5 bg-[var(--color-danger)] rounded-full animate-pulse" />
                                     <span className="text-[9px] font-bold text-[var(--color-danger)] tracking-[0.1em] uppercase">Wallet Disconnected</span>
                                  </div>
                               ) : (
                                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--color-brand)]/5 border border-[var(--color-brand)]/10 rounded-full">
                                     <div className="w-1.5 h-1.5 bg-[var(--color-brand)] rounded-full" />
                                     <span className="text-[9px] font-bold text-[var(--color-brand)] tracking-[0.1em] uppercase">Wallet Connected</span>
                                  </div>
                               )}
                            </div>
              </>
           )}

           <div className="space-y-1.5 relative z-10">
              <div onClick={() => { setInputType('crypto'); setShowKeyboard(true); }} className={`p-3.5 rounded-[22px] cursor-pointer transition-all duration-300 ${showKeyboard && inputType === 'crypto' ? 'glass-button ring-1 ring-[var(--color-brand)]/50' : 'glass-input-container input-shadow'}`}>
               <div className="flex justify-between items-center mb-3">
                  <label className={`text-[10px] font-bold uppercase tracking-[0.15em] ${inputType === 'crypto' ? 'text-[var(--color-brand)]' : 'text-[var(--color-text-secondary)]'}`}>You Pay</label>
                  
                  <div className="relative">
                     <div onClick={(e) => { e.stopPropagation(); setShowAssetModal(!showAssetModal); }} className="flex items-center gap-2 bg-white border border-[var(--color-border)] rounded-full px-2.5 py-1.5 cursor-pointer hover:border-[var(--color-brand)]/50 transition-colors shadow-sm active-scale z-10">
                        <AssetIcon />
                        <span className="text-[11px] font-extrabold text-[var(--color-text-primary)]">{asset}</span>
                        <ChevronDown size={14} className="text-[var(--color-text-secondary)] ml-0.5" />
                     </div>
                     
                     {showAssetModal && (
                        <>
                           <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setShowAssetModal(false); }}></div>
                           {asset !== 'USDT' && (
                              <button onClick={(e) => { e.stopPropagation(); setAsset('USDT'); setShowAssetModal(false); }} className="absolute left-0 right-0 top-full mt-2 w-full flex items-center justify-center gap-2 bg-white border border-[var(--color-border)] rounded-full px-2.5 py-1.5 hover:border-[var(--color-brand)]/50 transition-colors shadow-sm active-scale z-50 animate-in fade-in zoom-in-95 duration-200">
                                 <CircleDollarSign size={14} className="text-emerald-500" />
                                 <span className="text-[11px] font-extrabold text-[var(--color-text-primary)]">USDT</span>
                              </button>
                           )}
                           {asset !== 'GRAM' && (
                              <button onClick={(e) => { e.stopPropagation(); setAsset('GRAM'); setShowAssetModal(false); }} className="absolute left-0 right-0 top-full mt-2 w-full flex items-center justify-center gap-2 bg-white border border-[var(--color-border)] rounded-full px-2.5 py-1.5 hover:border-[var(--color-brand)]/50 transition-colors shadow-sm active-scale z-50 animate-in fade-in zoom-in-95 duration-200">
                                 <Gem size={14} className="text-blue-500" />
                                 <span className="text-[11px] font-extrabold text-[var(--color-text-primary)]">GRAM</span>
                              </button>
                           )}
                        </>
                     )}
                  </div>
               </div>
                 
               <div className="flex items-baseline">
                  <div className={`text-4xl font-black tracking-tight ${cryptoAmount ? 'text-[var(--color-text-primary)]' : 'text-gray-300'}`}>
                     {cryptoAmount || '0'}
                  </div>
                  {inputType === 'crypto' && showKeyboard && (
                      <span className="w-0.5 h-8 bg-[var(--color-brand)] animate-pulse ml-1 rounded-full"></span>
                  )}
               </div>
               
               <div className="mt-2 text-[10px] font-bold text-[var(--color-text-secondary)]/70 uppercase tracking-widest">
                  Enter {asset} amount
               </div>
              </div>

              {/* Swap Icon */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                  <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md border border-[var(--color-border)]/50">
                      <ArrowDownUp size={16} className="text-[var(--color-text-secondary)]" />
                  </div>
              </div>

              {/* Fiat Receive Block */}
              <div onClick={() => { setInputType('fiat'); setShowKeyboard(true); }} className={`p-3.5 rounded-[22px] cursor-pointer transition-all duration-300 ${showKeyboard && inputType === 'fiat' ? 'glass-button ring-1 ring-[var(--color-brand)]/50' : 'glass-input-container input-shadow'}`}>
               <div className="flex justify-between items-center mb-3">
                  <label className={`text-[10px] font-bold uppercase tracking-[0.15em] ${inputType === 'fiat' ? 'text-[var(--color-brand)]' : 'text-[var(--color-text-secondary)]'}`}>You Receive</label>
                  
                  <div className="flex items-center gap-1.5 bg-emerald-50/50 border border-emerald-100/50 rounded-full px-2.5 py-1">
                      <span className="text-[9px] font-black text-emerald-600 tracking-widest">TK BDT</span>
                  </div>
               </div>
                 
               <div className="flex items-baseline">
                  <div className={`text-4xl font-black tracking-tight ${fiatAmount ? 'text-[var(--color-text-primary)]' : 'text-gray-300'}`}>
                     {fiatAmount || '0'}
                  </div>
                  {inputType === 'fiat' && showKeyboard && (
                      <span className="w-0.5 h-8 bg-[var(--color-brand)] animate-pulse ml-1 rounded-full"></span>
                  )}
               </div>
               <div className="mt-2 text-[10px] font-bold text-[var(--color-text-secondary)]/70 uppercase tracking-widest">
                  Enter Taka amount
               </div>
              </div>
           </div>

           {!showKeyboard && (
              <div className="mt-6 mb-2">
                 <button onPointerDown={handleSell} disabled={loading || !cryptoAmount || parseFloat(cryptoAmount) <= 0 || !userTonAddress} className={`w-full py-4 rounded-2xl font-extrabold text-sm tracking-[0.1em] transition-all duration-300 ${!userTonAddress ? 'bg-gray-100 text-gray-400' : loading ? 'bg-[var(--color-brand)]/70 text-white' : 'bg-[var(--color-brand)] text-white premium-shadow active-scale'}`}>
                    {loading ? (
                        <div className="flex items-center justify-center gap-2">
                            <Loader2 size={18} className="animate-spin" />
                            <span>PROCESSING...</span>
                        </div>
                    ) : !userTonAddress ? (
                        "CONNECT WALLET FIRST"
                    ) : (
                        "CONFIRM SWAP"
                    )}
                 </button>
              </div>
           )}
        </div>

        {/* Custom Numpad Keyboard */}
        <div className={`fixed bottom-0 left-0 w-full bg-[#f2f4f7] rounded-t-[32px] p-5 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] z-[60] transition-transform duration-300 ease-out ${showKeyboard ? 'translate-y-0' : 'translate-y-full pointer-events-none'}`}>
          <div className="flex justify-between items-center mb-4 px-2">
             <span className="text-[10px] font-extrabold text-[#98A2B3] tracking-[0.2em] uppercase">ENTER AMOUNT</span>
             <button onClick={() => setShowKeyboard(false)} className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm text-[#475467] active:scale-90 transition-transform">
                <ChevronDown size={18} />
             </button>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
             {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(key => (
                <button key={key} onClick={() => handleKeyPress(key)} className="h-14 bg-white rounded-2xl text-2xl font-semibold text-[#101828] active:bg-[#E4E7EC] active:scale-95 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
                   {key}
                </button>
             ))}
             <button onClick={() => handleKeyPress('.')} className={`h-14 bg-white rounded-2xl text-2xl font-bold text-[#101828] active:bg-[#E4E7EC] active:scale-95 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] ${inputType === 'fiat' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                .
             </button>
             <button onClick={() => handleKeyPress('0')} className="h-14 bg-white rounded-2xl text-2xl font-semibold text-[#101828] active:bg-[#E4E7EC] active:scale-95 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
                0
             </button>
             <button onClick={() => handleKeyPress('del')} className="h-14 bg-white rounded-2xl flex justify-center items-center text-[#475467] active:bg-[#E4E7EC] active:scale-95 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
                <Delete size={24} />
             </button>
          </div>

          <button onPointerDown={handleSell} disabled={loading || !cryptoAmount || parseFloat(cryptoAmount) <= 0} className="w-full mt-4 h-14 bg-[#101828] disabled:bg-[#101828]/50 text-white rounded-2xl font-extrabold tracking-wide text-sm active:scale-95 transition-all shadow-lg shadow-[#101828]/20 flex items-center justify-center gap-2">
             {loading ? <Loader2 size={18} className="animate-spin" /> : 'CONFIRM SWAP'}
          </button>
        </div>

        <TransactionStatusModal status={txStatus} message={txMessage} />
      </div>
    </>
  );
}

function HistoryPage({ user, onBack }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const userId = user?.id || 123456789;
                const isLocal = window.location.hostname === 'localhost' || window.location.hostname.includes('192.168');
                const API_URL = isLocal ? 'http://localhost:3000' : 'https://maruf-teach-bot.onrender.com';
                const res = await fetch(`${API_URL}/api/miniapp/history/${userId}`);
                const data = await res.json();
                if(data.success) {
                    setHistory(data.history);
                }
            } catch(e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [user]);

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 pb-20 max-w-md mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <button onClick={onBack} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 active:scale-95 transition-transform text-gray-600">
                    <ChevronRight size={20} className="rotate-180" />
                </button>
                <h2 className="text-xl font-extrabold text-gray-900">Transaction History</h2>
            </div>
            
            {loading ? (
                <div className="flex justify-center py-10">
                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : history.length === 0 ? (
                <div className="bg-white p-8 rounded-[24px] text-center shadow-sm border border-gray-100 flex flex-col items-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-4">
                        <Clock size={24} />
                    </div>
                    <p className="font-bold text-gray-900 mb-1">No Transactions Yet</p>
                    <p className="text-sm text-gray-500">Your buying and selling history will appear here.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {history.map((tx, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-[20px] shadow-sm border border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${tx.type === 'buy' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                    {tx.type === 'buy' ? <ArrowDown size={20} /> : <ArrowUp size={20} />}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 capitalize">{tx.type} {tx.asset}</p>
                                    <p className="text-[11px] font-medium text-gray-400 mt-0.5">{new Date(tx.timestamp?._seconds * 1000 || Date.now()).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-extrabold text-gray-900">{tx.amount} {tx.asset}</p>
                                <p className={`text-[11px] font-bold mt-0.5 ${tx.status === 'completed' ? 'text-emerald-500' : tx.status === 'pending' ? 'text-orange-500' : 'text-red-500'}`}>
                                    {tx.status?.toUpperCase() || 'PENDING'}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}


function ProfilePage({ user, balance, fiatWallet, fiatWithdrawPending, onGoToWithdraw, setFiatWallet, reloadData }) {
  const [withdrawing, setWithdrawing] = useState(false);

  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletMethod, setWalletMethod] = useState('bKash');
  const [showMethodDropdown, setShowMethodDropdown] = useState(false);
  const [walletNumber, setWalletNumber] = useState('');
  const [walletName, setWalletName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [txStatus, setTxStatus] = useState(null);
  const [txMessage, setTxMessage] = useState('');
  
  const handleWithdrawClick = () => {
      if (fiatWallet) {
          onGoToWithdraw();
      } else {
          setShowWalletModal(true);
      }
  };

  const handleSaveWallet = async () => {
      if (!walletNumber || !walletName) return;
      setIsSaving(true);
      try {
          await saveFiatWallet({
              userId: user?.id || WebApp.initDataUnsafe?.user?.id,
              method: walletMethod,
              number: walletNumber,
              name: walletName
          });
          setFiatWallet({ method: walletMethod, number: walletNumber, name: walletName });
          setShowWalletModal(false);
          onGoToWithdraw();
      } catch (e) {
          WebApp.showAlert(e.message || 'Failed to save wallet');
      } finally {
          setIsSaving(false);
      }
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 max-w-md mx-auto">
      <div className="bg-white p-6 rounded-[24px] premium-shadow border border-[var(--color-border)] flex items-center gap-5 relative overflow-hidden">
         <div className="absolute -right-4 -top-4 w-24 h-24 bg-[var(--color-brand)]/5 rounded-full blur-2xl pointer-events-none" />
         <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center text-[var(--color-brand)] font-bold text-2xl relative z-10">
            {user?.first_name?.charAt(0)?.toUpperCase() || 'U'}
         </div>
         <div className="relative z-10">
            <h2 className="text-xl font-bold text-[var(--color-text-primary)]">{user?.first_name || 'User'}</h2>
            <p className="text-[var(--color-text-secondary)] text-sm font-medium">@{user?.username || 'user'}</p>
         </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
         <div className="bg-white p-5 rounded-[20px] premium-shadow border border-[var(--color-border)] flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-brand)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <p className="text-[10px] font-semibold text-[var(--color-text-secondary)] mb-1 uppercase tracking-wide">Available Balance</p>
            <p className="text-xl font-bold text-[var(--color-text-primary)]">{balance} <span className="text-[var(--color-brand)] text-sm">TK</span></p>
         </div>
         <div className="bg-white p-5 rounded-[20px] premium-shadow border border-[var(--color-border)] flex flex-col justify-center">
            <p className="text-[10px] font-semibold text-[var(--color-text-secondary)] mb-1 uppercase tracking-wide">User ID</p>
            <p className="text-sm font-mono font-bold text-[var(--color-text-primary)] flex items-center gap-2" onClick={() => { navigator.clipboard.writeText(user?.id); WebApp.HapticFeedback.impactOccurred('light'); }}>
               {user?.id || '000000'} <Copy size={12} className="text-[var(--color-text-secondary)] active:text-[var(--color-brand)] transition-colors" />
            </p>
         </div>
      </div>

      <button onClick={handleWithdrawClick} disabled={withdrawing} className="w-full bg-gradient-to-r from-[var(--color-brand)] to-emerald-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-[var(--color-brand)]/30 active:scale-[0.98] transition-all disabled:opacity-70 group relative overflow-hidden flex items-center justify-center gap-2">
         {withdrawing ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> PROCESSING...</>
         ) : (
            <><Wallet size={18} /> WITHDRAW BALANCE</>
         )}
         <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
      </button>

      <div className="bg-white p-5 rounded-[24px] premium-shadow border border-[var(--color-border)] flex justify-between items-center mt-2 group active:scale-[0.98] transition-transform cursor-pointer">
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
      {/* Wallet Setup Modal */}
      {showWalletModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="bg-white rounded-[28px] p-6 w-full max-w-[320px] premium-shadow border border-[var(--color-border)] animate-in zoom-in-95 slide-in-from-bottom-4">
                  <div className="flex justify-between items-center mb-5">
                      <h3 className="text-xl font-extrabold text-[var(--color-text-primary)]">Wallet Setup</h3>
                      <button onClick={() => setShowWalletModal(false)} className="p-2 bg-gray-100 rounded-full text-gray-500 hover:text-gray-800">
                          <X size={16} strokeWidth={3} />
                      </button>
                  </div>
                  
                  <div className="space-y-4">
                      <div>
                          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Select Method</label>
                          <div className="relative">
                              <div onClick={() => setShowMethodDropdown(!showMethodDropdown)} className="w-full h-[52px] bg-gray-50 border border-gray-200 rounded-[16px] px-4 flex items-center justify-between cursor-pointer hover:border-[var(--color-brand)]/50 transition-all">
                                  <div className="flex items-center gap-3">
                                      <img src={walletMethod === 'bKash' ? 'https://mohammadalinijhoom.com/wp-content/uploads/2024/07/bKash-Logo.png' : 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRPpmAeJ7t7z55yJVOQLeKQazhA8FjJvfKDSrobAhxljA&s=10'} alt={walletMethod} className="w-6 h-6 rounded-full object-cover border border-gray-200" />
                                      <span className="font-bold text-[var(--color-text-primary)]">{walletMethod}</span>
                                  </div>
                                  <ChevronRight size={16} className={`text-gray-400 transition-transform ${showMethodDropdown ? '-rotate-90' : 'rotate-90'}`} />
                              </div>
                              
                              {showMethodDropdown && (
                                  <>
                                      <div className="fixed inset-0 z-40" onClick={() => setShowMethodDropdown(false)}></div>
                                      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-[14px] premium-shadow border border-[var(--color-border)] overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                                          {['bKash', 'Nagad'].filter(method => method !== walletMethod).map(method => (
                                              <button key={method} onClick={() => { setWalletMethod(method); setShowMethodDropdown(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 active:bg-gray-100 transition-colors">
                                                  <img src={method === 'bKash' ? 'https://mohammadalinijhoom.com/wp-content/uploads/2024/07/bKash-Logo.png' : 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRPpmAeJ7t7z55yJVOQLeKQazhA8FjJvfKDSrobAhxljA&s=10'} alt={method} className="w-6 h-6 rounded-full object-cover border border-gray-100" />
                                                  <span className="font-bold text-[14px] text-[var(--color-text-primary)]">{method}</span>
                                              </button>
                                          ))}
                                      </div>
                                  </>
                              )}
                          </div>
                      </div>
                      
                      <div>
                          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Wallet Number</label>
                          <input type="tel" placeholder="e.g. 017XXXXXXXX" value={walletNumber} onChange={(e) => setWalletNumber(e.target.value)} className="w-full h-[52px] bg-gray-50 border border-gray-200 rounded-[16px] px-4 font-bold text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/20 transition-all placeholder:text-gray-300 placeholder:font-medium" />
                      </div>

                      <div>
                          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Account Name</label>
                          <input type="text" placeholder="Enter Full Name" value={walletName} onChange={(e) => setWalletName(e.target.value)} className="w-full h-[52px] bg-gray-50 border border-gray-200 rounded-[16px] px-4 font-bold text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/20 transition-all placeholder:text-gray-300 placeholder:font-medium" />
                      </div>
                  </div>

                  <button onClick={handleSaveWallet} disabled={!walletNumber || !walletName || isSaving} className="w-full h-[52px] mt-6 bg-[var(--color-text-primary)] text-white rounded-[16px] font-bold text-[14px] flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50">
                      {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
                      SAVE WALLET
                  </button>
              </div>
          </div>
      )}

      {txStatus && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white rounded-[28px] p-6 w-full max-w-[300px] flex flex-col items-center text-center premium-shadow animate-in zoom-in-95 slide-in-from-bottom-4">
              {txStatus === 'success' ? (
                 <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                 </div>
              ) : (
                 <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                 </div>
              )}
              <h3 className={`text-xl font-extrabold mb-2 ${txStatus === 'success' ? 'text-emerald-500' : 'text-red-500'}`}>
                 {txStatus === 'success' ? 'Success!' : 'Error'}
              </h3>
              <p className="text-[13px] font-semibold text-[var(--color-text-secondary)] mb-6">{txMessage}</p>
              <button onClick={() => setTxStatus(null)} className="w-full h-[48px] bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-2xl transition-colors">
                 Close
              </button>
           </div>
        </div>
      )}
    </div>
  );
}








function WithdrawFiatPage({ user, balance, fiatWallet, fiatWithdrawPending, onBack, reloadData }) {
    const [amount, setAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        if (!fiatWithdrawPending || fiatWithdrawPending.status !== 'waiting' || !fiatWithdrawPending.endTime) return;
        const interval = setInterval(() => {
            const now = Date.now();
            const diff = fiatWithdrawPending.endTime - now;
            if (diff <= 0) {
                setTimeLeft('Processing soon...');
                clearInterval(interval);
            } else {
                const h = Math.floor(diff / 3600000);
                const m = Math.floor((diff % 3600000) / 60000);
                const s = Math.floor((diff % 60000) / 1000);
                if (h > 0) setTimeLeft(`${h}h ${m}m ${s}s`);
                else setTimeLeft(`${m}m ${s}s`);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [fiatWithdrawPending]);

    const handleMax = () => setAmount(balance.toString());

    const handleSubmit = async () => {
          const amt = parseFloat(amount);
          if (!amount || isNaN(amt) || amt <= 0) return window.Telegram?.WebApp?.showAlert("Invalid amount") || alert("Invalid amount");
          if (amt < 20) return window.Telegram?.WebApp?.showAlert("Minimum withdraw amount is 20 BDT") || alert("Minimum withdraw amount is 20 BDT");
          if (amt > balance) return window.Telegram?.WebApp?.showAlert("Insufficient balance") || alert("Insufficient balance");
          
          setIsSubmitting(true);
          try {
              await withdrawFiat({
                  userId: user?.id || 123456789,
                  amount: amt,
                  fee: parseFloat((amt * 0.05).toFixed(2)),
                  receiveAmount: parseFloat((amt * 0.95).toFixed(2))
              });
              if(window.Telegram?.WebApp?.showAlert) window.Telegram.WebApp.showAlert("Withdrawal submitted successfully!");
              else alert("Withdrawal submitted successfully!");
              reloadData();
          } catch (e) {
              if(window.Telegram?.WebApp?.showAlert) window.Telegram.WebApp.showAlert(e.message || "Withdrawal failed");
              else alert(e.message || "Withdrawal failed");
          } finally {
              setIsSubmitting(false);
          }
      };

    const getLogo = () => {
        if (fiatWallet?.method === 'bKash') return "https://mohammadalinijhoom.com/wp-content/uploads/2024/07/bKash-Logo.png";
        return "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRPpmAeJ7t7z55yJVOQLeKQazhA8FjJvfKDSrobAhxljA&s=10";
    };

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 max-w-md mx-auto pb-24">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <button onClick={onBack} className="p-2.5 bg-white rounded-full premium-shadow text-[var(--color-text-primary)] active:scale-95 transition-transform">
                    <ChevronRight size={20} className="rotate-180" strokeWidth={3} />
                </button>
                <div>
                    <h2 className="text-xl font-extrabold text-[var(--color-text-primary)]">Withdraw Funds</h2>
                    <p className="text-[var(--color-text-secondary)] text-xs font-medium">Cashout to {fiatWallet?.method}</p>
                </div>
            </div>

            {fiatWithdrawPending ? (
                <div className="bg-white p-6 rounded-[24px] premium-shadow border border-[var(--color-border)] text-center relative overflow-hidden">
                    <div className="w-16 h-16 mx-auto bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mb-4 relative">
                        <div className="absolute inset-0 border-4 border-orange-500/20 rounded-full animate-ping" />
                        <Clock size={32} strokeWidth={2.5} />
                    </div>
                    <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">Withdrawal Pending</h3>
                    <p className="text-[var(--color-text-secondary)] text-sm font-medium mb-5">Your request for {fiatWithdrawPending.amount} BDT is being processed.</p>
                    
                    {fiatWithdrawPending.status === 'waiting' && timeLeft && (
                        <div className="bg-orange-50 border border-orange-100 rounded-[16px] p-4 inline-block min-w-[200px]">
                            <p className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-1">Estimated Time</p>
                            <p className="text-2xl font-black text-orange-600 tracking-tight">{timeLeft}</p>
                        </div>
                    )}
                </div>
            ) : (
                <>
                    {/* Amount Input */}
                    <div className="bg-white p-5 rounded-[24px] premium-shadow border border-[var(--color-border)]">
                        <label className="flex justify-between items-center mb-3">
                            <span className="text-[11px] font-extrabold text-[var(--color-text-secondary)] uppercase tracking-[0.2em]">Amount (BDT)</span>
                            <span className="text-[11px] font-bold text-[var(--color-text-primary)]">Bal: {balance.toFixed(2)}</span>
                        </label>
                        <div className="relative flex items-center">
                            <span className="absolute left-4 text-gray-400 font-medium">৳</span>
                            <input 
                                type="number" 
                                value={amount} 
                                onChange={(e) => setAmount(e.target.value)} 
                                placeholder="0.00" 
                                className="w-full h-[60px] bg-gray-50 border border-gray-100 rounded-[16px] pl-8 pr-20 font-black text-2xl text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)] focus:bg-white focus:ring-4 focus:ring-[var(--color-brand)]/10 transition-all placeholder:text-gray-300"
                            />
                            <button onClick={handleMax} className="absolute right-3 px-3 py-1.5 bg-[var(--color-brand)]/10 text-[var(--color-brand)] font-bold text-[11px] rounded-full active:scale-95 transition-transform">MAX</button>
                        </div>
                    </div>
                      {amount && !isNaN(amount) && parseFloat(amount) > 0 && (
                          <div className="bg-[#F8FAFC] p-4 rounded-[20px] border border-[#E4E7EC] shadow-sm mb-2 mt-2">
                              <div className="flex justify-between items-center text-sm mb-2">
                                  <span className="text-[#475467] font-medium">Withdraw Amount</span>
                                  <span className="font-bold text-[#101828]">৳ {parseFloat(amount).toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between items-center text-sm mb-2">
                                  <span className="text-red-500 font-medium">Fee (5%)</span>
                                  <span className="font-bold text-red-500">- ৳ {(parseFloat(amount) * 0.05).toFixed(2)}</span>
                              </div>
                              <div className="h-px bg-[#E4E7EC] my-2 w-full"></div>
                              <div className="flex justify-between items-center text-sm">
                                  <span className="text-[#00A878] font-bold">You will receive</span>
                                  <span className="font-black text-[#00A878]">৳ {(parseFloat(amount) * 0.95).toFixed(2)}</span>
                              </div>
                          </div>
                      )}

                    {/* Saved Wallet Info */}
                    <div className="bg-white p-5 rounded-[24px] premium-shadow border border-[var(--color-border)] flex items-center gap-4">
                        <img src={getLogo()} alt={fiatWallet?.method} className="w-12 h-12 rounded-full object-cover border border-gray-100 p-1" />
                        <div>
                            <h4 className="text-[15px] font-bold text-[var(--color-text-primary)] tracking-tight">{fiatWallet?.method} Wallet</h4>
                            <p className="text-sm font-bold text-[var(--color-text-secondary)]">{fiatWallet?.number}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{fiatWallet?.name}</p>
                        </div>
                    </div>

                    {/* Warning Note */}
                    <div className="bg-blue-50/50 border border-blue-100/50 p-4 rounded-[20px] flex gap-3">
                        <Info size={20} className="text-blue-500 shrink-0" />
                        <p className="text-[11px] text-blue-600 font-medium leading-relaxed">
                            Withdrawals may take <strong className="font-bold">1 to 2 hours</strong> or up to <strong className="font-bold">24 hours</strong> to be processed securely.
                        </p>
                    </div>

                    {/* Submit Button */}
                    <button 
                        onClick={handleSubmit} 
                        disabled={!amount || isSubmitting} 
                        className="w-full h-[56px] mt-4 bg-[var(--color-text-primary)] text-white rounded-[20px] font-extrabold text-[15px] tracking-wide flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100 premium-shadow"
                    >
                        {isSubmitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "WITHDRAW FUNDS"}
                    </button>
                </>
            )}
        </div>
    );
}
