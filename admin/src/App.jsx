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
  BadgeCheck
} from 'lucide-react';
import { TonConnectUIProvider, TonConnectButton, useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';

export const API_BASE = (function() {
  if (typeof window === 'undefined') return 'https://maruf-teach-bot.onrender.com';
  if (window.location.hostname.includes('onrender.com')) return window.location.origin;
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  return 'https://maruf-teach-bot.onrender.com';
})();

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
function Sidebar({ onOpenCreateTrx, pendingBuysCount, pendingWithdrawCount }) {
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

        <a
          href="https://t.me/bd_trust_pay_bot"
          target="_blank"
          rel="noreferrer"
          className={`w-full py-2 px-3 rounded-xl font-bold text-[11px] border flex items-center justify-center gap-1.5 transition-all ${
            isDark 
              ? 'bg-purple-950/30 border-purple-800/30 text-purple-300 hover:bg-purple-900/40' 
              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ExternalLink size={13} />
          <span>Open Telegram Bot</span>
        </a>
      </div>
    </aside>
  );
}

// Layout Wrapper
function Layout({ children, onOpenCreateTrx }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { orders } = useOrdersData();

  const pendingBuysCount = orders.buys.filter(b => b.status === 'pending' || b.status === 'verified').length;
  const pendingWithdrawCount = orders.withdrawals.filter(w => w.status === 'pending' || !w.status).length;

  return (
    <div className={`min-h-screen flex ${isDark ? 'bg-[#060411] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <Sidebar 
        onOpenCreateTrx={onOpenCreateTrx} 
        pendingBuysCount={pendingBuysCount}
        pendingWithdrawCount={pendingWithdrawCount}
      />
      <main className="flex-1 ml-72 p-8 transition-colors duration-200">
        <div className="max-w-7xl mx-auto">
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
// 2. BOT WALLET / TREASURY COMPONENT
// =========================================================================
function BotWallet() {
  const { data, refresh, refreshing } = useBotData();
  const { orders } = useOrdersData();
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

  const copyAddress = (addr) => {
    navigator.clipboard.writeText(addr);
    setToast({ show: true, type: 'success', message: 'Address copied to clipboard!' });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <Toast {...toast} onClose={() => setToast({ ...toast, show: false })} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-widest mb-1">
            <Wallet size={14} /> Bot Treasury Vault & Reserves
          </div>
          <h2 className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Treasury & Crypto Reserves
          </h2>
          <p className={`text-xs mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Live monitoring of bot on-chain reserves: GRAM and USDT balances with real-time transaction logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className={`px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 ${
            isDark ? 'bg-cyan-950/40 border-cyan-800/40 text-cyan-300' : 'bg-white border-cyan-200 text-cyan-800'
          }`}>
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            Gas Balance: {data.tonNativeBalance || data.tonBalance || '0.00'} TON
          </div>

          <a
            href={`https://tonviewer.com/${data.tonAddress}`}
            target="_blank"
            rel="noreferrer"
            className={`px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
              isDark 
                ? 'bg-purple-950/30 border-purple-800/40 text-purple-300 hover:bg-purple-900/40' 
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-sm'
            }`}
          >
            <ExternalLink size={14} />
            <span>Tonviewer Explorer</span>
          </a>

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
      </div>

      {/* 2 PRIMARY HERO CARDS: GRAM & USDT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* CARD 1: GRAM BALANCE */}
        <div className={`p-8 rounded-[2.5rem] border relative overflow-hidden transition-all duration-300 ${
          isDark 
            ? 'bg-gradient-to-br from-[#1c123d] via-[#150d30] to-[#0c081e] border-purple-500/30 shadow-[0_20px_50px_rgba(147,51,234,0.18)]' 
            : 'bg-gradient-to-br from-purple-50 via-indigo-50 to-white border-purple-200 shadow-xl'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <Gem size={24} />
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-purple-400">
                  GRAM Balance
                </span>
                <div className="text-[11px] font-bold text-slate-400">
                  Telegram MiniApp Liquidity
                </div>
              </div>
            </div>

            <span className="px-3 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/30">
              Rate: ৳220 / GRAM
            </span>
          </div>

          <div className="flex items-baseline gap-3 my-4">
            <span className={`text-5xl md:text-6xl font-black tracking-tight font-mono ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              {data.tonNativeBalance || data.gramBalance || '0.00'}
            </span>
            <span className="text-2xl font-black text-purple-400">
              GRAM
            </span>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-purple-900/30 text-xs">
            <span className="font-bold text-purple-300">
              ≈ ৳{(parseFloat(data.gramBalance || 0) * 220).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BDT
            </span>
            <button
              onClick={() => copyAddress(data.tonAddress)}
              className="px-3 py-1 rounded-lg text-slate-300 hover:text-white bg-slate-900/50 border border-slate-700/50 flex items-center gap-1 font-bold cursor-pointer"
            >
              <Copy size={11} /> Copy Address
            </button>
          </div>
        </div>

        {/* CARD 2: USDT BALANCE */}
        <div className={`p-8 rounded-[2.5rem] border relative overflow-hidden transition-all duration-300 ${
          isDark 
            ? 'bg-gradient-to-br from-[#0e2422] via-[#091a18] to-[#040e0d] border-emerald-500/30 shadow-[0_20px_50px_rgba(16,185,129,0.18)]' 
            : 'bg-gradient-to-br from-emerald-50 via-teal-50 to-white border-emerald-200 shadow-xl'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CircleDollarSign size={24} />
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                  USDT Balance
                </span>
                <div className="text-[11px] font-bold text-slate-400">
                  Jetton USDT Reserve
                </div>
              </div>
            </div>

            <span className="px-3 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              Rate: ৳130 / USDT
            </span>
          </div>

          <div className="flex items-baseline gap-3 my-4">
            <span className={`text-5xl md:text-6xl font-black tracking-tight font-mono ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              {data.tonUsdtBalance || '0.00'}
            </span>
            <span className="text-2xl font-black text-emerald-400">
              USDT
            </span>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-emerald-900/30 text-xs">
            <span className="font-bold text-emerald-300">
              ≈ ৳{(parseFloat(data.tonUsdtBalance || 0) * 130).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BDT
            </span>
            <button
              onClick={() => copyAddress(data.tonAddress)}
              className="px-3 py-1 rounded-lg text-slate-300 hover:text-white bg-slate-900/50 border border-slate-700/50 flex items-center gap-1 font-bold cursor-pointer"
            >
              <Copy size={11} /> Copy Address
            </button>
          </div>
        </div>

      </div>

      {/* 2 COLUMNS OF LIVE TRANSACTIONS BELOW THE CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <LiveOrderFeed
          title="GRAM Live Orders"
          asset="GRAM"
          icon={<Gem size={20} />}
          items={gramBuys}
          isDark={isDark}
        />

        <LiveOrderFeed
          title="USDT Live Orders"
          asset="USDT"
          icon={<CircleDollarSign size={20} />}
          items={usdtBuys}
          isDark={isDark}
        />
      </div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {processedUsers.map((u, idx) => {
            const rank = idx + 1;
            const isRank1 = sortOrder === 'desc' && rank === 1;
            const isRank2 = sortOrder === 'desc' && rank === 2;
            const isRank3 = sortOrder === 'desc' && rank === 3;

            return (
              <div
                key={u.chatId}
                onClick={() => handleOpenUser(u)}
                className={`group p-5 rounded-3xl border transition-all duration-300 cursor-pointer relative overflow-hidden flex flex-col justify-between gap-4 hover:-translate-y-1 hover:shadow-2xl ${
                  isRank1
                    ? isDark 
                      ? 'bg-gradient-to-br from-[#1a1338] via-[#120f29] to-[#0d0a1f] border-amber-500/50 shadow-amber-500/10' 
                      : 'bg-gradient-to-br from-amber-50/90 to-white border-amber-300 shadow-amber-200/50'
                    : isDark 
                      ? 'bg-[#0f0c22] border-purple-900/30 hover:border-purple-500/50 shadow-xl' 
                      : 'bg-white border-slate-200 hover:border-indigo-300 shadow-md'
                }`}
              >
                {/* Background Ambient Glow for Rank 1 */}
                {isRank1 && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                )}

                {/* Top Section: User Left Details & Right Badges */}
                <div className="flex items-start justify-between gap-3">
                  {/* Left Side: Avatar & Identity Details */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Telegram Avatar with Fallback to Initials */}
                    <div className="relative shrink-0">
                      <img 
                        src={u.photoUrl || `${API_BASE}/api/admin/user-avatar/${u.chatId}`} 
                        alt={u.firstName || u.username || 'User'} 
                        className="w-13 h-13 rounded-2xl object-cover ring-2 ring-purple-500/30 shadow-md"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.parentElement?.querySelector('.avatar-fallback');
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                      <div 
                        className={`avatar-fallback w-13 h-13 rounded-2xl items-center justify-center font-black text-lg shadow-md ring-2 ${
                          isRank1 ? 'bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-950 ring-amber-400/50' :
                          isRank2 ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-slate-950 ring-slate-300/40' :
                          isRank3 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white ring-amber-600/40' :
                          'bg-gradient-to-br from-indigo-600 to-purple-700 text-white ring-purple-500/30'
                        }`}
                        style={{ display: 'none' }}
                      >
                        {isRank1 ? <Crown size={22} className="text-slate-950" /> : (u.firstName || u.username || u.chatId || 'U').slice(0, 1).toUpperCase()}
                      </div>

                      {/* Rank Tag */}
                      <div className={`absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-black border flex items-center gap-0.5 shadow-sm ${
                        isRank1 ? 'bg-amber-400 text-slate-950 border-amber-300' :
                        isRank2 ? 'bg-slate-300 text-slate-950 border-slate-200' :
                        isRank3 ? 'bg-amber-700 text-white border-amber-600' :
                        'bg-slate-900 text-purple-300 border-purple-800/40'
                      }`}>
                        #{rank}
                      </div>
                    </div>

                    {/* Identity: Telegram Name, Telegram Username, Bot ID, Balance */}
                    <div className="space-y-1 min-w-0">
                      {/* Telegram Name */}
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`font-black text-sm truncate group-hover:text-cyan-400 transition-colors ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}>
                          {u.firstName || 'Telegram User'}
                        </span>
                      </div>

                      {/* Telegram Username */}
                      <div className="flex items-center gap-1.5 text-[11px] min-w-0">
                        <span className="text-cyan-400 font-bold shrink-0">Username:</span>
                        {u.username ? (
                          <span className="font-semibold text-cyan-300 truncate">
                            @{u.username}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic text-[10px]">
                            (No username)
                          </span>
                        )}
                      </div>

                      {/* Bot ID & Telegram ID */}
                      <div className="flex items-center gap-1.5 text-[11px] font-mono">
                        <span className="text-purple-400 font-bold shrink-0">Bot ID:</span>
                        <span className={`px-1.5 py-0.2 rounded font-bold border ${
                          isDark ? 'bg-purple-950/60 border-purple-800/50 text-purple-300' : 'bg-purple-50 border-purple-200 text-purple-700'
                        }`}>
                          {u.mbsId}
                        </span>
                        <span className="text-slate-500 text-[10px]">({u.chatId})</span>
                      </div>

                      {/* Account Balance */}
                      <div className="pt-0.5 flex items-baseline gap-1.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400">ব্যালেন্স:</span>
                        <span className="text-base font-black text-emerald-400 font-mono tracking-tight drop-shadow-sm">
                          ৳ {u.balanceNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BDT
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Badges */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    {/* Verification Status */}
                    {u.isVerified ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.8 rounded-xl text-[10px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <BadgeCheck size={12} />
                        <span>ভেরিফাইড</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.8 rounded-xl text-[10px] font-black bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        <Clock size={12} />
                        <span>আন-ভেরিফাইড</span>
                      </span>
                    )}

                    {/* Account Status (Banned / Restricted) */}
                    {u.status === 'banned' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/40">
                        <Ban size={10} />
                        <span>ব্যান করা</span>
                      </span>
                    ) : u.status === 'restricted' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-orange-500/20 text-orange-400 border border-orange-500/40">
                        <Lock size={10} />
                        <span>রেস্ট্রিক্টেড</span>
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Bottom Card Footer: Action Button */}
                <div className={`pt-3 border-t flex items-center justify-between text-xs ${
                  isDark ? 'border-purple-900/30' : 'border-slate-100'
                }`}>
                  <span className="text-[11px] text-slate-500 font-mono">
                    যুক্ত হয়েছে: {formatTimestamp(u.createdAt || u.joinedAt)}
                  </span>
                  <div className="flex items-center gap-1 text-purple-400 group-hover:text-purple-300 font-bold text-xs">
                    <span>ম্যানেজ করুন</span>
                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
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
// MAIN EXPORT
// =========================================================================
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
