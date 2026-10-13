import React, { useState, useEffect } from 'react';
import { Home, User, ArrowDown, ArrowUp, ChevronRight, Zap, Share2, Copy, X, ArrowRightLeft, Wallet, Gift, ArrowUpRight, ArrowDownLeft, MinusCircle, TrendingUp, Sparkles, Info, CircleDollarSign, Gem, Coins, Delete, ChevronDown, Clock, Save, CheckCircle2 , Volume2, VolumeX, Check, Settings , ClipboardPaste, Loader2, PlusCircle, AlertCircle, RefreshCw, Headphones, Send, Edit3 } from 'lucide-react';
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

const FloralWatermark = ({ className = "opacity-[0.055]" }) => (
  <svg 
    className={`absolute pointer-events-none select-none right-[-10px] bottom-[-10px] text-indigo-900 ${className}`} 
    width="140" 
    height="140" 
    viewBox="0 0 100 100" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M50 85 C35 70, 20 50, 50 15 C80 50, 65 70, 50 85 Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M50 85 C25 80, 5 60, 25 35 C40 50, 48 70, 50 85 Z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    <path d="M50 85 C75 80, 95 60, 75 35 C60 50, 52 70, 50 85 Z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    <path d="M50 85 C15 90, 0 75, 10 50 C25 65, 40 78, 50 85 Z" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
    <path d="M50 85 C85 90, 100 75, 90 50 C75 65, 60 78, 50 85 Z" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
    <path d="M50 40 Q45 25, 50 10 Q55 25, 50 40" stroke="currentColor" strokeWidth="1" />
    <circle cx="50" cy="10" r="1.5" fill="currentColor" />
    <path d="M42 45 Q32 30, 35 18" stroke="currentColor" strokeWidth="0.8" />
    <circle cx="35" cy="18" r="1.2" fill="currentColor" />
    <path d="M58 45 Q68 30, 65 18" stroke="currentColor" strokeWidth="0.8" />
    <circle cx="65" cy="18" r="1.2" fill="currentColor" />
  </svg>
);

const PageBackgroundFlowers = () => (
  <div className="fixed inset-0 pointer-events-none select-none z-0 overflow-hidden">
    {/* Top-right delicate aesthetic floral watermark */}
    <svg 
      className="absolute -top-10 -right-10 w-72 h-72 text-indigo-900 opacity-[0.035] transform rotate-12" 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M50 85 C35 70, 20 50, 50 15 C80 50, 65 70, 50 85 Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M50 85 C25 80, 5 60, 25 35 C40 50, 48 70, 50 85 Z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <path d="M50 85 C75 80, 95 60, 75 35 C60 50, 52 70, 50 85 Z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <path d="M50 85 C15 90, 0 75, 10 50 C25 65, 40 78, 50 85 Z" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
      <path d="M50 85 C85 90, 100 75, 90 50 C75 65, 60 78, 50 85 Z" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
      <circle cx="50" cy="10" r="2" fill="currentColor" />
    </svg>
    {/* Bottom-left delicate aesthetic floral watermark */}
    <svg 
      className="absolute bottom-16 -left-12 w-80 h-80 text-indigo-900 opacity-[0.03] transform -rotate-45" 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M50 85 C35 70, 20 50, 50 15 C80 50, 65 70, 50 85 Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M50 85 C25 80, 5 60, 25 35 C40 50, 48 70, 50 85 Z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <path d="M50 85 C75 80, 95 60, 75 35 C60 50, 52 70, 50 85 Z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <path d="M50 85 C15 90, 0 75, 10 50 C25 65, 40 78, 50 85 Z" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
      <path d="M50 85 C85 90, 100 75, 90 50 C75 65, 60 78, 50 85 Z" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
      <circle cx="50" cy="10" r="2" fill="currentColor" />
    </svg>
  </div>
);

const CutCornerCard = ({ children, className = '', containerClassName = '', onClick }) => (
  <div 
    onClick={onClick}
    className={`relative p-[1.5px] bg-gradient-to-br from-slate-200 via-slate-100 to-indigo-100/70 shadow-[0_4px_16px_rgba(15,23,42,0.04)] transition-all ${containerClassName}`}
    style={{
      clipPath: 'polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)',
    }}
  >
    <div 
      className={`relative bg-white w-full h-full overflow-hidden ${className}`}
      style={{
        clipPath: 'polygon(11px 0, calc(100% - 11px) 0, 100% 11px, 100% calc(100% - 11px), calc(100% - 11px) 100%, 11px 100%, 0 calc(100% - 11px), 0 11px)',
      }}
    >
      <FloralWatermark />
      <div className="relative z-10 w-full">{children}</div>
    </div>
  </div>
);

const getPaymentLogo = (method) => {
  if (method === 'bKash') return `${import.meta.env.BASE_URL}bkash.png`;
  return `${import.meta.env.BASE_URL}nagad.png`;
};

