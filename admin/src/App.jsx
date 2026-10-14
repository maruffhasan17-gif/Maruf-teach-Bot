import React, { useState, useEffect, useMemo, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Wallet, 
  ShoppingCart, 
  Repeat, 
  CreditCard, 
  Users, 
  Settings, 
  ShieldAlert, 
  Zap, 
  Sun, 
  Moon, 
  Copy, 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  PlusCircle, 
  RefreshCw, 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowDownToLine, 
  Send, 
  Check, 
  X, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  Sparkles, 
  Sliders, 
  LogOut, 
  ChevronRight, 
  Info, 
  Shield 
} from 'lucide-react';
import { TonConnectUIProvider, TonConnectButton, useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';

export const API_BASE = import.meta.env.VITE_API_URL || 
  (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1'))
    ? 'http://localhost:3000' 
    : 'https://maruf-teach-bot.onrender.com');

// Theme Context for Light / Dark Mode
const ThemeContext = createContext({
  theme: 'dark',
  toggleTheme: () => {}
});

export const useTheme = () => useContext(ThemeContext);

// Global data hook
function useBotData() {
  const [data, setData] = useState({ 
    users: [], 
    failedScreenshots: [],
    tonBalance: "0.00", 
    tonNativeBalance: "0.00",
    tonUsdtBalance: "0.00",
    gramBalance: "0.00",
    evmBalance: "0.00", 
    evmAddress: "Loading...", 
    tonAddress: "Loading..." 
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch(`${API_BASE}/api/stats?_t=${Date.now()}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(false), 5000);
    return () => clearInterval(interval);
  }, []);

  return { data, loading, refreshing, refresh: () => fetchData(true) };
}

// Global Orders Hook
function useOrdersData() {
  const [orders, setOrders] = useState({ buys: [], sells: [], withdrawals: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/orders?_t=${Date.now()}`);
      const data = await res.json();
      setOrders({
        buys: Array.isArray(data?.buys) ? data.buys : [],
        sells: Array.isArray(data?.sells) ? data.sells : [],
        withdrawals: Array.isArray(data?.withdrawals) ? data.withdrawals : []
      });
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => fetchOrders(false), 6000);
    return () => clearInterval(interval);
  }, []);

  return { orders, loading, refreshing, refresh: () => fetchOrders(true) };
}

// Toast / Notification helper
function Toast({ show, type = 'success', message, onClose }) {
  useEffect(() => {
    if (show) {
      const t = setTimeout(() => onClose && onClose(), 3500);
      return () => clearTimeout(t);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border animate-in slide-in-from-bottom-5 duration-300 bg-slate-900/95 text-white border-purple-500/30">
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
        {type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
      </div>
      <p className="text-sm font-bold">{message}</p>
      <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer">
        <X size={16} />
      </button>
    </div>
  );
}

// Sidebar Component
function Sidebar({ onOpenCreateTrx, pendingBuysCount, pendingWithdrawCount }) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const navItems = [
    { 
      path: '/', 
      name: 'ড্যাশবোর্ড', 
      sub: 'Dashboard', 
      icon: <LayoutDashboard size={19} /> 
    },
    { 
      path: '/bot-wallet', 
      name: 'ট্রেজারি ও ব্যালেন্স', 
      sub: 'Treasury & TON', 
      icon: <Wallet size={19} /> 
    },
    { 
      path: '/buys', 
      name: 'বাই অর্ডার', 
      sub: 'Buy Orders', 
      icon: <ShoppingCart size={19} />,
      badge: pendingBuysCount > 0 ? pendingBuysCount : null,
      badgeColor: 'bg-emerald-500 text-white'
    },
    { 
      path: '/sells', 
      name: 'সেল অর্ডার', 
      sub: 'Sell Orders', 
      icon: <Repeat size={19} /> 
    },
    { 
      path: '/withdraw', 
      name: 'ক্যাশআউট রিকোয়েস্ট', 
      sub: 'Fiat Cashouts', 
      icon: <CreditCard size={19} />,
      badge: pendingWithdrawCount > 0 ? pendingWithdrawCount : null,
      badgeColor: 'bg-rose-500 text-white'
    },
    { 
      path: '/users', 
      name: 'গ্রাহক ও ব্যালেন্স', 
      sub: 'Users & Bonus', 
      icon: <Users size={19} /> 
    },
    { 
      path: '/bot-settings', 
      name: 'বট সেটিংস ও রেট', 
      sub: 'Bot Configuration', 
      icon: <Settings size={19} /> 
    },
    { 
      path: '/fraud', 
      name: 'নিরাপত্তা ও লগ', 
      sub: 'Security & Fraud', 
      icon: <ShieldAlert size={19} /> 
    },
    { 
      path: '/mock-tool', 
      name: 'মক TrxID টেস্ট টুল', 
      sub: 'Mock SMS Simulator', 
      icon: <Zap size={19} /> 
    },
  ];

  return (
    <aside className={`w-72 h-screen fixed left-0 top-0 flex flex-col z-40 transition-colors duration-200 border-r ${
      isDark 
        ? 'bg-[#0e0c1f] border-purple-900/20 text-slate-200 shadow-2xl shadow-purple-950/20' 
        : 'bg-white border-slate-200 text-slate-800 shadow-xl'
    }`}>
      {/* Brand Header */}
      <div className={`p-5 flex items-center justify-between border-b ${
        isDark ? 'border-purple-900/20' : 'border-slate-100'
      }`}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <img 
              src="/logo.png" 
              alt="Trust Pay Logo" 
              className="w-11 h-11 rounded-2xl object-cover shadow-lg shadow-purple-600/30 border border-purple-500/30" 
            />
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#0e0c1f] animate-pulse"></span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className={`font-black text-base tracking-tight leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Trust Pay
              </h1>
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-gradient-to-r from-purple-600 to-indigo-600 text-white tracking-widest">
                PRO
              </span>
            </div>
            <p className={`text-[11px] font-semibold mt-1 ${isDark ? 'text-purple-400/80' : 'text-indigo-600'}`}>
              এডমিন কন্ট্রোল প্যানেল
            </p>
          </div>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
            isDark 
              ? 'bg-purple-950/40 border-purple-800/40 text-amber-300 hover:bg-purple-900/50 hover:text-amber-200' 
              : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
          }`}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      {/* Admin Tonkeeper Wallet Connect */}
      <div className={`p-4 border-b ${isDark ? 'border-purple-900/20' : 'border-slate-100'}`}>
        <div className="flex justify-center">
          <TonConnectButton />
        </div>
      </div>

      {/* Quick Action: Create Mock Trx */}
      <div className="p-4 pb-2">
        <button
          onClick={onOpenCreateTrx}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-2xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/25 transition-all active:scale-[0.98] border border-purple-400/30 cursor-pointer"
        >
          <PlusCircle size={17} />
          <span>নতুন TrxID টেস্ট করুন</span>
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto custom-scrollbar">
        {navItems.map(item => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl font-bold transition-all text-xs ${
                isActive
                  ? isDark
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-lg shadow-purple-950/30 font-black'
                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm font-black'
                  : isDark
                    ? 'text-slate-400 hover:bg-purple-950/20 hover:text-slate-200'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? (isDark ? 'text-purple-400' : 'text-indigo-600') : 'text-slate-400'}>
                  {item.icon}
                </span>
                <div>
                  <div className="leading-tight">{item.name}</div>
                  <div className={`text-[10px] font-normal leading-none mt-0.5 ${isActive ? (isDark ? 'text-purple-300/70' : 'text-indigo-500/80') : 'text-slate-500'}`}>
                    {item.sub}
                  </div>
                </div>
              </div>

              {item.badge && (
                <span className={`px-2 py-0.5 text-[10px] font-black rounded-full shadow-sm animate-pulse ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className={`p-4 border-t text-[11px] font-medium flex items-center justify-between ${
        isDark ? 'border-purple-900/20 text-slate-400' : 'border-slate-100 text-slate-500'
      }`}>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
          <span className="font-bold text-emerald-500">লাইভ ক্লাউড বট</span>
        </div>
        <span className="font-mono text-[10px] opacity-75">v15.2</span>
      </div>
    </aside>
  );
}

// Layout Wrapper
function Layout({ children, onOpenCreateTrx }) {
  const { theme, toggleTheme } = useTheme();
  const { data, refresh, refreshing } = useBotData();
  const { orders } = useOrdersData();
  const isDark = theme === 'dark';

  const pendingBuysCount = orders.buys.filter(b => b.status === 'pending' || b.status === 'verified').length;
  const pendingWithdrawCount = orders.withdrawals.length;

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      isDark ? 'bg-[#090714] text-slate-100' : 'bg-slate-50 text-slate-800'
    }`}>
      {/* Sidebar */}
      <Sidebar 
        onOpenCreateTrx={onOpenCreateTrx} 
        pendingBuysCount={pendingBuysCount}
        pendingWithdrawCount={pendingWithdrawCount}
      />

      {/* Main Content Area */}
      <div className="ml-72 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <header className={`sticky top-0 z-30 px-8 py-4 backdrop-blur-xl border-b transition-colors ${
          isDark 
            ? 'bg-[#0e0c1f]/80 border-purple-900/20' 
            : 'bg-white/80 border-slate-200/80 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  ট্রাস্ট পে এডমিন ড্যাশবোর্ড
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Quick TON Balance Pill */}
              <div className={`hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold ${
                isDark 
                  ? 'bg-purple-950/40 border-purple-800/40 text-purple-300' 
                  : 'bg-indigo-50 border-indigo-200 text-indigo-700'
              }`}>
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                <span>TON Gas:</span>
                <span className="font-mono font-black text-cyan-400">
                  {data.tonNativeBalance || data.tonBalance || '0.00'} TON
                </span>
              </div>

              {/* Refresh Button */}
              <button
                onClick={refresh}
                disabled={refreshing}
                title="রিফ্রেশ করুন"
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  isDark
                    ? 'bg-purple-950/40 border-purple-800/40 text-slate-300 hover:text-white hover:bg-purple-900/40'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-sm'
                }`}
              >
                <RefreshCw size={14} className={refreshing ? 'animate-spin text-purple-400' : ''} />
                <span className="hidden md:inline">{refreshing ? 'লোড হচ্ছে...' : 'রিফ্রেশ'}</span>
              </button>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  isDark
                    ? 'bg-purple-950/40 border-purple-800/40 text-amber-300 hover:bg-purple-900/40'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-sm'
                }`}
              >
                {isDark ? <Sun size={17} /> : <Moon size={17} />}
              </button>

              {/* Quick Trx button */}
              <button
                onClick={onOpenCreateTrx}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/20 hover:from-purple-500 hover:to-indigo-500 transition-all active:scale-95 cursor-pointer"
              >
                <PlusCircle size={15} />
                <span>TrxID</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

