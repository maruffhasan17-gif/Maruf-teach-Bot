import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Home, Calendar, Clipboard, Camera, User, Users, Shield, ShieldCheck, Award, ArrowLeft, ArrowDown, ArrowUp, ArrowRight, ChevronLeft, ChevronRight, Zap, Share2, Copy, X, ArrowRightLeft, Wallet, Gift, ArrowUpRight, ArrowDownLeft, MinusCircle, TrendingUp, Sparkles, Info, CircleDollarSign, Gem, Coins, Delete, ChevronDown, Clock, Save, CheckCircle2 , Volume2, VolumeX, Check, Settings , ClipboardPaste, Loader2, PlusCircle, AlertCircle, RefreshCw, Headphones, Send, Edit3, ExternalLink, LogOut, PlayCircle, Moon, Sun, Bell, Eye, EyeOff, Search, QrCode, HelpCircle, FileText, Trophy, Crown, Medal, Flame, Mail, Heart, Globe, Lock } from 'lucide-react';
import { TonConnectUIProvider, TonConnectButton, useTonAddress, useTonConnectUI, THEME } from '@tonconnect/ui-react';
import WebApp from '@twa-dev/sdk';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchUserData, syncUserProfile, submitFreeTonTask, saveFiatWallet, withdrawFiat, submitSellOrder, buildTransaction, submitBuyOrder, submitAddMoney, submitBuyCrypto, checkTreasuryAvailability, notifyAdminRefuel, submitSupportMessage, fetchMarketRates, checkCommunityMembership, verifyCommunityMembership, fetchReferralData, prepareReferralShare, fetchUserDepositAddress, checkEvmDeposit, checkTonDeposit, fetchUserHistory, getUserAvatarUrl, acknowledgeWithdrawNotice, acknowledgeReceivedTransfer, setupTwoStepPin, searchUsers, lookupRecipientUser, submitTransferMoney, fetchGiveawayStatus, joinGiveaway } from './api';
import lottie from 'lottie-web/build/player/lottie_light';
import confetti from 'canvas-confetti';
import brandLogo from './assets/trustpaylogo.png';
import referralBannerImg from './assets/trustpay-official-banner.jpg';
import giveawayBadgeImg from './assets/giveaway-badge.png';
import lotusLineArt from './assets/lotus-line-art.webp';
import roseBranchArt from './assets/rose-branch-art.webp';
import addmoneyRoseArt from './assets/addmoney-rose-art.webp';
import sakuraBranchArt from './assets/sakura-branch-art.webp';
import mapleBranchArt from './assets/maple-branch-art.webp';
import wisteriaCascadeArt from './assets/wisteria-cascade-art.webp';
import roseBotanicalArt from './assets/rose-botanical-art.webp';
import marufFrameImg from './assets/frame-maruf.png';

const stickerJsonCache = new Map();
const roundBdt = (v) => Math.round(((Number(v) || 0) + Number.EPSILON) * 100) / 100;

// ============================================================================
// APP-WIDE FINTECH SOUND SYSTEM (Web Audio API — Zero Latency, No External MP3)
// Plays pleasant celebratory chimes on Success and distinct alert tones on Error
// ============================================================================
let sharedAudioCtx = null;
let lastSuccessSoundTime = 0;
function getAppAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

function playAppSound(type = 'success') {
  if (type === 'success') {
    const nowMs = Date.now();
    if (nowMs - lastSuccessSoundTime < 800) {
      return; // Prevent duplicate sound playback within 800ms
    }
    lastSuccessSoundTime = nowMs;
  }
  try {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      if (type === 'success') {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      } else if (type === 'error') {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
      } else if (type === 'tap') {
        window.Telegram.WebApp.HapticFeedback.selectionChanged();
      } else {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
      }
    }
  } catch (_) {}

  try {
    const ctx = getAppAudioContext();
    if (!ctx) return;

    const playNotes = () => {
      try {
        const now = ctx.currentTime;

        // Master warm low-pass filter so all tones sound silky, warm & never harsh on mobile speakers
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(type === 'tap' ? 1400 : 2400, now);
        filter.Q.setValueAtTime(0.7, now);
        filter.connect(ctx.destination);

        if (type === 'tap') {
          // Whisper-soft iOS / Telegram style tactile page-transition tap (24ms warm droplet)
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(540, now);
          osc.frequency.exponentialRampToValueAtTime(210, now + 0.024);

          gainNode.gain.setValueAtTime(0.0001, now);
          gainNode.gain.linearRampToValueAtTime(0.035, now + 0.004);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.026);

          osc.connect(gainNode);
          gainNode.connect(filter);

          osc.start(now);
          osc.stop(now + 0.03);
          return;
        }

        if (type === 'success') {
          // Silky Apple-Pay / iOS Wallet style 2-note crystal bell chime (F5 -> C6 with warm fifth resonance)
          // Pure sine waves only (no harsh triangle/square buzz)
          const bellNotes = [
            { freq: 698.46, shimmer: 1396.91, start: 0.0, dur: 0.22, gain: 0.085 },
            { freq: 1046.50, shimmer: 2093.00, start: 0.095, dur: 0.55, gain: 0.11 }
          ];
          bellNotes.forEach(({ freq, shimmer, start, dur, gain }) => {
            const mainOsc = ctx.createOscillator();
            const overtoneOsc = ctx.createOscillator();
            const mainGain = ctx.createGain();
            const overtoneGain = ctx.createGain();

            mainOsc.type = 'sine';
            mainOsc.frequency.setValueAtTime(freq, now + start);

            overtoneOsc.type = 'sine';
            overtoneOsc.frequency.setValueAtTime(shimmer, now + start);

            mainGain.gain.setValueAtTime(0.0001, now + start);
            mainGain.gain.linearRampToValueAtTime(gain, now + start + 0.014);
            mainGain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);

            overtoneGain.gain.setValueAtTime(0.0001, now + start);
            overtoneGain.gain.linearRampToValueAtTime(gain * 0.18, now + start + 0.01);
            overtoneGain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur * 0.55);

            mainOsc.connect(mainGain);
            overtoneOsc.connect(overtoneGain);
            mainGain.connect(filter);
            overtoneGain.connect(filter);

            mainOsc.start(now + start);
            overtoneOsc.start(now + start);
            mainOsc.stop(now + start + dur + 0.03);
            overtoneOsc.stop(now + start + dur + 0.03);
          });
        } else if (type === 'error') {
          // Soft, muted warm double marimba knock (pure sine, zero buzz)
          const errNotes = [
            { freq: 293.66, endFreq: 261.63, start: 0.0, dur: 0.13, gain: 0.075 },
            { freq: 220.00, endFreq: 185.00, start: 0.135, dur: 0.22, gain: 0.08 }
          ];
          errNotes.forEach(({ freq, endFreq, start, dur, gain }) => {
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + start);
            osc.frequency.exponentialRampToValueAtTime(endFreq, now + start + dur);

            gainNode.gain.setValueAtTime(0.0001, now + start);
            gainNode.gain.linearRampToValueAtTime(gain, now + start + 0.012);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);

            osc.connect(gainNode);
            gainNode.connect(filter);

            osc.start(now + start);
            osc.stop(now + start + dur + 0.02);
          });
        } else if (type === 'confirm') {
          // Gentle soft glass pop for confirmation modals
          const promptNotes = [
            { freq: 659.25, start: 0.0, dur: 0.08, gain: 0.05 },
            { freq: 880.00, start: 0.065, dur: 0.18, gain: 0.06 }
          ];
          promptNotes.forEach(({ freq, start, dur, gain }) => {
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + start);
            gainNode.gain.setValueAtTime(0.0001, now + start);
            gainNode.gain.linearRampToValueAtTime(gain, now + start + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
            osc.connect(gainNode);
            gainNode.connect(filter);
            osc.start(now + start);
            osc.stop(now + start + dur + 0.02);
          });
        }
      } catch (_) {}
    };

    if (ctx.state === 'suspended') {
      ctx.resume().then(playNotes).catch(playNotes);
    } else {
      playNotes();
    }
  } catch (_) {}
}

if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    try {
      const ctx = getAppAudioContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
    } catch (_) {}
  };
  window.addEventListener('pointerdown', unlockAudio, { passive: true });
  window.addEventListener('touchstart', unlockAudio, { passive: true });
}

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
    {/* Ambient Dark Mode Glow Auras behind the botanical flower art (Zero-Blur GPU Radial Gradients) */}
    {darkMode && (
      <>
        <div
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-30"
          style={{
            background:
              page === 'referral'
                ? 'radial-gradient(circle, rgba(168,85,247,0.5) 0%, transparent 70%)'
                : page === 'add-money'
                ? 'radial-gradient(circle, rgba(124,58,237,0.45) 0%, transparent 70%)'
                : page === 'withdraw'
                ? 'radial-gradient(circle, rgba(245,158,11,0.4) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(99,102,241,0.5) 0%, transparent 70%)'
          }}
        />
        <div
          className="absolute bottom-8 -left-24 w-96 h-96 rounded-full opacity-25"
          style={{
            background:
              page === 'referral'
                ? 'radial-gradient(circle, rgba(99,102,241,0.45) 0%, transparent 70%)'
                : page === 'sell'
                ? 'radial-gradient(circle, rgba(168,85,247,0.45) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(56,189,248,0.4) 0%, transparent 70%)'
          }}
        />
      </>
    )}

    {/* Persistently mounted primary tab backgrounds (Home, Add Money, Profile) for 0ms instant tab switching */}
    <div className={page === 'home' || page === 'add-money' ? 'opacity-100' : 'opacity-0'}>
      <div
        className="absolute -top-16 -right-16 w-[340px] h-[360px] pointer-events-none"
        style={{
          background: darkMode
            ? 'radial-gradient(closest-side, rgba(99,102,241,0.2), transparent)'
            : 'radial-gradient(closest-side, rgba(238,242,255,0.85), rgba(224,231,255,0.3) 60%, transparent)'
        }}
      />
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
          decoding="async"
          draggable={false}
          className={`w-full h-auto ${darkMode ? 'opacity-[0.35] brightness-125' : 'opacity-[0.78]'}`}
        />
      </div>
    </div>

    <div className={page === 'profile' ? 'opacity-100' : 'opacity-0'}>
      <div
        className="absolute -top-12 -right-12 w-[300px] h-[340px] pointer-events-none"
        style={{
          background: darkMode
            ? 'radial-gradient(closest-side, rgba(168,85,247,0.18), transparent)'
            : 'radial-gradient(closest-side, rgba(233,213,255,0.7), rgba(243,232,255,0.25) 60%, transparent)'
        }}
      />
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
          decoding="async"
          draggable={false}
          className={`w-full h-auto ${darkMode ? 'opacity-[0.45] brightness-125' : 'opacity-[0.88]'}`}
        />
      </div>
    </div>

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
        {/* Soft rose botanical aura */}
        <div
          className="absolute -top-12 -right-12 w-[330px] h-[350px] pointer-events-none"
          style={{
            background: darkMode
              ? 'radial-gradient(closest-side, rgba(244,63,94,0.22), rgba(168,85,247,0.12) 60%, transparent)'
              : 'radial-gradient(closest-side, rgba(254,205,211,0.75), rgba(252,231,243,0.35) 60%, transparent)'
          }}
        />
        {/* User's custom botanical flower art in top-right */}
        <div
          className="absolute -right-3 top-2 w-[230px] pointer-events-none select-none overflow-hidden"
          style={{
            WebkitMaskImage: 'linear-gradient(to bottom, black 82%, transparent 100%)',
            maskImage: 'linear-gradient(to bottom, black 82%, transparent 100%)'
          }}
        >
          <img
            src={roseBotanicalArt}
            alt=""
            aria-hidden="true"
            draggable={false}
            className={`w-full h-auto ${darkMode ? 'opacity-[0.48] brightness-125' : 'opacity-[0.88]'}`}
          />
        </div>
        {/* User's custom rose branch art in lower-left */}
        <div
          className="absolute -left-6 bottom-24 w-[190px] pointer-events-none select-none overflow-hidden"
          style={{
            WebkitMaskImage: 'linear-gradient(to top, black 75%, transparent 100%)',
            maskImage: 'linear-gradient(to top, black 75%, transparent 100%)'
          }}
        >
          <img
            src={roseBranchArt}
            alt=""
            aria-hidden="true"
            draggable={false}
            className={`w-full h-auto transform -scale-x-100 ${darkMode ? 'opacity-[0.32] brightness-125' : 'opacity-[0.65]'}`}
          />
        </div>
      </>
    )}
    {(page === 'transfer' || page === 'two-step' || page === 'support') && (
      <>
        <div
          className="absolute -top-12 -right-12 w-[330px] h-[350px] pointer-events-none"
          style={{
            background: darkMode
              ? 'radial-gradient(closest-side, rgba(168,85,247,0.24), transparent)'
              : 'radial-gradient(closest-side, rgba(233,213,255,0.78), rgba(243,232,255,0.32) 60%, transparent)'
          }}
        />
        <div
          className="absolute -right-3 top-2 w-[225px] pointer-events-none select-none overflow-hidden"
          style={{
            WebkitMaskImage: 'linear-gradient(to bottom, black 82%, transparent 100%)',
            maskImage: 'linear-gradient(to bottom, black 82%, transparent 100%)'
          }}
        >
          <img
            src={page === 'transfer' ? wisteriaCascadeArt : sakuraBranchArt}
            alt=""
            aria-hidden="true"
            draggable={false}
            className={`w-full h-auto ${darkMode ? 'opacity-[0.46] brightness-125' : 'opacity-[0.86]'}`}
          />
        </div>
      </>
    )}
    {page === 'giveaway' && (
      <>
        <div
          className="absolute -top-16 inset-x-0 h-[450px] pointer-events-none"
          style={{
            background: darkMode
              ? 'radial-gradient(circle at 50% 20%, rgba(245, 158, 11, 0.16) 0%, rgba(124, 58, 237, 0.20) 45%, transparent 75%)'
              : 'radial-gradient(circle at 50% 20%, rgba(254, 240, 138, 0.55) 0%, rgba(237, 233, 254, 0.50) 45%, transparent 75%)'
          }}
        />
        {/* User's custom botanical flower art in top-right */}
        <div
          className="absolute -right-3 top-2 w-[220px] pointer-events-none select-none overflow-hidden"
          style={{
            WebkitMaskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
            maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)'
          }}
        >
          <img
            src={roseBotanicalArt}
            alt=""
            aria-hidden="true"
            draggable={false}
            className={`w-full h-auto ${darkMode ? 'opacity-[0.45] brightness-125' : 'opacity-[0.85]'}`}
          />
        </div>
        {/* User's custom rose branch art in lower-left */}
        <div
          className="absolute -left-6 bottom-20 w-[180px] pointer-events-none select-none overflow-hidden"
          style={{
            WebkitMaskImage: 'linear-gradient(to top, black 75%, transparent 100%)',
            maskImage: 'linear-gradient(to top, black 75%, transparent 100%)'
          }}
        >
          <img
            src={roseBranchArt}
            alt=""
            aria-hidden="true"
            draggable={false}
            className={`w-full h-auto transform -scale-x-100 ${darkMode ? 'opacity-[0.30] brightness-125' : 'opacity-[0.60]'}`}
          />
        </div>
      </>
    )}
    {page !== 'home' && page !== 'add-money' && page !== 'sell' && page !== 'buy' && page !== 'profile' && page !== 'withdraw' && page !== 'referral' && page !== 'notifications' && page !== 'transfer' && page !== 'two-step' && page !== 'support' && page !== 'giveaway' && (
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
  const ringSize = Math.round(size * 0.86);
  const cardSize = Math.round(size * 0.62);
  const logoSize = Math.round(size * 0.44);

  return (
    <div
      className="relative mx-auto my-1 flex items-center justify-center select-none"
      style={{ width: `${outerSize}px`, height: `${outerSize}px` }}
    >
      <style>{`
        @keyframes tpOrbitSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes tpOrbitReverse {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes tpAuraBreath {
          0%, 100% { transform: scale(0.92); opacity: 0.55; }
          50% { transform: scale(1.08); opacity: 0.95; }
        }
        @keyframes tpLogoFloat {
          0%, 100% { transform: translateY(0px) scale(0.98); }
          50% { transform: translateY(-3px) scale(1.03); }
        }
      `}</style>

      {/* Soft Luxury Ambient Aura */}
      <div
        style={{
          position: 'absolute',
          inset: '6%',
          borderRadius: '9999px',
          background: 'radial-gradient(circle, rgba(124,58,237,0.28) 0%, rgba(79,70,229,0.16) 50%, transparent 74%)',
          filter: 'blur(18px)',
          animation: 'tpAuraBreath 3s infinite ease-in-out'
        }}
      />

      {/* Outer Counter-Rotating Precision Dashed Halo */}
      <svg
        style={{
          position: 'absolute',
          width: `${outerSize}px`,
          height: `${outerSize}px`,
          animation: 'tpOrbitReverse 14s linear infinite',
          pointerEvents: 'none'
        }}
        viewBox="0 0 160 160"
        fill="none"
      >
        <circle
          cx="80"
          cy="80"
          r="72"
          stroke="rgba(139, 92, 246, 0.22)"
          strokeWidth="1.25"
          strokeDasharray="4 8"
        />
        <circle cx="80" cy="8" r="3" fill="#8B5CF6" fillOpacity="0.75" />
        <circle cx="80" cy="152" r="2.5" fill="#6366F1" fillOpacity="0.55" />
      </svg>

      {/* Main Sweeping Conic Gradient Orbital Ring */}
      <svg
        style={{
          position: 'absolute',
          width: `${ringSize}px`,
          height: `${ringSize}px`,
          animation: 'tpOrbitSpin 2.2s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite',
          pointerEvents: 'none'
        }}
        viewBox="0 0 140 140"
        fill="none"
      >
        <defs>
          <linearGradient id="tpExecArcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7C3AED" stopOpacity="1" />
            <stop offset="50%" stopColor="#6366F1" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#EC4899" stopOpacity="0" />
          </linearGradient>
        </defs>
        <circle
          cx="70"
          cy="70"
          r="62"
          stroke="rgba(148, 163, 184, 0.14)"
          strokeWidth="2.5"
        />
        <circle
          cx="70"
          cy="70"
          r="62"
          stroke="url(#tpExecArcGrad)"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeDasharray="210 190"
        />
      </svg>

      {/* Frosted Glass Squircle Pedestal Card */}
      <div
        className="relative z-10 flex items-center justify-center rounded-[28px] bg-white/90 dark:bg-slate-900/90 border border-white/90 dark:border-slate-700/80 shadow-[0_18px_40px_-10px_rgba(79,70,229,0.28),inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-xl"
        style={{
          width: `${cardSize}px`,
          height: `${cardSize}px`
        }}
      >
        <div
          style={{
            width: `${logoSize}px`,
            height: `${logoSize}px`,
            animation: 'tpLogoFloat 2.6s infinite ease-in-out'
          }}
        >
          <img
            src={brandLogo}
            alt="Trust Pay"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              filter: 'drop-shadow(0 8px 18px rgba(79, 70, 229, 0.35))'
            }}
          />
        </div>
      </div>
    </div>
  );
};

const BloomingFlowerLoader = ({ lang = 'bn' }) => (
  <div className="fixed inset-0 bg-gradient-to-b from-[#f8fafc] via-[#f5f3ff]/60 to-[#eef2ff] dark:from-[#060913] dark:via-[#0b1120] dark:to-[#111827] z-[99999] flex flex-col items-center justify-center font-sans select-none p-6 overflow-hidden">
    <style>{`
      @keyframes tpExecBarSweep {
        0% { transform: translateX(-100%); }
        50% { transform: translateX(15%); }
        100% { transform: translateX(115%); }
      }
    `}</style>

    {/* Subtle Top & Bottom Ambient Mesh Glow */}
    <div
      className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[340px] h-[240px] rounded-full blur-3xl opacity-60"
      style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.22) 0%, transparent 70%)' }}
    />

    <div className="relative z-10 flex flex-col items-center justify-center">
      <BloomingFlowerGraphic size={156} />

      {/* Brand Title & Subtitle */}
      <h2 className="text-slate-900 dark:text-white font-black text-[25px] mt-5 tracking-tight">
        Trust Pay
      </h2>
      <p className="text-[10.5px] font-extrabold uppercase tracking-[0.24em] text-violet-600/80 dark:text-violet-400/80 mt-0.5">
        Instant P2P &amp; Web3 Exchange
      </p>

      {/* Clean Status Pill */}
      <div className="flex items-center gap-2 mt-4 px-4 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 border border-violet-200/80 dark:border-violet-500/30 shadow-xs backdrop-blur-md">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-500 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-600 dark:bg-violet-400" />
        </span>
        <span className="text-[12px] font-bold text-slate-700 dark:text-slate-200">
          {lang === 'bn' ? 'লোড হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...' : 'Securing connection, please wait...'}
        </span>
      </div>

      {/* Liquid Shimmer Progress Bar */}
      <div className="w-40 h-[4.5px] bg-slate-200/90 dark:bg-slate-800 rounded-full mt-4 overflow-hidden relative">
        <div
          className="absolute inset-y-0 w-24 bg-gradient-to-r from-violet-600 via-indigo-500 to-fuchsia-500 rounded-full"
          style={{ animation: 'tpExecBarSweep 1.35s infinite ease-in-out' }}
        />
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
  if (a <= 0) return 0;
  if (a <= 100) return 5;   // 25 - 100 TK: 5 TK fee
  if (a <= 500) return 10;  // 101 - 500 TK: 10 TK fee
  if (a <= 1000) return 15; // 501 - 1000 TK: 15 TK fee
  return 20;                // 1001 - 5000 TK: 20 TK fee
};


const LuxurySuccessEmblem = ({ badgeText = 'VERIFIED SUCCESS' }) => (
  <div className="relative flex flex-col items-center justify-center pt-1 pb-2 select-none">
    <style>{`
      @keyframes tpSuccessPop {
        0% { transform: scale(0.35) rotate(-12deg); opacity: 0; }
        60% { transform: scale(1.1) rotate(3deg); opacity: 1; }
        80% { transform: scale(0.96) rotate(-1deg); }
        100% { transform: scale(1) rotate(0deg); opacity: 1; }
      }
      @keyframes tpSuccessWave {
        0% { transform: scale(0.85); opacity: 0.75; }
        100% { transform: scale(1.75); opacity: 0; }
      }
      @keyframes tpSuccessCheckDraw {
        0% { stroke-dashoffset: 60; opacity: 0.2; }
        30% { opacity: 1; }
        100% { stroke-dashoffset: 0; opacity: 1; }
      }
      @keyframes tpSuccessSpinSlow {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes tpSparkleFloat {
        0%, 100% { transform: translateY(0px) scale(1); opacity: 0.95; }
        50% { transform: translateY(-5px) scale(1.18); opacity: 1; }
      }
    `}</style>

    <div className="relative w-24 h-24 flex items-center justify-center">
      {/* Expanding Emerald Sonar Waves */}
      <div
        className="absolute inset-1 rounded-full border-2 border-emerald-400/50 pointer-events-none"
        style={{ animation: 'tpSuccessWave 2.1s cubic-bezier(0.16, 1, 0.3, 1) infinite' }}
      />
      <div
        className="absolute inset-1 rounded-full border border-teal-400/40 pointer-events-none"
        style={{ animation: 'tpSuccessWave 2.1s cubic-bezier(0.16, 1, 0.3, 1) 0.65s infinite' }}
      />

      {/* Ambient Backlight Glow */}
      <div className="absolute -inset-2 rounded-full bg-gradient-to-tr from-emerald-500/30 via-teal-400/25 to-amber-300/25 blur-xl pointer-events-none" />

      {/* Rotating Outer Jewel Ring */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        style={{ animation: 'tpSuccessSpinSlow 14s linear infinite' }}
      >
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="none"
          stroke="url(#tpSuccessGradRing)"
          strokeWidth="1.75"
          strokeDasharray="6 6"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="tpSuccessGradRing" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#14B8A6" />
          </linearGradient>
        </defs>
      </svg>

      {/* Main 3D Emerald Core Sphere */}
      <div
        className="relative w-[74px] h-[74px] rounded-full p-[3px] bg-gradient-to-tr from-emerald-600 via-emerald-400 to-teal-300 shadow-[0_12px_32px_rgba(16,185,129,0.45)] flex items-center justify-center"
        style={{ animation: 'tpSuccessPop 0.65s cubic-bezier(0.22, 1, 0.36, 1) forwards' }}
      >
        <div className="w-full h-full rounded-full bg-gradient-to-b from-emerald-400 via-emerald-500 to-teal-600 flex items-center justify-center relative overflow-hidden shadow-inner">
          {/* Glossy Top Crown Highlight */}
          <div className="absolute -top-3 left-2 right-2 h-8 rounded-full bg-white/30 blur-[2px] pointer-events-none" />

          {/* Animated Precision Checkmark */}
          <svg className="w-10 h-10 text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.22)]" viewBox="0 0 52 52" fill="none">
            <path
              d="M14.5 27.2L22.6 35.3L38.2 18.5"
              stroke="white"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                strokeDasharray: 60,
                strokeDashoffset: 60,
                animation: 'tpSuccessCheckDraw 0.55s cubic-bezier(0.65, 0, 0.35, 1) 0.2s forwards'
              }}
            />
          </svg>
        </div>
      </div>

      {/* Floating Celebration Sparkle Stars */}
      <div
        className="absolute -top-1 -right-1 text-amber-400 drop-shadow"
        style={{ animation: 'tpSparkleFloat 2.2s ease-in-out infinite' }}
      >
        <Sparkles size={20} fill="currentColor" />
      </div>
      <div
        className="absolute -bottom-0.5 -left-1 text-emerald-400 drop-shadow"
        style={{ animation: 'tpSparkleFloat 2.5s ease-in-out 0.4s infinite' }}
      >
        <Sparkles size={16} fill="currentColor" />
      </div>
      <span className="absolute top-1 left-0 w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#F59E0B] animate-ping" />
      <span className="absolute bottom-2 right-0 w-1.5 h-1.5 rounded-full bg-teal-400 shadow-[0_0_8px_#14B8A6] animate-ping" />
    </div>

    {badgeText && (
      <div className="mt-2.5 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/12 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/25 text-[10.5px] font-black uppercase tracking-wider shadow-xs">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
        <Sparkles size={11} className="text-amber-500" />
        <span>{badgeText}</span>
      </div>
    )}
  </div>
);

const WithdrawFlowerModal = ({ isOpen, onClose, details, lang = 'bn', darkMode = false }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`relative w-full max-w-[350px] p-6 text-center rounded-[30px] shadow-2xl border transition-all animate-in zoom-in-95 duration-300 overflow-hidden ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200/90 text-slate-900'
      }`}>
        {/* Ambient Emerald Glow + Corner Botanical Accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-56 h-28 rounded-full bg-emerald-500/15 blur-2xl pointer-events-none" />
        <img
          src={sakuraBranchArt}
          alt=""
          className={`absolute -top-3 -right-3 w-28 h-28 object-contain pointer-events-none select-none ${
            darkMode ? 'opacity-[0.14] brightness-125' : 'opacity-[0.16]'
          }`}
        />

        {/* Luxury Animated Checkmark Emblem */}
        <LuxurySuccessEmblem badgeText={lang === 'bn' ? 'অনুরোধ গৃহীত হয়েছে' : 'REQUEST SUBMITTED'} />

        <h3 className="text-[19px] font-black leading-tight mt-1 mb-1">
          {lang === 'bn' ? 'উত্তোলন অনুরোধ সফল!' : 'Withdrawal Submitted!'}
        </h3>
        <p className="text-[12px] text-slate-500 dark:text-slate-400 font-medium mb-4 leading-relaxed">
          {lang === 'bn' ? 'আপনার অনুরোধটি সফলভাবে গ্রহণ করা হয়েছে এবং প্রক্রিয়াধীন আছে।' : 'Your withdrawal request has been received and is processing.'}
        </p>

        {/* Breakdown Card */}
        {details && (
          <div className={`rounded-2xl p-3.5 border mb-4 text-left space-y-2 text-[12px] relative z-10 ${
            darkMode ? 'bg-slate-800/60 border-slate-700/80' : 'bg-slate-50/90 border-slate-200/80'
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
          className="w-full h-[46px] rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 text-white font-black text-xs shadow-[0_8px_20px_rgba(16,185,129,0.3)] active:scale-95 transition-all cursor-pointer relative z-10"
        >
          {lang === 'bn' ? 'ঠিক আছে (Done)' : 'Done'}
        </button>
      </div>
    </div>
  );
};

const DepositFlowerModal = ({ isOpen, onClose, details, lang = 'bn', darkMode = false }) => {
  const hasPlayedSoundRef = useRef(false);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!isOpen) {
      hasPlayedSoundRef.current = false;
      return;
    }

    if (!hasPlayedSoundRef.current) {
      hasPlayedSoundRef.current = true;
      playAppSound('success');
    }

    // Automatically redirect to home page after 3 seconds as requested by admin
    const timer = setTimeout(() => {
      if (onCloseRef.current) onCloseRef.current();
    }, 3000);

    return () => clearTimeout(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`relative w-full max-w-[350px] p-6 text-center rounded-[30px] shadow-2xl border transition-all animate-in zoom-in-95 duration-300 overflow-hidden ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200/90 text-slate-900'
      }`}>
        {/* Ambient Emerald Glow + Corner Botanical Accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-56 h-28 rounded-full bg-emerald-500/15 blur-2xl pointer-events-none" />
        <img
          src={sakuraBranchArt}
          alt=""
          className={`absolute -top-3 -right-3 w-28 h-28 object-contain pointer-events-none select-none ${
            darkMode ? 'opacity-[0.14] brightness-125' : 'opacity-[0.16]'
          }`}
        />

        {/* Luxury Animated Checkmark Emblem */}
        <LuxurySuccessEmblem badgeText={lang === 'bn' ? 'ডিপোজিট সফল হয়েছে' : 'DEPOSIT SUCCESSFUL'} />

        <h3 className="text-[19px] font-black leading-tight mt-1 mb-1">
          {lang === 'bn' ? 'ডিপোজিট সফল হয়েছে!' : 'Deposit Successful!'}
        </h3>
        <p className="text-[12px] text-slate-500 dark:text-slate-400 font-medium mb-4 leading-relaxed">
          {lang === 'bn' ? 'আপনার অ্যাকাউন্টে টাকা সফলভাবে যোগ করা হয়েছে।' : 'Funds have been credited to your balance.'}
        </p>

        {/* Breakdown Card (Exact 1:1 Match to 2nd Image) */}
        {details && (
          <div className={`rounded-2xl p-3.5 border mb-4 text-left space-y-2 text-[12px] relative z-10 ${
            darkMode ? 'bg-slate-800/60 border-slate-700/80' : 'bg-slate-50/90 border-slate-200/80'
          }`}>
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
              <span>{lang === 'bn' ? 'পরিমাণ:' : 'Amount:'}</span>
              <span className="font-bold text-slate-900 dark:text-white font-mono">
                + ৳ {parseFloat(details.amount || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
              <span>{lang === 'bn' ? 'পেমেন্ট মেথড:' : 'Method:'}</span>
              <span className="font-bold text-slate-900 dark:text-white">{details.method || 'bKash'}</span>
            </div>
            {details.trxId && (
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-[11px] pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                <span>{lang === 'bn' ? 'TrxID:' : 'TrxID:'}</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{details.trxId}</span>
              </div>
            )}
            <div className="h-px bg-slate-200 dark:bg-slate-700 w-full my-1" />
            <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
              <span className="font-bold">{lang === 'bn' ? 'নতুন ব্যালেন্স:' : 'New Balance:'}</span>
              <span className="font-black text-[14px] font-mono">
                ৳ {parseFloat(details.newBalance || 0).toFixed(2)}
              </span>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full h-[46px] rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 text-white font-black text-xs shadow-[0_8px_20px_rgba(16,185,129,0.3)] active:scale-95 transition-all cursor-pointer relative z-10"
        >
          {lang === 'bn' ? 'ঠিক আছে (Done)' : 'Done'}
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// ULTRA-PREMIUM 3D LUXURY GIFT VECTOR ARTWORK & ANIMATED EMBLEMS
// ============================================================================
const GIFT_THEME_META = {
  surprise: {
    id: 'surprise',
    labelBn: 'রয়েল সারপ্রাইজ',
    labelEn: 'Royal Surprise',
    subBn: '24K গোল্ড মিস্ট্রি বক্স',
    accentFrom: '#F59E0B',
    accentVia: '#FBBF24',
    accentTo: '#D97706',
    glowRgba: 'rgba(245, 158, 11, 0.45)',
    cardGrad: 'from-[#2A1805] via-[#452708] to-[#1E1003]',
    lightCardGrad: 'from-amber-50 via-yellow-50/90 to-orange-50',
    borderActive: 'border-amber-400 ring-2 ring-amber-400/40',
    badgeBg: 'from-amber-400 via-yellow-500 to-amber-600',
    titleBn: 'আপনার জন্য একটি রাজকীয় সারপ্রাইজ উপহার এসেছে!'
  },
  love: {
    id: 'love',
    labelBn: 'রয়্যাল লাভ',
    labelEn: 'Royal Love',
    subBn: 'রুবি হার্ট ও ভেলভেট খাম',
    accentFrom: '#F43F5E',
    accentVia: '#FB7185',
    accentTo: '#E11D48',
    glowRgba: 'rgba(244, 63, 94, 0.45)',
    cardGrad: 'from-[#2D0814] via-[#4C0D22] to-[#1F040C]',
    lightCardGrad: 'from-rose-50 via-pink-50/90 to-red-50',
    borderActive: 'border-rose-400 ring-2 ring-rose-400/40',
    badgeBg: 'from-rose-500 via-pink-500 to-red-600',
    titleBn: 'আপনার জন্য ভালোবাসার বিশেষ উপহার ও বার্তা এসেছে!'
  },
  salami: {
    id: 'salami',
    labelBn: 'শাহী সালামি',
    labelEn: 'Shahi Salami',
    subBn: 'গোল্ডেন চাঁদ ও ফানুস',
    accentFrom: '#10B981',
    accentVia: '#34D399',
    accentTo: '#059669',
    glowRgba: 'rgba(16, 185, 129, 0.45)',
    cardGrad: 'from-[#04261C] via-[#064230] to-[#021811]',
    lightCardGrad: 'from-emerald-50 via-teal-50/90 to-green-50',
    borderActive: 'border-emerald-400 ring-2 ring-emerald-400/40',
    badgeBg: 'from-emerald-500 via-teal-500 to-emerald-700',
    titleBn: 'ঈদ মোবারক! আপনার জন্য শাহী ঈদের সালামি এসেছে!'
  },
  birthday: {
    id: 'birthday',
    labelBn: 'বার্থডে রয়্যাল',
    labelEn: 'Birthday Royal',
    subBn: 'ক্রাউন কেক ও স্পার্কল',
    accentFrom: '#A855F7',
    accentVia: '#EC4899',
    accentTo: '#7C3AED',
    glowRgba: 'rgba(168, 85, 247, 0.45)',
    cardGrad: 'from-[#1F0B38] via-[#35125E] to-[#130624]',
    lightCardGrad: 'from-purple-50 via-fuchsia-50/90 to-pink-50',
    borderActive: 'border-purple-400 ring-2 ring-purple-400/40',
    badgeBg: 'from-purple-500 via-fuchsia-500 to-pink-600',
    titleBn: 'শুভ জন্মদিন! আপনার জন্য রাজকীয় জন্মদিনের উপহার এসেছে!'
  },
  congrats: {
    id: 'congrats',
    labelBn: 'ডায়মন্ড ট্রফি',
    labelEn: 'Diamond Trophy',
    subBn: 'ভিক্টরি কাপ ও সম্মাননা',
    accentFrom: '#3B82F6',
    accentVia: '#60A5FA',
    accentTo: '#1D4ED8',
    glowRgba: 'rgba(59, 130, 246, 0.45)',
    cardGrad: 'from-[#081A38] via-[#102C5E] to-[#051024]',
    lightCardGrad: 'from-blue-50 via-indigo-50/90 to-sky-50',
    borderActive: 'border-sky-400 ring-2 ring-sky-400/40',
    badgeBg: 'from-blue-500 via-indigo-500 to-cyan-600',
    titleBn: 'অভিনন্দন! আপনার সাফল্যের জন্য বিশেষ উপহার এসেছে!'
  }
};

const PremiumGiftArtwork = ({ theme = 'surprise', size = 56, animated = false, className = '' }) => {
  const key = String(theme || 'surprise').toLowerCase();
  const uid = `pg-${key}-${size}`;

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative inline-flex items-center justify-center select-none shrink-0 ${
        animated ? 'animate-[tpGiftFloat_3s_ease-in-out_infinite]' : ''
      } ${className}`}
    >
      {key === 'surprise' && (
        <svg viewBox="0 0 120 120" className="w-full h-full overflow-visible drop-shadow-[0_8px_16px_rgba(245,158,11,0.45)]">
          <defs>
            <linearGradient id={`${uid}-boxL`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#991B1B" />
              <stop offset="50%" stopColor="#7F1D1D" />
              <stop offset="100%" stopColor="#450A0A" />
            </linearGradient>
            <linearGradient id={`${uid}-boxR`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#DC2626" />
              <stop offset="50%" stopColor="#B91C1C" />
              <stop offset="100%" stopColor="#7F1D1D" />
            </linearGradient>
            <linearGradient id={`${uid}-lid`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="50%" stopColor="#DC2626" />
              <stop offset="100%" stopColor="#991B1B" />
            </linearGradient>
            <linearGradient id={`${uid}-gold`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="35%" stopColor="#FACC15" />
              <stop offset="70%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#FEF08A" />
            </linearGradient>
            <radialGradient id={`${uid}-glow`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FBBF24" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="60" cy="64" r="52" fill={`url(#${uid}-glow)`} />
          <ellipse cx="60" cy="104" rx="38" ry="8" fill="rgba(0,0,0,0.35)" />
          <polygon points="22,52 60,68 60,104 22,86" fill={`url(#${uid}-boxL)`} stroke="#FBBF24" strokeWidth="0.8" strokeOpacity="0.5" />
          <polygon points="98,52 60,68 60,104 98,86" fill={`url(#${uid}-boxR)`} stroke="#FBBF24" strokeWidth="0.8" strokeOpacity="0.5" />
          <polygon points="36,58 46,62 46,98 36,93" fill={`url(#${uid}-gold)`} />
          <polygon points="84,58 74,62 74,98 84,93" fill={`url(#${uid}-gold)`} />
          <polygon points="60,28 104,44 60,60 16,44" fill={`url(#${uid}-lid)`} stroke="#FDE047" strokeWidth="1" />
          <polygon points="16,44 60,60 60,70 16,53" fill="#991B1B" stroke="#FBBF24" strokeWidth="0.7" />
          <polygon points="104,44 60,60 60,70 104,53" fill="#B91C1C" stroke="#FBBF24" strokeWidth="0.7" />
          <polygon points="35,37 45,33 85,51 75,55" fill={`url(#${uid}-gold)`} />
          <polygon points="85,37 75,33 35,51 45,55" fill={`url(#${uid}-gold)`} />
          <polygon points="34,51 45,55 45,65 34,60" fill={`url(#${uid}-gold)`} />
          <polygon points="86,51 75,55 75,65 86,60" fill={`url(#${uid}-gold)`} />
          <path d="M60,42 C42,20 26,30 38,44 C46,48 54,45 60,42 Z" fill={`url(#${uid}-gold)`} stroke="#FEF9C3" strokeWidth="1" />
          <path d="M60,42 C78,20 94,30 82,44 C74,48 66,45 60,42 Z" fill={`url(#${uid}-gold)`} stroke="#FEF9C3" strokeWidth="1" />
          <polygon points="60,34 68,42 60,50 52,42" fill="#FEF08A" stroke="#B45309" strokeWidth="1.2" />
          <polygon points="60,37 65,42 60,47 55,42" fill="#FFFFFF" opacity="0.85" />
          <path d="M22,22 L24,27 L29,29 L24,31 L22,36 L20,31 L15,29 L20,27 Z" fill="#FEF08A" />
          <path d="M98,18 L99.5,22 L103.5,23.5 L99.5,25 L98,29 L96.5,25 L92.5,23.5 L96.5,22 Z" fill="#FDE047" />
          <circle cx="60" cy="14" r="2.5" fill="#FEF08A" />
        </svg>
      )}

      {key === 'love' && (
        <svg viewBox="0 0 120 120" className="w-full h-full overflow-visible drop-shadow-[0_8px_16px_rgba(244,63,94,0.45)]">
          <defs>
            <linearGradient id={`${uid}-env`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FB7185" />
              <stop offset="50%" stopColor="#E11D48" />
              <stop offset="100%" stopColor="#881337" />
            </linearGradient>
            <linearGradient id={`${uid}-heart`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFE4E6" />
              <stop offset="30%" stopColor="#F43F5E" />
              <stop offset="75%" stopColor="#9F1239" />
              <stop offset="100%" stopColor="#881337" />
            </linearGradient>
            <linearGradient id={`${uid}-gold`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>
            <radialGradient id={`${uid}-glow`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FB7185" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#E11D48" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="60" cy="60" r="52" fill={`url(#${uid}-glow)`} />
          <ellipse cx="60" cy="104" rx="38" ry="7" fill="rgba(0,0,0,0.3)" />
          <path d="M22,58 C6,46 8,28 24,34 C16,40 20,48 28,50 Z" fill={`url(#${uid}-gold)`} />
          <path d="M98,58 C114,46 112,28 96,34 C104,40 100,48 92,50 Z" fill={`url(#${uid}-gold)`} />
          <rect x="18" y="42" width="84" height="56" rx="10" fill={`url(#${uid}-env)`} stroke="#FDE047" strokeWidth="1.5" />
          <rect x="26" y="28" width="68" height="44" rx="6" fill="#FFFBEB" stroke="#F59E0B" strokeWidth="1.2" />
          <line x1="36" y1="38" x2="66" y2="38" stroke="#F43F5E" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
          <line x1="36" y1="45" x2="82" y2="45" stroke="#FB7185" strokeWidth="2" strokeLinecap="round" opacity="0.35" />
          <path d="M18,94 L60,66 L102,94" fill="rgba(136,19,55,0.55)" stroke="#FDA4AF" strokeWidth="1" />
          <path
            d="M60,84 C60,84 35,68 35,51 C35,41 44,35 52,39 C56,41 58,44 60,47 C62,44 64,41 68,39 C76,35 85,41 85,51 C85,68 60,84 60,84 Z"
            fill={`url(#${uid}-heart)`}
            stroke={`url(#${uid}-gold)`}
            strokeWidth="2.2"
          />
          <ellipse cx="47" cy="48" rx="5" ry="3" transform="rotate(-30 47 48)" fill="#FFFFFF" opacity="0.65" />
          <path d="M24,22 L26,26 L30,28 L26,30 L24,34 L22,30 L18,28 L22,26 Z" fill="#FECDD3" />
          <path d="M96,20 L98,24 L102,26 L98,28 L96,32 L94,28 L90,26 L94,24 Z" fill="#FDE047" />
        </svg>
      )}

      {key === 'salami' && (
        <svg viewBox="0 0 120 120" className="w-full h-full overflow-visible drop-shadow-[0_8px_16px_rgba(16,185,129,0.45)]">
          <defs>
            <linearGradient id={`${uid}-em`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="50%" stopColor="#059669" />
              <stop offset="100%" stopColor="#064E3B" />
            </linearGradient>
            <linearGradient id={`${uid}-gold`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="45%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>
            <radialGradient id={`${uid}-glow`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#34D399" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="60" cy="60" r="52" fill={`url(#${uid}-glow)`} />
          <ellipse cx="60" cy="105" rx="36" ry="6" fill="rgba(0,0,0,0.3)" />
          <rect x="30" y="28" width="60" height="72" rx="12" transform="rotate(-6 60 64)" fill={`url(#${uid}-em)`} stroke={`url(#${uid}-gold)`} strokeWidth="2" />
          <path d="M38,92 L38,52 C38,38 60,32 60,32 C60,32 82,38 82,52 L82,92 Z" transform="rotate(-6 60 64)" fill="rgba(6,78,59,0.65)" stroke="#FDE047" strokeWidth="1" strokeDasharray="3 2" />
          <path
            d="M58,22 C36,24 22,44 26,66 C30,88 52,100 74,94 C54,94 40,78 40,58 C40,38 52,26 68,24 C64,22 61,22 58,22 Z"
            fill={`url(#${uid}-gold)`}
            stroke="#FEF9C3"
            strokeWidth="1"
          />
          <line x1="74" y1="22" x2="74" y2="38" stroke="#FDE047" strokeWidth="2" />
          <polygon points="74,36 84,44 64,44" fill={`url(#${uid}-gold)`} />
          <rect x="66" y="44" width="16" height="22" rx="3" fill="#FEF08A" stroke="#D97706" strokeWidth="1.5" />
          <circle cx="74" cy="55" r="5" fill="#FFFFFF" opacity="0.9" />
          <polygon points="64,66 84,66 78,74 70,74" fill={`url(#${uid}-gold)`} />
          <path d="M92,24 L94,30 L100,32 L94,34 L92,40 L90,34 L84,32 L90,30 Z" fill="#FEF08A" />
          <path d="M24,28 L25.5,32 L29.5,33.5 L25.5,35 L24,39 L22.5,35 L18.5,33.5 L22.5,32 Z" fill="#A7F3D0" />
        </svg>
      )}

      {key === 'birthday' && (
        <svg viewBox="0 0 120 120" className="w-full h-full overflow-visible drop-shadow-[0_8px_16px_rgba(168,85,247,0.45)]">
          <defs>
            <linearGradient id={`${uid}-tier1`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C084FC" />
              <stop offset="50%" stopColor="#9333EA" />
              <stop offset="100%" stopColor="#581C87" />
            </linearGradient>
            <linearGradient id={`${uid}-tier2`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F472B6" />
              <stop offset="50%" stopColor="#DB2777" />
              <stop offset="100%" stopColor="#831843" />
            </linearGradient>
            <linearGradient id={`${uid}-cream`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#FCE7F3" />
            </linearGradient>
            <linearGradient id={`${uid}-gold`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>
            <radialGradient id={`${uid}-glow`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#E879F9" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#9333EA" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="60" cy="60" r="52" fill={`url(#${uid}-glow)`} />
          <ellipse cx="60" cy="98" rx="44" ry="9" fill={`url(#${uid}-gold)`} stroke="#FEF9C3" strokeWidth="1.2" />
          <rect x="24" y="66" width="72" height="30" rx="8" fill={`url(#${uid}-tier1)`} stroke="#FDE047" strokeWidth="1.2" />
          <path d="M24,72 Q33,82 42,72 Q51,82 60,72 Q69,82 78,72 Q87,82 96,72 L96,68 L24,68 Z" fill={`url(#${uid}-cream)`} />
          <rect x="34" y="42" width="52" height="26" rx="7" fill={`url(#${uid}-tier2)`} stroke="#FDE047" strokeWidth="1.2" />
          <path d="M34,48 Q42,57 51,48 Q60,57 69,48 Q78,57 86,48 L86,44 L34,44 Z" fill={`url(#${uid}-cream)`} />
          <rect x="44" y="26" width="5" height="16" rx="2" fill="#FEF08A" stroke="#D97706" strokeWidth="0.8" />
          <rect x="57.5" y="22" width="5" height="20" rx="2" fill="#FEF08A" stroke="#D97706" strokeWidth="0.8" />
          <rect x="71" y="26" width="5" height="16" rx="2" fill="#FEF08A" stroke="#D97706" strokeWidth="0.8" />
          <path d="M46.5,14 C46.5,14 42,20 44.5,24 C46.5,26 48.5,24 48.5,24 C51,20 46.5,14 46.5,14 Z" fill="#FBBF24" />
          <path d="M60,10 C60,10 55,16 58,21 C60,23 62,21 62,21 C65,16 60,10 60,10 Z" fill="#FEF08A" />
          <path d="M73.5,14 C73.5,14 69,20 71.5,24 C73.5,26 75.5,24 75.5,24 C78,20 73.5,14 73.5,14 Z" fill="#FBBF24" />
          <circle cx="40" cy="86" r="2.5" fill="#FEF08A" />
          <circle cx="60" cy="86" r="2.5" fill="#FEF08A" />
          <circle cx="80" cy="86" r="2.5" fill="#FEF08A" />
          <path d="M18,32 L20,36 L24,38 L20,40 L18,44 L16,40 L12,38 L16,36 Z" fill="#FDE047" />
          <path d="M102,28 L104,32 L108,34 L104,36 L102,40 L100,36 L96,34 L100,32 Z" fill="#F472B6" />
        </svg>
      )}

      {key === 'congrats' && (
        <svg viewBox="0 0 120 120" className="w-full h-full overflow-visible drop-shadow-[0_8px_16px_rgba(59,130,246,0.45)]">
          <defs>
            <linearGradient id={`${uid}-gold`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FEF9C3" />
              <stop offset="35%" stopColor="#FACC15" />
              <stop offset="75%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#92400E" />
            </linearGradient>
            <linearGradient id={`${uid}-gem`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#BAE6FD" />
              <stop offset="45%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#1D4ED8" />
            </linearGradient>
            <radialGradient id={`${uid}-glow`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="60" cy="60" r="52" fill={`url(#${uid}-glow)`} />
          <ellipse cx="60" cy="105" rx="34" ry="7" fill="rgba(0,0,0,0.35)" />
          <path d="M36,34 C18,34 18,58 38,62" fill="none" stroke={`url(#${uid}-gold)`} strokeWidth="5" strokeLinecap="round" />
          <path d="M84,34 C102,34 102,58 82,62" fill="none" stroke={`url(#${uid}-gold)`} strokeWidth="5" strokeLinecap="round" />
          <path d="M34,26 L86,26 L80,58 C78,72 68,78 60,78 C52,78 42,72 40,58 Z" fill={`url(#${uid}-gold)`} stroke="#FEF9C3" strokeWidth="1.5" />
          <rect x="55" y="76" width="10" height="14" rx="2" fill={`url(#${uid}-gold)`} />
          <rect x="40" y="90" width="40" height="10" rx="4" fill="#1E293B" stroke={`url(#${uid}-gold)`} strokeWidth="2" />
          <polygon points="60,34 72,48 60,62 48,48" fill={`url(#${uid}-gem)`} stroke="#FFFFFF" strokeWidth="1.5" />
          <polygon points="60,38 67,48 60,54 53,48" fill="#E0F2FE" opacity="0.75" />
          <path d="M60,8 L62,15 L69,17 L62,19 L60,26 L58,19 L51,17 L58,15 Z" fill="#FEF08A" />
          <path d="M20,20 L22,24 L26,26 L22,28 L20,32 L18,28 L14,26 L18,24 Z" fill="#BAE6FD" />
          <path d="M100,20 L102,24 L106,26 L102,28 L100,32 L98,28 L94,26 L98,24 Z" fill="#FDE047" />
        </svg>
      )}
    </div>
  );
};

// ============================================================================
// ONE-TIME ANIMATED "MONEY RECEIVED" POPUP CARD FOR RECIPIENT
// ============================================================================
const MoneyReceivedPopupModal = ({ transfer, onDismiss, lang = 'bn', darkMode = false }) => {
  if (!transfer) return null;

  const [isOpened, setIsOpened] = useState(false);
  const isGift = Boolean(transfer.isGift);
  const themeKey = String(transfer.giftTheme || 'surprise').toLowerCase();
  const currentTheme = GIFT_THEME_META[themeKey] || GIFT_THEME_META.surprise;
  const senderName = transfer.senderName || 'Trust Pay User';
  const senderMbsId = transfer.senderMbsId || (transfer.senderId ? `MBS${String(transfer.senderId).slice(-5)}` : '');
  const isSenderBoss = Boolean(String(transfer.senderId) === '8799135330' || senderMbsId === 'MT999999');
  const amountFormatted = Number(transfer.amount || 0).toFixed(2);
  const commentText = String(transfer.comment || transfer.note || '').trim();

  const handleOpenGift = () => {
    if (isOpened) return;
    playAppSound('success');
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
    setIsOpened(true);
  };

  const handleClaimAndClose = () => {
    playAppSound('tap');
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }
    onDismiss();
  };

  return (
    <div 
      onClick={isGift && !isOpened ? handleOpenGift : undefined}
      className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300 select-none cursor-pointer"
    >
      <style>{`
        @keyframes tpGiftFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg) scale(1); }
          25% { transform: translateY(-7px) rotate(-2.5deg) scale(1.04); }
          50% { transform: translateY(-10px) rotate(0deg) scale(1.06); }
          75% { transform: translateY(-5px) rotate(2.5deg) scale(1.03); }
        }
        @keyframes tpRaysSpin {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.08); }
          100% { transform: rotate(360deg) scale(1); }
        }
        @keyframes tpCardReveal3D {
          0% { transform: perspective(900px) rotateX(22deg) scale(0.72) translateY(30px); opacity: 0; }
          65% { transform: perspective(900px) rotateX(-3deg) scale(1.03) translateY(-4px); opacity: 1; }
          100% { transform: perspective(900px) rotateX(0deg) scale(1) translateY(0px); opacity: 1; }
        }
        @keyframes tpRingPulse {
          0% { transform: scale(0.85); opacity: 0.75; }
          100% { transform: scale(1.65); opacity: 0; }
        }
      `}</style>

      {/* Ambient Rotating God-Rays & Luxury Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <div
          style={{ background: `radial-gradient(circle, ${currentTheme.glowRgba} 0%, transparent 70%)` }}
          className="w-[420px] h-[420px] rounded-full blur-3xl opacity-80"
        />
        {isGift && (
          <svg
            viewBox="0 0 400 400"
            className="absolute w-[460px] h-[460px] opacity-25 animate-[tpRaysSpin_22s_linear_infinite]"
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <polygon
                key={i}
                points="200,200 182,10 218,10"
                fill={currentTheme.accentVia}
                transform={`rotate(${i * 30} 200 200)`}
              />
            ))}
          </svg>
        )}
      </div>

      {/* ==================================================================== */}
      {/* CASE A: ULTRA-PREMIUM 3D GIFT UNBOXING EXPERIENCE                    */}
      {/* ==================================================================== */}
      {isGift ? (
        <div 
          onClick={e => e.stopPropagation()} 
          className="relative w-full max-w-sm flex flex-col items-center justify-center cursor-default"
        >
          {!isOpened ? (
            /* 1. UNOPENED 3D ROYAL GIFT SHOWCASE */
            <div 
              onClick={handleOpenGift}
              className="w-full flex flex-col items-center justify-center cursor-pointer group py-4"
            >
              {/* Top Sender Badge */}
              <div className="mb-5 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-amber-400/40 text-white text-xs font-black shadow-[0_0_25px_rgba(245,158,11,0.3)] flex items-center gap-2">
                <Sparkles size={14} className="text-amber-300 animate-spin" style={{ animationDuration: '5s' }} />
                <span className="text-amber-200">{senderName}</span>
                <span>{lang === 'bn' ? 'একটি প্রিমিয়াম গিফট পাঠিয়েছেন!' : 'sent you a Royal Gift!'}</span>
              </div>

              {/* 3D Pedestal Stage with Pulsing Halo Rings & Large Gift Artwork */}
              <div className="relative w-64 h-64 flex items-center justify-center">
                <div
                  style={{ borderColor: currentTheme.accentVia, animation: 'tpRingPulse 2.2s ease-out infinite' }}
                  className="absolute w-44 h-44 rounded-full border-2"
                />
                <div
                  style={{ borderColor: currentTheme.accentFrom, animation: 'tpRingPulse 2.2s ease-out 0.9s infinite' }}
                  className="absolute w-44 h-44 rounded-full border"
                />

                {/* Glassmorphic Royal Showcase Pod */}
                <div className={`relative w-52 h-52 rounded-[40px] bg-gradient-to-b ${currentTheme.cardGrad} border-2 border-amber-400/60 shadow-[0_25px_70px_rgba(0,0,0,0.85)] flex flex-col items-center justify-center p-4 group-hover:scale-105 transition-transform duration-300`}>
                  <div className="absolute inset-x-6 top-0 h-[2px] bg-gradient-to-r from-transparent via-amber-300 to-transparent opacity-90" />
                  <PremiumGiftArtwork theme={themeKey} size={132} animated={true} />
                  <span className={`mt-1 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r ${currentTheme.badgeBg} text-white shadow-md`}>
                    {lang === 'bn' ? currentTheme.labelBn : currentTheme.labelEn}
                  </span>
                </div>
              </div>

              {/* Tap to Open CTA Button */}
              <div className="mt-6 text-center space-y-2">
                <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r ${currentTheme.badgeBg} text-white font-black text-sm shadow-[0_10px_30px_rgba(245,158,11,0.45)] border-t border-white/40 group-hover:scale-105 active:scale-95 transition-transform`}>
                  <Sparkles size={16} />
                  <span>{lang === 'bn' ? 'উপহারটি আনবক্স করতে ট্যাপ করুন' : 'Tap to Unbox Your Gift'}</span>
                  <Sparkles size={16} />
                </div>
                <p className="text-[11px] text-white/60 font-medium block">
                  {lang === 'bn' ? 'টাচ করলেই ম্যাজিকের মতো উপহার খুলে যাবে ✨' : 'Tap anywhere to reveal your surprise ✨'}
                </p>
              </div>
            </div>
          ) : (
            /* 2. UNBOXED 3D LUXURY GIFT REVEAL CARD */
            <div 
              style={{ animation: 'tpCardReveal3D 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
              className={`relative w-full max-w-[360px] p-5 sm:p-6 rounded-[32px] shadow-[0_25px_70px_rgba(0,0,0,0.85)] border-2 text-center space-y-4 overflow-hidden ${
                darkMode 
                  ? `bg-gradient-to-b ${currentTheme.cardGrad} border-amber-400/60 text-white` 
                  : 'bg-gradient-to-b from-[#FFFDF9] via-white to-[#FEF9EE] border-amber-400/90 text-slate-900'
              }`}
            >
              {/* Top Shimmer Line */}
              <div className="absolute inset-x-8 top-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

              {/* Floating 3D Gift Emblem at Top Center */}
              <div className="relative flex flex-col items-center justify-center pt-1">
                <div className="relative">
                  <PremiumGiftArtwork theme={themeKey} size={86} animated={true} />
                </div>
                <span className={`mt-1 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r ${currentTheme.badgeBg} text-white shadow-sm`}>
                  {lang === 'bn' ? currentTheme.labelBn : currentTheme.labelEn}
                </span>
                <p className="text-xs font-bold text-amber-600 dark:text-amber-300 mt-1.5">
                  {currentTheme.titleBn}
                </p>
              </div>

              {/* Huge Sparkling Gift Amount */}
              <div className="py-2.5 px-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-0.5">
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-300 block uppercase tracking-widest">
                  {lang === 'bn' ? 'উপহারের পরিমাণ' : 'GIFT AMOUNT'}
                </span>
                <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-emerald-500 dark:text-emerald-400 drop-shadow-xs">
                  +৳{amountFormatted} <span className="text-sm font-extrabold font-sans">BDT</span>
                </div>
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-300/80 block">
                  {lang === 'bn' ? 'সরাসরি আপনার মেইন ব্যালেন্সে যুক্ত হয়েছে ✓' : 'Added directly to your main balance ✓'}
                </span>
              </div>

              {/* Sender Profile Card */}
              <div className={`flex items-center gap-3 p-3 rounded-2xl border text-left ${
                darkMode ? 'bg-black/30 border-white/15' : 'bg-amber-50/70 border-amber-200/80'
              }`}>
                <div className="relative shrink-0 flex items-center justify-center">
                  {isSenderBoss ? (
                    <div className="relative flex items-center justify-center w-11 h-11">
                      <UserAvatarBox
                        userId={transfer.senderId}
                        photoUrl={transfer.senderPhotoUrl}
                        name={senderName}
                        sizeClass="w-11 h-11 rounded-full text-base shadow-xs overflow-hidden"
                      />
                      <img
                        src={marufFrameImg}
                        alt="Crown Frame"
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[68px] h-[68px] max-w-none pointer-events-none z-20"
                      />
                    </div>
                  ) : (
                    <UserAvatarBox
                      userId={transfer.senderId}
                      photoUrl={transfer.senderPhotoUrl}
                      name={senderName}
                      sizeClass="w-11 h-11 rounded-full text-base shadow-sm"
                    />
                  )}
                </div>
                <div className={`min-w-0 flex-1 leading-tight ${isSenderBoss ? 'pl-2.5' : ''}`}>
                  <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">
                    {lang === 'bn' ? 'উপহার পাঠিয়েছেন' : 'Gift Sent By'}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-nowrap">
                    <span className="font-black text-sm truncate">
                      {senderName}
                    </span>
                    <span className="text-[9.5px] font-mono font-black px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30 shrink-0">
                      {senderMbsId}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sender's Special Note */}
              {commentText && (
                <div className={`p-3.5 rounded-2xl border text-left relative ${
                  darkMode 
                    ? 'bg-white/5 border-amber-400/30 text-amber-100' 
                    : 'bg-white border-amber-200 text-slate-800 shadow-2xs'
                }`}>
                  <div className="text-[10px] font-black uppercase tracking-wider text-amber-500 mb-1 flex items-center gap-1">
                    <Sparkles size={11} />
                    <span>{lang === 'bn' ? 'প্রেরকের শুভেচ্ছা বার্তা:' : 'Personal Message:'}</span>
                  </div>
                  <p className="font-serif italic font-bold text-sm leading-relaxed break-words">
                    "{commentText}"
                  </p>
                </div>
              )}

              {/* Claim 3D Button */}
              <button
                type="button"
                onClick={handleClaimAndClose}
                className={`w-full h-[48px] rounded-2xl bg-gradient-to-r ${currentTheme.badgeBg} text-white font-black text-sm shadow-[0_10px_25px_rgba(245,158,11,0.4)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer border-t border-white/35 border-b-[3px] border-black/30`}
              >
                <Sparkles size={16} />
                <span>{lang === 'bn' ? 'উপহার গ্রহণ করুন (Claim Gift)' : 'Claim Gift'}</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ==================================================================== */
        /* CASE B: STANDARD DIRECT TRANSFER (রেগুলার মানি রিসিভড)                */
        /* ==================================================================== */
        <div 
          onClick={e => e.stopPropagation()} 
          className={`relative w-full max-w-[355px] p-6 rounded-[32px] shadow-2xl border text-center space-y-4 animate-in zoom-in-95 duration-300 overflow-hidden cursor-default ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200/90 text-slate-900'
          }`}
        >
          {/* Ambient Emerald Celebration Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 rounded-full bg-emerald-500/20 blur-2xl pointer-events-none" />

          {/* Animated Celebration Emblem */}
          <LuxurySuccessEmblem badgeText={lang === 'bn' ? 'টাকা পেয়েছেন • MONEY RECEIVED' : 'MONEY RECEIVED'} />

          {/* Title & Amount */}
          <div className="relative z-10 space-y-1">
            <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
              {lang === 'bn' ? 'অভিনন্দন! আপনি টাকা পেয়েছেন 🎉' : 'Money Received! 🎉'}
            </h3>
            <div className="text-3xl font-black font-mono tracking-tight text-emerald-600 dark:text-emerald-400 drop-shadow-2xs">
              +৳{amountFormatted} <span className="text-sm font-extrabold">BDT</span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {lang === 'bn'
                ? 'টাকাটি সরাসরি আপনার অ্যাপ ব্যালেন্সে যোগ করা হয়েছে'
                : 'Instantly credited to your Trust Pay balance'}
            </p>
          </div>

          {/* Sender Profile Card */}
          <div className={`relative z-10 p-3.5 rounded-2xl border text-left space-y-2.5 ${
            darkMode
              ? 'bg-gradient-to-r from-slate-800/90 via-slate-800/70 to-emerald-950/30 border-slate-700/90'
              : 'bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-white border-emerald-200/80'
          }`}>
            <div className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
              <span>{lang === 'bn' ? 'প্রেরকের বিবরণ (Sent By)' : 'Sent By'}</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 text-[9.5px] font-black">
                ✓ P2P Direct
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <UserAvatarBox
                  userId={transfer.senderId}
                  avatarDataUrl={transfer.senderAvatarDataUrl}
                  photoUrl={transfer.senderPhotoUrl}
                  name={senderName}
                  sizeClass="w-12 h-12 rounded-2xl text-base"
                />
                <div className="absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[9px] text-white font-bold">
                  ✓
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-black text-slate-900 dark:text-white truncate">
                  {senderName}
                </div>
                <div className="text-[11px] font-mono font-bold text-purple-600 dark:text-purple-400 truncate">
                  ID: {senderMbsId} {transfer.senderId ? `• UID: ${transfer.senderId}` : ''}
                </div>
              </div>
            </div>

            {/* Sender Note / Comment in sleek quote bubble */}
            {commentText && (
              <div className={`mt-2 p-2.5 rounded-xl border text-xs ${
                darkMode
                  ? 'bg-slate-900/80 border-slate-700/80 text-slate-200'
                  : 'bg-white/90 border-emerald-200/70 text-slate-700'
              }`}>
                <div className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-0.5">
                  💬 {lang === 'bn' ? 'প্রেরকের মন্তব্য (Note):' : 'Sender Note:'}
                </div>
                <p className="font-bold italic break-words leading-snug">
                  "{commentText}"
                </p>
              </div>
            )}
          </div>

          {/* Okay Button */}
          <button
            type="button"
            onClick={onDismiss}
            className="relative z-10 w-full h-[48px] rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 text-white font-black text-sm shadow-[0_8px_22px_rgba(16,185,129,0.35)] hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer border-b-[3px] border-[#065f46]"
          >
            <CheckCircle2 size={17} />
            <span>{lang === 'bn' ? 'ঠিক আছে (Okay)' : 'Okay'}</span>
          </button>
        </div>
      )}
    </div>
  );
};


export function NetworkLogo({ id, networkId, size = 20, className = "w-5 h-5 shrink-0 rounded-full" }) {
    const netId = String(id || networkId || 'TON').toUpperCase();

    if (netId === 'TON') {
        return (
            <svg viewBox="0 0 56 56" width={size} height={size} className={className} fill="none">
                <circle cx="28" cy="28" r="28" fill="#0098EA"/>
                <path fill="#FFFFFF" d="M37.5603 15.6277H18.4386C14.9228 15.6277 12.6944 19.4202 14.4632 22.4861L26.2644 42.9409C27.0345 44.2765 28.9644 44.2765 29.7345 42.9409L41.5381 22.4861C43.3045 19.4251 41.0761 15.6277 37.5627 15.6277H37.5603ZM26.2548 36.8068L23.6847 31.8327L17.4833 20.7414C17.0742 20.0315 17.5795 19.1218 18.4362 19.1218H26.2524V36.8092L26.2548 36.8068ZM38.5108 20.739L32.3118 31.8351L29.7417 36.8068V19.1194H37.5579C38.4146 19.1194 38.9199 20.0291 38.5108 20.739Z"/>
            </svg>
        );
    }

    if (netId === 'GRAM') {
        return (
            <svg viewBox="0 0 56 56" width={size} height={size} className={className} fill="none">
                <circle cx="28" cy="28" r="28" fill="#1E2026"/>
                <circle cx="28" cy="28" r="27.2" stroke="white" strokeOpacity="0.16" strokeWidth="1.2"/>
                <path fill="#FFFFFF" d="M37.5603 15.6277H18.4386C14.9228 15.6277 12.6944 19.4202 14.4632 22.4861L26.2644 42.9409C27.0345 44.2765 28.9644 44.2765 29.7345 42.9409L41.5381 22.4861C43.3045 19.4251 41.0761 15.6277 37.5627 15.6277H37.5603ZM26.2548 36.8068L23.6847 31.8327L17.4833 20.7414C17.0742 20.0315 17.5795 19.1218 18.4362 19.1218H26.2524V36.8092L26.2548 36.8068ZM38.5108 20.739L32.3118 31.8351L29.7417 36.8068V19.1194H37.5579C38.4146 19.1194 38.9199 20.0291 38.5108 20.739Z"/>
            </svg>
        );
    }

    if (netId === 'USDT') {
        return (
            <svg viewBox="0 0 32 32" width={size} height={size} className={className} fill="none">
                <circle cx="16" cy="16" r="16" fill="#26A17B" />
                <path fill="#FFFFFF" d="M17.922 17.383v-.002c-.11.008-.677.042-1.942.042-1.01 0-1.721-.03-1.971-.042v.003c-3.888-.171-6.79-.848-6.79-1.658 0-.809 2.902-1.486 6.79-1.66v2.644c.254.018.982.061 1.988.061 1.207 0 1.812-.05 1.925-.06v-2.643c3.88.173 6.775.85 6.775 1.658 0 .81-2.895 1.485-6.775 1.657m0-3.59v-2.366h5.414V7.819H8.595v3.608h5.414v2.365c-4.4.202-7.709 1.074-7.709 2.118 0 1.044 3.309 1.915 7.709 2.118v7.582h3.913v-7.584c4.393-.202 7.694-1.073 7.694-2.116 0-1.043-3.301-1.914-7.694-2.117"/>
            </svg>
        );
    }

    if (netId === 'BEP20' || netId === 'BSC' || netId === 'BNB') {
        return (
            <svg viewBox="0 0 56 56" width={size} height={size} className={className} fill="none">
                <circle cx="28" cy="28" r="28" fill="#F0B90B"/>
                <g fill="#FFFFFF">
                    <path d="M21.48 24.64L28 18.12L34.52 24.64L38.32 20.84L28 10.52L17.68 20.84L21.48 24.64Z"/>
                    <path d="M13.88 28L17.68 24.2L21.48 28L17.68 31.8L13.88 28Z"/>
                    <path d="M21.48 31.36L28 37.88L34.52 31.36L38.32 35.16L28 45.48L17.68 35.16L21.48 31.36Z"/>
                    <path d="M34.52 28L38.32 24.2L42.12 28L38.32 31.8L34.52 28Z"/>
                    <path d="M31.86 28L28 24.14L24.14 28L28 31.86L31.86 28Z"/>
                </g>
            </svg>
        );
    }

    if (netId === 'ARBITRUM' || netId === 'ARB' || netId === 'ARBITRUM ONE') {
        return (
            <svg viewBox="0 0 32 32" fill="none" width={size} height={size} className={className}>
                <circle cx="16" cy="16" r="16" fill="#213147"/>
                <path d="M16.0039 19.7661L19.6819 25.5391L23.0799 23.5691L18.2499 15.9561L16.0039 19.7661ZM26.1739 21.2541L26.1719 19.6771L20.8929 11.4551L18.9329 14.7781L24.0289 23.0181L25.8729 21.9511C25.962 21.8785 26.0348 21.7881 26.0866 21.6856C26.1385 21.5831 26.1682 21.4708 26.1739 21.3561V21.2541Z" fill="#28A0F0"/>
                <path d="M4.05469 22.742L6.65569 24.241L15.3137 10.356L13.8447 10.318C12.5927 10.301 11.2447 10.626 10.6247 11.637L5.70869 19.257L4.05569 21.798V22.743L4.05469 22.742ZM20.3107 10.356L16.4387 10.37L7.67669 24.83L10.7387 26.593L11.5717 25.181L20.3107 10.357V10.356Z" fill="white"/>
                <path d="M27.8057 10.3359C27.7879 9.93631 27.6731 9.54701 27.4714 9.20156C27.2697 8.85611 26.987 8.56488 26.6477 8.35295L17.0197 2.81695C16.676 2.6481 16.2982 2.5603 15.9152 2.5603C15.5323 2.5603 15.1544 2.6481 14.8107 2.81695L5.44871 8.24095C4.98405 8.46357 4.60053 8.82577 4.35171 9.27695C4.17371 9.60195 4.07171 9.96195 4.05371 10.3319V21.7979L5.70671 19.2569L5.69371 10.4099C5.7014 10.2887 5.73589 10.1706 5.79468 10.0643C5.85347 9.95794 5.93511 9.86595 6.03371 9.79495L15.5487 4.28395C15.6617 4.22888 15.7856 4.19994 15.9113 4.19924C16.0369 4.19855 16.1611 4.22613 16.2747 4.27995L25.7777 9.74695C25.8881 9.81738 25.9801 9.91324 26.0458 10.0265C26.1116 10.1398 26.1493 10.2671 26.1557 10.3979V21.3579C26.1534 21.4715 26.1268 21.5832 26.0778 21.6856C26.0289 21.788 25.9586 21.8788 25.8717 21.9519L24.0297 23.0199L23.0797 23.5709L19.6817 25.5409L16.2357 27.5369C16.0455 27.6041 15.8373 27.6002 15.6497 27.5259L11.5727 25.1809L10.7397 26.5929L14.4037 28.7029L14.7207 28.8829C14.8587 28.9579 14.9517 29.0109 14.9847 29.0269C15.2917 29.1609 15.6227 29.2289 15.9577 29.2269C16.2647 29.2269 16.5677 29.1699 16.8547 29.0569L26.8627 23.2619C27.1449 23.0422 27.3755 22.7633 27.5384 22.4449C27.7013 22.1266 27.7926 21.7764 27.8057 21.4189V10.3359Z" fill="#96BEDC"/>
            </svg>
        );
    }

    if (netId === 'TRC20' || netId === 'TRON' || netId === 'TRX') {
        return (
            <svg viewBox="0 0 56 56" fill="none" width={size} height={size} className={className}>
                <circle cx="28" cy="28" r="28" fill="#FF0013"/>
                <path d="M40.7 19.3L14.2 14.5L25.6 43.2L44.2 23.6L40.7 19.3ZM38.6 21.1L40.9 23.8L30.2 25.8L38.6 21.1ZM27.9 24.8L18.4 17.6L36.5 20.8L27.9 24.8ZM27.2 26.8L17.5 19.4L25.4 38.6L27.2 26.8ZM29.1 27.7L40.2 25.7L27.2 39.3L29.1 27.7Z" fill="#FFFFFF"/>
            </svg>
        );
    }

    if (netId === 'POLYGON' || netId === 'MATIC' || netId === 'POS') {
        return (
            <svg viewBox="0 0 56 56" fill="none" width={size} height={size} className={className}>
                <circle cx="28" cy="28" r="28" fill="#8247E5"/>
                <path d="M36.8 22.4C36.1 22 35.2 22 34.5 22.4L29.2 25.5L25.6 27.5L20.3 30.6C19.6 31 18.7 31 18 30.6L13.9 28.2C13.2 27.8 12.8 27.1 12.8 26.2V21.5C12.8 20.7 13.2 19.9 13.9 19.5L18 17.1C18.7 16.7 19.6 16.7 20.3 17.1L24.4 19.5C25.1 19.9 25.5 20.7 25.5 21.5V24.6L29.1 22.5V19.4C29.1 18.6 28.7 17.8 28 17.4L20.4 13C19.7 12.6 18.8 12.6 18.1 13L10.3 17.5C9.6 17.9 9.2 18.7 9.2 19.5V28.4C9.2 29.2 9.6 30 10.3 30.4L18 34.8C18.7 35.2 19.6 35.2 20.3 34.8L25.6 31.8L29.2 29.7L34.5 26.7C35.2 26.3 36.1 26.3 36.8 26.7L40.9 29.1C41.6 29.5 42 30.2 42 31.1V35.8C42 36.6 41.6 37.4 40.9 37.8L36.8 40.2C36.1 40.6 35.2 40.6 34.5 40.2L30.4 37.8C29.7 37.4 29.3 36.6 29.3 35.8V32.7L25.7 34.8V37.9C25.7 38.7 26.1 39.5 26.8 39.9L34.5 44.3C35.2 44.7 36.1 44.7 36.8 44.3L44.5 39.9C45.2 39.5 45.6 38.7 45.6 37.9V28.9C45.6 28.1 45.2 27.3 44.5 26.9L36.8 22.4Z" fill="#FFFFFF"/>
            </svg>
        );
    }

    if (netId === 'ERC20' || netId === 'ETH' || netId === 'ETHEREUM') {
        return (
            <svg viewBox="0 0 56 56" fill="none" width={size} height={size} className={className}>
                <circle cx="28" cy="28" r="28" fill="#627EEA"/>
                <path d="M28 10L27.7 10.9V32.8L28 33.1L38.2 27.1L28 10Z" fill="#FFFFFF" fillOpacity="0.85"/>
                <path d="M28 10L17.8 27.1L28 33.1V22.4V10Z" fill="#FFFFFF"/>
                <path d="M28 35L27.8 35.2V43.1L28 43.6L38.2 29.1L28 35Z" fill="#FFFFFF" fillOpacity="0.85"/>
                <path d="M28 43.6V35L17.8 29.1L28 43.6Z" fill="#FFFFFF"/>
                <path d="M28 33.1L38.2 27.1L28 22.4V33.1Z" fill="#FFFFFF" fillOpacity="0.5"/>
                <path d="M17.8 27.1L28 33.1V22.4L17.8 27.1Z" fill="#FFFFFF" fillOpacity="0.75"/>
            </svg>
        );
    }

    if (netId === 'SOL' || netId === 'SOLANA') {
        return (
            <svg viewBox="0 0 56 56" fill="none" width={size} height={size} className={className}>
                <circle cx="28" cy="28" r="28" fill="#0B0E14"/>
                <defs>
                    <linearGradient id="solNetGrad" x1="14" y1="40" x2="42" y2="16" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#9945FF"/>
                        <stop offset="50%" stopColor="#14F195"/>
                        <stop offset="100%" stopColor="#00C2FF"/>
                    </linearGradient>
                </defs>
                <path d="M18.3 34.8C18.6 34.5 19 34.3 19.5 34.3H41.3C42.1 34.3 42.5 35.2 41.9 35.8L37.7 40C37.4 40.3 37 40.5 36.5 40.5H14.7C13.9 40.5 13.5 39.6 14.1 39L18.3 34.8ZM18.3 16C18.6 15.7 19 15.5 19.5 15.5H41.3C42.1 15.5 42.5 16.4 41.9 17L37.7 21.2C37.4 21.5 37 21.7 36.5 21.7H14.7C13.9 21.7 13.5 20.8 14.1 20.2L18.3 16ZM37.7 25.3C37.4 25 37 24.8 36.5 24.8H14.7C13.9 24.8 13.5 25.7 14.1 26.3L18.3 30.5C18.6 30.8 19 31 19.5 31H41.3C42.1 31 42.5 30.1 41.9 29.5L37.7 25.3Z" fill="url(#solNetGrad)"/>
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
    // 0. Persist cryptographic Telegram WebApp initData whenever available
    const rawInit = window.Telegram?.WebApp?.initData || WebApp?.initData || '';
    if (rawInit) {
      try {
        sessionStorage.setItem('tp_verified_init_data', rawInit);
        localStorage.setItem('tp_verified_init_data', rawInit);
      } catch (_) {}
    }

    // 1. Direct candidates from Telegram WebApp SDK
    const candidates = [
      window.Telegram?.WebApp?.initDataUnsafe?.user,
      WebApp?.initDataUnsafe?.user
    ];
    for (const c of candidates) {
      if (c && c.id && Number(c.id) !== GUEST_ID) {
        try {
          sessionStorage.setItem('tp_verified_tg_user', JSON.stringify(c));
          localStorage.setItem('tp_verified_tg_user', JSON.stringify(c));
          localStorage.setItem('tp_active_uid', String(c.id));
        } catch (_) {}
        return c;
      }
    }

    // 2. Parse raw Telegram WebApp initData string
    if (rawInit) {
      try {
        const initParams = new URLSearchParams(rawInit);
        const userJson = initParams.get('user');
        if (userJson) {
          const parsed = JSON.parse(userJson);
          if (parsed && parsed.id && Number(parsed.id) !== GUEST_ID) {
            sessionStorage.setItem('tp_verified_tg_user', JSON.stringify(parsed));
            localStorage.setItem('tp_verified_tg_user', JSON.stringify(parsed));
            localStorage.setItem('tp_active_uid', String(parsed.id));
            return parsed;
          }
        }
      } catch (_) {}
    }

    // 3. Parse URL hash / search params for signed tgWebAppData only (never trust raw unsigned ?user= parameter)
    const rawParams = [window.location.hash.slice(1), window.location.search.slice(1)];
    for (const raw of rawParams) {
      if (!raw) continue;
      try {
        const params = new URLSearchParams(raw);
        const tgData = params.get('tgWebAppData');
        if (tgData && tgData.includes('hash=')) {
          try {
            sessionStorage.setItem('tp_verified_init_data', tgData);
            localStorage.setItem('tp_verified_init_data', tgData);
          } catch (_) {}
          const innerParams = new URLSearchParams(tgData);
          const userJson = innerParams.get('user');
          if (userJson) {
            const parsed = JSON.parse(userJson);
            if (parsed && parsed.id && Number(parsed.id) !== GUEST_ID) {
              sessionStorage.setItem('tp_verified_tg_user', JSON.stringify(parsed));
              localStorage.setItem('tp_verified_tg_user', JSON.stringify(parsed));
              localStorage.setItem('tp_active_uid', String(parsed.id));
              return parsed;
            }
          }
        }
      } catch (_) {}
    }

    // 4. Check Telegram's internal sessionStorage __telegram__initParams
    try {
      const tgInit = sessionStorage.getItem('__telegram__initParams');
      if (tgInit) {
        const parsedInit = JSON.parse(tgInit);
        if (parsedInit?.tgWebAppData) {
          try {
            sessionStorage.setItem('tp_verified_init_data', parsedInit.tgWebAppData);
            localStorage.setItem('tp_verified_init_data', parsedInit.tgWebAppData);
          } catch (_) {}
          const innerParams = new URLSearchParams(parsedInit.tgWebAppData);
          const userJson = innerParams.get('user');
          if (userJson) {
            const parsed = JSON.parse(userJson);
            if (parsed && parsed.id && Number(parsed.id) !== GUEST_ID) {
              sessionStorage.setItem('tp_verified_tg_user', JSON.stringify(parsed));
              localStorage.setItem('tp_verified_tg_user', JSON.stringify(parsed));
              localStorage.setItem('tp_active_uid', String(parsed.id));
              return parsed;
            }
          }
        }
      }
    } catch (_) {}

    // 5. Fallback to previously verified Telegram user across WebView refreshes
    const cached = sessionStorage.getItem('tp_verified_tg_user') || localStorage.getItem('tp_verified_tg_user');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.id && Number(parsed.id) !== GUEST_ID) {
          return parsed;
        }
      } catch (_) {}
    }

    // 6. Fallback to active UID
    const activeUid = localStorage.getItem('tp_active_uid');
    if (activeUid && Number(activeUid) !== GUEST_ID && !isNaN(Number(activeUid))) {
      return { id: Number(activeUid), first_name: 'User', last_name: '', username: '' };
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
  const isRejected = status === 'rejected' || status === 'failed' || status === 'cancelled';
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
    const asset = tx.asset || 'USDT';
    const cAmt = tx.amount || 0;
    const tk = tx.estimatedTk || tx.creditedTk || 0;
    if (isCompleted) {
      variant = 'success';
      title = lang === 'bn' ? `${asset} সেল সফল` : `${asset} Sold Successfully`;
      body = lang === 'bn'
        ? `${cAmt} ${asset} বিক্রি সম্পন্ন হয়েছে এবং +৳${tk} আপনার একাউন্টে যোগ হয়েছে।`
        : `Successfully sold ${cAmt} ${asset}. +৳${tk} credited to your account.`;
      amount = `+৳${tk}`;
    } else if (isRejected) {
      variant = 'error';
      title = lang === 'bn' ? `${asset} সেল বাতিল` : `${asset} Sell Cancelled`;
      body = lang === 'bn'
        ? `${cAmt} ${asset} বিক্রি সম্পন্ন হয়নি বা ওয়ালেটে বাতিল করা হয়েছে।`
        : `${cAmt} ${asset} sell was cancelled or rejected.`;
      amount = `0 ${asset}`;
    } else {
      variant = 'warning';
      title = lang === 'bn' ? `${asset} সেল প্রক্রিয়া চলছে` : `${asset} Sell Processing`;
      body = lang === 'bn'
        ? `${cAmt} ${asset} ব্লকচেইনে যাচাই করা হচ্ছে...`
        : `Verifying ${cAmt} ${asset} sell...`;
      amount = `+৳${tk}`;
    }
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
  } else if (type === 'transfer_sent') {
    category = 'trade';
    variant = 'success';
    const amt = tx.amount || 0;
    title = lang === 'bn' ? 'মানি ট্রান্সফার সফল' : 'Money Transferred';
    body = lang === 'bn'
      ? `৳${amt} পাঠানো হয়েছে: ${tx.counterpartyName || 'User'} (${tx.counterpartyMbsId || ''})`
      : `Sent ৳${amt} to ${tx.counterpartyName || 'User'} (${tx.counterpartyMbsId || ''})`;
    amount = `-৳${amt}`;
  } else if (type === 'transfer_received') {
    category = 'deposit';
    variant = 'success';
    const amt = tx.amount || 0;
    title = lang === 'bn' ? 'মানি ট্রান্সফার রিসিভড' : 'Money Received';
    body = lang === 'bn'
      ? `+৳${amt} গ্রহণ করেছেন: ${tx.counterpartyName || 'User'} (${tx.counterpartyMbsId || ''})`
      : `Received +৳${amt} from ${tx.counterpartyName || 'User'} (${tx.counterpartyMbsId || ''})`;
    amount = `+৳${amt}`;
  } else {
    category = 'system';
    variant = 'info';
    title = tx.title || (lang === 'bn' ? 'সিস্টেম নোটিশ' : 'System Notice');
    body = tx.message || tx.subtitle || '';
    amount = tx.amount ? `৳${tx.amount}` : '';
  }

  return { id, type, status, isCompleted, isRejected, ts, title, body, amount, category, variant };
};

// ============================================================================
// TELEGRAM USER AVATAR BOX WITH LIVE PROXY & INITIAL FALLBACK
// ============================================================================
function UserAvatarBox({ userId, photoUrl, avatarDataUrl, name = 'U', sizeClass = 'w-13 h-13 rounded-2xl text-xl' }) {
  const [imgIndex, setImgIndex] = useState(0);
  const proxyUrl = (userId && Number(userId) !== 123456789) ? getUserAvatarUrl(userId) : '';
  const directDataUrl = avatarDataUrl || (photoUrl && String(photoUrl).startsWith('data:image/') ? photoUrl : '');
  const externalPhotoUrl = photoUrl && !String(photoUrl).startsWith('data:image/') && !String(photoUrl).startsWith('/api/miniapp/user-avatar')
    ? photoUrl
    : '';
  const candidates = Array.from(new Set([directDataUrl, proxyUrl, externalPhotoUrl].filter(Boolean)));
  const activeSrc = candidates[imgIndex] || '';
  const initial = (name || 'U').trim().charAt(0).toUpperCase() || 'U';

  useEffect(() => {
    setImgIndex(0);
  }, [userId, photoUrl, avatarDataUrl]);

  return (
    <div className={`${sizeClass} bg-gradient-to-tr from-purple-600 via-indigo-600 to-violet-500 text-white font-black flex items-center justify-center shadow-md shadow-purple-600/25 shrink-0 select-none overflow-hidden relative`}>
      {activeSrc ? (
        <img
          src={activeSrc}
          alt={name || 'User'}
          className="w-full h-full object-cover"
          onError={() => setImgIndex(prev => prev + 1)}
        />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
}

// Dedicated Skeleton Card for User Profiles (Real Skeleton Loading with pulsing placeholders)
function UserProfileSkeletonCard({ darkMode = false }) {
  return (
    <div className={`w-full p-3.5 rounded-2xl border flex items-center justify-between transition-all duration-200 shadow-2xs select-none ${
      darkMode 
        ? 'bg-slate-900/90 border-slate-800/80' 
        : 'bg-white border-slate-200/80'
    }`}>
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Avatar skeleton */}
        <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800 shrink-0 animate-pulse" />

        {/* Text lines skeleton */}
        <div className="min-w-0 flex-1 space-y-2 py-0.5">
          <div className="flex items-center gap-2">
            <div className="h-4 w-28 sm:w-36 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse" />
            <div className="h-3 w-16 bg-slate-200/70 dark:bg-slate-800/60 rounded-md animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4.5 w-16 bg-purple-200/60 dark:bg-purple-950/60 rounded-md animate-pulse" />
            <div className="h-3 w-20 bg-slate-200/70 dark:bg-slate-800/60 rounded-md animate-pulse" />
          </div>
        </div>
      </div>

      {/* Right chevron box skeleton */}
      <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800/80 shrink-0 ml-2 animate-pulse" />
    </div>
  );
}

// Preload multiple avatars AND Boss frame in parallel until downloaded BEFORE ending skeleton loading
const preloadUserAvatarsBatch = (users) => {
  if (!users || !users.length) return Promise.resolve();

  const promises = users.map(u => {
    return new Promise(resolve => {
      const isBoss = Boolean(u.isOwner || String(u.userId) === '8799135330' || u.mbsId === 'MT999999');
      const proxyUrl = (u.userId && Number(u.userId) !== 123456789) ? getUserAvatarUrl(u.userId) : '';
      const directUrl = (u.photoUrl && !String(u.photoUrl).startsWith('/api/miniapp/user-avatar')) ? u.photoUrl : '';
      const src = directUrl || proxyUrl;

      let pending = src ? 1 : 0;
      if (isBoss) pending++;

      if (pending === 0) return resolve();

      const doneOne = () => {
        pending--;
        if (pending <= 0) resolve();
      };

      if (src) {
        const img = new Image();
        img.onload = doneOne;
        img.onerror = doneOne;
        img.src = src;
        if (img.complete && img.naturalWidth > 0) doneOne();
      }

      if (isBoss) {
        const frameImg = new Image();
        frameImg.onload = doneOne;
        frameImg.onerror = doneOne;
        frameImg.src = marufFrameImg;
        if (frameImg.complete && frameImg.naturalWidth > 0) doneOne();
      }

      setTimeout(resolve, 8000); // 8s safety timeout so UI never freezes indefinitely
    });
  });

  return Promise.all(promises);
};

// Strict Top-to-Bottom Ordered Recipient Card with Royal Golden Card for Boss
function UserRecipientCard({ u, index = 0, onSelect, darkMode = false, lang = 'bn' }) {
  const isBoss = Boolean(u.isOwner || u.userId === '8799135330' || u.mbsId === 'MT999999');
  // Strict serial top-to-bottom delay: 0ms, 45ms, 90ms, 135ms, 180ms
  const staggerDelay = (index % 5) * 45;

  return (
    <div
      style={{
        animation: `slideDownIn 260ms cubic-bezier(0.16, 1, 0.3, 1) ${staggerDelay}ms both`
      }}
    >
      <button
        type="button"
        onClick={() => onSelect(u)}
        className={`w-full rounded-2xl border flex items-center justify-between transition-all duration-200 active:scale-[0.98] cursor-pointer text-left group relative ${
          isBoss
            ? (darkMode
                ? 'py-3.5 px-3.5 bg-gradient-to-r from-amber-950/40 via-amber-900/30 to-amber-950/40 border-2 border-amber-400/80 shadow-[0_4px_20px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/40 hover:border-amber-300'
                : 'py-3.5 px-3.5 bg-gradient-to-r from-amber-50 via-yellow-50/70 to-amber-50 border-2 border-amber-400/90 shadow-[0_4px_20px_rgba(245,158,11,0.2)] ring-1 ring-amber-400/30 hover:border-amber-500')
            : (darkMode 
                ? 'p-3.5 bg-slate-900/90 border-slate-800 hover:border-purple-600/60 shadow-2xs overflow-hidden' 
                : 'p-3.5 bg-white border-slate-200/80 hover:border-purple-300 hover:shadow-xs overflow-hidden')
        }`}
      >
        {/* Subtle Golden Ambient Shimmer for Boss VIP Card */}
        {isBoss && (
          <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none z-1">
            <div className="w-full h-full bg-gradient-to-r from-transparent via-amber-300/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          </div>
        )}

        <div className="flex items-center gap-2.5 min-w-0 relative z-10 flex-1">
          <div className="relative shrink-0 flex items-center justify-center">
            {/* Boss Royal Winged Crown Avatar Frame */}
            {isBoss ? (
              <div className="relative flex items-center justify-center w-11 h-11 ml-1 my-0.5">
                <UserAvatarBox
                  userId={u.userId}
                  photoUrl={u.photoUrl}
                  name={u.name}
                  sizeClass="w-11 h-11 rounded-full text-base shadow-xs overflow-hidden"
                />
                <img
                  src={marufFrameImg}
                  alt="Royal Crown Frame"
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[68px] h-[68px] max-w-none pointer-events-none z-20 drop-shadow-[0_2px_8px_rgba(245,158,11,0.55)]"
                />
              </div>
            ) : (
              <UserAvatarBox
                userId={u.userId}
                photoUrl={u.photoUrl}
                name={u.name}
                sizeClass="w-12 h-12 rounded-2xl text-base shadow-xs"
              />
            )}

            {isBoss ? (
              <span className="absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-500 border-2 border-white dark:border-slate-950 flex items-center justify-center text-[9px] text-slate-950 font-black shadow-xs z-30">
                ✓
              </span>
            ) : u.isVerified ? (
              <span className="absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[9px] text-white font-bold shadow-2xs">
                ✓
              </span>
            ) : null}
          </div>

          {/* Left: Name & TrustPay ID */}
          <div className="min-w-0 flex-1 leading-tight flex items-center">
            {isBoss ? (
              <div className="flex items-center min-w-0 pl-3.5">
                <h4 className="font-black text-base sm:text-[17px] text-amber-950 dark:text-amber-200 shrink-0 whitespace-nowrap tracking-tight">
                  {u.name}
                </h4>
              </div>
            ) : (
              <div>
                <h4 className="font-black text-sm text-slate-900 dark:text-white truncate">
                  {u.name}
                </h4>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-md border shadow-2xs text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20">
                    {u.mbsId}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Middle: Role Title (USER for all users / FOUNDER for Boss) + Action Chevron */}
        <div className={`flex items-center gap-2 shrink-0 relative z-10 ${
          isBoss ? 'pl-4 sm:pl-5 text-amber-500 dark:text-amber-300' : 'pl-1.5 text-purple-600 dark:text-purple-400'
        }`}>
          {isBoss ? (
            <span className="text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 px-2.5 py-0.5 rounded-full shadow-2xs flex items-center gap-0.5 shrink-0 ml-1">
              👑 FOUNDER
            </span>
          ) : (
            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              USER
            </span>
          )}

          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs shrink-0 ${
            isBoss
              ? 'bg-gradient-to-tr from-amber-400 to-yellow-500 text-slate-950 border border-amber-300/80 shadow-[0_0_10px_rgba(245,158,11,0.35)]'
              : 'bg-purple-50 dark:bg-purple-950/60 border border-purple-200/60 dark:border-purple-800/60'
          }`}>
            <ChevronRight size={14} strokeWidth={isBoss ? 3 : 2.5} />
          </div>
        </div>
      </button>
    </div>
  );
}

// ============================================================================
// CUSTOM BOT NUMBER KEYPAD & 2-STEP PIN INPUT SYSTEM
// ============================================================================
function BotNumberKeypad({ pin = '', maxLength = 4, onChangePin, disabled = false, darkMode = false, lang = 'bn' }) {
  const handlePressDigit = (digit) => {
    if (disabled) return;
    if (pin.length >= maxLength) return;
    try {
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
      }
    } catch (_) {}
    onChangePin(pin + String(digit));
  };

  const handleBackspace = () => {
    if (disabled || !pin.length) return;
    try {
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.selectionChanged();
      }
    } catch (_) {}
    onChangePin(pin.slice(0, -1));
  };

  const handleClear = () => {
    if (disabled || !pin.length) return;
    try {
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.selectionChanged();
      }
    } catch (_) {}
    onChangePin('');
  };

  const slots = Array.from({ length: maxLength });

  return (
    <div className="space-y-3.5 select-none">
      {/* PIN Visual Dots / Digit Boxes */}
      <div className="flex items-center justify-center gap-2 sm:gap-2.5 py-1">
        {slots.map((_, idx) => {
          const isFilled = idx < pin.length;
          const isCurrent = idx === pin.length;
          return (
            <div
              key={idx}
              className={`h-12 ${maxLength === 6 ? 'w-10 sm:w-11' : 'w-12 sm:w-13'} rounded-2xl border-2 flex items-center justify-center font-mono font-black text-lg transition-all duration-150 ${
                isFilled
                  ? 'border-purple-600 bg-purple-500/15 text-purple-600 dark:text-purple-300 shadow-xs scale-[1.02]'
                  : isCurrent
                  ? 'border-indigo-500 bg-white dark:bg-slate-800 ring-3 ring-indigo-500/15'
                  : darkMode
                  ? 'border-slate-700 bg-slate-800/60 text-slate-500'
                  : 'border-slate-200 bg-slate-50 text-slate-400'
              }`}
            >
              {isFilled ? (
                <span className="w-3 h-3 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 animate-in zoom-in-75 duration-150 block" />
              ) : isCurrent ? (
                <span className="w-0.5 h-5 bg-indigo-500 animate-pulse rounded-full block" />
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Custom In-App Bot Number Keypad */}
      <div className={`p-2.5 rounded-3xl border grid grid-cols-3 gap-2 ${
        darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-100/80 border-slate-200/80'
      }`}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            type="button"
            disabled={disabled}
            onClick={() => handlePressDigit(num)}
            className={`h-12 rounded-2xl font-mono font-black text-lg flex items-center justify-center border transition-all active:scale-95 cursor-pointer shadow-2xs ${
              darkMode
                ? 'bg-slate-900 border-slate-800 text-white hover:bg-slate-800 active:bg-purple-950/60'
                : 'bg-white border-slate-200/90 text-slate-900 hover:bg-indigo-50/50 active:bg-indigo-100'
            }`}
          >
            {num}
          </button>
        ))}

        {/* Clear Button */}
        <button
          type="button"
          disabled={disabled || !pin.length}
          onClick={handleClear}
          className={`h-12 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center border transition-all active:scale-95 cursor-pointer ${
            darkMode
              ? 'bg-rose-950/30 border-rose-900/40 text-rose-400 hover:bg-rose-950/50 disabled:opacity-40'
              : 'bg-rose-50 border-rose-200/70 text-rose-600 hover:bg-rose-100 disabled:opacity-40'
          }`}
        >
          {lang === 'bn' ? 'মুছুন' : 'CLR'}
        </button>

        {/* Digit 0 */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => handlePressDigit(0)}
          className={`h-12 rounded-2xl font-mono font-black text-lg flex items-center justify-center border transition-all active:scale-95 cursor-pointer shadow-2xs ${
            darkMode
              ? 'bg-slate-900 border-slate-800 text-white hover:bg-slate-800 active:bg-purple-950/60'
              : 'bg-white border-slate-200/90 text-slate-900 hover:bg-indigo-50/50 active:bg-indigo-100'
          }`}
        >
          0
        </button>

        {/* Backspace Button */}
        <button
          type="button"
          disabled={disabled || !pin.length}
          onClick={handleBackspace}
          className={`h-12 rounded-2xl font-black text-sm flex items-center justify-center border transition-all active:scale-95 cursor-pointer ${
            darkMode
              ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-40'
              : 'bg-slate-200/80 border-slate-300/80 text-slate-700 hover:bg-slate-300/80 disabled:opacity-40'
          }`}
        >
          <Delete size={18} />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// REUSABLE 2-STEP PIN VERIFICATION MODAL (FOR BUY, WITHDRAW & TRANSFER)
// ============================================================================
function TwoStepPinModal({
  isOpen,
  onClose,
  onConfirmPin,
  pinLength = 4,
  isSubmitting = false,
  errorText = '',
  titleBn = '২-স্টেপ পিন ভেরিফিকেশন',
  titleEn = '2-Step PIN Verification',
  subtitleBn = 'লেনদেনটি সম্পন্ন করতে আপনার গোপন পিন কোড দিন',
  subtitleEn = 'Enter your security PIN to authorize this transaction',
  darkMode = false,
  lang = 'bn'
}) {
  const [pin, setPin] = useState('');
  const activeLen = Number(pinLength) === 6 ? 6 : 4;

  useEffect(() => {
    if (isOpen) {
      setPin('');
    }
  }, [isOpen, pinLength]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`relative w-full max-w-[355px] p-5 rounded-3xl shadow-2xl border transition-all animate-in zoom-in-95 duration-200 overflow-hidden ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200/90 text-slate-900'
      }`}>
        {/* Subtle floral art in modal corner */}
        <div className="absolute -right-3 -top-3 w-28 h-28 pointer-events-none select-none opacity-35 overflow-hidden">
          <img src={sakuraBranchArt} alt="" className="w-full h-auto object-contain" />
        </div>

        {/* Header */}
        <div className="relative z-10 flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-500/25 shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="text-[15px] font-black leading-tight text-slate-900 dark:text-white">
                {lang === 'bn' ? titleBn : titleEn}
              </h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5 leading-snug">
                {lang === 'bn' ? subtitleBn : subtitleEn}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center active:scale-90 transition-all cursor-pointer shrink-0"
          >
            <X size={15} strokeWidth={2.5} />
          </button>
        </div>

        {/* Bot Number Keypad — automatically renders 4 or 6 boxes matching user's configured PIN */}
        <div className="relative z-10">
          <BotNumberKeypad
            pin={pin}
            maxLength={activeLen}
            onChangePin={setPin}
            disabled={isSubmitting}
            darkMode={darkMode}
            lang={lang}
          />
        </div>

        {errorText && (
          <div className="mt-3 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-center gap-2 text-[11px] font-bold text-rose-600 dark:text-rose-300">
            <AlertCircle size={14} className="shrink-0" />
            <span>{errorText}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="button"
          disabled={isSubmitting || pin.length !== activeLen}
          onClick={() => onConfirmPin(pin)}
          className="mt-3.5 w-full h-[48px] rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 text-white font-black text-sm shadow-[0_4px_14px_rgba(124,58,237,0.35)] hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={17} className="animate-spin" />
              <span>{lang === 'bn' ? 'যাচাই করা হচ্ছে...' : 'Verifying...'}</span>
            </>
          ) : (
            <>
              <ShieldCheck size={17} />
              <span>{lang === 'bn' ? 'পিন কনফার্ম করুন' : 'Confirm PIN'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// DEDICATED 2-STEP SECURITY SETTINGS PAGE (OPENED FROM PROFILE)
// ============================================================================
function TwoStepPage({
  user,
  twoStepEnabled = false,
  twoStepLength = 4,
  onUpdateTwoStepState,
  onBack,
  darkMode = false,
  lang = 'bn'
}) {
  const [toggleOn, setToggleOn] = useState(Boolean(twoStepEnabled));
  const [pinLength, setPinLength] = useState(Number(twoStepLength) === 6 ? 6 : 4);
  const [pin, setPin] = useState('');
  const [currentPinForDisable, setCurrentPinForDisable] = useState('');
  const [mode, setMode] = useState(twoStepEnabled ? 'IdleEnabled' : 'IdleDisabled'); // 'IdleDisabled' | 'SettingPin' | 'IdleEnabled' | 'DisablingPin'
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    setToggleOn(Boolean(twoStepEnabled));
    setPinLength(Number(twoStepLength) === 6 ? 6 : 4);
    setMode(twoStepEnabled ? 'IdleEnabled' : 'IdleDisabled');
    setPin('');
    setCurrentPinForDisable('');
  }, [twoStepEnabled, twoStepLength]);

  // Keep toggle visually ON whenever 2-Step is currently enabled (even while entering PIN to turn it off!)
  const isSwitchVisuallyOn = twoStepEnabled ? true : toggleOn;
  const activeSavedLen = Number(twoStepLength) === 6 ? 6 : 4;

  const handleToggleClick = () => {
    playAppSound('confirm');
    setFeedback(null);
    if (!twoStepEnabled) {
      // Currently OFF -> user wants to turn ON
      if (mode === 'SettingPin') {
        setToggleOn(false);
        setMode('IdleDisabled');
        setPin('');
      } else {
        setToggleOn(true);
        setMode('SettingPin');
        setPin('');
      }
    } else {
      // Currently ON -> user wants to turn OFF (MUST verify current PIN first; switch stays ON until verified)
      if (mode === 'DisablingPin') {
        setToggleOn(true);
        setMode('IdleEnabled');
        setCurrentPinForDisable('');
      } else {
        setToggleOn(true);
        setMode('DisablingPin');
        setCurrentPinForDisable('');
      }
    }
  };

  const handleSavePin = async () => {
    if (pin.length !== pinLength) return;
    setLoading(true);
    setFeedback(null);
    try {
      const res = await setupTwoStepPin({
        userId: user?.id || 123456789,
        action: 'enable',
        pin,
        pinLength
      });
      if (res?.success) {
        playAppSound('success');
        if (onUpdateTwoStepState) onUpdateTwoStepState(true, pinLength);
        setToggleOn(true);
        setMode('IdleEnabled');
        setPin('');
        setFeedback({
          type: 'success',
          text: lang === 'bn'
            ? `✅ আপনার ${pinLength} ডিজিটের ২-স্টেপ সিকিউরিটি পাসওয়ার্ড সফলভাবে চালু হয়েছে!`
            : `✅ Your ${pinLength}-digit 2-Step Security PIN is now active!`
        });
      }
    } catch (e) {
      playAppSound('error');
      setFeedback({
        type: 'error',
        text: e.message || (lang === 'bn' ? 'পিন সেট করতে সমস্যা হয়েছে' : 'Failed to set PIN')
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisablePin = async () => {
    if (currentPinForDisable.length !== activeSavedLen) return;
    setLoading(true);
    setFeedback(null);
    try {
      const res = await setupTwoStepPin({
        userId: user?.id || 123456789,
        action: 'disable',
        currentPin: currentPinForDisable
      });
      if (res?.success) {
        playAppSound('success');
        setToggleOn(false);
        if (onUpdateTwoStepState) onUpdateTwoStepState(false, 4);
        setMode('IdleDisabled');
        setCurrentPinForDisable('');
        setFeedback({
          type: 'success',
          text: lang === 'bn'
            ? '২-স্টেপ ভেরিফিকেশন সফলভাবে বন্ধ করা হয়েছে।'
            : '2-Step verification has been turned off.'
        });
      }
    } catch (e) {
      playAppSound('error');
      setFeedback({
        type: 'error',
        text: e.message || (lang === 'bn' ? 'ভুল পিন কোড দিয়েছেন! সঠিক পিন ছাড়া ২-স্টেপ বন্ধ করা যাবে না।' : 'Incorrect PIN! Cannot turn off 2-Step without the same PIN.')
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 max-w-md mx-auto pb-28 relative">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-xs border border-slate-200 dark:border-slate-800 active:scale-95 transition-transform text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            <ChevronRight size={18} className="rotate-180" strokeWidth={2.5} />
          </button>
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white leading-tight">
              {lang === 'bn' ? '২-স্টেপ ভেরিফিকেশন' : '2-Step Verification'}
            </h2>
            <p className="text-[11px] text-slate-400 font-medium">
              {lang === 'bn' ? 'অ্যাকাউন্ট ও ব্যালেন্সের সর্বোচ্চ নিরাপত্তা' : 'Maximum account & balance protection'}
            </p>
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
          twoStepEnabled
            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
            : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
        }`}>
          {twoStepEnabled ? (lang === 'bn' ? '✓ চালু আছে' : '✓ ACTIVE') : (lang === 'bn' ? 'বন্ধ আছে' : 'OFF')}
        </span>
      </div>

      {/* Top Explanation & Details Banner with Flower Art */}
      <div className={`p-4 rounded-3xl border shadow-xs relative overflow-hidden ${
        darkMode ? 'bg-slate-900/95 border-slate-800 text-white' : 'bg-white border-slate-200/90 text-slate-900'
      }`}>
        <div className="absolute -right-2 -top-2 w-28 h-28 pointer-events-none select-none opacity-45 overflow-hidden">
          <img src={roseBotanicalArt} alt="" className="w-full h-auto object-contain" />
        </div>

        <div className="relative z-10 space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-[10px] font-black uppercase tracking-wider">
            <ShieldCheck size={12} />
            <span>{lang === 'bn' ? '২-স্টেপের কাজ কী?' : 'How 2-Step Protects You'}</span>
          </div>

          <h3 className="text-sm font-black leading-snug text-slate-900 dark:text-white">
            {lang === 'bn'
              ? 'আপনার গোপন পিন ছাড়া কেউ টাকা তুলতে বা ট্রান্সফার করতে পারবে না!'
              : 'Nobody can withdraw, buy crypto, or transfer money without your secret PIN!'}
          </h3>

          <div className="space-y-1.5 text-[11.5px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
              <span>{lang === 'bn' ? '১. ক্রিপ্টো বাই (Crypto Buy) করার সময় পিন লাগবে।' : '1. Required when buying crypto (GRAM / USDT).'}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
              <span>{lang === 'bn' ? '২. টাকা উত্তোলন (Withdraw Funds) করার সময় পিন লাগবে।' : '2. Required when withdrawing funds to bKash/Nagad.'}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
              <span>{lang === 'bn' ? '৩. অন্য আইডিতে টাকা ট্রান্সফার (Transfer Money) করতে পিন লাগবে।' : '3. Required for Transfer Money to another user.'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Toggle Switch Card */}
      <div className={`p-4 rounded-3xl border shadow-xs transition-all ${
        darkMode ? 'bg-slate-900/95 border-slate-800 text-white' : 'bg-white border-slate-200/90 text-slate-900'
      }`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border shrink-0 ${
              isSwitchVisuallyOn
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-500'
                : 'bg-purple-500/15 border-purple-500/30 text-purple-600 dark:text-purple-400'
            }`}>
              <Shield size={21} />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                {lang === 'bn' ? '২-স্টেপ পাসওয়ার্ড টগল' : 'Enable 2-Step Password'}
              </h4>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                {twoStepEnabled
                  ? (mode === 'DisablingPin'
                      ? (lang === 'bn' ? `বন্ধ করতে নিচে আপনার ${activeSavedLen} ডিজিট পিন দিন` : `Enter your ${activeSavedLen}-digit PIN below to turn off`)
                      : (lang === 'bn' ? `সিকিউরিটি পাসওয়ার্ড সক্রিয় (${activeSavedLen} ডিজিট)` : `Security PIN active (${activeSavedLen} digits)`))
                  : (lang === 'bn' ? 'টগলটি অন করে ৪ বা ৬ ডিজিট পিন দিন' : 'Turn on toggle to set a 4 or 6 digit PIN')}
              </p>
            </div>
          </div>

          {/* Smooth Toggle Switch — stays ON while twoStepEnabled is true until PIN verification completes */}
          <button
            type="button"
            onClick={handleToggleClick}
            className={`w-14 h-8 rounded-full p-1 transition-all duration-300 cursor-pointer flex items-center shrink-0 ${
              isSwitchVisuallyOn
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 justify-end shadow-[0_0_14px_rgba(16,185,129,0.4)]'
                : 'bg-slate-300 dark:bg-slate-700 justify-start'
            }`}
          >
            <div className="w-6 h-6 rounded-full bg-white shadow-md transition-transform" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className={`mt-3 p-3 rounded-2xl border flex items-center gap-2 text-xs font-bold animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300'
          }`}>
            {feedback.type === 'success' ? <CheckCircle2 size={16} className="shrink-0" /> : <AlertCircle size={16} className="shrink-0" />}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* EXPANDABLE PIN SETUP BOX & BOT NUMBER KEYPAD BELOW TOGGLE */}
        {mode === 'SettingPin' && (
          <div className="mt-4 pt-4 border-t border-slate-200/80 dark:border-slate-800 space-y-3.5 animate-in slide-in-from-top-3 duration-200">
            <div className="text-center">
              <p className="text-xs font-black text-purple-600 dark:text-purple-400">
                {lang === 'bn'
                  ? 'পাসওয়ার্ডের ধরন নির্বাচন করুন (4 Digit অথবা 6 Digit)'
                  : 'Select Password Length (4 Digit or 6 Digit)'}
              </p>
            </div>

            {/* 4 Digit & 6 Digit Tabs right above the input box */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl gap-1.5 border border-slate-200/80 dark:border-slate-700">
              <button
                type="button"
                onClick={() => {
                  setPinLength(4);
                  setPin('');
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  pinLength === 4
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-white/50'
                }`}
              >
                4 Digit (৪ সংখ্যা)
              </button>
              <button
                type="button"
                onClick={() => {
                  setPinLength(6);
                  setPin('');
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  pinLength === 6
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-white/50'
                }`}
              >
                6 Digit (৬ সংখ্যা)
              </button>
            </div>

            {/* Custom Bot Number Keypad */}
            <BotNumberKeypad
              pin={pin}
              maxLength={pinLength}
              onChangePin={setPin}
              disabled={loading}
              darkMode={darkMode}
              lang={lang}
            />

            <button
              type="button"
              disabled={loading || pin.length !== pinLength}
              onClick={handleSavePin}
              className="w-full h-[50px] rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 text-white font-black text-sm shadow-[0_4px_16px_rgba(124,58,237,0.35)] hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>{lang === 'bn' ? 'সেভ হচ্ছে...' : 'Saving...'}</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  <span>{lang === 'bn' ? `${pinLength} ডিজিট পিন সেভ করুন` : `Save ${pinLength}-Digit PIN`}</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* DISABLING PIN VERIFICATION — REQUIRES EXACT SAME PIN TO TURN OFF */}
        {mode === 'DisablingPin' && (
          <div className="mt-4 pt-4 border-t border-slate-200/80 dark:border-slate-800 space-y-3.5 animate-in slide-in-from-top-3 duration-200">
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-center space-y-0.5">
              <p className="text-xs font-black text-rose-600 dark:text-rose-400">
                {lang === 'bn'
                  ? `🔒 ২-স্টেপ বন্ধ করতে আপনার বর্তমান ${activeSavedLen} ডিজিট পিন দিন`
                  : `🔒 Enter your current ${activeSavedLen}-digit PIN to turn off 2-Step`}
              </p>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium">
                {lang === 'bn'
                  ? 'যে পিন দিয়ে ২-স্টেপ অন করেছিলেন, ঠিক সেই পিনটি না দিলে এটি অফ হবে না'
                  : 'You must enter the exact same PIN you used to enable 2-Step'}
              </p>
            </div>

            <BotNumberKeypad
              pin={currentPinForDisable}
              maxLength={activeSavedLen}
              onChangePin={setCurrentPinForDisable}
              disabled={loading}
              darkMode={darkMode}
              lang={lang}
            />

            <div className="flex gap-2.5">
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setMode('IdleEnabled');
                  setCurrentPinForDisable('');
                  setFeedback(null);
                }}
                className={`flex-1 h-[48px] rounded-2xl font-black text-xs border transition-all active:scale-95 cursor-pointer ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                {lang === 'bn' ? 'বাতিল করুন' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={loading || currentPinForDisable.length !== activeSavedLen}
                onClick={handleDisablePin}
                className="flex-[1.5] h-[48px] rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 text-white font-black text-xs shadow-md hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 size={17} className="animate-spin" /> : <Shield size={17} />}
                <span>{lang === 'bn' ? '২-স্টেপ বন্ধ নিশ্চিত করুন' : 'Confirm Turn Off'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// DEDICATED CUSTOMER SUPPORT PAGE (OPENED FROM PROFILE)
// ============================================================================
function SupportPage({
  user,
  onBack,
  darkMode = false,
  lang = 'bn'
}) {
  const [supportCategory, setSupportCategory] = useState(null);
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMsg, setSupportMsg] = useState('');
  const [supportImagePreview, setSupportImagePreview] = useState(null);
  const [isCompressingImage, setIsCompressingImage] = useState(false);
  const [isSendingSupport, setIsSendingSupport] = useState(false);
  const [supportFeedback, setSupportFeedback] = useState(null);

  const SUPPORT_CATEGORIES = [
    {
      id: 'Account',
      titleBn: 'অ্যাকাউন্ট',
      titleEn: 'Account',
      subjectBn: 'অ্যাকাউন্ট সংক্রান্ত সমস্যা',
      subjectEn: 'Account Support Request',
      iconBg: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/25',
      IconComp: User
    },
    {
      id: 'Buy',
      titleBn: 'ক্রিপ্টো বাই',
      titleEn: 'Buy',
      subjectBn: 'ক্রিপ্টো বাই সংক্রান্ত সমস্যা',
      subjectEn: 'Buy Crypto Support Request',
      iconBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
      IconComp: Coins
    },
    {
      id: 'Sell',
      titleBn: 'ক্রিপ্টো সেল',
      titleEn: 'Sell',
      subjectBn: 'ক্রিপ্টো সেল সংক্রান্ত সমস্যা',
      subjectEn: 'Sell Crypto Support Request',
      iconBg: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/25',
      IconComp: ArrowRightLeft
    },
    {
      id: 'Add Money',
      titleBn: 'অ্যাড মানি',
      titleEn: 'Add Money',
      subjectBn: 'অ্যাড মানি ও TrxID সংক্রান্ত সমস্যা',
      subjectEn: 'Add Money / Deposit Support Request',
      iconBg: 'bg-pink-500/15 text-pink-600 dark:text-pink-400 border-pink-500/25',
      IconComp: PlusCircle
    },
    {
      id: 'Withdraw',
      titleBn: 'উইথড্র',
      titleEn: 'Withdraw',
      subjectBn: 'উইথড্র সংক্রান্ত সমস্যা',
      subjectEn: 'Withdrawal Support Request',
      iconBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25',
      IconComp: Wallet
    },
    {
      id: 'Others',
      titleBn: 'অন্যান্য',
      titleEn: 'Others',
      subjectBn: 'অন্যান্য বিষয় সংক্রান্ত সহায়তা',
      subjectEn: 'General / Other Support Request',
      iconBg: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/25',
      IconComp: HelpCircle
    }
  ];

  const handleSelectSupportCategory = (cat) => {
    playAppSound('confirm');
    setSupportCategory(cat);
    setSupportSubject(lang === 'bn' ? cat.subjectBn : cat.subjectEn);
    setSupportFeedback(null);
  };

  const handleSupportImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      playAppSound('error');
      return;
    }
    setIsCompressingImage(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const MAX_DIM = 1000;
          let w = img.width;
          let h = img.height;
          if (w > h && w > MAX_DIM) {
            h = Math.round((h * MAX_DIM) / w);
            w = MAX_DIM;
          } else if (h > MAX_DIM) {
            w = Math.round((w * MAX_DIM) / h);
            h = MAX_DIM;
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
          setSupportImagePreview(compressedDataUrl);
        } catch (_) {
          setSupportImagePreview(event.target.result);
        } finally {
          setIsCompressingImage(false);
        }
      };
      img.onerror = () => setIsCompressingImage(false);
      img.src = event.target.result;
    };
    reader.onerror = () => setIsCompressingImage(false);
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 max-w-md mx-auto pb-28 relative">
      {/* Dedicated Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (supportCategory && !supportFeedback) {
                setSupportCategory(null);
              } else {
                onBack();
              }
            }}
            className="w-9 h-9 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-xs border border-slate-200 dark:border-slate-800 active:scale-95 transition-transform text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            <ChevronRight size={18} className="rotate-180" strokeWidth={2.5} />
          </button>
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white leading-tight">
              {lang === 'bn' ? 'কাস্টমার সাপোর্ট সেন্টার' : 'Customer Support Center'}
            </h2>
            <p className="text-[11px] text-slate-400 font-medium">
              {supportCategory
                ? (lang === 'bn' ? 'সমস্যার বিস্তারিত লিখে সাবমিট করুন' : 'Fill out details & submit')
                : (lang === 'bn' ? 'যে বিষয়ে সহায়তা প্রয়োজন তা নির্বাচন করুন' : 'Select the topic you need help with')}
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25">
          {lang === 'bn' ? '২৪/৭ লাইভ' : '24/7 LIVE'}
        </span>
      </div>

      {/* Main Support Content Card */}
      <div className={`p-4 rounded-3xl border shadow-xs relative overflow-hidden ${
        darkMode ? 'bg-slate-900/95 border-slate-800 text-white' : 'bg-white border-slate-200/90 text-slate-900'
      }`}>
        <div className="absolute -right-3 -top-3 w-28 h-28 pointer-events-none select-none opacity-35 overflow-hidden">
          <img src={roseBotanicalArt} alt="" className="w-full h-auto object-contain" />
        </div>

        {/* STATE A: FEEDBACK AFTER SUBMISSION */}
        {supportFeedback ? (
          <div className="py-5 text-center space-y-3.5 animate-in zoom-in-95 duration-200 relative z-10">
            {supportFeedback.success ? (
              <LuxurySuccessEmblem size={76} />
            ) : (
              <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center border bg-rose-500/15 text-rose-500 border-rose-500/30">
                <AlertCircle size={30} />
              </div>
            )}
            <div>
              <h4 className="text-base font-black text-slate-900 dark:text-white">
                {supportFeedback.success
                  ? (lang === 'bn' ? 'সাপোর্ট রিকোয়েস্ট পাঠানো হয়েছে!' : 'Support Ticket Sent!')
                  : (lang === 'bn' ? 'পাঠাতে ব্যর্থ হয়েছে' : 'Submission Failed')}
              </h4>
              {supportFeedback.ticketId && (
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/25 text-[10.5px] font-mono font-bold">
                  Ticket ID: #{supportFeedback.ticketId.slice(0, 8).toUpperCase()}
                </span>
              )}
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                {supportFeedback.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSupportCategory(null);
                setSupportFeedback(null);
                onBack();
              }}
              className="w-full mt-2 h-[46px] bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 text-white font-black rounded-2xl text-xs shadow-md active:scale-95 transition-all cursor-pointer"
            >
              {lang === 'bn' ? 'ঠিক আছে' : 'Done'}
            </button>
          </div>

        /* STATE B: STEP 1 — COMPACT CATEGORY SELECTION (NO SUB-DESCRIPTIONS) */
        ) : !supportCategory ? (
          <div className="space-y-3 relative z-10 animate-in fade-in duration-200">
            <div className={`p-2.5 rounded-2xl border text-[11.5px] font-bold leading-snug ${
              darkMode ? 'bg-indigo-950/35 border-indigo-800/50 text-indigo-200' : 'bg-indigo-50/80 border-indigo-100 text-indigo-900'
            }`}>
              {lang === 'bn'
                ? '👇 কোন বিষয়ে আপনার সাহায্য প্রয়োজন সিলেক্ট করুন:'
                : '👇 Select the category you need help with:'}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {SUPPORT_CATEGORIES.map((cat) => {
                const IconC = cat.IconComp;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleSelectSupportCategory(cat)}
                    className={`px-3 py-3 rounded-2xl border text-left transition-all active:scale-95 cursor-pointer flex items-center gap-2.5 group ${
                      darkMode
                        ? 'bg-slate-800/75 hover:bg-slate-800 border-slate-700/80 hover:border-purple-500/50'
                        : 'bg-slate-50/90 hover:bg-purple-50/60 border-slate-200/90 hover:border-purple-300'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${cat.iconBg}`}>
                      <IconC size={16} />
                    </div>
                    <span className="font-extrabold text-[12.5px] text-slate-900 dark:text-white leading-tight whitespace-nowrap">
                      {lang === 'bn' ? cat.titleBn : cat.titleEn}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

        /* STATE C: STEP 2 — AUTO-FILLED SUBJECT + DETAILS + HIGH-CONTRAST IMAGE PREVIEW + SUBMIT */
        ) : (
          <div className="space-y-3.5 relative z-10 animate-in slide-in-from-right-4 duration-200">
            {/* Auto-Filled Subject Box */}
            <div className={`p-3 rounded-2xl border ${
              darkMode ? 'bg-slate-800/80 border-purple-500/35' : 'bg-purple-50/70 border-purple-200'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  {lang === 'bn' ? 'বিষয়' : 'Subject'}
                </span>
                <button
                  type="button"
                  onClick={() => setSupportCategory(null)}
                  className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  {lang === 'bn' ? 'বিষয় পরিবর্তন' : 'Change Topic'}
                </button>
              </div>
              <div className="text-xs font-black text-slate-900 dark:text-white leading-snug">
                {supportSubject}
              </div>
            </div>

            {/* Details Input */}
            <div>
              <label className="block text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                {lang === 'bn' ? 'সমস্যার বিস্তারিত বিবরণ *' : 'Issue Details *'}
              </label>
              <textarea
                rows={4}
                value={supportMsg}
                onChange={(e) => setSupportMsg(e.target.value)}
                placeholder={
                  lang === 'bn'
                    ? 'আপনার সমস্যার বিস্তারিত এখানে লিখুন (যেমন: TrxID, টাকার পরিমাণ বা ওয়ালেট নাম্বার)...'
                    : 'Describe your issue in detail (e.g., TrxID, amount, or wallet number)...'
                }
                style={{ color: darkMode ? '#ffffff' : '#0f172a' }}
                className={`w-full rounded-2xl p-3 text-xs font-medium outline-none resize-none border transition-all ${
                  darkMode
                    ? 'bg-slate-800/70 border-slate-700 focus:border-purple-500 placeholder:text-slate-500'
                    : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-purple-500 placeholder:text-slate-400'
                }`}
              />
            </div>

            {/* Optional Image / Screenshot Attachment with High-Contrast Preview */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {lang === 'bn' ? 'স্ক্রিনশট / ছবি (ঐচ্ছিক)' : 'Screenshot / Image (Optional)'}
                </label>
                {supportImagePreview && (
                  <button
                    type="button"
                    onClick={() => setSupportImagePreview(null)}
                    className="text-[10.5px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                  >
                    {lang === 'bn' ? 'মুছে ফেলুন' : 'Remove'}
                  </button>
                )}
              </div>

              {supportImagePreview ? (
                <div
                  style={{
                    backgroundColor: darkMode ? '#0f172a' : '#f0fdf4',
                    borderColor: darkMode ? '#10b981' : '#86efac'
                  }}
                  className="relative rounded-2xl overflow-hidden border-2 p-2.5 flex items-center gap-3 shadow-xs"
                >
                  <img
                    src={supportImagePreview}
                    alt="Preview"
                    className="w-14 h-14 object-cover rounded-xl border border-emerald-500/40 shrink-0 bg-white"
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      style={{ color: darkMode ? '#34d399' : '#047857' }}
                      className="text-xs font-black truncate"
                    >
                      {lang === 'bn' ? '✓ স্ক্রিনশট যুক্ত করা হয়েছে' : '✓ Screenshot Attached'}
                    </p>
                    <p
                      style={{ color: darkMode ? '#cbd5e1' : '#334155' }}
                      className="text-[10.5px] font-semibold mt-0.5 leading-snug"
                    >
                      {lang === 'bn' ? 'সাবমিট করলে সরাসরি সাপোর্ট টিমে যাবে' : 'Will be sent directly to support team'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSupportImagePreview(null)}
                    style={{ backgroundColor: '#ef4444', color: '#ffffff' }}
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 cursor-pointer shadow-xs active:scale-90 transition-transform"
                  >
                    <X size={14} strokeWidth={2.5} />
                  </button>
                </div>
              ) : (
                <label className={`w-full py-3 px-3 rounded-2xl border border-dashed flex items-center justify-center gap-2 text-xs font-bold cursor-pointer transition-all active:scale-[0.99] ${
                  darkMode
                    ? 'bg-slate-800/40 border-slate-700 text-slate-300 hover:border-purple-500/50'
                    : 'bg-slate-50 border-slate-300 text-slate-700 hover:border-purple-400'
                }`}>
                  <Camera size={15} className="text-purple-500 shrink-0" />
                  <span>
                    {isCompressingImage
                      ? (lang === 'bn' ? 'ছবি প্রস্তুত হচ্ছে...' : 'Processing image...')
                      : (lang === 'bn' ? '+ স্ক্রিনশট আপলোড করুন' : '+ Upload Screenshot (Optional)')}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSupportImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setSupportCategory(null)}
                className={`flex-1 h-[46px] rounded-2xl font-black text-xs active:scale-95 transition-all cursor-pointer border ${
                  darkMode
                    ? 'bg-slate-800 border-slate-700 text-slate-300'
                    : 'bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                {lang === 'bn' ? 'পেছনে যান' : 'Back'}
              </button>
              <button
                type="button"
                disabled={isSendingSupport || isCompressingImage || !supportMsg.trim()}
                onClick={async () => {
                  if (!supportMsg.trim()) return;
                  setIsSendingSupport(true);
                  try {
                    const res = await submitSupportMessage({
                      userId: user?.id,
                      name: user?.first_name,
                      username: user?.username,
                      category: supportCategory?.id || 'Others',
                      subject: supportSubject,
                      message: supportMsg.trim(),
                      imageBase64: supportImagePreview || null
                    });
                    setSupportMsg('');
                    setSupportImagePreview(null);
                    playAppSound('success');
                    setSupportFeedback({
                      success: true,
                      ticketId: res?.ticketId || '',
                      message: lang === 'bn'
                        ? 'আপনার মেসেজ সফলভাবে আমাদের সাপোর্ট টিমে পাঠানো হয়েছে। অ্যাডমিন টিম খুব শীঘ্রই উত্তর দিবে।'
                        : 'Your support ticket has been sent to our team. We will reply shortly.'
                    });
                  } catch (err) {
                    playAppSound('error');
                    setSupportFeedback({
                      success: false,
                      message: err.message || (lang === 'bn' ? 'পাঠাতে সমস্যা হয়েছে, আবার চেষ্টা করুন।' : 'Failed to send, try again.')
                    });
                  } finally {
                    setIsSendingSupport(false);
                  }
                }}
                className="flex-[1.5] h-[46px] bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/25 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSendingSupport ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <Send size={14} />
                    <span>{lang === 'bn' ? 'সাবমিট করুন' : 'Submit Ticket'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// TRANSFER MONEY PAGE (P2P INSTANT SAFE BALANCE TRANSFER WITH FLOWER ART)
// ============================================================================
function TransferMoneyPage({
  user,
  balance = 0,
  mbsId,
  twoStepEnabled = false,
  twoStepLength = 4,
  onGoToTwoStep,
  onBack,
  reloadData,
  darkMode = false,
  lang = 'bn'
}) {
  // Step 1 = Search & Select User, Step 2 = Amount & Gift/Note
  // NOTE: Per user instruction: "sathe step systeam thakbe but ota dekha jabe na" (No visible step 1/2 indicator!)
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(true);
  const [pastedFeedback, setPastedFeedback] = useState(false);
  const [directLookupError, setDirectLookupError] = useState('');

  // 5 Users per scroll pagination with Batch Preload Protection
  const [visibleCount, setVisibleCount] = useState(5);
  const [isBatchLoading, setIsBatchLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const sentinelRef = useRef(null);
  const topRef = useRef(null);

  // Auto-scroll to top helper that unfocuses keyboard and resets scroll across all viewport containers
  const scrollToPageTop = useCallback(() => {
    // 1. Unfocus any active input/keyboard immediately
    try {
      if (document.activeElement && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
      }
    } catch (_) {}

    // 2. Perform scroll reset across window and document
    const performScroll = () => {
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      } catch (_) {
        window.scrollTo(0, 0);
      }
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
      if (topRef.current) {
        try {
          topRef.current.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'instant' });
        } catch (_) {
          try {
            topRef.current.scrollIntoView();
          } catch (_) {}
        }
      }
    };

    performScroll();
    requestAnimationFrame(performScroll);
    setTimeout(performScroll, 50);
    setTimeout(performScroll, 120);
    setTimeout(performScroll, 250);
  }, []);

  // When switching between recipient list (Screen 1) and transfer details (Screen 2), guarantee view starts at the very top
  useEffect(() => {
    scrollToPageTop();
  }, [selectedRecipient, scrollToPageTop]);

  // When search query or results change, preload the first 5 avatars so all 5 reveal simultaneously in order
  useEffect(() => {
    let cancelled = false;
    setVisibleCount(5);
    setIsBatchLoading(true);

    if (!searchResults || searchResults.length === 0) {
      if (!isSearching) setIsBatchLoading(false);
      return;
    }

    const first5 = searchResults.slice(0, 5);
    preloadUserAvatarsBatch(first5).then(() => {
      if (!cancelled) {
        setIsBatchLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [searchQuery, searchResults, isSearching]);

  const visibleUsers = useMemo(() => {
    return (searchResults || []).slice(0, visibleCount);
  }, [searchResults, visibleCount]);

  const hasMore = visibleCount < (searchResults?.length || 0);

  // Next 5 on scroll: preloads images before revealing to guarantee serial order (never bottom-up!)
  const loadMoreUsers = useCallback(async () => {
    if (isLoadingMore || isBatchLoading || !hasMore) return;
    setIsLoadingMore(true);
    const next5 = (searchResults || []).slice(visibleCount, visibleCount + 5);
    await preloadUserAvatarsBatch(next5);
    setVisibleCount(prev => Math.min(prev + 5, searchResults?.length || 0));
    setIsLoadingMore(false);
  }, [isLoadingMore, isBatchLoading, hasMore, searchResults, visibleCount]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMoreUsers();
        }
      },
      { threshold: 0.1, rootMargin: '120px' }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, loadMoreUsers]);

  // Window scroll fallback listener
  useEffect(() => {
    const handleScroll = () => {
      if (isLoadingMore || !hasMore) return;
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const clientHeight = window.innerHeight || document.documentElement.clientHeight;
      if (scrollTop + clientHeight >= scrollHeight - 140) {
        loadMoreUsers();
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, isLoadingMore, loadMoreUsers]);

  // Step 2 Form State
  const [amount, setAmount] = useState('');
  const [transferType, setTransferType] = useState('direct'); // 'direct' | 'gift'
  const [giftTheme, setGiftTheme] = useState('surprise'); // 'surprise' | 'love' | 'salami' | 'birthday' | 'congrats'
  const [comment, setComment] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Modals & Submission
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinError, setPinError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transferSuccessData, setTransferSuccessData] = useState(null);

  // Quick Amount Chips
  const quickAmounts = [20, 50, 100, 500, 1000];

  // Gift Theme Configurations (Backed by 3D PremiumGiftArtwork)
  const giftThemes = Object.values(GIFT_THEME_META);

  // Live Debounced User Search (Searches by Name, Username, UID, or TrustPay MBS ID)
  useEffect(() => {
    let cancelled = false;
    const clean = searchQuery.trim();

    const fetchUsers = async () => {
      setIsSearching(true);
      setDirectLookupError('');
      try {
        const users = await searchUsers(clean, user?.id);
        const myUidStr = String(user?.id || '').trim();
        const myMbsStr = String(mbsId || user?.mbsId || '').trim().toUpperCase();
        const filtered = (users || []).filter(u => {
          const uUidStr = String(u.userId || '').trim();
          const uMbsStr = String(u.mbsId || '').trim().toUpperCase();
          if (myUidStr && uUidStr === myUidStr) return false;
          if (myMbsStr && uMbsStr === myMbsStr) return false;
          return true;
        });
        if (!cancelled) {
          setSearchResults(filtered);
        }
      } catch (err) {
        if (!cancelled) setSearchResults([]);
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    };

    const timer = setTimeout(fetchUsers, clean ? 250 : 50);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, user?.id]);

  // Paste into search box
  const handlePasteSearch = async () => {
    try {
      const applyText = (text) => {
        if (text && text.trim()) {
          setSearchQuery(text.trim());
          setPastedFeedback(true);
          playAppSound('tap');
          setTimeout(() => setPastedFeedback(false), 1800);
        }
      };

      if (window.Telegram?.WebApp?.readTextFromClipboard) {
        window.Telegram.WebApp.readTextFromClipboard((clip) => {
          if (clip) applyText(clip);
        });
        return;
      }
      if (navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        applyText(text);
      }
    } catch (_) {}
  };

  // Direct lookup fallback if user entered an exact ID that wasn't in top search
  const handleDirectLookup = async () => {
    const clean = searchQuery.trim();
    if (!clean) return;
    setIsSearching(true);
    setDirectLookupError('');
    try {
      const res = await lookupRecipientUser(clean, user?.id);
      const found = res?.recipient || res?.user;
      const myUidStr = String(user?.id || '').trim();
      const myMbsStr = String(mbsId || user?.mbsId || '').trim().toUpperCase();

      if (res?.isSelf || String(found?.userId) === myUidStr || String(found?.mbsId || '').toUpperCase() === myMbsStr) {
        setDirectLookupError(lang === 'bn' ? 'নিজের অ্যাকাউন্টে টাকা ট্রান্সফার করা যাবে না!' : 'Cannot transfer to your own account!');
        playAppSound('error');
        return;
      }

      if (res?.success && res?.found && found) {
        playAppSound('tap');
        scrollToPageTop();
        setSelectedRecipient(found);
      } else {
        setDirectLookupError(res?.error || (lang === 'bn' ? 'এই আইডিতে কোনো অ্যাকাউন্ট পাওয়া যায়নি' : 'No account found with this ID'));
        playAppSound('error');
      }
    } catch (e) {
      setDirectLookupError(e.message || (lang === 'bn' ? 'অ্যাকাউন্ট খুঁজতে সমস্যা হয়েছে' : 'Lookup failed'));
      playAppSound('error');
    } finally {
      setIsSearching(false);
    }
  };

  // Step 2 Submission Trigger
  const handleInitiateTransfer = () => {
    const amt = parseFloat(String(amount || '').replace(/,/g, '').trim());
    if (!selectedRecipient) {
      playAppSound('error');
      return;
    }
    const myUidStr = String(user?.id || '').trim();
    const myMbsStr = String(mbsId || user?.mbsId || '').trim().toUpperCase();
    if (String(selectedRecipient.userId) === myUidStr || String(selectedRecipient.mbsId || '').toUpperCase() === myMbsStr) {
      playAppSound('error');
      setErrorMessage(lang === 'bn' ? 'নিজের অ্যাকাউন্টে টাকা ট্রান্সফার করা যাবে না!' : 'Cannot transfer to your own account!');
      return;
    }
    if (!amt || isNaN(amt) || amt < 10) {
      playAppSound('error');
      setErrorMessage(lang === 'bn' ? 'সর্বনিম্ন ১০ টাকা ট্রান্সফার করতে হবে' : 'Minimum transfer is 10 BDT');
      return;
    }
    if (amt > 5000) {
      playAppSound('error');
      setErrorMessage(lang === 'bn' ? 'একবারে সর্বোচ্চ ৫,০০০ টাকা ট্রান্সফার করা যাবে' : 'Maximum transfer is 5,000 BDT');
      return;
    }
    if (amt > balance) {
      playAppSound('error');
      setErrorMessage(lang === 'bn' ? 'আপনার অ্যাকাউন্টে পর্যাপ্ত ব্যালেন্স নেই!' : 'Insufficient balance!');
      return;
    }

    setErrorMessage('');
    playAppSound('confirm');
    if (twoStepEnabled) {
      setShowPinModal(true);
    } else {
      setShowConfirmModal(true);
    }
  };

  const handleConfirmPinAndTransfer = async (enteredPin = '') => {
    setIsSubmitting(true);
    setPinError('');
    try {
      const cleanComment = comment.trim().slice(0, 100);
      const res = await submitTransferMoney({
        userId: user?.id || 123456789,
        senderId: user?.id || 123456789,
        recipientQuery: selectedRecipient.userId || selectedRecipient.mbsId,
        amount: parseFloat(amount),
        comment: cleanComment,
        note: cleanComment,
        isGift: transferType === 'gift',
        giftTheme: transferType === 'gift' ? giftTheme : undefined,
        twoStepPin: enteredPin || undefined
      });

      if (res?.success) {
        setShowPinModal(false);
        setShowConfirmModal(false);
        playAppSound('success');
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
        setTransferSuccessData({
          transferId: res.transferId,
          amount: res.amount || parseFloat(amount),
          comment: cleanComment,
          isGift: transferType === 'gift',
          giftTheme,
          recipientName: selectedRecipient.name,
          recipientMbsId: selectedRecipient.mbsId,
          recipientUid: selectedRecipient.userId,
          recipientPhotoUrl: selectedRecipient.photoUrl
        });
        setAmount('');
        setComment('');
        if (reloadData) reloadData();
      }
    } catch (e) {
      playAppSound('error');
      const errMsg = e.message || (lang === 'bn' ? 'ট্রান্সফার সম্পন্ন করা যায়নি' : 'Transfer failed');
      if (showPinModal) {
        setPinError(errMsg);
      } else {
        setShowConfirmModal(false);
        setErrorMessage(errMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3 pb-24 max-w-md mx-auto animate-in fade-in duration-300">
      {/* Scroll to Top Anchor */}
      <div ref={topRef} id="transfer-page-top-anchor" className="h-0 w-0 pointer-events-none opacity-0 m-0 p-0" />
      {/* ==================================================================== */}
      {/* SCREEN 1: SEARCH & SELECT RECIPIENT                                   */}
      {/* ==================================================================== */}
      {!selectedRecipient ? (
        <div className="space-y-3">
          {/* Top Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onBack}
                className="w-8 h-8 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center shadow-xs border border-slate-200 dark:border-slate-800 active:scale-95 transition-transform text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                <ChevronRight size={16} className="rotate-180" strokeWidth={2.5} />
              </button>
              <div>
                <h2 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                  {lang === 'bn' ? 'মানি ট্রান্সফার (P2P Transfer)' : 'P2P Money Transfer'}
                </h2>
                <p className="text-[10px] text-slate-400 font-medium leading-none">
                  {lang === 'bn' ? 'প্রাপক নির্বাচন করুন' : 'Select Recipient'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[9.5px] font-bold text-slate-400 block leading-tight">{lang === 'bn' ? 'ব্যালেন্স' : 'Balance'}</span>
              <span className="text-xs font-black font-mono text-purple-600 dark:text-purple-400">৳{Number(balance || 0).toFixed(2)}</span>
            </div>
          </div>

          {/* 1. Clean Standalone Search Bar (NO outer wrapper card) */}
          <div className="space-y-1.5">
            <div className={`relative flex items-center rounded-2xl border transition-all px-3.5 h-[48px] shadow-2xs ${
              darkMode 
                ? 'bg-slate-900/90 border-slate-800 focus-within:border-purple-500 backdrop-blur-md' 
                : 'bg-white/95 border-slate-200/90 focus-within:border-purple-500 backdrop-blur-md'
            }`}>
              <Search size={18} className="text-purple-500 dark:text-purple-400 mr-2.5 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={lang === 'bn' ? 'TrustPay ID দিন...' : 'Enter TrustPay ID...'}
                style={{ color: darkMode ? '#ffffff' : '#0f172a' }}
                className="w-full bg-transparent text-xs sm:text-sm font-bold outline-none pr-16 placeholder:text-slate-400 placeholder:font-normal"
              />

              <div className="absolute right-2 flex items-center gap-1">
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 flex items-center justify-center text-xs hover:bg-slate-200 cursor-pointer transition-colors"
                  >
                    <X size={13} strokeWidth={2.5} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePasteSearch}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10.5px] font-black transition-all cursor-pointer border-b-[2px] active:translate-y-[2px] active:border-b-0 shadow-2xs ${
                      pastedFeedback
                        ? 'bg-emerald-600 text-white border-emerald-800'
                        : 'bg-purple-600 hover:bg-purple-700 text-white border-[#3730a3]'
                    }`}
                  >
                    {pastedFeedback ? (
                      <>
                        <Check size={11} strokeWidth={3} />
                        <span>{lang === 'bn' ? 'পেস্ট!' : 'Pasted!'}</span>
                      </>
                    ) : (
                      <>
                        <Clipboard size={11} />
                        <span>{lang === 'bn' ? 'পেস্ট' : 'Paste'}</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Direct lookup error banner */}
            {directLookupError && (
              <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl p-2.5 flex items-start gap-2 shadow-2xs">
                <AlertCircle size={15} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs text-red-700 dark:text-red-300 font-medium leading-tight">{directLookupError}</p>
              </div>
            )}
          </div>

          {/* 2. Natural User List Header */}
          <div className="flex items-center justify-between px-1 pt-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                {searchQuery ? (lang === 'bn' ? 'অনুসন্ধানের ফলাফল' : 'Search Results') : (lang === 'bn' ? 'সক্রিয় ইউজার তালিকা' : 'Active Users')}
              </span>
              {searchResults.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  {visibleUsers.length} / {searchResults.length} {lang === 'bn' ? 'জন' : 'users'}
                </span>
              )}
            </div>
            {isSearching && (
              <span className="flex items-center gap-1.5 text-[10.5px] text-purple-600 dark:text-purple-400 font-bold">
                <Loader2 size={12} className="animate-spin" />
                <span>{lang === 'bn' ? 'খোঁজা হচ্ছে...' : 'Searching...'}</span>
              </span>
            )}
          </div>

          {/* 3. User Items in Natural Flow (With Real Batch Skeleton Loading Animation) */}
          <div className="space-y-2.5">
            {/* Keyframe animation for serial top-to-bottom entrance */}
            <style>{`
              @keyframes slideDownIn {
                0% { opacity: 0; transform: translateY(-7px); }
                100% { opacity: 1; transform: translateY(0); }
              }
            `}</style>

            {(isSearching || isBatchLoading) && searchResults.length === 0 ? (
              // Initial/Search Skeleton Loading: 5 Skeleton Cards
              Array.from({ length: 5 }).map((_, idx) => (
                <UserProfileSkeletonCard key={`init-skel-${idx}`} darkMode={darkMode} />
              ))
            ) : isBatchLoading && searchResults.length > 0 ? (
              // Batch is preloading avatars in background: show 5 Skeleton Cards together
              Array.from({ length: 5 }).map((_, idx) => (
                <UserProfileSkeletonCard key={`batch-skel-${idx}`} darkMode={darkMode} />
              ))
            ) : visibleUsers.length > 0 ? (
              <>
                {visibleUsers.map((u, idx) => (
                  <UserRecipientCard
                    key={u.userId}
                    u={u}
                    index={idx}
                    onSelect={(sel) => {
                      const myUidStr = String(user?.id || '').trim();
                      const myMbsStr = String(mbsId || user?.mbsId || '').trim().toUpperCase();
                      if (String(sel?.userId) === myUidStr || String(sel?.mbsId || '').toUpperCase() === myMbsStr) {
                        playAppSound('error');
                        if (window.Telegram?.WebApp?.showAlert) {
                          window.Telegram.WebApp.showAlert(lang === 'bn' ? 'নিজের অ্যাকাউন্টে টাকা ট্রান্সফার করা যাবে না!' : 'Cannot transfer to your own account!');
                        }
                        return;
                      }
                      playAppSound('tap');
                      if (window.Telegram?.WebApp?.HapticFeedback) {
                        window.Telegram.WebApp.HapticFeedback.selectionChanged();
                      }
                      scrollToPageTop();
                      setSelectedRecipient(sel);
                    }}
                    darkMode={darkMode}
                    lang={lang}
                  />
                ))}

                {/* When scrolling down to load next 5 users: render 5 Skeleton Cards at bottom */}
                {isLoadingMore && (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <UserProfileSkeletonCard key={`more-skel-${idx}`} darkMode={darkMode} />
                  ))
                )}
              </>
            ) : !isSearching ? (
              <div className="py-10 px-4 text-center space-y-2 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto text-xl">
                  🔍
                </div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {searchQuery
                    ? (lang === 'bn' ? 'এই নামে কোনো অ্যাকাউন্ট পাওয়া যায়নি' : 'No account found with this search')
                    : (lang === 'bn' ? 'ইউজারের নাম বা আইডি লিখে খুঁজুন' : 'Search by name or ID')}
                </p>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleDirectLookup}
                    className="mt-2 px-3 py-1.5 rounded-xl bg-purple-600 text-white font-black text-xs inline-flex items-center gap-1 shadow-xs active:scale-95 cursor-pointer"
                  >
                    <Search size={12} />
                    <span>{lang === 'bn' ? 'সরাসরি আইডি দিয়ে খুঁজুন' : 'Direct Lookup by ID'}</span>
                  </button>
                )}
              </div>
            ) : null}

            {/* 4. Infinite Scroll Sentinel & 5-user Lazy Load Status */}
            {hasMore && !isLoadingMore && (
              <div ref={sentinelRef} className="pt-2">
                <button
                  type="button"
                  onClick={loadMoreUsers}
                  className="w-full py-2.5 rounded-2xl border border-dashed border-purple-300 dark:border-purple-800/80 bg-purple-50/50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 hover:bg-purple-100/60 dark:hover:bg-purple-950/60 text-xs font-bold transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <span>{lang === 'bn' ? `স্ক্রোল করুন অথবা আরো ৫ জন লোড করুন (${visibleUsers.length}/${searchResults.length})` : `Load 5 more (${visibleUsers.length}/${searchResults.length})`}</span>
                  <ChevronDown size={14} />
                </button>
              </div>
            )}
            {hasMore && isLoadingMore && (
              <div ref={sentinelRef} className="h-4" />
            )}
          </div>
        </div>
      ) : (
        /* ==================================================================== */
        /* SCREEN 2: TRANSFER DETAILS (AMOUNT, GIFT & NOTE)                    */
        /* ==================================================================== */
        <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  playAppSound('tap');
                  scrollToPageTop();
                  setSelectedRecipient(null);
                }}
                className="w-8 h-8 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center shadow-xs border border-slate-200 dark:border-slate-800 active:scale-95 transition-transform text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                <ChevronRight size={16} className="rotate-180" strokeWidth={2.5} />
              </button>
              <div>
                <h2 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                  {lang === 'bn' ? 'টাকা পাঠান' : 'Send Money'}
                </h2>
                <p className="text-[10px] text-slate-400 font-medium leading-none">
                  {lang === 'bn' ? 'পরিমাণ ও শুভেচ্ছা নির্বাচন করুন' : 'Amount & Note Details'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[9.5px] font-bold text-slate-400 block leading-tight">{lang === 'bn' ? 'ব্যালেন্স' : 'Balance'}</span>
              <span className="text-xs font-black font-mono text-purple-600 dark:text-purple-400">৳{Number(balance || 0).toFixed(2)}</span>
            </div>
          </div>

          {/* Form Card */}
          <div className={`p-5 rounded-[28px] border shadow-sm space-y-4 relative overflow-hidden ${
            darkMode ? 'bg-slate-900/95 border-slate-800 text-white' : 'bg-white border-slate-200/90 text-slate-900'
          }`}>
            {/* 1. Centered Recipient Profile & Small Name Underneath */}
            {(() => {
              const isSelectedBoss = Boolean(selectedRecipient.isOwner || selectedRecipient.userId === '8799135330' || selectedRecipient.mbsId === 'MT999999');
              return (
                <div className="relative flex flex-col items-center justify-center pt-1 pb-1">
                  {/* Top-Right Change Button */}
                  <button
                    type="button"
                    onClick={() => {
                      playAppSound('tap');
                      scrollToPageTop();
                      setSelectedRecipient(null);
                    }}
                    className={`absolute right-0 top-0 px-2.5 py-1 rounded-full text-[10px] font-black border cursor-pointer active:scale-95 transition-all ${
                      isSelectedBoss
                        ? 'bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-800 dark:text-amber-300 border-amber-300/80 dark:border-amber-700/70'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {lang === 'bn' ? 'পরিবর্তন' : 'Change'}
                  </button>

                  {/* Centered Profile Avatar */}
                  <div className="relative flex items-center justify-center mb-2.5">
                    {isSelectedBoss ? (
                      <div className="relative flex items-center justify-center w-16 h-16 my-1.5">
                        <div className="absolute -inset-2 rounded-full bg-amber-400/20 blur-md pointer-events-none" />
                        <UserAvatarBox
                          userId={selectedRecipient.userId}
                          photoUrl={selectedRecipient.photoUrl}
                          name={selectedRecipient.name}
                          sizeClass="w-16 h-16 rounded-full text-xl shadow-md overflow-hidden"
                        />
                        <img
                          src={marufFrameImg}
                          alt="Royal Crown Frame"
                          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[96px] h-[96px] max-w-none pointer-events-none z-20 drop-shadow-[0_4px_12px_rgba(245,158,11,0.55)]"
                        />
                        <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] text-slate-950 font-black shadow-xs z-30">
                          ✓
                        </span>
                      </div>
                    ) : (
                      <div className="relative flex items-center justify-center">
                        <div className="p-1 rounded-full bg-gradient-to-tr from-purple-500/20 via-indigo-500/20 to-pink-500/20 border border-purple-300/40 dark:border-purple-700/40 shadow-sm">
                          <UserAvatarBox
                            userId={selectedRecipient.userId}
                            photoUrl={selectedRecipient.photoUrl}
                            name={selectedRecipient.name}
                            sizeClass="w-16 h-16 rounded-full text-xl shadow-sm overflow-hidden"
                          />
                        </div>
                        <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] text-white font-black shadow-xs">
                          ✓
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Small Centered Recipient Name & TrustPay ID Underneath */}
                  <div className="flex flex-col items-center text-center leading-tight">
                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                      <h3 className={`font-black text-xs sm:text-sm tracking-tight ${
                        isSelectedBoss ? 'text-amber-900 dark:text-amber-200' : 'text-slate-800 dark:text-slate-100'
                      }`}>
                        {selectedRecipient.name}
                      </h3>
                      {isSelectedBoss && (
                        <span className="text-[8px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 px-1.5 py-0.5 rounded-full shadow-2xs">
                          👑 FOUNDER
                        </span>
                      )}
                    </div>
                    {!isSelectedBoss && (
                      <span className="mt-1 text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        {selectedRecipient.mbsId}
                      </span>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* 2. Borderless Centered Amount Entry (NO Box Around Input) */}
            <div className="py-2 text-center">
              <div className="flex items-baseline justify-center gap-1">
                <span className={`text-3xl sm:text-4xl font-black select-none transition-colors ${
                  amount ? 'text-purple-600 dark:text-purple-400' : 'text-slate-300 dark:text-slate-600'
                }`}>
                  ৳
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={amount}
                  onChange={e => {
                    setAmount(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="0"
                  style={{
                    color: darkMode ? '#ffffff' : '#0f172a',
                    width: `${Math.max(2, String(amount || '0').length + 0.6)}ch`,
                    maxWidth: '220px'
                  }}
                  className="bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-center text-4xl sm:text-5xl font-black font-mono tracking-tight placeholder:text-slate-300 dark:placeholder:text-slate-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              <div className="mt-1 flex items-center justify-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                  {lang === 'bn' ? 'পরিমাণ লিখুন (৳১০ - ৳৫,০০০)' : 'Enter amount (৳10 - ৳5,000)'}
                </span>
                <span className="text-[9.5px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                  {lang === 'bn' ? '০% ফি' : '0% Fee'}
                </span>
              </div>

              {/* Subtle Quick Amount Pills */}
              <div className="flex items-center justify-center flex-wrap gap-1.5 mt-3">
                {quickAmounts.map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      playAppSound('tap');
                      setAmount(val.toString());
                      if (errorMessage) setErrorMessage('');
                    }}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer active:scale-95 ${
                      amount === val.toString()
                        ? 'bg-purple-600 text-white border-purple-600 font-black shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:border-purple-300'
                    }`}
                  >
                    ৳{val}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    playAppSound('tap');
                    const maxVal = Math.min(5000, roundBdt(balance || 0));
                    setAmount(maxVal.toFixed(2));
                    if (errorMessage) setErrorMessage('');
                  }}
                  className="px-2.5 py-1 rounded-full text-[11px] font-black border border-purple-300/80 dark:border-purple-800 bg-purple-500/10 text-purple-600 dark:text-purple-300 cursor-pointer active:scale-95"
                >
                  {lang === 'bn' ? 'সব' : 'Max'}
                </button>
              </div>
            </div>

            {/* 3. Third Section: Gift Option & Luxury 3D Gift Artworks */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    playAppSound('tap');
                    setTransferType('direct');
                  }}
                  className={`p-2.5 rounded-2xl border flex items-center gap-2.5 transition-all cursor-pointer text-left ${
                    transferType === 'direct'
                      ? 'bg-purple-500/12 border-purple-500 text-purple-700 dark:text-purple-300 font-black shadow-xs ring-1 ring-purple-500/30'
                      : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 font-bold'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    transferType === 'direct'
                      ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-xs'
                      : 'bg-slate-200/70 dark:bg-slate-700 text-slate-500 dark:text-slate-300'
                  }`}>
                    <Zap size={17} fill="currentColor" />
                  </div>
                  <div className="leading-tight min-w-0">
                    <span className="text-xs block font-black truncate">{lang === 'bn' ? 'সাধারণ পেমেন্ট' : 'Direct Send'}</span>
                    <span className="text-[9.5px] text-slate-400 block truncate">{lang === 'bn' ? 'সরাসরি ব্যালেন্স জমা' : 'Instant Credit'}</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playAppSound('tap');
                    setTransferType(transferType === 'gift' ? 'direct' : 'gift');
                  }}
                  className={`p-2 rounded-2xl border flex items-center gap-2 transition-all cursor-pointer text-left relative overflow-hidden ${
                    transferType === 'gift'
                      ? 'bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-purple-500/15 border-amber-400 text-amber-800 dark:text-amber-200 font-black shadow-sm ring-1 ring-amber-400/40'
                      : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 font-bold hover:border-amber-300/60'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                    <PremiumGiftArtwork theme={giftTheme} size={38} animated={transferType === 'gift'} />
                  </div>
                  <div className="leading-tight min-w-0">
                    <span className="text-xs block font-black truncate">{lang === 'bn' ? 'গিফট পাঠান' : 'Send Gift'}</span>
                    <span className="text-[9.5px] text-amber-600 dark:text-amber-400 block font-bold truncate">
                      {lang === 'bn' ? '3D গিফট ও অ্যানিমেশন' : '3D Gift & Animation'}
                    </span>
                  </div>
                </button>
              </div>

              {/* IF GIFT SELECTED: Luxury 3D Gift Artwork Selector & Message Box */}
              {transferType === 'gift' ? (
                <div className={`p-3.5 rounded-2xl border space-y-3 animate-in fade-in zoom-in-95 duration-200 ${
                  darkMode
                    ? 'bg-gradient-to-b from-slate-800/80 to-slate-900 border-amber-500/30 shadow-inner'
                    : 'bg-gradient-to-b from-amber-50/70 via-white to-rose-50/40 border-amber-200/90 shadow-2xs'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1">
                      <Sparkles size={12} className="text-amber-500" />
                      <span>{lang === 'bn' ? 'প্রিমিয়াম 3D গিফট বাছুন' : 'Choose 3D Luxury Gift'}</span>
                    </span>
                    <span className="text-[9.5px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-400/30">
                      {GIFT_THEME_META[giftTheme]?.labelBn}
                    </span>
                  </div>

                  {/* 5 Custom 3D SVG Gift Cards */}
                  <div className="grid grid-cols-5 gap-1.5">
                    {giftThemes.map(th => {
                      const isSelected = giftTheme === th.id;
                      return (
                        <button
                          key={th.id}
                          type="button"
                          onClick={() => {
                            playAppSound('tap');
                            setGiftTheme(th.id);
                          }}
                          className={`group relative py-2 px-1 rounded-2xl border flex flex-col items-center justify-between transition-all cursor-pointer active:scale-95 ${
                            isSelected
                              ? darkMode
                                ? 'bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-amber-400 shadow-[0_6px_18px_rgba(245,158,11,0.28)] -translate-y-0.5'
                                : 'bg-white border-2 border-amber-500 shadow-[0_6px_18px_rgba(245,158,11,0.22)] -translate-y-0.5'
                              : darkMode
                                ? 'bg-slate-800/50 border-slate-700/70 opacity-75 hover:opacity-100'
                                : 'bg-white/80 border-slate-200/80 opacity-80 hover:opacity-100'
                          }`}
                        >
                          {isSelected && (
                            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 text-[8px] font-black flex items-center justify-center shadow-xs z-20">
                              ✓
                            </span>
                          )}
                          <div className="w-11 h-11 flex items-center justify-center my-0.5">
                            <PremiumGiftArtwork theme={th.id} size={44} animated={isSelected} />
                          </div>
                          <span className={`text-[8.5px] font-extrabold leading-tight text-center line-clamp-1 w-full px-0.5 ${
                            isSelected ? 'text-amber-700 dark:text-amber-300 font-black' : 'text-slate-600 dark:text-slate-400'
                          }`}>
                            {th.labelBn}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Gift Message Note Input */}
                  <div>
                    <textarea
                      rows={2}
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      placeholder={lang === 'bn' ? 'গিফট কার্ডের ভেতরে আপনার শুভেচ্ছা বার্তা লিখুন (ঐচ্ছিক)...' : 'Write a warm gift message (optional)...'}
                      style={{ color: darkMode ? '#ffffff' : '#0f172a' }}
                      className={`w-full p-2.5 rounded-xl border text-xs font-medium outline-none transition-all resize-none ${
                        darkMode ? 'bg-slate-900/90 border-slate-700 focus:border-amber-400' : 'bg-white border-amber-200 focus:border-amber-500'
                      }`}
                    />
                  </div>
                </div>
              ) : (
                /* IF DIRECT: Compact Optional Note Input */
                <div className={`flex items-center rounded-xl border px-3 h-[40px] ${
                  darkMode ? 'bg-slate-800/40 border-slate-700/80' : 'bg-slate-50/80 border-slate-200/80'
                }`}>
                  <input
                    type="text"
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder={lang === 'bn' ? 'মন্তব্য বা নোট লিখুন (ঐচ্ছিক)...' : 'Add a note (optional)...'}
                    style={{ color: darkMode ? '#ffffff' : '#0f172a' }}
                    className="w-full bg-transparent text-xs font-bold outline-none placeholder:text-slate-400 placeholder:font-normal"
                  />
                </div>
              )}
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl p-2.5 flex items-start gap-2">
                <AlertCircle size={15} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs text-red-700 dark:text-red-300 font-medium leading-tight">{errorMessage}</p>
              </div>
            )}

            {/* Submit 3D Purple Action Button */}
            <button
              type="button"
              onClick={handleInitiateTransfer}
              disabled={isSubmitting}
              className="w-full h-[50px] rounded-2xl bg-gradient-to-b from-purple-500 via-purple-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 border-t border-t-purple-300/60 border-b-[5px] border-b-[#3b0764] shadow-[0_6px_18px_rgba(126,34,206,0.38),inset_0_1px_1px_rgba(255,255,255,0.35)] active:translate-y-[4px] active:border-b-[1px] active:shadow-xs transition-all duration-100 cursor-pointer disabled:opacity-60"
            >
              {transferType === 'gift' ? (
                <>
                  <Sparkles size={16} className="drop-shadow-xs" />
                  <span className="drop-shadow-xs">{lang === 'bn' ? `${GIFT_THEME_META[giftTheme]?.labelBn || 'গিফট'} হিসেবে পাঠান` : 'Send Luxury Gift'}</span>
                </>
              ) : (
                <>
                  <Send size={15} className="drop-shadow-xs" />
                  <span className="drop-shadow-xs">{lang === 'bn' ? 'নিরাপদে ট্রান্সফার করুন' : 'Transfer Money Securely'}</span>
                  <Zap size={15} fill="currentColor" className="drop-shadow-xs" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* CONFIRMATION MODAL                                                    */}
      {/* ==================================================================== */}
      {showConfirmModal && selectedRecipient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className={`w-full max-w-sm rounded-[28px] p-5 border shadow-2xl text-center space-y-3.5 animate-in zoom-in-95 duration-200 ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200/90 text-slate-900'
          }`}>
            {transferType === 'gift' ? (
              <div className="w-16 h-16 mx-auto flex items-center justify-center">
                <PremiumGiftArtwork theme={giftTheme} size={64} animated={true} />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto text-xl shadow-xs">
                💸
              </div>
            )}

            <div>
              <h3 className="text-base font-black">
                {lang === 'bn' ? 'ট্রান্সফার নিশ্চিত করুন' : 'Confirm Money Transfer'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {transferType === 'gift'
                  ? (lang === 'bn' ? `প্রাপক একটি প্রিমিয়াম 3D "${GIFT_THEME_META[giftTheme]?.labelBn}" অ্যানিমেশন পাবেন` : 'Recipient will receive an animated 3D gift')
                  : (lang === 'bn' ? 'টাকাটি অবিলম্বে প্রাপকের ব্যালেন্সে জমা হবে' : 'Immediate balance credit to recipient')}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2 text-left text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-bold">প্রাপক:</span>
                <span className="font-black text-slate-900 dark:text-white">{selectedRecipient.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-bold">TrustPay ID:</span>
                <span className="font-mono font-bold text-purple-600 dark:text-purple-400">{selectedRecipient.mbsId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-bold">পরিমাণ:</span>
                <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">৳{parseFloat(amount).toFixed(2)}</span>
              </div>
              {transferType === 'gift' && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold">গিফট থিম:</span>
                  <span className="font-black text-amber-600 dark:text-amber-400">{GIFT_THEME_META[giftTheme]?.labelBn}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-bold">ফি:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">ফ্রি (৳০.০০)</span>
              </div>
              {comment && (
                <div className="pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 font-bold block mb-0.5">বার্তা / নোট:</span>
                  <span className="font-serif italic font-bold text-purple-600 dark:text-purple-300 block break-words">"{comment}"</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="h-[42px] rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer active:scale-95"
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => handleConfirmPinAndTransfer('')}
                disabled={isSubmitting}
                className="h-[42px] rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center gap-1.5 border-b-[3px] border-[#3730a3] active:translate-y-[3px] active:border-b-0 cursor-pointer shadow-md disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <span>{lang === 'bn' ? 'হ্যাঁ, পাঠিয়ে দিন' : 'Confirm & Send'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2-Step PIN Modal */}
      <TwoStepPinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onConfirmPin={handleConfirmPinAndTransfer}
        isSubmitting={isSubmitting}
        errorMessage={pinError}
        lang={lang}
        darkMode={darkMode}
        pinLength={twoStepLength}
        titleBn="ট্রান্সফার কনফার্ম করতে PIN দিন"
        titleEn="Enter PIN to Confirm Transfer"
      />

      {/* ==================================================================== */}
      {/* TRANSFER SUCCESS RECEIPT MODAL                                       */}
      {/* ==================================================================== */}
      {transferSuccessData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className={`w-full max-w-sm rounded-[32px] p-6 border shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-300 relative overflow-hidden ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200/90 text-slate-900'
          }`}>
            {transferSuccessData.isGift ? (
              <div className="flex flex-col items-center justify-center pt-1">
                <div className="w-20 h-20 flex items-center justify-center">
                  <PremiumGiftArtwork theme={transferSuccessData.giftTheme || 'surprise'} size={78} animated={true} />
                </div>
                <span className="mt-1 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-400/30">
                  {GIFT_THEME_META[transferSuccessData.giftTheme || 'surprise']?.labelBn} পাঠানো হয়েছে
                </span>
              </div>
            ) : (
              <LuxurySuccessEmblem badgeText={lang === 'bn' ? 'ট্রান্সফার সফল' : 'TRANSFER SUCCESSFUL'} />
            )}

            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                {lang === 'bn' ? 'টাকা সফলভাবে পাঠানো হয়েছে!' : 'Money Sent Successfully!'}
              </h3>
              <div className="text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                ৳{Number(transferSuccessData.amount).toFixed(2)} BDT
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {transferSuccessData.isGift
                  ? (lang === 'bn' ? `${transferSuccessData.recipientName}-কে প্রিমিয়াম 3D গিফট পাঠানো হয়েছে ✨` : `Luxury 3D gift sent to ${transferSuccessData.recipientName}`)
                  : (lang === 'bn' ? `${transferSuccessData.recipientName}-এর অ্যাকাউন্টে সরাসরি জমা হয়েছে` : `Successfully sent to ${transferSuccessData.recipientName}`)}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-left space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-bold">প্রাপক:</span>
                <span className="font-black">{transferSuccessData.recipientName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-bold">TrustPay ID:</span>
                <span className="font-mono font-bold text-purple-600 dark:text-purple-400">{transferSuccessData.recipientMbsId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-bold">ট্রান্সফার ট্রানজেকশন ID:</span>
                <span className="font-mono font-bold">{transferSuccessData.transferId}</span>
              </div>
              {transferSuccessData.comment && (
                <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 font-bold block mb-0.5">বার্তা / চিঠি:</span>
                  <p className="font-serif italic font-bold text-purple-600 dark:text-purple-300 break-words">"{transferSuccessData.comment}"</p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                playAppSound('tap');
                setTransferSuccessData(null);
                setSelectedRecipient(null);
                onBack();
              }}
              className="w-full h-[46px] rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 border-b-[3px] border-[#3730a3] active:translate-y-[3px] active:border-b-0 cursor-pointer shadow-md"
            >
              <CheckCircle2 size={16} />
              <span>{lang === 'bn' ? 'ঠিক আছে (Done)' : 'Done'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

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


// ============================================================================
// SCHEDULED SYSTEM TIMING & COUNTDOWN SCREEN (Unlocks automatically at 1:00 PM)
// ============================================================================
const ScheduledMaintenanceScreen = ({ targetTimestamp, isAdmin, onAdminBypass, darkMode = false, lang = 'bn' }) => {
  const [timeLeft, setTimeLeft] = useState(() => Math.max(0, targetTimestamp - Date.now()));

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = Math.max(0, targetTimestamp - Date.now());
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        window.location.reload();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [targetTimestamp]);

  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  const pad = (n) => String(n).padStart(2, '0');

  return (
    <div className={`fixed inset-0 z-[999999] flex flex-col items-center justify-between p-6 select-none overflow-y-auto ${
      darkMode ? 'bg-[#090b14] text-white' : 'bg-gradient-to-b from-[#f8fafc] via-[#f5f3ff] to-[#ede9fe] text-slate-800'
    }`}>
      {/* Background ambient radial gradients */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[380px] h-[300px] rounded-full blur-3xl opacity-60"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.28) 0%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-[340px] h-[240px] rounded-full blur-3xl opacity-50"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)' }}
      />

      {/* Top Header / Brand */}
      <div className="relative z-10 w-full flex items-center justify-between pt-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 p-0.5 shadow-md shadow-violet-500/20 flex items-center justify-center">
            <span className="text-[13px] font-black text-white">TP</span>
          </div>
          <div>
            <span className="font-extrabold text-[15px] tracking-tight block leading-tight">Trust Pay</span>
            <span className="text-[9.5px] font-bold text-violet-500 tracking-wider uppercase block">System Upgrade</span>
          </div>
        </div>

        <div className="px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 bg-violet-500/10 border border-violet-500/25 text-violet-600 dark:text-violet-300">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping inline-block" />
          <span>রুটিন মেইনটেন্যান্স</span>
        </div>
      </div>

      {/* Center Hero Card & Live Countdown */}
      <div className="relative z-10 w-full max-w-sm my-auto flex flex-col items-center text-center py-4">
        {/* Animated 3D Pedestal Icon */}
        <div className="relative mb-5">
          <div className="w-24 h-24 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-violet-200/60 dark:border-violet-500/30 shadow-[0_16px_36px_-10px_rgba(124,58,237,0.35)] backdrop-blur-xl flex items-center justify-center relative z-10">
            <Clock size={42} className="text-violet-600 dark:text-violet-400 animate-pulse" />
          </div>
          <div className="absolute inset-0 rounded-3xl bg-violet-500/25 blur-xl -z-10 animate-pulse" />
        </div>

        <h1 className="text-[22px] font-black tracking-tight leading-snug">
          আজ দুপুর ০১:০০ টায়<br />সেবা পুনরায় চালু হবে
        </h1>
        <p className={`text-[12px] mt-2 font-medium leading-relaxed max-w-[290px] ${
          darkMode ? 'text-slate-300' : 'text-slate-600'
        }`}>
          দৈনিক সার্ভার পারফরম্যান্স ও ডাটাবেজ অপ্টিমাইজেশন চলছে। কাউন্টডাউন শেষ হওয়ার সাথে সাথে অ্যাপ স্বয়ংক্রিয়ভাবে ওপেন হয়ে যাবে।
        </p>

        {/* 3D Flip Countdown Timer Cards */}
        <div className="grid grid-cols-3 gap-3 w-full mt-6 px-1">
          {/* Hours Card */}
          <div className={`flex flex-col items-center justify-center p-3 rounded-2xl border backdrop-blur-md shadow-sm ${
            darkMode ? 'bg-slate-900/70 border-violet-500/25' : 'bg-white/85 border-violet-200/80'
          }`}>
            <span className="font-mono text-[32px] font-black tracking-tight leading-none text-violet-600 dark:text-violet-400">
              {pad(hours)}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wider mt-1.5 ${
              darkMode ? 'text-slate-400' : 'text-slate-500'
            }`}>
              ঘণ্টা (Hours)
            </span>
          </div>

          {/* Minutes Card */}
          <div className={`flex flex-col items-center justify-center p-3 rounded-2xl border backdrop-blur-md shadow-sm ${
            darkMode ? 'bg-slate-900/70 border-violet-500/25' : 'bg-white/85 border-violet-200/80'
          }`}>
            <span className="font-mono text-[32px] font-black tracking-tight leading-none text-indigo-600 dark:text-indigo-400">
              {pad(minutes)}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wider mt-1.5 ${
              darkMode ? 'text-slate-400' : 'text-slate-500'
            }`}>
              মিনিট (Mins)
            </span>
          </div>

          {/* Seconds Card */}
          <div className={`flex flex-col items-center justify-center p-3 rounded-2xl border backdrop-blur-md shadow-sm ${
            darkMode ? 'bg-slate-900/70 border-violet-500/25' : 'bg-white/85 border-violet-200/80'
          }`}>
            <span className="font-mono text-[32px] font-black tracking-tight leading-none text-fuchsia-600 dark:text-fuchsia-400">
              {pad(seconds)}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wider mt-1.5 ${
              darkMode ? 'text-slate-400' : 'text-slate-500'
            }`}>
              সেকেন্ড (Secs)
            </span>
          </div>
        </div>

        {/* Scheduled Info Pill */}
        <div className={`mt-5 flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-semibold border ${
          darkMode ? 'bg-slate-900/50 border-slate-800 text-slate-300' : 'bg-white/70 border-slate-200 text-slate-600'
        }`}>
          <Calendar size={13} className="text-violet-500 shrink-0" />
          <span>নির্ধারিত সময়: ১ নভেম্বর, দুপুর ০১:০০ টা (BST)</span>
        </div>
      </div>

      {/* Bottom Actions & Channel Link */}
      <div className="relative z-10 w-full max-w-sm flex flex-col gap-2.5 pb-2">
        <a
          href="https://t.me/bd_trust_pay_payout"
          target="_blank"
          rel="noreferrer"
          className="w-full h-12 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 text-white font-bold text-[13.5px] flex items-center justify-center gap-2 shadow-md shadow-violet-500/25 active:scale-[0.98] transition cursor-pointer"
        >
          <Send size={15} />
          <span>অফিশিয়াল নোটিশ চ্যানেল (@bd_trust_pay_payout)</span>
        </a>

        {isAdmin && (
          <button
            type="button"
            onClick={onAdminBypass}
            className={`w-full py-2 rounded-xl text-[11.5px] font-bold border transition ${
              darkMode ? 'bg-slate-800/60 border-slate-700 text-amber-300 hover:bg-slate-800' : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
            }`}
          >
            🛡️ অ্যাডমিন অ্যাক্সেস: অ্যাপ প্রিভিউ করুন (Bypass)
          </button>
        )}
      </div>
    </div>
  );
};

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
  const [addMoneyStep, setAddMoneyStep] = useState(1);
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
      const parsedBuy = cachedBuy ? JSON.parse(cachedBuy) : null;
      const parsedSell = cachedSell ? JSON.parse(cachedSell) : null;
      const isBuyFresh = parsedBuy && (Date.now() - (parsedBuy.timestamp || 0) < 30 * 1000) && parsedBuy.rates?.GRAM;
      const isSellFresh = parsedSell && (Date.now() - (parsedSell.timestamp || 0) < 30 * 1000) && parsedSell.rates?.GRAM;
      return {
        buyRates: isBuyFresh ? parsedBuy.rates : { GRAM: 160, USDT: 130 },
        sellRates: isSellFresh ? parsedSell.rates : { GRAM: 120, USDT: 118 }
      };
    } catch(e) {
      return { buyRates: { GRAM: 160, USDT: 130 }, sellRates: { GRAM: 120, USDT: 118 } };
    }
  });

  useEffect(() => {
    let isMounted = true;
    const pollRates = () => {
      fetchMarketRates().then(data => {
        if (!isMounted || !data) return;
        const nextBuy = {
          GRAM: Number(data.buyRates?.GRAM) || 160,
          USDT: Number(data.buyRates?.USDT) || 130
        };
        const nextSell = {
          GRAM: Number(data.sellRates?.GRAM) || 120,
          USDT: Number(data.sellRates?.USDT) || 118
        };
        setAppMarketRates({
          buyRates: nextBuy,
          sellRates: nextSell
        });
        try {
          localStorage.setItem('maruf_market_rates', JSON.stringify({ rates: nextBuy, timestamp: Date.now() }));
          localStorage.setItem('maruf_buyer_rates', JSON.stringify({ rates: { ...nextBuy, sellRates: nextSell }, timestamp: Date.now() }));
          localStorage.setItem('maruf_seller_rates', JSON.stringify({ rates: nextSell, timestamp: Date.now() }));
        } catch (_) {}
      }).catch(() => {});
    };
    pollRates();
    const interval = setInterval(pollRates, 120000); // 2 minutes relaxed interval (rates are fixed)
    return () => { isMounted = false; clearInterval(interval); };
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  const [fiatWallet, setFiatWallet] = useState(null);
  const [fiatWithdrawPending, setFiatWithdrawPending] = useState(null);
  const [pendingReceivedTransfer, setPendingReceivedTransfer] = useState(null);
  const [mbsId, setMbsId] = useState(null);
  const [user, setUser] = useState(() => resolveTelegramUser());
  const [twoStepEnabled, setTwoStepEnabled] = useState(() => {
    try {
      const uid = resolveTelegramUser()?.id;
      return uid ? localStorage.getItem(`tp_twostep_enabled_${uid}`) === 'true' : false;
    } catch (_) {
      return false;
    }
  });
  const [twoStepLength, setTwoStepLength] = useState(() => {
    try {
      const uid = resolveTelegramUser()?.id;
      const savedLen = uid ? Number(localStorage.getItem(`tp_twostep_len_${uid}`)) : 4;
      return savedLen === 6 ? 6 : 4;
    } catch (_) {
      return 4;
    }
  });
  const hasShownWdNoticeOnHomeRef = useRef(null);
  const hasPlayedReceivedSoundRef = useRef(null);

  const handleDismissReceivedTransfer = () => {
    const targetTrf = pendingReceivedTransfer;
    if (targetTrf?.transferId) {
      try {
        localStorage.setItem(`tp_seen_trf_${targetTrf.transferId}`, 'dismissed');
      } catch (_) {}
    }
    playAppSound('confirm');
    setPendingReceivedTransfer(null);
    const uid = user?.id || activeUserIdRef.current;
    if (uid && Number(uid) !== GUEST_ID) {
      acknowledgeReceivedTransfer(uid, targetTrf?.transferId || '');
    }
  };

  const getWithdrawNoticeKey = (wd) => {
    if (!wd || (wd.status !== 'completed' && wd.status !== 'rejected')) return null;
    return `tp_seen_wd_${wd.id || wd.serial || '0'}_${wd.status}_${wd.completedAt || wd.rejectedAt || '0'}`;
  };

  const handleDismissWithdrawNotice = (wdObj) => {
    const targetWd = wdObj || fiatWithdrawPending;
    const key = getWithdrawNoticeKey(targetWd);
    if (key) {
      try { localStorage.setItem(key, 'dismissed'); } catch (_) {}
    }
    hasShownWdNoticeOnHomeRef.current = null;
    setFiatWithdrawPending(null);
    const uid = user?.id || activeUserIdRef.current;
    if (uid && Number(uid) !== GUEST_ID) {
      acknowledgeWithdrawNotice(uid);
    }
  };

  // One-Time Show for Completed / Rejected Withdrawal Banner:
  // While on HomePage, mark it as shown; as soon as user navigates to any other tab, dismiss it permanently!
  useEffect(() => {
    const key = getWithdrawNoticeKey(fiatWithdrawPending);
    if (!key) {
      hasShownWdNoticeOnHomeRef.current = null;
      return;
    }
    if (activeTab === 'home') {
      hasShownWdNoticeOnHomeRef.current = key;
    } else if (hasShownWdNoticeOnHomeRef.current === key) {
      handleDismissWithdrawNotice(fiatWithdrawPending);
    }
  }, [activeTab, fiatWithdrawPending]);
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
  const [balance, setBalance] = useState(() => {
    try {
      const u = resolveTelegramUser();
      const uid = (u?.id && Number(u.id) !== GUEST_ID) ? u.id : localStorage.getItem('tp_active_uid');
      if (uid && Number(uid) !== GUEST_ID) {
        const cached = localStorage.getItem('tp_user_balance_' + uid);
        if (cached !== null && cached !== undefined) {
          const num = Number(cached);
          if (Number.isFinite(num)) return num;
        }
      }
    } catch (_) {}
    return 0;
  });
  const [balanceLoaded, setBalanceLoaded] = useState(true);
  const [giveawayHoldBdt, setGiveawayHoldBdt] = useState(0);
  const [giveawayCache, setGiveawayCache] = useState(null);
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
  const giveawayPreloadedRef = useRef(null);

  const loadData = async (rawUserId) => {
    const resolved = resolveTelegramUser();
    let targetId = (rawUserId && Number(rawUserId) !== GUEST_ID)
      ? rawUserId
      : (resolved?.id && Number(resolved.id) !== GUEST_ID ? resolved.id : (activeUserIdRef.current || GUEST_ID));

    // Never fetch or overwrite with guest data if we have an active real user
    if (Number(targetId) === GUEST_ID) {
      const savedUid = localStorage.getItem('tp_active_uid');
      if (savedUid && Number(savedUid) !== GUEST_ID) {
        targetId = Number(savedUid);
      } else {
        return; // Don't wipe real balance with 0 for guest
      }
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
        if (targetId && Number(targetId) !== GUEST_ID) {
          try {
            localStorage.setItem('tp_user_balance_' + targetId, String(finalBal));
          } catch (_) {}
        }
        setBalance(finalBal);
        setBalanceLoaded(true);
      }
      setGiveawayHoldBdt(roundBdt(data.giveawayHoldBdt || 0));
      // Preload giveaway status ONCE per session so opening Giveaway tab is 0ms instant without read spam
      if (giveawayPreloadedRef.current !== String(targetId)) {
        giveawayPreloadedRef.current = String(targetId);
        fetchGiveawayStatus(targetId).then((gwRes) => {
          if (gwRes) setGiveawayCache({ ...gwRes, _cachedAt: Date.now() });
        }).catch(() => {});
      }
      setFiatWallet(data.fiatWallet || null);
      const incomingWd = data.fiatWithdrawPending || null;
      if (incomingWd && (incomingWd.status === 'completed' || incomingWd.status === 'rejected')) {
        const wdKey = getWithdrawNoticeKey(incomingWd);
        let alreadyDismissed = false;
        try {
          alreadyDismissed = Boolean(wdKey && localStorage.getItem(wdKey) === 'dismissed');
        } catch (_) {}
        if (alreadyDismissed) {
          setFiatWithdrawPending(null);
          acknowledgeWithdrawNotice(targetId);
        } else {
          setFiatWithdrawPending(incomingWd);
        }
      } else {
        setFiatWithdrawPending(incomingWd);
      }
      const incomingTrf = data.pendingReceivedTransfer || null;
      if (incomingTrf && incomingTrf.transferId) {
        let seenTrf = false;
        try {
          seenTrf = localStorage.getItem(`tp_seen_trf_${incomingTrf.transferId}`) === 'dismissed';
        } catch (_) {}
        if (seenTrf) {
          setPendingReceivedTransfer(null);
          acknowledgeReceivedTransfer(targetId, incomingTrf.transferId);
        } else {
          setPendingReceivedTransfer(incomingTrf);
          if (hasPlayedReceivedSoundRef.current !== incomingTrf.transferId) {
            hasPlayedReceivedSoundRef.current = incomingTrf.transferId;
            playAppSound('success');
          }
        }
      } else {
        setPendingReceivedTransfer(null);
      }
      if (data.mbsId) setMbsId(data.mbsId);
      const nextTwoStepEnabled = Boolean(data.twoStepEnabled);
      const nextTwoStepLen = Number(data.twoStepLength) === 6 ? 6 : 4;
      setTwoStepEnabled(nextTwoStepEnabled);
      setTwoStepLength(nextTwoStepLen);
      try {
        localStorage.setItem(`tp_twostep_enabled_${targetId}`, String(nextTwoStepEnabled));
        localStorage.setItem(`tp_twostep_len_${targetId}`, String(nextTwoStepLen));
      } catch (_) {}
      if (data.photoUrl) {
        setUser(prev => (prev && !prev.photo_url ? { ...prev, photo_url: data.photoUrl } : prev));
      }
      setAntiAbuseData({
        hasDepositWithoutTrade: Boolean(data.hasDepositWithoutTrade),
        hasSellBalance: Boolean(data.hasSellBalance),
        spentSinceLastDeposit: parseFloat(data.spentSinceLastDeposit) || 0
      });
    } catch (e) {
      console.warn("loadData error:", e);
    }
  };

  window.reloadGlobalData = () => {
    loadData(activeUserIdRef.current);
    if (typeof window !== 'undefined' && typeof window.__reloadHomeHistory === 'function') {
      window.__reloadHomeHistory();
    }
  };

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
    return () => { alive = false; };
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

    const runInit = () => {
      const resolvedUser = resolveTelegramUser();
      setUser(resolvedUser);
      activeUserIdRef.current = resolvedUser.id;
      if (resolvedUser.id && Number(resolvedUser.id) !== GUEST_ID) {
        loadData(resolvedUser.id);
        checkCommunityJoinStatus(resolvedUser.id);
        syncUserProfile({
          userId: resolvedUser.id,
          username: resolvedUser.username || '',
          firstName: resolvedUser.first_name || '',
          lastName: resolvedUser.last_name || '',
          photoUrl: resolvedUser.photo_url || ''
        });
      }
    };

    runInit();

    // Re-verify when Telegram WebApp SDK finishes async bridge handshake
    const checkDelays = [60, 180, 400, 800];
    const timers = checkDelays.map(delay =>
      setTimeout(() => {
        const freshUser = resolveTelegramUser();
        if (freshUser && Number(freshUser.id) !== GUEST_ID) {
          if (Number(freshUser.id) !== Number(activeUserIdRef.current)) {
            runInit();
          }
        }
      }, delay)
    );

    return () => {
      timers.forEach(clearTimeout);
    };
  }, []);

  const manifestUrl = 'https://trustpay-bot.com/app/tonconnect-manifest.json';



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
        twaReturnUrl: 'https://t.me/maruf_teach_bot',
        modals: [],
        notifications: []
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
      <div className={`min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] ${activeTab === 'giveaway' ? 'pb-2' : 'pb-28'} relative overflow-x-hidden font-sans selection:bg-[var(--color-brand)]/20 transition-colors duration-200`}>
        <PageBackgroundFlowers page={activeTab} darkMode={darkMode} />
        
        <div className={`relative z-10 ${activeTab === 'giveaway' ? 'px-3 pt-1 pb-1' : 'p-4'} max-w-md mx-auto`}>
          {/* Header - shown only on primary tabs */}
          {activeTab !== 'buy' && activeTab !== 'sell' && activeTab !== 'withdraw' && activeTab !== 'notifications' && activeTab !== 'claim' && activeTab !== 'history'  && activeTab !== 'transfer' && activeTab !== 'two-step' && activeTab !== 'support'  && (
            <div id="main-app-header" className={`flex justify-between items-center ${activeTab === 'giveaway' ? 'mb-2.5 pt-0.5' : 'mb-5 pt-2'} transition-all duration-300`}>
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

          {/* PERSISTENT MAIN TABS (Pre-laid-out & pre-decoded for 0ms butter-smooth navbar switching) */}
          
          <div className={activeTab === 'home' ? 'block' : 'fixed top-0 left-0 w-full h-0 overflow-hidden opacity-0 pointer-events-none -z-50 select-none'}>
              <HomePage 
                  onGoToLeaderboard={() => setActiveTab('leaderboard')}
                  isHomeActive={activeTab === 'home'}
                  giveawayHoldBdt={giveawayHoldBdt}
                  onOpenGiveaway={() => setActiveTab('giveaway')}
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
                  onGoToHistory={() => setActiveTab('history')}
                  onGoToTransfer={() => setActiveTab('transfer')}
                  onDismissWithdrawNotice={() => handleDismissWithdrawNotice(fiatWithdrawPending)}
              />
          </div>

          <div className={activeTab === 'add-money' ? 'block' : 'fixed top-0 left-0 w-full h-0 overflow-hidden opacity-0 pointer-events-none -z-50 select-none'}>
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
                      setIsModalOpen={setIsModalOpen}
                      onStepChange={setAddMoneyStep}
                      onDone={() => {
                          setAddMoneyStep(1);
                          setIsModalOpen(false);
                          setActiveTab('home');
                      }}
                      onGoToBuyCrypto={() => {
                          setAddMoneyStep(1);
                          setIsModalOpen(false);
                          setActiveTab('buy');
                      }}
                      reloadData={() => loadData(user?.id || 123456789)}
                  />
              )}
          </div>

          <div className={activeTab === 'profile' ? 'block' : 'fixed top-0 left-0 w-full h-0 overflow-hidden opacity-0 pointer-events-none -z-50 select-none'}>
              <ProfilePage 
                  onGoToLeaderboard={() => setActiveTab('leaderboard')}
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
                  twoStepEnabled={twoStepEnabled}
                  twoStepLength={twoStepLength}
                  onGoToTwoStep={() => setActiveTab('two-step')}
                  onGoToSupport={() => setActiveTab('support')}
                  onGoToTransfer={() => setActiveTab('transfer')}
                  onGoToWithdraw={() => setActiveTab('withdraw')} 
                  onGoToHistory={() => setActiveTab('history')} 
                  onGoToReferral={() => setActiveTab('referral')}
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
                      twoStepEnabled={twoStepEnabled}
                      twoStepLength={twoStepLength}
                      onBack={() => { setActiveTab('home'); window.__reloadHomeHistory?.(); }}
                      reloadData={() => { loadData(user?.id || 123456789); window.__reloadHomeHistory?.(); }} 
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
                      onBack={() => { setActiveTab('home'); window.__reloadHomeHistory?.(); }}
                      onDone={() => { setActiveTab('home'); window.__reloadHomeHistory?.(); }} 
                      onGoToWithdraw={() => setActiveTab('withdraw')} 
                      reloadData={() => { loadData(user?.id || 123456789); window.__reloadHomeHistory?.(); }} 
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
                      darkMode={darkMode}
                      twoStepEnabled={twoStepEnabled}
                      twoStepLength={twoStepLength}
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
          {activeTab === 'transfer' && (
              restrictionInfo?.isRestricted ? (
                  <RestrictedNoticeScreen 
                      onBack={() => setActiveTab('home')}
                      featureName={lang === 'bn' ? 'মানি ট্রান্সফার (Transfer Money)' : 'Transfer Money'}
                      reason={restrictionInfo.reason}
                      restrictedUntil={restrictionInfo.restrictedUntil}
                      lang={lang}
                  />
              ) : (
                  <TransferMoneyPage
                      user={user}
                      balance={balance}
                      mbsId={mbsId}
                      twoStepEnabled={twoStepEnabled}
                      twoStepLength={twoStepLength}
                      onGoToTwoStep={() => setActiveTab('two-step')}
                      onBack={() => setActiveTab('home')}
                      reloadData={() => loadData(user?.id || 123456789)}
                      darkMode={darkMode}
                      lang={lang}
                  />
              )
          )}
          {activeTab === 'two-step' && (
              <TwoStepPage
                  user={user}
                  twoStepEnabled={twoStepEnabled}
                  twoStepLength={twoStepLength}
                  onUpdateTwoStepState={(enabled, len) => {
                      const cleanLen = Number(len) === 6 ? 6 : 4;
                      setTwoStepEnabled(Boolean(enabled));
                      setTwoStepLength(cleanLen);
                      const uid = user?.id || 123456789;
                      try {
                        localStorage.setItem(`tp_twostep_enabled_${uid}`, String(Boolean(enabled)));
                        localStorage.setItem(`tp_twostep_len_${uid}`, String(cleanLen));
                      } catch (_) {}
                      loadData(uid);
                  }}
                  onBack={() => setActiveTab('profile')}
                  darkMode={darkMode}
                  lang={lang}
              />
          )}
          {activeTab === 'support' && (
              <SupportPage
                  user={user}
                  onBack={() => setActiveTab('profile')}
                  darkMode={darkMode}
                  lang={lang}
              />
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
          {activeTab === 'giveaway' && (
              <GiveawayPage
                  cachedData={giveawayCache}
                  onUpdateCache={setGiveawayCache}
                  onJoinedBalanceUpdate={(newBal, newHold) => {
                      if (Number.isFinite(Number(newBal))) {
                          const balNum = Number(newBal);
                          setBalance(balNum);
                          try {
                              if (user?.id) localStorage.setItem('tp_user_balance_' + user.id, String(balNum));
                          } catch (_) {}
                      }
                      if (Number.isFinite(Number(newHold))) {
                          setGiveawayHoldBdt(roundBdt(newHold));
                      }
                  }}
                  user={user}
                  balance={balance}
                  darkMode={darkMode}
                  lang={lang}
                  onBack={() => setActiveTab('home')}
                  onGoToAddMoney={() => setActiveTab('add-money')}
                  onGoToReferral={() => setActiveTab('referral')}
                  onGoToBuyCrypto={() => setActiveTab('buy')}
                  onGoToSell={() => setActiveTab('sell')}
                  reloadData={() => loadData(user?.id || 123456789)}
              />
          )}
        </div>

        {/* PREMIUM EXECUTIVE SLIDING BOTTOM NAVIGATION */}
        {!isModalOpen && activeTab !== 'buy' && activeTab !== 'sell' && activeTab !== 'claim' && activeTab !== 'history' && activeTab !== 'withdraw' && activeTab !== 'referral'  && activeTab !== 'notifications' && activeTab !== 'transfer' && activeTab !== 'two-step' && activeTab !== 'support' && activeTab !== 'giveaway' && (() => {
            const navTabs = ['home', 'add-money', 'profile'];
            const activeIndex = navTabs.indexOf(activeTab);
            const isNavHidden = isKeyboardVisible || (activeTab === 'add-money' && addMoneyStep === 2);
            return (
            <div className={`fixed bottom-0 left-0 w-full z-50 flex justify-center pb-[env(safe-area-inset-bottom,16px)] px-4 mb-4 pointer-events-none transition-all duration-300 ease-out will-change-transform ${isNavHidden ? 'opacity-0 translate-y-32 pointer-events-none' : 'opacity-100 translate-y-0'}`}>
                <div className={`w-full max-w-[360px] backdrop-blur-md rounded-[28px] relative flex justify-between items-center p-1.5 pointer-events-auto overflow-hidden transition-colors duration-300 ${
                  darkMode 
                    ? 'bg-slate-900/95 border border-slate-800 shadow-[0_12px_36px_rgba(0,0,0,0.5)] text-white' 
                    : 'bg-white/98 border border-slate-200/80 shadow-[0_12px_36px_rgba(15,23,42,0.08)] text-slate-900'
                }`}>
                    
                    {/* Delicate floral line art in navigation bar corner */}
                    <svg 
                      className={`absolute -right-2 -top-2 w-14 h-14 pointer-events-none select-none ${darkMode ? 'text-purple-400/10' : 'text-indigo-900/10'}`} 
                      viewBox="0 0 100 100" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M50 85 C35 70, 20 50, 50 15 C80 50, 65 70, 50 85 Z" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M50 85 C25 80, 5 60, 25 35 C40 50, 48 70, 50 85 Z" stroke="currentColor" strokeWidth="1.2" />
                      <path d="M50 85 C75 80, 95 60, 75 35 C60 50, 52 70, 50 85 Z" stroke="currentColor" strokeWidth="1.2" />
                      <circle cx="50" cy="15" r="2" fill="currentColor" />
                    </svg>

                    {/* SMOOTH GPU-ACCELERATED SLIDING ACTIVE PILL */}
                    {activeIndex !== -1 && (
                      <div 
                        className={`absolute top-1.5 bottom-1.5 left-1.5 rounded-[20px] transition-transform duration-300 ease-out will-change-transform pointer-events-none ${
                          darkMode 
                            ? 'bg-purple-950/70 border border-purple-500/30 shadow-[0_0_15px_rgba(147,51,234,0.2)]' 
                            : 'bg-indigo-50 border border-indigo-100/90 shadow-xs'
                        }`}
                        style={{
                          width: 'calc((100% - 12px) / 3)',
                          transform: `translate3d(${activeIndex * 100}%, 0, 0)`,
                        }}
                      >
                        {/* Micro floral line art in active pill */}
                        <svg 
                          className={`absolute -right-1 -bottom-1 w-8 h-8 pointer-events-none select-none ${darkMode ? 'text-purple-400/20' : 'text-indigo-900/15'}`} 
                          viewBox="0 0 100 100" 
                          fill="none" 
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M50 85 C35 70, 20 50, 50 15 C80 50, 65 70, 50 85 Z" stroke="currentColor" strokeWidth="2" />
                          <path d="M50 85 C25 80, 5 60, 25 35 C40 50, 48 70, 50 85 Z" stroke="currentColor" strokeWidth="1.5" />
                          <path d="M50 85 C75 80, 95 60, 75 35 C60 50, 52 70, 50 85 Z" stroke="currentColor" strokeWidth="1.5" />
                        </svg>
                        <div className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-3.5 h-1 rounded-full ${darkMode ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]' : 'bg-indigo-600'}`} />
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
                        className="relative flex-1 flex flex-col items-center justify-center py-2 rounded-[20px] transition-transform duration-200 group active:scale-95 z-10 cursor-pointer"
                    >
                        <div className="flex flex-col items-center justify-center">
                            <Home size={20} strokeWidth={activeTab === 'home' ? 2.5 : 2} className={`mb-1 transition-transform duration-200 ${
                              activeTab === 'home' 
                                ? (darkMode ? 'text-purple-400 scale-105' : 'text-indigo-600 scale-105') 
                                : (darkMode ? 'text-slate-500 group-hover:text-slate-300' : 'text-slate-400 group-hover:text-slate-600')
                            }`} />
                            <span className={`text-[10px] tracking-wide transition-colors duration-200 ${
                              activeTab === 'home' 
                                ? (darkMode ? 'text-purple-300 font-black' : 'text-indigo-950 font-black') 
                                : (darkMode ? 'text-slate-500 font-bold group-hover:text-slate-300' : 'text-slate-400 font-bold group-hover:text-slate-600')
                            }`}>{t.home}</span>
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
                        className="relative flex-1 flex flex-col items-center justify-center py-2 rounded-[20px] transition-transform duration-200 group active:scale-95 z-10 cursor-pointer"
                    >
                        <div className="flex flex-col items-center justify-center">
                            <PlusCircle size={20} strokeWidth={activeTab === 'add-money' ? 2.5 : 2} className={`mb-1 transition-transform duration-200 ${
                              activeTab === 'add-money' 
                                ? (darkMode ? 'text-purple-400 scale-105' : 'text-indigo-600 scale-105') 
                                : (darkMode ? 'text-slate-500 group-hover:text-slate-300' : 'text-slate-400 group-hover:text-slate-600')
                            }`} />
                            <span className={`text-[10px] tracking-wide transition-colors duration-200 ${
                              activeTab === 'add-money' 
                                ? (darkMode ? 'text-purple-300 font-black' : 'text-indigo-950 font-black') 
                                : (darkMode ? 'text-slate-500 font-bold group-hover:text-slate-300' : 'text-slate-400 font-bold group-hover:text-slate-600')
                            }`}>{t.addMoney}</span>
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
                        className="relative flex-1 flex flex-col items-center justify-center py-2 rounded-[20px] transition-transform duration-200 group active:scale-95 z-10 cursor-pointer"
                    >
                        <div className="flex flex-col items-center justify-center">
                            <User size={20} strokeWidth={activeTab === 'profile' ? 2.5 : 2} className={`mb-1 transition-transform duration-200 ${
                              activeTab === 'profile' 
                                ? (darkMode ? 'text-purple-400 scale-105' : 'text-indigo-600 scale-105') 
                                : (darkMode ? 'text-slate-500 group-hover:text-slate-300' : 'text-slate-400 group-hover:text-slate-600')
                            }`} />
                            <span className={`text-[10px] tracking-wide transition-colors duration-200 ${
                              activeTab === 'profile' 
                                ? (darkMode ? 'text-purple-300 font-black' : 'text-indigo-950 font-black') 
                                : (darkMode ? 'text-slate-500 font-bold group-hover:text-slate-300' : 'text-slate-400 font-bold group-hover:text-slate-600')
                            }`}>{t.profile}</span>
                        </div>
                    </button>
                </div>
            </div>
            );
        })()}
        </div>

        {/* ONE-TIME ANIMATED MONEY RECEIVED POPUP CARD */}
        <MoneyReceivedPopupModal
          transfer={pendingReceivedTransfer}
          onDismiss={handleDismissReceivedTransfer}
          lang={lang}
          darkMode={darkMode}
        />

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
    <circle cx="16" cy="16" r="16" fill="#26A17B" />
    <path fill="#FFFFFF" d="M17.922 17.383v-.002c-.11.008-.677.042-1.942.042-1.01 0-1.721-.03-1.971-.042v.003c-3.888-.171-6.79-.848-6.79-1.658 0-.809 2.902-1.486 6.79-1.66v2.644c.254.018.982.061 1.988.061 1.207 0 1.812-.05 1.925-.06v-2.643c3.88.173 6.775.85 6.775 1.658 0 .81-2.895 1.485-6.775 1.657m0-3.59v-2.366h5.414V7.819H8.595v3.608h5.414v2.365c-4.4.202-7.709 1.074-7.709 2.118 0 1.044 3.309 1.915 7.709 2.118v7.582h3.913v-7.584c4.393-.202 7.694-1.073 7.694-2.116 0-1.043-3.301-1.914-7.694-2.117"/>
  </svg>
);

const GramTokenLogo = ({ size = 36, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shrink-0 ${className}`}>
    <circle cx="28" cy="28" r="28" fill="#1E2026" />
    <circle cx="28" cy="28" r="27.2" stroke="white" strokeOpacity="0.16" strokeWidth="1.2" />
    <path d="M37.5603 15.6277H18.4386C14.9228 15.6277 12.6944 19.4202 14.4632 22.4861L26.2644 42.9409C27.0345 44.2765 28.9644 44.2765 29.7345 42.9409L41.5381 22.4861C43.3045 19.4251 41.0761 15.6277 37.5627 15.6277H37.5603ZM26.2548 36.8068L23.6847 31.8327L17.4833 20.7414C17.0742 20.0315 17.5795 19.1218 18.4362 19.1218H26.2524V36.8092L26.2548 36.8068ZM38.5108 20.739L32.3118 31.8351L29.7417 36.8068V19.1194H37.5579C38.4146 19.1194 38.9199 20.0291 38.5108 20.739Z" fill="white" />
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
  const gramRate = isBuy ? (liveRates?.GRAM || 160) : (sellRates?.GRAM || 120);
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
  isHomeActive = false,
  giveawayHoldBdt = 0,
  onOpenGiveaway,
  user, 
  mbsId,
  fiatWithdrawPending, 
  onGoToClaim, 
  onOpenBuyCrypto, 
  onGoToSell, 
  onGoToAddMoney, 
  onGoToHistory,
  onGoToTransfer,
  onDismissWithdrawNotice,
  onToggleDarkMode,
  setIsModalOpen,
  darkMode = false, 
  lang = 'bn', 
  t = {} 
}) {
  const [showBalance, setShowBalance] = useState(() => {
    try {
      const saved = localStorage.getItem('trustpay_show_balance');
      return saved === null ? true : saved !== 'false';
    } catch (_) {
      return true;
    }
  });

  const toggleShowBalance = () => {
    playAppSound('tap');
    setShowBalance(prev => {
      const next = !prev;
      try {
        localStorage.setItem('trustpay_show_balance', String(next));
      } catch (_) {}
      return next;
    });
  };
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
    return { USDT: 130, GRAM: 160, sellRates: { USDT: 118, GRAM: 120 } };
  });

  useEffect(() => {
    let isMounted = true;
    fetchMarketRates().then(data => {
      if (!isMounted || !data?.buyRates) return;
      setMarketRates({
        USDT: Number(data.buyRates.USDT) || 130,
        GRAM: Number(data.buyRates.GRAM) || 160,
        realGramUsdt: Number(data.realGramUsdt) || 1.23,
        sellRates: {
          USDT: Number(data.sellRates?.USDT) || 118,
          GRAM: Number(data.sellRates?.GRAM) || 120
        }
      });
    }).catch(() => {});
    return () => { isMounted = false; };
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

  const fetchRecent = (forceFresh = false) => {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname.includes('192.168');
    const API_URL = isLocal ? 'http://localhost:3000' : 'https://trustpay-bot.com';
    const freshQuery = forceFresh ? '&_nocache=1' : '';
    fetch(`${API_URL}/api/miniapp/history/${historyUserId}?_t=${Date.now()}${freshQuery}`)
      .then(r => r.json())
      .then(data => {
        if (!data?.success || !Array.isArray(data.history)) return;
        setRecentHistory(data.history);
        try { localStorage.setItem(historyCacheKey, JSON.stringify(data.history)); } catch (_) {}
      })
      .catch(() => {});
  };

  useEffect(() => {
    window.__reloadHomeHistory = (force = true) => fetchRecent(force);
    fetchRecent(true);
    return () => {
      if (window.__reloadHomeHistory) {
        window.__reloadHomeHistory = null;
      }
    };
  }, [historyUserId]);

  const getTxTs = (tx) => tx?.timestamp?._seconds ? tx.timestamp._seconds * 1000
    : (typeof tx?.timestamp === 'number' ? tx.timestamp : (tx?.timestamp ? new Date(tx.timestamp).getTime() : 0));

  const recentTx = [...recentHistory].sort((a, b) => getTxTs(b) - getTxTs(a)).slice(0, 4);

  const getTxView = (tx) => {
    const type = tx.type;
    const status = String(tx.status || 'pending').toLowerCase();
    const rejected = status === 'rejected' || status === 'failed' || status === 'cancelled';
    let isCredit = false, amount = 0, title = '', subtitle = '', Icon = ArrowRightLeft, iconWrap = '';
    if (type === 'add_money') {
      isCredit = true; amount = parseFloat(tx.amount || tx.totalBdt) || 0;
      title = lang === 'bn' ? 'টাকা যোগ' : 'Deposit';
      subtitle = tx.paymentMethod || 'bKash / Nagad';
      Icon = ArrowDownLeft; iconWrap = 'bg-emerald-500/10 text-emerald-500';
    } else if (type === 'sell') {
      amount = parseFloat(tx.estimatedTk || tx.amount) || 0;
      if (rejected) {
        isCredit = false;
        title = lang === 'bn' ? `${tx.asset || 'TON'} বিক্রয় বাতিল` : `Sold ${tx.asset || 'TON'} (Cancelled)`;
        subtitle = `${tx.amount} ${tx.asset || 'TON'}`;
        Icon = ArrowUpRight; iconWrap = 'bg-rose-500/10 text-rose-500';
      } else {
        isCredit = true;
        title = lang === 'bn' ? `${tx.asset || 'TON'} বিক্রয়` : `Sold ${tx.asset || 'TON'}`;
        subtitle = `${tx.amount} ${tx.asset || 'TON'}`;
        Icon = ArrowUpRight; iconWrap = 'bg-violet-500/10 text-violet-500';
      }
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
    } else if (type === 'transfer_sent') {
      amount = parseFloat(tx.amount) || 0; isCredit = false;
      title = lang === 'bn' ? 'মানি ট্রান্সফার' : 'Money Sent';
      subtitle = `To: ${tx.counterpartyName || tx.counterpartyMbsId || 'User'}`;
      Icon = Send; iconWrap = 'bg-purple-500/10 text-purple-500';
    } else if (type === 'transfer_received') {
      amount = parseFloat(tx.amount) || 0; isCredit = true;
      title = lang === 'bn' ? 'মানি রিসিভড' : 'Money Received';
      subtitle = `From: ${tx.counterpartyName || tx.counterpartyMbsId || 'User'}`;
      Icon = ArrowDownLeft; iconWrap = 'bg-emerald-500/10 text-emerald-500';
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

  // ---- Quick actions (Replaced History with Transfer Money) ----
  const quickActions = [
    { key: 'deposit', label: lang === 'bn' ? 'ডিপোজিট' : 'Deposit', Icon: PlusCircle, onClick: onGoToAddMoney },
    { key: 'buy', label: lang === 'bn' ? 'ক্রয়' : 'Buy', Icon: Send, onClick: onOpenBuyCrypto },
    { key: 'exchange', label: lang === 'bn' ? 'এক্সচেঞ্জ' : 'Exchange', Icon: ArrowRightLeft, onClick: onGoToSell, active: true },
    { key: 'transfer', label: lang === 'bn' ? 'ট্রান্সফার' : 'Transfer', Icon: Users, onClick: onGoToTransfer || onGoToHistory },
  ];

  // ---- Supported coins (only what the bot trades: GRAM and USDT) ----
  const coins = [
    { symbol: 'USDT', name: 'Tether USD • TRC20 / TON', Logo: TetherLogo, buy: marketRates.USDT || 130, sell: marketRates.sellRates?.USDT || 118 },
    { symbol: 'GRAM', name: 'Gram • The Open Network', Logo: GramTokenLogo, buy: marketRates.GRAM || 160, sell: marketRates.sellRates?.GRAM || 120 },
  ];
  const q = searchQuery.trim().toLowerCase();
  const visibleCoins = q ? coins.filter(c => c.symbol.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)) : coins;

  return (
    <div className="space-y-4 animate-in fade-in duration-300 pb-6">
      
      {/* Pending / Completed / Rejected Withdrawal Notice (One-Time Show for Completed/Rejected) */}
      {fiatWithdrawPending && (
          fiatWithdrawPending.status === 'completed' ? (
              Date.now() - (fiatWithdrawPending.completedAt || Date.now()) < 3 * 60 * 60 * 1000 && (
                  <div className={`p-2.5 rounded-2xl flex items-center justify-between gap-2.5 border ${
                    darkMode ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}>
                      <div className="flex items-center gap-2 min-w-0">
                          <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                          <p className="text-[12px] font-bold truncate">
                              {lang === 'bn' ? 'উইথড্র সফল:' : 'Withdrawal Sent:'} <b>{fiatWithdrawPending.amount} TK</b>
                          </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-500/20 px-2 py-0.5 rounded-full">{t?.completed || 'Success'}</span>
                          {onDismissWithdrawNotice && (
                              <button
                                  type="button"
                                  onClick={onDismissWithdrawNotice}
                                  className="w-6 h-6 rounded-full bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-center justify-center cursor-pointer active:scale-90"
                                  title="Dismiss"
                              >
                                  <X size={13} />
                              </button>
                          )}
                      </div>
                  </div>
              )
          ) : fiatWithdrawPending.status === 'rejected' ? (
              Date.now() - (fiatWithdrawPending.rejectedAt || Date.now()) < 3 * 60 * 60 * 1000 && (
                  <div className={`p-2.5 rounded-2xl flex items-center justify-between gap-2.5 border ${
                    darkMode ? 'bg-rose-950/40 border-rose-500/30 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}>
                      <div className="flex items-center gap-2 min-w-0">
                          <AlertCircle size={16} className="text-rose-500 shrink-0" />
                          <div className="min-w-0">
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
                      <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-500/20 px-2 py-0.5 rounded-full shrink-0">
                              {lang === 'bn' ? 'বাতিল' : 'Rejected'}
                          </span>
                          {onDismissWithdrawNotice && (
                              <button
                                  type="button"
                                  onClick={onDismissWithdrawNotice}
                                  className="w-6 h-6 rounded-full bg-rose-500/15 hover:bg-rose-500/30 text-rose-700 dark:text-rose-300 flex items-center justify-center cursor-pointer active:scale-90"
                                  title="Dismiss"
                              >
                                  <X size={13} />
                              </button>
                          )}
                      </div>
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
              onClick={toggleShowBalance}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition active:scale-90 cursor-pointer ${
                darkMode ? 'text-violet-300 hover:bg-violet-500/15' : 'text-[#7C3AED] hover:bg-violet-100'
              }`}
              title={showBalance ? (lang === 'bn' ? 'ব্যালেন্স লুকান' : 'Hide balance') : (lang === 'bn' ? 'ব্যালেন্স দেখুন' : 'Show balance')}
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
            <span className="whitespace-nowrap">
              ≈ <span className={`font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-700'} ${!showBalance ? 'tracking-[0.16em]' : ''}`}>
                {showBalance ? `$${usdEquiv}` : '$••••'}
              </span> USD
            </span>
          </div>

          {Number(giveawayHoldBdt) > 0 && (
            <button
              type="button"
              onClick={() => {
                playAppSound('tap');
                onOpenGiveaway && onOpenGiveaway();
              }}
              className={`mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold border transition active:scale-95 cursor-pointer ${
                darkMode
                  ? 'bg-amber-500/15 border-amber-400/35 text-amber-300'
                  : 'bg-amber-50 border-amber-300/80 text-amber-700'
              }`}
            >
              <Lock size={10} />
              <span>
                {lang === 'bn'
                  ? `Giveaway হোল্ড: ৳${Number(giveawayHoldBdt).toFixed(2)}`
                  : `Giveaway Hold: ৳${Number(giveawayHoldBdt).toFixed(2)}`}
              </span>
            </button>
          )}
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

      {isHomeActive && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-x-0 bottom-[124px] z-40 pointer-events-none px-3.5">
          <div className="max-w-md mx-auto flex justify-end">
            <button
              type="button"
              onClick={() => {
                playAppSound('tap');
                onOpenGiveaway && onOpenGiveaway();
              }}
              aria-label="Open TrustPay Giveaway"
              className="pointer-events-auto group relative flex flex-col items-center cursor-pointer active:scale-95 transition-transform focus:outline-none"
            >
              <div className="tp-giveaway-float relative w-[68px] h-[64px] flex items-center justify-center rounded-2xl overflow-visible filter drop-shadow-[0_8px_20px_rgba(245,158,11,0.35)]">
                <div className="relative w-full h-full rounded-2xl overflow-hidden flex items-center justify-center">
                  <img
                    src={giveawayBadgeImg}
                    alt="TrustPay Giveaway"
                    draggable={false}
                    className="w-full h-full object-contain select-none transform group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="tp-giveaway-shine" />
                </div>
                <div className="absolute -top-2.5 -right-2.5 pointer-events-none">
                  <TelegramAnimatedSticker src="tg-sparkles-sticker.json" size={24} />
                </div>
              </div>
              <span className="-mt-1 px-2.5 py-[2px] rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-[#1F1200] text-[9.5px] font-black tracking-wider uppercase shadow-[0_3px_10px_rgba(245,158,11,0.6)] border border-amber-200/90">
                ৳50K
              </span>
            </button>
          </div>
        </div>,
        document.body
      )}
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
    setIsModalOpen,
    onStepChange,
    onDone, 
    onGoToBuyCrypto, 
    reloadData 
}) {
    const [step, setStep] = useState(1);
    const [showFlowerModal, setShowFlowerModal] = useState(false);
    const [depositDetails, setDepositDetails] = useState(null);

    useEffect(() => {
        if (setIsModalOpen) setIsModalOpen(showFlowerModal);
    }, [showFlowerModal, setIsModalOpen]);

    useEffect(() => {
        if (onStepChange) onStepChange(step);
    }, [step, onStepChange]);

    useEffect(() => {
        return () => {
            if (onStepChange) onStepChange(1);
            if (setIsModalOpen) setIsModalOpen(false);
        };
    }, [onStepChange, setIsModalOpen]);
    const [amount, setAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('bKash'); // 'bKash' | 'Nagad'
    const [isMethodDropdownOpen, setIsMethodDropdownOpen] = useState(false);
    const [trxId, setTrxId] = useState('');
    const [loading, setLoading] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [copied, setCopied] = useState(false);
    const [pastedFeedback, setPastedFeedback] = useState(false);
    const [adminBkash, setAdminBkash] = useState("01752561935");
    const [adminNagad, setAdminNagad] = useState("9856000927953436");
    const [depositResult, setDepositResult] = useState(null);

    useEffect(() => {
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname.includes('192.168');
        const API_URL = isLocal ? 'http://localhost:3000' : 'https://trustpay-bot.com';
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
        playAppSound('tap');
        if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
        setTimeout(() => setCopied(false), 2000);
    };

    // Quick amounts strictly up to 1000 per user specification (2000 and 5000 removed)
    const quickAmounts = [20, 50, 100, 500, 1000];

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
                playAppSound('tap');
                if (errorMessage) setErrorMessage('');
                if (window.Telegram?.WebApp?.HapticFeedback) {
                    window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
                }
                setTimeout(() => setPastedFeedback(false), 2000);
            }
        };

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

            const manual = window.prompt(lang === 'bn' ? 'আপনার TrxID এখানে পেস্ট করুন:' : 'Paste your TrxID here:');
            if (manual && manual.trim()) {
                applyText(manual);
            }
        }
    };

    // Single-click transition with spin animation
    const handleGoToStep2 = () => {
        if (isTransitioning) return; // Prevent multiple clicks!
        const cleanAmt = parseFloat(String(amount || '').replace(/,/g, '').trim());
        if (!cleanAmt || isNaN(cleanAmt) || cleanAmt < 20) {
            setErrorMessage(lang === 'bn' ? 'অনুগ্রহ করে নূন্যতম ২০ টাকা বা তার বেশি দিন' : 'Please enter at least 20 BDT');
            playAppSound('error');
            return;
        }
        setErrorMessage('');
        setIsTransitioning(true);
        playAppSound('tap');
        if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
        }
        setTimeout(() => {
            setStep(2);
            setIsTransitioning(false);
        }, 350);
    };

    const handleSubmit = async () => {
        const cleanAmt = parseFloat(String(amount || '').replace(/,/g, '').trim());
        if (!cleanAmt || isNaN(cleanAmt) || cleanAmt < 20) {
            setErrorMessage(lang === 'bn' ? 'অনুগ্রহ করে নূন্যতম ২০ টাকা বা তার বেশি দিন' : 'Please enter at least 20 BDT');
            playAppSound('error');
            setStep(1);
            return;
        }

        const cleanId = extractCleanTrxId(trxId);
        if (!cleanId || cleanId.length < 4) {
            setErrorMessage(lang === 'bn' ? 'অনুগ্রহ করে সঠিক Transaction ID দিন' : 'Please enter a valid Transaction ID');
            playAppSound('error');
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
                const calculatedNewBal = parseFloat(res.newBalance || (Number(balance || 0) + cleanAmt));
                setDepositDetails({
                    amount: cleanAmt,
                    method: paymentMethod,
                    trxId: cleanId,
                    newBalance: calculatedNewBal
                });
                setShowFlowerModal(true);
                if (setIsModalOpen) setIsModalOpen(true);
                if (reloadData) reloadData();
            } else {
                setErrorMessage(res.error || (lang === 'bn' ? 'ভেরিফিকেশন ব্যর্থ হয়েছে' : 'Verification failed'));
                playAppSound('error');
            }
        } catch (e) {
            setErrorMessage(e.message || (lang === 'bn' ? 'ভুল বা আনভেরিফাইড TrxID! টাকা পাঠিয়ে সঠিক TrxID দিন।' : 'Invalid or unverified TrxID!'));
            playAppSound('error');
        } finally {
            setLoading(false);
        }
    };

    // STEP 1: SELECT METHOD & AMOUNT
    if (step === 1) {
        const numAmt = parseFloat(amount) || 0;
        const isValidAmt = numAmt >= 20;

        return (
            <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300 pb-20 max-w-md mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onDone}
                            className="w-8 h-8 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center shadow-xs border border-slate-200 dark:border-slate-800 active:scale-95 transition-transform text-slate-700 dark:text-slate-300 cursor-pointer"
                        >
                            <ChevronRight size={16} className="rotate-180" strokeWidth={2.5} />
                        </button>
                        <div>
                            <h2 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                                {lang === 'bn' ? 'টাকা যোগ করুন' : 'Add Money'}
                            </h2>
                            <p className="text-[10px] text-slate-400 font-medium leading-none">
                                {lang === 'bn' ? 'ধাপ ১: মেথড ও পরিমাণ নির্বাচন' : 'Step 1: Method & Amount'}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-[9.5px] font-bold text-slate-400 block leading-tight">{lang === 'bn' ? 'ব্যালেন্স' : 'Balance'}</span>
                        <span className="text-xs font-black font-mono text-purple-600 dark:text-purple-400">৳{Number(balance || 0).toFixed(2)}</span>
                    </div>
                </div>

                {/* Modern Unified 2-Step Progress Tracker */}
                <div className="bg-slate-100/90 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700/70 flex items-center gap-1.5 shadow-2xs">
                    <div className="flex-1 flex items-center gap-2 py-1.5 px-3 rounded-xl bg-white dark:bg-slate-900 shadow-xs border border-purple-200/80 dark:border-purple-800/80 text-purple-600 dark:text-purple-400 font-black">
                        <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-black shrink-0 shadow-2xs">১</span>
                        <span className="text-[11px] font-black truncate">{lang === 'bn' ? 'পরিমাণ ও মেথড' : 'Amount & Method'}</span>
                    </div>

                    <ChevronRight size={14} className="text-slate-300 dark:text-slate-600 shrink-0" strokeWidth={2.5} />

                    <div className="flex-1 flex items-center gap-2 py-1.5 px-3 rounded-xl text-slate-400 font-bold opacity-60">
                        <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center text-[10px] font-black shrink-0">২</span>
                        <span className="text-[11px] truncate">{lang === 'bn' ? 'পেমেন্ট ও TrxID' : 'Pay & TrxID'}</span>
                    </div>
                </div>

                {/* Step 1 Card */}
                <div className={`p-4 rounded-[24px] border shadow-xs space-y-3 ${
                    darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200/90 text-slate-900'
                }`}>
                    {/* Method Dropdown */}
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-wider block mb-1.5 text-slate-500 dark:text-slate-400">
                            {lang === 'bn' ? 'পেমেন্ট মেথড বাছুন' : 'Payment Method'}
                        </label>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => {
                                    playAppSound('tap');
                                    setIsMethodDropdownOpen(!isMethodDropdownOpen);
                                }}
                                className={`w-full py-2 px-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer active:scale-[0.99] ${
                                    darkMode 
                                        ? 'bg-slate-800/50 border-slate-700 text-white' 
                                        : 'bg-slate-50 border-slate-200 text-slate-900'
                                }`}
                            >
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-xl p-1.5 border border-slate-200 flex items-center justify-center shrink-0 shadow-sm tp-payment-logo-box tp-logo-tile overflow-hidden" style={{ backgroundColor: '#ffffff', minWidth: '36px', minHeight: '36px' }}>
                                        <img
                                            src={getPaymentLogo(paymentMethod)}
                                            alt={paymentMethod}
                                            className="w-full h-full object-contain select-none"
                                            style={{ filter: 'none', opacity: 1 }}
                                        />
                                    </div>
                                    <div className="text-left leading-none">
                                        <span className="font-black text-xs block">{paymentMethod}</span>
                                        <span className="text-[9px] text-slate-400 font-medium block mt-0.5">Personal Send Money</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                                        Send Money
                                    </span>
                                    <ChevronDown 
                                        size={16} 
                                        className={`text-slate-400 transition-transform duration-200 ${isMethodDropdownOpen ? 'rotate-180 text-purple-600' : ''}`} 
                                    />
                                </div>
                            </button>

                            {/* Dropdown Options */}
                            {isMethodDropdownOpen && (
                                <div className={`absolute left-0 right-0 top-full mt-1.5 rounded-2xl border z-50 p-1.5 space-y-1 shadow-xl animate-in fade-in zoom-in-95 duration-150 ${
                                    darkMode
                                        ? 'bg-slate-800 border-slate-600 shadow-[0_16px_35px_rgba(0,0,0,0.85)] text-white'
                                        : 'bg-white border-slate-200 shadow-[0_10px_25px_rgba(0,0,0,0.12)] text-slate-900'
                                }`}>
                                    {['bKash', 'Nagad'].map(m => (
                                        <button
                                            key={m}
                                            type="button"
                                            onClick={() => {
                                                playAppSound('tap');
                                                setPaymentMethod(m);
                                                setIsMethodDropdownOpen(false);
                                            }}
                                            className={`w-full p-2.5 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                                                paymentMethod === m
                                                    ? 'bg-purple-500/15 text-purple-600 dark:text-purple-300 font-black border border-purple-500/30'
                                                    : 'hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 font-bold'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-9 h-9 rounded-xl p-1.5 border border-slate-200 flex items-center justify-center shrink-0 shadow-sm tp-payment-logo-box tp-logo-tile overflow-hidden" style={{ backgroundColor: '#ffffff', minWidth: '36px', minHeight: '36px' }}>
                                                    <img
                                                        src={getPaymentLogo(m)}
                                                        alt={m}
                                                        className="w-full h-full object-contain select-none"
                                                        style={{ filter: 'none', opacity: 1 }}
                                                    />
                                                </div>
                                                <div className="text-left leading-none">
                                                    <span className="text-xs font-black block">{m}</span>
                                                    <span className="text-[9.5px] text-slate-400 font-medium block mt-0.5">Send Money</span>
                                                </div>
                                            </div>
                                            {paymentMethod === m && <Check size={16} className="text-purple-600 dark:text-purple-300" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Amount Input */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                {lang === 'bn' ? 'টাকার পরিমাণ (BDT)' : 'Amount (BDT)'}
                            </label>
                            <span className="text-[9.5px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800/50">
                                {lang === 'bn' ? 'নূন্যতম ২০ টাকা' : 'Min. 20 BDT'}
                            </span>
                        </div>

                        <div className={`relative flex items-center rounded-xl border-2 transition-all px-3 h-[44px] ${
                            darkMode ? 'bg-slate-800/40 border-slate-700 focus-within:border-purple-500' : 'bg-slate-50 border-slate-200 focus-within:border-purple-500 focus-within:bg-white'
                        }`}>
                            <span className="text-base font-black text-purple-600 dark:text-purple-400 mr-2 select-none">
                                ৳
                            </span>
                            <input
                                type="number"
                                inputMode="decimal"
                                value={amount}
                                onChange={e => {
                                    setAmount(e.target.value);
                                    if (errorMessage) setErrorMessage('');
                                }}
                                placeholder="0.00"
                                style={{ color: darkMode ? '#ffffff' : '#0f172a' }}
                                className="w-full bg-transparent text-base font-black font-mono outline-none pr-12 placeholder:text-slate-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <span className="absolute right-3 font-black text-xs text-slate-400 select-none">
                                BDT
                            </span>
                        </div>

                        {/* Single-row Quick Chips (Strictly 20, 50, 100, 500, 1000) */}
                        <div className="grid grid-cols-5 gap-1.5 mt-2.5">
                            {quickAmounts.map(val => (
                                <button
                                    key={val}
                                    type="button"
                                    onClick={() => {
                                        playAppSound('tap');
                                        setAmount(val.toString());
                                        if (errorMessage) setErrorMessage('');
                                    }}
                                    className={`py-1.5 px-0.5 rounded-lg text-xs font-bold border transition-all cursor-pointer active:scale-95 text-center ${
                                        amount === val.toString()
                                            ? 'bg-purple-600 text-white border-purple-600 font-black shadow-xs'
                                            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-purple-300'
                                    }`}
                                >
                                    ৳{val.toLocaleString()}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Micro Benefits Banner */}
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/40 text-[10.5px] text-purple-700 dark:text-purple-300">
                        <Sparkles size={14} className="text-amber-500 shrink-0" />
                        <span className="leading-tight font-medium">
                            {lang === 'bn' ? '০% ফি • সাথে সাথে অ্যাকাউন্টে ব্যালেন্স যোগ হবে' : '0% Fee • Instant automatic deposit'}
                        </span>
                    </div>

                    {errorMessage && (
                        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl p-2 flex items-start gap-2">
                            <AlertCircle size={15} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                            <p className="text-xs text-red-700 dark:text-red-300 font-medium leading-tight">{errorMessage}</p>
                        </div>
                    )}

                    {/* 3D Action Button */}
                    <button
                        type="button"
                        onClick={handleGoToStep2}
                        disabled={!isValidAmt || isTransitioning}
                        className="w-full h-[46px] rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 border-t border-white/30 border-b-[3px] border-[#3730a3] active:translate-y-[3px] active:border-b-0 transition-all duration-100 cursor-pointer disabled:opacity-50 disabled:border-b-0 disabled:translate-y-0 disabled:cursor-not-allowed shadow-md"
                    >
                        {isTransitioning ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                <span>{lang === 'bn' ? 'পরবর্তী ধাপে যাওয়া হচ্ছে...' : 'Loading...'}</span>
                            </>
                        ) : (
                            <>
                                <span>{lang === 'bn' ? 'পরবর্তী ধাপ (পেমেন্ট ও TrxID)' : 'Next (Payment & TrxID)'}</span>
                                <ChevronRight size={16} strokeWidth={3} />
                            </>
                        )}
                    </button>
                </div>

                <DepositFlowerModal 
                    isOpen={showFlowerModal}
                    onClose={() => {
                        setShowFlowerModal(false);
                        if (setIsModalOpen) setIsModalOpen(false);
                        setStep(1);
                        setAmount('');
                        setTrxId('');
                        if (onDone) onDone();
                    }}
                    details={depositDetails}
                    lang={lang}
                    darkMode={darkMode}
                />
            </div>
        );
    }

    // STEP 2: PAYMENT & TRXID
    return (
        <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300 pb-8 max-w-md mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            playAppSound('tap');
                            setStep(1);
                        }}
                        className="w-8 h-8 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center shadow-xs border border-slate-200 dark:border-slate-800 active:scale-95 transition-transform text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                        <ChevronRight size={16} className="rotate-180" strokeWidth={2.5} />
                    </button>
                    <div>
                        <h2 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                            {lang === 'bn' ? 'টাকা যোগ করুন' : 'Add Money'}
                        </h2>
                        <p className="text-[10px] text-slate-400 font-medium leading-none">
                            {lang === 'bn' ? 'ধাপ ২: পেমেন্ট ও TrxID দিন' : 'Step 2: Pay & Enter TrxID'}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-[9.5px] font-bold text-slate-400 block leading-tight">{lang === 'bn' ? 'ব্যালেন্স' : 'Balance'}</span>
                    <span className="text-xs font-black font-mono text-purple-600 dark:text-purple-400">৳{Number(balance || 0).toFixed(2)}</span>
                </div>
            </div>

            {/* Modern Unified 2-Step Progress Tracker */}
            <div className="bg-slate-100/90 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700/70 flex items-center gap-1.5 shadow-2xs">
                {/* Step 1 (Clickable to go back) */}
                <button
                    type="button"
                    onClick={() => {
                        playAppSound('tap');
                        setStep(1);
                    }}
                    className="flex-1 flex items-center gap-2 py-1.5 px-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold transition-all cursor-pointer active:scale-95"
                >
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black shrink-0 shadow-2xs">
                        <Check size={11} strokeWidth={3} />
                    </span>
                    <div className="text-left leading-none min-w-0">
                        <span className="text-[10.5px] font-black block truncate">৳{Number(amount).toLocaleString()}</span>
                        <span className="text-[9px] text-slate-400 font-medium block truncate mt-0.5">{paymentMethod}</span>
                    </div>
                </button>

                <ChevronRight size={14} className="text-slate-300 dark:text-slate-600 shrink-0" strokeWidth={2.5} />

                {/* Step 2 (Active) */}
                <div className="flex-1 flex items-center gap-2 py-1.5 px-3 rounded-xl bg-white dark:bg-slate-900 shadow-xs border border-purple-200/80 dark:border-purple-800/80 text-purple-600 dark:text-purple-400 font-black">
                    <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-black shrink-0 shadow-2xs">২</span>
                    <div className="text-left leading-none min-w-0">
                        <span className="text-[11px] font-black block truncate">{lang === 'bn' ? 'পেমেন্ট ও TrxID' : 'Pay & TrxID'}</span>
                        <span className="text-[9px] text-slate-400 font-medium block truncate mt-0.5">{lang === 'bn' ? 'যাচাই ও জমা' : 'Verify'}</span>
                    </div>
                </div>
            </div>

            {/* Step 2 Form Card */}
            <div className={`p-4 rounded-[24px] border shadow-xs space-y-3.5 ${
                darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200/90 text-slate-900'
            }`}>
                {/* 1. Receiver Account Number with Brand Logo & 3D Copy Button */}
                <div className={`p-3 sm:p-3.5 rounded-2xl border transition-all ${
                    darkMode ? 'bg-slate-800/40 border-slate-700/80 shadow-xs' : 'bg-gradient-to-br from-purple-50/70 via-white to-indigo-50/50 border-purple-100 shadow-2xs'
                }`}>
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-purple-100/70 dark:border-slate-700/60">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                {paymentMethod} Personal Send Money
                            </span>
                        </div>
                        <div className="px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 font-mono font-black text-xs">
                            {lang === 'bn' ? 'পাঠাবেন:' : 'Send:'} ৳{Number(amount).toLocaleString()}
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            {/* Payment Method Logo Box */}
                            <div className="w-9 h-9 rounded-xl p-1.5 border border-slate-200 flex items-center justify-center shrink-0 shadow-sm tp-payment-logo-box tp-logo-tile overflow-hidden" style={{ backgroundColor: '#ffffff', minWidth: '36px', minHeight: '36px' }}>
                                <img
                                    src={getPaymentLogo(paymentMethod)}
                                    alt={paymentMethod}
                                    className="w-full h-full object-contain select-none"
                                    style={{ filter: 'none', opacity: 1 }}
                                />
                            </div>

                            {/* Number & Tag */}
                            <div className="min-w-0 flex-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block leading-none mb-1">
                                    {paymentMethod} {lang === 'bn' ? 'একাউন্ট নাম্বার' : 'Account Number'}
                                </span>
                                <span className={`${String(adminNumber || '').length > 12 ? 'text-[13px] sm:text-[15px] tracking-normal' : 'text-[15px] sm:text-base tracking-wide'} font-black font-mono text-slate-900 dark:text-white select-all block leading-tight whitespace-nowrap`}>
                                    {adminNumber}
                                </span>
                            </div>
                        </div>

                        {/* 3D Copy Button */}
                        <button
                            type="button"
                            onClick={handleCopy}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border-b-[3px] active:translate-y-[3px] active:border-b-0 shrink-0 shadow-xs ${
                                copied
                                    ? 'bg-emerald-600 text-white border-emerald-800'
                                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-[#3730a3]'
                            }`}
                        >
                            {copied ? (
                                <>
                                    <Check size={13} strokeWidth={3} />
                                    <span>{lang === 'bn' ? 'কপি!' : 'Copied!'}</span>
                                </>
                            ) : (
                                <>
                                    <Copy size={13} />
                                    <span>{lang === 'bn' ? 'কপি' : 'Copy'}</span>
                                </>
                            )}
                        </button>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-purple-100/60 dark:border-slate-700/60 text-[10px] text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1.5">
                        <AlertCircle size={13} className="shrink-0 text-amber-600 dark:text-amber-400" />
                        <span>{lang === 'bn' ? 'শুধুমাত্র Personal Send Money করবেন (Cash In বা Payment গ্রহণযোগ্য নয়)' : 'Only Personal Send Money accepted'}</span>
                    </div>
                </div>

                {/* 2. Visual 3-Step Guide */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between px-0.5">
                        <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            {lang === 'bn' ? 'সহজ ৩ ধাপে পেমেন্ট করুন:' : '3 Easy Steps to Pay:'}
                        </span>
                        <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">
                            {paymentMethod} Send Money
                        </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <div className={`p-2.5 rounded-xl border text-center transition-all ${
                            darkMode ? 'bg-slate-800/30 border-slate-800' : 'bg-slate-50/90 border-slate-200/80 shadow-2xs'
                        }`}>
                            <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-black text-[10px] mx-auto flex items-center justify-center mb-1 shadow-xs">{lang === 'bn' ? '১' : '1'}</span>
                            <span className="font-black text-[10.5px] text-slate-800 dark:text-slate-200 block leading-tight truncate">
                                {paymentMethod} {lang === 'bn' ? 'অ্যাপ' : 'App'}
                            </span>
                            <span className="text-[9px] text-slate-400 font-medium block mt-0.5">Send Money</span>
                        </div>

                        <div className={`p-2.5 rounded-xl border text-center transition-all ${
                            darkMode ? 'bg-slate-800/30 border-slate-800' : 'bg-slate-50/90 border-slate-200/80 shadow-2xs'
                        }`}>
                            <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-black text-[10px] mx-auto flex items-center justify-center mb-1 shadow-xs">{lang === 'bn' ? '২' : '2'}</span>
                            <span className="font-black text-[10.5px] text-slate-800 dark:text-slate-200 block leading-tight truncate">
                                {lang === 'bn' ? 'টাকা পাঠান' : 'Send Amount'}
                            </span>
                            <span className="text-[9.5px] text-purple-600 dark:text-purple-400 font-black block mt-0.5">৳{Number(amount).toLocaleString()}</span>
                        </div>

                        <div className={`p-2.5 rounded-xl border text-center transition-all ${
                            darkMode ? 'bg-slate-800/30 border-slate-800' : 'bg-slate-50/90 border-slate-200/80 shadow-2xs'
                        }`}>
                            <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-black text-[10px] mx-auto flex items-center justify-center mb-1 shadow-xs">{lang === 'bn' ? '৩' : '3'}</span>
                            <span className="font-black text-[10.5px] text-slate-800 dark:text-slate-200 block leading-tight truncate">
                                {lang === 'bn' ? 'TrxID দিন' : 'Enter TrxID'}
                            </span>
                            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5">{lang === 'bn' ? 'নিচে পেস্ট' : 'Paste below'}</span>
                        </div>
                    </div>
                </div>

                {/* 3. TrxID Input Box */}
                <div>
                    <div className="flex items-center justify-between mb-1 px-0.5">
                        <label className="text-[10.5px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                            {lang === 'bn' ? 'ট্রানজেকশন আইডি (TrxID)' : 'Transaction ID (TrxID)'}
                        </label>
                        <span className="text-[9.5px] text-slate-400 font-medium">
                            {lang === 'bn' ? 'মেসেজে পাওয়া কোড' : 'Received via SMS'}
                        </span>
                    </div>
                    <div className={`relative flex items-center rounded-xl border-2 transition-all px-3 h-[44px] ${
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
                            className="w-full bg-transparent text-sm font-mono font-black uppercase tracking-wider outline-none pr-20 placeholder:text-xs placeholder:font-normal placeholder:text-slate-400"
                        />
                        <button
                            type="button"
                            onClick={handlePasteTrxId}
                            className={`absolute right-1.5 flex items-center gap-1 px-3 py-1.5 rounded-lg font-black text-xs transition-all cursor-pointer border-b-[2px] active:translate-y-[2px] active:border-b-0 ${
                                pastedFeedback
                                    ? 'bg-emerald-600 text-white border-emerald-800'
                                    : 'bg-purple-600 hover:bg-purple-700 text-white border-[#3730a3]'
                            }`}
                        >
                            {pastedFeedback ? (
                                <>
                                    <Check size={12} strokeWidth={3} />
                                    <span>{lang === 'bn' ? 'পেস্ট!' : 'Pasted!'}</span>
                                </>
                            ) : (
                                <>
                                    <Clipboard size={12} />
                                    <span>{lang === 'bn' ? 'পেস্ট' : 'Paste'}</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                    <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl p-2.5 flex items-start gap-2">
                        <AlertCircle size={15} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-red-700 dark:text-red-300 font-medium leading-tight">{errorMessage}</p>
                    </div>
                )}

                {/* Dual 3D Buttons: Back & Confirm */}
                <div className="grid grid-cols-3 gap-2.5 pt-1">
                    <button
                        type="button"
                        onClick={() => {
                            playAppSound('tap');
                            setStep(1);
                        }}
                        className="col-span-1 h-[44px] rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-black text-xs flex items-center justify-center gap-1 border-b-[3px] border-slate-300 dark:border-slate-700 active:translate-y-[3px] active:border-b-0 transition-all cursor-pointer shadow-xs"
                    >
                        <ChevronRight size={15} className="rotate-180" strokeWidth={3} />
                        <span>{lang === 'bn' ? 'আগের ধাপ' : 'Back'}</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading || !amount || !trxId}
                        className="col-span-2 h-[44px] rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 border-t border-white/30 border-b-[3px] border-[#3730a3] active:translate-y-[3px] active:border-b-0 transition-all duration-100 cursor-pointer disabled:opacity-50 disabled:border-b-0 disabled:translate-y-0 disabled:cursor-not-allowed shadow-md"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                <span>{lang === 'bn' ? 'ভেরিফাই হচ্ছে...' : 'Verifying...'}</span>
                            </>
                        ) : (
                            <>
                                <Zap size={16} fill="currentColor" />
                                <span>{lang === 'bn' ? 'কনফার্ম ডিপোজিট' : 'Confirm Deposit'}</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Instant Auto-Verification & Security Guarantee Card (Fills empty space beautifully) */}
                <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all ${
                    darkMode 
                        ? 'bg-purple-950/25 border-purple-900/40 text-purple-300' 
                        : 'bg-purple-50/70 border-purple-100 text-purple-900'
                }`}>
                    <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center shrink-0 text-purple-600 dark:text-purple-400">
                        <ShieldCheck size={18} />
                    </div>
                    <div className="min-w-0 leading-tight">
                        <span className="text-[11px] font-black block">
                            {lang === 'bn' ? '১০০% অটোমেটিক ইনস্ট্যান্ট ডিপোজিট' : '100% Automatic Instant Deposit'}
                        </span>
                        <span className="text-[9.5px] text-slate-500 dark:text-slate-400 font-medium block mt-0.5">
                            {lang === 'bn' ? 'TrxID সাবমিট করার সাথে সাথেই আপনার অ্যাকাউন্টে ব্যালেন্স যোগ হবে।' : 'Balance will be credited to your account instantly upon TrxID verification.'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Bottom Helper Info */}
            <div className="flex items-center justify-center gap-1.5 text-[10.5px] text-slate-400 dark:text-slate-500 font-medium pt-1">
                <Clock size={12} className="text-purple-500 shrink-0" />
                <span>{lang === 'bn' ? 'ডিপোজিট প্রসেসিং সময়: সাধারণত ৫-২০ সেকেন্ড' : 'Deposit processing time: usually 5-20 seconds'}</span>
            </div>

            <DepositFlowerModal 
                isOpen={showFlowerModal}
                onClose={() => {
                    setShowFlowerModal(false);
                    if (setIsModalOpen) setIsModalOpen(false);
                    setStep(1);
                    setAmount('');
                    setTrxId('');
                    if (onDone) onDone();
                }}
                details={depositDetails}
                lang={lang}
                darkMode={darkMode}
            />
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
  bdtAmount = null,
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
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

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
            if (onCloseRef.current) onCloseRef.current();
            return 0;
          }
          return c - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isOpen, stage]);

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
        {/* Top-Right Dismiss Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center text-sm font-bold z-30 cursor-pointer active:scale-90"
        >
          ✕
        </button>

        {/* Soft luxury ambient glow */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 rounded-full blur-3xl pointer-events-none ${
          stage === 'success' ? 'bg-emerald-500/20' : stage === 'error' ? 'bg-rose-500/20' : 'bg-purple-500/20'
        }`} />

        {stage === 'success' ? (
          /* =========================================================================
             ULTRA-PREMIUM SUCCESS STATE WITH ANIMATED LUXURY EMBLEM
             ========================================================================= */
          <div className="py-1 space-y-3.5 animate-in zoom-in-95 duration-300 relative z-10">
            <img
              src={sakuraBranchArt}
              alt=""
              className={`absolute -top-5 -right-5 w-28 h-28 object-contain pointer-events-none select-none ${
                darkMode ? 'opacity-[0.14] brightness-125' : 'opacity-[0.16]'
              }`}
            />

            <LuxurySuccessEmblem badgeText={lang === 'bn' ? 'অন-চেইন সফল' : 'ON-CHAIN VERIFIED'} />

            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
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
              {bdtAmount != null && Number(bdtAmount) > 0 && (
                <div className="text-sm font-black font-mono text-purple-600 dark:text-purple-400 mt-0.5">
                  {isBuy ? `৳${roundBdt(bdtAmount).toFixed(2)} BDT` : `+৳${roundBdt(bdtAmount).toFixed(2)} BDT`}
                </div>
              )}
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

            <button
              type="button"
              onClick={onClose}
              className="w-full mt-3 h-[42px] rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-100/90 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer active:scale-95 transition-all shadow-sm"
            >
              {lang === 'bn' ? 'মডেল বন্ধ করুন (ব্যাকগ্রাউন্ডে চলবে)' : 'Close Modal (Runs in Background)'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function BuyCryptoPage({ user, balance = 0, lang = 'bn', t, reloadData, onGoToAddMoney, onBack, initialAsset = 'GRAM', darkMode = false, twoStepEnabled = false, twoStepLength = 4 }) {
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
    const [transferStageRaw, setTransferStageRaw] = useState('verifying');
    const isSuccessRef = useRef(false);

    const closeTonConnectModals = () => {
        try {
            if (tonConnectUI) {
                tonConnectUI.closeModal();
                if (tonConnectUI.modal) tonConnectUI.modal.close();
            }
        } catch (_) {}
        try {
            const tcModals = document.querySelectorAll('[data-tc-actions-modal-container], [data-tc-confirm-modal], [data-tc-modal][data-tc-actions-modal-container]');
            tcModals.forEach(m => {
                const btn = m.querySelector('button');
                if (btn) btn.click();
                m.remove();
            });
        } catch (_) {}
    };

    const setTransferStage = (stg) => {
        if (isSuccessRef.current && stg !== 'success') {
            return;
        }
        if (stg === 'success') {
            isSuccessRef.current = true;
            closeTonConnectModals();
        }
        setTransferStageRaw(stg);
    };
    const transferStage = transferStageRaw; // 'verifying' | 'transferring' | 'success' | 'error'
    const [memo, setMemo] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [txResult, setTxResult] = useState(null);
    const [showBuyPinModal, setShowBuyPinModal] = useState(false);
    const [buyPinError, setBuyPinError] = useState('');

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
                if (Date.now() - (parsed.timestamp || 0) < 30 * 1000 && parsed.rates) return parsed.rates;
            }
        } catch (_) {}
        return { GRAM: 160, USDT: 130 };
    });

    useEffect(() => {
        let isMounted = true;
        fetchMarketRates().then(data => {
            if (!isMounted || !data) return;
            const r = data.buyRates || data.rates;
            if (r) {
                const normRates = {
                    GRAM: Number(r.GRAM) || 160,
                    USDT: Number(r.USDT) || 130
                };
                setRates(normRates);
                try {
                    localStorage.setItem('maruf_market_rates', JSON.stringify({ rates: normRates, timestamp: Date.now() }));
                } catch (_) {}
            }
        }).catch(() => {});
        return () => { isMounted = false; };
    }, []);

    const BUY_NETWORKS = [
        { id: 'TON', name: 'The Open Network (TON)', shortName: 'TON', gasFee: '~0.015 TON', disabled: false },
        { id: 'ARBITRUM', name: 'Arbitrum One (ARB)', shortName: 'Arbitrum', gasFee: '', disabled: true, badge: 'Coming Soon' },
        { id: 'BEP20', name: 'BNB Smart Chain (BEP20)', shortName: 'BSC', gasFee: '', disabled: true, badge: 'Coming Soon' }
    ];

    const activeNetworkObj = BUY_NETWORKS.find(n => n.id === selectedNetwork) || BUY_NETWORKS[0];
    const cryptoRate = rates[selectedAsset] || (selectedAsset === 'GRAM' ? 160 : 130);
    const numBdt = roundBdt(parseFloat(bdtAmount) || 0);
    const calculatedCrypto = numBdt > 0 ? (numBdt / cryptoRate).toFixed(4) : '';
    const hasInsufficientBalance = numBdt > roundBdt(balance || 0);

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

    const executeBuyWithOptionalPin = async (enteredPin = '') => {
        const targetAddress = destMode === 'connected' ? (userTonAddress || receiveAddress) : receiveAddress;
        setShowBuyPinModal(false);
        setBuyPinError('');
        setErrorMessage('');
        isSuccessRef.current = false;
        setIsTransferModalOpen(true);
        setTransferStage('verifying');

        let isCompleted = false;
        const progressTimer = setTimeout(() => {
            if (!isCompleted && !isSuccessRef.current) setTransferStage('transferring');
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
                memo: memo.trim() || undefined,
                twoStepPin: enteredPin || undefined
            });

            isCompleted = true;
            clearTimeout(progressTimer);

            if (res.success) {
                isSuccessRef.current = true;
                setTxResult(res);
                setTransferStage('success');
                try {
                    localStorage.removeItem(`miniapp_history_cache_${user?.id || 123456789}`);
                } catch (_) {}
                if (reloadData) reloadData();
                playAppSound('success');
            } else {
                throw new Error(res.error || (lang === 'bn' ? 'ক্রয় সম্পন্ন করা সম্ভব হয়নি।' : 'Purchase failed.'));
            }
        } catch (err) {
            isCompleted = true;
            clearTimeout(progressTimer);
            setErrorMessage(err.message || (lang === 'bn' ? 'ক্রয় ব্যর্থ হয়েছে।' : 'Purchase failed.'));
            setTransferStage('error');
            playAppSound('error');
        }
    };

    const handleConfirmBuy = async () => {
        const targetAddress = destMode === 'connected' ? (userTonAddress || receiveAddress) : receiveAddress;
        if (!numBdt || isNaN(numBdt) || numBdt < 20) {
            return window.Telegram?.WebApp?.showAlert 
                ? window.Telegram.WebApp.showAlert(lang === 'bn' ? "নূন্যতম ২০ টাকার ক্রিপ্টো ক্রয় করতে হবে।" : "Minimum order amount is 20 BDT.")
                : alert("Minimum order is 20 BDT");
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

        if (twoStepEnabled) {
            playAppSound('confirm');
            setBuyPinError('');
            setShowBuyPinModal(true);
            return;
        }
        await executeBuyWithOptionalPin('');
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
                            step="0.01"
                            min="20"
                            inputMode="decimal"
                            value={bdtAmount}
                            onChange={e => setBdtAmount(e.target.value)}
                            placeholder={lang === 'bn' ? 'নূন্যতম ৳20.00 BDT' : 'Min. ৳20.00 BDT'}
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
                                    onClick={() => setBdtAmount(roundBdt(balance || 0).toFixed(2))}
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
                        <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">1 {selectedAsset} ≈ ৳{Number(cryptoRate).toFixed(2)} BDT</span>
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
                    <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl p-2.5 flex items-start gap-2 animate-in fade-in">
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
                        disabled={!hasInsufficientBalance && (!numBdt || numBdt < 20)}
                        className="px-7 py-3 rounded-2xl font-black text-sm shadow-[0_4px_16px_rgba(124,58,237,0.4)] hover:opacity-95 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0 bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 text-white"
                    >
                        <Zap size={16} fill="currentColor" />
                        <span>
                            {hasInsufficientBalance 
                                ? (lang === 'bn' ? 'টাকা যোগ করুন' : 'Add Money') 
                                : (lang === 'bn' ? 'কনফার্ম করুন' : 'Confirm Buy')}
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

            {/* 2-Step PIN Modal for Crypto Buy */}
            <TwoStepPinModal
                isOpen={showBuyPinModal}
                onClose={() => setShowBuyPinModal(false)}
                onConfirmPin={(enteredPin) => executeBuyWithOptionalPin(enteredPin)}
                pinLength={twoStepLength}
                errorText={buyPinError}
                titleBn="ক্রিপ্টো ক্রয় পিন যাচাই"
                titleEn="Verify Buy Crypto PIN"
                subtitleBn={`${calculatedCrypto || '0'} ${selectedAsset} ক্রয় সম্পন্ন করতে আপনার ২-স্টেপ পিন দিন`}
                subtitleEn={`Enter your 2-Step PIN to purchase ${calculatedCrypto || '0'} ${selectedAsset}`}
                darkMode={darkMode}
                lang={lang}
            />

            {/* Real-time Transfer Animation Progress Modal */}
            <OnChainTransferProgressModal
                isOpen={isTransferModalOpen}
                stage={transferStage}
                asset={selectedAsset}
                amount={calculatedCrypto}
                bdtAmount={txResult?.bdtAmount ?? numBdt}
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
    const [transferStageRaw, setTransferStageRaw] = useState('verifying');
    const isSuccessRef = useRef(false);

    const setTransferStage = (stg) => {
        if (isSuccessRef.current && stg !== 'success') {
            return;
        }
        if (stg === 'success') {
            isSuccessRef.current = true;
        }
        setTransferStageRaw(stg);
    };
    const transferStage = transferStageRaw;

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
                    return { GRAM: parsed.rates.GRAM || 120, USDT: parsed.rates.USDT || 118 };
                }
            }
        } catch (_) {}
        return { GRAM: 120, USDT: 118 };
    });

    useEffect(() => {
        let isMounted = true;
        fetchMarketRates().then(data => {
            if (!isMounted || !data?.sellRates) return;
            const newRates = {
                GRAM: Number(data.sellRates.GRAM) || 120,
                USDT: Number(data.sellRates.USDT) || 118
            };
            setLiveRates(newRates);
            try {
                localStorage.setItem('maruf_seller_rates', JSON.stringify({ rates: newRates, timestamp: Date.now() }));
            } catch (_) {}
        }).catch(() => {});
        return () => { isMounted = false; };
    }, []);

    const botWalletAddress = "UQC7hYHfrVJ_uT_esMr7vCv1bVh5ytQxYUUjRDiTUiG9s5Fb";
    const depositTargetAddress = selectedNetwork === 'TON' ? (userTonAddress || botWalletAddress) : (userEvmAddress || '');
    const currentRate = asset === 'USDT' ? (liveRates?.USDT || 118) : (liveRates?.GRAM || 120);
    const MIN_SELL_CRYPTO_AMOUNT = 0.2;
    const numAmount = parseFloat(cryptoAmount) || 0;
    const estimatedTk = numAmount > 0 ? roundBdt(numAmount * currentRate) : 0;
    const quickAmounts = asset === 'GRAM' ? [0.2, 0.5, 1, 5, 10] : [5, 10, 25, 50, 100];

    const SELL_NETWORKS = [
        { id: 'TON', name: 'The Open Network (TON)', shortName: 'TON', gasFee: '~0.015 TON', disabled: false },
        { id: 'ARBITRUM', name: 'Arbitrum One (ARB)', shortName: 'Arbitrum', gasFee: '', disabled: true, badge: 'Coming Soon' },
        { id: 'BEP20', name: 'BNB Smart Chain (BEP20)', shortName: 'BSC', gasFee: '', disabled: true, badge: 'Coming Soon' }
    ];



    const activeNetworkObj = SELL_NETWORKS.find(n => n.id === selectedNetwork) || SELL_NETWORKS[0];

    const pendingStorageKey = `tp_pending_sell_v2_${user?.id || 'guest'}`;
    const readPendingSellStorage = () => {
        try {
            const rawLocal = localStorage.getItem(pendingStorageKey);
            if (rawLocal) {
                const parsed = JSON.parse(rawLocal);
                if (parsed?.code && (!parsed.ts || Date.now() - parsed.ts < 6 * 60 * 60 * 1000)) {
                    return parsed;
                }
            }
        } catch (_) {}
        try {
            const sCode = sessionStorage.getItem('tp_pending_sell_code') || '';
            const sAmt = parseFloat(sessionStorage.getItem('tp_pending_sell_amt') || '0') || 0;
            if (sCode) return { code: sCode, amount: sAmt, asset: initialAsset || 'GRAM', ts: Date.now() };
        } catch (_) {}
        return null;
    };

    const initialPendingSell = readPendingSellStorage();
    const [lastActiveSellCode, setLastActiveSellCode] = useState(() => initialPendingSell?.code || '');
    const [lastSellAmount, setLastSellAmount] = useState(() => initialPendingSell?.amount || 0);
    const [lastSellAsset, setLastSellAsset] = useState(() => initialPendingSell?.asset || '');

    const persistPendingSell = (code, amt, sellAsset) => {
        setLastActiveSellCode(code);
        setLastSellAmount(amt);
        setLastSellAsset(sellAsset);
        try {
            localStorage.setItem(pendingStorageKey, JSON.stringify({ code, amount: amt, asset: sellAsset, ts: Date.now() }));
            sessionStorage.setItem('tp_pending_sell_code', code);
            sessionStorage.setItem('tp_pending_sell_amt', String(amt));
        } catch (_) {}
    };

    const clearPendingSell = () => {
        setLastActiveSellCode('');
        setLastSellAmount(0);
        setLastSellAsset('');
        try {
            localStorage.removeItem(pendingStorageKey);
            sessionStorage.removeItem('tp_pending_sell_code');
            sessionStorage.removeItem('tp_pending_sell_amt');
            localStorage.removeItem(`miniapp_history_cache_${user?.id || 123456789}`);
        } catch (_) {}
    };

    const handleSellConfirmedSuccess = (res, resolvedAmt, resolvedAsset) => {
        isSuccessRef.current = true;
        try {
            tonConnectUI.closeModal();
            const actionModal = document.querySelector('[data-tc-actions-modal-container]');
            if (actionModal) actionModal.remove();
        } catch (_) {}
        const fallbackRate = resolvedAsset === 'USDT' ? (liveRates?.USDT || 118) : (liveRates?.GRAM || 120);
        const finalCreditedTk = res.creditedTk != null ? roundBdt(res.creditedTk) : roundBdt((Number(resolvedAmt) || 0) * fallbackRate);
        setLastSellAmount(Number(resolvedAmt) || lastSellAmount);
        setLastSellAsset(resolvedAsset || asset);
        setSellResult({ ...res, amount: resolvedAmt, estimatedTk: finalCreditedTk });
        setErrorMessage('');
        setIsTransferModalOpen(true);
        setTransferStage('success');
        clearPendingSell();
        if (reloadData) reloadData();
        playAppSound('success');
    };

    // Silently check & recover any confirmed on-chain pending sell when entering SellCryptoPage
    useEffect(() => {
        if (!user?.id || Number(user.id) === 123456789) return;
        let active = true;
        const stored = readPendingSellStorage();
        checkTonDeposit({
            userId: user.id,
            sellCode: stored?.code,
            wallet: userTonAddress || undefined,
            asset: stored?.asset || asset,
            amount: stored?.amount || undefined
        }).then(res => {
            if (!active || isSuccessRef.current) return;
            if (res && res.success) {
                const recovered = Array.isArray(res.results) && res.results[0] ? res.results[0] : {};
                handleSellConfirmedSuccess(
                    res,
                    recovered.amount || stored?.amount || numAmount,
                    recovered.asset || stored?.asset || asset
                );
            }
        }).catch(() => {});
        return () => { active = false; };
    }, [user?.id]);

    const verifyTonSellOnChain = async (codeToVerify, amtToVerify, assetToVerify) => {
        if (isSuccessRef.current) return { ok: true };
        const code = codeToVerify || lastActiveSellCode;
        const targetAmt = amtToVerify || numAmount || lastSellAmount;
        const targetAsset = assetToVerify || lastSellAsset || asset;
        if (!code) return { ok: false, error: 'Missing verification code' };
        try {
            if (!isSuccessRef.current) setTransferStage('verifying');
            const res = await submitSellOrder({
                userId: user?.id || 123456789,
                asset: targetAsset,
                amount: targetAmt,
                estimatedTk,
                sellCode: code,
                wallet: userTonAddress || 'Direct',
                status: 'completed'
            });

            if (res && res.success) {
                handleSellConfirmedSuccess(res, targetAmt, targetAsset);
                return { ok: true };
            }
            return { ok: false, error: res?.error || '' };
        } catch (e) {
            return { ok: false, fatal: Boolean(e?.fatal) || e?.status === 403, error: e?.message || '' };
        }
    };

    const handleCheckTonDeposit = async () => {
        const stored = readPendingSellStorage();
        const code = lastActiveSellCode || stored?.code || '';
        const amt = lastSellAmount || stored?.amount || numAmount;
        const targetAsset = lastSellAsset || stored?.asset || asset;

        setIsTransferModalOpen(true);
        setTransferStage('verifying');
        setErrorMessage(lang === 'bn' ? 'ব্লকচেইনে লেনদেন যাচাই করা হচ্ছে...' : 'Verifying transaction on blockchain...');

        let lastErr = '';
        for (let i = 0; i < 3; i++) {
            try {
                const res = await checkTonDeposit({
                    userId: user?.id || 123456789,
                    sellCode: code || undefined,
                    wallet: userTonAddress || undefined,
                    asset: targetAsset,
                    amount: amt || undefined
                });
                if (res && res.success) {
                    const recovered = Array.isArray(res.results) && res.results[0] ? res.results[0] : {};
                    handleSellConfirmedSuccess(res, recovered.amount || amt, recovered.asset || targetAsset);
                    return;
                }
                if (res?.error) lastErr = res.error;
            } catch (e) {
                lastErr = e.message || '';
                break;
            }
            if (i < 2) await new Promise(r => setTimeout(r, 2500));
        }

        setTransferStage('error');
        setErrorMessage(lastErr || (lang === 'bn'
            ? 'ব্লকচেইনে এখনও আপনার ডিপোজিট পাওয়া যায়নি। ওয়ালেটে পেমেন্ট সম্পন্ন হয়ে থাকলে কিছুক্ষণ পর আবার "ডিপোজিট চেক করুন" এ চাপ দিন।'
            : 'Deposit not yet confirmed on blockchain. If confirmed in your wallet, please wait a moment and tap Check Deposit again.'));
        playAppSound('error');
    };

    // TON direct sell via Tonkeeper / Binance Web3 Wallet
    const handleDirectSell = async () => {
        if (!userTonAddress) {
            tonConnectUI.openModal();
            return;
        }
        if (!numAmount || isNaN(numAmount) || numAmount < MIN_SELL_CRYPTO_AMOUNT) {
            return window.Telegram?.WebApp?.showAlert 
                ? window.Telegram.WebApp.showAlert(lang === 'bn' ? "নূন্যতম ০.২ পরিমাণ ক্রিপ্টো দিন" : `Minimum sell amount is ${MIN_SELL_CRYPTO_AMOUNT}`) 
                : alert(`Minimum sell amount is ${MIN_SELL_CRYPTO_AMOUNT}`);
        }
        if (estimatedTk < 1) {
            return window.Telegram?.WebApp?.showAlert 
                ? window.Telegram.WebApp.showAlert(lang === 'bn' ? "নূন্যতম বিক্রয় ১ টাকা" : "Minimum sell value is 1 BDT") 
                : alert("Minimum sell value is 1 BDT");
        }

        isSuccessRef.current = false;
        setIsTransferModalOpen(true);
        setTransferStage('verifying');
        setErrorMessage('');

        let isCompleted = false;
        const progressTimer = setTimeout(() => {
            if (!isCompleted && !isSuccessRef.current) setTransferStage('transferring');
        }, 700);

        let activeSellCode = '';
        let pollInterval = null;
        let pollTimer = null;

        const stopPolling = () => {
            if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
            if (pollTimer) { clearTimeout(pollTimer); pollTimer = null; }
        };

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
            persistPendingSell(activeSellCode, numAmount, asset);

            // Background polling starts after 5s so user has time to switch wallet & approve,
            // while single-flight deduplication on server prevents poll vs final submit collisions.
            const triggerBackgroundPoll = async () => {
                if (isCompleted || isSuccessRef.current) { stopPolling(); return; }
                const checkRes = await verifyTonSellOnChain(activeSellCode, numAmount, asset);
                if (checkRes.ok || isSuccessRef.current) {
                    isCompleted = true;
                    isSuccessRef.current = true;
                    stopPolling();
                    clearTimeout(progressTimer);
                } else if (checkRes.fatal) {
                    isCompleted = true;
                    stopPolling();
                    clearTimeout(progressTimer);
                    setErrorMessage(checkRes.error || (lang === 'bn' ? 'পেমেন্ট ভেরিফাই করা যায়নি।' : 'Verification blocked.'));
                    setTransferStage('error');
                    playAppSound('error');
                }
            };

            pollTimer = setTimeout(() => {
                if (!isCompleted && !isSuccessRef.current) {
                    triggerBackgroundPoll();
                    pollInterval = setInterval(triggerBackgroundPoll, 3500);
                }
            }, 5000);

            // Trigger Tonkeeper / Binance Wallet / TonConnect transaction
            try {
                await tonConnectUI.sendTransaction(txRes.tx, {
                    modals: [],
                    notifications: []
                });
            } catch (err) {
                console.warn("tonConnectUI sendTransaction error or cancel:", err);

                if (isSuccessRef.current || isCompleted) {
                    stopPolling();
                    clearTimeout(progressTimer);
                    return;
                }

                const errStr = String(err?.message || err || '').toLowerCase();
                const isUserCancel = errStr.includes('reject') ||
                                     errStr.includes('cancel') ||
                                     errStr.includes('decline') ||
                                     errStr.includes('abort') ||
                                     errStr.includes('closed') ||
                                     err?.name === 'UserRejectsError';

                if (!isSuccessRef.current) {
                    setTransferStage('verifying');
                    setErrorMessage(lang === 'bn' ? 'ব্লকচেইনে লেনদেন যাচাই করা হচ্ছে...' : 'Verifying on-chain confirmation...');
                }

                const retryCount = isUserCancel ? 2 : 6;
                for (let i = 0; i < retryCount; i++) {
                    await new Promise(r => setTimeout(r, isUserCancel ? 2000 : 2500));
                    if (isSuccessRef.current || isCompleted) {
                        stopPolling();
                        clearTimeout(progressTimer);
                        return;
                    }
                    const checkRes = await verifyTonSellOnChain(activeSellCode, numAmount, asset);
                    if (checkRes.ok || isSuccessRef.current) {
                        isCompleted = true;
                        isSuccessRef.current = true;
                        stopPolling();
                        clearTimeout(progressTimer);
                        return;
                    }
                    if (checkRes.fatal) {
                        isCompleted = true;
                        stopPolling();
                        clearTimeout(progressTimer);
                        setErrorMessage(checkRes.error);
                        setTransferStage('error');
                        playAppSound('error');
                        return;
                    }
                }

                if (isSuccessRef.current) {
                    stopPolling();
                    clearTimeout(progressTimer);
                    return;
                }

                isCompleted = true;
                stopPolling();
                clearTimeout(progressTimer);

                const cancelMsg = isUserCancel
                    ? (lang === 'bn' ? 'ওয়ালেটে লেনদেন বাতিল করা হয়েছে বা এখনও কনফার্ম হয়নি।' : 'Transaction was cancelled or not yet confirmed.')
                    : (lang === 'bn' ? 'ওয়ালেট থেকে রেসপন্স পাওয়া যায়নি। পেমেন্ট করে থাকলে নিচের বাটনে ডিপোজিট চেক করুন।' : (err?.message || 'Transaction was not confirmed yet. Tap Check Deposit below.'));

                setErrorMessage(cancelMsg);
                setTransferStage('error');
                if (window.Telegram?.WebApp?.HapticFeedback) {
                    window.Telegram.WebApp.HapticFeedback.notificationOccurred('warning');
                }
                return;
            }

            // Wallet confirmed sendTransaction! Never abort on a single 400/429 response while indexing:
            // patiently verify on-chain up to ~35s via single-flight deduplicated checks.
            if (!isCompleted && !isSuccessRef.current) {
                stopPolling();
                clearTimeout(progressTimer);
                setTransferStage('verifying');
                setErrorMessage('');

                let lastVerifyErr = '';
                for (let attempt = 0; attempt < 10; attempt++) {
                    if (isSuccessRef.current) return;
                    const checkRes = await verifyTonSellOnChain(activeSellCode, numAmount, asset);
                    if (checkRes.ok || isSuccessRef.current) {
                        isCompleted = true;
                        isSuccessRef.current = true;
                        return;
                    }
                    if (checkRes.fatal) {
                        throw new Error(checkRes.error || 'Verification failed');
                    }
                    lastVerifyErr = checkRes.error || lastVerifyErr;
                    if (attempt < 9) {
                        await new Promise(r => setTimeout(r, 2500));
                    }
                }

                // Final recovery sweep by sellCode + userId before showing retry modal
                if (!isSuccessRef.current) {
                    const recoveryRes = await checkTonDeposit({
                        userId: user?.id || 123456789,
                        sellCode: activeSellCode,
                        wallet: userTonAddress,
                        asset,
                        amount: numAmount
                    }).catch(() => null);
                    if (recoveryRes?.success) {
                        isCompleted = true;
                        handleSellConfirmedSuccess(recoveryRes, numAmount, asset);
                        return;
                    }
                }

                isCompleted = true;
                setErrorMessage(lastVerifyErr || (lang === 'bn'
                    ? 'ব্লকচেইন কনফার্মেশন হতে একটু সময় নিচ্ছে। নিচের "ডিপোজিট চেক করুন" বাটনে চাপ দিন।'
                    : 'Blockchain confirmation is taking slightly longer. Tap Check Deposit below.'));
                setTransferStage('error');
                playAppSound('error');
            }
        } catch (err) {
            stopPolling();
            if (isSuccessRef.current) return;
            if (!isCompleted) {
                isCompleted = true;
                clearTimeout(progressTimer);
                const errStr = String(err?.message || err || '').toLowerCase();
                const isUserCancel = errStr.includes('reject') || errStr.includes('cancel') || errStr.includes('decline') || errStr.includes('abort');
                const msg = isUserCancel
                    ? (lang === 'bn' ? 'ওয়ালেটে লেনদেন বাতিল করা হয়েছে।' : 'Payment rejected in wallet.')
                    : (err.message || (lang === 'bn' ? 'পেমেন্ট ভেরিফাই করা যায়নি।' : 'Payment verification failed.'));
                setErrorMessage(msg);
                setTransferStage('error');
                playAppSound('error');
            }
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
                playAppSound('success');
            } else {
                setEvmCheckMsg({ type: 'info', text: res.message });
            }
        } catch (err) {
            setEvmCheckMsg({ type: 'error', text: err.message || 'ডিপোজিট চেক করতে সমস্যা হয়েছে।' });
            playAppSound('error');
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

                {/* 4. AMOUNT FIELD (Min. 0.2 Placeholder) */}
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
                            min={MIN_SELL_CRYPTO_AMOUNT}
                            step="any"
                            value={cryptoAmount}
                            onChange={e => setCryptoAmount(e.target.value)}
                            placeholder={`Min. ${MIN_SELL_CRYPTO_AMOUNT} ${asset}`}
                            style={{ color: darkMode ? '#ffffff' : '#0f172a' }}
                            className="w-full bg-transparent text-lg sm:text-xl font-black font-mono tracking-tight outline-none pr-16 placeholder:text-xs placeholder:font-normal placeholder:text-slate-400"
                        />
                        <span className="absolute right-3.5 font-black text-xs text-slate-400">
                            {asset}
                        </span>
                    </div>

                    {cryptoAmount !== '' && (!numAmount || numAmount < MIN_SELL_CRYPTO_AMOUNT) && (
                        <p className="mt-1.5 text-[11px] font-bold text-rose-500 dark:text-rose-400">
                            {lang === 'bn' ? `নূন্যতম ০.২ ${asset} বিক্রি করা যাবে` : `Minimum sell amount is ${MIN_SELL_CRYPTO_AMOUNT} ${asset}`}
                        </p>
                    )}

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
                        <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">1 {asset} ≈ ৳{Number(currentRate).toFixed(2)} BDT</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Receiving BDT (আনুমানিক)</span>
                        <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono">৳{estimatedTk.toFixed(2)} BDT</span>
                    </div>
                </div>

                {/* Pending TON Deposit Quick Recovery Banner */}
                {selectedNetwork === 'TON' && lastActiveSellCode && !isTransferModalOpen && (
                    <div className={`rounded-2xl p-3 border flex items-center justify-between gap-2.5 ${
                        darkMode ? 'bg-purple-950/30 border-purple-800/50' : 'bg-purple-50 border-purple-200'
                    }`}>
                        <div className="min-w-0">
                            <p className={`text-[11px] font-black truncate ${darkMode ? 'text-purple-300' : 'text-purple-800'}`}>
                                {lang === 'bn'
                                    ? `আগের ডিপোজিট পেন্ডিং (${lastSellAmount || numAmount || ''} ${lastSellAsset || asset})`
                                    : `Pending Deposit Check (${lastSellAmount || numAmount || ''} ${lastSellAsset || asset})`}
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                {lang === 'bn' ? 'পেমেন্ট করে থাকলে ব্যালেন্স যাচাই করুন' : 'Already paid in wallet? Tap to verify'}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleCheckTonDeposit}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[11px] font-black shrink-0 flex items-center gap-1 cursor-pointer active:scale-95"
                        >
                            <RefreshCw size={12} />
                            <span>{lang === 'bn' ? 'চেক করুন' : 'Verify'}</span>
                        </button>
                    </div>
                )}

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
                            ৳{estimatedTk.toFixed(2)} <span className="text-xs font-bold text-slate-400">BDT</span>
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                            Instant Balance Credit
                        </div>
                    </div>

                    {selectedNetwork === 'TON' ? (
                        <button
                            type="button"
                            onClick={handleDirectSell}
                            disabled={!userTonAddress || !numAmount || numAmount < MIN_SELL_CRYPTO_AMOUNT}
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
                asset={lastSellAsset || asset}
                amount={lastSellAmount || numAmount}
                bdtAmount={sellResult?.estimatedTk ?? estimatedTk}
                targetAddress={botWalletAddress}
                network={activeNetworkObj.shortName}
                isBuy={false}
                errorMessage={errorMessage}
                onRetryCheck={selectedNetwork === 'TON' ? handleCheckTonDeposit : handleCheckEvmDeposit}
                onClose={() => {
                    setIsTransferModalOpen(false);
                    if (transferStage === 'success') {
                        onBack();
                    }
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
            const API_URL = isLocal ? 'http://localhost:3000' : 'https://trustpay-bot.com';
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
        const isRejected = status === 'rejected' || status === 'failed' || status === 'cancelled';

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
            bdtAmount = parseFloat(tx.estimatedTk || tx.amount) || 0;
            if (isRejected) {
                isCredit = false;
                title = lang === 'bn' ? `${tx.asset || 'TON'} বিক্রয় বাতিল` : `Sell Cancelled`;
                subtitle = `${lang === 'bn' ? 'বাতিল:' : 'Cancelled:'} ${tx.amount} ${tx.asset || 'TON'}`;
                Icon = ArrowUpRight;
                iconWrap = 'bg-rose-500/10 text-rose-500';
            } else {
                isCredit = true;
                title = lang === 'bn' ? `${tx.asset || 'TON'} বিক্রয়` : `Sold ${tx.asset || 'TON'}`;
                subtitle = `${lang === 'bn' ? 'বিক্রি:' : 'Sold:'} ${tx.amount} ${tx.asset || 'TON'}`;
                Icon = ArrowUpRight;
                iconWrap = 'bg-violet-500/10 text-violet-500';
            }
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
        } else if (type === 'transfer_sent') {
            bdtAmount = parseFloat(tx.amount) || 0;
            isCredit = false;
            title = lang === 'bn' ? 'মানি ট্রান্সফার (Sent)' : 'Transfer Sent';
            subtitle = `To: ${tx.counterpartyName || 'User'} (${tx.counterpartyMbsId || ''})`;
            Icon = Send;
            iconWrap = 'bg-purple-500/10 text-purple-500';
        } else if (type === 'transfer_received') {
            bdtAmount = parseFloat(tx.amount) || 0;
            isCredit = true;
            title = lang === 'bn' ? 'মানি রিসিভড (Received)' : 'Transfer Received';
            subtitle = `From: ${tx.counterpartyName || 'User'} (${tx.counterpartyMbsId || ''})`;
            Icon = ArrowDownLeft;
            iconWrap = 'bg-emerald-500/10 text-emerald-500';
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

function ProfilePage({ onGoToLeaderboard, user, balance, mbsId, lang = 'bn', t, onSetLang, darkMode = false, onToggleDarkMode, fiatWallet, fiatWithdrawPending, twoStepEnabled = false, twoStepLength = 4, onGoToTwoStep, onGoToSupport, onGoToTransfer, onGoToWithdraw, onGoToHistory, onGoToReferral, setFiatWallet, setIsModalOpen, reloadData }) {
  const [withdrawing, setWithdrawing] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
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

  useEffect(() => {
    if (setIsModalOpen) {
      setIsModalOpen(showWalletModal || showLanguageModal || !!txStatus);
    }
  }, [showWalletModal, showLanguageModal, txStatus, setIsModalOpen]);
  
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
          playAppSound('success');
          onGoToWithdraw();
      } catch (e) {
          playAppSound('error');
          WebApp.showAlert(e.message || 'Failed to save wallet');
      } finally {
          setIsSaving(false);
      }
  };

  return (
    <div className="space-y-3.5 max-w-md mx-auto pb-24 relative">
      {/* 1. EXECUTIVE USER VIP IDENTITY CARD */}
      <div className={`rounded-3xl border transition-colors p-4 shadow-sm relative overflow-hidden ${
        darkMode 
          ? 'bg-slate-900/95 border-slate-800 text-white' 
          : 'bg-white border-slate-200/90 text-slate-900'
      }`}>
        {/* Zero-lag radial aura glow behind card */}
        <div
          className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(147,51,234,0.14) 0%, rgba(79,70,229,0.06) 50%, transparent 70%)'
          }}
        />

        <div className="relative z-10 flex items-center justify-between gap-3">
          {/* Avatar & User Details */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative">
              <UserAvatarBox
                userId={user?.id}
                photoUrl={user?.photo_url}
                name={user?.first_name}
                sizeClass="w-13 h-13 rounded-2xl text-xl"
              />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] text-white shadow-2xs font-bold">
                ✓
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-base font-black leading-tight truncate text-slate-900 dark:text-white">
                  {user?.first_name || 'User'}
                </h2>
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

          {/* Quick Controls: Dark Mode Toggle */}
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
                <div style={{ backgroundColor: '#ffffff' }} className="w-10 h-10 rounded-xl bg-white border border-slate-200/90 p-1 flex items-center justify-center shrink-0 shadow-xs tp-payment-logo-box">
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

      {/* 3. SERVICES & NAVIGATION MENU CARD (Includes Refer & Earn + Security + History + Support + Guide) */}
      <div className={`p-2.5 rounded-3xl border transition-all shadow-sm space-y-1 ${
        darkMode 
          ? 'bg-slate-900/95 border-slate-800 text-white' 
          : 'bg-white border-slate-200/90 text-slate-900'
      }`}>
        {/* Refer & Earn Row */}
        <div 
          onClick={onGoToReferral} 
          className="p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-fuchsia-50 dark:bg-fuchsia-950/50 flex items-center justify-center text-fuchsia-600 dark:text-fuchsia-400 group-hover:scale-105 transition-transform shrink-0 border border-fuchsia-100 dark:border-fuchsia-800/60 shadow-2xs">
              <Gift size={17} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-black text-slate-900 dark:text-white block text-xs leading-tight">
                  {lang === 'bn' ? 'রেফার করুন এবং আয় করুন' : 'Refer Friends & Earn'}
                </span>
                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black border bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/30">
                  +৳5 / REF
                </span>
              </div>
              <span className="text-[10.5px] text-slate-400 dark:text-slate-500 font-medium block truncate">
                {lang === 'bn' ? 'প্রতি সক্রিয় রেফারে ইনস্ট্যান্ট ৳৫ বোনাস পান' : 'Get instant ৳5 BDT per active referral'}
              </span>
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-400 group-hover:text-fuchsia-600 dark:group-hover:text-fuchsia-400 transition-colors shrink-0" />
        </div>

        <div className="h-px bg-slate-100 dark:bg-slate-800 w-full" />

        {/* Language Selection Row */}
        <div 
          onClick={() => setShowLanguageModal(true)} 
          className="p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform shrink-0 border border-blue-100 dark:border-blue-800/60 shadow-2xs">
              <Globe size={17} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-nowrap">
                <span className="font-black text-slate-900 dark:text-white block text-xs leading-tight truncate">
                  {lang === 'bn' ? 'ভাষা পরিবর্তন (Language)' : 'Language Setting'}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[9px] font-black border shrink-0 bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 flex items-center gap-1">
                  <span>{lang === 'bn' ? '🇧🇩 বাংলা' : '🇺🇸 English'}</span>
                </span>
              </div>
              <span className="text-[10.5px] text-slate-400 dark:text-slate-500 font-medium block truncate">
                {lang === 'bn' ? 'বাংলা অথবা English নির্বাচন করুন' : 'Select Bengali or English interface'}
              </span>
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0" />
        </div>

        <div className="h-px bg-slate-100 dark:bg-slate-800 w-full" />

        {/* 2-Step Security Verification Row */}
        <div 
          onClick={onGoToTwoStep} 
          className="p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform shrink-0 border border-emerald-100 dark:border-emerald-800/60 shadow-2xs">
              <ShieldCheck size={17} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-nowrap">
                <span className="font-black text-slate-900 dark:text-white block text-xs leading-tight truncate">
                  {lang === 'bn' ? '২-স্টেপ ভেরিফিকেশন' : '2-Step Verification'}
                </span>
                <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black border shrink-0 ${
                  twoStepEnabled
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                }`}>
                  {twoStepEnabled ? (lang === 'bn' ? `${twoStepLength} ডিজিট চালু` : `${twoStepLength}-Digit ON`) : (lang === 'bn' ? 'বন্ধ আছে' : 'OFF')}
                </span>
              </div>
              <span className="text-[10.5px] text-slate-400 dark:text-slate-500 font-medium block truncate">
                {lang === 'bn' ? 'লেনদেন ও উইথড্রয়ের সিকিউরিটি পাসওয়ার্ড' : 'Protect Buy, Withdraw & Transfer with PIN'}
              </span>
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors shrink-0" />
        </div>

        <div className="h-px bg-slate-100 dark:bg-slate-800 w-full" />

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
          onClick={onGoToSupport} 
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
                {lang === 'bn' ? '২৪/৭ হেল্পলাইন ও টিকেট সেন্টার' : '24/7 Helpline & Ticket Center'}
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
              window.Telegram.WebApp.openLink('https://youtu.be/n1yri5vWLWE');
            } else {
              window.open('https://youtu.be/n1yri5vWLWE', '_blank');
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
                                      <div style={{ backgroundColor: '#ffffff' }} className="w-8 h-8 rounded-lg tp-payment-logo-box bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-2xs">
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
                                                  <div style={{ backgroundColor: '#ffffff' }} className="w-8 h-8 rounded-lg tp-payment-logo-box bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-2xs">
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

      {/* Interactive Language Selector Popup Modal */}
      {showLanguageModal && (
        <div 
          onClick={() => setShowLanguageModal(false)}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div 
            onClick={e => e.stopPropagation()}
            className={`relative w-full max-w-[340px] p-5 rounded-3xl shadow-2xl border transition-all animate-in zoom-in-95 slide-in-from-bottom-4 overflow-hidden ${
              darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200/90 text-slate-900'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-800/60 shadow-2xs">
                  <Globe size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                    {lang === 'bn' ? 'ভাষা নির্বাচন করুন' : 'Select Language'}
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                    {lang === 'bn' ? 'আপনার পছন্দের ভাষা বেছে নিন' : 'Choose your preferred language'}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowLanguageModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Language Options List */}
            <div className="space-y-2.5">
              {/* 1. Bengali Option */}
              <button
                type="button"
                onClick={() => {
                  if (onSetLang) onSetLang('bn');
                  if (window.Telegram?.WebApp?.HapticFeedback) {
                    window.Telegram.WebApp.HapticFeedback.selectionChanged();
                  }
                  setShowLanguageModal(false);
                }}
                className={`w-full p-3.5 rounded-2xl border flex items-center justify-between transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                  lang === 'bn'
                    ? 'bg-blue-500/10 border-blue-500/50 shadow-xs ring-1 ring-blue-500/30'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl select-none leading-none">🇧🇩</span>
                  <div className="text-left">
                    <span className={`text-sm font-black block leading-tight ${
                      lang === 'bn' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'
                    }`}>
                      বাংলা
                    </span>
                    <span className="text-[10.5px] text-slate-400 dark:text-slate-500 font-medium">
                      Bengali Language
                    </span>
                  </div>
                </div>

                {/* Animated Radio Circle: Filled when selected, hollow when unselected */}
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                  lang === 'bn'
                    ? 'border-blue-600 dark:border-blue-500 bg-blue-600 dark:bg-blue-500 shadow-[0_0_8px_rgba(37,99,235,0.35)]'
                    : 'border-slate-300 dark:border-slate-600 bg-transparent'
                }`}>
                  {lang === 'bn' && (
                    <div className="w-2 h-2 rounded-full bg-white animate-in zoom-in-75 duration-150" />
                  )}
                </div>
              </button>

              {/* 2. English Option */}
              <button
                type="button"
                onClick={() => {
                  if (onSetLang) onSetLang('en');
                  if (window.Telegram?.WebApp?.HapticFeedback) {
                    window.Telegram.WebApp.HapticFeedback.selectionChanged();
                  }
                  setShowLanguageModal(false);
                }}
                className={`w-full p-3.5 rounded-2xl border flex items-center justify-between transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                  lang === 'en'
                    ? 'bg-blue-500/10 border-blue-500/50 shadow-xs ring-1 ring-blue-500/30'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl select-none leading-none">🇺🇸</span>
                  <div className="text-left">
                    <span className={`text-sm font-black block leading-tight ${
                      lang === 'en' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'
                    }`}>
                      English
                    </span>
                    <span className="text-[10.5px] text-slate-400 dark:text-slate-500 font-medium">
                      ইংরেজি ভাষা
                    </span>
                  </div>
                </div>

                {/* Animated Radio Circle: Filled when selected, hollow when unselected */}
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                  lang === 'en'
                    ? 'border-blue-600 dark:border-blue-500 bg-blue-600 dark:bg-blue-500 shadow-[0_0_8px_rgba(37,99,235,0.35)]'
                    : 'border-slate-300 dark:border-slate-600 bg-transparent'
                }`}>
                  {lang === 'en' && (
                    <div className="w-2 h-2 rounded-full bg-white animate-in zoom-in-75 duration-150" />
                  )}
                </div>
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
    bannerUrl: `${window.location.origin}/app/trustpay-official-banner.jpg?v=2`,
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
          `💎 Trust Pay — বাংলাদেশের সেরা Instant Crypto Buy & Sell Bot! 🇧🇩✨\n\n` +
          `🔥 ঘরে বসেই খুব সহজে TON, USDT ও GRAM কেনা-বেচা (Buy & Sell) করুন সবচেয়ে সেরা রেটে!\n` +
          `⚡ bKash ও Nagad-এ মাত্র ২ মিনিটে ১০০% অটোমেটিক পেমেন্ট!\n` +
          `🛡️ শতভাগ নিরাপদ লেনদেন ও ২৪/৭ লাইভ সাপোর্ট।\n\n` +
          `🎁 নিচের লিংকে ক্লিক করে এখনই বটে জয়েন করুন 👇\n` +
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
      const fallbackUrl = `https://t.me/share/url?url=${encodeURIComponent(activeReferralLink)}&text=${encodeURIComponent('💎 Trust Pay — বাংলাদেশের সেরা Instant Crypto Buy & Sell Bot! ঘরে বসেই TON, USDT ও GRAM কেনা-বেচা করুন বিকাশ ও নগদে। নিচের লিংকে ক্লিক করে জয়েন করুন 👇')}`;
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
      {/* Top Navigation & Executive Badge Bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border font-bold text-xs shadow-2xs active:scale-95 transition-all cursor-pointer ${
            darkMode
              ? 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800'
              : 'bg-white border-slate-200/90 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <ArrowLeft size={15} />
          <span>{lang === 'bn' ? 'প্রোফাইলে ফিরুন' : 'Back to Profile'}</span>
        </button>

        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-black shadow-2xs ${
          darkMode
            ? 'bg-purple-950/60 border-purple-500/30 text-purple-300'
            : 'bg-purple-50 border-purple-200/80 text-purple-700'
        }`}>
          <Gift size={13} className="text-purple-600 dark:text-purple-400" />
          <span>{lang === 'bn' ? 'রেফারেল প্রোগ্রাম' : 'Referral Program'}</span>
        </div>
      </div>

      {/* 1. CLEAN EXECUTIVE HERO BANNER & STATS CARD */}
      <div className={`rounded-3xl border overflow-hidden transition-all shadow-sm ${
        darkMode
          ? 'bg-slate-900/95 border-slate-800 text-white'
          : 'bg-white border-slate-200/90 text-slate-900'
      }`}>
        {/* Clean Full-Bleed Crypto Buy & Sell Promo Banner (No Messy Overlapping Text) */}
        <div className="relative w-full aspect-[16/9] overflow-hidden bg-slate-950 border-b border-slate-100 dark:border-slate-800">
          <img
            src={referralBannerImg}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = `${import.meta.env.BASE_URL || '/app/'}trustpay-official-banner.jpg?v=2`;
            }}
            alt="Trust Pay Instant Crypto Buy & Sell Banner"
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-slate-950/75 backdrop-blur-md border border-purple-400/30 text-white text-[10px] font-black flex items-center gap-1 shadow-md">
            <Sparkles size={11} className="text-amber-400" />
            <span>+৳৫ / Active Ref</span>
          </div>
        </div>

        {/* Clean Headline & 3-Column Stats */}
        <div className="p-4 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-[10px] font-black mb-1.5">
                <span>{lang === 'bn' ? 'ইনস্ট্যান্ট রেফার বোনাস +৳৫ টাকা' : 'Instant Referral Bonus +৳5 BDT'}</span>
              </div>
              <h2 className="text-sm sm:text-[15px] font-black text-slate-900 dark:text-white leading-snug">
                {lang === 'bn'
                  ? 'বন্ধুদের ইনভাইট করুন এবং প্রতি রেফারে ৫ টাকা বোনাস পান!'
                  : 'Invite Friends & Earn ৳5 BDT Per Active Referral!'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1 leading-relaxed">
                {lang === 'bn'
                  ? 'আপনার বন্ধু বটে জয়েন করে প্রথম ক্রিপ্টো বাই/সেল বা অ্যাড মানি করলেই বোনাস অটোমেটিক আপনার ব্যালেন্সে যোগ হবে।'
                  : 'Get instant cash rewards directly in your main balance when your friend completes their first transaction.'}
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-purple-500/20">
              <Gift size={20} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className={`p-3 rounded-2xl border ${
              darkMode
                ? 'bg-slate-800/70 border-slate-700/80'
                : 'bg-slate-50/90 border-slate-200/70'
            }`}>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
                {lang === 'bn' ? 'মোট রেফার' : 'Total Joined'}
              </span>
              <span className="text-lg font-black text-slate-900 dark:text-white mt-0.5 block">
                {loading ? '...' : refData.totalReferrals}
              </span>
            </div>

            <div className={`p-3 rounded-2xl border ${
              darkMode
                ? 'bg-emerald-950/30 border-emerald-500/25'
                : 'bg-emerald-50/80 border-emerald-200/70'
            }`}>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block">
                {lang === 'bn' ? 'অ্যাক্টিভ রেফার' : 'Active Refs'}
              </span>
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                {loading ? '...' : refData.activeReferrals}
              </span>
            </div>

            <div className={`p-3 rounded-2xl border ${
              darkMode
                ? 'bg-purple-950/35 border-purple-500/30'
                : 'bg-purple-50/80 border-purple-200/70'
            }`}>
              <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 block">
                {lang === 'bn' ? 'মোট বোনাস আয়' : 'Total Earned'}
              </span>
              <span className="text-lg font-black text-purple-600 dark:text-purple-400 mt-0.5 block">
                ৳{loading ? '...' : refData.referralEarnings}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. PERSONAL REFERRAL LINK & TACTILE 3D SHARE CARD */}
      <div className={`p-4 rounded-3xl border space-y-3.5 transition-all shadow-sm ${
        darkMode
          ? 'bg-slate-900/95 border-slate-800 text-white'
          : 'bg-white border-slate-200/90 text-slate-900'
      }`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-100 dark:border-purple-800/60 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0 shadow-2xs">
              <Share2 size={17} />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-[13px] font-black text-slate-900 dark:text-white leading-tight">
                {lang === 'bn' ? 'আপনার পার্সোনাল রেফারেল লিংক' : 'Your Personal Referral Link'}
              </h3>
              <p className="text-[10.5px] text-slate-400 dark:text-slate-500 font-medium truncate mt-0.5">
                {lang === 'bn' ? 'লিংক কপি বা সরাসরি টেলিগ্রামে শেয়ার করুন' : 'Copy link or share directly on Telegram'}
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-black shrink-0 border border-purple-500/20">
            +৳5 / Ref
          </span>
        </div>

        {/* Link Box + Copy Button */}
        <div className={`flex items-center gap-2 rounded-2xl p-1.5 border ${
          darkMode
            ? 'bg-slate-950/80 border-slate-800'
            : 'bg-slate-50 border-slate-200/90'
        }`}>
          <div className="flex-1 min-w-0 px-2.5">
            <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 block truncate select-all">
              {activeReferralLink}
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopyLink}
            className={`px-3.5 py-2 rounded-xl text-[11px] font-black flex items-center gap-1.5 shrink-0 transition-all active:scale-95 cursor-pointer ${
              copied
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/30'
                : 'bg-purple-600/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 hover:bg-purple-600/20 border border-purple-500/20'
            }`}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            <span>{copied ? (lang === 'bn' ? 'কপি হয়েছে!' : 'Copied!') : (lang === 'bn' ? 'কপি করুন' : 'Copy')}</span>
          </button>
        </div>

        {/* Tactile 3D Purple Share Button */}
        <button
          type="button"
          onClick={handleShareRichMessage}
          disabled={sharing}
          className="w-full h-[50px] px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 text-white font-black text-xs sm:text-[13.5px] border-t border-purple-300/40 shadow-[0_5px_0_#3730a3,0_12px_24px_rgba(79,70,229,0.35)] active:translate-y-1 active:shadow-[0_1px_0_#3730a3,0_6px_12px_rgba(79,70,229,0.25)] flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer disabled:opacity-60"
        >
          {sharing ? (
            <Loader2 size={17} className="animate-spin" />
          ) : (
            <>
              <Send size={15} />
              <span>{lang === 'bn' ? 'বন্ধুদের শেয়ার করুন (SHARE NOW)' : 'SHARE REFERRAL LINK'}</span>
            </>
          )}
        </button>

        {shareToast && (
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold flex items-center justify-center gap-1.5 text-center leading-snug animate-in fade-in">
            <CheckCircle2 size={14} />
            <span>{shareToast}</span>
          </div>
        )}
      </div>

      {/* 3. HOW ACTIVE REFERRAL WORKS (3 CLEAN STEPS) */}
      <div className={`p-4 rounded-3xl border space-y-3.5 transition-all shadow-sm ${
        darkMode
          ? 'bg-slate-900/95 border-slate-800 text-white'
          : 'bg-white border-slate-200/90 text-slate-900'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 shadow-2xs">
            <Sparkles size={17} />
          </div>
          <div>
            <h3 className="text-xs sm:text-[13px] font-black text-slate-900 dark:text-white leading-snug">
              {lang === 'bn' ? 'কীভাবে রেফার Active হবে এবং ৫ টাকা পাবেন?' : 'How Referral Becomes Active (+৳5 Bonus)'}
            </h3>
            <p className="text-[10.5px] text-slate-400 dark:text-slate-500 font-medium">
              {lang === 'bn' ? 'নিচের ৩টি সহজ ধাপ সম্পন্ন হলেই বোনাস অটোমেটিক যুক্ত হবে' : 'Complete these 3 simple steps to unlock instant bonus'}
            </p>
          </div>
        </div>

        <div className="space-y-2.5">
          <div className={`flex items-start gap-3 p-3 rounded-2xl border ${
            darkMode ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50/80 border-slate-200/60'
          }`}>
            <div className="w-6 h-6 rounded-full bg-purple-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
              1
            </div>
            <div>
              <span className="text-xs font-black text-slate-900 dark:text-white block">
                {lang === 'bn' ? 'রেফারেল লিংকে ক্লিক করে বটে জয়েন' : 'Join via Referral Link or Share Button'}
              </span>
              <span className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium leading-snug block mt-0.5">
                {lang === 'bn'
                  ? 'আপনার শেয়ার করা মেসেজের বাটনে বা লিংকে ক্লিক করে নতুন ইউজারকে বটে স্টার্ট করতে হবে।'
                  : 'Your friend must start the bot using your referral link or join button.'}
              </span>
            </div>
          </div>

          <div className={`flex items-start gap-3 p-3 rounded-2xl border ${
            darkMode ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50/80 border-slate-200/60'
          }`}>
            <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
              2
            </div>
            <div>
              <span className="text-xs font-black text-slate-900 dark:text-white block">
                {lang === 'bn' ? 'ওয়ালেট কানেক্ট বা পেমেন্ট নম্বর সেটআপ' : 'Connect Wallet or Save bKash/Nagad'}
              </span>
              <span className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium leading-snug block mt-0.5">
                {lang === 'bn'
                  ? 'ইউজারকে বটে TON Wallet কানেক্ট করতে হবে অথবা bKash/Nagad ওয়ালেট নম্বর যুক্ত করতে হবে।'
                  : 'Your friend must connect a TON wallet or save a bKash/Nagad wallet.'}
              </span>
            </div>
          </div>

          <div className={`flex items-start gap-3 p-3 rounded-2xl border ${
            darkMode ? 'bg-emerald-950/25 border-emerald-500/25' : 'bg-emerald-50/70 border-emerald-200/70'
          }`}>
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
              3
            </div>
            <div>
              <span className="text-xs font-black text-emerald-950 dark:text-emerald-300 block">
                {lang === 'bn' ? 'কমপক্ষে ২০ টাকা Add Money বা Crypto Sell' : 'Complete ৳20 Add Money or ৳20 Crypto Sell'}
              </span>
              <span className="text-[10.5px] text-emerald-800 dark:text-emerald-400/90 font-medium leading-snug block mt-0.5">
                {lang === 'bn'
                  ? 'কমপক্ষে ২০ টাকা অ্যাড মানি অথবা ২০ টাকার ক্রিপ্টো সেল সম্পন্ন করলেই রেফারটি সাথে সাথে Active হবে এবং আপনার মেইন ব্যালেন্সে +৳৫ টাকা যোগ হয়ে যাবে!'
                  : 'Once they complete at least ৳20 Add Money or ৳20 Crypto Sell, the referral becomes Active and +৳5 BDT is credited instantly!'}
              </span>
            </div>
          </div>
        </div>

        {/* Anti-Clone Security Warning */}
        <div className={`p-3 rounded-2xl border flex items-start gap-2.5 ${
          darkMode
            ? 'bg-amber-950/25 border-amber-500/25 text-amber-300'
            : 'bg-amber-50/80 border-amber-200/80 text-amber-900'
        }`}>
          <ShieldCheck size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-[10.5px] font-medium leading-relaxed">
            <span className="font-black block mb-0.5">
              {lang === 'bn' ? 'অ্যান্টি-ক্লোন ও ডিভাইস সিকিউরিটি সতর্কবার্তা:' : 'Anti-Clone & Device Security Notice:'}
            </span>
            {lang === 'bn'
              ? 'একই মোবাইলে Clone App বা একাধিক টেলিগ্রাম আইডি খুলে নিজে নিজেকে রেফার করলে সিকিউরিটি সিস্টেম তা অটোমেটিক ব্লক করে দিবে।'
              : 'Using Clone Apps or multiple accounts on the same phone is strictly blocked by device fingerprint security.'}
          </div>
        </div>
      </div>

      {/* 4. REFERRED USERS LIST CARD */}
      <div className={`p-4 rounded-3xl border space-y-3 transition-all shadow-sm ${
        darkMode
          ? 'bg-slate-900/95 border-slate-800 text-white'
          : 'bg-white border-slate-200/90 text-slate-900'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-100 dark:border-purple-800/60 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Users size={15} />
            </div>
            <h3 className="text-xs sm:text-[13px] font-black text-slate-900 dark:text-white">
              {lang === 'bn' ? 'আপনার রেফার তালিকা' : 'Your Referred Users'}
            </h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400">
            {refData.referrals?.length || 0} {lang === 'bn' ? 'জন' : 'Users'}
          </span>
        </div>

        {loading ? (
          <div className="py-8 flex flex-col items-center justify-center text-purple-600 dark:text-purple-400 gap-2">
            <Loader2 size={22} className="animate-spin" />
            <span className="text-xs font-bold">{lang === 'bn' ? 'লোড হচ্ছে...' : 'Loading...'}</span>
          </div>
        ) : !refData.referrals || refData.referrals.length === 0 ? (
          <div className={`py-7 px-4 text-center space-y-2 rounded-2xl border border-dashed flex flex-col items-center ${
            darkMode
              ? 'bg-slate-800/40 border-slate-700/80'
              : 'bg-slate-50/70 border-slate-200'
          }`}>
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Users size={22} />
            </div>
            <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-1">
              {lang === 'bn' ? 'এখনো কোনো রেফার নেই' : 'No referrals yet'}
            </p>
            <p className="text-[10.5px] text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
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
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-2 ${
                    darkMode
                      ? 'bg-slate-800/60 border-slate-700/80'
                      : 'bg-slate-50/90 border-slate-200/80'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[12px] font-black text-slate-900 dark:text-white truncate">
                        {item.name || 'Telegram User'}
                      </span>
                      {item.username && (
                        <span className="text-[10px] text-slate-400 font-medium truncate">
                          @{item.username}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        ✓ ID Joined
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                          item.walletConnected
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20'
                        }`}
                      >
                        {item.walletConnected ? '✓ Wallet' : '⏳ Wallet'}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                          item.qualifyingTxDone
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20'
                        }`}
                      >
                        {item.qualifyingTxDone ? '✓ ৳20+ Tx' : '⏳ ৳20+ Tx'}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    {isAct ? (
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-600 text-white text-[10px] font-black block">
                        +৳{item.rewardAmount || item.bonusAmount || 5} Active
                      </span>
                    ) : isBlocked ? (
                      <span className="px-2.5 py-1 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 text-[10px] font-black block">
                        Clone Blocked
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-black block">
                        Pending
                      </span>
                    )}
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



function WithdrawFiatPage({ user, balance, lang = 'bn', t, darkMode = false, twoStepEnabled = false, twoStepLength = 4, fiatWallet, setFiatWallet, fiatWithdrawPending, antiAbuseData = {}, setIsModalOpen, onBack, reloadData }) {
    const [amount, setAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [timeLeft, setTimeLeft] = useState('');
    const [showEditWalletModal, setShowEditWalletModal] = useState(false);
    const [showConfirmWithdrawModal, setShowConfirmWithdrawModal] = useState(false);
    const [pendingConfirmData, setPendingConfirmData] = useState(null);
    const [showWithdrawPinModal, setShowWithdrawPinModal] = useState(false);
    const [withdrawPinError, setWithdrawPinError] = useState('');
    const [showFlowerModal, setShowFlowerModal] = useState(false);
    const [withdrawDetails, setWithdrawDetails] = useState(null);
    const [editMethod, setEditMethod] = useState('bKash');
    const [editNumber, setEditNumber] = useState('');
    const [editName, setEditName] = useState('');
    const [isSavingWallet, setIsSavingWallet] = useState(false);

    const hasSell = Boolean(antiAbuseData?.hasSellBalance);
    const isDepositUser = Boolean(antiAbuseData?.hasDepositWithoutTrade) && !hasSell;
    const spentSinceLastDeposit = parseFloat(antiAbuseData?.spentSinceLastDeposit) || 0;
    const minAmount = 25;
    const maxAmount = 5000;

    useEffect(() => {
        if (setIsModalOpen) {
            setIsModalOpen(showEditWalletModal || showConfirmWithdrawModal || showWithdrawPinModal || showFlowerModal);
        }
    }, [showEditWalletModal, showConfirmWithdrawModal, showWithdrawPinModal, showFlowerModal, setIsModalOpen]);

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
            playAppSound('success');
            if (window.Telegram?.WebApp?.showAlert) window.Telegram.WebApp.showAlert(lang === 'bn' ? "ওয়ালেট সফলভাবে আপডেট করা হয়েছে!" : "Wallet updated successfully!");
        } catch (e) {
            playAppSound('error');
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

    const handleMax = () => setAmount(roundBdt(Math.min(Number(balance) || 0, maxAmount)).toFixed(2));

    // Step 1: Validate & Open Permission / Confirmation Modal
    const handleSubmit = () => {
        const amt = parseFloat(amount);
        if (!amount || isNaN(amt) || amt <= 0) {
            playAppSound('error');
            const msg = lang === 'bn' ? "সঠিক পরিমাণ লিখুন" : "Invalid amount";
            return window.Telegram?.WebApp?.showAlert ? window.Telegram.WebApp.showAlert(msg) : alert(msg);
        }

        // Anti-Abuse: Deposit users must spend at least 20 TK on crypto before withdrawing
        if (isDepositUser && spentSinceLastDeposit < 20) {
            playAppSound('error');
            const remaining = (20 - spentSinceLastDeposit).toFixed(0);
            const msg = lang === 'bn' 
                ? `অ্যাড মানি করার পর সাথে সাথে ক্যাশআউট করা যাবে না। নূন্যতম ২০ টাকার ক্রিপ্টো ক্রয়/ট্রেড করতে হবে (বাকি আছে ৳${remaining} টাকা)।` 
                : `After adding money, you must purchase at least 20 BDT crypto before withdrawing (Remaining: ৳${remaining} BDT).`;
            return window.Telegram?.WebApp?.showAlert ? window.Telegram.WebApp.showAlert(msg) : alert(msg);
        }

        if (amt < minAmount) {
            playAppSound('error');
            const msg = lang === 'bn' ? "সর্বনিম্ন উত্তোলন ২৫ টাকা (Minimum withdraw is 25 BDT)" : "Minimum withdraw amount is 25 BDT";
            return window.Telegram?.WebApp?.showAlert ? window.Telegram.WebApp.showAlert(msg) : alert(msg);
        }

        if (amt > maxAmount) {
            playAppSound('error');
            const msg = lang === 'bn' ? "সর্বোচ্চ উত্তোলন ৫,০০০ টাকা! ৫,০০০ টাকার বেশি একসাথে উইথড্র দেওয়া যাবে না।" : "Maximum withdraw limit is 5,000 BDT per request.";
            return window.Telegram?.WebApp?.showAlert ? window.Telegram.WebApp.showAlert(msg) : alert(msg);
        }

        if (amt > balance) {
            playAppSound('error');
            const msg = lang === 'bn' ? "অপর্যাপ্ত ব্যালেন্স" : "Insufficient balance";
            return window.Telegram?.WebApp?.showAlert ? window.Telegram.WebApp.showAlert(msg) : alert(msg);
        }

        const fee = calculateSendMoneyFee(amt);
        const receiveAmount = amt - fee;
        if (receiveAmount <= 0) {
            playAppSound('error');
            const msg = lang === 'bn' ? "সেন্ড মানি ফি বাদ দিলে প্রাপ্য টাকার পরিমাণ শূন্য বা কম হয়" : "Amount after fee must be greater than zero";
            return window.Telegram?.WebApp?.showAlert ? window.Telegram.WebApp.showAlert(msg) : alert(msg);
        }

        playAppSound('confirm');

        setPendingConfirmData({
            amount: amt,
            fee: fee,
            receiveAmount: receiveAmount,
            method: fiatWallet?.method || 'bKash',
            number: fiatWallet?.number || '',
            name: fiatWallet?.name || user?.first_name || 'User'
        });
        setShowConfirmWithdrawModal(true);
    };

    // Step 2: Execute Withdrawal when User Clicks Confirm in Permission Modal (or enters 2-Step PIN)
    const executeWithdrawalRequest = async (enteredPin = '') => {
        if (!pendingConfirmData || isSubmitting) return;
        const { amount: amt, fee, receiveAmount, method, number } = pendingConfirmData;
        setIsSubmitting(true);
        setWithdrawPinError('');
        try {
            await withdrawFiat({
                userId: user?.id || 123456789,
                amount: amt,
                fee: fee,
                receiveAmount: receiveAmount,
                twoStepPin: enteredPin || undefined
            });
            setShowConfirmWithdrawModal(false);
            setShowWithdrawPinModal(false);
            setPendingConfirmData(null);
            setWithdrawDetails({
                amount: amt,
                fee: fee,
                receiveAmount: receiveAmount,
                method: method,
                number: number
            });
            playAppSound('success');
            setShowFlowerModal(true);
            setAmount('');
            reloadData();
        } catch (e) {
            playAppSound('error');
            if (showWithdrawPinModal) {
                setWithdrawPinError(e.message || (lang === 'bn' ? 'ভুল পিন কোড!' : 'Invalid PIN!'));
            } else if (window.Telegram?.WebApp?.showAlert) {
                window.Telegram.WebApp.showAlert(e.message || "Withdrawal failed");
            } else {
                alert(e.message || "Withdrawal failed");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmWithdrawExecute = async () => {
        if (!pendingConfirmData || isSubmitting) return;
        if (twoStepEnabled) {
            playAppSound('confirm');
            setShowConfirmWithdrawModal(false);
            setWithdrawPinError('');
            setShowWithdrawPinModal(true);
            return;
        }
        await executeWithdrawalRequest('');
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
                        {lang === 'bn' ? 'উত্তোলনের পরিমাণ (২৫ – ৫,০০০ BDT)' : 'Amount (25 – 5,000 BDT)'}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                        Min ৳25 • Max ৳5,000
                    </span>
                </div>
                <div className="relative flex items-center">
                    <span className="absolute left-4 text-purple-600 font-black text-2xl select-none">৳</span>
                    <input 
                        type="number" 
                        step="0.01"
                        inputMode="decimal"
                        min="25"
                        max="5000"
                        value={amount} 
                        onChange={(e) => setAmount(e.target.value)} 
                        placeholder="25.00" 
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
                        <div style={{ backgroundColor: '#ffffff' }} className="w-11 h-11 rounded-2xl bg-white border border-slate-200/90 p-1.5 flex items-center justify-center shrink-0 shadow-xs tp-payment-logo-box">
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

            {/* Send Money Fee Chart & Limit Note */}
            <div className="p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/40 flex items-start gap-2.5">
                <Info size={16} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="text-[11px] text-blue-900 dark:text-blue-300 font-medium leading-relaxed space-y-1">
                    <p className="font-bold">
                        {lang === 'bn' 
                            ? 'সর্বনিম্ন উইথড্র: ৳২৫ টাকা | সর্বোচ্চ উইথড্র: ৳৫,০০০ টাকা' 
                            : 'Min Withdraw: 25 BDT | Max Withdraw: 5,000 BDT'}
                    </p>
                    <p>
                        {lang === 'bn' 
                            ? 'সেন্ড মানি ফি: ২৫–১০০৳ = ৫৳ | ১০১–৫০০৳ = ১০৳ | ৫০১–১০০০৳ = ১৫৳ | ১০০১–৫০০০৳ = ২০৳।' 
                            : 'Send Money Fee: 25–100 TK = 5 TK | 101–500 TK = 10 TK | 501–1000 TK = 15 TK | 1001–5000 TK = 20 TK.'}
                    </p>
                </div>
            </div>

            {/* Submit Button (Tactile 3D Button) */}
            <div className="pt-2 pb-6">
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

            {/* Withdrawal Permission / Confirmation Modal */}
            {showConfirmWithdrawModal && pendingConfirmData && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="relative bg-white dark:bg-slate-900 w-full max-w-[350px] p-6 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 animate-in zoom-in-95 duration-200 overflow-hidden text-slate-900 dark:text-white">
                        {/* Top Accent Glow */}
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600/15 to-indigo-600/15 border border-purple-500/30 flex items-center justify-center mx-auto mb-3 shadow-xs">
                            <ShieldCheck size={28} className="text-purple-600 dark:text-purple-400" />
                        </div>

                        <div className="text-center mb-4">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20 text-[10px] font-black uppercase tracking-wider mb-1">
                                {lang === 'bn' ? 'পারমিশন ও যাচাইকরণ' : 'CONFIRMATION REQUIRED'}
                            </span>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                                {lang === 'bn' ? 'উত্তোলন নিশ্চিত করুন' : 'Confirm Withdrawal'}
                            </h3>
                            <p className="text-[11.5px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                                {lang === 'bn' ? 'অনুগ্রহ করে আপনার নাম্বার এবং টাকার পরিমাণ যাচাই করুন' : 'Please review your account number and payout summary'}
                            </p>
                        </div>

                        {/* Wallet & Amount Review Box */}
                        <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/90 dark:border-slate-700/80 p-3.5 space-y-2.5 text-xs mb-5">
                            <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/80 dark:border-slate-700/80">
                                <span className="text-slate-500 dark:text-slate-400 font-bold">
                                    {lang === 'bn' ? 'প্রাপক ওয়ালেট:' : 'Receiving Wallet:'}
                                </span>
                                <div className="flex items-center gap-2">
                                    <div
                                        style={{ backgroundColor: '#ffffff' }}
                                        className="w-6 h-6 rounded-lg tp-payment-logo-box bg-white p-0.5 border border-slate-200 flex items-center justify-center shrink-0"
                                    >
                                        <img src={getPaymentLogo(pendingConfirmData.method)} alt={pendingConfirmData.method} className="w-full h-full object-contain" />
                                    </div>
                                    <span className="font-black text-slate-900 dark:text-white">{pendingConfirmData.method}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-slate-500 dark:text-slate-400 font-bold">
                                    {lang === 'bn' ? 'অ্যাকাউন্ট নাম্বার:' : 'Account Number:'}
                                </span>
                                <span className="font-mono font-black text-[13px] text-purple-600 dark:text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-lg border border-purple-500/20">
                                    {pendingConfirmData.number}
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-slate-500 dark:text-slate-400 font-bold">
                                    {lang === 'bn' ? 'উত্তোলনের পরিমাণ:' : 'Withdraw Amount:'}
                                </span>
                                <span className="font-bold font-mono text-slate-900 dark:text-white">
                                    ৳{Number(pendingConfirmData.amount).toFixed(2)} BDT
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-slate-500 dark:text-slate-400 font-bold">
                                    {lang === 'bn' ? 'সেন্ড মানি ফি:' : 'Send Money Fee:'}
                                </span>
                                <span className="font-bold font-mono text-rose-500">
                                    - ৳{Number(pendingConfirmData.fee).toFixed(2)} BDT
                                </span>
                            </div>

                            <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                                <span className="font-black text-slate-900 dark:text-white text-[13px]">
                                    {lang === 'bn' ? 'আপনি পাবেন (Net):' : 'You Will Receive:'}
                                </span>
                                <span className="font-black font-mono text-base text-emerald-600 dark:text-emerald-400">
                                    ৳{Number(pendingConfirmData.receiveAmount).toFixed(2)} BDT
                                </span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-2.5">
                            <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={() => {
                                    setShowConfirmWithdrawModal(false);
                                    setPendingConfirmData(null);
                                }}
                                className="h-[46px] rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-black text-xs active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                            >
                                {lang === 'bn' ? 'বাতিল করুন' : 'Cancel'}
                            </button>
                            <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={handleConfirmWithdrawExecute}
                                className="h-[46px] rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white font-black text-xs shadow-[0_4px_14px_rgba(16,185,129,0.35)] hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={15} className="animate-spin" />
                                        <span>{lang === 'bn' ? 'পাঠানো হচ্ছে...' : 'Sending...'}</span>
                                    </>
                                ) : (
                                    <>
                                        <Check size={16} strokeWidth={3} />
                                        <span>{lang === 'bn' ? 'হ্যাঁ, কনফার্ম' : 'Confirm'}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 2-Step PIN Verification Modal for Withdrawal */}
            <TwoStepPinModal
                isOpen={showWithdrawPinModal}
                onClose={() => {
                    if (!isSubmitting) {
                        setShowWithdrawPinModal(false);
                        setPendingConfirmData(null);
                    }
                }}
                onConfirmPin={(enteredPin) => executeWithdrawalRequest(enteredPin)}
                pinLength={twoStepLength}
                isSubmitting={isSubmitting}
                errorText={withdrawPinError}
                titleBn="উইথড্র ২-স্টেপ পিন যাচাই"
                titleEn="Verify Withdrawal PIN"
                subtitleBn={`৳${pendingConfirmData?.amount || 0} টাকা উত্তোলন নিশ্চিত করতে আপনার গোপন পিন দিন`}
                subtitleEn={`Enter your 2-Step PIN to confirm ৳${pendingConfirmData?.amount || 0} withdrawal`}
                darkMode={darkMode}
                lang={lang}
            />

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
                                            <div style={{ backgroundColor: '#ffffff' }} className="w-7 h-7 rounded-xl tp-payment-logo-box bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-2xs">
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


// ============================================================================
// TRUSTPAY MONTHLY GIVEAWAY PAGE
// ============================================================================
function formatGiveawayCountdown(ms) {
    const safeMs = Math.max(0, Number(ms) || 0);
    const totalSec = Math.floor(safeMs / 1000);
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return {
        days: pad(days),
        hours: pad(hours),
        minutes: pad(minutes),
        seconds: pad(seconds),
        totalMs: safeMs
    };
}

function GiveawayPage({
    cachedData = null,
    onUpdateCache,
    onJoinedBalanceUpdate,
    user,
    balance = 0,
    darkMode = false,
    lang = 'bn',
    onBack,
    onGoToAddMoney,
    onGoToReferral,
    onGoToBuyCrypto,
    onGoToSell,
    reloadData
}) {
    const [data, setData] = useState(cachedData || null);
    const [loading, setLoading] = useState(!cachedData && !data);
    const [joining, setJoining] = useState(false);
    const [justJoinedAnimation, setJustJoinedAnimation] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [nowMs, setNowMs] = useState(Date.now());

    const loadGiveaway = async (silent = false) => {
        if (!silent && !data) {
            setLoading(true);
        }
        try {
            const res = await fetchGiveawayStatus(user?.id || 123456789);
            if (res) {
                const stamped = { ...res, _cachedAt: Date.now() };
                setData(stamped);
                if (onUpdateCache) onUpdateCache(stamped);
                if (res.serverNow) {
                    setNowMs(res.serverNow);
                }
            }
        } catch (_) {}
        if (!silent) {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (cachedData && !data) {
            setData(cachedData);
            setLoading(false);
        }
    }, [cachedData]);

    useEffect(() => {
        const isAlreadyJoined = Boolean(cachedData?.userStatus?.alreadyJoined || data?.userStatus?.alreadyJoined);
        const cacheFresh = Boolean(cachedData?._cachedAt && (Date.now() - cachedData._cachedAt < 30000));
        if (isAlreadyJoined || cacheFresh) {
            setLoading(false);
            return;
        }
        loadGiveaway(Boolean(cachedData || data));
    }, [user?.id]);

    useEffect(() => {
        const timer = setInterval(() => {
            setNowMs(Date.now());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const campaign = data?.campaign || {
        title: 'TrustPay Monthly Mega Giveaway',
        status: 'active',
        endTime: Date.now() + 30 * 24 * 60 * 60 * 1000,
        holdAmountBdt: 20,
        minReferrals: 2,
        totalParticipants: 0,
        winners: []
    };
    const userStatus = data?.userStatus || {};
    const remainingMs = Math.max(0, Number(campaign.endTime || 0) - nowMs);
    const countdown = formatGiveawayCountdown(remainingMs);
    const isEnded = campaign.status === 'completed' || remainingMs <= 0;

    const fireQuadSpeedConfetti = () => {
        try {
            // Corner 1: Bottom-Left Cannon
            confetti({
                particleCount: 65,
                angle: 60,
                spread: 75,
                origin: { x: 0, y: 0.85 },
                startVelocity: 65,
                ticks: 260,
                gravity: 1.1,
                scalar: 1.15,
                colors: ['#F59E0B', '#10B981', '#6366F1', '#EC4899', '#FFD700', '#F97316']
            });
            // Corner 2: Bottom-Right Cannon
            confetti({
                particleCount: 65,
                angle: 120,
                spread: 75,
                origin: { x: 1, y: 0.85 },
                startVelocity: 65,
                ticks: 260,
                gravity: 1.1,
                scalar: 1.15,
                colors: ['#F59E0B', '#10B981', '#6366F1', '#EC4899', '#FFD700', '#F97316']
            });
            // Corner 3: Top-Left Cannon
            confetti({
                particleCount: 45,
                angle: 310,
                spread: 65,
                origin: { x: 0, y: 0.15 },
                startVelocity: 55,
                ticks: 260,
                gravity: 1.2,
                scalar: 1.05,
                colors: ['#F59E0B', '#10B981', '#6366F1', '#EC4899', '#FFD700']
            });
            // Corner 4: Top-Right Cannon
            confetti({
                particleCount: 45,
                angle: 230,
                spread: 65,
                origin: { x: 1, y: 0.15 },
                startVelocity: 55,
                ticks: 260,
                gravity: 1.2,
                scalar: 1.05,
                colors: ['#F59E0B', '#10B981', '#6366F1', '#EC4899', '#FFD700']
            });
            // Center Supernova Explosion
            setTimeout(() => {
                confetti({
                    particleCount: 90,
                    spread: 120,
                    origin: { x: 0.5, y: 0.45 },
                    startVelocity: 48,
                    ticks: 220,
                    gravity: 1,
                    scalar: 1.2,
                    colors: ['#FFD700', '#FFA500', '#10B981', '#8B5CF6', '#FFFFFF']
                });
            }, 180);
        } catch (_) {}
    };

    const handleJoin = async () => {
        if (joining || !userStatus.canJoin) return;
        setErrorMsg('');
        setSuccessMsg('');
        setJoining(true);
        try {
            playAppSound('tap');
            const res = await joinGiveaway(user?.id);

            // 1. One-time trophy fly-in slam physics animation
            setJustJoinedAnimation(true);
            try {
                localStorage.setItem('tp_gw_trophy_animated_' + (user?.id || 'guest'), 'true');
            } catch (_) {}

            // 2. High-speed multi-angle confetti physics burst from all 4 sides
            fireQuadSpeedConfetti();

            // 3. Audio celebration
            playAppSound('success');

            // 4. Update data & parent balance state immediately from join response (0 extra reads)
            const updatedPayload = data ? {
                ...data,
                _cachedAt: Date.now(),
                campaign: {
                    ...data.campaign,
                    totalParticipants: Number(res.totalParticipants ?? ((data.campaign?.totalParticipants || 0) + 1))
                },
                userStatus: {
                    ...data.userStatus,
                    balance: Number(res.balance ?? data.userStatus?.balance ?? 0),
                    heldBdt: Number(res.giveawayHoldBdt ?? data.userStatus?.heldBdt ?? 20),
                    alreadyJoined: true,
                    joinedEntry: res.entry || data.userStatus?.joinedEntry || null,
                    canJoin: false
                }
            } : null;
            if (updatedPayload) {
                setData(updatedPayload);
                if (onUpdateCache) onUpdateCache(updatedPayload);
            }
            if (onJoinedBalanceUpdate) {
                onJoinedBalanceUpdate(res.balance, res.giveawayHoldBdt);
            }

            setTimeout(() => {
                setJustJoinedAnimation(false);
            }, 4000);
        } catch (err) {
            playAppSound('error');
            setErrorMsg(err.message || 'Failed to join giveaway');
        } finally {
            setJoining(false);
        }
    };

    const liveBalance = Number.isFinite(Number(userStatus.balance)) && !userStatus.isGuest ? Number(userStatus.balance) : Number(balance || 0);
    const balanceOk = userStatus.alreadyJoined ? true : liveBalance >= Number(campaign.holdAmountBdt || 20);
    const referralOk = Boolean(userStatus.referralOk);
    const tradeOk = Boolean(userStatus.tradeOk);
    const completedCount = (balanceOk ? 1 : 0) + (referralOk ? 1 : 0) + (tradeOk ? 1 : 0);

    const displayName = user?.first_name
        ? `${user.first_name} ${user.last_name || ''}`.trim()
        : (user?.username ? `@${user.username}` : (lang === 'bn' ? 'সম্মানিত ইউজার' : 'TrustPay VIP User'));
    const displayId = user?.id || '777888';

    return (
        <div className="space-y-2 animate-in fade-in duration-200 relative z-10 select-none">
            {/* Top Navigation Row */}
            <div className="flex items-center justify-between h-7 px-0.5">
                <button
                    type="button"
                    onClick={() => {
                        playAppSound('tap');
                        onBack && onBack();
                    }}
                    className={`flex items-center gap-1.5 h-7 px-3 rounded-full text-[11px] font-bold transition active:scale-95 cursor-pointer backdrop-blur-md ${
                        darkMode
                            ? 'bg-slate-900/90 border border-slate-700/80 text-slate-200 hover:bg-slate-800'
                            : 'bg-white/95 border border-violet-200/80 text-slate-700 hover:bg-violet-50 shadow-[0_2px_8px_rgba(109,40,217,0.08)]'
                    }`}
                >
                    <ArrowLeft size={12} />
                    <span>{lang === 'bn' ? 'হোম' : 'Home'}</span>
                </button>

                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black backdrop-blur-md ${
                    campaign.status === 'completed'
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-400/40'
                        : isEnded
                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-400/40'
                            : darkMode
                                ? 'bg-amber-500/15 text-amber-300 border border-amber-400/35 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                                : 'bg-white/95 text-[#7C3AED] border border-amber-200 shadow-[0_2px_10px_rgba(245,158,11,0.15)]'
                }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                    <span>
                        {campaign.status === 'completed'
                            ? (lang === 'bn' ? 'বিজয়ী ঘোষিত' : 'Completed')
                            : isEnded
                                ? (lang === 'bn' ? 'ফলাফল শীঘ্রই' : 'Result Soon')
                                : (lang === 'bn' ? '১ মাসের মেগা ইভেন্ট লাইভ' : '1-Month Mega Live')}
                    </span>
                </div>
            </div>

            {userStatus.alreadyJoined ? (
                /* ================================================================ */
                /* JOINED STATE: TOP MASTER CARD -> TIME CAPSULE -> USER VERIFIED CARD -> FINAL STATUS (NO BUTTON) */
                /* ================================================================ */
                <div className="space-y-2 animate-in fade-in duration-300">
                    {/* 1. MASTER PRIZE POOL CARD (Top Center) */}
                    <div
                        className={`relative overflow-hidden rounded-[26px] p-3.5 sm:p-4 border transition-all duration-300 ${
                            darkMode
                                ? 'bg-gradient-to-b from-[#1C143B]/95 via-[#130E2B]/95 to-[#0D0920]/95 border-amber-400/40 shadow-[0_16px_40px_rgba(0,0,0,0.6),0_0_24px_rgba(245,158,11,0.2)] text-white'
                                : 'bg-gradient-to-b from-white/95 via-[#FAF5FF]/95 to-[#FFFBEB]/95 border-amber-300/80 shadow-[0_12px_36px_rgba(109,40,217,0.12),0_2px_20px_rgba(245,158,11,0.18)] text-[#1E1B4B]'
                        }`}
                    >
                        {/* Botanical Rose Watermark (Top-Right) */}
                        <div
                            className="absolute -right-3 -top-2 w-[170px] pointer-events-none select-none overflow-hidden opacity-25 dark:opacity-20"
                            style={{
                                WebkitMaskImage: 'radial-gradient(circle at top right, black 40%, transparent 85%)',
                                maskImage: 'radial-gradient(circle at top right, black 40%, transparent 85%)'
                            }}
                        >
                            <img
                                src={roseBotanicalArt}
                                alt=""
                                aria-hidden="true"
                                draggable={false}
                                className="w-full h-auto object-contain"
                            />
                        </div>

                        {/* Soft Ambient Radiant Glow */}
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                background: darkMode
                                    ? 'radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.22) 0%, rgba(124,58,237,0.25) 45%, transparent 75%)'
                                    : 'radial-gradient(ellipse at 50% 0%, rgba(254,240,138,0.70) 0%, rgba(237,233,254,0.45) 50%, transparent 75%)'
                            }}
                        />

                        {/* Event Header Tag */}
                        <div className="relative z-10 flex items-center justify-center">
                            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white text-[9px] font-black uppercase tracking-widest shadow-xs">
                                <Sparkles size={11} className="text-yellow-200" />
                                <span>TRUSTPAY MEGA FESTIVAL</span>
                                <Sparkles size={11} className="text-yellow-200" />
                            </div>
                        </div>

                        {/* Centerpiece: Badge + ৳50,000 + Golden Trophy (Slam Animation on Join) */}
                        <div className="relative z-10 flex items-center justify-center gap-3 mt-1.5">
                            {/* Floating 3D Golden Badge */}
                            <div className="tp-giveaway-float relative w-[60px] h-[52px] shrink-0 flex items-center justify-center">
                                <img
                                    src={giveawayBadgeImg}
                                    alt="TrustPay Giveaway"
                                    draggable={false}
                                    className="w-full h-full object-contain drop-shadow-[0_8px_16px_rgba(245,158,11,0.5)]"
                                />
                                <span className="tp-giveaway-shine" />
                            </div>

                            {/* ৳50,000 Headline */}
                            <div className="text-left">
                                <div className="flex items-center gap-1 text-[9.5px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                                    <Crown size={11} className="fill-amber-500 text-amber-500" />
                                    <span>১ম মেগা জ্যাকপট ক্যাশ</span>
                                </div>
                                <div className="text-[34px] font-black tracking-tight leading-none text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-700 dark:from-yellow-200 dark:via-amber-400 dark:to-yellow-100 drop-shadow-[0_2px_12px_rgba(245,158,11,0.3)]">
                                    ৳50,000
                                </div>
                                <p className="text-[9px] font-bold text-violet-700 dark:text-violet-200/90 mt-0.5">
                                    সর্বমোট প্রাইজ পুল ৳৬৭,১৪০ • ১০ জন বিজয়ী
                                </p>
                            </div>

                            {/* Golden Trophy Slot (With high-velocity physics slam on join!) */}
                            <div className="relative shrink-0 flex items-center justify-center">
                                {justJoinedAnimation && (
                                    <div className="absolute inset-0 rounded-full bg-amber-400/80 blur-md pointer-events-none tp-golden-flash" />
                                )}
                                <div className={justJoinedAnimation ? 'tp-trophy-slam' : ''}>
                                    <TelegramAnimatedSticker src="tg-trophy-sticker.json" size={54} />
                                </div>
                            </div>
                        </div>

                        {/* 3 Prize Podium Tiles */}
                        <div className="relative z-10 mt-2 pt-2 border-t border-amber-300/40 dark:border-white/10">
                            <div className="grid grid-cols-3 gap-1.5">
                                <div className={`rounded-xl p-1.5 text-center border relative overflow-hidden flex flex-col justify-center ${
                                    darkMode ? 'bg-gradient-to-b from-amber-500/20 to-amber-500/5 border-amber-400/40 shadow-xs' : 'bg-gradient-to-b from-amber-100/70 to-white border-amber-300/80 shadow-2xs'
                                }`}>
                                    <div className="text-[9px] font-black text-amber-700 dark:text-amber-400">🥇 ১ম পুরস্কার</div>
                                    <div className="text-[14px] font-black text-amber-600 dark:text-amber-400 mt-0.5 leading-tight">৳50,000</div>
                                </div>
                                <div className={`rounded-xl p-1.5 text-center border relative overflow-hidden flex flex-col justify-center ${
                                    darkMode ? 'bg-gradient-to-b from-indigo-500/20 to-violet-500/5 border-indigo-400/30' : 'bg-gradient-to-b from-violet-100/70 to-white border-violet-200 shadow-2xs'
                                }`}>
                                    <div className="text-[9px] font-black text-violet-700 dark:text-violet-300">🥈 ২য় পুরস্কার</div>
                                    <div className="text-[14px] font-black text-violet-700 dark:text-violet-300 mt-0.5 leading-tight">৳15,000</div>
                                </div>
                                <div className={`rounded-xl p-1.5 text-center border relative overflow-hidden flex flex-col justify-center ${
                                    darkMode ? 'bg-gradient-to-b from-emerald-500/20 to-teal-500/5 border-emerald-400/30' : 'bg-gradient-to-b from-emerald-100/70 to-white border-emerald-200 shadow-2xs'
                                }`}>
                                    <div className="text-[9px] font-black text-emerald-700 dark:text-emerald-300">🥉 ৩য় পুরস্কার</div>
                                    <div className="text-[14px] font-black text-emerald-700 dark:text-emerald-300 mt-0.5 leading-tight">৳2,000</div>
                                </div>
                            </div>

                            {/* 4th-10th Ribbon */}
                            <div className={`mt-1.5 flex items-center justify-between px-2.5 py-1 rounded-lg text-[9.5px] font-bold ${
                                darkMode ? 'bg-white/[0.04] text-slate-300 border border-white/5' : 'bg-amber-500/[0.08] border border-amber-300/50 text-slate-700'
                            }`}>
                                <span className="flex items-center gap-1">
                                    <Gift size={11} className="text-amber-500 shrink-0" />
                                    <span>৪র্থ – ১০ম পুরস্কার (৭ জন বিজয়ী):</span>
                                </span>
                                <span className="font-black text-amber-600 dark:text-amber-400">জনপ্রতি ৳20</span>
                            </div>
                        </div>
                    </div>

                    {/* 2. UNIQUE COUNTDOWN TIME SETTINGS CAPSULE ("tar niche sundor uniqe time settings") */}
                    <div
                        className={`relative overflow-hidden rounded-[20px] px-3.5 py-2 border transition-all duration-300 backdrop-blur-md flex items-center justify-between ${
                            darkMode
                                ? 'bg-[#150E2A]/90 border-amber-400/35 shadow-[0_4px_16px_rgba(0,0,0,0.4)]'
                                : 'bg-white/95 border-amber-200/90 shadow-[0_4px_18px_rgba(109,40,217,0.08)]'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-500 shrink-0">
                                <Clock size={13} className="animate-pulse" />
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] font-black text-amber-700 dark:text-amber-300 leading-tight">
                                    সমাপ্তির সময় বাকি (ড্র ও ফলাফল ঘোষণা)
                                </p>
                                <p className="text-[8px] font-semibold text-slate-500 dark:text-slate-400">
                                    ইভেন্ট সমাপ্ত হলে বিজয়ী ঘোষণা হবে
                                </p>
                            </div>
                        </div>

                        {/* 4 Digital Timer Units */}
                        <div className="flex items-center gap-1 font-mono">
                            {[
                                { val: countdown.days, lbl: 'দিন' },
                                { val: countdown.hours, lbl: 'ঘণ্টা' },
                                { val: countdown.minutes, lbl: 'মি' },
                                { val: countdown.seconds, lbl: 'সে' }
                            ].map((item, i) => (
                                <div
                                    key={i}
                                    className="flex items-baseline gap-0.5 px-2 py-0.5 rounded-lg bg-amber-500/[0.08] dark:bg-white/[0.08] border border-amber-300/40 dark:border-white/10 shadow-2xs"
                                >
                                    <span className="text-[12px] font-black leading-none text-amber-600 dark:text-amber-300">
                                        {item.val}
                                    </span>
                                    <span className="text-[7.5px] font-bold text-slate-500 dark:text-slate-400">
                                        {item.lbl}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 3. USER PROFILE & 3 FULFILLED CONDITIONS ("tar niche je user joined korche tar nam,Trustpay ID tarpor se je 3 ta sortho puron karche tar pashe tick cihinno thakbe") */}
                    <div
                        className={`relative overflow-hidden rounded-[24px] p-3.5 border transition-all duration-300 ${
                            darkMode
                                ? 'bg-gradient-to-b from-[#181133]/95 via-[#120C27]/95 to-[#0B071A]/95 border-emerald-500/35 shadow-[0_8px_24px_rgba(0,0,0,0.5)]'
                                : 'bg-gradient-to-b from-emerald-50/70 via-white to-amber-50/40 border-emerald-200/90 shadow-[0_8px_24px_rgba(16,185,129,0.08)]'
                        }`}
                    >
                        {/* User Profile Header */}
                        <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20 dark:border-white/10">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-400 p-[1.5px] shrink-0 shadow-xs flex items-center justify-center">
                                    <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-white font-black text-[11px] uppercase">
                                        {(displayName || 'U')[0]}
                                    </div>
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <span className={`text-[12px] font-black truncate ${darkMode ? 'text-white' : 'text-[#1E1B4B]'}`}>
                                            {displayName}
                                        </span>
                                        <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                                    </div>
                                    <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 tracking-wide">
                                        TrustPay ID: #{displayId}
                                    </p>
                                </div>
                            </div>

                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-600 dark:text-emerald-400 text-[9.5px] font-black shrink-0">
                                <Sparkles size={10} className="text-emerald-500" />
                                <span>ভেরিফাইড অংশগ্রহণ</span>
                            </span>
                        </div>

                        {/* 3 Fulfilled Conditions with Green Tick Marks */}
                        <div className="mt-2 space-y-1.5">
                            {/* Condition 1: ৳20 Hold */}
                            <div className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl border ${
                                darkMode ? 'bg-emerald-500/[0.08] border-emerald-500/25' : 'bg-white/90 border-emerald-200/80 shadow-2xs'
                            }`}>
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-xs">
                                        <Check size={11} strokeWidth={3} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className={`text-[10px] font-bold truncate ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                                            ৳20.00 ব্যালেন্স হোল্ড সম্পন্ন
                                        </p>
                                        <p className="text-[8px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                            সুরক্ষিত হোল্ড • ড্র সমাপ্তির পর অটো আনলক
                                        </p>
                                    </div>
                                </div>
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[9px] font-black shrink-0">
                                    <CheckCircle2 size={10} />
                                    <span>পূরণ ✅</span>
                                </span>
                            </div>

                            {/* Condition 2: 2 Referrals */}
                            <div className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl border ${
                                darkMode ? 'bg-emerald-500/[0.08] border-emerald-500/25' : 'bg-white/90 border-emerald-200/80 shadow-2xs'
                            }`}>
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-xs">
                                        <Check size={11} strokeWidth={3} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className={`text-[10px] font-bold truncate ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                                            কমপক্ষে ২টি রেফারেল সম্পন্ন
                                        </p>
                                        <p className="text-[8px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                            অগ্রগতি: {userStatus.referralCount || 2}/{campaign.minReferrals || 2} টি রেফারেল সম্পন্ন
                                        </p>
                                    </div>
                                </div>
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[9px] font-black shrink-0">
                                    <CheckCircle2 size={10} />
                                    <span>পূরণ ✅</span>
                                </span>
                            </div>

                            {/* Condition 3: Crypto Buy/Sell */}
                            <div className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl border ${
                                darkMode ? 'bg-emerald-500/[0.08] border-emerald-500/25' : 'bg-white/90 border-emerald-200/80 shadow-2xs'
                            }`}>
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-xs">
                                        <Check size={11} strokeWidth={3} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className={`text-[10px] font-bold truncate ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                                            ১টি Crypto Buy বা Sell সম্পন্ন
                                        </p>
                                        <p className="text-[8px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                            ট্রেড স্ট্যাটাস: {userStatus.totalCryptoTrades || 1}/1 সফল ট্রেড সম্পন্ন
                                        </p>
                                    </div>
                                </div>
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[9px] font-black shrink-0">
                                    <CheckCircle2 size={10} />
                                    <span>পূরণ ✅</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 4. FINAL SUCCESS NOTICE - NO BUTTON AT ALL ("and niche kono button thakbe na final likha thakbe you are succesfuly joined the giveway wait for winner selection") */}
                    <div
                        className={`relative overflow-hidden rounded-[22px] p-3 text-center border transition-all duration-300 ${
                            darkMode
                                ? 'bg-gradient-to-r from-amber-500/15 via-emerald-500/15 to-amber-500/15 border-amber-400/35 shadow-[0_4px_16px_rgba(245,158,11,0.12)]'
                                : 'bg-gradient-to-r from-amber-100/80 via-emerald-100/70 to-amber-100/80 border-amber-300/80 shadow-[0_4px_16px_rgba(245,158,11,0.10)]'
                        }`}
                    >
                        <div className="inline-flex items-center gap-1.5 text-[12px] font-black text-amber-600 dark:text-amber-300">
                            <Sparkles size={14} className="text-amber-500" />
                            <span>You are successfully joined the Giveaway!</span>
                            <Sparkles size={14} className="text-amber-500" />
                        </div>
                        <p className="text-[10px] font-bold text-slate-700 dark:text-slate-200 mt-0.5">
                            Wait for winner selection • বিজয়ী নির্বাচনের জন্য অপেক্ষা করুন
                        </p>
                        <p className="text-[8.5px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                            আপনার হোল্ডকৃত ৳২০.০০ সম্পূর্ণ সুরক্ষিত এবং ড্র সমাপ্ত হলে স্বয়ংক্রিয়ভাবে আপনার মেইন ব্যালেন্সে যুক্ত হবে।
                        </p>
                    </div>
                </div>
            ) : (
                /* ================================================================ */
                /* UNJOINED STATE: MASTER ALL-IN-ONE CARD WITH 3 MISSIONS & CTA BUTTON */
                /* ================================================================ */
                <div
                    className={`relative overflow-hidden rounded-[28px] p-4 sm:p-5 border transition-all duration-300 ${
                        darkMode
                            ? 'bg-gradient-to-b from-[#1C143B]/95 via-[#130E2B]/95 to-[#0D0920]/95 border-amber-400/40 shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_28px_rgba(245,158,11,0.2)] text-white'
                            : 'bg-gradient-to-b from-white/95 via-[#FAF5FF]/95 to-[#FFFBEB]/95 border-amber-300/80 shadow-[0_16px_45px_rgba(109,40,217,0.14),0_2px_24px_rgba(245,158,11,0.20)] text-[#1E1B4B]'
                    }`}
                >
                    {/* 1. Internal Flower Art Watermark (Top-Right Bloom) */}
                    <div
                        className="absolute -right-4 -top-3 w-[185px] pointer-events-none select-none overflow-hidden opacity-30 dark:opacity-20"
                        style={{
                            WebkitMaskImage: 'radial-gradient(circle at top right, black 40%, transparent 85%)',
                            maskImage: 'radial-gradient(circle at top right, black 40%, transparent 85%)'
                        }}
                    >
                        <img
                            src={roseBotanicalArt}
                            alt=""
                            aria-hidden="true"
                            draggable={false}
                            className="w-full h-auto object-contain"
                        />
                    </div>

                    {/* 2. Soft Ambient Radiant Glow */}
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background: darkMode
                                ? 'radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.22) 0%, rgba(124,58,237,0.25) 45%, transparent 75%)'
                                : 'radial-gradient(ellipse at 50% 0%, rgba(254,240,138,0.70) 0%, rgba(237,233,254,0.45) 50%, transparent 75%)'
                        }}
                    />

                    {/* 3. Hero Header Tag */}
                    <div className="relative z-10 flex items-center justify-center">
                        <div className="inline-flex items-center gap-1.5 px-3.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white text-[9px] font-black uppercase tracking-widest shadow-sm">
                            <Sparkles size={11} className="text-yellow-200" />
                            <span>TRUSTPAY MEGA FESTIVAL</span>
                            <Sparkles size={11} className="text-yellow-200" />
                        </div>
                    </div>

                    {/* 4. Hero Centerpiece: 3D Badge + ৳50,000 + Animated Trophy */}
                    <div className="relative z-10 flex items-center justify-center gap-3.5 mt-2">
                        {/* Floating 3D Golden Badge */}
                        <div className="tp-giveaway-float relative w-[68px] h-[58px] shrink-0 flex items-center justify-center">
                            <img
                                src={giveawayBadgeImg}
                                alt="TrustPay Giveaway"
                                draggable={false}
                                className="w-full h-full object-contain drop-shadow-[0_8px_18px_rgba(245,158,11,0.5)]"
                            />
                            <span className="tp-giveaway-shine" />
                        </div>

                        {/* Massive ৳50,000 Headline */}
                        <div className="text-left">
                            <div className="flex items-center gap-1 text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                                <Crown size={12} className="fill-amber-500 text-amber-500" />
                                <span>১ম মেগা জ্যাকপট ক্যাশ</span>
                            </div>
                            <div className="text-[38px] font-black tracking-tight leading-none text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-700 dark:from-yellow-200 dark:via-amber-400 dark:to-yellow-100 drop-shadow-[0_2px_14px_rgba(245,158,11,0.35)]">
                                ৳50,000
                            </div>
                            <p className="text-[9.5px] font-bold text-violet-700 dark:text-violet-200/90 mt-0.5">
                                সর্বমোট প্রাইজ পুল ৳৬৭,১৪০ • ১০ জন বিজয়ী
                            </p>
                        </div>

                        {/* Animated Telegram Sticker */}
                        <div className="shrink-0 flex items-center justify-center -ml-1">
                            <TelegramAnimatedSticker src="tg-trophy-sticker.json" size={56} />
                        </div>
                    </div>

                    {/* 5. Sleek Golden Digital Countdown */}
                    <div className="relative z-10 mt-2.5 rounded-2xl px-3 py-1.5 flex items-center justify-between bg-amber-500/[0.08] dark:bg-black/40 border border-amber-400/35 backdrop-blur-md">
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-700 dark:text-amber-300">
                            <Clock size={12} className="text-amber-500" />
                            <span>সময় বাকি:</span>
                        </div>

                        <div className="flex items-center gap-1.5 font-mono">
                            {[
                                { val: countdown.days, lbl: 'দিন' },
                                { val: countdown.hours, lbl: 'ঘণ্টা' },
                                { val: countdown.minutes, lbl: 'মি' },
                                { val: countdown.seconds, lbl: 'সে' }
                            ].map((item, i) => (
                                <div
                                    key={i}
                                    className="flex items-baseline gap-0.5 px-2 py-0.5 rounded-lg bg-white/70 dark:bg-white/[0.08] border border-amber-200/80 dark:border-white/10 shadow-2xs"
                                >
                                    <span className="text-[12.5px] font-black leading-none text-amber-600 dark:text-amber-300">
                                        {item.val}
                                    </span>
                                    <span className="text-[8px] font-bold text-slate-500 dark:text-slate-300">
                                        {item.lbl}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 6. Prize Pool Podium Tiles (Seamless Inside the Master Card) */}
                    <div className="relative z-10 mt-2.5 pt-2.5 border-t border-amber-300/40 dark:border-white/10">
                        <div className="grid grid-cols-3 gap-2">
                            {/* 1st Prize */}
                            <div className={`rounded-2xl p-2 text-center border relative overflow-hidden min-h-[64px] flex flex-col justify-center ${
                                darkMode
                                    ? 'bg-gradient-to-b from-amber-500/20 to-amber-500/5 border-amber-400/40 shadow-[0_2px_10px_rgba(245,158,11,0.15)]'
                                    : 'bg-gradient-to-b from-amber-100/70 to-white border-amber-300/80 shadow-[0_2px_10px_rgba(245,158,11,0.1)]'
                            }`}>
                                <div className="text-[9.5px] font-black text-amber-700 dark:text-amber-400">
                                    🥇 ১ম পুরস্কার
                                </div>
                                <div className="text-[15px] font-black text-amber-600 dark:text-amber-400 mt-0.5 leading-tight">
                                    ৳50,000
                                </div>
                            </div>

                            {/* 2nd Prize */}
                            <div className={`rounded-2xl p-2 text-center border relative overflow-hidden min-h-[64px] flex flex-col justify-center ${
                                darkMode
                                    ? 'bg-gradient-to-b from-indigo-500/20 to-violet-500/5 border-indigo-400/30'
                                    : 'bg-gradient-to-b from-violet-100/70 to-white border-violet-200 shadow-2xs'
                            }`}>
                                <div className="text-[9.5px] font-black text-violet-700 dark:text-violet-300">
                                    🥈 ২য় পুরস্কার
                                </div>
                                <div className="text-[15px] font-black text-violet-700 dark:text-violet-300 mt-0.5 leading-tight">
                                    ৳15,000
                                </div>
                            </div>

                            {/* 3rd Prize */}
                            <div className={`rounded-2xl p-2 text-center border relative overflow-hidden min-h-[64px] flex flex-col justify-center ${
                                darkMode
                                    ? 'bg-gradient-to-b from-emerald-500/20 to-teal-500/5 border-emerald-400/30'
                                    : 'bg-gradient-to-b from-emerald-100/70 to-white border-emerald-200 shadow-2xs'
                            }`}>
                                <div className="text-[9.5px] font-black text-emerald-700 dark:text-emerald-300">
                                    🥉 ৩য় পুরস্কার
                                </div>
                                <div className="text-[15px] font-black text-emerald-700 dark:text-emerald-300 mt-0.5 leading-tight">
                                    ৳2,000
                                </div>
                            </div>
                        </div>

                        {/* 4th-10th Ribbon */}
                        <div className={`mt-2 flex items-center justify-between px-3 py-1.5 rounded-xl text-[10px] font-bold ${
                            darkMode ? 'bg-white/[0.04] text-slate-300 border border-white/5' : 'bg-amber-500/[0.08] border border-amber-300/50 text-slate-700'
                        }`}>
                            <span className="flex items-center gap-1.5">
                                <Gift size={12} className="text-amber-500 shrink-0" />
                                <span>৪র্থ – ১০ম পুরস্কার (৭ জন বিজয়ী):</span>
                            </span>
                            <span className="font-black text-amber-600 dark:text-amber-400 text-[10.5px]">
                                জনপ্রতি ৳20
                            </span>
                        </div>
                    </div>

                    {/* 7. Gamified 3 Missions Card */}
                    <div className="relative z-10 mt-2.5 pt-2.5 border-t border-amber-300/40 dark:border-white/10">
                        {loading ? (
                            <div className="py-6 flex items-center justify-center text-slate-400 gap-1.5">
                                <Loader2 size={16} className="animate-spin text-amber-500" />
                                <span className="text-[11px] font-semibold">{lang === 'bn' ? 'যাচাই হচ্ছে...' : 'Checking...'}</span>
                            </div>
                        ) : (
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-1.5">
                                        <ShieldCheck size={14} className="text-amber-500" />
                                        <span className={`text-[10.5px] font-black ${darkMode ? 'text-white' : 'text-[#1E1B4B]'}`}>
                                            অংশগ্রহণের ৩টি মিশন
                                        </span>
                                    </div>
                                    {/* 3 Segmented Progress Bars */}
                                    <div className="flex items-center gap-1">
                                        {[1, 2, 3].map((step) => (
                                            <span
                                                key={step}
                                                className={`h-1.5 w-4 rounded-full transition-all duration-300 ${
                                                    completedCount >= step
                                                        ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                                                        : darkMode ? 'bg-slate-700' : 'bg-slate-200'
                                                }`}
                                            />
                                        ))}
                                        <span className="text-[9.5px] font-black ml-1 text-emerald-600 dark:text-emerald-400">
                                            {completedCount}/3
                                        </span>
                                    </div>
                                </div>

                                {/* Mission 1: ৳20 Hold */}
                                <div className={`flex items-center justify-between px-3 py-2 rounded-xl border transition-all ${
                                    balanceOk
                                        ? (darkMode ? 'bg-emerald-500/15 border-emerald-500/40' : 'bg-emerald-50/90 border-emerald-300')
                                        : (darkMode ? 'bg-white/[0.04] border-white/10' : 'bg-white/80 border-slate-200/90 shadow-2xs')
                                }`}>
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-[11px] font-black ${
                                            balanceOk ? 'bg-emerald-500 text-white shadow-2xs' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                                        }`}>
                                            {balanceOk ? <Check size={13} strokeWidth={3} /> : '💰'}
                                        </div>
                                        <div className="min-w-0">
                                            <p className={`text-[10.5px] font-extrabold leading-tight ${darkMode ? 'text-white' : 'text-[#1E1B4B]'}`}>
                                                ৳20.00 ব্যালেন্স হোল্ড
                                            </p>
                                            <p className="text-[8.5px] text-slate-500 dark:text-slate-400">
                                                ব্যালেন্স: ৳{liveBalance.toFixed(2)} • ফলাফলের পর আনলক
                                            </p>
                                        </div>
                                    </div>
                                    {balanceOk ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[9px] font-black shrink-0 border border-emerald-500/30">
                                            <CheckCircle2 size={11} />
                                            <span>পূরণ</span>
                                        </span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => { playAppSound('tap'); onGoToAddMoney && onGoToAddMoney(); }}
                                            className="px-3 py-1 rounded-lg text-white text-[9px] font-black shrink-0 cursor-pointer active:scale-95 shadow-2xs bg-gradient-to-r from-amber-500 to-amber-600"
                                        >
                                            ডিপোজিট
                                        </button>
                                    )}
                                </div>

                                {/* Mission 2: 2 Referrals */}
                                <div className={`flex items-center justify-between px-3 py-2 rounded-xl border transition-all ${
                                    referralOk
                                        ? (darkMode ? 'bg-emerald-500/15 border-emerald-500/40' : 'bg-emerald-50/90 border-emerald-300')
                                        : (darkMode ? 'bg-white/[0.04] border-white/10' : 'bg-white/80 border-slate-200/90 shadow-2xs')
                                }`}>
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-[11px] font-black ${
                                            referralOk ? 'bg-emerald-500 text-white shadow-2xs' : 'bg-violet-100 text-[#6D28D9] dark:bg-violet-500/20 dark:text-violet-300'
                                        }`}>
                                            {referralOk ? <Check size={13} strokeWidth={3} /> : '👥'}
                                        </div>
                                        <div className="min-w-0">
                                            <p className={`text-[10.5px] font-extrabold leading-tight ${darkMode ? 'text-white' : 'text-[#1E1B4B]'}`}>
                                                কমপক্ষে ২টি রেফারেল
                                            </p>
                                            <p className="text-[8.5px] text-slate-500 dark:text-slate-400">
                                                অগ্রগতি: {userStatus.referralCount || 0}/{campaign.minReferrals || 2} টি সম্পন্ন
                                            </p>
                                        </div>
                                    </div>
                                    {referralOk ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[9px] font-black shrink-0 border border-emerald-500/30">
                                            <CheckCircle2 size={11} />
                                            <span>পূরণ</span>
                                        </span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => { playAppSound('tap'); onGoToReferral && onGoToReferral(); }}
                                            className="px-3 py-1 rounded-lg text-white text-[9px] font-black shrink-0 cursor-pointer active:scale-95 shadow-2xs bg-gradient-to-r from-violet-600 to-purple-600"
                                        >
                                            রেফার
                                        </button>
                                    )}
                                </div>

                                {/* Mission 3: 1 Crypto Buy/Sell */}
                                <div className={`flex items-center justify-between px-3 py-2 rounded-xl border transition-all ${
                                    tradeOk
                                        ? (darkMode ? 'bg-emerald-500/15 border-emerald-500/40' : 'bg-emerald-50/90 border-emerald-300')
                                        : (darkMode ? 'bg-white/[0.04] border-white/10' : 'bg-white/80 border-slate-200/90 shadow-2xs')
                                }`}>
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-[11px] font-black ${
                                            tradeOk ? 'bg-emerald-500 text-white shadow-2xs' : 'bg-pink-100 text-pink-600 dark:bg-pink-500/20 dark:text-pink-300'
                                        }`}>
                                            {tradeOk ? <Check size={13} strokeWidth={3} /> : '⚡'}
                                        </div>
                                        <div className="min-w-0">
                                            <p className={`text-[10.5px] font-extrabold leading-tight ${darkMode ? 'text-white' : 'text-[#1E1B4B]'}`}>
                                                ১টি Crypto Buy বা Sell
                                            </p>
                                            <p className="text-[8.5px] text-slate-500 dark:text-slate-400">
                                                ট্রেড: {userStatus.totalCryptoTrades || 0}/1 (যেকোনো পরিমাণ)
                                            </p>
                                        </div>
                                    </div>
                                    {tradeOk ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[9px] font-black shrink-0 border border-emerald-500/30">
                                            <CheckCircle2 size={11} />
                                            <span>পূরণ</span>
                                        </span>
                                    ) : (
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => { playAppSound('tap'); onGoToBuyCrypto && onGoToBuyCrypto(); }}
                                                className="px-2.5 py-1 rounded-lg text-white text-[8.5px] font-black cursor-pointer active:scale-95 shadow-2xs bg-gradient-to-r from-violet-600 to-indigo-600"
                                            >
                                                Buy
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { playAppSound('tap'); onGoToSell && onGoToSell(); }}
                                                className="px-2.5 py-1 rounded-lg text-white text-[8.5px] font-black cursor-pointer active:scale-95 shadow-2xs bg-gradient-to-r from-pink-500 to-rose-500"
                                            >
                                                Sell
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {userStatus.isGuest && (
                                    <p className="text-[9px] text-[#6D28D9] dark:text-violet-300 font-semibold text-center pt-0.5">
                                        জয়েন করতে টেলিগ্রাম বট থেকে MiniApp ওপেন করুন।
                                    </p>
                                )}

                                {errorMsg && (
                                    <div className="p-1 rounded-xl bg-rose-500/15 border border-rose-500/35 text-rose-500 text-[9.5px] font-bold text-center">
                                        {errorMsg}
                                    </div>
                                )}
                                {successMsg && (
                                    <div className="p-1 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-600 dark:text-emerald-400 text-[9.5px] font-bold text-center">
                                        {successMsg}
                                    </div>
                                )}

                                {/* CTA Button: Disabled when conditions not met, active when met */}
                                <button
                                    type="button"
                                    disabled={!userStatus.canJoin || joining || isEnded}
                                    onClick={handleJoin}
                                    className={`tp-btn-3d relative overflow-hidden w-full h-[46px] mt-2 rounded-[18px] text-white select-none transition-all ${
                                        !userStatus.canJoin || isEnded
                                            ? 'opacity-65 cursor-not-allowed'
                                            : 'cursor-pointer active:scale-98'
                                    }`}
                                    style={
                                        isEnded
                                            ? {
                                                background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                                                '--tp-3d-edge': '#1E293B',
                                                '--tp-3d-glow': 'rgba(51, 65, 85, 0.35)'
                                            }
                                            : userStatus.canJoin
                                                ? {
                                                    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 40%, #B45309 100%)',
                                                    '--tp-3d-edge': '#78350F',
                                                    '--tp-3d-glow': 'rgba(245, 158, 11, 0.65)'
                                                }
                                                : {
                                                    background: darkMode
                                                        ? 'linear-gradient(135deg, #334155 0%, #1E293B 100%)'
                                                        : 'linear-gradient(135deg, #94A3B8 0%, #64748B 100%)',
                                                    '--tp-3d-edge': '#475569',
                                                    '--tp-3d-glow': 'rgba(100, 116, 139, 0.25)'
                                                }
                                    }
                                >
                                    {userStatus.canJoin && <span className="tp-sweep-beam" />}
                                    <span className="relative z-10 flex items-center justify-center gap-2 px-3">
                                        {joining ? (
                                            <Loader2 size={16} className="animate-spin text-white" />
                                        ) : isEnded ? (
                                            <Gift size={16} className="text-slate-300" />
                                        ) : userStatus.canJoin ? (
                                            <Sparkles size={16} className="text-yellow-200" />
                                        ) : (
                                            <Lock size={15} className="text-slate-200" />
                                        )}
                                        <span className={`${userStatus.canJoin ? 'tp-shine-text' : ''} text-[13px] font-black tracking-wide`}>
                                            {isEnded
                                                ? (lang === 'bn' ? 'Giveaway সময় শেষ' : 'Giveaway Ended')
                                                : userStatus.canJoin
                                                    ? (lang === 'bn' ? '🎉 জয়েন করুন (৳২০ হোল্ড)' : '🎉 Join (৳20 Hold)')
                                                    : (lang === 'bn' ? 'জয়েন করুন' : 'Join')}
                                        </span>
                                    </span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
