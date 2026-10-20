import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Home, User, Users, ShieldCheck, Award, ArrowLeft, ArrowDown, ArrowUp, ArrowRight, ChevronLeft, ChevronRight, Zap, Share2, Copy, X, ArrowRightLeft, Wallet, Gift, ArrowUpRight, ArrowDownLeft, MinusCircle, TrendingUp, Sparkles, Info, CircleDollarSign, Gem, Coins, Delete, ChevronDown, Clock, Save, CheckCircle2 , Volume2, VolumeX, Check, Settings , ClipboardPaste, Loader2, PlusCircle, AlertCircle, RefreshCw, Headphones, Send, Edit3, ExternalLink, LogOut, PlayCircle, Moon, Sun } from 'lucide-react';
import { TonConnectUIProvider, TonConnectButton, useTonAddress, useTonConnectUI, THEME } from '@tonconnect/ui-react';
import WebApp from '@twa-dev/sdk';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchUserData, syncUserProfile, submitFreeTonTask, saveFiatWallet, withdrawFiat, submitSellOrder, buildTransaction, submitBuyOrder, submitAddMoney, submitBuyCrypto, submitSupportMessage, fetchMarketRates, checkCommunityMembership, verifyCommunityMembership, fetchReferralData, prepareReferralShare, fetchSpinStatus, executeSpin, watchSpinAd } from './api';
import lottie from 'lottie-web/build/player/lottie_light';
import brandLogo from './assets/trustpaylogo.png';
import referralBannerImg from './assets/referral-banner.jpg';

const stickerJsonCache = new Map();

const CrescentMoonIcon = ({ size = 18, isDark = false, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 select-none transition-transform duration-300 ${className}`}
  >
    <path
      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
      fill={isDark ? '#fbbf24' : '#4f46e5'}
      stroke={isDark ? '#fde68a' : '#4338ca'}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="18.5" cy="5.5" r="1.2" fill={isDark ? '#fde047' : '#818cf8'} />
    <circle cx="14.5" cy="3.5" r="0.85" fill={isDark ? '#fef08a' : '#a5b4fc'} />
  </svg>
);

const CustomRoseIcon = ({ size = 18, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 select-none ${className}`}
  >
    <defs>
      <radialGradient id="roseOuterGrad" cx="50%" cy="38%" r="55%">
        <stop offset="0%" stopColor="#fb7185" />
        <stop offset="55%" stopColor="#e11d48" />
        <stop offset="100%" stopColor="#9f1239" />
      </radialGradient>
      <radialGradient id="roseInnerGrad" cx="48%" cy="35%" r="50%">
        <stop offset="0%" stopColor="#fda4af" />
        <stop offset="50%" stopColor="#f43f5e" />
        <stop offset="100%" stopColor="#be123c" />
      </radialGradient>
      <linearGradient id="roseStemGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#34d399" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
    </defs>
    {/* Stem & Leaves */}
    <path d="M32 38 C32 47, 30 54, 29 60" stroke="url(#roseStemGrad)" strokeWidth="4" strokeLinecap="round" />
    <path d="M31 48 C22 47, 15 41, 18 35 C23 36, 29 41, 31 48 Z" fill="url(#roseStemGrad)" />
    <path d="M32 51 C41 50, 48 44, 45 38 C40 39, 34 44, 32 51 Z" fill="url(#roseStemGrad)" />
    {/* Outer Blooming Rose Petals */}
    <path d="M32 8 C19 8, 10 18, 13 30 C16 39, 24 43, 32 43 C40 43, 48 39, 51 30 C54 18, 45 8, 32 8 Z" fill="url(#roseOuterGrad)" />
    <path d="M16 20 C12 28, 18 39, 32 41 C46 39, 52 28, 48 20 C44 13, 38 12, 32 15 C26 12, 20 13, 16 20 Z" fill="url(#roseInnerGrad)" />
    {/* Inner Swirl Bud & Highlights */}
    <path d="M22 22 C22 15, 42 15, 42 22 C42 30, 32 35, 32 35 C32 35, 22 30, 22 22 Z" fill="#e11d48" />
    <path d="M26 21 C28 16, 36 16, 38 21 C39 25, 35 29, 32 29 C29 29, 25 25, 26 21 Z" fill="#fda4af" />
    <path d="M29 21 C31 19, 34 19, 35 22 C35 24, 33 25, 31 24" stroke="#fff1f2" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const TelegramAnimatedSticker = ({ src = 'tg-rose-sticker.json', size = 28, className = '' }) => {
  const containerRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let animInstance = null;
    let isCancelled = false;
    const fullUrl = `${import.meta.env.BASE_URL || '/app/'}${src}`;

    const mountSticker = async () => {
      try {
        let data = stickerJsonCache.get(src);
        if (!data) {
          const resp = await fetch(fullUrl);
          if (!resp.ok) throw new Error('Failed to load sticker');
          data = await resp.json();
          stickerJsonCache.set(src, data);
        }
        if (isCancelled || !containerRef.current) return;
        containerRef.current.innerHTML = '';
        animInstance = lottie.loadAnimation({
          container: containerRef.current,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          animationData: JSON.parse(JSON.stringify(data))
        });
        setLoaded(true);
      } catch (_) {
        setLoaded(false);
      }
    };

    mountSticker();

    return () => {
      isCancelled = true;
      if (animInstance) {
        try { animInstance.destroy(); } catch (_) {}
      }
    };
  }, [src]);

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 relative select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <span
        ref={containerRef}
        className="w-full h-full flex items-center justify-center"
        style={{ display: loaded ? 'flex' : 'none' }}
      />
      {!loaded && <CustomRoseIcon size={Math.round(size * 0.88)} />}
    </span>
  );
};

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

// 1. HOME: Sacred Royal Lotus Pattern
const HomeLotusPattern = ({ className = "opacity-[0.06] tp-card-flower-lotus" }) => (
  <svg 
    className={`absolute pointer-events-none select-none right-[-10px] bottom-[-10px] text-indigo-900 ${className}`} 
    width="140" 
    height="140" 
    viewBox="0 0 100 100" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M50 85 C35 70, 20 50, 50 15 C80 50, 65 70, 50 85 Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="currentColor" fillOpacity="0.06" />
    <path d="M50 85 C25 80, 5 60, 25 35 C40 50, 48 70, 50 85 Z" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" fill="currentColor" fillOpacity="0.05" />
    <path d="M50 85 C75 80, 95 60, 75 35 C60 50, 52 70, 50 85 Z" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" fill="currentColor" fillOpacity="0.05" />
    <path d="M50 85 C15 90, 0 75, 10 50 C25 65, 40 78, 50 85 Z" stroke="currentColor" strokeWidth="0.95" strokeLinecap="round" />
    <path d="M50 85 C85 90, 100 75, 90 50 C75 65, 60 78, 50 85 Z" stroke="currentColor" strokeWidth="0.95" strokeLinecap="round" />
    <circle cx="50" cy="15" r="2.2" fill="currentColor" />
    <circle cx="25" cy="35" r="1.7" fill="currentColor" />
    <circle cx="75" cy="35" r="1.7" fill="currentColor" />
  </svg>
);

// 2. ADD MONEY: Cascading Prosperity Orchid & Jasmine Blooms
const AddMoneyFloraPattern = ({ className = "opacity-[0.06] tp-card-flower-emerald" }) => (
  <svg 
    className={`absolute pointer-events-none select-none right-[-10px] bottom-[-10px] text-emerald-900 ${className}`} 
    width="145" 
    height="145" 
    viewBox="0 0 100 100" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M10 90 Q40 85, 60 55 T90 20" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    <g transform="translate(60, 55)">
      {[0, 72, 144, 216, 288].map((rot, idx) => (
        <path key={idx} d="M0 0 C-4 -12, 4 -12, 0 0" stroke="currentColor" strokeWidth="1" transform={`rotate(${rot})`} fill="currentColor" fillOpacity="0.1" />
      ))}
      <circle cx="0" cy="0" r="2" fill="currentColor" />
    </g>
    <g transform="translate(85, 25)">
      {[0, 72, 144, 216, 288].map((rot, idx) => (
        <path key={idx} d="M0 0 C-3 -9, 3 -9, 0 0" stroke="currentColor" strokeWidth="0.9" transform={`rotate(${rot})`} fill="currentColor" fillOpacity="0.1" />
      ))}
      <circle cx="0" cy="0" r="1.6" fill="currentColor" />
    </g>
    <path d="M40 70 C30 65, 25 50, 35 48 C42 55, 40 65, 40 70 Z" stroke="currentColor" strokeWidth="1" fill="currentColor" fillOpacity="0.07" />
    <path d="M70 42 C78 38, 85 45, 80 50 C74 48, 72 44, 70 42 Z" stroke="currentColor" strokeWidth="0.9" />
  </svg>
);

// 3. SELL CRYPTO: Sacred Geometric Swap Mandala Blossom
const SellCryptoMandalaPattern = ({ className = "opacity-[0.06] tp-card-flower-mandala" }) => (
  <svg 
    className={`absolute pointer-events-none select-none right-[-10px] bottom-[-10px] text-indigo-950 ${className}`} 
    width="140" 
    height="140" 
    viewBox="0 0 100 100" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="50" cy="50" r="32" stroke="currentColor" strokeWidth="0.9" strokeDasharray="3 3" />
    <circle cx="50" cy="50" r="14" stroke="currentColor" strokeWidth="1.1" />
    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
      <g key={i} transform={`rotate(${angle} 50 50)`}>
        <path d="M50 14 C44 26, 44 38, 50 50 C56 38, 56 26, 50 14 Z" stroke="currentColor" strokeWidth="1.1" fill="currentColor" fillOpacity="0.06" />
        <circle cx="50" cy="14" r="1.6" fill="currentColor" />
      </g>
    ))}
    <circle cx="50" cy="50" r="3.2" fill="currentColor" />
  </svg>
);

// 4. PROFILE: Imperial Laurel Botanical Wreath
const ProfileImperialFloraPattern = ({ className = "opacity-[0.06] tp-card-flower-imperial" }) => (
  <svg 
    className={`absolute pointer-events-none select-none right-[-10px] bottom-[-10px] text-blue-950 ${className}`} 
    width="140" 
    height="140" 
    viewBox="0 0 100 100" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M25 80 C20 50, 35 25, 50 20 C65 25, 80 50, 75 80" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    <path d="M30 65 C22 60, 24 50, 32 55" stroke="currentColor" strokeWidth="1.1" fill="currentColor" fillOpacity="0.07" />
    <path d="M70 65 C78 60, 76 50, 68 55" stroke="currentColor" strokeWidth="1.1" fill="currentColor" fillOpacity="0.07" />
    <path d="M35 48 C28 42, 32 34, 40 40" stroke="currentColor" strokeWidth="1.1" fill="currentColor" fillOpacity="0.07" />
    <path d="M65 48 C72 42, 68 34, 60 40" stroke="currentColor" strokeWidth="1.1" fill="currentColor" fillOpacity="0.07" />
    <circle cx="50" cy="18" r="2.6" fill="currentColor" />
    <path d="M50 14 Q46 6, 50 2 Q54 6, 50 14" stroke="currentColor" strokeWidth="1.1" fill="currentColor" fillOpacity="0.12" />
  </svg>
);

// 5. WITHDRAW: Harvest Golden Lily & Upward Tulip Bloom
const WithdrawLilyPattern = ({ className = "opacity-[0.06] tp-card-flower-lily" }) => (
  <svg 
    className={`absolute pointer-events-none select-none right-[-10px] bottom-[-10px] text-amber-950 ${className}`} 
    width="140" 
    height="140" 
    viewBox="0 0 100 100" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M50 90 Q50 65, 50 45" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M50 60 C35 55, 18 40, 24 20 C35 32, 45 42, 50 55" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.08" />
    <path d="M50 60 C65 55, 82 40, 76 20 C65 32, 55 42, 50 55" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.08" />
    <path d="M50 50 C44 35, 42 20, 50 10 C58 20, 56 35, 50 50" stroke="currentColor" strokeWidth="1.3" fill="currentColor" fillOpacity="0.1" />
    <circle cx="50" cy="8" r="2.2" fill="currentColor" />
    <circle cx="23" cy="18" r="1.6" fill="currentColor" />
    <circle cx="77" cy="18" r="1.6" fill="currentColor" />
  </svg>
);

// 6. REFERRAL: Royal Blooming Damask Rose & Rosebud Botanical Pattern
const ReferralRosePattern = ({ className = "opacity-[0.08] tp-card-flower-rose" }) => (
  <svg 
    className={`absolute pointer-events-none select-none right-[-10px] bottom-[-10px] text-rose-700 ${className}`} 
    width="150" 
    height="150" 
    viewBox="0 0 100 100" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Outer Blooming Rose Petals */}
    {[0, 60, 120, 180, 240, 300].map((angle, i) => (
      <g key={`outer-${i}`} transform={`rotate(${angle} 50 46)`}>
        <path 
          d="M50 12 C34 16, 26 30, 36 44 C42 50, 58 50, 64 44 C74 30, 66 16, 50 12 Z" 
          stroke="currentColor" 
          strokeWidth="1.2" 
          fill="currentColor" 
          fillOpacity="0.07" 
        />
      </g>
    ))}
    {/* Middle Cupped Rose Petals */}
    {[30, 102, 174, 246, 318].map((angle, i) => (
      <g key={`mid-${i}`} transform={`rotate(${angle} 50 46)`}>
        <path 
          d="M50 22 C39 24, 35 35, 42 44 C46 48, 54 48, 58 44 C65 35, 61 24, 50 22 Z" 
          stroke="currentColor" 
          strokeWidth="1.25" 
          fill="currentColor" 
          fillOpacity="0.1" 
        />
      </g>
    ))}
    {/* Inner Spiraling Rosebud Core */}
    <path 
      d="M50 32 C43 32, 40 39, 44 45 C48 50, 56 49, 57 43 C58 37, 52 35, 48 38 C45 41, 47 45, 51 44" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
    />
    {/* Rose Stem & Serrated Rose Leaves */}
    <path d="M50 68 Q49 82, 46 95" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M48 77 C36 74, 25 80, 28 87 C35 88, 43 83, 48 77 Z" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.09" />
    <path d="M49 82 C61 79, 72 85, 69 92 C62 93, 54 88, 49 82 Z" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.09" />
  </svg>
);

// Backward-compatibility alias
const FloralWatermark = HomeLotusPattern;

const PageBackgroundFlowers = ({ page = 'home', darkMode = false }) => (
  <div className="fixed inset-0 pointer-events-none select-none z-0 overflow-hidden">
    {/* Ambient Dark Mode Glow Auras behind the botanical flower art */}
    {darkMode && (
      <>
        <div
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl opacity-30"
          style={{
            background:
              page === 'referral'
                ? 'radial-gradient(circle, rgba(244,63,94,0.5) 0%, transparent 70%)'
                : page === 'add-money'
                ? 'radial-gradient(circle, rgba(16,185,129,0.45) 0%, transparent 70%)'
                : page === 'withdraw'
                ? 'radial-gradient(circle, rgba(245,158,11,0.4) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(99,102,241,0.5) 0%, transparent 70%)'
          }}
        />
        <div
          className="absolute bottom-8 -left-24 w-96 h-96 rounded-full blur-3xl opacity-25"
          style={{
            background:
              page === 'referral'
                ? 'radial-gradient(circle, rgba(236,72,153,0.45) 0%, transparent 70%)'
                : page === 'sell'
                ? 'radial-gradient(circle, rgba(168,85,247,0.45) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(56,189,248,0.4) 0%, transparent 70%)'
          }}
        />
      </>
    )}

    {page === 'home' && (
      <>
        <div className="absolute -top-10 -right-10 w-80 h-80 text-indigo-900 opacity-[0.045] tp-bg-flower-home transform rotate-12">
          <HomeLotusPattern className="w-full h-full opacity-100" />
        </div>
        <div className="absolute top-[38%] -left-20 w-72 h-72 text-indigo-900 opacity-[0.03] tp-bg-flower-home transform rotate-25">
          <HomeLotusPattern className="w-full h-full opacity-100" />
        </div>
        <div className="absolute bottom-12 -left-10 w-80 h-80 text-indigo-900 opacity-[0.04] tp-bg-flower-home transform -rotate-45">
          <HomeLotusPattern className="w-full h-full opacity-100" />
        </div>
      </>
    )}
    {page === 'add-money' && (
      <>
        <div className="absolute -top-10 -right-10 w-80 h-80 text-emerald-800 opacity-[0.05] tp-bg-flower-addmoney transform rotate-6">
          <AddMoneyFloraPattern className="w-full h-full opacity-100" />
        </div>
        <div className="absolute top-[40%] -left-16 w-72 h-72 text-emerald-800 opacity-[0.035] tp-bg-flower-addmoney transform rotate-15">
          <AddMoneyFloraPattern className="w-full h-full opacity-100" />
        </div>
        <div className="absolute bottom-16 -left-10 w-80 h-80 text-emerald-800 opacity-[0.045] tp-bg-flower-addmoney transform -rotate-30">
          <AddMoneyFloraPattern className="w-full h-full opacity-100" />
        </div>
      </>
    )}
    {page === 'sell' && (
      <>
        <div className="absolute -top-12 -right-12 w-84 h-84 text-indigo-950 opacity-[0.045] tp-bg-flower-sell transform rotate-45">
          <SellCryptoMandalaPattern className="w-full h-full opacity-100" />
        </div>
        <div className="absolute top-[36%] -right-20 w-72 h-72 text-indigo-950 opacity-[0.035] tp-bg-flower-sell transform -rotate-25">
          <SellCryptoMandalaPattern className="w-full h-full opacity-100" />
        </div>
        <div className="absolute bottom-14 -left-14 w-84 h-84 text-indigo-950 opacity-[0.04] tp-bg-flower-sell transform -rotate-12">
          <SellCryptoMandalaPattern className="w-full h-full opacity-100" />
        </div>
      </>
    )}
    {page === 'profile' && (
      <>
        <div className="absolute -top-10 -right-10 w-80 h-80 text-blue-950 opacity-[0.045] tp-bg-flower-profile transform rotate-12">
          <ProfileImperialFloraPattern className="w-full h-full opacity-100" />
        </div>
        <div className="absolute top-[38%] -left-16 w-72 h-72 text-blue-950 opacity-[0.035] tp-bg-flower-profile transform rotate-20">
          <ProfileImperialFloraPattern className="w-full h-full opacity-100" />
        </div>
        <div className="absolute bottom-16 -left-10 w-80 h-80 text-blue-950 opacity-[0.04] tp-bg-flower-profile transform -rotate-45">
          <ProfileImperialFloraPattern className="w-full h-full opacity-100" />
        </div>
      </>
    )}
    {page === 'withdraw' && (
      <>
        <div className="absolute -top-10 -right-10 w-80 h-80 text-amber-950 opacity-[0.05] tp-bg-flower-withdraw transform rotate-15">
          <WithdrawLilyPattern className="w-full h-full opacity-100" />
        </div>
        <div className="absolute top-[38%] -left-16 w-72 h-72 text-amber-950 opacity-[0.035] tp-bg-flower-withdraw transform rotate-20">
          <WithdrawLilyPattern className="w-full h-full opacity-100" />
        </div>
        <div className="absolute bottom-16 -left-10 w-80 h-80 text-amber-950 opacity-[0.045] tp-bg-flower-withdraw transform -rotate-30">
          <WithdrawLilyPattern className="w-full h-full opacity-100" />
        </div>
      </>
    )}
    {page === 'referral' && (
      <>
        <div className={`absolute inset-0 ${darkMode ? 'bg-gradient-to-b from-rose-950/35 via-fuchsia-950/15 to-transparent' : 'bg-gradient-to-b from-rose-50/50 via-pink-50/20 to-transparent'}`} />
        <div className="absolute -top-10 -right-10 w-80 h-80 text-rose-600 opacity-[0.075] tp-bg-flower-referral transform rotate-12">
          <ReferralRosePattern className="w-full h-full opacity-100" />
        </div>
        <div className="absolute top-1/3 -left-16 w-72 h-72 text-rose-500 opacity-[0.055] tp-bg-flower-referral transform -rotate-25">
          <ReferralRosePattern className="w-full h-full opacity-100" />
        </div>
        <div className="absolute bottom-10 -right-12 w-80 h-80 text-rose-700 opacity-[0.065] tp-bg-flower-referral transform rotate-30">
          <ReferralRosePattern className="w-full h-full opacity-100" />
        </div>
      </>
    )}
    {page !== 'home' && page !== 'add-money' && page !== 'sell' && page !== 'profile' && page !== 'withdraw' && page !== 'referral' && (
      <>
        <div className="absolute -top-12 -right-12 w-80 h-80 text-indigo-900 opacity-[0.045] tp-bg-flower-home">
          <HomeLotusPattern className="w-full h-full opacity-100" />
        </div>
        <div className="absolute bottom-12 -left-12 w-80 h-80 text-indigo-900 opacity-[0.04] tp-bg-flower-home transform -rotate-35">
          <HomeLotusPattern className="w-full h-full opacity-100" />
        </div>
      </>
    )}
  </div>
);

