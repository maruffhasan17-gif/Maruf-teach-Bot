import React, { useState, useEffect } from 'react';
import { Home, User, ArrowDown, ArrowUp, ChevronRight, Zap, Share2, Copy, X, ArrowRightLeft, Wallet, Gift, ArrowUpRight, TrendingUp, Sparkles, Info, CircleDollarSign, Gem, Coins, Delete, ChevronDown, Clock, Save, CheckCircle2 , Volume2, VolumeX, Check, Settings , ClipboardPaste, Loader2, PlusCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { TonConnectUIProvider, TonConnectButton, useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import WebApp from '@twa-dev/sdk';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchUserData, submitFreeTonTask, saveFiatWallet, withdrawFiat, submitSellOrder, buildTransaction, submitBuyOrder, submitAddMoney, submitBuyCrypto } from './api';

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
  const [showBuyCryptoModal, setShowBuyCryptoModal] = useState(false);

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
                    {(user?.first_name?.charAt(0)?.toUpperCase() || 'U')}
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

          {activeTab === 'home' && (
              <HomePage 
                  balance={balance} 
                  user={user} 
                  fiatWithdrawPending={fiatWithdrawPending} 
                  onGoToClaim={() => setActiveTab('claim')} 
                  onOpenBuyCrypto={() => setShowBuyCryptoModal(true)}
                  onGoToSell={() => setActiveTab('sell')}
                  onGoToAddMoney={() => setActiveTab('add-money')}
              />
          )}
          {activeTab === 'add-money' && (
              <AddMoneyPage 
                  user={user} 
                  onDone={() => setActiveTab('home')}
                  onGoToBuyCrypto={() => {
                      setActiveTab('home');
                      setShowBuyCryptoModal(true);
                  }}
                  reloadData={() => loadData(user?.id || 123456789)}
              />
          )}
          {activeTab === 'sell' && <PremiumSellPage user={user} />}
          {activeTab === 'history' && <HistoryPage user={user} onBack={() => setActiveTab('profile')} />}
          {activeTab === 'profile' && <ProfilePage user={user} balance={balance} mbsId={mbsId} fiatWallet={fiatWallet} fiatWithdrawPending={fiatWithdrawPending} onGoToWithdraw={() => setActiveTab('withdraw')} onGoToHistory={() => setActiveTab('history')} setFiatWallet={setFiatWallet} reloadData={() => loadData(user?.id || 123456789)} />}
          {activeTab === 'claim' && <ClaimPage user={user} onBack={() => setActiveTab('home')} />}
          {activeTab === 'withdraw' && <WithdrawFiatPage user={user} balance={balance} fiatWallet={fiatWallet} fiatWithdrawPending={fiatWithdrawPending} onBack={() => setActiveTab('profile')} reloadData={() => loadData(user?.id || 123456789)} />}
        </div>

        {/* Buy Crypto Modal (Realtime On-Chain Send) */}
        <BuyCryptoModal 
            isOpen={showBuyCryptoModal}
            onClose={() => setShowBuyCryptoModal(false)}
            user={user}
            balance={balance}
            reloadData={() => loadData(user?.id || 123456789)}
            onGoToAddMoney={() => {
                setShowBuyCryptoModal(false);
                setActiveTab('add-money');
            }}
        />

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
  
                    {/* ADD MONEY */}
                    <button onClick={() => setActiveTab('add-money')} className="relative flex flex-col items-center justify-center w-[76px] h-[64px] transition-all duration-300 group active:scale-95">
                        <div className="relative flex flex-col items-center justify-center z-10">
                            <PlusCircle size={22} strokeWidth={activeTab === 'add-money' ? 2.5 : 2} className={`mb-1.5 transition-colors duration-300 ${activeTab === 'add-money' ? 'text-emerald-500' : 'text-gray-400 group-hover:text-gray-600'}`} />
                            <span className={`text-[8px] font-extrabold tracking-wider transition-colors duration-300 ${activeTab === 'add-money' ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-600'}`}>ADD MONEY</span>
                        </div>
                        {/* Active Indicator & Background */}
                        <div className={`absolute bottom-0 w-5 h-1 bg-emerald-500 rounded-t-full transition-all duration-300 ${activeTab === 'add-money' ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-50'}`} />
                        <div className={`absolute inset-1 bg-emerald-50/50 rounded-[24px] transition-opacity duration-300 ${activeTab === 'add-money' ? 'opacity-100' : 'opacity-0'}`} />
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
                {(user?.first_name?.charAt(0)?.toUpperCase() || 'U')}
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

function HomePage({ balance, user, fiatWithdrawPending, onGoToClaim, onOpenBuyCrypto, onGoToSell, onGoToAddMoney }) {
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
    <div className="space-y-3 animate-in fade-in slide-in-from-left-4 duration-300">
      
      {fiatWithdrawPending && (
          fiatWithdrawPending.status === 'completed' ? (
              Date.now() - (fiatWithdrawPending.completedAt || Date.now()) < 3 * 60 * 60 * 1000 && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                          <p className="text-[12px] text-emerald-800 font-bold">
                              Withdrawal Sent: <b>{fiatWithdrawPending.amount} TK</b>
                          </p>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-500/20 px-2 py-0.5 rounded">Success</span>
                  </div>
              )
          ) : (
              <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                      <Clock size={16} className="text-amber-500 shrink-0" />
                      <p className="text-[12px] text-amber-800 font-bold">
                          Withdrawal Pending: <b>{fiatWithdrawPending.amount} TK</b>
                      </p>
                  </div>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-500/20 px-2 py-0.5 rounded">#{fiatWithdrawPending.serial || '1'}</span>
              </div>
          )
      )}
      
      {/* Total Balance Card */}
      <div className="bg-white p-4 rounded-2xl premium-shadow border border-[var(--color-border)] relative overflow-hidden">
         <div className="absolute top-3 right-3 pointer-events-none opacity-50">
            <AbstractWalletIcon />
         </div>
         <div className="flex justify-between items-start mb-1">
            <p className="text-[11px] font-bold text-[var(--color-text-secondary)] tracking-wider uppercase">Total Balance</p>
            <button 
                onClick={onGoToAddMoney} 
                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold rounded-full flex items-center gap-1 transition-colors border border-emerald-200/60 active:scale-95 shadow-sm"
            >
                <PlusCircle size={12} strokeWidth={2.5} />
                <span>Add Money</span>
            </button>
         </div>
         <div className="flex items-baseline gap-1">
            <h2 className="text-3xl font-black text-[var(--color-text-primary)]">{balance}</h2>
            <span className="text-base font-bold text-[var(--color-brand)]">TK</span>
         </div>
         <p className="text-[12px] text-[var(--color-text-secondary)] mt-1">Available for withdrawal & crypto purchase</p>
      </div>

      {/* Quick Action Buttons: Buy Crypto & Sell Crypto */}
      <div className="grid grid-cols-2 gap-2.5">
         <button 
             onClick={onOpenBuyCrypto} 
             className="flex items-center gap-2.5 bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 text-white p-3 rounded-2xl shadow-md shadow-emerald-500/20 active:scale-[0.97] transition-all text-left group"
         >
             <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
                 <Coins size={18} />
             </div>
             <div>
                 <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider leading-none">Instant Send</p>
                 <p className="text-[15px] font-bold text-white leading-tight mt-1 tracking-tight">Buy Crypto</p>
             </div>
         </button>
         
         <button 
             onClick={onGoToSell} 
             className="flex items-center gap-2.5 bg-white text-gray-900 p-3 rounded-2xl premium-shadow border border-[var(--color-border)] active:scale-[0.97] transition-all text-left group hover:border-gray-300"
         >
             <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700 shrink-0 group-hover:scale-105 transition-transform">
                 <ArrowRightLeft size={18} />
             </div>
             <div>
                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none">Instant Swap</p>
                 <p className="text-[15px] font-bold text-gray-900 leading-tight mt-1 tracking-tight">Sell Crypto</p>
             </div>
         </button>
      </div>

      {/* Live Chart Card */}
      <div className="bg-white p-3.5 rounded-2xl premium-shadow border border-[var(--color-border)]">
         <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2 text-[var(--color-text-primary)]">
                <TrendingUp size={15} className="text-[var(--color-text-secondary)]" />
                <h3 className="text-[15px] font-bold">USDT/TK Live Chart</h3>
            </div>
            <div className="flex items-center gap-1 bg-[var(--color-success)]/10 px-2 py-0.5 rounded-full border border-[var(--color-success)]/20">
                <div className="w-1.5 h-1.5 bg-[var(--color-success)] rounded-full animate-pulse" />
                <span className="text-[9px] font-bold text-[var(--color-success)] tracking-wide">LIVE</span>
            </div>
         </div>
         
         <div className="flex items-baseline gap-1.5 mb-3">
            <span className="text-xl font-bold text-[var(--color-text-primary)]">{graphData[graphData.length-1].price.toFixed(2)}</span>
            <span className="text-[12px] font-medium text-[var(--color-text-secondary)]">TK/USDT</span>
         </div>

         <div className="h-28 w-full ml-[-15px]">
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
                 {(user?.first_name?.charAt(0)?.toUpperCase() || 'U')}
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
              <div className="w-full flex justify-center py-4 bg-gradient-to-b from-[var(--color-bg-primary)] to-white relative">
                  <div className="absolute inset-0 bg-[var(--color-brand)]/5 blur-3xl rounded-full scale-150" />
                  <div className="w-[120px] h-[120px] relative z-10">
                     <PremiumGiftBox />
                  </div>
              </div>

              <div className="px-4 pb-6 text-center flex-1 flex flex-col">
                  <h2 className="text-[15px] font-bold text-[var(--color-text-primary)] mb-1">Claim Free TON</h2>
                  <p className="text-[12px] text-[var(--color-text-secondary)] font-medium leading-relaxed max-w-[250px] mx-auto mb-5">
                      Submit your wallet to receive VIC mining reward
                  </p>

                  <div className="space-y-3 text-left w-full mx-auto">
                      
                      {/* Full Name Field */}
                      <div>
                          <label className="block text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-[0.1em] mb-1 pl-1">Full Name</label>
                          <div className="relative flex items-center">
                              <div className="absolute left-3 text-[var(--color-text-secondary)]">
                                  <User size={15} />
                              </div>
                              <input 
                                  readOnly 
                                  value={user.first_name} 
                                  className="w-full h-[42px] bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl pl-9 pr-3 text-[12px] font-medium text-[var(--color-text-primary)] outline-none shadow-inner"
                              />
                          </div>
                      </div>

                      {/* Select Network Field */}
                      <div>
                          <label className="block text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-[0.1em] mb-1 pl-1">Select Network</label>
                          <div className="relative">
                              <select 
                                  value={network} 
                                  onChange={e => setNetwork(e.target.value)}
                                  className="w-full h-[42px] bg-[#E8F8F3] border border-[var(--color-brand)] rounded-xl px-3 text-[12px] font-semibold text-[var(--color-text-primary)] outline-none appearance-none transition-colors focus:ring-2 focus:ring-[var(--color-brand)]/20"
                              >
                                  <option value="TON">TON</option>
                                  <option value="GRAM">GRAM</option>
                              </select>
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-brand)] pointer-events-none">
                                  <ChevronRight size={15} className="rotate-90" />
                              </div>
                          </div>
                      </div>

                      {/* Wallet Address Field */}
                      <div>
                          <label className="block text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-[0.1em] mb-1 pl-1">Wallet Address</label>
                          <div className="relative flex items-center">
                              <div className="absolute left-3 text-[var(--color-text-secondary)]">
                                  <Wallet size={15} />
                              </div>
                              <input 
                                  readOnly 
                                  value={userTonAddress || ''} 
                                  placeholder="UQ..."
                                  className="w-full h-[42px] bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl pl-9 pr-9 text-[12px] font-medium text-[var(--color-text-primary)] outline-none shadow-inner truncate"
                              />
                              <div className="absolute right-3 text-[var(--color-text-secondary)] hover:text-[var(--color-brand)] transition-colors cursor-pointer active:scale-95">
                                  <Copy size={15} />
                              </div>
                          </div>
                      </div>

                  </div>
              </div>
          </div>
       </div>

       {/* Fixed Bottom Action Area */}
       <div className="px-5 pb-6 pt-3 bg-gradient-to-t from-[var(--color-bg-primary)] via-[var(--color-bg-primary)] to-transparent shrink-0 w-full max-w-md mx-auto z-50">
          {!userTonAddress ? (
              <div className="w-full">
                  <TonConnectButton className="w-full !flex !justify-center" />
              </div>
          ) : (
              <button 
                  onClick={handleClaim} 
                  disabled={loading || success} 
                  className="w-full h-[44px] bg-[var(--color-brand)] text-white font-bold text-[12px] rounded-xl premium-shadow active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                  {loading ? 'PROCESSING...' : success ? 'CLAIMED SUCCESSFULLY 🎉' : 'CLAIM FREE TON'}
              </button>
          )}
       </div>

    </div>
  );
}




