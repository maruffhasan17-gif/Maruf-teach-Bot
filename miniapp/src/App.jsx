import React, { useState, useEffect } from 'react';
import { Home, User, ArrowDown, ArrowUp, ChevronRight, Zap, Share2, Copy, X, ArrowRightLeft, Wallet, Gift, ArrowUpRight, TrendingUp, Sparkles, Info, CircleDollarSign, Gem, Coins, Delete, ChevronDown, Clock, Save, CheckCircle2 , Volume2, VolumeX, Check, Settings , ClipboardPaste, Loader2, PlusCircle, AlertCircle, RefreshCw, Headphones, Send } from 'lucide-react';
import { TonConnectUIProvider, TonConnectButton, useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import WebApp from '@twa-dev/sdk';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchUserData, submitFreeTonTask, saveFiatWallet, withdrawFiat, submitSellOrder, buildTransaction, submitBuyOrder, submitAddMoney, submitBuyCrypto, submitSupportMessage, fetchMarketRates } from './api';

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

const translations = {
  bn: {
    appName: 'Crypto Buy Sell',
    welcome: 'স্বাগতম',
    totalBalance: 'মোট ব্যালেন্স',
    balanceSub: 'উইথড্র ও ক্রিপ্টো কেনায় ব্যবহারযোগ্য',
    addMoney: 'অ্যাড মানি',
    buyCrypto: 'ক্রিপ্টো কিনুন',
    buyCryptoSub: 'ইনস্ট্যান্ট সেন্ড',
    sellCrypto: 'ক্রিপ্টো বিক্রি',
    sellCryptoSub: 'ইনস্ট্যান্ট সোয়াপ',
    chartTitle: 'USDT/TK লাইভ চার্ট',
    home: 'হোম',
    sell: 'সেল',
    profile: 'প্রোফাইল',
    claim: 'ফ্রি ক্লেইম',
    availableBal: 'অ্যাভেইলেবল ব্যালেন্স',
    userId: 'ইউজার আইডি',
    withdrawBalance: 'টাকা তুলুন (WITHDRAW)',
    transactionHistory: 'ট্রানজেকশন হিস্ট্রি',
    transactionHistorySub: 'সব ক্রয়, বিক্রয় ও উত্তোলনের বিবরণ',
    customerSupport: 'সাপোর্ট ও সাহায্য',
    customerSupportSub: 'সরাসরি অ্যাডমিন টিমের সাথে কথা বলুন',
    languageSetting: 'ভাষা পরিবর্তন (Language)',
    currentLang: 'বাংলা',
    selectCrypto: 'ক্রিপ্টো নির্বাচন করুন',
    bdtSpend: 'টাকার পরিমাণ (BDT)',
    youWillReceive: 'আপনি পাবেন',
    receiveAddress: 'রিসিভ অ্যাড্রেস (ওয়ালেট)',
    confirmBuy: 'ক্রয় নিশ্চিত করুন',
    insufficientBal: 'অপর্যাপ্ত ব্যালেন্স!',
    sendTrx: 'টাকা পাঠিয়ে TrxID সাবমিট করুন',
    adminNumber: 'অ্যাডমিন নাম্বার',
    verifyAddMoney: 'ভেরিফাই ও অ্যাড মানি',
    depositAmount: 'জমার পরিমাণ (BDT)',
    selectMethod: 'পেমেন্ট মেথড সিলেক্ট করুন',
    instantCreditNote: 'টাকা পাঠানোর সাথে সাথে TrxID অটো-ভেরিফাই হবে এবং ইন-অ্যাপ ব্যালেন্সে যুক্ত হবে।',
    continuePayment: 'পরবর্তী ধাপ (পেমেন্ট)',
    inProgress: 'প্রক্রিয়াধীন',
    completed: 'সফল',
    withdrawFunds: 'টাকা উত্তোলন করুন',
    fee: 'ফি (৫%)',
    youReceive: 'আপনি পাবেন',
    withdrawNote: 'উইথড্র রিকোয়েস্ট সাধারণত ১ থেকে ২ ঘণ্টার মধ্যে এবং সর্বোচ্চ ২৪ ঘণ্টার মধ্যে সম্পন্ন হয়।',
    loading: 'লোড হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...'
  },
  en: {
    appName: 'Crypto Buy Sell',
    welcome: 'Welcome back',
    totalBalance: 'Total Balance',
    balanceSub: 'Available for withdrawal & crypto purchase',
    addMoney: 'Add Money',
    buyCrypto: 'Buy Crypto',
    buyCryptoSub: 'Instant Send',
    sellCrypto: 'Sell Crypto',
    sellCryptoSub: 'Instant Swap',
    chartTitle: 'USDT/TK Live Chart',
    home: 'HOME',
    sell: 'SELL',
    profile: 'PROFILE',
    claim: 'CLAIM',
    availableBal: 'Available Balance',
    userId: 'User ID',
    withdrawBalance: 'WITHDRAW BALANCE',
    transactionHistory: 'Transaction History',
    transactionHistorySub: 'All buys, sells & withdrawals',
    customerSupport: 'Customer Support',
    customerSupportSub: 'Direct message to admin team',
    languageSetting: 'Language / ভাষা',
    currentLang: 'English',
    selectCrypto: 'Select Crypto Asset',
    bdtSpend: 'BDT Amount to Spend',
    youWillReceive: 'You Will Receive',
    receiveAddress: 'Receive Address (TON Wallet)',
    confirmBuy: 'CONFIRM & BUY',
    insufficientBal: 'Insufficient Balance!',
    sendTrx: 'Send Money & Submit TrxID',
    adminNumber: 'Admin Number',
    verifyAddMoney: 'VERIFY & ADD MONEY',
    depositAmount: 'Deposit Amount (BDT)',
    selectMethod: 'Select Payment Method',
    instantCreditNote: 'Payment is auto-verified via SMS and credited to your balance instantly.',
    continuePayment: 'CONTINUE TO PAYMENT',
    inProgress: 'In Progress',
    completed: 'Completed',
    withdrawFunds: 'WITHDRAW FUNDS',
    fee: 'Fee (5%)',
    youReceive: 'You will receive',
    withdrawNote: 'Withdrawals usually take 1 to 2 hours or up to 24 hours to process.',
    loading: 'Loading, please wait...'
  }
};