const BloomingFlowerGraphic = ({ size = 145 }) => {
  const outerSize = size;
  const innerSize = Math.round(size * (125 / 170)); // proportional inner petals (~106px)
  const logoSize = Math.round(size * (90 / 170));   // proportional 3D logo (~76px)
  const outerRef = useRef(null);
  const innerRef = useRef(null);

  useEffect(() => {
    let rafId;
    let degOuter = 0;
    let degInner = 0;
    let lastTime = performance.now();

    const animate = (time) => {
      let dt = (time - lastTime) / 1000;
      lastTime = time;
      if (dt > 0.3 || dt < 0) dt = 0.016;
      degOuter = (degOuter + dt * 45) % 360;
      degInner = (degInner - dt * 60) % 360;
      if (outerRef.current) {
        outerRef.current.style.webkitTransform = `rotate(${degOuter.toFixed(2)}deg)`;
        outerRef.current.style.transform = `rotate(${degOuter.toFixed(2)}deg)`;
      }
      if (innerRef.current) {
        innerRef.current.style.webkitTransform = `rotate(${degInner.toFixed(2)}deg)`;
        innerRef.current.style.transform = `rotate(${degInner.toFixed(2)}deg)`;
      }
      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div 
      className="relative mx-auto my-1 flex items-center justify-center select-none"
      style={{ width: `${outerSize}px`, height: `${outerSize}px` }}
    >
      <style>{`
        @keyframes tpGlowPulse {
          0%, 100% { transform: scale(0.92); opacity: 0.6; }
          50% { transform: scale(1.08); opacity: 1; }
        }
        @keyframes tpPulseLogo {
          0%, 100% { transform: scale(0.96); filter: drop-shadow(0 8px 24px rgba(79, 70, 229, 0.4)); }
          50% { transform: scale(1.04); filter: drop-shadow(0 14px 34px rgba(147, 51, 234, 0.6)); }
        }
      `}</style>

      {/* Ambient Radial Glowing Aura */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '9999px',
          background: 'radial-gradient(circle, rgba(99,102,241,0.32) 0%, rgba(168,85,247,0.22) 50%, transparent 75%)',
          filter: 'blur(16px)',
          animation: 'tpGlowPulse 2.8s infinite ease-in-out'
        }} 
      />

      {/* Outer Rotating Sacred Lotus Mandala */}
      <div
        ref={outerRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transformOrigin: 'center center',
          WebkitTransformOrigin: 'center center',
          willChange: 'transform',
          pointerEvents: 'none'
        }}
      >
        <svg 
          style={{
            width: '100%',
            height: '100%',
            display: 'block'
          }} 
          viewBox="0 0 200 200" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <g>
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
              <g key={i} transform={`rotate(${angle} 100 100)`}>
                <path 
                  className="splash-outer-petal"
                  d="M100 20 C85 45, 80 75, 100 95 C120 75, 115 45, 100 20 Z" 
                  fill="rgba(99,102,241,0.18)" 
                  stroke="rgba(99,102,241,0.6)" 
                  strokeWidth="1.2"
                />
                <circle className="splash-outer-dot" cx="100" cy="18" r="2.5" fill="#6366f1" />
              </g>
            ))}
          </g>
        </svg>
      </div>

      {/* Middle Counter-rotating Petal Layer */}
      <div
        ref={innerRef}
        style={{
          position: 'absolute',
          width: `${innerSize}px`,
          height: `${innerSize}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transformOrigin: 'center center',
          WebkitTransformOrigin: 'center center',
          willChange: 'transform',
          pointerEvents: 'none'
        }}
      >
        <svg 
          style={{
            width: '100%',
            height: '100%',
            display: 'block'
          }} 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <g>
            {[0, 60, 120, 180, 240, 300].map((angle, i) => (
              <g key={i} transform={`rotate(${angle} 50 50)`}>
                <path 
                  className="splash-inner-petal"
                  d="M50 15 C42 28, 40 40, 50 48 C60 40, 58 28, 50 15 Z" 
                  fill="rgba(168,85,247,0.22)" 
                  stroke="rgba(147,51,234,0.6)" 
                  strokeWidth="1"
                />
              </g>
            ))}
          </g>
        </svg>
      </div>

      {/* Center Heart: 3D Transparent Trust Pay Logo */}
      <div 
        style={{
          position: 'relative',
          zIndex: 10,
          width: `${logoSize}px`,
          height: `${logoSize}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'tpPulseLogo 2.5s infinite ease-in-out'
        }}
      >
        <img 
          src={brandLogo} 
          alt="Trust Pay" 
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain'
          }} 
        />
      </div>
    </div>
  );
};

const BloomingFlowerLoader = ({ lang = 'bn' }) => (
  <div className="fixed inset-0 bg-[var(--color-bg-primary)] z-[99999] flex flex-col items-center justify-center font-sans select-none p-4 overflow-hidden">
    <PageBackgroundFlowers page="home" darkMode={typeof document !== 'undefined' && document.documentElement.classList.contains('dark')} />
    <div className="relative z-10 flex flex-col items-center justify-center">
      <BloomingFlowerGraphic size={170} />

      {/* Typography */}
      <h2 className="text-[#0f172a] font-black text-2xl mt-5 tracking-tight flex items-center gap-1.5">
        Trust Pay
      </h2>
      <div className="flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100/80">
        <div className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
        <span className="text-[12px] font-bold text-indigo-700">
          {lang === 'bn' ? 'লোড হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...' : 'Loading, please wait...'}
        </span>
      </div>

      {/* Shimmer Progress Line */}
      <div className="w-36 h-1 bg-slate-200/80 rounded-full mt-4 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 rounded-full animate-pulse" />
      </div>
    </div>
  </div>
);

const CutCornerCard = ({ children, className = '', containerClassName = '', onClick, flower = null }) => {
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  return (
    <div 
      onClick={onClick}
      className={`tp-cut-corner-outer relative p-[1.5px] ${
        isDark
          ? 'bg-gradient-to-br from-indigo-500/35 via-slate-700/85 to-purple-500/30 shadow-[0_10px_28px_rgba(0,0,0,0.55)]'
          : 'bg-gradient-to-br from-slate-200 via-slate-100 to-indigo-100/70 shadow-[0_4px_16px_rgba(15,23,42,0.04)]'
      } transition-colors duration-200 ${containerClassName}`}
      style={{
        clipPath: 'polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)',
      }}
    >
      <div 
        className={`tp-cut-corner-inner relative bg-white w-full h-full overflow-hidden transition-colors duration-200 ${className}`}
        style={{
          clipPath: 'polygon(11px 0, calc(100% - 11px) 0, 100% 11px, 100% calc(100% - 11px), calc(100% - 11px) 100%, 11px 100%, 0 calc(100% - 11px), 0 11px)',
        }}
      >
        {flower || <HomeLotusPattern />}
        <div className="relative z-10 w-full">{children}</div>
      </div>
    </div>
  );
};

const CutCornerButton = ({ 
  children, 
  onClick, 
  disabled = false, 
  isSubmitting = false, 
  icon: Icon, 
  className = '', 
  variant = 'primary'
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isSubmitting}
      className={`relative w-full h-[50px] font-extrabold text-[14px] tracking-wide flex items-center justify-center gap-2 overflow-hidden transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ${
        variant === 'primary'
          ? 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 text-white shadow-[0_8px_20px_rgba(79,70,229,0.25)] hover:shadow-[0_10px_25px_rgba(79,70,229,0.35)]'
          : 'bg-white border border-slate-200 text-slate-800 hover:bg-slate-50'
      } ${className}`}
      style={{
        clipPath: 'polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)',
      }}
    >
      {/* Subtle Flower Watermark in Button */}
      <svg
        className="absolute -right-4 -bottom-4 w-20 h-20 text-white/10 pointer-events-none transform rotate-12"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M50 85 C35 70, 20 50, 50 15 C80 50, 65 70, 50 85 Z" stroke="currentColor" strokeWidth="2.5" />
        <path d="M50 85 C25 80, 5 60, 25 35 C40 50, 48 70, 50 85 Z" stroke="currentColor" strokeWidth="2" />
        <path d="M50 85 C75 80, 95 60, 75 35 C60 50, 52 70, 50 85 Z" stroke="currentColor" strokeWidth="2" />
      </svg>
      
      {isSubmitting ? (
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        <>
          {Icon && <Icon size={18} className="shrink-0" />}
          <span className="relative z-10">{children}</span>
        </>
      )}
    </button>
  );
};

const calculateSendMoneyFee = (amt) => {
  const a = parseFloat(amt) || 0;
  if (a <= 0 || a <= 30) return 0; // 20-30 BDT no fee
  if (a >= 1500) return 30;
  if (a > 1000) return 20;
  if (a > 500) return 10;
  if (a > 100) return 7;
  return 5;
};


