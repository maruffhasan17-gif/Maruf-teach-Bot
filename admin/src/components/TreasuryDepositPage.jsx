import React, { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import {
  ArrowDownToLine,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Fuel,
  QrCode,
  RefreshCw,
  Repeat,
  ShieldCheck,
  Sparkles,
  Wallet,
  Zap,
  AlertTriangle
} from 'lucide-react';

// ============================================================================
// 1. OFFICIAL BLOCKCHAIN NETWORK VECTOR LOGOS (CRISP SVG)
// ============================================================================
export function NetworkLogo({ networkId, size = 40, className = '' }) {
  const id = String(networkId || 'TON').toUpperCase();

  if (id === 'TON') {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={`shrink-0 ${className}`}>
        <defs>
          <linearGradient id="tonGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0098EA" />
            <stop offset="100%" stopColor="#0066CC" />
          </linearGradient>
        </defs>
        <circle cx="24" cy="24" r="24" fill="url(#tonGrad)" />
        <path
          d="M32.8 14.5H15.2C12.9 14.5 11.5 16.9 12.6 18.9L22.6 36.2C23.2 37.3 24.8 37.3 25.4 36.2L35.4 18.9C36.5 16.9 35.1 14.5 32.8 14.5ZM22.4 31.1L15.7 19.3C15.3 18.6 15.8 17.7 16.6 17.7H22.4V31.1ZM32.3 19.3L25.6 31.1V17.7H31.4C32.2 17.7 32.7 18.6 32.3 19.3Z"
          fill="white"
        />
      </svg>
    );
  }

  if (id === 'BEP20' || id === 'BSC') {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={`shrink-0 ${className}`}>
        <defs>
          <linearGradient id="bnbGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F3BA2F" />
            <stop offset="100%" stopColor="#D99A0B" />
          </linearGradient>
        </defs>
        <circle cx="24" cy="24" r="24" fill="url(#bnbGrad)" />
        <path
          d="M19.1 21.2L24 16.3L28.9 21.2L31.8 18.3L24 10.5L16.2 18.3L19.1 21.2ZM13.4 24L16.3 21.1L19.2 24L16.3 26.9L13.4 24ZM19.1 26.8L24 31.7L28.9 26.8L31.8 29.7L24 37.5L16.2 29.7L19.1 26.8ZM28.8 24L31.7 21.1L34.6 24L31.7 26.9L28.8 24ZM26.9 24L24 21.1L21.1 24L24 26.9L26.9 24Z"
          fill="#111318"
        />
      </svg>
    );
  }

  if (id === 'ARBITRUM' || id === 'ARB') {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={`shrink-0 ${className}`}>
        <defs>
          <linearGradient id="arbBg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1E3A8A" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>
        </defs>
        <circle cx="24" cy="24" r="24" fill="url(#arbBg)" />
        <path
          d="M24 7L38 15V33L24 41L10 33V15L24 7Z"
          stroke="#28A0F0"
          strokeWidth="2.4"
          fill="#162B5B"
        />
        <path d="M24.8 14.5L16.5 32.5H20.8L27.2 18.5L24.8 14.5Z" fill="white" />
        <path d="M26.5 22.2L22.5 31.5L25.2 35.2L30.2 24.5L26.5 22.2Z" fill="#28A0F0" />
        <path d="M29.4 17.5L27.5 21.5L32.2 32.5H35.5L29.4 17.5Z" fill="#38BDF8" />
      </svg>
    );
  }

  if (id === 'AVAXC' || id === 'AVAX') {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={`shrink-0 ${className}`}>
        <defs>
          <linearGradient id="avaxGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#E84142" />
            <stop offset="100%" stopColor="#B91C1C" />
          </linearGradient>
        </defs>
        <circle cx="24" cy="24" r="24" fill="url(#avaxGrad)" />
        <path
          d="M28.1 26.4C28.9 25 30.3 25 31.1 26.4L35.9 34.8C36.7 36.2 36 37.3 34.4 37.3H24.7C23.1 37.3 22.4 36.2 23.2 34.8L28.1 26.4ZM21.8 12.1C22.6 10.7 24 10.7 24.8 12.1L26.7 15.6L29.1 20C29.7 21.2 29.7 22.7 29.1 23.9L22.2 35.9C21.5 37 20.3 37.3 18.9 37.3H13.5C11.9 37.3 11.2 36.2 12 34.8L21.8 12.1Z"
          fill="white"
        />
      </svg>
    );
  }

  if (id === 'POLYGON' || id === 'MATIC' || id === 'POL') {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={`shrink-0 ${className}`}>
        <defs>
          <linearGradient id="polyGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#8247E5" />
            <stop offset="100%" stopColor="#5B21B6" />
          </linearGradient>
        </defs>
        <circle cx="24" cy="24" r="24" fill="url(#polyGrad)" />
        <path
          d="M31.6 18.7C30.9 18.3 30 18.3 29.2 18.7L24.5 21.5L21.3 23.3L16.7 26C16 26.4 15.1 26.4 14.3 26L11.1 24.1C10.4 23.7 9.9 22.9 9.9 22V18.3C9.9 17.5 10.3 16.7 11.1 16.2L14.3 14.4C15 14 15.9 14 16.7 14.4L19.9 16.2C20.6 16.6 21.1 17.4 21.1 18.3V20.7L24.3 18.8V16.4C24.3 15.6 23.9 14.8 23.1 14.3L16.8 10.6C16.1 10.2 15.2 10.2 14.4 10.6L8 14.3C7.2 14.8 6.8 15.6 6.8 16.4V23.9C6.8 24.7 7.2 25.5 8 26L14.4 29.7C15.1 30.1 16 30.1 16.8 29.7L21.4 27L24.6 25.2L29.2 22.5C29.9 22.1 30.8 22.1 31.6 22.5L34.8 24.3C35.5 24.7 36 25.5 36 26.4V30.1C36 30.9 35.6 31.7 34.8 32.2L31.6 34C30.9 34.4 30 34.4 29.2 34L26 32.2C25.3 31.8 24.8 31 24.8 30.1V27.7L21.6 29.6V32C21.6 32.8 22 33.6 22.8 34.1L29.2 37.8C29.9 38.2 30.8 38.2 31.6 37.8L38 34.1C38.7 33.7 39.2 32.9 39.2 32V24.5C39.2 23.7 38.8 22.9 38 22.4L31.6 18.7Z"
          fill="white"
        />
      </svg>
    );
  }

  // ERC20 / Ethereum Default
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={`shrink-0 ${className}`}>
      <defs>
        <linearGradient id="ethGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#627EEA" />
          <stop offset="100%" stopColor="#3B53B5" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="24" fill="url(#ethGrad)" />
      <path d="M24 9L14.5 24.7L24 30.3L33.5 24.7L24 9Z" fill="white" fillOpacity="0.95" />
      <path d="M24 32.1L14.5 26.5L24 39.5L33.5 26.5L24 32.1Z" fill="white" fillOpacity="0.8" />
    </svg>
  );
}

