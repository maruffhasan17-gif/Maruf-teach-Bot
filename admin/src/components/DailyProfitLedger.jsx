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
        isProfit: (allTime.netProfit || 0) >= 0
      };
    }

    // Sum over filtered history
    let gross = 0, exp = 0, net = 0, sav = 0, buyV = 0, sellV = 0, spread = 0, fees = 0, spin = 0, ref = 0;
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
      isProfit: net >= 0
    };
  }, [selectedDateFilter, todayData, allTime, filteredHistory]);

  return (
    <div className={`p-4 md:p-8 space-y-6 max-w-7xl mx-auto font-sans min-h-screen ${
      isDark ? 'text-slate-100' : 'text-slate-800'
    }`}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl transition-all border ${
          toastMessage.type === 'error'
            ? 'bg-rose-950/90 text-rose-200 border-rose-800'
            : 'bg-emerald-950/90 text-emerald-200 border-emerald-800'
        }`}>
          {toastMessage.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          <span className="text-sm font-semibold">{toastMessage.msg}</span>
        </div>
      )}

      {/* ─── 1. Header Banner ─────────────────────────────────── */}
      <div className={`p-6 rounded-2xl border relative overflow-hidden backdrop-blur-xl ${
        isDark 
          ? 'bg-gradient-to-r from-purple-950/40 via-slate-900/60 to-emerald-950/30 border-purple-900/30 shadow-2xl'
          : 'bg-gradient-to-r from-purple-50 via-white to-emerald-50 border-purple-100 shadow-md'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                A-to-Z Financial Audit
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Sparkles size={12} className="text-amber-400" />
                ১ টাকারও নিখুঁত হিসাব
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3">
              <BarChart3 className="text-emerald-500" size={32} />
              Daily Profit Ledger & Financial Hub
            </h1>
            <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              প্রতিদিনের ট্রেডিং স্প্রেড, ক্যাশআউট ফি, বোনাস খরচ এবং সেভিংস তহবিলের লাইভ অডিট।
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => handleSendTelegramReport(null)}
              disabled={sendingReport}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm shadow-lg transition-all cursor-pointer ${
                sendingReport
                  ? 'bg-purple-800/60 text-purple-200 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-900/30 hover:scale-[1.02]'
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
              <RefreshCw size={18} className={refreshing ? 'animate-spin text-purple-400' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── 2. Top Metric Cards ─────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Net Profit */}
        <div className={`p-5 rounded-2xl border transition-all relative overflow-hidden ${
          activeMetrics.isProfit
            ? (isDark ? 'bg-emerald-950/20 border-emerald-500/30 shadow-lg shadow-emerald-950/20' : 'bg-emerald-50/80 border-emerald-200')
            : (isDark ? 'bg-rose-950/20 border-rose-500/30 shadow-lg shadow-rose-950/20' : 'bg-rose-50/80 border-rose-200')
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${
              activeMetrics.isProfit ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {activeMetrics.isProfit ? 'আজকের নিট লাভ (Net Profit)' : 'আজকের নিট ক্ষতি (Net Loss)'}
            </span>
            <div className={`p-2 rounded-xl ${
              activeMetrics.isProfit ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
            }`}>
              {activeMetrics.isProfit ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black tracking-tight">
              {activeMetrics.isProfit ? '+' : '-'}৳{Math.abs(activeMetrics.netProfit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-xs font-medium ml-1.5 opacity-70">BDT</span>
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs">
              <span className={`px-2 py-0.5 rounded font-black ${
                activeMetrics.isProfit ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
              }`}>
                {activeMetrics.isProfit ? '✓ লাভজনক (PROFIT)' : '✕ ঘাটতি (LOSS)'}
              </span>
              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
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
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
              মোট আয় (Gross Revenue)
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black tracking-tight text-purple-300">
              ৳{activeMetrics.grossIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-xs font-medium ml-1.5 opacity-70">BDT</span>
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
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
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              সিস্টেম ব্যয় (Expenses)
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <CreditCard size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black tracking-tight text-amber-300">
              ৳{activeMetrics.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-xs font-medium ml-1.5 opacity-70">BDT</span>
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
              <span>স্পিন: <b>৳{activeMetrics.spinCost.toFixed(0)}</b></span>
              <span>•</span>
              <span>রেফারেল: <b>৳{activeMetrics.referralCost.toFixed(0)}</b></span>
            </div>
          </div>
        </div>

        {/* Card 4: Recommended Savings */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isDark ? 'bg-indigo-950/20 border-indigo-500/30' : 'bg-indigo-50/80 border-indigo-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              সেভিংস তহবিল (Savings - 70%)
            </span>
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
              <PiggyBank size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black tracking-tight text-indigo-300">
              ৳{activeMetrics.recommendedSavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-xs font-medium ml-1.5 opacity-70">BDT</span>
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-indigo-400/80">
              <ShieldCheck size={14} />
              <span>নিরাপদে ব্যাংকে জমানোর সুপারিশ</span>
            </div>
          </div>
        </div>

      </div>

      {/* ─── 3. Detailed Audit Card (A to Z Breakdown) ───────── */}
      <div className={`p-6 rounded-2xl border backdrop-blur-xl ${
        isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
          <div>
            <h2 className="text-lg font-black flex items-center gap-2">
              <Coins className="text-purple-400" size={20} />
              A-to-Z হিসাবের খুঁটিনাটি (Financial Balance Sheet)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              গ্যাস ফি সম্পূর্ণ ইউজারের ব্যালেন্স থেকে কর্তিত এবং উইথড্র ফি সরাসরি আপনার পকেটে আয় হিসেবে যুক্ত।
            </p>
          </div>

          {/* Date Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/60 border border-slate-800">
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
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
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
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-400 pb-2 border-b border-emerald-900/30">
              <ArrowDownLeft size={16} />
              আয়ের উৎস সমূহ (Inflows & Revenue Streams)
            </div>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between items-center py-2 px-3 rounded-xl bg-slate-950/40 border border-slate-800/60">
                <span className="text-slate-300">🛒 মোট ক্রিপ্টো ক্রয় ভলিউম (Buy Inflow)</span>
                <span className="font-bold text-slate-100">৳{activeMetrics.buyVolume.toLocaleString()} BDT</span>
              </div>

              <div className="flex justify-between items-center py-2 px-3 rounded-xl bg-slate-950/40 border border-slate-800/60">
                <span className="text-slate-300">🔄 মোট ক্রিপ্টো বিক্রয় ভলিউম (Sell Outflow)</span>
                <span className="font-bold text-slate-100">৳{activeMetrics.sellVolume.toLocaleString()} BDT</span>
              </div>

              <div className="flex justify-between items-center py-2 px-3 rounded-xl bg-emerald-950/20 border border-emerald-800/40">
                <span className="text-emerald-300 font-semibold">📈 ক্রিপ্টো ট্রেডিং স্প্রেড মার্জিন লাভ (Spread Profit)</span>
                <span className="font-black text-emerald-400">+৳{activeMetrics.spreadProfit.toFixed(2)} BDT</span>
              </div>

              <div className="flex justify-between items-center py-2 px-3 rounded-xl bg-emerald-950/20 border border-emerald-800/40">
                <span className="text-emerald-300 font-semibold">💳 ক্যাশআউট সার্ভিস ফি আয় (Withdrawal Fees)</span>
                <span className="font-black text-emerald-400">+৳{activeMetrics.withdrawFees.toFixed(2)} BDT</span>
              </div>

              <div className="flex justify-between items-center py-2 px-3 rounded-xl bg-slate-950/40 border border-slate-800/60 text-xs">
                <span className="text-slate-400">⛽ ব্লকচেইন গ্যাস ফি (On-chain Gas)</span>
                <span className="font-mono text-emerald-400 font-bold">৳০.০০ (ইউজার বহন করে)</span>
              </div>
            </div>
          </div>

          {/* Right: ব্যয়ের খাত (Expenses) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-rose-400 pb-2 border-b border-rose-900/30">
              <ArrowUpRight size={16} />
              সিস্টেম ব্যয় সমূহ (Platform Expenses)
            </div>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between items-center py-2 px-3 rounded-xl bg-rose-950/20 border border-rose-800/40">
                <span className="text-rose-300">🎰 ডেইলি স্পিন রিওয়ার্ড বিতরণ (Spin Wins)</span>
                <span className="font-black text-rose-400">-৳{activeMetrics.spinCost.toFixed(2)} BDT</span>
              </div>

              <div className="flex justify-between items-center py-2 px-3 rounded-xl bg-rose-950/20 border border-rose-800/40">
                <span className="text-rose-300">👥 রেফারেল বোনাস কমিশন বিতরণ (Referral ৳5)</span>
                <span className="font-black text-rose-400">-৳{activeMetrics.referralCost.toFixed(2)} BDT</span>
              </div>

              <div className="flex justify-between items-center py-2 px-3 rounded-xl bg-slate-950/40 border border-slate-800/60">
                <span className="text-slate-400">🏦 বিকাশ/নগদ সেন্ড মানি চার্জ</span>
                <span className="font-mono text-emerald-400 font-bold">৳০.০০ (ইউজার ফি থেকে মেটানো)</span>
              </div>

              <div className="flex justify-between items-center py-2 px-3 rounded-xl bg-slate-950/40 border border-slate-800/60">
                <span className="text-slate-400">🛡️ সার্ভার ও ডাটাবেস অপ্টিমাইজেশন</span>
                <span className="font-mono text-slate-300">ইনক্লুডেড</span>
              </div>

              <div className="flex justify-between items-center py-2 px-3 rounded-xl bg-amber-950/20 border border-amber-800/40 font-bold">
                <span className="text-amber-300">📉 মোট পরিচালন খরচ (Total Deductions)</span>
                <span className="text-amber-400">-৳{activeMetrics.totalExpenses.toFixed(2)} BDT</span>
              </div>
            </div>
          </div>

        </div>

        {/* ─── Bottom Line Divider & Final Verdict ─────────────── */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <div className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            activeMetrics.isProfit
              ? 'bg-gradient-to-r from-emerald-950/40 to-slate-900 border-emerald-500/40'
              : 'bg-gradient-to-r from-rose-950/40 to-slate-900 border-rose-500/40'
          }`}>
            <div>
              <span className={`text-xs font-black uppercase tracking-wider ${
                activeMetrics.isProfit ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {activeMetrics.isProfit ? '🎉 চূড়ান্ত ফলাফল: নিখুঁত লাভ (Net Profit Confirmed)' : '⚠️ চূড়ান্ত ফলাফল: ঘাটতি'}
              </span>
              <div className="text-2xl md:text-3xl font-black mt-1">
                {activeMetrics.isProfit ? '+' : '-'}৳{Math.abs(activeMetrics.netProfit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BDT
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {activeMetrics.isProfit 
                  ? 'সব ধরণের অপারেশনাল খরচ ও বোনাস বিতরণের পর আপনার ব্যবসায়ের খাঁটি নিট আয়।'
                  : 'খরচ আয়ের চেয়ে সাময়িকভাবে বেশি। স্পিন বা রেফারেল রেট সমন্বয় করুন।'}
              </p>
            </div>

            {/* Savings Strategy Card */}
            <div className="flex items-center gap-4 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 shrink-0">
              <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-400">
                <PiggyBank size={24} />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-semibold">প্রস্তাবিত সেভিংস তহবিল (৭০%)</div>
                <div className="text-lg font-black text-indigo-300">
                  ৳{activeMetrics.recommendedSavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BDT
                </div>
                <div className="text-[11px] text-slate-400">বাকি ৩০% (৳{(activeMetrics.netProfit * 0.3).toFixed(2)}) লিকুইডিটি বাফার</div>
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
            <h3 className="text-lg font-black flex items-center gap-2">
              <Calendar className="text-emerald-400" size={20} />
              তারিখভিত্তিক দৈনিক হিস্ট্রি লেজার (Date-by-Date Records)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              প্রতিদিনের ট্রানজেকশনের ১ টাকার হিসাবও এখানে সংরক্ষিত থাকে।
            </p>
          </div>

          <span className="text-xs text-slate-400 font-mono">
            সর্বমোট {filteredHistory.length}টি দিনের ডাটা সংরক্ষিত
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className={`border-b ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                <th className="py-3 px-3 font-bold uppercase tracking-wider">তারিখ (Date)</th>
                <th className="py-3 px-3 font-bold uppercase tracking-wider">ক্রয় ভলিউম</th>
                <th className="py-3 px-3 font-bold uppercase tracking-wider">বিক্রয় ভলিউম</th>
                <th className="py-3 px-3 font-bold uppercase tracking-wider text-emerald-400">স্প্রেড লাভ</th>
                <th className="py-3 px-3 font-bold uppercase tracking-wider text-emerald-400">উইথড্র ফি</th>
                <th className="py-3 px-3 font-bold uppercase tracking-wider text-rose-400">স্পিন খরচ</th>
                <th className="py-3 px-3 font-bold uppercase tracking-wider text-rose-400">রেফারেল খরচ</th>
                <th className="py-3 px-3 font-bold uppercase tracking-wider text-right">নিট লাভ (Net)</th>
                <th className="py-3 px-3 font-bold uppercase tracking-wider text-right">সেভিংস</th>
                <th className="py-3 px-3 font-bold uppercase tracking-wider text-center">স্ট্যাটাস</th>
                <th className="py-3 px-3 font-bold uppercase tracking-wider text-center">টেলিগ্রাম</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan="11" className="py-12 text-center text-slate-500 font-medium">
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
                      <td className="py-3.5 px-3 font-semibold text-slate-200">
                        <div className="font-bold">{item.dateDisplay || item.date}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{item.dateKey || item.date}</div>
                      </td>

                      <td className="py-3.5 px-3 font-mono text-slate-300">
                        ৳{Number(item.buyVolumeBdt || 0).toLocaleString()}
                        <span className="text-[10px] text-slate-500 ml-1">({item.buyOrdersCount || 0})</span>
                      </td>

                      <td className="py-3.5 px-3 font-mono text-slate-300">
                        ৳{Number(item.sellVolumeBdt || 0).toLocaleString()}
                        <span className="text-[10px] text-slate-500 ml-1">({item.sellOrdersCount || 0})</span>
                      </td>

                      <td className="py-3.5 px-3 font-mono font-bold text-emerald-400">
                        +৳{Number(item.tradingSpreadProfit || 0).toFixed(0)}
                      </td>

                      <td className="py-3.5 px-3 font-mono font-bold text-emerald-400">
                        +৳{Number(item.withdrawFeesCollected || 0).toFixed(0)}
                      </td>

                      <td className="py-3.5 px-3 font-mono font-semibold text-rose-400">
                        -৳{Number(item.spinRewardsBdt || 0).toFixed(0)}
                      </td>

                      <td className="py-3.5 px-3 font-mono font-semibold text-rose-400">
                        -৳{Number(item.referralBonusesBdt || 0).toFixed(0)}
                      </td>

                      <td className="py-3.5 px-3 font-mono font-black text-right text-sm">
                        <span className={isPos ? 'text-emerald-400' : 'text-rose-400'}>
                          {isPos ? '+' : ''}৳{net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 font-mono font-bold text-right text-indigo-300">
                        ৳{Number(item.recommendedSavingsBdt || 0).toFixed(0)}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          isPos
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}>
                          {isPos ? 'PROFIT' : 'LOSS'}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <button
                          onClick={() => handleSendTelegramReport(item.dateKey || item.date)}
                          className="p-1.5 rounded-lg bg-purple-600/20 text-purple-300 hover:bg-purple-600 hover:text-white transition-all cursor-pointer"
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
