import axios from 'axios';
import WebApp from '@twa-dev/sdk';

const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname.includes('192.168') || window.location.hostname.includes('127.0.0.1'));
const API_URL = isLocal 
    ? `${window.location.protocol}//${window.location.hostname}:3000` 
    : (typeof window !== 'undefined' && window.location.origin && window.location.origin.startsWith('http') ? window.location.origin : 'https://maruf-teach-bot.onrender.com');

// Default axios config with timeout to prevent hanging on mobile networks
axios.defaults.timeout = 12000;

// Simple fast deterministic string hash (FNV-1a 64-bit style hex)
function hashString(str) {
    let h1 = 0xdeadbeef ^ str.length;
    let h2 = 0x41c6ce57 ^ str.length;
    for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
}

let cachedFp = null;

export const getDeviceFingerprint = () => {
    if (cachedFp) return cachedFp;
    try {
        // 1. Extract WebGL Hardware GPU Renderer & Vendor (identical across clone apps on the same physical phone)
        let gpuInfo = 'unknown_gpu';
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (gl) {
                const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR);
                const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
                gpuInfo = `${vendor || ''}|${renderer || ''}`;
            }
        } catch (e) {}

        // 2. Physical Screen & Hardware traits (identical across clone apps)
        const sw = Math.min(window.screen?.width || 0, window.screen?.height || 0);
        const sh = Math.max(window.screen?.width || 0, window.screen?.height || 0);
        const dpr = (window.devicePixelRatio || 1).toFixed(2);
        const depth = window.screen?.colorDepth || 24;
        const cores = navigator.hardwareConcurrency || 0;
        const mem = navigator.deviceMemory || 0;
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
        const platform = navigator.platform || '';

        // 3. Extract Android/iOS physical device model from User-Agent
        const ua = navigator.userAgent || '';
        let deviceModel = 'generic_device';
        const androidMatch = ua.match(/Android\s+[0-9.]+;\s*([^;)]+?)(?:\s+Build\/|\))/i);
        if (androidMatch && androidMatch[1]) {
            deviceModel = androidMatch[1].trim();
        } else if (/iPhone/i.test(ua)) {
            deviceModel = `iPhone_${sw}x${sh}@${dpr}`;
        } else if (/iPad/i.test(ua)) {
            deviceModel = `iPad_${sw}x${sh}@${dpr}`;
        }

        // 4. 2D Canvas hardware rendering signature
        let canvasSig = '';
        try {
            const c2d = document.createElement('canvas');
            c2d.width = 120;
            c2d.height = 30;
            const ctx = c2d.getContext('2d');
            if (ctx) {
                ctx.textBaseline = 'top';
                ctx.font = '14px Arial';
                ctx.fillStyle = '#4f46e5';
                ctx.fillRect(10, 1, 62, 20);
                ctx.fillStyle = '#069';
                ctx.fillText('TrustPay#AntiClone', 2, 12);
                canvasSig = hashString(c2d.toDataURL());
            }
        } catch (e) {}

        // Deterministic Hardware Hash (same across any clone app on the same phone!)
        const rawHwString = `${gpuInfo}||${sw}x${sh}x${depth}@${dpr}||c:${cores}|m:${mem}||${deviceModel}||${tz}||${platform}||${canvasSig}`;
        const hwHash = 'hw_' + hashString(rawHwString);

        // 5. Persistent storage token (catches multi-account switching inside the same app)
        let deviceUid = '';
        try {
            deviceUid = localStorage.getItem('tp_device_uid_v1') || '';
            if (!deviceUid) {
                deviceUid = 'du_' + hashString(rawHwString + '_' + Date.now() + '_' + Math.random());
                localStorage.setItem('tp_device_uid_v1', deviceUid);
            }
        } catch (e) {
            deviceUid = hwHash;
        }

        // 6. Check for referral start_param in Telegram WebApp or URL
        let startParam = '';
        try {
            startParam = window.Telegram?.WebApp?.initDataUnsafe?.start_param || '';
            if (!startParam) {
                const urlParams = new URLSearchParams(window.location.search);
                startParam = urlParams.get('tgWebAppStartParam') || urlParams.get('startapp') || urlParams.get('ref') || '';
            }
            if (startParam && String(startParam).startsWith('ref_')) {
                localStorage.setItem('tp_pending_ref', String(startParam));
            } else {
                const savedRef = localStorage.getItem('tp_pending_ref');
                if (savedRef) startParam = savedRef;
            }
        } catch (e) {}

        cachedFp = {
            hwHash,
            deviceUid,
            deviceModel,
            gpuInfo,
            screenSpec: `${sw}x${sh}@${dpr}`,
            startParam
        };
        return cachedFp;
    } catch (e) {
        return { hwHash: '', deviceUid: '', deviceModel: '', startParam: '' };
    }
};

export const fetchUserData = async (userId, attempt = 1) => {
    try {
        const fp = getDeviceFingerprint();
        const res = await axios.get(`${API_URL}/api/miniapp/user/${userId}?_t=${Date.now()}`, {
            params: {
                hwHash: fp.hwHash,
                deviceUid: fp.deviceUid,
                deviceModel: fp.deviceModel
            },
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache'
            }
        });
        return res.data;
    } catch (e) {
        console.warn(`fetchUserData error (attempt ${attempt}):`, e?.message || e);
        if (attempt < 3) {
            return new Promise(resolve =>
                setTimeout(() => resolve(fetchUserData(userId, attempt + 1)), 1000)
            );
        }
        return null;
    }
};

export const syncUserProfile = async (payload) => {
    try {
        const fp = getDeviceFingerprint();
        const res = await axios.post(`${API_URL}/api/miniapp/sync-profile`, {
            ...payload,
            hwHash: fp.hwHash,
            deviceUid: fp.deviceUid,
            deviceModel: fp.deviceModel,
            startParam: payload.startParam || fp.startParam || ''
        });
        return res.data;
    } catch (e) {
        return null;
    }
};