const WithdrawFlowerModal = ({ isOpen, onClose, details, lang = 'bn' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className="relative bg-white w-full max-w-[340px] p-6 text-center shadow-[0_20px_50px_rgba(79,70,229,0.25)] border border-indigo-100/60 animate-in zoom-in-95 duration-300"
        style={{
          clipPath: 'polygon(16px 0, calc(100% - 16px) 0, 100% 16px, 100% calc(100% - 16px), calc(100% - 16px) 100%, 16px 100%, 0 calc(100% - 16px), 0 16px)',
        }}
      >
        <WithdrawLilyPattern className="opacity-[0.06]" />
        
        {/* Blooming Flower Graphic */}
        <BloomingFlowerGraphic />

        {/* Title & Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[11px] font-black uppercase tracking-wider mb-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          {lang === 'bn' ? 'রিকোয়েস্ট সফল' : 'REQUEST SUBMITTED'}
        </div>
        <h3 className="text-[18px] font-black text-slate-900 leading-tight mb-1">
          {lang === 'bn' ? 'উইথড্র রিকোয়েস্ট সফল!' : 'Withdrawal Submitted!'}
        </h3>
        <p className="text-[12px] text-slate-500 font-medium mb-4 leading-relaxed">
          {lang === 'bn' ? 'আপনার রিকোয়েস্টটি সফলভাবে জমা হয়েছে এবং প্রসেসিং চলছে।' : 'Your withdrawal request has been received and is processing.'}
        </p>

        {/* Breakdown Card */}
        {details && (
          <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-200/80 mb-4 text-left space-y-2 text-[12px]">
            <div className="flex justify-between items-center text-slate-600">
              <span>{lang === 'bn' ? 'উত্তোলন:' : 'Amount:'}</span>
              <span className="font-bold text-slate-900">৳ {parseFloat(details.amount || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-red-500">
              <span>{lang === 'bn' ? 'সেন্ড মানি ফি:' : 'Send Money Fee:'}</span>
              <span className="font-bold">- ৳ {parseFloat(details.fee || 0).toFixed(2)}</span>
            </div>
            <div className="h-px bg-slate-200 w-full my-1" />
            <div className="flex justify-between items-center text-emerald-700">
              <span className="font-bold">{lang === 'bn' ? 'আপনি পাবেন:' : 'You Receive:'}</span>
              <span className="font-black text-[14px]">৳ {parseFloat(details.receiveAmount || 0).toFixed(2)}</span>
            </div>
            {details.method && (
              <div className="flex justify-between items-center text-slate-500 text-[11px] pt-1 border-t border-slate-200/50">
                <span>{lang === 'bn' ? 'প্রাপক অ্যাকাউন্ট:' : 'Account:'}</span>
                <span className="font-mono font-bold text-slate-700">{details.method} ({details.number})</span>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <CutCornerButton onClick={onClose} icon={CheckCircle2}>
          {lang === 'bn' ? 'বুঝেছি (ঠিক আছে)' : 'GOT IT'}
        </CutCornerButton>
      </div>
    </div>
  );
};

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
    appName: 'Trust Pay',
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
    fee: 'সেন্ড মানি ফি',
    youReceive: 'আপনি পাবেন',
    withdrawNote: 'উইথড্র রিকোয়েস্ট সাধারণত ১ থেকে ২ ঘণ্টার মধ্যে এবং সর্বোচ্চ ২৪ ঘণ্টার মধ্যে সম্পন্ন হয়।',
    loading: 'লোড হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...',
    howToUse: 'বটটি যেভাবে ব্যবহার করবেন',
    step1Title: 'টাকা আয় করুন:',
    step1Desc: 'বটটি চালু রাখুন এবং ব্যালেন্সে টাকা যুক্ত বা লেনদেন করে পয়েন্ট ও ক্যাশ আয় করুন।',
    step2Title: 'ওয়ালেট যুক্ত করুন:',
    step2Desc: 'উইথড্র এবং স্বয়ংক্রিয় লেনদেনের জন্য নিরাপদে আপনার TON ওয়ালেট কানেক্ট করুন।',
    step3Title: 'উত্তোলন করুন:',
    step3Desc: 'আপনার অর্জিত ব্যালেন্স সরাসরি বিকাশ/নগদে অথবা ক্রিপ্টোতে তুলে নিন।'
  },
  en: {
    appName: 'Trust Pay',
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
    fee: 'Send Money Fee',
    youReceive: 'You will receive',
    withdrawNote: 'Withdrawals usually take 1 to 2 hours or up to 24 hours to process.',
    loading: 'Loading, please wait...',
    howToUse: 'How to use this bot',
    step1Title: 'Earn TK:',
    step1Desc: 'Start the bot and keep it active to accumulate TK points and earnings.',
    step2Title: 'Connect Wallet:',
    step2Desc: 'Link your TON wallet securely to enable withdrawals and swaps.',
    step3Title: 'Withdraw:',
    step3Desc: 'Convert your earned TK balance to USDT or BDT directly to your account.'
  }
};

function ConnectedWalletModal({ isOpen, onClose, userTonAddress, onDisconnect, lang = 'bn' }) {
  const [copied, setCopied] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  if (!isOpen || !userTonAddress) return null;

  const firstChars = userTonAddress.slice(0, 6);
  const lastChars = userTonAddress.slice(-6);

  const handleCopy = () => {
    if (!userTonAddress) return;
    navigator.clipboard.writeText(userTonAddress);
    setCopied(true);
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDisconnectClick = async () => {
    setIsDisconnecting(true);
    try {
      if (onDisconnect) {
        await onDisconnect();
      }
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }
      onClose();
    } catch (err) {
      console.error('Disconnect error:', err);
    } finally {
      setIsDisconnecting(false);
    }
  };

  const modalNode = (
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative bg-white w-full max-w-[340px] p-5 text-center shadow-[0_20px_50px_rgba(79,70,229,0.25)] border border-indigo-100/80 animate-in zoom-in-95 duration-200"
        style={{
          clipPath: 'polygon(16px 0, calc(100% - 16px) 0, 100% 16px, 100% calc(100% - 16px), calc(100% - 16px) 100%, 16px 100%, 0 calc(100% - 16px), 0 16px)',
        }}
      >
        <WithdrawLilyPattern className="opacity-[0.05]" />

        {/* Top Close Icon */}
        <button 
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors z-10 cursor-pointer"
        >
          <X size={15} />
        </button>

        {/* Trust Pay Logo with Ring */}
        <div className="relative w-16 h-16 mx-auto mb-2.5 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-indigo-500/10 animate-ping opacity-60" />
          <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-50 to-purple-50 p-1 border border-indigo-100/80 shadow-xs flex items-center justify-center">
            <img src={brandLogo} alt="Trust Pay" className="w-full h-full object-contain drop-shadow-[0_4px_10px_rgba(79,70,229,0.3)]" />
          </div>
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[11px] font-black uppercase tracking-wider mb-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{lang === 'bn' ? 'ওয়ালেট সংযুক্ত' : 'WALLET CONNECTED'}</span>
        </div>

        <h3 className="text-[17px] font-black text-slate-900 leading-tight mb-1">
          {lang === 'bn' ? 'কানেক্টেড TON ওয়ালেট' : 'Connected TON Wallet'}
        </h3>
        <p className="text-[11px] text-slate-500 font-medium mb-3.5 leading-relaxed">
          {lang === 'bn' ? 'আপনার ওয়ালেটটি Trust Pay অ্যাপের সাথে সংযুক্ত রয়েছে' : 'Your TON wallet is securely linked with Trust Pay'}
        </p>

        {/* Address Card with First & Last Characters Highlighted */}
        <div className="bg-slate-50/90 rounded-2xl p-3 border border-slate-200/80 mb-3.5 text-left space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {lang === 'bn' ? 'ওয়ালেট অ্যাড্রেস:' : 'Wallet Address:'}
            </span>
            <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 border border-indigo-100/80 px-2 py-0.5 rounded-full">
              TON Mainnet
            </span>
          </div>

          {/* Prominent First & Last Characters Box */}
          <div className="bg-white border border-slate-200 rounded-xl p-2.5 flex items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-1.5 font-mono text-[13px] font-black tracking-tight">
              <span className="text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100/60 font-bold">
                {firstChars}
              </span>
              <span className="text-slate-300 font-bold text-base tracking-widest">••••</span>
              <span className="text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100/60 font-bold">
                {lastChars}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className={`px-2.5 py-1.5 rounded-lg transition-all active:scale-95 flex items-center gap-1 text-[11px] font-bold cursor-pointer ${
                copied 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
              title={lang === 'bn' ? 'সম্পূর্ণ অ্যাড্রেস কপি করুন' : 'Copy address'}
            >
              {copied ? (
                <>
                  <Check size={13} className="text-emerald-600" />
                  <span>{lang === 'bn' ? 'কপি হয়েছে' : 'Copied'}</span>
                </>
              ) : (
                <>
                  <Copy size={13} className="text-slate-500" />
                  <span>{lang === 'bn' ? 'কপি' : 'Copy'}</span>
                </>
              )}
            </button>
          </div>

          {/* Full Address details */}
          <div className="pt-0.5">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
              {lang === 'bn' ? 'সম্পূর্ণ অ্যাড্রেস:' : 'Full Address:'}
            </p>
            <p className="text-[10px] text-slate-600 font-mono break-all leading-tight bg-slate-100/70 p-1.5 rounded-lg border border-slate-200/60 select-all">
              {userTonAddress}
            </p>
          </div>
        </div>

        {/* Disconnect Button directly below address */}
        <button
          type="button"
          onClick={handleDisconnectClick}
          disabled={isDisconnecting}
          className="w-full py-2.5 px-4 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xs cursor-pointer disabled:opacity-50"
        >
          {isDisconnecting ? (
            <>
              <Loader2 size={15} className="animate-spin text-rose-500" />
              <span>{lang === 'bn' ? 'ডিসকানেক্ট হচ্ছে...' : 'Disconnecting...'}</span>
            </>
          ) : (
            <>
              <LogOut size={15} className="text-rose-500" />
              <span>{lang === 'bn' ? 'ওয়ালেট ডিসকানেক্ট করুন' : 'Disconnect Wallet'}</span>
            </>
          )}
        </button>

        {/* Back / Close button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full mt-2 py-1.5 text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
        >
          {lang === 'bn' ? 'ফিরে যান' : 'Close'}
        </button>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalNode, document.body) : modalNode;
}

function HeaderWalletButton({ lang = 'bn', setIsModalOpen, user }) {
  const userTonAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();
  const [showWalletModal, setShowWalletModal] = useState(false);

  useEffect(() => {
    if (userTonAddress && user?.id) {
      syncUserProfile({
        userId: user.id,
        first_name: user.first_name,
        username: user.username,
        tonAddress: userTonAddress,
      }).catch(() => {});
    }
  }, [userTonAddress, user?.id]);

  const handleDisconnect = async () => {
    if (tonConnectUI) {
      await tonConnectUI.disconnect();
    }
  };

  const handleOpenModal = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowWalletModal(true);
    if (setIsModalOpen) setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setShowWalletModal(false);
    if (setIsModalOpen) setIsModalOpen(false);
  };

  if (userTonAddress) {
    return (
      <>
        <button 
          type="button"
          onClick={handleOpenModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm active:scale-95 transition-all cursor-pointer"
          title={userTonAddress}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="text-[12px] font-extrabold tracking-tight">Connected</span>
        </button>

        <ConnectedWalletModal
          isOpen={showWalletModal}
          onClose={handleCloseModal}
          userTonAddress={userTonAddress}
          onDisconnect={handleDisconnect}
          lang={lang}
        />
      </>
    );
  }

  return (
    <button 
      type="button"
      onClick={() => tonConnectUI.openModal()}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0098ea] hover:bg-[#0088d1] text-white shadow-sm shadow-[#0098ea]/20 active:scale-95 transition-all cursor-pointer"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0">
        <path d="M12 2L3 7L12 12L21 7L12 12Z" fill="currentColor"/>
        <path d="M3 17L12 22L21 17L12 12L3 17Z" fill="currentColor" fillOpacity="0.8"/>
      </svg>
      <span className="text-[12px] font-extrabold tracking-tight">Connect</span>
    </button>
  );
}

const GUEST_ID = 123456789;

function resolveTelegramUser() {
  try {
    const candidates = [
      window.Telegram?.WebApp?.initDataUnsafe?.user,
      WebApp?.initDataUnsafe?.user
    ];
    for (const c of candidates) {
      if (c && c.id && Number(c.id) !== GUEST_ID) {
        try {
          sessionStorage.setItem('tp_verified_tg_user', JSON.stringify(c));
          localStorage.setItem('tp_verified_tg_user', JSON.stringify(c));
        } catch (_) {}
        return c;
      }
    }

    // Parse URL hash / search params for tgWebAppData if present
    const rawParams = [window.location.hash.slice(1), window.location.search.slice(1)];
    for (const raw of rawParams) {
      if (!raw) continue;
      const params = new URLSearchParams(raw);
      const tgData = params.get('tgWebAppData');
      if (tgData) {
        const innerParams = new URLSearchParams(tgData);
        const userJson = innerParams.get('user');
        if (userJson) {
          const parsed = JSON.parse(userJson);
          if (parsed && parsed.id && Number(parsed.id) !== GUEST_ID) {
            try {
              sessionStorage.setItem('tp_verified_tg_user', JSON.stringify(parsed));
              localStorage.setItem('tp_verified_tg_user', JSON.stringify(parsed));
            } catch (_) {}
            return parsed;
          }
        }
      }
    }

    // Check Telegram's internal sessionStorage __telegram__initParams
    try {
      const tgInit = sessionStorage.getItem('__telegram__initParams');
      if (tgInit) {
        const parsedInit = JSON.parse(tgInit);
        if (parsedInit?.tgWebAppData) {
          const innerParams = new URLSearchParams(parsedInit.tgWebAppData);
          const userJson = innerParams.get('user');
          if (userJson) {
            const parsed = JSON.parse(userJson);
            if (parsed && parsed.id && Number(parsed.id) !== GUEST_ID) {
              localStorage.setItem('tp_verified_tg_user', JSON.stringify(parsed));
              return parsed;
            }
          }
        }
      }
    } catch (_) {}

    // Fallback to previously verified Telegram user across WebView refreshes
    const cached = sessionStorage.getItem('tp_verified_tg_user') || localStorage.getItem('tp_verified_tg_user');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.id && Number(parsed.id) !== GUEST_ID) {
        return parsed;
      }
    }
  } catch (_) {}
  return { id: GUEST_ID, first_name: 'Guest', last_name: 'Account', username: '' };
}

export default function App() {
  const [lang, setLang] = useState(() => localStorage.getItem('app_lang') || 'bn');
  const t = translations[lang] || translations.bn;

  // Synchronous initial Dark Mode read so React matches index.html at 0ms with zero flash
  const [darkMode, setDarkMode] = useState(() => {
    try {
      if (window.__TP_THEME__ === 'dark') return true;
      if (window.__TP_THEME__ === 'light') return false;
      const saved = localStorage.getItem('tp_theme_mode');
      if (saved === 'dark') return true;
      if (saved === 'light') return false;
      return document.documentElement.classList.contains('dark');
    } catch (_) {
      return false;
    }
  });

  const applyThemeMode = (isDark, syncBackend = false) => {
    const modeStr = isDark ? 'dark' : 'light';
    window.__TP_THEME__ = modeStr;
    try {
      if (isDark) {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
      }
      localStorage.setItem('tp_theme_mode', modeStr);
      document.cookie = 'tp_theme_mode=' + modeStr + '; path=/; max-age=31536000; SameSite=Lax';
    } catch (_) {}

    try {
      const tg = window.Telegram?.WebApp;
      if (tg) {
        const bgHex = isDark ? '#070b14' : '#f8fafc';
        if (typeof tg.setHeaderColor === 'function') tg.setHeaderColor(bgHex);
        if (typeof tg.setBackgroundColor === 'function') tg.setBackgroundColor(bgHex);
        if (tg.CloudStorage && typeof tg.CloudStorage.setItem === 'function') {
          tg.CloudStorage.setItem('tp_theme_mode', modeStr, () => {});
        }
      }
    } catch (_) {}

    setDarkMode(isDark);

    if (syncBackend && activeUserIdRef.current && Number(activeUserIdRef.current) !== GUEST_ID) {
      syncUserProfile({
        userId: activeUserIdRef.current,
        themeMode: modeStr
      }).catch(() => {});
    }
  };

  const handleToggleDarkMode = () => {
    const nextDark = !darkMode;
    applyThemeMode(nextDark, true);
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }
  };

  const handleSetLang = (newLang) => {
    setLang(newLang);
    localStorage.setItem('app_lang', newLang);
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }
  };

  // Smoothly fade out the HTML #splash-loader once React is mounted
  useEffect(() => {
    const timer = setTimeout(() => {
      const splash = document.getElementById('splash-loader');
      if (splash) {
        splash.style.opacity = '0';
        splash.style.pointerEvents = 'none';
        setTimeout(() => {
          if (splash.parentNode) splash.parentNode.removeChild(splash);
        }, 260);
      }
    }, 550);
    return () => clearTimeout(timer);
  }, []);

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  useEffect(() => {
    let initialHeight = window.innerHeight;

    const checkViewport = () => {
      if (window.visualViewport) {
        const heightDiff = window.innerHeight - window.visualViewport.height;
        if (heightDiff > 140) {
          setIsKeyboardVisible(true);
        } else {
          setIsKeyboardVisible(false);
        }
      } else {
        const heightDiff = initialHeight - window.innerHeight;
        if (heightDiff > 140) {
          setIsKeyboardVisible(true);
        } else {
          setIsKeyboardVisible(false);
        }
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', checkViewport);
    }
    window.addEventListener('resize', checkViewport);

    if (window.Telegram?.WebApp?.onEvent) {
      try {
        window.Telegram.WebApp.onEvent('viewportChanged', checkViewport);
      } catch (_) {}
    }

    const handleFocus = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        setIsKeyboardVisible(true);
        setTimeout(() => {
          e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 250);
      }
    };

    const handleBlur = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        setTimeout(() => {
          const activeEl = document.activeElement;
          const isInputStillActive = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
          if (!isInputStillActive) {
            setIsKeyboardVisible(false);
          } else {
            checkViewport();
          }
        }, 150);
      }
    };

    window.addEventListener('focusin', handleFocus);
    window.addEventListener('focusout', handleBlur);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', checkViewport);
      }
      window.removeEventListener('resize', checkViewport);
      if (window.Telegram?.WebApp?.offEvent) {
        try {
          window.Telegram.WebApp.offEvent('viewportChanged', checkViewport);
        } catch (_) {}
      }
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
  const [user, setUser] = useState(() => resolveTelegramUser());
  const [balance, setBalance] = useState(0);
  const [balanceLoaded, setBalanceLoaded] = useState(false); // true only after real data arrives
  const [antiAbuseData, setAntiAbuseData] = useState({
    hasDepositWithoutTrade: false,
    hasSellBalance: false,
    spentSinceLastDeposit: 0
  });

  // Community Join Verification Modal State
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const [communityStatus, setCommunityStatus] = useState({ inChannel: true, inGroup: true, allJoined: true });
  const [isVerifyingCommunity, setIsVerifyingCommunity] = useState(false);
  const [communityError, setCommunityError] = useState('');
  const [communitySuccess, setCommunitySuccess] = useState(false);

  const activeUserIdRef = useRef(user?.id || GUEST_ID);
  const loadSeqRef = useRef(0);
  const mountTimeRef = useRef(Date.now());
  const isFirstLoad = useRef(true);

  const loadData = async (rawUserId) => {
    const resolved = resolveTelegramUser();
    const targetId = (rawUserId && Number(rawUserId) !== GUEST_ID)
      ? rawUserId
      : (resolved?.id && Number(resolved.id) !== GUEST_ID ? resolved.id : (activeUserIdRef.current || GUEST_ID));

    // Never allow a guest request to overwrite a real verified user
    if (Number(targetId) === GUEST_ID && Number(activeUserIdRef.current) !== GUEST_ID) {
      return;
    }

    activeUserIdRef.current = targetId;
    const currentSeq = ++loadSeqRef.current;

    try {
      const data = await fetchUserData(targetId);
      // Ignore stale responses if a newer request was fired
      if (currentSeq !== loadSeqRef.current) return;
      if (!data) return;

      // Only restore backend themeMode if local storage was never set yet (prevents any light-to-dark flash)
      try {
        const localSaved = localStorage.getItem('tp_theme_mode');
        if (!localSaved && data.themeMode === 'dark') {
          applyThemeMode(true, false);
        }
      } catch (_) {}

      if (data.balance !== undefined) {
        const numericBal = Number(data.balance);
        const finalBal = Number.isFinite(numericBal) ? numericBal : 0;
        if (isFirstLoad.current) {
          isFirstLoad.current = false;
          // Ensure the user sees the smooth Skeleton Loader on the Balance Card right after the splash fades out
          const elapsed = Date.now() - mountTimeRef.current;
          const remainingDelay = Math.max(0, 900 - elapsed);
          if (remainingDelay > 0) {
            setTimeout(() => {
              setBalance(finalBal);
              setBalanceLoaded(true);
            }, remainingDelay);
          } else {
            setBalance(finalBal);
            setBalanceLoaded(true);
          }
        } else {
          setBalance(finalBal);
          setBalanceLoaded(true);
        }
      }
      setFiatWallet(data.fiatWallet || null);
      setFiatWithdrawPending(data.fiatWithdrawPending || null);
      if (data.mbsId) setMbsId(data.mbsId);
      setAntiAbuseData({
        hasDepositWithoutTrade: Boolean(data.hasDepositWithoutTrade),
        hasSellBalance: Boolean(data.hasSellBalance),
        spentSinceLastDeposit: parseFloat(data.spentSinceLastDeposit) || 0
      });
    } catch (e) {
      console.warn("loadData error:", e);
    }
  };

  window.reloadGlobalData = () => loadData(activeUserIdRef.current);

  const performCommunityCheck = async (silent = false) => {
    if (!user?.id || user.id === GUEST_ID) return;
    try {
      const res = await checkCommunityMembership(user.id);
      if (res) {
        setCommunityStatus({
          inChannel: Boolean(res.inChannel),
          inGroup: Boolean(res.inGroup),
          allJoined: Boolean(res.allJoined)
        });
        if (res.allJoined) {
          // session verified in state
          setCommunitySuccess(true);
          setCommunityError('');
          if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
          }
          setTimeout(() => {
            setShowCommunityModal(false);
            setCommunitySuccess(false);
          }, 1200);
        }
      }
    } catch (e) {
      if (!silent) console.warn("performCommunityCheck error:", e);
    }
  };

  const checkCommunityJoinStatus = async (userId) => {
    try {
      if (!userId || userId === GUEST_ID) return;
      const res = await checkCommunityMembership(userId);
      if (res && res.allJoined === true) {
        setCommunityStatus({
          inChannel: true,
          inGroup: true,
          allJoined: true
        });
        setShowCommunityModal(false);
      } else {
        setCommunityStatus({
          inChannel: Boolean(res?.inChannel),
          inGroup: Boolean(res?.inGroup),
          allJoined: false
        });
        setShowCommunityModal(true);
      }
    } catch (e) {
      console.warn("Community check error:", e);
      setShowCommunityModal(true);
    }
  };

  // Re-check automatically on window focus / visibility change
  useEffect(() => {
    if (!showCommunityModal) return;

    const handleFocus = () => {
      performCommunityCheck(true);
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [showCommunityModal, user.id]);

  const handleGoChannel = () => {
    if (window.Telegram?.WebApp?.openTelegramLink) {
      window.Telegram.WebApp.openTelegramLink('https://t.me/maruf_teach');
    } else {
      window.open('https://t.me/maruf_teach', '_blank');
    }
    // Schedule background check after user has opened the link
    setTimeout(() => performCommunityCheck(true), 2500);
    setTimeout(() => performCommunityCheck(true), 5000);
  };

  const handleGoGroup = () => {
    if (window.Telegram?.WebApp?.openTelegramLink) {
      window.Telegram.WebApp.openTelegramLink('https://t.me/bd_trust_pay_payout');
    } else {
      window.open('https://t.me/bd_trust_pay_payout', '_blank');
    }
    // Schedule background check after user has opened the link
    setTimeout(() => performCommunityCheck(true), 2500);
    setTimeout(() => performCommunityCheck(true), 5000);
  };

  const handleVerifyCommunity = async () => {
    setIsVerifyingCommunity(true);
    setCommunityError('');
    try {
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
      }
      const res = await verifyCommunityMembership(user.id);
      if (res) {
        setCommunityStatus({
          inChannel: Boolean(res.inChannel),
          inGroup: Boolean(res.inGroup),
          allJoined: Boolean(res.allJoined)
        });
      }
      if (res && res.allJoined) {
        setCommunitySuccess(true);
        // session verified in state
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
        setTimeout(() => {
          setShowCommunityModal(false);
          setCommunitySuccess(false);
        }, 1200);
      } else {
        if (!res.inChannel && !res.inGroup) {
          setCommunityError(lang === 'bn' ? '❌ আপনি চ্যানেল ও পে-আউট চ্যানেল দুটিতেই এখনও যুক্ত হননি! উপরের Go বাটনে চাপুন।' : '❌ You have not joined the channel and payout channel yet!');
        } else if (!res.inChannel) {
          setCommunityError(lang === 'bn' ? '❌ আপনি ১ নম্বর চ্যানেলে এখনও জয়েন করেননি! Go চাপুন।' : '❌ You have not joined @maruf_teach channel yet!');
        } else if (!res.inGroup) {
          setCommunityError(lang === 'bn' ? '❌ আপনি পে-আউট চ্যানেলে এখনও জয়েন করেননি! Go চাপুন।' : '❌ You have not joined @bd_trust_pay_payout channel yet!');
        } else {
          setCommunityError(lang === 'bn' ? '❌ অনুগ্রহ করে দুটিতেই জয়েন করে আবার ভেরিফাই চাপুন।' : '❌ Please join both communities and retry.');
        }
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
        }
      }
    } catch (e) {
      setCommunityError(lang === 'bn' ? 'ভেরিফাই করতে সমস্যা হয়েছে, পুনরায় চেষ্টা করুন।' : 'Verification failed, please try again.');
    } finally {
      setIsVerifyingCommunity(false);
    }
  };

  useEffect(() => {
    try {
      if (window.Telegram?.WebApp?.ready) {
        window.Telegram.WebApp.ready();
      }
    } catch (_) {}

    const resolvedUser = resolveTelegramUser();
    setUser(resolvedUser);
    activeUserIdRef.current = resolvedUser.id;
    loadData(resolvedUser.id);

    if (resolvedUser.id && Number(resolvedUser.id) !== GUEST_ID) {
      checkCommunityJoinStatus(resolvedUser.id);
      syncUserProfile({
        userId: resolvedUser.id,
        username: resolvedUser.username || '',
        firstName: resolvedUser.first_name || '',
        lastName: resolvedUser.last_name || '',
        photoUrl: resolvedUser.photo_url || ''
      });
    }
  }, []);

  const manifestUrl = 'https://maruf-teach-bot.onrender.com/app/tonconnect-manifest.json';

  return (
    <TonConnectUIProvider 
      manifestUrl={manifestUrl}
      actionsConfiguration={{
        twaReturnUrl: 'https://t.me/maruf_teach_bot'
      }}
      uiPreferences={{
        theme: darkMode ? THEME.DARK : THEME.LIGHT,
        borderRadius: 'm',
        colorsSet: {
          [THEME.LIGHT]: {
            connectButton: {
              background: '#4f46e5',
              foreground: '#ffffff'
            },
            accent: '#4f46e5',
            telegramButton: '#0098ea'
          },
          [THEME.DARK]: {
            connectButton: {
              background: '#6366f1',
              foreground: '#ffffff'
            },
            accent: '#818cf8',
            telegramButton: '#0098ea'
          }
        }
      }}
    >
      <TonConnectStyles />
      <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] pb-28 relative overflow-x-hidden font-sans selection:bg-[var(--color-brand)]/20 transition-colors duration-200">
        <PageBackgroundFlowers page={activeTab} darkMode={darkMode} />
        
        <div className="relative z-10 p-4 max-w-md mx-auto">
          {/* Header */}
          <div id="main-app-header" className="flex justify-between items-center mb-6 pt-2 transition-all duration-300">
             <div className="flex items-center gap-3">
                 <div className="w-[44px] h-[44px] flex items-center justify-center shrink-0">
                    <img src={brandLogo} alt="Trust Pay" className="w-full h-full object-contain drop-shadow-[0_4px_12px_rgba(79,70,229,0.35)]" />
                 </div>
                 <div>
                    <h1 className="text-base font-semibold text-[var(--color-text-primary)] leading-tight">{t.appName}</h1>
                    <p className="text-[10px] font-medium text-[var(--color-brand)] uppercase tracking-[0.15em]">{t.welcome}</p>
                 </div>
             </div>
             {/* Right Header Controls: Moon/Sun Theme Toggle (on Profile/Referral) + Wallet Button */}
             <div className="origin-right flex items-center gap-2">
                {(activeTab === 'profile' || activeTab === 'referral' || activeTab === 'spin') && (
                  <button
                    type="button"
                    onClick={handleToggleDarkMode}
                    title={darkMode ? (lang === 'bn' ? 'লাইট মোড চালু করুন' : 'Switch to Light Mode') : (lang === 'bn' ? 'ডার্ক মোড চালু করুন' : 'Switch to Dark Mode')}
                    aria-label="Toggle Dark Mode"
                    className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-300 active:scale-90 cursor-pointer shadow-sm ${
                      darkMode
                        ? 'bg-indigo-950/90 border-indigo-400/50 text-amber-300 shadow-[0_0_16px_rgba(129,140,248,0.35)]'
                        : 'bg-indigo-50/95 border-indigo-200/80 text-indigo-700 hover:bg-indigo-100'
                    }`}
                  >
                    {darkMode ? <Sun size={18} className="text-amber-300" /> : <CrescentMoonIcon size={18} isDark={false} />}
                  </button>
                )}
                <HeaderWalletButton lang={lang} setIsModalOpen={setIsModalOpen} user={user} />
             </div>
          </div>

          {activeTab === 'home' && (
              <HomePage 
                  balance={balance} 
                  balanceLoaded={balanceLoaded}
                  user={user} 
                  lang={lang}
                  t={t}
                  darkMode={darkMode}
                  fiatWithdrawPending={fiatWithdrawPending} 
                  onGoToClaim={() => setActiveTab('claim')} 
                  onOpenBuyCrypto={() => setActiveTab('buy')}
                  onGoToSell={() => setActiveTab('sell')}
                  onGoToAddMoney={() => setActiveTab('add-money')}
                  onGoToSpin={() => setActiveTab('spin')}
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
                  darkMode={darkMode}
                  onToggleDarkMode={handleToggleDarkMode}
                  fiatWallet={fiatWallet} 
                  fiatWithdrawPending={fiatWithdrawPending} 
                  onGoToWithdraw={() => setActiveTab('withdraw')} 
                  onGoToHistory={() => setActiveTab('history')} 
                  onGoToReferral={() => setActiveTab('referral')}
                  onGoToSpin={() => setActiveTab('spin')}
                  setFiatWallet={setFiatWallet} 
                  setIsModalOpen={setIsModalOpen}
                  reloadData={() => loadData(user?.id || 123456789)} 
              />
          )}
          {activeTab === 'referral' && (
              <ReferralPage
                  user={user}
                  lang={lang}
                  darkMode={darkMode}
                  onBack={() => setActiveTab('profile')}
                  reloadData={() => loadData(user?.id || 123456789)}
              />
          )}
          {activeTab === 'spin' && (
              <SpinEventPage
                  user={user}
                  lang={lang}
                  darkMode={darkMode}
                  onBack={() => setActiveTab('home')}
                  onGoToReferral={() => setActiveTab('referral')}
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
                  antiAbuseData={antiAbuseData}
                  setIsModalOpen={setIsModalOpen}
                  onBack={() => setActiveTab('profile')} 
                  reloadData={() => loadData(user?.id || 123456789)} 
              />
          )}
        </div>

        {/* PREMIUM EXECUTIVE SLIDING BOTTOM NAVIGATION */}
        {!isModalOpen && activeTab !== 'buy' && activeTab !== 'claim' && activeTab !== 'history' && activeTab !== 'withdraw' && activeTab !== 'referral' && activeTab !== 'spin' && (() => {
            const navTabs = ['home', 'add-money', 'sell', 'profile'];
            const activeIndex = navTabs.indexOf(activeTab);
            return (
            <div className={`fixed bottom-0 left-0 w-full z-50 flex justify-center pb-[env(safe-area-inset-bottom,16px)] px-4 mb-4 pointer-events-none transition-all duration-300 ${isKeyboardVisible ? 'opacity-0 translate-y-32 pointer-events-none' : 'opacity-100 translate-y-0'}`}>
                <div className="w-full max-w-[380px] bg-white/95 backdrop-blur-2xl rounded-[28px] relative flex justify-between items-center p-1.5 shadow-[0_12px_36px_rgba(15,23,42,0.08)] border border-slate-200/80 pointer-events-auto overflow-hidden">
                    
                    {/* Delicate floral line art in navigation bar corner */}
                    <svg 
                      className="absolute -right-2 -top-2 w-14 h-14 text-indigo-900/10 pointer-events-none select-none" 
                      viewBox="0 0 100 100" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M50 85 C35 70, 20 50, 50 15 C80 50, 65 70, 50 85 Z" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M50 85 C25 80, 5 60, 25 35 C40 50, 48 70, 50 85 Z" stroke="currentColor" strokeWidth="1.2" />
                      <path d="M50 85 C75 80, 95 60, 75 35 C60 50, 52 70, 50 85 Z" stroke="currentColor" strokeWidth="1.2" />
                      <circle cx="50" cy="15" r="2" fill="currentColor" />
                    </svg>

                    {/* SMOOTH SLIDING ACTIVE PILL */}
                    {activeIndex !== -1 && (
                      <div 
                        className="absolute top-1.5 bottom-1.5 rounded-[20px] bg-indigo-50 border border-indigo-100/90 shadow-xs transition-all duration-300 ease-out pointer-events-none"
                        style={{
                          width: 'calc(25% - 4px)',
                          left: `calc(${activeIndex * 25}% + 2px)`,
                        }}
                      >
                        {/* Micro floral line art in active pill */}
                        <svg 
                          className="absolute -right-1 -bottom-1 w-8 h-8 text-indigo-900/15 pointer-events-none select-none" 
                          viewBox="0 0 100 100" 
                          fill="none" 
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M50 85 C35 70, 20 50, 50 15 C80 50, 65 70, 50 85 Z" stroke="currentColor" strokeWidth="2" />
                          <path d="M50 85 C25 80, 5 60, 25 35 C40 50, 48 70, 50 85 Z" stroke="currentColor" strokeWidth="1.5" />
                          <path d="M50 85 C75 80, 95 60, 75 35 C60 50, 52 70, 50 85 Z" stroke="currentColor" strokeWidth="1.5" />
                        </svg>
                        <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-3.5 h-1 bg-indigo-600 rounded-full" />
                      </div>
                    )}

                    {/* HOME */}
                    <button 
                        type="button"
                        onClick={() => setActiveTab('home')} 
                        className="relative flex-1 flex flex-col items-center justify-center py-2 rounded-[20px] transition-all duration-300 group active:scale-95 z-10"
                    >
                        <div className="flex flex-col items-center justify-center">
                            <Home size={20} strokeWidth={activeTab === 'home' ? 2.5 : 2} className={`mb-1 transition-all duration-300 ${activeTab === 'home' ? 'text-indigo-600 scale-105' : 'text-slate-400 group-hover:text-slate-600'}`} />
                            <span className={`text-[10px] tracking-wide transition-all duration-300 ${activeTab === 'home' ? 'text-indigo-950 font-black' : 'text-slate-400 font-bold group-hover:text-slate-600'}`}>{t.home}</span>
                        </div>
                    </button>
  
                    {/* ADD MONEY */}
                    <button 
                        type="button"
                        onClick={() => setActiveTab('add-money')} 
                        className="relative flex-1 flex flex-col items-center justify-center py-2 rounded-[20px] transition-all duration-300 group active:scale-95 z-10"
                    >
                        <div className="flex flex-col items-center justify-center">
                            <PlusCircle size={20} strokeWidth={activeTab === 'add-money' ? 2.5 : 2} className={`mb-1 transition-all duration-300 ${activeTab === 'add-money' ? 'text-indigo-600 scale-105' : 'text-slate-400 group-hover:text-slate-600'}`} />
                            <span className={`text-[10px] tracking-wide transition-all duration-300 ${activeTab === 'add-money' ? 'text-indigo-950 font-black' : 'text-slate-400 font-bold group-hover:text-slate-600'}`}>{t.addMoney}</span>
                        </div>
                    </button>
  
                    {/* SELL */}
                    <button 
                        type="button"
                        onClick={() => setActiveTab('sell')} 
                        className="relative flex-1 flex flex-col items-center justify-center py-2 rounded-[20px] transition-all duration-300 group active:scale-95 z-10"
                    >
                        <div className="flex flex-col items-center justify-center">
                            <ArrowUp size={20} strokeWidth={activeTab === 'sell' ? 2.5 : 2} className={`mb-1 transition-all duration-300 ${activeTab === 'sell' ? 'text-indigo-600 scale-105' : 'text-slate-400 group-hover:text-slate-600'}`} />
                            <span className={`text-[10px] tracking-wide transition-all duration-300 ${activeTab === 'sell' ? 'text-indigo-950 font-black' : 'text-slate-400 font-bold group-hover:text-slate-600'}`}>{t.sell}</span>
                        </div>
                    </button>
  
                    {/* PROFILE */}
                    <button 
                        type="button"
                        onClick={() => setActiveTab('profile')} 
                        className="relative flex-1 flex flex-col items-center justify-center py-2 rounded-[20px] transition-all duration-300 group active:scale-95 z-10"
                    >
                        <div className="flex flex-col items-center justify-center">
                            <User size={20} strokeWidth={activeTab === 'profile' ? 2.5 : 2} className={`mb-1 transition-all duration-300 ${activeTab === 'profile' ? 'text-indigo-600 scale-105' : 'text-slate-400 group-hover:text-slate-600'}`} />
                            <span className={`text-[10px] tracking-wide transition-all duration-300 ${activeTab === 'profile' ? 'text-indigo-950 font-black' : 'text-slate-400 font-bold group-hover:text-slate-600'}`}>{t.profile}</span>
                        </div>
                    </button>
                </div>
            </div>
            );
        })()}
        </div>

        {/* MANDATORY COMMUNITY JOIN MODAL */}
        {showCommunityModal && (
          <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
            <div 
              className="relative p-[1.5px] bg-gradient-to-br from-indigo-300 via-indigo-100 to-indigo-300 w-full max-w-[340px] shadow-2xl animate-in zoom-in-95"
              style={{
                clipPath: 'polygon(16px 0, calc(100% - 16px) 0, 100% 16px, 100% calc(100% - 16px), calc(100% - 16px) 100%, 16px 100%, 0 calc(100% - 16px), 0 16px)',
              }}
            >
              <div 
                className="relative bg-white w-full h-full p-6 text-center overflow-hidden"
                style={{
                  clipPath: 'polygon(15px 0, calc(100% - 15px) 0, 100% 15px, 100% calc(100% - 15px), calc(100% - 15px) 100%, 15px 100%, 0 calc(100% - 15px), 0 15px)',
                }}
              >
                <HomeLotusPattern className="opacity-[0.08]" />
                
                {/* Brand Logo with Glow */}
                <div className="relative z-10 flex flex-col items-center justify-center mb-3">
                  <div className="w-16 h-16 flex items-center justify-center mb-2">
                    <img src={brandLogo} alt="Trust Pay" className="w-full h-full object-contain drop-shadow-[0_4px_16px_rgba(79,70,229,0.35)]" />
                  </div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-indigo-100/80 text-indigo-700 text-[10px] font-black uppercase tracking-wider mb-1">
                    বাধ্যতামূলক ভেরিফিকেশন
                  </span>
                  <h3 className="text-lg font-black text-slate-900 leading-tight">
                    {lang === 'bn' ? 'কমিউনিটিতে যোগ দিন' : 'Join Our Communities'}
                  </h3>
                  <p className="text-[11.5px] font-medium text-slate-500 mt-1 leading-snug">
                    {lang === 'bn' 
                      ? 'Trust Pay ব্যবহার করতে নিচের চ্যানেল এবং গ্রুপে জয়েন থাকা বাধ্যতামূলক।' 
                      : 'You must join both our official channel and group to use Trust Pay.'}
                  </p>
                </div>

                {/* 2 Community Items */}
                <div className="relative z-10 space-y-2.5 mb-3 text-left">
                  {/* Channel 1 */}
                  <div className={`p-3 rounded-xl flex items-center justify-between gap-2.5 transition-all ${
                    communityStatus.inChannel 
                      ? 'bg-emerald-50/90 border border-emerald-200/90 shadow-xs' 
                      : 'bg-slate-50 border border-slate-200/90 hover:bg-slate-100/70'
                  }`}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 border ${
                        communityStatus.inChannel
                          ? 'bg-emerald-100/80 border-emerald-200 text-emerald-800'
                          : 'bg-indigo-50 border-indigo-100 text-indigo-700'
                      }`}>
                        📢
                      </div>
                      <div className="min-w-0">
                        <div className="text-[12px] font-bold text-slate-900 truncate">১. Maruf Teach</div>
                        <div className="text-[10px] font-semibold text-indigo-600 truncate">@maruf_teach</div>
                      </div>
                    </div>
                    {communityStatus.inChannel ? (
                      <div className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-extrabold text-[10.5px] rounded-lg flex items-center gap-1 border border-emerald-300 shrink-0 shadow-xs">
                        <CheckCircle2 size={12} className="text-emerald-700 stroke-[2.5]" />
                        <span>{lang === 'bn' ? 'জয়েন সম্পন্ন' : 'Joined'}</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleGoChannel}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[11px] rounded-lg shadow-sm active:scale-95 transition-all shrink-0 cursor-pointer flex items-center gap-1"
                      >
                        <span>Go</span>
                        <ExternalLink size={11} />
                      </button>
                    )}
                  </div>

                  {/* Group 2 */}
                  <div className={`p-3 rounded-xl flex items-center justify-between gap-2.5 transition-all ${
                    communityStatus.inGroup 
                      ? 'bg-emerald-50/90 border border-emerald-200/90 shadow-xs' 
                      : 'bg-slate-50 border border-slate-200/90 hover:bg-slate-100/70'
                  }`}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 border ${
                        communityStatus.inGroup
                          ? 'bg-emerald-100/80 border-emerald-200 text-emerald-800'
                          : 'bg-emerald-50 border-emerald-100 text-emerald-700'
                      }`}>
                        👥
                      </div>
                      <div className="min-w-0">
                        <div className="text-[12px] font-bold text-slate-900 truncate">২. TrustPay Payout Channel</div>
                        <div className="text-[10px] font-semibold text-emerald-600 truncate">@bd_trust_pay_payout</div>
                      </div>
                    </div>
                    {communityStatus.inGroup ? (
                      <div className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-extrabold text-[10.5px] rounded-lg flex items-center gap-1 border border-emerald-300 shrink-0 shadow-xs">
                        <CheckCircle2 size={12} className="text-emerald-700 stroke-[2.5]" />
                        <span>{lang === 'bn' ? 'জয়েন সম্পন্ন' : 'Joined'}</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleGoGroup}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] rounded-lg shadow-sm active:scale-95 transition-all shrink-0 cursor-pointer flex items-center gap-1"
                      >
                        <span>Go</span>
                        <ExternalLink size={11} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Helpful status tip if 1 of 2 is joined */}
                {communityStatus.inChannel && !communityStatus.inGroup && (
                  <p className="relative z-10 text-[10px] text-indigo-700 font-bold mb-3 bg-indigo-50/80 py-1 px-2 rounded-lg border border-indigo-200/60 leading-tight">
                    ✓ চ্যানেল জয়েন হয়েছে! এবার ২ নম্বর গ্রুপে Go চাপুন।
                  </p>
                )}
                {!communityStatus.inChannel && communityStatus.inGroup && (
                  <p className="relative z-10 text-[10px] text-emerald-700 font-bold mb-3 bg-emerald-50/80 py-1 px-2 rounded-lg border border-emerald-200/60 leading-tight">
                    ✓ গ্রুপ জয়েন হয়েছে! এবার ১ নম্বর চ্যানেলে Go চাপুন।
                  </p>
                )}

                {/* Feedback / Error Message */}
                {communityError && (
                  <div className="relative z-10 mb-3 p-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-[11px] font-bold">
                    {communityError}
                  </div>
                )}
                {communitySuccess && (
                  <div className="relative z-10 mb-3 p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-[11px] font-bold flex items-center justify-center gap-1.5">
                    <CheckCircle2 size={14} />
                    ভেরিফিকেশন সফল হয়েছে!
                  </div>
                )}

                {/* Verification CutCornerButton */}
                <div className="relative z-10">
                  <CutCornerButton
                    onClick={handleVerifyCommunity}
                    disabled={isVerifyingCommunity || communitySuccess}
                    isSubmitting={isVerifyingCommunity}
                    icon={CheckCircle2}
                  >
                    {isVerifyingCommunity ? 'যাচাই করা হচ্ছে...' : 'ভেরিফাই করুন (VERIFY)'}
                  </CutCornerButton>
                </div>
              </div>
            </div>
          </div>
        )}
      </TonConnectUIProvider>
  );
}

