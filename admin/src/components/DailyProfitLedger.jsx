import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Coins, 
  ShieldCheck, 
  Calendar, 
  Send, 
  RefreshCw, 
  CreditCard, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  PiggyBank, 
  Sparkles, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet, 
  Filter,
  Check,
  Copy,
  BarChart3
} from 'lucide-react';

export default function DailyProfitLedger({ useThemeHook = () => ({ theme: 'dark' }), apiBase }) {
  const { theme } = useThemeHook();
  const isDark = theme === 'dark';

  const [ledgerData, setLedgerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sendingReport, setSendingReport] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [selectedDateFilter, setSelectedDateFilter] = useState('all'); // 'all' | 'today' | 'yesterday' | 'week' | 'month'
  const [copiedKey, setCopiedKey] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const copyText = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  // Fetch Profit Ledger data
  const fetchLedger = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch(`${apiBase}/api/admin/profit-ledger`, {
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data && data.success) {
        setLedgerData(data);
      }
    } catch (e) {
      console.error("Fetch profit ledger error:", e.message);
      if (isManual) showToast("ডাটা লোড করতে সমস্যা হয়েছে", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [apiBase]);

  // Send Report to Telegram Group
  const handleSendTelegramReport = async (dateKey = null) => {
    setSendingReport(true);
    try {
      const res = await fetch(`${apiBase}/api/admin/send-profit-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateKey })
      });
      const data = await res.json();
      if (data && data.success) {
        showToast(data.message || "টেলিগ্রাম গ্রুপে রিপোর্ট সফলভাবে পাঠানো হয়েছে!");
      } else {
        showToast(data.error || "রিপোর্ট পাঠাতে ব্যর্থ হয়েছে", "error");
      }
    } catch (e) {
      showToast("নেটওয়ার্ক সমস্যা: " + e.message, "error");
    } finally {
      setSendingReport(false);
    }
  };

  const todayData = ledgerData?.today || null;
  const historyList = useMemo(() => ledgerData?.history || [], [ledgerData]);
  const allTime = ledgerData?.allTimeSummary || {};

  // Filter history by period
  const filteredHistory = useMemo(() => {
    if (selectedDateFilter === 'all') return historyList;
    if (selectedDateFilter === 'today') return historyList.slice(0, 1);
    if (selectedDateFilter === 'yesterday') return historyList.slice(1, 2);
    if (selectedDateFilter === 'week') return historyList.slice(0, 7);
    if (selectedDateFilter === 'month') return historyList.slice(0, 30);
    return historyList;
  }, [historyList, selectedDateFilter]);

  // Aggregated totals for filtered history
  const activeMetrics = useMemo(() => {
    if (selectedDateFilter === 'today' && todayData) {
      return {
        grossIncome: todayData.grossIncome || 0,
        totalExpenses: todayData.totalExpenses || 0,
        netProfit: todayData.netProfit || 0,
        recommendedSavings: todayData.recommendedSavingsBdt || 0,
        buyVolume: todayData.buyVolumeBdt || 0,
        sellVolume: todayData.sellVolumeBdt || 0,
        spreadProfit: todayData.tradingSpreadProfit || 0,
        withdrawFees: todayData.withdrawFeesCollected || 0,
        spinCost: todayData.spinRewardsBdt || 0,
        referralCost: todayData.referralBonusesBdt || 0,
        depositVolume: todayData.depositVolumeBdt || 0,
        depositCount: todayData.depositOrdersCount || 0,
        withdrawPaid: todayData.withdrawTotalBdt || 0,
        withdrawCount: todayData.withdrawOrdersCount || 0,
        netCashFlow: todayData.netCashFlowBdt || 0,
        isProfit: (todayData.netProfit || 0) >= 0
      };
    }

    if (selectedDateFilter === 'all') {
      return {
        grossIncome: allTime.totalGrossIncome || 0,
        totalExpenses: allTime.totalExpenses || 0,
        netProfit: allTime.netProfit || 0,
        recommendedSavings: allTime.totalSavings || 0,
        buyVolume: allTime.totalBuyVolumeBdt || 0,
        sellVolume: allTime.totalSellVolumeBdt || 0,
        spreadProfit: allTime.totalSpreadProfit || 0,
        withdrawFees: allTime.totalWithdrawFees || 0,
        spinCost: allTime.totalSpinExpenses || 0,
        referralCost: allTime.totalReferralExpenses || 0,
        depositVolume: allTime.totalDepositVolumeBdt || 0,
        depositCount: allTime.totalDepositCount || 0,
        withdrawPaid: allTime.totalWithdrawPaidBdt || 0,
        withdrawCount: allTime.totalWithdrawCount || 0,
        netCashFlow: allTime.totalNetCashFlowBdt || 0,
        isProfit: (allTime.netProfit || 0) >= 0
      };
    }

    // Sum over filtered history
    let gross = 0, exp = 0, net = 0, sav = 0, buyV = 0, sellV = 0, spread = 0, fees = 0, spin = 0, ref = 0;
    let depV = 0, depC = 0, withV = 0, withC = 0, netCF = 0;
    filteredHistory.forEach(h => {
      gross += Number(h.grossIncome || 0);
      exp += Number(h.totalExpenses || 0);
      net += Number(h.netProfit || 0);
      sav += Number(h.recommendedSavingsBdt || 0);
      buyV += Number(h.buyVolumeBdt || 0);
      sellV += Number(h.sellVolumeBdt || 0);
      spread += Number(h.tradingSpreadProfit || 0);
      fees += Number(h.withdrawFeesCollected || 0);
      spin += Number(h.spinRewardsBdt || 0);
      ref += Number(h.referralBonusesBdt || 0);
      depV += Number(h.depositVolumeBdt || 0);
      depC += Number(h.depositOrdersCount || 0);
      withV += Number(h.withdrawTotalBdt || 0);
      withC += Number(h.withdrawOrdersCount || 0);
      netCF += Number(h.netCashFlowBdt || 0);
    });

    return {
      grossIncome: gross,
      totalExpenses: exp,
      netProfit: net,
      recommendedSavings: sav,
      buyVolume: buyV,
      sellVolume: sellV,
      spreadProfit: spread,
      withdrawFees: fees,
      spinCost: spin,
      referralCost: ref,
      depositVolume: depV,
      depositCount: depC,
      withdrawPaid: withV,
      withdrawCount: withC,
      netCashFlow: netCF,
      isProfit: net >= 0
    };
  }, [selectedDateFilter, todayData, allTime, filteredHistory]);

  return (
    <div className={`p-4 md:p-8 space-y-6 max-w-7xl mx-auto font-sans min-h-screen ${
      isDark ? 'text-slate-100' : 'text-slate-900'
    }`}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl transition-all border ${
          toastMessage.type === 'error'
            ? (isDark ? 'bg-rose-950/90 text-rose-200 border-rose-800' : 'bg-rose-50 text-rose-900 border-rose-200 shadow-lg')
            : (isDark ? 'bg-emerald-950/90 text-emerald-200 border-emerald-800' : 'bg-emerald-50 text-emerald-900 border-emerald-200 shadow-lg')
        }`}>
          {toastMessage.type === 'error' ? <AlertTriangle size={18} className="text-rose-500" /> : <CheckCircle2 size={18} className="text-emerald-500" />}
          <span className="text-sm font-semibold">{toastMessage.msg}</span>
        </div>
      )}

      {/* ─── 1. Header Banner ─────────────────────────────────── */}
      <div className={`p-6 rounded-2xl border relative overflow-hidden backdrop-blur-xl ${
        isDark 
          ? 'bg-gradient-to-r from-purple-950/40 via-slate-900/60 to-emerald-950/30 border-purple-900/30 shadow-2xl'
          : 'bg-gradient-to-r from-purple-50 via-white to-emerald-50 border-purple-100 shadow-sm'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                isDark ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}>
                A-to-Z Financial Audit
              </span>
              <span className={`text-xs flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                <Sparkles size={12} className="text-amber-500" />
                ১ টাকারও নিখুঁত হিসাব
              </span>
            </div>
            <h1 className={`text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <BarChart3 className={isDark ? 'text-emerald-400' : 'text-emerald-600'} size={32} />
              Daily Profit Ledger & Financial Hub
            </h1>
            <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
              প্রতিদিনের ট্রেডিং স্প্রেড, ক্যাশআউট ফি, বোনাস খরচ এবং সেভিংস তহবিলের লাইভ অডিট।
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => handleSendTelegramReport(null)}
              disabled={sendingReport}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer ${
                sendingReport
                  ? (isDark ? 'bg-purple-800/60 text-purple-200 cursor-not-allowed' : 'bg-purple-200 text-purple-700 cursor-not-allowed')
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-500/20 hover:scale-[1.02]'
              }`}
            >
              <Send size={16} className={sendingReport ? 'animate-spin' : ''} />
              {sendingReport ? 'পাঠানো হচ্ছে...' : 'Telegram গ্রুপে রিপোর্ট পাঠান'}
            </button>

            <button
              onClick={() => fetchLedger(true)}
              disabled={refreshing}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                isDark 
                  ? 'bg-slate-800/80 border-slate-700 hover:bg-slate-700 text-slate-300' 
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm'
              }`}
              title="রিফ্রেশ করুন"
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin text-purple-500' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── 2. Top Metric Cards ─────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Card 1: Net Profit */}
        <div className={`p-5 rounded-2xl border transition-all relative overflow-hidden ${
          activeMetrics.isProfit
            ? (isDark ? 'bg-emerald-950/20 border-emerald-500/30 shadow-lg shadow-emerald-950/20' : 'bg-emerald-50/90 border-emerald-200 shadow-sm')
            : (isDark ? 'bg-rose-950/20 border-rose-500/30 shadow-lg shadow-rose-950/20' : 'bg-rose-50/90 border-rose-200 shadow-sm')
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${
              activeMetrics.isProfit 
                ? (isDark ? 'text-emerald-400' : 'text-emerald-800') 
                : (isDark ? 'text-rose-400' : 'text-rose-800')
            }`}>
              {activeMetrics.isProfit ? 'আজকের নিট লাভ (Net Profit)' : 'আজকের নিট ক্ষতি (Net Loss)'}
            </span>
            <div className={`p-2 rounded-xl ${
              activeMetrics.isProfit 
                ? (isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700') 
                : (isDark ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-100 text-rose-700')
            }`}>
              {activeMetrics.isProfit ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-3xl font-black tracking-tight ${
              activeMetrics.isProfit 
                ? (isDark ? 'text-emerald-300' : 'text-emerald-900') 
                : (isDark ? 'text-rose-300' : 'text-rose-900')
            }`}>
              {activeMetrics.isProfit ? '+' : '-'}৳{Math.abs(activeMetrics.netProfit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-xs font-medium ml-1.5 opacity-70">BDT</span>
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs">
              <span className={`px-2 py-0.5 rounded font-black ${
                activeMetrics.isProfit 
                  ? (isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-200') 
                  : (isDark ? 'bg-rose-500/20 text-rose-300' : 'bg-rose-100 text-rose-800 border border-rose-200')
              }`}>
                {activeMetrics.isProfit ? '✓ লাভজনক (PROFIT)' : '✕ ঘাটতি (LOSS)'}
              </span>
              <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                সব খরচ বাদ দিয়ে
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Gross Income */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>
              মোট আয় (Gross Revenue)
            </span>
            <div className={`p-2 rounded-xl ${isDark ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-100 text-purple-700'}`}>
              <DollarSign size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-3xl font-black tracking-tight ${isDark ? 'text-purple-300' : 'text-purple-900'}`}>
              ৳{activeMetrics.grossIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-xs font-medium ml-1.5 opacity-70">BDT</span>
            </div>
            <div className={`flex items-center gap-2 mt-2 text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              <span>স্প্রেড: <b>৳{activeMetrics.spreadProfit.toFixed(0)}</b></span>
              <span>•</span>
              <span>উইথড্র ফি: <b>৳{activeMetrics.withdrawFees.toFixed(0)}</b></span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Expenses */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
              সিস্টেম ব্যয় (Expenses)
            </span>
            <div className={`p-2 rounded-xl ${isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>
              <CreditCard size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-3xl font-black tracking-tight ${isDark ? 'text-amber-300' : 'text-amber-900'}`}>
              ৳{activeMetrics.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-xs font-medium ml-1.5 opacity-70">BDT</span>
            </div>
            <div className={`flex items-center gap-2 mt-2 text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              <span>স্পিন: <b>৳{activeMetrics.spinCost.toFixed(0)}</b></span>
              <span>•</span>
              <span>রেফারেল: <b>৳{activeMetrics.referralCost.toFixed(0)}</b></span>
            </div>
          </div>
        </div>

        {/* Card 4: Recommended Savings */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isDark ? 'bg-indigo-950/20 border-indigo-500/30' : 'bg-indigo-50/90 border-indigo-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-indigo-400' : 'text-indigo-800'}`}>
              সেভিংস তহবিল (Savings - 70%)
            </span>
            <div className={`p-2 rounded-xl ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-700'}`}>
              <PiggyBank size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-3xl font-black tracking-tight ${isDark ? 'text-indigo-300' : 'text-indigo-950'}`}>
              ৳{activeMetrics.recommendedSavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-xs font-medium ml-1.5 opacity-70">BDT</span>
            </div>
            <div className={`flex items-center gap-2 mt-2 text-xs ${isDark ? 'text-indigo-400/80' : 'text-indigo-700 font-semibold'}`}>
              <ShieldCheck size={14} />
              <span>নিরাপদে ব্যাংকে জমানোর সুপারিশ</span>
            </div>
          </div>
        </div>

        {/* Card 5: Net Cash Flow (Add Money vs Withdraw) */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isDark ? 'bg-cyan-950/20 border-cyan-500/30' : 'bg-cyan-50/90 border-cyan-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-cyan-400' : 'text-cyan-800'}`}>
              নিট ক্যাশ ফ্লো (Cash In vs Out)
            </span>
            <div className={`p-2 rounded-xl ${isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-100 text-cyan-700'}`}>
              <Wallet size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-3xl font-black tracking-tight ${isDark ? 'text-cyan-300' : 'text-cyan-950'}`}>
              {activeMetrics.netCashFlow >= 0 ? '+' : '-'}৳{Math.abs(activeMetrics.netCashFlow).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-xs font-medium ml-1.5 opacity-70">BDT</span>
            </div>
            <div className={`flex items-center gap-2 mt-2 text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              <span>ডিপোজিট: <b className={isDark ? 'text-emerald-400' : 'text-emerald-700'}>৳{activeMetrics.depositVolume.toFixed(0)}</b></span>
              <span>•</span>
              <span>উইথড্র: <b className={isDark ? 'text-rose-400' : 'text-rose-700'}>৳{activeMetrics.withdrawPaid.toFixed(0)}</b></span>
            </div>
          </div>
        </div>

      </div>

      {/* ─── 3. Detailed Audit Card (A to Z Breakdown) ───────── */}
      <div className={`p-6 rounded-2xl border backdrop-blur-xl ${
        isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b ${
          isDark ? 'border-slate-800/80' : 'border-slate-200'
        }`}>
          <div>
            <h2 className={`text-lg font-black flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Coins className={isDark ? 'text-purple-400' : 'text-purple-600'} size={20} />
              A-to-Z হিসাবের খুঁটিনাটি (Financial Balance Sheet)
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              গ্যাস ফি সম্পূর্ণ ইউজারের ব্যালেন্স থেকে কর্তিত এবং উইথড্র ফি সরাসরি আপনার পকেটে আয় হিসেবে যুক্ত।
            </p>
          </div>

          {/* Date Filter Tabs */}
          <div className={`flex items-center gap-1.5 p-1 rounded-xl border ${
            isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            {[
              { id: 'all', label: 'সব দিন (All)' },
              { id: 'today', label: 'আজকে (Today)' },
              { id: 'yesterday', label: 'গতকাল' },
              { id: 'week', label: '৭ দিন' },
              { id: 'month', label: '৩০ দিন' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedDateFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedDateFilter === tab.id
                    ? 'bg-purple-600 text-white shadow'
                    : (isDark 
                        ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70')
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Detailed Two-Column Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          
          {/* Left: আয়ের খাত (Inflows / Revenues) */}
          <div className="space-y-3">
            <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-wider pb-2 border-b ${
              isDark ? 'text-emerald-400 border-emerald-900/30' : 'text-emerald-800 border-emerald-200'
            }`}>
              <ArrowDownLeft size={16} />
              আয়ের উৎস সমূহ (Inflows & Revenue Streams)
            </div>

            <div className="space-y-2.5 text-sm">
              <div className={`flex justify-between items-center py-2.5 px-3.5 rounded-xl border ${
                isDark ? 'bg-slate-950/40 border-slate-800/60' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className={isDark ? 'text-slate-300' : 'text-slate-700 font-medium'}>🛒 মোট ক্রিপ্টো ক্রয় ভলিউম (Buy Inflow)</span>
                <span className={`font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>৳{activeMetrics.buyVolume.toLocaleString()} BDT</span>
              </div>

              <div className={`flex justify-between items-center py-2.5 px-3.5 rounded-xl border ${
                isDark ? 'bg-slate-950/40 border-slate-800/60' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className={isDark ? 'text-slate-300' : 'text-slate-700 font-medium'}>🔄 মোট ক্রিপ্টো বিক্রয় ভলিউম (Sell Outflow)</span>
                <span className={`font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>৳{activeMetrics.sellVolume.toLocaleString()} BDT</span>
              </div>

              <div className={`flex justify-between items-center py-2.5 px-3.5 rounded-xl border ${
                isDark ? 'bg-emerald-950/20 border-emerald-800/40' : 'bg-emerald-50 border-emerald-200'
              }`}>
                <span className={`font-semibold ${isDark ? 'text-emerald-300' : 'text-emerald-900'}`}>📈 ক্রিপ্টো ট্রেডিং স্প্রেড মার্জিন লাভ (Spread Profit)</span>
                <span className={`font-black ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>+৳{activeMetrics.spreadProfit.toFixed(2)} BDT</span>
              </div>

              <div className={`flex justify-between items-center py-2.5 px-3.5 rounded-xl border ${
                isDark ? 'bg-emerald-950/20 border-emerald-800/40' : 'bg-emerald-50 border-emerald-200'
              }`}>
                <span className={`font-semibold ${isDark ? 'text-emerald-300' : 'text-emerald-900'}`}>💳 ক্যাশআউট সার্ভিস ফি আয় (Withdrawal Fees)</span>
                <span className={`font-black ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>+৳{activeMetrics.withdrawFees.toFixed(2)} BDT</span>
              </div>

              <div className={`flex justify-between items-center py-2.5 px-3.5 rounded-xl border text-xs ${
                isDark ? 'bg-slate-950/40 border-slate-800/60' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>⛽ ব্লকচেইন গ্যাস ফি (On-chain Gas)</span>
                <span className={`font-mono font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>৳০.০০ (ইউজার বহন করে)</span>
              </div>
            </div>
          </div>

          {/* Right: ব্যয়ের খাত (Expenses) */}
          <div className="space-y-3">
            <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-wider pb-2 border-b ${
              isDark ? 'text-rose-400 border-rose-900/30' : 'text-rose-800 border-rose-200'
            }`}>
              <ArrowUpRight size={16} />
              সিস্টেম ব্যয় সমূহ (Platform Expenses)
            </div>

            <div className="space-y-2.5 text-sm">
              <div className={`flex justify-between items-center py-2.5 px-3.5 rounded-xl border ${
                isDark ? 'bg-rose-950/20 border-rose-800/40' : 'bg-rose-50 border-rose-200'
              }`}>
                <span className={isDark ? 'text-rose-300' : 'text-rose-900 font-medium'}>🎰 ডেইলি স্পিন রিওয়ার্ড বিতরণ (Spin Wins)</span>
                <span className={`font-black ${isDark ? 'text-rose-400' : 'text-rose-700'}`}>-৳{activeMetrics.spinCost.toFixed(2)} BDT</span>
              </div>

              <div className={`flex justify-between items-center py-2.5 px-3.5 rounded-xl border ${
                isDark ? 'bg-rose-950/20 border-rose-800/40' : 'bg-rose-50 border-rose-200'
              }`}>
                <span className={isDark ? 'text-rose-300' : 'text-rose-900 font-medium'}>👥 রেফারেল বোনাস কমিশন বিতরণ (Referral ৳5)</span>
                <span className={`font-black ${isDark ? 'text-rose-400' : 'text-rose-700'}`}>-৳{activeMetrics.referralCost.toFixed(2)} BDT</span>
              </div>

              <div className={`flex justify-between items-center py-2.5 px-3.5 rounded-xl border ${
                isDark ? 'bg-slate-950/40 border-slate-800/60' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>🏦 বিকাশ/নগদ সেন্ড মানি চার্জ</span>
                <span className={`font-mono font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>৳০.০০ (ইউজার ফি থেকে মেটানো)</span>
              </div>

              <div className={`flex justify-between items-center py-2.5 px-3.5 rounded-xl border ${
                isDark ? 'bg-slate-950/40 border-slate-800/60' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>🛡️ সার্ভার ও ডাটাবেস অপ্টিমাইজেশন</span>
                <span className={`font-mono font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>ইনক্লুডেড</span>
              </div>

              <div className={`flex justify-between items-center py-2.5 px-3.5 rounded-xl border font-bold ${
                isDark ? 'bg-amber-950/20 border-amber-800/40' : 'bg-amber-50 border-amber-200'
              }`}>
                <span className={isDark ? 'text-amber-300' : 'text-amber-900'}>📉 মোট পরিচালন খরচ (Total Deductions)</span>
                <span className={isDark ? 'text-amber-400' : 'text-amber-700'}>-৳{activeMetrics.totalExpenses.toFixed(2)} BDT</span>
              </div>
            </div>
          </div>

        </div>

        {/* Cash Flow Summary Bar */}
        <div className={`mt-6 p-4 rounded-xl border grid grid-cols-1 sm:grid-cols-3 gap-4 ${
          isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
              <ArrowDownLeft size={20} />
            </div>
            <div>
              <div className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>মোট Add Money (ডিপোজিট)</div>
              <div className={`text-base font-black ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                +৳{activeMetrics.depositVolume.toLocaleString()} BDT <span className={`text-xs font-normal ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>({activeMetrics.depositCount}টি সফল)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${isDark ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-100 text-rose-700'}`}>
              <ArrowUpRight size={20} />
            </div>
            <div>
              <div className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>মোট Cash Out (উইথড্র পেইড)</div>
              <div className={`text-base font-black ${isDark ? 'text-rose-400' : 'text-rose-700'}`}>
                -৳{activeMetrics.withdrawPaid.toLocaleString()} BDT <span className={`text-xs font-normal ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>({activeMetrics.withdrawCount}টি পেইড)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-100 text-cyan-700'}`}>
              <Wallet size={20} />
            </div>
            <div>
              <div className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>নিট ক্যাশ ব্যালেন্স পরিবর্তন</div>
              <div className={`text-base font-black ${isDark ? 'text-cyan-300' : 'text-cyan-800'}`}>
                {activeMetrics.netCashFlow >= 0 ? '+' : '-'}৳{Math.abs(activeMetrics.netCashFlow).toLocaleString()} BDT
              </div>
            </div>
          </div>
        </div>

        {/* ─── Bottom Line Divider & Final Verdict ─────────────── */}
        <div className={`mt-8 pt-6 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            activeMetrics.isProfit
              ? (isDark 
                  ? 'bg-gradient-to-r from-emerald-950/40 to-slate-900 border-emerald-500/40' 
                  : 'bg-gradient-to-r from-emerald-50 to-white border-emerald-200 shadow-sm')
              : (isDark 
                  ? 'bg-gradient-to-r from-rose-950/40 to-slate-900 border-rose-500/40' 
                  : 'bg-gradient-to-r from-rose-50 to-white border-rose-200 shadow-sm')
          }`}>
            <div>
              <span className={`text-xs font-black uppercase tracking-wider ${
                activeMetrics.isProfit 
                  ? (isDark ? 'text-emerald-400' : 'text-emerald-800') 
                  : (isDark ? 'text-rose-400' : 'text-rose-800')
              }`}>
                {activeMetrics.isProfit ? '🎉 চূড়ান্ত ফলাফল: নিখুঁত লাভ (Net Profit Confirmed)' : '⚠️ চূড়ান্ত ফলাফল: ঘাটতি'}
              </span>
              <div className={`text-2xl md:text-3xl font-black mt-1 ${
                activeMetrics.isProfit 
                  ? (isDark ? 'text-emerald-300' : 'text-emerald-900') 
                  : (isDark ? 'text-rose-300' : 'text-rose-900')
              }`}>
                {activeMetrics.isProfit ? '+' : '-'}৳{Math.abs(activeMetrics.netProfit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BDT
              </div>
              <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {activeMetrics.isProfit 
                  ? 'সব ধরণের অপারেশনাল খরচ ও বোনাস বিতরণের পর আপনার ব্যবসায়ের খাঁটি নিট আয়।'
                  : 'খরচ আয়ের চেয়ে সাময়িকভাবে বেশি। স্পিন বা রেফারেল রেট সমন্বয় করুন।'}
              </p>
            </div>

            {/* Savings Strategy Card */}
            <div className={`flex items-center gap-4 p-3.5 rounded-xl border shrink-0 ${
              isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-indigo-50/80 border-indigo-200'
            }`}>
              <div className={`p-3 rounded-xl ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-700'}`}>
                <PiggyBank size={24} />
              </div>
              <div>
                <div className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>প্রস্তাবিত সেভিংস তহবিল (৭০%)</div>
                <div className={`text-lg font-black ${isDark ? 'text-indigo-300' : 'text-indigo-900'}`}>
                  ৳{activeMetrics.recommendedSavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BDT
                </div>
                <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>বাকি ৩০% (৳{(activeMetrics.netProfit * 0.3).toFixed(2)}) লিকুইডিটি বাফার</div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ─── 4. Historical Date-by-Date Audit Table ──────────── */}
      <div className={`p-6 rounded-2xl border backdrop-blur-xl ${
        isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className={`text-lg font-black flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Calendar className={isDark ? 'text-emerald-400' : 'text-emerald-600'} size={20} />
              তারিখভিত্তিক দৈনিক হিস্ট্রি লেজার (Date-by-Date Records)
            </h3>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              প্রতিদিনের ট্রানজেকশনের ১ টাকার হিসাবও এখানে সংরক্ষিত থাকে।
            </p>
          </div>

          <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            সর্বমোট {filteredHistory.length}টি দিনের ডাটা সংরক্ষিত
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className={`border-b ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600 bg-slate-50'}`}>
                <th className="py-3 px-3 font-bold uppercase tracking-wider">তারিখ (Date)</th>
                <th className={`py-3 px-3 font-bold uppercase tracking-wider ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>ডিপোজিট (Add)</th>
                <th className={`py-3 px-3 font-bold uppercase tracking-wider ${isDark ? 'text-rose-400' : 'text-rose-700'}`}>উইথড্র (Out)</th>
                <th className="py-3 px-3 font-bold uppercase tracking-wider">ক্রয় ভলিউম</th>
                <th className="py-3 px-3 font-bold uppercase tracking-wider">বিক্রয় ভলিউম</th>
                <th className={`py-3 px-3 font-bold uppercase tracking-wider ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>স্প্রেড লাভ</th>
                <th className={`py-3 px-3 font-bold uppercase tracking-wider ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>উইথড্র ফি</th>
                <th className={`py-3 px-3 font-bold uppercase tracking-wider ${isDark ? 'text-rose-400' : 'text-rose-700'}`}>স্পিন খরচ</th>
                <th className={`py-3 px-3 font-bold uppercase tracking-wider ${isDark ? 'text-rose-400' : 'text-rose-700'}`}>রেফারেল খরচ</th>
                <th className="py-3 px-3 font-bold uppercase tracking-wider text-right">নিট লাভ (Net)</th>
                <th className="py-3 px-3 font-bold uppercase tracking-wider text-right">সেভিংস</th>
                <th className="py-3 px-3 font-bold uppercase tracking-wider text-center">স্ট্যাটাস</th>
                <th className="py-3 px-3 font-bold uppercase tracking-wider text-center">টেলিগ্রাম</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan="13" className={`py-12 text-center font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    কোনো তারিখের অডিট ডাটা পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item, idx) => {
                  const net = Number(item.netProfit || 0);
                  const isPos = net >= 0;
                  return (
                    <tr 
                      key={item.dateKey || item.date || idx}
                      className={`transition-colors ${
                        isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className={`py-3.5 px-3 font-semibold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                        <div className="font-bold">{item.dateDisplay || item.date}</div>
                        <div className={`text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{item.dateKey || item.date}</div>
                      </td>

                      <td className={`py-3.5 px-3 font-mono font-bold ${isDark ? 'text-cyan-300' : 'text-cyan-800'}`}>
                        ৳{Number(item.depositVolumeBdt || 0).toLocaleString()}
                        <span className={`text-[10px] ml-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>({item.depositOrdersCount || 0})</span>
                      </td>

                      <td className={`py-3.5 px-3 font-mono font-bold ${isDark ? 'text-rose-300' : 'text-rose-700'}`}>
                        ৳{Number(item.withdrawTotalBdt || 0).toLocaleString()}
                        <span className={`text-[10px] ml-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>({item.withdrawOrdersCount || 0})</span>
                      </td>

                      <td className={`py-3.5 px-3 font-mono ${isDark ? 'text-slate-300' : 'text-slate-800 font-semibold'}`}>
                        ৳{Number(item.buyVolumeBdt || 0).toLocaleString()}
                        <span className={`text-[10px] ml-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>({item.buyOrdersCount || 0})</span>
                      </td>

                      <td className={`py-3.5 px-3 font-mono ${isDark ? 'text-slate-300' : 'text-slate-800 font-semibold'}`}>
                        ৳{Number(item.sellVolumeBdt || 0).toLocaleString()}
                        <span className={`text-[10px] ml-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>({item.sellOrdersCount || 0})</span>
                      </td>

                      <td className={`py-3.5 px-3 font-mono font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                        +৳{Number(item.tradingSpreadProfit || 0).toFixed(0)}
                      </td>

                      <td className={`py-3.5 px-3 font-mono font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                        +৳{Number(item.withdrawFeesCollected || 0).toFixed(0)}
                      </td>

                      <td className={`py-3.5 px-3 font-mono font-semibold ${isDark ? 'text-rose-400' : 'text-rose-700'}`}>
                        -৳{Number(item.spinRewardsBdt || 0).toFixed(0)}
                      </td>

                      <td className={`py-3.5 px-3 font-mono font-semibold ${isDark ? 'text-rose-400' : 'text-rose-700'}`}>
                        -৳{Number(item.referralBonusesBdt || 0).toFixed(0)}
                      </td>

                      <td className="py-3.5 px-3 font-mono font-black text-right text-sm">
                        <span className={
                          isPos 
                            ? (isDark ? 'text-emerald-400' : 'text-emerald-700') 
                            : (isDark ? 'text-rose-400' : 'text-rose-700')
                        }>
                          {isPos ? '+' : ''}৳{net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>

                      <td className={`py-3.5 px-3 font-mono font-bold text-right ${isDark ? 'text-indigo-300' : 'text-indigo-800'}`}>
                        ৳{Number(item.recommendedSavingsBdt || 0).toFixed(0)}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                          isPos
                            ? (isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-emerald-100 text-emerald-800 border-emerald-200')
                            : (isDark ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-rose-100 text-rose-800 border-rose-200')
                        }`}>
                          {isPos ? 'PROFIT' : 'LOSS'}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <button
                          onClick={() => handleSendTelegramReport(item.dateKey || item.date)}
                          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                            isDark 
                              ? 'bg-purple-600/20 text-purple-300 hover:bg-purple-600 hover:text-white' 
                              : 'bg-purple-100 text-purple-700 hover:bg-purple-600 hover:text-white shadow-xs'
                          }`}
                          title="এই দিনের রিপোর্ট টেলিগ্রাম গ্রুপে পাঠান"
                        >
                          <Send size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