// ==========================================
// 1. DASHBOARD OVERVIEW PAGE
// ==========================================
function Dashboard() {
  const { data } = useBotData();
  const { orders } = useOrdersData();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const totalUsers = data.users.length;
  const verifiedUsers = data.users.filter(u => u.status === 'verified').length;
  const pendingBuys = orders.buys.filter(b => b.status === 'pending' || b.status === 'verified').length;
  const pendingWithdrawals = orders.withdrawals.length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Welcome Banner */}
      <div className={`p-8 rounded-3xl border relative overflow-hidden ${
        isDark 
          ? 'bg-gradient-to-br from-[#181238] via-[#120e2b] to-[#0c0a1a] border-purple-800/30 shadow-2xl shadow-purple-950/40' 
          : 'bg-gradient-to-br from-indigo-50 via-purple-50 to-white border-indigo-100 shadow-xl'
      }`}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Sparkles size={14} /> Trust Pay Control Center
            </div>
            <h2 className={`text-3xl md:text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              স্বাগতম, এডমিন মারুফ! 👋
            </h2>
            <p className={`text-sm max-w-xl font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              বটের সকল ক্রিপ্টো বাই-সেল, টনের মূল রিজার্ভ ব্যালেন্স, বিকাশ/নগদ ক্যাশআউট রিকোয়েস্ট এবং ইউজার ম্যানেজমেন্ট এক ক্লিকে নিয়ন্ত্রণ করুন।
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/bot-wallet"
              className="px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/25 flex items-center gap-2 transition-all active:scale-95"
            >
              <Wallet size={16} /> টনের ব্যালেন্স দেখুন
            </Link>
            <Link
              to="/buys"
              className={`px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider border transition-all active:scale-95 flex items-center gap-2 ${
                isDark 
                  ? 'bg-purple-950/30 border-purple-800/40 text-purple-300 hover:bg-purple-900/40' 
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-sm'
              }`}
            >
              <ShoppingCart size={16} /> পেন্ডিং বাই ({pendingBuys})
            </Link>
          </div>
        </div>
      </div>

      {/* Top 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: TON Native Gas Balance */}
        <div className={`p-6 rounded-3xl border transition-all relative overflow-hidden group hover:scale-[1.01] ${
          isDark 
            ? 'bg-[#120e26] border-purple-900/30 shadow-xl' 
            : 'bg-white border-slate-200 shadow-md'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <span className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-purple-300/80' : 'text-indigo-600'}`}>
              টনের মেইন ব্যালেন্স
            </span>
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
              <Wallet size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {data.tonNativeBalance || data.tonBalance || '0.00'}
            </span>
            <span className="text-sm font-black text-cyan-400">TON</span>
          </div>
          <p className="text-[11px] font-bold text-emerald-400 mt-2 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> বট ট্রেজারি গ্যাস লাইভ
          </p>
        </div>

        {/* Metric 2: Pending Buy Orders */}
        <div className={`p-6 rounded-3xl border transition-all relative overflow-hidden group hover:scale-[1.01] ${
          isDark 
            ? 'bg-[#120e26] border-purple-900/30 shadow-xl' 
            : 'bg-white border-slate-200 shadow-md'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <span className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-purple-300/80' : 'text-indigo-600'}`}>
              পেন্ডিং বাই অর্ডার
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <ShoppingCart size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {pendingBuys}
            </span>
            <span className="text-xs font-bold text-slate-400">অর্ডার</span>
          </div>
          <p className="text-[11px] font-bold text-purple-400 mt-2 flex items-center gap-1">
            <Clock size={12} /> ম্যানুয়াল অন-চেইন অনুমোদন দরকার
          </p>
        </div>

        {/* Metric 3: Pending Fiat Cashouts */}
        <div className={`p-6 rounded-3xl border transition-all relative overflow-hidden group hover:scale-[1.01] ${
          isDark 
            ? 'bg-[#120e26] border-purple-900/30 shadow-xl' 
            : 'bg-white border-slate-200 shadow-md'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <span className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-purple-300/80' : 'text-indigo-600'}`}>
              ক্যাশআউট রিকোয়েস্ট
            </span>
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-400">
              <CreditCard size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {pendingWithdrawals}
            </span>
            <span className="text-xs font-bold text-slate-400">রিকোয়েস্ট</span>
          </div>
          <p className="text-[11px] font-bold text-rose-400 mt-2 flex items-center gap-1">
            <AlertTriangle size={12} /> বিকাশ ও নগদে পে করুন
          </p>
        </div>

        {/* Metric 4: Total Users */}
        <div className={`p-6 rounded-3xl border transition-all relative overflow-hidden group hover:scale-[1.01] ${
          isDark 
            ? 'bg-[#120e26] border-purple-900/30 shadow-xl' 
            : 'bg-white border-slate-200 shadow-md'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <span className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-purple-300/80' : 'text-indigo-600'}`}>
              মোট গ্রাহক (Users)
            </span>
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Users size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {totalUsers}
            </span>
            <span className="text-xs font-bold text-slate-400">জন</span>
          </div>
          <p className="text-[11px] font-bold text-emerald-400 mt-2 flex items-center gap-1">
            <CheckCircle2 size={12} /> {verifiedUsers} জন সক্রিয় ও ভেরিফাইড
          </p>
        </div>
      </div>

      {/* Quick Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Pending Buys preview */}
        <div className={`p-6 rounded-3xl border ${
          isDark ? 'bg-[#120e26] border-purple-900/30' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <ShoppingCart size={16} />
              </div>
              <h3 className={`font-black text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                সাম্প্রতিক বাই অর্ডার (Recent Buys)
              </h3>
            </div>
            <Link to="/buys" className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1">
              সবগুলো দেখুন <ChevronRight size={14} />
            </Link>
          </div>

          <div className="space-y-3">
            {orders.buys.slice(0, 4).map(b => (
              <div key={b.id || b.trxId} className={`p-4 rounded-2xl border flex items-center justify-between ${
                isDark ? 'bg-purple-950/20 border-purple-900/30' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-purple-400">{b.trxId || 'N/A'}</span>
                    <span className="text-xs font-semibold text-slate-400">({b.userId})</span>
                  </div>
                  <div className="text-xs font-bold mt-1">
                    {b.amount} {b.asset || 'TON'} · ৳{b.totalBdt} BDT ({b.paymentMethod || 'bKash'})
                  </div>
                </div>
                <div>
                  <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase ${
                    b.status === 'completed' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' :
                    b.status === 'verified' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                    b.status === 'rejected' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' :
                    'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  }`}>
                    {b.status || 'PENDING'}
                  </span>
                </div>
              </div>
            ))}
            {orders.buys.length === 0 && (
              <p className="text-xs text-center py-6 text-slate-500 font-bold">কোনো বাই অর্ডার পাওয়া যায়নি।</p>
            )}
          </div>
        </div>

        {/* Recent Pending Cashouts preview */}
        <div className={`p-6 rounded-3xl border ${
          isDark ? 'bg-[#120e26] border-purple-900/30' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                <CreditCard size={16} />
              </div>
              <h3 className={`font-black text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                ক্যাশআউট রিকোয়েস্ট (Recent Cashouts)
              </h3>
            </div>
            <Link to="/withdraw" className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1">
              সবগুলো দেখুন <ChevronRight size={14} />
            </Link>
          </div>

          <div className="space-y-3">
            {orders.withdrawals.slice(0, 4).map(w => {
              const info = w?.fiatWithdrawPending || w || {};
              return (
                <div key={w.userId || Math.random()} className={`p-4 rounded-2xl border flex items-center justify-between ${
                  isDark ? 'bg-rose-950/10 border-rose-900/20' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs uppercase text-rose-400">{info.method || w.method || 'bKash'}</span>
                      <span className="font-mono text-xs font-bold">{info.number || w.number}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      ইউজার আইডি: {w.userId}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-emerald-400">
                      ৳{info.amount || w.amount || 0} BDT
                    </div>
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      অপেক্ষমান
                    </span>
                  </div>
                </div>
              );
            })}
            {orders.withdrawals.length === 0 && (
              <p className="text-xs text-center py-6 text-slate-500 font-bold">কোনো পেন্ডিং ক্যাশআউট রিকোয়েস্ট নেই।</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. TREASURY & BOT WALLET PAGE (USER'S KEY REQUEST)
// ==========================================
function BotWallet() {
  const { data, refresh } = useBotData();
  const userTonAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [depositModal, setDepositModal] = useState({ isOpen: false, network: 'TON' });
  const [withdrawModal, setWithdrawModal] = useState({ isOpen: false, network: 'TON', asset: 'TON' });
  const [amount, setAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setToast({ show: true, type: 'success', message: 'অ্যাড্রেস কপি করা হয়েছে! (Address Copied)' });
  };

  const handleDepositClick = (network) => {
    if (!userTonAddress) {
      setToast({ show: true, type: 'error', message: 'দয়া করে সাইডবার থেকে আপনার টোনকিপার ওয়ালেট কানেক্ট করুন!' });
      return;
    }
    setAmount('');
    setDepositModal({ isOpen: true, network });
  };

  const executeDepositTON = async () => {
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      alert("সঠিক পরিমাণ লিখুন (Enter a valid amount)");
      return;
    }
    const amt = amount;
    setDepositModal({ isOpen: false, network: 'TON' });
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
      setToast({ show: true, type: 'success', message: 'ডিপোজিট সফলভাবে পাঠানো হয়েছে! ব্যালেন্স দ্রুত আপডেট হবে।' });
      setTimeout(refresh, 3000);
    } catch (err) {
      console.error(err);
      setToast({ show: true, type: 'error', message: 'ডিপোজিট লেনদেন সম্পন্ন হয়নি বা বাতিল হয়েছে।' });
    }
  };

  const handleWithdrawClick = (network, asset = 'TON') => {
    if (!userTonAddress) {
      setToast({ show: true, type: 'error', message: 'উইথড্র করার জন্য আপনার টোনকিপার ওয়ালেট কানেক্ট থাকতে হবে।' });
      return;
    }
    setAmount('');
    setWithdrawModal({ isOpen: true, network, asset });
  };

  const executeWithdraw = async () => {
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      alert("সঠিক পরিমাণ লিখুন");
      return;
    }
    setWithdrawing(true);
    try {
      const res = await fetch(`${API_BASE}/api/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          network: withdrawModal.network,
          asset: withdrawModal.asset,
          amount: parseFloat(amount),
          destination: userTonAddress
        })
      });
      const json = await res.json();
      if (json.success) {
        setWithdrawModal({ isOpen: false, network: 'TON', asset: 'TON' });
        setToast({ show: true, type: 'success', message: json.message || 'উইথড্র সফল হয়েছে!' });
        setTimeout(refresh, 2500);
      } else {
        setToast({ show: true, type: 'error', message: json.error || 'উইথড্র ফেইলড হয়েছে।' });
      }
    } catch (err) {
      setToast({ show: true, type: 'error', message: 'নেটওয়ার্ক এরর! অনুগ্রহ করে আবার চেষ্টা করুন।' });
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <Toast {...toast} onClose={() => setToast({ ...toast, show: false })} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-widest mb-1">
            <Wallet size={14} /> বট ট্রেজারি ভল্ট ও অন-চেইন ব্যালেন্স
          </div>
          <h2 className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
            ট্রেজারি ও ক্রিপ্টো ওয়ালেট
          </h2>
          <p className={`text-xs mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            বটের মূল TON গ্যাস ব্যালেন্স, GRAM টোকেন এবং USDT লিকুইডিটি নিয়ন্ত্রণ
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={`https://tonviewer.com/${data.tonAddress}`}
            target="_blank"
            rel="noreferrer"
            className={`px-4 py-2.5 rounded-2xl border text-xs font-bold flex items-center gap-2 transition-all ${
              isDark 
                ? 'bg-purple-950/30 border-purple-800/40 text-purple-300 hover:bg-purple-900/40' 
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-sm'
            }`}
          >
            <ExternalLink size={14} />
            <span>টোনভিউয়ার এক্সপ্লোরার</span>
          </a>
        </div>
      </div>

      {/* ======================================================== */}
      {/* HERO CARD: THE NATIVE TON BALANCE (BIG 5XL FONT AS REQUESTED) */}
      {/* ======================================================== */}
      <div className={`p-8 rounded-[2.5rem] border relative overflow-hidden transition-all duration-300 ${
        isDark 
          ? 'bg-gradient-to-br from-[#120f2e] via-[#0e0c24] to-[#070514] border-cyan-500/30 shadow-[0_20px_60px_rgba(6,182,212,0.15)]' 
          : 'bg-gradient-to-br from-cyan-50 via-blue-50 to-white border-cyan-200 shadow-xl'
      }`}>
        {/* Glow & 3D TON Coin Accent */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-cyan-500/15 blur-[90px] rounded-full pointer-events-none"></div>
        <img 
          src="https://cryptologos.cc/logos/toncoin-ton-logo.png" 
          alt="TON Coin" 
          className="absolute -right-8 top-6 w-48 opacity-40 md:opacity-80 pointer-events-none drop-shadow-[0_0_35px_rgba(6,182,212,0.6)] transform hover:scale-105 transition-transform duration-500"
        />

        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2.5 mb-4">
            <span className="px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              মেইন গ্যাস ভল্ট (Native TON Vault)
            </span>
            <span className="text-xs font-bold text-slate-400">
              · অন-চেইন ট্রান্সফারের জন্য ব্যবহৃত
            </span>
          </div>

          <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            টনের মূল ব্যালেন্স (Native TON Balance)
          </p>

          {/* THE BIG PROMINENT 5XL TON BALANCE */}
          <div className="flex items-baseline gap-3 mb-4">
            <span className={`text-5xl md:text-6xl font-black tracking-tight drop-shadow-md font-mono ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              {data.tonNativeBalance || data.tonBalance || '0.00'}
            </span>
            <span className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
              TON
            </span>
          </div>

          {/* Estimated Value */}
          <div className="flex items-center gap-3 mb-6">
            <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${
              isDark ? 'bg-cyan-950/40 border-cyan-800/40 text-cyan-300' : 'bg-white border-cyan-200 text-cyan-800'
            }`}>
              ≈ ৳{(parseFloat(data.tonNativeBalance || data.tonBalance || 0) * 650).toFixed(2)} BDT আনুমানিক মূল্য
            </div>
            <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 size={13} /> পর্যাপ্ত গ্যাস সক্রিয়
            </div>
          </div>

          {/* Bot Address Display */}
          <div className="mb-8">
            <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              বটের অফিশিয়াল TON অ্যাড্রেস (Bot Address)
            </label>
            <div className="flex items-center gap-2 max-w-lg">
              <div className={`px-4 py-3 rounded-2xl font-mono text-xs font-bold truncate flex-1 border select-all ${
                isDark ? 'bg-[#080614] border-cyan-900/40 text-cyan-300' : 'bg-white border-cyan-200 text-cyan-900 shadow-inner'
              }`}>
                {data.tonAddress}
              </div>
              <button
                onClick={() => copyToClipboard(data.tonAddress)}
                title="অ্যাড্রেস কপি করুন"
                className="p-3 bg-cyan-500 hover:bg-cyan-400 text-white rounded-2xl shadow-lg shadow-cyan-500/30 transition-all active:scale-95 cursor-pointer"
              >
                <Copy size={16} />
              </button>
            </div>
          </div>

          {/* Action Buttons: Deposit & Withdraw */}
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => handleDepositClick('TON')}
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-lg shadow-emerald-500/25 transition-all active:scale-95 cursor-pointer"
            >
              <ArrowDownToLine size={17} />
              <span>📥 TON ডিপোজিট করুন</span>
            </button>

            <button
              onClick={() => handleWithdrawClick('TON', 'TON')}
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 transition-all active:scale-95 cursor-pointer"
            >
              <Send size={17} />
              <span>📤 TON উইথড্র করুন</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2 OTHER ASSET CARDS: GRAM & USDT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CARD 2: GRAM JETTONS */}
        <div className={`p-7 rounded-[2rem] border relative overflow-hidden transition-all duration-300 group ${
          isDark 
            ? 'bg-[#0a1818] border-teal-800/40 shadow-xl' 
            : 'bg-white border-teal-200 shadow-md'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
                <Wallet size={18} />
              </div>
              <div>
                <h4 className={`font-black text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  GRAM টোকেন রিজার্ভ
                </h4>
                <p className="text-[10px] text-teal-400 font-bold">Jetton Token on TON</p>
              </div>
            </div>
            <span className="text-xs font-black text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-xl">
              1 GRAM = 220 ৳
            </span>
          </div>

          <div className="flex items-baseline gap-2 mb-4">
            <span className={`text-4xl font-black font-mono tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {data.gramBalance || '0.00'}
            </span>
            <span className="text-xl font-black text-teal-400">GRAM</span>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => handleDepositClick('TON')}
              className="flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider bg-teal-600 hover:bg-teal-500 text-white transition-all active:scale-95 text-center cursor-pointer"
            >
              ডিপোজিট
            </button>
            <button
              onClick={() => handleWithdrawClick('TON', 'GRAM')}
              className="flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-800/40 transition-all active:scale-95 text-center cursor-pointer"
            >
              উইথড্র
            </button>
          </div>
        </div>

        {/* CARD 3: USDT RESERVES */}
        <div className={`p-7 rounded-[2rem] border relative overflow-hidden transition-all duration-300 group ${
          isDark 
            ? 'bg-[#150e26] border-purple-800/40 shadow-xl' 
            : 'bg-white border-purple-200 shadow-md'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <Wallet size={18} />
              </div>
              <div>
                <h4 className={`font-black text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  USDT লিকুইডিটি রিজার্ভ
                </h4>
                <p className="text-[10px] text-purple-400 font-bold">Tether USD on TON</p>
              </div>
            </div>
            <span className="text-xs font-black text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-xl">
              1 USDT = 130 ৳
            </span>
          </div>

          <div className="flex items-baseline gap-2 mb-4">
            <span className={`text-4xl font-black font-mono tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {data.tonUsdtBalance || '0.00'}
            </span>
            <span className="text-xl font-black text-purple-400">USDT</span>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => handleWithdrawClick('TON', 'USDT')}
              className="w-full py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white transition-all active:scale-95 text-center cursor-pointer"
            >
              USDT উইথড্র করুন
            </button>
          </div>
        </div>
      </div>

      {/* CONNECTED ADMIN TONKEEPER WALLET CARD */}
      <div className={`p-6 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isDark ? 'bg-[#120e26] border-purple-900/30' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
            <Shield size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className={`font-black text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                কানেক্টেড এডমিন ওয়ালেট (Admin Tonkeeper)
              </h4>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                userTonAddress ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
              }`}>
                {userTonAddress ? 'কানেক্টেড' : 'ডিসকানেক্টেড'}
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              {userTonAddress || 'সাইডবার থেকে Tonkeeper কানেক্ট করুন'}
            </p>
          </div>
        </div>

        <div>
          <TonConnectButton />
        </div>
      </div>

      {/* DEPOSIT TON MODAL */}
      {depositModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className={`p-6 rounded-3xl border max-w-md w-full shadow-2xl relative ${
            isDark ? 'bg-slate-900 border-emerald-500/30 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <ArrowDownToLine size={20} />
                </div>
                <div>
                  <h3 className="font-black text-base">বট ভল্টে TON ডিপোজিট</h3>
                  <p className="text-xs text-slate-400">টোনকিপার দিয়ে সরাসরি বট অ্যাড্রেসে পাঠান</p>
                </div>
              </div>
              <button onClick={() => setDepositModal({ isOpen: false, network: 'TON' })} className="p-1 text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">ডিপোজিট পরিমাণ (TON)</label>
                <input
                  type="number"
                  step="any"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="e.g. 1.0"
                  className={`w-full p-3.5 rounded-xl text-lg font-mono font-bold border outline-none ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500'
                  }`}
                />
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-medium">
                রিসিভার বট অ্যাড্রেস: <code className="break-all font-mono text-[11px] block mt-1">{data.tonAddress}</code>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setDepositModal({ isOpen: false, network: 'TON' })}
                  className="flex-1 py-3 rounded-xl font-bold text-xs bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  বাতিল
                </button>
                <button
                  onClick={executeDepositTON}
                  className="flex-1 py-3 rounded-xl font-black text-xs bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/30"
                >
                  ওয়ালেট থেকে কনফার্ম করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WITHDRAW MODAL */}
      {withdrawModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className={`p-6 rounded-3xl border max-w-md w-full shadow-2xl relative ${
            isDark ? 'bg-slate-900 border-cyan-500/30 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Send size={20} />
                </div>
                <div>
                  <h3 className="font-black text-base">{withdrawModal.asset} উইথড্র করুন</h3>
                  <p className="text-xs text-slate-400">বট ভল্ট থেকে এডমিন পার্সোনাল ওয়ালেটে পাঠান</p>
                </div>
              </div>
              <button onClick={() => setWithdrawModal({ isOpen: false, network: 'TON', asset: 'TON' })} className="p-1 text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">উইথড্র পরিমাণ ({withdrawModal.asset})</label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                    className={`w-full p-3.5 pr-16 rounded-xl text-lg font-mono font-bold border outline-none ${
                      isDark ? 'bg-slate-950 border-slate-700 text-white focus:border-cyan-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-500'
                    }`}
                  />
                  <button
                    onClick={() => {
                      if (withdrawModal.asset === 'TON') setAmount(data.tonNativeBalance || data.tonBalance || '0');
                      else if (withdrawModal.asset === 'USDT') setAmount(data.tonUsdtBalance || '0');
                      else if (withdrawModal.asset === 'GRAM') setAmount(data.gramBalance || '0');
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 rounded-md text-[10px] font-black bg-cyan-500/20 text-cyan-400"
                  >
                    MAX
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">গন্তব্য ওয়ালেট অ্যাড্রেস</label>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300 break-all">
                  {userTonAddress}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setWithdrawModal({ isOpen: false, network: 'TON', asset: 'TON' })}
                  className="flex-1 py-3 rounded-xl font-bold text-xs bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  বাতিল
                </button>
                <button
                  onClick={executeWithdraw}
                  disabled={withdrawing}
                  className="flex-1 py-3 rounded-xl font-black text-xs bg-cyan-500 hover:bg-cyan-400 text-white shadow-lg shadow-cyan-500/30 disabled:opacity-50"
                >
                  {withdrawing ? 'প্রসেসিং...' : 'উইথড্র নিশ্চিত করুন'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 3. BUY ORDERS MANAGEMENT
// ==========================================
function BuyOrders() {
  const { orders, refresh, refreshing } = useOrdersData();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const filteredBuys = useMemo(() => {
    return orders.buys.filter(b => {
      const matchFilter = 
        filter === 'all' ? true :
        filter === 'pending' ? (b.status === 'pending' || b.status === 'verified') :
        b.status === filter;
      const matchSearch = 
        !search ? true :
        (b.trxId || '').toLowerCase().includes(search.toLowerCase()) ||
        (b.userId || '').toString().includes(search);
      return matchFilter && matchSearch;
    });
  }, [orders.buys, filter, search]);

  const handleApprove = async (id) => {
    if (!window.confirm("আপনি কি এই বাই অর্ডারটি অনুমোদন করতে চান? ইউজারের ওয়ালেটে স্বয়ংক্রিয়ভাবে অন-চেইন TON চলে যাবে।")) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/approve-buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        setToast({ show: true, type: 'success', message: 'অর্ডার অনুমোদিত এবং অন-চেইনে পাঠানো হয়েছে!' });
        refresh();
      } else {
        setToast({ show: true, type: 'error', message: data.error || 'অনুমোদন ব্যর্থ হয়েছে।' });
      }
    } catch (e) {
      setToast({ show: true, type: 'error', message: 'এরর: ' + e.message });
    }
  };

  const handleReject = async (id) => {
    const reason = prompt("বাতিল করার কারণ লিখুন (অপশনাল):", "Payment verification failed");
    if (reason === null) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/reject-buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, reason })
      });
      const data = await res.json();
      if (data.success) {
        setToast({ show: true, type: 'success', message: 'অর্ডার বাতিল এবং ইউজারের ব্যালেন্স রিফান্ড করা হয়েছে!' });
        refresh();
      } else {
        setToast({ show: true, type: 'error', message: data.error || 'বাতিল ব্যর্থ হয়েছে।' });
      }
    } catch (e) {
      setToast({ show: true, type: 'error', message: 'এরর: ' + e.message });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Toast {...toast} onClose={() => setToast({ ...toast, show: false })} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
            বাই অর্ডার ব্যবস্থাপনা (Buy Orders)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            গ্রাহকদের ক্রিপ্টো কেনা রিকোয়েস্ট যাচাই ও এক ক্লিকে অন-চেইনে অনুমোদন
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={refresh}
            className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isDark ? 'bg-purple-950/30 border-purple-800/40 text-purple-300' : 'bg-white border-slate-200 text-slate-700 shadow-sm'
            }`}
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            রিফ্রেশ
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: `সকল (${orders.buys.length})` },
            { key: 'pending', label: `অপেক্ষমান (${orders.buys.filter(b => b.status === 'pending' || b.status === 'verified').length})` },
            { key: 'completed', label: `সফল (${orders.buys.filter(b => b.status === 'completed').length})` },
            { key: 'rejected', label: `বাতিল (${orders.buys.filter(b => b.status === 'rejected').length})` },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                filter === tab.key
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : isDark
                    ? 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 shadow-sm'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[260px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="TrxID বা UserID খুঁজুন..."
            className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs font-medium border outline-none ${
              isDark ? 'bg-slate-900 border-slate-800 text-white focus:border-purple-500' : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-500 shadow-sm'
            }`}
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className={`rounded-3xl border overflow-hidden ${
        isDark ? 'bg-[#120e26] border-purple-900/30 shadow-xl' : 'bg-white border-slate-200 shadow-md'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className={`border-b ${isDark ? 'bg-purple-950/30 border-purple-900/40 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
              <tr>
                <th className="p-4 font-black uppercase">TrxID</th>
                <th className="p-4 font-black uppercase">গ্রাহক</th>
                <th className="p-4 font-black uppercase">পরিমাণ</th>
                <th className="p-4 font-black uppercase">পরিশোধ (BDT)</th>
                <th className="p-4 font-black uppercase">পেমেন্ট মেথড</th>
                <th className="p-4 font-black uppercase">রিসিভিং ওয়ালেট</th>
                <th className="p-4 font-black uppercase">স্ট্যাটাস</th>
                <th className="p-4 font-black uppercase text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/20">
              {filteredBuys.map(b => (
                <tr key={b.id || b.trxId} className={`transition-colors ${isDark ? 'hover:bg-purple-950/20' : 'hover:bg-slate-50'}`}>
                  <td className="p-4 font-mono font-bold text-purple-400 select-all">
                    {b.trxId || 'N/A'}
                  </td>
                  <td className="p-4">
                    <span className="font-bold">{b.userId}</span>
                  </td>
                  <td className="p-4 font-bold">
                    <span className="text-white bg-purple-500/10 px-2 py-1 rounded-lg border border-purple-500/20">
                      {b.amount} {b.asset || 'TON'}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-emerald-400">
                    ৳{b.totalBdt}
                  </td>
                  <td className="p-4 capitalize font-semibold">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${
                      (b.paymentMethod || '').toLowerCase() === 'nagad' ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30' : 'bg-pink-500/15 text-pink-400 border border-pink-500/30'
                    }`}>
                      {b.paymentMethod || 'bKash'}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-[11px] text-slate-400 max-w-[140px] truncate" title={b.receiveAddress}>
                    {b.receiveAddress || 'N/A'}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase ${
                      b.status === 'completed' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' :
                      b.status === 'verified' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                      b.status === 'rejected' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' :
                      'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    }`}>
                      {b.status === 'verified' ? 'অটো-ভেরিফাইড' :
                       b.status === 'pending' ? 'অপেক্ষমান' :
                       b.status === 'completed' ? 'অন-চেইন সেন্ট' :
                       b.status === 'rejected' ? 'বাতিল ও রিফান্ডেড' : b.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {(b.status === 'pending' || b.status === 'verified') ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleApprove(b.id)}
                          className="px-3 py-1.5 rounded-xl font-black text-[11px] bg-emerald-500 hover:bg-emerald-400 text-white shadow-md shadow-emerald-500/20 transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                        >
                          <Check size={13} /> অনুমোদন
                        </button>
                        <button
                          onClick={() => handleReject(b.id)}
                          className="px-3 py-1.5 rounded-xl font-black text-[11px] bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/30 transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                        >
                          <X size={13} /> বাতিল
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-500 font-bold">সম্পন্ন</span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredBuys.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500 font-bold">
                    কোনো বাই অর্ডার পাওয়া যায়নি।
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 4. SELL ORDERS MANAGEMENT
// ==========================================
function SellOrders() {
  const { orders, refresh, refreshing } = useOrdersData();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
            সেল অর্ডার (Sell Orders)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            গ্রাহকদের ক্রিপ্টো বিক্রি করে বিকাশ/নগদে টাকা নেওয়ার হিস্ট্রি
          </p>
        </div>
        <button
          onClick={refresh}
          className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            isDark ? 'bg-purple-950/30 border-purple-800/40 text-purple-300' : 'bg-white border-slate-200 text-slate-700 shadow-sm'
          }`}
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          রিফ্রেশ
        </button>
      </div>

      <div className={`rounded-3xl border overflow-hidden ${
        isDark ? 'bg-[#120e26] border-purple-900/30 shadow-xl' : 'bg-white border-slate-200 shadow-md'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className={`border-b ${isDark ? 'bg-purple-950/30 border-purple-900/40 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
              <tr>
                <th className="p-4 font-black uppercase">অর্ডার ID</th>
                <th className="p-4 font-black uppercase">গ্রাহক</th>
                <th className="p-4 font-black uppercase">বিক্রি করা ক্রিপ্টো</th>
                <th className="p-4 font-black uppercase">টাকা (BDT)</th>
                <th className="p-4 font-black uppercase">ইউজার ওয়ালেট</th>
                <th className="p-4 font-black uppercase text-right">সময়</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/20">
              {orders.sells.map(s => {
                const sTs = s?.timestamp;
                const formattedTime = (sTs && sTs._seconds)
                  ? new Date(sTs._seconds * 1000).toLocaleString()
                  : (sTs ? new Date(sTs).toLocaleString() : 'Just now');

                return (
                  <tr key={s.id || Math.random()} className={`transition-colors ${isDark ? 'hover:bg-purple-950/20' : 'hover:bg-slate-50'}`}>
                    <td className="p-4 font-mono font-bold text-cyan-400">{s.id || 'N/A'}</td>
                    <td className="p-4 font-bold">{s.userId || 'N/A'}</td>
                    <td className="p-4 font-bold text-white">
                      {s.amount || 0} {s.asset || 'TON'}
                    </td>
                    <td className="p-4 font-bold text-emerald-400">৳{s.estimatedTk || 0}</td>
                    <td className="p-4 font-mono text-slate-400 text-[11px] max-w-[140px] truncate" title={s.wallet}>
                      {s.wallet || 'N/A'}
                    </td>
                    <td className="p-4 text-right text-slate-500 font-mono text-[11px]">{formattedTime}</td>
                  </tr>
                );
              })}
              {orders.sells.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-bold">
                    কোনো সেল অর্ডার পাওয়া যায়নি।
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 5. FIAT CASHOUTS (WITHDRAWALS)
// ==========================================
function FiatWithdrawals() {
  const { orders, refresh, refreshing } = useOrdersData();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const handleApprove = async (userId) => {
    if (!window.confirm("আপনি কি এই ক্যাশআউট রিকোয়েস্টটি অনুমোদন করতে চান? ইউজার নোটিফিকেশন পাবে এবং পে-আউট চ্যানেলে রসিদ পোস্ট হবে।")) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/approve-withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await res.json();
      if (data.success) {
        setToast({ show: true, type: 'success', message: 'ক্যাশআউট সফল এবং @bd_trust_pay_payout চ্যানেলে রসিদ পাঠানো হয়েছে!' });
        refresh();
      } else {
        setToast({ show: true, type: 'error', message: data.error || 'অনুমোদন ব্যর্থ হয়েছে।' });
      }
    } catch (e) {
      setToast({ show: true, type: 'error', message: 'এরর: ' + e.message });
    }
  };

  const handleReject = async (userId, refundAmt) => {
    const reason = prompt("বাতিলের কারণ লিখুন (অপশনাল):", "নম্বর ভুল অথবা ক্যাশআউট ব্যর্থ");
    if (reason === null) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/reject-withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, refundAmt, reason })
      });
      const data = await res.json();
      if (data.success) {
        setToast({ show: true, type: 'success', message: 'ক্যাশআউট বাতিল এবং ইউজারের অ্যাকাউন্টে টাকা রিফান্ড করা হয়েছে!' });
        refresh();
      } else {
        setToast({ show: true, type: 'error', message: data.error || 'বাতিল ব্যর্থ হয়েছে।' });
      }
    } catch (e) {
      setToast({ show: true, type: 'error', message: 'এরর: ' + e.message });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Toast {...toast} onClose={() => setToast({ ...toast, show: false })} />

      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
            বিকাশ / নগদ ক্যাশআউট রিকোয়েস্ট
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            গ্রাহকদের টাকা উত্তোলনের আবেদন। পে করার পর অনুমোদন দিলে স্বয়ংক্রিয়ভাবে রসিদ চলে যাবে।
          </p>
        </div>
        <button
          onClick={refresh}
          className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            isDark ? 'bg-purple-950/30 border-purple-800/40 text-purple-300' : 'bg-white border-slate-200 text-slate-700 shadow-sm'
          }`}
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          রিফ্রেশ
        </button>
      </div>

      <div className={`rounded-3xl border overflow-hidden ${
        isDark ? 'bg-[#120e26] border-purple-900/30 shadow-xl' : 'bg-white border-slate-200 shadow-md'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className={`border-b ${isDark ? 'bg-purple-950/30 border-purple-900/40 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
              <tr>
                <th className="p-4 font-black uppercase">ইউজার আইডি</th>
                <th className="p-4 font-black uppercase">মেথড</th>
                <th className="p-4 font-black uppercase">মোবাইল নম্বর</th>
                <th className="p-4 font-black uppercase">পরিমাণ (BDT)</th>
                <th className="p-4 font-black uppercase">সময়</th>
                <th className="p-4 font-black uppercase text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/20">
              {orders.withdrawals.map(w => {
                const info = w?.fiatWithdrawPending || w || {};
                const amount = info.amount || w.amount || 0;
                const number = info.number || w.number || 'N/A';
                const method = (info.method || w.method || 'bKash').toLowerCase();

                return (
                  <tr key={w.userId || Math.random()} className={`transition-colors ${isDark ? 'hover:bg-purple-950/20' : 'hover:bg-slate-50'}`}>
                    <td className="p-4 font-bold text-purple-400">{w.userId}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${
                        method === 'nagad' ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30' : 'bg-pink-500/15 text-pink-400 border border-pink-500/30'
                      }`}>
                        {method}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-bold select-all">{number}</td>
                    <td className="p-4 font-black text-emerald-400 text-sm">৳{amount} TK</td>
                    <td className="p-4 text-slate-500 font-mono text-[11px]">Recent</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleApprove(w.userId)}
                          className="px-3.5 py-1.5 rounded-xl font-black text-[11px] bg-emerald-500 hover:bg-emerald-400 text-white shadow-md shadow-emerald-500/20 transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                        >
                          <Check size={13} /> পে সম্পন্ন
                        </button>
                        <button
                          onClick={() => handleReject(w.userId, amount)}
                          className="px-3.5 py-1.5 rounded-xl font-black text-[11px] bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/30 transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                        >
                          <X size={13} /> রিফান্ড
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {orders.withdrawals.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-bold">
                    কোনো অপেক্ষমান ক্যাশআউট রিকোয়েস্ট নেই।
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 6. USER MANAGEMENT & BONUS
// ==========================================
function UsersManagement() {
  const { data, refresh, refreshing } = useBotData();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [search, setSearch] = useState('');
  const [bonusUser, setBonusUser] = useState('');
  const [bonusAmt, setBonusAmt] = useState('');
  const [bonusLoading, setBonusLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const filteredUsers = useMemo(() => {
    return (data.users || []).filter(u => {
      const matchSearch = 
        !search ? true :
        (u.chatId || '').toString().includes(search) ||
        (u.username || '').toLowerCase().includes(search.toLowerCase());
      return matchSearch;
    });
  }, [data.users, search]);

  const handleSendBonus = async (e) => {
    e.preventDefault();
    if (!bonusUser || !bonusAmt) {
      alert("ইউজারনেম এবং টাকার পরিমাণ লিখুন");
      return;
    }
    setBonusLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/bonus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: bonusUser, amount: bonusAmt })
      });
      const d = await res.json();
      if (d.success) {
        setToast({ show: true, type: 'success', message: `বোনাস সফলভাবে পাঠানো হয়েছে! নতুন ব্যালেন্স: ৳${d.newBalance} BDT` });
        setBonusUser('');
        setBonusAmt('');
        refresh();
      } else {
        setToast({ show: true, type: 'error', message: d.error || 'বোনাস পাঠানো ব্যর্থ হয়েছে।' });
      }
    } catch (e) {
      setToast({ show: true, type: 'error', message: 'এরর: ' + e.message });
    } finally {
      setBonusLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <Toast {...toast} onClose={() => setToast({ ...toast, show: false })} />

      {/* Give User Bonus Card */}
      <div className={`p-6 rounded-3xl border ${
        isDark ? 'bg-gradient-to-r from-purple-950/40 to-indigo-950/40 border-purple-500/30 shadow-xl' : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 shadow-md'
      }`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className={`font-black text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
              ইউজারকে ডিরেক্ট বোনাস পাঠান (Send Direct Bonus)
            </h3>
            <p className="text-xs text-slate-400">
              যেকোনো ইউজারকে বিনামূল্যে টাকা (BDT) গিফট করুন — ইউজারের ব্যালেন্সে জমা হবে এবং টেলিগ্রামে মেসেজ যাবে।
            </p>
          </div>
        </div>

        <form onSubmit={handleSendBonus} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={bonusUser}
            onChange={e => setBonusUser(e.target.value)}
            placeholder="@username"
            className={`flex-1 p-3 rounded-xl text-xs font-bold border outline-none ${
              isDark ? 'bg-slate-950 border-purple-800/40 text-white focus:border-purple-500' : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500'
            }`}
            required
          />
          <input
            type="number"
            value={bonusAmt}
            onChange={e => setBonusAmt(e.target.value)}
            placeholder="পরিমাণ (BDT, e.g. 100)"
            className={`w-full sm:w-48 p-3 rounded-xl text-xs font-bold border outline-none ${
              isDark ? 'bg-slate-950 border-purple-800/40 text-white focus:border-purple-500' : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500'
            }`}
            required
          />
          <button
            type="submit"
            disabled={bonusLoading}
            className="px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {bonusLoading ? 'পাঠানো হচ্ছে...' : 'বোনাস সেন্ড করুন'}
          </button>
        </form>
      </div>

      {/* Users Database Table */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className={`font-black text-xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
              গ্রাহক তালিকা (Users List - {data.users.length})
            </h3>
            <p className="text-xs text-slate-400">টেলিগ্রাম বট স্টার্ট করা সকল ইউজারদের ডেটাবেস</p>
          </div>

          <div className="relative min-w-[260px]">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ইউজারনেম বা আইডি..."
              className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs font-medium border outline-none ${
                isDark ? 'bg-slate-900 border-slate-800 text-white focus:border-purple-500' : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-500 shadow-sm'
              }`}
            />
          </div>
        </div>

        <div className={`rounded-3xl border overflow-hidden ${
          isDark ? 'bg-[#120e26] border-purple-900/30 shadow-xl' : 'bg-white border-slate-200 shadow-md'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className={`border-b ${isDark ? 'bg-purple-950/30 border-purple-900/40 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                <tr>
                  <th className="p-4 font-black uppercase">Telegram ID</th>
                  <th className="p-4 font-black uppercase">ইউজারনেম</th>
                  <th className="p-4 font-black uppercase">ভাষা</th>
                  <th className="p-4 font-black uppercase">ব্যালেন্স</th>
                  <th className="p-4 font-black uppercase text-right">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/20">
                {filteredUsers.map(u => (
                  <tr key={u.chatId} className={`transition-colors ${isDark ? 'hover:bg-purple-950/20' : 'hover:bg-slate-50'}`}>
                    <td className="p-4 font-mono font-bold text-slate-300">{u.chatId}</td>
                    <td className="p-4 font-bold text-purple-400">
                      {u.username ? `@${u.username}` : 'No username'}
                    </td>
                    <td className="p-4 text-slate-400">
                      {u.language === 'bn' ? '🇧🇩 বাংলা' : '🇬🇧 English'}
                    </td>
                    <td className="p-4 font-bold text-emerald-400">
                      ৳{u.balance || 0} BDT
                    </td>
                    <td className="p-4 text-right">
                      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase ${
                        u.status === 'verified' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}>
                        {u.status || 'Active'}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500 font-bold">
                      কোনো গ্রাহক পাওয়া যায়নি।
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 7. BOT SETTINGS & RATES
// ==========================================
function BotSettings() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [settings, setSettings] = useState({
    adminBkash: '01752561935',
    adminNagad: '01878580320',
    gramAmount: '0.07',
    usdtAmount: '0.05',
    dailyWithdrawLimit: 50
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    fetch(`${API_BASE}/api/settings`)
      .then(r => r.json())
      .then(d => {
        setSettings(prev => ({ ...prev, ...d }));
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch(`${API_BASE}/api/admin/limits`)
      .then(r => r.json())
      .then(d => {
        if (d && d.limit) setSettings(prev => ({ ...prev, dailyWithdrawLimit: d.limit }));
      })
      .catch(() => {});
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await res.json();

      // also save limit
      if (settings.dailyWithdrawLimit) {
        await fetch(`${API_BASE}/api/admin/limits`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ limit: settings.dailyWithdrawLimit })
        });
      }

      if (data.success) {
        setToast({ show: true, type: 'success', message: 'সেটিংস সফলভাবে বটে সেভ ও ডেপ্লয় করা হয়েছে!' });
      } else {
        setToast({ show: true, type: 'error', message: data.error || 'সেভ ব্যর্থ হয়েছে।' });
      }
    } catch (err) {
      setToast({ show: true, type: 'error', message: 'এরর: ' + err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-8 animate-in fade-in duration-300">
      <Toast {...toast} onClose={() => setToast({ ...toast, show: false })} />

      <div>
        <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
          বট সেটিংস ও রেট কনফিগারেশন
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          বিকাশ/নগদ অ্যাডমিন নম্বর, পে-আউট চ্যানেল এবং লেনদেনের লিমিট নির্ধারণ
        </p>
      </div>

      {/* Current Rates Overview Card */}
      <div className={`p-6 rounded-3xl border ${
        isDark ? 'bg-[#120e26] border-purple-900/30 shadow-xl' : 'bg-white border-slate-200 shadow-md'
      }`}>
        <h3 className="text-xs font-black uppercase text-purple-400 tracking-wider mb-4">
          বর্তমান বাই-সেল রেট (Fixed Rates)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20">
            <span className="text-[11px] font-bold text-slate-400 uppercase">১ গ্রাম ক্রিপ্টো রেট</span>
            <div className="text-2xl font-black text-purple-400 mt-1">১ GRAM = ২২০ ৳</div>
            <p className="text-[10px] text-slate-400 mt-1">ফিক্সড করা আছে (বাই অপশনে)</p>
          </div>
          <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
            <span className="text-[11px] font-bold text-slate-400 uppercase">১ ডলার USDT রেট</span>
            <div className="text-2xl font-black text-cyan-400 mt-1">১ USDT = ১৩০ ৳</div>
            <p className="text-[10px] text-slate-400 mt-1">ফিক্সড করা আছে (বাই অপশনে)</p>
          </div>
        </div>
      </div>

      {/* Form Settings */}
      <form onSubmit={handleSave} className={`p-8 rounded-3xl border space-y-6 ${
        isDark ? 'bg-[#120e26] border-purple-900/30 shadow-xl' : 'bg-white border-slate-200 shadow-md'
      }`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-400">
              এডমিন বিকাশ পার্সোনাল নম্বর
            </label>
            <input
              type="text"
              value={settings.adminBkash}
              onChange={e => setSettings({ ...settings, adminBkash: e.target.value })}
              className={`w-full p-3.5 rounded-xl font-mono font-bold text-sm border outline-none ${
                isDark ? 'bg-slate-950 border-purple-900/40 text-white focus:border-purple-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500'
              }`}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-400">
              এডমিন নগদ পার্সোনাল নম্বর
            </label>
            <input
              type="text"
              value={settings.adminNagad}
              onChange={e => setSettings({ ...settings, adminNagad: e.target.value })}
              className={`w-full p-3.5 rounded-xl font-mono font-bold text-sm border outline-none ${
                isDark ? 'bg-slate-950 border-purple-900/40 text-white focus:border-purple-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500'
              }`}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-400">
              দৈনিক ক্যাশআউট লিমিট (Daily Limit)
            </label>
            <input
              type="number"
              value={settings.dailyWithdrawLimit}
              onChange={e => setSettings({ ...settings, dailyWithdrawLimit: e.target.value })}
              className={`w-full p-3.5 rounded-xl font-mono font-bold text-sm border outline-none ${
                isDark ? 'bg-slate-950 border-purple-900/40 text-white focus:border-purple-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500'
              }`}
              placeholder="e.g. 50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-400">
              পে-আউট চ্যানেল (Payout Channel)
            </label>
            <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 font-bold text-purple-400 text-xs flex items-center justify-between">
              <span>https://t.me/bd_trust_pay_payout</span>
              <a href="https://t.me/bd_trust_pay_payout" target="_blank" rel="noreferrer" className="underline">
                ভিজিট
              </a>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving || loading}
          className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-xl shadow-purple-600/30 transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
        >
          {saving ? 'বটে সেভ করা হচ্ছে...' : 'সেটিংস সেভ করুন (Deploy to Bot)'}
        </button>
      </form>
    </div>
  );
}

// ==========================================
// 8. SECURITY & FRAUD LOGS
// ==========================================
function FraudLogs() {
  const { data, refresh, refreshing } = useBotData();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const handleApprove = async (docId, chatId) => {
    if (!window.confirm("আপনি কি নিশ্চিতভাবে এই ইউজারের পেমেন্ট ম্যানুয়ালি অনুমোদন করতে চান?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/approve-fraud`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docId, chatId })
      });
      const json = await res.json();
      if (json.success) {
        setToast({ show: true, type: 'success', message: 'অনুমোদিত এবং ইউজারকে নোটিফাই করা হয়েছে!' });
        refresh();
      } else {
        setToast({ show: true, type: 'error', message: json.error || 'ব্যর্থ হয়েছে।' });
      }
    } catch (err) {
      setToast({ show: true, type: 'error', message: 'রিকোয়েস্ট ব্যর্থ হয়েছে।' });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Toast {...toast} onClose={() => setToast({ ...toast, show: false })} />

      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
            নিরাপত্তা ও স্ক্রিনশট ফ্রড লগ
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            এআই দ্বারা সনাক্তকৃত সন্দেহজনক বা রিজেক্টেড স্ক্রিনশট যাচাই করুন
          </p>
        </div>
        <button
          onClick={refresh}
          className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            isDark ? 'bg-purple-950/30 border-purple-800/40 text-purple-300' : 'bg-white border-slate-200 text-slate-700 shadow-sm'
          }`}
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          রিফ্রেশ
        </button>
      </div>

      <div className={`rounded-3xl border overflow-hidden ${
        isDark ? 'bg-[#120e26] border-purple-900/30 shadow-xl' : 'bg-white border-slate-200 shadow-md'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className={`border-b ${isDark ? 'bg-purple-950/30 border-purple-900/40 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
              <tr>
                <th className="p-4 font-black uppercase">গ্রাহক</th>
                <th className="p-4 font-black uppercase">রিজেকশন কারণ</th>
                <th className="p-4 font-black uppercase">সময়</th>
                <th className="p-4 font-black uppercase text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/20">
              {(data.failedScreenshots || []).map(f => (
                <tr key={f.id} className={`transition-colors ${isDark ? 'hover:bg-purple-950/20' : 'hover:bg-slate-50'}`}>
                  <td className="p-4">
                    <span className="font-bold text-purple-400">@{f.username || 'unknown'}</span>
                    <span className="text-[10px] text-slate-500 block font-mono">{f.chatId}</span>
                  </td>
                  <td className="p-4 font-bold text-rose-400">{f.reason}</td>
                  <td className="p-4 text-slate-500 font-mono text-[11px]">
                    {f.timestamp && f.timestamp._seconds ? new Date(f.timestamp._seconds * 1000).toLocaleString() : 'N/A'}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={f.imageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl font-bold text-[11px] bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30"
                      >
                        ছবি দেখুন
                      </a>
                      <button
                        onClick={() => handleApprove(f.id, f.chatId)}
                        className="px-3 py-1.5 rounded-xl font-black text-[11px] bg-emerald-500 hover:bg-emerald-400 text-white"
                      >
                        অনুমোদন
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {(!data.failedScreenshots || data.failedScreenshots.length === 0) && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-emerald-400 font-bold">
                    সবকিছু নিরাপদ! কোনো ফ্রড প্রচেষ্টা পাওয়া যায়নি।
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 9. MOCK TRXID TEST TOOL
// ==========================================
function MockTrxTool() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [mockId, setMockId] = useState('');
  const [mockAmount, setMockAmount] = useState('');
  const [mockMethod, setMockMethod] = useState('bKash');
  const [mockResult, setMockResult] = useState(null);
  const [mockLoading, setMockLoading] = useState(false);
  const [mockList, setMockList] = useState([]);

  const fetchMockList = () => {
    fetch(`${API_BASE}/api/admin/mock-trxs`)
      .then(r => r.json())
      .then(d => { if (d.success) setMockList(d.list || []); })
      .catch(console.error);
  };

  useEffect(() => {
    fetchMockList();
  }, []);

  const generateRandomTrx = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let res = '';
    for (let i = 0; i < 8; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setMockId(res);
  };

  const handleCreateMockTrx = async (e) => {
    if (e) e.preventDefault();
    if (!mockId || !mockAmount) {
      alert("৮ ডিজিটের TrxID এবং Amount পূরণ করুন");
      return;
    }
    setMockLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/create-mock-trx`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trxId: mockId.trim().toUpperCase(),
          amount: parseFloat(mockAmount),
          method: mockMethod
        })
      });
      const data = await res.json();
      if (data.success) {
        setMockResult(data);
        fetchMockList();
      } else {
        alert(data.error || 'Failed to create mock trx');
      }
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setMockLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
          মক ট্রানজেকশন সিমুলেটর (Mock SMS Tool)
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          বিকাশ বা নগদ দিয়ে আসল টাকা না পাঠিয়েই ট্রাস্ট পে অ্যাপে বাই অর্ডার টেস্ট করার শক্তিশালী টুল
        </p>
      </div>

      <div className={`p-8 rounded-3xl border ${
        isDark ? 'bg-[#120e26] border-purple-900/30 shadow-xl' : 'bg-white border-slate-200 shadow-md'
      }`}>
        <form onSubmit={handleCreateMockTrx} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-400">
                ৮ ডিজিটের TrxID
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={mockId}
                  onChange={e => setMockId(e.target.value.toUpperCase())}
                  placeholder="e.g. 9B7X2K4L"
                  className={`w-full p-3 rounded-xl font-mono font-bold text-sm uppercase tracking-widest border outline-none ${
                    isDark ? 'bg-slate-950 border-purple-900/40 text-white focus:border-purple-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={generateRandomTrx}
                  className="px-3 py-2 rounded-xl text-xs font-black bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30"
                >
                  🎲 র‍্যান্ডম
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-400">
                পরিমাণ (BDT)
              </label>
              <input
                type="number"
                value={mockAmount}
                onChange={e => setMockAmount(e.target.value)}
                placeholder="e.g. 500"
                className={`w-full p-3 rounded-xl font-mono font-bold text-sm border outline-none ${
                  isDark ? 'bg-slate-950 border-purple-900/40 text-white focus:border-purple-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500'
                }`}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-400">
                পেমেন্ট মেথড
              </label>
              <select
                value={mockMethod}
                onChange={e => setMockMethod(e.target.value)}
                className={`w-full p-3 rounded-xl font-bold text-sm border outline-none ${
                  isDark ? 'bg-slate-950 border-purple-900/40 text-white focus:border-purple-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500'
                }`}
              >
                <option value="bKash">bKash (TrxID)</option>
                <option value="nagad">Nagad (TxnID)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={mockLoading}
            className="w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30 transition-all active:scale-[0.99] cursor-pointer"
          >
            {mockLoading ? 'ডেটাবেসে সেভ হচ্ছে...' : '🚀 সেভ করুন ও SMS সিমুলেট করুন'}
          </button>
        </form>

        {mockResult && (
          <div className="mt-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-white space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 size={16} /> সফলভাবে তৈরি ও সংরক্ষিত হয়েছে!
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(mockResult.trxId);
                  alert("Copied TrxID: " + mockResult.trxId);
                }}
                className="bg-purple-600 px-3 py-1 rounded-lg font-bold text-[11px]"
              >
                TrxID কপি করুন
              </button>
            </div>
            <p className="font-mono bg-slate-950/80 p-3 rounded-xl text-slate-300 break-all">
              {mockResult.fakeSms}
            </p>
          </div>
        )}
      </div>

      {/* Recent Mock Trxs list */}
      <div className={`p-6 rounded-3xl border ${
        isDark ? 'bg-[#120e26] border-purple-900/30 shadow-xl' : 'bg-white border-slate-200 shadow-md'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-sm text-purple-400">
            সাম্প্রতিক তৈরি করা Mock TrxIDs
          </h3>
          <button onClick={fetchMockList} className="text-xs text-purple-400 underline font-bold">
            রিফ্রেশ
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className={`border-b ${isDark ? 'bg-purple-950/30 border-purple-900/40 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
              <tr>
                <th className="p-3 uppercase">TrxID</th>
                <th className="p-3 uppercase">পরিমাণ</th>
                <th className="p-3 uppercase">মেথড</th>
                <th className="p-3 uppercase text-right">কপি</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/20">
              {mockList.map(item => (
                <tr key={item?.id || Math.random()}>
                  <td className="p-3 font-mono font-bold text-purple-400">{item?.id}</td>
                  <td className="p-3 font-bold text-emerald-400">৳{item?.amount}</td>
                  <td className="p-3 uppercase text-slate-400">{item?.sender || 'bKash'}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(item?.id);
                        alert("Copied TrxID: " + item?.id);
                      }}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-purple-500/20 text-purple-300"
                    >
                      কপি
                    </button>
                  </td>
                </tr>
              ))}
              {mockList.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-slate-500">
                    কোনো Mock Trx তৈরি করা হয়নি।
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// CREATE TRX MODAL (GLOBAL MODAL)
// ==========================================
function CreateTrxModal({ isOpen, onClose }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

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
      alert('৮ ডিজিটের TrxID এবং টাকার পরিমাণ লিখুন!');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`p-6 rounded-3xl border max-w-lg w-full shadow-2xl relative ${
        isDark ? 'bg-slate-900 border-purple-500/30 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex items-center justify-between pb-4 border-b border-slate-700/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <PlusCircle size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black">নতুন Test TrxID তৈরি করুন</h3>
              <p className="text-xs text-slate-400">এসএমএস তৈরি হয়ে সরাসরি ডেটাবেসে সংরক্ষিত হবে</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSend} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">
              ৮ ডিজিটের TrxID
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={trxId}
                onChange={e => setTrxId(e.target.value.toUpperCase())}
                placeholder="e.g. 9B7X2K4L"
                className={`w-full p-3 rounded-xl font-mono font-bold text-base uppercase tracking-widest border outline-none ${
                  isDark ? 'bg-slate-950 border-slate-700 text-white focus:border-purple-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500'
                }`}
                required
              />
              <button
                type="button"
                onClick={handleGenerateRandom}
                className="px-3 py-2 rounded-xl text-xs font-black bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 whitespace-nowrap cursor-pointer"
              >
                🎲 র‍্যান্ডম
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">
              টাকার পরিমাণ (BDT)
            </label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="e.g. 500"
              className={`w-full p-3 rounded-xl font-mono font-bold text-base border outline-none ${
                isDark ? 'bg-slate-950 border-slate-700 text-white focus:border-purple-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500'
              }`}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">
              পেমেন্ট মাধ্যম
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMethod('bKash')}
                className={`py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  method === 'bKash' 
                    ? 'bg-pink-500/20 border-pink-500 text-pink-300' 
                    : isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                বিকাশ (bKash)
              </button>
              <button
                type="button"
                onClick={() => setMethod('nagad')}
                className={`py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  method === 'nagad' 
                    ? 'bg-orange-500/20 border-orange-500 text-orange-300' 
                    : isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                নগদ (Nagad)
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30 transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'ডেটাবেসে সেভ হচ্ছে...' : 'ডেটাবেসে সংরক্ষণ করুন'}
            </button>
          </div>
        </form>

        {result && (
          <div className="mt-5 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-white space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 size={15} /> তৈরি হয়েছে!
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(result.trxId);
                  alert("Copied: " + result.trxId);
                }}
                className="bg-purple-600 px-2.5 py-1 rounded-lg font-bold text-[10px]"
              >
                কপি
              </button>
            </div>
            <p className="font-mono bg-slate-950/80 p-2.5 rounded-xl text-slate-300 break-all text-[11px]">
              {result.fakeSms}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// MAIN APP COMPONENT
// ==========================================
export default function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('trustpay_admin_theme') || 'dark';
  });
  const [isCreateTrxOpen, setIsCreateTrxOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('trustpay_admin_theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <TonConnectUIProvider manifestUrl={`${API_BASE}/tonconnect-manifest.json`}>
        <Router>
          <Layout onOpenCreateTrx={() => setIsCreateTrxOpen(true)}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/admin" element={<Dashboard />} />
              <Route path="/bot-wallet" element={<BotWallet />} />
              <Route path="/buys" element={<BuyOrders />} />
              <Route path="/sells" element={<SellOrders />} />
              <Route path="/withdraw" element={<FiatWithdrawals />} />
              <Route path="/withdrawals" element={<FiatWithdrawals />} />
              <Route path="/users" element={<UsersManagement />} />
              <Route path="/bot-settings" element={<BotSettings />} />
              <Route path="/fraud" element={<FraudLogs />} />
              <Route path="/mock-tool" element={<MockTrxTool />} />
              <Route path="/transactions" element={<BuyOrders />} />
              <Route path="*" element={<Dashboard />} />
            </Routes>
          </Layout>
          <CreateTrxModal isOpen={isCreateTrxOpen} onClose={() => setIsCreateTrxOpen(false)} />
        </Router>
      </TonConnectUIProvider>
    </ThemeContext.Provider>
  );
}