function AppHeader({ user, lang = 'bn' }) {
  const userTonAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();
  const [showWalletModal, setShowWalletModal] = useState(false);
  
  return (
      <div className="flex justify-between items-center mb-8 pt-2 animate-in fade-in slide-in-from-top-4 duration-500">
         <div className="flex items-center gap-3">
             <div className="w-10 h-10 glass-panel rounded-full flex items-center justify-center font-bold text-[var(--color-text-primary)] hover:scale-105 transition-transform duration-300 shadow-sm cursor-pointer border border-white">
                {(user?.first_name?.charAt(0)?.toUpperCase() || 'U')}
             </div>
             <div className="flex flex-col justify-center">
                <p className="text-[9px] font-bold text-[var(--color-text-secondary)] uppercase tracking-[0.2em] mb-0.5 opacity-80">Welcome back</p>
                <h1 className="text-[15px] font-extrabold text-[var(--color-text-primary)] leading-none tracking-tight">Trust Pay</h1>
             </div>
         </div>
         
         {/* Premium Custom Connect Button */}
         <button onClick={() => {
            if (userTonAddress) {
               setShowWalletModal(true);
            } else {
               tonConnectUI.openModal();
            }
         }} className="glass-button flex items-center gap-2 rounded-full px-4 py-2.5 active-scale smooth-transition group cursor-pointer">
            <Wallet size={16} className="text-[var(--color-brand)] group-hover:scale-110 transition-transform duration-300" />
            <span className="text-xs font-bold text-[var(--color-text-primary)]">
               {userTonAddress ? `${userTonAddress.slice(0, 4)}...${userTonAddress.slice(-4)}` : 'Connect'}
            </span>
         </button>

         <ConnectedWalletModal
            isOpen={showWalletModal}
            onClose={() => setShowWalletModal(false)}
            userTonAddress={userTonAddress}
            onDisconnect={async () => {
               if (tonConnectUI) await tonConnectUI.disconnect();
            }}
            lang={lang}
         />
      </div>
  );
}

