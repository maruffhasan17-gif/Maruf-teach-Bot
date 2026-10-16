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
  Shield,
  Gem,
  Coins,
  CircleDollarSign,
  DollarSign,
  ArrowRight,
  Crown,
  Ban,
  Unlock,
  Lock,
  ArrowUpDown,
  MinusCircle,
  BadgeCheck,
  Fuel,
  ShieldCheck,
  Activity,
  QrCode
} from 'lucide-react';
import { TonConnectUIProvider, TonConnectButton, useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import { 
  InfographicConcentricRings, 
  InfographicBarChart, 
  InfographicWaveChart, 
  InfographicRadarGauge, 
  InfographicPillSliders, 
  InfographicLineChart 
} from './components/DashboardCharts';

export const API_BASE = (function() {
  if (typeof window === 'undefined') return 'https://maruf-teach-bot.onrender.com';
  if (window.location.hostname.includes('onrender.com')) return window.location.origin;
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  return 'https://maruf-teach-bot.onrender.com';
})();

export const ADMIN_TOKEN_KEY = 'trustpay_admin_token';
export const ADMIN_EMAIL_KEY = 'trustpay_admin_email';

export function isMobileDevice() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || navigator.vendor || window.opera || '';
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS|FxiOS|Telegram/i;
  if (mobileRegex.test(ua)) return true;
  if (window.Telegram?.WebApp?.initData) return true;
  if (window.innerWidth < 900 && ('ontouchstart' in window || navigator.maxTouchPoints > 1)) return true;
  return false;
}

// Automatically attach Admin Bearer Token to all backend API requests
if (typeof window !== 'undefined' && !window.__trustpayFetchWrapped) {
  window.__trustpayFetchWrapped = true;
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    const urlStr = typeof input === 'string' ? input : (input?.url || '');
    const isApiCall = urlStr.startsWith(API_BASE) || urlStr.includes('/api/');
    if (isApiCall) {
      const token = localStorage.getItem(ADMIN_TOKEN_KEY);
      const headers = new Headers(init.headers || (typeof input !== 'string' ? input?.headers : undefined) || {});
      if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      init = { ...init, headers };
    }
    const response = await originalFetch(input, init);
    if (isApiCall && response.status === 401 && !urlStr.includes('/api/admin/login')) {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      window.dispatchEvent(new CustomEvent('trustpay-admin-unauth'));
    }
    return response;
  };
}

// Theme Context for Light / Dark Mode
const ThemeContext = createContext({
  theme: 'dark',
  toggleTheme: () => {}
});

export const useTheme = () => useContext(ThemeContext);

// Format BD Phone number with leading 0
export function formatBdPhone(num) {
  if (!num) return 'N/A';
  let str = String(num).trim();
  if (str.startsWith('+880')) str = '0' + str.slice(4);
  else if (str.startsWith('880')) str = '0' + str.slice(3);
  else if (str.startsWith('1') && str.length === 10) str = '0' + str;
  return str;
}