export default function App() {
  const [lang, setLang] = useState(() => localStorage.getItem('app_lang') || 'bn');
  const t = translations[lang] || translations.bn;

  const handleSetLang = (newLang) => {
    setLang(newLang);
    localStorage.setItem('app_lang', newLang);
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }
  };

  const [appLoading, setAppLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => {
      setAppLoading(false);
    }, 450);
    return () => clearTimeout(timer);
  }, []);

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

  if (appLoading) {
    return (
      <div className="fixed inset-0 bg-[#f8fafc] z-[99999] flex flex-col items-center justify-center font-sans select-none">
        <div className="w-24 h-24 rounded-3xl bg-white flex items-center justify-center shadow-xl shadow-slate-200/60 border border-slate-100 p-2 animate-bounce">
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Crypto Buy Sell" className="w-full h-full object-contain drop-shadow" />
        </div>
        <h2 className="text-[#0f172a] font-black text-lg mt-4 tracking-tight">Crypto Buy Sell</h2>
        <p className="text-[#64748b] text-xs mt-1.5 font-semibold flex items-center gap-2">
          <Loader2 size={13} className="animate-spin text-emerald-500" />
          {lang === 'bn' ? 'লোড হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...' : 'Loading, please wait...'}
        </p>
        <div className="w-28 h-1 bg-[#e2e8f0] rounded-full mt-4 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <TonConnectUIProvider manifestUrl={manifestUrl}>
      <TonConnectStyles />
      <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] pb-28 relative overflow-x-hidden font-sans selection:bg-[var(--color-brand)]/20">
        
        <div className="relative z-10 p-4 max-w-md mx-auto">
          {/* Header */}
          <div id="main-app-header" className="flex justify-between items-center mb-6 pt-2 transition-all duration-300">
             <div className="flex items-center gap-3">
                 <div className="w-[42px] h-[42px] bg-white rounded-full flex items-center justify-center font-bold text-[var(--color-text-primary)] premium-shadow border border-[var(--color-border)] p-1 overflow-hidden">
                    <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Crypto Buy Sell" className="w-full h-full object-contain" />
                 </div>
                 <div>
                    <h1 className="text-base font-semibold text-[var(--color-text-primary)] leading-tight">{t.appName}</h1>
                    <p className="text-[10px] font-medium text-[var(--color-brand)] uppercase tracking-[0.15em]">{t.welcome}</p>
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
                  lang={lang}
                  t={t}
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
                  lang={lang}
                  t={t}
                  onDone={() => setActiveTab('home')}
                  onGoToBuyCrypto={() => {
                      setActiveTab('home');
                      setShowBuyCryptoModal(true);
                  }}
                  reloadData={() => loadData(user?.id || 123456789)}
              />
          )}
          {activeTab === 'sell' && (
              <SellCryptoPage 
                  user={user} 
                  lang={lang} 
                  t={t} 
                  onDone={() => setActiveTab('home')} 
                  onGoToWithdraw={() => setActiveTab('withdraw')} 
                  reloadData={() => loadData(user?.id || 123456789)} 
              />
          )}
          {activeTab === 'history' && <HistoryPage user={user} lang={lang} t={t} onBack={() => setActiveTab('profile')} />}
          {activeTab === 'profile' && (
              <ProfilePage 
                  user={user} 
                  balance={balance} 
                  mbsId={mbsId} 
                  lang={lang}
                  t={t}
                  onSetLang={handleSetLang}
                  fiatWallet={fiatWallet} 
                  fiatWithdrawPending={fiatWithdrawPending} 
                  onGoToWithdraw={() => setActiveTab('withdraw')} 
                  onGoToHistory={() => setActiveTab('history')} 
                  setFiatWallet={setFiatWallet} 
                  reloadData={() => loadData(user?.id || 123456789)} 
              />
          )}
          {activeTab === 'claim' && <ClaimPage user={user} lang={lang} t={t} onBack={() => setActiveTab('home')} />}
          {activeTab === 'withdraw' && (
              <WithdrawFiatPage 
                  user={user} 
                  balance={balance} 
                  lang={lang}
                  t={t}
                  fiatWallet={fiatWallet} 
                  fiatWithdrawPending={fiatWithdrawPending} 
                  onBack={() => setActiveTab('profile')} 
                  reloadData={() => loadData(user?.id || 123456789)} 
              />
          )}
        </div>

        {/* Buy Crypto Modal (Realtime On-Chain Send) */}
        <BuyCryptoModal 
            isOpen={showBuyCryptoModal}
            onClose={() => setShowBuyCryptoModal(false)}
            user={user}
            balance={balance}
            lang={lang}
            t={t}
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
                            <span className={`text-[9px] font-extrabold tracking-widest transition-colors duration-300 ${activeTab === 'home' ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-600'}`}>{t.home}</span>
                        </div>
                        {/* Active Indicator & Background */}
                        <div className={`absolute bottom-0 w-5 h-1 bg-emerald-500 rounded-t-full transition-all duration-300 ${activeTab === 'home' ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-50'}`} />
                        <div className={`absolute inset-1 bg-emerald-50/50 rounded-[24px] transition-opacity duration-300 ${activeTab === 'home' ? 'opacity-100' : 'opacity-0'}`} />
                    </button>
  
                    {/* ADD MONEY */}
                    <button onClick={() => setActiveTab('add-money')} className="relative flex flex-col items-center justify-center w-[76px] h-[64px] transition-all duration-300 group active:scale-95">
                        <div className="relative flex flex-col items-center justify-center z-10">
                            <PlusCircle size={22} strokeWidth={activeTab === 'add-money' ? 2.5 : 2} className={`mb-1.5 transition-colors duration-300 ${activeTab === 'add-money' ? 'text-emerald-500' : 'text-gray-400 group-hover:text-gray-600'}`} />
                            <span className={`text-[8px] font-extrabold tracking-wider transition-colors duration-300 ${activeTab === 'add-money' ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-600'}`}>{t.addMoney}</span>
                        </div>
                        {/* Active Indicator & Background */}
                        <div className={`absolute bottom-0 w-5 h-1 bg-emerald-500 rounded-t-full transition-all duration-300 ${activeTab === 'add-money' ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-50'}`} />
                        <div className={`absolute inset-1 bg-emerald-50/50 rounded-[24px] transition-opacity duration-300 ${activeTab === 'add-money' ? 'opacity-100' : 'opacity-0'}`} />
                    </button>
  
                    {/* SELL */}
                    <button onClick={() => setActiveTab('sell')} className="relative flex flex-col items-center justify-center w-[76px] h-[64px] transition-all duration-300 group active:scale-95">
                        <div className="relative flex flex-col items-center justify-center z-10">
                            <ArrowUp size={22} strokeWidth={activeTab === 'sell' ? 2.5 : 2} className={`mb-1.5 transition-colors duration-300 ${activeTab === 'sell' ? 'text-emerald-500' : 'text-gray-400 group-hover:text-gray-600'}`} />
                            <span className={`text-[9px] font-extrabold tracking-widest transition-colors duration-300 ${activeTab === 'sell' ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-600'}`}>{t.sell}</span>
                        </div>
                        {/* Active Indicator & Background */}
                        <div className={`absolute bottom-0 w-5 h-1 bg-emerald-500 rounded-t-full transition-all duration-300 ${activeTab === 'sell' ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-50'}`} />
                        <div className={`absolute inset-1 bg-emerald-50/50 rounded-[24px] transition-opacity duration-300 ${activeTab === 'sell' ? 'opacity-100' : 'opacity-0'}`} />
                    </button>
  
                    {/* PROFILE */}
                    <button onClick={() => setActiveTab('profile')} className="relative flex flex-col items-center justify-center w-[76px] h-[64px] transition-all duration-300 group active:scale-95">
                        <div className="relative flex flex-col items-center justify-center z-10">
                            <User size={22} strokeWidth={activeTab === 'profile' ? 2.5 : 2} className={`mb-1.5 transition-colors duration-300 ${activeTab === 'profile' ? 'text-emerald-500' : 'text-gray-400 group-hover:text-gray-600'}`} />
                            <span className={`text-[9px] font-extrabold tracking-widest transition-colors duration-300 ${activeTab === 'profile' ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-600'}`}>{t.profile}</span>
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

function HomePage({ balance, user, fiatWithdrawPending, onGoToClaim, onOpenBuyCrypto, onGoToSell, onGoToAddMoney, lang = 'bn', t = {} }) {
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
                              {lang === 'bn' ? 'উইথড্র সফল:' : 'Withdrawal Sent:'} <b>{fiatWithdrawPending.amount} TK</b>
                          </p>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-500/20 px-2 py-0.5 rounded">{t?.completed || 'Success'}</span>
                  </div>
              )
          ) : fiatWithdrawPending.status === 'rejected' ? (
              Date.now() - (fiatWithdrawPending.rejectedAt || Date.now()) < 3 * 60 * 60 * 1000 && (
                  <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-xl flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2">
                          <AlertCircle size={16} className="text-rose-500 shrink-0" />
                          <div>
                              <p className="text-[12px] text-rose-800 font-bold leading-tight">
                                  {lang === 'bn' ? 'উইথড্র বাতিল (রিফান্ড সম্পন্ন):' : 'Withdrawal Rejected (Refunded):'} <b>{fiatWithdrawPending.amount} TK</b>
                              </p>
                              {fiatWithdrawPending.rejectReason && (
                                  <p className="text-[10px] text-rose-600 mt-0.5 font-medium">
                                      {lang === 'bn' ? 'কারণ: ' : 'Reason: '}{fiatWithdrawPending.rejectReason}
                                  </p>
                              )}
                          </div>
                      </div>
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-500/20 px-2 py-0.5 rounded shrink-0">
                          {lang === 'bn' ? 'বাতিল' : 'Rejected'}
                      </span>
                  </div>
              )
          ) : (fiatWithdrawPending.status === 'pending' || fiatWithdrawPending.status === 'waiting') ? (
              <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                      <Clock size={16} className="text-amber-500 shrink-0" />
                      <p className="text-[12px] text-amber-800 font-bold">
                          {lang === 'bn' ? 'উইথড্র প্রক্রিয়াধীন:' : 'Withdrawal Pending:'} <b>{fiatWithdrawPending.amount} TK</b>
                      </p>
                  </div>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-500/20 px-2 py-0.5 rounded">#{fiatWithdrawPending.serial || '1'}</span>
              </div>
          ) : null
      )}
      
      {/* Total Balance Card */}
      <div className="bg-white p-4 rounded-2xl premium-shadow border border-[var(--color-border)] relative overflow-hidden">
         <div className="absolute top-3 right-3 pointer-events-none opacity-50">
            <AbstractWalletIcon />
         </div>
         <div className="flex justify-between items-start mb-1">
            <p className="text-[11px] font-bold text-[var(--color-text-secondary)] tracking-wider uppercase">{t?.totalBalance || 'Total Balance'}</p>
            <button 
                onClick={onGoToAddMoney} 
                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold rounded-full flex items-center gap-1 transition-colors border border-emerald-200/60 active:scale-95 shadow-sm"
            >
                <PlusCircle size={12} strokeWidth={2.5} />
                <span>{t?.addMoney || 'Add Money'}</span>
            </button>
         </div>
         <div className="flex items-baseline gap-1">
            <h2 className="text-3xl font-black text-[var(--color-text-primary)]">{balance}</h2>
            <span className="text-base font-bold text-[var(--color-brand)]">TK</span>
         </div>
         <p className="text-[12px] text-[var(--color-text-secondary)] mt-1">{t?.balanceSub || 'Available for withdrawal & crypto purchase'}</p>
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
                 <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider leading-none">{t?.buyCryptoSub || 'Instant Send'}</p>
                 <p className="text-[15px] font-bold text-white leading-tight mt-1 tracking-tight">{t?.buyCrypto || 'Buy Crypto'}</p>
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
                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none">{t?.sellCryptoSub || 'Instant Swap'}</p>
                 <p className="text-[15px] font-bold text-gray-900 leading-tight mt-1 tracking-tight">{t?.sellCrypto || 'Sell Crypto'}</p>
             </div>
         </button>
      </div>

      {/* Live Chart Card */}
      <div className="bg-white p-3.5 rounded-2xl premium-shadow border border-[var(--color-border)]">
         <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2 text-[var(--color-text-primary)]">
                <TrendingUp size={15} className="text-[var(--color-text-secondary)]" />
                <h3 className="text-[15px] font-bold">{t?.chartTitle || 'USDT/TK Live Chart'}</h3>
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