export const submitFreeTonTask = async (payload) => {
    try {
        const res = await axios.post(`${API_URL}/api/miniapp/task`, payload);
        return res.data;
    } catch (e) {
        console.error(e);
        throw e;
    }
};

export const submitSellOrder = async (payload) => {
    try {
        const fp = getDeviceFingerprint();
        const res = await axios.post(`${API_URL}/api/miniapp/sell`, {
            ...payload,
            hwHash: fp.hwHash,
            deviceUid: fp.deviceUid,
            deviceModel: fp.deviceModel
        });
        return res.data;
    } catch (e) {
        console.error(e);
        throw e;
    }
};

export const saveFiatWallet = async (payload) => {
    try {
        const fp = getDeviceFingerprint();
        const res = await axios.post(`${API_URL}/api/miniapp/save-wallet`, {
            ...payload,
            hwHash: fp.hwHash,
            deviceUid: fp.deviceUid,
            deviceModel: fp.deviceModel
        });
        return res.data;
    } catch (e) {
        throw new Error(e.response?.data?.error || 'Failed to save wallet');
    }
};

export const withdrawFiat = async (payload) => {
    try {
        const res = await axios.post(`${API_URL}/api/miniapp/withdraw-fiat`, payload);
        return res.data;
    } catch (e) {
        throw new Error(e.response?.data?.error || 'Failed to request withdrawal');
    }
};

export const buildTransaction = async (payload) => {
    try {
        const res = await axios.post(`${API_URL}/api/miniapp/build-tx`, payload);
        return res.data;
    } catch (e) {
        console.error(e);
        throw e.response?.data || e;
    }
};

export const submitBuyOrder = async (payload) => {
    try {
        const res = await axios.post(`${API_URL}/api/miniapp/buy`, payload);
        return res.data;
    } catch (e) {
        throw new Error(e.response?.data?.error || e.message || 'Unknown error');
    }
};

export const submitAddMoney = async (payload) => {
    try {
        const fp = getDeviceFingerprint();
        const res = await axios.post(`${API_URL}/api/miniapp/add-money`, {
            ...payload,
            hwHash: fp.hwHash,
            deviceUid: fp.deviceUid,
            deviceModel: fp.deviceModel
        });
        return res.data;
    } catch (e) {
        throw new Error(e.response?.data?.error || e.message || 'Failed to add money');
    }
};

export const submitBuyCrypto = async (payload) => {
    try {
        const res = await axios.post(`${API_URL}/api/miniapp/buy-crypto`, payload);
        return res.data;
    } catch (e) {
        throw new Error(e.response?.data?.error || e.message || 'Failed to purchase crypto');
    }
};

export const submitSupportMessage = async (payload) => {
    try {
        const res = await axios.post(`${API_URL}/api/miniapp/support`, payload);
        return res.data;
    } catch (e) {
        throw new Error(e.response?.data?.error || e.message || 'Failed to send message to support');
    }
};

export const fetchMarketRates = async () => {
    try {
        const res = await axios.get(`${API_URL}/api/miniapp/rates?_t=${Date.now()}`, { timeout: 7000 });
        return res.data;
    } catch (e) {
        console.error("fetchMarketRates error:", e);
        return null;
    }
};

export const checkCommunityMembership = async (userId) => {
    try {
        const res = await axios.get(`${API_URL}/api/miniapp/check-membership`, {
            params: { userId, _t: Date.now() },
            timeout: 7000
        });
        return res.data;
    } catch (e) {
        console.warn("checkCommunityMembership error:", e);
        return { allJoined: false, inChannel: false, inGroup: false };
    }
};

export const verifyCommunityMembership = async (userId) => {
    try {
        const res = await axios.post(`${API_URL}/api/miniapp/verify-membership`, { userId }, {
            timeout: 9000
        });
        return res.data;
    } catch (e) {
        console.warn("verifyCommunityMembership error:", e);
        return { success: false, allJoined: false, inChannel: false, inGroup: false, error: e.response?.data?.error || e.message };
    }
};

export const fetchReferralData = async (userId) => {
    try {
        const res = await axios.get(`${API_URL}/api/miniapp/referrals/${userId}?_t=${Date.now()}`, {
            timeout: 9000
        });
        return res.data;
    } catch (e) {
        console.warn("fetchReferralData error:", e);
        return null;
    }
};

export const prepareReferralShare = async (payload) => {
    try {
        const res = await axios.post(`${API_URL}/api/miniapp/prepare-referral-share`, payload, {
            timeout: 9000
        });
        return res.data;
    } catch (e) {
        console.warn("prepareReferralShare error:", e);
        return null;
    }
};

export const fetchSpinStatus = async (userId) => {
    try {
        const res = await axios.get(`${API_URL}/api/miniapp/spin-status/${userId}?_t=${Date.now()}`, {
            timeout: 9000
        });
        return res.data;
    } catch (e) {
        console.warn("fetchSpinStatus error:", e);
        return null;
    }
};

export const executeSpin = async (userId) => {
    try {
        const res = await axios.post(`${API_URL}/api/miniapp/spin-execute`, { userId }, {
            timeout: 12000
        });
        return res.data;
    } catch (e) {
        throw new Error(e.response?.data?.error || e.message || 'Spin failed');
    }
};

export const watchSpinAd = async (userId) => {
    try {
        const res = await axios.post(`${API_URL}/api/miniapp/spin-watch-ad`, { userId }, {
            timeout: 10000
        });
        return res.data;
    } catch (e) {
        throw new Error(e.response?.data?.error || e.message || 'Ad verification failed');
    }
};