function HomePage({ balance, balanceLoaded = false, user, fiatWithdrawPending, onGoToClaim, onOpenBuyCrypto, onGoToSell, onGoToAddMoney, onGoToSpin, darkMode = false, lang = 'bn', t = {} }) {
  const [graphData, setGraphData] = useState(initialGraphData);
  const [timeframe, setTimeframe] = useState('LIVE');

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
         <div className="flex items-baseline gap-1.5 min-h-[44px] items-center">
            {!balanceLoaded ? (
              /* Skeleton pulse while balance is being fetched */
              <div className="flex items-center gap-2">
                <div className="h-9 w-24 bg-slate-200 animate-pulse rounded-xl" />
                <div className="h-5 w-6 bg-indigo-100 animate-pulse rounded-md" />
              </div>
            ) : (
              <>
                <h2 className="text-3xl font-black text-slate-900">{balance}</h2>
                <span className="text-base font-black text-indigo-600">TK</span>
              </>
            )}
         </div>
         <p className="text-[11px] text-slate-500 font-medium mt-1">{t?.balanceSub || 'Available for withdrawal & crypto purchase'}</p>
      </CutCornerCard>

      {/* Quick Action Buttons: Buy Crypto & Sell Crypto */}
      <div className="grid grid-cols-2 gap-2.5">
         {/* Buy Crypto Button */}
         <div 
             onClick={onOpenBuyCrypto} 
             className="relative p-[1.5px] bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-800 shadow-sm active:scale-[0.97] transition-all cursor-pointer"
             style={{
               clipPath: 'polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)',
             }}
         >
             <div 
                 className="relative w-full h-[60px] flex items-center gap-2.5 px-3 bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-800 text-white overflow-hidden"
                 style={{
                   clipPath: 'polygon(11px 0, calc(100% - 11px) 0, 100% 11px, 100% calc(100% - 11px), calc(100% - 11px) 100%, 11px 100%, 0 calc(100% - 11px), 0 11px)',
                 }}
             >
                 <HomeLotusPattern className="opacity-[0.08]" />
                 <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 relative z-10">
                     <Coins size={18} />
                 </div>
                 <div className="relative z-10 min-w-0">
                     <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider leading-none truncate">{t?.buyCryptoSub || 'Instant Send'}</p>
                     <p className="text-[14px] font-bold text-white leading-tight mt-1 tracking-tight truncate">{t?.buyCrypto || 'Buy Crypto'}</p>
                 </div>
             </div>
         </div>
         
         {/* Sell Crypto Button */}
         <div 
             onClick={onGoToSell} 
             className="relative p-[1.5px] bg-gradient-to-br from-slate-200 via-slate-300 to-indigo-200 shadow-sm active:scale-[0.97] transition-all cursor-pointer"
             style={{
               clipPath: 'polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)',
             }}
         >
             <div 
                 className="relative w-full h-[60px] flex items-center gap-2.5 px-3 bg-white text-slate-900 overflow-hidden"
                 style={{
                   clipPath: 'polygon(11px 0, calc(100% - 11px) 0, 100% 11px, 100% calc(100% - 11px), calc(100% - 11px) 100%, 11px 100%, 0 calc(100% - 11px), 0 11px)',
                 }}
             >
                 <HomeLotusPattern className="opacity-[0.05]" />
                 <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 border border-indigo-100 relative z-10">
                     <ArrowRightLeft size={18} />
                 </div>
                 <div className="relative z-10 min-w-0">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none truncate">{t?.sellCryptoSub || 'Instant Swap'}</p>
                     <p className="text-[14px] font-bold text-slate-900 leading-tight mt-1 tracking-tight truncate">{t?.sellCrypto || 'Sell Crypto'}</p>
                 </div>
             </div>
         </div>
      </div>

      {/* 30-DAY SPIN & TEDDY STAR GIVEAWAY BANNER CARD */}
      <CutCornerCard
         className={`p-3 border cursor-pointer active:scale-[0.99] transition-all ${
            darkMode
               ? 'bg-slate-900 border-amber-500/35'
               : 'bg-gradient-to-r from-amber-50/90 via-white to-rose-50/85 border-amber-200/80'
         }`}
         flower={<ReferralRosePattern />}
      >
         <div onClick={onGoToSpin} className="flex items-center justify-between gap-2.5 group">
            <div className="flex items-center gap-2.5 min-w-0">
               <div className="w-11 h-11 rounded-xl bg-amber-100/90 border border-amber-200/90 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <TelegramAnimatedSticker src="tg-teddy-sticker.json" size={34} />
               </div>
               <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                     <span className="font-black text-slate-900 text-[13px] leading-tight">
                        {lang === 'bn' ? '৩০ দিনের মেগা স্পিন ও গিভওয়ে' : '30-Day Spin & Star Giveaway'}
                     </span>
                     <span className="px-2 py-0.5 bg-gradient-to-r from-amber-500 to-rose-500 text-white rounded-full text-[9px] font-black tracking-wide shadow-xs animate-pulse">
                        FREE SPIN
                     </span>
                  </div>
                  <p className="text-[10.5px] text-amber-700 font-bold mt-0.5 truncate">
                     {lang === 'bn' ? 'প্রতিদিন ফ্রি স্পিন করে জিতুন Teddy Gift, $1 ও ৳500 পর্যন্ত!' : 'Spin daily to win Teddy Star Gift, $1 USD & up to ৳500!'}
                  </p>
               </div>
            </div>
            <div className="w-7 h-7 rounded-full bg-amber-100/90 text-amber-700 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-all">
               <ChevronRight size={15} />
            </div>
         </div>
      </CutCornerCard>

      {/* Premium Live Area Chart Card */}
      <CutCornerCard className="p-3.5" flower={<HomeLotusPattern />}>
         <div className="flex justify-between items-start mb-2.5">
            <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100/80 shadow-xs">
                  <TrendingUp size={15} />
                </div>
                <div>
                   <h3 className="text-[14px] font-black text-slate-900 tracking-tight leading-none">{t?.chartTitle || 'USDT/TK লাইভ চার্ট'}</h3>
                   <div className="flex items-center gap-1 mt-1">
                      <span className="flex items-center text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">
                         <ArrowUpRight size={10} strokeWidth={2.5} /> +1.85%
                      </span>
                      <span className="text-[9.5px] font-semibold text-slate-400">২৪ ঘণ্টা</span>
                   </div>
                </div>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/80 shadow-xs">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                <span className="text-[9.5px] font-black text-emerald-700 tracking-wider">LIVE</span>
            </div>
         </div>
         
         <div className="flex justify-between items-baseline mb-2 px-1">
            <div className="flex items-baseline gap-2">
               <span className="text-3xl font-black text-slate-900 tracking-tight">
                 {Number(graphData?.[graphData.length - 1]?.price ?? 120.0).toFixed(2)}
               </span>
               <span className="text-[11px] font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                 TK / USDT
               </span>
            </div>
            <div className="text-right">
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">24h Range</span>
               <span className="text-[11px] font-extrabold text-slate-600">
                  <span className="text-rose-500">৳118.50</span> - <span className="text-emerald-600">৳121.20</span>
               </span>
            </div>
         </div>

         {/* Modern Responsive Area Chart with Glowing Gradient */}
         <div className="h-32 w-full ml-[-12px] my-1">
            <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={graphData} margin={{ top: 8, right: 6, left: 6, bottom: 0 }}>
                 <defs>
                   <linearGradient id="premiumColorPrice" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.28}/>
                     <stop offset="60%" stopColor="#6366f1" stopOpacity={0.08}/>
                     <stop offset="100%" stopColor="#818cf8" stopOpacity={0.00}/>
                   </linearGradient>
                 </defs>
                 <YAxis domain={['dataMin - 0.4', 'dataMax + 0.4']} hide />
                 <Tooltip 
                    content={({ active, payload }) => {
                       if (active && payload && payload.length) {
                          const p = payload[0].value;
                          const time = payload[0].payload?.time || '';
                          return (
                             <div className="bg-slate-900/95 backdrop-blur-md text-white px-2.5 py-1.5 rounded-xl shadow-xl border border-white/10 text-center">
                                <div className="text-[9px] text-slate-400 font-bold">{time}</div>
                                <div className="text-[12px] font-black text-emerald-400">৳{Number(p).toFixed(2)} TK</div>
                             </div>
                          );
                       }
                       return null;
                    }}
                 />
                 <Area 
                    type="monotone" 
                    dataKey="price" 
                    stroke="#4f46e5" 
                    strokeWidth={2.6} 
                    fillOpacity={1} 
                    fill="url(#premiumColorPrice)" 
                    isAnimationActive={true} 
                    animationDuration={400} 
                 />
               </AreaChart>
            </ResponsiveContainer>
         </div>

         {/* Timeframe Selector */}
         <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100/90 px-1">
            {['1H', '1D', 'LIVE', '1W', '1M'].map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`text-[10px] px-3 py-1 rounded-full font-black transition-all cursor-pointer ${
                  timeframe === tf 
                    ? 'bg-indigo-600 text-white shadow-xs scale-[1.02]' 
                    : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-50'
                }`}
              >
                {tf}
              </button>
            ))}
         </div>
      </CutCornerCard>

      {/* Instructions Card (How to use this bot) */}
      <CutCornerCard className="p-4 mb-4" flower={<HomeLotusPattern />}>
         <h3 className="text-[14px] font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Info size={16} className="text-purple-600" />
            {t?.howToUse || 'বটটি যেভাবে ব্যবহার করবেন'}
         </h3>
         <ul className="space-y-3">
            <li className="flex items-start gap-2.5">
               <div className="w-5 h-5 rounded-full bg-purple-50 flex items-center justify-center shrink-0 mt-0.5 border border-purple-100">
                  <span className="text-[10px] font-bold text-purple-600">1</span>
               </div>
               <p className="text-[11px] text-slate-600 leading-relaxed">
                  <strong className="text-slate-800 font-bold">{t?.step1Title || 'টাকা আয় করুন:'} </strong>
                  <span>{t?.step1Desc || 'বটটি চালু রাখুন এবং ব্যালেন্সে টাকা যুক্ত বা লেনদেন করে পয়েন্ট ও ক্যাশ আয় করুন।'}</span>
               </p>
            </li>
            <li className="flex items-start gap-2.5">
               <div className="w-5 h-5 rounded-full bg-purple-50 flex items-center justify-center shrink-0 mt-0.5 border border-purple-100">
                  <span className="text-[10px] font-bold text-purple-600">2</span>
               </div>
               <p className="text-[11px] text-slate-600 leading-relaxed">
                  <strong className="text-slate-800 font-bold">{t?.step2Title || 'ওয়ালেট যুক্ত করুন:'} </strong>
                  <span>{t?.step2Desc || 'উইথড্র এবং স্বয়ংক্রিয় লেনদেনের জন্য নিরাপদে আপনার TON ওয়ালেট কানেক্ট করুন।'}</span>
               </p>
            </li>
            <li className="flex items-start gap-2.5">
               <div className="w-5 h-5 rounded-full bg-purple-50 flex items-center justify-center shrink-0 mt-0.5 border border-purple-100">
                  <span className="text-[10px] font-bold text-purple-600">3</span>
               </div>
               <p className="text-[11px] text-slate-600 leading-relaxed">
                  <strong className="text-slate-800 font-bold">{t?.step3Title || 'উত্তোলন করুন:'} </strong>
                  <span>{t?.step3Desc || 'আপনার অর্জিত ব্যালেন্স সরাসরি বিকাশ/নগদে অথবা ক্রিপ্টোতে তুলে নিন।'}</span>
               </p>
            </li>
         </ul>
      </CutCornerCard>
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
                 <h1 className="text-[15px] font-bold text-[var(--color-text-primary)] leading-tight">Trust Pay</h1>
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

    // STEP 3: LUXURY FINTECH SUCCESS RECEIPT WITH BLOOMING FLOWER
    if (step === 3) {
        return (
            <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500 p-2 text-center pb-24 max-w-sm mx-auto">
                <CutCornerCard className="p-6 text-center space-y-4" flower={<AddMoneyFloraPattern />}>
                    {/* Blooming Flower Graphic */}
                    <BloomingFlowerGraphic />

                    {/* Status Badge */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[11px] font-black uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        <Sparkles size={12} />
                        {lang === 'bn' ? 'অটো-ভেরিফাইড সফল' : 'AUTO-VERIFIED'}
                    </div>

                    <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight mb-1">
                            ৳{amount} BDT Added! 🎉
                        </h2>
                        <p className="text-slate-500 text-xs max-w-[280px] mx-auto leading-relaxed">
                            {lang === 'bn' 
                                ? 'আপনার পেমেন্ট SMS দ্বারা সাথে সাথে অটো-ভেরিফাই হয়েছে এবং ব্যালেন্সে যোগ হয়েছে।' 
                                : 'Your payment has been auto-verified via SMS and credited to your balance.'}
                        </p>
                    </div>

                    {/* Fintech Receipt Card Details */}
                    <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/80 text-left space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500 font-medium">Transaction ID</span>
                            <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">{trxId}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500 font-medium">Payment Method</span>
                            <span className="font-bold text-slate-900">{paymentMethod}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500 font-medium">Amount Deposited</span>
                            <span className="font-extrabold text-emerald-600 text-sm">৳{amount} BDT</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500 font-medium">Account Name</span>
                            <span className="font-bold text-slate-900">{user?.first_name || 'User'}</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2.5 pt-2">
                        <CutCornerButton 
                            onClick={onGoToBuyCrypto} 
                            icon={Coins}
                        >
                            {t?.buyCrypto || (lang === 'bn' ? 'ক্রিপ্টো কিনুন' : 'BUY CRYPTO NOW')}
                        </CutCornerButton>
                        <CutCornerButton 
                            onClick={() => {
                                setStep(1);
                                setAmount('');
                                setTrxId('');
                                setErrorMessage('');
                                onDone();
                            }} 
                            variant="secondary"
                            icon={ArrowRight}
                        >
                            {lang === 'bn' ? 'হোমে ফিরে যান' : 'BACK TO HOME'}
                        </CutCornerButton>
                    </div>
                </CutCornerCard>
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
                <CutCornerCard className="p-3.5 mb-3 space-y-3" flower={<AddMoneyFloraPattern />}>
                    <div className="flex justify-between items-center pb-2.5 border-b border-gray-100">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg tp-payment-logo-box bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-2xs">
                                <img 
                                    src={getPaymentLogo(paymentMethod)} 
                                    className="w-full h-full object-contain" 
                                    alt={paymentMethod} 
                                />
                            </div>
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
                </CutCornerCard>

                {/* TrxID Input Card */}
                <CutCornerCard className="p-3.5 mb-3 space-y-2.5" flower={<AddMoneyFloraPattern />}>
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
                </CutCornerCard>

                {/* Submit Button */}
                <div className="mt-auto">
                    <CutCornerButton 
                        onClick={handleSubmit} 
                        disabled={!trxId.trim() || loading}
                        isSubmitting={loading}
                        icon={CheckCircle2}
                    >
                        {t?.verifyAddMoney || 'VERIFY & ADD MONEY'}
                    </CutCornerButton>
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
                <CutCornerCard className="p-3.5 space-y-3" flower={<AddMoneyFloraPattern />}>
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
                </CutCornerCard>

                {/* Payment Method Selection */}
                <CutCornerCard className="p-3.5 space-y-2.5" flower={<AddMoneyFloraPattern />}>
                    <label className="text-[11px] font-bold text-gray-400 block tracking-wider uppercase ml-0.5">
                        {t?.selectMethod || 'Select Payment Method'}
                    </label>

                    <div className="grid grid-cols-2 gap-2">
                        {/* bKash */}
                        <div 
                            onClick={() => setPaymentMethod('bKash')}
                            className={`px-3 py-2.5 rounded-xl border cursor-pointer transition-all flex items-center gap-2.5 ${
                                paymentMethod === 'bKash' 
                                    ? 'tp-asset-card-selected border-emerald-400 bg-emerald-50/50 shadow-2xs' 
                                    : 'tp-asset-card-unselected border-gray-200/80 bg-gray-50/50 hover:bg-gray-50'
                            }`}
                        >
                            <div className="w-8 h-8 rounded-lg tp-payment-logo-box bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-2xs">
                                <img 
                                    src={getPaymentLogo('bKash')} 
                                    className="w-full h-full object-contain" 
                                    alt="bKash" 
                                />
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <span className="font-bold text-[12px] text-gray-900 block leading-tight truncate">bKash</span>
                                <span className="text-[10px] text-gray-400 font-medium block">Personal</span>
                            </div>
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-all ${
                                paymentMethod === 'bKash' ? 'tp-asset-check-active bg-emerald-500 text-white' : 'tp-asset-check-inactive border border-gray-300'
                            }`}>
                                {paymentMethod === 'bKash' && <Check size={10} strokeWidth={3} />}
                            </div>
                        </div>

                        {/* Nagad */}
                        <div 
                            onClick={() => setPaymentMethod('Nagad')}
                            className={`px-3 py-2.5 rounded-xl border cursor-pointer transition-all flex items-center gap-2.5 ${
                                paymentMethod === 'Nagad' 
                                    ? 'tp-asset-card-selected border-indigo-400 bg-indigo-50/50 shadow-2xs' 
                                    : 'tp-asset-card-unselected border-gray-200/80 bg-gray-50/50 hover:bg-gray-50'
                            }`}
                        >
                            <div className="w-8 h-8 rounded-lg tp-payment-logo-box bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-2xs">
                                <img 
                                    src={getPaymentLogo('Nagad')} 
                                    className="w-full h-full object-contain" 
                                    alt="Nagad" 
                                />
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <span className="font-bold text-[12px] text-gray-900 block leading-tight truncate">Nagad</span>
                                <span className="text-[10px] text-gray-400 font-medium block">Personal</span>
                            </div>
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-all ${
                                paymentMethod === 'Nagad' ? 'tp-asset-check-active bg-indigo-500 text-white' : 'tp-asset-check-inactive border border-gray-300'
                            }`}>
                                {paymentMethod === 'Nagad' && <Check size={10} strokeWidth={3} />}
                            </div>
                        </div>
                    </div>
                </CutCornerCard>

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
                <CutCornerButton 
                    onClick={handleContinue} 
                    disabled={!amount || parseFloat(amount) < 20}
                    icon={ArrowDown}
                >
                    {t?.continuePayment || 'CONTINUE TO PAYMENT'}
                </CutCornerButton>
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
    // Fixed Buyer Rates (GRAM 220 TK, USDT 130 TK)
    const [buyerRates, setBuyerRates] = useState(() => {
        try {
            const cached = localStorage.getItem('maruf_buyer_rates');
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Date.now() - (parsed.timestamp || 0) < 60 * 60 * 1000 && parsed.rates?.USDT) {
                    return {
                        GRAM: parsed.rates.GRAM || 220,
                        USDT: parsed.rates.USDT || 130
                    };
                }
            }
        } catch (e) {}
        return { GRAM: 220, USDT: 130 };
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
            const newRates = {
                GRAM: data.buyRates?.GRAM || 220,
                USDT: data.buyRates?.USDT || 130
            };
            setBuyerRates(newRates);
            try {
                localStorage.setItem('maruf_buyer_rates', JSON.stringify({
                    rates: newRates,
                    timestamp: Date.now()
                }));
            } catch(e) {}
        }).catch(err => console.error("Error fetching buyer market rates:", err));

        return () => { isMounted = false; };
    }, []);

    const cryptoRate = selectedAsset === 'USDT' ? (buyerRates?.USDT || 130) : (buyerRates?.GRAM || 220);
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

                {/* SUCCESS STAGE WITH BLOOMING FLOWER */}
                {stage === 'success' ? (
                    <div className="py-2 text-center animate-in zoom-in-95 duration-400 my-auto">
                        {/* Blooming Flower Graphic */}
                        <BloomingFlowerGraphic />

                        {/* Status Badge */}
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[11px] font-black uppercase tracking-wider mb-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                            <Sparkles size={12} />
                            {lang === 'bn' ? 'ক্রয় সফল হয়েছে' : 'PURCHASE COMPLETED'}
                        </div>

                        <h4 className="text-[17px] font-black text-slate-900 mb-0.5">
                            {lang === 'bn' ? 'ক্রিপ্টো সফলভাবে পাঠানো হয়েছে! 🎉' : 'Crypto Sent Successfully! 🎉'}
                        </h4>
                        <p className="text-slate-500 text-[11px] mb-3 max-w-[280px] mx-auto leading-tight font-medium">
                            {lang === 'bn' 
                                ? <>আপনার ওয়ালেটে <b>{calculatedCrypto} {selectedAsset}</b> ট্রান্সফার সম্পন্ন।</>
                                : <>Successfully sent <b>{calculatedCrypto} {selectedAsset}</b> to your wallet.</>}
                        </p>

                        <div className="bg-slate-50/80 rounded-xl p-3 text-left text-[11px] space-y-1.5 border border-slate-200/80 mb-3">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500 font-medium">Crypto Sent:</span>
                                <span className="font-bold text-indigo-600">{calculatedCrypto} {selectedAsset}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500 font-medium">BDT Deducted:</span>
                                <span className="font-bold text-slate-900">৳{bdtAmount} TK</span>
                            </div>
                            <div className="flex justify-between items-center pt-1 border-t border-slate-200/50">
                                <span className="text-slate-500 font-medium">Wallet:</span>
                                <span className="font-mono font-bold text-slate-700 truncate max-w-[170px]">{receiveAddress}</span>
                            </div>
                        </div>

                        <CutCornerButton 
                            onClick={handleResetAndClose} 
                            icon={CheckCircle2}
                        >
                            {lang === 'bn' ? 'সম্পন্ন (ঠিক আছে)' : 'DONE'}
                        </CutCornerButton>
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
                        <CutCornerButton 
                            onClick={() => setStage('idle')} 
                            variant="secondary"
                        >
                            {lang === 'bn' ? 'আবার চেষ্টা করুন (TRY AGAIN)' : 'TRY AGAIN'}
                        </CutCornerButton>
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
                                    className={`p-2 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                                        selectedAsset === 'GRAM' 
                                            ? 'tp-asset-card-selected border-indigo-400/80 bg-indigo-50/55 shadow-2xs' 
                                            : 'tp-asset-card-unselected border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/50'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <img src={`${import.meta.env.BASE_URL}gram.svg`} className="w-5 h-5 object-contain shrink-0" alt="GRAM" />
                                        <div className="text-left min-w-0">
                                            <span className="font-extrabold text-[11px] text-slate-900 block leading-tight truncate">GRAM</span>
                                            <span className="text-[9px] text-indigo-500 font-bold block">≈ ৳{buyerRates.GRAM} TK</span>
                                        </div>
                                    </div>
                                    <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-all ${
                                        selectedAsset === 'GRAM'
                                            ? 'tp-asset-check-active bg-indigo-500 text-white'
                                            : 'tp-asset-check-inactive border border-slate-300/80 bg-transparent'
                                    }`}>
                                        {selectedAsset === 'GRAM' && <Check size={10} strokeWidth={3} />}
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setSelectedAsset('USDT')}
                                    className={`p-2 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                                        selectedAsset === 'USDT' 
                                            ? 'tp-asset-card-selected border-indigo-400/80 bg-indigo-50/55 shadow-2xs' 
                                            : 'tp-asset-card-unselected border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/50'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <img src={`${import.meta.env.BASE_URL}usdt.svg`} className="w-5 h-5 object-contain shrink-0" alt="USDT" />
                                        <div className="text-left min-w-0">
                                            <span className="font-extrabold text-[11px] text-slate-900 block leading-tight truncate">USDT</span>
                                            <span className="text-[9px] text-indigo-500 font-bold block">≈ ৳{buyerRates.USDT} TK</span>
                                        </div>
                                    </div>
                                    <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-all ${
                                        selectedAsset === 'USDT'
                                            ? 'tp-asset-check-active bg-indigo-500 text-white'
                                            : 'tp-asset-check-inactive border border-slate-300/80 bg-transparent'
                                    }`}>
                                        {selectedAsset === 'USDT' && <Check size={10} strokeWidth={3} />}
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
                        {(() => {
                            const realFee = selectedAsset === 'USDT' ? 0.008 : 0.0015;
                            const grossVal = parseFloat(calculatedCrypto) || 0;
                            const netVal = grossVal > realFee ? (grossVal - realFee).toFixed(4) : (grossVal > 0 ? grossVal.toFixed(4) : '0.0000');
                            return (
                                <div className="bg-indigo-50/80 border border-indigo-100/90 rounded-xl px-3 py-2 shrink-0 space-y-1">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <span className="text-[9px] font-black text-indigo-900 uppercase tracking-wider block">
                                                {t?.youWillReceive || (lang === 'bn' ? 'মোট ক্রয়' : 'Total Purchased')}
                                            </span>
                                            <span className="text-[10px] text-indigo-600 font-semibold">1 {selectedAsset} ≈ ৳{cryptoRate} BDT</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[14px] font-black text-slate-800">{calculatedCrypto}</span>
                                            <span className="text-[10px] font-bold text-slate-600 ml-1">{selectedAsset}</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center pt-1 border-t border-indigo-200/60 text-[10px]">
                                        <span className="text-slate-500 font-medium flex items-center gap-1">
                                            ⛽ {lang === 'bn' ? 'অন-চেইন রিয়েল গ্যাস ফি (০% লাভ)' : 'Real On-Chain Gas Fee (0% profit)'}:
                                        </span>
                                        <span className="font-mono font-bold text-rose-500">-{realFee} {selectedAsset}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-0.5 text-[11px]">
                                        <span className="text-emerald-700 font-bold">
                                            ✓ {lang === 'bn' ? 'ওয়ালেটে পৌঁছাবে (নেট)' : 'Net Received in Wallet'}:
                                        </span>
                                        <span className="font-black text-[15px] text-emerald-600">{netVal} {selectedAsset}</span>
                                    </div>
                                </div>
                            );
                        })()}

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
                                <CutCornerButton 
                                    onClick={onGoToAddMoney} 
                                    icon={PlusCircle}
                                >
                                    {t?.addMoney || 'ADD MONEY'} {lang === 'bn' ? 'করুন' : 'TO WALLET'}
                                </CutCornerButton>
                            ) : (
                                <CutCornerButton 
                                    onClick={handleConfirmBuy} 
                                    disabled={!numBdt || !receiveAddress || numBdt < 20} 
                                    icon={Coins}
                                >
                                    {t?.confirmBuy || 'CONFIRM & BUY'} {selectedAsset}
                                </CutCornerButton>
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
    const [showWalletDetails, setShowWalletDetails] = useState(false);
    const [liveRates, setLiveRates] = useState(() => {
        try {
            const cached = localStorage.getItem('maruf_seller_rates');
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Date.now() - (parsed.timestamp || 0) < 60 * 60 * 1000 && parsed.rates?.USDT) {
                    return {
                        ...parsed.rates,
                        GRAM: Math.min(160, parsed.rates.GRAM || 160)
                    };
                }
            }
        } catch(e) {}
        return { GRAM: 160, USDT: 115 };
    });

    // Fetch live market rates
    useEffect(() => {
        let isMounted = true;
        fetchMarketRates().then(data => {
            if (!isMounted || !data) return;
            if (data.sellRates && data.sellRates.USDT) {
                // Ensure 10 TK profit and max 160 TK ceiling
                const gramRate = data.sellRates.GRAM 
                    ? Math.min(160, data.sellRates.GRAM) 
                    : (data.realGramBdt ? Math.min(160, Math.round(data.realGramBdt - 10)) : 160);
                const newRates = {
                    GRAM: gramRate,
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
    const currentRate = asset === 'USDT' 
        ? (liveRates?.USDT || 115) 
        : Math.min(160, (liveRates?.GRAM || 160));
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

    // LUXURY FINTECH SUCCESS RECEIPT WITH BLOOMING FLOWER
    if (step === 2) {
        return (
            <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500 p-2 text-center pb-24 max-w-sm mx-auto">
                <CutCornerCard className="p-6 text-center space-y-4" flower={<SellCryptoMandalaPattern />}>
                    {/* Blooming Flower Graphic */}
                    <BloomingFlowerGraphic />

                    {/* Status Badge */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[11px] font-black uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        <Sparkles size={12} />
                        {lang === 'bn' ? 'বিক্রয় সফল হয়েছে' : 'SALE COMPLETED'}
                    </div>

                    <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight mb-1">
                            ৳{estimatedTk} BDT Added! 🎉
                        </h2>
                        <p className="text-slate-500 text-xs max-w-[280px] mx-auto leading-relaxed">
                            {lang === 'bn' 
                                ? 'আপনার ক্রিপ্টো বিক্রয় সফল হয়েছে এবং ব্যালেন্সে টাকা যুক্ত করা হয়েছে।' 
                                : 'Your crypto sale was successful and BDT balance has been credited.'}
                        </p>
                    </div>

                    {/* Breakdown Details */}
                    <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/80 text-left space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500 font-medium">Crypto Sold</span>
                            <span className="font-bold text-slate-900">{numAmount} {asset}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500 font-medium">Rate</span>
                            <span className="font-bold text-slate-900">1 {asset} ≈ ৳{currentRate} TK</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500 font-medium">Amount Credited</span>
                            <span className="font-extrabold text-emerald-600 text-sm">৳{estimatedTk} BDT</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500 font-medium">Destination</span>
                            <span className="font-bold text-slate-900">{lang === 'bn' ? 'ইন-অ্যাপ ব্যালেন্স' : 'In-App Balance'}</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2.5 pt-2">
                        <CutCornerButton 
                            onClick={onGoToWithdraw} 
                            icon={Wallet}
                        >
                            {t?.withdrawFunds || (lang === 'bn' ? 'টাকা উত্তোলন করুন' : 'WITHDRAW FUNDS')}
                        </CutCornerButton>
                        <CutCornerButton 
                            onClick={() => {
                                setStep(1);
                                setCryptoAmount('');
                                setTrxId('');
                                setErrorMessage('');
                                onDone();
                            }} 
                            variant="secondary"
                            icon={ArrowRight}
                        >
                            {lang === 'bn' ? 'হোমে ফিরে যান' : 'BACK TO HOME'}
                        </CutCornerButton>
                    </div>
                </CutCornerCard>
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
                    <button 
                        type="button"
                        onClick={() => setShowWalletDetails(true)}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 rounded-full text-[10px] font-bold active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                        title={userTonAddress}
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                        <span>Connected</span>
                    </button>
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

            <CutCornerCard className="p-3.5 space-y-3" flower={<SellCryptoMandalaPattern />}>
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
                                className={`p-2 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                                    asset === 'GRAM' 
                                        ? 'tp-asset-card-selected border-indigo-400/80 bg-indigo-50/55 shadow-2xs' 
                                        : 'tp-asset-card-unselected border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/50'
                                }`}
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <img src={`${import.meta.env.BASE_URL}gram.svg`} className="w-5 h-5 object-contain shrink-0" alt="GRAM" />
                                    <div className="text-left min-w-0">
                                        <span className="font-extrabold text-[11px] text-slate-900 block leading-tight truncate">GRAM</span>
                                        <span className="text-[9px] text-indigo-500 font-bold block">≈ ৳{liveRates?.GRAM || 160} TK</span>
                                    </div>
                                </div>
                                <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-all ${
                                    asset === 'GRAM'
                                        ? 'tp-asset-check-active bg-indigo-500 text-white'
                                        : 'tp-asset-check-inactive border border-slate-300/80 bg-transparent'
                                }`}>
                                    {asset === 'GRAM' && <Check size={10} strokeWidth={3} />}
                                </div>
                            </button>

                            {/* USDT */}
                            <button 
                                type="button"
                                onClick={() => setAsset('USDT')}
                                className={`p-2 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                                    asset === 'USDT' 
                                        ? 'tp-asset-card-selected border-indigo-400/80 bg-indigo-50/55 shadow-2xs' 
                                        : 'tp-asset-card-unselected border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/50'
                                }`}
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <img src={`${import.meta.env.BASE_URL}usdt.svg`} className="w-5 h-5 object-contain shrink-0" alt="USDT" />
                                    <div className="text-left min-w-0">
                                        <span className="font-extrabold text-[11px] text-slate-900 block leading-tight truncate">USDT</span>
                                        <span className="text-[9px] text-indigo-500 font-bold block">≈ ৳{liveRates.USDT} TK</span>
                                    </div>
                                </div>
                                <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-all ${
                                    asset === 'USDT'
                                        ? 'tp-asset-check-active bg-indigo-500 text-white'
                                        : 'tp-asset-check-inactive border border-slate-300/80 bg-transparent'
                                }`}>
                                    {asset === 'USDT' && <Check size={10} strokeWidth={3} />}
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
                                            ? 'bg-indigo-600 text-white shadow-xs ring-1 ring-indigo-400' 
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
                            <CutCornerButton 
                                onClick={() => tonConnectUI.openModal()} 
                                icon={Wallet}
                            >
                                {lang === 'bn' ? 'ওয়ালেট কানেক্ট করুন (Tonkeeper)' : 'Connect Wallet to Sell'}
                            </CutCornerButton>
                        ) : (
                            <CutCornerButton 
                                onClick={handleDirectSell} 
                                disabled={!numAmount || numAmount <= 0 || estimatedTk < 1 || isTonSending} 
                                isSubmitting={isTonSending}
                                icon={ArrowRightLeft}
                            >
                                {lang === 'bn' ? `কনফার্ম ও বিক্রি করুন (৳${estimatedTk} BDT)` : `Confirm & Sell for ৳${estimatedTk} BDT`}
                            </CutCornerButton>
                        )}
                    </div>
                </div>
            </CutCornerCard>

            <ConnectedWalletModal
                isOpen={showWalletDetails}
                onClose={() => setShowWalletDetails(false)}
                userTonAddress={userTonAddress}
                onDisconnect={async () => {
                    if (tonConnectUI) await tonConnectUI.disconnect();
                }}
                lang={lang}
            />
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


function ProfilePage({ user, balance, mbsId, lang = 'bn', t, onSetLang, darkMode = false, onToggleDarkMode, fiatWallet, fiatWithdrawPending, onGoToWithdraw, onGoToHistory, onGoToReferral, onGoToSpin, setFiatWallet, setIsModalOpen, reloadData }) {
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
      {/* 1. IDENTITY, THEME MOON TOGGLE & LANGUAGE MASTER CARD */}
      <CutCornerCard className="p-4" flower={<ProfileImperialFloraPattern />}>
         <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
               <div className="w-12 h-12 bg-indigo-50 border-2 border-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-black text-lg shrink-0 shadow-xs">
                  {user?.first_name?.charAt(0)?.toUpperCase() || 'U'}
               </div>
               <div className="min-w-0">
                  <h2 className="text-[15px] font-black text-slate-900 leading-tight truncate">{user?.first_name || 'User'}</h2>
                  <p className="text-slate-400 text-[11px] font-medium truncate">@{user?.username || 'user'}</p>
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

            {/* Right Column: Dark Mode / Light Mode Toggle Button + Language Switcher Pill */}
            <div className="flex flex-col items-end gap-1.5 shrink-0">
               {/* Prominent Dark Mode / Light Mode Toggle Button */}
               <button
                  type="button"
                  onClick={onToggleDarkMode}
                  title={darkMode ? (lang === 'bn' ? 'লাইট মোড চালু করুন' : 'Switch to Light Mode') : (lang === 'bn' ? 'ডার্ক মোড চালু করুন' : 'Switch to Dark Mode')}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10.5px] font-black transition-all duration-300 active:scale-90 cursor-pointer ${
                     darkMode
                        ? 'bg-indigo-950/90 border-indigo-400/50 text-amber-300 shadow-[0_0_14px_rgba(129,140,248,0.3)]'
                        : 'bg-indigo-50 border-indigo-200/80 text-indigo-700 hover:bg-indigo-100 shadow-2xs'
                  }`}
               >
                  {darkMode ? (
                     <Sun size={14} className="text-amber-300 shrink-0" />
                  ) : (
                     <CrescentMoonIcon size={14} isDark={false} />
                  )}
                  <span>{darkMode ? (lang === 'bn' ? 'লাইট মোড' : 'Light Mode') : (lang === 'bn' ? 'ডার্ক মোড' : 'Dark Mode')}</span>
               </button>

               {/* Language Switcher Pill */}
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
      <CutCornerCard className="p-4 space-y-3.5" flower={<ProfileImperialFloraPattern />}>
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
                     <div className="w-10 h-10 rounded-xl tp-payment-logo-box bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-xs">
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
         <CutCornerButton 
            onClick={handleWithdrawClick} 
            disabled={withdrawing} 
            icon={Wallet}
         >
            {t?.withdrawBalance || 'WITHDRAW BALANCE'}
         </CutCornerButton>
      </CutCornerCard>

      {/* 2.4 30-DAY SPIN & STAR GIVEAWAY MASTER CARD */}
      <CutCornerCard
         className={`p-3 border ${
            darkMode
               ? 'bg-slate-900 border-amber-500/35'
               : 'bg-gradient-to-br from-amber-50/95 via-white to-rose-50/90 border-amber-200/80'
         }`}
         flower={<ReferralRosePattern />}
      >
         <div
            onClick={onGoToSpin}
            className="flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all group p-1"
         >
            <div className="flex items-center gap-3 min-w-0">
               <div className="w-10 h-10 rounded-xl bg-amber-100/90 border border-amber-200/80 flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                  <TelegramAnimatedSticker src="tg-teddy-sticker.json" size={30} />
               </div>
               <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                     <span className="font-black text-slate-900 text-[13px] leading-tight">
                        {lang === 'bn' ? '৩০ দিনের মেগা স্পিন ও গিভওয়ে' : '30-Day Spin & Star Giveaway'}
                     </span>
                     <span className="px-2 py-0.5 bg-gradient-to-r from-amber-500 to-rose-500 text-white rounded-full text-[9px] font-black tracking-wide shadow-xs">
                        TEDDY & ৳500
                     </span>
                  </div>
                  <span className="text-[10.5px] text-amber-700 font-semibold block mt-0.5">
                     {lang === 'bn' ? 'ডেইলি ফ্রি স্পিন, রেফার স্পিন ও ৩টি অ্যাড দেখে স্পিন করুন!' : 'Daily free spin, referral spin & watch 3 ads for spin!'}
                  </span>
               </div>
            </div>
            <div className="w-7 h-7 rounded-full bg-amber-100/90 text-amber-700 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-all">
               <ChevronRight size={15} />
            </div>
         </div>
      </CutCornerCard>

      {/* 2.5 ROSE REFERRAL & EARN MASTER CARD */}
      <CutCornerCard
         className={`p-3 border ${
            darkMode
               ? 'bg-slate-900 border-rose-500/30'
               : 'bg-gradient-to-br from-rose-50/95 via-white to-pink-50/90 border-rose-200/80'
         }`}
         flower={<ReferralRosePattern />}
      >
         <div
            onClick={onGoToReferral}
            className="flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all group p-1"
         >
            <div className="flex items-center gap-3 min-w-0">
               <div className="w-10 h-10 rounded-xl bg-rose-100/90 border border-rose-200/80 flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                  <TelegramAnimatedSticker src="tg-rose-sticker.json" size={30} />
               </div>
               <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                     <span className="font-black text-slate-900 text-[13px] leading-tight">
                        {lang === 'bn' ? 'রেফার করুন এবং আয় করুন' : 'Refer Friends & Earn'}
                     </span>
                     <span className="px-2 py-0.5 bg-rose-600 text-white rounded-full text-[9px] font-black tracking-wide shadow-xs">
                        +৳5 / REF
                     </span>
                  </div>
                  <span className={`text-[10.5px] ${darkMode ? 'text-rose-300' : 'text-rose-700/85'} font-semibold inline-flex items-center gap-1 mt-0.5`}>
                     <span>{lang === 'bn' ? 'প্রতি অ্যাক্টিভ রেফারে নগদ ৫ টাকা বোনাস পান' : 'Get instant ৳5 BDT per active referral'}</span>
                     <CustomRoseIcon size={13} />
                  </span>
               </div>
            </div>
            <div className="w-7 h-7 rounded-full bg-rose-100/90 text-rose-600 flex items-center justify-center shrink-0 group-hover:bg-rose-600 group-hover:text-white transition-all">
               <ChevronRight size={15} />
            </div>
         </div>
      </CutCornerCard>

      {/* 3. HISTORY & SUPPORT SERVICES MASTER CARD */}
      <CutCornerCard className="p-2 space-y-1" flower={<ProfileImperialFloraPattern />}>
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

         <div className="h-px bg-slate-100 w-full" />

         {/* How to Buy & Sell Video Guide Row */}
         <div 
            onClick={() => {
               if (window.Telegram?.WebApp?.openLink) {
                  window.Telegram.WebApp.openLink('https://youtu.be/iimWerd2dPI');
               } else {
                  window.open('https://youtu.be/iimWerd2dPI', '_blank');
               }
            }} 
            className="p-2.5 rounded-xl hover:bg-slate-50 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all group"
         >
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 group-hover:scale-105 transition-transform shrink-0 border border-rose-100">
                  <PlayCircle size={16} />
               </div>
               <div>
                  <span className="font-bold text-slate-900 block text-[12px] leading-tight">
                     {lang === 'bn' ? 'কীভাবে বাই-সেল করবেন' : 'How to Buy & Sell'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                     {lang === 'bn' ? 'টিউটোরিয়াল ভিডিও দেখে সহজে শিখুন' : 'Watch step-by-step video tutorial'}
                  </span>
               </div>
            </div>
            <ChevronRight size={15} className="text-slate-400 group-hover:text-rose-500 transition-colors" />
         </div>
      </CutCornerCard>


      {/* Support Message Modal */}
      {showSupportModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
              <div 
                  className="relative bg-white w-full max-w-[340px] p-5 shadow-2xl border border-indigo-100/60 animate-in zoom-in-95"
                  style={{
                      clipPath: 'polygon(16px 0, calc(100% - 16px) 0, 100% 16px, 100% calc(100% - 16px), calc(100% - 16px) 100%, 16px 100%, 0 calc(100% - 16px), 0 16px)',
                  }}
              >
                  <FloralWatermark />
                  <div className="flex justify-between items-center mb-3 relative z-10">
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
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
              <div 
                  className="relative bg-white w-full max-w-[320px] p-6 shadow-2xl border border-indigo-100/60 animate-in zoom-in-95 slide-in-from-bottom-4"
                  style={{
                      clipPath: 'polygon(16px 0, calc(100% - 16px) 0, 100% 16px, 100% calc(100% - 16px), calc(100% - 16px) 100%, 16px 100%, 0 calc(100% - 16px), 0 16px)',
                  }}
              >
                  <FloralWatermark />
                  <div className="flex justify-between items-center mb-5 relative z-10">
                      <h3 className="text-xl font-extrabold text-slate-900">Wallet Setup</h3>
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
                                      <div className="w-8 h-8 rounded-lg tp-payment-logo-box bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-2xs">
                                       <img src={getPaymentLogo(walletMethod)} alt={walletMethod} className="w-full h-full object-contain" />
                                   </div>
                                      <span className="font-bold text-[var(--color-text-primary)]">{walletMethod}</span>
                                  </div>
                                  <ChevronRight size={16} className={`text-gray-400 transition-transform ${showMethodDropdown ? '-rotate-90' : 'rotate-90'}`} />
                              </div>
                              
                              {showMethodDropdown && (
                                  <>
                                      <div className="fixed inset-0 z-40" onClick={() => setShowMethodDropdown(false)}></div>
                                      <div className="tp-wallet-dropdown absolute top-full left-0 right-0 mt-2 bg-white rounded-[14px] premium-shadow border border-[var(--color-border)] overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                                          {['bKash', 'Nagad'].filter(method => method !== walletMethod).map(method => (
                                              <button key={method} onClick={() => { setWalletMethod(method); setShowMethodDropdown(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 active:bg-gray-100 transition-colors">
                                                  <div className="w-8 h-8 rounded-lg tp-payment-logo-box bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-2xs">
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

                  <div className="mt-6">
                      <CutCornerButton 
                          onClick={handleSaveWallet} 
                          disabled={!walletNumber || !walletName || isSaving} 
                          isSubmitting={isSaving}
                          icon={Save}
                      >
                          {lang === 'bn' ? 'ওয়ালেট সেভ করুন' : 'SAVE WALLET'}
                      </CutCornerButton>
                  </div>
              </div>
          </div>
      )}

      {txStatus && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
           <div 
               className="relative bg-white w-full max-w-[300px] p-6 flex flex-col items-center text-center shadow-2xl border border-indigo-100/60 animate-in zoom-in-95 slide-in-from-bottom-4"
               style={{
                   clipPath: 'polygon(16px 0, calc(100% - 16px) 0, 100% 16px, 100% calc(100% - 16px), calc(100% - 16px) 100%, 16px 100%, 0 calc(100% - 16px), 0 16px)',
               }}
           >
              <FloralWatermark />
              <div className="relative z-10 w-full flex flex-col items-center">
                  {txStatus === 'success' ? (
                     <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 size={32} className="text-emerald-600" />
                     </div>
                  ) : (
                     <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <AlertCircle size={32} className="text-red-600" />
                     </div>
                  )}
                  <h3 className={`text-xl font-extrabold mb-2 ${txStatus === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                     {txStatus === 'success' ? (lang === 'bn' ? 'সফল হয়েছে!' : 'Success!') : (lang === 'bn' ? 'ব্যর্থ হয়েছে' : 'Error')}
                  </h3>
                  <p className="text-[13px] font-semibold text-slate-500 mb-6">{txMessage}</p>
                  <CutCornerButton onClick={() => setTxStatus(null)} variant="secondary">
                     {lang === 'bn' ? 'ঠিক আছে' : 'Close'}
                  </CutCornerButton>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}


function ReferralPage({ user, lang = 'bn', darkMode = false, onBack, reloadData }) {
  const userId = user?.id || 123456789;
  const defaultBotLink = `https://t.me/bd_trust_pay_bot?start=ref_${userId}`;
  const [refData, setRefData] = useState({
    botReferralLink: defaultBotLink,
    referralLink: defaultBotLink,
    miniAppReferralLink: `https://t.me/bd_trust_pay_bot/app?startapp=ref_${userId}`,
    sharePreviewUrl: `${window.location.origin}/invite/${userId}`,
    bannerUrl: `${window.location.origin}/app/referral-banner.jpg`,
    rewardPerReferral: 5,
    minVolumeBdt: 20,
    totalReferrals: 0,
    activeReferrals: 0,
    pendingReferrals: 0,
    referralEarnings: 0,
    referrals: []
  });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareToast, setShareToast] = useState('');

  useEffect(() => {
    let mounted = true;
    const loadRef = async () => {
      setLoading(true);
      try {
        const data = await fetchReferralData(userId);
        if (mounted && data && !data.error) {
          setRefData(prev => ({
            ...prev,
            ...data,
            botReferralLink: data.botReferralLink || data.referralLink || prev.botReferralLink,
            totalReferrals: data.totalReferrals ?? data.stats?.totalReferrals ?? 0,
            activeReferrals: data.activeReferrals ?? data.stats?.activeReferrals ?? 0,
            pendingReferrals: data.pendingReferrals ?? data.stats?.pendingReferrals ?? 0,
            referralEarnings: data.referralEarnings ?? data.stats?.totalEarned ?? 0
          }));
        }
      } catch (e) {
        console.error('Failed to load referral data:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadRef();
    return () => { mounted = false; };
  }, [userId]);

  const activeReferralLink = refData.botReferralLink || refData.referralLink || defaultBotLink;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(activeReferralLink);
    setCopied(true);
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
    setTimeout(() => setCopied(false), 2200);
  };

  const handleShareRichMessage = async () => {
    if (sharing) return;
    setSharing(true);
    setShareToast('');
    try {
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
      }

      const res = await prepareReferralShare({
        userId,
        sendToBotChat: false
      });

      const tg = window.Telegram?.WebApp;

      // 1. If Telegram supports native prepared inline message sharing (Photo + Caption + Inline Join Button)
      if (res?.preparedMessageId && typeof tg?.shareMessage === 'function') {
        tg.shareMessage(res.preparedMessageId, (sent) => {
          if (sent) {
            setShareToast(lang === 'bn' ? 'রেফারেল মেসেজ সফলভাবে শেয়ার হয়েছে!' : 'Referral message shared successfully!');
          }
        });
      } else {
        const fallbackShareText =
          `✨ Trust Pay — Instant Crypto Buy & Sell BD ✨\n\n` +
          `💎 TON, GRAM ও USDT খুব সহজে কিনুন এবং বিক্রি করুন!\n` +
          `⚡ bKash ও Nagad-এ মাত্র ২ মিনিটে অটোমেটিক পেমেন্ট!\n` +
          `🎁 নিচের লিংকে ক্লিক করে জয়েন করুন 👇\n` +
          `${activeReferralLink}`;
        const shareUrl =
          res?.telegramShareUrl ||
          `https://t.me/share/url?url=${encodeURIComponent(refData.sharePreviewUrl || activeReferralLink)}&text=${encodeURIComponent(fallbackShareText)}`;

        if (tg?.openTelegramLink) {
          tg.openTelegramLink(shareUrl);
        } else {
          window.open(shareUrl, '_blank');
        }
      }
    } catch (err) {
      console.error('Share error:', err);
      const fallbackUrl = `https://t.me/share/url?url=${encodeURIComponent(activeReferralLink)}&text=${encodeURIComponent('✨ Trust Pay — Instant Crypto Buy & Sell (bKash & Nagad)! নিচের লিংকে ক্লিক করে জয়েন করুন 👇')}`;
      if (window.Telegram?.WebApp?.openTelegramLink) {
        window.Telegram.WebApp.openTelegramLink(fallbackUrl);
      } else {
        window.open(fallbackUrl, '_blank');
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 max-w-md mx-auto pb-16 relative">
      {/* Top Navigation & Telegram Animated Rose Header Bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/95 border border-rose-200 text-rose-700 font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer"
        >
          <ArrowLeft size={15} />
          <span>{lang === 'bn' ? 'প্রোফাইলে ফিরুন' : 'Back to Profile'}</span>
        </button>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100/95 border border-rose-200 text-rose-700 text-[11px] font-black shadow-xs">
          <TelegramAnimatedSticker src="tg-rose-sticker.json" size={18} />
          <span>{lang === 'bn' ? 'রেফারেল প্রোগ্রাম' : 'Referral Program'}</span>
        </div>
      </div>

      {/* 1. HERO ROSE GARDEN BANNER CARD */}
      <CutCornerCard
        className="p-0 overflow-hidden bg-gradient-to-br from-rose-600 via-rose-500 to-pink-600 text-white border border-rose-300/60 shadow-[0_14px_34px_rgba(225,29,72,0.22)]"
        flower={<ReferralRosePattern />}
      >
        {/* Promotional Referral Banner Image Preview */}
        <div className="relative w-full h-44 overflow-hidden border-b border-white/15 bg-indigo-950">
          <img
            src={referralBannerImg}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = `${import.meta.env.BASE_URL || '/app/'}referral-banner.jpg`;
            }}
            alt="Trust Pay Referral Banner"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-rose-950/90 via-rose-950/25 to-transparent flex items-end justify-between p-3.5 gap-2">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-600/95 backdrop-blur-xs text-white text-[10px] font-black w-fit mb-1 border border-rose-300/50 shadow-xs">
                <CustomRoseIcon size={13} />
                <span>{lang === 'bn' ? 'অ্যাক্টিভ রেফার বোনাস' : 'Active Refer Bonus'}</span>
                <span className="bg-white text-rose-600 px-1.5 py-0.2 rounded-full font-black">+৳৫ টাকা</span>
              </div>
              <h2 className="text-[15px] font-black text-white leading-snug drop-shadow-xs">
                {lang === 'bn'
                  ? 'বন্ধুদের ইনভাইট করুন এবং প্রতি রেফারে ৫ টাকা পান!'
                  : 'Invite Friends & Earn ৳5 Per Active Referral!'}
              </h2>
            </div>

            {/* Official Telegram Animated Gift Sticker */}
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center shrink-0 shadow-md">
              <TelegramAnimatedSticker src="tg-gift-sticker.json" size={38} />
            </div>
          </div>
        </div>

        {/* 3-Column Stats Row */}
        <div className="p-3.5 bg-white/95 text-slate-900">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-rose-50/80 border border-rose-100">
              <span className="text-[10px] font-bold text-rose-500 block">
                {lang === 'bn' ? 'মোট রেফার' : 'Total Joined'}
              </span>
              <span className="text-lg font-black text-slate-900 mt-0.5 block">
                {loading ? '...' : refData.totalReferrals}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-100">
              <span className="text-[10px] font-bold text-emerald-600 block">
                {lang === 'bn' ? 'অ্যাক্টিভ রেফার' : 'Active Refs'}
              </span>
              <span className="text-lg font-black text-emerald-700 mt-0.5 block">
                {loading ? '...' : refData.activeReferrals}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-50/90 border border-amber-200/70">
              <span className="text-[10px] font-bold text-amber-700 block">
                {lang === 'bn' ? 'মোট বোনাস আয়' : 'Total Earned'}
              </span>
              <span className="text-lg font-black text-amber-700 mt-0.5 block">
                ৳{loading ? '...' : refData.referralEarnings}
              </span>
            </div>
          </div>
        </div>
      </CutCornerCard>

      {/* 2. REFERRAL LINK COPY & RICH SHARE CARD (WITH ANIMATED ROSE STICKER & SHORT BUTTON) */}
      <CutCornerCard
        className={`p-4 space-y-3 border ${
          darkMode
            ? 'bg-slate-900 border-rose-500/30'
            : 'bg-gradient-to-br from-white via-rose-50/40 to-pink-50/50 border-rose-200/80'
        }`}
        flower={<ReferralRosePattern />}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-rose-100/90 border border-rose-200/80 flex items-center justify-center shrink-0">
              <TelegramAnimatedSticker src="tg-rose-sticker.json" size={28} />
            </div>
            <div className="min-w-0">
              <h3 className="text-[13px] font-black text-slate-900 leading-tight">
                {lang === 'bn' ? 'আপনার পার্সোনাল রেফারেল লিংক' : 'Your Personal Referral Link'}
              </h3>
              <p className={`text-[10px] ${darkMode ? 'text-rose-300' : 'text-rose-600/85'} font-semibold truncate mt-0.5`}>
                {lang === 'bn' ? 'লিংক কপি বা শেয়ার করে বন্ধুদের আমন্ত্রণ জানান' : 'Copy or share your link to invite friends'}
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black shrink-0 border border-rose-200/60">
            +৳5 / Ref
          </span>
        </div>

        {/* Link Box + Copy Button */}
        <div className="flex items-center gap-2 bg-white border-2 border-rose-200/90 rounded-xl p-1.5 shadow-2xs">
          <div className="flex-1 min-w-0 px-2">
            <span className="text-[11px] font-mono font-bold text-slate-700 block truncate select-all">
              {activeReferralLink}
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopyLink}
            className={`px-3 py-2 rounded-lg text-[11px] font-black flex items-center gap-1.5 shrink-0 transition-all active:scale-95 cursor-pointer ${
              copied
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/30'
                : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
            }`}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            <span>{copied ? (lang === 'bn' ? 'কপি হয়েছে!' : 'Copied!') : (lang === 'bn' ? 'কপি করুন' : 'Copy')}</span>
          </button>
        </div>

        {/* Clean, Short Single-Line Share Button */}
        <button
          type="button"
          onClick={handleShareRichMessage}
          disabled={sharing}
          className="w-full h-[46px] px-4 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-rose-600 hover:from-rose-700 hover:to-pink-700 text-white font-black text-[13.5px] shadow-md shadow-rose-500/25 flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60"
        >
          {sharing ? (
            <Loader2 size={17} className="animate-spin" />
          ) : (
            <>
              <CustomRoseIcon size={17} />
              <span>{lang === 'bn' ? 'শেয়ার করুন' : 'Share Link'}</span>
              <Send size={14} className="ml-0.5" />
            </>
          )}
        </button>

        {shareToast && (
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-bold flex items-center justify-center gap-1.5 text-center leading-snug animate-in fade-in">
            <CustomRoseIcon size={14} />
            <span>{shareToast}</span>
          </div>
        )}
      </CutCornerCard>

      {/* 3. HOW ACTIVE REFERRAL WORKS (3 CONDITIONS) */}
      <CutCornerCard
        className={`p-4 space-y-3 border ${
          darkMode
            ? 'bg-slate-900 border-rose-500/30'
            : 'bg-gradient-to-br from-white via-rose-50/25 to-white border-rose-200/70'
        }`}
        flower={<ReferralRosePattern />}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-100/90 border border-rose-200/80 flex items-center justify-center shrink-0 shadow-2xs">
            <TelegramAnimatedSticker src="tg-gift-sticker.json" size={24} />
          </div>
          <h3 className="text-[13px] font-black text-slate-900 leading-snug">
            {lang === 'bn' ? 'কীভাবে রেফার Active হবে এবং ৫ টাকা পাবেন?' : 'How Referral Becomes Active (+৳5 Bonus)'}
          </h3>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-rose-50/60 border border-rose-100">
            <div className="w-6 h-6 rounded-full bg-rose-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
              1
            </div>
            <div>
              <span className="text-[12px] font-extrabold text-slate-900 block">
                {lang === 'bn' ? 'রেফারেল লিংক বা বাটনে ক্লিক করে আইডি তৈরি' : 'Join via Referral Link or Button'}
              </span>
              <span className="text-[10.5px] text-slate-600 font-medium leading-snug block mt-0.5">
                {lang === 'bn'
                  ? 'আপনার শেয়ার করা মেসেজের বাটনে বা লিংকে ক্লিক করে নতুন ইউজারকে বটে স্টার্ট করতে হবে।'
                  : 'Your friend must start the bot using your referral link or join button.'}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-rose-50/60 border border-rose-100">
            <div className="w-6 h-6 rounded-full bg-rose-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
              2
            </div>
            <div>
              <span className="text-[12px] font-extrabold text-slate-900 block">
                {lang === 'bn' ? 'ওয়ালেট কানেক্ট করা (Wallet Connect)' : 'Connect a Wallet'}
              </span>
              <span className="text-[10.5px] text-slate-600 font-medium leading-snug block mt-0.5">
                {lang === 'bn'
                  ? 'ইউজারকে বটে TON Wallet কানেক্ট করতে হবে অথবা bKash/Nagad পেআউট ওয়ালেট যুক্ত করতে হবে।'
                  : 'Your friend must connect a TON wallet or save a bKash/Nagad wallet.'}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/70">
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
              3
            </div>
            <div>
              <span className="text-[12px] font-extrabold text-emerald-950 block">
                {lang === 'bn' ? '২০ টাকা Add Money অথবা ২০ টাকা Crypto Sell' : 'Complete ৳20 Add Money or ৳20 Crypto Sell'}
              </span>
              <span className="text-[10.5px] text-emerald-800 font-medium leading-snug block mt-0.5">
                {lang === 'bn'
                  ? 'কমপক্ষে ২০ টাকা অ্যাড মানি অথবা ২০ টাকার ক্রিপ্টো সেল সম্পন্ন করলেই রেফারটি সাথে সাথে Active হবে এবং আপনার মেইন ব্যালেন্সে +৳৫ টাকা যোগ হয়ে যাবে!'
                  : 'Once they complete at least ৳20 Add Money or ৳20 Crypto Sell, the referral becomes Active and +৳5 BDT is credited instantly!'}
              </span>
            </div>
          </div>
        </div>

        {/* Anti-Clone Security Warning */}
        <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-200/80 flex items-start gap-2.5">
          <ShieldCheck size={17} className="text-amber-700 shrink-0 mt-0.5" />
          <div className="text-[10.5px] text-amber-900 font-semibold leading-relaxed">
            <span className="font-black block text-amber-950 mb-0.5">
              {lang === 'bn' ? 'অ্যান্টি-ক্লোন ও ডিভাইস সিকিউরিটি সতর্কবার্তা:' : 'Anti-Clone & Device Security Notice:'}
            </span>
            {lang === 'bn'
              ? 'একই মোবাইলে Clone App, Parallel Space, Dual App বা একাধিক টেলিগ্রাম আইডি খুলে নিজে নিজেকে রেফার করলে আমাদের হার্ডওয়্যার সিকিউরিটি সিস্টেম তা সাথে সাথে ব্লক করে দিবে এবং কোনো বোনাস যুক্ত হবে না।'
              : 'Using Clone Apps, Parallel Space, or multiple accounts on the same phone is strictly blocked by our hardware device fingerprint security.'}
          </div>
        </div>
      </CutCornerCard>

      {/* 4. REFERRED USERS LIST CARD */}
      <CutCornerCard
        className="p-4 space-y-3 bg-white border border-rose-200/70"
        flower={<ReferralRosePattern />}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-rose-600" />
            <h3 className="text-[13px] font-black text-slate-900">
              {lang === 'bn' ? 'আপনার রেফার তালিকা' : 'Your Referred Users'}
            </h3>
          </div>
          <span className="text-[10px] font-bold text-slate-400">
            {refData.referrals?.length || 0} {lang === 'bn' ? 'জন' : 'Users'}
          </span>
        </div>

        {loading ? (
          <div className="py-8 flex flex-col items-center justify-center text-rose-500 gap-2">
            <Loader2 size={22} className="animate-spin" />
            <span className="text-xs font-bold">{lang === 'bn' ? 'লোড হচ্ছে...' : 'Loading...'}</span>
          </div>
        ) : !refData.referrals || refData.referrals.length === 0 ? (
          <div className="py-6 text-center space-y-1.5 bg-rose-50/40 rounded-xl border border-dashed border-rose-200 p-4 flex flex-col items-center">
            <TelegramAnimatedSticker src="tg-rose-sticker.json" size={52} />
            <p className="text-[12px] font-bold text-slate-700 mt-1">
              {lang === 'bn' ? 'এখনো কোনো রেফার নেই' : 'No referrals yet'}
            </p>
            <p className="text-[10.5px] text-slate-500">
              {lang === 'bn'
                ? 'উপরের শেয়ার বাটনে ক্লিক করে বন্ধুদের ইনভাইট করুন এবং প্রতি অ্যাক্টিভ রেফারে ৫ টাকা বোনাস নিন!'
                : 'Tap the Share button above to invite friends and earn ৳5 per active referral!'}
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-0.5">
            {refData.referrals.map((item, idx) => {
              const isAct = item.status === 'active';
              const isBlocked = item.status === 'rejected_clone' || item.status === 'blocked_clone';
              return (
                <div
                  key={item.userId || item.id || idx}
                  className="p-2.5 rounded-xl bg-slate-50/90 border border-slate-200/80 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[12px] font-black text-slate-900 truncate">
                        {item.name || 'Telegram User'}
                      </span>
                      {item.username && (
                        <span className="text-[10px] text-slate-400 font-medium truncate">
                          @{item.username}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                        ✓ ID Joined
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                          item.walletConnected
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        {item.walletConnected ? '✓ Wallet' : '⏳ Wallet'}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                          item.qualifyingTxDone
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        {item.qualifyingTxDone ? '✓ ৳20+ Tx' : '⏳ ৳20+ Tx'}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    {isAct ? (
                      <span className="px-2 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-black block">
                        +৳{item.rewardAmount || item.bonusAmount || 5} Active
                      </span>
                    ) : isBlocked ? (
                      <span className="px-2 py-1 rounded-lg bg-rose-100 text-rose-700 text-[10px] font-black block">
                        Clone Blocked
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-lg bg-amber-100 text-amber-800 text-[10px] font-black block">
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CutCornerCard>
    </div>
  );
}

const SPIN_BOARD_CARDS = [
  {
    index: 0,
    id: '1_tk',
    title: '৳1 TK',
    subtitleBn: 'নগদ বোনাস',
    subtitleEn: 'Instant Cash',
    sticker: 'tg-coin-sticker.json',
    badge: '99% HOT',
    accent: 'emerald'
  },
  {
    index: 1,
    id: '5_tk',
    title: '৳5 TK',
    subtitleBn: 'লাকি ক্যাশ',
    subtitleEn: 'Lucky Cash',
    sticker: 'tg-star-sticker.json',
    badge: 'LUCKY',
    accent: 'amber'
  },
  {
    index: 2,
    id: '10_tk',
    title: '৳10 TK',
    subtitleBn: 'সুপার ক্যাশ',
    subtitleEn: 'Super Cash',
    sticker: 'tg-cash-sticker.json',
    badge: 'SUPER',
    accent: 'indigo'
  },
  {
    index: 3,
    id: '20_tk',
    title: '৳20 TK',
    subtitleBn: 'হট প্রাইজ',
    subtitleEn: 'Hot Prize',
    sticker: 'tg-fire-sticker.json',
    badge: 'HOT',
    accent: 'rose'
  },
  {
    index: 4,
    id: 'teddy',
    title: 'Teddy Gift',
    subtitleBn: '⭐ টেলিগ্রাম গিফট',
    subtitleEn: '⭐ Star Gift',
    sticker: 'tg-teddy-sticker.json',
    badge: 'STAR GIFT',
    accent: 'royal',
    isCenter: true
  },
  {
    index: 5,
    id: '100_tk',
    title: '৳100 TK',
    subtitleBn: 'রয়েল ক্যাশ',
    subtitleEn: 'Royal Cash',
    sticker: 'tg-gift-sticker.json',
    badge: 'ROYAL',
    accent: 'purple'
  },
  {
    index: 6,
    id: 'again',
    title: 'Again',
    subtitleBn: 'আবার চেষ্টা করুন',
    subtitleEn: 'Try Later',
    sticker: 'tg-target-sticker.json',
    badge: 'TRY AGAIN',
    accent: 'slate'
  },
  {
    index: 7,
    id: '500_tk',
    title: '৳500 TK',
    subtitleBn: 'মেগা ক্যাশ',
    subtitleEn: 'Mega Cash',
    sticker: 'tg-trophy-sticker.json',
    badge: 'MEGA',
    accent: 'amber'
  },
  {
    index: 8,
    id: '1_usd',
    title: '$1 USD',
    subtitleBn: '≈ ৳১২০ টাকা',
    subtitleEn: '≈ ৳120 BDT',
    sticker: 'tg-gem-sticker.json',
    badge: 'VIP $1',
    accent: 'sky'
  }
];

// Perimeter loop order around the 3x3 board + center card for exciting visual spin
const SPIN_RING_PATH = [0, 1, 2, 5, 8, 7, 6, 3, 4];

function SpinEventPage({ user, lang = 'bn', darkMode = false, onBack, onGoToReferral, reloadData }) {
  const userId = user?.id || 123456789;
  const [spinStatus, setSpinStatus] = useState(() => ({
    dailyFreeAvailable: true,
    nextDailySpinAt: Date.now(),
    extraSpins: 0,
    totalAvailableSpins: 1,
    adProgress: 0,
    totalSpinsByUser: 0,
    totalWonBdt: 0,
    totalReferralsForSpin: 0,
    eventEndAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    totalGlobalSpins: 0,
    milestoneTarget: 50000,
    monetagZoneId: '',
    adsgramBlockId: ''
  }));
  const [loading, setLoading] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);
  const [highlightedCardIndex, setHighlightedCardIndex] = useState(4);
  const [spinResultModal, setSpinResultModal] = useState(null);
  const [spinError, setSpinError] = useState('');

  // Countdown states
  const [eventCountdown, setEventCountdown] = useState({ days: '30', hours: '00', mins: '00', secs: '00' });
  const [dailyCooldownStr, setDailyCooldownStr] = useState('');

  // Ad watching states
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [fallbackAdTimer, setFallbackAdTimer] = useState(0);
  const [showFallbackAdModal, setShowFallbackAdModal] = useState(false);
  const [adUnlockToast, setAdUnlockToast] = useState('');

  const loadSpinData = async () => {
    try {
      const data = await fetchSpinStatus(userId);
      if (data && data.success) {
        setSpinStatus(prev => ({ ...prev, ...data }));
      }
    } catch (e) {
      console.warn('loadSpinData error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSpinData();
  }, [userId]);

  // Inject Monetag / Adsgram scripts dynamically if configured in backend
  useEffect(() => {
    if (spinStatus.monetagZoneId) {
      const zoneId = String(spinStatus.monetagZoneId).trim();
      const scriptId = `monetag-sdk-${zoneId}`;
      if (!document.getElementById(scriptId)) {
        const s = document.createElement('script');
        s.id = scriptId;
        s.src = '//libtl.com/sdk.js';
        s.setAttribute('data-zone', zoneId);
        s.setAttribute('data-sdk', `show_${zoneId}`);
        s.async = true;
        document.head.appendChild(s);
      }
    }
    if (spinStatus.adsgramBlockId) {
      const scriptId = 'adsgram-sdk-script';
      if (!document.getElementById(scriptId)) {
        const s = document.createElement('script');
        s.id = scriptId;
        s.src = 'https://sad.adsgram.ai/js/sad.min.js';
        s.async = true;
        document.head.appendChild(s);
      }
    }
  }, [spinStatus.monetagZoneId, spinStatus.adsgramBlockId]);

  // Live 1-second tick for 30-Day Event Countdown & 24h Daily Free Spin Cooldown
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const diffEvent = Math.max(0, (spinStatus.eventEndAt || (now + 30 * 86400000)) - now);
      const d = Math.floor(diffEvent / (1000 * 60 * 60 * 24));
      const h = Math.floor((diffEvent / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diffEvent / (1000 * 60)) % 60);
      const s = Math.floor((diffEvent / 1000) % 60);
      setEventCountdown({
        days: String(d).padStart(2, '0'),
        hours: String(h).padStart(2, '0'),
        mins: String(m).padStart(2, '0'),
        secs: String(s).padStart(2, '0')
      });

      if (!spinStatus.dailyFreeAvailable && spinStatus.nextDailySpinAt > now) {
        const rem = spinStatus.nextDailySpinAt - now;
        const ch = Math.floor(rem / (1000 * 60 * 60));
        const cm = Math.floor((rem / (1000 * 60)) % 60);
        const cs = Math.floor((rem / 1000) % 60);
        setDailyCooldownStr(
          `${String(ch).padStart(2, '0')}:${String(cm).padStart(2, '0')}:${String(cs).padStart(2, '0')}`
        );
      } else {
        setDailyCooldownStr('');
      }
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [spinStatus.eventEndAt, spinStatus.dailyFreeAvailable, spinStatus.nextDailySpinAt]);

  // Handle Spin Button Click with 9-Card Neon Highlight Animation
  const handleStartSpin = async () => {
    if (isSpinning) return;
    if ((spinStatus.totalAvailableSpins || 0) <= 0) {
      setSpinError(
        lang === 'bn'
          ? 'আপনার ফ্রি স্পিন শেষ! নিচে ৩টি অ্যাড দেখে অথবা বন্ধুদের রেফার করে ফ্রি স্পিন নিন।'
          : 'No spins left! Watch 3 ads below or refer a friend to get a free spin.'
      );
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('warning');
      }
      return;
    }

    setSpinError('');
    setIsSpinning(true);
    setSpinResultModal(null);

    try {
      const res = await executeSpin(userId);
      if (!res || !res.success) {
        throw new Error(res?.error || 'Spin failed');
      }

      const targetCardIndex = typeof res.winningIndex === 'number' ? res.winningIndex : 6;
      const targetPosInRing = Math.max(0, SPIN_RING_PATH.indexOf(targetCardIndex));
      const fullCycles = 3; // 3 full loops around all 9 cards + land on target
      const totalSteps = fullCycles * SPIN_RING_PATH.length + targetPosInRing;

      let step = 0;
      const runStep = () => {
        const currentCard = SPIN_RING_PATH[step % SPIN_RING_PATH.length];
        setHighlightedCardIndex(currentCard);

        try {
          if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.selectionChanged();
          }
        } catch (_) {}

        if (step < totalSteps) {
          step++;
          const remaining = totalSteps - step;
          // Smooth deceleration curve
          let delay = 75;
          if (remaining < 8) {
            delay = 90 + (8 - remaining) * 42;
          }
          setTimeout(runStep, delay);
        } else {
          // Landed on targetCardIndex!
          setHighlightedCardIndex(targetCardIndex);
          try {
            if (window.Telegram?.WebApp?.HapticFeedback) {
              window.Telegram.WebApp.HapticFeedback.notificationOccurred(
                targetCardIndex === 6 && !res.bonusFreeRespin ? 'warning' : 'success'
              );
            }
          } catch (_) {}

          setSpinStatus(prev => ({
            ...prev,
            dailyFreeAvailable: res.dailyFreeAvailable,
            nextDailySpinAt: res.nextDailySpinAt,
            extraSpins: res.extraSpins,
            totalAvailableSpins: res.totalAvailableSpins,
            totalGlobalSpins: res.totalGlobalSpins,
            totalSpinsByUser: (prev.totalSpinsByUser || 0) + 1,
            totalWonBdt: (prev.totalWonBdt || 0) + (res.bdtWon || 0)
          }));

          if (res.bdtWon > 0 && reloadData) {
            reloadData();
          }

          setTimeout(() => {
            setIsSpinning(false);
            setSpinResultModal({
              card: SPIN_BOARD_CARDS[targetCardIndex] || SPIN_BOARD_CARDS[6],
              bdtWon: res.bdtWon || 0,
              isMilestoneWinner: Boolean(res.isMilestoneWinner),
              bonusFreeRespin: Boolean(res.bonusFreeRespin)
            });
          }, 380);
        }
      };

      runStep();
    } catch (err) {
      setIsSpinning(false);
      setSpinError(err.message || (lang === 'bn' ? 'স্পিন করতে সমস্যা হয়েছে' : 'Spin failed'));
    }
  };

  // Credit 1 Ad Watched on Backend
  const completeOneAdWatch = async () => {
    try {
      const res = await watchSpinAd(userId);
      if (res && res.success) {
        setSpinStatus(prev => ({
          ...prev,
          adProgress: res.adProgress,
          extraSpins: res.extraSpins,
          totalAvailableSpins: res.totalAvailableSpins
        }));
        if (res.spinUnlocked) {
          setAdUnlockToast(
            lang === 'bn'
              ? '🎉 অভিনন্দন! ৩টি অ্যাড দেখা পূর্ণ হয়েছে — আপনি +১টি ফ্রি স্পিন পেয়েছেন!'
              : '🎉 3 Ads Completed! You unlocked +1 Free Spin!'
          );
          setTimeout(() => setAdUnlockToast(''), 5000);
          if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
          }
        } else {
          setAdUnlockToast(
            lang === 'bn'
              ? `✅ অ্যাড দেখা সম্পন্ন (${res.adProgress}/3)! আর ${3 - res.adProgress}টি অ্যাড দেখলেই ১টি ফ্রি স্পিন পাবেন।`
              : `✅ Ad watched (${res.adProgress}/3)! Watch ${3 - res.adProgress} more to unlock 1 Free Spin.`
          );
          setTimeout(() => setAdUnlockToast(''), 4000);
        }
      }
    } catch (err) {
      setSpinError(err.message || 'Ad verification error');
    } finally {
      setIsWatchingAd(false);
    }
  };

  // Trigger Real Ad SDK (Monetag / Adsgram) or 10-second Interactive Ad Modal
  const handleWatchAdClick = async () => {
    if (isWatchingAd || isSpinning) return;
    setSpinError('');
    setIsWatchingAd(true);

    const zoneId = String(spinStatus.monetagZoneId || '').trim();
    const monetagFn = zoneId ? window[`show_${zoneId}`] : null;

    // 1. Try Monetag Rewarded Interstitial if available
    if (typeof monetagFn === 'function') {
      try {
        await monetagFn();
        await completeOneAdWatch();
        return;
      } catch (e) {
        console.warn('Monetag ad fallback:', e);
      }
    }

    // 2. Try Adsgram if available
    if (spinStatus.adsgramBlockId && window.Adsgram) {
      try {
        const AdController = window.Adsgram.init({ blockId: String(spinStatus.adsgramBlockId).trim() });
        await AdController.show();
        await completeOneAdWatch();
        return;
      } catch (e) {
        console.warn('Adsgram ad fallback:', e);
      }
    }

    // 3. Built-in 10-Second Interactive Sponsored Ad Modal (so it works immediately out of the box)
    setShowFallbackAdModal(true);
    setFallbackAdTimer(10);
  };

  useEffect(() => {
    if (!showFallbackAdModal) return;
    if (fallbackAdTimer <= 0) return;
    const t = setTimeout(() => {
      setFallbackAdTimer(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearTimeout(t);
  }, [showFallbackAdModal, fallbackAdTimer]);

  const handleClaimFallbackAd = async () => {
    if (fallbackAdTimer > 0) return;
    setShowFallbackAdModal(false);
    await completeOneAdWatch();
  };

  const milestonePct = Math.min(
    100,
    (((spinStatus.totalGlobalSpins || 0) % (spinStatus.milestoneTarget || 50000)) /
      (spinStatus.milestoneTarget || 50000)) *
      100
  );

  return (
    <div className="space-y-3.5 animate-in fade-in slide-in-from-right-4 duration-300 pb-12 max-w-md mx-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-xs border border-amber-200 active:scale-95 transition-transform text-amber-700 cursor-pointer"
          >
            <ArrowLeft size={18} strokeWidth={2.5} />
          </button>
          <div>
            <h2 className="text-[15px] font-black text-slate-900 leading-tight flex items-center gap-1.5">
              <span>{lang === 'bn' ? '৩০ দিনের স্টার ও টেডি গিভওয়ে' : '30-Day Star & Teddy Giveaway'}</span>
            </h2>
            <p className="text-[10.5px] text-amber-600 font-bold leading-none mt-0.5">
              {lang === 'bn' ? 'স্পিন করুন এবং জিতে নিন Teddy Gift ও নগদ টাকা!' : 'Spin daily to win Teddy Star Gift & Instant BDT!'}
            </p>
          </div>
        </div>

        {/* Available Spins Pill */}
        <div className="px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-white text-[11px] font-black shadow-sm flex items-center gap-1.5 shrink-0">
          <Sparkles size={13} />
          <span>
            {lang === 'bn' ? `স্পিন: ${spinStatus.totalAvailableSpins || 0}টি` : `${spinStatus.totalAvailableSpins || 0} Spins`}
          </span>
        </div>
      </div>

      {/* 1. 30-DAY COUNTDOWN & 50,000 MILESTONE HERO CARD */}
      <CutCornerCard
        className={`p-3.5 border ${
          darkMode
            ? 'bg-slate-900 border-amber-500/35'
            : 'bg-gradient-to-br from-amber-50/90 via-white to-rose-50/80 border-amber-200/80'
        }`}
        flower={<ReferralRosePattern />}
      >
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-100/90 border border-amber-200 flex items-center justify-center shrink-0">
              <TelegramAnimatedSticker src="tg-teddy-sticker.json" size={28} />
            </div>
            <div>
              <span className="inline-block px-2 py-0.5 rounded-full bg-rose-600 text-white text-[8.5px] font-black uppercase tracking-wider">
                30 DAYS MEGA EVENT
              </span>
              <h3 className="text-[13px] font-black text-slate-900 leading-tight mt-0.5">
                {lang === 'bn' ? 'ইভেন্ট শেষ হতে বাকি:' : 'Event Ends In:'}
              </h3>
            </div>
          </div>

          {/* 4-Box Live Countdown */}
          <div className="flex items-center gap-1">
            {[
              { val: eventCountdown.days, lbl: lang === 'bn' ? 'দিন' : 'D' },
              { val: eventCountdown.hours, lbl: lang === 'bn' ? 'ঘণ্টা' : 'H' },
              { val: eventCountdown.mins, lbl: lang === 'bn' ? 'মিনিট' : 'M' },
              { val: eventCountdown.secs, lbl: lang === 'bn' ? 'সে.' : 'S' }
            ].map((item, i) => (
              <div
                key={i}
                className="min-w-[36px] px-1.5 py-1 rounded-lg bg-slate-900 text-white text-center border border-amber-400/40 shadow-xs"
              >
                <span className="text-[12px] font-black text-amber-300 block leading-none font-mono">
                  {item.val}
                </span>
                <span className="text-[8px] font-bold text-slate-300 block mt-0.5">{item.lbl}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 50,000 Global Spin Mega Milestone Progress */}
        <div className="bg-white/90 rounded-xl p-2.5 border border-amber-200/70 space-y-1.5">
          <div className="flex items-center justify-between text-[10.5px]">
            <span className="font-black text-slate-800 flex items-center gap-1">
              <span>🌍 {lang === 'bn' ? '৫০,০০০ স্পিন মেগা গিফট কাউন্টার' : '50,000 Spin Mega Gift Counter'}</span>
            </span>
            <span className="font-mono font-black text-rose-600">
              {(spinStatus.totalGlobalSpins || 0).toLocaleString()} / {(spinStatus.milestoneTarget || 50000).toLocaleString()}
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/70">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(4, milestonePct)}%` }}
            />
          </div>
          <p className="text-[9.5px] text-slate-500 font-semibold leading-snug">
            {lang === 'bn'
              ? '✨ সব ইউজার মিলে ৫০,০০০ স্পিন পূর্ণ করলেই পরবর্তী স্পিনকারী পাবেন স্পেশাল অ্যানিমেশনের সাথে নিশ্চিত 🧸 Teddy Gift অথবা ৳১০–৳৫০০ মেগা পুরস্কার!'
              : '✨ Once all users complete 50,000 spins, the next spinner unlocks the guaranteed 🧸 Teddy Gift or ৳10–৳500 Mega Prize!'}
          </p>
        </div>
      </CutCornerCard>

      {/* 2. LUXURY 3x3 9-CARD ANIMATED STICKER SPIN BOARD */}
      <CutCornerCard
        className={`p-3.5 border ${
          darkMode
            ? 'bg-slate-900 border-indigo-500/40'
            : 'bg-gradient-to-b from-indigo-50/60 via-white to-rose-50/50 border-indigo-200/80'
        }`}
        flower={<SellCryptoMandalaPattern />}
      >
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <TelegramAnimatedSticker src="tg-star-sticker.json" size={20} />
            <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider">
              {lang === 'bn' ? 'লাকি ৯-কার্ড রয়েল স্পিন বোর্ড' : 'Lucky 9-Card Royal Spin Board'}
            </span>
          </div>
          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200/60">
            {lang === 'bn' ? 'মোট জিতেছেন: ৳' : 'Won: ৳'}
            {spinStatus.totalWonBdt || 0} TK
          </span>
        </div>

        {/* 3x3 Grid of 9 Cards with Animated Stickers */}
        <div className="grid grid-cols-3 gap-2.5 mb-3">
          {SPIN_BOARD_CARDS.map((card) => {
            const isHighlighted = highlightedCardIndex === card.index;
            return (
              <div
                key={card.id}
                className={`relative rounded-2xl p-2.5 flex flex-col items-center justify-center text-center transition-all duration-150 select-none overflow-hidden border-2 ${
                  isHighlighted
                    ? 'tp-spin-card-active border-amber-400 bg-gradient-to-b from-amber-50 via-white to-rose-50 shadow-[0_0_20px_rgba(245,158,11,0.55)] scale-[1.04] z-10'
                    : card.isCenter
                    ? 'tp-spin-card-center border-rose-300/90 bg-gradient-to-b from-rose-50/80 to-amber-50/60 shadow-xs'
                    : 'tp-spin-card-idle border-slate-200/90 bg-white/95 hover:border-indigo-200 shadow-2xs'
                }`}
              >
                {/* Top Micro Badge */}
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[7.5px] font-black tracking-wider uppercase mb-1 ${
                    isHighlighted
                      ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white'
                      : card.isCenter
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {card.badge}
                </span>

                {/* Animated Telegram Sticker */}
                <div className="my-0.5 flex items-center justify-center h-9">
                  <TelegramAnimatedSticker src={card.sticker} size={card.isCenter ? 36 : 32} />
                </div>

                {/* Prize Amount / Name */}
                <span className="font-black text-[12.5px] text-slate-900 leading-tight mt-0.5 block">
                  {card.title}
                </span>
                <span className="text-[8.5px] font-bold text-slate-500 leading-none mt-0.5 block truncate max-w-full">
                  {lang === 'bn' ? card.subtitleBn : card.subtitleEn}
                </span>
              </div>
            );
          })}
        </div>

        {/* Error / Status Toast */}
        {spinError && (
          <div className="mb-2.5 p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold text-center">
            {spinError}
          </div>
        )}
        {adUnlockToast && (
          <div className="mb-2.5 p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold text-center animate-in fade-in">
            {adUnlockToast}
          </div>
        )}

        {/* Main Spin Action Button */}
        <button
          type="button"
          onClick={handleStartSpin}
          disabled={isSpinning}
          className={`w-full py-3.5 px-4 rounded-xl font-black text-[14px] text-white shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] ${
            isSpinning
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 opacity-90 cursor-wait'
              : (spinStatus.totalAvailableSpins || 0) > 0
              ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 hover:brightness-105 shadow-rose-500/25'
              : 'bg-slate-700 hover:bg-slate-800'
          }`}
        >
          {isSpinning ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>{lang === 'bn' ? 'স্পিন ঘুরছে... ভাগ্য যাচাই চলছে!' : 'Spinning... Good Luck!'}</span>
            </>
          ) : (spinStatus.totalAvailableSpins || 0) > 0 ? (
            <>
              <Sparkles size={18} />
              <span>
                {lang === 'bn'
                  ? `🎰 এখনই স্পিন করুন (${spinStatus.totalAvailableSpins}টি ফ্রি স্পিন বাকি)`
                  : `🎰 SPIN NOW (${spinStatus.totalAvailableSpins} Left)`}
              </span>
            </>
          ) : (
            <>
              <Clock size={17} />
              <span>
                {dailyCooldownStr
                  ? lang === 'bn'
                    ? `পরবর্তী ডেইলি স্পিন: ${dailyCooldownStr} (অ্যাড/রেফারে ফ্রি স্পিন নিন)`
                    : `Next Daily Spin: ${dailyCooldownStr}`
                  : lang === 'bn'
                  ? 'স্পিন শেষ — নিচে অ্যাড দেখে বা রেফার করে স্পিন নিন'
                  : 'Watch Ads or Refer below for Free Spins'}
              </span>
            </>
          )}
        </button>
      </CutCornerCard>

      {/* 3. WATCH 3 ADS = 1 FREE SPIN CARD */}
      <CutCornerCard
        className={`p-3.5 border space-y-2.5 ${
          darkMode
            ? 'bg-slate-900 border-emerald-500/35'
            : 'bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/60 border-emerald-200/80'
        }`}
        flower={<AddMoneyFloraPattern />}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100/90 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
              <PlayCircle size={20} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-[13px] font-black text-slate-900 leading-tight">
                  {lang === 'bn' ? '৩টি অ্যাড দেখুন = ১টি ফ্রি স্পিন' : 'Watch 3 Ads = +1 Free Spin'}
                </h3>
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-600 text-white text-[8.5px] font-black">
                  {spinStatus.adProgress || 0}/3 ADS
                </span>
              </div>
              <p className="text-[10.5px] text-slate-500 font-semibold mt-0.5">
                {lang === 'bn'
                  ? 'প্রতি ৩টি ছোট বিজ্ঞাপন দেখলে সাথে সাথে ১টি ফ্রি স্পিন যুক্ত হবে!'
                  : 'Watch 3 short sponsored ads to unlock 1 extra free spin instantly!'}
              </p>
            </div>
          </div>
        </div>

        {/* 3-Step Visual Ad Progress */}
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((stepNum) => {
            const done = (spinStatus.adProgress || 0) >= stepNum;
            return (
              <div
                key={stepNum}
                className={`p-2 rounded-xl border text-center flex items-center justify-center gap-1.5 text-[10.5px] font-black transition-all ${
                  done
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                {done ? <CheckCircle2 size={13} className="text-emerald-600" /> : <PlayCircle size={13} />}
                <span>{lang === 'bn' ? `অ্যাড ${stepNum}` : `Ad #${stepNum}`}</span>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleWatchAdClick}
          disabled={isWatchingAd || isSpinning}
          className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[12.5px] shadow-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60"
        >
          {isWatchingAd ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              <span>{lang === 'bn' ? 'অ্যাড লোড হচ্ছে...' : 'Loading Ad...'}</span>
            </>
          ) : (
            <>
              <PlayCircle size={16} />
              <span>
                {lang === 'bn'
                  ? `▶️ অ্যাড দেখুন (${spinStatus.adProgress || 0}/3) — ফ্রি স্পিন নিন`
                  : `▶️ Watch Ad (${spinStatus.adProgress || 0}/3) for Free Spin`}
              </span>
            </>
          )}
        </button>
      </CutCornerCard>

      {/* 4. REFER & GET 1 FREE SPIN PER REFERRAL (EVEN IF UNACTIVATED) */}
      <CutCornerCard
        className={`p-3.5 border space-y-2.5 ${
          darkMode
            ? 'bg-slate-900 border-rose-500/35'
            : 'bg-gradient-to-br from-rose-50/85 via-white to-pink-50/75 border-rose-200/80'
        }`}
        flower={<ReferralRosePattern />}
      >
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-rose-100/90 border border-rose-200 flex items-center justify-center shrink-0">
              <TelegramAnimatedSticker src="tg-rose-sticker.json" size={30} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-[13px] font-black text-slate-900 leading-tight">
                  {lang === 'bn' ? '১টি রেফার = ১টি ফ্রি স্পিন + ৳৫ বোনাস' : '1 Referral = +1 Free Spin + ৳5'}
                </h3>
              </div>
              <p className="text-[10.5px] text-slate-600 font-semibold mt-0.5 leading-snug">
                {lang === 'bn'
                  ? 'আপনার রেফার লিংকে ক্লিক করে নতুন কেউ বটে ঢুকলেই সাথে সাথে ১টি ফ্রি স্পিন পাবেন (রেফার অ্যাক্টিভ না হলেও স্পিন পাবেন)!'
                  : 'Get +1 Free Spin immediately whenever a new friend joins via your referral link (even before referral activation)!'}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onGoToReferral}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-black text-[12px] shadow-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
        >
          <Share2 size={15} />
          <span>{lang === 'bn' ? 'বন্ধুদের রেফার করে ফ্রি স্পিন নিন' : 'Refer Friends to Get Free Spins'}</span>
        </button>
      </CutCornerCard>

      {/* BUILT-IN 10-SECOND SPONSORED AD MODAL (WHEN SDK NOT CONFIGURED OR NO FILL) */}
      {showFallbackAdModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-[340px] bg-slate-900 border border-indigo-500/40 rounded-2xl p-5 text-center space-y-4 shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[9.5px] font-black uppercase">
                Sponsored Ad • { (spinStatus.adProgress || 0) + 1 }/3
              </span>
              <span className="text-[11px] font-mono font-black text-emerald-400">
                {fallbackAdTimer > 0 ? `⏳ ${fallbackAdTimer}s` : '✓ Ready'}
              </span>
            </div>

            <div className="py-3 flex flex-col items-center space-y-2">
              <TelegramAnimatedSticker src="tg-gem-sticker.json" size={56} />
              <h3 className="text-[15px] font-black text-white">
                Trust Pay — Instant Crypto Exchange BD
              </h3>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {lang === 'bn'
                  ? 'মাত্র ২০ টাকা থেকে TON, GRAM ও USDT কেনাবেচা করুন এবং বিকাশ ও নগদে ইনস্ট্যান্ট পেমেন্ট নিন! প্রতি অ্যাক্টিভ রেফারে ৳৫ বোনাস!'
                  : 'Buy & Sell TON, GRAM & USDT starting from ৳20 with instant bKash & Nagad payout!'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleClaimFallbackAd}
              disabled={fallbackAdTimer > 0}
              className={`w-full py-2.5 rounded-xl font-black text-[12.5px] transition-all cursor-pointer ${
                fallbackAdTimer > 0
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg'
              }`}
            >
              {fallbackAdTimer > 0
                ? lang === 'bn'
                  ? `অ্যাড চলছে... ${fallbackAdTimer} সেকেন্ড অপেক্ষা করুন`
                  : `Please wait ${fallbackAdTimer}s...`
                : lang === 'bn'
                ? '✅ রিওয়ার্ড ক্লেইম করুন (Continue)'
                : '✅ Claim Ad Progress'}
            </button>
          </div>
        </div>
      )}

      {/* SPIN PRIZE RESULT CELEBRATION MODAL */}
      {spinResultModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-[330px] bg-white rounded-3xl p-6 text-center space-y-3.5 shadow-2xl border-2 border-amber-300 animate-in zoom-in-95">
            <div className="flex justify-center">
              <TelegramAnimatedSticker
                src={
                  spinResultModal.card.id === 'again'
                    ? 'tg-target-sticker.json'
                    : spinResultModal.card.id === 'teddy'
                    ? 'tg-teddy-sticker.json'
                    : 'tg-party-sticker.json'
                }
                size={72}
              />
            </div>

            {spinResultModal.isMilestoneWinner && (
              <span className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-rose-600 text-white text-[10px] font-black uppercase tracking-wider">
                🏆 50,000+ SPIN MEGA MILESTONE WINNER!
              </span>
            )}

            <h3 className="text-xl font-black text-slate-900">
              {spinResultModal.card.id === 'again'
                ? spinResultModal.bonusFreeRespin
                  ? lang === 'bn'
                    ? '🎁 ফ্রি আরেকটি স্পিন পেয়েছেন!'
                    : '🎁 Bonus Free Re-Spin!'
                  : lang === 'bn'
                  ? 'আবার চেষ্টা করুন! (Try Later)'
                  : 'Try Again Next Time!'
                : lang === 'bn'
                ? `🎉 অভিনন্দন! আপনি জিতেছেন ${spinResultModal.card.title}!`
                : `🎉 Congratulations! You won ${spinResultModal.card.title}!`}
            </h3>

            <p className="text-[11.5px] text-slate-600 font-medium leading-relaxed">
              {spinResultModal.bdtWon > 0
                ? lang === 'bn'
                  ? `৳${spinResultModal.bdtWon} টাকা সাথে সাথে আপনার মূল ব্যালেন্সে যোগ করে দেওয়া হয়েছে!`
                  : `৳${spinResultModal.bdtWon} BDT has been instantly credited to your main balance!`
                : spinResultModal.card.id === 'teddy'
                ? lang === 'bn'
                  ? 'আপনি স্পেশাল টেলিগ্রাম Teddy Star Gift জিতেছেন! অ্যাডমিন টিম আপনার আইডিতে গিফট পাঠিয়ে দিবে।'
                  : 'You won the Telegram Teddy Star Gift! Our admin team has been notified.'
                : spinResultModal.bonusFreeRespin
                ? lang === 'bn'
                  ? 'আপনার জন্য সাথে সাথে আরও ১টি ফ্রি স্পিন যুক্ত করা হয়েছে! আবার স্পিন করুন।'
                  : 'You got +1 Bonus Free Spin! Spin again right now.'
                : lang === 'bn'
                ? 'মন খারাপ করবেন না! নিচে ৩টি অ্যাড দেখে অথবা বন্ধুদের রেফার করে আবার ফ্রি স্পিন করুন।'
                : 'Watch 3 ads below or refer a friend to get another free spin right now!'}
            </p>

            <button
              type="button"
              onClick={() => setSpinResultModal(null)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-[13px] shadow-md active:scale-95 transition-all cursor-pointer"
            >
              {lang === 'bn' ? 'ঠিক আছে (OK)' : 'Awesome!'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


function WithdrawFiatPage({ user, balance, lang = 'bn', t, fiatWallet, setFiatWallet, fiatWithdrawPending, antiAbuseData = {}, setIsModalOpen, onBack, reloadData }) {
    const [amount, setAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [timeLeft, setTimeLeft] = useState('');
    const [showEditWalletModal, setShowEditWalletModal] = useState(false);
    const [showFlowerModal, setShowFlowerModal] = useState(false);
    const [withdrawDetails, setWithdrawDetails] = useState(null);
    const [editMethod, setEditMethod] = useState('bKash');
    const [editNumber, setEditNumber] = useState('');
    const [editName, setEditName] = useState('');
    const [isSavingWallet, setIsSavingWallet] = useState(false);

    const isDepositUser = Boolean(antiAbuseData?.hasDepositWithoutTrade);
    const spentSinceLastDeposit = parseFloat(antiAbuseData?.spentSinceLastDeposit) || 0;
    const minAmount = isDepositUser ? 30 : 20;

    useEffect(() => {
        if (setIsModalOpen) {
            setIsModalOpen(showEditWalletModal || showFlowerModal);
        }
    }, [showEditWalletModal, showFlowerModal, setIsModalOpen]);

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
        if (!amount || isNaN(amt) || amt <= 0) {
            const msg = lang === 'bn' ? "সঠিক পরিমাণ লিখুন" : "Invalid amount";
            return window.Telegram?.WebApp?.showAlert ? window.Telegram.WebApp.showAlert(msg) : alert(msg);
        }

        // Anti-Abuse: Deposit users must spend at least 20 TK on crypto before withdrawing
        if (isDepositUser && spentSinceLastDeposit < 20) {
            const remaining = (20 - spentSinceLastDeposit).toFixed(0);
            const msg = lang === 'bn' 
                ? `অ্যাড মানি করার পর সাথে সাথে ক্যাশআউট করা যাবে না। নূন্যতম ২০ টাকার ক্রিপ্টো ক্রয়/ট্রেড করতে হবে (বাকি আছে ৳${remaining} টাকা)।` 
                : `After adding money, you must purchase at least 20 BDT crypto before withdrawing (Remaining: ৳${remaining} BDT).`;
            return window.Telegram?.WebApp?.showAlert ? window.Telegram.WebApp.showAlert(msg) : alert(msg);
        }

        if (amt < minAmount) {
            const msg = isDepositUser
                ? (lang === 'bn' ? "অ্যাড মানি ব্যবহারকারীদের জন্য নূন্যতম উইথড্র ৩০ টাকা" : "Minimum withdraw amount is 30 BDT for deposited funds")
                : (lang === 'bn' ? "নূন্যতম উত্তোলন ২০ টাকা" : "Minimum withdraw amount is 20 BDT");
            return window.Telegram?.WebApp?.showAlert ? window.Telegram.WebApp.showAlert(msg) : alert(msg);
        }

        if (amt > balance) {
            const msg = lang === 'bn' ? "অপর্যাপ্ত ব্যালেন্স" : "Insufficient balance";
            return window.Telegram?.WebApp?.showAlert ? window.Telegram.WebApp.showAlert(msg) : alert(msg);
        }

        const fee = calculateSendMoneyFee(amt);
        const receiveAmount = amt - fee;
        if (receiveAmount <= 0) {
            const msg = lang === 'bn' ? "সেন্ড মানি ফি বাদ দিলে প্রাপ্য টাকার পরিমাণ শূন্য বা কম হয়" : "Amount after fee must be greater than zero";
            return window.Telegram?.WebApp?.showAlert ? window.Telegram.WebApp.showAlert(msg) : alert(msg);
        }

        setIsSubmitting(true);
        try {
            await withdrawFiat({
                userId: user?.id || 123456789,
                amount: amt,
                fee: fee,
                receiveAmount: receiveAmount
            });
            setWithdrawDetails({
                amount: amt,
                fee: fee,
                receiveAmount: receiveAmount,
                method: fiatWallet?.method || 'bKash',
                number: fiatWallet?.number || ''
            });
            setShowFlowerModal(true);
            setAmount('');
            reloadData();
        } catch (e) {
            if (window.Telegram?.WebApp?.showAlert) window.Telegram.WebApp.showAlert(e.message || "Withdrawal failed");
            else alert(e.message || "Withdrawal failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getLogo = () => {
        return getPaymentLogo(fiatWallet?.method);
    };

    const currentFee = amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 ? calculateSendMoneyFee(parseFloat(amount)) : 0;
    const currentReceive = amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 ? Math.max(0, parseFloat(amount) - currentFee) : 0;

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

            {/* Anti-Abuse Notification Banner for Deposit Users */}
            {isDepositUser && spentSinceLastDeposit < 20 && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5 shadow-xs">
                    <span className="text-base leading-none">⚠️</span>
                    <div className="space-y-0.5">
                        <p className="font-bold">{lang === 'bn' ? 'উইথড্র নিরাপত্তা নীতি (Policy)' : 'Withdrawal Policy'}</p>
                        <p className="opacity-90 leading-relaxed">
                            {lang === 'bn' 
                                ? `অ্যাড মানি করার পর উইথড্র চালু করতে নূন্যতম ২০ টাকার ক্রিপ্টো ক্রয় সম্পন্ন করুন। খরচ বাকি: ৳${Math.max(0, 20 - spentSinceLastDeposit)} টাকা।` 
                                : `Please purchase at least 20 BDT crypto to unlock withdrawals. Remaining: ৳${Math.max(0, 20 - spentSinceLastDeposit)} BDT.`}
                        </p>
                    </div>
                </div>
            )}

            {/* Amount Input Card */}
            <CutCornerCard className="p-3.5 space-y-2.5" flower={<WithdrawLilyPattern />}>
                <label className="flex justify-between items-center mb-2">
                    <span className="text-[11px] font-extrabold text-[var(--color-text-secondary)] uppercase tracking-[0.15em]">
                        {lang === 'bn' ? `উত্তোলনের পরিমাণ (${isDepositUser ? 'মিনিমাম ৩০' : 'মিনিমাম ২০'} BDT)` : `Amount (Min ${minAmount} BDT)`}
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
                        placeholder={isDepositUser ? "Min 30.00" : "Min 20.00"} 
                        className="w-full h-[50px] bg-gray-50 border border-gray-100 rounded-xl pl-8 pr-16 font-black text-xl text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)] focus:bg-white focus:ring-2 focus:ring-[var(--color-brand)]/10 transition-all placeholder:text-gray-300"
                    />
                    <button onClick={handleMax} className="absolute right-2.5 px-2.5 py-1 bg-[var(--color-brand)]/10 text-[var(--color-brand)] font-bold text-[11px] rounded-lg active:scale-95 transition-transform">MAX</button>
                </div>
            </CutCornerCard>

            {/* Live Fee Breakdown */}
            {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && (
                <CutCornerCard className="p-3 space-y-1.5 text-[12px]" flower={<WithdrawLilyPattern />}>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-600 font-medium">{lang === 'bn' ? 'উত্তোলনের পরিমাণ' : 'Withdraw Amount'}</span>
                        <span className="font-bold text-slate-900">৳ {parseFloat(amount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-red-500 font-medium">{lang === 'bn' ? 'সেন্ড মানি ফি' : 'Send Money Fee'}</span>
                        <span className="font-bold text-red-500">- ৳ {currentFee.toFixed(2)}</span>
                    </div>
                    <div className="h-px bg-slate-200 my-1 w-full" />
                    <div className="flex justify-between items-center text-[12px]">
                        <span className="text-emerald-700 font-bold">{t?.youReceive || (lang === 'bn' ? 'আপনি পাবেন' : 'You will receive')}</span>
                        <span className="font-black text-emerald-700 text-[13px]">৳ {currentReceive.toFixed(2)}</span>
                    </div>
                </CutCornerCard>
            )}

            {/* Saved Wallet Info with Edit Icon Aligned Right and Floral Underneath */}
            <CutCornerCard className="p-3.5" flower={<WithdrawLilyPattern />}>
                <div className="flex items-center justify-between gap-3 w-full">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-xl tp-payment-logo-box bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-xs">
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
                        className="px-3 py-1.5 bg-indigo-50/90 text-indigo-700 hover:bg-indigo-100/90 rounded-xl transition-all active:scale-95 flex items-center gap-1.5 text-xs font-bold border border-indigo-100 shrink-0 shadow-xs"
                        title="Edit Wallet"
                    >
                        <Edit3 size={14} />
                        <span>{lang === 'bn' ? 'এডিট' : 'Edit'}</span>
                    </button>
                </div>
            </CutCornerCard>

            {/* Warning Note */}
            <div className="bg-blue-50/60 border border-blue-100/70 p-3 rounded-xl flex items-center gap-2.5">
                <Info size={16} className="text-blue-500 shrink-0" />
                <p className="text-[11px] text-blue-700 font-medium leading-tight">
                    {lang === 'bn' 
                        ? 'নূন্যতম উত্তোলন: ক্রিপ্টো বিক্রয় ২০ টাকা | অ্যাড মানি ৩০ টাকা। অ্যাড মানি করার পর ২০ টাকার ক্রিপ্টো ক্রয় করতে হবে।' 
                        : 'Min Withdraw: Crypto Sell 20 BDT | Deposit 30 BDT. Must trade 20 BDT crypto after deposit.'}
                </p>
            </div>

            {/* Submit Button */}
            <div className="mt-2">
                <CutCornerButton 
                    onClick={handleSubmit} 
                    disabled={!amount || isSubmitting} 
                    isSubmitting={isSubmitting}
                    icon={Wallet}
                >
                    {t?.withdrawFunds || (lang === 'bn' ? 'টাকা উত্তোলন করুন' : 'WITHDRAW FUNDS')}
                </CutCornerButton>
            </div>

            {/* Blooming Flower Withdrawal Success Modal */}
            <WithdrawFlowerModal 
                isOpen={showFlowerModal}
                onClose={() => setShowFlowerModal(false)}
                details={withdrawDetails}
                lang={lang}
            />

            {/* Edit Wallet Modal */}
            {showEditWalletModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div 
                        className="relative bg-white w-full max-w-[320px] p-6 shadow-2xl border border-indigo-100/60 animate-in zoom-in-95"
                        style={{
                            clipPath: 'polygon(16px 0, calc(100% - 16px) 0, 100% 16px, 100% calc(100% - 16px), calc(100% - 16px) 100%, 16px 100%, 0 calc(100% - 16px), 0 16px)',
                        }}
                    >
                        <FloralWatermark />
                        <div className="flex justify-between items-center mb-5 relative z-10">
                            <h3 className="text-xl font-extrabold text-slate-900">
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
                                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm' 
                                                    : 'border-gray-200 bg-gray-50 text-gray-600'
                                            }`}
                                        >
                                            <div className="w-7 h-7 rounded-lg tp-payment-logo-box bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-2xs">
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

                        <div className="mt-6">
                            <CutCornerButton 
                                onClick={handleSaveEditedWallet} 
                                disabled={!editNumber || !editName || isSavingWallet} 
                                isSubmitting={isSavingWallet}
                                icon={Save}
                            >
                                {lang === 'bn' ? 'আপডেট করুন' : 'UPDATE WALLET'}
                            </CutCornerButton>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}