function AddMoneyPage({ user, lang = 'bn', t, onDone, onGoToBuyCrypto, reloadData }) {
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
                        {t?.buyCrypto || 'BUY CRYPTO NOW'}
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
                        {lang === 'bn' ? 'হোমে ফিরে যান' : 'BACK TO HOME'}
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
                        <h2 className="text-xl font-black text-gray-900 tracking-tight">
                            {lang === 'bn' ? 'পেমেন্ট ভেরিফিকেশন' : 'Send Money Verification'}
                        </h2>
                        <p className="text-gray-500 text-xs mt-0.5">
                            {t?.sendTrx || 'টাকা পাঠিয়ে TrxID সাবমিট করুন'}
                        </p>
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
                                <span className="text-[10px] text-gray-400 font-medium">{lang === 'bn' ? 'শুধু সেন্ড মানি' : 'Send Money Only'}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] text-gray-400 font-medium block">{lang === 'bn' ? 'সঠিক টাকা পাঠান' : 'Send exactly'}</span>
                            <span className="text-[15px] font-black text-emerald-600">৳{amount} BDT</span>
                        </div>
                    </div>

                    {/* Admin Number with Copy */}
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                {t?.adminNumber || `Admin ${paymentMethod} Number`}
                            </span>
                            <span className="text-[10px] text-emerald-600 font-bold">Personal</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-base font-bold text-gray-900 font-mono tracking-wider">{adminNumber}</span>
                            <button 
                                onClick={handleCopy} 
                                className={"flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold text-[11px] shadow-sm transition-all active:scale-95 " + (copied ? "bg-emerald-600 text-white" : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50")}
                            >
                                {copied ? <><CheckCircle2 size={13} /> {lang === 'bn' ? 'কপি হয়েছে' : 'Copied'}</> : <><Copy size={13} /> {lang === 'bn' ? 'কপি' : 'Copy'}</>}
                            </button>
                        </div>
                    </div>

                    {/* Guidance */}
                    {lang === 'bn' ? (
                        <div className="bg-emerald-50/60 rounded-xl p-2.5 border border-emerald-100 text-[12px] text-emerald-900 space-y-1">
                            <p className="font-bold text-[11px] text-emerald-800 uppercase tracking-wider">কিভাবে টাকা পাঠাবেন:</p>
                            <p>১. আপনার <b>{paymentMethod}</b> অ্যাপ থেকে <b>Send Money</b> অপশনে যান।</p>
                            <p>২. উপরে দেওয়া নাম্বারে সঠিক <b>৳{amount} টাকা</b> পাঠান।</p>
                            <p>৩. এসএমএস থেকে পাওয়া <b>Transaction ID (TrxID)</b> নিচে লিখে সাবমিট করুন।</p>
                        </div>
                    ) : (
                        <div className="bg-emerald-50/60 rounded-xl p-2.5 border border-emerald-100 text-[12px] text-emerald-900 space-y-1">
                            <p className="font-bold text-[11px] text-emerald-800 uppercase tracking-wider">How to pay:</p>
                            <p>1. Open your <b>{paymentMethod}</b> app and tap <b>Send Money</b>.</p>
                            <p>2. Send exact <b>৳{amount} BDT</b> to the admin number above.</p>
                            <p>3. Enter the <b>Transaction ID (TrxID)</b> from SMS below and submit.</p>
                        </div>
                    )}
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
                                <p className="font-bold text-red-700">{lang === 'bn' ? 'ভুল বা অমিল TrxID!' : 'Invalid or Mismatched TrxID!'}</p>
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
                            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {lang === 'bn' ? 'যাচাই করা হচ্ছে...' : 'VERIFYING SMS...'}</>
                        ) : (
                            <><CheckCircle2 size={16} /> {t?.verifyAddMoney || 'VERIFY & ADD MONEY'}</>
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
                    <h2 className="text-[15px] font-extrabold text-gray-900 tracking-tight leading-tight">
                        {t?.addMoney || 'Add Money'}
                    </h2>
                    <p className="text-gray-500 text-[12px]">
                        {lang === 'bn' ? 'টাকা জমা করুন আপনার একাউন্ট ব্যালেন্সে' : 'Deposit money to your account balance'}
                    </p>
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
                            {t?.depositAmount || 'Deposit Amount (BDT)'}
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
                        {t?.selectMethod || 'Select Payment Method'}
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
                        {t?.instantCreditNote || 'টাকা পাঠানোর সাথে সাথে আপনার TrxID অটো-ভেরিফাই হবে এবং ইন-অ্যাপ ব্যালেন্সে যুক্ত হবে।'}
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
                    <span>{t?.continuePayment || 'CONTINUE TO PAYMENT'}</span>
                    <ArrowDown size={15} className="-rotate-90" />
                </button>
            </div>
        </div>
    );
}