// Format readable timestamp
export function formatTimestamp(ts) {
  if (!ts) return 'Just now';
  try {
    if (ts._seconds) {
      return new Date(ts._seconds * 1000).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    const d = new Date(ts);
    if (!isNaN(d.getTime())) {
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  } catch (e) {}
  return 'Recent';
}

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
      let res;
      try {
        res = await fetch(`${API_BASE}/api/stats?_t=${Date.now()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      } catch (err) {
        if (API_BASE !== 'https://maruf-teach-bot.onrender.com') {
          res = await fetch(`https://maruf-teach-bot.onrender.com/api/stats?_t=${Date.now()}`);
        } else {
          throw err;
        }
      }
      const json = await res.json();
      if (json) {
        if (!json.gramBalance || json.gramBalance === '0.00' || parseFloat(json.gramBalance) === 0) {
          json.gramBalance = json.tonNativeBalance || json.tonBalance || '0.00';
        }
        setData(json);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      fetchData(false);
    }, 25000);
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
      let res;
      try {
        res = await fetch(`${API_BASE}/api/admin/orders?_t=${Date.now()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      } catch (err) {
        if (API_BASE !== 'https://maruf-teach-bot.onrender.com') {
          res = await fetch(`https://maruf-teach-bot.onrender.com/api/admin/orders?_t=${Date.now()}`);
        } else {
          throw err;
        }
      }
      const json = await res.json();
      if (json) {
        setOrders({
          buys: Array.isArray(json.buys) ? json.buys : [],
          sells: Array.isArray(json.sells) ? json.sells : [],
          withdrawals: Array.isArray(json.withdrawals) ? json.withdrawals : []
        });
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      fetchOrders(false);
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  return { orders, loading, refreshing, refresh: () => fetchOrders(true) };
}

// Toast notification component
function Toast({ show, type = 'success', message, onClose }) {
  if (!show) return null;
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border text-sm font-bold animate-in slide-in-from-bottom-5 duration-200 ${
      type === 'success' 
        ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200 backdrop-blur-md' 
        : 'bg-rose-950/90 border-rose-500/40 text-rose-200 backdrop-blur-md'
    }`}>
      {type === 'success' ? <CheckCircle2 size={18} className="text-emerald-400 shrink-0" /> : <XCircle size={18} className="text-rose-400 shrink-0" />}
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 text-slate-400 hover:text-white cursor-pointer">
        <X size={15} />
      </button>
    </div>
  );
}

// Sidebar Component (All English)
function Sidebar({ onOpenCreateTrx, pendingBuysCount, pendingWithdrawCount, onLogout }) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const navItems = [
    { 
      path: '/', 
      name: 'Dashboard', 
      sub: 'Overview & Treasury', 
      icon: <LayoutDashboard size={19} /> 
    },
    { 
      path: '/bot-wallet', 
      name: 'Bot Treasury', 
      sub: 'GRAM & USDT Reserves', 
      icon: <Wallet size={19} /> 
    },
    { 
      path: '/buys', 
      name: 'Buy Orders', 
      sub: 'Crypto Purchases', 
      icon: <ShoppingCart size={19} />,
      badge: pendingBuysCount > 0 ? pendingBuysCount : null,
      badgeColor: 'bg-emerald-500 text-white'
    },
    { 
      path: '/sells', 
      name: 'Sell Orders', 
      sub: 'Crypto Sales History', 
      icon: <Repeat size={19} /> 
    },
    { 
      path: '/withdraw', 
      name: 'Fiat Cashouts', 
      sub: 'bKash & Nagad Payouts', 
      icon: <CreditCard size={19} />,
      badge: pendingWithdrawCount > 0 ? pendingWithdrawCount : null,
      badgeColor: 'bg-rose-500 text-white'
    },
    { 
      path: '/users', 
      name: 'User Management', 
      sub: 'Accounts & Direct Bonus', 
      icon: <Users size={19} /> 
    },
    { 
      path: '/bot-settings', 
      name: 'Bot Settings', 
      sub: 'Rates & Accounts', 
      icon: <Settings size={19} /> 
    },
    { 
      path: '/fraud', 
      name: 'Security Logs', 
      sub: 'Fraud Detection & Audit', 
      icon: <ShieldAlert size={19} /> 
    },
    { 
      path: '/mock-tool', 
      name: 'Mock Trx Tool', 
      sub: 'SMS Verification Testing', 
      icon: <Zap size={19} /> 
    },
  ];

  return (
    <aside className={`w-72 h-screen fixed left-0 top-0 flex flex-col z-40 transition-colors duration-200 border-r ${
      isDark 
        ? 'bg-[#0b091a] border-purple-900/30 text-slate-200 shadow-2xl shadow-purple-950/20' 
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
              onError={(e) => { e.target.onerror = null; e.target.src = '/app/trustpaylogo.png'; }}
              className="w-11 h-11 rounded-2xl object-cover shadow-lg shadow-purple-600/30 border border-purple-500/30" 
            />
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#0b091a] animate-pulse"></span>
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
            <p className="text-[11px] text-slate-400 mt-0.5 font-bold">Admin Control Center</p>
          </div>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className={`p-2 rounded-xl transition-all cursor-pointer ${
            isDark 
              ? 'bg-purple-950/40 text-yellow-400 hover:bg-purple-900/40' 
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      </div>

      {/* TonConnect Admin Wallet Bar */}
      <div className={`p-4 border-b ${isDark ? 'border-purple-900/20 bg-purple-950/20' : 'border-slate-100 bg-slate-50'}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Wallet size={12} className="text-purple-400" /> Tonkeeper Admin
          </span>
          <span className="text-[10px] font-bold text-purple-400">TON Connect</span>
        </div>
        <div className="ton-connect-custom-wrapper">
          <TonConnectButton className="w-full" />
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-all font-medium text-xs group ${
                isActive
                  ? isDark
                    ? 'bg-gradient-to-r from-purple-600/30 to-indigo-600/20 text-white font-bold border border-purple-500/40 shadow-lg shadow-purple-900/20'
                    : 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 shadow-sm'
                  : isDark
                    ? 'text-slate-400 hover:bg-purple-950/30 hover:text-slate-200'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`transition-transform duration-200 group-hover:scale-110 ${
                  isActive ? (isDark ? 'text-purple-400' : 'text-indigo-600') : 'text-slate-400'
                }`}>
                  {item.icon}
                </span>
                <div>
                  <div className="font-bold">{item.name}</div>
                  <div className={`text-[10px] ${isActive ? (isDark ? 'text-purple-300' : 'text-indigo-500') : 'text-slate-500'}`}>
                    {item.sub}
                  </div>
                </div>
              </div>

              {item.badge && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${item.badgeColor} shadow-sm animate-pulse`}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Action Footer */}
      <div className={`p-4 border-t space-y-2 ${isDark ? 'border-purple-900/20' : 'border-slate-100'}`}>
        <button
          onClick={onOpenCreateTrx}
          className="w-full py-2.5 px-3.5 rounded-xl font-bold text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
        >
          <PlusCircle size={15} />
          <span>Create TrxID</span>
        </button>

        <div className="grid grid-cols-2 gap-2">
          <a
            href="https://t.me/bd_trust_pay_bot"
            target="_blank"
            rel="noreferrer"
            className={`py-2 px-2.5 rounded-xl font-bold text-[11px] border flex items-center justify-center gap-1.5 transition-all ${
              isDark 
                ? 'bg-purple-950/30 border-purple-800/30 text-purple-300 hover:bg-purple-900/40' 
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ExternalLink size={12} />
            <span>Open Bot</span>
          </a>

          <button
            onClick={onLogout}
            className={`py-2 px-2.5 rounded-xl font-bold text-[11px] border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              isDark
                ? 'bg-rose-950/30 border-rose-500/30 text-rose-400 hover:bg-rose-900/40 hover:text-rose-200'
                : 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
            }`}
          >
            <LogOut size={12} />
            <span>Lock Panel</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

// Layout Wrapper
function Layout({ children, onOpenCreateTrx, onLogout }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { orders } = useOrdersData();

  const pendingBuysCount = orders.buys.filter(b => b.status === 'pending' || b.status === 'verified').length;
  const pendingWithdrawCount = orders.withdrawals.filter(w => w.status === 'pending' || !w.status).length;

  return (
    <div className={`min-h-screen flex ${isDark ? 'bg-[#090d24] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <Sidebar 
        onOpenCreateTrx={onOpenCreateTrx} 
        pendingBuysCount={pendingBuysCount}
        pendingWithdrawCount={pendingWithdrawCount}
        onLogout={onLogout}
      />
      <main className="flex-1 ml-72 p-6 md:p-8 transition-colors duration-200">
        <div className="max-w-[1780px] w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

// =========================================================================
// REUSABLE LIVE ORDER FEED COMPONENT (FOR GRAM & USDT COLUMNS)
// =========================================================================
function LiveOrderFeed({ title, asset, icon, items, isDark, onApprove, onReject }) {
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const isGram = asset === 'GRAM';

  return (
    <div className={`rounded-3xl border p-6 flex flex-col h-full transition-all ${
      isDark 
        ? 'bg-[#0f0c22] border-purple-900/30 shadow-xl' 
        : 'bg-white border-slate-200 shadow-md'
    }`}>
      {/* Column Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/20 mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
            isGram ? 'bg-purple-500/20 text-purple-400' : 'bg-emerald-500/20 text-emerald-400'
          }`}>
            {icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`font-black text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {title}
              </h3>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${
                isGram ? 'bg-purple-500/15 text-purple-300' : 'bg-emerald-500/15 text-emerald-300'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full animate-ping ${isGram ? 'bg-purple-400' : 'bg-emerald-400'}`}></span>
                Live Feed
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Live purchase orders & on-chain dispatch history
            </p>
          </div>
        </div>

        <span className={`px-2.5 py-1 rounded-xl text-xs font-black ${
          isDark ? 'bg-purple-950/50 text-purple-300 border border-purple-800/40' : 'bg-slate-100 text-slate-700'
        }`}>
          {items.length} Orders
        </span>
      </div>

      {/* Orders List */}
      <div className="flex-1 space-y-3 overflow-y-auto max-h-[520px] pr-1 custom-scrollbar">
        {items.map((order) => {
          const isPending = order.status === 'pending' || order.status === 'verified';
          const isCompleted = order.status === 'completed' || order.status === 'paid';
          const isRejected = order.status === 'rejected';
          const method = (order.method || 'bKash').toLowerCase();

          return (
            <div 
              key={order.id || order.trxId || Math.random()} 
              className={`p-4 rounded-2xl border transition-all ${
                isDark 
                  ? 'bg-slate-900/60 border-slate-800/80 hover:border-purple-600/40' 
                  : 'bg-slate-50 border-slate-200/90 hover:border-indigo-300'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-400">
                    User: <span className="text-purple-400 font-extrabold">{order.userId}</span>
                  </span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                    method === 'nagad' ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30' : 'bg-pink-500/15 text-pink-400 border border-pink-500/30'
                  }`}>
                    {method}
                  </span>
                </div>

                {/* Status Badge */}
                {isCompleted && (
                  <span className="px-2 py-0.5 rounded-lg text-[10.5px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 size={11} /> Completed
                  </span>
                )}
                {isPending && (
                  <span className="px-2 py-0.5 rounded-lg text-[10.5px] font-black bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1 animate-pulse">
                    <Clock size={11} /> Pending
                  </span>
                )}
                {isRejected && (
                  <span className="px-2 py-0.5 rounded-lg text-[10.5px] font-black bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                    <XCircle size={11} /> Rejected
                  </span>
                )}
              </div>

              {/* Amount Info */}
              <div className="flex items-baseline justify-between mb-2">
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-xl font-black ${isGram ? 'text-purple-400' : 'text-emerald-400'}`}>
                    +{order.amount} {asset}
                  </span>

                </div>
                <div className="text-sm font-black text-slate-300">
                  ৳{order.totalBdt || order.amountBdt || 0} <span className="text-xs font-normal text-slate-400">BDT</span>
                </div>
              </div>

              {/* TrxID & Address */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-2 border-t border-slate-800/20">
                <div className="flex items-center gap-1">
                  <span>Trx:</span>
                  <span className="font-bold text-slate-300">{order.trxId || order.id || 'N/A'}</span>
                  <button 
                    onClick={() => handleCopy(order.trxId || order.id, order.trxId || order.id)} 
                    className="p-1 hover:text-white transition-colors cursor-pointer"
                    title="Copy TrxID"
                  >
                    {copiedId === (order.trxId || order.id) ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                  </button>
                </div>
                <div className="text-slate-500 text-[10px]">
                  {formatTimestamp(order.timestamp)}
                </div>
              </div>

              {/* Quick Actions if Pending */}
              {isPending && onApprove && (
                <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-800/40">
                  <button
                    onClick={() => onApprove(order.id || order.trxId)}
                    className="flex-1 py-1.5 px-2 rounded-xl text-[11px] font-black bg-emerald-500 hover:bg-emerald-400 text-white shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                  >
                    <Check size={12} /> Dispatch On-Chain
                  </button>
                  {onReject && (
                    <button
                      onClick={() => onReject(order.id || order.trxId)}
                      className="py-1.5 px-3 rounded-xl text-[11px] font-black bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/30 flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                    >
                      <X size={12} /> Reject
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {items.length === 0 && (
          <div className="py-12 text-center text-slate-500">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/30 flex items-center justify-center mx-auto mb-3 text-slate-600">
              {icon}
            </div>
            <p className="text-xs font-bold">No {asset} buy transactions recorded yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// =========================================================================
// 1. DASHBOARD COMPONENT (WITH 2 HERO CARDS & 2 LIVE HISTORY COLUMNS)
// =========================================================================
function Dashboard() {
  const { data, refresh, refreshing } = useBotData();
  const { orders, refresh: refreshOrders } = useOrdersData();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const gramBuys = useMemo(() => {
    return orders.buys.filter(b => {
      const a = (b.asset || '').toUpperCase();
      return a === 'GRAM' || a === 'TON';
    });
  }, [orders.buys]);

  const usdtBuys = useMemo(() => {
    return orders.buys.filter(b => (b.asset || '').toUpperCase() === 'USDT');
  }, [orders.buys]);

  const pendingBuys = orders.buys.filter(b => b.status === 'pending' || b.status === 'verified').length;
  const pendingWithdrawals = orders.withdrawals.filter(w => w.status === 'pending' || !w.status).length;

  const totalUsersCount = data.users?.length || 0;
  const verifiedUsersCount = (data.users || []).filter(u => u.isVerified || (parseFloat(u.balance || 0) > 0)).length;
  const verifiedPercent = totalUsersCount > 0 ? Math.round((verifiedUsersCount / totalUsersCount) * 100) : 0;
  const totalBuys = orders.buys.length;
  const completedBuys = orders.buys.filter(b => b.status === 'completed').length;
  const completionRate = totalBuys > 0 ? Math.round((completedBuys / totalBuys) * 100) : 94;

  const handleApproveBuy = async (id) => {
    if (!window.confirm("Approve this crypto order? Net crypto after gas fee will be sent automatically on-chain with memo 'TrustPay'.")) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/approve-buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const d = await res.json();
      if (d.success) {
        setToast({ show: true, type: 'success', message: 'Order approved and crypto dispatched on-chain!' });
        refreshOrders();
        refresh();
      } else {
        setToast({ show: true, type: 'error', message: d.error || 'Approval failed' });
      }
    } catch (e) {
      setToast({ show: true, type: 'error', message: 'Error: ' + e.message });
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
      const d = await res.json();
      if (d.success) {
        setToast({ show: true, type: 'success', message: 'Order rejected and BDT refunded to user.' });
        refreshOrders();
      } else {
        setToast({ show: true, type: 'error', message: d.error || 'Rejection failed' });
      }
    } catch (e) {
      setToast({ show: true, type: 'error', message: 'Error: ' + e.message });
    }
  };

  const copyAddress = (addr) => {
    navigator.clipboard.writeText(addr);
    setToast({ show: true, type: 'success', message: 'Bot treasury address copied to clipboard!' });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <Toast {...toast} onClose={() => setToast({ ...toast, show: false })} />

      {/* Top Hero Banner */}
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
              Welcome back, Admin! 👋
            </h2>
            <p className={`text-sm max-w-xl font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Real-time oversight for bot treasury balances, live crypto purchase feeds, and instant fiat cashout fulfillment.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Native TON Gas Pill */}
            <div className={`px-4 py-2.5 rounded-2xl border text-xs font-bold flex items-center gap-2 shadow-sm ${
              isDark ? 'bg-cyan-950/40 border-cyan-800/40 text-cyan-300' : 'bg-white border-cyan-200 text-cyan-800'
            }`}>
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
              <span>Gas Reserve: <b>{data.tonNativeBalance || data.tonBalance || '0.00'} TON</b></span>
            </div>

            <button
              onClick={() => { refresh(); refreshOrders(); }}
              className={`px-4 py-2.5 rounded-2xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isDark ? 'bg-purple-950/30 border-purple-800/40 text-purple-300 hover:bg-purple-900/40' : 'bg-white border-slate-200 text-slate-700 shadow-sm'
              }`}
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* 6 Quick KPI Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* Metric 1 */}
        <div className={`p-4 rounded-2xl border transition-all ${
          isDark ? 'bg-[#101438]/90 border-[#262f6b]/70 shadow-lg' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1">
            <span>USERS</span>
            <span className="w-2 h-2 rounded-full bg-pink-500"></span>
          </div>
          <div className="text-2xl font-black font-mono tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">
            {totalUsersCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Verified: <strong className="text-emerald-400">{verifiedUsersCount}</strong></span>
            <span>{verifiedPercent}%</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className={`p-4 rounded-2xl border transition-all ${
          isDark ? 'bg-[#101438]/90 border-[#262f6b]/70 shadow-lg' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1">
            <span>GRAM POOL</span>
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
          </div>
          <div className="text-2xl font-black font-mono tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">
            {parseFloat(data.tonNativeBalance || data.gramBalance || 0).toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            ≈ ৳{(parseFloat(data.tonNativeBalance || data.gramBalance || 0) * 220).toLocaleString('en-US', { maximumFractionDigits: 0 })} BDT
          </div>
        </div>

        {/* Metric 3 */}
        <div className={`p-4 rounded-2xl border transition-all ${
          isDark ? 'bg-[#101438]/90 border-[#262f6b]/70 shadow-lg' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1">
            <span>USDT POOL</span>
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
          </div>
          <div className="text-2xl font-black font-mono tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400">
            ${parseFloat(data.tonUsdtBalance || 0).toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            ≈ ৳{(parseFloat(data.tonUsdtBalance || 0) * 130).toLocaleString('en-US', { maximumFractionDigits: 0 })} BDT
          </div>
        </div>

        {/* Metric 4 */}
        <div className={`p-4 rounded-2xl border transition-all ${
          isDark ? 'bg-[#101438]/90 border-[#262f6b]/70 shadow-lg' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1">
            <span>PENDING BUYS</span>
            <span className={`w-2 h-2 rounded-full ${pendingBuys > 0 ? 'bg-amber-400 animate-ping' : 'bg-slate-600'}`}></span>
          </div>
          <div className={`text-2xl font-black font-mono tracking-tight ${pendingBuys > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
            {pendingBuys}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {pendingBuys > 0 ? 'Action Needed' : 'All Clear'}
          </div>
        </div>

        {/* Metric 5 */}
        <div className={`p-4 rounded-2xl border transition-all ${
          isDark ? 'bg-[#101438]/90 border-[#262f6b]/70 shadow-lg' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1">
            <span>CASHOUTS</span>
            <span className={`w-2 h-2 rounded-full ${pendingWithdrawals > 0 ? 'bg-rose-500 animate-ping' : 'bg-slate-600'}`}></span>
          </div>
          <div className={`text-2xl font-black font-mono tracking-tight ${pendingWithdrawals > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
            {pendingWithdrawals}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {pendingWithdrawals > 0 ? 'Pending Payout' : 'No Backlog'}
          </div>
        </div>

        {/* Metric 6 */}
        <div className={`p-4 rounded-2xl border transition-all ${
          isDark ? 'bg-[#101438]/90 border-[#262f6b]/70 shadow-lg' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1">
            <span>GAS RESERVE</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          </div>
          <div className="text-2xl font-black font-mono tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-300">
            {parseFloat(data.tonNativeBalance || data.tonBalance || 0).toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            TON On-Chain Gas
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* 6 ADVANCED INFOGRAPHIC CHARTS (DIRECTLY FROM USER REFERENCE IMAGES) */}
      {/* ================================================================ */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className={`text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Visual Analytics & Infographics
              </h3>
              <p className="text-xs text-slate-400">
                Live color-graded operational charts, liquidity waveforms & reserve distribution
              </p>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-300">
            PREMIUM HUD
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <InfographicConcentricRings 
            verifiedPercent={verifiedPercent} 
            completionRate={completionRate} 
            activeScore={totalUsersCount || 142} 
            isDark={isDark} 
          />
          <InfographicBarChart isDark={isDark} />
          <InfographicWaveChart isDark={isDark} />
          <InfographicRadarGauge isDark={isDark} />
          <InfographicPillSliders isDark={isDark} />
          <InfographicLineChart isDark={isDark} />
        </div>
      </div>

      {/* ================================================================ */}
      {/* THE 2 PRIMARY HERO CARDS AS REQUESTED: CARD 1 (GRAM), CARD 2 (USDT) */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* HERO CARD 1: GRAM TREASURY BALANCE */}
        <div className={`p-8 rounded-[2.5rem] border relative overflow-hidden transition-all duration-300 hover:scale-[1.01] ${
          isDark 
            ? 'bg-gradient-to-br from-[#1c123d] via-[#150d30] to-[#0c081e] border-purple-500/30 shadow-[0_20px_50px_rgba(147,51,234,0.18)]' 
            : 'bg-gradient-to-br from-purple-50 via-indigo-50 to-white border-purple-200 shadow-xl'
        }`}>
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-purple-600/15 blur-[80px] rounded-full pointer-events-none"></div>

          <div className="relative z-10">
            {/* Card Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center shadow-lg shadow-purple-600/20 border border-purple-500/30">
                  <Gem size={24} />
                </div>
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-purple-400">
                    GRAM Treasury Reserve
                  </span>
                  <div className="text-[11px] font-bold text-slate-400">
                    On-Chain TON Jetton Pool
                  </div>
                </div>
              </div>

              <span className="px-3 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
                Rate: ৳220 / GRAM
              </span>
            </div>

            {/* Big Prominent GRAM Amount */}
            <div className="flex items-baseline gap-3 my-4">
              <span className={`text-5xl md:text-6xl font-black tracking-tight font-mono ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                {data.tonNativeBalance || data.gramBalance || '0.00'}
              </span>
              <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">
                GRAM
              </span>
            </div>

            {/* Valuation & Quick Info */}
            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-purple-900/30">
              <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${
                isDark ? 'bg-purple-950/40 border-purple-800/40 text-purple-200' : 'bg-white border-purple-200 text-purple-900'
              }`}>
                ≈ ৳{(parseFloat(data.tonNativeBalance || data.gramBalance || 0) * 220).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BDT Valuation
              </div>

              <button
                onClick={() => copyAddress(data.tonAddress)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isDark ? 'bg-slate-900/60 border-slate-700/60 text-slate-300 hover:text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Copy size={12} /> Copy Treasury Address
              </button>
            </div>
          </div>
        </div>

        {/* HERO CARD 2: USDT TREASURY BALANCE */}
        <div className={`p-8 rounded-[2.5rem] border relative overflow-hidden transition-all duration-300 hover:scale-[1.01] ${
          isDark 
            ? 'bg-gradient-to-br from-[#0e2422] via-[#091a18] to-[#040e0d] border-emerald-500/30 shadow-[0_20px_50px_rgba(16,185,129,0.18)]' 
            : 'bg-gradient-to-br from-emerald-50 via-teal-50 to-white border-emerald-200 shadow-xl'
        }`}>
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-600/15 blur-[80px] rounded-full pointer-events-none"></div>

          <div className="relative z-10">
            {/* Card Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-600/20 border border-emerald-500/30">
                  <CircleDollarSign size={24} />
                </div>
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                    USDT Treasury Reserve
                  </span>
                  <div className="text-[11px] font-bold text-slate-400">
                    Tether USD (Jetton Contract)
                  </div>
                </div>
              </div>

              <span className="px-3 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Rate: ৳130 / USDT
              </span>
            </div>

            {/* Big Prominent USDT Amount */}
            <div className="flex items-baseline gap-3 my-4">
              <span className={`text-5xl md:text-6xl font-black tracking-tight font-mono ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                {data.tonUsdtBalance || '0.00'}
              </span>
              <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400">
                USDT
              </span>
            </div>

            {/* Valuation & Quick Info */}
            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-emerald-900/30">
              <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${
                isDark ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-200' : 'bg-white border-emerald-200 text-emerald-900'
              }`}>
                ≈ ৳{(parseFloat(data.tonUsdtBalance || 0) * 130).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BDT Valuation
              </div>

              <button
                onClick={() => copyAddress(data.tonAddress)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isDark ? 'bg-slate-900/60 border-slate-700/60 text-slate-300 hover:text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Copy size={12} /> Copy Treasury Address
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* ================================================================ */}
      {/* DIRECTLY UNDER THE 2 CARDS: 2 COLUMNS OF LIVE TRANSACTIONS */}
      {/* COLUMN 1: GRAM LIVE HISTORY | COLUMN 2: USDT LIVE HISTORY */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Column 1: Live GRAM Orders */}
        <LiveOrderFeed
          title="GRAM Live Purchase Feed"
          asset="GRAM"
          icon={<Gem size={20} />}
          items={gramBuys}
          isDark={isDark}
          onApprove={handleApproveBuy}
          onReject={handleRejectBuy}
        />

        {/* Column 2: Live USDT Orders */}
        <LiveOrderFeed
          title="USDT Live Purchase Feed"
          asset="USDT"
          icon={<CircleDollarSign size={20} />}
          items={usdtBuys}
          isDark={isDark}
          onApprove={handleApproveBuy}
          onReject={handleRejectBuy}
        />
      </div>

      {/* Quick Action Navigation Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/withdraw"
          className={`p-5 rounded-2xl border flex items-center justify-between transition-all group ${
            isDark ? 'bg-[#120e26] border-purple-900/30 hover:border-purple-600/40' : 'bg-white border-slate-200 shadow-sm hover:border-indigo-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center">
              <CreditCard size={18} />
            </div>
            <div>
              <div className="text-xs font-black uppercase text-slate-400">Fiat Cashouts</div>
              <div className="text-sm font-bold text-white">{pendingWithdrawals} Pending Requests</div>
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-500 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          to="/buys"
          className={`p-5 rounded-2xl border flex items-center justify-between transition-all group ${
            isDark ? 'bg-[#120e26] border-purple-900/30 hover:border-purple-600/40' : 'bg-white border-slate-200 shadow-sm hover:border-indigo-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <ShoppingCart size={18} />
            </div>
            <div>
              <div className="text-xs font-black uppercase text-slate-400">All Buy Orders</div>
              <div className="text-sm font-bold text-white">{pendingBuys} Orders To Review</div>
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-500 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          to="/users"
          className={`p-5 rounded-2xl border flex items-center justify-between transition-all group ${
            isDark ? 'bg-[#120e26] border-purple-900/30 hover:border-purple-600/40' : 'bg-white border-slate-200 shadow-sm hover:border-indigo-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
              <Users size={18} />
            </div>
            <div>
              <div className="text-xs font-black uppercase text-slate-400">Registered Users</div>
              <div className="text-sm font-bold text-white">{data.users.length} Active Accounts</div>
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-500 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}

// =========================================================================
// 2. BOT WALLET / TREASURY COMPONENT (UNIQUE CRYPTO VAULT EXPERIENCE)
// =========================================================================
// =========================================================================
// 2. BOT WALLET / TREASURY COMPONENT (FULL TONKEEPER DEPOSIT & ON-CHAIN WITHDRAW)
// =========================================================================
function BotWallet() {
  const { data, refresh, refreshing } = useBotData();
  const { orders, refresh: refreshOrders } = useOrdersData();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  // TonConnect Hooks for Admin
  const userTonAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [historyTab, setHistoryTab] = useState('all'); // 'all' | 'gram' | 'usdt' | 'pending' | 'completed'
  const [search, setSearch] = useState('');
  const [copiedHash, setCopiedHash] = useState(null);

  // Deposit & Withdraw Modal States
  const [depositModal, setDepositModal] = useState({ isOpen: false, asset: 'USDT' });
  const [withdrawModal, setWithdrawModal] = useState({ isOpen: false, asset: 'USDT' });
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawDestination, setWithdrawDestination] = useState('');
  const [depositing, setDepositing] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);

  const gramBuys = useMemo(() => {
    return orders.buys.filter(b => {
      const a = (b.asset || '').toUpperCase();
      return a === 'GRAM' || a === 'TON';
    });
  }, [orders.buys]);

  const usdtBuys = useMemo(() => {
    return orders.buys.filter(b => (b.asset || '').toUpperCase() === 'USDT');
  }, [orders.buys]);

  const pendingBuys = orders.buys.filter(b => b.status === 'pending' || b.status === 'verified').length;
  const completedBuys = orders.buys.filter(b => b.status === 'completed').length;
  const totalBuys = orders.buys.length;

  const gramBalanceVal = parseFloat(data.tonNativeBalance || data.gramBalance || 0);
  const usdtBalanceVal = parseFloat(data.tonUsdtBalance || 0);
  const tonGasVal = parseFloat(data.tonNativeBalance || data.tonBalance || 0);

  const gramBdtVal = gramBalanceVal * 220;
  const usdtBdtVal = usdtBalanceVal * 130;
  const totalVaultBdt = gramBdtVal + usdtBdtVal;

  const gramPercent = totalVaultBdt > 0 ? Math.round((gramBdtVal / totalVaultBdt) * 100) : 50;
  const usdtPercent = 100 - gramPercent;

  // Estimated dispatches remaining based on ~0.008 TON gas per transfer
  const estimatedTx = Math.max(0, Math.floor(tonGasVal / 0.008));

  // Inflow vs Outflow metrics
  const totalBdtInflow = useMemo(() => {
    return orders.buys.reduce((sum, b) => sum + (parseFloat(b.totalBdt || b.amountBdt || 0) || 0), 0);
  }, [orders.buys]);

  const totalBdtDispatched = useMemo(() => {
    return orders.buys
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + (parseFloat(b.totalBdt || b.amountBdt || 0) || 0), 0);
  }, [orders.buys]);

  const fulfillmentRate = totalBdtInflow > 0 
    ? Math.min(100, Math.round((totalBdtDispatched / totalBdtInflow) * 100)) 
    : 100;

  const filteredHistory = useMemo(() => {
    return orders.buys.filter(b => {
      const a = (b.asset || '').toUpperCase();
      const matchTab = 
        historyTab === 'all' ? true :
        historyTab === 'gram' ? (a === 'GRAM' || a === 'TON') :
        historyTab === 'usdt' ? a === 'USDT' :
        historyTab === 'pending' ? (b.status === 'pending' || b.status === 'verified') :
        historyTab === 'completed' ? b.status === 'completed' : true;

      const matchSearch = !search ? true :
        (b.trxId || '').toLowerCase().includes(search.toLowerCase()) ||
        (b.userId || '').toString().includes(search) ||
        (b.senderNumber || '').toString().includes(search);

      return matchTab && matchSearch;
    });
  }, [orders.buys, historyTab, search]);

  // Modal Opener Handlers
  const handleOpenDeposit = (asset = 'USDT') => {
    setDepositAmount('');
    setDepositModal({ isOpen: true, asset });
  };

  const handleOpenWithdraw = (asset = 'USDT') => {
    setWithdrawAmount('');
    setWithdrawDestination(userTonAddress || '');
    setWithdrawModal({ isOpen: true, asset });
  };

  // 1. TONKEEPER DEPOSIT EXECUTION
  const executeDeposit = async () => {
    if (!depositAmount || isNaN(depositAmount) || parseFloat(depositAmount) <= 0) {
      setToast({ show: true, type: 'error', message: 'Please enter a valid deposit amount.' });
      return;
    }
    if (!userTonAddress) {
      tonConnectUI.openModal();
      return;
    }

    setDepositing(true);
    try {
      const numAmt = parseFloat(depositAmount);
      let tx;

      if (depositModal.asset === 'TON') {
        tx = {
          validUntil: Math.floor(Date.now() / 1000) + 360,
          messages: [
            {
              address: data.tonAddress,
              amount: (numAmt * 1e9).toString()
            }
          ]
        };
      } else {
        // Jetton (USDT or GRAM) via backend transaction builder
        const res = await fetch(`${API_BASE}/api/miniapp/build-tx`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            asset: depositModal.asset,
            amount: numAmt,
            userAddress: userTonAddress
          })
        });
        const resData = await res.json();
        if (!resData.success && !resData.tx) {
          throw new Error(resData.error || 'Failed to construct Jetton deposit transaction');
        }
        tx = resData.tx || resData;
      }

      // Prompt Tonkeeper on Admin device
      await tonConnectUI.sendTransaction(tx);

      setDepositModal({ isOpen: false, asset: 'USDT' });
      setDepositAmount('');
      setToast({ show: true, type: 'success', message: `Deposit transaction sent via Tonkeeper! Your ${depositModal.asset} balance will update in moments.` });
      setTimeout(() => { refresh(); }, 3500);
    } catch (err) {
      console.error('Deposit error:', err);
      setToast({ show: true, type: 'error', message: err.message || 'Deposit was cancelled or failed in Tonkeeper.' });
    } finally {
      setDepositing(false);
    }
  };

  // 2. ON-CHAIN WITHDRAWAL EXECUTION
  const executeWithdraw = async () => {
    if (!withdrawAmount || isNaN(withdrawAmount) || parseFloat(withdrawAmount) <= 0) {
      setToast({ show: true, type: 'error', message: 'Please enter a valid withdrawal amount.' });
      return;
    }
    const dest = (withdrawDestination || userTonAddress || '').trim();
    if (!dest) {
      setToast({ show: true, type: 'error', message: 'Please enter or connect a destination wallet address.' });
      return;
    }

    setWithdrawing(true);
    try {
      const res = await fetch(`${API_BASE}/api/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          network: 'TON',
          asset: withdrawModal.asset,
          amount: parseFloat(withdrawAmount),
          destination: dest
        })
      });
      const json = await res.json();
      if (json.success) {
        setWithdrawModal({ isOpen: false, asset: 'USDT' });
        setWithdrawAmount('');
        setToast({ show: true, type: 'success', message: json.message || 'Withdrawal initiated successfully on-chain!' });
        setTimeout(() => { refresh(); }, 2500);
      } else {
        setToast({ show: true, type: 'error', message: json.error || 'Withdrawal failed.' });
      }
    } catch (err) {
      console.error('Withdraw error:', err);
      setToast({ show: true, type: 'error', message: err.message || 'Network error processing withdrawal.' });
    } finally {
      setWithdrawing(false);
    }
  };

  const handleApproveBuy = async (id) => {
    if (!window.confirm("Approve this crypto order? Net crypto after gas fee will be sent automatically on-chain with memo 'TrustPay'.")) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/approve-buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const d = await res.json();
      if (d.success) {
        setToast({ show: true, type: 'success', message: 'Order approved and crypto dispatched on-chain!' });
        refreshOrders();
        refresh();
      } else {
        setToast({ show: true, type: 'error', message: d.error || 'Approval failed' });
      }
    } catch (e) {
      setToast({ show: true, type: 'error', message: 'Error: ' + e.message });
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
      const d = await res.json();
      if (d.success) {
        setToast({ show: true, type: 'success', message: 'Order rejected and BDT refunded to user.' });
        refreshOrders();
        refresh();
      } else {
        setToast({ show: true, type: 'error', message: d.error || 'Rejection failed' });
      }
    } catch (e) {
      setToast({ show: true, type: 'error', message: 'Error: ' + e.message });
    }
  };

  const copyAddress = (addr) => {
    navigator.clipboard.writeText(addr);
    setToast({ show: true, type: 'success', message: 'Treasury address copied to clipboard!' });
  };

  const copyTrxId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
    setToast({ show: true, type: 'success', message: `TrxID copied: ${id}` });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <Toast {...toast} onClose={() => setToast({ ...toast, show: false })} />

      {/* ================================================================ */}
      {/* 1. WALLET-SPECIFIC HEADER WITH LIVE ACTIONS (DEPOSIT & WITHDRAW) */}
      {/* ================================================================ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-widest mb-1">
            <Wallet size={14} /> Bot Treasury & Hot Wallet Vault
          </div>
          <h2 className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Treasury & Crypto Reserves
          </h2>
          <p className={`text-xs mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Autonomous hot wallet liquidity, TON network gas telemetry & automated on-chain contract settlements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Live Gas Reserve Status */}
          <div className={`px-3.5 py-2 rounded-2xl border text-xs font-bold flex items-center gap-2 shadow-sm ${
            isDark ? 'bg-[#0f1738] border-cyan-500/30 text-cyan-300' : 'bg-white border-cyan-200 text-cyan-800'
          }`}>
            <Fuel size={14} className="text-cyan-400" />
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            <span>Gas: <b>{tonGasVal.toFixed(3)} TON</b></span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
              tonGasVal >= 0.2 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}>
              {tonGasVal >= 0.2 ? 'OPTIMAL' : 'LOW'}
            </span>
          </div>

          {/* TONKEEPER DEPOSIT TRIGGER BUTTON */}
          <button
            onClick={() => handleOpenDeposit('USDT')}
            className="px-4 py-2 rounded-2xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <ArrowDownToLine size={15} /> Deposit (Tonkeeper)
          </button>

          {/* ON-CHAIN WITHDRAW TRIGGER BUTTON */}
          <button
            onClick={() => handleOpenWithdraw('USDT')}
            className="px-4 py-2 rounded-2xl text-xs font-black bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-600/30 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <ArrowUpRight size={15} /> Withdraw Funds
          </button>

          {/* Tonviewer Explorer */}
          <a
            href={`https://tonviewer.com/${data.tonAddress}`}
            target="_blank"
            rel="noreferrer"
            className={`px-3.5 py-2 rounded-2xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
              isDark 
                ? 'bg-slate-900/60 border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-800' 
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-sm'
            }`}
          >
            <ExternalLink size={13} />
            <span>Tonviewer</span>
          </a>

          <button
            onClick={() => { refresh(); refreshOrders(); }}
            className={`px-3 py-2 rounded-2xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isDark ? 'bg-purple-950/30 border-purple-800/40 text-purple-300 hover:bg-purple-900/40' : 'bg-white border-slate-200 text-slate-700 shadow-sm'
            }`}
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* ================================================================ */}
      {/* 2. LIQUIDITY MASTER HUB & SMART GAS FUEL STATION (HERO DUO) */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* CARD 1: MASTER LIQUIDITY VAULT (7 COLS) */}
        <div className={`lg:col-span-7 p-7 rounded-[2.5rem] border relative overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-2xl ${
          isDark 
            ? 'bg-gradient-to-br from-[#15123d] via-[#0f1131] to-[#090b20] border-purple-500/30 shadow-[0_20px_60px_rgba(124,58,237,0.15)]' 
            : 'bg-gradient-to-br from-purple-50 via-indigo-50 to-white border-purple-200 shadow-xl'
        }`}>
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-purple-600/15 blur-[90px] rounded-full pointer-events-none"></div>

          <div className="relative z-10 space-y-5">
            {/* Top Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400">
                  TON MAINNET • HOT WALLET ACTIVE
                </span>
              </div>
              <span className="px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-purple-400" /> AES-256 SIGNED
              </span>
            </div>

            {/* Total Valuation */}
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                COMBINED TREASURY LIQUIDITY
              </div>
              <div className="flex items-baseline gap-3">
                <span className={`text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight font-mono ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  ৳{totalVaultBdt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400">
                  BDT
                </span>
              </div>
              <div className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-2">
                <span>≈ ${(totalVaultBdt / 120).toFixed(2)} USD</span>
                <span className="w-1 h-1 rounded-full bg-slate-500"></span>
                <span className="text-emerald-400">Backing 100% of User Orders</span>
              </div>
            </div>

            {/* Asset Allocation Gradient Progress Strip */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                <span>Asset Allocation</span>
                <span>{gramPercent}% GRAM / {usdtPercent}% USDT</span>
              </div>

              <div className="w-full h-3 rounded-full bg-slate-800/80 p-0.5 flex overflow-hidden border border-slate-700/50">
                <div 
                  style={{ width: `${Math.max(10, Math.min(90, gramPercent))}%` }} 
                  className="h-full rounded-l-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500" 
                  title={`GRAM: ${gramPercent}%`}
                />
                <div 
                  style={{ width: `${Math.max(10, Math.min(90, usdtPercent))}%` }} 
                  className="h-full rounded-r-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-500" 
                  title={`USDT: ${usdtPercent}%`}
                />
              </div>

              {/* Allocation Legend */}
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-bold">
                <div className="flex items-center gap-1.5 text-purple-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                  <span>GRAM Pool: <b>{gramBalanceVal.toFixed(2)}</b> (৳{gramBdtVal.toFixed(0)})</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                  <span>USDT Pool: <b>${usdtBalanceVal.toFixed(2)}</b> (৳{usdtBdtVal.toFixed(0)})</span>
                </div>
                <div className="flex items-center gap-1.5 text-cyan-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                  <span>Gas Reserve: <b>{tonGasVal.toFixed(2)} TON</b></span>
                </div>
              </div>
            </div>

            {/* Quick Action Button Hub */}
            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => handleOpenDeposit('USDT')}
                className="py-2.5 px-4 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-md shadow-emerald-600/30 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <ArrowDownToLine size={14} /> Deposit via Tonkeeper
              </button>

              <button
                onClick={() => handleOpenWithdraw('USDT')}
                className="py-2.5 px-4 rounded-xl text-xs font-black bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-400 text-white shadow-md shadow-cyan-600/30 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <ArrowUpRight size={14} /> Withdraw to Wallet
              </button>

              <button
                onClick={() => copyAddress(data.tonAddress)}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isDark ? 'bg-slate-900/60 border-slate-700/60 text-slate-300 hover:text-white' : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <Copy size={12} /> Copy Address
              </button>

              <button
                onClick={() => setInfoModalOpen(true)}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isDark ? 'bg-slate-900/60 border-slate-700/60 text-slate-300 hover:text-white' : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <QrCode size={12} /> QR / Info
              </button>
            </div>
          </div>
        </div>

        {/* CARD 2: SMART GAS FUEL STATION (5 COLS) */}
        <div className={`lg:col-span-5 p-7 rounded-[2.5rem] border relative overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-2xl ${
          isDark 
            ? 'bg-gradient-to-br from-[#0c1f38] via-[#09172c] to-[#050e1a] border-cyan-500/30 shadow-[0_20px_60px_rgba(6,182,212,0.12)]' 
            : 'bg-gradient-to-br from-cyan-50 via-sky-50 to-white border-cyan-200 shadow-xl'
        }`}>
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-cyan-600/15 blur-[80px] rounded-full pointer-events-none"></div>

          <div className="relative z-10 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30 shadow-lg shadow-cyan-500/20">
                  <Fuel size={20} />
                </div>
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-cyan-400">
                    Gas Fuel Station
                  </span>
                  <div className="text-[11px] font-bold text-slate-400">
                    TON On-Chain Gas Engine
                  </div>
                </div>
              </div>

              <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border flex items-center gap-1.5 ${
                tonGasVal >= 0.2 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}>
                <span className={`w-2 h-2 rounded-full ${tonGasVal >= 0.2 ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'}`}></span>
                {tonGasVal >= 0.2 ? 'HEALTHY FUEL' : 'REFILL NEEDED'}
              </span>
            </div>

            {/* Circular Gas Meter SVG Visualizer */}
            <div className="flex items-center justify-center py-2">
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke={isDark ? '#1a2942' : '#e2e8f0'}
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="url(#cyanGasGradient)"
                    strokeWidth="8"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (251.2 * Math.min(100, Math.max(10, (tonGasVal / 2) * 100))) / 100}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-1000 ease-out"
                  />
                  <defs>
                    <linearGradient id="cyanGasGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#06b6d4" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                </svg>

                <div className="absolute text-center">
                  <div className="text-3xl font-black font-mono tracking-tight text-cyan-300">
                    {tonGasVal.toFixed(2)}
                  </div>
                  <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    TON FUEL
                  </div>
                </div>
              </div>
            </div>

            {/* Remaining Dispatches & Capacity */}
            <div className="space-y-2">
              <div className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-between ${
                isDark ? 'bg-slate-900/60 border-cyan-900/40 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
              }`}>
                <span className="flex items-center gap-1.5 text-cyan-300">
                  <Zap size={14} /> Estimated Capacity
                </span>
                <span className="font-mono font-black text-cyan-400">
                  ~{estimatedTx} On-Chain Dispatches
                </span>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                {tonGasVal >= 0.2 
                  ? 'Reserve is optimal. Auto-dispatches for GRAM and USDT jettons will execute instantly on-chain.' 
                  : '⚠️ Gas reserve is low. Top up at least 1-2 TON to prevent user order timeouts.'}
              </p>
            </div>

            {/* Quick Refill Button via Tonkeeper */}
            <button
              onClick={() => handleOpenDeposit('TON')}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-md"
            >
              <Fuel size={14} /> Refill TON Gas (via Tonkeeper)
            </button>
          </div>
        </div>

      </div>

      {/* ================================================================ */}
      {/* 3. THE 2 PRIMARY CRYPTO ASSET VAULTS (GRAM & USDT) */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* VAULT 1: GRAM JETTON */}
        <div className={`p-8 rounded-[2.5rem] border relative overflow-hidden transition-all duration-300 hover:scale-[1.01] ${
          isDark 
            ? 'bg-gradient-to-br from-[#1c123d] via-[#150d30] to-[#0c081e] border-purple-500/30 shadow-[0_20px_50px_rgba(147,51,234,0.18)]' 
            : 'bg-gradient-to-br from-purple-50 via-indigo-50 to-white border-purple-200 shadow-xl'
        }`}>
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-purple-600/15 blur-[80px] rounded-full pointer-events-none"></div>

          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center shadow-lg shadow-purple-600/20 border border-purple-500/30">
                  <Gem size={24} />
                </div>
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-purple-400">
                    GRAM Treasury Reserve
                  </span>
                  <div className="text-[11px] font-bold text-slate-400">
                    On-Chain TON Jetton Pool
                  </div>
                </div>
              </div>

              <span className="px-3 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
                Rate: ৳220 / GRAM
              </span>
            </div>

            <div className="flex items-baseline gap-3 my-2">
              <span className={`text-5xl md:text-6xl font-black tracking-tight font-mono ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                {gramBalanceVal.toFixed(2)}
              </span>
              <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">
                GRAM
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-purple-900/30 text-xs">
              <span className="font-bold text-purple-300">
                ≈ ৳{gramBdtVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BDT Valuation
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleOpenDeposit('GRAM')}
                  className="px-3 py-1.5 rounded-xl text-xs font-black bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                >
                  <ArrowDownToLine size={12} /> Deposit
                </button>
                <button
                  onClick={() => handleOpenWithdraw('GRAM')}
                  className="px-3 py-1.5 rounded-xl text-xs font-black bg-purple-950/60 border border-purple-600/40 text-purple-300 hover:text-white flex items-center gap-1 transition-all cursor-pointer"
                >
                  <ArrowUpRight size={12} /> Withdraw
                </button>
                <button
                  onClick={() => setHistoryTab('gram')}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900/50 text-slate-300 hover:text-white border border-slate-700/50 transition-all cursor-pointer"
                >
                  Orders
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* VAULT 2: USDT JETTON */}
        <div className={`p-8 rounded-[2.5rem] border relative overflow-hidden transition-all duration-300 hover:scale-[1.01] ${
          isDark 
            ? 'bg-gradient-to-br from-[#0e2422] via-[#091a18] to-[#040e0d] border-emerald-500/30 shadow-[0_20px_50px_rgba(16,185,129,0.18)]' 
            : 'bg-gradient-to-br from-emerald-50 via-teal-50 to-white border-emerald-200 shadow-xl'
        }`}>
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-600/15 blur-[80px] rounded-full pointer-events-none"></div>

          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-600/20 border border-emerald-500/30">
                  <CircleDollarSign size={24} />
                </div>
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                    USDT Treasury Reserve
                  </span>
                  <div className="text-[11px] font-bold text-slate-400">
                    Tether USD (Jetton Contract)
                  </div>
                </div>
              </div>

              <span className="px-3 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Rate: ৳130 / USDT
              </span>
            </div>

            <div className="flex items-baseline gap-3 my-2">
              <span className={`text-5xl md:text-6xl font-black tracking-tight font-mono ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                {usdtBalanceVal.toFixed(2)}
              </span>
              <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400">
                USDT
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-emerald-900/30 text-xs">
              <span className="font-bold text-emerald-300">
                ≈ ৳{usdtBdtVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BDT Valuation
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleOpenDeposit('USDT')}
                  className="px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                >
                  <ArrowDownToLine size={12} /> Deposit
                </button>
                <button
                  onClick={() => handleOpenWithdraw('USDT')}
                  className="px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-950/60 border border-emerald-600/40 text-emerald-300 hover:text-white flex items-center gap-1 transition-all cursor-pointer"
                >
                  <ArrowUpRight size={12} /> Withdraw
                </button>
                <button
                  onClick={() => setHistoryTab('usdt')}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900/50 text-slate-300 hover:text-white border border-slate-700/50 transition-all cursor-pointer"
                >
                  Orders
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ================================================================ */}
      {/* 4. WALLET FINANCIAL TELEMETRY & RESERVE FLOW (3 UNIQUE PANELS) */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Panel 1: Liquidity Flow Velocity */}
        <div className={`p-6 rounded-3xl border transition-all ${
          isDark ? 'bg-[#101438]/90 border-[#262f6b]/70 shadow-lg' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center gap-2.5 mb-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Activity size={16} />
            </div>
            <div>
              <div className="text-xs font-black uppercase text-slate-400">LIQUIDITY VELOCITY</div>
              <div className="text-sm font-bold text-white">Fiat Inflow vs Crypto Outflow</div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-400">Total Inflow (Paid BDT):</span>
              <span className="text-emerald-400 font-mono">৳{totalBdtInflow.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-400">Total Outflow (Dispatched):</span>
              <span className="text-purple-400 font-mono">৳{totalBdtDispatched.toLocaleString()}</span>
            </div>

            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                <span>Fulfillment Ratio</span>
                <span className="text-cyan-400">{fulfillmentRate}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div 
                  style={{ width: `${fulfillmentRate}%` }} 
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Panel 2: Smart Contract Engine Status */}
        <div className={`p-6 rounded-3xl border transition-all ${
          isDark ? 'bg-[#101438]/90 border-[#262f6b]/70 shadow-lg' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center gap-2.5 mb-3">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Zap size={16} />
            </div>
            <div>
              <div className="text-xs font-black uppercase text-slate-400">ON-CHAIN ENGINE</div>
              <div className="text-sm font-bold text-white">Tonweb Jetton Engine</div>
            </div>
          </div>

          <div className="space-y-2.5 pt-2 text-xs">
            <div className="flex items-center justify-between font-bold">
              <span className="text-slate-400">Execution Speed:</span>
              <span className="text-emerald-400 font-mono">&lt; 2.8s confirmation</span>
            </div>
            <div className="flex items-center justify-between font-bold">
              <span className="text-slate-400">Memo Enforcement:</span>
              <span className="text-purple-300 font-mono font-black">'TrustPay' attached</span>
            </div>
            <div className="flex items-center justify-between font-bold">
              <span className="text-slate-400">Fail-Safe Refund:</span>
              <span className="text-cyan-400 font-bold">Instant BDT rollback</span>
            </div>
          </div>
        </div>

        {/* Panel 3: 24h Settlement Ledger Summary */}
        <div className={`p-6 rounded-3xl border transition-all ${
          isDark ? 'bg-[#101438]/90 border-[#262f6b]/70 shadow-lg' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center gap-2.5 mb-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Clock size={16} />
            </div>
            <div>
              <div className="text-xs font-black uppercase text-slate-400">SETTLEMENT QUEUE</div>
              <div className="text-sm font-bold text-white">Live Order Throughput</div>
            </div>
          </div>

          <div className="space-y-2.5 pt-2 text-xs">
            <div className="flex items-center justify-between font-bold">
              <span className="text-slate-400">Total Purchase Orders:</span>
              <span className="text-white font-mono font-black">{totalBuys}</span>
            </div>
            <div className="flex items-center justify-between font-bold">
              <span className="text-slate-400">Dispatched On-Chain:</span>
              <span className="text-emerald-400 font-mono font-black">{completedBuys} Completed</span>
            </div>
            <div className="flex items-center justify-between font-bold">
              <span className="text-slate-400">Action Required:</span>
              <span className={`font-mono font-black ${pendingBuys > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`}>
                {pendingBuys} Orders Pending
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* ================================================================ */}
      {/* 5. ON-CHAIN TRANSACTION CARDS (RESPONSIVE 6-CARD GRID) */}
      {/* ================================================================ */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className={`text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Treasury On-Chain Transaction Cards
            </h3>
            <p className="text-xs text-slate-400">
              Real-time feed of crypto purchases and on-chain contract settlements in 6-card grid
            </p>
          </div>

          {/* Filter Tabs & Search */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: `All (${orders.buys.length})` },
              { id: 'gram', label: `GRAM (${gramBuys.length})` },
              { id: 'usdt', label: `USDT (${usdtBuys.length})` },
              { id: 'pending', label: `Pending (${pendingBuys})` },
              { id: 'completed', label: `Completed (${completedBuys})` }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setHistoryTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  historyTab === tab.id
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : isDark 
                      ? 'bg-slate-900/60 text-slate-400 hover:text-white border border-purple-900/20' 
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}

            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search Trx or User..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className={`pl-8 pr-3 py-1.5 rounded-xl text-xs font-medium border outline-none w-44 md:w-56 ${
                  isDark ? 'bg-slate-900/60 border-purple-900/30 text-white placeholder:text-slate-500' : 'bg-white border-slate-200 text-slate-900'
                }`}
              />
            </div>
          </div>
        </div>

        {/* 6-Card Responsive Grid */}
        {filteredHistory.length === 0 ? (
          <div className={`p-12 text-center rounded-3xl border ${
            isDark ? 'bg-[#0f0c22] border-purple-900/30 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
          }`}>
            <Wallet size={36} className="mx-auto mb-3 opacity-40 text-purple-400" />
            <p className="text-sm font-bold">No transactions found for this filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-3.5">
            {filteredHistory.map((b) => {
              const isPending = b.status === 'pending' || b.status === 'verified';
              const isCompleted = b.status === 'completed';
              const isRejected = b.status === 'rejected';
              const method = (b.method || 'bKash').toLowerCase();

              return (
                <div 
                  key={b.id || b.trxId || Math.random()}
                  className={`p-4 rounded-3xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between gap-3 hover:-translate-y-1.5 hover:shadow-xl ${
                    isDark 
                      ? 'bg-[#101438]/90 border-[#262f6b]/70 hover:border-cyan-400/50 shadow-lg' 
                      : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  {/* Top: Method & Status */}
                  <div className="flex items-center justify-between gap-1">
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                      method === 'nagad' ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30' : 'bg-pink-500/15 text-pink-400 border border-pink-500/30'
                    }`}>
                      {method}
                    </span>

                    {isCompleted && (
                      <span className="px-2 py-0.5 rounded-lg text-[9px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 size={10} /> Completed
                      </span>
                    )}
                    {isPending && (
                      <span className="px-2 py-0.5 rounded-lg text-[9px] font-black bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1 animate-pulse">
                        <Clock size={10} /> Pending
                      </span>
                    )}
                    {isRejected && (
                      <span className="px-2 py-0.5 rounded-lg text-[9px] font-black bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                        <XCircle size={10} /> Rejected
                      </span>
                    )}
                  </div>

                  {/* Center: Amount */}
                  <div className="text-center py-1">
                    <div className="text-[10px] font-mono text-slate-400">User: <strong className="text-purple-300">{b.userId}</strong></div>
                    <div className={`text-xl font-black font-mono tracking-tight my-1 ${b.asset === 'USDT' ? 'text-emerald-400' : 'text-purple-400'}`}>
                      +{b.amount} {b.asset}
                    </div>
                    <div className="text-xs font-black text-slate-300">
                      Paid: <span className="text-emerald-400">৳{b.totalBdt || b.amountBdt || 0}</span>
                    </div>
                  </div>

                  {/* Bottom: TrxID & Actions */}
                  <div className="pt-2 border-t border-slate-700/30 space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <button 
                        onClick={() => copyTrxId(b.trxId || b.id)}
                        className="truncate max-w-[110px] hover:text-purple-300 flex items-center gap-1 cursor-pointer transition-colors"
                        title="Click to copy TrxID"
                      >
                        <Copy size={9} />
                        {copiedHash === (b.trxId || b.id) ? 'Copied!' : (b.trxId || b.id)}
                      </button>
                      <span>{formatTimestamp(b.timestamp)}</span>
                    </div>

                    {isPending && (
                      <div className="flex items-center gap-1.5 pt-1">
                        <button
                          onClick={() => handleApproveBuy(b.id || b.trxId)}
                          className="flex-1 py-1 px-2 rounded-xl text-[10px] font-black bg-emerald-500 hover:bg-emerald-400 text-white shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                        >
                          <Check size={11} /> Approve
                        </button>
                        <button
                          onClick={() => handleRejectBuy(b.id || b.trxId)}
                          className="py-1 px-2.5 rounded-xl text-[10px] font-black bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/30 flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ================================================================ */}
      {/* 6. INTERACTIVE TONKEEPER DEPOSIT MODAL */}
      {/* ================================================================ */}
      {depositModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className={`w-full max-w-md p-7 rounded-[2.5rem] border relative shadow-2xl overflow-hidden ${
            isDark ? 'bg-[#0b1426] border-emerald-500/40 text-white shadow-[0_0_80px_rgba(16,185,129,0.25)]' : 'bg-white border-slate-200 text-slate-900 shadow-2xl'
          }`}>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent"></div>

            <button
              onClick={() => setDepositModal({ ...depositModal, isOpen: false })}
              className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer transition-all"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <ArrowDownToLine size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black">Deposit via Tonkeeper</h3>
                <p className="text-xs text-slate-400">Recharge Bot Treasury balance via Tonkeeper wallet</p>
              </div>
            </div>

            {/* Asset Selector Tabs: USDT & GRAM (or TON Gas if opened from Gas Station) */}
            {depositModal.asset === 'TON' ? (
              <div className="mb-5 p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Fuel size={20} className="text-cyan-400 shrink-0" />
                  <div>
                    <div className="text-xs font-black text-cyan-300">TON Gas Refill (Network Fee)</div>
                    <div className="text-[10px] text-slate-400">Needed to pay TON blockchain network fees when sending USDT/GRAM</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDepositModal({ ...depositModal, asset: 'USDT' })}
                  className="text-[11px] font-bold text-cyan-400 hover:underline px-2 py-1 rounded-lg bg-cyan-500/20 cursor-pointer"
                >
                  Deposit USDT
                </button>
              </div>
            ) : (
              <div className="flex gap-2 mb-5 bg-black/40 p-1.5 rounded-2xl border border-emerald-900/40">
                {['USDT', 'GRAM'].map(asset => (
                  <button
                    key={asset}
                    type="button"
                    onClick={() => { setDepositModal({ ...depositModal, asset }); }}
                    className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                      depositModal.asset === asset
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {asset}
                  </button>
                ))}
              </div>
            )}

            {/* Amount Input */}
            <div className="mb-5 space-y-2">
              <label className="text-[11px] font-black uppercase tracking-wider text-emerald-300/80">
                Amount to Deposit ({depositModal.asset})
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={depositAmount}
                  onChange={e => {
                    const v = e.target.value;
                    if (v === '' || /^[0-9]*\.?[0-9]*$/.test(v)) setDepositAmount(v);
                  }}
                  className="w-full bg-black/50 border border-emerald-900/60 p-4 pl-6 pr-20 rounded-2xl text-2xl font-black text-white outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all font-mono"
                  placeholder="0.00"
                  autoFocus
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-black text-emerald-400 uppercase">
                  {depositModal.asset}
                </span>
              </div>

              {/* Quick Amount Pills */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['1', '5', '10', '25', '50', '100'].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setDepositAmount(val)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-800/80 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 border border-slate-700/60 transition-all cursor-pointer"
                  >
                    +{val} {depositModal.asset}
                  </button>
                ))}
              </div>
            </div>

            {/* Connected Tonkeeper Status */}
            <div className="mb-6 space-y-2">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Source Wallet (Tonkeeper)
              </label>
              {userTonAddress ? (
                <div className="bg-black/40 p-3.5 rounded-2xl text-xs font-mono text-emerald-300 break-all border border-emerald-900/40 flex items-center justify-between gap-2 shadow-inner">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shrink-0"></span>
                    <span className="truncate">{userTonAddress}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-bold shrink-0">Connected</span>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs">
                  <span className="text-amber-300 font-bold">Tonkeeper not connected!</span>
                  <button
                    type="button"
                    onClick={() => tonConnectUI.openModal()}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all cursor-pointer"
                  >
                    Connect Wallet
                  </button>
                </div>
              )}
            </div>

            {/* Target Bot Treasury */}
            <div className="mb-6 text-[11px] text-slate-400 flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span>Destination: Bot Treasury</span>
              <span className="font-mono text-emerald-400 truncate max-w-[170px]">{data.tonAddress}</span>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDepositModal({ ...depositModal, isOpen: false })}
                className="flex-1 py-3.5 rounded-2xl font-bold bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={depositing || !depositAmount || parseFloat(depositAmount) <= 0}
                onClick={executeDeposit}
                className="flex-1 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {depositing ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    <span>Opening Tonkeeper...</span>
                  </>
                ) : (
                  <>
                    <ArrowDownToLine size={15} />
                    <span>Pay via Tonkeeper</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* 7. INTERACTIVE ON-CHAIN WITHDRAWAL MODAL */}
      {/* ================================================================ */}
      {withdrawModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className={`w-full max-w-md p-7 rounded-[2.5rem] border relative shadow-2xl overflow-hidden ${
            isDark ? 'bg-[#0b1426] border-cyan-500/40 text-white shadow-[0_0_80px_rgba(6,182,212,0.25)]' : 'bg-white border-slate-200 text-slate-900 shadow-2xl'
          }`}>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>

            <button
              onClick={() => setWithdrawModal({ ...withdrawModal, isOpen: false })}
              className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer transition-all"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <ArrowUpRight size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black">Withdraw from Treasury</h3>
                <p className="text-xs text-slate-400">Transfer crypto from Bot Treasury on-chain to your wallet</p>
              </div>
            </div>

            {/* Asset Selector Tabs with Live Balances */}
            <div className="flex gap-2 mb-5 bg-black/40 p-1.5 rounded-2xl border border-cyan-900/40">
              {[
                { id: 'USDT', label: `USDT (${data.tonUsdtBalance || '0.00'})` },
                { id: 'TON', label: `TON Gas (${parseFloat(data.tonNativeBalance || data.tonBalance || 0).toFixed(2)})` },
                { id: 'GRAM', label: `GRAM (${parseFloat(data.gramBalance || 0).toFixed(2)})` }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => { setWithdrawModal({ ...withdrawModal, asset: tab.id }); setWithdrawAmount(''); }}
                  className={`flex-1 py-2 px-1 rounded-xl font-black text-[11px] truncate transition-all cursor-pointer ${
                    withdrawModal.asset === tab.id
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Amount Input with MAX button */}
            <div className="mb-5 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black uppercase tracking-wider text-cyan-300/80">
                  Amount to Withdraw
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (withdrawModal.asset === 'USDT') {
                      setWithdrawAmount(data.tonUsdtBalance || '0');
                    } else if (withdrawModal.asset === 'TON') {
                      const curTon = parseFloat(data.tonNativeBalance || data.tonBalance || 0);
                      const safeMax = Math.max(0, curTon - 0.05); // keep 0.05 TON for gas
                      setWithdrawAmount(safeMax.toFixed(2));
                    } else {
                      setWithdrawAmount((parseFloat(data.gramBalance || 0)).toFixed(2));
                    }
                  }}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/40 transition-all cursor-pointer"
                >
                  MAX BALANCE
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={withdrawAmount}
                  onChange={e => {
                    const v = e.target.value;
                    if (v === '' || /^[0-9]*\.?[0-9]*$/.test(v)) setWithdrawAmount(v);
                  }}
                  className="w-full bg-black/50 border border-cyan-900/60 p-4 pl-6 pr-20 rounded-2xl text-2xl font-black text-white outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-mono"
                  placeholder="0.00"
                  autoFocus
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-black text-cyan-400 uppercase">
                  {withdrawModal.asset}
                </span>
              </div>
            </div>

            {/* Destination Wallet Address */}
            <div className="mb-6 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                  Destination TON Address
                </label>
                {userTonAddress && (
                  <button
                    type="button"
                    onClick={() => setWithdrawDestination(userTonAddress)}
                    className="text-[10px] text-cyan-400 hover:underline font-bold cursor-pointer"
                  >
                    Use Connected Tonkeeper
                  </button>
                )}
              </div>
              <input
                type="text"
                value={withdrawDestination}
                onChange={e => setWithdrawDestination(e.target.value)}
                placeholder="Enter recipient TON wallet address..."
                className="w-full bg-black/50 border border-cyan-900/60 p-3.5 rounded-2xl text-xs font-mono text-cyan-300 outline-none focus:border-cyan-400"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setWithdrawModal({ ...withdrawModal, isOpen: false })}
                className="flex-1 py-3.5 rounded-2xl font-bold bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={withdrawing || !withdrawAmount || parseFloat(withdrawAmount) <= 0 || !withdrawDestination}
                onClick={executeWithdraw}
                className="flex-1 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {withdrawing ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    <span>Dispatching On-Chain...</span>
                  </>
                ) : (
                  <>
                    <ArrowUpRight size={15} />
                    <span>Confirm Withdrawal</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* 8. ADDRESS & QR INFO MODAL */}
      {/* ================================================================ */}
      {infoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className={`w-full max-w-lg p-7 rounded-[2rem] border relative shadow-2xl ${
            isDark ? 'bg-[#0f1236] border-purple-500/40 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <button
              onClick={() => setInfoModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer transition-all"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/30">
                <Wallet size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black">Bot Treasury Address & Info</h3>
                <p className="text-xs text-slate-400">On-chain address for manual deposits or external wallet monitoring</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-purple-900/40 space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Bot Treasury TON Address
                </div>
                <div className="p-2.5 rounded-xl bg-black/40 border border-slate-800 font-mono text-xs text-purple-300 break-all select-all">
                  {data.tonAddress}
                </div>
                <button
                  onClick={() => copyAddress(data.tonAddress)}
                  className="w-full py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                >
                  <Copy size={13} /> Copy Full Address
                </button>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <a
                  href={`https://tonviewer.com/${data.tonAddress}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white flex items-center gap-1.5 transition-all"
                >
                  <ExternalLink size={13} /> View on Tonviewer
                </a>
                <button
                  onClick={() => setInfoModalOpen(false)}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// =========================================================================
// 3. BUY ORDERS COMPONENT
// =========================================================================
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
    if (!window.confirm("Approve this crypto order? Net crypto after gas fee will be sent automatically on-chain with memo 'TrustPay'.")) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/approve-buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        setToast({ show: true, type: 'success', message: 'Order approved and crypto sent on-chain!' });
        refresh();
      } else {
        setToast({ show: true, type: 'error', message: data.error || 'Approval failed.' });
      }
    } catch (e) {
      setToast({ show: true, type: 'error', message: 'Error: ' + e.message });
    }
  };

  const handleReject = async (id) => {
    const reason = prompt("Enter rejection reason (optional):", "Payment verification failed");
    if (reason === null) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/reject-buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, reason })
      });
      const data = await res.json();
      if (data.success) {
        setToast({ show: true, type: 'success', message: 'Order rejected and BDT refunded to user.' });
        refresh();
      } else {
        setToast({ show: true, type: 'error', message: data.error || 'Rejection failed.' });
      }
    } catch (e) {
      setToast({ show: true, type: 'error', message: 'Error: ' + e.message });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Toast {...toast} onClose={() => setToast({ ...toast, show: false })} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Crypto Buy Orders
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Review customer purchase requests and dispatch on-chain crypto with 1-click.
          </p>
        </div>

        <button
          onClick={refresh}
          className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            isDark ? 'bg-purple-950/30 border-purple-800/40 text-purple-300' : 'bg-white border-slate-200 text-slate-700 shadow-sm'
          }`}
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: `All (${orders.buys.length})` },
            { key: 'pending', label: `Pending (${orders.buys.filter(b => b.status === 'pending' || b.status === 'verified').length})` },
            { key: 'completed', label: `Completed (${orders.buys.filter(b => b.status === 'completed').length})` },
            { key: 'rejected', label: `Rejected (${orders.buys.filter(b => b.status === 'rejected').length})` },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filter === tab.key
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : isDark 
                    ? 'bg-slate-900/60 text-slate-400 hover:text-white border border-purple-900/20' 
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search TrxID or User ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={`pl-9 pr-4 py-2 rounded-xl text-xs font-medium border outline-none w-full md:w-64 ${
              isDark ? 'bg-slate-900/60 border-purple-900/30 text-white placeholder:text-slate-500' : 'bg-white border-slate-200 text-slate-900'
            }`}
          />
        </div>
      </div>

      {/* 6-Card Responsive Grid for Buy Orders */}
      {filteredBuys.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-3.5 mb-6">
          {filteredBuys.map((b) => {
            const isPending = b.status === 'pending' || b.status === 'verified';
            const isCompleted = b.status === 'completed';
            const isRejected = b.status === 'rejected';
            const method = (b.method || 'bKash').toLowerCase();

            return (
              <div 
                key={b.id || b.trxId || Math.random()}
                className={`p-4 rounded-3xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between gap-3 hover:-translate-y-1 hover:shadow-xl ${
                  isDark 
                    ? 'bg-[#101438]/90 border-[#262f6b]/70 hover:border-cyan-400/50 shadow-lg' 
                    : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                {/* Top: Method badge & Status */}
                <div className="flex items-center justify-between gap-1">
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                    method === 'nagad' ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30' : 'bg-pink-500/15 text-pink-400 border border-pink-500/30'
                  }`}>
                    {method}
                  </span>

                  {isCompleted && (
                    <span className="px-2 py-0.5 rounded-lg text-[9px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 size={10} /> Completed
                    </span>
                  )}
                  {isPending && (
                    <span className="px-2 py-0.5 rounded-lg text-[9px] font-black bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1 animate-pulse">
                      <Clock size={10} /> Pending
                    </span>
                  )}
                  {isRejected && (
                    <span className="px-2 py-0.5 rounded-lg text-[9px] font-black bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                      <XCircle size={10} /> Rejected
                    </span>
                  )}
                </div>

                {/* Center: Amount & Asset */}
                <div className="text-center py-1">
                  <div className="text-[10px] font-mono text-slate-400">User: <strong className="text-purple-300">{b.userId}</strong></div>
                  <div className={`text-xl font-black font-mono tracking-tight my-1 ${b.asset === 'USDT' ? 'text-emerald-400' : 'text-purple-400'}`}>
                    +{b.amount} {b.asset}
                  </div>
                  <div className="text-xs font-black text-slate-300">
                    Paid: <span className="text-emerald-400">৳{b.totalBdt || b.amountBdt || 0}</span>
                  </div>
                </div>

                {/* Bottom: TrxID & Actions */}
                <div className="pt-2 border-t border-slate-700/30 space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span className="truncate max-w-[120px]">{b.trxId || b.id}</span>
                    <span>{formatTimestamp(b.timestamp)}</span>
                  </div>

                  {isPending && (
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        onClick={() => handleApprove(b.id || b.trxId)}
                        className="flex-1 py-1 px-2 rounded-xl text-[10px] font-black bg-emerald-500 hover:bg-emerald-400 text-white shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                      >
                        <Check size={11} /> Approve
                      </button>
                      <button
                        onClick={() => handleReject(b.id || b.trxId)}
                        className="py-1 px-2.5 rounded-xl text-[10px] font-black bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/30 flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table */}
      <div className={`rounded-3xl border overflow-hidden ${
        isDark ? 'bg-[#0f0c22] border-purple-900/30 shadow-xl' : 'bg-white border-slate-200 shadow-md'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className={`border-b ${isDark ? 'bg-purple-950/30 border-purple-900/40 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
              <tr>
                <th className="p-4 font-black uppercase">TrxID / Order</th>
                <th className="p-4 font-black uppercase">User ID</th>
                <th className="p-4 font-black uppercase">Asset</th>
                <th className="p-4 font-black uppercase">Crypto Amount</th>
                <th className="p-4 font-black uppercase">Paid (BDT)</th>
                <th className="p-4 font-black uppercase">Method</th>
                <th className="p-4 font-black uppercase">Destination</th>
                <th className="p-4 font-black uppercase">Status</th>
                <th className="p-4 font-black uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/20">
              {filteredBuys.map((b) => {
                const isPending = b.status === 'pending' || b.status === 'verified';
                const isCompleted = b.status === 'completed';
                const isRejected = b.status === 'rejected';
                const method = (b.method || 'bKash').toLowerCase();
                const gasFee = b.asset === 'USDT' ? 0.008 : 0.0015;
                const netAmount = Math.max(0.0001, parseFloat(((b.amount || 0) - gasFee).toFixed(6)));

                return (
                  <tr key={b.id || b.trxId || Math.random()} className={`transition-colors ${isDark ? 'hover:bg-purple-950/20' : 'hover:bg-slate-50'}`}>
                    <td className="p-4 font-mono font-bold text-purple-400">{b.trxId || b.id}</td>
                    <td className="p-4 font-bold">{b.userId}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                        b.asset === 'USDT' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-purple-500/15 text-purple-400'
                      }`}>
                        {b.asset}
                      </span>
                    </td>
                    <td className="p-4 font-bold">
                      <div className="text-white">{b.amount} {b.asset}</div>
                      <div className="text-[10px] text-slate-400">Net: {netAmount} {b.asset} (Fee: {gasFee})</div>
                    </td>
                    <td className="p-4 font-black text-emerald-400">৳{b.totalBdt || b.amountBdt || 0}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                        method === 'nagad' ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30' : 'bg-pink-500/15 text-pink-400 border border-pink-500/30'
                      }`}>
                        {method}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-slate-400 text-[11px] max-w-[130px] truncate" title={b.receiveAddress}>
                      {b.receiveAddress || 'N/A'}
                    </td>
                    <td className="p-4">
                      {isCompleted && (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-max">
                          <CheckCircle2 size={12} /> Completed
                        </span>
                      )}
                      {isPending && (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1 w-max animate-pulse">
                          <Clock size={12} /> Pending
                        </span>
                      )}
                      {isRejected && (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1 w-max">
                          <XCircle size={12} /> Rejected
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {isPending ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprove(b.id || b.trxId)}
                            className="px-3 py-1.5 rounded-xl font-black text-[11px] bg-emerald-500 hover:bg-emerald-400 text-white shadow-md shadow-emerald-500/20 transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                          >
                            <Check size={12} /> Dispatch
                          </button>
                          <button
                            onClick={() => handleReject(b.id || b.trxId)}
                            className="px-3 py-1.5 rounded-xl font-black text-[11px] bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/30 transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                          >
                            <X size={12} /> Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px] font-mono">Processed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredBuys.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500 font-bold">
                    No buy orders found matching this filter.
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

// =========================================================================
// 4. SELL ORDERS COMPONENT
// =========================================================================
function SellOrders() {
  const { orders, refresh, refreshing } = useOrdersData();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Crypto Sell Orders
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Customer crypto sales history for bKash/Nagad wallet credit.
          </p>
        </div>
        <button
          onClick={refresh}
          className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            isDark ? 'bg-purple-950/30 border-purple-800/40 text-purple-300' : 'bg-white border-slate-200 text-slate-700 shadow-sm'
          }`}
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* 6-Card Responsive Grid for Crypto Sales */}
      {orders.sells.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-3.5 mb-6">
          {orders.sells.map(s => {
            const sTs = s?.timestamp;
            const formattedTime = (sTs && sTs._seconds)
              ? new Date(sTs._seconds * 1000).toLocaleString()
              : (sTs ? new Date(sTs).toLocaleString() : 'Just now');

            return (
              <div 
                key={s.id || Math.random()}
                className={`p-4 rounded-3xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between gap-3 hover:-translate-y-1 hover:shadow-xl ${
                  isDark 
                    ? 'bg-[#101438]/90 border-[#262f6b]/70 hover:border-cyan-400/50 shadow-lg' 
                    : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-purple-500/15 text-purple-400 border border-purple-500/30">
                    {s.asset || 'GRAM'}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg text-[9px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 size={10} /> Received
                  </span>
                </div>

                <div className="text-center py-1">
                  <div className="text-[10px] font-mono text-slate-400">User: <strong className="text-purple-300">{s.userId || 'N/A'}</strong></div>
                  <div className="text-xl font-black font-mono tracking-tight my-1 text-cyan-400">
                    {s.cryptoAmount || s.amount || 0} {s.asset || 'GRAM'}
                  </div>
                  <div className="text-xs font-black text-slate-300">
                    Payout: <span className="text-emerald-400">৳{s.bdtAmount || s.totalBdt || 0}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-700/30 text-[10px] text-slate-400 font-mono text-center truncate">
                  {s.payoutNumber || s.wallet || s.id || 'N/A'}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className={`rounded-3xl border overflow-hidden ${
        isDark ? 'bg-[#0f0c22] border-purple-900/30 shadow-xl' : 'bg-white border-slate-200 shadow-md'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className={`border-b ${isDark ? 'bg-purple-950/30 border-purple-900/40 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
              <tr>
                <th className="p-4 font-black uppercase">Order ID</th>
                <th className="p-4 font-black uppercase">User ID</th>
                <th className="p-4 font-black uppercase">Sold Crypto</th>
                <th className="p-4 font-black uppercase">Payout (BDT)</th>
                <th className="p-4 font-black uppercase">Sender Wallet</th>
                <th className="p-4 font-black uppercase text-right">Timestamp</th>
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
                    <td className="p-4 font-bold text-emerald-400">৳{s.estimatedTk || 0} BDT</td>
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
                    No sell orders found.
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

// =========================================================================
// 5. FIAT CASHOUTS (WITHDRAWALS) - STRICT PENDING BUTTONS & 0-PREFIX PHONES
// =========================================================================
function FiatWithdrawals() {
  const { orders, refresh, refreshing } = useOrdersData();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [tab, setTab] = useState('pending'); // 'pending' | 'all'
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const pendingWithdrawals = useMemo(() => {
    return orders.withdrawals.filter(w => w.status === 'pending' || !w.status);
  }, [orders.withdrawals]);

  const displayedList = useMemo(() => {
    const list = tab === 'pending' ? pendingWithdrawals : orders.withdrawals;
    if (!search) return list;
    return list.filter(w => {
      const uStr = (w.userId || '').toString();
      const numStr = (w.number || w.fiatWithdrawPending?.number || '').toString();
      return uStr.includes(search) || numStr.includes(search);
    });
  }, [tab, pendingWithdrawals, orders.withdrawals, search]);

  const handleApprove = async (withdrawId, userId) => {
    if (!window.confirm(`Approve cashout payout for User ${userId}? Receipt will be automatically posted to payout channel.`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/approve-withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, withdrawId })
      });
      const data = await res.json();
      if (data.success) {
        setToast({ show: true, type: 'success', message: 'Cashout approved and payment receipt posted to payout channel!' });
        refresh();
      } else {
        setToast({ show: true, type: 'error', message: data.error || 'Approval failed.' });
      }
    } catch (e) {
      setToast({ show: true, type: 'error', message: 'Error: ' + e.message });
    }
  };

  const handleReject = async (withdrawId, userId, refundAmt) => {
    const reason = prompt("Enter rejection reason (optional):", "Invalid phone number or cashout issue");
    if (reason === null) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/reject-withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, withdrawId, refundAmt, reason })
      });
      const data = await res.json();
      if (data.success) {
        setToast({ show: true, type: 'success', message: 'Cashout rejected and BDT refunded to user account.' });
        refresh();
      } else {
        setToast({ show: true, type: 'error', message: data.error || 'Rejection failed.' });
      }
    } catch (e) {
      setToast({ show: true, type: 'error', message: 'Error: ' + e.message });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Toast {...toast} onClose={() => setToast({ ...toast, show: false })} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
            bKash & Nagad Cashout Requests
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Customer BDT withdrawal requests. Once paid, approve to automatically dispatch payout receipts.
          </p>
        </div>

        <button
          onClick={refresh}
          className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            isDark ? 'bg-purple-950/30 border-purple-800/40 text-purple-300' : 'bg-white border-slate-200 text-slate-700 shadow-sm'
          }`}
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setTab('pending')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              tab === 'pending'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : isDark 
                  ? 'bg-slate-900/60 text-slate-400 hover:text-white border border-purple-900/20' 
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Clock size={13} />
            <span>Pending Requests ({pendingWithdrawals.length})</span>
          </button>

          <button
            onClick={() => setTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              tab === 'all'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : isDark 
                  ? 'bg-slate-900/60 text-slate-400 hover:text-white border border-purple-900/20' 
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Repeat size={13} />
            <span>All History ({orders.withdrawals.length})</span>
          </button>
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search phone or User ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={`pl-9 pr-4 py-2 rounded-xl text-xs font-medium border outline-none w-full md:w-64 ${
              isDark ? 'bg-slate-900/60 border-purple-900/30 text-white placeholder:text-slate-500' : 'bg-white border-slate-200 text-slate-900'
            }`}
          />
        </div>
      </div>

      {/* 6-Card Responsive Grid for Fiat Cashouts */}
      {displayedList.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-3.5 mb-6">
          {displayedList.map(w => {
            const info = w?.fiatWithdrawPending || w || {};
            const amount = info.amount || w.amount || 0;
            const rawNumber = info.number || w.number || 'N/A';
            const formattedNumber = formatBdPhone(rawNumber);
            const method = (info.method || w.method || 'bKash').toLowerCase();
            const isPending = w.status === 'pending' || !w.status;
            const isCompleted = w.status === 'completed' || w.status === 'approved' || w.status === 'paid';
            const isRejected = w.status === 'rejected' || w.status === 'refunded';

            return (
              <div 
                key={w.id || Math.random()}
                className={`p-4 rounded-3xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between gap-3 hover:-translate-y-1 hover:shadow-xl ${
                  isDark 
                    ? 'bg-[#101438]/90 border-[#262f6b]/70 hover:border-cyan-400/50 shadow-lg' 
                    : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                    method === 'nagad' ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30' : 'bg-pink-500/15 text-pink-400 border border-pink-500/30'
                  }`}>
                    {method}
                  </span>

                  {isCompleted && (
                    <span className="px-2 py-0.5 rounded-lg text-[9px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 size={10} /> Paid
                    </span>
                  )}
                  {isPending && (
                    <span className="px-2 py-0.5 rounded-lg text-[9px] font-black bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1 animate-pulse">
                      <Clock size={10} /> Pending
                    </span>
                  )}
                  {isRejected && (
                    <span className="px-2 py-0.5 rounded-lg text-[9px] font-black bg-slate-500/15 text-slate-400 border border-slate-500/30 flex items-center gap-1">
                      <XCircle size={10} /> Rejected
                    </span>
                  )}
                </div>

                <div className="text-center py-1">
                  <div className="text-[10px] font-mono text-slate-400">User: <strong className="text-purple-300">{w.userId}</strong></div>
                  <div className="text-xl font-black font-mono tracking-tight my-1 text-emerald-400">
                    ৳ {amount} BDT
                  </div>
                  <div className="text-xs font-mono font-bold text-cyan-300 flex items-center justify-center gap-1">
                    <span>{formattedNumber}</span>
                    <button 
                      onClick={() => navigator.clipboard.writeText(formattedNumber)} 
                      className="p-0.5 hover:text-white transition-colors cursor-pointer"
                      title="Copy Number"
                    >
                      <Copy size={10} />
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-700/30 space-y-2">
                  <div className="text-[10px] text-slate-500 font-mono text-center">
                    {formatTimestamp(w.timestamp || w.createdAt)}
                  </div>

                  {isPending && (
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        onClick={() => handleApprove(w.id, w.userId)}
                        className="flex-1 py-1 px-2 rounded-xl text-[10px] font-black bg-emerald-500 hover:bg-emerald-400 text-white shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                      >
                        <Check size={11} /> Approve
                      </button>
                      <button
                        onClick={() => handleReject(w.id, w.userId, amount)}
                        className="py-1 px-2.5 rounded-xl text-[10px] font-black bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/30 flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table */}
      <div className={`rounded-3xl border overflow-hidden ${
        isDark ? 'bg-[#0f0c22] border-purple-900/30 shadow-xl' : 'bg-white border-slate-200 shadow-md'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className={`border-b ${isDark ? 'bg-purple-950/30 border-purple-900/40 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
              <tr>
                <th className="p-4 font-black uppercase">User ID</th>
                <th className="p-4 font-black uppercase">Method</th>
                <th className="p-4 font-black uppercase">Mobile Number</th>
                <th className="p-4 font-black uppercase">Amount (BDT)</th>
                <th className="p-4 font-black uppercase">Status</th>
                <th className="p-4 font-black uppercase">Time</th>
                <th className="p-4 font-black uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/20">
              {displayedList.map(w => {
                const info = w?.fiatWithdrawPending || w || {};
                const amount = info.amount || w.amount || 0;
                const rawNumber = info.number || w.number || 'N/A';
                const formattedNumber = formatBdPhone(rawNumber);
                const method = (info.method || w.method || 'bKash').toLowerCase();
                const isPending = w.status === 'pending' || !w.status;
                const isCompleted = w.status === 'completed' || w.status === 'approved' || w.status === 'paid';
                const isRejected = w.status === 'rejected' || w.status === 'refunded';

                return (
                  <tr key={w.withdrawId || w.id || w.userId || Math.random()} className={`transition-colors ${isDark ? 'hover:bg-purple-950/20' : 'hover:bg-slate-50'}`}>
                    <td className="p-4 font-bold text-purple-400">{w.userId}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${
                        method === 'nagad' ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30' : 'bg-pink-500/15 text-pink-400 border border-pink-500/30'
                      }`}>
                        {method}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-bold select-all text-sm tracking-wide text-white">
                      {formattedNumber}
                    </td>
                    <td className="p-4 font-black text-emerald-400 text-sm">৳{amount} BDT</td>
                    <td className="p-4">
                      {isPending && (
                        <span className="px-2.5 py-1 rounded-lg text-[10.5px] font-black bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1 w-max animate-pulse">
                          <Clock size={11} /> Pending
                        </span>
                      )}
                      {isCompleted && (
                        <span className="px-2.5 py-1 rounded-lg text-[10.5px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-max">
                          <CheckCircle2 size={11} /> Paid
                        </span>
                      )}
                      {isRejected && (
                        <span className="px-2.5 py-1 rounded-lg text-[10.5px] font-black bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1 w-max">
                          <XCircle size={11} /> Refunded
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-slate-500 font-mono text-[11px]">
                      {formatTimestamp(w.timestamp)}
                    </td>
                    <td className="p-4 text-right">
                      {/* CRITICAL: ONLY SHOW ACTIVE ACTION BUTTONS FOR PENDING REQUESTS */}
                      {isPending ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprove(w.withdrawId || w.id, w.userId)}
                            className="px-3.5 py-1.5 rounded-xl font-black text-[11px] bg-emerald-500 hover:bg-emerald-400 text-white shadow-md shadow-emerald-500/20 transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                          >
                            <Check size={13} /> Approve & Pay
                          </button>
                          <button
                            onClick={() => handleReject(w.withdrawId || w.id, w.userId, amount)}
                            className="px-3.5 py-1.5 rounded-xl font-black text-[11px] bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/30 transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                          >
                            <X size={13} /> Refund
                          </button>
                        </div>
                      ) : (
                        <div className="text-slate-500 font-mono text-[11px]">
                          {isCompleted ? '✓ Completed' : '✕ Refunded'}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {displayedList.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 font-bold">
                    No cashout requests found.
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

// =========================================================================
// 6. USER MANAGEMENT COMPONENT (PREMIUM REDESIGNED)
// =========================================================================
function UsersManagement() {
  const { data, refresh, refreshing } = useBotData();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'verified' | 'unverified'
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' (high balance first) | 'asc' (low balance first)

  // Selected User Modal State
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [userPhoto, setUserPhoto] = useState(null);

  // Balance Add / Deduct State
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceReason, setBalanceReason] = useState('');
  const [balanceSubmitting, setBalanceSubmitting] = useState(false);

  // Status (Ban / Restrict) State
  const [restrictDays, setRestrictDays] = useState(7);
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Compute sorted & filtered users
  const { processedUsers, statsCounts } = useMemo(() => {
    const rawList = (data.users || []).map(u => {
      const uId = (u.chatId || u.id || '').toString();
      const bal = parseFloat(u.balance || 0);
      return {
        ...u,
        chatId: uId,
        mbsId: u.mbsId || `MBS${uId.slice(-5)}`,
        balanceNum: bal,
        isVerified: Boolean(u.isVerified || (u.totalBuy && u.totalBuy > 0) || (u.totalSell && u.totalSell > 0) || u.status === 'verified')
      };
    });

    const total = rawList.length;
    const verifiedCount = rawList.filter(u => u.isVerified).length;
    const unverifiedCount = total - verifiedCount;

    let filtered = rawList.filter(u => {
      if (filter === 'verified') return u.isVerified;
      if (filter === 'unverified') return !u.isVerified;
      return true;
    });

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(u => 
        (u.chatId || '').toLowerCase().includes(q) ||
        (u.username || '').toLowerCase().includes(q) ||
        (u.firstName || '').toLowerCase().includes(q) ||
        (u.mbsId || '').toLowerCase().includes(q)
      );
    }

    filtered.sort((a, b) => {
      if (sortOrder === 'desc') {
        return b.balanceNum - a.balanceNum;
      } else {
        return a.balanceNum - b.balanceNum;
      }
    });

    return {
      processedUsers: filtered,
      statsCounts: { total, verifiedCount, unverifiedCount }
    };
  }, [data.users, search, filter, sortOrder]);

  // Open User Modal & Load Real Photo
  const handleOpenUser = async (user) => {
    setSelectedUser(user);
    setModalLoading(true);
    setUserPhoto(user.photoUrl || null);
    setBalanceAmount('');
    setBalanceReason('');

    try {
      const res = await fetch(`${API_BASE}/api/admin/user-photo/${user.chatId}`);
      const d = await res.json();
      if (d && d.photoUrl) {
        setUserPhoto(d.photoUrl);
      }
    } catch (_) {}
    setModalLoading(false);
  };

  // Balance Add / Deduct Handler
  const handleBalanceUpdate = async (action) => {
    if (!selectedUser || !balanceAmount || parseFloat(balanceAmount) <= 0) {
      alert("সঠিক টাকার পরিমাণ দিন (Enter a valid amount)");
      return;
    }
    setBalanceSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/user/balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.chatId,
          action,
          amount: parseFloat(balanceAmount),
          reason: balanceReason
        })
      });
      const d = await res.json();
      if (d.success) {
        setToast({ 
          show: true, 
          type: 'success', 
          message: action === 'add' 
            ? `৳${balanceAmount} BDT সফলভাবে যোগ করা হয়েছে! নতুন ব্যালেন্স: ৳${d.newBalance} BDT`
            : `৳${balanceAmount} BDT সফলভাবে কর্তন করা হয়েছে! নতুন ব্যালেন্স: ৳${d.newBalance} BDT`
        });
        setSelectedUser(prev => ({ ...prev, balance: d.newBalance, balanceNum: d.newBalance }));
        setBalanceAmount('');
        setBalanceReason('');
        refresh();
      } else {
        setToast({ show: true, type: 'error', message: d.error || 'ব্যালেন্স আপডেট ব্যর্থ হয়েছে' });
      }
    } catch (e) {
      setToast({ show: true, type: 'error', message: 'Error: ' + e.message });
    } finally {
      setBalanceSubmitting(false);
    }
  };

  // Status Change (Ban, Unban, Restrict)
  const handleStatusChange = async (status, days = null) => {
    if (!selectedUser) return;
    setStatusSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/user/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.chatId,
          status,
          restrictionDays: days,
          reason: balanceReason || (status === 'banned' ? 'অ্যাকাউন্ট ভায়োলেশন' : 'সাময়িক স্থগিতাদেশ')
        })
      });
      const d = await res.json();
      if (d.success) {
        const statusText = status === 'active' ? 'অ্যাক্টিভ' : status === 'banned' ? 'ব্যান' : `${days} দিনের জন্য রেস্ট্রিক্ট`;
        setToast({ show: true, type: 'success', message: `ইউজার সফলভাবে ${statusText} করা হয়েছে!` });
        setSelectedUser(prev => ({ ...prev, status }));
        refresh();
      } else {
        setToast({ show: true, type: 'error', message: d.error || 'স্ট্যাটাস আপডেট ব্যর্থ হয়েছে' });
      }
    } catch (e) {
      setToast({ show: true, type: 'error', message: 'Error: ' + e.message });
    } finally {
      setStatusSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Toast {...toast} onClose={() => setToast({ ...toast, show: false })} />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
              <Users size={20} />
            </div>
            <div>
              <h2 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                ইউজার ম্যানেজমেন্ট (User Panel)
              </h2>
              <p className="text-xs text-slate-400">
                সকল নিবন্ধিত ইউজারের ব্যালেন্স, ভেরিফিকেশন ও অ্যাকাউন্ট নিয়ন্ত্রণ প্যানেল
              </p>
            </div>
          </div>
        </div>

        {/* Global Stats / Quick Counter */}
        <div className="flex items-center gap-2">
          <div className={`px-4 py-2 rounded-2xl border flex items-center gap-2 ${
            isDark ? 'bg-slate-900/60 border-purple-900/30 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <span className="text-[11px] font-bold text-slate-400">মোট ইউজার:</span>
            <span className="text-sm font-black font-mono text-purple-400">{statsCounts.total}</span>
          </div>
          <button
            onClick={() => refresh()}
            disabled={refreshing}
            className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
              isDark ? 'bg-purple-950/40 border-purple-800/40 text-purple-300 hover:bg-purple-900/40' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
            title="রিফ্রেশ করুন"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search & Sort Bar */}
      <div className={`p-4 rounded-3xl border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 ${
        isDark ? 'bg-[#0f0c22] border-purple-900/30 shadow-xl' : 'bg-white border-slate-200 shadow-md'
      }`}>
        {/* Verification Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              filter === 'all'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                : isDark ? 'bg-slate-900 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>সকল ইউজার</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">{statsCounts.total}</span>
          </button>

          <button
            onClick={() => setFilter('verified')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              filter === 'verified'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : isDark ? 'bg-slate-900 text-slate-400 hover:text-emerald-400' : 'bg-slate-100 text-slate-600 hover:text-emerald-600'
            }`}
          >
            <BadgeCheck size={14} className={filter === 'verified' ? 'text-white' : 'text-emerald-400'} />
            <span>ভেরিফাইড (Verified)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">{statsCounts.verifiedCount}</span>
          </button>

          <button
            onClick={() => setFilter('unverified')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              filter === 'unverified'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : isDark ? 'bg-slate-900 text-slate-400 hover:text-amber-400' : 'bg-slate-100 text-slate-600 hover:text-amber-600'
            }`}
          >
            <Clock size={14} className={filter === 'unverified' ? 'text-white' : 'text-amber-400'} />
            <span>আন-ভেরিফাইড (Unverified)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">{statsCounts.unverifiedCount}</span>
          </button>
        </div>

        {/* Search & Sort Toggle */}
        <div className="flex items-center gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1 md:w-64">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ইউজারনেম বা Bot ID খুঁজুন..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs font-medium border outline-none ${
                isDark ? 'bg-slate-950 border-purple-900/40 text-white placeholder:text-slate-500 focus:border-purple-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'
              }`}
            />
          </div>

          {/* Sort Order Toggle Button */}
          <button
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black border flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
              sortOrder === 'desc'
                ? isDark ? 'bg-purple-950/60 border-purple-500/40 text-purple-300 hover:bg-purple-900/50' : 'bg-purple-50 border-purple-300 text-purple-700'
                : isDark ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/50' : 'bg-cyan-50 border-cyan-300 text-cyan-700'
            }`}
            title="ব্যালেন্সের ক্রমানুসারে সাজান"
          >
            <ArrowUpDown size={14} />
            <span className="hidden sm:inline">
              {sortOrder === 'desc' ? 'সর্বোচ্চ ব্যালেন্স আগে' : 'সর্বনিম্ন ব্যালেন্স আগে'}
            </span>
          </button>
        </div>
      </div>

      {/* Users Cards Grid */}
      {processedUsers.length === 0 ? (
        <div className={`p-12 text-center rounded-3xl border ${
          isDark ? 'bg-[#0f0c22] border-purple-900/30 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
        }`}>
          <Users size={36} className="mx-auto mb-3 opacity-40 text-purple-400" />
          <p className="text-sm font-bold">কোনো ইউজার পাওয়া যায়নি</p>
          <p className="text-xs text-slate-500 mt-1">অনুসন্ধান বা ফিল্টার পরিবর্তন করে চেষ্টা করুন।</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-3.5">
          {processedUsers.map((u, idx) => {
            const rank = idx + 1;
            const isRank1 = sortOrder === 'desc' && rank === 1;
            const isRank2 = sortOrder === 'desc' && rank === 2;
            const isRank3 = sortOrder === 'desc' && rank === 3;

            return (
              <div
                key={u.chatId}
                onClick={() => handleOpenUser(u)}
                className={`group p-4 rounded-3xl border transition-all duration-300 cursor-pointer relative overflow-hidden flex flex-col justify-between gap-3 hover:-translate-y-1.5 hover:shadow-2xl ${
                  isRank1
                    ? isDark 
                      ? 'bg-gradient-to-br from-[#1c143d] via-[#141030] to-[#0d0a22] border-amber-500/50 shadow-[0_10px_25px_rgba(245,158,11,0.2)]' 
                      : 'bg-gradient-to-br from-amber-50/90 to-white border-amber-300 shadow-amber-200/50'
                    : isRank2
                      ? isDark
                        ? 'bg-gradient-to-br from-[#131b3d] via-[#0e132e] to-[#090b20] border-cyan-400/40 shadow-[0_10px_25px_rgba(6,182,212,0.15)]'
                        : 'bg-white border-slate-200 shadow-md'
                    : isDark 
                      ? 'bg-[#101438]/90 border-[#262f6b]/70 hover:border-purple-500/60 shadow-xl' 
                      : 'bg-white border-slate-200 hover:border-indigo-300 shadow-md'
                }`}
              >
                {/* Ambient Top Glow for top ranks */}
                {isRank1 && <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/15 rounded-full blur-xl pointer-events-none" />}
                {isRank2 && <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/15 rounded-full blur-xl pointer-events-none" />}

                {/* Card Top: Rank Badge & Status */}
                <div className="flex items-center justify-between gap-1 relative z-10">
                  <div className={`px-2 py-0.5 rounded-full text-[10px] font-black border flex items-center gap-1 shadow-sm ${
                    isRank1 ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 border-amber-300' :
                    isRank2 ? 'bg-gradient-to-r from-slate-200 to-slate-400 text-slate-950 border-slate-200' :
                    isRank3 ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white border-amber-500' :
                    'bg-slate-900/90 text-purple-300 border-purple-800/40'
                  }`}>
                    {isRank1 ? <Crown size={11} className="text-slate-950" /> : null}
                    <span>#{rank}</span>
                  </div>

                  {u.status === 'banned' ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[9px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/40">
                      <Ban size={9} />
                      <span>ব্যান</span>
                    </span>
                  ) : u.status === 'restricted' ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[9px] font-black bg-orange-500/20 text-orange-400 border border-orange-500/40">
                      <Lock size={9} />
                      <span>রেস্ট্রিক্টেড</span>
                    </span>
                  ) : u.isVerified ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xl text-[9.5px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <BadgeCheck size={11} />
                      <span>ভেরিফাইড</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xl text-[9.5px] font-black bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      <span>আন-ভেরিফাইড</span>
                    </span>
                  )}
                </div>

                {/* Center Section: Avatar & User Identity */}
                <div className="flex flex-col items-center text-center space-y-1.5 relative z-10 pt-1">
                  <div className="relative">
                    <img 
                      src={u.photoUrl || `${API_BASE}/api/admin/user-avatar/${u.chatId}`} 
                      alt={u.firstName || u.username || 'User'} 
                      className="w-14 h-14 rounded-2xl object-cover ring-2 ring-purple-500/30 shadow-md group-hover:scale-105 group-hover:ring-cyan-400 transition-all"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.parentElement?.querySelector('.avatar-fallback');
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                    <div 
                      className={`avatar-fallback w-14 h-14 rounded-2xl items-center justify-center font-black text-xl shadow-md ring-2 ${
                        isRank1 ? 'bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-950 ring-amber-400/50' :
                        isRank2 ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-slate-950 ring-slate-300/40' :
                        isRank3 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white ring-amber-600/40' :
                        'bg-gradient-to-br from-indigo-600 to-purple-700 text-white ring-purple-500/30'
                      }`}
                      style={{ display: 'none' }}
                    >
                      {isRank1 ? <Crown size={24} className="text-slate-950" /> : (u.firstName || u.username || u.chatId || 'U').slice(0, 1).toUpperCase()}
                    </div>
                  </div>

                  {/* Telegram Name */}
                  <div className="w-full px-1">
                    <div className={`font-black text-sm truncate group-hover:text-cyan-400 transition-colors ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`} title={u.firstName}>
                      {u.firstName || 'Telegram User'}
                    </div>

                    {/* Telegram Username */}
                    <div className="text-[11px] truncate">
                      {u.username ? (
                        <span className="font-semibold text-cyan-300">@{u.username}</span>
                      ) : (
                        <span className="text-slate-500 italic text-[10px]">(No username)</span>
                      )}
                    </div>

                    {/* Bot ID */}
                    <div className="mt-1 flex items-center justify-center gap-1 font-mono text-[10px]">
                      <span className="px-1.5 py-0.2 rounded font-bold bg-purple-950/60 border border-purple-800/40 text-purple-300">
                        {u.mbsId}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Bottom: Balance & Manage Button */}
                <div className="pt-2 border-t border-slate-700/30 space-y-1.5 relative z-10">
                  <div className="p-2 rounded-xl bg-slate-900/60 border border-purple-900/20 text-center">
                    <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">WALLET BALANCE</div>
                    <div className="text-sm font-black font-mono tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-300">
                      ৳ {u.balanceNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>

                  <button className="w-full py-1.5 rounded-xl text-[10.5px] font-bold bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 group-hover:border-cyan-400/50 group-hover:text-cyan-300 transition-all flex items-center justify-center gap-1">
                    <span>ম্যানেজ করুন</span>
                    <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive Modal Popup for Selected User */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div 
            onClick={(e) => e.stopPropagation()} 
            className={`w-full max-w-xl rounded-3xl border p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 ${
              isDark ? 'bg-[#0f0c22] border-purple-900/50 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedUser(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-800/40 hover:bg-slate-700/60 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
            >
              <X size={18} />
            </button>

            {/* Modal Header: User Info */}
            <div className="flex items-start gap-4">
              <div className="relative shrink-0">
                <img 
                  src={userPhoto || `${API_BASE}/api/admin/user-avatar/${selectedUser.chatId}`} 
                  alt={selectedUser.firstName || selectedUser.username} 
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-purple-500/40 shadow-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fb = e.currentTarget.parentElement?.querySelector('.modal-fallback');
                    if (fb) fb.style.display = 'flex';
                  }}
                />
                <div 
                  className="modal-fallback w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white items-center justify-center font-black text-2xl shadow-lg ring-2 ring-purple-500/40"
                  style={{ display: 'none' }}
                >
                  {(selectedUser.firstName || selectedUser.username || selectedUser.chatId || 'U').slice(0, 1).toUpperCase()}
                </div>
                {modalLoading && (
                  <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center pointer-events-none">
                    <RefreshCw size={18} className="animate-spin text-purple-400" />
                  </div>
                )}
              </div>

              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-black text-lg text-white">
                    {selectedUser.firstName || 'Telegram User'}
                  </h3>
                  {selectedUser.isVerified ? (
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <BadgeCheck size={12} />
                      <span>ভেরিফাইড একাউন্ট</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                      <Clock size={12} />
                      <span>আন-ভেরিফাইড</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-xs text-cyan-300 font-semibold">
                  <span className="text-slate-400">Username:</span>
                  <span>{selectedUser.username ? `@${selectedUser.username}` : '(No username)'}</span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                  <span>Bot ID: <strong className="text-purple-300">{selectedUser.mbsId}</strong></span>
                  <span>•</span>
                  <span>Telegram ID: <strong className="text-slate-300">{selectedUser.chatId}</strong></span>
                </div>

                <div className="text-[11px] text-slate-500">
                  নিবন্ধনের তারিখ: {formatTimestamp(selectedUser.createdAt || selectedUser.joinedAt)}
                </div>
              </div>
            </div>

            {/* Current Real-time Balance Display Box */}
            <div className={`p-5 rounded-2xl border flex items-center justify-between ${
              isDark ? 'bg-gradient-to-r from-emerald-950/40 to-teal-950/30 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
            }`}>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">বর্তমান লাইভ ব্যালেন্স</span>
                <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 mt-0.5">
                  ৳ {parseFloat(selectedUser.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm font-sans">BDT</span>
                </div>
              </div>
              <div className="text-right">
                <span className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase ${
                  selectedUser.status === 'banned' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                  selectedUser.status === 'restricted' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                  'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {selectedUser.status || 'Active'}
                </span>
              </div>
            </div>

            {/* Action 1: Balance Add / Deduct Tool */}
            <div className={`p-5 rounded-2xl border space-y-4 ${
              isDark ? 'bg-slate-950/60 border-purple-900/40' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-2 text-purple-400 font-black text-xs uppercase tracking-wider">
                <CircleDollarSign size={16} />
                <span>ব্যালেন্স সমন্বয় (Add / Minus Money)</span>
              </div>

              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="number"
                    value={balanceAmount}
                    onChange={e => setBalanceAmount(e.target.value)}
                    placeholder="টাকার পরিমাণ লিখুন (যেমন: 100)"
                    className={`flex-1 p-3 rounded-xl text-xs font-bold border outline-none font-mono ${
                      isDark ? 'bg-[#0f0c22] border-purple-900/50 text-white focus:border-purple-500' : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500'
                    }`}
                  />
                  <input
                    type="text"
                    value={balanceReason}
                    onChange={e => setBalanceReason(e.target.value)}
                    placeholder="কারণ / নোট (ঐচ্ছিক)"
                    className={`flex-1 p-3 rounded-xl text-xs font-medium border outline-none ${
                      isDark ? 'bg-[#0f0c22] border-purple-900/50 text-white focus:border-purple-500' : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500'
                    }`}
                  />
                </div>

                {/* Quick Amount Chips */}
                <div className="flex items-center gap-2 flex-wrap text-xs font-bold">
                  <span className="text-[11px] text-slate-500">কুইক অ্যামাউন্ট:</span>
                  {[50, 100, 250, 500, 1000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setBalanceAmount(amt.toString())}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] transition-all cursor-pointer ${
                        balanceAmount === amt.toString()
                          ? 'bg-purple-600 text-white border-purple-500'
                          : isDark ? 'bg-slate-900 border-purple-900/40 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      +৳{amt}
                    </button>
                  ))}
                </div>

                {/* Two Action Buttons: Add & Deduct */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    disabled={balanceSubmitting}
                    onClick={() => handleBalanceUpdate('add')}
                    className="py-3 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                  >
                    {balanceSubmitting ? <RefreshCw size={14} className="animate-spin" /> : <PlusCircle size={14} />}
                    <span>টাকা যোগ করুন (+ Add)</span>
                  </button>

                  <button
                    type="button"
                    disabled={balanceSubmitting}
                    onClick={() => handleBalanceUpdate('deduct')}
                    className="py-3 rounded-xl text-xs font-black bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                  >
                    {balanceSubmitting ? <RefreshCw size={14} className="animate-spin" /> : <MinusCircle size={14} />}
                    <span>টাকা মাইনাস করুন (- Minus)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Action 2: Ban / Unban & Temporary Restrictions */}
            <div className={`p-5 rounded-2xl border space-y-4 ${
              isDark ? 'bg-slate-950/60 border-purple-900/40' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-2 text-rose-400 font-black text-xs uppercase tracking-wider">
                <Shield size={16} />
                <span>নিরাপত্তা ও অ্যাকাউন্ট অ্যাকশন (Security & Status)</span>
              </div>

              <div className="space-y-3">
                {/* Temporary Restriction Section */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1.5">
                    সাময়িক সময়ের জন্য রেস্ট্রিক্ট করুন (Temporary Suspension):
                  </label>
                  <div className="flex items-center gap-2 flex-wrap mb-2.5">
                    {[1, 3, 7, 15, 30].map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setRestrictDays(d)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          restrictDays === d
                            ? 'bg-orange-600 text-white border-orange-500 shadow-md shadow-orange-600/20'
                            : isDark ? 'bg-[#0f0c22] border-slate-800 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        {d} দিন
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      disabled={statusSubmitting}
                      onClick={() => handleStatusChange('restricted', restrictDays)}
                      className="flex-1 py-2.5 rounded-xl text-xs font-black bg-orange-600/20 hover:bg-orange-600/30 text-orange-300 border border-orange-500/40 flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                    >
                      <Lock size={14} />
                      <span>{restrictDays} দিনের জন্য রেস্ট্রিক্ট করুন</span>
                    </button>

                    {selectedUser.status === 'restricted' && (
                      <button
                        type="button"
                        disabled={statusSubmitting}
                        onClick={() => handleStatusChange('active')}
                        className="py-2.5 px-4 rounded-xl text-xs font-black bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                      >
                        <Unlock size={14} />
                        <span>রেস্ট্রিকশন তুলুন</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Permanent Ban / Unban Button */}
                <div className="pt-2 border-t border-slate-800/40">
                  {selectedUser.status === 'banned' ? (
                    <button
                      type="button"
                      disabled={statusSubmitting}
                      onClick={() => handleStatusChange('active')}
                      className="w-full py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                    >
                      <CheckCircle2 size={14} />
                      <span>অ্যাকাউন্ট আনব্যান করুন (Unban User)</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={statusSubmitting}
                      onClick={() => handleStatusChange('banned')}
                      className="w-full py-2.5 rounded-xl text-xs font-black bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                    >
                      <Ban size={14} />
                      <span>স্থায়ীভাবে ব্যান করুন (Ban User)</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white cursor-pointer transition-all"
              >
                বন্ধ করুন (Close)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// 7. BOT SETTINGS COMPONENT (CLEAN & PREMIUM REDESIGNED)
// =========================================================================
function BotSettings() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [settings, setSettings] = useState({
    adminBkash: '01752561935',
    adminNagad: '01878580320',
    gramAmount: '0.07',
    usdtAmount: '0.05',
    dailyWithdrawLimit: 50,
    userLogGroupId: '',
    payoutGroupId: '@bd_trust_pay_payout'
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [copiedField, setCopiedField] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/api/settings`)
      .then(r => r.json())
      .then(d => setSettings(prev => ({ ...prev, ...d })))
      .catch(() => {});

    fetch(`${API_BASE}/api/admin/limits`)
      .then(r => r.json())
      .then(d => {
        if (d && d.limit) setSettings(prev => ({ ...prev, dailyWithdrawLimit: d.limit }));
      })
      .catch(() => {});
  }, []);

  const handleCopy = (val, field) => {
    navigator.clipboard.writeText(val);
    setCopiedField(field);
    setTimeout(() => setCopiedField(''), 2000);
  };

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

      if (settings.dailyWithdrawLimit) {
        await fetch(`${API_BASE}/api/admin/limits`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ limit: settings.dailyWithdrawLimit })
        });
      }

      if (data.success) {
        setToast({ show: true, type: 'success', message: '✅ সেটিংস সফলভাবে সেভ ও লাইভ বটে প্রয়োগ করা হয়েছে!' });
      } else {
        setToast({ show: true, type: 'error', message: data.error || 'Failed to save settings.' });
      }
    } catch (err) {
      setToast({ show: true, type: 'error', message: 'Error: ' + err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6 animate-in fade-in duration-300">
      <Toast {...toast} onClose={() => setToast({ ...toast, show: false })} />

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
          <Settings size={20} />
        </div>
        <div>
          <h2 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            বট সেটিংস ও রেট কনফিগারেশন (Bot Settings)
          </h2>
          <p className="text-xs text-slate-400">
            অ্যাডমিন পেমেন্ট নম্বর, দৈনিক ক্যাশআউট লিমিট ও টেলিগ্রাম চ্যানেল/গ্রুপ পরিচালনা করুন
          </p>
        </div>
      </div>

      {/* Card 1: Fixed Exchange Rates Overview */}
      <div className={`p-6 rounded-3xl border ${
        isDark ? 'bg-[#0f0c22] border-purple-900/30 shadow-xl' : 'bg-white border-slate-200 shadow-md'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-purple-400" />
            <h3 className="text-xs font-black uppercase text-purple-400 tracking-wider">
              বর্তমান ফিক্সড এক্সচেঞ্জ রেট (Fixed Exchange Rates)
            </h3>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
            অটো-কনভার্সন চালু
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* GRAM Card */}
          <div className="p-5 rounded-2xl bg-purple-500/10 border border-purple-500/20 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">GRAM Rate</span>
              <Gem size={18} className="text-purple-400" />
            </div>
            <div className="text-2xl font-black text-purple-400 mt-2 font-mono">1 GRAM = 220 ৳ BDT</div>
            <p className="text-[11px] text-slate-400 mt-1">বাই ও সেল উভয় ক্ষেত্রে এই রেট অনুযায়ী টাকা হিসাব হবে।</p>
          </div>

          {/* USDT Card */}
          <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">USDT Rate</span>
              <DollarSign size={18} className="text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400 mt-2 font-mono">1 USDT = 130 ৳ BDT</div>
            <p className="text-[11px] text-slate-400 mt-1">বাই ও সেল উভয় ক্ষেত্রে এই রেট অনুযায়ী টাকা হিসাব হবে।</p>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Card 2: Admin Receiving Accounts */}
        <div className={`p-6 rounded-3xl border space-y-4 ${
          isDark ? 'bg-[#0f0c22] border-purple-900/30 shadow-xl' : 'bg-white border-slate-200 shadow-md'
        }`}>
          <div className="flex items-center gap-2 text-cyan-400 font-black text-xs uppercase tracking-wider">
            <CreditCard size={16} />
            <span>অ্যাডমিন পেমেন্ট রিসিভিং অ্যাকাউন্ট (bKash & Nagad)</span>
          </div>
          <p className="text-xs text-slate-400">
            ইউজাররা ক্রিপ্টো কিনতে বা ব্যালেন্স ডিপোজিট করতে এই নম্বরগুলোতে টাকা সেন্ডমানি বা ক্যাশ-ইন করবে।
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* bKash Number */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase text-slate-400">
                অ্যাডমিন বিকাশ পার্সোনাল নম্বর (bKash Personal)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={settings.adminBkash}
                  onChange={e => setSettings({ ...settings, adminBkash: e.target.value })}
                  placeholder="017xxxxxxxx"
                  className={`w-full p-3.5 pr-10 rounded-xl font-mono font-bold text-sm border outline-none ${
                    isDark ? 'bg-slate-950 border-purple-900/40 text-white focus:border-purple-500' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => handleCopy(settings.adminBkash, 'bkash')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                  title="কপি করুন"
                >
                  {copiedField === 'bkash' ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            {/* Nagad Number */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase text-slate-400">
                অ্যাডমিন নগদ পার্সোনাল নম্বর (Nagad Personal)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={settings.adminNagad}
                  onChange={e => setSettings({ ...settings, adminNagad: e.target.value })}
                  placeholder="018xxxxxxxx"
                  className={`w-full p-3.5 pr-10 rounded-xl font-mono font-bold text-sm border outline-none ${
                    isDark ? 'bg-slate-950 border-purple-900/40 text-white focus:border-purple-500' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => handleCopy(settings.adminNagad, 'nagad')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                  title="কপি করুন"
                >
                  {copiedField === 'nagad' ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Cashout Limits & Restrictions */}
        <div className={`p-6 rounded-3xl border space-y-4 ${
          isDark ? 'bg-[#0f0c22] border-purple-900/30 shadow-xl' : 'bg-white border-slate-200 shadow-md'
        }`}>
          <div className="flex items-center gap-2 text-emerald-400 font-black text-xs uppercase tracking-wider">
            <Sliders size={16} />
            <span>দৈনিক উইথড্র লিমিট (Daily Cashout Limit)</span>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase text-slate-400">
              একজন ইউজার দৈনিক সর্বোচ্চ কত টাকা উইথড্র করতে পারবেন (BDT Limit)
            </label>
            <input
              type="number"
              value={settings.dailyWithdrawLimit}
              onChange={e => setSettings({ ...settings, dailyWithdrawLimit: parseInt(e.target.value) || 0 })}
              className={`w-full p-3.5 rounded-xl font-mono font-bold text-sm border outline-none ${
                isDark ? 'bg-slate-950 border-purple-900/40 text-white focus:border-purple-500' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
              required
            />
            <p className="text-[11px] text-slate-500">
              ইউজার দৈনিক এই সীমার বেশি টাকা উইথড্র করার রিকোয়েস্ট পাঠাতে পারবে না।
            </p>
          </div>
        </div>

        {/* Card 4: Telegram Channels & Groups */}
        <div className={`p-6 rounded-3xl border space-y-4 ${
          isDark ? 'bg-[#0f0c22] border-purple-900/30 shadow-xl' : 'bg-white border-slate-200 shadow-md'
        }`}>
          <div className="flex items-center gap-2 text-indigo-400 font-black text-xs uppercase tracking-wider">
            <Send size={16} />
            <span>টেলিগ্রাম চ্যানেল ও নোটিফিকেশন গ্রুপ (Telegram Community)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* User Log Group */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase text-slate-400">
                নতুন ইউজার জয়েন নোটিফিকেশন গ্রুপ আইডি
              </label>
              <input
                type="text"
                value={settings.userLogGroupId || ''}
                onChange={e => setSettings({ ...settings, userLogGroupId: e.target.value })}
                placeholder="যেমন: -100xxxxxxxxxx"
                className={`w-full p-3.5 rounded-xl font-mono font-bold text-sm border outline-none ${
                  isDark ? 'bg-slate-950 border-purple-900/40 text-white focus:border-purple-500' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
              <p className="text-[10px] text-slate-500">
                💡 গ্রুপে গিয়ে <code>/setusers</code> কমান্ড পাঠিয়েও সেট করতে পারবেন।
              </p>
            </div>

            {/* Payout Channel */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase text-slate-400">
                পেমেন্ট প্রুফ / পে-আউট চ্যানেল
              </label>
              <input
                type="text"
                value={settings.payoutGroupId || '@bd_trust_pay_payout'}
                onChange={e => setSettings({ ...settings, payoutGroupId: e.target.value })}
                placeholder="@bd_trust_pay_payout"
                className={`w-full p-3.5 rounded-xl font-mono font-bold text-sm border outline-none ${
                  isDark ? 'bg-slate-950 border-purple-900/40 text-white focus:border-purple-500' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
              <p className="text-[10px] text-slate-500">
                উইথড্র বা পেমেন্ট সম্পন্ন হলে এই চ্যানেলে অটোমেটিক প্রুফ পোস্ট যাবে।
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 disabled:opacity-50"
        >
          {saving ? <RefreshCw size={18} className="animate-spin" /> : <Check size={18} />}
          <span>সেটিংস সেভ ও প্রয়োগ করুন (Save & Apply Settings)</span>
        </button>
      </form>
    </div>
  );
}


// =========================================================================
// 8. FRAUD LOGS & SECURITY COMPONENT
// =========================================================================
function FraudLogs() {
  const { data, refresh, refreshing } = useBotData();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Security Logs & Fraud Detection
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Audit logs for suspicious transactions, duplicate TrxIDs, and failed payment submissions.
          </p>
        </div>
        <button
          onClick={refresh}
          className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            isDark ? 'bg-purple-950/30 border-purple-800/40 text-purple-300' : 'bg-white border-slate-200 text-slate-700 shadow-sm'
          }`}
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className={`rounded-3xl border overflow-hidden ${
        isDark ? 'bg-[#0f0c22] border-purple-900/30 shadow-xl' : 'bg-white border-slate-200 shadow-md'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className={`border-b ${isDark ? 'bg-purple-950/30 border-purple-900/40 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
              <tr>
                <th className="p-4 font-black uppercase">Event Type</th>
                <th className="p-4 font-black uppercase">Target User</th>
                <th className="p-4 font-black uppercase">TrxID / Details</th>
                <th className="p-4 font-black uppercase">Timestamp</th>
                <th className="p-4 font-black uppercase text-right">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/20">
              {(data.failedScreenshots || []).map((f, i) => (
                <tr key={i} className={`transition-colors ${isDark ? 'hover:bg-purple-950/20' : 'hover:bg-slate-50'}`}>
                  <td className="p-4 font-bold text-rose-400">Failed / Duplicate TrxID</td>
                  <td className="p-4 font-mono font-bold text-purple-400">{f.userId || 'N/A'}</td>
                  <td className="p-4 font-mono text-slate-300">{f.trxId || f.reason || 'Verification Failed'}</td>
                  <td className="p-4 text-slate-500 font-mono text-[11px]">{formatTimestamp(f.timestamp)}</td>
                  <td className="p-4 text-right">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-rose-500/15 text-rose-400 border border-rose-500/30">
                      High Alert
                    </span>
                  </td>
                </tr>
              ))}
              {(!data.failedScreenshots || data.failedScreenshots.length === 0) && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 font-bold">
                    No fraud incidents or failed transactions detected. System secure!
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

// =========================================================================
// 9. MOCK TRX TESTING TOOL
// =========================================================================
function MockTrxTool() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [trxId, setTrxId] = useState('');
  const [amount, setAmount] = useState('100');
  const [method, setMethod] = useState('bKash');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const generateRandomTrx = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const len = method === 'bKash' ? 10 : 8;
    let res = '';
    for (let i = 0; i < len; i++) res += chars.charAt(Math.floor(Math.random() * chars.length));
    setTrxId(res);
  };

  const handleSimulate = async (e) => {
    e.preventDefault();
    if (!trxId || !amount) {
      alert("Enter TrxID and Amount");
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
          method
        })
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Mock SMS & TrxID Simulator
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Simulate incoming bKash or Nagad payment SMS directly into bot database for end-to-end testing.
        </p>
      </div>

      <form onSubmit={handleSimulate} className={`p-8 rounded-3xl border space-y-6 ${
        isDark ? 'bg-[#0f0c22] border-purple-900/30 shadow-xl' : 'bg-white border-slate-200 shadow-md'
      }`}>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-400">
              TrxID (Alphanumeric)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={trxId}
                onChange={e => setTrxId(e.target.value.toUpperCase())}
                placeholder="e.g. 9B7X2K4L10"
                className={`w-full p-3.5 rounded-xl font-mono font-bold text-sm border outline-none uppercase ${
                  isDark ? 'bg-slate-950 border-purple-900/40 text-white focus:border-purple-500' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
                required
              />
              <button
                type="button"
                onClick={generateRandomTrx}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 whitespace-nowrap cursor-pointer"
              >
                Random
              </button>
            </div>
          </div>

          <div className="w-40">
            <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-400">
              Amount (BDT)
            </label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className={`w-full p-3.5 rounded-xl font-mono font-bold text-sm border outline-none ${
                isDark ? 'bg-slate-950 border-purple-900/40 text-white focus:border-purple-500' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-400">
            Payment Provider
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMethod('bKash')}
              className={`py-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                method === 'bKash' 
                  ? 'bg-pink-500/20 border-pink-500 text-pink-300' 
                  : isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              bKash (10 Chars)
            </button>
            <button
              type="button"
              onClick={() => setMethod('nagad')}
              className={`py-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                method === 'nagad' 
                  ? 'bg-orange-500/20 border-orange-500 text-orange-300' 
                  : isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              Nagad (8 Chars)
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? <RefreshCw size={15} className="animate-spin" /> : <Zap size={15} />}
          <span>Simulate & Store TrxID</span>
        </button>

        {result && (
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs font-mono space-y-1">
            <div className="font-bold text-emerald-400">✓ Simulated Successfully!</div>
            <div>TrxID: {result.trxId}</div>
            <div>Amount: ৳{result.amount} BDT</div>
            <div>Auto Verified: {result.autoVerified ? 'YES' : 'Stored in database waiting for user input'}</div>
          </div>
        )}
      </form>
    </div>
  );
}

// =========================================================================
// 10. CREATE TRX MODAL (GLOBAL MODAL)
// =========================================================================
function CreateTrxModal({ isOpen, onClose }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [trxId, setTrxId] = useState('');
  const [amount, setAmount] = useState('100');
  const [method, setMethod] = useState('bKash');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  if (!isOpen) return null;

  const handleGenerateRandom = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const len = method === 'bKash' ? 10 : 8;
    let res = '';
    for (let i = 0; i < len; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setTrxId(res);
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!trxId || !amount) {
      alert('Enter TrxID and BDT Amount');
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
              <h3 className="text-lg font-black">Create Test TrxID</h3>
              <p className="text-xs text-slate-400">Simulate incoming payment to verify orders instantly</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSend} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">
              TrxID ({method === 'bKash' ? '10' : '8'} Characters)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={trxId}
                onChange={e => setTrxId(e.target.value.toUpperCase())}
                placeholder={method === 'bKash' ? "e.g. 9B7X2K4L10" : "e.g. 9B7X2K4L"}
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
                🎲 Random
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">
              Amount (BDT)
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
              Payment Provider
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => { setMethod('bKash'); }}
                className={`py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  method === 'bKash' 
                    ? 'bg-pink-500/20 border-pink-500 text-pink-300' 
                    : isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                bKash
              </button>
              <button
                type="button"
                onClick={() => { setMethod('nagad'); }}
                className={`py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  method === 'nagad' 
                    ? 'bg-orange-500/20 border-orange-500 text-orange-300' 
                    : isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                Nagad
              </button>
            </div>
          </div>

          {result && (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs font-mono space-y-1">
              <div className="font-bold flex items-center gap-1 text-emerald-400">
                <CheckCircle2 size={13} /> {result.message}
              </div>
              <div>TrxID: <b>{result.trxId}</b> (৳{result.amount} BDT)</div>
              {result.autoVerified ? (
                <div className="text-cyan-300 font-bold">⚡ Order auto-verified and ready to dispatch!</div>
              ) : (
                <div className="text-slate-400">Ready in database. Enter this TrxID in bot or mini app to test!</div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-3 rounded-xl text-xs font-bold border cursor-pointer ${
                isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Close
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl text-xs font-black bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? <RefreshCw size={14} className="animate-spin" /> : <PlusCircle size={14} />}
              <span>Save TrxID</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =========================================================================
// MOBILE DEVICE BLOCK SCREEN (DESKTOP ONLY ENFORCEMENT)
// =========================================================================
function MobileBlockedScreen() {
  return (
    <div className="min-h-screen bg-[#070510] text-slate-100 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-[#110d24]/95 border border-rose-500/35 rounded-3xl p-8 text-center shadow-2xl shadow-rose-950/30 backdrop-blur-xl relative z-10">
        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-rose-500/15 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-500/10">
          <ShieldAlert size={32} />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-[10px] font-black uppercase tracking-widest mb-3">
          <Lock size={11} /> Security Policy Enforced
        </div>

        <h1 className="text-xl font-black text-white tracking-tight mb-2">
          Desktop Access Only
        </h1>
        <p className="text-xs text-slate-400 leading-relaxed mb-6">
          For strict security reasons, the <span className="text-purple-300 font-bold">Trust Pay Admin Control Center</span> is permanently disabled on mobile phones, tablets, and wallet WebViews. Please sign in from an authorized desktop computer.
        </p>

        <div className="space-y-2.5">
          <a
            href="/app"
            className="w-full py-3 px-4 rounded-xl font-black text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all"
          >
            <Zap size={14} />
            <span>Open Trust Pay Web App</span>
          </a>
          <a
            href="https://t.me/bd_trust_pay_bot"
            className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-purple-950/40 border border-purple-800/40 text-purple-300 hover:bg-purple-900/40 flex items-center justify-center gap-2 transition-all"
          >
            <ExternalLink size={13} />
            <span>Return to Telegram Bot</span>
          </a>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// EXECUTIVE ADMIN LOGIN SCREEN (DATABASE-BACKED GMAIL & PASSWORD)
// =========================================================================
function AdminLoginScreen({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (isMobileDevice()) {
      setError('Mobile devices are strictly forbidden from accessing the Admin Panel.');
      return;
    }
    if (!email.trim() || !password) {
      setError('Please enter both Admin Gmail and Password.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.token) {
        setError(data.error || 'Invalid Admin Gmail or Password. Access denied.');
      } else {
        localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
        localStorage.setItem(ADMIN_EMAIL_KEY, data.email || email.trim());
        onLoginSuccess(data.token);
      }
    } catch (err) {
      setError('Failed to connect to security server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070510] text-slate-100 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient Background Glows */}
      <div className="absolute -top-40 -left-40 w-[480px] h-[480px] bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[480px] h-[480px] bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-[#0d0a1f]/95 border border-purple-500/30 rounded-3xl p-8 shadow-2xl shadow-purple-950/50 backdrop-blur-xl relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-7">
          <div className="relative mb-3.5">
            <img
              src="/logo.png"
              alt="Trust Pay Logo"
              onError={(e) => { e.target.onerror = null; e.target.src = '/app/trustpaylogo.png'; }}
              className="w-16 h-16 rounded-2xl object-cover shadow-xl shadow-purple-600/35 border border-purple-500/40"
            />
            <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-[#0d0a1f] flex items-center justify-center">
              <ShieldCheck size={11} className="text-white" />
            </span>
          </div>

          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight">Trust Pay</h1>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-gradient-to-r from-purple-600 to-indigo-600 text-white tracking-widest">
              PRO ADMIN
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Protected Executive Treasury & Order Control Center
          </p>
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-500/30 text-[10px] font-bold text-purple-300">
            <Lock size={11} className="text-purple-400" />
            <span>Database-Verified Desktop Security</span>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs font-bold flex items-center gap-2.5">
            <AlertTriangle size={16} className="text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
              Admin Gmail Address
            </label>
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="trustpaybot@gmail.com"
              className="w-full px-4 py-3 rounded-xl text-sm font-bold bg-[#14102c] border border-purple-800/40 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400">
                Master Password
              </label>
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="text-[10px] font-bold text-purple-400 hover:text-purple-300 cursor-pointer"
              >
                {showPass ? 'Hide' : 'Show'}
              </button>
            </div>
            <input
              type={showPass ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-4 py-3 rounded-xl text-sm font-bold bg-[#14102c] border border-purple-800/40 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 mt-2 rounded-xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw size={15} className="animate-spin" />
                <span>Verifying Credentials...</span>
              </>
            ) : (
              <>
                <Unlock size={15} />
                <span>Unlock Admin Control Center</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-purple-900/30 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
          <span className="flex items-center gap-1.5">
            <Shield size={12} className="text-emerald-400" /> Firestore Auth Guard
          </span>
          <span>Desktop Only Mode</span>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// MAIN EXPORT
// =========================================================================
export default function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('trustpay_admin_theme') || 'dark';
  });
  const [isCreateTrxOpen, setIsCreateTrxOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => isMobileDevice());
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem(ADMIN_TOKEN_KEY) || '');
  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    localStorage.setItem('trustpay_admin_theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    const checkMobile = () => {
      if (isMobileDevice()) setIsMobile(true);
    };
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleUnauth = () => {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      setAdminToken('');
    };
    window.addEventListener('trustpay-admin-unauth', handleUnauth);
    return () => window.removeEventListener('trustpay-admin-unauth', handleUnauth);
  }, []);

  useEffect(() => {
    let active = true;
    const verifyExistingSession = async () => {
      if (isMobileDevice()) {
        if (active) setAuthChecking(false);
        return;
      }
      const savedToken = localStorage.getItem(ADMIN_TOKEN_KEY);
      if (!savedToken) {
        if (active) {
          setAdminToken('');
          setAuthChecking(false);
        }
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/api/admin/session`, {
          headers: { Authorization: `Bearer ${savedToken}` }
        });
        if (!res.ok) {
          localStorage.removeItem(ADMIN_TOKEN_KEY);
          if (active) setAdminToken('');
        } else {
          if (active) setAdminToken(savedToken);
        }
      } catch (e) {
        // Keep token on transient network glitch, backend still validates every request
      } finally {
        if (active) setAuthChecking(false);
      }
    };
    verifyExistingSession();
    return () => { active = false; };
  }, []);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_EMAIL_KEY);
    setAdminToken('');
  };

  // 1. Strict Mobile Block (Desktop-Only Admin Panel)
  if (isMobile) {
    return <MobileBlockedScreen />;
  }

  // 2. Initial Auth Verification Spinner
  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#070510] text-slate-200 flex flex-col items-center justify-center gap-3">
        <RefreshCw size={28} className="animate-spin text-purple-400" />
        <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">Verifying Admin Security Session...</p>
      </div>
    );
  }

  // 3. Require Admin Login (Database-backed Gmail & Password)
  if (!adminToken) {
    return <AdminLoginScreen onLoginSuccess={(token) => setAdminToken(token)} />;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <TonConnectUIProvider manifestUrl={`${API_BASE}/tonconnect-manifest.json`}>
        <Router>
          <Layout
            onOpenCreateTrx={() => setIsCreateTrxOpen(true)}
            onLogout={handleLogout}
          >
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