function AddMoneyPage({ user, onDone, onGoToBuyCrypto, reloadData }) {
    const [step, setStep] = useState(1);
    const [amount, setAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('bKash');
    const [trxId, setTrxId] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [copied, setCopied] = useState(false);
    const [adminBkash, setAdminBkash] = useState("01752561935");
    const [adminNagad, setAdminNagad] = useState("01878580320");
    const [depositResult, setDepositResult] = useState(null);

    useEffect(() => {
        fetch((window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://maruf-teach-bot.onrender.com') + '/api/settings')
            .then(res => res.json())
            .then(data => {
                if (data.adminBkash) setAdminBkash(data.adminBkash);
                if (data.adminNagad) setAdminNagad(data.adminNagad);
            }).catch(e => console.log(e));
    }, []);

    const adminNumber = paymentMethod === 'bKash' ? adminBkash : adminNagad;

    const handleCopy = () => {
        navigator.clipboard.writeText(adminNumber);
        setCopied(true);
        if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
        }
        setTimeout(() => setCopied(false), 2000);
    };

    const quickAmounts = [100, 200, 500, 1000, 2000];

    const handleContinue = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        const num = parseFloat(amount);
        if (!num || isNaN(num) || num < 20) {
            return window.Telegram?.WebApp?.showAlert ? window.Telegram.WebApp.showAlert("নূন্যতম অ্যাড মানি ২০ টাকা") : alert("Minimum amount is 20 BDT");
        }
        if (num > 30000) {
            return window.Telegram?.WebApp?.showAlert ? window.Telegram.WebApp.showAlert("সর্বোচ্চ অ্যাড মানি ৩০,০০০ টাকা") : alert("Maximum amount is 30,000 BDT");
        }
        setErrorMessage('');
        setStep(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async () => {
        if (!trxId || trxId.trim().length < 5) {
            setErrorMessage('অনুগ্রহ করে সঠিক Transaction ID (কমপক্ষে ৫ অক্ষর) দিন');
            return;
        }
        setLoading(true);
        setErrorMessage('');
        try {
            const res = await submitAddMoney({
                userId: user?.id || 123456789,
                amount: parseFloat(amount),
                paymentMethod,
                trxId: trxId.trim().toUpperCase()
            });

            if (res.success) {
                setDepositResult(res);
                if (reloadData) reloadData();
                if (window.Telegram?.WebApp?.HapticFeedback) {
                    window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
                }
                setStep(3);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                setErrorMessage(res.error || 'ভেরিফিকেশন ব্যর্থ হয়েছে');
                if (window.Telegram?.WebApp?.HapticFeedback) {
                    window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
                }
            }
        } catch (e) {
            setErrorMessage(e.message || 'ভুল বা আনভেরিফাইড Transaction ID! টাকা পাঠিয়ে সঠিক TrxID দিন।');
            if (window.Telegram?.WebApp?.HapticFeedback) {
                window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
            }
        } finally {
            setLoading(false);
        }
    };

    // STEP 3: LUXURY FINTECH SUCCESS RECEIPT
    if (step === 3) {
        return (
            <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500 p-4 text-center pb-24">
                {/* Glowing Animated Icon */}
                <div className="relative mb-6 mt-4">
                    <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-2xl animate-pulse" />
                    <div className="w-24 h-24 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/30 border-4 border-white relative z-10">
                        <CheckCircle2 size={48} className="text-white drop-shadow-md" />
                    </div>
                </div>

                <h2 className="text-2xl font-black text-gray-900 mb-1 tracking-tight">
                    ৳{amount} BDT Added! 🎉
                </h2>
                <p className="text-gray-500 text-xs mb-6 max-w-[280px] leading-relaxed">
                    আপনার পেমেন্ট SMS দ্বারা সাথে সাথে অটো-ভেরিফাই হয়েছে এবং ব্যালেন্সে যোগ হয়েছে।
                </p>

                {/* Fintech Receipt Card */}
                <div className="bg-white border border-gray-100 rounded-3xl p-5 w-full max-w-[340px] mb-6 shadow-xl shadow-gray-100/60 relative overflow-hidden">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</span>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-black border border-emerald-200/60">
                            <Sparkles size={12} /> Auto-Verified
                        </div>
                    </div>
                    
                    <div className="space-y-2.5 text-left text-xs">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400 font-medium">Transaction ID</span>
                            <span className="font-mono font-bold text-gray-900 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">{trxId}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400 font-medium">Payment Method</span>
                            <span className="font-bold text-gray-900">{paymentMethod}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400 font-medium">Amount Deposited</span>
                            <span className="font-extrabold text-emerald-600 text-sm">৳{amount} BDT</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400 font-medium">Account Name</span>
                            <span className="font-bold text-gray-900">{user?.first_name || 'User'}</span>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="w-full max-w-[340px] space-y-2.5">
                    <button 
                        onClick={onGoToBuyCrypto} 
                        className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-emerald-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm tracking-wide"
                    >
                        <Coins size={18} />
                        BUY CRYPTO NOW
                    </button>
                    <button 
                        onClick={() => {
                            setStep(1);
                            setAmount('');
                            setTrxId('');
                            setErrorMessage('');
                            onDone();
                        }} 
                        className="w-full bg-white text-gray-700 font-bold py-3.5 rounded-2xl border border-gray-200 active:scale-95 transition-all text-sm"
                    >
                        BACK TO HOME
                    </button>
                </div>
            </div>
        );
    }

    // STEP 2: SEND MONEY & SUBMIT TRXID (STRICT: NO PENDING)
    if (step === 2) {
        return (
            <div className="flex flex-col h-full animate-in slide-in-from-right duration-300 pb-24">
                {/* Header */}
                <div className="flex items-center gap-3 mb-5">
                    <button 
                        onClick={() => { setStep(1); setErrorMessage(''); }} 
                        className="p-2.5 bg-white rounded-full shadow-sm text-gray-700 border border-gray-100 active:scale-95 transition-transform"
                    >
                        <ArrowDown size={18} className="rotate-90" />
                    </button>
                    <div>
                        <h2 className="text-xl font-black text-gray-900 tracking-tight">Send Money Verification</h2>
                        <p className="text-gray-500 text-xs mt-0.5">টাকা পাঠিয়ে TrxID সাবমিট করুন</p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="flex items-center gap-2 mb-6 px-1">
                    <div className="h-1.5 flex-1 bg-emerald-500 rounded-full" />
                    <div className="h-1.5 flex-1 bg-emerald-500 rounded-full relative">
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-emerald-500 rounded-full ring-4 ring-emerald-100" />
                    </div>
                </div>

                {/* Instructions Card */}
                <div className="bg-white rounded-2xl p-3.5 mb-3 border border-gray-100 shadow-sm space-y-3">
                    <div className="flex justify-between items-center pb-2.5 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            <img 
                                src={paymentMethod === 'bKash' ? 'https://mohammadalinijhoom.com/wp-content/uploads/2024/07/bKash-Logo.png' : 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ1M8VPPADiai-0lEgQMNXBEir230b0dAn61cgVHRVQat7qn3-H0L4m1Zg&s=10'} 
                                className="w-6 h-6 object-contain" 
                                alt={paymentMethod} 
                            />
                            <div>
                                <span className="font-bold text-gray-900 text-[13px] block">{paymentMethod} Personal</span>
                                <span className="text-[10px] text-gray-400 font-medium">Send Money Only</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] text-gray-400 font-medium block">Send exactly</span>
                            <span className="text-[15px] font-black text-emerald-600">৳{amount} BDT</span>
                        </div>
                    </div>

                    {/* Admin Number with Copy */}
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Admin {paymentMethod} Number</span>
                            <span className="text-[10px] text-emerald-600 font-bold">Personal</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-base font-bold text-gray-900 font-mono tracking-wider">{adminNumber}</span>
                            <button 
                                onClick={handleCopy} 
                                className={"flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold text-[11px] shadow-sm transition-all active:scale-95 " + (copied ? "bg-emerald-600 text-white" : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50")}
                            >
                                {copied ? <><CheckCircle2 size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
                            </button>
                        </div>
                    </div>

                    {/* Bangla Guidance */}
                    <div className="bg-emerald-50/60 rounded-xl p-2.5 border border-emerald-100 text-[12px] text-emerald-900 space-y-1">
                        <p className="font-bold text-[11px] text-emerald-800 uppercase tracking-wider">কিভাবে টাকা পাঠাবেন:</p>
                        <p>১. আপনার <b>{paymentMethod}</b> অ্যাপ থেকে <b>Send Money</b> অপশনে যান।</p>
                        <p>২. উপরে দেওয়া নাম্বারে সঠিক <b>৳{amount} টাকা</b> পাঠান।</p>
                        <p>৩. এসএমএস থেকে পাওয়া <b>Transaction ID (TrxID)</b> নিচে লিখে সাবমিট করুন।</p>
                    </div>
                </div>

                {/* TrxID Input Card */}
                <div className="bg-white rounded-2xl p-3.5 mb-3 border border-gray-100 shadow-sm space-y-2.5">
                    <label className="text-[11px] font-bold text-gray-500 block uppercase tracking-wider">
                        Transaction ID (TrxID)
                    </label>
                    <div className="relative">
                        <input 
                            type="text" 
                            value={trxId} 
                            onChange={e => setTrxId(e.target.value.toUpperCase())} 
                            placeholder="e.g. 9J26XYZ789" 
                            className="w-full bg-gray-50 rounded-xl p-3 pr-10 text-[15px] font-mono font-bold text-gray-900 border border-gray-200 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 transition-all outline-none" 
                        />
                        <button 
                            onClick={async () => { 
                                try { 
                                    const text = await navigator.clipboard.readText(); 
                                    if (text) setTrxId(text.trim().toUpperCase()); 
                                } catch(e){} 
                            }} 
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white text-gray-400 hover:text-emerald-600 rounded-lg transition-all shadow-sm border border-gray-200"
                            title="Paste from clipboard"
                        >
                            <ClipboardPaste size={16} />
                        </button>
                    </div>

                    {/* Prominent Realtime Error Alert */}
                    {errorMessage && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2.5 animate-in fade-in duration-300">
                            <AlertCircle size={17} className="text-red-600 shrink-0 mt-0.5" />
                            <div className="text-[12px]">
                                <p className="font-bold text-red-700">ভুল বা অমিল TrxID!</p>
                                <p className="text-red-600 leading-tight">{errorMessage}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Submit Button */}
                <div className="mt-auto">
                    <button 
                        onClick={handleSubmit} 
                        disabled={!trxId.trim() || loading} 
                        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold rounded-xl h-[46px] shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex justify-center items-center gap-2 text-[14px] tracking-wide"
                    >
                        {loading ? (
                            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> VERIFYING SMS...</>
                        ) : (
                            <><CheckCircle2 size={16} /> VERIFY & ADD MONEY</>
                        )}
                    </button>
                </div>
            </div>
        );
    }

    // STEP 1: AMOUNT & PAYMENT METHOD (NO WALLET ADDRESS HERE)
    return (
        <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
            {/* Header */}
            <div className="flex items-center gap-2.5 mb-3.5">
                <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-100 shadow-sm shrink-0">
                    <PlusCircle size={18} strokeWidth={2.5} />
                </div>
                <div>
                    <h2 className="text-[15px] font-extrabold text-gray-900 tracking-tight leading-tight">Add Money</h2>
                    <p className="text-gray-500 text-[12px]">টাকা জমা করুন আপনার একাউন্ট ব্যালেন্সে</p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center gap-2 mb-4 px-1">
                <div className="h-1 flex-1 bg-emerald-500 rounded-full relative">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-emerald-100" />
                </div>
                <div className="h-1 flex-1 bg-gray-200 rounded-full" />
            </div>

            <div className="space-y-3">
                {/* Amount Card */}
                <div className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-sm space-y-3">
                    <div>
                        <label className="text-[11px] font-bold text-gray-400 block tracking-wider uppercase mb-1.5 ml-0.5">
                            Deposit Amount (BDT)
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-base text-gray-700">৳</span>
                            <input 
                                type="number" 
                                value={amount} 
                                onChange={e => setAmount(e.target.value)} 
                                placeholder="0.00" 
                                className="w-full bg-gray-50 rounded-xl h-[48px] pl-7 pr-12 text-lg font-bold text-gray-900 border border-gray-200 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 transition-all outline-none" 
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-[11px] text-gray-400">BDT</span>
                        </div>
                    </div>

                    {/* Quick Amount Chips */}
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {quickAmounts.map(val => (
                            <button
                                key={val}
                                type="button"
                                onClick={() => setAmount(val.toString())}
                                className={`px-3 py-1 rounded-lg text-[12px] font-bold transition-all active:scale-95 ${
                                    amount === val.toString() 
                                        ? 'bg-emerald-600 text-white shadow-sm' 
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                ৳{val}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Payment Method Selection */}
                <div className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-sm space-y-2.5">
                    <label className="text-[11px] font-bold text-gray-400 block tracking-wider uppercase ml-0.5">
                        Select Payment Method
                    </label>

                    <div className="grid grid-cols-2 gap-2">
                        {/* bKash */}
                        <div 
                            onClick={() => setPaymentMethod('bKash')}
                            className={`px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-2.5 ${
                                paymentMethod === 'bKash' 
                                    ? 'border-emerald-500 bg-emerald-50/50 shadow-sm' 
                                    : 'border-gray-100 bg-gray-50/60 hover:bg-gray-50'
                            }`}
                        >
                            <img 
                                src="https://mohammadalinijhoom.com/wp-content/uploads/2024/07/bKash-Logo.png" 
                                className="w-6 h-6 object-contain shrink-0" 
                                alt="bKash" 
                            />
                            <div className="flex-1 text-left min-w-0">
                                <span className="font-bold text-[12px] text-gray-900 block leading-tight truncate">bKash</span>
                                <span className="text-[10px] text-gray-400 font-medium block">Personal</span>
                            </div>
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-all ${
                                paymentMethod === 'bKash' ? 'bg-emerald-500 text-white' : 'border border-gray-300'
                            }`}>
                                {paymentMethod === 'bKash' && <Check size={10} strokeWidth={3} />}
                            </div>
                        </div>

                        {/* Nagad */}
                        <div 
                            onClick={() => setPaymentMethod('Nagad')}
                            className={`px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-2.5 ${
                                paymentMethod === 'Nagad' 
                                    ? 'border-emerald-500 bg-emerald-50/50 shadow-sm' 
                                    : 'border-gray-100 bg-gray-50/60 hover:bg-gray-50'
                            }`}
                        >
                            <img 
                                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ1M8VPPADiai-0lEgQMNXBEir230b0dAn61cgVHRVQat7qn3-H0L4m1Zg&s=10" 
                                className="w-6 h-6 object-contain shrink-0" 
                                alt="Nagad" 
                            />
                            <div className="flex-1 text-left min-w-0">
                                <span className="font-bold text-[12px] text-gray-900 block leading-tight truncate">Nagad</span>
                                <span className="text-[10px] text-gray-400 font-medium block">Personal</span>
                            </div>
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-all ${
                                paymentMethod === 'Nagad' ? 'bg-emerald-500 text-white' : 'border border-gray-300'
                            }`}>
                                {paymentMethod === 'Nagad' && <Check size={10} strokeWidth={3} />}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Instant Credit Note */}
                <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3 flex items-center gap-2.5">
                    <Sparkles size={16} className="text-emerald-600 shrink-0" />
                    <p className="text-emerald-800 text-[12px] font-medium leading-tight">
                        টাকা পাঠানোর সাথে সাথে আপনার TrxID অটো-ভেরিফাই হবে এবং ইন-অ্যাপ ব্যালেন্সে যুক্ত হবে।
                    </p>
                </div>
            </div>

            {/* Next Button */}
            <div className="mt-4">
                <button 
                    onClick={handleContinue} 
                    disabled={!amount || parseFloat(amount) < 20} 
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold rounded-xl h-[46px] shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex justify-center items-center gap-2 text-[14px]"
                >
                    <span>CONTINUE TO PAYMENT</span>
                    <ArrowDown size={15} className="-rotate-90" />
                </button>
            </div>
        </div>
    );
}

// REALTIME BUY CRYPTO MODAL (Live On-Chain Payout from User BDT Balance)
function BuyCryptoModal({ isOpen, onClose, user, balance, reloadData, onGoToAddMoney }) {
    const userTonAddress = useTonAddress();
    const [selectedAsset, setSelectedAsset] = useState('TON'); // 'TON' or 'GRAM'
    const [bdtAmount, setBdtAmount] = useState('');
    const [receiveAddress, setReceiveAddress] = useState('');
    const [stage, setStage] = useState('idle'); // 'idle' | 'processing' | 'success' | 'error'
    const [processStep, setProcessStep] = useState(1);
    const [errorMessage, setErrorMessage] = useState('');
    const [txResult, setTxResult] = useState(null);

    // Auto-fill connected TonConnect wallet if address empty
    useEffect(() => {
        if (userTonAddress && !receiveAddress) {
            setReceiveAddress(userTonAddress);
        }
    }, [userTonAddress]);

    if (!isOpen) return null;

    // Rates: 1 TON ≈ 228 BDT (1.9 USDT * 120 BDT), 1 GRAM ≈ 120 BDT
    const cryptoRate = selectedAsset === 'GRAM' ? 120 : 228;
    const calculatedCrypto = bdtAmount && !isNaN(bdtAmount) && parseFloat(bdtAmount) > 0 
        ? (parseFloat(bdtAmount) / cryptoRate).toFixed(4) 
        : '0.0000';

    const numBdt = parseFloat(bdtAmount) || 0;
    const hasInsufficientBalance = numBdt > balance;

    const handleConfirmBuy = async () => {
        if (!numBdt || numBdt < 20) {
            return window.Telegram?.WebApp?.showAlert ? window.Telegram.WebApp.showAlert("নূন্যতম ক্রিপ্টো ক্রয় ২০ টাকা") : alert("Minimum buy is 20 BDT");
        }
        if (hasInsufficientBalance) return;
        if (!receiveAddress || receiveAddress.trim().length < 24) {
            return window.Telegram?.WebApp?.showAlert ? window.Telegram.WebApp.showAlert("সঠিক TON Receive Address দিন") : alert("Enter valid TON address");
        }

        setStage('processing');
        setProcessStep(1); // Stage 1: Checking balance & reserves
        setErrorMessage('');

        try {
            await new Promise(r => setTimeout(r, 600));
            setProcessStep(2); // Stage 2: Broadcasting on-chain transaction

            const res = await submitBuyCrypto({
                userId: user?.id || 123456789,
                asset: selectedAsset,
                cryptoAmount: parseFloat(calculatedCrypto),
                bdtAmount: numBdt,
                receiveAddress: receiveAddress.trim()
            });

            if (res.success) {
                setProcessStep(3); // Stage 3: Awaiting on-chain confirmation
                await new Promise(r => setTimeout(r, 600));
                setTxResult(res);
                setStage('success');
                if (reloadData) reloadData();
                if (window.Telegram?.WebApp?.HapticFeedback) {
                    window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
                }
            } else {
                throw new Error(res.error || 'Failed to send crypto');
            }
        } catch (e) {
            setErrorMessage(e.message || 'ক্রিপ্টো পাঠানো ব্যর্থ হয়েছে। আপনার ব্যালেন্স অক্ষত আছে বা রিফান্ড করা হয়েছে।');
            setStage('error');
            if (reloadData) reloadData();
            if (window.Telegram?.WebApp?.HapticFeedback) {
                window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
            }
        }
    };

    const handleResetAndClose = () => {
        setStage('idle');
        setProcessStep(1);
        setBdtAmount('');
        setErrorMessage('');
        setTxResult(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-md bg-white rounded-t-[24px] sm:rounded-[24px] p-4 max-h-[92vh] overflow-y-auto border border-gray-100 shadow-2xl animate-in slide-in-from-bottom duration-300">
                
                {/* Header */}
                <div className="flex justify-between items-center mb-3 pb-2.5 border-b border-gray-100">
                    <div>
                        <h3 className="text-[15px] font-bold text-gray-900 tracking-tight flex items-center gap-1.5">
                            <Coins size={18} className="text-emerald-600" />
                            Buy Crypto
                        </h3>
                        <p className="text-gray-400 text-[11px]">আপনার ব্যালেন্স থেকে সরাসরি ওয়ালেটে পাঠানো হবে</p>
                    </div>
                    <button 
                        onClick={handleResetAndClose} 
                        className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full transition-colors active:scale-95"
                    >
                        <X size={16} strokeWidth={2.5} />
                    </button>
                </div>

                {/* SUCCESS STAGE */}
                {stage === 'success' ? (
                    <div className="py-4 text-center animate-in zoom-in-95 duration-400">
                        <div className="relative mb-3 inline-block">
                            <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
                            <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 relative z-10 border-2 border-white">
                                <CheckCircle2 size={28} />
                            </div>
                        </div>

                        <h4 className="text-[15px] font-bold text-gray-900 mb-1">
                            Payment Sent Successfully! 🎉
                        </h4>
                        <p className="text-gray-500 text-[12px] mb-4 max-w-[280px] mx-auto leading-relaxed">
                            আপনার ওয়ালেটে <b>{calculatedCrypto} {selectedAsset}</b> সফলভাবে পাঠানো হয়েছে।
                        </p>

                        <div className="bg-gray-50 rounded-xl p-3 text-left text-[12px] space-y-1.5 border border-gray-100 mb-4">
                            <div className="flex justify-between">
                                <span className="text-gray-400 font-medium">Crypto Sent:</span>
                                <span className="font-bold text-emerald-600">{calculatedCrypto} {selectedAsset}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400 font-medium">BDT Deducted:</span>
                                <span className="font-bold text-gray-900">৳{bdtAmount} TK</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400 font-medium">Wallet:</span>
                                <span className="font-mono font-bold text-gray-700 truncate max-w-[170px]">{receiveAddress}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400 font-medium">Network:</span>
                                <span className="font-bold text-emerald-600">TON Blockchain</span>
                            </div>
                        </div>

                        <button 
                            onClick={handleResetAndClose} 
                            className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-md shadow-emerald-600/20 active:scale-95 transition-all text-[12px]"
                        >
                            DONE / সম্পন্ন
                        </button>
                    </div>
                ) : stage === 'error' ? (
                    /* ERROR STAGE */
                    <div className="py-4 text-center animate-in zoom-in-95 duration-400">
                        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center text-red-600 mx-auto mb-3 border-2 border-white shadow-md">
                            <AlertCircle size={28} />
                        </div>
                        <h4 className="text-[15px] font-bold text-gray-900 mb-1">ট্রানজেকশন ব্যর্থ হয়েছে</h4>
                        <p className="text-red-600 text-[12px] mb-4 leading-relaxed bg-red-50 p-2.5 rounded-xl border border-red-100 max-w-[320px] mx-auto">
                            {errorMessage}
                        </p>
                        <button 
                            onClick={() => setStage('idle')} 
                            className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl active:scale-95 transition-all text-[12px]"
                        >
                            TRY AGAIN
                        </button>
                    </div>
                ) : stage === 'processing' ? (
                    /* LIVE REALTIME PROCESSING STAGE */
                    <div className="py-6 text-center animate-in fade-in duration-300 space-y-4">
                        <div className="relative inline-block">
                            <div className="w-14 h-14 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center text-emerald-600">
                                <Coins size={22} className="animate-pulse" />
                            </div>
                        </div>

                        <div>
                            <h4 className="text-[15px] font-bold text-gray-900 mb-1">
                                {processStep === 1 && 'Checking Balance & Rate...'}
                                {processStep === 2 && 'Sending on TON Blockchain...'}
                                {processStep === 3 && 'Awaiting Confirmation...'}
                            </h4>
                            <p className="text-gray-400 text-[12px]">
                                {processStep === 1 && 'আপনার ব্যালেন্স এবং এক্সচেঞ্জ রেট চেক করা হচ্ছে'}
                                {processStep === 2 && 'বট সরাসরি আপনার ওয়ালেটে ক্রিপ্টো পাঠাচ্ছে'}
                                {processStep === 3 && 'ব্লকচেইন কনফার্মেশন চূড়ান্ত হচ্ছে'}
                            </p>
                        </div>

                        {/* Multi-step indicator */}
                        <div className="flex items-center justify-center gap-1.5 max-w-[220px] mx-auto">
                            <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${processStep >= 1 ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                            <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${processStep >= 2 ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                            <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${processStep >= 3 ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                        </div>
                    </div>
                ) : (
                    /* IDLE / INPUT STAGE */
                    <div className="space-y-3">
                        {/* Current User Balance Banner */}
                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex justify-between items-center">
                            <div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Available Balance</span>
                                <span className="text-[15px] font-bold text-gray-900">{balance} <span className="text-emerald-600 text-[12px]">TK</span></span>
                            </div>
                            <button 
                                onClick={onGoToAddMoney} 
                                className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[11px] font-bold flex items-center gap-1 border border-emerald-200/60 transition-colors"
                            >
                                <PlusCircle size={13} /> Add Money
                            </button>
                        </div>

                        {/* Select Asset: TON vs GRAM */}
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                                Select Crypto Asset
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedAsset('TON')}
                                    className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
                                        selectedAsset === 'TON' 
                                            ? 'border-emerald-500 bg-emerald-50/40 shadow-sm' 
                                            : 'border-gray-100 bg-gray-50 hover:bg-gray-100/60'
                                    }`}
                                >
                                    <img src="https://cryptologos.cc/logos/toncoin-ton-logo.svg?v=035" className="w-5 h-5" alt="TON" />
                                    <div className="text-left">
                                        <span className="font-bold text-[12px] text-gray-900 block leading-tight">TON Coin</span>
                                        <span className="text-[10px] text-gray-400 font-medium">≈ ৳228 TK</span>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setSelectedAsset('GRAM')}
                                    className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
                                        selectedAsset === 'GRAM' 
                                            ? 'border-emerald-500 bg-emerald-50/40 shadow-sm' 
                                            : 'border-gray-100 bg-gray-50 hover:bg-gray-100/60'
                                    }`}
                                >
                                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-[9px] font-bold">G</div>
                                    <div className="text-left">
                                        <span className="font-bold text-[12px] text-gray-900 block leading-tight">GRAM</span>
                                        <span className="text-[10px] text-gray-400 font-medium">≈ ৳120 TK</span>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Top Field: BDT Amount Input */}
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    BDT Amount to Spend (টাকার পরিমাণ)
                                </label>
                                <span className="text-[10px] text-gray-400">Min ৳20</span>
                            </div>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-gray-700 text-[12px]">৳</span>
                                <input 
                                    type="number" 
                                    value={bdtAmount} 
                                    onChange={e => setBdtAmount(e.target.value)} 
                                    placeholder="0.00" 
                                    className="w-full bg-gray-50 rounded-xl p-3 pl-8 pr-12 text-[12px] font-bold text-gray-900 border border-gray-200 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 transition-all outline-none" 
                                />
                                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-bold text-[11px] text-gray-400">BDT</span>
                            </div>

                            {/* Quick Presets */}
                            <div className="flex gap-1.5 mt-1.5">
                                {[100, 500, 1000].map(val => (
                                    <button 
                                        key={val} 
                                        type="button" 
                                        onClick={() => setBdtAmount(val.toString())} 
                                        className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-[11px] font-semibold text-gray-700 transition-colors"
                                    >
                                        ৳{val}
                                    </button>
                                ))}
                                <button 
                                    type="button" 
                                    onClick={() => setBdtAmount(Math.floor(balance).toString())} 
                                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[11px] font-bold transition-colors ml-auto border border-emerald-200/50"
                                >
                                    MAX (৳{Math.floor(balance)})
                                </button>
                            </div>
                        </div>

                        {/* Middle: Calculated Crypto Output */}
                        <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3 flex justify-between items-center">
                            <div>
                                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">You Will Receive (আপনি পাবেন)</span>
                                <span className="text-[11px] text-emerald-600 font-medium">Rate: 1 {selectedAsset} ≈ ৳{cryptoRate} BDT</span>
                            </div>
                            <div className="text-right">
                                <span className="text-[15px] font-bold text-emerald-700">{calculatedCrypto}</span>
                                <span className="text-[11px] font-bold text-emerald-800 ml-1">{selectedAsset}</span>
                            </div>
                        </div>

                        {/* Bottom Field: Receive Address */}
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    Receive Address (TON Wallet)
                                </label>
                                {userTonAddress && (
                                    <button 
                                        type="button" 
                                        onClick={() => setReceiveAddress(userTonAddress)} 
                                        className="text-[10px] text-emerald-600 font-bold hover:underline"
                                    >
                                        Use Connected Wallet
                                    </button>
                                )}
                            </div>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    value={receiveAddress} 
                                    onChange={e => setReceiveAddress(e.target.value)} 
                                    placeholder="UQ... or EQ..." 
                                    className="w-full bg-gray-50 rounded-xl p-3 pr-10 text-[12px] font-mono font-bold text-gray-900 border border-gray-200 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 transition-all outline-none" 
                                />
                                <button 
                                    type="button"
                                    onClick={async () => {
                                        try {
                                            const text = await navigator.clipboard.readText();
                                            if (text) setReceiveAddress(text.trim());
                                        } catch (e) {}
                                    }}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 bg-white text-gray-400 hover:text-emerald-600 rounded-lg transition-all shadow-sm border border-gray-200"
                                    title="Paste"
                                >
                                    <ClipboardPaste size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Balance Warning if Insufficient */}
                        {hasInsufficientBalance && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex items-start gap-2 animate-in fade-in duration-200">
                                <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                                <div className="text-[11px] text-amber-800">
                                    <p className="font-bold">অপর্যাপ্ত ব্যালেন্স!</p>
                                    <p className="mt-0.5">আপনার অ্যাকাউন্টে আছে ৳{balance} TK। দয়া করে প্রথমে Add Money করুন।</p>
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="pt-1">
                            {hasInsufficientBalance ? (
                                <button 
                                    onClick={onGoToAddMoney} 
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-md shadow-emerald-500/20 active:scale-95 transition-all text-[12px] flex items-center justify-center gap-1.5"
                                >
                                    <PlusCircle size={16} />
                                    ADD MONEY TO WALLET
                                </button>
                            ) : (
                                <button 
                                    onClick={handleConfirmBuy} 
                                    disabled={!numBdt || !receiveAddress || numBdt < 20} 
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3 rounded-xl shadow-md shadow-emerald-600/20 active:scale-95 transition-all text-[12px] flex items-center justify-center gap-1.5"
                                >
                                    <Coins size={16} />
                                    CONFIRM & BUY {selectedAsset}
                                </button>
                            )}
                        </div>
                    </div>
                )}
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
        userId: user?.id || 123456789 || 123456789, 
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
        userId: user?.id || 123456789 || 123456789, 
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
        <div className="glass-panel p-3.5 rounded-2xl relative overflow-visible z-10 transition-all duration-300 hover:premium-shadow">
           
           <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 bg-[var(--color-brand)]/10 rounded-xl flex items-center justify-center text-[var(--color-brand)] shadow-inner">
                  <ArrowRightLeft size={16} strokeWidth={2.5} />
              </div>
              <h2 className="text-[15px] font-extrabold text-[var(--color-text-primary)] tracking-tight leading-tight">Swap to Taka</h2>
           </div>
           {!showKeyboard && (
              <>
                 <p className="text-[var(--color-text-secondary)] text-[12px] mb-3 font-medium">
                    Instantly convert Crypto to TK. Securely via Tonkeeper.
                 </p>
                 
                 <div className="flex items-center justify-center mb-3">
                    {!userTonAddress ? (
                       <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-red-50/80 border border-red-100/50 rounded-full">
                          <div className="w-1.5 h-1.5 bg-[var(--color-danger)] rounded-full animate-pulse" />
                          <span className="text-[9px] font-bold text-[var(--color-danger)] tracking-[0.1em] uppercase">Wallet Disconnected</span>
                       </div>
                    ) : (
                       <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[var(--color-brand)]/5 border border-[var(--color-brand)]/10 rounded-full">
                          <div className="w-1.5 h-1.5 bg-[var(--color-brand)] rounded-full" />
                          <span className="text-[9px] font-bold text-[var(--color-brand)] tracking-[0.1em] uppercase">Wallet Connected</span>
                       </div>
                    )}
                 </div>
              </>
           )}

           <div className="space-y-1.5 relative z-10">
              <div onClick={() => { setInputType('crypto'); setShowKeyboard(true); }} className={`p-3 rounded-xl cursor-pointer transition-all duration-300 ${showKeyboard && inputType === 'crypto' ? 'glass-button ring-1 ring-[var(--color-brand)]/50' : 'glass-input-container input-shadow'}`}>
               <div className="flex justify-between items-center mb-2">
                  <label className={`text-[10px] font-bold uppercase tracking-[0.15em] ${inputType === 'crypto' ? 'text-[var(--color-brand)]' : 'text-[var(--color-text-secondary)]'}`}>You Pay</label>
                  
                  <div className="relative">
                     <div onClick={(e) => { e.stopPropagation(); setShowAssetModal(!showAssetModal); }} className="flex items-center gap-1.5 bg-white border border-[var(--color-border)] rounded-full px-2.5 py-1 cursor-pointer hover:border-[var(--color-brand)]/50 transition-colors shadow-sm active-scale z-10">
                        <AssetIcon />
                        <span className="text-[11px] font-extrabold text-[var(--color-text-primary)]">{asset}</span>
                        <ChevronDown size={13} className="text-[var(--color-text-secondary)] ml-0.5" />
                     </div>
                     
                     {showAssetModal && (
                        <>
                           <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setShowAssetModal(false); }}></div>
                           {asset !== 'USDT' && (
                              <button onClick={(e) => { e.stopPropagation(); setAsset('USDT'); setShowAssetModal(false); }} className="absolute left-0 right-0 top-full mt-2 w-full flex items-center justify-center gap-2 bg-white border border-[var(--color-border)] rounded-full px-2.5 py-1 hover:border-[var(--color-brand)]/50 transition-colors shadow-sm active-scale z-50 animate-in fade-in zoom-in-95 duration-200">
                                 <CircleDollarSign size={13} className="text-emerald-500" />
                                 <span className="text-[11px] font-extrabold text-[var(--color-text-primary)]">USDT</span>
                              </button>
                           )}
                           {asset !== 'GRAM' && (
                              <button onClick={(e) => { e.stopPropagation(); setAsset('GRAM'); setShowAssetModal(false); }} className="absolute left-0 right-0 top-full mt-2 w-full flex items-center justify-center gap-2 bg-white border border-[var(--color-border)] rounded-full px-2.5 py-1 hover:border-[var(--color-brand)]/50 transition-colors shadow-sm active-scale z-50 animate-in fade-in zoom-in-95 duration-200">
                                 <Gem size={13} className="text-blue-500" />
                                 <span className="text-[11px] font-extrabold text-[var(--color-text-primary)]">GRAM</span>
                              </button>
                           )}
                        </>
                     )}
                  </div>
               </div>
                 
               <div className="flex items-baseline">
                  <div className={`text-3xl font-black tracking-tight ${cryptoAmount ? 'text-[var(--color-text-primary)]' : 'text-gray-300'}`}>
                     {cryptoAmount || '0'}
                  </div>
                  {inputType === 'crypto' && showKeyboard && (
                      <span className="w-0.5 h-6 bg-[var(--color-brand)] animate-pulse ml-1 rounded-full"></span>
                  )}
               </div>
               
               <div className="mt-1 text-[10px] font-bold text-[var(--color-text-secondary)]/70 uppercase tracking-wider">
                  Enter {asset} amount
               </div>
              </div>

              {/* Swap Icon */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md border border-[var(--color-border)]/50">
                      <ArrowRightLeft size={14} className="rotate-90 text-[var(--color-text-secondary)]" />
                  </div>
              </div>

              {/* Fiat Receive Block */}
              <div onClick={() => { setInputType('fiat'); setShowKeyboard(true); }} className={`p-3 rounded-xl cursor-pointer transition-all duration-300 ${showKeyboard && inputType === 'fiat' ? 'glass-button ring-1 ring-[var(--color-brand)]/50' : 'glass-input-container input-shadow'}`}>
               <div className="flex justify-between items-center mb-2">
                  <label className={`text-[10px] font-bold uppercase tracking-[0.15em] ${inputType === 'fiat' ? 'text-[var(--color-brand)]' : 'text-[var(--color-text-secondary)]'}`}>You Receive</label>
                  
                  <div className="flex items-center gap-1.5 bg-emerald-50/50 border border-emerald-100/50 rounded-full px-2 py-0.5">
                      <span className="text-[9px] font-black text-emerald-600 tracking-wider">TK BDT</span>
                  </div>
               </div>
                 
               <div className="flex items-baseline">
                  <div className={`text-3xl font-black tracking-tight ${fiatAmount ? 'text-[var(--color-text-primary)]' : 'text-gray-300'}`}>
                     {fiatAmount || '0'}
                  </div>
                  {inputType === 'fiat' && showKeyboard && (
                      <span className="w-0.5 h-6 bg-[var(--color-brand)] animate-pulse ml-1 rounded-full"></span>
                  )}
               </div>
               <div className="mt-1 text-[10px] font-bold text-[var(--color-text-secondary)]/70 uppercase tracking-wider">
                  Enter Taka amount
               </div>
              </div>
           </div>

           {!showKeyboard && (
              <div className="mt-4 mb-1">
                 <button onPointerDown={handleSell} disabled={loading || !cryptoAmount || parseFloat(cryptoAmount) <= 0 || !userTonAddress} className={`w-full h-[46px] rounded-xl font-bold text-[14px] tracking-wide transition-all duration-300 ${!userTonAddress ? 'bg-gray-100 text-gray-400' : loading ? 'bg-[var(--color-brand)]/70 text-white' : 'bg-[var(--color-brand)] text-white shadow-md active-scale'}`}>
                    {loading ? (
                        <div className="flex items-center justify-center gap-2">
                            <Loader2 size={16} className="animate-spin" />
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

function TransactionStatusModal({ status, message }) {
  if (!status) return null;
  const isSuccess = status === 'success';
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
        <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${isSuccess ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}>
          {isSuccess ? <CheckCircle2 size={36} /> : <X size={36} />}
        </div>
        <h3 className="text-lg font-extrabold text-gray-900 mb-2">
          {isSuccess ? 'Transaction Successful' : 'Notice'}
        </h3>
        <p className="text-xs text-gray-600 mb-4">{message}</p>
      </div>
    </div>
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
        <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300 pb-20 max-w-md mx-auto">
            <div className="flex items-center gap-3 mb-4">
                <button onClick={onBack} className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 active:scale-95 transition-transform text-gray-600">
                    <ChevronRight size={18} className="rotate-180" />
                </button>
                <h2 className="text-[15px] font-extrabold text-gray-900 leading-tight">Transaction History</h2>
            </div>
            
            {loading ? (
                <div className="flex justify-center py-10">
                    <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : history.length === 0 ? (
                <div className="bg-white p-6 rounded-2xl text-center shadow-sm border border-gray-100 flex flex-col items-center">
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-3">
                        <Clock size={20} />
                    </div>
                    <p className="font-bold text-gray-900 text-[13px] mb-0.5">No Transactions Yet</p>
                    <p className="text-[12px] text-gray-500">Your buying, selling and withdrawal history will appear here.</p>
                </div>
            ) : (
                <div className="space-y-2.5">
                    {history.map((tx, idx) => {
                        const isWithdraw = tx.type === 'withdraw';
                        const isBuy = tx.type === 'buy';
                        const isSell = tx.type === 'sell';
                        const ts = tx.timestamp?._seconds ? tx.timestamp._seconds * 1000 : (typeof tx.timestamp === 'number' ? tx.timestamp : (tx.timestamp ? new Date(tx.timestamp).getTime() : Date.now()));
                        const formattedDate = new Date(ts).toLocaleDateString() + ' ' + new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                        return (
                            <div key={idx} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                        isWithdraw ? 'bg-orange-50 text-orange-600' :
                                        isBuy ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                                    }`}>
                                        {isWithdraw ? <Wallet size={16} /> : isBuy ? <ArrowDown size={16} /> : <ArrowUp size={16} />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 text-[13px] leading-tight capitalize">
                                            {isWithdraw ? `Withdraw (${tx.method || 'BDT'})` : `${tx.type} ${tx.asset || 'Crypto'}`}
                                        </p>
                                        <p className="text-[11px] font-medium text-gray-400 mt-0.5">
                                            {formattedDate} {tx.number ? `• ${tx.number}` : ''}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-extrabold text-gray-900 text-[13px]">
                                        {isWithdraw ? `-৳${tx.amount} TK` : isBuy ? `+${tx.amount} ${tx.asset || 'TON'}` : `-${tx.amount} ${tx.asset || 'TON'}`}
                                    </p>
                                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mt-0.5 uppercase tracking-wider ${
                                        tx.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                                        tx.status === 'rejected' ? 'bg-rose-50 text-rose-600' :
                                        'bg-amber-50 text-amber-600'
                                    }`}>
                                        {tx.status || 'PENDING'}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}


function ProfilePage({ user, balance, fiatWallet, fiatWithdrawPending, onGoToWithdraw, onGoToHistory, setFiatWallet, reloadData }) {
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
              userId: user?.id || 123456789,
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
    <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300 max-w-md mx-auto">
      {/* Profile Header */}
      <div className="bg-white p-3.5 rounded-2xl premium-shadow border border-[var(--color-border)] flex items-center gap-3 relative overflow-hidden">
         <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center text-[var(--color-brand)] font-bold text-lg relative z-10 shrink-0">
            {user?.first_name?.charAt(0)?.toUpperCase() || 'U'}
         </div>
         <div className="relative z-10 flex-1">
            <h2 className="text-[15px] font-extrabold text-[var(--color-text-primary)] leading-tight">{user?.first_name || 'User'}</h2>
            <p className="text-[var(--color-text-secondary)] text-[12px] font-medium">@{user?.username || 'user'}</p>
         </div>
      </div>

      {/* Balance & User ID */}
      <div className="grid grid-cols-2 gap-2.5">
         <div className="bg-white p-3.5 rounded-xl premium-shadow border border-[var(--color-border)] flex flex-col justify-center">
            <p className="text-[10px] font-semibold text-[var(--color-text-secondary)] mb-0.5 uppercase tracking-wide">Available Balance</p>
            <p className="text-lg font-black text-[var(--color-text-primary)]">{balance} <span className="text-[var(--color-brand)] text-xs">TK</span></p>
         </div>
         <div className="bg-white p-3.5 rounded-xl premium-shadow border border-[var(--color-border)] flex flex-col justify-center">
            <p className="text-[10px] font-semibold text-[var(--color-text-secondary)] mb-0.5 uppercase tracking-wide">User ID</p>
            <p className="text-[12px] font-mono font-bold text-[var(--color-text-primary)] flex items-center gap-1.5 cursor-pointer" onClick={() => { navigator.clipboard.writeText(user?.id); if (WebApp.HapticFeedback) WebApp.HapticFeedback.impactOccurred('light'); }}>
               {user?.id || '000000'} <Copy size={11} className="text-gray-400 active:text-emerald-600 transition-colors" />
            </p>
         </div>
      </div>

      {/* Withdraw Button */}
      <button onClick={handleWithdrawClick} disabled={withdrawing} className="w-full bg-gradient-to-r from-[var(--color-brand)] to-emerald-500 text-white font-bold h-[46px] rounded-xl shadow-md shadow-[var(--color-brand)]/20 active:scale-[0.98] transition-all disabled:opacity-70 flex items-center justify-center gap-2 text-[14px]">
         {withdrawing ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> PROCESSING...</>
         ) : (
            <><Wallet size={16} /> WITHDRAW BALANCE</>
         )}
      </button>

      {/* Transaction History Button */}
      <div onClick={onGoToHistory} className="bg-white p-3.5 rounded-2xl premium-shadow border border-[var(--color-border)] flex justify-between items-center group active:scale-[0.98] transition-transform cursor-pointer">
         <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 group-hover:scale-105 transition-transform shrink-0">
               <Clock size={18} />
            </div>
            <div>
               <span className="font-bold text-[var(--color-text-primary)] block text-[13px] leading-tight">Transaction History</span>
               <span className="text-[11px] text-[var(--color-text-secondary)] font-medium">All buys, sells & withdrawals</span>
            </div>
         </div>
         <ChevronRight size={16} className="text-gray-400 group-hover:text-purple-600 transition-colors" />
      </div>

      {/* Refer & Earn */}
      <div className="bg-white p-3.5 rounded-2xl premium-shadow border border-[var(--color-border)] flex justify-between items-center group active:scale-[0.98] transition-transform cursor-pointer">
         <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-[var(--color-brand-secondary)] group-hover:scale-105 transition-transform shrink-0">
               <Share2 size={18} />
            </div>
            <div>
               <span className="font-bold text-[var(--color-text-primary)] block text-[13px] leading-tight">Refer & Earn</span>
               <span className="text-[11px] text-[var(--color-text-secondary)] font-medium">Invite friends for bonus</span>
            </div>
         </div>
         <ChevronRight size={16} className="text-gray-400 group-hover:text-[var(--color-brand-secondary)] transition-colors" />
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
        <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300 max-w-md mx-auto pb-24">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <button onClick={onBack} className="p-2 bg-white rounded-full premium-shadow text-[var(--color-text-primary)] active:scale-95 transition-transform border border-gray-100">
                    <ChevronRight size={18} className="rotate-180" strokeWidth={2.5} />
                </button>
                <div>
                    <h2 className="text-[15px] font-extrabold text-[var(--color-text-primary)] leading-tight">Withdraw Funds</h2>
                    <p className="text-[var(--color-text-secondary)] text-[12px] font-medium">Cashout to {fiatWallet?.method || 'Wallet'}</p>
                </div>
            </div>

            {/* Optional Small Status Badge for Pending without blocking */}
            {fiatWithdrawPending && fiatWithdrawPending.status === 'pending' && (
                <div className="bg-amber-50 border border-amber-200/80 p-3 rounded-2xl flex items-center justify-between gap-3 shadow-sm">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-amber-500/20 text-amber-600 rounded-full flex items-center justify-center shrink-0">
                            <Clock size={15} />
                        </div>
                        <div>
                            <p className="text-[12px] font-bold text-amber-800">Processing: ৳{fiatWithdrawPending.amount} TK</p>
                            <p className="text-[11px] text-amber-600">via {fiatWithdrawPending.method} ({fiatWithdrawPending.number})</p>
                        </div>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-800 px-2 py-0.5 rounded-md">
                        In Progress
                    </span>
                </div>
            )}

            {/* Amount Input Card */}
            <div className="bg-white p-3.5 rounded-2xl premium-shadow border border-[var(--color-border)]">
                <label className="flex justify-between items-center mb-2">
                    <span className="text-[11px] font-extrabold text-[var(--color-text-secondary)] uppercase tracking-[0.15em]">Amount (BDT)</span>
                    <span className="text-[12px] font-bold text-[var(--color-text-primary)]">Bal: ৳{balance.toFixed(2)}</span>
                </label>
                <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-gray-400 font-bold text-lg">৳</span>
                    <input 
                        type="number" 
                        value={amount} 
                        onChange={(e) => setAmount(e.target.value)} 
                        placeholder="0.00" 
                        className="w-full h-[50px] bg-gray-50 border border-gray-100 rounded-xl pl-8 pr-16 font-black text-xl text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)] focus:bg-white focus:ring-2 focus:ring-[var(--color-brand)]/10 transition-all placeholder:text-gray-300"
                    />
                    <button onClick={handleMax} className="absolute right-2.5 px-2.5 py-1 bg-[var(--color-brand)]/10 text-[var(--color-brand)] font-bold text-[11px] rounded-lg active:scale-95 transition-transform">MAX</button>
                </div>
            </div>

            {/* Live Fee Breakdown */}
            {amount && !isNaN(amount) && parseFloat(amount) > 0 && (
                <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E4E7EC] shadow-sm space-y-1.5 text-[12px]">
                    <div className="flex justify-between items-center">
                        <span className="text-[#475467] font-medium">Withdraw Amount</span>
                        <span className="font-bold text-[#101828]">৳ {parseFloat(amount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-red-500 font-medium">Fee (5%)</span>
                        <span className="font-bold text-red-500">- ৳ {(parseFloat(amount) * 0.05).toFixed(2)}</span>
                    </div>
                    <div className="h-px bg-[#E4E7EC] my-1 w-full" />
                    <div className="flex justify-between items-center text-[12px]">
                        <span className="text-[#00A878] font-bold">You will receive</span>
                        <span className="font-black text-[#00A878] text-[13px]">৳ {(parseFloat(amount) * 0.95).toFixed(2)}</span>
                    </div>
                </div>
            )}

            {/* Saved Wallet Info */}
            <div className="bg-white p-3.5 rounded-2xl premium-shadow border border-[var(--color-border)] flex items-center gap-3">
                <img src={getLogo()} alt={fiatWallet?.method} className="w-10 h-10 rounded-full object-cover border border-gray-100 p-0.5" />
                <div className="flex-1">
                    <h4 className="text-[13px] font-bold text-[var(--color-text-primary)] leading-tight">{fiatWallet?.method || 'bKash'} Wallet</h4>
                    <p className="text-[12px] font-mono font-bold text-[var(--color-text-secondary)]">{fiatWallet?.number}</p>
                    {fiatWallet?.name && <p className="text-[11px] text-gray-400">{fiatWallet?.name}</p>}
                </div>
            </div>

            {/* Warning Note */}
            <div className="bg-blue-50/60 border border-blue-100/70 p-3 rounded-xl flex items-center gap-2.5">
                <Info size={16} className="text-blue-500 shrink-0" />
                <p className="text-[11px] text-blue-700 font-medium leading-tight">
                    উইথড্র রিকোয়েস্ট সাধারণত <b>১ থেকে ২ ঘণ্টার</b> মধ্যে এবং সর্বোচ্চ <b>২৪ ঘণ্টার</b> মধ্যে সম্পূর্ণ হয়।
                </p>
            </div>

            {/* Submit Button */}
            <button 
                onClick={handleSubmit} 
                disabled={!amount || isSubmitting} 
                className="w-full h-[48px] mt-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold text-[14px] tracking-wide flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100 shadow-md shadow-emerald-500/20"
            >
                {isSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "WITHDRAW FUNDS"}
            </button>
        </div>
    );
}
