import axios from 'axios';
import WebApp from '@twa-dev/sdk';

const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname.includes('192.168') || window.location.hostname.includes('127.0.0.1'));
const API_URL = isLocal 
    ? `${window.location.protocol}//${window.location.hostname}:3000` 
    : (typeof window !== 'undefined' && window.location.origin && window.location.origin.startsWith('http') ? window.location.origin : 'https://maruf-teach-bot.onrender.com');

// Default axios config with timeout to prevent hanging on mobile networks
axios.defaults.timeout = 12000;

export const fetchUserData = async (userId) => {
    try {
        const res = await axios.get(`${API_URL}/api/miniapp/user/${userId}?_t=${Date.now()}`);
        return res.data;
    } catch (e) {
        console.error(e);
        return { balance: 0 };
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
        const res = await axios.post(`${API_URL}/api/miniapp/sell`, payload);
        return res.data;
    } catch (e) {
        console.error(e);
        throw e;
    }
};

export const saveFiatWallet = async (payload) => {
    try {
        const res = await axios.post(`${API_URL}/api/miniapp/save-wallet`, payload);
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
        const res = await axios.post(`${API_URL}/api/miniapp/add-money`, payload);
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