// ============================================================================
// 2. OFFICIAL CRYPTO ASSET VECTOR LOGOS (USDT, GRAM, TON)
// ============================================================================
export function AssetLogo({ asset, size = 34, className = '' }) {
  const code = String(asset || 'USDT').toUpperCase();

  if (code === 'USDT') {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={`shrink-0 ${className}`}>
        <circle cx="24" cy="24" r="24" fill="#26A17B" />
        <path
          d="M26.9 25.8V25.7C26.7 25.7 25.7 25.8 23.9 25.8C22.4 25.8 21.3 25.7 21 25.7V25.8C15.5 25.5 11.4 24.5 11.4 23.4C11.4 22.3 15.5 21.3 21 21.1V24.9C21.3 24.9 22.5 25 24 25C25.7 25 26.6 24.9 26.9 24.9V21.1C32.4 21.3 36.5 22.3 36.5 23.4C36.5 24.5 32.4 25.5 26.9 25.8ZM26.9 20.5V17.1H34.7V12.2H13.3V17.1H21V20.5C14.7 20.8 10 22.1 10 23.7C10 25.3 14.7 26.6 21 26.9V36.5H26.9V26.9C33.2 26.6 38 25.3 38 23.7C38 22.1 33.2 20.8 26.9 20.5Z"
          fill="white"
        />
      </svg>
    );
  }

  if (code === 'GRAM') {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={`shrink-0 ${className}`}>
        <defs>
          <linearGradient id="gramGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#9333EA" />
            <stop offset="50%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#EC4899" />
          </linearGradient>
        </defs>
        <circle cx="24" cy="24" r="24" fill="url(#gramGrad)" />
        <path
          d="M24 10L36 19L24 38L12 19L24 10Z"
          stroke="white"
          strokeWidth="2.4"
          fill="rgba(255,255,255,0.18)"
        />
        <path d="M12 19H36M24 10L19 19L24 38L29 19L24 10Z" stroke="white" strokeWidth="1.8" />
      </svg>
    );
  }

  return <NetworkLogo networkId={code} size={size} className={className} />;
}

// ============================================================================
// 3. OFFICIAL SUPPORTED EXCHANGE LOGOS (Binance, Bybit, OKX, Bitget, KuCoin, MEXC, Gate.io)
// ============================================================================
export function ExchangeLogo({ name, size = 18 }) {
  const n = String(name || '').toLowerCase();

  if (n.includes('binance')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="shrink-0">
        <circle cx="12" cy="12" r="12" fill="#181A20" />
        <path
          d="M8.8 10.2L12 7L15.2 10.2L17 8.4L12 3.4L7 8.4L8.8 10.2ZM5.4 12L7.2 10.2L9 12L7.2 13.8L5.4 12ZM8.8 13.8L12 17L15.2 13.8L17 15.6L12 20.6L7 15.6L8.8 13.8ZM15 12L16.8 10.2L18.6 12L16.8 13.8L15 12ZM13.8 12L12 10.2L10.2 12L12 13.8L13.8 12Z"
          fill="#F3BA2F"
        />
      </svg>
    );
  }

  if (n.includes('bybit')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="shrink-0">
        <circle cx="12" cy="12" r="12" fill="#121418" />
        <rect x="5" y="7" width="3" height="10" rx="1" fill="white" />
        <rect x="10" y="7" width="3" height="10" rx="1" fill="#F7A600" />
        <rect x="15" y="7" width="3" height="6" rx="1" fill="white" />
        <circle cx="16.5" cy="15.8" r="1.4" fill="#F7A600" />
      </svg>
    );
  }

  if (n.includes('okx')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="shrink-0">
        <circle cx="12" cy="12" r="12" fill="#0B0E14" />
        <rect x="6" y="6" width="4" height="4" fill="white" />
        <rect x="14" y="6" width="4" height="4" fill="white" />
        <rect x="10" y="10" width="4" height="4" fill="white" />
        <rect x="6" y="14" width="4" height="4" fill="white" />
        <rect x="14" y="14" width="4" height="4" fill="white" />
      </svg>
    );
  }

  if (n.includes('bitget')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="shrink-0">
        <circle cx="12" cy="12" r="12" fill="#00F0FF" />
        <path d="M11 6L6 11L11 16H14.5L9.5 11L14.5 6H11ZM13 18L18 13L13 8H9.5L14.5 13L9.5 18H13Z" fill="#041218" />
      </svg>
    );
  }

  if (n.includes('kucoin')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="shrink-0">
        <circle cx="12" cy="12" r="12" fill="#23AF91" />
        <path d="M8 7V17M8 12L15 7M8 12L15 17" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="15.5" cy="12" r="1.6" fill="white" />
      </svg>
    );
  }

  if (n.includes('mexc')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="shrink-0">
        <circle cx="12" cy="12" r="12" fill="#1972E2" />
        <path d="M5.5 16L9.5 8L13.5 16H5.5ZM10.5 16L14.5 8L18.5 16H10.5Z" fill="white" fillOpacity="0.9" />
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="shrink-0">
      <circle cx="12" cy="12" r="12" fill="#2354E6" />
      <circle cx="12" cy="12" r="6" stroke="#17E6A1" strokeWidth="2.5" />
    </svg>
  );
}