const AbstractWalletIcon = () => (
    <svg viewBox="0 0 64 64" className="w-16 h-16 opacity-10">
      <rect x="8" y="16" width="48" height="32" rx="6" fill="#4F46E5" />
      <path d="M8 28h48v20a6 6 0 01-6 6H14a6 6 0 01-6-6V28z" fill="#4338CA" />
      <circle cx="44" cy="32" r="4" fill="#6366F1" />
      <rect x="8" y="24" width="48" height="4" fill="#312E81" opacity="0.3" />
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

function HeaderWalletButton() {
  const userTonAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();

  if (userTonAddress) {
    return (
      <button 
        type="button"
        onClick={() => tonConnectUI.openModal()}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm active:scale-95 transition-all"
        title={userTonAddress}
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
        <span className="text-[12px] font-extrabold tracking-tight">Connected</span>
      </button>
    );
  }

  return (
    <button 
      type="button"
      onClick={() => tonConnectUI.openModal()}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0098ea] hover:bg-[#0088d1] text-white shadow-sm shadow-[#0098ea]/20 active:scale-95 transition-all"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0">
        <path d="M12 2L3 7L12 12L21 7L12 2Z" fill="currentColor"/>
        <path d="M3 17L12 22L21 17L12 12L3 17Z" fill="currentColor" fillOpacity="0.8"/>
      </svg>
      <span className="text-[12px] font-extrabold tracking-tight">Connect</span>
    </button>
  );
}

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
  const [isModalOpen, setIsModalOpen] = useState(false);

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
        <PageBackgroundFlowers />
        
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
             {/* Header Wallet Button (Shows Connected when connected, Connect when disconnected) */}
             <div className="origin-right">
                <HeaderWalletButton />
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
                  onOpenBuyCrypto={() => setActiveTab('buy')}
                  onGoToSell={() => setActiveTab('sell')}
                  onGoToAddMoney={() => setActiveTab('add-money')}
              />
          )}
          {activeTab === 'buy' && (
              <BuyCryptoPage 
                  user={user} 
                  balance={balance} 
                  lang={lang} 
                  t={t} 
                  onBack={() => setActiveTab('home')}
                  reloadData={() => loadData(user?.id || 123456789)} 
                  onGoToAddMoney={() => setActiveTab('add-money')} 
              />
          )}
          {activeTab === 'add-money' && (
              <AddMoneyPage 
                  user={user} 
                  lang={lang} 
                  t={t} 
                  onDone={() => setActiveTab('home')}
                  onGoToBuyCrypto={() => setActiveTab('buy')}
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
                  setIsModalOpen={setIsModalOpen}
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
                  setFiatWallet={setFiatWallet}
                  fiatWithdrawPending={fiatWithdrawPending} 
                  setIsModalOpen={setIsModalOpen}
                  onBack={() => setActiveTab('profile')} 
                  reloadData={() => loadData(user?.id || 123456789)} 
              />
          )}
        </div>

        {/* PREMIUM EXECUTIVE BOTTOM NAVIGATION */}
        {!isKeyboardVisible && !isModalOpen && activeTab !== 'buy' && activeTab !== 'claim' && activeTab !== 'history' && activeTab !== 'withdraw' && (
            <div className="fixed bottom-0 left-0 w-full z-50 flex justify-center pb-[env(safe-area-inset-bottom,16px)] px-4 mb-4 pointer-events-none">
                <div className="w-full max-w-[380px] bg-white/95 backdrop-blur-2xl rounded-[28px] flex justify-between items-center p-1.5 shadow-[0_12px_36px_rgba(15,23,42,0.08)] border border-slate-200/80 pointer-events-auto">
                    
                    {/* HOME */}
                    <button 
                        type="button"
                        onClick={() => setActiveTab('home')} 
                        className="relative flex-1 flex flex-col items-center justify-center py-2 rounded-[20px] transition-all duration-300 group active:scale-95"
                    >
                        <div className={`absolute inset-0 rounded-[20px] transition-all duration-300 ${activeTab === 'home' ? 'bg-indigo-50 border border-indigo-100/90 shadow-xs opacity-100 scale-100' : 'opacity-0 scale-90'}`} />
                        <div className="relative z-10 flex flex-col items-center justify-center">
                            <Home size={20} strokeWidth={activeTab === 'home' ? 2.5 : 2} className={`mb-1 transition-all duration-300 ${activeTab === 'home' ? 'text-indigo-600 scale-105' : 'text-slate-400 group-hover:text-slate-600'}`} />
                            <span className={`text-[10px] tracking-wide transition-all duration-300 ${activeTab === 'home' ? 'text-indigo-950 font-black' : 'text-slate-400 font-bold group-hover:text-slate-600'}`}>{t.home}</span>
                        </div>
                        <div className={`absolute -bottom-0.5 w-3 h-1 bg-indigo-600 rounded-full transition-all duration-300 ${activeTab === 'home' ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`} />
                    </button>
  
                    {/* ADD MONEY */}
                    <button 
                        type="button"
                        onClick={() => setActiveTab('add-money')} 
                        className="relative flex-1 flex flex-col items-center justify-center py-2 rounded-[20px] transition-all duration-300 group active:scale-95"
                    >
                        <div className={`absolute inset-0 rounded-[20px] transition-all duration-300 ${activeTab === 'add-money' ? 'bg-indigo-50 border border-indigo-100/90 shadow-xs opacity-100 scale-100' : 'opacity-0 scale-90'}`} />
                        <div className="relative z-10 flex flex-col items-center justify-center">
                            <PlusCircle size={20} strokeWidth={activeTab === 'add-money' ? 2.5 : 2} className={`mb-1 transition-all duration-300 ${activeTab === 'add-money' ? 'text-indigo-600 scale-105' : 'text-slate-400 group-hover:text-slate-600'}`} />
                            <span className={`text-[10px] tracking-wide transition-all duration-300 ${activeTab === 'add-money' ? 'text-indigo-950 font-black' : 'text-slate-400 font-bold group-hover:text-slate-600'}`}>{t.addMoney}</span>
                        </div>
                        <div className={`absolute -bottom-0.5 w-3 h-1 bg-indigo-600 rounded-full transition-all duration-300 ${activeTab === 'add-money' ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`} />
                    </button>
  
                    {/* SELL */}
                    <button 
                        type="button"
                        onClick={() => setActiveTab('sell')} 
                        className="relative flex-1 flex flex-col items-center justify-center py-2 rounded-[20px] transition-all duration-300 group active:scale-95"
                    >
                        <div className={`absolute inset-0 rounded-[20px] transition-all duration-300 ${activeTab === 'sell' ? 'bg-indigo-50 border border-indigo-100/90 shadow-xs opacity-100 scale-100' : 'opacity-0 scale-90'}`} />
                        <div className="relative z-10 flex flex-col items-center justify-center">
                            <ArrowUp size={20} strokeWidth={activeTab === 'sell' ? 2.5 : 2} className={`mb-1 transition-all duration-300 ${activeTab === 'sell' ? 'text-indigo-600 scale-105' : 'text-slate-400 group-hover:text-slate-600'}`} />
                            <span className={`text-[10px] tracking-wide transition-all duration-300 ${activeTab === 'sell' ? 'text-indigo-950 font-black' : 'text-slate-400 font-bold group-hover:text-slate-600'}`}>{t.sell}</span>
                        </div>
                        <div className={`absolute -bottom-0.5 w-3 h-1 bg-indigo-600 rounded-full transition-all duration-300 ${activeTab === 'sell' ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`} />
                    </button>
  
                    {/* PROFILE */}
                    <button 
                        type="button"
                        onClick={() => setActiveTab('profile')} 
                        className="relative flex-1 flex flex-col items-center justify-center py-2 rounded-[20px] transition-all duration-300 group active:scale-95"
                    >
                        <div className={`absolute inset-0 rounded-[20px] transition-all duration-300 ${activeTab === 'profile' ? 'bg-indigo-50 border border-indigo-100/90 shadow-xs opacity-100 scale-100' : 'opacity-0 scale-90'}`} />
                        <div className="relative z-10 flex flex-col items-center justify-center">
                            <User size={20} strokeWidth={activeTab === 'profile' ? 2.5 : 2} className={`mb-1 transition-all duration-300 ${activeTab === 'profile' ? 'text-indigo-600 scale-105' : 'text-slate-400 group-hover:text-slate-600'}`} />
                            <span className={`text-[10px] tracking-wide transition-all duration-300 ${activeTab === 'profile' ? 'text-indigo-950 font-black' : 'text-slate-400 font-bold group-hover:text-slate-600'}`}>{t.profile}</span>
                        </div>
                        <div className={`absolute -bottom-0.5 w-3 h-1 bg-indigo-600 rounded-full transition-all duration-300 ${activeTab === 'profile' ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`} />
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
      <CutCornerCard className="p-4 relative">
         <div className="absolute top-3 right-3 pointer-events-none opacity-40">
            <AbstractWalletIcon />
         </div>
         <div className="flex justify-between items-start mb-1.5">
            <p className="text-[11px] font-black text-slate-400 tracking-wider uppercase">{t?.totalBalance || 'Total Balance'}</p>
            <button 
                onClick={onGoToAddMoney} 
                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold rounded-full flex items-center gap-1 transition-colors border border-indigo-200/60 active:scale-95 shadow-xs"
            >
                <PlusCircle size={12} strokeWidth={2.5} />
                <span>{t?.addMoney || 'Add Money'}</span>
            </button>
         </div>
         <div className="flex items-baseline gap-1.5">
            <h2 className="text-3xl font-black text-slate-900">{balance}</h2>
            <span className="text-base font-black text-indigo-600">TK</span>
         </div>
         <p className="text-[11px] text-slate-500 font-medium mt-1">{t?.balanceSub || 'Available for withdrawal & crypto purchase'}</p>
      </CutCornerCard>

      {/* Quick Action Buttons: Buy Crypto & Sell Crypto */}
      <div className="grid grid-cols-2 gap-2.5">
         <button 
             onClick={onOpenBuyCrypto} 
             className="flex items-center gap-2.5 bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-700 text-white p-3 rounded-2xl shadow-md shadow-indigo-600/20 active:scale-[0.97] transition-all text-left group"
         >
             <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
                 <Coins size={18} />
             </div>
             <div>
                 <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider leading-none">{t?.buyCryptoSub || 'Instant Send'}</p>
                 <p className="text-[15px] font-bold text-white leading-tight mt-1 tracking-tight">{t?.buyCrypto || 'Buy Crypto'}</p>
             </div>
         </button>
         
         <button 
             onClick={onGoToSell} 
             className="flex items-center gap-2.5 bg-white text-slate-900 p-3 rounded-2xl shadow-sm border border-slate-200 active:scale-[0.97] transition-all text-left group hover:border-slate-300"
         >
             <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 group-hover:scale-105 transition-transform border border-indigo-100">
                 <ArrowRightLeft size={18} />
             </div>
             <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">{t?.sellCryptoSub || 'Instant Swap'}</p>
                 <p className="text-[15px] font-bold text-slate-900 leading-tight mt-1 tracking-tight">{t?.sellCrypto || 'Sell Crypto'}</p>
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
                                src={getPaymentLogo(paymentMethod)} 
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
                                src={getPaymentLogo('bKash')} 
                                className="w-6 h-6 object-contain shrink-0" 
                                alt="bKash" 
                            />
                            <div className="flex-1 text-left min-w-0">
                                <span className="font-bold text-[12px] text-gray-900 block leading-tight truncate">bKash</span>
                                <span className="text-[10px] text-gray-400 font-medium block">Personal</span>
                            </div>
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-all ${
                                paymentMethod === 'bKash' ? 'bg-indigo-600 text-white' : 'border border-gray-300'
                            }`}>
                                {paymentMethod === 'bKash' && <Check size={10} strokeWidth={3} />}
                            </div>
                        </div>

                        {/* Nagad */}
                        <div 
                            onClick={() => setPaymentMethod('Nagad')}
                            className={`px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-2.5 ${
                                paymentMethod === 'Nagad' 
                                    ? 'border-indigo-600 bg-indigo-50/50 shadow-sm' 
                                    : 'border-gray-100 bg-gray-50/60 hover:bg-gray-50'
                            }`}
                        >
                            <img 
                                src={getPaymentLogo('Nagad')} 
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

// REALTIME FULL-PAGE BUY CRYPTO (Live On-Chain Payout from User BDT Balance)
function BuyCryptoPage({ user, balance = 0, lang = 'bn', t, reloadData, onGoToAddMoney, onBack }) {
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
        if (onBack) onBack();
    };

    return (
        <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300 max-w-md mx-auto">
            {/* Header */}
            <div className="flex items-center gap-2.5 py-0.5">
                <button 
                    type="button" 
                    onClick={onBack} 
                    className="p-1.5 bg-white rounded-full text-slate-700 active:scale-95 transition-transform border border-slate-200 shadow-xs"
                >
                    <ChevronRight size={18} className="rotate-180" strokeWidth={2.5} />
                </button>
                <div className="flex-1">
                    <h2 className="text-[15px] font-black text-slate-900 leading-tight flex items-center gap-1.5">
                        <Coins size={16} className="text-indigo-600" />
                        {t?.buyCrypto || 'Buy Crypto'}
                    </h2>
                    <p className="text-slate-500 text-[11px] font-medium leading-none">
                        {lang === 'bn' ? 'ব্যালেন্স থেকে সরাসরি ওয়ালেটে ক্রিপ্টো ক্রয়' : 'Instant buy directly to your wallet'}
                    </p>
                </div>
            </div>

            <CutCornerCard className="p-3.5 space-y-3">

                {/* SUCCESS STAGE */}
                {stage === 'success' ? (
                    <div className="py-2 text-center animate-in zoom-in-95 duration-400 my-auto">
                        <div className="relative mb-2 inline-block">
                            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 relative z-10 border-2 border-white mx-auto">
                                <CheckCircle2 size={24} />
                            </div>
                        </div>

                        <h4 className="text-[14px] font-black text-slate-900 mb-0.5">
                            {lang === 'bn' ? 'ক্রিপ্টো সফলভাবে পাঠানো হয়েছে! 🎉' : 'Crypto Sent Successfully! 🎉'}
                        </h4>
                        <p className="text-slate-500 text-[11px] mb-3 max-w-[280px] mx-auto leading-tight">
                            {lang === 'bn' 
                                ? <>আপনার ওয়ালেটে <b>{calculatedCrypto} {selectedAsset}</b> ট্রান্সফার সম্পন্ন।</>
                                : <>Successfully sent <b>{calculatedCrypto} {selectedAsset}</b> to your wallet.</>}
                        </p>

                        <div className="bg-slate-50 rounded-xl p-2.5 text-left text-[11px] space-y-1 border border-slate-200 mb-3">
                            <div className="flex justify-between">
                                <span className="text-slate-400 font-medium">Crypto Sent:</span>
                                <span className="font-bold text-indigo-600">{calculatedCrypto} {selectedAsset}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400 font-medium">BDT Deducted:</span>
                                <span className="font-bold text-slate-900">৳{bdtAmount} TK</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 font-medium">Wallet:</span>
                                <span className="font-mono font-bold text-slate-700 truncate max-w-[170px]">{receiveAddress}</span>
                            </div>
                        </div>

                        <button 
                            onClick={handleResetAndClose} 
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl shadow-md shadow-indigo-600/20 active:scale-95 transition-all text-[12px]"
                        >
                            {lang === 'bn' ? 'সম্পন্ন / DONE' : 'DONE'}
                        </button>
                    </div>
                ) : stage === 'error' ? (
                    /* ERROR STAGE */
                    <div className="py-2 text-center animate-in zoom-in-95 duration-400 my-auto">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 mx-auto mb-2 border-2 border-white shadow-xs">
                            <AlertCircle size={24} />
                        </div>
                        <h4 className="text-[14px] font-black text-slate-900 mb-1">
                            {lang === 'bn' ? 'ট্রানজেকশন ব্যর্থ হয়েছে' : 'Transaction Failed'}
                        </h4>
                        <p className="text-red-600 text-[11px] mb-3 leading-snug bg-red-50 p-2.5 rounded-xl border border-red-100 max-w-[300px] mx-auto">
                            {errorMessage}
                        </p>
                        <button 
                            onClick={() => setStage('idle')} 
                            className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-xl active:scale-95 transition-all text-[12px]"
                        >
                            {lang === 'bn' ? 'আবার চেষ্টা করুন (TRY AGAIN)' : 'TRY AGAIN'}
                        </button>
                    </div>
                ) : stage === 'processing' ? (
                    /* LIVE REALTIME PROCESSING STAGE */
                    <div className="py-4 text-center animate-in fade-in duration-300 space-y-3 my-auto">
                        <div className="relative inline-block">
                            <div className="w-12 h-12 border-3 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center text-indigo-600">
                                <Coins size={20} className="animate-pulse" />
                            </div>
                        </div>

                        <div>
                            <h4 className="text-[14px] font-black text-slate-900 mb-0.5">
                                {lang === 'bn' 
                                    ? (processStep === 1 ? 'ব্যালেন্স যাচাই হচ্ছে...' : processStep === 2 ? `ওয়ালেটে ${selectedAsset} পাঠানো হচ্ছে...` : 'ব্লকচেইন কনফার্মেশন...')
                                    : (processStep === 1 ? 'Checking Balance...' : processStep === 2 ? `Sending ${selectedAsset}...` : 'Confirming...')}
                            </h4>
                            <p className="text-slate-400 text-[11px]">
                                {lang === 'bn' 
                                    ? (processStep === 1 ? 'একাউন্ট ব্যালেন্স ও রেট যাচাই চলছে' : processStep === 2 ? 'অন-চেইনে রিয়েলটাইমে ট্রান্সফার হচ্ছে' : 'অন-চেইন কনফার্মেশন সম্পন্ন হচ্ছে')
                                    : (processStep === 1 ? 'Verifying balance & rate' : processStep === 2 ? 'Broadcasting live to wallet' : 'Finalizing confirmation')}
                            </p>
                        </div>

                        <div className="flex items-center justify-center gap-1.5 max-w-[200px] mx-auto">
                            <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${processStep >= 1 ? 'bg-indigo-600' : 'bg-slate-200'}`} />
                            <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${processStep >= 2 ? 'bg-indigo-600' : 'bg-slate-200'}`} />
                            <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${processStep >= 3 ? 'bg-indigo-600' : 'bg-slate-200'}`} />
                        </div>
                    </div>
                ) : (
                    /* IDLE / COMPACT NO-SCROLL INPUT STAGE */
                    <div className="space-y-2.5">
                        {/* 1. Balance Banner */}
                        <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 flex justify-between items-center shrink-0">
                            <div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
                                    {t?.availableBal || 'Available Balance'}
                                </span>
                                <span className="text-[14px] font-black text-slate-900">{balance} <span className="text-indigo-600 text-[11px]">TK</span></span>
                            </div>
                            <button 
                                onClick={onGoToAddMoney} 
                                className="px-2 py-0.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-[10px] font-bold flex items-center gap-1 border border-indigo-200/60"
                            >
                                <PlusCircle size={11} /> {t?.addMoney || 'Add Money'}
                            </button>
                        </div>

                        {/* 2. Select Asset: GRAM vs USDT */}
                        <div className="shrink-0">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                                {t?.selectCrypto || 'Select Crypto Asset'}
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedAsset('GRAM')}
                                    className={`p-2 rounded-xl border flex items-center gap-2 transition-all ${
                                        selectedAsset === 'GRAM' 
                                            ? 'border-indigo-600 bg-indigo-50/70 shadow-xs ring-1 ring-indigo-500/20' 
                                            : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100/60'
                                    }`}
                                >
                                    <img src={`${import.meta.env.BASE_URL}gram.svg`} className="w-5 h-5 object-contain shrink-0" alt="GRAM" />
                                    <div className="text-left">
                                        <span className="font-extrabold text-[11px] text-slate-900 block leading-tight">GRAM (TON)</span>
                                        <span className="text-[9px] text-indigo-600 font-bold">≈ ৳{buyerRates.GRAM} TK</span>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setSelectedAsset('USDT')}
                                    className={`p-2 rounded-xl border flex items-center gap-2 transition-all ${
                                        selectedAsset === 'USDT' 
                                            ? 'border-indigo-600 bg-indigo-50/70 shadow-xs ring-1 ring-indigo-500/20' 
                                            : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100/60'
                                    }`}
                                >
                                    <img src={`${import.meta.env.BASE_URL}usdt.svg`} className="w-5 h-5 object-contain shrink-0" alt="USDT" />
                                    <div className="text-left">
                                        <span className="font-extrabold text-[11px] text-slate-900 block leading-tight">USDT</span>
                                        <span className="text-[9px] text-indigo-600 font-bold">≈ ৳{buyerRates.USDT} TK</span>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* 3. BDT Amount Input */}
                        <div className="shrink-0">
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    {t?.bdtSpend || (lang === 'bn' ? 'টাকার পরিমাণ (BDT)' : 'BDT Amount to Spend')}
                                </label>
                                <span className="text-[9px] text-slate-400 font-semibold">Min ৳20</span>
                            </div>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-600 text-[12px]">৳</span>
                                <input 
                                    type="number" 
                                    value={bdtAmount} 
                                    onChange={e => setBdtAmount(e.target.value)} 
                                    placeholder="0.00" 
                                    className="w-full bg-slate-50 rounded-xl py-2 pl-7 pr-12 text-[13px] font-bold text-slate-900 border border-slate-200 focus:border-indigo-600 focus:bg-white focus:ring-1 focus:ring-indigo-500/20 transition-all outline-none" 
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-[10px] text-slate-400">BDT</span>
                            </div>

                            {/* Quick Presets */}
                            <div className="flex gap-1.5 mt-1">
                                {[100, 500, 1000].map(val => (
                                    <button 
                                        key={val} 
                                        type="button" 
                                        onClick={() => setBdtAmount(val.toString())} 
                                        className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-bold text-slate-700 transition-colors"
                                    >
                                        ৳{val}
                                    </button>
                                ))}
                                <button 
                                    type="button" 
                                    onClick={() => setBdtAmount(Math.floor(balance).toString())} 
                                    className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-bold transition-colors ml-auto border border-indigo-200/50"
                                >
                                    MAX (৳{Math.floor(balance)})
                                </button>
                            </div>
                        </div>

                        {/* 4. Calculated Crypto Receive Box */}
                        <div className="bg-indigo-50/80 border border-indigo-100/90 rounded-xl px-3 py-2 flex justify-between items-center shrink-0">
                            <div>
                                <span className="text-[9px] font-black text-indigo-900 uppercase tracking-wider block">
                                    {t?.youWillReceive || (lang === 'bn' ? 'আপনি পাবেন' : 'You Will Receive')}
                                </span>
                                <span className="text-[10px] text-indigo-600 font-semibold">1 {selectedAsset} ≈ ৳{cryptoRate} BDT</span>
                            </div>
                            <div className="text-right">
                                <span className="text-[15px] font-black text-indigo-700">{calculatedCrypto}</span>
                                <span className="text-[11px] font-black text-indigo-900 ml-1">{selectedAsset}</span>
                            </div>
                        </div>

                        {/* 5. Receive Address Input */}
                        <div className="shrink-0">
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    {t?.receiveAddress || (lang === 'bn' ? 'রিসিভ ওয়ালেট (TON)' : 'Receive Address (TON)')}
                                </label>
                                {userTonAddress && (
                                    <button 
                                        type="button" 
                                        onClick={() => setReceiveAddress(userTonAddress)} 
                                        className="text-[9px] text-indigo-600 font-bold hover:underline"
                                    >
                                        {lang === 'bn' ? 'কানেক্টেড ওয়ালেট দিন' : 'Use Connected'}
                                    </button>
                                )}
                            </div>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    value={receiveAddress} 
                                    onChange={e => setReceiveAddress(e.target.value)} 
                                    placeholder="UQ... or EQ..." 
                                    className="w-full bg-slate-50 rounded-xl py-2 pl-3 pr-9 text-[11px] font-mono font-bold text-slate-900 border border-slate-200 focus:border-indigo-600 focus:bg-white focus:ring-1 focus:ring-indigo-500/20 transition-all outline-none" 
                                />
                                <button 
                                    type="button"
                                    onClick={async () => {
                                        try {
                                            const text = await navigator.clipboard.readText();
                                            if (text) setReceiveAddress(text.trim());
                                        } catch (e) {}
                                    }}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-white text-slate-400 hover:text-indigo-600 rounded-md transition-all border border-slate-200"
                                    title="Paste"
                                >
                                    <ClipboardPaste size={12} />
                                </button>
                            </div>
                        </div>

                        {/* 6. Submit Button */}
                        <div className="shrink-0 pt-1">
                            {hasInsufficientBalance ? (
                                <button 
                                    onClick={onGoToAddMoney} 
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl shadow-md shadow-indigo-600/20 active:scale-95 transition-all text-[12px] flex items-center justify-center gap-1.5"
                                >
                                    <PlusCircle size={15} />
                                    {t?.addMoney || 'ADD MONEY'} {lang === 'bn' ? 'করুন' : 'TO WALLET'}
                                </button>
                            ) : (
                                <button 
                                    onClick={handleConfirmBuy} 
                                    disabled={!numBdt || !receiveAddress || numBdt < 20} 
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-2.5 rounded-xl shadow-md shadow-indigo-600/20 active:scale-95 transition-all text-[12px] flex items-center justify-center gap-1.5"
                                >
                                    <Coins size={15} />
                                    {t?.confirmBuy || 'CONFIRM & BUY'} {selectedAsset}
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </CutCornerCard>
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
        return { GRAM: 200, USDT: 115 };
    });

    // Fetch live market rates
    useEffect(() => {
        let isMounted = true;
        fetchMarketRates().then(data => {
            if (!isMounted || !data) return;
            if (data.sellRates && data.sellRates.USDT) {
                const newRates = {
                    GRAM: 200, // Fixed at 200 BDT as requested
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
    const currentRate = asset === 'USDT' ? (liveRates?.USDT || 115) : 200;
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

    // Direct Sell via Tonkeeper
    const handleDirectSell = async () => {
        if (!userTonAddress) {
            tonConnectUI.openModal();
            return;
        }
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

        setIsTonSending(true);
        setErrorMessage('');

        try {
            const txRes = await buildTransaction({
                asset,
                amount: numAmount,
                userAddress: userTonAddress,
                adminWallet: botWalletAddress
            });

            if (!txRes || !txRes.tx) {
                throw new Error("Failed to prepare transaction");
            }

            // Direct Tonkeeper Confirmation
            const tonResult = await tonConnectUI.sendTransaction(txRes.tx);

            // Successfully signed and sent on-chain! Credit user balance!
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
                setStep(2); // Directly jump to Success Receipt
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                throw new Error(res.error || 'ব্যালেন্সে টাকা যোগ করতে সমস্যা হয়েছে');
            }
        } catch (err) {
            console.error("TonConnect transfer error:", err);
            const isUserCancel = err.message?.includes('Reject') || err.message?.includes('cancel') || err.message?.includes('declined');
            setErrorMessage(isUserCancel 
                ? (lang === 'bn' ? 'টোনকিপারে পেমেন্ট বাতিল করা হয়েছে।' : 'Payment rejected in Tonkeeper.')
                : (err.message || (lang === 'bn' ? 'টোনকিপার দিয়ে পেমেন্ট ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।' : 'Payment failed. Please try again.')));
            if (window.Telegram?.WebApp?.HapticFeedback) {
                window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
            }
        } finally {
            setIsTonSending(false);
        }
    };

    // LUXURY FINTECH SUCCESS RECEIPT
    if (step === 2) {
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

    // STEP 1: COMPACT NO-SCROLL SINGLE SCREEN
    return (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-md mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between py-0.5">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-xs shrink-0">
                        <ArrowRightLeft size={16} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 className="text-[15px] font-black text-slate-900 leading-tight">
                            {t?.sellCrypto || 'Sell Crypto'}
                        </h2>
                        <p className="text-slate-500 text-[11px] font-medium leading-none">
                            {lang === 'bn' ? 'ক্রিপ্টো সোয়াপ করে ইন-অ্যাপ ব্যালেন্স নিন' : 'Swap crypto to account balance'}
                        </p>
                    </div>
                </div>
                {userTonAddress ? (
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-full text-[10px] font-bold">
                        Connected
                    </span>
                ) : (
                    <button 
                        type="button" 
                        onClick={() => tonConnectUI.openModal()} 
                        className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-[10px] font-bold shadow-xs active:scale-95"
                    >
                        {lang === 'bn' ? 'কানেক্ট' : 'Connect'}
                    </button>
                )}
            </div>

            <CutCornerCard className="p-3.5 space-y-3">
                <div className="space-y-2.5">
                    {/* 1. Asset Selection */}
                    <div className="shrink-0">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                            {t?.selectCrypto || 'Select Crypto Asset'}
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {/* GRAM */}
                            <button 
                                type="button"
                                onClick={() => setAsset('GRAM')}
                                className={`p-2 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                                    asset === 'GRAM' 
                                        ? 'border-indigo-600 bg-indigo-50/70 shadow-xs ring-1 ring-indigo-500/20' 
                                        : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100/60'
                                }`}
                            >
                                <img src={`${import.meta.env.BASE_URL}gram.svg`} className="w-5 h-5 object-contain shrink-0" alt="GRAM" />
                                <div className="text-left">
                                    <span className="font-extrabold text-[11px] text-slate-900 block leading-tight">GRAM</span>
                                    <span className="text-[9px] text-indigo-600 font-bold block">Fixed ৳200 TK</span>
                                </div>
                            </button>

                            {/* USDT */}
                            <button 
                                type="button"
                                onClick={() => setAsset('USDT')}
                                className={`p-2 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                                    asset === 'USDT' 
                                        ? 'border-indigo-600 bg-indigo-50/70 shadow-xs ring-1 ring-indigo-500/20' 
                                        : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100/60'
                                }`}
                            >
                                <img src={`${import.meta.env.BASE_URL}usdt.svg`} className="w-5 h-5 object-contain shrink-0" alt="USDT" />
                                <div className="text-left">
                                    <span className="font-extrabold text-[11px] text-slate-900 block leading-tight">USDT</span>
                                    <span className="text-[9px] text-indigo-600 font-bold block">≈ ৳{liveRates.USDT} TK</span>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* 2. Amount Input */}
                    <div className="shrink-0">
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                {lang === 'bn' ? `বিক্রয়ের পরিমাণ (${asset})` : `Amount to Sell (${asset})`}
                            </label>
                            <span className="text-[9px] font-bold text-indigo-600">
                                {lang === 'bn' ? 'নূন্যতম ১ টাকা' : 'Min ৳1 BDT'}
                            </span>
                        </div>
                        <div className="relative">
                            <input 
                                type="number" 
                                value={cryptoAmount} 
                                onChange={e => setCryptoAmount(e.target.value)} 
                                placeholder="0.00" 
                                className="w-full bg-slate-50 rounded-xl py-2 pl-3 pr-14 text-[14px] font-black text-slate-900 border border-slate-200 focus:border-indigo-600 focus:bg-white focus:ring-1 focus:ring-indigo-500/20 transition-all outline-none" 
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 font-black text-[10px] text-slate-400">{asset}</span>
                        </div>
                        <div className="flex gap-1.5 mt-1">
                            {quickAmounts.map(val => (
                                <button
                                    key={val}
                                    type="button"
                                    onClick={() => setCryptoAmount(val.toString())}
                                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                                        cryptoAmount === val.toString() 
                                            ? 'bg-indigo-600 text-white shadow-xs' 
                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}
                                >
                                    {val}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 3. Receive Calculation Box */}
                    <div className="bg-indigo-50/80 border border-indigo-100/90 rounded-xl px-3 py-2 flex justify-between items-center shrink-0">
                        <div>
                            <span className="text-[9px] font-black text-indigo-900 uppercase tracking-wider block">
                                {lang === 'bn' ? 'আপনি মোট পাবেন' : 'You will receive'}
                            </span>
                            <span className="text-[10px] text-indigo-600 font-semibold">1 {asset} ≈ ৳{currentRate} BDT</span>
                        </div>
                        <div className="text-right">
                            <span className="text-[16px] font-black text-indigo-700">৳{estimatedTk}</span>
                            <span className="text-[11px] font-extrabold text-indigo-900 ml-1">BDT</span>
                        </div>
                    </div>

                    {/* Error Banner */}
                    {errorMessage && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-2 flex items-start gap-1.5 animate-in fade-in shrink-0">
                            <AlertCircle size={14} className="text-red-600 shrink-0 mt-0.5" />
                            <p className="text-[10px] text-red-700 font-medium leading-tight">{errorMessage}</p>
                        </div>
                    )}

                    {/* 4. Action Button */}
                    <div className="shrink-0 pt-1">
                        {!userTonAddress ? (
                            <button 
                                type="button"
                                onClick={() => tonConnectUI.openModal()} 
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl py-2.5 shadow-md shadow-indigo-600/20 active:scale-95 transition-all flex justify-center items-center gap-2 text-[12px]"
                            >
                                <Wallet size={16} />
                                <span>{lang === 'bn' ? 'ওয়ালেট কানেক্ট করুন (Tonkeeper)' : 'Connect Wallet to Sell'}</span>
                            </button>
                        ) : (
                            <button 
                                type="button"
                                onClick={handleDirectSell} 
                                disabled={!numAmount || numAmount <= 0 || estimatedTk < 1 || isTonSending} 
                                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl py-2.5 shadow-md shadow-indigo-600/20 active:scale-95 transition-all flex justify-center items-center gap-2 text-[12px]"
                            >
                                {isTonSending ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>{lang === 'bn' ? 'টোনকিপারে কনফার্ম করুন...' : 'Confirming in Tonkeeper...'}</span>
                                    </>
                                ) : (
                                    <>
                                        <ArrowRightLeft size={16} />
                                        <span>{lang === 'bn' ? `কনফার্ম ও বিক্রি করুন (৳${estimatedTk} BDT)` : `Confirm & Sell for ৳${estimatedTk} BDT`}</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </CutCornerCard>
        </div>
    );
}

function HistoryPage({ user, lang = 'bn', t, onBack }) {
    const userId = user?.id || 123456789;
    const cacheKey = `miniapp_history_cache_${userId}`;

    // Instant initial load from cache for ultra-fast mobile data experience
    const [history, setHistory] = useState(() => {
        try {
            const cached = localStorage.getItem(cacheKey);
            if (cached) return JSON.parse(cached);
        } catch(e) {}
        return [];
    });
    const [loading, setLoading] = useState(() => !history || history.length === 0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [filter, setFilter] = useState('all'); // 'all', 'in', 'out'

    const fetchHistory = async (isManual = false) => {
        if (isManual) setIsRefreshing(true);
        try {
            const isLocal = window.location.hostname === 'localhost' || window.location.hostname.includes('192.168');
            const API_URL = isLocal ? 'http://localhost:3000' : 'https://maruf-teach-bot.onrender.com';
            const res = await fetch(`${API_URL}/api/miniapp/history/${userId}`);
            const data = await res.json();
            if(data.success && Array.isArray(data.history)) {
                setHistory(data.history);
                try {
                    localStorage.setItem(cacheKey, JSON.stringify(data.history));
                } catch(e) {}
            }
        } catch(e) {
            console.error("Fetch history error:", e);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchHistory(false);
    }, [userId]);

    // Helpers to calculate BDT amounts and direction
    const getItemDetails = (tx) => {
        const type = tx.type;
        const status = (tx.status || 'pending').toLowerCase();
        const isRejected = status === 'rejected';

        let isCredit = false;
        let bdtAmount = 0;
        let title = '';
        let subtitle = '';

        if (type === 'add_money') {
            isCredit = true;
            bdtAmount = parseFloat(tx.amount || tx.totalBdt) || 0;
            title = lang === 'bn' ? 'টাকা যোগ (Add Money)' : 'Add Money';
            subtitle = `${tx.paymentMethod || 'bKash/Nagad'}${tx.trxId ? ` • TrxID: ${tx.trxId}` : ''}`;
        } else if (type === 'sell') {
            isCredit = true;
            bdtAmount = parseFloat(tx.estimatedTk || tx.amount) || 0;
            title = lang === 'bn' ? `ক্রিপ্টো বিক্রয় (${tx.asset || 'TON'})` : `Sell ${tx.asset || 'TON'}`;
            subtitle = `${lang === 'bn' ? 'বিক্রি:' : 'Sold:'} ${tx.amount} ${tx.asset || 'TON'}`;
        } else if (type === 'buy') {
            bdtAmount = parseFloat(tx.totalBdt || tx.amount) || 0;
            if (isRejected) {
                isCredit = true;
                title = lang === 'bn' ? `ক্রয় বাতিল ও রিফান্ড` : `Buy Rejected & Refunded`;
                subtitle = `${lang === 'bn' ? 'ব্যালেন্সে ফেরত যুক্ত' : 'Refunded to balance'}${tx.rejectReason ? ` • ${tx.rejectReason}` : ''}`;
            } else {
                isCredit = false;
                title = lang === 'bn' ? `ক্রিপ্টো ক্রয় (${tx.asset || 'TON'})` : `Buy ${tx.asset || 'TON'}`;
                subtitle = `${lang === 'bn' ? 'পেয়েছেন:' : 'Received:'} ${tx.amount} ${tx.asset || 'TON'}${tx.receiveAddress ? ` • ${tx.receiveAddress.slice(0, 4)}...${tx.receiveAddress.slice(-4)}` : ''}`;
            }
        } else if (type === 'withdraw') {
            bdtAmount = parseFloat(tx.amount) || 0;
            if (isRejected) {
                isCredit = true;
                title = lang === 'bn' ? 'উইথড্র বাতিল ও রিফান্ড' : 'Withdrawal Refunded';
                subtitle = `${lang === 'bn' ? 'ব্যালেন্সে ফেরত এসেছে' : 'Refunded to balance'}${tx.rejectReason ? ` • কারণ: ${tx.rejectReason}` : ''}`;
            } else {
                isCredit = false;
                title = lang === 'bn' ? `টাকা উত্তোলন (${tx.method || 'উইথড্র'})` : `Withdraw (${tx.method || 'BDT'})`;
                subtitle = `${tx.number ? `${tx.number} • ` : ''}${lang === 'bn' ? 'পাবেন ৳' : 'Receive ৳'}${tx.receiveAmount || bdtAmount}`;
            }
        } else {
            bdtAmount = parseFloat(tx.amount) || 0;
            title = tx.type || 'Transaction';
            subtitle = tx.asset || 'BDT';
        }

        return { isCredit, bdtAmount, title, subtitle, status };
    };

    // Filter items
    const filteredHistory = history.filter(tx => {
        const { isCredit } = getItemDetails(tx);
        if (filter === 'in') return isCredit;
        if (filter === 'out') return !isCredit;
        return true;
    });

    // Calculate totals
    const totalIn = history.reduce((acc, tx) => {
        const { isCredit, bdtAmount } = getItemDetails(tx);
        return isCredit ? acc + bdtAmount : acc;
    }, 0);

    const totalOut = history.reduce((acc, tx) => {
        const { isCredit, bdtAmount } = getItemDetails(tx);
        return !isCredit ? acc + bdtAmount : acc;
    }, 0);

    return (
        <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300 pb-20 max-w-md mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                    <button onClick={onBack} className="p-1.5 bg-white rounded-full flex items-center justify-center shadow-xs border border-slate-200 active:scale-95 transition-transform text-slate-700">
                        <ChevronRight size={18} className="rotate-180" strokeWidth={2.5} />
                    </button>
                    <div>
                        <h2 className="text-[15px] font-black text-slate-900 leading-tight">
                            {t?.transactionHistory || 'Transaction History'}
                        </h2>
                        <p className="text-[10px] text-slate-400 font-medium leading-none">
                            {lang === 'bn' ? 'আপনার সকল আয় ও ব্যয়ের হিসাব' : 'Your complete inflow & outflow ledger'}
                        </p>
                    </div>
                </div>
                <button 
                    type="button" 
                    onClick={() => fetchHistory(true)} 
                    disabled={isRefreshing}
                    className="p-1.5 bg-white rounded-full text-slate-600 border border-slate-200 active:scale-95 shadow-xs transition-transform"
                    title="Refresh"
                >
                    <RefreshCw size={15} className={isRefreshing ? 'animate-spin text-indigo-600' : ''} />
                </button>
            </div>

            {/* Inflow vs Outflow Mini Summary Card */}
            <CutCornerCard className="p-3">
                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                        <div className="flex items-center gap-1.5 text-slate-600 text-[10px] font-black uppercase mb-0.5">
                            <ArrowDownLeft size={12} strokeWidth={2.5} className="text-emerald-600" />
                            <span>{lang === 'bn' ? 'মোট জমা (+)' : 'Inflow (+)'}</span>
                        </div>
                        <p className="text-base font-black text-emerald-600">+৳{totalIn.toFixed(2)}</p>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                        <div className="flex items-center gap-1.5 text-slate-600 text-[10px] font-black uppercase mb-0.5">
                            <ArrowUpRight size={12} strokeWidth={2.5} className="text-rose-600" />
                            <span>{lang === 'bn' ? 'মোট খরচ (-)' : 'Outflow (-)'}</span>
                        </div>
                        <p className="text-base font-black text-slate-900">-৳{totalOut.toFixed(2)}</p>
                    </div>
                </div>
            </CutCornerCard>

            {/* Filter Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl gap-1 border border-slate-200/60 text-[11px] font-bold">
                <button
                    type="button"
                    onClick={() => setFilter('all')}
                    className={`flex-1 py-1.5 rounded-lg transition-all ${filter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                >
                    {lang === 'bn' ? 'সবগুলো' : 'All'} ({history.length})
                </button>
                <button
                    type="button"
                    onClick={() => setFilter('in')}
                    className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${filter === 'in' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                    <ArrowDownLeft size={11} strokeWidth={2.5} />
                    <span>{lang === 'bn' ? 'জমা (+)' : 'In (+)'}</span>
                </button>
                <button
                    type="button"
                    onClick={() => setFilter('out')}
                    className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${filter === 'out' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                    <ArrowUpRight size={11} strokeWidth={2.5} />
                    <span>{lang === 'bn' ? 'খরচ (-)' : 'Out (-)'}</span>
                </button>
            </div>
            
            {loading ? (
                <div className="flex justify-center py-10">
                    <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : filteredHistory.length === 0 ? (
                <CutCornerCard className="p-8 text-center flex flex-col items-center">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mb-2 border border-slate-200">
                        <Clock size={20} />
                    </div>
                    <p className="font-black text-slate-900 text-[13px] mb-0.5">
                        {lang === 'bn' ? 'কোনো লেনদেন পাওয়া যায়নি' : 'No Transactions Found'}
                    </p>
                    <p className="text-[11px] text-slate-400">
                        {lang === 'bn' ? 'আপনার নির্বাচিত ক্যাটাগরিতে কোনো রেকর্ড নেই।' : 'No records match your selected filter.'}
                    </p>
                </CutCornerCard>
            ) : (
                <div className="space-y-2">
                    {filteredHistory.map((tx, idx) => {
                        const { isCredit, bdtAmount, title, subtitle, status } = getItemDetails(tx);
                        const ts = tx.timestamp?._seconds ? tx.timestamp._seconds * 1000 : (typeof tx.timestamp === 'number' ? tx.timestamp : (tx.timestamp ? new Date(tx.timestamp).getTime() : Date.now()));
                        const formattedDate = new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' • ' + new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                        return (
                            <CutCornerCard key={idx} className="p-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                        {/* Icon */}
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                                            isCredit 
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                                : 'bg-slate-50 text-slate-600 border-slate-200'
                                        }`}>
                                            {isCredit ? (
                                                <ArrowDownLeft size={16} strokeWidth={2.5} />
                                            ) : (
                                                <ArrowUpRight size={16} strokeWidth={2.5} />
                                            )}
                                        </div>
                                        {/* Title and Subtitle */}
                                        <div className="min-w-0">
                                            <p className="font-black text-slate-900 text-[12px] leading-tight truncate">
                                                {title}
                                            </p>
                                            <p className="text-[10px] font-medium text-slate-400 mt-0.5 truncate">
                                                {subtitle}
                                            </p>
                                            <p className="text-[9px] text-slate-400 mt-0.5">
                                                {formattedDate}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Right Side: Amount and Status Badge */}
                                    <div className="text-right shrink-0">
                                        <p className={`font-black text-[13px] leading-tight ${
                                            isCredit ? 'text-emerald-600' : 'text-slate-900'
                                        }`}>
                                            {isCredit ? `+৳${bdtAmount.toFixed(2)}` : `-৳${bdtAmount.toFixed(2)}`}
                                        </p>
                                        <div className="mt-1">
                                            {status === 'completed' ? (
                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    ✓ {lang === 'bn' ? 'সফল' : 'Completed'}
                                                </span>
                                            ) : status === 'rejected' ? (
                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                                    ✕ {lang === 'bn' ? 'রিফান্ডেড' : 'Refunded'}
                                                </span>
                                            ) : status === 'verified' ? (
                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                                    ⚡ {lang === 'bn' ? 'ভেরিফাইড' : 'Verified'}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                    ⏳ {lang === 'bn' ? 'পেন্ডিং' : 'Pending'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CutCornerCard>
                        );
                    })}
                </div>
            )}
        </div>
    );
}


function ProfilePage({ user, balance, mbsId, lang = 'bn', t, onSetLang, fiatWallet, fiatWithdrawPending, onGoToWithdraw, onGoToHistory, setFiatWallet, setIsModalOpen, reloadData }) {
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

  useEffect(() => {
    if (setIsModalOpen) {
      setIsModalOpen(showWalletModal || showSupportModal || !!txStatus);
    }
  }, [showWalletModal, showSupportModal, txStatus, setIsModalOpen]);
  
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
    <div className="space-y-3.5 animate-in fade-in slide-in-from-right-4 duration-300 max-w-md mx-auto pb-24">
      {/* 1. IDENTITY & LANGUAGE MASTER CARD */}
      <CutCornerCard className="p-4">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="w-12 h-12 bg-indigo-50 border-2 border-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-black text-lg shrink-0 shadow-xs">
                  {user?.first_name?.charAt(0)?.toUpperCase() || 'U'}
               </div>
               <div>
                  <h2 className="text-[15px] font-black text-slate-900 leading-tight">{user?.first_name || 'User'}</h2>
                  <p className="text-slate-400 text-[11px] font-medium">@{user?.username || 'user'}</p>
                  <div 
                     onClick={() => { 
                        navigator.clipboard.writeText(user?.id); 
                        if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.impactOccurred('light'); 
                     }}
                     className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded cursor-pointer mt-1 active:bg-slate-200"
                  >
                     ID: {user?.id || '000000'} <Copy size={10} className="text-slate-400" />
                  </div>
               </div>
            </div>

            {/* Language Switcher Pill */}
            <div className="flex flex-col items-end">
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  {lang === 'bn' ? 'ভাষা' : 'Language'}
               </span>
               <div className="flex bg-slate-100 p-0.5 rounded-lg gap-0.5 border border-slate-200/60">
                  <button
                     type="button"
                     onClick={() => onSetLang && onSetLang('bn')}
                     className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                        lang === 'bn' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                     }`}
                  >
                     🇧🇩 বাংলা
                  </button>
                  <button
                     type="button"
                     onClick={() => onSetLang && onSetLang('en')}
                     className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                        lang === 'en' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                     }`}
                  >
                     🇬🇧 Eng
                  </button>
               </div>
            </div>
         </div>
      </CutCornerCard>

      {/* 2. WEALTH & PAYOUT MASTER CARD */}
      <CutCornerCard className="p-4 space-y-3.5">
         <div className="flex justify-between items-start">
            <div>
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">
                  {t?.availableBal || 'Available Balance'}
               </span>
               <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-slate-900">{balance}</span>
                  <span className="text-sm font-black text-indigo-600">TK</span>
               </div>
            </div>
            <div className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-[10px] font-black">
               ✓ Verified
            </div>
         </div>

         {/* Saved Payout Wallet with Edit Icon */}
         <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between">
            {fiatWallet ? (
               <>
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                     <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-xs">
                        <img 
                           src={getPaymentLogo(fiatWallet.method)} 
                           alt={fiatWallet.method} 
                           className="w-full h-full object-contain" 
                        />
                     </div>
                     <div className="min-w-0">
                        <span className="text-[12px] font-black text-slate-900 block leading-tight">{fiatWallet.method} Wallet</span>
                        <span className="text-[11px] font-mono font-bold text-slate-600 block mt-0.5 truncate">
                           {fiatWallet.number} {fiatWallet.name ? `• ${fiatWallet.name}` : ''}
                        </span>
                     </div>
                  </div>
                  <button 
                     type="button" 
                     onClick={() => {
                        setWalletMethod(fiatWallet.method || 'bKash');
                        setWalletNumber(fiatWallet.number || '');
                        setWalletName(fiatWallet.name || '');
                        setShowWalletModal(true);
                     }}
                     className="p-1.5 bg-white text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all border border-slate-200 shadow-xs flex items-center gap-1 text-[11px] font-bold active:scale-95 shrink-0"
                  >
                     <Edit3 size={13} />
                     <span>{lang === 'bn' ? 'এডিট' : 'Edit'}</span>
                  </button>
               </>
            ) : (
               <>
                  <div className="flex items-center gap-2.5">
                     <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0">
                        +
                     </div>
                     <div>
                        <span className="text-[12px] font-black text-slate-800 block">
                           {lang === 'bn' ? 'ওয়ালেট যুক্ত নেই' : 'No Payout Wallet'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                           {lang === 'bn' ? 'টাকা তুলতে bKash বা Nagad যোগ করুন' : 'Add bKash/Nagad to cashout'}
                        </span>
                     </div>
                  </div>
                  <button 
                     type="button" 
                     onClick={() => setShowWalletModal(true)}
                     className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-[11px] font-bold shadow-xs active:scale-95"
                  >
                     {lang === 'bn' ? '+ যোগ করুন' : '+ Add'}
                  </button>
               </>
            )}
         </div>

         {/* Primary Withdraw Action Button */}
         <button 
            type="button"
            onClick={handleWithdrawClick} 
            disabled={withdrawing} 
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-[44px] rounded-xl shadow-md shadow-indigo-600/20 active:scale-[0.98] transition-all disabled:opacity-70 flex items-center justify-center gap-2 text-[13px] tracking-wide"
         >
            <Wallet size={16} />
            <span>{t?.withdrawBalance || 'WITHDRAW BALANCE'}</span>
         </button>
      </CutCornerCard>

      {/* 3. HISTORY & SUPPORT SERVICES MASTER CARD */}
      <CutCornerCard className="p-2 space-y-1">
         {/* History Row */}
         <div 
            onClick={onGoToHistory} 
            className="p-2.5 rounded-xl hover:bg-slate-50 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all group"
         >
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform shrink-0 border border-indigo-100">
                  <Clock size={16} />
               </div>
               <div>
                  <span className="font-bold text-slate-900 block text-[12px] leading-tight">
                     {t?.transactionHistory || 'Transaction History'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                     {t?.transactionHistorySub || 'All buys, sells & withdrawals'}
                  </span>
               </div>
            </div>
            <ChevronRight size={15} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
         </div>

         <div className="h-px bg-slate-100 w-full" />

         {/* Customer Support Row */}
         <div 
            onClick={() => { setShowSupportModal(true); setSupportFeedback(null); }} 
            className="p-2.5 rounded-xl hover:bg-slate-50 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all group"
         >
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform shrink-0 border border-indigo-100">
                  <Headphones size={16} />
               </div>
               <div>
                  <span className="font-bold text-slate-900 block text-[12px] leading-tight">
                     {t?.customerSupport || 'সাপোর্ট ও সাহায্য'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                     {t?.customerSupportSub || 'সরাসরি অ্যাডমিন টিমের সাথে যোগাযোগ'}
                  </span>
               </div>
            </div>
            <ChevronRight size={15} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
         </div>
      </CutCornerCard>


      {/* Support Message Modal */}
      {showSupportModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
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
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
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
                                      <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 p-0.5 flex items-center justify-center shrink-0">
                                       <img src={getPaymentLogo(walletMethod)} alt={walletMethod} className="w-full h-full object-contain" />
                                   </div>
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
                                                  <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 p-0.5 flex items-center justify-center shrink-0">
                                                   <img src={getPaymentLogo(method)} alt={method} className="w-full h-full object-contain" />
                                               </div>
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








function WithdrawFiatPage({ user, balance, lang = 'bn', t, fiatWallet, setFiatWallet, fiatWithdrawPending, setIsModalOpen, onBack, reloadData }) {
    const [amount, setAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [timeLeft, setTimeLeft] = useState('');
    const [showEditWalletModal, setShowEditWalletModal] = useState(false);
    const [editMethod, setEditMethod] = useState('bKash');
    const [editNumber, setEditNumber] = useState('');
    const [editName, setEditName] = useState('');
    const [isSavingWallet, setIsSavingWallet] = useState(false);

    useEffect(() => {
        if (setIsModalOpen) {
            setIsModalOpen(showEditWalletModal);
        }
    }, [showEditWalletModal, setIsModalOpen]);

    const handleSaveEditedWallet = async () => {
        if (!editNumber || !editName) return;
        setIsSavingWallet(true);
        try {
            await saveFiatWallet({
                userId: user?.id || 123456789,
                method: editMethod,
                number: editNumber,
                name: editName
            });
            if (setFiatWallet) setFiatWallet({ method: editMethod, number: editNumber, name: editName });
            setShowEditWalletModal(false);
            if (setIsModalOpen) setIsModalOpen(false);
            if (window.Telegram?.WebApp?.showAlert) window.Telegram.WebApp.showAlert(lang === 'bn' ? "ওয়ালেট সফলভাবে আপডেট করা হয়েছে!" : "Wallet updated successfully!");
        } catch (e) {
            if (window.Telegram?.WebApp?.showAlert) window.Telegram.WebApp.showAlert(e.message || "Failed to update wallet");
            else alert(e.message || "Failed to update wallet");
        } finally {
            setIsSavingWallet(false);
        }
    };

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
        return getPaymentLogo(fiatWallet?.method);
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

            {/* Saved Wallet Info with Edit Icon */}
            <div className="bg-white p-3.5 rounded-2xl premium-shadow border border-[var(--color-border)] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-xs">
                        <img src={getLogo()} alt={fiatWallet?.method} className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-[13px] font-bold text-[var(--color-text-primary)] leading-tight">{fiatWallet?.method || 'bKash'} Wallet</h4>
                        <p className="text-[12px] font-mono font-bold text-[var(--color-text-secondary)] truncate">{fiatWallet?.number}</p>
                        {fiatWallet?.name && <p className="text-[11px] text-gray-400 truncate">{fiatWallet?.name}</p>}
                    </div>
                </div>
                <button 
                    type="button"
                    onClick={() => {
                        setEditMethod(fiatWallet?.method || 'bKash');
                        setEditNumber(fiatWallet?.number || '');
                        setEditName(fiatWallet?.name || '');
                        setShowEditWalletModal(true);
                    }}
                    className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-all active:scale-95 flex items-center gap-1.5 text-xs font-bold border border-emerald-100 shrink-0"
                    title="Edit Wallet"
                >
                    <Edit3 size={15} />
                    <span>{lang === 'bn' ? 'এডিট' : 'Edit'}</span>
                </button>
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

            {/* Edit Wallet Modal */}
            {showEditWalletModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[28px] p-6 w-full max-w-[320px] premium-shadow border border-[var(--color-border)] animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-xl font-extrabold text-[var(--color-text-primary)]">
                                {lang === 'bn' ? 'ওয়ালেট পরিবর্তন' : 'Edit Wallet'}
                            </h3>
                            <button onClick={() => setShowEditWalletModal(false)} className="p-2 bg-gray-100 rounded-full text-gray-500 hover:text-gray-800">
                                <X size={16} strokeWidth={3} />
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Select Method</label>
                                <div className="flex gap-2">
                                    {['bKash', 'Nagad'].map(method => (
                                        <button
                                            key={method}
                                            type="button"
                                            onClick={() => setEditMethod(method)}
                                            className={`flex-1 py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition-all ${
                                                editMethod === method 
                                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' 
                                                    : 'border-gray-200 bg-gray-50 text-gray-600'
                                            }`}
                                        >
                                            <div className="w-6 h-6 rounded-lg bg-white border border-slate-200 p-0.5 flex items-center justify-center shrink-0">
                                                <img src={getPaymentLogo(method)} alt={method} className="w-full h-full object-contain" />
                                            </div>
                                            {method}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Wallet Number</label>
                                <input 
                                    type="tel" 
                                    placeholder="e.g. 017XXXXXXXX" 
                                    value={editNumber} 
                                    onChange={(e) => setEditNumber(e.target.value)} 
                                    className="w-full h-[48px] bg-gray-50 border border-gray-200 rounded-[16px] px-4 font-bold text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)] focus:bg-white transition-all text-sm" 
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Account Name</label>
                                <input 
                                    type="text" 
                                    placeholder="Enter Full Name" 
                                    value={editName} 
                                    onChange={(e) => setEditName(e.target.value)} 
                                    className="w-full h-[48px] bg-gray-50 border border-gray-200 rounded-[16px] px-4 font-bold text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)] focus:bg-white transition-all text-sm" 
                                />
                            </div>
                        </div>

                        <button 
                            onClick={handleSaveEditedWallet} 
                            disabled={!editNumber || !editName || isSavingWallet} 
                            className="w-full h-[48px] mt-6 bg-[var(--color-brand)] hover:bg-emerald-600 text-white rounded-[16px] font-bold text-[14px] flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 shadow-md shadow-emerald-500/20"
                        >
                            {isSavingWallet ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
                            {lang === 'bn' ? 'আপডেট করুন' : 'UPDATE WALLET'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
