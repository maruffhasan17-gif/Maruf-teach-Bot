import React from 'react';
import { Sparkles, ArrowRight, Play, Activity, TrendingUp, ShieldCheck, Zap } from 'lucide-react';

// ============================================================================
// 1. CONCENTRIC MULTI-ARC RING CHART (Exact match to User Image 1 & Image 2)
// ============================================================================
export function InfographicConcentricRings({ verifiedPercent = 74, completionRate = 92, activeScore = 142, isDark = true }) {
  // SVG Arc calculation helpers
  const size = 260;
  const strokeWidth = 14;
  const center = size / 2;

  // Outer ring (radius: 105)
  const r1 = 105;
  const c1 = 2 * Math.PI * r1;
  const offset1 = c1 - (c1 * (Math.min(100, Math.max(10, verifiedPercent)) / 100)) * 0.75; // 270 deg arc

  // Middle ring (radius: 82)
  const r2 = 82;
  const c2 = 2 * Math.PI * r2;
  const offset2 = c2 - (c2 * (Math.min(100, Math.max(10, completionRate)) / 100)) * 0.75;

  // Inner ring (radius: 60)
  const r3 = 60;
  const c3 = 2 * Math.PI * r3;
  const offset3 = c3 - (c3 * 0.85) * 0.75;

  return (
    <div className={`p-6 rounded-3xl border relative overflow-hidden flex flex-col justify-between transition-all duration-300 ${
      isDark 
        ? 'bg-gradient-to-br from-[#12163a]/90 via-[#0d102d]/95 to-[#090b20] border-[#2a3168]/60 shadow-[0_15px_40px_rgba(10,12,35,0.8)]' 
        : 'bg-white border-slate-200 shadow-xl'
    }`}>
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-amber-500/10 blur-3xl rounded-full pointer-events-none" />

      {/* Title */}
      <div className="relative z-10 flex items-center justify-between mb-2">
        <div>
          <span className="text-[11px] font-black uppercase tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-pink-400 to-purple-400">
            SYSTEM PERFORMANCE
          </span>
          <h3 className={`text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Network Activity
          </h3>
        </div>
        <div className="p-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300">
          <Activity size={16} />
        </div>
      </div>

      {/* SVG Multi-Ring Visual */}
      <div className="relative z-10 flex items-center justify-center my-3">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-135deg] drop-shadow-[0_8px_20px_rgba(0,0,0,0.5)]">
          <defs>
            {/* Gradient 1: Amber to Pink/Coral */}
            <linearGradient id="gradRingAmberPink" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffb700" />
              <stop offset="50%" stopColor="#ff4572" />
              <stop offset="100%" stopColor="#d946ef" />
            </linearGradient>

            {/* Gradient 2: Cyan to Electric Blue */}
            <linearGradient id="gradRingCyanBlue" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00f2fe" />
              <stop offset="100%" stopColor="#4facfe" />
            </linearGradient>

            {/* Gradient 3: Purple to Magenta */}
            <linearGradient id="gradRingPurple" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>

          {/* Background Track Arcs */}
          <circle cx={center} cy={center} r={r1} fill="none" stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"} strokeWidth={strokeWidth} strokeDasharray={`${c1 * 0.75} ${c1 * 0.25}`} strokeLinecap="round" />
          <circle cx={center} cy={center} r={r2} fill="none" stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"} strokeWidth={strokeWidth} strokeDasharray={`${c2 * 0.75} ${c2 * 0.25}`} strokeLinecap="round" />
          <circle cx={center} cy={center} r={r3} fill="none" stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"} strokeWidth={strokeWidth} strokeDasharray={`${c3 * 0.75} ${c3 * 0.25}`} strokeLinecap="round" />

          {/* Outer Ring: Verified Ratio */}
          <circle 
            cx={center} 
            cy={center} 
            r={r1} 
            fill="none" 
            stroke="url(#gradRingAmberPink)" 
            strokeWidth={strokeWidth} 
            strokeDasharray={c1}
            strokeDashoffset={offset1}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />

          {/* Middle Ring: Order Completion */}
          <circle 
            cx={center} 
            cy={center} 
            r={r2} 
            fill="none" 
            stroke="url(#gradRingCyanBlue)" 
            strokeWidth={strokeWidth} 
            strokeDasharray={c2}
            strokeDashoffset={offset2}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />

          {/* Inner Ring: Pool Health */}
          <circle 
            cx={center} 
            cy={center} 
            r={r3} 
            fill="none" 
            stroke="url(#gradRingPurple)" 
            strokeWidth={strokeWidth} 
            strokeDasharray={c3}
            strokeDashoffset={offset3}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Score Badge */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span className="text-3xl font-black font-mono tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-pink-400 to-amber-300">
            {activeScore}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            ACTIVE INDEX
          </span>
        </div>
      </div>

      {/* Bottom Color Graded Legend */}
      <div className="relative z-10 grid grid-cols-3 gap-2 pt-3 border-t border-slate-700/30 text-center">
        <div className="space-y-0.5">
          <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-amber-400">
            <span className="w-2 h-2 rounded-full bg-gradient-to-r from-amber-400 to-pink-500 shadow-sm shadow-pink-500/50" />
            Verified
          </div>
          <div className="text-xs font-black text-white font-mono">{verifiedPercent}%</div>
        </div>

        <div className="space-y-0.5">
          <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-cyan-400">
            <span className="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 shadow-sm shadow-cyan-500/50" />
            Success
          </div>
          <div className="text-xs font-black text-white font-mono">{completionRate}%</div>
        </div>

        <div className="space-y-0.5">
          <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-purple-400">
            <span className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 shadow-sm shadow-purple-500/50" />
            Reserves
          </div>
          <div className="text-xs font-black text-white font-mono">98.5%</div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 2. GRADIENT BAR CHART (Exact match to User Image 1 & Image 2)
// ============================================================================
export function InfographicBarChart({ isDark = true }) {
  // 8 Bar Heights with individual multi-stop gradients
  const bars = [
    { id: '01', height: 85, grad: 'from-[#ffb700] via-[#ff4572] to-[#d946ef]' },
    { id: '02', height: 55, grad: 'from-[#d946ef] to-[#8b5cf6]' },
    { id: '03', height: 68, grad: 'from-[#ffb700] to-[#ff4572]' },
    { id: '04', height: 92, grad: 'from-[#00f2fe] via-[#3b82f6] to-[#8b5cf6]' },
    { id: '05', height: 74, grad: 'from-[#ffb700] via-[#ff4572] to-[#d946ef]' },
    { id: '06', height: 100, grad: 'from-[#8b5cf6] to-[#ec4899]' },
    { id: '07', height: 80, grad: 'from-[#ff4572] to-[#ffb700]' },
    { id: '08', height: 90, grad: 'from-[#00f2fe] to-[#4facfe]' },
  ];

  return (
    <div className={`p-6 rounded-3xl border relative overflow-hidden flex flex-col justify-between transition-all duration-300 ${
      isDark 
        ? 'bg-gradient-to-br from-[#12163a]/90 via-[#0d102d]/95 to-[#090b20] border-[#2a3168]/60 shadow-[0_15px_40px_rgba(10,12,35,0.8)]' 
        : 'bg-white border-slate-200 shadow-xl'
    }`}>
      {/* Card Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[11px] font-black uppercase tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">
            TRANSACTION VOLUMES
          </span>
          <h3 className={`text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Daily Liquidity Cycles
          </h3>
        </div>
        <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
          7-Day Metric
        </span>
      </div>

      {/* Grid Canvas with Vertical Gradient Bars */}
      <div className="relative h-44 flex items-end justify-between px-2 pt-4">
        {/* Horizontal Reference Lines */}
        <div className="absolute inset-x-0 top-6 border-b border-white/[0.08] pointer-events-none" />
        <div className="absolute inset-x-0 top-18 border-b border-white/[0.08] pointer-events-none" />
        <div className="absolute inset-x-0 top-30 border-b border-white/[0.08] pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 border-b border-white/20 pointer-events-none" />

        {/* Bars */}
        {bars.map((bar, i) => (
          <div key={i} className="flex flex-col items-center gap-2 group z-10">
            {/* The Bar */}
            <div className="w-5 md:w-6 bg-slate-800/40 rounded-t-md relative flex items-end justify-center overflow-hidden h-36">
              <div 
                className={`w-full rounded-t-md bg-gradient-to-t ${bar.grad} transition-all duration-500 group-hover:brightness-125 shadow-lg`}
                style={{ height: `${bar.height}%` }}
              />
            </div>
            {/* Label */}
            <span className="text-[10px] font-mono font-bold text-slate-400 group-hover:text-cyan-400 transition-colors">
              0{i + 1}
            </span>
          </div>
        ))}
      </div>

      {/* Bottom Mini Metrics Pills */}
      <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-700/30 mt-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-amber-400 to-pink-500" />
          <span className="text-slate-400 text-[11px] font-semibold">Buy Inflow: <strong className="text-white">৳145,200</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" />
          <span className="text-slate-400 text-[11px] font-semibold">Fiat Outflow: <strong className="text-white">৳98,400</strong></span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 3. 3-LAYER MOUNTAIN / AREA SPLINE WAVE CHART (Image 1 & Image 2)
// ============================================================================
export function InfographicWaveChart({ isDark = true }) {
  return (
    <div className={`p-6 rounded-3xl border relative overflow-hidden flex flex-col justify-between transition-all duration-300 ${
      isDark 
        ? 'bg-gradient-to-br from-[#12163a]/90 via-[#0d102d]/95 to-[#090b20] border-[#2a3168]/60 shadow-[0_15px_40px_rgba(10,12,35,0.8)]' 
        : 'bg-white border-slate-200 shadow-xl'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="text-[11px] font-black uppercase tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-amber-400">
            EXCHANGE FLOW
          </span>
          <h3 className={`text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Liquidity Inflow Waves
          </h3>
        </div>
        <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-pink-500/15 text-pink-300 border border-pink-500/30">
          Real-time
        </span>
      </div>

      {/* SVG Multi-Layer Translucent Mountain Waves */}
      <div className="relative my-2">
        <svg viewBox="0 0 500 200" className="w-full h-40 overflow-visible">
          <defs>
            {/* Top Wave: Pink Gradient */}
            <linearGradient id="gradWavePink" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ff2a85" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#ff2a85" stopOpacity="0.1" />
            </linearGradient>

            {/* Middle Wave: Sunset Amber Gradient */}
            <linearGradient id="gradWaveAmber" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffb700" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.1" />
            </linearGradient>

            {/* Bottom Wave: Cyan / Ocean Gradient */}
            <linearGradient id="gradWaveCyan" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Vertical Guide Lines */}
          {[100, 200, 300, 400].map((x, i) => (
            <line key={i} x1={x} y1="0" x2={x} y2="190" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="3 3" />
          ))}

          {/* Base Horizontal Axis */}
          <line x1="0" y1="190" x2="500" y2="190" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />

          {/* Wave 3: Cyan Bottom Layer */}
          <path 
            d="M 0 190 L 0 140 Q 60 90, 120 120 T 240 100 T 360 130 T 500 80 L 500 190 Z" 
            fill="url(#gradWaveCyan)" 
          />

          {/* Wave 2: Sunset Amber Middle Layer */}
          <path 
            d="M 0 190 L 0 110 Q 70 70, 140 100 T 280 80 T 400 110 T 500 60 L 500 190 Z" 
            fill="url(#gradWaveAmber)" 
          />

          {/* Wave 1: Neon Pink Top Layer */}
          <path 
            d="M 0 190 L 0 80 Q 80 40, 160 70 T 300 50 T 420 70 T 500 30 L 500 190 Z" 
            fill="url(#gradWavePink)" 
          />
        </svg>

        {/* Timeline Markers */}
        <div className="flex justify-between text-[10px] font-mono text-slate-400 px-2 mt-1">
          <span>01</span>
          <span>02</span>
          <span>03</span>
          <span>04</span>
          <span>05</span>
        </div>
      </div>

      {/* Description / Summary */}
      <div className="pt-3 border-t border-slate-700/30 flex items-center justify-between text-xs">
        <span className="text-slate-400 font-medium">Auto Rebalancing</span>
        <span className="font-mono font-bold text-emerald-400 flex items-center gap-1">
          <TrendingUp size={13} /> +28.4% Weekly
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// 4. RADAR GAUGE & DASHBOARD ELEMENT (Exact match to User Image 2 Center)
// ============================================================================
export function InfographicRadarGauge({ isDark = true }) {
  return (
    <div className={`p-6 rounded-3xl border relative overflow-hidden flex flex-col justify-between transition-all duration-300 ${
      isDark 
        ? 'bg-gradient-to-br from-[#12163a]/90 via-[#0d102d]/95 to-[#090b20] border-[#2a3168]/60 shadow-[0_15px_40px_rgba(10,12,35,0.8)]' 
        : 'bg-white border-slate-200 shadow-xl'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="text-[11px] font-black uppercase tracking-widest text-cyan-400">
            AUTO-ENGINE
          </span>
          <h3 className={`text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Blockchain Dispatcher
          </h3>
        </div>
        <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
      </div>

      {/* Circular Radar / Speedometer Graphic */}
      <div className="flex items-center justify-center my-3 relative">
        <div className="relative w-44 h-44 rounded-full flex items-center justify-center border-4 border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.3)] bg-gradient-to-br from-[#0a1835] to-[#0d102d]">
          {/* Radial Ticks */}
          <div className="absolute inset-2 rounded-full border border-dashed border-cyan-400/40 animate-spin [animation-duration:40s]" />
          <div className="absolute inset-5 rounded-full border border-cyan-500/20" />

          {/* Inner Core */}
          <div className="relative z-10 w-24 h-24 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex flex-col items-center justify-center text-center shadow-lg shadow-cyan-500/40 p-2">
            <span className="text-[9px] font-black tracking-wider text-cyan-950 uppercase">
              STATUS
            </span>
            <span className="text-sm font-black text-white leading-tight">
              OPTIMAL
            </span>
            <span className="text-[8px] font-bold text-cyan-100">
              0.02s Lag
            </span>
          </div>
        </div>
      </div>

      {/* Quick Details */}
      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-700/30 text-center text-xs">
        <div className="p-2 rounded-xl bg-slate-900/60 border border-purple-900/30">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Gas Limit</div>
          <div className="font-mono font-bold text-cyan-300">0.05 TON</div>
        </div>
        <div className="p-2 rounded-xl bg-slate-900/60 border border-purple-900/30">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Smart Memo</div>
          <div className="font-mono font-bold text-pink-300">'TrustPay'</div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 5. GLOWING PROGRESS PILL SLIDERS (Image 1 & Image 2)
// ============================================================================
export function InfographicPillSliders({ isDark = true }) {
  return (
    <div className={`p-6 rounded-3xl border relative overflow-hidden flex flex-col justify-between transition-all duration-300 ${
      isDark 
        ? 'bg-gradient-to-br from-[#12163a]/90 via-[#0d102d]/95 to-[#090b20] border-[#2a3168]/60 shadow-[0_15px_40px_rgba(10,12,35,0.8)]' 
        : 'bg-white border-slate-200 shadow-xl'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[11px] font-black uppercase tracking-widest text-pink-400">
            AUTO RESERVES
          </span>
          <h3 className={`text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Liquidity Allocation
          </h3>
        </div>
        <Zap size={16} className="text-amber-400" />
      </div>

      {/* Pill Sliders */}
      <div className="space-y-4 my-auto">
        {/* Pill 1: Amber to Pink with Play Icon */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-white">GRAM Jetton Reserve</span>
            <span className="text-amber-400 font-mono">82%</span>
          </div>
          <div className="h-8 rounded-full bg-slate-800/60 p-1 flex items-center border border-white/10 shadow-inner">
            <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-pink-500 flex items-center justify-end pr-2 transition-all duration-1000 shadow-lg shadow-pink-500/30" style={{ width: '82%' }}>
              <span className="w-5 h-5 rounded-full bg-white text-pink-600 flex items-center justify-center shadow-md">
                <Play size={10} className="fill-pink-600 ml-0.5" />
              </span>
            </div>
          </div>
        </div>

        {/* Pill 2: Magenta to Purple with Play Icon */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-white">USDT Tether Reserve</span>
            <span className="text-purple-400 font-mono">68%</span>
          </div>
          <div className="h-8 rounded-full bg-slate-800/60 p-1 flex items-center border border-white/10 shadow-inner">
            <div className="h-full rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-end pr-2 transition-all duration-1000 shadow-lg shadow-purple-500/30" style={{ width: '68%' }}>
              <span className="w-5 h-5 rounded-full bg-white text-purple-600 flex items-center justify-center shadow-md">
                <Play size={10} className="fill-purple-600 ml-0.5" />
              </span>
            </div>
          </div>
        </div>

        {/* Pill 3: Cyan to Ocean Blue */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-white">Fiat Payout Vault</span>
            <span className="text-cyan-400 font-mono">94%</span>
          </div>
          <div className="h-8 rounded-full bg-slate-800/60 p-1 flex items-center border border-white/10 shadow-inner">
            <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 flex items-center justify-end pr-2 transition-all duration-1000 shadow-lg shadow-cyan-500/30" style={{ width: '94%' }}>
              <span className="w-5 h-5 rounded-full bg-white text-blue-600 flex items-center justify-center shadow-md">
                <Play size={10} className="fill-blue-600 ml-0.5" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-3 border-t border-slate-700/30 text-[11px] text-slate-400 flex items-center justify-between">
        <span>Instant Liquidity</span>
        <span className="font-bold text-white">৳ 350,000 Total Capacity</span>
      </div>
    </div>
  );
}

// ============================================================================
// 6. SPLINE DOT LINE CHART (Image 1 Bottom Right & Image 2 Bottom Left)
// ============================================================================
export function InfographicLineChart({ isDark = true }) {
  return (
    <div className={`p-6 rounded-3xl border relative overflow-hidden flex flex-col justify-between transition-all duration-300 ${
      isDark 
        ? 'bg-gradient-to-br from-[#12163a]/90 via-[#0d102d]/95 to-[#090b20] border-[#2a3168]/60 shadow-[0_15px_40px_rgba(10,12,35,0.8)]' 
        : 'bg-white border-slate-200 shadow-xl'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="text-[11px] font-black uppercase tracking-widest text-amber-400">
            GROWTH TRENDS
          </span>
          <h3 className={`text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Network Scalability
          </h3>
        </div>
        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30">
          Weekly Nodes
        </span>
      </div>

      {/* SVG Multi-Line Chart with Nodes */}
      <div className="relative my-2">
        <svg viewBox="0 0 400 160" className="w-full h-36 overflow-visible">
          {/* Horizontal lines */}
          <line x1="0" y1="30" x2="400" y2="30" stroke="rgba(255,255,255,0.08)" />
          <line x1="0" y1="80" x2="400" y2="80" stroke="rgba(255,255,255,0.08)" />
          <line x1="0" y1="130" x2="400" y2="130" stroke="rgba(255,255,255,0.08)" />

          {/* Vertical lines */}
          {[80, 160, 240, 320].map((x, i) => (
            <line key={i} x1={x} y1="0" x2={x} y2="150" stroke="rgba(255,255,255,0.08)" />
          ))}

          {/* Line 1: Amber Gold Path */}
          <polyline 
            fill="none" 
            stroke="#ffb700" 
            strokeWidth="3" 
            points="0,110 80,90 160,120 240,100 320,80 400,60" 
          />
          {/* Line 1 Nodes */}
          {[[0,110], [80,90], [160,120], [240,100], [320,80], [400,60]].map(([x,y], i) => (
            <circle key={i} cx={x} cy={y} r="5" fill="#ffb700" stroke="#090b20" strokeWidth="2" />
          ))}

          {/* Line 2: Neon Pink Path */}
          <polyline 
            fill="none" 
            stroke="#ff2a85" 
            strokeWidth="3" 
            points="0,80 80,110 160,135 240,95 320,120 400,70" 
          />
          {/* Line 2 Nodes */}
          {[[0,80], [80,110], [160,135], [240,95], [320,120], [400,70]].map(([x,y], i) => (
            <circle key={i} cx={x} cy={y} r="5" fill="#ff2a85" stroke="#090b20" strokeWidth="2" />
          ))}

          {/* Line 3: Electric Violet Path */}
          <polyline 
            fill="none" 
            stroke="#a855f7" 
            strokeWidth="3" 
            points="0,140 80,120 160,100 240,70 320,75 400,130" 
          />
          {/* Line 3 Nodes */}
          {[[0,140], [80,120], [160,100], [240,70], [320,75], [400,130]].map(([x,y], i) => (
            <circle key={i} cx={x} cy={y} r="5" fill="#a855f7" stroke="#090b20" strokeWidth="2" />
          ))}
        </svg>

        {/* Labels */}
        <div className="flex justify-between text-[10px] font-mono text-slate-400 px-1 mt-1">
          <span>01</span>
          <span>02</span>
          <span>03</span>
          <span>04</span>
          <span>05</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-700/30 text-xs">
        <div className="flex items-center gap-1.5 text-amber-400 font-bold">
          <span className="w-2 h-2 rounded-full bg-amber-400" /> Users
        </div>
        <div className="flex items-center gap-1.5 text-pink-400 font-bold">
          <span className="w-2 h-2 rounded-full bg-pink-400" /> Orders
        </div>
        <div className="flex items-center gap-1.5 text-purple-400 font-bold">
          <span className="w-2 h-2 rounded-full bg-purple-400" /> Liquidity
        </div>
      </div>
    </div>
  );
}