// ============================================================================
// 4. SHARED NETWORK BUILDER FOR ALL 6 BLOCKCHAINS
// ============================================================================
export function buildDepositNetworks(data = {}) {
  const netBals = data.networkBalances || {};
  return [
    {
      id: 'TON',
      name: 'TON (The Open Network)',
      shortName: 'TON Mainnet',
      standard: 'JETTON / NATIVE',
      badge: 'INSTANT AUTO-SWAP',
      badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
      activeBorder: 'border-sky-400 shadow-[0_0_30px_rgba(14,165,233,0.28)]',
      activeBg: 'from-sky-500/25 via-blue-600/15 to-slate-950/90',
      accentText: 'text-sky-400',
      buttonGrad: 'from-sky-500 via-blue-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500',
      address: data.tonAddress || 'UQC7hYHfrVJ_uT_esMr7vCv1bVh5ytQxYUUjRDiTUiG9s5Fb',
      supportedAssets: ['USDT', 'GRAM', 'TON'],
      usdtBalance: data.tonUsdtBalance || '0.00',
      nativeBalance: parseFloat(data.tonNativeBalance || data.tonBalance || 0).toFixed(2),
      nativeSymbol: 'GRAM/TON',
      feeEst: '~$0.02 – $0.15',
      arrivalTime: '~15 – 45 sec',
      memoRequired: false,
      exchanges: ['Binance', 'Bybit', 'OKX', 'Bitget', 'MEXC', 'KuCoin', 'Gate.io'],
      explorerName: 'Tonviewer',
      explorerUrl: `https://tonviewer.com/${data.tonAddress || ''}`,
      note: 'সরাসরি এডমিন TON ওয়ালেটে জমা হবে এবং USDT ⇄ GRAM অটো-সোয়াপ ও ইউজার পেমেন্টে তাৎক্ষণিক ব্যবহৃত হবে।'
    },
    {
      id: 'BEP20',
      name: 'BNB Smart Chain (BEP20)',
      shortName: 'BEP20 (BSC)',
      standard: 'BEP-20',
      badge: 'POPULAR • ZERO FEE EXCHANGES',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      activeBorder: 'border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.28)]',
      activeBg: 'from-amber-500/25 via-yellow-600/10 to-slate-950/90',
      accentText: 'text-amber-400',
      buttonGrad: 'from-amber-500 via-yellow-500 to-orange-500 hover:from-amber-400 hover:to-orange-400',
      address: data.evmAddress || '0x14dA1Ab05ED10a960441577D39e6aeac46159967',
      supportedAssets: ['USDT', 'BNB'],
      usdtBalance: netBals.BEP20?.usdt || data.bep20UsdtBalance || '0.00',
      nativeBalance: netBals.BEP20?.native || '0.0000',
      nativeSymbol: 'BNB',
      feeEst: '~$0.00 – $0.10',
      arrivalTime: '~15 – 30 sec',
      memoRequired: false,
      exchanges: ['Binance', 'Bybit', 'Bitget', 'OKX', 'KuCoin', 'MEXC', 'Gate.io'],
      explorerName: 'BscScan',
      explorerUrl: `https://bscscan.com/address/${data.evmAddress || ''}`,
      note: 'Binance, Bybit বা যেকোনো এক্সচেঞ্জ থেকে BNB Smart Chain (BEP20) সিলেক্ট করে দ্রুত USDT বা BNB ডিপোজিট করুন।'
    },
    {
      id: 'ARBITRUM',
      name: 'Arbitrum One (ARB)',
      shortName: 'Arbitrum One',
      standard: 'ARBITRUM L2',
      badge: 'ULTRA FAST L2',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      activeBorder: 'border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.28)]',
      activeBg: 'from-cyan-500/25 via-blue-600/15 to-slate-950/90',
      accentText: 'text-cyan-400',
      buttonGrad: 'from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500',
      address: data.evmAddress || '0x14dA1Ab05ED10a960441577D39e6aeac46159967',
      supportedAssets: ['USDT', 'ETH'],
      usdtBalance: netBals.ARBITRUM?.usdt || data.arbitrumUsdtBalance || '0.00',
      nativeBalance: netBals.ARBITRUM?.native || '0.0000',
      nativeSymbol: 'ETH',
      feeEst: '~$0.05 – $0.10',
      arrivalTime: '~10 – 25 sec',
      memoRequired: false,
      exchanges: ['Binance', 'Bybit', 'OKX', 'Bitget', 'KuCoin', 'MEXC', 'Gate.io'],
      explorerName: 'Arbiscan',
      explorerUrl: `https://arbiscan.io/address/${data.evmAddress || ''}`,
      note: 'Arbitrum One EVM হট ওয়ালেট। (সতর্কতা: মিনিঅ্যাপে অটো-সোয়াপের জন্য TON নেটওয়ার্কে USDT ডিপোজিট আবশ্যক)।'
    },
    {
      id: 'AVAXC',
      name: 'Avalanche C-Chain (AVAX-C)',
      shortName: 'AVAX C-Chain',
      standard: 'AVAX C-CHAIN',
      badge: 'INSTANT FINALITY',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      activeBorder: 'border-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.28)]',
      activeBg: 'from-rose-500/25 via-red-600/15 to-slate-950/90',
      accentText: 'text-rose-400',
      buttonGrad: 'from-rose-500 via-red-500 to-orange-600 hover:from-rose-400 hover:to-orange-500',
      address: data.evmAddress || '0x14dA1Ab05ED10a960441577D39e6aeac46159967',
      supportedAssets: ['USDT', 'AVAX'],
      usdtBalance: netBals.AVAXC?.usdt || data.avaxUsdtBalance || '0.00',
      nativeBalance: netBals.AVAXC?.native || '0.0000',
      nativeSymbol: 'AVAX',
      feeEst: '~$0.10 – $0.20',
      arrivalTime: '~15 – 30 sec',
      memoRequired: false,
      exchanges: ['Binance', 'Bybit', 'OKX', 'Bitget', 'KuCoin', 'MEXC'],
      explorerName: 'Snowtrace',
      explorerUrl: `https://snowtrace.io/address/${data.evmAddress || ''}`,
      note: 'এক্সচেঞ্জ থেকে AVAX C-Chain (Avalanche C-Chain) সিলেক্ট করে সরাসরি USDT বা AVAX ডিপোজিট করুন।'
    },
    {
      id: 'POLYGON',
      name: 'Polygon POS (MATIC / POL)',
      shortName: 'Polygon POS',
      standard: 'POLYGON POS',
      badge: 'ULTRA LOW GAS',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      activeBorder: 'border-purple-400 shadow-[0_0_30px_rgba(168,85,247,0.28)]',
      activeBg: 'from-purple-500/25 via-violet-600/15 to-slate-950/90',
      accentText: 'text-purple-400',
      buttonGrad: 'from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500',
      address: data.evmAddress || '0x14dA1Ab05ED10a960441577D39e6aeac46159967',
      supportedAssets: ['USDT', 'POL'],
      usdtBalance: netBals.POLYGON?.usdt || data.polygonUsdtBalance || '0.00',
      nativeBalance: netBals.POLYGON?.native || '0.0000',
      nativeSymbol: 'POL',
      feeEst: '~$0.03 – $0.08',
      arrivalTime: '~20 – 40 sec',
      memoRequired: false,
      exchanges: ['Binance', 'Bybit', 'OKX', 'Bitget', 'KuCoin', 'MEXC', 'Gate.io'],
      explorerName: 'PolygonScan',
      explorerUrl: `https://polygonscan.com/address/${data.evmAddress || ''}`,
      note: 'এক্সচেঞ্জ থেকে Polygon (POS) নেটওয়ার্ক সিলেক্ট করে সাশ্রয়ী ফিতে USDT ডিপোজিট করুন।'
    },
    {
      id: 'ERC20',
      name: 'Ethereum Mainnet (ERC20)',
      shortName: 'Ethereum (ERC20)',
      standard: 'ERC-20',
      badge: 'INSTITUTIONAL L1',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
      activeBorder: 'border-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.28)]',
      activeBg: 'from-indigo-500/25 via-blue-700/15 to-slate-950/90',
      accentText: 'text-indigo-400',
      buttonGrad: 'from-indigo-600 via-blue-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500',
      address: data.evmAddress || '0x14dA1Ab05ED10a960441577D39e6aeac46159967',
      supportedAssets: ['USDT', 'ETH'],
      usdtBalance: netBals.ERC20?.usdt || data.erc20UsdtBalance || '0.00',
      nativeBalance: netBals.ERC20?.native || '0.0000',
      nativeSymbol: 'ETH',
      feeEst: '~$1.00 – $2.50',
      arrivalTime: '~1 – 3 min',
      memoRequired: false,
      exchanges: ['Binance', 'Bybit', 'OKX', 'Bitget', 'KuCoin', 'MEXC', 'Gate.io'],
      explorerName: 'Etherscan',
      explorerUrl: `https://etherscan.io/address/${data.evmAddress || ''}`,
      note: 'যেকোনো আন্তর্জাতিক এক্সচেঞ্জ থেকে Ethereum (ERC20) নেটওয়ার্কে USDT বা ETH ডিপোজিট করুন।'
    }
  ];
}

