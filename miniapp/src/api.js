import axios from 'axios';
import WebApp from '@twa-dev/sdk';

const isLocal = window.location.hostname === 'localhost' || window.location.hostname.includes('192.168');
const API_URL = isLocal ? `${window.location.protocol}//${window.location.hostname}:3000` : 'https://maruf-teach-bot.onrender.com';

export const fetchUserData = async (userId) => {
    try {
        const res = await axios.get(`${API_URL}/api/miniapp/user/${userId}`);
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
        const res = await axios.get(`${API_URL}/api/miniapp/rates`);
        return res.data;
    } catch (e) {
        console.error("fetchMarketRates error:", e);
        return null;
    }
};