// REALTIME BUY CRYPTO MODAL (Live On-Chain Payout from User BDT Balance)
function BuyCryptoModal({ isOpen, onClose, user, balance = 0, lang = 'bn', t, reloadData, onGoToAddMoney }) {
    const userTonAddress = useTonAddress();
    const [selectedAsset, setSelectedAsset] = useState('GRAM'); // 'GRAM' or 'USDT'
    const [bdtAmount, setBdtAmount] = useState('');
    const [receiveAddress, setReceiveAddress] = useState('');
    const [stage, setStage] = useState('idle'); // 'idle' | 'processing' | 'success' | 'error'
    const [processStep, setProcessStep] = useState(1);
    const [errorMessage, setErrorMessage] = useState('');
    const [txResult, setTxResult] = useState(null);
    // Hourly Buyer Rates (USDT real price + 10 TK, GRAM real price in BDT + 10 TK)
    const [buyerRates, setBuyerRates] = useState(() => {
        try {
            const cached = localStorage.getItem('maruf_buyer_rates');
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Date.now() - (parsed.timestamp || 0) < 60 * 60 * 1000 && parsed.rates?.USDT) {
                    return parsed.rates;
                }
            }
        } catch (e) {}
        return { GRAM: 226, USDT: 130 };
    });

    // Auto-fill connected TonConnect wallet if address empty
    useEffect(() => {
        if (userTonAddress && !receiveAddress) {
            setReceiveAddress(userTonAddress);
        }
    }, [userTonAddress, receiveAddress]);

    useEffect(() => {
        let isMounted = true;
        fetchMarketRates().then(data => {
            if (!isMounted || !data) return;
            if (data.buyRates && data.buyRates.USDT && data.buyRates.GRAM) {
                const newRates = {
                    GRAM: data.buyRates.GRAM,
                    USDT: data.buyRates.USDT
                };
                setBuyerRates(newRates);
                try {
                    localStorage.setItem('maruf_buyer_rates', JSON.stringify({
                        rates: newRates,
                        timestamp: Date.now()
                    }));
                } catch(e) {}
            }
        }).catch(err => console.error("Error fetching buyer market rates:", err));

        return () => { isMounted = false; };
    }, []);

    if (!isOpen) return null;

    const cryptoRate = selectedAsset === 'USDT' ? (buyerRates?.USDT || 130) : (buyerRates?.GRAM || 226);
    const calculatedCrypto = bdtAmount && !isNaN(bdtAmount) && parseFloat(bdtAmount) > 0 
        ? (parseFloat(bdtAmount) / cryptoRate).toFixed(4) 
        : '0.0000';

    const numBdt = parseFloat(bdtAmount) || 0;
    const hasInsufficientBalance = numBdt > (balance || 0);

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
                            {t?.buyCrypto || 'Buy Crypto'}
                        </h3>
                        <p className="text-gray-400 text-[11px]">
                            {lang === 'bn' ? 'আপনার ব্যালেন্স থেকে সরাসরি ওয়ালেটে পাঠানো হবে' : 'Sent directly to your wallet from balance'}
                        </p>
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
                            {lang === 'bn' ? 'পেমেন্ট সফলভাবে পাঠানো হয়েছে! 🎉' : 'Payment Sent Successfully! 🎉'}
                        </h4>
                        <p className="text-gray-500 text-[12px] mb-4 max-w-[280px] mx-auto leading-relaxed">
                            {lang === 'bn' 
                                ? <>আপনার ওয়ালেটে <b>{calculatedCrypto} {selectedAsset}</b> সফলভাবে পাঠানো হয়েছে।</>
                                : <>Successfully sent <b>{calculatedCrypto} {selectedAsset}</b> to your wallet.</>}
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
                            {lang === 'bn' ? 'সম্পন্ন / DONE' : 'DONE'}
                        </button>
                    </div>
                ) : stage === 'error' ? (
                    /* ERROR STAGE */
                    <div className="py-4 text-center animate-in zoom-in-95 duration-400">
                        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center text-red-600 mx-auto mb-3 border-2 border-white shadow-md">
                            <AlertCircle size={28} />
                        </div>
                        <h4 className="text-[15px] font-bold text-gray-900 mb-1">
                            {lang === 'bn' ? 'ট্রানজেকশন ব্যর্থ হয়েছে' : 'Transaction Failed'}
                        </h4>
                        <p className="text-red-600 text-[12px] mb-4 leading-relaxed bg-red-50 p-2.5 rounded-xl border border-red-100 max-w-[320px] mx-auto">
                            {errorMessage}
                        </p>
                        <button 
                            onClick={() => setStage('idle')} 
                            className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl active:scale-95 transition-all text-[12px]"
                        >
                            {lang === 'bn' ? 'আবার চেষ্টা করুন (TRY AGAIN)' : 'TRY AGAIN'}
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
                                {lang === 'bn' 
                                    ? (processStep === 1 ? 'ব্যালেন্স ও এক্সচেঞ্জ রেট চেক করা হচ্ছে...' : processStep === 2 ? `সরাসরি ওয়ালেটে ${selectedAsset} পাঠানো হচ্ছে...` : 'ব্লকচেইন কনফার্মেশন যাচাই হচ্ছে...')
                                    : (processStep === 1 ? 'Checking Balance & Rate...' : processStep === 2 ? `Sending ${selectedAsset} on TON Blockchain...` : 'Awaiting Confirmation...')}
                            </h4>
                            <p className="text-gray-400 text-[12px]">
                                {lang === 'bn' 
                                    ? (processStep === 1 ? 'আপনার একাউন্ট ব্যালেন্স যাচাই করা হচ্ছে' : processStep === 2 ? 'বট অন-চেইনে রিয়েলটাইমে ক্রিপ্টো ট্রান্সফার করছে' : 'ব্লকচেইন ট্রানজেকশন সফলভাবে নিশ্চিত হচ্ছে')
                                    : (processStep === 1 ? 'Verifying available balance and crypto rate' : processStep === 2 ? 'Broadcasting live transaction to your wallet' : 'Finalizing on-chain confirmation')}
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
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                                    {t?.availableBal || 'Available Balance'}
                                </span>
                                <span className="text-[15px] font-bold text-gray-900">{balance} <span className="text-emerald-600 text-[12px]">TK</span></span>
                            </div>
                            <button 
                                onClick={onGoToAddMoney} 
                                className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[11px] font-bold flex items-center gap-1 border border-emerald-200/60 transition-colors"
                            >
                                <PlusCircle size={13} /> {t?.addMoney || 'Add Money'}
                            </button>
                        </div>

                        {/* Select Asset: GRAM (TON) vs USDT (With Official Vector SVGs & Real BDT Rates) */}
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                                {t?.selectCrypto || 'Select Crypto Asset'}
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedAsset('GRAM')}
                                    className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all ${
                                        selectedAsset === 'GRAM' 
                                            ? 'border-emerald-500 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-500/30' 
                                            : 'border-gray-100 bg-gray-50 hover:bg-gray-100/60'
                                    }`}
                                >
                                    <img src={`${import.meta.env.BASE_URL}gram.svg`} className="w-6 h-6 object-contain shrink-0" alt="GRAM" />
                                    <div className="text-left">
                                        <span className="font-bold text-[12px] text-gray-900 block leading-tight">GRAM (TON)</span>
                                        <span className="text-[10px] text-emerald-600 font-bold">≈ ৳{buyerRates.GRAM} TK</span>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setSelectedAsset('USDT')}
                                    className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all ${
                                        selectedAsset === 'USDT' 
                                            ? 'border-emerald-500 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-500/30' 
                                            : 'border-gray-100 bg-gray-50 hover:bg-gray-100/60'
                                    }`}
                                >
                                    <img src={`${import.meta.env.BASE_URL}usdt.svg`} className="w-6 h-6 object-contain shrink-0" alt="USDT" />
                                    <div className="text-left">
                                        <span className="font-bold text-[12px] text-gray-900 block leading-tight">USDT</span>
                                        <span className="text-[10px] text-emerald-600 font-bold">≈ ৳{buyerRates.USDT} TK</span>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Top Field: BDT Amount Input */}
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    {t?.bdtSpend || (lang === 'bn' ? 'টাকার পরিমাণ (BDT)' : 'BDT Amount to Spend')}
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
                                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                                    {t?.youWillReceive || (lang === 'bn' ? 'আপনি পাবেন' : 'You Will Receive')}
                                </span>
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
                                    {t?.receiveAddress || (lang === 'bn' ? 'রিসিভ অ্যাড্রেস (ওয়ালেট)' : 'Receive Address (TON Wallet)')}
                                </label>
                                {userTonAddress && (
                                    <button 
                                        type="button" 
                                        onClick={() => setReceiveAddress(userTonAddress)} 
                                        className="text-[10px] text-emerald-600 font-bold hover:underline"
                                    >
                                        {lang === 'bn' ? 'কানেক্টেড ওয়ালেট ব্যবহার করুন' : 'Use Connected Wallet'}
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
                                    <p className="font-bold">{t?.insufficientBal || 'অপর্যাপ্ত ব্যালেন্স!'}</p>
                                    <p className="mt-0.5">
                                        {lang === 'bn' 
                                            ? `আপনার অ্যাকাউন্টে আছে ৳${balance} TK। দয়া করে প্রথমে Add Money করুন।` 
                                            : `Your balance is ৳${balance} TK. Please Add Money first.`}
                                    </p>
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
                                    {t?.addMoney || 'ADD MONEY'} {lang === 'bn' ? 'করুন' : 'TO WALLET'}
                                </button>
                            ) : (
                                <button 
                                    onClick={handleConfirmBuy} 
                                    disabled={!numBdt || !receiveAddress || numBdt < 20} 
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3 rounded-xl shadow-md shadow-emerald-600/20 active:scale-95 transition-all text-[12px] flex items-center justify-center gap-1.5"
                                >
                                    <Coins size={16} />
                                    {t?.confirmBuy || 'CONFIRM & BUY'} {selectedAsset}
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}



function SellCryptoPage({ user, lang = 'bn', t, onDone, onGoToWithdraw, reloadData }) {
    const userTonAddress = useTonAddress();
    const [tonConnectUI] = useTonConnectUI();
    const [step, setStep] = useState(1);
    const [asset, setAsset] = useState('GRAM'); // 'GRAM' (TON) or 'USDT'
    const [cryptoAmount, setCryptoAmount] = useState('');
    const [trxId, setTrxId] = useState('');
    const [loading, setLoading] = useState(false);
    const [isTonSending, setIsTonSending] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [copied, setCopied] = useState(false);
    const [sellResult, setSellResult] = useState(null);
    const [liveRates, setLiveRates] = useState(() => {
        try {
            const cached = localStorage.getItem('maruf_seller_rates');
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Date.now() - (parsed.timestamp || 0) < 60 * 60 * 1000 && parsed.rates?.USDT) {
                    return parsed.rates;
                }
            }
        } catch(e) {}
        return { GRAM: 211, USDT: 115 };
    });

    // Fetch live market rates
    useEffect(() => {
        let isMounted = true;
        fetchMarketRates().then(data => {
            if (!isMounted || !data) return;
            if (data.sellRates && data.sellRates.USDT && data.sellRates.GRAM) {
                const newRates = {
                    GRAM: data.sellRates.GRAM,
                    USDT: data.sellRates.USDT
                };
                setLiveRates(newRates);
                try {
                    localStorage.setItem('maruf_seller_rates', JSON.stringify({
                        rates: newRates,
                        timestamp: Date.now()
                    }));
                } catch(e) {}
            }
        }).catch(err => console.error("Error fetching seller market rates:", err));
        return () => { isMounted = false; };
    }, []);

    const botWalletAddress = "UQC7hYHfrVJ_uT_esMr7vCv1bVh5ytQxYUUjRDiTUiG9s5Fb";
    const currentRate = asset === 'USDT' ? (liveRates?.USDT || 115) : (liveRates?.GRAM || 211);
    const numAmount = parseFloat(cryptoAmount) || 0;
    const estimatedTk = numAmount > 0 ? Math.floor(numAmount * currentRate) : 0;

    const quickAmounts = asset === 'GRAM' ? [0.01, 0.05, 0.1, 1, 5] : [0.01, 0.05, 0.1, 1, 5];

    const handleCopy = () => {
        navigator.clipboard.writeText(botWalletAddress);
        setCopied(true);
        if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
        }
        setTimeout(() => setCopied(false), 2000);
    };

    const handleContinue = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
            return window.Telegram?.WebApp?.showAlert 
                ? window.Telegram.WebApp.showAlert(lang === 'bn' ? "সঠিক ক্রিপ্টো পরিমাণ দিন" : "Enter a valid crypto amount") 
                : alert("Enter a valid crypto amount");
        }
        if (estimatedTk < 1) {
            return window.Telegram?.WebApp?.showAlert 
                ? window.Telegram.WebApp.showAlert(lang === 'bn' ? "নূন্যতম বিক্রয় ১ টাকা" : "Minimum sell value is 1 BDT") 
                : alert("Minimum sell value is 1 BDT");
        }
        setErrorMessage('');
        setStep(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // 1-Click TonConnect Pay
    const handleTonConnectPay = async () => {
        if (!userTonAddress) {
            tonConnectUI.openModal();
            return;
        }
        setIsTonSending(true);
        setErrorMessage('');
        try {
            const txRes = await buildTransaction({
                asset,
                amount: numAmount,
                userAddress: userTonAddress,
                adminWallet: botWalletAddress
            });

            if (txRes && txRes.tx) {
                await tonConnectUI.sendTransaction(txRes.tx);

                // Successfully signed and sent on-chain! Now submit and credit!
                const res = await submitSellOrder({
                    userId: user?.id || 123456789,
                    asset,
                    amount: numAmount,
                    estimatedTk,
                    wallet: userTonAddress,
                    status: 'completed'
                });

                if (res.success) {
                    setSellResult({ ...res, amount: numAmount, estimatedTk });
                    if (reloadData) reloadData();
                    if (window.Telegram?.WebApp?.HapticFeedback) {
                        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
                    }
                    setStep(3);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            }
        } catch (err) {
            console.error("TonConnect transfer error:", err);
            setErrorMessage(err.message || (lang === 'bn' ? 'ওয়ালেট দিয়ে পেমেন্ট বাতিল বা ব্যর্থ হয়েছে। আপনি নিচে সরাসরি অ্যাড্রেসে পাঠাতে পারেন।' : 'Wallet payment cancelled or failed. You can send manually below.'));
            if (window.Telegram?.WebApp?.HapticFeedback) {
                window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
            }
        } finally {
            setIsTonSending(false);
        }
    };

    // Manual Submission
    const handleManualSubmit = async () => {
        if (!trxId || trxId.trim().length < 4) {
            setErrorMessage(lang === 'bn' ? 'অনুগ্রহ করে সঠিক TxID বা আপনার সেন্ডার ওয়ালেট অ্যাড্রেস দিন' : 'Please enter valid TxID or your sender wallet address');
            return;
        }
        setLoading(true);
        setErrorMessage('');
        try {
            const res = await submitSellOrder({
                userId: user?.id || 123456789,
                asset,
                amount: numAmount,
                estimatedTk,
                wallet: trxId.trim(),
                status: 'completed'
            });

            if (res.success) {
                setSellResult({ ...res, amount: numAmount, estimatedTk });
                if (reloadData) reloadData();
                if (window.Telegram?.WebApp?.HapticFeedback) {
                    window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
                }
                setStep(3);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                setErrorMessage(res.error || 'ভেরিফিকেশন ব্যর্থ হয়েছে');
            }
        } catch (e) {
            setErrorMessage(e.message || 'সাবমিট করতে সমস্যা হয়েছে, অনুগ্রহ করে আবার চেষ্টা করুন।');
        } finally {
            setLoading(false);
        }
    };

    // STEP 3: LUXURY FINTECH SUCCESS RECEIPT
    if (step === 3) {
        return (
            <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500 p-4 text-center pb-24">
                <div className="relative mb-6 mt-4">
                    <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-2xl animate-pulse" />
                    <div className="w-24 h-24 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/30 border-4 border-white relative z-10">
                        <CheckCircle2 size={48} className="text-white drop-shadow-md" />
                    </div>
                </div>

                <h2 className="text-2xl font-black text-gray-900 mb-1 tracking-tight">
                    ৳{estimatedTk} BDT Added! 🎉
                </h2>
                <p className="text-gray-500 text-xs mb-6 max-w-[280px] leading-relaxed">
                    {lang === 'bn' 
                        ? 'আপনার ক্রিপ্টো বিক্রয় সফল হয়েছে এবং ব্যালেন্সে টাকা যুক্ত করা হয়েছে।' 
                        : 'Your crypto sale was successful and BDT balance has been credited.'}
                </p>

                <div className="bg-white border border-gray-100 rounded-3xl p-5 w-full max-w-[340px] mb-6 shadow-xl shadow-gray-100/60 relative overflow-hidden">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</span>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-black border border-emerald-200/60">
                            <Sparkles size={12} /> Auto-Completed
                        </div>
                    </div>
                    
                    <div className="space-y-2.5 text-left text-xs">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400 font-medium">Crypto Sold</span>
                            <span className="font-bold text-gray-900">{numAmount} {asset}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400 font-medium">Rate</span>
                            <span className="font-bold text-gray-900">1 {asset} ≈ ৳{currentRate} TK</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400 font-medium">Amount Credited</span>
                            <span className="font-extrabold text-emerald-600 text-sm">৳{estimatedTk} BDT</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400 font-medium">Destination</span>
                            <span className="font-bold text-gray-900">In-App Balance</span>
                        </div>
                    </div>
                </div>

                <div className="w-full max-w-[340px] space-y-2.5">
                    <button 
                        onClick={onGoToWithdraw} 
                        className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-emerald-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm tracking-wide"
                    >
                        <Wallet size={18} />
                        {t?.withdrawFunds || (lang === 'bn' ? 'টাকা উত্তোলন করুন (WITHDRAW)' : 'WITHDRAW FUNDS')}
                    </button>
                    <button 
                        onClick={() => {
                            setStep(1);
                            setCryptoAmount('');
                            setTrxId('');
                            setErrorMessage('');
                            onDone();
                        }} 
                        className="w-full bg-white text-gray-700 font-bold py-3.5 rounded-2xl border border-gray-200 active:scale-95 transition-all text-sm"
                    >
                        {lang === 'bn' ? 'হোমে ফিরে যান' : 'BACK TO HOME'}
                    </button>
                </div>
            </div>
        );
    }

    // STEP 2: TRANSFER & CONFIRMATION
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
                        <h2 className="text-xl font-black text-gray-900 tracking-tight">
                            {lang === 'bn' ? 'ক্রিপ্টো ট্রান্সফার ভেরিফিকেশন' : 'Crypto Transfer Verification'}
                        </h2>
                        <p className="text-gray-500 text-xs mt-0.5">
                            {lang === 'bn' ? 'ক্রিপ্টো পাঠিয়ে ট্রানজেকশন সাবমিট করুন' : 'Transfer crypto to complete swap'}
                        </p>
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
                                src={asset === 'GRAM' ? `${import.meta.env.BASE_URL}gram.svg` : `${import.meta.env.BASE_URL}usdt.svg`} 
                                className="w-6 h-6 object-contain" 
                                alt={asset} 
                            />
                            <div>
                                <span className="font-bold text-gray-900 text-[13px] block">{asset} (TON Network)</span>
                                <span className="text-[10px] text-gray-400 font-medium">Rate: 1 {asset} ≈ ৳{currentRate} TK</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] text-gray-400 font-medium block">{lang === 'bn' ? 'ব্যালেন্সে যোগ হবে' : 'You will receive'}</span>
                            <span className="text-[15px] font-black text-emerald-600">৳{estimatedTk} BDT</span>
                        </div>
                    </div>

                    {/* Admin Receiving Wallet */}
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                {lang === 'bn' ? 'বট ওয়ালেট অ্যাড্রেস (রিসিভার)' : 'Bot Receiver Address'}
                            </span>
                            <span className="text-[10px] text-emerald-600 font-bold">TON Blockchain</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[12px] font-bold text-gray-900 font-mono tracking-wider truncate flex-1">{botWalletAddress}</span>
                            <button 
                                onClick={handleCopy} 
                                className={"flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold text-[11px] shadow-sm transition-all active:scale-95 shrink-0 " + (copied ? "bg-emerald-600 text-white" : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50")}
                            >
                                {copied ? <><CheckCircle2 size={13} /> {lang === 'bn' ? 'কপি হয়েছে' : 'Copied'}</> : <><Copy size={13} /> {lang === 'bn' ? 'কপি' : 'Copy'}</>}
                            </button>
                        </div>
                    </div>

                    {/* Guidance */}
                    {lang === 'bn' ? (
                        <div className="bg-emerald-50/60 rounded-xl p-2.5 border border-emerald-100 text-[12px] text-emerald-900 space-y-1">
                            <p className="font-bold text-[11px] text-emerald-800 uppercase tracking-wider">কিভাবে বিক্রি করবেন:</p>
                            <p>১. আপনার ওয়ালেট (Tonkeeper / Telegram / Binance) থেকে উপরে দেওয়া অ্যাড্রেসে ঠিক <b>{numAmount} {asset}</b> পাঠান।</p>
                            <p>২. ট্রান্সফারের পর আপনার <b>Tx Hash (TrxID)</b> বা <b>সেন্ডার ওয়ালেট অ্যাড্রেস</b> নিচের ঘরে লিখে সাবমিট করুন।</p>
                            <p>৩. সাথে সাথে আপনার ইন-অ্যাপ ব্যালেন্সে <b>৳{estimatedTk} BDT</b> যুক্ত হবে।</p>
                        </div>
                    ) : (
                        <div className="bg-emerald-50/60 rounded-xl p-2.5 border border-emerald-100 text-[12px] text-emerald-900 space-y-1">
                            <p className="font-bold text-[11px] text-emerald-800 uppercase tracking-wider">How to sell:</p>
                            <p>1. Send exact <b>{numAmount} {asset}</b> from your wallet to the bot address above.</p>
                            <p>2. Paste your <b>Transaction Hash (TxID)</b> or <b>Sender Wallet Address</b> below.</p>
                            <p>3. Submit to instantly receive <b>৳{estimatedTk} BDT</b> into your balance.</p>
                        </div>
                    )}
                </div>

                {/* 1-Click TonConnect Quick Pay (If User Prefers) */}
                {userTonAddress && (
                    <div className="bg-white rounded-2xl p-3.5 mb-3 border border-emerald-200/80 shadow-sm">
                        <button
                            type="button"
                            disabled={isTonSending}
                            onClick={handleTonConnectPay}
                            className="w-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl py-3 font-bold text-[13px] flex items-center justify-center gap-2 active:scale-95 transition-all"
                        >
                            {isTonSending ? (
                                <><Loader2 size={16} className="animate-spin text-emerald-600" /> {lang === 'bn' ? 'ওয়ালেটে সাইন হচ্ছে...' : 'Signing in wallet...'}</>
                            ) : (
                                <><Zap size={16} className="text-emerald-600" /> {lang === 'bn' ? '⚡ ওয়ালেট দিয়ে সরাসরি পাঠান (1-Click Wallet Pay)' : '⚡ 1-Click Wallet Pay'}</>
                            )}
                        </button>
                    </div>
                )}

                {/* TrxID / Wallet Input Card */}
                <div className="bg-white rounded-2xl p-3.5 mb-3 border border-gray-100 shadow-sm space-y-2.5">
                    <label className="text-[11px] font-bold text-gray-500 block uppercase tracking-wider">
                        {lang === 'bn' ? 'Transaction Hash / সেন্ডার ওয়ালেট অ্যাড্রেস' : 'Transaction Hash / Sender Wallet'}
                    </label>
                    <div className="relative">
                        <input 
                            type="text" 
                            value={trxId} 
                            onChange={e => setTrxId(e.target.value)} 
                            placeholder={lang === 'bn' ? 'এখানে Tx Hash বা ওয়ালেট পেস্ট করুন' : 'Paste Tx Hash or Wallet here'} 
                            className="w-full bg-gray-50 rounded-xl p-3 pr-10 text-[13px] font-mono font-bold text-gray-900 border border-gray-200 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 transition-all outline-none" 
                        />
                        <button 
                            onClick={async () => { 
                                try { 
                                    const text = await navigator.clipboard.readText(); 
                                    if (text) setTrxId(text.trim()); 
                                } catch(e){} 
                            }} 
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white text-gray-400 hover:text-emerald-600 rounded-lg transition-all shadow-sm border border-gray-200"
                            title="Paste from clipboard"
                        >
                            <ClipboardPaste size={16} />
                        </button>
                    </div>

                    {errorMessage && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2.5 animate-in fade-in duration-300">
                            <AlertCircle size={17} className="text-red-600 shrink-0 mt-0.5" />
                            <div className="text-[12px]">
                                <p className="font-bold text-red-700">{lang === 'bn' ? 'নোটিশ' : 'Notice'}</p>
                                <p className="text-red-600 leading-tight">{errorMessage}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Submit Button */}
                <div className="mt-auto">
                    <button 
                        onClick={handleManualSubmit} 
                        disabled={!trxId.trim() || loading} 
                        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold rounded-xl h-[46px] shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex justify-center items-center gap-2 text-[14px] tracking-wide"
                    >
                        {loading ? (
                            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {lang === 'bn' ? 'যাচাই করা হচ্ছে...' : 'VERIFYING...'}</>
                        ) : (
                            <><CheckCircle2 size={16} /> {lang === 'bn' ? 'ভেরিফাই ও টাকা যোগ করুন' : 'CONFIRM & RECEIVE TAKA'}</>
                        )}
                    </button>
                </div>
            </div>
        );
    }

    // STEP 1: AMOUNT & ASSET SELECTION (Just like Add Money Page)
    return (
        <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
            {/* Header */}
            <div className="flex items-center gap-2.5 mb-3.5">
                <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-100 shadow-sm shrink-0">
                    <ArrowRightLeft size={18} strokeWidth={2.5} />
                </div>
                <div>
                    <h2 className="text-[15px] font-extrabold text-gray-900 tracking-tight leading-tight">
                        {t?.sellCrypto || 'Sell Crypto'}
                    </h2>
                    <p className="text-gray-500 text-[12px]">
                        {lang === 'bn' ? 'ক্রিপ্টো সোয়াপ করে ইন-অ্যাপ ব্যালেন্সে টাকা নিন' : 'Swap crypto and receive BDT in account balance'}
                    </p>
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
                {/* Asset Selection Cards */}
                <div className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-sm space-y-2.5">
                    <label className="text-[11px] font-bold text-gray-400 block tracking-wider uppercase ml-0.5">
                        {t?.selectCrypto || 'Select Crypto Asset'}
                    </label>

                    <div className="grid grid-cols-2 gap-2">
                        {/* GRAM (TON) */}
                        <div 
                            onClick={() => setAsset('GRAM')}
                            className={`px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-2.5 ${
                                asset === 'GRAM' 
                                    ? 'border-emerald-500 bg-emerald-50/50 shadow-sm' 
                                    : 'border-gray-100 bg-gray-50/60 hover:bg-gray-50'
                            }`}
                        >
                            <img 
                                src={`${import.meta.env.BASE_URL}gram.svg`} 
                                className="w-6 h-6 object-contain shrink-0" 
                                alt="GRAM" 
                            />
                            <div className="flex-1 text-left min-w-0">
                                <span className="font-bold text-[12px] text-gray-900 block leading-tight truncate">GRAM (TON)</span>
                                <span className="text-[10px] text-emerald-600 font-bold block">≈ ৳{liveRates.GRAM} TK</span>
                            </div>
                        </div>

                        {/* USDT */}
                        <div 
                            onClick={() => setAsset('USDT')}
                            className={`px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-2.5 ${
                                asset === 'USDT' 
                                    ? 'border-emerald-500 bg-emerald-50/50 shadow-sm' 
                                    : 'border-gray-100 bg-gray-50/60 hover:bg-gray-50'
                            }`}
                        >
                            <img 
                                src={`${import.meta.env.BASE_URL}usdt.svg`} 
                                className="w-6 h-6 object-contain shrink-0" 
                                alt="USDT" 
                            />
                            <div className="flex-1 text-left min-w-0">
                                <span className="font-bold text-[12px] text-gray-900 block leading-tight truncate">USDT</span>
                                <span className="text-[10px] text-emerald-600 font-bold block">≈ ৳{liveRates.USDT} TK</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Amount Input Card */}
                <div className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-sm space-y-3">
                    <div>
                        <div className="flex justify-between items-center mb-1.5 ml-0.5">
                            <label className="text-[11px] font-bold text-gray-400 block tracking-wider uppercase">
                                {lang === 'bn' ? `বিক্রয়ের পরিমাণ (${asset})` : `Amount to Sell (${asset})`}
                            </label>
                            <span className="text-[10px] font-bold text-emerald-600">
                                {lang === 'bn' ? 'নূন্যতম ১ টাকা' : 'Min ৳1 BDT'}
                            </span>
                        </div>
                        <div className="relative">
                            <input 
                                type="number" 
                                value={cryptoAmount} 
                                onChange={e => setCryptoAmount(e.target.value)} 
                                placeholder="0.00" 
                                className="w-full bg-gray-50 rounded-xl h-[48px] pl-3 pr-14 text-lg font-bold text-gray-900 border border-gray-200 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 transition-all outline-none" 
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-[11px] text-gray-400">{asset}</span>
                        </div>
                    </div>

                    {/* Quick Preset Chips */}
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {quickAmounts.map(val => (
                            <button
                                key={val}
                                type="button"
                                onClick={() => setCryptoAmount(val.toString())}
                                className={`px-3 py-1 rounded-lg text-[12px] font-bold transition-all active:scale-95 ${
                                    cryptoAmount === val.toString() 
                                        ? 'bg-emerald-600 text-white shadow-sm' 
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {val} {asset}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Receive Calculation Box */}
                <div className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-sm space-y-2">
                    <div className="flex justify-between items-center text-[12px]">
                        <span className="text-gray-500 font-medium">{lang === 'bn' ? 'বর্তমান এক্সচেঞ্জ রেট' : 'Current Rate'}</span>
                        <span className="font-bold text-gray-800">1 {asset} ≈ ৳{currentRate} BDT</span>
                    </div>
                    <div className="h-px bg-gray-100 w-full" />
                    <div className="flex justify-between items-center">
                        <div>
                            <span className="text-[12px] font-bold text-gray-700 block">{lang === 'bn' ? 'আপনি মোট পাবেন' : 'You will receive'}</span>
                            <span className="text-[10px] text-gray-400">{lang === 'bn' ? 'ব্যালেন্সে ইনস্ট্যান্ট যোগ হবে' : 'Credited to balance'}</span>
                        </div>
                        <span className="text-xl font-black text-emerald-600">৳{estimatedTk} BDT</span>
                    </div>
                </div>

                {/* Continue Button */}
                <div className="pt-2">
                    <button 
                        onClick={handleContinue} 
                        disabled={!numAmount || numAmount <= 0 || estimatedTk < 1} 
                        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold rounded-xl h-[46px] shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex justify-center items-center gap-2 text-[14px] tracking-wide"
                    >
                        <span>{t?.continuePayment || 'পরবর্তী ধাপ (ট্রান্সফার)'}</span>
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}

function HistoryPage({ user, lang = 'bn', t, onBack }) {
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
                <h2 className="text-[15px] font-extrabold text-gray-900 leading-tight">
                    {t?.transactionHistory || 'Transaction History'}
                </h2>
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
                    <p className="font-bold text-gray-900 text-[13px] mb-0.5">
                        {lang === 'bn' ? 'এখনও কোনো লেনদেন হয়নি' : 'No Transactions Yet'}
                    </p>
                    <p className="text-[12px] text-gray-500">
                        {lang === 'bn' ? 'আপনার সকল ক্রয়, বিক্রয় ও উত্তোলনের বিবরণ এখানে দেখতে পাবেন।' : 'Your buying, selling and withdrawal history will appear here.'}
                    </p>
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


function ProfilePage({ user, balance, mbsId, lang = 'bn', t, onSetLang, fiatWallet, fiatWithdrawPending, onGoToWithdraw, onGoToHistory, setFiatWallet, reloadData }) {
  const [withdrawing, setWithdrawing] = useState(false);

  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletMethod, setWalletMethod] = useState('bKash');
  const [showMethodDropdown, setShowMethodDropdown] = useState(false);
  const [walletNumber, setWalletNumber] = useState('');
  const [walletName, setWalletName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [txStatus, setTxStatus] = useState(null);
  const [txMessage, setTxMessage] = useState('');

  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportMsg, setSupportMsg] = useState('');
  const [isSendingSupport, setIsSendingSupport] = useState(false);
  const [supportFeedback, setSupportFeedback] = useState(null);
  
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

      {/* Language Selector Card (User can change language anytime!) */}
      <div className="bg-white p-3.5 rounded-2xl premium-shadow border border-[var(--color-border)] flex items-center justify-between">
         <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-base shrink-0 border border-emerald-100">
               🌐
            </div>
            <div>
               <h4 className="text-[13px] font-extrabold text-[var(--color-text-primary)] leading-tight">
                  {t?.languageSetting || 'ভাষা পরিবর্তন (Language)'}
               </h4>
               <p className="text-[11px] text-[var(--color-text-secondary)] font-medium">
                  {lang === 'bn' ? 'বর্তমান ভাষা: বাংলা 🇧🇩' : 'Current Language: English 🇬🇧'}
               </p>
            </div>
         </div>
         <div className="flex bg-gray-100 p-1 rounded-xl gap-1 border border-gray-200/60">
            <button
               type="button"
               onClick={() => onSetLang && onSetLang('bn')}
               className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  lang === 'bn' 
                     ? 'bg-emerald-600 text-white shadow-sm' 
                     : 'text-gray-600 hover:text-gray-900'
               }`}
            >
               🇧🇩 বাংলা
            </button>
            <button
               type="button"
               onClick={() => onSetLang && onSetLang('en')}
               className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  lang === 'en' 
                     ? 'bg-emerald-600 text-white shadow-sm' 
                     : 'text-gray-600 hover:text-gray-900'
               }`}
            >
               🇬🇧 English
            </button>
         </div>
      </div>

      {/* Balance & User ID */}
      <div className="grid grid-cols-2 gap-2.5">
         <div className="bg-white p-3.5 rounded-xl premium-shadow border border-[var(--color-border)] flex flex-col justify-center">
            <p className="text-[10px] font-semibold text-[var(--color-text-secondary)] mb-0.5 uppercase tracking-wide">
               {t?.availableBal || 'Available Balance'}
            </p>
            <p className="text-lg font-black text-[var(--color-text-primary)]">{balance} <span className="text-[var(--color-brand)] text-xs">TK</span></p>
         </div>
         <div className="bg-white p-3.5 rounded-xl premium-shadow border border-[var(--color-border)] flex flex-col justify-center">
            <p className="text-[10px] font-semibold text-[var(--color-text-secondary)] mb-0.5 uppercase tracking-wide">
               {t?.userId || 'User ID'}
            </p>
            <p className="text-[12px] font-mono font-bold text-[var(--color-text-primary)] flex items-center gap-1.5 cursor-pointer" onClick={() => { navigator.clipboard.writeText(user?.id); if (WebApp.HapticFeedback) WebApp.HapticFeedback.impactOccurred('light'); }}>
               {user?.id || '000000'} <Copy size={11} className="text-gray-400 active:text-emerald-600 transition-colors" />
            </p>
         </div>
      </div>

      {/* Withdraw Button */}
      <button onClick={handleWithdrawClick} disabled={withdrawing} className="w-full bg-gradient-to-r from-[var(--color-brand)] to-emerald-500 text-white font-bold h-[46px] rounded-xl shadow-md shadow-[var(--color-brand)]/20 active:scale-[0.98] transition-all disabled:opacity-70 flex items-center justify-center gap-2 text-[14px]">
         {withdrawing ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {lang === 'bn' ? 'প্রক্রিয়াধীন...' : 'PROCESSING...'}</>
         ) : (
            <><Wallet size={16} /> {t?.withdrawBalance || 'WITHDRAW BALANCE'}</>
         )}
      </button>

      {/* Transaction History Button */}
      <div onClick={onGoToHistory} className="bg-white p-3.5 rounded-2xl premium-shadow border border-[var(--color-border)] flex justify-between items-center group active:scale-[0.98] transition-transform cursor-pointer">
         <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 group-hover:scale-105 transition-transform shrink-0">
               <Clock size={18} />
            </div>
            <div>
               <span className="font-bold text-[var(--color-text-primary)] block text-[13px] leading-tight">
                  {t?.transactionHistory || 'Transaction History'}
               </span>
               <span className="text-[11px] text-[var(--color-text-secondary)] font-medium">
                  {t?.transactionHistorySub || 'All buys, sells & withdrawals'}
               </span>
            </div>
         </div>
         <ChevronRight size={16} className="text-gray-400 group-hover:text-purple-600 transition-colors" />
      </div>

      {/* Customer Support Card */}
      <div 
         onClick={() => { setShowSupportModal(true); setSupportFeedback(null); }} 
         className="bg-white p-3.5 rounded-2xl premium-shadow border border-[var(--color-border)] flex justify-between items-center group active:scale-[0.98] transition-transform cursor-pointer"
      >
         <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0 border border-emerald-100">
               <Headphones size={18} />
            </div>
            <div>
               <span className="font-bold text-[var(--color-text-primary)] block text-[13px] leading-tight">
                  {t?.customerSupport || 'সাপোর্ট ও সাহায্য'}
               </span>
               <span className="text-[11px] text-[var(--color-text-secondary)] font-medium">
                  {t?.customerSupportSub || 'সরাসরি অ্যাডমিন টিমের সাথে কথা বলুন'}
               </span>
            </div>
         </div>
         <ChevronRight size={16} className="text-gray-400 group-hover:text-emerald-600 transition-colors" />
      </div>

      {/* Support Message Modal */}
      {showSupportModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white rounded-[28px] p-5 w-full max-w-[340px] shadow-2xl border border-gray-100 animate-in zoom-in-95">
                  <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                              <Headphones size={16} />
                          </div>
                          <div>
                              <h3 className="text-[15px] font-extrabold text-gray-900 leading-tight">
                                  {lang === 'bn' ? 'কাস্টমার সাপোর্ট' : 'Customer Support'}
                              </h3>
                              <p className="text-[11px] text-gray-400 font-medium">
                                  {lang === 'bn' ? 'সরাসরি হেল্পলাইন' : 'Direct Helpline'}
                              </p>
                          </div>
                      </div>
                      <button 
                          onClick={() => setShowSupportModal(false)} 
                          className="p-1.5 bg-gray-100 rounded-full text-gray-400 hover:text-gray-700 active:scale-90 transition-all"
                      >
                          <X size={15} strokeWidth={2.5} />
                      </button>
                  </div>

                  {supportFeedback ? (
                      <div className="py-4 text-center space-y-3">
                          <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center ${supportFeedback.success ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                              {supportFeedback.success ? <CheckCircle2 size={26} /> : <AlertCircle size={26} />}
                          </div>
                          <div>
                              <h4 className="text-[14px] font-bold text-gray-900">
                                  {supportFeedback.success ? (lang === 'bn' ? 'মেসেজ পাঠানো হয়েছে!' : 'Message Sent!') : (lang === 'bn' ? 'ব্যর্থ হয়েছে' : 'Failed')}
                              </h4>
                              <p className="text-[12px] text-gray-500 mt-1 leading-snug">
                                  {supportFeedback.message}
                              </p>
                          </div>
                          <button 
                              onClick={() => {
                                  setShowSupportModal(false);
                                  setSupportFeedback(null);
                              }}
                              className="w-full mt-2 h-[42px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-[13px] transition-all"
                          >
                              {lang === 'bn' ? 'ঠিক আছে' : 'OK'}
                          </button>
                      </div>
                  ) : (
                      <div className="space-y-3 pt-1">
                          <div className="bg-emerald-50/60 border border-emerald-100/70 p-2.5 rounded-xl text-[11px] text-emerald-800 leading-relaxed font-medium">
                              {lang === 'bn' 
                                  ? 'আপনার যেকোনো সমস্যা বা প্রশ্ন থাকলে নিচে লিখুন। মেসেজটি সরাসরি আমাদের অ্যাডমিন গ্রুপে পৌঁছাবে।' 
                                  : 'Type your message or issue below. It will be forwarded directly to our admin team in Telegram.'}
                          </div>

                          <div>
                              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                                  {lang === 'bn' ? 'আপনার মেসেজ লিখুন' : 'Write your message'}
                              </label>
                              <textarea
                                  rows={4}
                                  value={supportMsg}
                                  onChange={(e) => setSupportMsg(e.target.value)}
                                  placeholder={lang === 'bn' ? 'এখানে আপনার মেসেজ বা সমস্যার বিবরণ লিখুন...' : 'Type details here...'}
                                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-[12px] text-gray-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none resize-none transition-all placeholder:text-gray-400 font-medium"
                              />
                          </div>

                          <div className="flex gap-2 pt-1">
                              <button
                                  type="button"
                                  onClick={() => setShowSupportModal(false)}
                                  className="flex-1 h-[44px] bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-[13px] active:scale-95 transition-all"
                              >
                                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                              </button>
                              <button
                                  type="button"
                                  disabled={isSendingSupport || !supportMsg.trim()}
                                  onClick={async () => {
                                      if (!supportMsg.trim()) return;
                                      setIsSendingSupport(true);
                                      try {
                                          await submitSupportMessage({
                                              userId: user?.id,
                                              name: user?.first_name,
                                              username: user?.username,
                                              message: supportMsg.trim()
                                          });
                                          setSupportMsg('');
                                          setSupportFeedback({
                                              success: true,
                                              message: lang === 'bn' ? 'আপনার মেসেজ সফলভাবে গ্রুপে পাঠানো হয়েছে। অ্যাডমিন টিম শীঘ্রই উত্তর দিবে।' : 'Your message has been sent to our support group.'
                                          });
                                          if (WebApp?.HapticFeedback) {
                                              WebApp.HapticFeedback.notificationOccurred('success');
                                          }
                                      } catch (err) {
                                          setSupportFeedback({
                                              success: false,
                                              message: err.message || (lang === 'bn' ? 'পাঠাতে সমস্যা হয়েছে, আবার চেষ্টা করুন।' : 'Failed to send, try again.')
                                          });
                                          if (WebApp?.HapticFeedback) {
                                              WebApp.HapticFeedback.notificationOccurred('error');
                                          }
                                      } finally {
                                          setIsSendingSupport(false);
                                      }
                                  }}
                                  className="flex-1 h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-[13px] flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50"
                              >
                                  {isSendingSupport ? (
                                      <Loader2 size={16} className="animate-spin" />
                                  ) : (
                                      <>
                                          <Send size={14} />
                                          <span>{lang === 'bn' ? 'পাঠান' : 'Send'}</span>
                                      </>
                                  )}
                              </button>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      )}
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








function WithdrawFiatPage({ user, balance, lang = 'bn', t, fiatWallet, fiatWithdrawPending, onBack, reloadData }) {
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
          if (!amount || isNaN(amt) || amt <= 0) return window.Telegram?.WebApp?.showAlert ? window.Telegram.WebApp.showAlert(lang === 'bn' ? "সঠিক পরিমাণ লিখুন" : "Invalid amount") : alert("Invalid amount");
          if (amt < 20) return window.Telegram?.WebApp?.showAlert ? window.Telegram.WebApp.showAlert(lang === 'bn' ? "নূন্যতম উত্তোলন ২০ টাকা" : "Minimum withdraw amount is 20 BDT") : alert("Minimum withdraw amount is 20 BDT");
          if (amt > balance) return window.Telegram?.WebApp?.showAlert ? window.Telegram.WebApp.showAlert(lang === 'bn' ? "অপর্যাপ্ত ব্যালেন্স" : "Insufficient balance") : alert("Insufficient balance");
          
          setIsSubmitting(true);
          try {
              await withdrawFiat({
                  userId: user?.id || 123456789,
                  amount: amt,
                  fee: parseFloat((amt * 0.05).toFixed(2)),
                  receiveAmount: parseFloat((amt * 0.95).toFixed(2))
              });
              if(window.Telegram?.WebApp?.showAlert) window.Telegram.WebApp.showAlert(lang === 'bn' ? "উইথড্র রিকোয়েস্ট সফলভাবে জমা হয়েছে!" : "Withdrawal submitted successfully!");
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
                    <h2 className="text-[15px] font-extrabold text-[var(--color-text-primary)] leading-tight">
                        {t?.withdrawFunds || 'Withdraw Funds'}
                    </h2>
                    <p className="text-[var(--color-text-secondary)] text-[12px] font-medium">
                        {lang === 'bn' ? `${fiatWallet?.method || 'ওয়ালেট'}-এ ক্যাশআউট` : `Cashout to ${fiatWallet?.method || 'Wallet'}`}
                    </p>
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
                            <p className="text-[12px] font-bold text-amber-800">
                                {lang === 'bn' ? 'প্রক্রিয়াধীন:' : 'Processing:'} ৳{fiatWithdrawPending.amount} TK
                            </p>
                            <p className="text-[11px] text-amber-600">via {fiatWithdrawPending.method} ({fiatWithdrawPending.number})</p>
                        </div>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-800 px-2 py-0.5 rounded-md">
                        {t?.inProgress || 'In Progress'}
                    </span>
                </div>
            )}

            {/* Amount Input Card */}
            <div className="bg-white p-3.5 rounded-2xl premium-shadow border border-[var(--color-border)]">
                <label className="flex justify-between items-center mb-2">
                    <span className="text-[11px] font-extrabold text-[var(--color-text-secondary)] uppercase tracking-[0.15em]">
                        {lang === 'bn' ? 'উত্তোলনের পরিমাণ (BDT)' : 'Amount (BDT)'}
                    </span>
                    <span className="text-[12px] font-bold text-[var(--color-text-primary)]">
                        {lang === 'bn' ? `ব্যালেন্স: ৳${balance.toFixed(2)}` : `Bal: ৳${balance.toFixed(2)}`}
                    </span>
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
                        <span className="text-[#475467] font-medium">{lang === 'bn' ? 'উত্তোলনের পরিমাণ' : 'Withdraw Amount'}</span>
                        <span className="font-bold text-[#101828]">৳ {parseFloat(amount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-red-500 font-medium">{t?.fee || 'Fee (5%)'}</span>
                        <span className="font-bold text-red-500">- ৳ {(parseFloat(amount) * 0.05).toFixed(2)}</span>
                    </div>
                    <div className="h-px bg-[#E4E7EC] my-1 w-full" />
                    <div className="flex justify-between items-center text-[12px]">
                        <span className="text-[#00A878] font-bold">{t?.youReceive || 'You will receive'}</span>
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
                    {t?.withdrawNote || 'উইথড্র রিকোয়েস্ট সাধারণত ১ থেকে ২ ঘণ্টার মধ্যে এবং সর্বোচ্চ ২৪ ঘণ্টার মধ্যে সম্পূর্ণ হয়।'}
                </p>
            </div>

            {/* Submit Button */}
            <button 
                onClick={handleSubmit} 
                disabled={!amount || isSubmitting} 
                className="w-full h-[48px] mt-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold text-[14px] tracking-wide flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100 shadow-md shadow-emerald-500/20"
            >
                {isSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (t?.withdrawFunds || "WITHDRAW FUNDS")}
            </button>
        </div>
    );
}
