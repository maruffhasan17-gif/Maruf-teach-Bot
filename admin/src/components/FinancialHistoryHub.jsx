import React, { useState, useMemo } from 'react';
import { 
  Coins, 
  ArrowUpRight, 
  ArrowDownLeft, 
  PlusCircle, 
  CreditCard, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Copy, 
  Check, 
  ExternalLink, 
  RefreshCw, 
  TrendingUp, 
  DollarSign, 
  Zap, 
  ArrowRight,
  ShieldCheck,
  Calendar,
  Sparkles
} from 'lucide-react';

export default function FinancialHistoryHub({ useOrdersDataHook, useBotDataHook, useThemeHook, apiBase }) {
  const { orders, refresh, refreshing } = useOrdersDataHook();
  const { data } = useBotDataHook();
  const { theme } = useThemeHook();
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'buys' | 'sells' | 'deposits' | 'withdrawals'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'completed' | 'pending' | 'rejected'
  const [search, setSearch] = useState('');
  const [copiedKey, setCopiedKey] = useState(null);

  const copyText = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const buysList = useMemo(() => orders.buys || [], [orders.buys]);
  const sellsList = useMemo(() => orders.sells || [], [orders.sells]);
  const withdrawalsList = useMemo(() => orders.withdrawals || [], [orders.withdrawals]);
  const depositsList = useMemo(() => orders.deposits || [], [orders.deposits]);

  // Financial Telemetry Computations
  const stats = useMemo(() => {
    // 1. Total Add Money / Deposits
    const depositTotalBdt = depositsList
      .filter(d => d.status === 'completed' || !d.status)
      .reduce((sum, d) => sum + (parseFloat(d.amount || d.totalBdt || 0) || 0), 0);

    // 2. Total Buys (Crypto Purchases)
    const buysCompleted = buysList.filter(b => b.status === 'completed' || b.status === 'paid');
    const buysTotalBdt = buysCompleted.reduce((sum, b) => sum + (parseFloat(b.totalBdt || b.amountBdt || 0) || 0), 0);
    const buysGram = buysCompleted
      .filter(b => (b.asset || '').toUpperCase() === 'GRAM' || (b.asset || '').toUpperCase() === 'TON')
      .reduce((sum, b) => sum + (parseFloat(b.amount || b.cryptoAmount || 0) || 0), 0);
    const buysUsdt = buysCompleted
      .filter(b => (b.asset || '').toUpperCase() === 'USDT')
      .reduce((sum, b) => sum + (parseFloat(b.amount || b.cryptoAmount || 0) || 0), 0);

    // 3. Total Sells (Crypto Sold by Users)
    const sellsCompleted = sellsList.filter(s => s.status === 'completed' || !s.status);
    const sellsTotalBdt = sellsCompleted.reduce((sum, s) => sum + (parseFloat(s.bdtAmount || s.totalBdt || s.estimatedTk || 0) || 0), 0);
    const sellsGram = sellsCompleted
      .filter(s => (s.asset || '').toUpperCase() === 'GRAM' || (s.asset || '').toUpperCase() === 'TON')
      .reduce((sum, s) => sum + (parseFloat(s.cryptoAmount || s.amount || 0) || 0), 0);
    const sellsUsdt = sellsCompleted
      .filter(s => (s.asset || '').toUpperCase() === 'USDT')
      .reduce((sum, s) => sum + (parseFloat(s.cryptoAmount || s.amount || 0) || 0), 0);

    // 4. Total Cashouts (Fiat Withdrawals)
    const withdrawalsCompleted = withdrawalsList.filter(w => w.status === 'approved' || w.status === 'completed');
    const withdrawalsTotalBdt = withdrawalsCompleted.reduce((sum, w) => sum + (parseFloat(w.amount || 0) || 0), 0);

    // Platform Net Estimated Revenue & Spread
    // Profit approximation: 3-5% margin on retail crypto buy/sell spreads + gas optimizations
    const estimatedSpreadProfitBdt = (buysTotalBdt * 0.04) + (sellsTotalBdt * 0.035);
    const estimatedProfitUsd = estimatedSpreadProfitBdt / 125;

    return {
      depositTotalBdt,
      buysTotalBdt,
      buysGram,
      buysUsdt,
      sellsTotalBdt,
      sellsGram,
      sellsUsdt,
      withdrawalsTotalBdt,
      estimatedSpreadProfitBdt,
      estimatedProfitUsd,
      totalBuysCount: buysList.length,
      totalSellsCount: sellsList.length,
      totalDepositsCount: depositsList.length,
      totalWithdrawalsCount: withdrawalsList.length,
    };
  }, [buysList, sellsList, withdrawalsList, depositsList]);

  // Unified Chronological Stream
  const unifiedStream = useMemo(() => {
    const list = [];

    // Map Buys
    buysList.forEach(b => {
      const tsVal = b.timestamp?._seconds ? b.timestamp._seconds * 1000 : (typeof b.timestamp === 'number' ? b.timestamp : (b.timestamp ? new Date(b.timestamp).getTime() : 0));
      list.push({
        id: b.id || b.trxId,
        type: 'buy',
        typeLabel: 'Crypto Buy',
        asset: b.asset || 'GRAM',
        cryptoAmount: b.amount || b.cryptoAmount || 0,
        bdtAmount: parseFloat(b.totalBdt || b.amountBdt || 0) || 0,
        usdEst: ((parseFloat(b.totalBdt || b.amountBdt || 0) || 0) / 125).toFixed(2),
        userId: b.userId || 'N/A',
        paymentMethod: b.method || b.paymentMethod || 'bKash',
        trxId: b.trxId || b.id || 'N/A',
        status: b.status || 'pending',
        timestamp: tsVal,
        destination: b.receiveAddress || b.wallet || ''
      });
    });

    // Map Sells
    sellsList.forEach(s => {
      const tsVal = s.timestamp?._seconds ? s.timestamp._seconds * 1000 : (typeof s.timestamp === 'number' ? s.timestamp : (s.timestamp ? new Date(s.timestamp).getTime() : 0));
      list.push({
        id: s.id || Math.random(),
        type: 'sell',
        typeLabel: 'Crypto Sell',
        asset: s.asset || 'GRAM',
        cryptoAmount: s.cryptoAmount || s.amount || 0,
        bdtAmount: parseFloat(s.bdtAmount || s.totalBdt || s.estimatedTk || 0) || 0,
        usdEst: ((parseFloat(s.bdtAmount || s.totalBdt || s.estimatedTk || 0) || 0) / 125).toFixed(2),
        userId: s.userId || 'N/A',
        paymentMethod: 'TON Wallet',
        trxId: s.sellCode || s.payoutNumber || s.trxId || s.id || 'N/A',
        status: s.status || 'completed',
        timestamp: tsVal,
        destination: s.wallet || ''
      });
    });

    // Map Deposits (Add Money)
    depositsList.forEach(d => {
      const tsVal = d.timestamp?._seconds ? d.timestamp._seconds * 1000 : (typeof d.timestamp === 'number' ? d.timestamp : (d.timestamp ? new Date(d.timestamp).getTime() : 0));
      list.push({
        id: d.id || d.trxId || Math.random(),
        type: 'deposit',
        typeLabel: 'Add Money',
        asset: 'BDT',
        cryptoAmount: 0,
        bdtAmount: parseFloat(d.amount || d.totalBdt || 0) || 0,
        usdEst: ((parseFloat(d.amount || d.totalBdt || 0) || 0) / 125).toFixed(2),
        userId: d.userId || 'N/A',
        paymentMethod: d.paymentMethod || 'bKash',
        trxId: d.trxId || d.id || 'N/A',
        status: d.status || 'completed',
        timestamp: tsVal,
        destination: 'Bot Balance'
      });
    });

    // Map Cashouts (Fiat Withdrawals)
    withdrawalsList.forEach(w => {
      const tsVal = w.timestamp?._seconds ? w.timestamp._seconds * 1000 : (typeof w.timestamp === 'number' ? w.timestamp : (w.timestamp ? new Date(w.timestamp).getTime() : 0));
      list.push({
        id: w.id || w.withdrawId,
        type: 'withdrawal',
        typeLabel: 'Fiat Cashout',
        asset: 'BDT',
        cryptoAmount: 0,
        bdtAmount: parseFloat(w.amount || 0) || 0,
        usdEst: ((parseFloat(w.amount || 0) || 0) / 125).toFixed(2),
        userId: w.userId || 'N/A',
        paymentMethod: w.method || 'bKash',
        trxId: w.trxId || w.number || w.id || 'N/A',
        status: w.status === 'approved' ? 'completed' : (w.status || 'pending'),
        timestamp: tsVal,
        destination: w.number || ''
      });
    });

    // Sort descending by timestamp
    return list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [buysList, sellsList, depositsList, withdrawalsList]);

  // Filtered Stream
  const filteredList = useMemo(() => {
    return unifiedStream.filter(item => {
      // Tab filter
      if (activeTab === 'buys' && item.type !== 'buy') return false;
      if (activeTab === 'sells' && item.type !== 'sell') return false;
      if (activeTab === 'deposits' && item.type !== 'deposit') return false;
      if (activeTab === 'withdrawals' && item.type !== 'withdrawal') return false;

      // Status filter
      if (statusFilter !== 'all') {
        const itemStatus = (item.status || '').toLowerCase();
        if (statusFilter === 'completed' && !(itemStatus === 'completed' || itemStatus === 'paid' || itemStatus === 'approved')) return false;
        if (statusFilter === 'pending' && !(itemStatus === 'pending' || itemStatus === 'verified')) return false;
        if (statusFilter === 'rejected' && itemStatus !== 'rejected') return false;
      }

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTrx = String(item.trxId || '').toLowerCase().includes(q);
        const matchUser = String(item.userId || '').toLowerCase().includes(q);
        const matchDest = String(item.destination || '').toLowerCase().includes(q);
        const matchMethod = String(item.paymentMethod || '').toLowerCase().includes(q);
        const matchAsset = String(item.asset || '').toLowerCase().includes(q);
        if (!matchTrx && !matchUser && !matchDest && !matchMethod && !matchAsset) return false;
      }

      return true;
    });
  }, [unifiedStream, activeTab, statusFilter, search]);

  const formatTime = (ts) => {
    if (!ts) return 'Recent';
    try {
      const d = new Date(ts);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (_) {
      return 'Recent';
    }
  };

  return (
    <div className="space-y-7 animate-in fade-in duration-300">
      
      {/* 1. Header with Breadcrumb and Live Action Refresh */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">
            <Coins size={14} /> Comprehensive Multi-Stream Accounting
          </div>
          <h1 className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Financial Records & Revenue Command Hub
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Full audit logs for Buy orders, Sell orders, Add Money deposits, and Fiat cashouts with live USD & BDT metrics.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={refresh}
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all ${
              isDark 
                ? 'bg-purple-950/40 border border-purple-800/40 text-purple-300 hover:bg-purple-900/40' 
                : 'bg-white border border-slate-200 text-slate-700 shadow-sm hover:bg-slate-50'
            }`}
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            <span>Refresh Feeds</span>
          </button>
        </div>
      </div>

      {/* 2. Top Financial Telemetry & Net Revenue (4-Card Metric Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Deposits / Add Money */}
        <div className={`p-5 rounded-3xl border flex flex-col justify-between ${
          isDark ? 'bg-[#0f1738]/80 border-cyan-500/30 shadow-lg' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1">
              <span>TOTAL ADD MONEY (DEPOSITS)</span>
              <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400"><PlusCircle size={14} /></span>
            </div>
            <div className="text-2xl font-black font-mono tracking-tight text-cyan-400 mt-1">
              ৳{stats.depositTotalBdt.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} BDT
            </div>
            <div className="text-xs font-bold text-slate-400 mt-0.5">
              ≈ ${(stats.depositTotalBdt / 125).toFixed(2)} USD
            </div>
          </div>
          <div className={`text-[11px] font-mono pt-3 border-t mt-3 flex items-center justify-between ${
            isDark ? 'border-slate-800/60 text-slate-400' : 'border-slate-200 text-slate-600'
          }`}>
            <span>Verified Count:</span>
            <span className={`font-bold ${isDark ? 'text-cyan-300' : 'text-cyan-600'}`}>{stats.totalDepositsCount} orders</span>
          </div>
        </div>

        {/* Card 2: Crypto Purchases (Buys) */}
        <div className={`p-5 rounded-3xl border flex flex-col justify-between ${
          isDark ? 'bg-[#15123d]/80 border-purple-500/30 shadow-lg' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div>
            <div className={`flex items-center justify-between text-xs font-bold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <span>CRYPTO BUYS (COLLECTED)</span>
              <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400"><ArrowUpRight size={14} /></span>
            </div>
            <div className={`text-2xl font-black font-mono tracking-tight mt-1 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
              ৳{stats.buysTotalBdt.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} BDT
            </div>
            <div className={`text-xs font-bold mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              ≈ ${(stats.buysTotalBdt / 125).toFixed(2)} USD
            </div>
          </div>
          <div className={`text-[11px] font-mono pt-3 border-t mt-3 flex items-center justify-between ${
            isDark ? 'border-slate-800/60 text-slate-400' : 'border-slate-200 text-slate-600'
          }`}>
            <span>Dispatched:</span>
            <span className={`font-bold ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
              {stats.buysGram.toFixed(1)} GRAM • {stats.buysUsdt.toFixed(1)} USDT
            </span>
          </div>
        </div>

        {/* Card 3: Crypto Sales (Sells) */}
        <div className={`p-5 rounded-3xl border flex flex-col justify-between ${
          isDark ? 'bg-[#0c2229]/80 border-emerald-500/30 shadow-lg' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div>
            <div className={`flex items-center justify-between text-xs font-bold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <span>CRYPTO SELLS (PAID OUT)</span>
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400"><ArrowDownLeft size={14} /></span>
            </div>
            <div className={`text-2xl font-black font-mono tracking-tight mt-1 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
              ৳{stats.sellsTotalBdt.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} BDT
            </div>
            <div className={`text-xs font-bold mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              ≈ ${(stats.sellsTotalBdt / 125).toFixed(2)} USD
            </div>
          </div>
          <div className={`text-[11px] font-mono pt-3 border-t mt-3 flex items-center justify-between ${
            isDark ? 'border-slate-800/60 text-slate-400' : 'border-slate-200 text-slate-600'
          }`}>
            <span>Acquired Vault:</span>
            <span className={`font-bold ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
              {stats.sellsGram.toFixed(1)} GRAM • {stats.sellsUsdt.toFixed(1)} USDT
            </span>
          </div>
        </div>

        {/* Card 4: Net Platform Revenue & Margin */}
        <div className={`p-5 rounded-3xl border flex flex-col justify-between relative overflow-hidden ${
          isDark ? 'bg-gradient-to-br from-[#1a1338] via-[#120f2e] to-[#0c0a1f] border-amber-500/40 shadow-xl' : 'bg-amber-50/50 border-amber-200 shadow-sm'
        }`}>
          <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-amber-500 mb-1">
              <span className="flex items-center gap-1"><Sparkles size={13} /> NET PLATFORM REVENUE</span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40">
                SPREAD + FEES
              </span>
            </div>
            <div className={`text-2xl font-black font-mono tracking-tight mt-1 ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>
              ৳{stats.estimatedSpreadProfitBdt.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} BDT
            </div>
            <div className={`text-xs font-bold mt-0.5 flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              <span className={`font-black ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>≈ ${stats.estimatedProfitUsd.toFixed(2)} USD</span>
              <span>• Net Margins</span>
            </div>
          </div>
          <div className={`text-[11px] font-mono pt-3 border-t mt-3 flex items-center justify-between ${
            isDark ? 'border-slate-800/60 text-slate-400' : 'border-slate-200 text-slate-600'
          }`}>
            <span>Cashout Volume:</span>
            <span className={`font-bold ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>৳{stats.withdrawalsTotalBdt.toLocaleString()} BDT</span>
          </div>
        </div>

      </div>

      {/* 3. Section Switcher Tabs & Live Search Filters */}
      <div className={`p-4 rounded-3xl border space-y-4 ${
        isDark ? 'bg-[#0c1024]/90 border-slate-800/80 shadow-md' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Stream Switcher Tabs */}
          <div className={`flex flex-wrap gap-1.5 p-1 rounded-2xl ${isDark ? "bg-black/40 border-slate-800" : "bg-slate-100 border-slate-200"} border`}>
            {[
              { id: 'all', label: `All Streams (${unifiedStream.length})` },
              { id: 'buys', label: `Crypto Buys (${stats.totalBuysCount})` },
              { id: 'sells', label: `Crypto Sells (${stats.totalSellsCount})` },
              { id: 'deposits', label: `Add Money (${stats.totalDepositsCount})` },
              { id: 'withdrawals', label: `Fiat Cashouts (${stats.totalWithdrawalsCount})` },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-3.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Status & Search Inputs */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className={`py-2 px-3 rounded-xl text-xs font-bold ${isDark ? "bg-black/40 border-slate-800 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800"} border outline-none focus:border-purple-500 cursor-pointer`}
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed / Paid</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>

            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search TrxID, User, Gateway..."
                className={`w-full py-2 pl-9 pr-3 rounded-xl text-xs font-bold ${isDark ? "bg-black/40 border-slate-800 text-white placeholder-slate-500" : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"} border outline-none focus:border-purple-500 transition-all font-mono`}
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                  ✕
                </button>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* 4. Streamlined, Compact Data Table */}
      <div className={`rounded-3xl border overflow-hidden ${
        isDark ? 'bg-[#0b0e22] border-slate-800/80 shadow-2xl' : 'bg-white border-slate-200 shadow-md'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`border-b ${isDark ? 'bg-[#0f1430] border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                <th className="py-3 px-4 font-black uppercase text-[10px] tracking-wider">Date & Time</th>
                <th className="py-3 px-4 font-black uppercase text-[10px] tracking-wider">Stream Type</th>
                <th className="py-3 px-4 font-black uppercase text-[10px] tracking-wider">User ID</th>
                <th className="py-3 px-4 font-black uppercase text-[10px] tracking-wider">Asset / Gateway</th>
                <th className="py-3 px-4 font-black uppercase text-[10px] tracking-wider">Crypto / Amount</th>
                <th className="py-3 px-4 font-black uppercase text-[10px] tracking-wider">Total BDT</th>
                <th className="py-3 px-4 font-black uppercase text-[10px] tracking-wider">USD Est.</th>
                <th className="py-3 px-4 font-black uppercase text-[10px] tracking-wider">TrxID / Reference</th>
                <th className="py-3 px-4 font-black uppercase text-[10px] tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-slate-800/40' : 'divide-slate-200'}`}>
              {filteredList.map((item, idx) => {
                const isCopied = copiedKey === `${item.id}_${idx}`;
                const isBuy = item.type === 'buy';
                const isSell = item.type === 'sell';
                const isDep = item.type === 'deposit';
                const isWd = item.type === 'withdrawal';

                const statusLower = (item.status || '').toLowerCase();
                const isCompleted = statusLower === 'completed' || statusLower === 'paid' || statusLower === 'approved';
                const isPending = statusLower === 'pending' || statusLower === 'verified';
                const isRejected = statusLower === 'rejected';

                return (
                  <tr 
                    key={`${item.id}_${idx}`}
                    className={`transition-colors ${
                      isDark ? 'hover:bg-slate-900/50' : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Timestamp */}
                    <td className={`py-3 px-4 font-mono text-[11px] whitespace-nowrap ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {formatTime(item.timestamp)}
                    </td>

                    {/* Stream Type Badge */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border ${
                        isBuy 
                          ? 'bg-purple-500/15 text-purple-400 dark:text-purple-300 border-purple-500/30'
                          : isSell
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30'
                          : isDep
                          ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border-cyan-500/30'
                          : 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30'
                      }`}>
                        {isBuy && <ArrowUpRight size={11} />}
                        {isSell && <ArrowDownLeft size={11} />}
                        {isDep && <PlusCircle size={11} />}
                        {isWd && <CreditCard size={11} />}
                        <span>{item.typeLabel}</span>
                      </span>
                    </td>

                    {/* User ID */}
                    <td className={`py-3 px-4 font-mono font-bold ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                      {item.userId}
                    </td>

                    {/* Asset & Gateway */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className={`font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.asset}</span>
                        <span className={`font-mono text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>({item.paymentMethod})</span>
                      </div>
                    </td>

                    {/* Crypto Amount */}
                    <td className={`py-3 px-4 font-mono font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {item.cryptoAmount > 0 ? `${item.cryptoAmount} ${item.asset}` : '—'}
                    </td>

                    {/* BDT Amount */}
                    <td className={`py-3 px-4 font-mono font-black text-[13px] ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                      ৳{item.bdtAmount.toLocaleString()}
                    </td>

                    {/* USD Estimate */}
                    <td className={`py-3 px-4 font-mono text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      ${item.usdEst}
                    </td>

                    {/* TrxID / Ref with Copy */}
                    <td className={`py-3 px-4 font-mono text-[11px] whitespace-nowrap ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      <div className="flex items-center gap-1">
                        <span className="truncate max-w-[130px]">{item.trxId}</span>
                        <button
                          type="button"
                          onClick={() => copyText(item.trxId, `${item.id}_${idx}`)}
                          className={`p-1 cursor-pointer transition-colors ${isDark ? 'hover:text-white' : 'hover:text-slate-900'}`}
                          title="Copy TrxID"
                        >
                          {isCopied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <CheckCircle2 size={11} /> Completed
                        </span>
                      )}
                      {isPending && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                          <Clock size={11} /> Pending
                        </span>
                      )}
                      {isRejected && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          <XCircle size={11} /> Rejected
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredList.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 font-bold">
                    No transactions match the selected stream or filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Count */}
        <div className={`p-4 border-t flex items-center justify-between text-xs font-mono text-slate-400 ${
          isDark ? 'border-slate-800 bg-[#0c1024]' : 'border-slate-200 bg-slate-50'
        }`}>
          <span>Showing {filteredList.length} of {unifiedStream.length} total activity records</span>
          <span>Auto-Refreshed every 20 seconds</span>
        </div>
      </div>

    </div>
  );
}
