import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Home, Clipboard, Camera, User, Users, Shield, ShieldCheck, Award, ArrowLeft, ArrowDown, ArrowUp, ArrowRight, ChevronLeft, ChevronRight, Zap, Share2, Copy, X, ArrowRightLeft, Wallet, Gift, ArrowUpRight, ArrowDownLeft, MinusCircle, TrendingUp, Sparkles, Info, CircleDollarSign, Gem, Coins, Delete, ChevronDown, Clock, Save, CheckCircle2 , Volume2, VolumeX, Check, Settings , ClipboardPaste, Loader2, PlusCircle, AlertCircle, RefreshCw, Headphones, Send, Edit3, ExternalLink, LogOut, PlayCircle, Moon, Sun, Bell, Eye, EyeOff, Search, QrCode, HelpCircle, FileText } from 'lucide-react';
import { TonConnectUIProvider, TonConnectButton, useTonAddress, useTonConnectUI, THEME } from '@tonconnect/ui-react';
import WebApp from '@twa-dev/sdk';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchUserData, syncUserProfile, submitFreeTonTask, saveFiatWallet, withdrawFiat, submitSellOrder, buildTransaction, submitBuyOrder, submitAddMoney, submitBuyCrypto, submitSupportMessage, fetchMarketRates, checkCommunityMembership, verifyCommunityMembership, fetchReferralData, prepareReferralShare, fetchSpinStatus, executeSpin, watchSpinAd, fetchUserDepositAddress, checkEvmDeposit, fetchUserHistory } from './api';
import lottie from 'lottie-web/build/player/lottie_light';
import brandLogo from './assets/trustpaylogo.png';
import referralBannerImg from './assets/referral-banner.jpg';
import lotusLineArt from './assets/lotus-line-art.webp';
import roseBranchArt from './assets/rose-branch-art.webp';
import addmoneyRoseArt from './assets/addmoney-rose-art.webp';
import sakuraBranchArt from './assets/sakura-branch-art.webp';
import mapleBranchArt from './assets/maple-branch-art.webp';
import wisteriaCascadeArt from './assets/wisteria-cascade-art.webp';
import roseBotanicalArt from './assets/rose-botanical-art.webp';

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
          animationData: data
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
const AddMoneyFloraPattern = ({ className = "opacity-[0.06] tp-card-flower-indigo" }) => (
  <svg 
    className={`absolute pointer-events-none select-none right-[-10px] bottom-[-10px] text-indigo-900 ${className}`} 
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

// Scaled delicate rose branch art for Profile & Spin cards
const CardRoseBranch = ({ className = "" }) => (
  <div 
    className={`absolute pointer-events-none select-none -right-1 -bottom-2 w-[115px] h-[105px] overflow-hidden ${className}`}
  >
    <img 
      src={roseBranchArt} 
      alt="" 
      aria-hidden="true" 
      draggable={false} 
      className="w-full h-full object-contain opacity-[0.80] dark:opacity-[0.65] filter drop-shadow-sm transform rotate-[-6deg] scale-110"
    />
  </div>
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
                ? 'radial-gradient(circle, rgba(124,58,237,0.45) 0%, transparent 70%)'
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
        {/* Soft lavender/indigo ambient aura glow */}
        <div
          className="absolute -top-16 -right-16 w-[340px] h-[360px] pointer-events-none"
          style={{
            background: darkMode
              ? 'radial-gradient(closest-side, rgba(99,102,241,0.2), transparent)'
              : 'radial-gradient(closest-side, rgba(238,242,255,0.85), rgba(224,231,255,0.3) 60%, transparent)'
          }}
        />
        {/* Delicate Botanical Rose Art at bottom-left */}
        <div
          className="absolute -left-6 bottom-16 w-[230px] pointer-events-none select-none overflow-hidden"
          style={{
            WebkitMaskImage: 'linear-gradient(to top, black 80%, transparent 100%)',
            maskImage: 'linear-gradient(to top, black 80%, transparent 100%)'
          }}
        >
          <img
            src={roseBotanicalArt}
            alt=""
            aria-hidden="true"
            draggable={false}
            className={`w-full h-auto ${darkMode ? 'opacity-[0.35] brightness-125' : 'opacity-[0.78]'}`}
          />
        </div>
      </>
    )}
    {page === 'add-money' && (
      <>
        {/* Soft lavender/purple ambient aura glow */}
        <div
          className="absolute -top-12 -right-12 w-[320px] h-[340px] pointer-events-none"
          style={{
            background: darkMode
              ? 'radial-gradient(closest-side, rgba(168,85,247,0.18), transparent)'
              : 'radial-gradient(closest-side, rgba(233,213,255,0.7), rgba(243,232,255,0.25) 60%, transparent)'
          }}
        />

        {/* Delicate Botanical Rose Art at bottom-left — prominent and visible */}
        <div
          className="absolute -left-6 bottom-16 w-[240px] pointer-events-none select-none overflow-hidden"
          style={{
            WebkitMaskImage: 'linear-gradient(to top, black 80%, transparent 100%)',
            maskImage: 'linear-gradient(to top, black 80%, transparent 100%)'
          }}
        >
          <img
            src={roseBotanicalArt}
            alt=""
            aria-hidden="true"
            draggable={false}
            className={`w-full h-auto ${darkMode ? 'opacity-[0.38] brightness-125' : 'opacity-[0.78]'}`}
          />
        </div>
      </>
    )}
    {(page === 'buy' || page === 'sell') && (
      <>
        {/* Soft lavender aura glow behind botanical branch */}
        <div
          className="absolute -top-12 -right-12 w-[320px] h-[340px] pointer-events-none"
          style={{
            background: darkMode
              ? 'radial-gradient(closest-side, rgba(168,85,247,0.18), transparent)'
              : 'radial-gradient(closest-side, rgba(233,213,255,0.6), rgba(243,232,255,0.2) 60%, transparent)'
          }}
        />

        {/* Soft botanical artwork shifted upward to avoid clashing with address box */}
        <div
          className="absolute -right-4 -top-8 w-[190px] pointer-events-none select-none overflow-hidden"
          style={{
            WebkitMaskImage: 'linear-gradient(to bottom, black 65%, transparent 100%)',
            maskImage: 'linear-gradient(to bottom, black 65%, transparent 100%)'
          }}
        >
          <img
            src={page === 'buy' ? sakuraBranchArt : wisteriaCascadeArt}
            alt=""
            aria-hidden="true"
            draggable={false}
            className={`w-full h-auto ${darkMode ? 'opacity-[0.32] brightness-125' : 'opacity-[0.65]'}`}
          />
        </div>
      </>
    )}
    {page === 'profile' && (
      <>
        {/* Soft lavender glow aura */}
        <div
          className="absolute -top-12 -right-12 w-[300px] h-[340px] pointer-events-none"
          style={{
            background: darkMode
              ? 'radial-gradient(closest-side, rgba(168,85,247,0.18), transparent)'
              : 'radial-gradient(closest-side, rgba(233,213,255,0.7), rgba(243,232,255,0.25) 60%, transparent)'
          }}
        />

        {/* Delicate Lavender Rose Branch Art */}
        <div
          className="absolute -right-3 top-2 w-[210px] pointer-events-none select-none overflow-hidden"
          style={{
            WebkitMaskImage: 'linear-gradient(to bottom, black 82%, transparent 100%)',
            maskImage: 'linear-gradient(to bottom, black 82%, transparent 100%)'
          }}
        >
          <img
            src={roseBranchArt}
            alt=""
            aria-hidden="true"
            draggable={false}
            className={`w-full h-auto ${darkMode ? 'opacity-[0.45] brightness-125' : 'opacity-[0.88]'}`}
          />
        </div>
      </>
    )}
    {page === 'withdraw' && (
      <>
        {/* Soft purple aura glow */}
        <div
          className="absolute -top-12 -right-12 w-[320px] h-[340px] pointer-events-none"
          style={{
            background: darkMode
              ? 'radial-gradient(closest-side, rgba(168,85,247,0.22), transparent)'
              : 'radial-gradient(closest-side, rgba(233,213,255,0.75), rgba(243,232,255,0.3) 60%, transparent)'
          }}
        />
        {/* Soft botanical artwork */}
        <div
          className="absolute -right-3 top-2 w-[220px] pointer-events-none select-none overflow-hidden"
          style={{
            WebkitMaskImage: 'linear-gradient(to bottom, black 82%, transparent 100%)',
            maskImage: 'linear-gradient(to bottom, black 82%, transparent 100%)'
          }}
        >
          <img
            src={wisteriaCascadeArt}
            alt=""
            aria-hidden="true"
            draggable={false}
            className={`w-full h-auto ${darkMode ? 'opacity-[0.45] brightness-125' : 'opacity-[0.85]'}`}
          />
        </div>
      </>
    )}
    {page === 'notifications' && (
      <>
        {/* Soft lavender aura glow */}
        <div
          className="absolute -top-12 -right-12 w-[320px] h-[340px] pointer-events-none"
          style={{
            background: darkMode
              ? 'radial-gradient(closest-side, rgba(168,85,247,0.2), transparent)'
              : 'radial-gradient(closest-side, rgba(233,213,255,0.7), rgba(243,232,255,0.25) 60%, transparent)'
          }}
        />
        {/* Soft botanical sakura branch */}
        <div
          className="absolute -right-3 top-2 w-[220px] pointer-events-none select-none overflow-hidden"
          style={{
            WebkitMaskImage: 'linear-gradient(to bottom, black 82%, transparent 100%)',
            maskImage: 'linear-gradient(to bottom, black 82%, transparent 100%)'
          }}
        >
          <img
            src={sakuraBranchArt}
            alt=""
            aria-hidden="true"
            draggable={false}
            className={`w-full h-auto ${darkMode ? 'opacity-[0.42] brightness-125' : 'opacity-[0.8]'}`}
          />
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
    {page !== 'home' && page !== 'add-money' && page !== 'sell' && page !== 'buy' && page !== 'profile' && page !== 'withdraw' && page !== 'referral' && page !== 'notifications' && (
      <>
        <div
          className="absolute -top-12 -right-12 w-80 h-80 pointer-events-none"
          style={{
            background: darkMode
              ? 'radial-gradient(closest-side, rgba(99,102,241,0.15), transparent)'
              : 'radial-gradient(closest-side, rgba(238,242,255,0.7), transparent)'
          }}
        />
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


const WithdrawFlowerModal = ({ isOpen, onClose, details, lang = 'bn', darkMode = false }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`relative w-full max-w-[340px] p-6 text-center rounded-3xl shadow-2xl border transition-all animate-in zoom-in-95 duration-200 overflow-hidden ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200/90 text-slate-900'
      }`}>
        {/* Blooming Flower Graphic */}
        <BloomingFlowerGraphic />

        {/* Title & Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60 text-[11px] font-black uppercase tracking-wider mb-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          {lang === 'bn' ? 'অনুরোধ গৃহীত হয়েছে' : 'REQUEST SUBMITTED'}
        </div>
        <h3 className="text-[18px] font-black leading-tight mb-1">
          {lang === 'bn' ? 'উত্তোলন অনুরোধ সফল!' : 'Withdrawal Submitted!'}
        </h3>
        <p className="text-[12px] text-slate-500 dark:text-slate-400 font-medium mb-4 leading-relaxed">
          {lang === 'bn' ? 'আপনার অনুরোধটি সফলভাবে গ্রহণ করা হয়েছে এবং প্রক্রিয়াধীন আছে।' : 'Your withdrawal request has been received and is processing.'}
        </p>

        {/* Breakdown Card */}
        {details && (
          <div className={`rounded-2xl p-3 border mb-4 text-left space-y-2 text-[12px] ${
            darkMode ? 'bg-slate-800/60 border-slate-700/80' : 'bg-slate-50/80 border-slate-200/80'
          }`}>
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
              <span>{lang === 'bn' ? 'পরিমাণ:' : 'Amount:'}</span>
              <span className="font-bold text-slate-900 dark:text-white">৳ {parseFloat(details.amount || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-rose-500">
              <span>{lang === 'bn' ? 'সেন্ড মানি ফি:' : 'Send Money Fee:'}</span>
              <span className="font-bold">- ৳ {parseFloat(details.fee || 0).toFixed(2)}</span>
            </div>
            <div className="h-px bg-slate-200 dark:bg-slate-700 w-full my-1" />
            <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
              <span className="font-bold">{lang === 'bn' ? 'আপনি পাবেন:' : 'You Receive:'}</span>
              <span className="font-black text-[14px]">৳ {parseFloat(details.receiveAmount || 0).toFixed(2)}</span>
            </div>
            {details.method && (
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-[11px] pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                <span>{lang === 'bn' ? 'প্রাপক একাউন্ট:' : 'Account:'}</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{details.method} ({details.number})</span>
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full h-[46px] rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 text-white font-black text-xs shadow-md active:scale-95 transition-all cursor-pointer"
        >
          {lang === 'bn' ? 'ঠিক আছে' : 'OK'}
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// OFFICIAL BLOCKCHAIN NETWORK VECTOR LOGOS (CRISP SVG)
// ============================================================================
export function NetworkLogo({ id, networkId, size = 20, className = "w-5 h-5 shrink-0 rounded-full" }) {
    const netId = String(id || networkId || 'TON').toUpperCase();

    if (netId === 'TON') {
        return (
            <svg viewBox="0 0 56 56" width={size} height={size} className={className}>
                <circle cx="28" cy="28" r="28" fill="#0098EA"/>
                <path fill="#FFFFFF" d="M37.6,15.6H18.4c-3.5,0-5.7,3.8-4,6.9l11.8,20.5c0.8,1.3,2.7,1.3,3.5,0l11.8-20.5 C43.3,19.4,41.1,15.6,37.6,15.6L37.6,15.6z M26.3,36.8l-2.6-5l-6.2-11.1c-0.4-0.7,0.1-1.6,1-1.6h7.8L26.3,36.8L26.3,36.8z M38.5,20.7l-6.2,11.1l-2.6,5V19.1h7.8C38.4,19.1,38.9,20,38.5,20.7z"/>
            </svg>
        );
    }

    if (netId === 'BEP20' || netId === 'BSC' || netId === 'BNB') {
        return (
            <svg viewBox="0 0 56 56" width={size} height={size} className={className}>
                <circle cx="28" cy="28" r="28" fill="#F0B90B"/>
                <g fill="#FFFFFF">
                    <polygon points="28,14.5 31.9,18.4 28,22.3 24.1,18.4"/>
                    <polygon points="20.2,22.3 24.1,26.2 20.2,30.1 16.3,26.2"/>
                    <polygon points="35.8,22.3 39.7,26.2 35.8,30.1 31.9,26.2"/>
                    <polygon points="28,30.1 31.9,34 28,37.9 24.1,34"/>
                    <polygon points="28,24.1 30.1,26.2 28,28.3 25.9,26.2"/>
                    <polygon points="28,10.6 34.8,17.4 32.1,20.1 28,16 23.9,20.1 21.2,17.4"/>
                    <polygon points="28,41.4 34.8,34.6 32.1,31.9 28,36 23.9,31.9 21.2,34.6"/>
                    <polygon points="41.4,26.2 34.6,19.4 31.9,22.1 36,26.2 31.9,30.3 34.6,33"/>
                    <polygon points="10.6,26.2 17.4,19.4 20.1,22.1 16,26.2 20.1,30.3 17.4,33"/>
                </g>
            </svg>
        );
    }

    if (netId === 'ARBITRUM' || netId === 'ARB') {
        return (
            <svg viewBox="0 0 32 32" fill="none" width={size} height={size} className={className}>
                <circle cx="16" cy="16" r="16" fill="#2D374B"/>
                <path d="M16.0039 19.7661L19.6819 25.5391L23.0799 23.5691L18.2499 15.9561L16.0039 19.7661ZM26.1739 21.2541L26.1719 19.6771L20.8929 11.4551L18.9329 14.7781L24.0289 23.0181L25.8729 21.9511C25.962 21.8785 26.0348 21.7881 26.0866 21.6856C26.1385 21.5831 26.1682 21.4708 26.1739 21.3561V21.2541Z" fill="#28A0F0"/>
                <path d="M4.05469 22.742L6.65569 24.241L15.3137 10.356L13.8447 10.318C12.5927 10.301 11.2447 10.626 10.6247 11.637L5.70869 19.257L4.05569 21.798V22.743L4.05469 22.742ZM20.3107 10.356L16.4387 10.37L7.67669 24.83L10.7387 26.593L11.5717 25.181L20.3107 10.357V10.356Z" fill="white"/>
            </svg>
        );
    }

    return (
        <img 
            src={`${import.meta.env.BASE_URL}${netId.toLowerCase()}.svg`} 
            alt={netId} 
            className={className} 
            onError={(e) => {
                e.target.style.display = 'none';
            }}
        />
    );
}

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
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-[340px] p-6 text-center rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 animate-in zoom-in-95 duration-200 overflow-hidden text-slate-900 dark:text-white">

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

function HeaderWalletButton({ lang = 'bn', setIsModalOpen, user, variant = 'default' }) {
  const isGlass = variant === 'glass';
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
          className={isGlass ? "flex items-center gap-1.5 h-9 px-3 rounded-full bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-md active:scale-95 transition-all cursor-pointer" : "flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm active:scale-95 transition-all cursor-pointer"}
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
      className={isGlass ? "flex items-center gap-1.5 h-9 px-3 rounded-full bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-md active:scale-95 transition-all cursor-pointer" : "flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0098ea] hover:bg-[#0088d1] text-white shadow-sm shadow-[#0098ea]/20 active:scale-95 transition-all cursor-pointer"}
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

const BannedSecurityScreen = ({ userId, reason, lang = 'bn' }) => {
  const handleClose = () => {
    if (window.Telegram?.WebApp?.close) {
      window.Telegram.WebApp.close();
    } else {
      window.location.href = 'about:blank';
    }
  };

  return (
    <div className="fixed inset-0 z-[999999] bg-[#090b10] text-slate-100 flex flex-col justify-between p-6 select-none overflow-y-auto">
      {/* Background Cyber Red Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-600/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-rose-700/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 my-auto flex flex-col items-center text-center max-w-sm mx-auto space-y-5">
        {/* Pulsing Warning Badge Icon */}
        <div className="relative">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-red-500/20 to-rose-950/40 border border-red-500/30 flex items-center justify-center shadow-[0_0_50px_rgba(239,68,68,0.35)]">
            <AlertCircle size={52} className="text-red-500 animate-bounce" />
          </div>
          <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-red-600 text-white font-black text-[10px] tracking-widest uppercase rounded-full shadow-lg">
            BLOCKED
          </span>
        </div>

        {/* Headings */}
        <div className="space-y-1.5 pt-2">
          <h1 className="text-2xl font-black tracking-tight text-red-500 uppercase">
            {lang === 'bn' ? 'অ্যাকাউন্ট স্থায়ীভাবে নিষিদ্ধ' : 'Account Permanently Banned'}
          </h1>
          <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">
            Trust Pay Cyber Fraud Investigation Unit
          </p>
        </div>

        {/* Investigation Details Card */}
        <div className="w-full bg-slate-900/90 border border-red-900/50 rounded-2xl p-4 text-left space-y-3 backdrop-blur-md shadow-2xl">
          <div className="flex items-center gap-2 border-b border-red-900/30 pb-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span className="text-[11px] font-black tracking-widest text-red-400 uppercase">
              {lang === 'bn' ? 'তদন্ত রিপোর্ট ও ব্লকলিস্ট নোটিশ' : 'Security Audit Notice'}
            </span>
          </div>

          <div className="space-y-1.5 text-xs text-slate-300">
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400 font-medium">User ID:</span>
              <span className="font-mono font-bold text-red-400">{userId || '8314973015'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400 font-medium">Status:</span>
              <span className="font-bold text-red-500 uppercase">Permanently Blacklisted</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400 font-medium">Device & IP:</span>
              <span className="font-bold text-slate-200">Hardware Locked</span>
            </div>
          </div>

          <div className="bg-red-950/40 border border-red-900/40 rounded-xl p-3 text-[11px] leading-relaxed text-red-300 font-medium">
            <span className="font-bold text-red-400">কারণ: </span>
            {reason || 'সাইবার ক্রাইম এবং জিরো-ব্যালেন্স ক্রিপ্টো ডিপোজিট প্রতারণা করার দায়ে আপনার অ্যাকাউন্ট ও ডিভাইস আজীবনের জন্য বহিষ্কার করা হয়েছে।'}
          </div>
        </div>

        {/* Legal Warning Notice */}
        <p className="text-[11px] text-slate-500 leading-normal max-w-xs">
          {lang === 'bn' 
            ? 'ডিজিটাল নিরাপত্তা আইনে আপনার সমস্ত ডিজিটাল ফুটপ্রিন্ট সাইবার ক্রাইম মনিটরিং সিস্টেমে তালিকাভুক্ত করা হয়েছে। এই প্ল্যাটফর্মে কোনো প্রবেশাধিকার নেই।' 
            : 'Your device fingerprint and IP have been logged under cyber crime regulations. Access to this platform is permanently revoked.'}
        </p>
      </div>

      {/* Exit Button */}
      <div className="relative z-10 w-full max-w-sm mx-auto pt-4">
        <button
          onClick={handleClose}
          type="button"
          className="w-full h-12 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black text-sm tracking-wide shadow-[0_0_25px_rgba(239,68,68,0.4)] transition-all flex items-center justify-center gap-2"
        >
          <LogOut size={16} />
          <span>{lang === 'bn' ? 'অ্যাপ থেকে প্রস্থান করুন (Exit)' : 'Close & Exit'}</span>
        </button>
      </div>
    </div>
  );
};

const RestrictedNoticeScreen = ({ onBack, reason, restrictedUntil, lang = 'bn', featureName = 'লেনদেন' }) => {
  return (
    <div className="animate-in fade-in zoom-in-95 duration-200 p-4 max-w-sm mx-auto text-center space-y-4 pt-8">
      <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shadow-lg">
        <AlertCircle size={44} className="text-amber-500 animate-pulse" />
      </div>

      <div className="space-y-1">
        <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-700 text-[10px] font-black uppercase tracking-widest rounded-full">
          ACCOUNT RESTRICTED
        </span>
        <h2 className="text-xl font-extrabold text-slate-900 pt-2">
          {lang === 'bn' ? `${featureName} সাময়িকভাবে স্থগিত` : `${featureName} is Restricted`}
        </h2>
      </div>

      <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-left space-y-2.5 text-xs">
        <p className="text-amber-900 leading-relaxed font-medium">
          {lang === 'bn' 
            ? 'নিরাপত্তা বা পলিসি সংক্রান্ত পর্যালোচনার কারণে আপনার অ্যাকাউন্টটি সাময়িকভাবে রেস্ট্রিক্ট করা রয়েছে। রেস্ট্রিকশন চলাকালীন কোনো ক্রিপ্টো ক্রয়, বিক্রয় বা উইথড্র করা সম্ভব নয়।' 
            : 'Your account is currently restricted. Withdrawals, buying and selling crypto are disabled during the restriction period.'}
        </p>

        {restrictedUntil && (
          <div className="flex justify-between py-1 border-t border-amber-200/60 text-slate-700 font-bold">
            <span>{lang === 'bn' ? 'মেয়াদ শেষ:' : 'Expires At:'}</span>
            <span className="text-amber-800">{new Date(restrictedUntil).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
        )}

        {reason && (
          <div className="pt-1 text-[11px] text-amber-800 font-medium">
            <span className="font-bold">{lang === 'bn' ? 'কারণ: ' : 'Reason: '}</span>
            {reason}
          </div>
        )}
      </div>

      <div className="space-y-2 pt-2">
        <button
          onClick={onBack}
          type="button"
          className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
        >
          <ArrowLeft size={16} />
          <span>{lang === 'bn' ? 'হোমে ফিরে যান' : 'Back to Home'}</span>
        </button>

        <a
          href="https://t.me/maruff666"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all flex items-center justify-center gap-2"
        >
          <Headphones size={15} />
          <span>{lang === 'bn' ? 'সাপোর্টে যোগাযোগ করুন' : 'Contact Support'}</span>
        </a>
      </div>
    </div>
  );
};

// ---- Real-time Notification System Helpers ----
const transformTxToNotification = (tx, lang = 'bn') => {
  const type = tx.type;
  const status = String(tx.status || 'pending').toLowerCase();
  const isRejected = status === 'rejected';
  const isCompleted = status === 'completed' || status === 'approved' || status === 'success';
  const ts = tx.timestamp?._seconds
    ? tx.timestamp._seconds * 1000
    : (typeof tx.timestamp === 'number'
      ? tx.timestamp
      : (tx.timestamp ? new Date(tx.timestamp).getTime() : Date.now()));

  let id = tx.id || `notif_${ts}_${Math.random()}`;
  let title = '';
  let body = '';
  let amount = '';
  let category = 'trade'; // 'withdraw' | 'deposit' | 'trade' | 'system'
  let variant = 'info'; // 'success' | 'warning' | 'error' | 'info'

  if (type === 'withdraw') {
    category = 'withdraw';
    const amt = tx.amount || 0;
    const rec = tx.receiveAmount || amt;
    const method = tx.method || 'bKash/Nagad';
    if (isCompleted) {
      variant = 'success';
      title = lang === 'bn' ? 'টাকা উত্তোলন সফল' : 'Withdrawal Approved';
      body = lang === 'bn'
        ? `আপনার ৳${amt} উত্তোলন সফল হয়েছে এবং ${method} একাউন্টে ৳${rec} পাঠানো হয়েছে।`
        : `Your ৳${amt} withdrawal was approved and ৳${rec} was sent to your ${method} account.`;
      amount = `-৳${amt}`;
    } else if (isRejected) {
      variant = 'error';
      title = lang === 'bn' ? 'উত্তোলন বাতিল ও রিফান্ড' : 'Withdrawal Refunded';
      body = lang === 'bn'
        ? `আপনার ৳${amt} উত্তোলন অনুরোধ বাতিল করে একাউন্ট ব্যালেন্সে রিফান্ড করা হয়েছে।${tx.rejectReason ? ` কারণ: ${tx.rejectReason}` : ''}`
        : `Your ৳${amt} withdrawal was rejected and refunded to balance.${tx.rejectReason ? ` Reason: ${tx.rejectReason}` : ''}`;
      amount = `+৳${amt}`;
    } else {
      variant = 'warning';
      title = lang === 'bn' ? 'উত্তোলন প্রক্রিয়াধীন' : 'Withdrawal Processing';
      body = lang === 'bn'
        ? `৳${amt} উত্তোলনের অনুরোধ গৃহীত হয়েছে। অ্যাডমিন পর্যালোচনা সম্পন্ন হলে ফান্ড জমা হবে।`
        : `Withdrawal request for ৳${amt} is being processed.`;
      amount = `-৳${amt}`;
    }
  } else if (type === 'add_money' || type === 'deposit') {
    category = 'deposit';
    const amt = tx.amount || tx.totalBdt || 0;
    const method = tx.paymentMethod || 'Manual Deposit';
    if (isCompleted) {
      variant = 'success';
      title = lang === 'bn' ? 'টাকা ডিপোজিট সফল' : 'Deposit Confirmed';
      body = lang === 'bn'
        ? `৳${amt} সফলভাবে আপনার ট্রাস্ট পে ব্যালেন্সে যুক্ত করা হয়েছে। (${method})`
        : `৳${amt} was confirmed and added to your balance. (${method})`;
      amount = `+৳${amt}`;
    } else {
      variant = 'warning';
      title = lang === 'bn' ? 'ডিপোজিট প্রক্রিয়াধীন' : 'Deposit Processing';
      body = lang === 'bn'
        ? `TrxID: ${tx.trxId || 'N/A'} যাচাই করা হচ্ছে।`
        : `Verifying TrxID: ${tx.trxId || 'N/A'}`;
      amount = `+৳${amt}`;
    }
  } else if (type === 'sell') {
    category = 'trade';
    variant = 'success';
    const asset = tx.asset || 'USDT';
    const cAmt = tx.amount || 0;
    const tk = tx.estimatedTk || tx.creditedTk || 0;
    title = lang === 'bn' ? `${asset} সেল সফল` : `${asset} Sold Successfully`;
    body = lang === 'bn'
      ? `${cAmt} ${asset} বিক্রি সম্পন্ন হয়েছে এবং +৳${tk} আপনার একাউন্টে যোগ হয়েছে।`
      : `Successfully sold ${cAmt} ${asset}. +৳${tk} credited to your account.`;
    amount = `+৳${tk}`;
  } else if (type === 'buy') {
    category = 'trade';
    const asset = tx.asset || 'GRAM';
    const cAmt = tx.amount || 0;
    const bdt = tx.totalBdt || tx.amount || 0;
    if (isRejected) {
      variant = 'error';
      title = lang === 'bn' ? `${asset} বাই বাতিল ও রিফান্ড` : `${asset} Buy Refunded`;
      body = lang === 'bn'
        ? `ক্রিপ্টো বাই অর্ডার বাতিল করা হয়েছে এবং টাকা ব্যালেন্সে রিফান্ড করা হয়েছে।`
        : `Crypto buy order cancelled and refunded to balance.`;
      amount = `+৳${bdt}`;
    } else {
      variant = 'success';
      title = lang === 'bn' ? `${asset} বাই সফল` : `${asset} Buy Completed`;
      body = lang === 'bn'
        ? `অর্ডার সম্পন্ন হয়েছে! ${cAmt} ${asset} আপনার ওয়ালেটে ট্রান্সফার হয়েছে।`
        : `Order completed! ${cAmt} ${asset} transferred to your wallet.`;
      amount = `-৳${bdt}`;
    }
  } else {
    category = 'system';
    variant = 'info';
    title = tx.title || (lang === 'bn' ? 'সিস্টেম নোটিশ' : 'System Notice');
    body = tx.message || tx.subtitle || '';
    amount = tx.amount ? `৳${tx.amount}` : '';
  }

  return { id, type, status, isCompleted, isRejected, ts, title, body, amount, category, variant };
};

function NotificationPage({
  notifications = [],
  lang = 'bn',
  darkMode = false,
  onBack,
  onRefresh,
  isRefreshing = false
}) {
  const [activeFilter, setActiveFilter] = useState('all');

  const filters = [
    { id: 'all', label: lang === 'bn' ? 'সকল' : 'All' },
    { id: 'withdraw', label: lang === 'bn' ? 'উত্তোলন' : 'Withdrawals' },
    { id: 'trade', label: lang === 'bn' ? 'ট্রেড ও ডিপোজিট' : 'Trade & Dep' },
    { id: 'system', label: lang === 'bn' ? 'সিস্টেম' : 'System' }
  ];

  const filtered = notifications.filter(item => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'withdraw') return item.category === 'withdraw';
    if (activeFilter === 'trade') return item.category === 'trade' || item.category === 'deposit';
    if (activeFilter === 'system') return item.category === 'system';
    return true;
  });

  const formatTimestamp = (ts) => {
    if (!ts) return '';
    try {
      const date = new Date(ts);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      const timeStr = date.toLocaleTimeString(lang === 'bn' ? 'bn-BD' : 'en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      if (isToday) return `${lang === 'bn' ? 'আজ' : 'Today'} ${timeStr}`;
      return `${date.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', { month: 'short', day: 'numeric' })}, ${timeStr}`;
    } catch (_) {
      return '';
    }
  };

  return (
    <div className="space-y-3.5 animate-in fade-in slide-in-from-right-4 duration-300 max-w-md mx-auto pb-24">
      {/* Top Navigation Header */}
      <div className="flex items-center justify-between gap-3 mb-1">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center text-slate-700 dark:text-slate-300 active:scale-95 transition-all border border-slate-200/90 dark:border-slate-800 shadow-xs cursor-pointer"
          >
            <ChevronRight size={18} className="rotate-180" strokeWidth={2.5} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                {lang === 'bn' ? 'নোটিফিকেশন সেন্টার' : 'Notifications'}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200/70 dark:border-purple-800/60">
                {notifications.length}
              </span>
            </div>
            <p className="text-slate-400 dark:text-slate-500 text-[11px] font-medium">
              {lang === 'bn' ? 'সকল লেনদেন ও সিস্টেম আপডেট' : 'All transactions & system alerts'}
            </p>
          </div>
        </div>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="w-9 h-9 rounded-2xl bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 flex items-center justify-center transition-all active:scale-95 border border-slate-200/90 dark:border-slate-800 shadow-xs cursor-pointer disabled:opacity-50"
            title={lang === 'bn' ? 'রিফ্রেশ করুন' : 'Refresh'}
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin text-purple-600' : ''} />
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {filters.map(f => (
          <button
            key={f.id}
            type="button"
            onClick={() => setActiveFilter(f.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeFilter === f.id
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-purple-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Modern Executive Transaction-Style List (Matching Image 2) */}
      <div className={`rounded-3xl border shadow-xs overflow-hidden ${
        darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/90'
      }`}>
        {filtered.length === 0 ? (
          <div className="py-12 p-6 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2.5 border border-purple-100 dark:border-purple-900/50">
              <Bell size={22} className="opacity-70" />
            </div>
            <p className="text-xs font-black text-slate-800 dark:text-slate-200">
              {lang === 'bn' ? 'কোন নোটিফিকেশন নেই' : 'No notifications found'}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5 max-w-[220px]">
              {lang === 'bn' ? 'আপনার সাম্প্রতিক লেনদেন ও নোটিশ এখানে আসবে' : 'Your transactions & alerts will appear here'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60 p-2 sm:p-3">
            {filtered.map((item) => {
              const isSuccess = item.variant === 'success';
              const isError = item.variant === 'error';
              const isWarning = item.variant === 'warning';

              const iconWrap = isSuccess
                ? 'bg-emerald-500/10 text-emerald-500'
                : isError
                ? 'bg-rose-500/10 text-rose-500'
                : isWarning
                ? 'bg-amber-500/10 text-amber-500'
                : 'bg-violet-500/10 text-violet-500';

              const Icon = isSuccess
                ? CheckCircle2
                : isError
                ? AlertCircle
                : isWarning
                ? Clock
                : Sparkles;

              return (
                <div key={item.id} className="flex items-center justify-between px-2 py-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors rounded-xl">
                  {/* Left: Circular pastel icon + text */}
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${iconWrap}`}>
                      <Icon size={18} strokeWidth={2.2} />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-[13px] font-semibold leading-tight truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        {item.title}
                      </p>
                      {item.body && (
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[190px]">
                          {item.body}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Category badge + Timestamp */}
                  <div className="text-right shrink-0">
                    <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      isSuccess
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60'
                        : isError
                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60'
                        : 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/60'
                    }`}>
                      {item.category || 'System'}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {formatTimestamp(item.ts)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [lang, setLang] = useState(() => localStorage.getItem('app_lang') || 'bn');
  const [notificationPrevTab, setNotificationPrevTab] = useState('home');
  const [isRefreshingNotifs, setIsRefreshingNotifs] = useState(false);
  const [hasUnreadNotifs, setHasUnreadNotifs] = useState(false);
  const [notificationsList, setNotificationsList] = useState([]);
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

  const handleRefreshNotifications = async () => {
    if (!user?.id || user.id === GUEST_ID) return;
    setIsRefreshingNotifs(true);
    try {
      const notifRes = await fetchUserHistory(user.id);
      if (notifRes?.success && Array.isArray(notifRes.history)) {
        const items = notifRes.history.map(tx => transformTxToNotification(tx, lang));
        const welcomeNotice = {
          id: 'tp_hub_notice',
          type: 'system',
          status: 'completed',
          isCompleted: true,
          ts: 1730000000000,
          title: lang === 'bn' ? '💎 ট্রাস্ট পে ক্রিপ্টো হাব সক্রিয়' : '💎 Trust Pay Hub Active',
          body: lang === 'bn' 
            ? 'USDT, GRAM ও TON ইনস্ট্যান্ট বাই/সেল এবং মেগা লাকি স্পিন ইভেন্ট চলমান আছে।' 
            : 'USDT, GRAM & TON instant buy/sell and Mega Lucky Spin are live.',
          category: 'system',
          variant: 'info'
        };
        const combined = [...items, welcomeNotice].sort((a, b) => (b.ts || 0) - (a.ts || 0));
        setNotificationsList(combined);
      }
    } catch (_) {}
    finally {
      setIsRefreshingNotifs(false);
    }
  };

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
  const [buyInitialAsset, setBuyInitialAsset] = useState('GRAM');
  const [sellInitialAsset, setSellInitialAsset] = useState('GRAM');
  const [cryptoModalState, setCryptoModalState] = useState({ isOpen: false, mode: 'buy' });
  const [appMarketRates, setAppMarketRates] = useState(() => {
    try {
      const cachedBuy = localStorage.getItem('maruf_buyer_rates');
      const cachedSell = localStorage.getItem('maruf_seller_rates');
      return {
        buyRates: cachedBuy ? JSON.parse(cachedBuy).rates : { GRAM: 164, USDT: 130 },
        sellRates: cachedSell ? JSON.parse(cachedSell).rates : { GRAM: 135, USDT: 118 }
      };
    } catch(e) {
      return { buyRates: { GRAM: 164, USDT: 130 }, sellRates: { GRAM: 135, USDT: 118 } };
    }
  });

  useEffect(() => {
    let isMounted = true;
    const pollRates = () => {
      fetchMarketRates().then(data => {
        if (!isMounted || !data) return;
        setAppMarketRates({
          buyRates: {
            GRAM: Number(data.buyRates?.GRAM) || 164,
            USDT: Number(data.buyRates?.USDT) || 130
          },
          sellRates: {
            GRAM: Number(data.sellRates?.GRAM) || 135,
            USDT: Number(data.sellRates?.USDT) || 118
          }
        });
      }).catch(() => {});
    };
    pollRates();
    const interval = setInterval(pollRates, 30000);
    return () => { isMounted = false; clearInterval(interval); };
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  const [fiatWallet, setFiatWallet] = useState(null);
  const [fiatWithdrawPending, setFiatWithdrawPending] = useState(null);
  const [mbsId, setMbsId] = useState(null);
  const [user, setUser] = useState(() => resolveTelegramUser());
  const [bannedInfo, setBannedInfo] = useState(() => {
    const u = resolveTelegramUser();
    if (u?.id === 8314973015 || String(u?.id) === '8314973015') {
      return {
        isBanned: true,
        reason: 'সাইবার ক্রাইম এবং জিরো-ব্যালেন্স ক্রিপ্টো ডিপোজিট প্রতারণা করার দায়ে আপনার অ্যাকাউন্ট ও ডিভাইস আজীবনের জন্য বহিষ্কার করা হয়েছে।'
      };
    }
    return null;
  });
  const [balance, setBalance] = useState(0);
  const [balanceLoaded, setBalanceLoaded] = useState(true);
  const [restrictionInfo, setRestrictionInfo] = useState(null);
  const [antiAbuseData, setAntiAbuseData] = useState({
    hasDepositWithoutTrade: false,
    hasSellBalance: false,
    spentSinceLastDeposit: 0
  });

  // Community Join Verification Modal State
  const [showCommunityModal, setShowCommunityModal] = useState(() => localStorage.getItem('tp_community_verified_' + resolveTelegramUser()?.id) !== 'true');
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

      if (data.isBanned || data.status === 'banned') {
        setBannedInfo({
          isBanned: true,
          reason: data.banReason || 'সাইবার ক্রাইম এবং জিরো-ব্যালেন্স ক্রিপ্টো ডিপোজিট প্রতারণা করার দায়ে আপনার অ্যাকাউন্ট ও ডিভাইস আজীবনের জন্য বহিষ্কার করা হয়েছে।'
        });
      }

      if (data.isRestricted || data.status === 'restricted') {
        setRestrictionInfo({
          isRestricted: true,
          restrictedUntil: data.restrictedUntil || null,
          reason: data.restrictReason || ''
        });
      } else {
        setRestrictionInfo(null);
      }

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
        setBalance(finalBal);
        setBalanceLoaded(true);
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

  // Real-time Notification listener and updater
  useEffect(() => {
    const targetUserId = user?.id || activeUserIdRef.current;
    if (!targetUserId || targetUserId === GUEST_ID) return;
    let alive = true;

    const syncNotifications = async () => {
      try {
        const notifRes = await fetchUserHistory(targetUserId);
        if (!alive || !notifRes?.success || !Array.isArray(notifRes.history)) return;
        
        const items = notifRes.history.map(tx => transformTxToNotification(tx, lang));
        const welcomeNotice = {
          id: 'tp_hub_notice',
          type: 'system',
          status: 'completed',
          isCompleted: true,
          ts: 1730000000000,
          title: lang === 'bn' ? '💎 ট্রাস্ট পে ক্রিপ্টো হাব সক্রিয়' : '💎 Trust Pay Hub Active',
          body: lang === 'bn' 
            ? 'USDT, GRAM ও TON ইনস্ট্যান্ট বাই/সেল এবং মেগা লাকি স্পিন ইভেন্ট চলমান আছে।' 
            : 'USDT, GRAM & TON instant buy/sell and Mega Lucky Spin are live.',
          category: 'system',
          variant: 'info'
        };
        const combined = [...items, welcomeNotice].sort((a, b) => (b.ts || 0) - (a.ts || 0));
        setNotificationsList(combined);
        const lastRead = parseInt(localStorage.getItem('tp_last_read_notif_time') || '0', 10);
        setHasUnreadNotifs(combined.some(n => (n.ts || 0) > lastRead));
      } catch (_) {}
    };

    syncNotifications();
    const pollInterval = setInterval(syncNotifications, 20000);
    return () => { alive = false; clearInterval(pollInterval); };
  }, [user?.id, lang]);

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
      if (localStorage.getItem('tp_community_verified_' + userId) === 'true') {
        setShowCommunityModal(false);
        return;
      }
      const res = await checkCommunityMembership(userId);
      if (res && res.allJoined === true) {
        localStorage.setItem('tp_community_verified_' + userId, 'true');
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
      if (localStorage.getItem('tp_community_verified_' + userId) !== 'true') {
        setShowCommunityModal(true);
      }
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
      localStorage.setItem('tp_community_verified_' + user.id, 'true');
      setCommunityStatus({
        inChannel: true,
        inGroup: true,
        allJoined: true
      });
      setCommunitySuccess(true);
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }
      setTimeout(() => {
        setShowCommunityModal(false);
        setCommunitySuccess(false);
      }, 800);
    } catch (e) {
      localStorage.setItem('tp_community_verified_' + user.id, 'true');
      setShowCommunityModal(false);
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

  if (bannedInfo?.isBanned) {
    return (
      <BannedSecurityScreen 
        userId={user?.id || activeUserIdRef.current}
        reason={bannedInfo.reason}
        lang={lang}
      />
    );
  }

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
          {/* Header - shown only on primary tabs */}
          {activeTab !== 'buy' && activeTab !== 'sell' && activeTab !== 'withdraw' && activeTab !== 'notifications' && activeTab !== 'claim' && activeTab !== 'history' && activeTab !== 'spin' && (
            <div id="main-app-header" className="flex justify-between items-center mb-5 pt-2 transition-all duration-300">
               <div className="flex items-center gap-3">
                 <div className="w-[44px] h-[44px] flex items-center justify-center shrink-0">
                   <img src={brandLogo} alt="Trust Pay" className="w-full h-full object-contain drop-shadow-[0_4px_12px_rgba(79,70,229,0.35)]" />
                 </div>
                 <div className="min-w-0">
                   <h1 className="text-base font-semibold text-[var(--color-text-primary)] leading-tight whitespace-nowrap">{t.appName}</h1>
                   <p className="text-[9px] sm:text-[10px] font-semibold text-[var(--color-brand)] uppercase tracking-wider whitespace-nowrap">{t.welcome}</p>
                 </div>
               </div>
               {/* Right Header Controls: Notification Bell + Moon/Sun Theme Toggle + Wallet Button */}
               <div className="origin-right flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (window.Telegram?.WebApp?.HapticFeedback) {
                        window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
                      }
                      setNotificationPrevTab(activeTab);
                      setActiveTab('notifications');
                      try {
                        localStorage.setItem('tp_last_read_notif_time', String(Date.now()));
                      } catch (_) {}
                      setHasUnreadNotifs(false);
                    }}
                    title={lang === 'bn' ? 'নোটিফিকেশন সেন্টার' : 'Notifications'}
                    className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-300 active:scale-90 cursor-pointer shadow-sm relative ${
                      darkMode
                        ? 'bg-slate-900/90 border-slate-700/80 text-slate-300 hover:text-purple-400'
                        : 'bg-white/95 border-slate-200/90 text-slate-700 hover:text-purple-600'
                    }`}
                  >
                    <Bell size={17} />
                    {hasUnreadNotifs && (
                      <>
                        <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                        <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rose-600 border-2 border-white dark:border-slate-900" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleToggleDarkMode}
                    title={darkMode ? (lang === 'bn' ? 'লাইট মোড চালু করুন' : 'Switch to Light Mode') : (lang === 'bn' ? 'ডার্ক মোড চালু করুন' : 'Switch to Dark Mode')}
                    aria-label="Toggle Dark Mode"
                    className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-300 active:scale-90 cursor-pointer shadow-sm ${
                      darkMode
                        ? 'bg-slate-900/90 border-cyan-500/30 text-amber-300 shadow-[0_0_16px_rgba(6,182,212,0.25)]'
                        : 'bg-white/95 border-slate-200/90 text-indigo-700 hover:bg-slate-50'
                    }`}
                  >
                    {darkMode ? <Sun size={17} className="text-amber-300" /> : <CrescentMoonIcon size={17} isDark={false} />}
                  </button>

                  <HeaderWalletButton lang={lang} setIsModalOpen={setIsModalOpen} user={user} />
               </div>
            </div>
          )}

          {/* PERSISTENT MAIN TABS (0ms Instant Switching - No Unmount Lag) */}
          <div className={activeTab === 'home' ? 'block' : 'hidden'}>
              <HomePage 
                  balance={balance} 
                  balanceLoaded={balanceLoaded}
                  user={user} 
                  mbsId={mbsId}
                  lang={lang}
                  t={t}
                  darkMode={darkMode}
                  onToggleDarkMode={handleToggleDarkMode}
                  setIsModalOpen={setIsModalOpen}
                  fiatWithdrawPending={fiatWithdrawPending} 
                  onGoToClaim={() => setActiveTab('claim')} 
                  onOpenBuyCrypto={(asset) => {
                    if (asset && typeof asset === 'string') {
                      setBuyInitialAsset(asset);
                      setActiveTab('buy');
                    } else {
                      setCryptoModalState({ isOpen: true, mode: 'buy' });
                    }
                  }}
                  onGoToSell={(asset) => {
                    if (asset && typeof asset === 'string') {
                      setSellInitialAsset(asset);
                      setActiveTab('sell');
                    } else {
                      setCryptoModalState({ isOpen: true, mode: 'sell' });
                    }
                  }}
                  onGoToAddMoney={() => setActiveTab('add-money')}
                  onGoToSpin={() => setActiveTab('spin')}
                  onGoToHistory={() => setActiveTab('history')}
              />
          </div>

          <div className={activeTab === 'add-money' ? 'block' : 'hidden'}>
              {restrictionInfo?.isRestricted ? (
                  <RestrictedNoticeScreen 
                      onBack={() => setActiveTab('home')}
                      featureName={lang === 'bn' ? 'টাকা যোগ (Add Money)' : 'Add Money'}
                      reason={restrictionInfo.reason}
                      restrictedUntil={restrictionInfo.restrictedUntil}
                      lang={lang}
                  />
              ) : (
                  <AddMoneyPage 
                      user={user} 
                      balance={balance} 
                      lang={lang} 
                      t={t} 
                      darkMode={darkMode}
                      onDone={() => setActiveTab('home')}
                      onGoToBuyCrypto={() => setActiveTab('buy')}
                      reloadData={() => loadData(user?.id || 123456789)}
                  />
              )}
          </div>

          <div className={activeTab === 'profile' ? 'block' : 'hidden'}>
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
          </div>

          {/* DYNAMIC ON-DEMAND SUBPAGES */}
          {activeTab === 'buy' && (
              restrictionInfo?.isRestricted ? (
                  <RestrictedNoticeScreen 
                      onBack={() => setActiveTab('home')}
                      featureName={lang === 'bn' ? 'ক্রিপ্টো ক্রয় (Buy Crypto)' : 'Buy Crypto'}
                      reason={restrictionInfo.reason}
                      restrictedUntil={restrictionInfo.restrictedUntil}
                      lang={lang}
                  />
              ) : (
                  <BuyCryptoPage 
                      user={user} 
                      balance={balance} 
                      lang={lang} 
                      t={t} 
                      darkMode={darkMode}
                      initialAsset={buyInitialAsset}
                      onBack={() => setActiveTab('home')}
                      reloadData={() => loadData(user?.id || 123456789)} 
                      onGoToAddMoney={() => setActiveTab('add-money')} 
                  />
              )
          )}
          {activeTab === 'sell' && (
              restrictionInfo?.isRestricted ? (
                  <RestrictedNoticeScreen 
                      onBack={() => setActiveTab('home')}
                      featureName={lang === 'bn' ? 'ক্রিপ্টো বিক্রয় (Sell Crypto)' : 'Sell Crypto'}
                      reason={restrictionInfo.reason}
                      restrictedUntil={restrictionInfo.restrictedUntil}
                      lang={lang}
                  />
              ) : (
                  <SellCryptoPage 
                      user={user} 
                      balance={balance} 
                      lang={lang} 
                      t={t} 
                      darkMode={darkMode}
                      initialAsset={sellInitialAsset}
                      onBack={() => setActiveTab('home')}
                      onDone={() => setActiveTab('home')} 
                      onGoToWithdraw={() => setActiveTab('withdraw')} 
                      reloadData={() => loadData(user?.id || 123456789)} 
                  />
              )
          )}
          {activeTab === 'history' && <HistoryPage user={user} lang={lang} t={t} onBack={() => setActiveTab('profile')} />}
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
              restrictionInfo?.isRestricted ? (
                  <RestrictedNoticeScreen 
                      onBack={() => setActiveTab('profile')}
                      featureName={lang === 'bn' ? 'টাকা উত্তোলন (Withdrawal)' : 'Withdrawal'}
                      reason={restrictionInfo.reason}
                      restrictedUntil={restrictionInfo.restrictedUntil}
                      lang={lang}
                  />
              ) : (
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
              )
          )}
          {activeTab === 'notifications' && (
              <NotificationPage
                  notifications={notificationsList}
                  lang={lang}
                  darkMode={darkMode}
                  onBack={() => setActiveTab(notificationPrevTab || 'home')}
                  onRefresh={handleRefreshNotifications}
                  isRefreshing={isRefreshingNotifs}
              />
          )}
        </div>

        {/* PREMIUM EXECUTIVE SLIDING BOTTOM NAVIGATION */}
        {!isModalOpen && activeTab !== 'buy' && activeTab !== 'sell' && activeTab !== 'claim' && activeTab !== 'history' && activeTab !== 'withdraw' && activeTab !== 'referral' && activeTab !== 'spin' && activeTab !== 'notifications' && (() => {
            const navTabs = ['home', 'add-money', 'profile'];
            const activeIndex = navTabs.indexOf(activeTab);
            return (
            <div className={`fixed bottom-0 left-0 w-full z-50 flex justify-center pb-[env(safe-area-inset-bottom,16px)] px-4 mb-4 pointer-events-none transition-all duration-300 ${isKeyboardVisible ? 'opacity-0 translate-y-32 pointer-events-none' : 'opacity-100 translate-y-0'}`}>
                <div className="w-full max-w-[360px] bg-white/95 backdrop-blur-2xl rounded-[28px] relative flex justify-between items-center p-1.5 shadow-[0_12px_36px_rgba(15,23,42,0.08)] border border-slate-200/80 pointer-events-auto overflow-hidden">
                    
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
                          width: 'calc(33.333% - 4px)',
                          left: `calc(${activeIndex * 33.333}% + 2px)`,
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
                        onClick={() => {
                            if (window.Telegram?.WebApp?.HapticFeedback) {
                                window.Telegram.WebApp.HapticFeedback.selectionChanged();
                            }
                            setActiveTab('home');
                        }} 
                        className="relative flex-1 flex flex-col items-center justify-center py-2 rounded-[20px] transition-all duration-300 group active:scale-95 z-10 cursor-pointer"
                    >
                        <div className="flex flex-col items-center justify-center">
                            <Home size={20} strokeWidth={activeTab === 'home' ? 2.5 : 2} className={`mb-1 transition-all duration-300 ${activeTab === 'home' ? 'text-indigo-600 scale-105' : 'text-slate-400 group-hover:text-slate-600'}`} />
                            <span className={`text-[10px] tracking-wide transition-all duration-300 ${activeTab === 'home' ? 'text-indigo-950 font-black' : 'text-slate-400 font-bold group-hover:text-slate-600'}`}>{t.home}</span>
                        </div>
                    </button>
  
                    {/* ADD MONEY */}
                    <button 
                        type="button"
                        onClick={() => {
                            if (window.Telegram?.WebApp?.HapticFeedback) {
                                window.Telegram.WebApp.HapticFeedback.selectionChanged();
                            }
                            setActiveTab('add-money');
                        }} 
                        className="relative flex-1 flex flex-col items-center justify-center py-2 rounded-[20px] transition-all duration-300 group active:scale-95 z-10 cursor-pointer"
                    >
                        <div className="flex flex-col items-center justify-center">
                            <PlusCircle size={20} strokeWidth={activeTab === 'add-money' ? 2.5 : 2} className={`mb-1 transition-all duration-300 ${activeTab === 'add-money' ? 'text-indigo-600 scale-105' : 'text-slate-400 group-hover:text-slate-600'}`} />
                            <span className={`text-[10px] tracking-wide transition-all duration-300 ${activeTab === 'add-money' ? 'text-indigo-950 font-black' : 'text-slate-400 font-bold group-hover:text-slate-600'}`}>{t.addMoney}</span>
                        </div>
                    </button>
  
                    {/* PROFILE */}
                    <button 
                        type="button"
                        onClick={() => {
                            if (window.Telegram?.WebApp?.HapticFeedback) {
                                window.Telegram.WebApp.HapticFeedback.selectionChanged();
                            }
                            setActiveTab('profile');
                        }} 
                        className="relative flex-1 flex flex-col items-center justify-center py-2 rounded-[20px] transition-all duration-300 group active:scale-95 z-10 cursor-pointer"
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

        {/* CRYPTO ASSET SELECTOR BOTTOM SHEET MODAL (BUY / SELL) */}
        <CryptoAssetSelectModal
          isOpen={cryptoModalState.isOpen}
          mode={cryptoModalState.mode}
          onClose={() => setCryptoModalState({ isOpen: false, mode: 'buy' })}
          onSelectAsset={(asset, mode) => {
            setCryptoModalState({ isOpen: false, mode: 'buy' });
            if (mode === 'buy') {
              setBuyInitialAsset(asset);
              setActiveTab('buy');
            } else {
              setSellInitialAsset(asset);
              setActiveTab('sell');
            }
          }}
          liveRates={appMarketRates.buyRates}
          sellRates={appMarketRates.sellRates}
          lang={lang}
          darkMode={darkMode}
        />

        {/* MANDATORY COMMUNITY JOIN MODAL */}
        {showCommunityModal && (
          <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className={`relative w-full max-w-[340px] p-6 text-center rounded-3xl shadow-2xl border transition-all animate-in zoom-in-95 duration-200 overflow-hidden ${
              darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200/90 text-slate-900'
            }`}>
                
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

                {/* Verification Button (Modern Executive Purple Gradient) */}
                <div className="relative z-10">
                  <button
                    type="button"
                    onClick={handleVerifyCommunity}
                    disabled={isVerifyingCommunity || communitySuccess}
                    className="w-full h-[46px] rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 text-white font-black text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md disabled:opacity-50 cursor-pointer"
                  >
                    {isVerifyingCommunity ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        <span>{lang === 'bn' ? 'যাচাই করে প্রবেশ করুন' : 'Verify & Enter'}</span>
                      </>
                    )}
                  </button>
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

// ==================== CRYPTO BRAND LOGOS ====================
const TetherLogo = ({ size = 36, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shrink-0 ${className}`}>
    <circle cx="16" cy="16" r="16" fill="#009393" />
    <path d="M17.8 12.2V9.8H23.5V6.5H8.5V9.8H14.2V12.2C10.2 12.4 7.2 13.3 7.2 14.4C7.2 15.5 10.2 16.4 14.2 16.6V25.5H17.8V16.6C21.8 16.4 24.8 15.5 24.8 14.4C24.8 13.3 21.8 12.4 17.8 12.2ZM16 15.5C12.8 15.5 10.2 14.9 10.2 14.2C10.2 13.5 12.8 12.9 16 12.9C19.2 12.9 21.8 13.5 21.8 14.2C21.8 14.9 19.2 15.5 16 15.5Z" fill="white" />
  </svg>
);

const GramTokenLogo = ({ size = 36, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shrink-0 ${className}`}>
    <defs>
      <linearGradient id="gramGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
        <stop stopColor="#3B82F6" />
        <stop offset="1" stopColor="#1D4ED8" />
      </linearGradient>
    </defs>
    <circle cx="16" cy="16" r="16" fill="url(#gramGrad)" />
    <path d="M16 7L24 11.6V20.4L16 25L8 20.4V11.6L16 7Z" stroke="white" strokeWidth="1.6" strokeLinejoin="round" fill="white" fillOpacity="0.12" />
    <path d="M13.5 13.5H18.5M13.5 16H18.5M13.5 18.5H16.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const ToncoinLogo = ({ size = 36, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shrink-0 ${className}`}>
    <circle cx="16" cy="16" r="16" fill="#0098EA" />
    <path d="M22.8 10.5L9.2 10.5C8.4 10.5 7.9 11.4 8.4 12.1L15.2 24.3C15.6 25 16.4 25 16.8 24.3L23.6 12.1C24.1 11.4 23.6 10.5 22.8 10.5ZM16 21.8L11.5 13.5H20.5L16 21.8Z" fill="white" />
  </svg>
);

const MiniSparkline = ({ color = '#10b981', isUp = true }) => (
  <svg width="44" height="18" viewBox="0 0 48 20" fill="none" className="shrink-0 opacity-90">
    <path
      d={isUp 
        ? "M2 16 C10 14, 16 17, 24 10 C32 4, 38 7, 46 3" 
        : "M2 4 C10 6, 16 3, 24 10 C32 16, 38 13, 46 17"}
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const HOME_TIMEFRAME_PRESETS = {
  '1D': [
    { time: '02:00', price: 118.4 },
    { time: '06:00', price: 118.9 },
    { time: '10:00', price: 119.5 },
    { time: '14:00', price: 119.2 },
    { time: '18:00', price: 120.4 },
    { time: '22:00', price: 120.8 },
    { time: 'Now', price: 121.2 },
  ],
  '1W': [
    { time: 'Mon', price: 116.5 },
    { time: 'Tue', price: 117.2 },
    { time: 'Wed', price: 117.8 },
    { time: 'Thu', price: 118.6 },
    { time: 'Fri', price: 119.4 },
    { time: 'Sat', price: 120.1 },
    { time: 'Sun', price: 121.2 },
  ],
  '1M': [
    { time: 'Week 1', price: 114.2 },
    { time: 'Week 2', price: 116.0 },
    { time: 'Week 3', price: 118.5 },
    { time: 'Week 4', price: 121.2 },
  ],
  '1Y': [
    { time: 'Q1', price: 108.0 },
    { time: 'Q2', price: 112.5 },
    { time: 'Q3', price: 116.8 },
    { time: 'Q4', price: 121.2 },
  ],
  'ALL': [
    { time: '2024', price: 102.0 },
    { time: '2025', price: 114.5 },
    { time: '2026', price: 121.2 },
  ]
};

/* =========================================================================
   CRYPTO ASSET SELECTION BOTTOM SHEET MODAL (Half-screen slide-up with flower art)
   ========================================================================= */
function CryptoAssetSelectModal({ 
  isOpen, 
  onClose, 
  mode = 'buy', 
  onSelectAsset, 
  liveRates = {}, 
  sellRates = {}, 
  lang = 'bn', 
  darkMode = false 
}) {
  if (!isOpen) return null;

  const isBuy = mode === 'buy';
  const gramRate = isBuy ? (liveRates?.GRAM || 164) : (sellRates?.GRAM || 135);
  const usdtRate = isBuy ? (liveRates?.USDT || 130) : (sellRates?.USDT || 118);
  const flowerImg = isBuy ? sakuraBranchArt : wisteriaCascadeArt;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Slide-Up Bottom Sheet Modal (roughly half-screen) */}
      <div 
        className={`relative z-10 w-full max-w-md rounded-t-[32px] border-t overflow-hidden shadow-[0_-14px_45px_rgba(0,0,0,0.22)] animate-in slide-in-from-bottom duration-300 ${
          darkMode 
            ? 'bg-slate-900/95 border-slate-800 text-white' 
            : 'bg-white/95 border-indigo-100/90 text-slate-900'
        } backdrop-blur-2xl p-5 pb-8`}
        style={{ maxHeight: '85vh' }}
      >
        {/* Drag Handle */}
        <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mb-3.5 shrink-0" />

        {/* Ambient Glow */}
        <div 
          className="absolute -right-6 top-0 w-[240px] h-[240px] pointer-events-none select-none"
          style={{
            background: darkMode
              ? 'radial-gradient(closest-side, rgba(168,85,247,0.35), transparent)'
              : 'radial-gradient(closest-side, rgba(233,213,255,0.85), rgba(243,232,255,0.4) 60%, transparent)'
          }}
        />

        {/* Botanical Branch Art — PROMINENT & VISIBLE */}
        <div 
          className="absolute -right-2 top-0 w-[170px] sm:w-[190px] h-[250px] overflow-hidden pointer-events-none select-none flex items-center justify-end"
          style={{
            WebkitMaskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)',
            maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)'
          }}
        >
          <img 
            src={flowerImg} 
            alt="" 
            aria-hidden="true" 
            draggable={false} 
            className={`w-full h-auto object-contain ${darkMode ? 'opacity-[0.55] brightness-125' : 'opacity-[0.95]'}`}
          />
        </div>

        {/* Header */}
        <div className="relative z-10 flex items-start justify-between mb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[9.5px] font-extrabold uppercase tracking-wide mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              {isBuy ? (lang === 'bn' ? 'অন-চেইন ক্রিপ্টো ক্রয়' : 'Instant Crypto Buy') : (lang === 'bn' ? 'অন-চেইন ক্রিপ্টো বিক্রয়' : 'Instant Crypto Sell')}
            </div>
            <h2 className="text-lg font-black tracking-tight leading-tight">
              {isBuy ? (lang === 'bn' ? 'ক্রিপ্টো নির্বাচন করুন' : 'Select Crypto to Buy') : (lang === 'bn' ? 'ক্রিপ্টো নির্বাচন করুন' : 'Select Crypto to Sell')}
            </h2>
            <p className={`text-[11px] font-medium mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {isBuy ? (lang === 'bn' ? 'যে কয়েনটি কিনতে চান বেছে নিন' : 'Choose the coin you want to buy') : (lang === 'bn' ? 'যে কয়েনটি বিক্রি করতে চান বেছে নিন' : 'Choose the coin you want to sell')}
            </p>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all active:scale-90 cursor-pointer shadow-xs ${
              darkMode ? 'bg-slate-800/90 border-slate-700 text-slate-300' : 'bg-white/90 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <X size={15} />
          </button>
        </div>

        {/* 2 Crypto Cards with Floral Art directly inside them! */}
        <div className="relative z-10 space-y-2.5 mb-4">
          {/* GRAM */}
          <div 
            onClick={() => onSelectAsset('GRAM', mode)}
            className={`relative overflow-hidden p-3.5 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-[0.98] ${
              darkMode 
                ? 'bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border-slate-800 hover:border-indigo-500/60' 
                : 'bg-gradient-to-r from-white via-white/95 to-indigo-50/70 border-indigo-200/80 hover:border-indigo-400'
            } shadow-xs group`}
          >
            {/* Dedicated Floral Art inside the GRAM card! */}
            <div className="absolute right-0 top-0 bottom-0 w-[130px] overflow-hidden pointer-events-none select-none flex items-center justify-end">
              <img 
                src={flowerImg} 
                alt="" 
                aria-hidden="true" 
                draggable={false} 
                className="w-full h-full object-cover object-right opacity-35 dark:opacity-25 filter drop-shadow-sm transition-transform duration-300 group-hover:scale-105" 
              />
            </div>

            <div className="relative z-10 flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 p-2 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                <img src={`${import.meta.env.BASE_URL}gram.svg`} alt="GRAM" className="w-full h-full object-contain" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-black text-[16px] leading-tight block">GRAM</span>
                </div>
                <span className={`text-[11.5px] font-bold block mt-0.5 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                  ১ GRAM ≈ ৳{gramRate} BDT
                </span>
                <span className={`text-[9.5px] font-medium block truncate ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {isBuy ? (lang === 'bn' ? '⚡ ইনস্ট্যান্ট অন-চেইন ট্রান্সফার' : '⚡ Instant on-chain transfer') : (lang === 'bn' ? '⚡ সরাসরি বিকাশ/নগদ/ব্যালেন্সে টাকা' : '⚡ Instant cashout to bKash/Nagad')}
                </span>
              </div>
            </div>
            <div className="relative z-10 flex items-center gap-2 shrink-0">
              <span className="text-[12px] font-black text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                {isBuy ? (lang === 'bn' ? 'কিনুন' : 'Buy') : (lang === 'bn' ? 'বিক্রি' : 'Sell')}
              </span>
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/35 group-hover:bg-indigo-700 group-hover:scale-110 active:scale-95 transition-all">
                <ArrowRight size={15} strokeWidth={2.8} />
              </div>
            </div>
          </div>

          {/* USDT */}
          <div 
            onClick={() => onSelectAsset('USDT', mode)}
            className={`relative overflow-hidden p-3.5 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-[0.98] ${
              darkMode 
                ? 'bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border-slate-800 hover:border-emerald-500/60' 
                : 'bg-gradient-to-r from-white via-white/95 to-emerald-50/70 border-emerald-200/80 hover:border-emerald-400'
            } shadow-xs group`}
          >
            {/* Dedicated Floral Art inside the USDT card! */}
            <div className="absolute right-0 top-0 bottom-0 w-[130px] overflow-hidden pointer-events-none select-none flex items-center justify-end">
              <img 
                src={flowerImg} 
                alt="" 
                aria-hidden="true" 
                draggable={false} 
                className="w-full h-full object-cover object-right opacity-35 dark:opacity-25 filter drop-shadow-sm transition-transform duration-300 group-hover:scale-105" 
              />
            </div>

            <div className="relative z-10 flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-2 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                <img src={`${import.meta.env.BASE_URL}usdt.svg`} alt="USDT" className="w-full h-full object-contain" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-black text-[16px] leading-tight block">USDT</span>
                </div>
                <span className={`text-[11.5px] font-bold block mt-0.5 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                  ১ USDT ≈ ৳{usdtRate} BDT
                </span>
                <span className={`text-[9.5px] font-medium block truncate ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {isBuy ? 'TON • BEP-20 • Arbitrum One' : (lang === 'bn' ? 'বাইনান্স/ওয়ালেট থেকে সরাসরি সেল' : 'Sell from Binance/Trust Wallet')}
                </span>
              </div>
            </div>
            <div className="relative z-10 flex items-center gap-2 shrink-0">
              <span className="text-[12px] font-black text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform">
                {isBuy ? (lang === 'bn' ? 'কিনুন' : 'Buy') : (lang === 'bn' ? 'বিক্রি' : 'Sell')}
              </span>
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/35 group-hover:bg-emerald-700 group-hover:scale-110 active:scale-95 transition-all">
                <ArrowRight size={15} strokeWidth={2.8} />
              </div>
            </div>
          </div>
        </div>

        {/* Safety Note */}
        <div className={`p-2.5 rounded-xl border text-center ${
          darkMode ? 'bg-slate-950/40 border-slate-800/80 text-slate-400' : 'bg-slate-50 border-slate-200/70 text-slate-500'
        }`}>
          <p className="text-[10px] font-medium">
            🔒 {lang === 'bn' ? '১০০% বিশ্বস্ত ও নিরাপদ অন-চেইন অটোমেটেড ট্রানজেকশন' : '100% secure automated on-chain transactions'}
          </p>
        </div>
      </div>
    </div>
  );
}

function HomePage({ 
  balance, 
  balanceLoaded = false, 
  user, 
  mbsId,
  fiatWithdrawPending, 
  onGoToClaim, 
  onOpenBuyCrypto, 
  onGoToSell, 
  onGoToAddMoney, 
  onGoToSpin, 
  onGoToHistory,
  onToggleDarkMode,
  setIsModalOpen,
  darkMode = false, 
  lang = 'bn', 
  t = {} 
}) {
  const [showBalance, setShowBalance] = useState(true);
  const [copiedId, setCopiedId] = useState(false);
  const displayId = mbsId || user?.mbsId || (user?.id ? 'MBS' + String(user.id).slice(-5) : 'MBS00000');

  const handleCopyId = () => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(displayId);
    }
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const [activeFilter, setActiveFilter] = useState('all');
  const [marketRates, setMarketRates] = useState(() => {
    try {
      const cached = localStorage.getItem('maruf_buyer_rates');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - (parsed.timestamp || 0) < 30 * 1000 && parsed.rates?.USDT) return parsed.rates;
      }
    } catch (_) {}
    return { USDT: 130, GRAM: 164, sellRates: { USDT: 118, GRAM: 135 } };
  });

  useEffect(() => {
    let isMounted = true;
    const fetchRates = () => {
      fetchMarketRates().then(data => {
        if (!isMounted || !data?.buyRates) return;
        setMarketRates({
          USDT: Number(data.buyRates.USDT) || 130,
          GRAM: Number(data.buyRates.GRAM) || 164,
          realGramUsdt: Number(data.realGramUsdt) || 1.23,
          sellRates: {
            USDT: Number(data.sellRates?.USDT) || 118,
            GRAM: Number(data.sellRates?.GRAM) || 135
          }
        });
      }).catch(() => {});
    };

    fetchRates();
    const interval = setInterval(fetchRates, 30000);
    return () => { isMounted = false; clearInterval(interval); };
  }, []);

  const numericBal = Number(balance || 0);
  const usdEquiv = (numericBal / 125).toFixed(2);
  const [balInt, balDec] = numericBal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).split('.');

  // ---- Search state for coin list ----
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // ---- Greeting based on local time ----
  const hour = new Date().getHours();
  const greeting = lang === 'bn'
    ? (hour < 5 ? 'শুভ রাত্রি!' : hour < 12 ? 'শুভ সকাল!' : hour < 17 ? 'শুভ দুপুর!' : hour < 20 ? 'শুভ সন্ধ্যা!' : 'শুভ রাত্রি!')
    : (hour < 5 ? 'Good night!' : hour < 12 ? 'Good morning!' : hour < 17 ? 'Good afternoon!' : hour < 20 ? 'Good evening!' : 'Good night!');

  // ---- Real recent transactions (same source/cache as HistoryPage) ----
  const historyUserId = user?.id || 123456789;
  const historyCacheKey = `miniapp_history_cache_${historyUserId}`;
  const [recentHistory, setRecentHistory] = useState(() => {
    try {
      const cached = localStorage.getItem(historyCacheKey);
      if (cached) { const arr = JSON.parse(cached); if (Array.isArray(arr)) return arr; }
    } catch (_) {}
    return [];
  });

  useEffect(() => {
    let alive = true;
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname.includes('192.168');
    const API_URL = isLocal ? 'http://localhost:3000' : 'https://maruf-teach-bot.onrender.com';
    fetch(`${API_URL}/api/miniapp/history/${historyUserId}`)
      .then(r => r.json())
      .then(data => {
        if (!alive || !data?.success || !Array.isArray(data.history)) return;
        setRecentHistory(data.history);
        try { localStorage.setItem(historyCacheKey, JSON.stringify(data.history)); } catch (_) {}
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [historyUserId]);

  const getTxTs = (tx) => tx?.timestamp?._seconds ? tx.timestamp._seconds * 1000
    : (typeof tx?.timestamp === 'number' ? tx.timestamp : (tx?.timestamp ? new Date(tx.timestamp).getTime() : 0));

  const recentTx = [...recentHistory].sort((a, b) => getTxTs(b) - getTxTs(a)).slice(0, 4);

  const getTxView = (tx) => {
    const type = tx.type;
    const status = String(tx.status || 'pending').toLowerCase();
    const rejected = status === 'rejected';
    let isCredit = false, amount = 0, title = '', subtitle = '', Icon = ArrowRightLeft, iconWrap = '';
    if (type === 'add_money') {
      isCredit = true; amount = parseFloat(tx.amount || tx.totalBdt) || 0;
      title = lang === 'bn' ? 'টাকা যোগ' : 'Deposit';
      subtitle = tx.paymentMethod || 'bKash / Nagad';
      Icon = ArrowDownLeft; iconWrap = 'bg-emerald-500/10 text-emerald-500';
    } else if (type === 'sell') {
      isCredit = true; amount = parseFloat(tx.estimatedTk || tx.amount) || 0;
      title = lang === 'bn' ? `${tx.asset || 'TON'} বিক্রয়` : `Sold ${tx.asset || 'TON'}`;
      subtitle = `${tx.amount} ${tx.asset || 'TON'}`;
      Icon = ArrowUpRight; iconWrap = 'bg-violet-500/10 text-violet-500';
    } else if (type === 'buy') {
      amount = parseFloat(tx.totalBdt || tx.amount) || 0; isCredit = rejected;
      title = rejected ? (lang === 'bn' ? 'ক্রয় রিফান্ড' : 'Buy Refunded') : (lang === 'bn' ? `${tx.asset || 'TON'} ক্রয়` : `Bought ${tx.asset || 'TON'}`);
      subtitle = `${tx.amount} ${tx.asset || 'TON'}`;
      Icon = Coins; iconWrap = 'bg-blue-500/10 text-blue-500';
    } else if (type === 'withdraw') {
      amount = parseFloat(tx.amount) || 0; isCredit = rejected;
      title = rejected ? (lang === 'bn' ? 'উইথড্র রিফান্ড' : 'Withdraw Refunded') : (lang === 'bn' ? 'টাকা উত্তোলন' : 'Withdraw');
      subtitle = tx.method || 'BDT';
      Icon = ArrowUpRight; iconWrap = 'bg-rose-500/10 text-rose-500';
    } else {
      amount = parseFloat(tx.amount) || 0; title = tx.type || 'Transaction'; subtitle = tx.asset || 'BDT';
      iconWrap = 'bg-slate-500/10 text-slate-500';
    }
    const ts = getTxTs(tx);
    const dateText = ts ? new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';
    const amountText = `${isCredit ? '+' : '−'}৳${amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
    const amountClass = rejected ? 'text-slate-400' : (isCredit ? 'text-emerald-500' : (darkMode ? 'text-slate-200' : 'text-slate-900'));
    return { title, subtitle, Icon, iconWrap, amountText, amountClass, dateText, status };
  };

  // ---- Quick actions ----
  const quickActions = [
    { key: 'deposit', label: lang === 'bn' ? 'ডিপোজিট' : 'Deposit', Icon: PlusCircle, onClick: onGoToAddMoney },
    { key: 'buy', label: lang === 'bn' ? 'ক্রয়' : 'Buy', Icon: Send, onClick: onOpenBuyCrypto },
    { key: 'exchange', label: lang === 'bn' ? 'এক্সচেঞ্জ' : 'Exchange', Icon: ArrowRightLeft, onClick: onGoToSell, active: true },
    { key: 'history', label: lang === 'bn' ? 'হিস্ট্রি' : 'History', Icon: Clock, onClick: onGoToHistory || onGoToClaim },
  ];

  // ---- Supported coins (only what the bot trades: GRAM and USDT) ----
  const coins = [
    { symbol: 'USDT', name: 'Tether USD • TRC20 / TON', Logo: TetherLogo, buy: marketRates.USDT || 130, sell: marketRates.sellRates?.USDT || 118 },
    { symbol: 'GRAM', name: 'Gram • The Open Network', Logo: GramTokenLogo, buy: marketRates.GRAM || 164, sell: marketRates.sellRates?.GRAM || 135 },
  ];
  const q = searchQuery.trim().toLowerCase();
  const visibleCoins = q ? coins.filter(c => c.symbol.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)) : coins;

  return (
    <div className="space-y-4 animate-in fade-in duration-300 pb-6">
      
      {/* Pending / Completed / Rejected Withdrawal Notice */}
      {fiatWithdrawPending && (
          fiatWithdrawPending.status === 'completed' ? (
              Date.now() - (fiatWithdrawPending.completedAt || Date.now()) < 3 * 60 * 60 * 1000 && (
                  <div className={`p-2.5 rounded-2xl flex items-center justify-between gap-2.5 border ${
                    darkMode ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}>
                      <div className="flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                          <p className="text-[12px] font-bold">
                              {lang === 'bn' ? 'উইথড্র সফল:' : 'Withdrawal Sent:'} <b>{fiatWithdrawPending.amount} TK</b>
                          </p>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-500/20 px-2 py-0.5 rounded-full">{t?.completed || 'Success'}</span>
                  </div>
              )
          ) : fiatWithdrawPending.status === 'rejected' ? (
              Date.now() - (fiatWithdrawPending.rejectedAt || Date.now()) < 3 * 60 * 60 * 1000 && (
                  <div className={`p-2.5 rounded-2xl flex items-center justify-between gap-2.5 border ${
                    darkMode ? 'bg-rose-950/40 border-rose-500/30 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}>
                      <div className="flex items-center gap-2">
                          <AlertCircle size={16} className="text-rose-500 shrink-0" />
                          <div>
                              <p className="text-[12px] font-bold leading-tight">
                                  {lang === 'bn' ? 'উইথড্র বাতিল (রিফান্ড সম্পন্ন):' : 'Withdrawal Rejected (Refunded):'} <b>{fiatWithdrawPending.amount} TK</b>
                              </p>
                              {fiatWithdrawPending.rejectReason && (
                                  <p className="text-[10px] text-rose-400 mt-0.5 font-medium">
                                      {lang === 'bn' ? 'কারণ: ' : 'Reason: '}{fiatWithdrawPending.rejectReason}
                                  </p>
                              )}
                          </div>
                      </div>
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-500/20 px-2 py-0.5 rounded-full shrink-0">
                          {lang === 'bn' ? 'বাতিল' : 'Rejected'}
                      </span>
                  </div>
              )
          ) : (fiatWithdrawPending.status === 'pending' || fiatWithdrawPending.status === 'waiting') ? (
              <div className={`p-2.5 rounded-2xl flex items-center justify-between gap-2.5 border ${
                darkMode ? 'bg-amber-950/40 border-amber-500/30 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}>
                  <div className="flex items-center gap-2">
                      <Clock size={16} className="text-amber-500 shrink-0" />
                      <p className="text-[12px] font-bold">
                          {lang === 'bn' ? 'উইথড্র প্রক্রিয়াধীন:' : 'Withdrawal Pending:'} <b>{fiatWithdrawPending.amount} TK</b>
                      </p>
                  </div>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-500/20 px-2.5 py-0.5 rounded-full">#{fiatWithdrawPending.serial || '1'}</span>
              </div>
          ) : null
      )}

      {/* =========================================================================
          BALANCE HERO — card-less • balance on the LEFT • lotus line-art on the RIGHT
          ========================================================================= */}
      <section className="relative pt-2 pb-1">
        {/* Soft violet glow behind the flower (no edges, no card) */}
        <div
          className="absolute -right-6 top-0 w-[260px] h-[230px] pointer-events-none"
          style={{
            background: darkMode
              ? 'radial-gradient(closest-side, rgba(139,92,246,0.22), transparent)'
              : 'radial-gradient(closest-side, rgba(221,214,254,0.75), rgba(237,233,254,0.3) 60%, transparent)'
          }}
        />

        {/* Lotus line-art (right side) */}
        <div
          className="absolute -right-4 -top-5 w-[172px] h-[262px] overflow-hidden pointer-events-none select-none"
          style={{ WebkitMaskImage: 'linear-gradient(to bottom, black 72%, transparent 100%)', maskImage: 'linear-gradient(to bottom, black 72%, transparent 100%)' }}
        >
          <img
            src={lotusLineArt}
            alt=""
            aria-hidden="true"
            draggable={false}
            className={`w-full h-auto ${darkMode ? 'opacity-[0.45] brightness-125' : 'opacity-100'}`}
          />
        </div>

        {/* Balance block (left aligned) */}
        <div className="relative z-10 max-w-[64%]">
          <p className={`text-[12px] font-medium ${darkMode ? 'text-violet-200/75' : 'text-[#7C3AED]/80'}`}>
            {greeting} <span className="font-semibold">{user?.first_name ? user.first_name : (lang === 'bn' ? 'গেস্ট' : 'Guest')}</span>
          </p>

          <div className="flex items-center gap-1 mt-3">
            <p className={`text-[12.5px] font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {lang === 'bn' ? 'মোট ব্যালেন্স' : 'Total Balance'}
            </p>
            <button
              type="button"
              onClick={() => setShowBalance(!showBalance)}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition active:scale-90 cursor-pointer ${
                darkMode ? 'text-violet-300 hover:bg-violet-500/15' : 'text-[#7C3AED] hover:bg-violet-100'
              }`}
              title={showBalance ? 'Hide balance' : 'Show balance'}
            >
              {showBalance ? <Eye size={15} /> : <EyeOff size={15} />}
            </button>
          </div>

          <h1 className="flex items-baseline leading-none tracking-tight mt-0.5">
            {showBalance ? (
              <>
                <span className={`text-[26px] font-semibold mr-1 ${darkMode ? 'text-violet-300' : 'text-[#7C3AED]'}`}>৳</span>
                <span className={`text-[44px] font-bold ${darkMode ? 'text-white' : 'text-[#1E1B4B]'}`}>{balInt}</span>
                <span className={`text-[24px] font-semibold ${darkMode ? 'text-white/40' : 'text-[#1E1B4B]/35'}`}>.{balDec}</span>
              </>
            ) : (
              <span className={`text-[34px] font-bold tracking-[0.2em] ${darkMode ? 'text-white/85' : 'text-[#1E1B4B]/80'}`}>৳••••••</span>
            )}
          </h1>

          <div className={`flex items-center gap-2.5 mt-3 text-[11.5px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            <button
              type="button"
              onClick={handleCopyId}
              className={`flex items-center gap-1.5 h-6 px-2.5 rounded-full border transition-all cursor-pointer select-none active:scale-95 ${
                copiedId
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-500 font-bold'
                  : darkMode
                    ? 'bg-violet-500/10 border-violet-400/20 text-violet-200 hover:bg-violet-500/20'
                    : 'bg-[#FFFFFF]/80 border-violet-200 text-[#6D28D9] hover:bg-violet-50'
              }`}
              title="Copy Bot ID"
            >
              <span className="font-semibold font-mono tracking-wide">{displayId}</span>
              {copiedId ? (
                <Check size={11} className="text-emerald-500 animate-in zoom-in" />
              ) : (
                <Copy size={11} />
              )}
            </button>
            <span className="whitespace-nowrap">≈ <span className={`font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>${usdEquiv}</span> USD</span>
          </div>
        </div>

        {/* 3D action buttons: Crypto Buy & Crypto Sell (Ultra-Premium Luxury Fintech 3D) */}
        <div className="relative z-10 grid grid-cols-2 gap-3 mt-7 pb-2">
          {/* 1. Crypto Buy Button */}
          <button
            type="button"
            onClick={onOpenBuyCrypto}
            className="tp-btn-3d relative overflow-hidden h-[54px] rounded-[20px] text-white cursor-pointer select-none"
            style={{
              background: 'linear-gradient(135deg, #7C3AED 0%, #6366F1 50%, #4338CA 100%)',
              '--tp-3d-edge': '#312E81',
              '--tp-3d-glow': 'rgba(99, 102, 241, 0.52)'
            }}
          >
            <span className="tp-sweep-beam" />
            <span className="relative z-10 flex items-center justify-center gap-2.5 px-3">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-b from-white/35 to-white/10 backdrop-blur-md border border-white/50 shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.7),0_2px_5px_rgba(0,0,0,0.2)] flex items-center justify-center shrink-0">
                <ArrowDownLeft size={16} strokeWidth={2.6} className="text-white drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.3)]" />
              </span>
              <span className="tp-shine-text text-[14.5px] font-extrabold tracking-wide">
                {lang === 'bn' ? 'ক্রিপ্টো ক্রয়' : 'Buy Crypto'}
              </span>
            </span>
          </button>

          {/* 2. Crypto Sell Button */}
          <button
            type="button"
            onClick={onGoToSell}
            className="tp-btn-3d relative overflow-hidden h-[54px] rounded-[20px] text-white cursor-pointer select-none"
            style={{
              background: 'linear-gradient(135deg, #EC4899 0%, #D946EF 50%, #9333EA 100%)',
              '--tp-3d-edge': '#701A75',
              '--tp-3d-glow': 'rgba(217, 70, 239, 0.5)'
            }}
          >
            <span className="tp-sweep-beam tp-sweep-delay" />
            <span className="relative z-10 flex items-center justify-center gap-2.5 px-3">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-b from-white/35 to-white/10 backdrop-blur-md border border-white/50 shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.7),0_2px_5px_rgba(0,0,0,0.2)] flex items-center justify-center shrink-0">
                <ArrowUpRight size={16} strokeWidth={2.6} className="text-white drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.3)]" />
              </span>
              <span className="tp-shine-text tp-sweep-delay text-[14.5px] font-extrabold tracking-wide">
                {lang === 'bn' ? 'ক্রিপ্টো বিক্রয়' : 'Sell Crypto'}
              </span>
            </span>
          </button>
        </div>
      </section>

      {/* =========================================================================
          WALLET SHEET — quick actions, coins, transactions (reference: right screen)
          (Recent-contacts / profile avatars row intentionally omitted)
          ========================================================================= */}
      <div className={`rounded-[30px] px-4 pt-5 pb-4 border ${
        darkMode
          ? 'bg-[#0D1322] border-white/[0.06] shadow-[0_10px_30px_rgba(0,0,0,0.35)]'
          : 'bg-white border-slate-100 shadow-[0_10px_30px_-12px_rgba(15,23,42,0.12)]'
      }`}>

        {/* Quick Actions */}
        <p className={`px-1 text-[12.5px] font-medium mb-3 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          {lang === 'bn' ? 'কুইক অ্যাকশন' : 'Quick Actions'}
        </p>
        <div className="grid grid-cols-4 gap-2">
          {quickActions.map((qa) => (
            <button
              key={qa.key}
              type="button"
              onClick={qa.onClick}
              className={`h-[74px] rounded-2xl flex flex-col items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer ${
                qa.active
                  ? 'bg-gradient-to-br from-indigo-500 via-violet-600 to-purple-500 text-white shadow-[0_10px_22px_-6px_rgba(124,58,237,0.55)]'
                  : (darkMode ? 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-200' : 'bg-slate-100/70 hover:bg-slate-100 text-slate-700')
              }`}
            >
              <qa.Icon size={19} strokeWidth={1.9} />
              <span className="text-[11px] font-medium">{qa.label}</span>
            </button>
          ))}
        </div>

        {/* Tabs + search */}
        <div className="flex items-center justify-between mt-5 mb-1">
          <div className={`flex items-center gap-1 p-1 rounded-full ${darkMode ? 'bg-white/[0.04]' : 'bg-slate-100/70'}`}>
            {[
              { id: 'all', label: lang === 'bn' ? 'সব' : 'All' },
              { id: 'coins', label: lang === 'bn' ? 'কয়েন' : 'Coins' },
              { id: 'activity', label: lang === 'bn' ? 'লেনদেন' : 'Activity' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`px-3.5 h-7 rounded-full text-[11.5px] font-semibold transition cursor-pointer ${
                  activeFilter === tab.id
                    ? 'bg-violet-600 text-white shadow-[0_4px_12px_-2px_rgba(124,58,237,0.5)]'
                    : (darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800')
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => { setShowSearch(!showSearch); if (showSearch) setSearchQuery(''); }}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition active:scale-90 cursor-pointer ${
              showSearch
                ? 'bg-violet-600 text-white'
                : (darkMode ? 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]' : 'bg-slate-100/70 text-slate-600 hover:bg-slate-100')
            }`}
            title="Search"
          >
            {showSearch ? <X size={15} /> : <Search size={15} />}
          </button>
        </div>

        {showSearch && (
          <input
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === 'bn' ? 'কয়েন খুঁজুন… (USDT, GRAM)' : 'Search coins… (USDT, GRAM)'}
            className={`w-full mt-2 h-10 px-4 rounded-full text-[12.5px] outline-none border transition ${
              darkMode
                ? 'bg-white/[0.04] border-white/10 text-white placeholder:text-slate-500 focus:border-violet-500'
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-violet-500'
            }`}
          />
        )}

        {/* Coins list (flat rows, no boxes) */}
        {activeFilter !== 'activity' && (
          <div className="mt-2">
            {visibleCoins.length === 0 ? (
              <p className="text-center text-[12px] text-slate-400 py-6">{lang === 'bn' ? 'কোনো কয়েন পাওয়া যায়নি' : 'No coins found'}</p>
            ) : visibleCoins.map((c) => (
              <button
                key={c.symbol}
                type="button"
                onClick={() => onOpenBuyCrypto && onOpenBuyCrypto(c.symbol)}
                className={`w-full flex items-center justify-between px-2 py-3 rounded-2xl text-left transition cursor-pointer ${
                  darkMode ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <c.Logo size={36} />
                  <div className="min-w-0">
                    <p className={`text-[14px] font-semibold leading-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>{c.symbol}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">{c.name}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-[14px] font-semibold leading-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>৳{c.buy}</p>
                  <p className="text-[11px] mt-0.5 text-slate-400">
                    {lang === 'bn' ? 'বিক্রয়' : 'Sell'} <span className="text-emerald-500 font-medium">৳{c.sell}</span>
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Transactions */}
        {activeFilter !== 'coins' && (
          <div className={`${activeFilter === 'all' ? `mt-3 pt-4 border-t ${darkMode ? 'border-white/[0.06]' : 'border-slate-100'}` : 'mt-3'}`}>
            <div className="flex items-center justify-between px-1 mb-1">
              <h4 className={`text-[14px] font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {lang === 'bn' ? 'সাম্প্রতিক লেনদেন' : 'Transactions'}
              </h4>
              <button
                type="button"
                onClick={onGoToHistory}
                className={`text-[11.5px] font-medium flex items-center gap-0.5 cursor-pointer ${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
              >
                {lang === 'bn' ? 'সব দেখুন' : 'See all'} <ChevronRight size={14} />
              </button>
            </div>

            {recentTx.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-7 text-center">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center mb-2 ${darkMode ? 'bg-white/[0.05] text-slate-500' : 'bg-slate-100 text-slate-400'}`}>
                  <Clock size={18} />
                </div>
                <p className={`text-[12.5px] font-medium ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  {lang === 'bn' ? 'এখনো কোনো লেনদেন নেই' : 'No transactions yet'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {lang === 'bn' ? 'আপনার ডিপোজিট, ক্রয়-বিক্রয় এখানে দেখাবে' : 'Your deposits, buys & sells will appear here'}
                </p>
              </div>
            ) : (
              <div>
                {recentTx.map((tx, i) => {
                  const d = getTxView(tx);
                  return (
                    <div key={tx.id || i} className="flex items-center justify-between px-1 py-2.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${d.iconWrap}`}>
                          <d.Icon size={17} strokeWidth={2} />
                        </div>
                        <div className="min-w-0">
                          <p className={`text-[13px] font-semibold leading-tight truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>{d.title}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[150px]">{d.subtitle}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 pl-2">
                        <p className={`text-[13px] font-semibold leading-tight ${d.amountClass}`}>{d.amountText}</p>
                        <p className="text-[10.5px] text-slate-400 mt-0.5">{d.status === 'pending' || d.status === 'waiting' ? (lang === 'bn' ? 'প্রক্রিয়াধীন' : 'Pending') : d.dateText}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
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




function AddMoneyPage({ 
    user, 
    balance = 0,
    lang = 'bn', 
    t, 
    darkMode = false,
    onDone, 
    onGoToBuyCrypto, 
    reloadData 
}) {
    const [step, setStep] = useState(1);
    const [amount, setAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('bKash'); // 'bKash' | 'Nagad'
    const [isMethodDropdownOpen, setIsMethodDropdownOpen] = useState(false);
    const [trxId, setTrxId] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [copied, setCopied] = useState(false);
    const [pastedFeedback, setPastedFeedback] = useState(false);
    const [adminBkash, setAdminBkash] = useState("01752561935");
    const [adminNagad, setAdminNagad] = useState("9856000927953436");
    const [depositResult, setDepositResult] = useState(null);

    useEffect(() => {
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname.includes('192.168');
        const API_URL = isLocal ? 'http://localhost:3000' : 'https://maruf-teach-bot.onrender.com';
        fetch(`${API_URL}/api/settings`)
            .then(res => res.json())
            .then(data => {
                if (data.adminBkash) setAdminBkash(data.adminBkash);
                if (data.adminNagad && data.adminNagad !== '01878580320') setAdminNagad(data.adminNagad);
            }).catch(e => console.log(e));
    }, []);

    const adminNumber = paymentMethod === 'bKash' ? adminBkash : adminNagad;

    const handleCopy = () => {
        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(adminNumber);
        }
        setCopied(true);
        if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
        setTimeout(() => setCopied(false), 2000);
    };

    const quickAmounts = [20, 50, 100, 500, 1000, 2000, 5000];

    const extractCleanTrxId = (raw) => {
        if (!raw) return '';
        const str = String(raw).trim();
        const match = str.match(/(?:TrxID|TxnId|TxnID|TrxId|Txn\s*ID|Trx\s*ID|Transaction\s*ID)[\s:.\-_=]*([A-Za-z0-9]{5,25})/i);
        if (match && match[1]) return match[1].toUpperCase();
        return str.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    };

    const handlePasteTrxId = async () => {
        const applyText = (raw) => {
            if (!raw) return;
            const clean = extractCleanTrxId(raw);
            if (clean) {
                setTrxId(clean);
                setPastedFeedback(true);
                if (errorMessage) setErrorMessage('');
                if (window.Telegram?.WebApp?.HapticFeedback) {
                    window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
                }
                setTimeout(() => setPastedFeedback(false), 2000);
            }
        };

        // 1. First priority: Telegram WebApp official clipboard reader (triggers native Telegram permission prompt)
        if (window.Telegram?.WebApp?.readTextFromClipboard) {
            try {
                window.Telegram.WebApp.readTextFromClipboard((clip) => {
                    if (clip && clip.trim()) {
                        applyText(clip);
                    } else {
                        fallbackStandard();
                    }
                });
                return;
            } catch (e) {
                console.log("readTextFromClipboard error:", e);
            }
        }

        fallbackStandard();

        async function fallbackStandard() {
            // 2. Browser standard navigator.clipboard.readText()
            if (navigator.clipboard?.readText) {
                try {
                    const text = await navigator.clipboard.readText();
                    if (text && text.trim()) {
                        applyText(text);
                        return;
                    }
                } catch (err) {
                    console.log("navigator.clipboard error:", err);
                }
            }

            // 3. Fallback: prompt dialog so the user can easily paste without being blocked by browser sandbox
            const manual = window.prompt(lang === 'bn' ? 'আপনার TrxID এখানে পেস্ট করুন:' : 'Paste your TrxID here:');
            if (manual && manual.trim()) {
                applyText(manual);
            }
        }
    };

    const handleSubmit = async () => {
        const cleanAmt = parseFloat(String(amount || '').replace(/,/g, '').trim());
        if (!cleanAmt || isNaN(cleanAmt) || cleanAmt < 20) {
            setErrorMessage(lang === 'bn' ? 'অনুগ্রহ করে নূন্যতম ২০ টাকা বা তার বেশি দিন' : 'Please enter at least 20 BDT');
            if (window.Telegram?.WebApp?.HapticFeedback) {
                window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
            }
            return;
        }

        const cleanId = extractCleanTrxId(trxId);
        if (!cleanId || cleanId.length < 4) {
            setErrorMessage(lang === 'bn' ? 'অনুগ্রহ করে সঠিক Transaction ID দিন' : 'Please enter a valid Transaction ID');
            if (window.Telegram?.WebApp?.HapticFeedback) {
                window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
            }
            return;
        }

        setTrxId(cleanId);
        setLoading(true);
        setErrorMessage('');
        try {
            const res = await submitAddMoney({
                userId: user?.id || 123456789,
                amount: cleanAmt,
                paymentMethod,
                trxId: cleanId
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
                setErrorMessage(res.error || (lang === 'bn' ? 'ভেরিফিকেশন ব্যর্থ হয়েছে' : 'Verification failed'));
                if (window.Telegram?.WebApp?.HapticFeedback) {
                    window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
                }
            }
        } catch (e) {
            setErrorMessage(e.message || (lang === 'bn' ? 'ভুল বা আনভেরিফাইড TrxID! টাকা পাঠিয়ে সঠিক TrxID দিন।' : 'Invalid or unverified TrxID!'));
            if (window.Telegram?.WebApp?.HapticFeedback) {
                window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
            }
        } finally {
            setLoading(false);
        }
    };

    // STEP 3: SUCCESS RECEIPT
    if (step === 3) {
        return (
            <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500 p-2 text-center pb-24 max-w-sm mx-auto">
                <div className={`p-6 text-center space-y-4 rounded-3xl border shadow-xl w-full ${
                    darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
                }`}>
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto shadow-inner">
                        <Check size={36} strokeWidth={3} />
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60 text-[11px] font-black uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        <Sparkles size={12} />
                        {lang === 'bn' ? 'অটো-ভেরিফাইড সফল' : 'AUTO-VERIFIED'}
                    </div>

                    <div>
                        <h2 className="text-xl font-black tracking-tight mb-1">
                            ৳{amount} BDT Added! 🎉
                        </h2>
                        <p className="text-slate-400 text-xs max-w-[280px] mx-auto leading-relaxed">
                            {lang === 'bn' 
                                ? 'আপনার পেমেন্ট SMS দ্বারা সাথে সাথে অটো-ভেরিফাই হয়েছে এবং ব্যালেন্সে যোগ হয়েছে।' 
                                : 'Your payment has been auto-verified via SMS and credited to your balance.'}
                        </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-800 text-left space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400 font-medium">Transaction ID</span>
                            <span className="font-mono font-bold bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">{trxId}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400 font-medium">Payment Method</span>
                            <span className="font-bold">{paymentMethod}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400 font-medium">Amount Deposited</span>
                            <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">৳{amount} BDT</span>
                        </div>
                    </div>

                    <div className="space-y-2.5 pt-2">
                        <button
                            type="button"
                            onClick={onGoToBuyCrypto}
                            className="w-full h-[50px] rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95 transition-all"
                            style={{
                                background: 'linear-gradient(135deg, #7C3AED 0%, #6366F1 50%, #4338CA 100%)'
                            }}
                        >
                            <Coins size={16} />
                            <span>{t?.buyCrypto || (lang === 'bn' ? 'ক্রিপ্টো কিনুন' : 'BUY CRYPTO NOW')}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setStep(1);
                                setAmount('');
                                setTrxId('');
                                setErrorMessage('');
                                onDone();
                            }}
                            className="w-full h-[46px] rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all cursor-pointer"
                        >
                            {lang === 'bn' ? 'হোমে ফিরে যান' : 'BACK TO HOME'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // SINGLE STEP EXECUTIVE ADD MONEY CARD
    return (
        <div className="space-y-3.5 animate-in fade-in slide-in-from-right-4 duration-300 pb-24 max-w-md mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2.5">
                    <button
                        type="button"
                        onClick={onDone}
                        className="w-9 h-9 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-xs border border-slate-200 dark:border-slate-800 active:scale-95 transition-transform text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                        <ChevronRight size={18} className="rotate-180" strokeWidth={2.5} />
                    </button>
                    <div>
                        <h2 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                            {lang === 'bn' ? 'টাকা যোগ করুন' : 'Add Money'}
                        </h2>
                        <p className="text-[10.5px] text-slate-400 font-medium leading-none">
                            {lang === 'bn' ? 'ইনস্ট্যান্ট ব্যালেন্স রিচার্জ (bKash / Nagad)' : 'Instant Balance Top-up'}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 block">{lang === 'bn' ? 'ব্যালেন্স' : 'Balance'}</span>
                    <span className="text-xs font-black font-mono text-purple-600 dark:text-purple-400">৳{Number(balance || 0).toFixed(2)}</span>
                </div>
            </div>

            {/* Unified Single Executive Card */}
            <div className={`p-4 sm:p-5 rounded-3xl border shadow-xs space-y-4 ${
                darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200/90 text-slate-900'
            }`}>
                {/* 1. Payment Method Dropdown Selector */}
                <div>
                    <label className="text-xs font-black uppercase tracking-wider block mb-1.5 text-slate-600 dark:text-slate-400">
                        {lang === 'bn' ? 'পেমেন্ট মেথড বাছুন' : 'Select Payment Method'}
                    </label>
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setIsMethodDropdownOpen(!isMethodDropdownOpen)}
                            className={`w-full p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                                darkMode ? 'bg-slate-800/40 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                            }`}
                        >
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-white p-1 border border-slate-200/90 flex items-center justify-center shrink-0 shadow-2xs">
                                    <img
                                        src={getPaymentLogo(paymentMethod)}
                                        alt={paymentMethod}
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <span className="font-black text-sm">{paymentMethod}</span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                    Personal Send Money
                                </span>
                            </div>
                            <ChevronDown size={18} className={`text-slate-400 transition-transform ${isMethodDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown Options */}
                        {isMethodDropdownOpen && (
                            <div className={`absolute left-0 right-0 top-full mt-1.5 rounded-2xl border shadow-xl z-30 p-1.5 space-y-1 ${
                                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                            }`}>
                                {['bKash', 'Nagad'].map(method => (
                                    <button
                                        key={method}
                                        type="button"
                                        onClick={() => {
                                            setPaymentMethod(method);
                                            setIsMethodDropdownOpen(false);
                                        }}
                                        className={`w-full p-2.5 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                                            paymentMethod === method
                                                ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 font-black'
                                                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-7 h-7 rounded-lg bg-white p-0.5 border border-slate-200/90 flex items-center justify-center shrink-0 shadow-2xs">
                                                <img
                                                    src={getPaymentLogo(method)}
                                                    alt={method}
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>
                                            <span className="text-xs">{method}</span>
                                        </div>
                                        {paymentMethod === method && <Check size={16} className="text-purple-600 dark:text-purple-400" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. Receiver Account Number with One-Click Copy */}
                <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                    darkMode ? 'bg-slate-800/30 border-slate-700/80' : 'bg-indigo-50/50 border-indigo-100'
                }`}>
                    <div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                            <span>{paymentMethod} {lang === 'bn' ? 'নাম্বার (Send Money):' : 'Number:'}</span>
                        </div>
                        <div className="text-base sm:text-lg font-black font-mono tracking-wider mt-0.5 text-slate-900 dark:text-white">
                            {adminNumber}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleCopy}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs ${
                            copied
                                ? 'bg-emerald-600 text-white shadow-emerald-500/25'
                                : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:opacity-95'
                        }`}
                    >
                        {copied ? (
                            <>
                                <Check size={13} />
                                <span>{lang === 'bn' ? 'কপি হয়েছে!' : 'Copied!'}</span>
                            </>
                        ) : (
                            <>
                                <Copy size={13} />
                                <span>{lang === 'bn' ? 'কপি করুন' : 'Copy'}</span>
                            </>
                        )}
                    </button>
                </div>

                {/* 3. Deposit Amount Input & Quick Pills (Minimum 20 BDT) */}
                <div>
                    <label className="text-xs font-black uppercase tracking-wider block mb-1.5 text-slate-600 dark:text-slate-400">
                        {lang === 'bn' ? 'টাকার পরিমাণ (BDT) • নূন্যতম ২০ টাকা' : 'Deposit Amount (Min. 20 BDT)'}
                    </label>
                    <div className={`relative flex items-center rounded-2xl border transition-all p-3 ${
                        darkMode ? 'bg-slate-800/40 border-slate-700 focus-within:border-purple-500' : 'bg-slate-50 border-slate-200 focus-within:border-purple-500 focus-within:bg-white'
                    }`}>
                        <input
                            type="number"
                            value={amount}
                            onChange={e => {
                                setAmount(e.target.value);
                                if (errorMessage) setErrorMessage('');
                            }}
                            placeholder="Min. 20 BDT"
                            style={{ color: darkMode ? '#ffffff' : '#0f172a' }}
                            className="w-full bg-transparent text-xl font-black font-mono tracking-tight outline-none pr-14 placeholder:text-xs placeholder:font-normal placeholder:text-slate-400"
                        />
                        <span className="absolute right-3.5 font-black text-xs text-slate-400">
                            BDT
                        </span>
                    </div>

                    {/* Quick Amount Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar mt-2">
                        {quickAmounts.map(val => (
                            <button
                                key={val}
                                type="button"
                                onClick={() => {
                                    setAmount(val.toString());
                                    if (errorMessage) setErrorMessage('');
                                }}
                                className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                                    amount === val.toString()
                                        ? 'bg-purple-500/15 border-purple-500 text-purple-600 dark:text-purple-400 font-black'
                                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-purple-300'
                                }`}
                            >
                                ৳{val}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 4. TrxID Input & Sleek Paste Button with Telegram Permission */}
                <div>
                    <label className="text-xs font-black uppercase tracking-wider block mb-1.5 text-slate-600 dark:text-slate-400">
                        Transaction ID (TrxID)
                    </label>
                    <div className={`relative flex items-center rounded-2xl border transition-all p-3 ${
                        darkMode ? 'bg-slate-800/40 border-slate-700 focus-within:border-purple-500' : 'bg-slate-50 border-slate-200 focus-within:border-purple-500 focus-within:bg-white'
                    }`}>
                        <input
                            type="text"
                            value={trxId}
                            onChange={e => {
                                setTrxId(e.target.value.toUpperCase());
                                if (errorMessage) setErrorMessage('');
                            }}
                            placeholder="e.g. 9J26XYZ789"
                            style={{ color: darkMode ? '#ffffff' : '#0f172a' }}
                            className="w-full bg-transparent text-sm font-mono font-bold uppercase tracking-wider outline-none pr-24 placeholder:text-xs placeholder:font-normal placeholder:text-slate-400"
                        />
                        <button
                            type="button"
                            onClick={handlePasteTrxId}
                            className={`absolute right-2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-xs select-none ${
                                pastedFeedback
                                    ? 'bg-emerald-500 text-white shadow-emerald-500/25'
                                    : 'bg-purple-500/15 hover:bg-purple-500/25 text-purple-600 dark:text-purple-400 border border-purple-500/25'
                            }`}
                            title={lang === 'bn' ? 'ক্লিপবোর্ড থেকে পেস্ট করুন' : 'Paste from clipboard'}
                        >
                            {pastedFeedback ? (
                                <>
                                    <Check size={13} strokeWidth={3} className="animate-in zoom-in" />
                                    <span>{lang === 'bn' ? 'পেস্ট হয়েছে!' : 'Pasted!'}</span>
                                </>
                            ) : (
                                <>
                                    <Clipboard size={13} strokeWidth={2.5} />
                                    <span>{lang === 'bn' ? 'পেস্ট' : 'Paste'}</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Quick Guidance */}
                <div className={`p-2.5 rounded-xl border text-[11px] leading-relaxed ${
                    darkMode ? 'bg-slate-800/20 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200/80 text-slate-600'
                }`}>
                    <p className="font-bold text-slate-700 dark:text-slate-300">
                        {lang === 'bn' ? 'সহজ নিয়ম:' : 'Simple steps:'}
                    </p>
                    <p>
                        {lang === 'bn' 
                            ? `১. ${paymentMethod} অ্যাপ থেকে উপরের নাম্বারে Send Money করুন। ২. প্রাপ্ত TrxID এখানে দিয়ে নিচে কনফার্ম করুন।` 
                            : `1. Send Money from ${paymentMethod} to number above. 2. Enter TrxID and confirm.`}
                    </p>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                    <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl p-2.5 flex items-start gap-2">
                        <AlertCircle size={15} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-red-700 dark:text-red-300 font-medium leading-tight">{errorMessage}</p>
                    </div>
                )}

                {/* 5. Sleek 3D Purple Button (Standard h-[50px] height) */}
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading || !amount || !trxId}
                    className="w-full h-[50px] rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 text-white font-black text-sm shadow-[0_4px_16px_rgba(124,58,237,0.35)] hover:opacity-95 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            <span>{lang === 'bn' ? 'ভেরিফাই করা হচ্ছে...' : 'Verifying...'}</span>
                        </>
                    ) : (
                        <>
                            <Zap size={18} fill="currentColor" />
                            <span>{lang === 'bn' ? 'কনফার্ম ডিপোজিট' : 'Confirm Deposit'}</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

function NetworkBadgeIcon({ network, size = 20, className = '' }) {
    const id = String(network || 'TON').toUpperCase();
    if (id === 'TON') {
        return (
            <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={`shrink-0 ${className}`}>
                <defs>
                    <linearGradient id="tonGradMini" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#0098EA" />
                        <stop offset="100%" stopColor="#0066CC" />
                    </linearGradient>
                </defs>
                <circle cx="24" cy="24" r="24" fill="url(#tonGradMini)" />
                <path d="M32.8 14.5H15.2C12.9 14.5 11.5 16.9 12.6 18.9L22.6 36.2C23.2 37.3 24.8 37.3 25.4 36.2L35.4 18.9C36.5 16.9 35.1 14.5 32.8 14.5ZM22.4 31.1L15.7 19.3C15.3 18.6 15.8 17.7 16.6 17.7H22.4V31.1ZM32.3 19.3L25.6 31.1V17.7H31.4C32.2 17.7 32.7 18.6 32.3 19.3Z" fill="white" />
            </svg>
        );
    }
    if (id === 'BEP20' || id === 'BSC') {
        return (
            <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={`shrink-0 ${className}`}>
                <defs>
                    <linearGradient id="bnbGradMini" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#F3BA2F" />
                        <stop offset="100%" stopColor="#D99A0B" />
                    </linearGradient>
                </defs>
                <circle cx="24" cy="24" r="24" fill="url(#bnbGradMini)" />
                <path d="M19.1 21.2L24 16.3L28.9 21.2L31.8 18.3L24 10.5L16.2 18.3L19.1 21.2ZM13.4 24L16.3 21.1L19.2 24L16.3 26.9L13.4 24ZM19.1 26.8L24 31.7L28.9 26.8L31.8 29.7L24 37.5L16.2 29.7L19.1 26.8ZM28.8 24L31.7 21.1L34.6 24L31.7 26.9L28.8 24ZM26.9 24L24 21.1L21.1 24L24 26.9L26.9 24Z" fill="#111318" />
            </svg>
        );
    }
    if (id === 'ARBITRUM' || id === 'ARB' || id === 'ARBITRUM ONE') {
        return (
            <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={`shrink-0 ${className}`}>
                <defs>
                    <linearGradient id="arbBgMini" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#1E3A8A" />
                        <stop offset="100%" stopColor="#0F172A" />
                    </linearGradient>
                </defs>
                <circle cx="24" cy="24" r="24" fill="url(#arbBgMini)" />
                <path d="M24 7L38 15V33L24 41L10 33V15L24 7Z" stroke="#28A0F0" strokeWidth="2.4" fill="#162B5B" />
                <path d="M24.8 14.5L16.5 32.5H20.8L27.2 18.5L24.8 14.5Z" fill="white" />
                <path d="M26.5 22.2L22.5 31.5L25.2 35.2L30.2 24.5L26.5 22.2Z" fill="#28A0F0" />
                <path d="M29.4 17.5L27.5 21.5L32.2 32.5H35.5L29.4 17.5Z" fill="#38BDF8" />
            </svg>
        );
    }
    return null;
}

const BUY_USDT_NETWORKS = [
    {
        id: 'TON',
        name: 'TON',
        fullName: 'TON (The Open Network)',
        badge: 'Default (ইনস্ট্যান্ট)',
        shortDesc: 'Jetton USDT • Direct On-Chain',
        isEvm: false,
        placeholder: 'UQ... or EQ... (TON Address)',
        labelBn: 'রিসিভ ওয়ালেট এড্রেস (TON)',
        helperBn: 'আপনার Tonkeeper বা Telegram Wallet এড্রেস দিন'
    },
    {
        id: 'BEP20',
        name: 'BEP 20',
        fullName: 'BNB Smart Chain (BEP20)',
        badge: 'BSC Network',
        shortDesc: 'Low Gas Fee • 0x... Address',
        isEvm: true,
        placeholder: '0x... (BNB Smart Chain Address)',
        labelBn: 'রিসিভ ওয়ালেট এড্রেস (BEP20 - BSC)',
        helperBn: 'Trust Wallet, MetaMask বা Binance-এর BEP20 USDT এড্রেস দিন (0x...)'
    },
    {
        id: 'ARBITRUM',
        name: 'ARBITRUM ONE',
        fullName: 'Arbitrum One (ARB)',
        badge: 'Arbitrum L2',
        shortDesc: 'Ethereum L2 • 0x... Address',
        isEvm: true,
        placeholder: '0x... (Arbitrum One Address)',
        labelBn: 'রিসিভ ওয়ালেট এড্রেস (Arbitrum One)',
        helperBn: 'Trust Wallet, MetaMask বা Binance-এর Arbitrum One USDT এড্রেস দিন (0x...)'
    }
];

// REALTIME FULL-PAGE BUY CRYPTO (Live On-Chain Payout from User BDT Balance)
function OnChainHelpModal({ isOpen, onClose, network = 'TON', lang = 'bn', darkMode = false }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className={`w-full max-w-sm rounded-3xl p-5 border shadow-2xl relative animate-in zoom-in-95 duration-200 ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <HelpCircle size={24} />
          </div>
          <div>
            <h3 className="text-base font-black leading-tight">
              {lang === 'bn' ? 'অন-চেইন ট্রান্সফার নির্দেশিকা' : 'On-Chain Transfer Guide'}
            </h3>
            <p className="text-[11px] text-slate-400">
              {lang === 'bn' ? 'সুরক্ষিত ও দ্রুত ক্রিপ্টো লেনদেন' : 'Secure & instant crypto processing'}
            </p>
          </div>
        </div>

        <div className={`space-y-2.5 p-3.5 rounded-2xl text-xs border mb-4 ${
          darkMode ? 'bg-slate-800/40 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200/80 text-slate-700'
        }`}>
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">১</span>
            <p className="leading-snug">
              <b>{lang === 'bn' ? 'সঠিক নেটওয়ার্ক বাছুন:' : 'Select Network:'}</b> {lang === 'bn' ? 'বর্তমানে নির্বাচিত নেটওয়ার্ক হলো' : 'Currently selected network is'} <span className="font-mono font-bold text-purple-600 dark:text-purple-400">{network}</span>।
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">২</span>
            <p className="leading-snug">
              <b>{lang === 'bn' ? 'রিসিভ এড্রেস:' : 'Receive Address:'}</b> {lang === 'bn' ? 'আপনার পছন্দের ওয়ালেট (Tonkeeper / Telegram Wallet / Trust Wallet / Binance) থেকে Deposit এড্রেস দিন।' : 'Get the receive address from your personal wallet.'}
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">৩</span>
            <p className="leading-snug">
              <b>{lang === 'bn' ? 'সতর্কতা:' : 'Notice:'}</b> {lang === 'bn' ? 'ভুল এড্রেস বা অন্য নেটওয়ার্কের এড্রেস দিলে ফান্ড পুনরুদ্ধার করা অসম্ভব।' : 'Sending to wrong network/address cannot be recovered.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full h-[46px] rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 text-white font-black text-sm shadow-md active:scale-95 transition-all cursor-pointer"
        >
          {lang === 'bn' ? 'ঠিক আছে, বুঝেছি' : 'Got it'}
        </button>
      </div>
    </div>
  );
}

function OnChainTransferProgressModal({
  isOpen,
  stage = 'verifying', // 'verifying' | 'transferring' | 'success' | 'error'
  asset = 'GRAM',
  amount = 0,
  targetAddress = '',
  network = 'TON',
  isBuy = true,
  errorMessage = '',
  onClose,
  onRetryCheck = null,
  lang = 'bn',
  darkMode = false
}) {
  const [progressPercent, setProgressPercent] = useState(30);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!isOpen) {
      setProgressPercent(30);
      setCountdown(3);
      return;
    }
    if (stage === 'verifying') {
      setProgressPercent(40);
    } else if (stage === 'transferring') {
      const interval = setInterval(() => {
        setProgressPercent(p => (p < 90 ? p + 5 : p));
      }, 250);
      return () => clearInterval(interval);
    } else if (stage === 'success') {
      setProgressPercent(100);
      setCountdown(3);
      const timer = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) {
            clearInterval(timer);
            onClose();
            return 0;
          }
          return c - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isOpen, stage, onClose]);

  if (!isOpen) return null;

  const truncatedAddress = targetAddress && targetAddress.length > 12 
    ? `${targetAddress.slice(0, 6)}...${targetAddress.slice(-4)}`
    : targetAddress || 'Wallet';

  const assetLogo = asset === 'USDT' ? 'usdt.svg' : 'gram.svg';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
      <style>{`
        @keyframes tpDrawCheck {
          0% { stroke-dashoffset: 48; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes tpPulseHalo {
          0%, 100% { transform: scale(1); opacity: 0.35; }
          50% { transform: scale(1.18); opacity: 0.15; }
        }
      `}</style>
      <div className={`w-full max-w-sm rounded-[32px] p-6 sm:p-7 border shadow-2xl relative text-center overflow-hidden animate-in zoom-in-95 duration-300 ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200/90 text-slate-900'
      }`}>
        {/* Soft luxury ambient glow */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 rounded-full blur-3xl pointer-events-none ${
          stage === 'success' ? 'bg-emerald-500/20' : stage === 'error' ? 'bg-rose-500/20' : 'bg-purple-500/20'
        }`} />

        {stage === 'success' ? (
          /* =========================================================================
             ULTRA-PREMIUM SUCCESS STATE WITH ANIMATED TICK MARK
             ========================================================================= */
          <div className="py-2 space-y-4 animate-in zoom-in-90 duration-300 relative z-10">
            {/* The Luxury Checkmark Emblem */}
            <div className="relative mx-auto my-3 w-24 h-24 flex items-center justify-center">
              {/* Pulsing Outer Aura */}
              <div 
                className="absolute inset-0 rounded-full bg-emerald-500/25"
                style={{ animation: 'tpPulseHalo 2s ease-in-out infinite' }}
              />
              {/* Concentric Glow Ring */}
              <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-emerald-500/30 to-teal-400/30 blur-sm" />
              
              {/* Solid Luxury Emblem */}
              <div className="w-22 h-22 rounded-full bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 p-[3px] shadow-[0_12px_36px_rgba(16,185,129,0.45)] relative flex items-center justify-center">
                <div className="w-full h-full rounded-full bg-emerald-600/95 dark:bg-emerald-500/95 flex items-center justify-center">
                  <svg className="w-12 h-12 text-white drop-shadow-md" viewBox="0 0 52 52" fill="none">
                    <circle cx="26" cy="26" r="23" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
                    <path 
                      d="M14 27l8 8 16-17" 
                      stroke="white" 
                      strokeWidth="4.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      style={{
                        strokeDasharray: 48,
                        strokeDashoffset: 0,
                        animation: 'tpDrawCheck 0.45s ease-out forwards'
                      }} 
                    />
                  </svg>
                </div>
              </div>

              {/* Gold & Diamond Sparkle Stars */}
              <div className="absolute -top-1 -right-1 text-amber-300 drop-shadow animate-bounce">
                <Sparkles size={20} fill="currentColor" />
              </div>
              <div className="absolute -bottom-1 -left-1 text-emerald-300 drop-shadow animate-pulse">
                <Sparkles size={16} fill="currentColor" />
              </div>
            </div>

            <div>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Check size={13} strokeWidth={3} />
                {lang === 'bn' ? 'অন-চেইন সফল' : 'On-Chain Verified'}
              </span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-2">
                {lang === 'bn' ? (isBuy ? 'ক্রিপ্টো ক্রয় সম্পন্ন!' : 'ক্রিপ্টো বিক্রয় সম্পন্ন!') : (isBuy ? 'Purchase Complete!' : 'Sale Complete!')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {lang === 'bn' ? 'ব্লকচেইনে স্বয়ংক্রিয়ভাবে লেনদেন সফল হয়েছে' : 'Successfully confirmed on blockchain'}
              </p>
            </div>

            {/* Executive Receipt Card */}
            <div className={`p-4 rounded-2xl border transition-all my-2 ${
              darkMode ? 'bg-slate-800/60 border-slate-700/80' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="text-2xl font-black font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
                +{amount} {asset}
              </div>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1 truncate">
                {isBuy ? `Sent to ${truncatedAddress}` : 'ব্যালেন্সে সরাসরি টাকা যোগ হয়েছে'}
              </p>
            </div>

            {/* Auto-closing Countdown Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-1000 ease-linear rounded-full"
                  style={{ width: `${(countdown / 3) * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-400">
                <Clock size={12} className="text-emerald-500" />
                <span>{lang === 'bn' ? `${countdown} সেকেন্ডে অটো বন্ধ হচ্ছে...` : `Auto-closing in ${countdown}s...`}</span>
              </div>
            </div>
          </div>
        ) : stage === 'error' ? (
          /* =========================================================================
             DIGNIFIED ERROR STATE (WITH RE-CHECK BUTTON)
             ========================================================================= */
          <div className="py-2 space-y-4 animate-in zoom-in-90 duration-200 relative z-10">
            <div className="w-18 h-18 rounded-full bg-rose-500/15 border-2 border-rose-500/30 text-rose-500 flex items-center justify-center mx-auto shadow-[0_8px_30px_rgba(244,63,94,0.3)]">
              <AlertCircle size={40} />
            </div>
            <div>
              <h3 className="text-xl font-black text-rose-600">
                {lang === 'bn' ? 'লেনদেন সম্পন্ন হয়নি' : 'Transaction Incomplete'}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 px-2 leading-relaxed">
                {errorMessage || (lang === 'bn' ? 'অনুগ্রহ করে আবার চেষ্টা করুন।' : 'Please try again.')}
              </p>
            </div>

            <div className="space-y-2 pt-2">
              {onRetryCheck && (
                <button
                  type="button"
                  onClick={onRetryCheck}
                  className="w-full h-[46px] rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-xs shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <RefreshCw size={15} />
                  <span>{lang === 'bn' ? 'ডিপোজিট চেক করুন' : 'Check Deposit On-Chain'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-full h-[44px] rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer active:scale-95 transition-all"
              >
                {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>
          </div>
        ) : (
          /* =========================================================================
             HIGH-END PROCESSING STATE (ORBITAL GLOW & CLEAN FINTECH ROUTING)
             ========================================================================= */
          <div className="py-2 space-y-5 relative z-10">
            {/* Center Orbital Crypto Token */}
            <div className="relative mx-auto my-2 w-20 h-20 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-purple-500/40 animate-spin" style={{ animationDuration: '6s' }} />
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-violet-500 p-[2px] shadow-[0_8px_30px_rgba(147,51,234,0.35)] flex items-center justify-center">
                <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center">
                  <img 
                    src={`${import.meta.env.BASE_URL}${assetLogo}`} 
                    alt={asset} 
                    className="w-9 h-9 object-contain rounded-full drop-shadow" 
                  />
                </div>
              </div>
            </div>

            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-black uppercase tracking-wider bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-200/50 dark:border-purple-800/50">
                <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping inline-block" />
                {stage === 'verifying' ? (lang === 'bn' ? 'যাচাই করা হচ্ছে...' : 'Verifying Network...') : (lang === 'bn' ? 'অন-চেইন ব্রডকাস্ট...' : 'Broadcasting On-Chain...')}
              </span>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mt-2">
                {isBuy ? (lang === 'bn' ? 'ক্রিপ্টো পাঠানো হচ্ছে' : 'Sending Crypto') : (lang === 'bn' ? 'পেমেন্ট প্রসেসিং হচ্ছে' : 'Processing Sell')}
              </h3>
              <p className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400 mt-0.5">
                {amount} {asset} ({network})
              </p>
            </div>

            {/* Apple Pay Style Smooth Gradient Shimmer Bar */}
            <div className="space-y-1.5">
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                <div 
                  className="h-full bg-gradient-to-r from-purple-600 via-indigo-500 to-emerald-400 transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[10.5px] font-bold text-slate-400">
                <span>Routing to {truncatedAddress}</span>
                <span className="font-mono text-purple-600 dark:text-purple-400">{progressPercent}%</span>
              </div>
            </div>

            {/* Clean Real-Time Checklist */}
            <div className={`p-3.5 rounded-2xl border text-left space-y-2 text-xs ${
              darkMode ? 'bg-slate-800/40 border-slate-700/60' : 'bg-slate-50 border-slate-200/80'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                  progressPercent >= 35 ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                }`}>✓</div>
                <span className={progressPercent >= 35 ? 'font-bold text-slate-800 dark:text-slate-200' : 'text-slate-400'}>
                  {lang === 'bn' ? 'সিকিউর নোড কানেকশন' : 'Secure node connection'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                  progressPercent >= 65 ? 'bg-emerald-500 text-white' : progressPercent >= 35 ? 'bg-purple-600 text-white animate-spin' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                }`}>
                  {progressPercent >= 65 ? '✓' : '•'}
                </div>
                <span className={progressPercent >= 65 ? 'font-bold text-slate-800 dark:text-slate-200' : 'text-slate-400'}>
                  {lang === 'bn' ? 'স্মার্ট কন্ট্রাক্ট অন-চেইন ব্রডকাস্ট' : 'Smart contract broadcast'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                  progressPercent >= 100 ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                }`}>
                  {progressPercent >= 100 ? '✓' : '•'}
                </div>
                <span className={progressPercent >= 100 ? 'font-bold text-emerald-600' : 'text-slate-400'}>
                  {lang === 'bn' ? 'ব্লকচেইন কনফার্মেশন সম্পন্ন' : 'Blockchain confirmation complete'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BuyCryptoPage({ user, balance = 0, lang = 'bn', t, reloadData, onGoToAddMoney, onBack, initialAsset = 'GRAM', darkMode = false }) {
    const userTonAddress = useTonAddress();
    const [selectedAsset, setSelectedAsset] = useState(() => (initialAsset === 'USDT' ? 'USDT' : 'GRAM'));
    const [selectedNetwork, setSelectedNetwork] = useState('TON'); // 'TON' | 'ARBITRUM' | 'BEP20'
    const [isNetworkDropdownOpen, setIsNetworkDropdownOpen] = useState(false);
    const [bdtAmount, setBdtAmount] = useState('');
    const [receiveAddress, setReceiveAddress] = useState(() => {
        if (userTonAddress) return userTonAddress;
        try {
            return localStorage.getItem('tp_saved_evm_addr') || '';
        } catch (_) {
            return '';
        }
    });
    const [destMode, setDestMode] = useState(() => (userTonAddress ? 'connected' : 'custom'));
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [transferStage, setTransferStage] = useState('verifying'); // 'verifying' | 'transferring' | 'success' | 'error'
    const [memo, setMemo] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [txResult, setTxResult] = useState(null);

    // Automatically synchronize connected TON wallet or saved EVM address
    useEffect(() => {
        if (selectedNetwork === 'TON') {
            if (userTonAddress) {
                setReceiveAddress(userTonAddress);
                setDestMode('connected');
            }
        } else {
            const savedEvm = localStorage.getItem('tp_saved_evm_addr');
            if (savedEvm) {
                setReceiveAddress(savedEvm);
                setDestMode('custom');
            } else if (receiveAddress === userTonAddress) {
                setReceiveAddress('');
            }
        }
    }, [selectedNetwork, userTonAddress]);

    useEffect(() => {
        if (initialAsset) setSelectedAsset(initialAsset === 'USDT' ? 'USDT' : 'GRAM');
    }, [initialAsset]);

    useEffect(() => {
        if (selectedAsset === 'GRAM') setSelectedNetwork('TON');
    }, [selectedAsset]);

    const [rates, setRates] = useState(() => {
        try {
            const cached = localStorage.getItem('maruf_market_rates');
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Date.now() - (parsed.timestamp || 0) < 30 * 1000) return parsed.rates || { GRAM: 165, USDT: 125 };
            }
        } catch (_) {}
        return { GRAM: 165, USDT: 125 };
    });

    useEffect(() => {
        let isMounted = true;
        const fetchRates = () => {
            fetchMarketRates().then(data => {
                if (!isMounted || !data?.rates) return;
                setRates(data.rates);
                try {
                    localStorage.setItem('maruf_market_rates', JSON.stringify({ rates: data.rates, timestamp: Date.now() }));
                } catch (_) {}
            }).catch(() => {});
        };
        fetchRates();
        const interval = setInterval(fetchRates, 30000);
        return () => { isMounted = false; clearInterval(interval); };
    }, []);

    const BUY_NETWORKS = [
        { id: 'TON', name: 'The Open Network (TON)', shortName: 'TON', gasFee: '~0.015 TON', disabled: false },
        { id: 'ARBITRUM', name: 'Arbitrum One (ARB)', shortName: 'Arbitrum', gasFee: '', disabled: true, badge: 'Coming Soon' },
        { id: 'BEP20', name: 'BNB Smart Chain (BEP20)', shortName: 'BSC', gasFee: '', disabled: true, badge: 'Coming Soon' }
    ];

    const activeNetworkObj = BUY_NETWORKS.find(n => n.id === selectedNetwork) || BUY_NETWORKS[0];
    const cryptoRate = rates[selectedAsset] || (selectedAsset === 'GRAM' ? 165 : 125);
    const numBdt = parseFloat(bdtAmount) || 0;
    const calculatedCrypto = numBdt > 0 ? (numBdt / cryptoRate).toFixed(4) : '';
    const hasInsufficientBalance = numBdt > balance;

    // Real-time Address Validation
    const validateAddress = (addr, net) => {
        if (!addr || !addr.trim()) return null; // neutral
        const clean = addr.trim();
        if (net === 'TON') {
            const isTonBase64 = /^[a-zA-Z0-9_\-]{48}$/.test(clean);
            const isTonRaw = /^0:[a-fA-F0-9]{64}$/.test(clean);
            return isTonBase64 || isTonRaw;
        } else {
            return /^0x[a-fA-F0-9]{40}$/.test(clean);
        }
    };

    const addressValidity = validateAddress(receiveAddress, selectedNetwork);

    const addressBoxClasses = addressValidity === true
        ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-white dark:bg-slate-900'
        : addressValidity === false
        ? 'border-rose-500 ring-2 ring-rose-500/20 bg-white dark:bg-slate-900'
        : darkMode
        ? 'bg-slate-900 border-slate-700'
        : 'bg-white border-slate-200';

    // Native Camera QR Scanner
    const handleScanQr = () => {
        if (window.Telegram?.WebApp?.showScanQrPopup) {
            window.Telegram.WebApp.showScanQrPopup(
                { text: lang === 'bn' ? 'ওয়ালেট QR কোড স্ক্যান করুন' : 'Scan Wallet QR Code' },
                (scannedText) => {
                    if (scannedText) {
                        const cleanAddr = scannedText.replace(/^(ton:\/\/transfer\/|ethereum:|bitcoin:)/i, '').split('?')[0].trim();
                        setReceiveAddress(cleanAddr);
                        setDestMode('custom');
                        if (selectedNetwork !== 'TON' && cleanAddr.length > 10) {
                            try { localStorage.setItem('tp_saved_evm_addr', cleanAddr); } catch (_) {}
                        }
                        window.Telegram.WebApp.closeScanQrPopup();
                        return true;
                    }
                }
            );
        } else {
            const pasted = prompt(lang === 'bn' ? 'ওয়ালেট এড্রেস পেস্ট করুন:' : 'Paste wallet address:');
            if (pasted) {
                setReceiveAddress(pasted.trim());
                setDestMode('custom');
            }
        }
    };

    const handleConfirmBuy = async () => {
        const targetAddress = destMode === 'connected' ? (userTonAddress || receiveAddress) : receiveAddress;
        if (!numBdt || isNaN(numBdt) || numBdt < 10) {
            return window.Telegram?.WebApp?.showAlert 
                ? window.Telegram.WebApp.showAlert(lang === 'bn' ? "নূন্যতম ১০ টাকার ক্রিপ্টো ক্রয় করতে হবে।" : "Minimum order amount is 10 BDT.")
                : alert("Minimum order is 10 BDT");
        }
        if (!targetAddress || targetAddress.trim().length < 6) {
            return window.Telegram?.WebApp?.showAlert 
                ? window.Telegram.WebApp.showAlert(lang === 'bn' ? "সঠিক রিসিভ ওয়ালেট এড্রেস দিন।" : "Please enter a valid wallet address.")
                : alert("Please enter a valid wallet address.");
        }
        if (hasInsufficientBalance) {
            onGoToAddMoney();
            return;
        }

        setErrorMessage('');
        setIsTransferModalOpen(true);
        setTransferStage('verifying');

        let isCompleted = false;
        const progressTimer = setTimeout(() => {
            if (!isCompleted) setTransferStage('transferring');
        }, 600);

        try {
            const res = await submitBuyCrypto({
                userId: user?.id || 123456789,
                asset: selectedAsset,
                network: selectedNetwork,
                bdtAmount: numBdt,
                cryptoAmount: parseFloat(calculatedCrypto),
                rate: cryptoRate,
                receiveAddress: targetAddress.trim(),
                memo: memo.trim() || undefined
            });

            isCompleted = true;
            clearTimeout(progressTimer);

            if (res.success) {
                setTxResult(res);
                setTransferStage('success');
                if (reloadData) reloadData();
                if (window.Telegram?.WebApp?.HapticFeedback) {
                    window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
                }
            } else {
                throw new Error(res.error || (lang === 'bn' ? 'ক্রয় সম্পন্ন করা সম্ভব হয়নি।' : 'Purchase failed.'));
            }
        } catch (err) {
            isCompleted = true;
            clearTimeout(progressTimer);
            setErrorMessage(err.message || (lang === 'bn' ? 'ক্রয় ব্যর্থ হয়েছে।' : 'Purchase failed.'));
            setTransferStage('error');
            if (window.Telegram?.WebApp?.HapticFeedback) {
                window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
            }
        }
    };

    return (
        <div className={`min-h-screen pb-24 ${darkMode ? 'text-white' : 'text-slate-900'} relative`}>
            {/* Top background glow & flower art placed higher up */}
            <div
                className="absolute -right-4 -top-8 w-[190px] h-[170px] pointer-events-none"
                style={{
                    background: 'radial-gradient(closest-side, rgba(233,213,255,0.6), rgba(243,232,255,0.2) 60%, transparent)'
                }}
            />
            <div
                className="absolute -right-2 -top-8 w-[120px] h-[160px] overflow-hidden pointer-events-none select-none flex items-center justify-end"
                style={{ WebkitMaskImage: 'linear-gradient(to bottom, black 65%, transparent 100%)', maskImage: 'linear-gradient(to bottom, black 65%, transparent 100%)' }}
            >
                <img
                    src={roseBotanicalArt}
                    alt=""
                    aria-hidden="true"
                    draggable={false}
                    className="w-full h-auto object-contain opacity-[0.45]"
                />
            </div>

            <div className="max-w-md mx-auto p-4 sm:p-5 space-y-4 relative z-10">
                {/* 1. TOP HEADER */}
                <div className="flex items-center justify-between py-1">
                    <button
                        type="button"
                        onClick={onBack}
                        className={`w-9 h-9 rounded-2xl flex items-center justify-center border transition-all active:scale-90 cursor-pointer shadow-xs ${
                            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                        }`}
                    >
                        <ChevronRight size={18} className="rotate-180" strokeWidth={2.5} />
                    </button>
                    <div className="flex items-center gap-2">
                        <img 
                            src={`${import.meta.env.BASE_URL}${selectedAsset === 'USDT' ? 'usdt.svg' : 'gram.svg'}`} 
                            alt={selectedAsset} 
                            className="w-6 h-6 object-contain rounded-full shadow-xs" 
                        />
                        <h1 className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                            {selectedAsset}-On-Chain
                        </h1>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => setIsHelpOpen(true)}
                            className={`w-9 h-9 rounded-2xl flex items-center justify-center border transition-all active:scale-90 cursor-pointer shadow-xs ${
                                darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'
                            }`}
                            title="Help Guide"
                        >
                            <HelpCircle size={17} />
                        </button>
                    </div>
                </div>

                {/* 2. ADDRESS FIELD WITH REAL-TIME VALIDATION & CAMERA SCANNER */}
                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label className={`text-xs font-black uppercase tracking-wider block ${
                            darkMode ? 'text-slate-300' : 'text-slate-700'
                        }`}>
                            Wallet Address ({selectedNetwork})
                        </label>
                        {addressValidity === true && (
                            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                                <CheckCircle2 size={12} />
                                {lang === 'bn' ? 'সঠিক এড্রেস' : 'Valid'}
                            </span>
                        )}
                        {addressValidity === false && (
                            <span className="text-[10px] font-bold text-rose-500 flex items-center gap-1">
                                <AlertCircle size={12} />
                                {lang === 'bn' ? 'ভুল এড্রেস ফরম্যাট' : 'Invalid'}
                            </span>
                        )}
                    </div>

                    <div className={`relative flex items-center rounded-2xl border transition-all p-3 shadow-xs ${addressBoxClasses}`}>
                        <input
                            type="text"
                            value={receiveAddress}
                            onChange={e => {
                                const val = e.target.value;
                                setReceiveAddress(val);
                                setDestMode('custom');
                                if (selectedNetwork !== 'TON' && val.trim().length > 10) {
                                    try { localStorage.setItem('tp_saved_evm_addr', val.trim()); } catch (_) {}
                                }
                            }}
                            placeholder={
                                selectedNetwork === 'TON'
                                    ? "Input or paste UQ... / EQ... address"
                                    : "Input or paste 0x... EVM address"
                            }
                            style={{ color: darkMode ? '#ffffff' : '#0f172a' }}
                            className="w-full bg-transparent text-xs font-mono font-bold outline-none pr-20 placeholder:text-xs placeholder:font-normal placeholder:text-slate-400"
                        />
                        <div className="absolute right-2.5 flex items-center gap-1.5">
                            {receiveAddress ? (
                                <button
                                    type="button"
                                    onClick={() => setReceiveAddress('')}
                                    className="p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
                                >
                                    <X size={14} />
                                </button>
                            ) : null}
                            <button
                                type="button"
                                onClick={async () => {
                                    try {
                                        const text = await navigator.clipboard.readText();
                                        if (text) {
                                            const trimmed = text.trim();
                                            setReceiveAddress(trimmed);
                                            setDestMode('custom');
                                            if (selectedNetwork !== 'TON') {
                                                try { localStorage.setItem('tp_saved_evm_addr', trimmed); } catch (_) {}
                                            }
                                        }
                                    } catch(e) {}
                                }}
                                className="p-1 text-slate-400 hover:text-purple-600 rounded-md cursor-pointer"
                                title="Paste"
                            >
                                <ClipboardPaste size={15} />
                            </button>
                            <div className="w-[1px] h-3.5 bg-slate-200 dark:bg-slate-700" />
                            <button
                                type="button"
                                onClick={handleScanQr}
                                className="p-1 text-purple-600 dark:text-purple-400 hover:text-purple-700 rounded-md cursor-pointer"
                                title={lang === 'bn' ? 'ক্যামেরা দিয়ে QR স্ক্যান করুন' : 'Scan QR Code with Camera'}
                            >
                                <Camera size={16} />
                            </button>
                        </div>
                    </div>

                    {/* If TON / GRAM: Quick Connected Wallet Button */}
                    {selectedNetwork === 'TON' && userTonAddress && (
                        <div className="flex justify-end mt-1.5">
                            <button
                                type="button"
                                onClick={() => {
                                    setDestMode('connected');
                                    setReceiveAddress(userTonAddress);
                                }}
                                className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                                <Wallet size={12} />
                                <span>{receiveAddress === userTonAddress ? (lang === 'bn' ? '✓ কানেক্টেড ওয়ালেট সিলেক্টেড' : '✓ Connected Wallet Selected') : (lang === 'bn' ? '+ কানেক্টেড ওয়ালেট এড্রেস দিন' : '+ Use Connected Wallet')}</span>
                            </button>
                        </div>
                    )}

                    {/* Memo (Optional for TON) */}
                    {(selectedAsset === 'GRAM' || selectedNetwork === 'TON') && (
                        <div className="mt-2">
                            <input
                                type="text"
                                value={memo}
                                onChange={e => setMemo(e.target.value)}
                                placeholder="Memo / Comment (Optional)"
                                style={{ color: darkMode ? '#ffffff' : '#0f172a' }}
                                className={`w-full h-[40px] px-3.5 rounded-xl text-xs font-mono font-bold outline-none border transition-all ${
                                    darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                                }`}
                            />
                        </div>
                    )}
                </div>

                {/* 3. NETWORK FIELD */}
                <div>
                    <label className={`text-xs font-black uppercase tracking-wider block mb-1.5 ${
                        darkMode ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                        Network
                    </label>
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => {
                                if (selectedAsset === 'GRAM') return;
                                setIsNetworkDropdownOpen(!isNetworkDropdownOpen);
                            }}
                            className={`w-full p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                                darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                            }`}
                        >
                            <div className="flex items-center gap-2.5 min-w-0">
                                <NetworkLogo id={activeNetworkObj.id} className="w-5 h-5 shrink-0 rounded-full" />
                                <span className="font-black text-xs truncate">
                                    {activeNetworkObj.name}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                {activeNetworkObj.disabled ? (
                                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                        Coming Soon
                                    </span>
                                ) : (
                                    <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-md border border-purple-200/60 dark:border-purple-800/60">
                                        {activeNetworkObj.gasFee}
                                    </span>
                                )}
                                {selectedAsset !== 'GRAM' && (
                                    <ChevronDown size={16} className={`text-slate-400 transition-transform ${isNetworkDropdownOpen ? 'rotate-180' : ''}`} />
                                )}
                            </div>
                        </button>

                        {/* Dropdown Options */}
                        {isNetworkDropdownOpen && selectedAsset !== 'GRAM' && (
                            <div className={`absolute left-0 right-0 top-full mt-1.5 rounded-2xl border shadow-xl z-30 p-1.5 space-y-1 ${
                                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                            }`}>
                                {BUY_NETWORKS.map(net => {
                                    const isSel = selectedNetwork === net.id;
                                    const isDisabled = !!net.disabled;
                                    return (
                                        <button
                                            key={net.id}
                                            type="button"
                                            disabled={isDisabled}
                                            onClick={() => {
                                                if (isDisabled) return;
                                                setSelectedNetwork(net.id);
                                                setIsNetworkDropdownOpen(false);
                                            }}
                                            className={`w-full p-2.5 rounded-xl flex items-center justify-between transition-all ${
                                                isDisabled 
                                                    ? 'opacity-45 cursor-not-allowed select-none bg-slate-100/40 dark:bg-slate-800/20' 
                                                    : isSel 
                                                    ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 font-black cursor-pointer' 
                                                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold cursor-pointer'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <NetworkLogo id={net.id} className="w-5 h-5 shrink-0 rounded-full" />
                                                <span className="text-xs truncate font-bold">{net.name}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                {isDisabled ? (
                                                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                                        Coming Soon
                                                    </span>
                                                ) : (
                                                    <>
                                                        <span className="text-[10px] opacity-75 font-mono">{net.gasFee}</span>
                                                        {isSel && <Check size={14} className="text-purple-600 dark:text-purple-400" />}
                                                    </>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* 4. AMOUNT FIELD */}
                <div>
                    <label className={`text-xs font-black uppercase tracking-wider block mb-1.5 ${
                        darkMode ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                        Amount (টাকার পরিমাণ)
                    </label>
                    <div className={`relative flex items-center rounded-2xl border transition-all p-3 shadow-xs ${
                        darkMode ? 'bg-slate-900 border-slate-700 focus-within:border-purple-500' : 'bg-white border-slate-200 focus-within:border-purple-500'
                    }`}>
                        <input
                            type="number"
                            value={bdtAmount}
                            onChange={e => setBdtAmount(e.target.value)}
                            placeholder={`Min. 0.01 ${selectedAsset} (≈ ৳${(cryptoRate * 0.01).toFixed(0)})`}
                            style={{ color: darkMode ? '#ffffff' : '#0f172a' }}
                            className="w-full bg-transparent text-lg sm:text-xl font-black font-mono tracking-tight outline-none pr-16 placeholder:text-xs placeholder:font-normal placeholder:text-slate-400"
                        />
                        <span className="absolute right-3.5 font-black text-xs text-slate-400">
                            BDT
                        </span>
                    </div>

                    {/* Preset Buttons & Available Balance */}
                    <div className="flex items-center justify-between mt-2 text-[11px]">
                        <span className="font-medium text-slate-500 dark:text-slate-400">
                            Available: <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">৳{Number(balance || 0).toFixed(2)}</span>
                        </span>
                        <div className="flex items-center gap-1">
                            {[100, 500, 1000, 2000].map(val => (
                                <button
                                    key={val}
                                    type="button"
                                    onClick={() => setBdtAmount(val.toString())}
                                    className="px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:border-purple-500 cursor-pointer active:scale-95"
                                >
                                    ৳{val}
                                </button>
                            ))}
                            {balance > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setBdtAmount(Math.floor(balance).toString())}
                                    className="px-2 py-0.5 rounded-lg border border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-950/40 text-[10px] font-black text-purple-600 dark:text-purple-400 cursor-pointer active:scale-95"
                                >
                                    MAX
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* 5. NOTE & FEES */}
                <div className="pt-1 text-[11px] text-slate-400 space-y-1">
                    <div className="flex justify-between">
                        <span>Rate</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">1 {selectedAsset} ≈ ৳{cryptoRate} BDT</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Withdrawal Fees</span>
                        <span className="font-black text-emerald-600 dark:text-emerald-400">0 Network Fee</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Status</span>
                        <span className="font-medium text-slate-500 dark:text-slate-400">⚡ Instant On-Chain Processing</span>
                    </div>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                    <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl p-2.5 flex items-start gap-2">
                        <AlertCircle size={15} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-red-700 dark:text-red-300 font-medium leading-tight">{errorMessage}</p>
                    </div>
                )}

                {/* 6. BOTTOM BAR + 3D PURPLE BUTTON */}
                <div className={`mt-6 pt-3 border-t flex items-center justify-between gap-4 ${
                    darkMode ? 'border-slate-800' : 'border-slate-200'
                }`}>
                    <div>
                        <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white">
                            {calculatedCrypto || '0.00'} <span className="text-xs font-bold text-purple-600 dark:text-purple-400">{selectedAsset}</span>
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                            Amount Received (আপনি পাবেন)
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={hasInsufficientBalance ? onGoToAddMoney : handleConfirmBuy}
                        disabled={!hasInsufficientBalance && (!numBdt || numBdt < 10)}
                        className="px-7 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 text-white font-black text-sm shadow-[0_4px_16px_rgba(124,58,237,0.4)] hover:opacity-95 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
                    >
                        <Zap size={16} fill="currentColor" />
                        <span>
                            {hasInsufficientBalance 
                                ? (lang === 'bn' ? 'টাকা যোগ করুন' : 'Add Money') 
                                : (lang === 'bn' ? 'উইথড্র / বাই' : 'Withdraw')}
                        </span>
                    </button>
                </div>
            </div>

            {/* Help Modal */}
            <OnChainHelpModal
                isOpen={isHelpOpen}
                onClose={() => setIsHelpOpen(false)}
                network={activeNetworkObj.name}
                lang={lang}
                darkMode={darkMode}
            />

            {/* Real-time Transfer Animation Progress Modal */}
            <OnChainTransferProgressModal
                isOpen={isTransferModalOpen}
                stage={transferStage}
                asset={selectedAsset}
                amount={calculatedCrypto}
                targetAddress={destMode === 'connected' ? (userTonAddress || receiveAddress) : receiveAddress}
                network={activeNetworkObj.shortName}
                isBuy={true}
                errorMessage={errorMessage}
                onClose={() => {
                    setIsTransferModalOpen(false);
                    onBack();
                }}
                lang={lang}
                darkMode={darkMode}
            />
        </div>
    );
}

function SellCryptoPage({ 
    user, 
    balance = 0, 
    lang = 'bn', 
    t, 
    darkMode = false, 
    initialAsset = 'GRAM',
    onBack, 
    onDone, 
    onGoToWithdraw, 
    reloadData 
}) {
    const userTonAddress = useTonAddress();
    const [tonConnectUI] = useTonConnectUI();
    const [asset, setAsset] = useState(initialAsset || 'GRAM');
    const [selectedNetwork, setSelectedNetwork] = useState('TON'); // TON is the only active network
    const [isNetworkDropdownOpen, setIsNetworkDropdownOpen] = useState(false);
    const [cryptoAmount, setCryptoAmount] = useState('');
    const [userEvmAddress, setUserEvmAddress] = useState('');
    const [isEvmChecking, setIsEvmChecking] = useState(false);
    const [evmCheckMsg, setEvmCheckMsg] = useState(null);
    const [copiedAddress, setCopiedAddress] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isTonSending, setIsTonSending] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [sellResult, setSellResult] = useState(null);
    const [step, setStep] = useState(1);
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [transferStage, setTransferStage] = useState('verifying');

    useEffect(() => {
        if (initialAsset && (initialAsset === 'GRAM' || initialAsset === 'USDT')) {
            setAsset(initialAsset);
        }
    }, [initialAsset]);

    useEffect(() => {
        if (asset === 'GRAM') setSelectedNetwork('TON');
    }, [asset]);

    // Lock to TON network as Arbitrum and BEP20 are Coming Soon
    useEffect(() => {
        if (selectedNetwork !== 'TON') {
            setSelectedNetwork('TON');
        }
    }, [selectedNetwork]);

    const [liveRates, setLiveRates] = useState(() => {
        try {
            const cached = localStorage.getItem('maruf_seller_rates');
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Date.now() - (parsed.timestamp || 0) < 30 * 1000 && parsed.rates?.USDT) {
                    return { GRAM: parsed.rates.GRAM || 135, USDT: parsed.rates.USDT || 118 };
                }
            }
        } catch (_) {}
        return { GRAM: 135, USDT: 118 };
    });

    useEffect(() => {
        let isMounted = true;
        const fetchRates = () => {
            fetchMarketRates().then(data => {
                if (!isMounted || !data?.sellRates) return;
                const newRates = {
                    GRAM: Number(data.sellRates.GRAM) || 135,
                    USDT: Number(data.sellRates.USDT) || 118
                };
                setLiveRates(newRates);
                try {
                    localStorage.setItem('maruf_seller_rates', JSON.stringify({ rates: newRates, timestamp: Date.now() }));
                } catch (_) {}
            }).catch(() => {});
        };
        fetchRates();
        const interval = setInterval(fetchRates, 30000);
        return () => { isMounted = false; clearInterval(interval); };
    }, []);

    const botWalletAddress = "UQC7hYHfrVJ_uT_esMr7vCv1bVh5ytQxYUUjRDiTUiG9s5Fb";
    const depositTargetAddress = selectedNetwork === 'TON' ? (userTonAddress || botWalletAddress) : (userEvmAddress || '');
    const currentRate = asset === 'USDT' ? (liveRates?.USDT || 118) : (liveRates?.GRAM || 135);
    const numAmount = parseFloat(cryptoAmount) || 0;
    const estimatedTk = numAmount > 0 ? Math.floor(numAmount * currentRate) : 0;
    const quickAmounts = asset === 'GRAM' ? [0.1, 0.5, 1, 5, 10] : [5, 10, 25, 50, 100];

    const SELL_NETWORKS = [
        { id: 'TON', name: 'The Open Network (TON)', shortName: 'TON', gasFee: '~0.015 TON', disabled: false },
        { id: 'ARBITRUM', name: 'Arbitrum One (ARB)', shortName: 'Arbitrum', gasFee: '', disabled: true, badge: 'Coming Soon' },
        { id: 'BEP20', name: 'BNB Smart Chain (BEP20)', shortName: 'BSC', gasFee: '', disabled: true, badge: 'Coming Soon' }
    ];



    const activeNetworkObj = SELL_NETWORKS.find(n => n.id === selectedNetwork) || SELL_NETWORKS[0];

    // TON direct sell via Tonkeeper
    const handleDirectSell = async () => {
        if (!userTonAddress) {
            tonConnectUI.openModal();
            return;
        }
        if (!numAmount || isNaN(numAmount) || numAmount < 0.01) {
            return window.Telegram?.WebApp?.showAlert 
                ? window.Telegram.WebApp.showAlert(lang === 'bn' ? "নূন্যতম ০.০১ পরিমাণ ক্রিপ্টো দিন" : "Minimum sell amount is 0.01") 
                : alert("Minimum sell amount is 0.01");
        }
        if (estimatedTk < 1) {
            return window.Telegram?.WebApp?.showAlert 
                ? window.Telegram.WebApp.showAlert(lang === 'bn' ? "নূন্যতম বিক্রয় ১ টাকা" : "Minimum sell value is 1 BDT") 
                : alert("Minimum sell value is 1 BDT");
        }

        setIsTransferModalOpen(true);
        setTransferStage('verifying');
        setErrorMessage('');

        let isCompleted = false;
        const progressTimer = setTimeout(() => {
            if (!isCompleted) setTransferStage('transferring');
        }, 700);

        let activeSellCode = '';

        try {
            const txRes = await buildTransaction({
                userId: user?.id || 123456789,
                asset,
                amount: numAmount,
                userAddress: userTonAddress,
                adminWallet: botWalletAddress
            });

            if (!txRes || !txRes.tx || !txRes.sellCode) {
                throw new Error("Failed to prepare transaction");
            }

            activeSellCode = txRes.sellCode;

            // Trigger Tonkeeper / TonConnect transaction
            let sdkError = null;
            try {
                await tonConnectUI.sendTransaction(txRes.tx);
            } catch (err) {
                console.warn("tonConnectUI sendTransaction error or mobile app switch:", err.message);
                sdkError = err;
            }

            // Immediately verify on-chain! Even if TonConnect threw because user switched back from Tonkeeper
            setTransferStage('verifying');
            const res = await submitSellOrder({
                userId: user?.id || 123456789,
                asset,
                amount: numAmount,
                estimatedTk,
                sellCode: activeSellCode,
                wallet: userTonAddress,
                status: 'completed'
            });

            isCompleted = true;
            clearTimeout(progressTimer);

            if (res.success) {
                const finalCreditedTk = res.creditedTk || estimatedTk;
                setSellResult({ ...res, amount: numAmount, estimatedTk: finalCreditedTk });
                setTransferStage('success');
                if (reloadData) reloadData();
                if (window.Telegram?.WebApp?.HapticFeedback) {
                    window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
                }
            } else {
                throw new Error(res.error || 'ব্যালেন্সে টাকা যোগ করতে সমস্যা হয়েছে');
            }
        } catch (err) {
            isCompleted = true;
            clearTimeout(progressTimer);
            const isUserCancel = err.message?.includes('Reject') || err.message?.includes('cancel') || err.message?.includes('declined');
            const msg = isUserCancel 
                ? (lang === 'bn' ? 'টোনকিপারে পেমেন্ট বাতিল করা হয়েছে।' : 'Payment rejected in Tonkeeper.')
                : (err.message || (lang === 'bn' ? 'পেমেন্ট ভেরিফাই করা যায়নি। আপনি যদি পাঠিয়ে থাকেন, তবে "ডিপোজিট চেক করুন" বাটন চাপুন।' : 'Payment could not be verified yet. Click Check Deposit to retry.'));
            setErrorMessage(msg);
            setTransferStage('error');
        }
    };

    // EVM Check Deposit Handler
    const handleCheckEvmDeposit = async () => {
        if (!user?.id) return;
        setIsEvmChecking(true);
        setEvmCheckMsg(null);
        setErrorMessage('');

        try {
            const res = await checkEvmDeposit({ userId: user.id, network: selectedNetwork });
            if (res.success) {
                setEvmCheckMsg({ type: 'success', text: res.message });
                if (reloadData) reloadData();
                if (window.Telegram?.WebApp?.HapticFeedback) {
                    window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
                }
            } else {
                setEvmCheckMsg({ type: 'info', text: res.message });
            }
        } catch (err) {
            setEvmCheckMsg({ type: 'error', text: err.message || 'ডিপোজিট চেক করতে সমস্যা হয়েছে।' });
        } finally {
            setIsEvmChecking(false);
        }
    };

    return (
        <div className={`min-h-screen pb-24 ${darkMode ? 'text-white' : 'text-slate-900'} relative`}>
            {/* Top background glow & flower art placed higher up */}
            <div
                className="absolute -right-4 -top-8 w-[190px] h-[170px] pointer-events-none"
                style={{
                    background: 'radial-gradient(closest-side, rgba(233,213,255,0.6), rgba(243,232,255,0.2) 60%, transparent)'
                }}
            />
            <div
                className="absolute -right-2 -top-8 w-[120px] h-[160px] overflow-hidden pointer-events-none select-none flex items-center justify-end"
                style={{ WebkitMaskImage: 'linear-gradient(to bottom, black 65%, transparent 100%)', maskImage: 'linear-gradient(to bottom, black 65%, transparent 100%)' }}
            >
                <img
                    src={roseBotanicalArt}
                    alt=""
                    aria-hidden="true"
                    draggable={false}
                    className="w-full h-auto object-contain opacity-[0.45]"
                />
            </div>

            <div className="max-w-md mx-auto p-4 sm:p-5 space-y-4 relative z-10">
                {/* 1. TOP HEADER */}
                <div className="flex items-center justify-between py-1">
                    <button
                        type="button"
                        onClick={onBack}
                        className={`w-9 h-9 rounded-2xl flex items-center justify-center border transition-all active:scale-90 cursor-pointer shadow-xs ${
                            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                        }`}
                    >
                        <ChevronRight size={18} className="rotate-180" strokeWidth={2.5} />
                    </button>
                    <div className="flex items-center gap-2">
                        <img 
                            src={`${import.meta.env.BASE_URL}${asset === 'USDT' ? 'usdt.svg' : 'gram.svg'}`} 
                            alt={asset} 
                            className="w-6 h-6 object-contain rounded-full shadow-xs" 
                        />
                        <h1 className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                            {asset}-On-Chain
                        </h1>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => setIsHelpOpen(true)}
                            className={`w-9 h-9 rounded-2xl flex items-center justify-center border transition-all active:scale-90 cursor-pointer shadow-xs ${
                                darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'
                            }`}
                            title="Help Guide"
                        >
                            <HelpCircle size={17} />
                        </button>
                    </div>
                </div>

                {/* 2. ADDRESS FIELD (Opaque Solid Background + QR Button) */}
                <div>
                    <label className={`text-xs font-black uppercase tracking-wider block mb-1.5 ${
                        darkMode ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                        Deposit Address ({selectedNetwork})
                    </label>

                    {selectedNetwork === 'TON' ? (
                        userTonAddress ? (
                            <div className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-2.5 shadow-xs ${
                                darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
                            }`}>
                                <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 truncate select-all">
                                    {userTonAddress}
                                </span>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            navigator.clipboard.writeText(userTonAddress);
                                            setCopiedAddress(true);
                                            setTimeout(() => setCopiedAddress(false), 2000);
                                        }}
                                        className="px-2.5 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/60 font-bold text-xs flex items-center gap-1 hover:bg-purple-100 active:scale-95 transition-all cursor-pointer"
                                    >
                                        {copiedAddress ? <Check size={13} /> : <Copy size={13} />}
                                        <span>{copiedAddress ? 'Copied' : 'Copy'}</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-3 shadow-xs">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <Wallet size={18} className="text-amber-600 shrink-0" />
                                    <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                                        {lang === 'bn' ? 'টোনকিপার ওয়ালেট কানেক্ট নেই' : 'No Wallet Connected'}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => tonConnectUI.openModal()}
                                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-xs shrink-0 cursor-pointer shadow-xs active:scale-95"
                                >
                                    {lang === 'bn' ? 'কানেক্ট' : 'Connect'}
                                </button>
                            </div>
                        )
                    ) : (
                        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
                            <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                                {lang === 'bn' ? 'এই নেটওয়ার্কটি শীঘ্রই আসছে (Coming Soon)' : 'This network is coming soon'}
                            </span>
                        </div>
                    )}

                    {evmCheckMsg && selectedNetwork !== 'TON' && (
                        <div className={`mt-2 p-2.5 rounded-xl text-xs font-bold ${
                            evmCheckMsg.type === 'success' 
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200' 
                                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200'
                        }`}>
                            {evmCheckMsg.text}
                        </div>
                    )}
                </div>

                {/* 3. NETWORK FIELD */}
                <div>
                    <label className={`text-xs font-black uppercase tracking-wider block mb-1.5 ${
                        darkMode ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                        Network
                    </label>
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => {
                                if (asset === 'GRAM') return;
                                setIsNetworkDropdownOpen(!isNetworkDropdownOpen);
                            }}
                            className={`w-full p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                                darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                            }`}
                        >
                            <div className="flex items-center gap-2.5 min-w-0">
                                <NetworkLogo id={activeNetworkObj.id} className="w-5 h-5 shrink-0 rounded-full" />
                                <span className="font-black text-xs truncate">
                                    {activeNetworkObj.name}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                {activeNetworkObj.disabled ? (
                                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                        Coming Soon
                                    </span>
                                ) : (
                                    <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-md border border-purple-200/60 dark:border-purple-800/60">
                                        {activeNetworkObj.gasFee}
                                    </span>
                                )}
                                {asset !== 'GRAM' && (
                                    <ChevronDown size={16} className={`text-slate-400 transition-transform ${isNetworkDropdownOpen ? 'rotate-180' : ''}`} />
                                )}
                            </div>
                        </button>

                        {/* Dropdown Options */}
                        {isNetworkDropdownOpen && asset !== 'GRAM' && (
                            <div className={`absolute left-0 right-0 top-full mt-1.5 rounded-2xl border shadow-xl z-30 p-1.5 space-y-1 ${
                                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                            }`}>
                                {SELL_NETWORKS.map(net => {
                                    const isSel = selectedNetwork === net.id;
                                    const isDisabled = !!net.disabled;
                                    return (
                                        <button
                                            key={net.id}
                                            type="button"
                                            disabled={isDisabled}
                                            onClick={() => {
                                                if (isDisabled) return;
                                                setSelectedNetwork(net.id);
                                                setIsNetworkDropdownOpen(false);
                                            }}
                                            className={`w-full p-2.5 rounded-xl flex items-center justify-between transition-all ${
                                                isDisabled 
                                                    ? 'opacity-45 cursor-not-allowed select-none bg-slate-100/40 dark:bg-slate-800/20' 
                                                    : isSel 
                                                    ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 font-black cursor-pointer' 
                                                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold cursor-pointer'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <NetworkLogo id={net.id} className="w-5 h-5 shrink-0 rounded-full" />
                                                <span className="text-xs truncate font-bold">{net.name}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                {isDisabled ? (
                                                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                                        Coming Soon
                                                    </span>
                                                ) : (
                                                    <>
                                                        <span className="text-[10px] opacity-75 font-mono">{net.gasFee}</span>
                                                        {isSel && <Check size={14} className="text-purple-600 dark:text-purple-400" />}
                                                    </>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* 4. AMOUNT FIELD (Min. 0.01 Placeholder) */}
                <div>
                    <label className={`text-xs font-black uppercase tracking-wider block mb-1.5 ${
                        darkMode ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                        Amount ({asset})
                    </label>
                    <div className={`relative flex items-center rounded-2xl border transition-all p-3 shadow-xs ${
                        darkMode ? 'bg-slate-900 border-slate-700 focus-within:border-purple-500' : 'bg-white border-slate-200 focus-within:border-purple-500'
                    }`}>
                        <input
                            type="number"
                            value={cryptoAmount}
                            onChange={e => setCryptoAmount(e.target.value)}
                            placeholder={`Min. 0.01 ${asset}`}
                            style={{ color: darkMode ? '#ffffff' : '#0f172a' }}
                            className="w-full bg-transparent text-lg sm:text-xl font-black font-mono tracking-tight outline-none pr-16 placeholder:text-xs placeholder:font-normal placeholder:text-slate-400"
                        />
                        <span className="absolute right-3.5 font-black text-xs text-slate-400">
                            {asset}
                        </span>
                    </div>

                    {/* Quick Amount Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar mt-2">
                        {quickAmounts.map(val => (
                            <button
                                key={val}
                                type="button"
                                onClick={() => setCryptoAmount(val.toString())}
                                className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                                    cryptoAmount === val.toString()
                                        ? 'bg-purple-500/15 border-purple-500 text-purple-600 dark:text-purple-400 font-black'
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-purple-300'
                                }`}
                            >
                                {val} {asset}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 5. RATE & ESTIMATE */}
                <div className="pt-1 text-[11px] text-slate-400 space-y-1">
                    <div className="flex justify-between">
                        <span>Current Sell Rate</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">1 {asset} ≈ ৳{currentRate} BDT</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Receiving BDT (আনুমানিক)</span>
                        <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono">৳{estimatedTk} BDT</span>
                    </div>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                    <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl p-2.5 flex items-start gap-2">
                        <AlertCircle size={15} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-red-700 dark:text-red-300 font-medium leading-tight">{errorMessage}</p>
                    </div>
                )}

                {/* 6. BOTTOM BAR + 3D PURPLE BUTTON */}
                <div className={`mt-6 pt-3 border-t flex items-center justify-between gap-4 ${
                    darkMode ? 'border-slate-800' : 'border-slate-200'
                }`}>
                    <div>
                        <div className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                            ৳{estimatedTk} <span className="text-xs font-bold text-slate-400">BDT</span>
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                            Instant Balance Credit
                        </div>
                    </div>

                    {selectedNetwork === 'TON' ? (
                        <button
                            type="button"
                            onClick={handleDirectSell}
                            disabled={!userTonAddress || !numAmount || numAmount < 0.01}
                            className="px-7 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 text-white font-black text-sm shadow-[0_4px_16px_rgba(124,58,237,0.4)] hover:opacity-95 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
                        >
                            <Zap size={16} fill="currentColor" />
                            <span>{lang === 'bn' ? 'সরাসরি সেল করুন' : 'Direct Sell'}</span>
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleCheckEvmDeposit}
                            disabled={isEvmChecking}
                            className="px-7 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 text-white font-black text-sm shadow-[0_4px_16px_rgba(124,58,237,0.4)] hover:opacity-95 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
                        >
                            {isEvmChecking ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                            <span>{lang === 'bn' ? 'ডিপোজিট চেক করুন' : 'Check Deposit'}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Help Modal */}
            <OnChainHelpModal
                isOpen={isHelpOpen}
                onClose={() => setIsHelpOpen(false)}
                network={activeNetworkObj.name}
                lang={lang}
                darkMode={darkMode}
            />

            {/* Real-time Transfer Animation Progress Modal */}
            <OnChainTransferProgressModal
                isOpen={isTransferModalOpen}
                stage={transferStage}
                asset={asset}
                amount={numAmount}
                targetAddress={botWalletAddress}
                network={activeNetworkObj.shortName}
                isBuy={false}
                errorMessage={errorMessage}
                onRetryCheck={selectedNetwork === 'TON' ? handleDirectSell : handleCheckEvmDeposit}
                onClose={() => {
                    setIsTransferModalOpen(false);
                    onBack();
                }}
                lang={lang}
                darkMode={darkMode}
            />
        </div>
    );
}

function HistoryPage({ user, lang = 'bn', t, onBack }) {
    const userId = user?.id || 123456789;
    const cacheKey = `miniapp_history_cache_${userId}`;

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

    const getItemDetails = (tx) => {
        const type = tx.type;
        const status = (tx.status || 'pending').toLowerCase();
        const isRejected = status === 'rejected';

        let isCredit = false;
        let bdtAmount = 0;
        let title = '';
        let subtitle = '';
        let Icon = ArrowRightLeft;
        let iconWrap = 'bg-slate-500/10 text-slate-500';

        if (type === 'add_money') {
            isCredit = true;
            bdtAmount = parseFloat(tx.amount || tx.totalBdt) || 0;
            title = lang === 'bn' ? 'টাকা যোগ' : 'Deposit';
            subtitle = `${tx.paymentMethod || 'bKash/Nagad'}${tx.trxId ? ` • TrxID: ${tx.trxId}` : ''}`;
            Icon = ArrowDownLeft;
            iconWrap = 'bg-emerald-500/10 text-emerald-500';
        } else if (type === 'sell') {
            isCredit = true;
            bdtAmount = parseFloat(tx.estimatedTk || tx.amount) || 0;
            title = lang === 'bn' ? `${tx.asset || 'TON'} বিক্রয়` : `Sold ${tx.asset || 'TON'}`;
            subtitle = `${lang === 'bn' ? 'বিক্রি:' : 'Sold:'} ${tx.amount} ${tx.asset || 'TON'}`;
            Icon = ArrowUpRight;
            iconWrap = 'bg-violet-500/10 text-violet-500';
        } else if (type === 'buy') {
            bdtAmount = parseFloat(tx.totalBdt || tx.amount) || 0;
            if (isRejected) {
                isCredit = true;
                title = lang === 'bn' ? `ক্রয় বাতিল ও রিফান্ড` : `Buy Refunded`;
                subtitle = `${lang === 'bn' ? 'ব্যালেন্সে ফেরত' : 'Refunded'}${tx.rejectReason ? ` • ${tx.rejectReason}` : ''}`;
                Icon = ArrowDownLeft;
                iconWrap = 'bg-emerald-500/10 text-emerald-500';
            } else {
                isCredit = false;
                title = lang === 'bn' ? `${tx.asset || 'TON'} ক্রয়` : `Bought ${tx.asset || 'TON'}`;
                subtitle = `${tx.amount} ${tx.asset || 'TON'}${tx.receiveAddress ? ` • ${tx.receiveAddress.slice(0, 4)}...${tx.receiveAddress.slice(-4)}` : ''}`;
                Icon = Coins;
                iconWrap = 'bg-blue-500/10 text-blue-500';
            }
        } else if (type === 'withdraw') {
            bdtAmount = parseFloat(tx.amount) || 0;
            if (isRejected) {
                isCredit = true;
                title = lang === 'bn' ? 'উইথড্র রিফান্ড' : 'Withdraw Refunded';
                subtitle = `${lang === 'bn' ? 'ব্যালেন্সে ফেরত' : 'Refunded'}${tx.rejectReason ? ` • ${tx.rejectReason}` : ''}`;
                Icon = ArrowDownLeft;
                iconWrap = 'bg-emerald-500/10 text-emerald-500';
            } else {
                isCredit = false;
                title = lang === 'bn' ? 'টাকা উত্তোলন' : 'Withdraw';
                subtitle = `${tx.number ? `${tx.number} • ` : ''}${lang === 'bn' ? 'পাবেন ৳' : 'Receive ৳'}${tx.receiveAmount || bdtAmount}`;
                Icon = ArrowUpRight;
                iconWrap = 'bg-rose-500/10 text-rose-500';
            }
        } else {
            bdtAmount = parseFloat(tx.amount) || 0;
            title = tx.type || 'Transaction';
            subtitle = tx.asset || 'BDT';
            iconWrap = 'bg-slate-500/10 text-slate-500';
        }

        return { isCredit, bdtAmount, title, subtitle, status, Icon, iconWrap };
    };

    const filteredHistory = history.filter(tx => {
        const { isCredit } = getItemDetails(tx);
        if (filter === 'in') return isCredit;
        if (filter === 'out') return !isCredit;
        return true;
    });

    const totalIn = history.reduce((acc, tx) => {
        const { isCredit, bdtAmount } = getItemDetails(tx);
        return isCredit ? acc + bdtAmount : acc;
    }, 0);

    const totalOut = history.reduce((acc, tx) => {
        const { isCredit, bdtAmount } = getItemDetails(tx);
        return !isCredit ? acc + bdtAmount : acc;
    }, 0);

    return (
        <div className="space-y-3.5 animate-in fade-in slide-in-from-right-4 duration-300 pb-24 max-w-md mx-auto relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2.5">
                    <button onClick={onBack} className="w-9 h-9 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-xs border border-slate-200 dark:border-slate-800 active:scale-95 transition-transform text-slate-700 dark:text-slate-300 cursor-pointer">
                        <ChevronRight size={18} className="rotate-180" strokeWidth={2.5} />
                    </button>
                    <div>
                        <h2 className="text-[15px] font-black text-slate-900 dark:text-white leading-tight">
                            {t?.transactionHistory || (lang === 'bn' ? 'লেনদেনের ইতিহাস' : 'Transaction History')}
                        </h2>
                        <p className="text-[10.5px] text-slate-400 font-medium leading-none">
                            {lang === 'bn' ? 'আপনার সকল আয় ও ব্যয়ের হিসাব' : 'Your complete inflow & outflow ledger'}
                        </p>
                    </div>
                </div>
                <button 
                    type="button" 
                    onClick={() => fetchHistory(true)} 
                    disabled={isRefreshing}
                    className="w-9 h-9 bg-white dark:bg-slate-900 rounded-2xl text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 active:scale-95 shadow-xs transition-transform flex items-center justify-center cursor-pointer"
                    title="Refresh"
                >
                    <RefreshCw size={15} className={isRefreshing ? 'animate-spin text-purple-600' : ''} />
                </button>
            </div>

            {/* Inflow vs Outflow Summary Cards */}
            <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase mb-1">
                        <ArrowDownLeft size={13} strokeWidth={2.5} className="text-emerald-500" />
                        <span>{lang === 'bn' ? 'মোট জমা (+)' : 'Inflow (+)'}</span>
                    </div>
                    <p className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">+৳{totalIn.toFixed(2)}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase mb-1">
                        <ArrowUpRight size={13} strokeWidth={2.5} className="text-rose-500" />
                        <span>{lang === 'bn' ? 'মোট খরচ (-)' : 'Outflow (-)'}</span>
                    </div>
                    <p className="text-lg font-black font-mono text-slate-900 dark:text-white">-৳{totalOut.toFixed(2)}</p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl gap-1 border border-slate-200/80 dark:border-slate-800 text-[11px] font-bold">
                <button
                    type="button"
                    onClick={() => setFilter('all')}
                    className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer ${filter === 'all' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-black' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
                >
                    {lang === 'bn' ? 'সবগুলো' : 'All'} ({history.length})
                </button>
                <button
                    type="button"
                    onClick={() => setFilter('in')}
                    className={`flex-1 py-1.5 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${filter === 'in' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs font-black' : 'text-slate-600 dark:text-slate-400'}`}
                >
                    <ArrowDownLeft size={12} strokeWidth={2.5} />
                    <span>{lang === 'bn' ? 'জমা (+)' : 'In (+)'}</span>
                </button>
                <button
                    type="button"
                    onClick={() => setFilter('out')}
                    className={`flex-1 py-1.5 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${filter === 'out' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs font-black' : 'text-slate-600 dark:text-slate-400'}`}
                >
                    <ArrowUpRight size={12} strokeWidth={2.5} />
                    <span>{lang === 'bn' ? 'খরচ (-)' : 'Out (-)'}</span>
                </button>
            </div>
            
            {/* Modern Transaction List Card (Matching Image 2) */}
            <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filteredHistory.length === 0 ? (
                    <div className="py-12 p-6 text-center flex flex-col items-center">
                        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mb-2">
                            <Clock size={20} />
                        </div>
                        <p className="font-black text-slate-900 dark:text-white text-[13px] mb-0.5">
                            {lang === 'bn' ? 'কোনো লেনদেন পাওয়া যায়নি' : 'No Transactions Found'}
                        </p>
                        <p className="text-[11px] text-slate-400">
                            {lang === 'bn' ? 'আপনার নির্বাচিত ক্যাটাগরিতে কোনো রেকর্ড নেই।' : 'No records match your selected filter.'}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/60 p-2 sm:p-3">
                        {filteredHistory.map((tx, idx) => {
                            const { isCredit, bdtAmount, title, subtitle, status, Icon, iconWrap } = getItemDetails(tx);
                            const ts = tx.timestamp?._seconds ? tx.timestamp._seconds * 1000 : (typeof tx.timestamp === 'number' ? tx.timestamp : (tx.timestamp ? new Date(tx.timestamp).getTime() : Date.now()));
                            const formattedDate = new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' • ' + new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                            return (
                                <div key={idx} className="flex items-center justify-between px-2 py-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors rounded-xl">
                                    <div className="flex items-center gap-3 min-w-0 pr-2">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${iconWrap}`}>
                                            <Icon size={18} strokeWidth={2.2} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-slate-900 dark:text-white text-[13px] leading-tight truncate">
                                                {title}
                                            </p>
                                            <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                                                {subtitle}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-right shrink-0">
                                        <p className={`font-semibold text-[13px] font-mono leading-tight ${
                                            isCredit ? 'text-emerald-500' : 'text-slate-900 dark:text-white'
                                        }`}>
                                            {isCredit ? `+৳${bdtAmount.toFixed(2)}` : `-৳${bdtAmount.toFixed(2)}`}
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">
                                            {formattedDate}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

function ProfilePage({ user, balance, mbsId, lang = 'bn', t, onSetLang, darkMode = false, onToggleDarkMode, fiatWallet, fiatWithdrawPending, onGoToWithdraw, onGoToHistory, onGoToReferral, onGoToSpin, setFiatWallet, setIsModalOpen, reloadData }) {
  const [withdrawing, setWithdrawing] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const displayId = mbsId || user?.mbsId || (user?.id ? 'MBS' + String(user.id).slice(-5) : 'MBS00000');

  const handleCopyId = () => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(displayId);
    }
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

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
    <div className="space-y-3.5 animate-in fade-in slide-in-from-right-4 duration-300 max-w-md mx-auto pb-24 relative">
      {/* 1. EXECUTIVE USER VIP IDENTITY CARD */}
      <div className={`rounded-3xl border transition-all p-4 shadow-sm relative overflow-hidden ${
        darkMode 
          ? 'bg-slate-900/95 border-slate-800 text-white' 
          : 'bg-white border-slate-200/90 text-slate-900'
      }`}>
        {/* Soft aura glow behind card */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-gradient-to-bl from-purple-500/15 via-indigo-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between gap-3">
          {/* Avatar & User Details */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-violet-500 text-white font-black text-xl flex items-center justify-center shadow-md shadow-purple-600/25 shrink-0 select-none">
                {user?.first_name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] text-white shadow-2xs font-bold">
                ✓
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-base font-black leading-tight truncate text-slate-900 dark:text-white">
                  {user?.first_name || 'User'}
                </h2>
                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200/70 dark:border-purple-800/60">
                  VIP 1
                </span>
              </div>
              <p className="text-slate-400 text-xs font-medium truncate mt-0.5">
                @{user?.username || 'user'}
              </p>
              
              {/* MBS ID Badge with Copy */}
              <button
                type="button"
                onClick={handleCopyId}
                className={`inline-flex items-center gap-1.5 text-[10.5px] font-mono font-bold px-2.5 py-1 rounded-xl cursor-pointer mt-1.5 transition-all select-none active:scale-95 border ${
                  copiedId
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                    : 'text-slate-600 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/80 border-slate-200/80 dark:border-slate-700/80'
                }`}
                title="Copy ID"
              >
                <span>ID: {displayId}</span>
                {copiedId ? (
                  <Check size={11} className="text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Copy size={11} className="text-slate-400" />
                )}
              </button>
            </div>
          </div>

          {/* Quick Controls: Dark Mode Toggle + Language Pill */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={onToggleDarkMode}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border text-xs font-black transition-all duration-300 active:scale-95 cursor-pointer shadow-2xs ${
                darkMode
                  ? 'bg-slate-800 border-slate-700 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.2)]'
                  : 'bg-indigo-50/80 border-indigo-200/80 text-indigo-700 hover:bg-indigo-100'
              }`}
            >
              {darkMode ? <Sun size={14} className="text-amber-300" /> : <CrescentMoonIcon size={14} isDark={false} />}
              <span>{darkMode ? (lang === 'bn' ? 'লাইট মোড' : 'Light') : (lang === 'bn' ? 'ডার্ক মোড' : 'Dark')}</span>
            </button>

            {/* Language Switcher Pill */}
            <div className="flex bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-200/70 dark:border-slate-700/70">
              <button
                type="button"
                onClick={() => onSetLang && onSetLang('bn')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  lang === 'bn' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                বাংলা
              </button>
              <button
                type="button"
                onClick={() => onSetLang && onSetLang('en')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  lang === 'en' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                Eng
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. EXECUTIVE BALANCE & WITHDRAWAL HUB CARD */}
      <div className={`rounded-3xl border transition-all p-5 shadow-sm space-y-4 relative overflow-hidden ${
        darkMode 
          ? 'bg-slate-900/95 border-slate-800 text-white' 
          : 'bg-white border-slate-200/90 text-slate-900'
      }`}>
        {/* Header: Available Balance + Verified Pill */}
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">
              {lang === 'bn' ? 'অ্যাভেইলেবল ব্যালেন্স' : 'Available Balance'}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
                {balance}
              </span>
              <span className="text-base font-black text-indigo-600 dark:text-indigo-400">
                BDT
              </span>
            </div>
          </div>
          
          <div className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60 text-[10.5px] font-black flex items-center gap-1.5 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{lang === 'bn' ? 'ভেরিফাইড একাউন্ট' : 'Verified'}</span>
          </div>
        </div>

        {/* Saved Payout Wallet Box */}
        <div className={`rounded-2xl p-3.5 border transition-all flex items-center justify-between gap-3 ${
          darkMode 
            ? 'bg-slate-800/50 border-slate-700/70' 
            : 'bg-slate-50 border-slate-200/80'
        }`}>
          {fiatWallet ? (
            <>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/90 p-1 flex items-center justify-center shrink-0 shadow-xs tp-payment-logo-box">
                  <img 
                    src={getPaymentLogo(fiatWallet.method)} 
                    alt={fiatWallet.method} 
                    className="w-full h-full object-contain" 
                  />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-black text-slate-900 dark:text-white block leading-tight">
                    {fiatWallet.method} Wallet
                  </span>
                  <span className="text-[11.5px] font-mono font-bold text-slate-600 dark:text-slate-300 block mt-0.5 truncate">
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
                className="px-3 py-1.5 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 rounded-xl transition-all border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center gap-1.5 text-xs font-bold active:scale-95 shrink-0 cursor-pointer"
              >
                <Edit3 size={13} />
                <span>{lang === 'bn' ? 'পরিবর্তন' : 'Edit'}</span>
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black shrink-0 text-base">
                  +
                </div>
                <div>
                  <span className="text-xs font-black text-slate-900 dark:text-white block leading-tight">
                    {lang === 'bn' ? 'কোন ওয়ালেট যুক্ত নেই' : 'No Payout Wallet'}
                  </span>
                  <span className="text-[10.5px] text-slate-400 dark:text-slate-500 font-medium mt-0.5 block">
                    {lang === 'bn' ? 'টাকা তুলতে bKash বা Nagad ওয়ালেট যুক্ত করুন' : 'Add bKash or Nagad to cashout'}
                  </span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowWalletModal(true)}
                className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-xs font-black shadow-xs active:scale-95 shrink-0 cursor-pointer"
              >
                {lang === 'bn' ? '+ যুক্ত করুন' : '+ Add'}
              </button>
            </>
          )}
        </div>

        {/* Primary Withdraw Action Button (Tactile 3D Button with Purple Gradient) */}
        <button
          type="button"
          onClick={handleWithdrawClick}
          disabled={withdrawing}
          className="w-full h-[52px] rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 text-white font-black text-sm flex items-center justify-center gap-2.5 border-t border-purple-300/40 shadow-[0_5px_0_#3730a3,0_12px_24px_rgba(79,70,229,0.35)] active:translate-y-1 active:shadow-[0_1px_0_#3730a3,0_6px_12px_rgba(79,70,229,0.25)] transition-all duration-150 disabled:opacity-50 disabled:shadow-none disabled:translate-y-0 cursor-pointer"
        >
          <Wallet size={18} />
          <span>{lang === 'bn' ? 'টাকা তুলুন (WITHDRAW)' : 'WITHDRAW FUNDS'}</span>
        </button>
      </div>

      {/* 3. 30-DAY SPIN & STAR GIVEAWAY CARD */}
      <div
        onClick={onGoToSpin}
        className={`p-3.5 rounded-3xl border transition-all cursor-pointer active:scale-[0.99] group shadow-xs hover:shadow-md ${
          darkMode
            ? 'bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-900 border-amber-500/30'
            : 'bg-gradient-to-r from-amber-50/90 via-orange-50/30 to-white border-amber-200/80'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-amber-100/90 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/60 flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
              <TelegramAnimatedSticker src="tg-heart-gift-sticker.json" size={32} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-black text-slate-900 dark:text-white text-xs sm:text-[13px] leading-tight">
                  {lang === 'bn' ? '৩০ দিনের মেগা স্পিন ও স্টার গিভওয়ে' : '30-Day Spin & Star Giveaway'}
                </span>
                <span className="px-2 py-0.5 bg-gradient-to-r from-amber-500 to-rose-500 text-white rounded-full text-[9px] font-black tracking-wide shadow-2xs">
                  STAR GIFT & ৳500
                </span>
              </div>
              <span className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold block mt-1 leading-snug">
                {lang === 'bn' ? 'ডেইলি ফ্রি স্পিন, রেফার ও অ্যাড দেখে স্পিন করুন!' : 'Daily free spin, referral spin & watch 3 ads for spin!'}
              </span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-amber-100/90 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-all shadow-2xs">
            <ChevronRight size={16} />
          </div>
        </div>
      </div>

      {/* 4. REFER & EARN CARD */}
      <div
        onClick={onGoToReferral}
        className={`p-3.5 rounded-3xl border transition-all cursor-pointer active:scale-[0.99] group shadow-xs hover:shadow-md ${
          darkMode
            ? 'bg-gradient-to-r from-rose-950/30 via-slate-900 to-slate-900 border-rose-500/30'
            : 'bg-gradient-to-r from-rose-50/90 via-pink-50/30 to-white border-rose-200/80'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-rose-100/90 dark:bg-rose-950/60 border border-rose-200/80 dark:border-rose-800/60 flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
              <TelegramAnimatedSticker src="tg-rose-sticker.json" size={32} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-black text-slate-900 dark:text-white text-xs sm:text-[13px] leading-tight">
                  {lang === 'bn' ? 'রেফার করুন এবং আয় করুন' : 'Refer Friends & Earn'}
                </span>
                <span className="px-2 py-0.5 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-full text-[9px] font-black tracking-wide shadow-2xs">
                  +৳5 / REF
                </span>
              </div>
              <span className={`text-[11px] ${darkMode ? 'text-rose-300' : 'text-rose-700/85'} font-semibold inline-flex items-center gap-1 mt-1 leading-snug`}>
                <span>{lang === 'bn' ? 'প্রতি সক্রিয় রেফারে ইনস্ট্যান্ট ৳৫ বোনাস পান' : 'Get instant ৳5 BDT per active referral'}</span>
                <CustomRoseIcon size={13} />
              </span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-rose-100/90 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 group-hover:bg-rose-600 group-hover:text-white transition-all shadow-2xs">
            <ChevronRight size={16} />
          </div>
        </div>
      </div>

      {/* 5. SERVICES & NAVIGATION MENU CARD */}
      <div className={`p-2.5 rounded-3xl border transition-all shadow-sm space-y-1 ${
        darkMode 
          ? 'bg-slate-900/95 border-slate-800 text-white' 
          : 'bg-white border-slate-200/90 text-slate-900'
      }`}>
        {/* History Row */}
        <div 
          onClick={onGoToHistory} 
          className="p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform shrink-0 border border-purple-100 dark:border-purple-800/60 shadow-2xs">
              <Clock size={17} />
            </div>
            <div>
              <span className="font-black text-slate-900 dark:text-white block text-xs leading-tight">
                {lang === 'bn' ? 'ট্রানজ্যাকশন হিস্ট্রি' : 'Transaction History'}
              </span>
              <span className="text-[10.5px] text-slate-400 dark:text-slate-500 font-medium">
                {lang === 'bn' ? 'সকল লেনদেন ও উইথড্রয়ের বিস্তারিত বিবরণ' : 'All buys, sells & withdrawals'}
              </span>
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
        </div>

        <div className="h-px bg-slate-100 dark:bg-slate-800 w-full" />

        {/* Customer Support Row */}
        <div 
          onClick={() => { setShowSupportModal(true); setSupportFeedback(null); }} 
          className="p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform shrink-0 border border-indigo-100 dark:border-indigo-800/60 shadow-2xs">
              <Headphones size={17} />
            </div>
            <div>
              <span className="font-black text-slate-900 dark:text-white block text-xs leading-tight">
                {lang === 'bn' ? 'কাস্টমার সাপোর্ট' : 'Customer Support'}
              </span>
              <span className="text-[10.5px] text-slate-400 dark:text-slate-500 font-medium">
                {lang === 'bn' ? 'সরাসরি হেল্পলাইন ও অ্যাডমিনের সহায়তা' : 'Direct Helpline'}
              </span>
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
        </div>

        <div className="h-px bg-slate-100 dark:bg-slate-800 w-full" />

        {/* Video Guide Row */}
        <div 
          onClick={() => {
            if (window.Telegram?.WebApp?.openLink) {
              window.Telegram.WebApp.openLink('https://youtu.be/iimWerd2dPI');
            } else {
              window.open('https://youtu.be/iimWerd2dPI', '_blank');
            }
          }} 
          className="p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400 group-hover:scale-105 transition-transform shrink-0 border border-rose-100 dark:border-rose-800/60 shadow-2xs">
              <PlayCircle size={17} />
            </div>
            <div>
              <span className="font-black text-slate-900 dark:text-white block text-xs leading-tight">
                {lang === 'bn' ? 'কীভাবে কেনাবেচা করবেন?' : 'How to Buy & Sell?'}
              </span>
              <span className="text-[10.5px] text-slate-400 dark:text-slate-500 font-medium">
                {lang === 'bn' ? 'ভিডিও টিউটোরিয়াল দেখে সহজে শিখুন' : 'Watch step-by-step video tutorial'}
              </span>
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-400 group-hover:text-rose-500 dark:group-hover:text-rose-400 transition-colors" />
        </div>
      </div>

      {/* Support Message Modal */}
      {showSupportModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
              <div className={`relative w-full max-w-[340px] p-6 rounded-3xl shadow-2xl border transition-all animate-in zoom-in-95 duration-200 overflow-hidden ${
                darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200/90 text-slate-900'
              }`}>
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
                                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-[12px] text-gray-900 focus:bg-white focus:border-violet-500 focus:ring-2 focus:ring-emerald-500/10 outline-none resize-none transition-all placeholder:text-gray-400 font-medium"
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
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-300">
              <div className={`relative w-full max-w-[340px] p-6 rounded-3xl shadow-2xl border transition-all animate-in zoom-in-95 slide-in-from-bottom-4 overflow-hidden ${
                darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200/90 text-slate-900'
              }`}>
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
                      <button
                          type="button"
                          onClick={handleSaveWallet}
                          disabled={!walletNumber || !walletName || isSaving}
                          className="w-full h-[48px] rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 text-white font-black text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md disabled:opacity-50 cursor-pointer"
                      >
                          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                          <span>{lang === 'bn' ? 'ওয়ালেট সেভ করুন' : 'SAVE WALLET'}</span>
                      </button>
                  </div>
              </div>
          </div>
      )}

      {txStatus && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200">
           <div className={`relative w-full max-w-[320px] p-6 flex flex-col items-center text-center rounded-3xl shadow-2xl border transition-all animate-in zoom-in-95 slide-in-from-bottom-4 overflow-hidden ${
             darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200/90 text-slate-900'
           }`}>
              <div className="relative z-10 w-full flex flex-col items-center">
                  {txStatus === 'success' ? (
                     <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-4 border border-emerald-200 dark:border-emerald-800/60">
                        <CheckCircle2 size={32} />
                     </div>
                  ) : (
                     <div className="w-16 h-16 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mb-4 border border-rose-200 dark:border-rose-800/60">
                        <AlertCircle size={32} />
                     </div>
                  )}
                  <h3 className={`text-xl font-black mb-2 ${txStatus === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                     {txStatus === 'success' ? (lang === 'bn' ? 'সফল হয়েছে!' : 'Success!') : (lang === 'bn' ? 'ব্যর্থ হয়েছে' : 'Error')}
                  </h3>
                  <p className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 mb-6">{txMessage}</p>
                  <button
                     type="button"
                     onClick={() => setTxStatus(null)}
                     className="w-full h-[46px] rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 text-white font-black text-xs shadow-md active:scale-95 transition-all cursor-pointer"
                  >
                     {lang === 'bn' ? 'ঠিক আছে' : 'Close'}
                  </button>
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

const SPIN_WHEEL_SLICES = [
  {
    index: 0,
    id: '1_tk',
    title: '৳1 TK',
    emoji: '🪙',
    subtitleBn: 'নগদ বোনাস',
    subtitleEn: 'Instant Cash',
    sticker: 'tg-coin-sticker.json',
    sliceBgA: '#1e1b4b',
    sliceBgB: '#312e81',
    pillBg: 'bg-emerald-500 text-white border-emerald-300'
  },
  {
    index: 1,
    id: '5_tk',
    title: '৳5 TK',
    emoji: '🌟',
    subtitleBn: 'লাকি ক্যাশ',
    subtitleEn: 'Lucky Cash',
    sticker: 'tg-star-sticker.json',
    sliceBgA: '#3b0764',
    sliceBgB: '#581c87',
    pillBg: 'bg-amber-500 text-slate-950 border-amber-200'
  },
  {
    index: 2,
    id: '10_tk',
    title: '৳10 TK',
    emoji: '💵',
    subtitleBn: 'সুপার ক্যাশ',
    subtitleEn: 'Super Cash',
    sticker: 'tg-cash-sticker.json',
    sliceBgA: '#0f172a',
    sliceBgB: '#1e293b',
    pillBg: 'bg-indigo-500 text-white border-indigo-300'
  },
  {
    index: 3,
    id: '20_tk',
    title: '৳20 TK',
    emoji: '🔥',
    subtitleBn: 'হট প্রাইজ',
    subtitleEn: 'Hot Prize',
    sticker: 'tg-fire-sticker.json',
    sliceBgA: '#4c0519',
    sliceBgB: '#881337',
    pillBg: 'bg-rose-500 text-white border-rose-300'
  },
  {
    index: 4,
    id: 'teddy',
    title: 'Star Gift',
    emoji: '💝',
    subtitleBn: '💝 স্টার গিফট',
    subtitleEn: '💝 Star Gift',
    sticker: 'tg-heart-gift-sticker.json',
    sliceBgA: '#78350f',
    sliceBgB: '#b45309',
    pillBg: 'bg-gradient-to-r from-amber-400 to-rose-500 text-white border-yellow-200',
    isSpecialGift: true
  },
  {
    index: 5,
    id: '100_tk',
    title: '৳100 TK',
    emoji: '💰',
    subtitleBn: 'রয়েল ক্যাশ',
    subtitleEn: 'Royal Cash',
    sticker: 'tg-moneybag-sticker.json',
    sliceBgA: '#1e1b4b',
    sliceBgB: '#3730a3',
    pillBg: 'bg-purple-500 text-white border-purple-300'
  },
  {
    index: 6,
    id: 'again',
    title: 'Again',
    emoji: '🎯',
    subtitleBn: 'আবার চেষ্টা করুন',
    subtitleEn: 'Try Later',
    sticker: 'tg-target-sticker.json',
    sliceBgA: '#111827',
    sliceBgB: '#1f2937',
    pillBg: 'bg-slate-600 text-white border-slate-400'
  },
  {
    index: 7,
    id: '500_tk',
    title: '৳500 TK',
    emoji: '🏆',
    subtitleBn: 'মেগা ক্যাশ',
    subtitleEn: 'Mega Cash',
    sticker: 'tg-trophy-sticker.json',
    sliceBgA: '#451a03',
    sliceBgB: '#92400e',
    pillBg: 'bg-amber-400 text-slate-950 border-yellow-200'
  },
  {
    index: 8,
    id: '1_usd',
    title: '$1 USD',
    emoji: '💎',
    subtitleBn: '≈ ৳১২০ টাকা',
    subtitleEn: '≈ ৳120 BDT',
    sticker: 'tg-gem-sticker.json',
    sliceBgA: '#082f49',
    sliceBgB: '#0369a1',
    pillBg: 'bg-sky-500 text-white border-sky-200'
  }
];

// Helper to create SVG path for a 40-degree wheel sector centered at `index * 40` degrees (0 deg = 12 o'clock)
function getWheelSectorPath(index, totalSlices = 9, cx = 180, cy = 180, r = 174) {
  const sliceDeg = 360 / totalSlices;
  const startDeg = index * sliceDeg - sliceDeg / 2 - 90;
  const endDeg = index * sliceDeg + sliceDeg / 2 - 90;
  const startRad = (startDeg * Math.PI) / 180;
  const endRad = (endDeg * Math.PI) / 180;
  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);
  return `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
}

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
    monetagZoneId: '12077323',
    adsgramBlockId: ''
  }));
  const [loading, setLoading] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const wheelRotationRef = useRef(0);
  const wheelDomRef = useRef(null);
  const spinAnimRef = useRef(null);
  const [pointerKick, setPointerKick] = useState(false);
  const [activeSliceIndex, setActiveSliceIndex] = useState(0);
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
        setSpinStatus(prev => ({
          ...prev,
          ...data,
          monetagZoneId: data.monetagZoneId || prev.monetagZoneId || '12077323'
        }));
      }
    } catch (e) {
      console.warn('loadSpinData error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSpinData();
    return () => {
      if (spinAnimRef.current) cancelAnimationFrame(spinAnimRef.current);
    };
  }, [userId]);

  // External ad scripts are deferred and loaded on-demand when user clicks 'Watch Ad'
  // (Prevents freezing the mobile UI on spin page navigation)

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

  // 60fps Smooth Physics Wheel Spin with Peg Flapper Bounce & Haptic Ticks
  const animateWheelToTarget = (targetIndex, onFinish) => {
    if (spinAnimRef.current) cancelAnimationFrame(spinAnimRef.current);

    const startAngle = wheelRotationRef.current;
    const desiredMod = (360 - targetIndex * 40) % 360;
    const currentMod = ((startAngle % 360) + 360) % 360;
    let deltaDeg = desiredMod - currentMod;
    if (deltaDeg <= 0) deltaDeg += 360;

    // 6 full turns (2160 deg) + exact delta to land dead-center at 12 o'clock
    const totalSpinDeg = 6 * 360 + deltaDeg;
    const finalAngle = startAngle + totalSpinDeg;
    const durationMs = 4200;
    const startTime = performance.now();
    let lastSectorTick = Math.floor((startAngle + 20) / 40);

    const stepFrame = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      // Smooth casino deceleration curve: fast start, suspenseful slow finish
      const eased = 1 - Math.pow(1 - progress, 3.6);
      const currentAngle = startAngle + totalSpinDeg * eased;

      wheelRotationRef.current = currentAngle;
      if (wheelDomRef.current) {
        wheelDomRef.current.style.transform = `rotate(${currentAngle}deg)`;
      }

      const currentSectorTick = Math.floor((currentAngle + 20) / 40);
      if (currentSectorTick !== lastSectorTick) {
        lastSectorTick = currentSectorTick;
        setPointerKick(true);
        setTimeout(() => setPointerKick(false), 75);
        try {
          if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.selectionChanged();
          }
        } catch (_) {}
      }

      if (progress < 1) {
        spinAnimRef.current = requestAnimationFrame(stepFrame);
      } else {
        wheelRotationRef.current = finalAngle;
        setWheelRotation(finalAngle);
        setPointerKick(false);
        if (onFinish) onFinish();
      }
    };

    spinAnimRef.current = requestAnimationFrame(stepFrame);
  };

  // Handle Round Wheel Spin
  const handleStartSpin = async () => {
    if (isSpinning) return;
    if ((spinStatus.totalAvailableSpins || 0) <= 0) {
      setSpinError(
        lang === 'bn'
          ? 'স্পিন শেষ! নিচে অ্যাড দেখে বা রেফার করে ফ্রি স্পিন নিন।'
          : 'No spins left! Watch ads or refer a friend below.'
      );
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('warning');
      }
      return;
    }

    setSpinError('');
    setIsSpinning(true);
    setSpinResultModal(null);

    // Start spinning immediately at 0ms while API request resolves
    if (spinAnimRef.current) cancelAnimationFrame(spinAnimRef.current);
    const preSpinLoop = () => {
      wheelRotationRef.current += 11;
      if (wheelDomRef.current) {
        wheelDomRef.current.style.transform = `rotate(${wheelRotationRef.current}deg)`;
      }
      spinAnimRef.current = requestAnimationFrame(preSpinLoop);
    };
    spinAnimRef.current = requestAnimationFrame(preSpinLoop);

    try {
      const res = await executeSpin(userId);
      if (!res || !res.success) {
        if (spinAnimRef.current) cancelAnimationFrame(spinAnimRef.current);
        throw new Error(res?.error || 'Spin failed');
      }

      const targetIndex = typeof res.winningIndex === 'number' ? res.winningIndex : 6;

      animateWheelToTarget(targetIndex, () => {
        setActiveSliceIndex(targetIndex);
        try {
          if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred(
              targetIndex === 6 && !res.bonusFreeRespin ? 'warning' : 'success'
            );
          }
        } catch (_) {}

        setSpinStatus(prev => ({
          ...prev,
          dailyFreeAvailable: res.dailyFreeAvailable,
          nextDailySpinAt: res.nextDailySpinAt,
          extraSpins: res.extraSpins,
          totalAvailableSpins: res.totalAvailableSpins,
          totalSpinsByUser: (prev.totalSpinsByUser || 0) + 1,
          totalWonBdt: (prev.totalWonBdt || 0) + (res.bdtWon || 0)
        }));

        if (res.bdtWon > 0 && reloadData) {
          reloadData();
        }

        setTimeout(() => {
          setIsSpinning(false);
          setSpinResultModal({
            card: SPIN_WHEEL_SLICES[targetIndex] || SPIN_WHEEL_SLICES[6],
            bdtWon: res.bdtWon || 0,
            isMilestoneWinner: Boolean(res.isMilestoneWinner),
            bonusFreeRespin: Boolean(res.bonusFreeRespin)
          });
        }, 320);
      });
    } catch (err) {
      if (spinAnimRef.current) cancelAnimationFrame(spinAnimRef.current);
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
              ? '🎉 ৩টি অ্যাড সম্পন্ন! +১টি ফ্রি স্পিন পেয়েছেন!'
              : '🎉 3 Ads Completed! +1 Free Spin unlocked!'
          );
          setTimeout(() => setAdUnlockToast(''), 4500);
          if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
          }
        } else {
          setAdUnlockToast(
            lang === 'bn'
              ? `✅ অ্যাড সম্পন্ন (${res.adProgress}/3)! আর ${3 - res.adProgress}টি দেখলেই ১টি স্পিন ফ্রি।`
              : `✅ Ad watched (${res.adProgress}/3)! Watch ${3 - res.adProgress} more for 1 Spin.`
          );
          setTimeout(() => setAdUnlockToast(''), 3500);
        }
      }
    } catch (err) {
      setSpinError(err.message || 'Ad verification error');
    } finally {
      setIsWatchingAd(false);
    }
  };

  // Trigger Monetag (show_12077323 Rewarded Interstitial -> Rewarded Popup) or Adsgram or Fallback
  const handleWatchAdClick = async () => {
    if (isWatchingAd || isSpinning) return;
    setSpinError('');
    setIsWatchingAd(true);

    const zoneId = String(spinStatus.monetagZoneId || '12077323').trim();
    const monetagFn = window[`show_${zoneId}`] || window.show_12077323;

    if (typeof monetagFn === 'function') {
      try {
        await monetagFn();
        await completeOneAdWatch();
        return;
      } catch (errInterstitial) {
        try {
          await monetagFn('pop');
          await completeOneAdWatch();
          return;
        } catch (errPop) {
          console.warn('Monetag interstitial & pop fallback:', errPop);
        }
      }
    }

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

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300 pb-12 max-w-md mx-auto">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-xs border border-amber-200 active:scale-95 transition-transform text-amber-700 cursor-pointer shrink-0"
          >
            <ArrowLeft size={17} strokeWidth={2.5} />
          </button>
          <div>
            <h2 className="text-[14.5px] font-black text-slate-900 leading-tight">
              {lang === 'bn' ? 'লাকি স্পিন ও গিভওয়ে' : 'Lucky Spin & Giveaway'}
            </h2>
            <p className="text-[10px] text-amber-600 font-bold leading-none mt-0.5">
              {lang === 'bn' ? 'স্পিন ঘুরিয়ে জিতুন Star Gift ও ক্যাশ!' : 'Spin to win Star Gift & Cash!'}
            </p>
          </div>
        </div>

        {/* Won Balance Pill */}
        <div className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10.5px] font-black shrink-0">
          {lang === 'bn' ? `জয়: ৳${spinStatus.totalWonBdt || 0}` : `Won: ৳${spinStatus.totalWonBdt || 0}`}
        </div>
      </div>

      {/* 1. COMPACT 30-DAY COUNTDOWN BANNER */}
      <CutCornerCard
        className={`p-3 border ${
          darkMode
            ? 'bg-slate-900 border-amber-500/35'
            : 'bg-gradient-to-r from-amber-50/90 via-white to-rose-50/85 border-amber-200/85'
        }`}
        flower={<ReferralRosePattern />}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-100/90 border border-amber-200 flex items-center justify-center shrink-0">
              <TelegramAnimatedSticker src="tg-crown-sticker.json" size={28} />
            </div>
            <div className="min-w-0">
              <span className="inline-block px-2 py-0.5 rounded-full bg-gradient-to-r from-rose-600 to-amber-600 text-white text-[8px] font-black uppercase tracking-wider leading-none">
                30 DAYS EVENT
              </span>
              <h3 className="text-[12px] font-black text-slate-900 leading-tight mt-1 truncate">
                {lang === 'bn' ? 'ইভেন্ট বাকি:' : 'Ends In:'}
              </h3>
            </div>
          </div>

          {/* 4-Box Live Countdown */}
          <div className="flex items-center gap-1 shrink-0">
            {[
              { val: eventCountdown.days, lbl: lang === 'bn' ? 'দিন' : 'D' },
              { val: eventCountdown.hours, lbl: lang === 'bn' ? 'ঘণ্টা' : 'H' },
              { val: eventCountdown.mins, lbl: lang === 'bn' ? 'মিনিট' : 'M' },
              { val: eventCountdown.secs, lbl: lang === 'bn' ? 'সে.' : 'S' }
            ].map((item, i) => (
              <div
                key={i}
                className="min-w-[34px] px-1.5 py-1 rounded-lg bg-slate-900 text-white text-center border border-amber-400/50 shadow-xs"
              >
                <span className="text-[11.5px] font-black text-amber-300 block leading-none font-mono">
                  {item.val}
                </span>
                <span className="text-[7.5px] font-bold text-slate-300 block mt-0.5">{item.lbl}</span>
              </div>
            ))}
          </div>
        </div>
      </CutCornerCard>

      {/* 2. CENTERED ROUND 3D ROYAL SPIN WHEEL CARD */}
      <CutCornerCard
        className={`p-3.5 border ${
          darkMode
            ? 'bg-slate-900 border-indigo-500/45'
            : 'bg-gradient-to-b from-indigo-50/75 via-white to-rose-50/65 border-indigo-200/85'
        }`}
        flower={<SellCryptoMandalaPattern />}
      >
        {/* TOP OF WHEEL: CLEAR SPINS LEFT BADGE */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5">
            <TelegramAnimatedSticker src="tg-heart-gift-sticker.json" size={20} />
            <span className="text-[12px] font-black text-slate-800">
              {lang === 'bn' ? 'রয়েল স্পিন হুইল' : 'Royal Spin Wheel'}
            </span>
          </div>

          {/* Prominent Spins Remaining Badge Right Above the Wheel */}
          <div className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 text-white text-[11px] font-black shadow-sm flex items-center gap-1.5">
            <Sparkles size={12} />
            <span>
              {lang === 'bn'
                ? `স্পিন বাকি: ${spinStatus.totalAvailableSpins || 0}টি`
                : `Spins Left: ${spinStatus.totalAvailableSpins || 0}`}
            </span>
          </div>
        </div>

        {/* PERFECTLY CENTERED ROUND WHEEL WRAPPER */}
        <div className="w-full flex flex-col items-center justify-center py-2">
          <div
            className="relative flex items-center justify-center mx-auto shrink-0"
            style={{ width: 274, height: 274 }}
          >
            {/* Ambient Golden/Royal Backlight Glow */}
            <div
              className="absolute inset-0 rounded-full pointer-events-none blur-xl opacity-65"
              style={{
                background:
                  'radial-gradient(circle, rgba(245,158,11,0.5) 0%, rgba(168,85,247,0.38) 55%, transparent 78%)'
              }}
            />

            {/* TOP 12 O'CLOCK 3D GOLDEN POINTER WITH FLAPPER BOUNCE */}
            <div
              className="absolute -top-3 left-1/2 z-30 pointer-events-none flex flex-col items-center drop-shadow-[0_5px_10px_rgba(0,0,0,0.65)] transition-transform duration-75"
              style={{
                transform: `translateX(-50%) rotate(${pointerKick ? '-16deg' : '0deg'})`,
                transformOrigin: 'top center'
              }}
            >
              <div className="w-5 h-5 rounded-full bg-gradient-to-b from-yellow-300 via-amber-500 to-amber-700 border-2 border-white flex items-center justify-center shadow-md">
                <div className="w-2 h-2 rounded-full bg-rose-600 border border-yellow-200" />
              </div>
              <div
                className="-mt-1"
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: '10px solid transparent',
                  borderRight: '10px solid transparent',
                  borderTop: '17px solid #f59e0b',
                  filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.45))'
                }}
              />
            </div>

            {/* OUTER ROYAL GOLD BEZEL RING */}
            <div
              className="relative w-full h-full rounded-full p-[9px] flex items-center justify-center"
              style={{
                background:
                  'conic-gradient(from 0deg, #fbbf24, #d97706, #fef08a, #b45309, #fbbf24, #92400e, #fef08a, #d97706, #fbbf24)',
                boxShadow:
                  '0 10px 28px rgba(15, 23, 42, 0.42), inset 0 2px 5px rgba(255,255,255,0.8), inset 0 -3px 7px rgba(120,53,15,0.85)'
              }}
            >
              {/* 18 Twinkling Casino Rim Lights */}
              {Array.from({ length: 18 }).map((_, idx) => {
                const deg = idx * 20;
                const isGold = idx % 2 === 0;
                return (
                  <div
                    key={idx}
                    className="absolute inset-0 pointer-events-none"
                    style={{ transform: `rotate(${deg}deg)` }}
                  >
                    <div
                      className={`mx-auto mt-[2px] w-[5px] h-[5px] rounded-full ${
                        isSpinning ? 'animate-ping' : 'animate-pulse'
                      }`}
                      style={{
                        backgroundColor: isGold ? '#ffffff' : '#fb7185',
                        boxShadow: isGold
                          ? '0 0 6px #fef08a, 0 0 10px #f59e0b'
                          : '0 0 6px #fda4af, 0 0 10px #e11d48'
                      }}
                    />
                  </div>
                );
              })}

              {/* ROTATING INNER WHEEL DISC (DRIVEN BY 60FPS RAF - HARDWARE ACCELERATED) */}
              <div
                ref={wheelDomRef}
                className="relative w-full h-full rounded-full overflow-hidden border-[2.5px] border-slate-950/90 shadow-inner"
                style={{
                  transform: `rotate(${wheelRotation}deg)`,
                  willChange: 'transform'
                }}
              >
                {/* SVG 9-Sector Radial Wheel Background */}
                <svg viewBox="0 0 360 360" className="w-full h-full block">
                  <defs>
                    {SPIN_WHEEL_SLICES.map((slice) => (
                      <radialGradient
                        key={`grad-${slice.id}`}
                        id={`wheelGrad-${slice.index}`}
                        cx="50%"
                        cy="50%"
                        r="55%"
                      >
                        <stop offset="15%" stopColor={slice.sliceBgA} />
                        <stop offset="100%" stopColor={slice.sliceBgB} />
                      </radialGradient>
                    ))}
                  </defs>

                  {SPIN_WHEEL_SLICES.map((slice) => (
                    <path
                      key={`sector-${slice.id}`}
                      d={getWheelSectorPath(slice.index, 9, 180, 180, 180)}
                      fill={`url(#wheelGrad-${slice.index})`}
                      stroke="#fbbf24"
                      strokeWidth="2.2"
                    />
                  ))}

                  <circle
                    cx="180"
                    cy="180"
                    r="142"
                    fill="none"
                    stroke="rgba(251, 191, 36, 0.25)"
                    strokeWidth="1.2"
                    strokeDasharray="4 4"
                  />
                  <circle
                    cx="180"
                    cy="180"
                    r="48"
                    fill="none"
                    stroke="rgba(251, 191, 36, 0.55)"
                    strokeWidth="2"
                  />
                </svg>

                {/* 9 FLOATING MINI PRIZE CARDS WITH 3D TELEGRAM STICKERS */}
                {SPIN_WHEEL_SLICES.map((slice) => {
                  const angleDeg = slice.index * 40;
                  const isWinnerHighlight = !isSpinning && activeSliceIndex === slice.index;
                  return (
                    <div
                      key={`pod-${slice.id}`}
                      className="absolute left-1/2 top-1/2 pointer-events-none select-none"
                      style={{
                        transform: `translate(-50%, -50%) rotate(${angleDeg}deg) translateY(-82px)`
                      }}
                    >
                      <div
                        className={`flex flex-col items-center justify-center px-1 py-0.5 rounded-xl border transition-all ${
                          slice.isSpecialGift
                            ? 'bg-gradient-to-b from-amber-400/35 via-rose-500/35 to-slate-900/90 border-yellow-300 shadow-[0_0_10px_rgba(251,191,36,0.55)]'
                            : isWinnerHighlight
                            ? 'bg-white/20 border-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.45)]'
                            : 'bg-slate-950/45 border-white/20'
                        }`}
                        style={{ minWidth: 46 }}
                      >
                        <div className="w-6 h-6 flex items-center justify-center">
                          <span className="text-[17px] leading-none select-none drop-shadow-xs">
                            {slice.emoji}
                          </span>
                        </div>

                        <span
                          className={`mt-0.5 px-1.5 py-0.2 rounded-full text-[8.5px] font-black leading-tight tracking-tight border shadow-2xs whitespace-nowrap ${slice.pillBg}`}
                        >
                          {slice.title}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* CENTER 3D "SPIN" HUB BUTTON */}
              <button
                type="button"
                onClick={handleStartSpin}
                disabled={isSpinning}
                className="absolute z-20 w-[62px] h-[62px] rounded-full p-1 cursor-pointer active:scale-95 transition-transform flex items-center justify-center shadow-[0_6px_18px_rgba(0,0,0,0.65)]"
                style={{
                  background: 'linear-gradient(135deg, #fde047 0%, #f59e0b 50%, #b45309 100%)'
                }}
              >
                <div className="w-full h-full rounded-full bg-gradient-to-b from-indigo-900 via-slate-900 to-rose-950 border-2 border-yellow-200/80 flex flex-col items-center justify-center text-white shadow-inner">
                  {isSpinning ? (
                    <Loader2 size={18} className="animate-spin text-amber-300" />
                  ) : (
                    <>
                      <Sparkles size={12} className="text-amber-300" />
                      <span className="text-[11px] font-black tracking-wider text-amber-200 leading-none mt-0.5">
                        SPIN
                      </span>
                    </>
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Error / Ad Unlock Status Toast */}
        {spinError && (
          <div className="mt-1.5 mb-2 p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold text-center">
            {spinError}
          </div>
        )}
        {adUnlockToast && (
          <div className="mt-1.5 mb-2 p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold text-center animate-in fade-in">
            {adUnlockToast}
          </div>
        )}

        {/* CLEAN SINGLE-WORD "SPIN" BUTTON BELOW WHEEL */}
        <button
          type="button"
          onClick={handleStartSpin}
          disabled={isSpinning}
          className={`mt-2 w-full py-3 px-4 rounded-xl font-black text-[15px] tracking-wider uppercase text-white shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] ${
            isSpinning
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 opacity-90 cursor-wait'
              : (spinStatus.totalAvailableSpins || 0) > 0
              ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 hover:brightness-105 shadow-rose-500/25'
              : 'bg-slate-700 hover:bg-slate-800 text-[12.5px]'
          }`}
        >
          {isSpinning ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>SPINNING...</span>
            </>
          ) : (spinStatus.totalAvailableSpins || 0) > 0 ? (
            <>
              <Sparkles size={18} />
              <span>SPIN</span>
            </>
          ) : (
            <>
              <Clock size={16} />
              <span>
                {dailyCooldownStr
                  ? lang === 'bn'
                    ? `ডেইলি স্পিন: ${dailyCooldownStr}`
                    : `Next Spin: ${dailyCooldownStr}`
                  : 'SPIN'}
              </span>
            </>
          )}
        </button>
      </CutCornerCard>

      {/* 3. SHORT & CLEAN: WATCH 3 ADS = 1 FREE SPIN CARD */}
      <CutCornerCard
        className={`p-3 border space-y-2 ${
          darkMode
            ? 'bg-slate-900 border-emerald-500/35'
            : 'bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/60 border-emerald-200/80'
        }`}
        flower={<AddMoneyFloraPattern />}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-100/90 border border-emerald-200 flex items-center justify-center shrink-0">
              <TelegramAnimatedSticker src="tg-sparkles-sticker.json" size={26} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-[12.5px] font-black text-slate-900 leading-tight truncate">
                  {lang === 'bn' ? '৩টি অ্যাড = ১টি ফ্রি স্পিন' : '3 Ads = +1 Free Spin'}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[8.5px] font-black shrink-0">
                  {spinStatus.adProgress || 0}/3
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-semibold mt-0.5 truncate">
                {lang === 'bn' ? '৩টি অ্যাড দেখলেই ১টি স্পিন ফ্রি!' : 'Watch 3 short ads to get 1 free spin!'}
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
                className={`py-1.5 px-2 rounded-xl border text-center flex items-center justify-center gap-1 text-[10px] font-black transition-all ${
                  done
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                {done ? <CheckCircle2 size={12} className="text-emerald-600" /> : <PlayCircle size={12} />}
                <span>{lang === 'bn' ? `অ্যাড ${stepNum}` : `Ad ${stepNum}`}</span>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleWatchAdClick}
          disabled={isWatchingAd || isSpinning}
          className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[12px] shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60"
        >
          {isWatchingAd ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              <span>{lang === 'bn' ? 'লোড হচ্ছে...' : 'Loading...'}</span>
            </>
          ) : (
            <>
              <PlayCircle size={15} />
              <span>
                {lang === 'bn'
                  ? `অ্যাড দেখুন (${spinStatus.adProgress || 0}/3)`
                  : `Watch Ad (${spinStatus.adProgress || 0}/3)`}
              </span>
            </>
          )}
        </button>
      </CutCornerCard>

      {/* 4. SHORT & CLEAN: 1 REFERRAL = 1 FREE SPIN CARD */}
      <CutCornerCard
        className={`p-3 border space-y-2 ${
          darkMode
            ? 'bg-slate-900 border-rose-500/35'
            : 'bg-gradient-to-br from-rose-50/85 via-white to-pink-50/75 border-rose-200/80'
        }`}
        flower={<CardRoseBranch />}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-rose-100/90 border border-rose-200 flex items-center justify-center shrink-0">
            <TelegramAnimatedSticker src="tg-rose-sticker.json" size={26} />
          </div>
          <div className="min-w-0">
            <h3 className="text-[12.5px] font-black text-slate-900 leading-tight truncate">
              {lang === 'bn' ? '১টি রেফার = ১টি ফ্রি স্পিন + ৳৫' : '1 Referral = +1 Free Spin + ৳5'}
            </h3>
            <p className="text-[10px] text-slate-600 font-semibold mt-0.5 truncate">
              {lang === 'bn'
                ? 'বন্ধু জয়েন করলেই সাথে সাথে ১টি ফ্রি স্পিন পাবেন!'
                : 'Get +1 Free Spin as soon as a friend joins!'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onGoToReferral}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-black text-[12px] shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer"
        >
          <Share2 size={14} />
          <span>{lang === 'bn' ? 'রেফার করে স্পিন নিন' : 'Refer & Get Spin'}</span>
        </button>
      </CutCornerCard>

      {/* BUILT-IN 10-SECOND SPONSORED AD MODAL FALLBACK */}
      {showFallbackAdModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-[330px] bg-slate-900 border border-indigo-500/40 rounded-2xl p-5 text-center space-y-3.5 shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[9.5px] font-black uppercase">
                Sponsored Ad • {(spinStatus.adProgress || 0) + 1}/3
              </span>
              <span className="text-[11px] font-mono font-black text-emerald-400">
                {fallbackAdTimer > 0 ? `⏳ ${fallbackAdTimer}s` : '✓ Ready'}
              </span>
            </div>

            <div className="py-2 flex flex-col items-center space-y-2">
              <TelegramAnimatedSticker src="tg-gem-sticker.json" size={54} />
              <h3 className="text-[14.5px] font-black text-white">Trust Pay — Crypto Exchange</h3>
              <p className="text-[11px] text-slate-300 leading-snug">
                {lang === 'bn'
                  ? 'মাত্র ২০ টাকা থেকে TON, GRAM ও USDT কেনাবেচা ও বিকাশ/নগদে পেমেন্ট!'
                  : 'Buy & Sell TON, GRAM & USDT with instant bKash & Nagad payout!'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleClaimFallbackAd}
              disabled={fallbackAdTimer > 0}
              className={`w-full py-2.5 rounded-xl font-black text-[12px] transition-all cursor-pointer ${
                fallbackAdTimer > 0
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg'
              }`}
            >
              {fallbackAdTimer > 0
                ? lang === 'bn'
                  ? `অপেক্ষা করুন (${fallbackAdTimer}s)...`
                  : `Wait ${fallbackAdTimer}s...`
                : lang === 'bn'
                ? '✅ রিওয়ার্ড নিন'
                : '✅ Claim Reward'}
            </button>
          </div>
        </div>
      )}

      {/* LUXURY ANIMATED PRIZE POPUP MODAL */}
      {spinResultModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-[310px] rounded-3xl p-6 text-center space-y-3.5 shadow-[0_20px_60px_rgba(0,0,0,0.8)] border-2 border-amber-400/90 bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white overflow-hidden animate-in zoom-in-90 duration-300">
            {/* Rotating Golden Light Burst Behind Sticker */}
            <div
              className="absolute -top-12 left-1/2 -translate-x-1/2 w-56 h-56 rounded-full pointer-events-none opacity-30 blur-xl"
              style={{
                background:
                  'conic-gradient(from 0deg, #f59e0b, transparent, #ec4899, transparent, #6366f1, transparent, #f59e0b)',
                animation: 'flowerSpin 9s linear infinite'
              }}
            />

            {/* Top Celebration Badge */}
            <div className="relative z-10">
              {spinResultModal.isMilestoneWinner ? (
                <span className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-rose-600 text-slate-950 text-[9.5px] font-black uppercase tracking-wider shadow-sm">
                  🏆 MEGA JACKPOT WINNER!
                </span>
              ) : (
                <span className="inline-block px-3 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-[9.5px] font-black uppercase tracking-wider">
                  {spinResultModal.card.id === 'again'
                    ? lang === 'bn'
                      ? 'স্পিন রেজাল্ট'
                      : 'SPIN RESULT'
                    : lang === 'bn'
                    ? '🎉 অভিনন্দন!'
                    : '🎉 CONGRATULATIONS!'}
                </span>
              )}
            </div>

            {/* Prize 3D Animated Sticker Showcase */}
            <div className="relative z-10 flex items-center justify-center py-1">
              <div className="w-24 h-24 rounded-full bg-gradient-to-b from-amber-400/25 to-rose-500/20 border-2 border-amber-300/60 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.45)]">
                <TelegramAnimatedSticker src={spinResultModal.card.sticker} size={68} />
              </div>
              {spinResultModal.card.id !== 'again' && (
                <div className="absolute -right-1 -top-1 pointer-events-none">
                  <TelegramAnimatedSticker src="tg-party-sticker.json" size={38} />
                </div>
              )}
            </div>

            {/* Big Glowing Prize Title */}
            <div className="relative z-10 space-y-1">
              <div className="inline-block px-4 py-1 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 font-black text-xl shadow-md">
                {spinResultModal.card.title}
              </div>

              <h3 className="text-[15px] font-black text-white pt-1">
                {spinResultModal.card.id === 'again'
                  ? spinResultModal.bonusFreeRespin
                    ? lang === 'bn'
                      ? '🎁 +১টি বোনাস ফ্রি স্পিন পেয়েছেন!'
                      : '🎁 +1 Bonus Free Spin!'
                    : lang === 'bn'
                    ? 'আবার চেষ্টা করুন!'
                    : 'Try Again!'
                  : lang === 'bn'
                  ? `আপনি জিতেছেন ${spinResultModal.card.title}!`
                  : `You Won ${spinResultModal.card.title}!`}
              </h3>

              <p className="text-[11px] text-slate-300 font-medium leading-snug">
                {spinResultModal.bdtWon > 0
                  ? lang === 'bn'
                    ? `৳${spinResultModal.bdtWon} টাকা আপনার মূল ব্যালেন্সে যোগ হয়েছে!`
                    : `৳${spinResultModal.bdtWon} BDT added to your balance!`
                  : spinResultModal.card.id === 'teddy'
                  ? lang === 'bn'
                    ? 'অ্যাডমিন টিম আপনার আইডিতে Star Gift পাঠিয়ে দিবে।'
                    : 'Admin team will send your Star Gift shortly.'
                  : spinResultModal.bonusFreeRespin
                  ? lang === 'bn'
                    ? 'এখনই আবার ফ্রি স্পিন করুন!'
                    : 'Spin again right now!'
                  : lang === 'bn'
                  ? 'অ্যাড দেখে বা রেফার করে আবার স্পিন করুন!'
                  : 'Watch ads or refer a friend to spin again!'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSpinResultModal(null)}
              className="relative z-10 w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-600 text-white font-black text-[13px] shadow-lg active:scale-95 transition-all cursor-pointer"
            >
              {lang === 'bn' ? 'ঠিক আছে (OK)' : 'COLLECT'}
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

    const hasSell = Boolean(antiAbuseData?.hasSellBalance);
    const isDepositUser = Boolean(antiAbuseData?.hasDepositWithoutTrade) && !hasSell;
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
        <div className="space-y-3.5 animate-in fade-in slide-in-from-right-4 duration-300 max-w-md mx-auto pb-24">
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
                <button 
                    type="button"
                    onClick={onBack} 
                    className="w-10 h-10 bg-white/95 dark:bg-slate-900/90 rounded-2xl flex items-center justify-center text-slate-700 dark:text-slate-300 active:scale-95 transition-all border border-slate-200/90 dark:border-slate-800 shadow-xs cursor-pointer"
                >
                    <ChevronRight size={18} className="rotate-180" strokeWidth={2.5} />
                </button>
                <div>
                    <h2 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                        {t?.withdrawFunds || (lang === 'bn' ? 'টাকা উত্তোলন করুন' : 'Withdraw Funds')}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold">
                        {lang === 'bn' ? `${fiatWallet?.method || 'ওয়ালেট'}-এ ইনস্ট্যান্ট ক্যাশআউট` : `Instant Cashout to ${fiatWallet?.method || 'Wallet'}`}
                    </p>
                </div>
            </div>

            {/* Available Balance Executive Card */}
            <div className="p-4 rounded-3xl bg-gradient-to-r from-purple-600/10 via-indigo-600/10 to-violet-600/10 border border-purple-500/20 dark:border-purple-500/30 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-sm shrink-0">
                        <Wallet size={19} />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            {lang === 'bn' ? 'উত্তোলনযোগ্য ব্যালেন্স' : 'Available Balance'}
                        </p>
                        <p className="text-xl font-black text-slate-900 dark:text-white leading-none mt-0.5">
                            ৳{balance.toFixed(2)} <span className="text-xs font-bold text-purple-600 dark:text-purple-400">BDT</span>
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={handleMax}
                    className="px-3.5 py-1.5 rounded-xl bg-purple-600 text-white hover:bg-purple-700 text-xs font-black transition-all active:scale-95 cursor-pointer shadow-xs"
                >
                    MAX
                </button>
            </div>

            {/* Optional Status Badge for Pending without blocking */}
            {fiatWithdrawPending && fiatWithdrawPending.status === 'pending' && (
                <div className="p-3.5 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 bg-amber-500/20 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
                            <Clock size={17} />
                        </div>
                        <div>
                            <p className="text-xs font-black text-amber-900 dark:text-amber-300">
                                {lang === 'bn' ? 'প্রক্রিয়াধীন:' : 'Processing:'} ৳{fiatWithdrawPending.amount} BDT
                            </p>
                            <p className="text-[11px] text-amber-700/80 dark:text-amber-400 font-semibold">
                                via {fiatWithdrawPending.method} ({fiatWithdrawPending.number})
                            </p>
                        </div>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-800 dark:text-amber-300 px-2.5 py-1 rounded-xl border border-amber-500/30">
                        {t?.inProgress || 'In Progress'}
                    </span>
                </div>
            )}

            {/* Anti-Abuse Notification Banner for Deposit Users */}
            {isDepositUser && spentSinceLastDeposit < 20 && (
                <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-3xl p-4 text-xs flex items-start gap-3 shadow-xs">
                    <span className="text-xl leading-none shrink-0">⚠️</span>
                    <div className="space-y-1">
                        <p className="font-black text-amber-900 dark:text-amber-300 text-[13px] leading-tight">
                            {lang === 'bn' ? 'উইথড্র নিরাপত্তা নীতি (Policy)' : 'Withdrawal Policy'}
                        </p>
                        <p className="text-amber-800 dark:text-amber-400 font-semibold text-xs leading-relaxed">
                            {lang === 'bn' 
                                ? `অ্যাড মানি করার পর উইথড্র চালু করতে নূন্যতম ২০ টাকার ক্রিপ্টো ক্রয় সম্পন্ন করুন। খরচ বাকি: ৳${Math.max(0, 20 - spentSinceLastDeposit)} টাকা।` 
                                : `Please purchase at least 20 BDT crypto to unlock withdrawals. Remaining: ৳${Math.max(0, 20 - spentSinceLastDeposit)} BDT.`}
                        </p>
                    </div>
                </div>
            )}

            {/* Amount Input Card (Executive Rounded-3xl Card) */}
            <div className="p-5 rounded-3xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
                <div className="flex justify-between items-center">
                    <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {lang === 'bn' ? `উত্তোলনের পরিমাণ (${isDepositUser ? 'মিনিমাম ৩০' : 'মিনিমাম ২০'} BDT)` : `Amount (Min ${minAmount} BDT)`}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                        {isDepositUser ? 'Min ৳30' : 'Min ৳20'}
                    </span>
                </div>
                <div className="relative flex items-center">
                    <span className="absolute left-4 text-purple-600 font-black text-2xl select-none">৳</span>
                    <input 
                        type="number" 
                        value={amount} 
                        onChange={(e) => setAmount(e.target.value)} 
                        placeholder={isDepositUser ? "30.00" : "20.00"} 
                        className="w-full h-[56px] bg-slate-50 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700/80 rounded-2xl pl-10 pr-20 font-black text-2xl text-slate-900 dark:text-white outline-none focus:border-purple-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-purple-500/10 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
                    />
                    <button 
                        type="button"
                        onClick={handleMax} 
                        className="absolute right-3 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-xs rounded-xl active:scale-95 transition-all shadow-xs cursor-pointer"
                    >
                        MAX
                    </button>
                </div>
            </div>

            {/* Live Fee Breakdown */}
            {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && (
                <div className="p-4 rounded-3xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-2 text-xs">
                    <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 font-bold">
                        <span>{lang === 'bn' ? 'উত্তোলনের পরিমাণ:' : 'Withdraw Amount:'}</span>
                        <span className="font-bold text-slate-900 dark:text-white">৳{parseFloat(amount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 font-bold">
                        <span>{lang === 'bn' ? 'সেন্ড মানি ফি (Cashout Fee):' : 'Send Money Fee:'}</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {currentFee === 0 ? (lang === 'bn' ? 'ফ্রি (৳০.০০)' : 'FREE (৳0.00)') : `- ৳${currentFee.toFixed(2)}`}
                        </span>
                    </div>
                    <div className="h-px bg-slate-100 dark:bg-slate-800 my-1 w-full" />
                    <div className="flex justify-between items-center text-xs pt-0.5">
                        <span className="text-slate-900 dark:text-white font-black text-sm">{t?.youReceive || (lang === 'bn' ? 'আপনি পাবেন' : 'You will receive')}</span>
                        <span className="font-black text-emerald-600 dark:text-emerald-400 text-base font-mono">৳{currentReceive.toFixed(2)}</span>
                    </div>
                </div>
            )}

            {/* Saved Wallet Info with Edit Icon Aligned Right */}
            <div className="p-4 rounded-3xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between gap-3 w-full">
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                        <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200/90 p-1.5 flex items-center justify-center shrink-0 shadow-xs tp-payment-logo-box">
                            <img src={getLogo()} alt={fiatWallet?.method} className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                                <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight">{fiatWallet?.method || 'bKash'} Wallet</h4>
                                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                                    {lang === 'bn' ? 'সক্রিয়' : 'Active'}
                                </span>
                            </div>
                            <p className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300 truncate mt-0.5">{fiatWallet?.number}</p>
                            {fiatWallet?.name && <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold truncate">{fiatWallet?.name}</p>}
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
                        className="px-3.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:hover:bg-purple-900/50 dark:text-purple-300 rounded-xl transition-all active:scale-95 flex items-center gap-1.5 text-xs font-black border border-purple-200/80 dark:border-purple-800/80 shrink-0 shadow-xs cursor-pointer"
                        title="Edit Wallet"
                    >
                        <Edit3 size={13} />
                        <span>{lang === 'bn' ? 'এডিট' : 'Edit'}</span>
                    </button>
                </div>
            </div>

            {/* Warning Note */}
            <div className="p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/40 flex items-start gap-2.5">
                <Info size={16} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-blue-900 dark:text-blue-300 font-medium leading-relaxed">
                    {lang === 'bn' 
                        ? 'নূন্যতম উত্তোলন: ক্রিপ্টো বিক্রয় ২০ টাকা | অ্যাড মানি ৩০ টাকা। অ্যাড মানি করার পর ২০ টাকার ক্রিপ্টো ক্রয় করতে হবে।' 
                        : 'Min Withdraw: Crypto Sell 20 BDT | Deposit 30 BDT. Must trade 20 BDT crypto after deposit.'}
                </p>
            </div>

            {/* Submit Button (Tactile 3D Button) */}
            <div className="pt-2">
                <button 
                    type="button"
                    onClick={handleSubmit} 
                    disabled={!amount || isSubmitting} 
                    className="w-full h-[54px] rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 text-white font-black text-sm flex items-center justify-center gap-2.5 border-t border-purple-300/40 shadow-[0_5px_0_#3730a3,0_12px_24px_rgba(79,70,229,0.35)] active:translate-y-1 active:shadow-[0_1px_0_#3730a3,0_6px_12px_rgba(79,70,229,0.25)] transition-all duration-150 disabled:opacity-50 disabled:shadow-none disabled:translate-y-0 disabled:cursor-not-allowed cursor-pointer"
                >
                    {isSubmitting ? (
                        <Loader2 size={18} className="animate-spin" />
                    ) : (
                        <Wallet size={18} />
                    )}
                    <span>{t?.withdrawFunds || (lang === 'bn' ? 'টাকা উত্তোলন করুন' : 'WITHDRAW FUNDS')}</span>
                </button>
            </div>

            {/* Blooming Flower Withdrawal Success Modal */}
            <WithdrawFlowerModal 
                isOpen={showFlowerModal}
                onClose={() => setShowFlowerModal(false)}
                details={withdrawDetails}
                lang={lang}
            />

            {/* Edit Wallet Modal (Executive Rounded-3xl with 3D Button) */}
            {showEditWalletModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="relative bg-white dark:bg-slate-900 w-full max-w-[340px] p-6 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 animate-in zoom-in-95 duration-200 overflow-hidden text-slate-900 dark:text-white">
                        <div className="flex justify-between items-center mb-5 relative z-10">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                {lang === 'bn' ? 'ওয়ালেট পরিবর্তন' : 'Edit Wallet'}
                            </h3>
                            <button 
                                type="button"
                                onClick={() => setShowEditWalletModal(false)} 
                                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer"
                            >
                                <X size={16} strokeWidth={2.5} />
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Select Method</label>
                                <div className="flex gap-2">
                                    {['bKash', 'Nagad'].map(method => (
                                        <button
                                            key={method}
                                            type="button"
                                            onClick={() => setEditMethod(method)}
                                            className={`flex-1 py-2.5 px-3 rounded-2xl border flex items-center justify-center gap-2 font-black text-xs transition-all cursor-pointer ${
                                                editMethod === method 
                                                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 shadow-xs' 
                                                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                                            }`}
                                        >
                                            <div className="w-7 h-7 rounded-xl tp-payment-logo-box bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-2xs">
                                                <img src={getPaymentLogo(method)} alt={method} className="w-full h-full object-contain" />
                                            </div>
                                            {method}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Wallet Number</label>
                                <input 
                                    type="tel" 
                                    placeholder="e.g. 017XXXXXXXX" 
                                    value={editNumber} 
                                    onChange={(e) => setEditNumber(e.target.value)} 
                                    className="w-full h-[50px] bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 font-bold text-slate-900 dark:text-white outline-none focus:border-purple-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-sm" 
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Account Name</label>
                                <input 
                                    type="text" 
                                    placeholder="Enter Full Name" 
                                    value={editName} 
                                    onChange={(e) => setEditName(e.target.value)} 
                                    className="w-full h-[50px] bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 font-bold text-slate-900 dark:text-white outline-none focus:border-purple-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-sm" 
                                />
                            </div>
                        </div>

                        <div className="mt-6">
                            <button
                                type="button"
                                onClick={handleSaveEditedWallet}
                                disabled={!editNumber || !editName || isSavingWallet}
                                className="w-full h-[50px] rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 text-white font-black text-xs flex items-center justify-center gap-2 border-t border-purple-300/40 shadow-[0_4px_0_#3730a3,0_10px_20px_rgba(79,70,229,0.3)] active:translate-y-1 active:shadow-[0_1px_0_#3730a3] transition-all disabled:opacity-50 disabled:shadow-none disabled:translate-y-0 cursor-pointer"
                            >
                                {isSavingWallet ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                <span>{lang === 'bn' ? 'আপডেট করুন' : 'UPDATE WALLET'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}