// ============================================================================
// 5. STANDALONE DEDICATED MULTI-NETWORK EXCHANGE DEPOSIT & AUTO-SWAP PAGE
// ============================================================================
export default function TreasuryDepositPage({ useBotDataHook, useThemeHook, apiBase }) {
  const { data, refresh, refreshing } = useBotDataHook();
  const { theme } = useThemeHook();
  const isDark = theme === 'dark';

  const [searchParams, setSearchParams] = useSearchParams();
  const initialAsset = (searchParams.get('asset') || 'USDT').toUpperCase();
  const initialNetwork = (searchParams.get('network') || 'TON').toUpperCase();
  const initialMode = searchParams.get('mode') === 'tonkeeper' ? 'tonkeeper' : 'exchange';

  const [selectedAsset, setSelectedAsset] = useState(
    ['USDT', 'GRAM', 'TON'].includes(initialAsset) ? initialAsset : 'USDT'
  );
  const [selectedNetworkId, setSelectedNetworkId] = useState(
    ['TON', 'BEP20', 'ARBITRUM', 'AVAXC', 'POLYGON', 'ERC20'].includes(initialNetwork) ? initialNetwork : 'TON'
  );
  const [depositMode, setDepositMode] = useState(initialMode);
  const [tonkeeperAmount, setTonkeeperAmount] = useState('');
  const [depositing, setDepositing] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);
  const [bannerMsg, setBannerMsg] = useState(null);

  // Manual / Instant On-Chain Swap States on the Deposit Page
  const [swapDirection, setSwapDirection] = useState('USDT_TO_GRAM');
  const [swapAmount, setSwapAmount] = useState('');
  const [swapping, setSwapping] = useState(false);

  const userTonAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();

  const networks = useMemo(() => buildDepositNetworks(data), [data]);

  const availableNetworks = useMemo(() => {
    if (selectedAsset === 'GRAM' || selectedAsset === 'TON') {
      return networks.filter(n => n.id === 'TON');
    }
    return networks;
  }, [networks, selectedAsset]);

  const activeNetwork = useMemo(() => {
    return availableNetworks.find(n => n.id === selectedNetworkId) || availableNetworks[0];
  }, [availableNetworks, selectedNetworkId]);

  const gramBalanceVal = parseFloat(data.tonNativeBalance || data.gramBalance || 0);
  const tonUsdtVal = parseFloat(data.tonUsdtBalance || 0);
  const evmUsdtVal = parseFloat(data.evmBalance || 0);
  const totalUsdtVal = tonUsdtVal + evmUsdtVal;
  const liveTonUsdtRate = parseFloat(data.liveTonUsdtRate || data.realGramUsdt || 1.2365);
  const liveGramBdt = parseFloat(data.realGramBdt || (data.marketRates?.realGramBdt) || (liveTonUsdtRate * 124.01));
  const liveUsdtBdt = parseFloat(data.realUsdtBdt || (data.marketRates?.realUsdtBdt) || 124.01);
  const totalVaultBdt = gramBalanceVal * liveGramBdt + totalUsdtVal * liveUsdtBdt;

  const showNotice = (type, text) => {
    setBannerMsg({ type, text });
    setTimeout(() => setBannerMsg(null), 4500);
  };

  const handleSelectAsset = (assetId) => {
    setSelectedAsset(assetId);
    const nextNet = (assetId === 'GRAM' || assetId === 'TON') ? 'TON' : selectedNetworkId;
    setSelectedNetworkId(nextNet);
    setSearchParams({ asset: assetId, network: nextNet, mode: depositMode }, { replace: true });
  };

  const handleSelectNetwork = (netId) => {
    setSelectedNetworkId(netId);
    setSearchParams({ asset: selectedAsset, network: netId, mode: depositMode }, { replace: true });
  };

  const handleCopyAddress = (addr, label) => {
    if (!addr) return;
    navigator.clipboard.writeText(addr);
    setCopiedKey(`${addr}_${label}`);
    setTimeout(() => setCopiedKey(null), 2400);
    showNotice('success', `${label} Receive Address ক্লিপবোর্ডে কপি হয়েছে!`);
  };

  const handleTonkeeperDeposit = async () => {
    const numAmt = parseFloat(tonkeeperAmount);
    if (!tonkeeperAmount || isNaN(numAmt) || numAmt <= 0) {
      showNotice('error', 'ডিপোজিট করার জন্য সঠিক পরিমাণ (Amount) লিখুন।');
      return;
    }
    if (!userTonAddress) {
      tonConnectUI.openModal();
      return;
    }

    setDepositing(true);
    try {
      let tx;
      if (selectedAsset === 'TON' || selectedAsset === 'GRAM') {
        tx = {
          validUntil: Math.floor(Date.now() / 1000) + 360,
          messages: [
            {
              address: data.tonAddress,
              amount: Math.floor(numAmt * 1e9).toString()
            }
          ]
        };
      } else {
        const res = await fetch(`${apiBase}/api/miniapp/build-tx`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            asset: selectedAsset,
            amount: numAmt,
            userAddress: userTonAddress
          })
        });
        const resData = await res.json();
        if (!resData.success && !resData.tx) {
          throw new Error(resData.error || 'Failed to construct Jetton transaction');
        }
        tx = resData.tx || resData;
      }

      await tonConnectUI.sendTransaction(tx);
      setTonkeeperAmount('');
      showNotice('success', `Tonkeeper ট্রানজেকশন পাঠানো হয়েছে! কয়েক সেকেন্ডের মধ্যে ব্যালেন্স আপডেট হবে।`);
      setTimeout(() => refresh(), 3500);
    } catch (err) {
      showNotice('error', err.message || 'Tonkeeper ডিপোজিট বাতিল হয়েছে।');
    } finally {
      setDepositing(false);
    }
  };

  const handleInstantSwap = async () => {
    const numAmt = parseFloat(swapAmount);
    if (!swapAmount || isNaN(numAmt) || numAmt <= 0) {
      showNotice('error', 'সোয়াপ করার জন্য সঠিক পরিমাণ লিখুন।');
      return;
    }
    setSwapping(true);
    try {
      const res = await fetch(`${apiBase}/api/admin/swap-treasury`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          direction: swapDirection,
          amount: numAmt
        })
      });
      const json = await res.json();
      if (json.success) {
        setSwapAmount('');
        showNotice('success', json.message || 'অন-চেইন সোয়াপ সফলভাবে সম্পন্ন হয়েছে!');
        refresh();
      } else {
        showNotice('error', json.error || 'সোয়াপ সম্পন্ন করা যায়নি।');
      }
    } catch (err) {
      showNotice('error', err.message || 'নেটওয়ার্ক ত্রুটি।');
    } finally {
      setSwapping(false);
    }
  };

  const isMainAddrCopied = copiedKey === `${activeNetwork.address}_MAIN`;

  return (
    <div className="space-y-7 animate-in fade-in duration-300 pb-10">
      {/* Floating Toast Notification */}
      {bannerMsg && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-bold animate-in slide-in-from-bottom-5 duration-200 ${
          bannerMsg.type === 'success'
            ? 'bg-emerald-950/95 border-emerald-400/50 text-emerald-100 backdrop-blur-xl'
            : 'bg-rose-950/95 border-rose-400/50 text-rose-100 backdrop-blur-xl'
        }`}>
          {bannerMsg.type === 'success' ? (
            <CheckCircle2 size={19} className="text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle size={19} className="text-rose-400 shrink-0" />
          )}
          <span>{bannerMsg.text}</span>
        </div>
      )}

      {/* ================================================================== */}
      {/* 1. EXECUTIVE TOP COMMAND BAR & NAVIGATION                          */}
      {/* ================================================================== */}
      <div className={`p-6 sm:p-7 rounded-[2.2rem] border relative overflow-hidden ${
        isDark
          ? 'bg-gradient-to-r from-[#0d152c] via-[#111a36] to-[#0a1224] border-sky-500/30 shadow-[0_20px_60px_rgba(14,165,233,0.12)]'
          : 'bg-white border-slate-200 shadow-xl'
      }`}>
        <div className="absolute -right-24 -top-24 w-96 h-96 bg-sky-500/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute -left-24 -bottom-24 w-96 h-96 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                to="/bot-wallet"
                className="px-3 py-1 rounded-xl text-xs font-black bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5"
              >
                <span>← Back to Bot Treasury</span>
              </Link>
              <span className="px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                6 OFFICIAL NETWORKS ACTIVE
              </span>
              <span className="px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1.5">
                <Repeat size={12} className="text-purple-400" />
                AUTO-SWAP (USDT ⇄ GRAM) READY
              </span>
            </div>

            <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Multi-Network Exchange Deposit & Liquidity Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl">
              Binance, Bybit, OKX, Bitget, KuCoin, MEXC অথবা Tonkeeper ওয়ালেট থেকে সরাসরি আপনার পছন্দের নেটওয়ার্কে (TON, BEP20, Arbitrum One, AVAX C-Chain, Polygon, ERC20) ক্রিপ্টো ডিপোজিট করুন।
            </p>
          </div>

          {/* Right Live Stats & Refresh */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className={`px-4 py-3 rounded-2xl border ${
              isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Total Treasury Reserve
              </div>
              <div className="text-lg font-black font-mono text-emerald-400">
                ৳{totalVaultBdt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BDT
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                refresh();
                showNotice('success', 'সবগুলো ব্লকচেইন নেটওয়ার্ক থেকে লাইভ ব্যালেন্স রিফ্রেশ করা হচ্ছে...');
              }}
              className="px-5 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
              <span>Refresh All Balances</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* 2. STEP 1: SELECT CRYPTO ASSET TO DEPOSIT (3 LUXURY CARDS)         */}
      {/* ================================================================== */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 text-xs font-black flex items-center justify-center">
              1
            </span>
            <h2 className={`text-sm font-black uppercase tracking-wider ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              Select Crypto Asset to Deposit (কোন কয়েন ডিপোজিট করবেন সিলেক্ট করুন)
            </h2>
          </div>

          {/* Mode Switcher */}
          <div className="inline-flex p-1 rounded-2xl bg-slate-900/90 border border-slate-800">
            <button
              type="button"
              onClick={() => setDepositMode('exchange')}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                depositMode === 'exchange'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <QrCode size={14} />
              <span>Exchange / Multi-Network QR</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setDepositMode('tonkeeper');
                setSelectedNetworkId('TON');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                depositMode === 'tonkeeper'
                  ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Wallet size={14} />
              <span>Tonkeeper 1-Click Direct</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              id: 'USDT',
              title: 'USDT (Tether USD)',
              subtitle: 'Supports All 6 Networks (TON, BEP20, Arbitrum, AVAX-C, Polygon, ERC20)',
              balance: `$${totalUsdtVal.toFixed(2)} USDT`,
              bdt: `≈ ৳${(totalUsdtVal * liveUsdtBdt).toFixed(0)} BDT`,
              tag: '6 NETWORKS • AUTO-SWAP TO GRAM',
              activeClass: 'border-emerald-400 bg-gradient-to-br from-emerald-500/20 via-teal-600/10 to-slate-950 shadow-[0_10px_35px_rgba(16,185,129,0.2)]'
            },
            {
              id: 'GRAM',
              title: 'GRAM / TON Reserve',
              subtitle: 'Direct User Payout Pool + Backed by On-Chain USDT Auto-Swap',
              balance: `${gramBalanceVal.toFixed(2)} GRAM`,
              bdt: `≈ ৳${(gramBalanceVal * liveGramBdt).toFixed(0)} BDT`,
              tag: 'TON MAINNET • INSTANT DISPATCH',
              activeClass: 'border-purple-400 bg-gradient-to-br from-purple-500/25 via-indigo-600/10 to-slate-950 shadow-[0_10px_35px_rgba(168,85,247,0.22)]'
            },
            {
              id: 'TON',
              title: 'TON Native Gas Fuel',
              subtitle: 'Powers DeDust V2 & STON.fi Auto-Swaps + Jetton Transfers',
              balance: `${gramBalanceVal.toFixed(3)} TON`,
              bdt: `~${Math.floor(gramBalanceVal / 0.008)} Transfers Ready`,
              tag: gramBalanceVal >= 0.16 ? 'AUTO-SWAP FUEL READY' : 'REFILL RECOMMENDED',
              activeClass: 'border-sky-400 bg-gradient-to-br from-sky-500/25 via-blue-600/10 to-slate-950 shadow-[0_10px_35px_rgba(14,165,233,0.22)]'
            }
          ].map(assetCard => {
            const isSelected = selectedAsset === assetCard.id;
            return (
              <button
                key={assetCard.id}
                type="button"
                onClick={() => handleSelectAsset(assetCard.id)}
                className={`p-5 rounded-3xl border text-left transition-all duration-200 cursor-pointer relative overflow-hidden flex flex-col justify-between gap-3 ${
                  isSelected
                    ? assetCard.activeClass
                    : isDark
                      ? 'bg-[#0d1326]/90 border-slate-800/90 hover:border-slate-700 text-slate-300'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <AssetLogo asset={assetCard.id} size={44} />
                    <div>
                      <div className="text-base font-black text-white flex items-center gap-2">
                        <span>{assetCard.title}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 leading-snug mt-0.5">
                        {assetCard.subtitle}
                      </div>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border ${
                    isSelected
                      ? 'bg-emerald-400 border-emerald-300 text-slate-950'
                      : 'border-slate-700 bg-slate-900/60 text-transparent'
                  }`}>
                    <Check size={14} strokeWidth={3} />
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-black font-mono text-white">{assetCard.balance}</div>
                    <div className="text-[10px] font-bold text-slate-400">{assetCard.bdt}</div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-black/40 text-slate-200 border border-white/10">
                    {assetCard.tag}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ================================================================== */}
      {/* 3. MAIN 12-COLUMN WORKSPACE: NETWORK LOGOS GRID + BRANDED QR VAULT */}
      {/* ================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">

        {/* LEFT 7 COLUMNS: BLOCKCHAIN NETWORK CARDS WITH OFFICIAL LOGOS */}
        <div className="lg:col-span-7 space-y-6">
          <div className={`p-6 sm:p-7 rounded-[2.2rem] border ${
            isDark
              ? 'bg-[#0b1124]/95 border-slate-800/90 shadow-2xl'
              : 'bg-white border-slate-200 shadow-xl'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-sky-400 text-slate-950 text-xs font-black flex items-center justify-center">
                  2
                </span>
                <div>
                  <h3 className={`text-base font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Select Blockchain Network (এক্সচেঞ্জ উইথড্র নেটওয়ার্ক)
                  </h3>
                  <p className="text-xs text-slate-400">
                    প্রতিটি সাপোর্টেড নেটওয়ার্কের অফিশিয়াল লোগো ও লাইভ অন-চেইন ব্যালেন্স নিচে দেওয়া হলো
                  </p>
                </div>
              </div>

              <span className="px-3 py-1 rounded-xl text-[10px] font-black uppercase bg-sky-500/15 text-sky-300 border border-sky-500/30">
                {availableNetworks.length} {availableNetworks.length === 1 ? 'Network' : 'Networks'} Available
              </span>
            </div>

            {/* 6-NETWORK INTERACTIVE GRID WITH OFFICIAL SVG LOGOS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {availableNetworks.map(net => {
                const isSelected = net.id === activeNetwork.id;
                return (
                  <button
                    key={net.id}
                    type="button"
                    onClick={() => handleSelectNetwork(net.id)}
                    className={`p-4 rounded-3xl border text-left transition-all duration-200 cursor-pointer relative overflow-hidden group ${
                      isSelected
                        ? `bg-gradient-to-br ${net.activeBg} ${net.activeBorder}`
                        : isDark
                          ? 'bg-slate-950/70 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/80'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5">
                        <div className={`p-1 rounded-2xl transition-transform duration-200 group-hover:scale-105 ${
                          isSelected ? 'ring-2 ring-white/30 shadow-lg' : ''
                        }`}>
                          <NetworkLogo networkId={net.id} size={44} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-white">{net.shortName}</span>
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-white/10 text-slate-200 border border-white/10">
                              {net.standard}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                            {net.name}
                          </div>
                          <div className="mt-1.5 inline-flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black border ${net.badgeColor}`}>
                              {net.badge}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border ${
                        isSelected
                          ? 'bg-emerald-400 border-emerald-300 text-slate-950 shadow-md'
                          : 'border-slate-800 bg-slate-900 text-transparent'
                      }`}>
                        <Check size={13} strokeWidth={3} />
                      </div>
                    </div>

                    {/* Bottom Chain Balance, Speed & Fee Strip */}
                    <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px]">
                      <div>
                        <span className="text-slate-400">Live Bal: </span>
                        <b className="font-mono text-emerald-400">${net.usdtBalance} USDT</b>
                        {net.id === 'TON' && (
                          <span className="text-purple-300 font-mono ml-1.5">• {net.nativeBalance} TON</span>
                        )}
                      </div>
                      <div className="text-right font-mono text-[10px] text-slate-300">
                        <span>⚡ {net.arrivalTime}</span>
                        <span className="mx-1 text-slate-600">|</span>
                        <span className="text-emerald-300">Fee {net.feeEst}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {(selectedAsset === 'GRAM' || selectedAsset === 'TON') && (
              <div className="mt-4 p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-between gap-3 text-xs text-purple-200">
                <span>
                  💡 <b>GRAM</b> এবং <b>TON</b> শুধুমাত্র <b>TON Mainnet</b> সাপোর্ট করে। অন্য নেটওয়ার্ক (BEP20, Arbitrum, AVAX-C, Polygon, ERC20) দিয়ে ডিপোজিট করতে চাইলে উপরে <b>USDT (Tether)</b> সিলেক্ট করুন।
                </span>
                <button
                  type="button"
                  onClick={() => handleSelectAsset('USDT')}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-[11px] shrink-0 cursor-pointer"
                >
                  Switch to USDT (6 Nets)
                </button>
              </div>
            )}
          </div>

          {/* SUPPORTED EXCHANGES SHOWCASE WITH OFFICIAL LOGOS */}
          <div className={`p-6 sm:p-7 rounded-[2.2rem] border ${
            isDark
              ? 'bg-[#0b1124]/95 border-slate-800/90 shadow-xl'
              : 'bg-white border-slate-200 shadow-lg'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <h3 className={`text-sm font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Supported Exchanges for {activeNetwork.shortName}
                </h3>
                <p className="text-xs text-slate-400">
                  নিচের যেকোনো এক্সচেঞ্জের Withdraw অপশন থেকে সরাসরি এই অ্যাড্রেসে পাঠাতে পারবেন
                </p>
              </div>
              <span className="text-[11px] font-bold text-emerald-400">
                ✓ Direct Wallet & CEX Compatible
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
              {activeNetwork.exchanges.map(exName => (
                <div
                  key={exName}
                  className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/90 flex flex-col items-center justify-center gap-1.5 text-center hover:border-sky-500/40 transition-all"
                >
                  <ExchangeLogo name={exName} size={26} />
                  <span className="text-xs font-black text-white">{exName}</span>
                  <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    Supported
                  </span>
                </div>
              ))}
            </div>

            {/* 3-Step Visual Exchange Withdraw Walkthrough */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-5 border-t border-slate-800/80">
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                <div className="text-[10px] font-black uppercase text-sky-400">Step 01</div>
                <div className="text-xs font-black text-white">Copy Receive Address</div>
                <p className="text-[11px] text-slate-400">
                  ডান পাশের বক্স থেকে <b>{activeNetwork.shortName}</b> রিসিভ অ্যাড্রেসটি কপি করুন বা QR স্ক্যান করুন।
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                <div className="text-[10px] font-black uppercase text-emerald-400">Step 02</div>
                <div className="text-xs font-black text-white">Select {activeNetwork.shortName}</div>
                <p className="text-[11px] text-slate-400">
                  Binance / Bybit / OKX-এর Withdraw পেজে নেটওয়ার্ক হিসেবে <b>{activeNetwork.shortName}</b> সিলেক্ট করুন।
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                <div className="text-[10px] font-black uppercase text-purple-400">Step 03</div>
                <div className="text-xs font-black text-white">Auto-Sync & Auto-Swap</div>
                <p className="text-[11px] text-slate-400">
                  সেন্ড করার পর <b>Refresh Balance</b> চাপুন—অটো-সোয়াপ ইঞ্জিন সাথে সাথে ইউজার অর্ডারের জন্য প্রস্তুত থাকবে।
                </p>
              </div>
            </div>
          </div>

          {/* INSTANT ON-CHAIN TREASURY SWAP (USDT ⇄ GRAM) ENGINE */}
          <div className={`p-6 sm:p-7 rounded-[2.2rem] border relative overflow-hidden ${
            isDark
              ? 'bg-gradient-to-br from-[#17113a] via-[#100d2b] to-[#08071a] border-purple-500/35 shadow-xl'
              : 'bg-white border-purple-200 shadow-lg'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500 to-emerald-500 text-white flex items-center justify-center shadow-lg">
                  <Repeat size={22} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    Smart Treasury Auto-Swap (USDT ⇄ GRAM)
                  </h3>
                  <p className="text-xs text-slate-400">
                    ওয়ালেটে 0.25 GRAM + 10 USDT থাকলেও ইউজার 2 GRAM কিনলে সিস্টেম নিজে থেকেই USDT সোয়াপ করে GRAM পাঠিয়ে দেবে
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-xl text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                1 GRAM ≈ ${liveTonUsdtRate.toFixed(3)} USDT
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-black/40 border border-slate-800 mb-3">
              <button
                type="button"
                onClick={() => { setSwapDirection('USDT_TO_GRAM'); setSwapAmount(''); }}
                className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  swapDirection === 'USDT_TO_GRAM'
                    ? 'bg-gradient-to-r from-emerald-600 to-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <AssetLogo asset="USDT" size={18} />
                <span>USDT ➔ GRAM</span>
                <AssetLogo asset="GRAM" size={18} />
              </button>
              <button
                type="button"
                onClick={() => { setSwapDirection('GRAM_TO_USDT'); setSwapAmount(''); }}
                className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  swapDirection === 'GRAM_TO_USDT'
                    ? 'bg-gradient-to-r from-purple-600 to-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <AssetLogo asset="GRAM" size={18} />
                <span>GRAM ➔ USDT</span>
                <AssetLogo asset="USDT" size={18} />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <input
                  type="text"
                  inputMode="decimal"
                  value={swapAmount}
                  onChange={e => {
                    const v = e.target.value;
                    if (v === '' || /^[0-9]*\.?[0-9]*$/.test(v)) setSwapAmount(v);
                  }}
                  placeholder={swapDirection === 'USDT_TO_GRAM' ? 'Enter USDT amount to swap (e.g. 5)' : 'Enter GRAM amount to swap (e.g. 2)'}
                  className="w-full bg-black/50 border border-purple-700/50 p-3.5 pr-20 rounded-2xl text-sm font-black text-white outline-none focus:border-purple-400 font-mono"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-purple-300">
                  {swapDirection === 'USDT_TO_GRAM' ? 'USDT' : 'GRAM'}
                </span>
              </div>

              <button
                type="button"
                disabled={swapping || !swapAmount || parseFloat(swapAmount) <= 0}
                onClick={handleInstantSwap}
                className="px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-600 hover:from-purple-500 hover:to-emerald-500 text-white shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
              >
                {swapping ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Swapping...</span>
                  </>
                ) : (
                  <>
                    <Repeat size={14} />
                    <span>Instant Swap</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT 5 COLUMNS: BRANDED QR CODE & RECEIVE ADDRESS VAULT TERMINAL */}
        <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-5">
          {depositMode === 'exchange' ? (
            <div className={`p-6 sm:p-7 rounded-[2.4rem] border relative overflow-hidden ${
              isDark
                ? `bg-gradient-to-b ${activeNetwork.activeBg} ${activeNetwork.activeBorder}`
                : 'bg-white border-slate-200 shadow-2xl'
            }`}>
              {/* Top Network Brand Header */}
              <div className="flex items-center justify-between gap-3 pb-5 border-b border-white/10">
                <div className="flex items-center gap-3.5">
                  <NetworkLogo networkId={activeNetwork.id} size={48} />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black text-white">{activeNetwork.shortName}</h3>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-white/15 text-white">
                        {activeNetwork.standard}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{activeNetwork.name}</p>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-xl text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
                  No Memo Needed
                </span>
              </div>

              {/* Centerpiece Branded QR Code with Overlaid Network Emblem */}
              <div className="my-6 flex flex-col items-center">
                <div className="relative p-4 bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.45)] border-4 border-white/90">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=6&data=${encodeURIComponent(activeNetwork.address)}`}
                    alt={`${activeNetwork.shortName} QR`}
                    className="w-48 h-48 sm:w-52 sm:h-52 rounded-xl block"
                  />
                  {/* Center Floating Official Network Logo Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="p-1.5 rounded-2xl bg-white shadow-xl ring-4 ring-white">
                      <NetworkLogo networkId={activeNetwork.id} size={38} />
                    </div>
                  </div>
                </div>

                <div className="mt-3.5 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/50 border border-white/10 text-xs font-bold text-slate-200">
                  <AssetLogo asset={selectedAsset} size={18} />
                  <span>
                    Send <b>{selectedAsset}</b> via <b>{activeNetwork.shortName}</b> Network Only
                  </span>
                </div>
              </div>

              {/* Official Receive Address Box + 1-Click Copy */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-300 uppercase tracking-wider">
                    Official {activeNetwork.shortName} Receive Address
                  </span>
                  <a
                    href={activeNetwork.explorerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-400 hover:underline flex items-center gap-1"
                  >
                    <span>{activeNetwork.explorerName}</span>
                    <ExternalLink size={12} />
                  </a>
                </div>

                <div className="p-4 rounded-2xl bg-black/70 border border-white/15 font-mono text-xs sm:text-sm text-emerald-300 break-all select-all leading-relaxed shadow-inner">
                  {activeNetwork.address}
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyAddress(activeNetwork.address, 'MAIN')}
                  className={`w-full py-4 px-5 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all active:scale-95 cursor-pointer shadow-xl ${
                    isMainAddrCopied
                      ? 'bg-emerald-400 text-slate-950 shadow-emerald-400/30'
                      : `bg-gradient-to-r ${activeNetwork.buttonGrad} text-white`
                  }`}
                >
                  {isMainAddrCopied ? <Check size={18} strokeWidth={3} /> : <Copy size={17} />}
                  <span>
                    {isMainAddrCopied
                      ? `✓ ${activeNetwork.shortName} Address Copied!`
                      : `Copy ${activeNetwork.shortName} Receive Address`}
                  </span>
                </button>
              </div>

              {/* Network Telemetry Details */}
              <div className="mt-5 pt-4 border-t border-white/10 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold">Current Network Balance:</span>
                  <span className="font-mono font-black text-white">
                    ${activeNetwork.usdtBalance} USDT
                    {activeNetwork.id === 'TON' ? ` • ${activeNetwork.nativeBalance} TON` : ` • ${activeNetwork.nativeBalance} ${activeNetwork.nativeSymbol}`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold">Estimated Arrival Time:</span>
                  <span className="font-mono font-bold text-emerald-400">{activeNetwork.arrivalTime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold">Exchange Withdraw Fee:</span>
                  <span className="font-mono font-bold text-sky-300">{activeNetwork.feeEst}</span>
                </div>
              </div>

              {/* Important Safety Notice */}
              <div className="mt-4 p-3.5 rounded-2xl bg-black/50 border border-amber-500/30 text-[11px] text-amber-200/90 leading-relaxed">
                ⚠️ {activeNetwork.note}
              </div>

              {/* Refresh After Deposit Button */}
              <button
                type="button"
                onClick={() => {
                  refresh();
                  showNotice('success', `${activeNetwork.shortName} সহ সকল নেটওয়ার্কের লাইভ ব্যালেন্স আপডেট করা হচ্ছে...`);
                }}
                className="mt-4 w-full py-3.5 px-4 rounded-2xl text-xs font-black uppercase tracking-wider bg-white/10 hover:bg-white/20 text-white border border-white/15 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                <span>I Sent Deposit • Refresh Live Balance</span>
              </button>
            </div>
          ) : (
            /* TONKEEPER 1-CLICK DIRECT DEPOSIT TERMINAL */
            <div className="p-6 sm:p-7 rounded-[2.4rem] border bg-gradient-to-b from-sky-500/20 via-blue-900/20 to-slate-950 border-sky-400/50 shadow-2xl space-y-5">
              <div className="flex items-center gap-3.5 pb-4 border-b border-white/10">
                <NetworkLogo networkId="TON" size={48} />
                <div>
                  <h3 className="text-lg font-black text-white">Tonkeeper 1-Click Deposit</h3>
                  <p className="text-xs text-slate-300">
                    পপ-আপ বা কপি-পেস্ট ছাড়াই সরাসরি আপনার কানেক্টেড Tonkeeper ওয়ালেট থেকে ডিপোজিট করুন
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-sky-300">
                  Deposit Amount ({selectedAsset})
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={tonkeeperAmount}
                    onChange={e => {
                      const v = e.target.value;
                      if (v === '' || /^[0-9]*\.?[0-9]*$/.test(v)) setTonkeeperAmount(v);
                    }}
                    placeholder="0.00"
                    className="w-full bg-black/60 border border-sky-500/40 p-4 pl-5 pr-24 rounded-2xl text-2xl font-black text-white outline-none focus:border-sky-400 font-mono"
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-black text-sky-400">
                    {selectedAsset}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['1', '5', '10', '25', '50', '100'].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setTonkeeperAmount(val)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-sky-500/20 text-slate-200 border border-slate-700 cursor-pointer"
                    >
                      +{val} {selectedAsset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-black/50 border border-white/10 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold">Connected Tonkeeper:</span>
                  {userTonAddress ? (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold">
                      Connected
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => tonConnectUI.openModal()}
                      className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-black cursor-pointer"
                    >
                      Connect Wallet
                    </button>
                  )}
                </div>
                {userTonAddress && (
                  <div className="font-mono text-[11px] text-sky-300 break-all">{userTonAddress}</div>
                )}
              </div>

              <button
                type="button"
                disabled={depositing || !tonkeeperAmount || parseFloat(tonkeeperAmount) <= 0}
                onClick={handleTonkeeperDeposit}
                className="w-full py-4 px-5 rounded-2xl text-sm font-black uppercase tracking-wider bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {depositing ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Confirm in Tonkeeper...</span>
                  </>
                ) : (
                  <>
                    <ArrowDownToLine size={16} />
                    <span>Send {tonkeeperAmount || ''} {selectedAsset} via Tonkeeper</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
