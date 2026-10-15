require('dotenv').config({ override: true });
const TelegramBot = require('node-telegram-bot-api');
const path = require('path');
const fs = require('fs');
const express = require('express');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const { getOrCreateBotWallet } = require('./walletManager');
const { createClient } = require('@supabase/supabase-js');

// Init Supabase
const supabaseUrl = 'https://piieczrpdqfoswerqgtl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpaWVjenJwZHFmb3N3ZXJxZ3RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDU4ODE2OSwiZXhwIjoyMTA2MTY0MTY5fQ.SHOi3gmKGSodPeRRv1dAe56sqf_nLX-YKe3C2oLSAKE'; // Service Role Key bypasses RLS
const supabase = createClient(supabaseUrl, supabaseKey);

const serviceAccount = require('./maruf-teach-firebase-adminsdk-fbsvc-e0269310ba.json');
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// In-memory caches and fallbacks to protect Firestore quota limits
const inMemoryVerifiedTrx = new Map();
const inMemoryMockTrxs = [];
let statsCache = { data: null, timestamp: 0 };
let ordersCache = { data: null, timestamp: 0 };
function invalidateOrdersCache() {
    ordersCache = { data: null, timestamp: 0 };
}

async function getVerifiedTrxRecord(trxId) {
    if (!trxId) return null;
    const cleanId = trxId.toString().trim().toUpperCase();
    if (inMemoryVerifiedTrx.has(cleanId)) {
        return {
            isInMemory: true,
            data: inMemoryVerifiedTrx.get(cleanId),
            ref: null
        };
    }
    try {
        const snap = await db.collection('verified_trx').doc(cleanId).get();
        if (snap.exists) {
            return {
                isInMemory: false,
                data: snap.data(),
                ref: snap.ref
            };
        }
    } catch (err) {
        console.warn("Firestore verified_trx lookup error:", err.message);
    }
    return null;
}

async function markVerifiedTrxClaimed(recordInfo, trxId, userId) {
    const cleanId = trxId.toString().trim().toUpperCase();
    if (recordInfo?.isInMemory || inMemoryVerifiedTrx.has(cleanId)) {
        const memData = inMemoryVerifiedTrx.get(cleanId) || recordInfo?.data;
        if (memData) {
            memData.claimed = true;
            memData.claimedBy = userId;
            memData.claimedAt = new Date();
            inMemoryVerifiedTrx.set(cleanId, memData);
        }
    }
    if (recordInfo?.ref) {
        try {
            await recordInfo.ref.update({
                claimed: true,
                claimedBy: userId,
                claimedAt: FieldValue.serverTimestamp()
            });
        } catch (err) {
            console.warn("Firestore mark claimed error:", err.message);
        }
    }
}

let botConfig = {
    gramAmount: '0.07',
    usdtAmount: '0.05',
    freeLink: 'https://t.me/VictorsCompanybot/app?startapp=ref_DBF2368328',
    adminGroupId: '',
    dataGroupId: '',
    supportGroupId: '',
    withdrawGroupId: '',
    payoutGroupId: '@bd_trust_pay_payout'
};

// Helper: Post live payout confirmation to public Payout Group / Channel (Matches Image 2)
const notifyPayoutGroup = async (payoutData) => {
    try {
        const primaryTarget = (botConfig.payoutGroupId && botConfig.payoutGroupId !== '@bd_trustpay_payout' && botConfig.payoutGroupId !== '-1004483837390') ? botConfig.payoutGroupId : '-1004405147138';
        const fallbackTarget = '-1004405147138';
        if (!bot) return;

        const maskId = (id) => {
            const s = String(id || '');
            if (s.length <= 4) return s;
            return s.slice(0, 3) + '***' + s.slice(-2);
        };

        const maskNumber = (num) => {
            const s = String(num || '');
            if (s.length <= 6) return s;
            return s.slice(0, 4) + '***' + s.slice(-3);
        };

        const escapeHtml = (str) => {
            return String(str || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        };

        const nowStr = new Date().toLocaleTimeString('en-US', { 
            timeZone: 'Asia/Dhaka', 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: true 
        });

        const safeCustomerName = escapeHtml(payoutData.name || 'Verified User');

        let msg = '';
        if (payoutData.type === 'fiat') {
            const amt = parseFloat(payoutData.amount || 0).toFixed(2);
            const rec = parseFloat(payoutData.receiveAmount || payoutData.amount || 0).toFixed(2);
            const method = (payoutData.method || 'bKash').toUpperCase();
            
            msg = `<b>⚡ 𝗧𝗥𝗨𝗦𝗧 𝗣𝗔𝗬 — 𝗣𝗔𝗬𝗢𝗨𝗧 𝗣𝗥𝗢𝗢𝗙</b>\n` +
                  `━━━━━━━━━━━━━━━━━━━━━━\n` +
                  `✅ <b>Status:</b> <code>Paid Successfully</code> 💸\n` +
                  `👤 <b>Customer:</b> <b>${safeCustomerName}</b> (<code>${maskId(payoutData.userId)}</code>)\n` +
                  `🏦 <b>Payment Method:</b> <b>${method}</b> (<code>${maskNumber(payoutData.number)}</code>)\n\n` +
                  `<blockquote>💵 <b>Withdraw Amount:</b> ৳${amt} BDT\n` +
                  `📦 <b>Net Received:</b> <b>৳${rec} BDT</b></blockquote>\n\n` +
                  `⏱ <b>Completed:</b> <code>${nowStr} (BST)</code>\n` +
                  `━━━━━━━━━━━━━━━━━━━━━━\n` +
                  `🚀 <b>Bot:</b> @bd_trust_pay_bot\n` +
                  `#TrustPay #PayoutProof #${method} #Withdrawal`;
        } else {
            const asset = (payoutData.asset || 'TON').toUpperCase();
            msg = `<b>⚡ 𝗧𝗥𝗨𝗦𝗧 𝗣𝗔𝗬 — 𝗣𝗔𝗬𝗢𝗨𝗧 𝗣𝗥𝗢𝗢𝗙</b>\n` +
                  `━━━━━━━━━━━━━━━━━━━━━━\n` +
                  `✅ <b>Status:</b> <code>On-Chain Transferred</code> 💎\n` +
                  `👤 <b>Customer:</b> <b>${safeCustomerName}</b> (<code>${maskId(payoutData.userId)}</code>)\n` +
                  `🏷 <b>Wallet Address:</b> <code>${payoutData.destination || ''}</code>\n\n` +
                  `<blockquote>💰 <b>Crypto Amount:</b> ${payoutData.amount} ${asset}\n` +
                  `📦 <b>Delivered:</b> <b>${payoutData.receiveAmount || payoutData.amount} ${asset}</b></blockquote>\n\n` +
                  `⏱ <b>Completed:</b> <code>${nowStr} (BST)</code>\n` +
                  `━━━━━━━━━━━━━━━━━━━━━━\n` +
                  `🚀 <b>Bot:</b> @bd_trust_pay_bot\n` +
                  `#TrustPay #CryptoPayout #${asset}`;
        }

        try {
            await bot.sendMessage(primaryTarget, msg, { parse_mode: 'HTML', disable_web_page_preview: true });
            console.log("Posted public payout proof to primary target:", primaryTarget);
        } catch(primaryErr) {
            console.warn(`Failed to post to primary target ${primaryTarget}:`, primaryErr.message);
            if (primaryTarget !== fallbackTarget) {
                try {
                    await bot.sendMessage(fallbackTarget, msg, { parse_mode: 'HTML', disable_web_page_preview: true });
                    console.log("Posted public payout proof to fallback target:", fallbackTarget);
                } catch(fallbackErr) {
                    console.error("Failed to post to fallback target:", fallbackErr.message);
                }
            }
        }
    } catch(err) {
        console.error("Failed in notifyPayoutGroup:", err.message);
    }
};
async function loadConfig() {
    try {
        const doc = await db.collection('settings').doc('config').get();
        if (doc.exists) botConfig = { ...botConfig, ...doc.data() };
    } catch(e) { console.error("Config load error:", e); }
}
loadConfig();
async function saveConfig(newConf) {
    botConfig = { ...botConfig, ...newConf };
    try { await db.collection('settings').doc('config').set(botConfig, { merge: true }); } catch(e) {}
}


// Global Crash Protection & Unhandled Rejection Resilience for high concurrent traffic
process.on('uncaughtException', (err) => {
    console.error('[CRITICAL UNCAUGHT EXCEPTION]:', err?.message || err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('[CRITICAL UNHANDLED REJECTION]:', reason?.message || reason);
});

const token = process.env.BOT_TOKEN;
const channelUsername = process.env.CHANNEL_USERNAME || '@maruf_teach';
const OFFICIAL_CHANNEL = process.env.CHANNEL_USERNAME || '@maruf_teach';
const PAYOUT_GROUP = '@bd_trust_pay_payout';
const OFFICIAL_CHANNEL_URL = 'https://t.me/maruf_teach';
const PAYOUT_GROUP_URL = 'https://t.me/bd_trust_pay_payout';
const WEB_APP_URL = 'https://maruf-teach-bot.onrender.com/app/?v=20261014v15';
const appOpenMarkup = {
    reply_markup: {
        inline_keyboard: [
            [{ text: '🚀 ওপেন অ্যাপ (Open App)', web_app: { url: WEB_APP_URL } }]
        ]
    }
};
const bkashNumber = process.env.BKASH_NUMBER;
const botEvmAddress = process.env.BOT_EVM_ADDRESS || process.env.BEP20_ADDRESS;
const adminUsername = "maruff666";

const bot = new TelegramBot(token, { polling: true });
bot.setChatMenuButton({
    menu_button: {
        type: 'web_app',
        text: 'Trust Pay',
        web_app: { url: WEB_APP_URL }
    }
}).catch(err => console.warn('[MenuButton]:', err.message));

bot.on('polling_error', (error) => {
    // Ignore transient Telegram network polling resets
    if (error.code !== 'ETELEGRAM' && !error.message?.includes('EFATAL')) {
        console.warn('[Telegram Polling Notice]:', error.message || error.code);
    }
});

async function checkUserCommunities(userId) {
    let inChannel = false;
    let inGroup = false;
    const valid = ['creator', 'administrator', 'member', 'restricted'];
    try {
        const c1 = await bot.getChatMember(OFFICIAL_CHANNEL, userId);
        inChannel = valid.includes(c1?.status);
    } catch (e) {
        console.warn('Channel check warning (@maruf_teach):', e.message);
        inChannel = false;
    }
    try {
        const c2 = await bot.getChatMember(PAYOUT_GROUP, userId);
        inGroup = valid.includes(c2?.status);
    } catch (e) {
        console.warn('Group check warning (@bd_trust_pay_payout):', e.message);
        inGroup = false;
    }
    return {
        inChannel,
        inGroup,
        allJoined: Boolean(inChannel && inGroup)
    };
}

const { beginCell, Address } = require('@ton/core');
const app = express();
const cors = require('cors');
app.use(cors());

// Resilient raw-body middleware for SMS webhooks
// Prevents Express from crashing with HTTP 400 when MacroDroid sends unescaped newlines/quotes in JSON
const smsWebhookPaths = [
    '/api/macrodroid/webhook',
    '/api/webhook',
    '/webhook',
    '/api/sms'
];

app.use(smsWebhookPaths, (req, res, next) => {
    if (req.method !== 'POST' && req.method !== 'PUT') {
        return next();
    }

    let rawData = '';
    req.setEncoding('utf8');
    req.on('data', chunk => {
        rawData += chunk;
    });

    req.on('end', () => {
        req._body = true; // Tell body-parser stream has already been consumed
        req.rawBody = rawData;
        req.body = {};

        if (!rawData || !rawData.trim()) {
            return next();
        }

        const trimmed = rawData.trim();

        // 1. Try standard JSON first
        try {
            req.body = JSON.parse(trimmed);
            return next();
        } catch (_) {}

        // 2. Sanitize unescaped newlines and control characters from MacroDroid {sms_message}
        try {
            const sanitized = trimmed.replace(/\r?\n|\r/g, ' ').replace(/\t/g, ' ');
            req.body = JSON.parse(sanitized);
            return next();
        } catch (_) {}

        // 3. Regex fallback to extract sender and message even with unescaped internal quotes
        try {
            const senderMatch = trimmed.match(/"(?:sender|sms_sender|from)"\s*:\s*"([^"]*)"/i);
            let msgMatch = trimmed.match(/"(?:message|sms_message|text|sms|body)"\s*:\s*"([\s\S]*?)"\s*(?:,\s*"[a-zA-Z0-9_]+"\s*:|\s*})/i);
            if (!msgMatch) {
                msgMatch = trimmed.match(/"(?:message|sms_message|text|sms|body)"\s*:\s*"([\s\S]*)"\s*}/i);
            }

            if (senderMatch || msgMatch) {
                req.body = {
                    sender: senderMatch ? senderMatch[1] : undefined,
                    message: msgMatch ? msgMatch[1].replace(/\r?\n|\r/g, ' ') : trimmed
                };
                return next();
            }
        } catch (_) {}

        // 4. Raw fallback
        req.body = { message: trimmed };
        next();
    });
});

app.use(express.json());

// Express syntax error fallback
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        console.warn("JSON SyntaxError caught on", req.originalUrl, ":", err.message);
        if (req.originalUrl && (req.originalUrl.includes('webhook') || req.originalUrl.includes('sms'))) {
            req.body = { message: typeof err.body === 'string' ? err.body : '' };
            return next();
        }
        return res.status(400).json({ error: "Invalid JSON format" });
    }
    next(err);
});
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const userStates = {}; 

const t = {
    en: {
        welcome: `💎 <b>Trust Pay — ট্রাস্ট পে</b> 💎\n\nWelcome! Instant & secure Crypto Buy/Sell via bKash & Nagad.\n\n📢 <b>Join Communities:</b>\n1. Channel\n2. Payout Channel\n\n👇 <b>Join & tap buttons below to verify:</b>`,
        joinChannelBtn: 'Channel 1',
        joinGroupBtn: 'Channel 2',
        verifyBtn: '✅ Verify & Open App',
        notJoined: '❌ Please join both channels first!',
        langPrompt: '✅ <b>Verification Successful!</b>\n\nPlease select your language:',
        profileMsg: '👤 <b>Profile</b>\n\nID: {id}',
        bkashMsg: '🚀 <b>bKash Payment</b>',
        cryptoMsg: '💎 <b>Crypto Payment</b>',
        menu: { free: '🎁 Free', profile: '👤 Profile' },
        mainMenuMsg: "🎉 <b>Verification Successful!</b>\n\n👇 <b>Tap below to open the app:</b>"
    },
    bn: {
        welcome: `💎 <b>Trust Pay — ট্রাস্ট পে</b> 💎\n\nস্বাগতম! বিকাশ ও নগদে দ্রুত ও নিরাপদ ক্রিপ্টো বাই-সেল।\n\n📢 <b>কমিউনিটিতে যুক্ত হোন:</b>\n১. চ্যানেল\n২. পে-আউট চ্যানেল\n\n👇 <b>জয়েন করে নিচের বোতামে চাপ দিন:</b>`,
        joinChannelBtn: 'Channel 1',
        joinGroupBtn: 'Channel 2',
        verifyBtn: '✅ ভেরিফাই ও অ্যাপ ওপেন',
        notJoined: '❌ অনুগ্রহ করে চ্যানেল দুটিতেই যুক্ত হোন!',
        langPrompt: '✅ <b>ভেরিফিকেশন সফল!</b>\n\nভাষা নির্বাচন করুন:',
        profileMsg: '👤 <b>প্রোফাইল</b>\n\nID: {id}',
        bkashMsg: '🚀 <b>বিকাশ পেমেন্ট</b>',
        cryptoMsg: '💎 <b>ক্রিপ্টো পেমেন্ট</b>',
        menu: { free: '🎁 ফ্রি', profile: '👤 প্রোফাইল' },
        mainMenuMsg: "🎉 <b>ভেরিফিকেশন সফল!</b>\n\n👇 <b>নিচের বোতামে চাপ দিয়ে অ্যাপ ওপেন করুন:</b>"
    }
};

async function getAdminTreasuryBalances() {
    let tonBalance = 0;
    let usdtBalance = 0;
    const adminAddress = process.env.BOT_TON_ADDRESS || "UQC7hYHfrVJ_uT_esMr7vCv1bVh5ytQxYUUjRDiTUiG9s5Fb";

    // 1. Fetch live native TON balance
    try {
        const res = await axios.get(`https://tonapi.io/v2/accounts/${adminAddress}`, { timeout: 4000 });
        if (res.data && res.data.balance !== undefined) {
            tonBalance = parseFloat(res.data.balance) / 1e9;
        }
    } catch (e) {
        try {
            const res2 = await axios.get(`https://toncenter.com/api/v2/getWalletInformation?address=${adminAddress}`, { timeout: 4000 });
            if (res2.data?.result?.balance !== undefined) {
                tonBalance = parseFloat(res2.data.result.balance) / 1e9;
            }
        } catch (e2) {
            console.warn("Failed to fetch admin TON balance:", e2.message);
        }
    }

    // 2. Fetch live USDT (Jetton) balance on TON
    try {
        const jettonRes = await axios.get(`https://tonapi.io/v2/accounts/${adminAddress}/jettons`, { timeout: 4000 });
        if (jettonRes.data && Array.isArray(jettonRes.data.balances)) {
            const usdtItem = jettonRes.data.balances.find(j => 
                j.jetton?.symbol === 'USD₮' || 
                j.jetton?.symbol === 'USDT' || 
                j.jetton?.address?.includes('EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs')
            );
            if (usdtItem && usdtItem.balance) {
                const decimals = usdtItem.jetton?.decimals || 6;
                usdtBalance = parseFloat(usdtItem.balance) / Math.pow(10, decimals);
            }
        }
    } catch (e) {
        console.warn("Failed to fetch admin USDT balance:", e.message);
    }

    return {
        ton: Number(tonBalance.toFixed(4)),
        usdt: Number(usdtBalance.toFixed(4)),
        address: adminAddress
    };
}

async function sendTonOnChain(destination, amount) {
    const { WalletContractV4, internal, external, storeMessage } = require('@ton/ton');
    const { beginCell } = require('@ton/core');
    const { mnemonicToPrivateKey } = require('@ton/crypto');
    const { ethers } = require('ethers');

    if (!process.env.BOT_TON_SEED) {
        throw new Error("BOT_TON_SEED is not configured in .env");
    }

    // 1. Strict Treasury Check before creating tx
    const treasury = await getAdminTreasuryBalances();
    const MIN_TON_GAS = 0.02;
    const reqTon = parseFloat(amount);
    if (treasury.ton < reqTon + MIN_TON_GAS) {
        throw new Error(`এডমিন ওয়ালেটে পর্যাপ্ত TON ব্যালেন্স নেই! বর্তমান ব্যালেন্স: ${treasury.ton} TON, প্রয়োজন: ${(reqTon + MIN_TON_GAS).toFixed(4)} TON (গ্যাস ফিসহ)`);
    }

    const seedWords = process.env.BOT_TON_SEED.trim().split(/\s+/);
    const keyPair = await mnemonicToPrivateKey(seedWords);
    const wallet = WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey });
    const walletAddrStr = wallet.address.toString({ bounceable: false });

    let seqno = 0;
    try {
        const seqnoRes = await axios.get(`https://toncenter.com/api/v2/getWalletInformation?address=${walletAddrStr}`);
        seqno = seqnoRes.data?.result?.seqno || 0;
    } catch (e) {
        try {
            const tonapiRes = await axios.get(`https://tonapi.io/v2/accounts/${walletAddrStr}`);
            seqno = tonapiRes.data?.seqno || 0;
        } catch (e2) {
            seqno = 0;
        }
    }

    const amountNano = ethers.parseUnits(amount.toString(), 9);

    const transfer = wallet.createTransfer({
        seqno,
        secretKey: keyPair.secretKey,
        messages: [
            internal({
                to: destination,
                value: amountNano,
                bounce: false,
                body: (function() {
                    const { beginCell } = require('@ton/core');
                    return beginCell().storeUint(0, 32).storeStringTail("TrustPay").endCell();
                })()
            })
        ]
    });

    const extMsg = beginCell().store(storeMessage(external({
        to: wallet.address,
        body: transfer
    }))).endCell();

    const boc = extMsg.toBoc().toString('base64');

    try {
        const res = await axios.post('https://toncenter.com/api/v2/sendBoc', { boc });
        return { success: true, boc, provider: 'toncenter', result: res.data };
    } catch (err) {
        console.warn("Toncenter sendBoc failed, trying TonAPI:", err.response?.data || err.message);
        try {
            const res2 = await axios.post('https://tonapi.io/v2/blockchain/message', { boc });
            return { success: true, boc, provider: 'tonapi', result: res2.data };
        } catch (err2) {
            const errMsg = err2.response?.data?.error || err2.message;
            throw new Error("Blockchain transfer rejected: " + errMsg);
        }
    }
}

async function sendJettonUsdtOnChain(destination, amount) {
    const { WalletContractV4, internal, external, storeMessage } = require('@ton/ton');
    const { beginCell, Address } = require('@ton/core');
    const { mnemonicToPrivateKey } = require('@ton/crypto');
    const { ethers } = require('ethers');

    if (!process.env.BOT_TON_SEED) {
        throw new Error("BOT_TON_SEED is not configured in .env");
    }

    // 1. Strict Treasury & Gas Check
    const treasury = await getAdminTreasuryBalances();
    const reqUsdt = parseFloat(amount);
    if (treasury.usdt < reqUsdt) {
        throw new Error(`এডমিন ওয়ালেটে পর্যাপ্ত USDT নেই! বর্তমান ব্যালেন্স: ${treasury.usdt} USDT, প্রয়োজন: ${reqUsdt} USDT`);
    }
    if (treasury.ton < 0.05) {
        throw new Error(`এডমিন ওয়ালেটে গ্যাস ফি (TON) অপর্যাপ্ত! বর্তমান TON ব্যালেন্স: ${treasury.ton} TON, প্রয়োজন: 0.05 TON`);
    }

    const seedWords = process.env.BOT_TON_SEED.trim().split(/\s+/);
    const keyPair = await mnemonicToPrivateKey(seedWords);
    const wallet = WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey });
    const walletAddrStr = wallet.address.toString({ bounceable: false });

    // 2. Resolve admin's USDT Jetton Wallet
    const usdtMaster = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';
    let adminJettonWallet = null;
    try {
        const jwRes = await axios.get(`https://tonapi.io/v2/blockchain/accounts/${usdtMaster}/methods/get_wallet_address?args=${walletAddrStr}`);
        if (jwRes.data?.decoded?.jetton_wallet_address) {
            adminJettonWallet = jwRes.data.decoded.jetton_wallet_address;
        }
    } catch(e) {}
    if (!adminJettonWallet) {
        adminJettonWallet = 'EQDE4Uycx9ZudIjjmaqmLx3MFTHjURx2FCU6nlH1bzFWCvZA';
    }

    let seqno = 0;
    try {
        const seqnoRes = await axios.get(`https://toncenter.com/api/v2/getWalletInformation?address=${walletAddrStr}`);
        seqno = seqnoRes.data?.result?.seqno || 0;
    } catch (e) {
        try {
            const tonapiRes = await axios.get(`https://tonapi.io/v2/accounts/${walletAddrStr}`);
            seqno = tonapiRes.data?.seqno || 0;
        } catch (e2) {
            seqno = 0;
        }
    }

    const amountInMicro = Math.floor(reqUsdt * 1e6); // 6 decimals for USDT

    const commentCell = beginCell()
        .storeUint(0, 32)
        .storeStringTail("TrustPay")
        .endCell();

    const jettonBody = beginCell()
        .storeUint(0xf8a7ea5, 32)
        .storeUint(0, 64)
        .storeCoins(amountInMicro)
        .storeAddress(Address.parse(destination))
        .storeAddress(Address.parse(walletAddrStr))
        .storeBit(0) // custom payload
        .storeCoins(1) // forward_ton_amount
        .storeBit(1) // forward_payload in ref
        .storeRef(commentCell)
        .endCell();

    const transfer = wallet.createTransfer({
        seqno,
        secretKey: keyPair.secretKey,
        messages: [
            internal({
                to: Address.parse(adminJettonWallet),
                value: ethers.parseUnits('0.05', 9),
                bounce: true,
                body: jettonBody
            })
        ]
    });

    const extMsg = beginCell().store(storeMessage(external({
        to: wallet.address,
        body: transfer
    }))).endCell();

    const boc = extMsg.toBoc().toString('base64');

    try {
        const res = await axios.post('https://toncenter.com/api/v2/sendBoc', { boc });
        return { success: true, boc, provider: 'toncenter', result: res.data };
    } catch (err) {
        try {
            const res2 = await axios.post('https://tonapi.io/v2/blockchain/message', { boc });
            return { success: true, boc, provider: 'tonapi', result: res2.data };
        } catch (err2) {
            const errMsg = err2.response?.data?.error || err2.message;
            throw new Error("Blockchain USDT transfer rejected: " + errMsg);
        }
    }
}

function getMenu(lang) {
    const m = t[lang].menu;
    return {
        reply_markup: {
            keyboard: [ [ { text: m.free }, { text: m.profile } ] ],
            resize_keyboard: true
        }
    };
}

const processedStartIds = new Set();


async function notifyNewUserJoined(userId, userData = {}) {
    try {
        if (!userId || userId === 123456789 || isNaN(userId)) return;
        const userRef = db.collection('users').doc(userId.toString());
        const userDoc = await userRef.get().catch(() => null);

        let userNumber = 1;
        let isNew = false;
        if (userDoc && userDoc.exists) {
            const d = userDoc.data();
            if (d.userNumber) return; // already counted
            userNumber = d.userNumber || 1;
        } else {
            isNew = true;
            try {
                const countSnap = await db.collection('users').count().get();
                userNumber = (countSnap.data().count || 0) + 1;
            } catch (cErr) {
                try {
                    const snap = await db.collection('users').select().get();
                    userNumber = snap.size + 1;
                } catch(e) {
                    userNumber = 1;
                }
            }
            await userRef.set({
                chatId: userId,
                userId: userId,
                username: userData.username || "Unknown",
                firstName: userData.firstName || "User",
                joinedAt: new Date(),
                status: 'pending_verification',
                totalPayouts: 0,
                balance: 0,
                userNumber: userNumber,
                ...userData
            }, { merge: true });
        }

        const targetGroup = botConfig?.userLogGroupId || botConfig?.newUserGroupId;
        if (targetGroup && bot) {
            const firstName = userData.firstName || (userDoc?.exists ? userDoc.data().firstName : "User");
            const rawUsername = userData.username || (userDoc?.exists ? userDoc.data().username : "");
            const uname = rawUsername && rawUsername !== 'Unknown' ? ('@' + rawUsername) : 'None';
            const bdDate = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Dhaka' });

            const alertMsg = `🎉 <b>New User Joined (#${userNumber})</b>\n\n` +
                `👤 <b>Name:</b> <a href="tg://user?id=${userId}">${firstName}</a>\n` +
                `🆔 <b>User ID:</b> <code>${userId}</code>\n` +
                `🔗 <b>Username:</b> ${uname}\n` +
                `🔢 <b>User Serial:</b> <code>#${userNumber}</code>\n` +
                `📅 <b>Date:</b> ${bdDate}\n` +
                `📊 <b>Total Users:</b> <b>${userNumber}</b>`;

            bot.sendMessage(targetGroup, alertMsg, { parse_mode: 'HTML' }).catch(err => {
                console.warn("Failed to notify userLogGroup:", err.message);
            });
        }
    } catch (e) {
        console.error("notifyNewUserJoined error:", e.message);
    }
}

bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const msgId = msg.message_id;
    const lockKey = `${chatId}_${msgId}`;

    // 1. In-memory deduplication check
    if (processedStartIds.has(lockKey)) return;
    processedStartIds.add(lockKey);
    if (processedStartIds.size > 2000) processedStartIds.clear();

    // 2. Multi-instance lock in Firestore to prevent double messages between Render and local PM2
    try {
        const lockRef = db.collection('bot_start_locks').doc(lockKey);
        const lockDoc = await lockRef.get();
        if (lockDoc.exists) return; // Handled by another instance
        await lockRef.set({ timestamp: FieldValue.serverTimestamp(), chatId });
    } catch(e) {}

    const username = msg.from.username || "";
    const firstName = msg.from.first_name || "User";
    const lastName = msg.from.last_name || "";
    
    // Save user to Firebase
    const userRef = db.collection('users').doc(chatId.toString());
    const existingUserDoc = await userRef.get().catch(() => null);

    await userRef.set({
        id: chatId,
        userId: chatId,
        chatId: chatId.toString(),
        username: username,
        firstName: firstName,
        first_name: firstName,
        lastName: lastName,
        last_name: lastName
    }, { merge: true }).catch(() => {});

    await notifyNewUserJoined(chatId, { username, firstName });

    userStates[chatId] = { step: 'start', failedAttempts: 0, lang: 'bn' };
    
    const membership = await checkUserCommunities(chatId);
    const isAlreadyVerified = existingUserDoc && existingUserDoc.exists && existingUserDoc.data().status === 'verified';

    if (isAlreadyVerified && membership.allJoined) {
        const welcomeBackMsg = `💎 <b>Trust Pay — ট্রাস্ট পে</b> 💎\n\nস্বাগতম <b>${firstName}</b>!\nআপনার অ্যাকাউন্ট ভেরিফাইড রয়েছে।\n\n👇 <b>অ্যাপ ওপেন করতে নিচের বোতামে চাপ দিন:</b>`;
        return bot.sendMessage(chatId, welcomeBackMsg, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [ { text: '🚀 অ্যাপ ওপেন করুন (Open App)', web_app: { url: WEB_APP_URL } } ]
                ]
            }
        }).catch(e => console.error(e.message));
    }

    const opts = {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Channel 1', url: OFFICIAL_CHANNEL_URL }],
                [{ text: 'Channel 2', url: PAYOUT_GROUP_URL }],
                [{ text: '✅ ভেরিফাই ও অ্যাপ ওপেন', callback_data: 'verify_join' }]
            ]
        }
    };
    bot.sendMessage(chatId, t.bn.welcome, opts).catch(e => console.error(e.message));
});

bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    if (!userStates[chatId]) userStates[chatId] = { step: 'menu', failedAttempts: 0, lang: 'bn' };
    const lang = userStates[chatId].lang || 'bn';

    if (query.data === 'retry_free_payout') {
        userStates[chatId] = { step: 'awaiting_ton_address_free' };
        bot.sendMessage(chatId, '✅ Please send your TON address again:').catch(e => console.error(e.message));
        return;
    }

    if (query.data === 'verify_join') {
        try {
            const check = await checkUserCommunities(userId);
            if (check.allJoined) {
                await db.collection('users').doc(chatId.toString()).set({ 
                    status: 'verified', 
                    verified: true, 
                    language: 'bn',
                    updatedAt: FieldValue.serverTimestamp() 
                }, { merge: true });
                if (userStates[chatId]) userStates[chatId].lang = 'bn';
                
                // 1. Remove the old inline keyboard from the /start message
                bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: chatId, message_id: query.message.message_id }).catch(()=>{});

                // 2. Clear old persistent keyboard with a silent fast-deleting message
                bot.sendMessage(chatId, "...", { reply_markup: { remove_keyboard: true } }).catch(e => console.error(e.message)).then(delMsg => {
                    if (delMsg && delMsg.message_id) {
                        setTimeout(() => bot.deleteMessage(chatId, delMsg.message_id).catch(()=>{}), 100);
                    }
                }).catch(()=>{});

                // 3. Send clean welcome message with the Open App button
                const msgText = `🎉 <b>ভেরিফিকেশন সফল!</b>\n\nTrust Pay-তে স্বাগতম <b>${query.from.first_name || ''}</b>। আপনার অ্যাকাউন্ট সম্পূর্ণ প্রস্তুত।\n\n👇 <b>অ্যাপ ওপেন করতে নিচের বোতামে চাপ দিন:</b>`;
                bot.sendMessage(chatId, msgText, {
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [
                            [ { text: '🚀 অ্যাপ ওপেন করুন (Open App)', web_app: { url: WEB_APP_URL } } ]
                        ]
                    }
                }).catch(e => console.error(e.message));
                
            } else {
                let alertMsg = '❌ আপনি এখনও দুটিতেই জয়েন করেননি!';
                if (!check.inChannel && !check.inGroup) {
                    alertMsg = '❌ আপনি এখনও চ্যানেল ১ (@maruf_teach) ও পে-আউট চ্যানেল (@bd_trust_pay_payout)-এ জয়েন করেননি!';
                } else if (!check.inChannel) {
                    alertMsg = '❌ আপনি এখনও চ্যানেল ১ (@maruf_teach)-এ জয়েন করেননি! দয়া করে জয়েন করুন।';
                } else if (!check.inGroup) {
                    alertMsg = '❌ আপনি এখনও পে-আউট চ্যানেল (@bd_trust_pay_payout)-এ জয়েন করেননি! দয়া করে জয়েন করুন।';
                }
                bot.answerCallbackQuery(query.id, { text: alertMsg, show_alert: true });
            }
        } catch (error) {
            bot.answerCallbackQuery(query.id, { text: t.bn.notJoined, show_alert: true });
        }
    }
    
    if (query.data === 'lang_en' || query.data === 'lang_bn') {
        userStates[chatId].lang = query.data === 'lang_en' ? 'en' : 'bn';
        const l = userStates[chatId].lang;
        await db.collection('users').doc(chatId.toString()).update({ language: l });
        bot.sendMessage(chatId, t[l].mainMenuMsg, getMenu(l)).catch(e => console.error(e.message));
    }

            if (query.data.startsWith('crypto_')) {
        let addr = botEvmAddress;
        if (query.data === 'crypto_aptos') addr = process.env.APTOS_ADDRESS;
        
        if (query.data === 'crypto_bep20') {
            const uniqueAmount = (0.12 + (Math.floor(Math.random() * 9000) + 1000) / 100000).toFixed(5);
            userStates[chatId].expectedUsdt = parseFloat(uniqueAmount);
            userStates[chatId].bep20Timer = Date.now() + 5 * 60 * 1000;
            userStates[chatId].step = 'awaiting_bep20_auto';
            
            const msg = lang === 'bn' 
                ? "🏦 **BEP20 (USDT) অটো-ভেরিফিকেশন**\n\nনিচের অ্যাড্রেসে ঠিক **" + uniqueAmount + " USDT** সেন্ড করুন:\n\n`" + addr + "`\n\n🔲 **QR Code:** স্ক্যান করলে অ্যাড্রেস এবং অ্যামাউন্ট অটো-ফিল হয়ে যাবে!\n\n⏳ আমরা আগামী ৫ মিনিট আপনার ট্রানজেকশন অটোমেটিক চেক করছি... পেমেন্ট আসার সাথে সাথে আপনাকে জানানো হবে!"
                : "🏦 **BEP20 (USDT) Auto-Verification**\n\nSend EXACTLY **" + uniqueAmount + " USDT** to this address:\n\n`" + addr + "`\n\n🔲 **QR Code:** Scan the QR code above to auto-fill the amount and address!\n\n⏳ We are automatically scanning for your transaction for the next 5 minutes... You will be notified instantly when it arrives!";
                
            const amountWei = ethers.parseUnits(uniqueAmount.toString(), 18).toString();
            const qrText = `ethereum:0x55d398326f99059fF775485246999027B3197955@56/transfer?address=${addr}&uint256=${amountWei}`;
            const qrUrl = `https://quickchart.io/qr?size=300&text=${encodeURIComponent(qrText)}`;
            
            bot.sendPhoto(chatId, qrUrl, { caption: msg, parse_mode: 'Markdown' }).catch(err => {
                bot.sendMessage(chatId, msg, { parse_mode: 'Markdown' }).catch(e => console.error(e.message));
            });
            return;
        }

        userStates[chatId].step = 'awaiting_screenshot';
        userStates[chatId].failedAttempts = 0;
        bot.sendMessage(chatId, t[lang].cryptoAddr.replace('{address}', addr), { parse_mode: 'Markdown' }).catch(e => console.error(e.message));
    }

    if (query.data === 'give_address') {
        const username = query.from.username ? query.from.username.toLowerCase() : null;
        if (!username) {
            bot.sendMessage(chatId, "⚠️ You need to set a Telegram Username in your profile to use the Free method!").catch(e => console.error(e.message));
            return;
        }

        // Check if username is in valid_referrals
        const doc = await db.collection('valid_referrals').doc(username).get();
        if (doc.exists) {
            userStates[chatId].step = 'awaiting_ton_address_free';
            bot.sendMessage(chatId, "🎉 *Referral Verified!*\n\nPlease send your *TON Address* to receive your free payment:", { parse_mode: 'Markdown' }).catch(e => console.error(e.message));
        } else {
            // Check cooldown
            const now = Date.now();
            if (userStates[chatId].verifyCooldown && now < userStates[chatId].verifyCooldown) {
                const mins = Math.ceil((userStates[chatId].verifyCooldown - now) / 60000);
                bot.sendMessage(chatId, `⏳ *Referral not complete!*\nWe are still checking. Please try again in ${mins} minutes.`, { parse_mode: 'Markdown' }).catch(e => console.error(e.message));
                return;
            }

            // Set 30 mins cooldown
            userStates[chatId].verifyCooldown = now + 30 * 60000;
            bot.sendMessage(chatId, `⏳ *Referral not complete!*\nWe have sent a request to the admin to check your username. Please click Verify again after 30 minutes.`, { parse_mode: 'Markdown' }).catch(e => console.error(e.message));
            
            // Notify Admin Group
            const config = botConfig;
            if (config.adminGroupId) {
                bot.sendMessage(config.adminGroupId, `🔔 *New Verify Request*\nUser: @${username} (ID: ${chatId})\n\nAdmin: Check your dashboard. If valid, just reply with \`@${username}\` here.`, { parse_mode: 'Markdown' }).catch(e => console.error(e.message));
            }
        }
    }
});


bot.on('channel_post', async (msg) => {
    const text = msg.text ? msg.text.trim() : '';
    const chatId = msg.chat.id;
    if (text === '/setpayout' || text === '/setgroup') {
        await saveConfig({ payoutGroupId: chatId.toString() });
        bot.sendMessage(chatId, `<blockquote><b>✅ Payout Channel সফলভাবে কনফিগার করা হয়েছে!</b>\n\n🆔 <b>Channel ID:</b> <code>${chatId}</code>\n📌 সফল উইথড্রর লাইভ পাবলিক প্রুফ এখানে পোস্ট হবে।</blockquote>`, { parse_mode: 'HTML' }).catch(e => console.error(e.message));
    }
});

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text ? msg.text.trim() : '';

    // Maintenance block removed

    
    if (msg.chat.type === 'group' || msg.chat.type === 'supergroup') {
        const titleLower = (msg.chat.title || '').toLowerCase();

        // 1. Group Setup Commands
        if (text === '/setusers' || text === '/setusergroup' || (text === '/setgroup' && (titleLower.includes('user') || titleLower.includes('member') || titleLower.includes('join') || titleLower.includes('নতুন')))) {
            await saveConfig({ userLogGroupId: chatId.toString() });
            const resp = `<blockquote><b>✅ New User Join Notification Group সফলভাবে সেট করা হয়েছে!</b>\n\n` +
                `🆔 <b>Group ID:</b> <code>${chatId}</code>\n` +
                `📌 <b>রোল:</b> যেকোনো নতুন ইউজার বটে যুক্ত হলে স্বয়ংক্রিয়ভাবে তার ইউজার নম্বর (সিরিয়াল), নাম, টেলিগ্রাম আইডি ও ইউজারনেম এই গ্রুপে নোটিফিকেশন আসবে।</blockquote>`;
            bot.sendMessage(chatId, resp, { parse_mode: 'HTML' }).catch(e => console.error(e.message));
            return;
        }
        if (text === '/setdata' || (text === '/setgroup' && titleLower.includes('data'))) {
            await saveConfig({ dataGroupId: chatId.toString() });
            const resp = `<blockquote><b>✅ Data Group সফলভাবে সেট করা হয়েছে!</b>\n\n` +
                `🆔 <b>Group ID:</b> <code>${chatId}</code>\n` +
                `📌 <b>রোল:</b> সকল Buy, Sell, Add Money এবং কম টাকার নোটিফিকেশন এখানে আসবে।</blockquote>`;
            bot.sendMessage(chatId, resp, { parse_mode: 'HTML' }).catch(e => console.error(e.message));
            return;
        }

        if (text === '/setsupport' || (text === '/setgroup' && titleLower.includes('support'))) {
            await saveConfig({ supportGroupId: chatId.toString() });
            const resp = `<blockquote><b>✅ Support Group সফলভাবে সেট করা হয়েছে!</b>\n\n` +
                `🆔 <b>Group ID:</b> <code>${chatId}</code>\n` +
                `📌 <b>রোল:</b> ইউজারদের সাপোর্ট মেসেজ এখানে আসবে। মেসেজে সরাসরি রিপ্লাই দিলে ইউজারের কাছে উত্তর পৌঁছে যাবে।</blockquote>`;
            bot.sendMessage(chatId, resp, { parse_mode: 'HTML' }).catch(e => console.error(e.message));
            return;
        }

        if (text === '/setwithdraw' || (text === '/setgroup' && (titleLower.includes('withdraw') || titleLower.includes('উইথড্র')))) {
            await saveConfig({ withdrawGroupId: chatId.toString() });
            const resp = `<blockquote><b>✅ Withdraw Request Group সফলভাবে সেট করা হয়েছে!</b>\n\n` +
                `🆔 <b>Group ID:</b> <code>${chatId}</code>\n` +
                `📌 <b>রোল:</b> সকল উইথড্র রিকোয়েস্ট এখানে আসবে। <code>Ok</code> রিপ্লাই দিলে টাকা পেইড হবে ও Payout গ্রুপে লাইভ প্রুফ যাবে; <code>Reject [কারণ]</code> দিলে রিফান্ড হবে।</blockquote>`;
            bot.sendMessage(chatId, resp, { parse_mode: 'HTML' }).catch(e => console.error(e.message));
            return;
        }

        if (text === '/setpayout' || (text === '/setgroup' && titleLower.includes('payout'))) {
            await saveConfig({ payoutGroupId: chatId.toString() });
            const resp = `<blockquote><b>✅ Payout Group / Channel সফলভাবে সেট করা হয়েছে!</b>\n\n` +
                `🆔 <b>ID:</b> <code>${chatId}</code>\n` +
                `📌 <b>রোল:</b> সফল উইথড্রর লাইভ পাবলিক প্রুফ (পেমেন্ট প্রুফ) স্বয়ংক্রিয়ভাবে এখানে পোস্ট হবে।</blockquote>`;
            bot.sendMessage(chatId, resp, { parse_mode: 'HTML' }).catch(e => console.error(e.message));
            return;
        }

        if (text === '/setgroup') {
            await saveConfig({ adminGroupId: chatId.toString() });
            const resp = `<blockquote><b>✅ Admin Group সেট করা হয়েছে!</b>\n\n` +
                `🆔 <b>Group ID:</b> <code>${chatId}</code>\n\n` +
                `💡 <i>নির্দিষ্ট গ্রুপ কনফিগার করতে নিচের কমান্ড ব্যবহার করুন:</i>\n` +
                `• <code>/setdata</code> — Data Group এর জন্য\n` +
                `• <code>/setsupport</code> — Support Group এর জন্য\n` +
                `• <code>/setwithdraw</code> — Withdraw Request Group এর জন্য\n` +
                `• <code>/setpayout</code> — Payout Group / Channel এর জন্য</blockquote>`;
            bot.sendMessage(chatId, resp, { parse_mode: 'HTML' }).catch(e => console.error(e.message));
            return;
        }

        if (text === '/groups' || text === '/status' || text === '/groupstatus') {
            const resp = `<blockquote><b>📊 গ্রুপ নোটিফিকেশন সিস্টেম স্ট্যাটাস</b>\n\n` +
                `1️⃣ <b>Data Group:</b> <code>${botConfig.dataGroupId || botConfig.adminGroupId || 'Not set'}</code>\n` +
                `2️⃣ <b>Support Group:</b> <code>${botConfig.supportGroupId || botConfig.adminGroupId || 'Not set'}</code>\n` +
                `3️⃣ <b>Withdraw Request:</b> <code>${botConfig.withdrawGroupId || botConfig.adminGroupId || 'Not set'}</code>\n` +
                `4️⃣ <b>Payout Group / Channel:</b> <code>${botConfig.payoutGroupId || 'Not set'}</code>\n5️⃣ <b>New User Alert Group:</b> <code>${botConfig.userLogGroupId || 'Not set'}</code></blockquote>`;
            bot.sendMessage(chatId, resp, { parse_mode: 'HTML' }).catch(e => console.error(e.message));
            return;
        }

        const configuredAdminGroupIds = [
            botConfig.adminGroupId,
            botConfig.dataGroupId,
            botConfig.supportGroupId,
            botConfig.withdrawGroupId,
            botConfig.payoutGroupId
        ].filter(Boolean).map(String);

        const isConfiguredAdmin = configuredAdminGroupIds.includes(chatId.toString()) ||
                                  msg.chat.type === 'group' ||
                                  msg.chat.type === 'supergroup';

        // Handle Admin Replies
        if (isConfiguredAdmin && msg.reply_to_message && text) {
            const replyText = text.toLowerCase().trim();
            const caption = msg.reply_to_message.caption || msg.reply_to_message.text || '';

            // --- A) CUSTOMER SUPPORT REPLY ---
            if (caption.includes("Customer Support") || caption.includes("কাস্টমার সাপোর্ট") || caption.includes("Ticket ID:")) {
                const idMatch = caption.match(/User ID:\s*(?:<code>)?(\d+)(?:<\/code>)?/i) || caption.match(/ID:\s*(?:<code>)?(\d+)(?:<\/code>)?/i);
                if (idMatch && idMatch[1]) {
                    const targetUserId = idMatch[1];
                    const safeReply = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                    const userSupportMsg = `<b>🎧 𝗧𝗥𝗨𝗦𝗧 𝗣𝗔𝗬 — কাস্টমার সাপোর্ট</b>\n` +
                        `━━━━━━━━━━━━━━━━━━━━━━\n` +
                        `💬 <b>অ্যাডমিন বার্তা:</b>\n\n` +
                        `<blockquote>${safeReply}</blockquote>\n\n` +
                        `━━━━━━━━━━━━━━━━━━━━━━\n` +
                        `🤝 <i>আপনার যেকোনো প্রয়োজনে TrustPay টিম সবসময় আপনার পাশে আছে।</i>`;
                    await bot.sendMessage(targetUserId, userSupportMsg, { parse_mode: 'HTML', ...appOpenMarkup }).catch(e => console.error("Support reply to user error:", e.message));
                    await bot.sendMessage(chatId, `✅ ইউজার <code>${targetUserId}</code> এর কাছে সাপোর্ট উত্তর সফলভাবে পাঠানো হয়েছে।`, { parse_mode: 'HTML', reply_to_message_id: msg.message_id }).catch(e => console.error(e.message));
                    return;
                }
            }

            // --- B) BUY ORDER REPLY LOGIC ---
            if (caption.includes("Buy Order") || caption.includes("TrxID:")) {
                const trxMatch = caption.match(/TrxID:\s*(?:<code>|`)?([A-Za-z0-9]+)(?:<\/code>|`)?/i);
                if (trxMatch && trxMatch[1]) {
                    const targetTrxId = trxMatch[1].toUpperCase();
                    const buyRef = db.collection('miniapp_buys').doc(targetTrxId);
                    const buyDoc = await buyRef.get();
                    
                    if (buyDoc.exists) {
                        const order = buyDoc.data();
                        
                        if (['ok', 'accept', 'done', 'approve'].includes(replyText)) {
                            if (order.status === 'completed') {
                                bot.sendMessage(chatId, `⚠️ Order <code>${targetTrxId}</code> is already completed!`, { parse_mode: 'HTML' }).catch(e => console.error(e.message));
                                return;
                            }
                            
                            bot.sendMessage(chatId, `⏳ Sending <b>${order.amount} ${order.asset}</b> on-chain to <code>${order.receiveAddress}</code>...`, { parse_mode: 'HTML' }).catch(e => console.error(e.message));
                            
                            try {
                                let txResult = null;
                                if (order.asset === 'TON' || order.asset === 'GRAM') {
                                    txResult = await sendTonOnChain(order.receiveAddress, order.amount);
                                } else if (order.asset === 'USDT') {
                                    txResult = await sendJettonUsdtOnChain(order.receiveAddress, order.amount);
                                }
                                
                                await buyRef.update({
                                    status: 'completed',
                                    completedAt: FieldValue.serverTimestamp(),
                                    txResult: txResult || null
                                });
                                
                                bot.sendMessage(chatId, `✅ <b>Buy Order Completed!</b>\nSuccessfully sent <b>${order.amount} ${order.asset}</b> to <code>${order.receiveAddress}</code>\nTrxID: <code>${targetTrxId}</code>`, { parse_mode: 'HTML' }).catch(e => console.error(e.message));
                                
                                const userBuyApproved = `<blockquote><b>⚡ ক্রিপ্টো ক্রয় অর্ডার সফল হয়েছে!</b>\n\n` +
                                    `💎 <b>প্রাপ্ত ক্রিপ্টো:</b> <b>${order.amount} ${order.asset}</b>\n` +
                                    `🏷 <b>ওয়ালেট:</b> <code>${order.receiveAddress}</code>\n` +
                                    `#️⃣ <b>TrxID:</b> <code>${targetTrxId}</code>\n\n` +
                                    `<i>ক্রিপ্টো অন-চেইনে আপনার ওয়ালেটে সফলভাবে ট্রান্সফার করা হয়েছে।</i></blockquote>`;
                                bot.sendMessage(order.userId, userBuyApproved, { parse_mode: 'HTML' }).catch(e => console.error(e.message));
                            } catch(err) {
                                console.error("Group on-chain send error:", err);
                                bot.sendMessage(chatId, `❌ <b>Transfer Failed!</b>\nError: ${err.message}`, { parse_mode: 'HTML' }).catch(e => console.error(e.message));
                            }
                            return;
                        } else if (replyText.startsWith('reject') || replyText === 'wrong' || replyText === 'cancel') {
                            if (order.status === 'completed') {
                                bot.sendMessage(chatId, `⚠️ Cannot reject an already completed order!`).catch(e => console.error(e.message));
                                return;
                            }
                            if (order.status === 'rejected') {
                                bot.sendMessage(chatId, `⚠️ Order <code>${targetTrxId}</code> is already rejected!`, { parse_mode: 'HTML' }).catch(e => console.error(e.message));
                                return;
                            }
                            
                            const reason = replyText.startsWith('reject ') ? text.substring(7).trim() : 'Rejected by admin';
                            const refundBdt = parseFloat(order.totalBdt) || 0;
                            
                            await buyRef.update({
                                status: 'rejected',
                                rejectReason: reason,
                                rejectedAt: FieldValue.serverTimestamp(),
                                refundedBdt: refundBdt
                            });
                            
                            if (refundBdt > 0 && order.userId) {
                                await db.collection('users').doc(order.userId.toString()).set({
                                    balance: FieldValue.increment(refundBdt)
                                }, { merge: true });
                            }
                            
                            bot.sendMessage(chatId, `❌ <b>Buy Order Rejected!</b>\nRefunded <b>৳${refundBdt} BDT</b> to user <code>${order.userId}</code>'s in-app balance.\nTrxID: <code>${targetTrxId}</code>`, { parse_mode: 'HTML' }).catch(e => console.error(e.message));
                            
                            const userBuyRejected = `<blockquote><b>❌ ক্রয় অর্ডার বাতিল ও রিফান্ড!</b>\n\n` +
                                `💎 <b>অর্ডার:</b> ${order.amount} ${order.asset}\n` +
                                `#️⃣ <b>TrxID:</b> <code>${targetTrxId}</code>\n` +
                                `💰 <b>রিফান্ড পরিমাণ:</b> <b>৳${refundBdt} BDT</b>\n` +
                                `📝 <b>কারণ:</b> <i>${reason}</i>\n\n` +
                                `<i>উক্ত টাকা আপনার ইন-অ্যাপ ব্যালেন্সে রিফান্ড করা হয়েছে।</i></blockquote>`;
                            bot.sendMessage(order.userId, userBuyRejected, { parse_mode: 'HTML' }).catch(e => console.error(e.message));
                            return;
                        }
                    }
                }
            }

            // --- C) FIAT WITHDRAWAL LOGIC ---
            if (caption.includes("New Fiat Withdrawal") || 
                caption.includes("নতুন উইথড্র রিকোয়েস্ট") || 
                caption.includes("Withdraw Request") || 
                caption.includes("ক্যাশআউট রিকোয়েস্ট") || 
                caption.includes("ক্যাশআউট") ||
                caption.includes("উইথড্র")) {
                let targetUserId = null;
                const idMatch = caption.match(/\((\d{6,})\)/) ||
                                caption.match(/(?:User\s*ID|ID|ইউজার|User|গ্রাহক):\s*(?:<b>|<code>)?(\d+)(?:<\/b>|<\/code>)?/i) ||
                                caption.match(/tg:\/\/user\?id=(\d+)/i) ||
                                caption.match(/<code>(\d{6,})<\/code>/i);
                
                if (idMatch && (idMatch[1] || idMatch[2])) {
                    targetUserId = (idMatch[1] || idMatch[2]).toString();
                }

                // Fallback: If targetUserId not found directly, look up by serial number
                if (!targetUserId) {
                    const serialMatch = caption.match(/(?:সিরিয়াল নং|সিরিয়াল নং|Serial|সিরিয়াল|সিরিয়াল|#):\s*#?(\d+)/i);
                    if (serialMatch && serialMatch[1]) {
                        try {
                            const wDocs = await db.collection('fiat_withdrawals').where('serial', '==', parseInt(serialMatch[1])).get();
                            if (!wDocs.empty) {
                                targetUserId = wDocs.docs[0].data().userId.toString();
                            }
                        } catch(e) {}
                    }
                }

                if (!targetUserId) {
                    await bot.sendMessage(chatId, `⚠️ ইউজার আইডি শনাক্ত করা যায়নি! দয়া করে ইউজার আইডি উল্লেখ করে রিপ্লাই দিন।`, { reply_to_message_id: msg.message_id }).catch(()=>{});
                    return;
                }

                // Auto-sync this chat as withdrawGroupId if not set
                if (!botConfig.withdrawGroupId || botConfig.withdrawGroupId !== chatId.toString()) {
                    botConfig.withdrawGroupId = chatId.toString();
                    saveConfig({ withdrawGroupId: chatId.toString() }).catch(()=>{});
                }

                // 1. APPROVE / PAID
                if (['done', 'ok', 'paid', 'accept', 'approve'].includes(replyText) || replyText.startsWith('ok ') || replyText.startsWith('paid ')) {
                    const uRef = db.collection('users').doc(targetUserId);
                    const uDoc = await uRef.get();
                    let pend = null;
                    if (uDoc.exists && uDoc.data().fiatWithdrawPending) {
                        pend = uDoc.data().fiatWithdrawPending;
                        if (pend.id) {
                            await db.collection('fiat_withdrawals').doc(pend.id).update({
                                status: 'completed',
                                completedAt: Date.now()
                            }).catch(()=>{});
                        }
                    }

                    if (!pend?.id) {
                        try {
                            const pendSnaps = await db.collection('fiat_withdrawals')
                                .where('userId', 'in', [parseInt(targetUserId), targetUserId.toString()].filter(Boolean))
                                .where('status', '==', 'pending').limit(1).get();
                            if (!pendSnaps.empty) {
                                if (!pend) pend = pendSnaps.docs[0].data();
                                await pendSnaps.docs[0].ref.update({ status: 'completed', completedAt: Date.now() }).catch(()=>{});
                            }
                        } catch(e) {}
                    }

                    await uRef.update({
                        'fiatWithdrawPending.status': 'completed',
                        'fiatWithdrawPending.completedAt': Date.now()
                    }).catch(()=>{});

                    const amtVal = pend?.amount || 0;
                    const feeVal = pend?.fee !== undefined ? pend.fee : 0;
                    const recVal = pend?.receiveAmount || (amtVal > feeVal ? amtVal - feeVal : amtVal);
                    const methodVal = pend?.method || 'bKash';
                    const numVal = pend?.number || '';

                    // DM to User
                    const userSuccessMsg = `<blockquote><b>✅ ক্যাশআউট সম্পন্ন হয়েছে (Withdrawal Successful)!</b>\n\n` +
                        `💰 <b>উত্তোলনের পরিমাণ:</b> ৳${amtVal} BDT\n` +
                        `📉 <b>সেন্ড মানি ফি:</b> ৳${typeof feeVal === 'number' ? feeVal.toFixed(2) : feeVal} BDT\n` +
                        `💵 <b>প্রদান করা হয়েছে:</b> ৳${typeof recVal === 'number' ? recVal.toFixed(2) : recVal} BDT\n` +
                        `🏦 <b>মাধ্যম:</b> ${methodVal} (<code>${numVal}</code>)\n\n` +
                        `আপনার অ্যাকাউন্টে টাকা সফলভাবে পাঠিয়ে দেওয়া হয়েছে। ধন্যবাদ আমাদের সাথে থাকার জন্য!</blockquote>`;
                    await bot.sendMessage(targetUserId, userSuccessMsg, { parse_mode: 'HTML' }).catch(e => console.error(e.message));

                    // Confirm in Withdraw Request Group
                    await bot.sendMessage(chatId, `✅ <code>${targetUserId}</code> এর উইথড্র সফলভাবে <b>PAID</b> কনফার্ম করা হয়েছে।`, { parse_mode: 'HTML', reply_to_message_id: msg.message_id }).catch(e => console.error(e.message));

                    // Post Live Payout Proof to Public Payout Group / Channel (Image 2 format)
                    await notifyPayoutGroup({
                        type: 'fiat',
                        userId: targetUserId,
                        name: pend?.name || uDoc.data()?.first_name || 'User',
                        amount: amtVal,
                        receiveAmount: recVal,
                        method: methodVal,
                        number: numVal
                    });
                    return;
                }

                // 2. REJECT & REFUND
                else if (replyText.startsWith('reject') || replyText.startsWith('cancel') || replyText === 'no') {
                    let reason = text.trim();
                    if (reason.toLowerCase().startsWith('reject')) {
                        reason = reason.substring(6).trim();
                    } else if (reason.toLowerCase().startsWith('cancel')) {
                        reason = reason.substring(6).trim();
                    }
                    if (!reason) reason = 'অ্যাডমিন কর্তৃক বাতিল করা হয়েছে (Rejected by admin)';

                    const userRef = db.collection('users').doc(targetUserId);
                    const userDoc = await userRef.get();
                    let pend = userDoc.exists ? userDoc.data().fiatWithdrawPending : null;
                    
                    if (!pend) {
                        try {
                            const pendSnaps = await db.collection('fiat_withdrawals')
                                .where('userId', 'in', [parseInt(targetUserId), targetUserId.toString()].filter(Boolean))
                                .where('status', '==', 'pending').get();
                            if (!pendSnaps.empty) pend = pendSnaps.docs[0].data();
                        } catch(e) {}
                    }

                    const amountToRefund = pend?.amount || 0;

                    if (pend?.id) {
                        await db.collection('fiat_withdrawals').doc(pend.id).update({
                            status: 'rejected',
                            rejectReason: reason,
                            rejectedAt: Date.now()
                        }).catch(()=>{});
                    }
                    try {
                        const pendSnaps = await db.collection('fiat_withdrawals')
                            .where('userId', 'in', [parseInt(targetUserId), targetUserId.toString()].filter(Boolean))
                            .where('status', '==', 'pending').get();
                        if (!pend?.id && !pendSnaps.empty) {
                            await pendSnaps.docs[0].ref.update({ status: 'rejected', rejectReason: reason, rejectedAt: Date.now() }).catch(()=>{});
                        }
                    } catch(e) {}

                    if (amountToRefund > 0) {
                        await userRef.update({
                            balance: FieldValue.increment(amountToRefund),
                            'fiatWithdrawPending.status': 'rejected',
                            'fiatWithdrawPending.rejectReason': reason,
                            'fiatWithdrawPending.rejectedAt': Date.now()
                        });
                    } else {
                        await userRef.update({
                            'fiatWithdrawPending.status': 'rejected',
                            'fiatWithdrawPending.rejectReason': reason,
                            'fiatWithdrawPending.rejectedAt': Date.now()
                        }).catch(()=>{});
                    }

                    await bot.sendMessage(chatId, `❌ উইথড্র বাতিল করা হয়েছে! ইউজার <code>${targetUserId}</code> এর একাউন্টে <b>৳${amountToRefund} BDT</b> রিফান্ড করা হয়েছে।\n📝 <b>কারণ:</b> <i>${reason}</i>`, { parse_mode: 'HTML', reply_to_message_id: msg.message_id }).catch(e => console.error(e.message));

                    // DM to User
                    const userRejectMsg = `<blockquote><b>❌ উইথড্র বাতিল ও রিফান্ড (Withdrawal Rejected)!</b>\n\n` +
                        `💰 <b>রিফান্ড পরিমাণ:</b> ৳${amountToRefund} BDT\n` +
                        `📝 <b>কারণ:</b> <i>${reason}</i>\n\n` +
                        `টাকাটি আপনার অ্যাপ ব্যালেন্সে পুনরায় যোগ করে দেওয়া হয়েছে। তথ্য যাচাই করে আবার চেষ্টা করুন।</blockquote>`;
                    await bot.sendMessage(targetUserId, userRejectMsg, { parse_mode: 'HTML' }).catch(e => console.error(e.message));
                    return;
                }

                // 3. WAIT TIMER
                else if (replyText.startsWith('wt') || replyText.startsWith('wait') || /^\d{1,2}:\d{2}(?::\d{2})?$/.test(replyText)) {
                    const timeMatch = text.match(/(\d{1,2}:\d{2}(?::\d{2})?)/);
                    if (timeMatch && timeMatch[1]) {
                        const parts = timeMatch[1].split(':');
                        let totalSeconds = 0;
                        if (parts.length === 2) {
                            totalSeconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
                        } else if (parts.length === 3) {
                            totalSeconds = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
                        }

                        if (totalSeconds > 0) {
                            const endTime = Date.now() + (totalSeconds * 1000);
                            await db.collection('users').doc(targetUserId).update({
                                'fiatWithdrawPending.status': 'waiting',
                                'fiatWithdrawPending.endTime': endTime
                            });
                            await bot.sendMessage(chatId, `⏳ ইউজার <code>${targetUserId}</code> এর জন্য প্রসেসিং টাইমার (${timeMatch[1]}) সেট করা হয়েছে।`, { parse_mode: 'HTML', reply_to_message_id: msg.message_id }).catch(e => console.error(e.message));
                            return;
                        }
                    }

                    await bot.sendMessage(chatId, `⏱ Reply to THIS message with the time format.\n\nMinutes: <code>10:00</code>\nHours: <code>1:30:50</code>\n\nUser ID: ${targetUserId}`, { parse_mode: 'HTML' }).catch(e => console.error(e.message));
                    return;
                }

                // 4. Fallback for unrecognized reply text
                else {
                    await bot.sendMessage(chatId, `⚙️ <b>উইথড্র কমান্ড নির্দেশনা:</b>\n\n• <code>Ok</code> — পেমেন্ট কনফার্ম করতে (Payout গ্রুপে প্রুফ যাবে)\n• <code>Reject [কারণ]</code> — বাতিল করে ব্যালেন্স রিফান্ড করতে\n• <code>wt 10:00</code> — প্রসেসিং টাইমার সেট করতে`, { parse_mode: 'HTML', reply_to_message_id: msg.message_id }).catch(e => console.error(e.message));
                    return;
                }
            }

                
                // --- FIAT WAIT TIMER LOGIC ---
                if (caption.includes("Reply to THIS message with the time format")) {
                    const idMatch = caption.match(/User ID: (\d+)/);
                    if (idMatch && idMatch[1]) {
                        const targetUserId = idMatch[1];
                        let totalSeconds = 0;
                        const parts = text.split(':');
                        if (parts.length === 2) {
                            totalSeconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
                        } else if (parts.length === 3) {
                            totalSeconds = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
                        }
                        
                        if (totalSeconds > 0) {
                            const endTime = Date.now() + (totalSeconds * 1000);
                            await db.collection('users').doc(targetUserId).update({
                                'fiatWithdrawPending.status': 'waiting',
                                'fiatWithdrawPending.endTime': endTime
                            });
                            bot.sendMessage(chatId, `⏳ Timer set for ${targetUserId}. They will see the countdown in the app.`).catch(e => console.error(e.message));
                        } else {
                            bot.sendMessage(chatId, `⚠️ Invalid time format. Please use MM:SS or HH:MM:SS`).catch(e => console.error(e.message));
                        }
                    }
                    return;
                }

                if (caption.includes("New MiniApp Task Submission")) {
                    const addrMatch = caption.match(/Address: `([a-zA-Z0-9_-]+)`/);
                    if (addrMatch && addrMatch[1]) {
                        const targetAddress = addrMatch[1];
                        if (replyText === 'ok') {
                            bot.sendMessage(chatId, `⏳ Paying ${targetAddress} via TonAPI...`).catch(e => console.error(e.message));
                            // Send payment directly
                            try {
                                const wallet = WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey });
                                const seqno = await wallet.getSeqno(tonapiClient);
                                const transfer = wallet.createTransfer({
                                    seqno,
                                    secretKey: keyPair.secretKey,
                                    messages: [internal({
                                        to: targetAddress,
                                        value: '0.05',
                                        body: 'Gift from VIC Mining Event'
                                    })]
                                });
                                
                                const extMsg = external({ to: wallet.address, init: seqno === 0 ? wallet.init : null, body: transfer });
                                const extCell = beginCell().store(storeMessage(extMsg)).endCell();
                                const boc = extCell.toBoc().toString('base64');

                                await axios.post('https://tonapi.io/v2/blockchain/message', { boc });
                                bot.sendMessage(targetUserId, `✅ **Payment Sent!**

0.05 TON has been sent to your wallet for completing the Free TON event!`).catch(e => console.error(e.message));
                                bot.sendMessage(chatId, `✅ Successfully paid ${targetUserId} for MiniApp event.`).catch(e => console.error(e.message));
                                
                                // Clean up DB
                                const tasks = await db.collection('miniapp_tasks').where('userId', '==', targetUserId).get();
                                tasks.forEach(t => t.ref.update({ status: 'approved' }));
                                
                            } catch (e) {
                                bot.sendMessage(chatId, `❌ Payment failed: ${e.message}`).catch(e => console.error(e.message));
                            }
                        } else if (replyText === 'wrong') {
                            const rejectText = `❌ **Verification Failed.** You are ineligible for the Free TON event.`;
                            bot.sendMessage(targetUserId, rejectText, { parse_mode: 'Markdown' }).catch(e => console.error(e.message));
                            bot.sendMessage(chatId, `❌ Rejected user ${targetUserId} for MiniApp event.`).catch(e => console.error(e.message));
                            
                            const tasks = await db.collection('miniapp_tasks').where('userId', '==', targetUserId).get();
                            tasks.forEach(t => t.ref.update({ status: 'rejected' }));
                        }
                        return; // Stop processing
                    }
                }
                // ---------------------------------

                const match = caption.match(/ID:\s*(\d+)/);
            
            if (match && match[1]) {
                const targetUserId = match[1];
                if (!userStates[targetUserId]) userStates[targetUserId] = { failedAttempts: 0, lang: 'en' };
                const lang = userStates[targetUserId].lang || 'en';
                
                if (replyText === 'ok') {
                    userStates[targetUserId].step = 'awaiting_ton_address_free';
                    const successText = lang === 'bn' ? `✅ **অ্যাডমিন আপনার স্ক্রিনশট অ্যাপ্রুভ করেছেন!**\n\nএখন আপনার **TON Address** দিন পেমেন্ট রিসিভ করার জন্য:` : `✅ **Admin Approved!**\n\nNow send your **TON Address** to receive your payment:`;
                    bot.sendMessage(targetUserId, successText, { parse_mode: 'Markdown' }).catch(e => console.error(e.message));
                    bot.sendMessage(chatId, `✅ Approved user ${targetUserId}`).catch(e => console.error(e.message));
                } else if (replyText === 'wrong') {
                    delete userStates[targetUserId].step;
                    const rejectText = lang === 'bn' ? `❌ **ভেরিফিকেশন ব্যর্থ!** আপনার স্ক্রিনশটটি বাতিল করা হয়েছে।` : `❌ **Verification Failed.** Your screenshot was rejected by the admin.`;
                    bot.sendMessage(targetUserId, rejectText, { parse_mode: 'Markdown' }).catch(e => console.error(e.message));
                    bot.sendMessage(chatId, `❌ Rejected user ${targetUserId}`).catch(e => console.error(e.message));
                }
                return; // Stop processing since it was handled
            }
        }

        if (config.adminGroupId === chatId.toString() && text && !text.startsWith('/')) {
            const replyText = text.toLowerCase().trim();
            if (replyText === 'ok' || replyText === 'wrong') return; // Ignore bare ok/wrong

            // Process usernames sent by admin
            const usernames = text.split(/[\s,\n]+/).map(u => u.replace('@', '').trim().toLowerCase()).filter(u => u.length > 0);
            
            for (const uname of usernames) {
                // Save to valid_referrals in Firestore
                if (uname.includes('/')) return;
                await db.collection('valid_referrals').doc(uname).set({
                    addedAt: new Date().toISOString()
                }, {merge: true});
            }
            bot.sendMessage(chatId, '✅ Usernames added: ' + usernames.join(', ')).catch(e => console.error(e.message));
        }
        return; // Stop processing further for group messages
    }

    
    if (text.startsWith('/')) return;
    
    // Default reply for any other message: send and remove keyboard
    bot.sendMessage(chatId, "👇 **নিচের বোতামে ক্লিক করে অ্যাপটি ওপেন করুন:**", getMenu('bn')).catch(e => console.error(e.message));
});

// Add this before app.listen
const { ethers } = require('ethers');


// ==================== HOURLY MARKET RATES TRACKER ====================
let cachedMarketRates = {
    realUsdtBdt: 120,
    realGramUsdt: 1.46,
    realGramBdt: 175.2,
    buyRates: {
        USDT: 130, // Fixed 130 BDT
        GRAM: 220  // Fixed 220 BDT
    },
    sellRates: {
        USDT: 115, // 120 - 5
        GRAM: 165  // 175.2 - 10 = 165 (max 170 TK cap)
    },
    lastUpdated: 0
};

async function updateMarketRates() {
    try {
        let usdtBdt = 120;
        let tonUsdt = 1.46;

        // 1. Fetch live USD/BDT from Open Exchange API
        try {
            const usdRes = await axios.get('https://open.er-api.com/v6/latest/USD', { timeout: 4000 });
            if (usdRes.data && usdRes.data.rates && usdRes.data.rates.BDT) {
                usdtBdt = parseFloat(usdRes.data.rates.BDT);
            }
        } catch(e) {
            console.warn("Open Exchange rate fetch fallback:", e.message);
        }

        // 2. Fetch live TON/USDT from Binance or CoinGecko
        try {
            const binanceRes = await axios.get('https://api.binance.com/api/v3/ticker/price?symbol=TONUSDT', { timeout: 4000 });
            if (binanceRes.data && binanceRes.data.price) {
                tonUsdt = parseFloat(binanceRes.data.price);
            }
        } catch(e) {
            try {
                const cgRes = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=the-open-network,tether&vs_currencies=usd,bdt', { timeout: 4000 });
                if (cgRes.data && cgRes.data['the-open-network']?.usd) {
                    tonUsdt = parseFloat(cgRes.data['the-open-network'].usd);
                }
                if (cgRes.data && cgRes.data['tether']?.bdt) {
                    usdtBdt = parseFloat(cgRes.data['tether'].bdt);
                }
            } catch(e2) {
                console.warn("CoinGecko rate fallback:", e2.message);
            }
        }

        const realUsdtBdt = Number(usdtBdt.toFixed(2));
        const realGramUsdt = Number(tonUsdt.toFixed(4));
        const realGramBdt = Number((realGramUsdt * realUsdtBdt).toFixed(2));

        // Buyer Price Rule:
        // USDT: Fixed 130 BDT
        // GRAM: Fixed 220 BDT
        const buyUsdt = 130;
        const buyGram = 220;

        // Seller Price Rule:
        // USDT: realUsdtBdt - 5 TK
        const sellUsdt = Math.max(1, Math.round(realUsdtBdt - 5));

        // GRAM Seller Price Rule:
        // Platform keeps 10 TK profit: (realGramBdt - 10 TK).
        // Cap rule: Maximum 170 TK (even if GRAM price is 200+ TK, platform pays max 170 TK).
        // If price is low, it dynamically follows (realGramBdt - 10 TK).
        const calculatedSellGram = Math.round(realGramBdt - 10);
        const sellGram = Math.max(1, Math.min(170, calculatedSellGram));

        cachedMarketRates = {
            realUsdtBdt,
            realGramUsdt,
            realGramBdt,
            buyRates: {
                USDT: buyUsdt,
                GRAM: buyGram
            },
            sellRates: {
                USDT: sellUsdt,
                GRAM: sellGram
            },
            lastUpdated: Date.now()
        };
        console.log(`[RATES UPDATED] Real USDT: ৳${realUsdtBdt}, Real TON/GRAM: $${realGramUsdt} (৳${realGramBdt}) => Buy: USDT ৳${buyUsdt}, GRAM ৳${buyGram} | Sell: USDT ৳${sellUsdt}, GRAM ৳${sellGram}`);
    } catch(err) {
        console.error("Rates update error:", err.message);
    }
}

let isUpdatingRates = false;
async function safeUpdateMarketRates() {
    if (isUpdatingRates) return;
    isUpdatingRates = true;
    try {
        await updateMarketRates();
    } finally {
        isUpdatingRates = false;
    }
}

// Initial fetch on server startup and hourly interval (every 60 minutes)
safeUpdateMarketRates();
setInterval(safeUpdateMarketRates, 60 * 60 * 1000);

// ==================== MINI APP APIs ====================
app.get('/api/miniapp/rates', async (req, res) => {
    // If cache older than 1 hour, refresh in background without blocking
    if (Date.now() - cachedMarketRates.lastUpdated > 60 * 60 * 1000) {
        safeUpdateMarketRates().catch(e => console.error("Rate update error:", e.message));
    }
    res.json({
        success: true,
        ...cachedMarketRates
    });
});

// Community verification endpoints for MiniApp
app.get('/api/miniapp/check-membership', async (req, res) => {
    try {
        const rawUserId = req.query.userId;
        const userId = parseInt(rawUserId);
        if (!userId || userId === 123456789 || isNaN(userId)) {
            return res.json({ 
                allJoined: false, 
                inChannel: false, 
                inGroup: false, 
                channelLink: OFFICIAL_CHANNEL_URL, 
                groupLink: PAYOUT_GROUP_URL 
            });
        }
        const check = await checkUserCommunities(userId);
        res.json({
            ...check,
            channelLink: OFFICIAL_CHANNEL_URL,
            groupLink: PAYOUT_GROUP_URL
        });
    } catch (e) {
        console.warn('check-membership error:', e.message);
        res.json({ 
            allJoined: false, 
            inChannel: false, 
            inGroup: false, 
            channelLink: OFFICIAL_CHANNEL_URL, 
            groupLink: PAYOUT_GROUP_URL 
        });
    }
});

app.post('/api/miniapp/verify-membership', async (req, res) => {
    try {
        const rawUserId = req.body.userId;
        const userId = parseInt(rawUserId);
        if (!userId || userId === 123456789 || isNaN(userId)) {
            return res.json({ success: true, allJoined: true, inChannel: true, inGroup: true });
        }
        const check = await checkUserCommunities(userId);
        if (check.allJoined) {
            await db.collection('users').doc(userId.toString()).set({
                status: 'verified',
                verified: true,
                communityVerifiedAt: FieldValue.serverTimestamp()
            }, { merge: true });
            return res.json({ success: true, allJoined: true, inChannel: true, inGroup: true });
        } else {
            return res.json({ success: false, ...check });
        }
    } catch (e) {
        console.warn('verify-membership error:', e.message);
        res.json({ success: true, allJoined: true, inChannel: true, inGroup: true });
    }
});

app.get('/api/miniapp/user/:id', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const userRef = db.collection('users').doc(userId.toString());
        const userDoc = await userRef.get();
        
        let data = {};
        if (userDoc.exists) {
            data = userDoc.data();
        }

        let mbsId = data.mbsId;
        if (!mbsId) {
            let unique = false;
            while (!unique) {
                const randomDigits = Math.floor(10000 + Math.random() * 90000);
                const tempId = 'MBS' + randomDigits;
                const existing = await db.collection('users').where('mbsId', '==', tempId).get();
                if (existing.empty) {
                    mbsId = tempId;
                    unique = true;
                }
            }
            await userRef.set({ mbsId }, { merge: true });
        }

        let pendingWithdraw = data.fiatWithdrawPending || null;
        if (pendingWithdraw) {
            const isFinished = pendingWithdraw.status === 'completed' || pendingWithdraw.status === 'rejected';
            const finishTime = pendingWithdraw.completedAt || pendingWithdraw.rejectedAt || 0;
            // If completed or rejected more than 2 hours ago, clear it so it doesn't linger
            if (isFinished && finishTime && (Date.now() - finishTime > 2 * 60 * 60 * 1000)) {
                pendingWithdraw = null;
                userRef.update({ fiatWithdrawPending: null }).catch(()=>{});
            }
        }

        res.json({ 
            balance: data.balance || 0,
            fiatWallet: data.fiatWallet || null,
            fiatWithdrawPending: pendingWithdraw,
            mbsId: mbsId,
            hasDepositWithoutTrade: Boolean(data.hasDepositWithoutTrade),
            hasSellBalance: Boolean(data.hasSellBalance),
            spentSinceLastDeposit: data.spentSinceLastDeposit || 0
        });
    } catch(e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/miniapp/task', async (req, res) => {
    try {
        const { userId, name, username, address } = req.body;
        
        const docRef = await db.collection('miniapp_tasks').add({
            userId,
            name,
            username,
            address,
            status: 'pending',
            timestamp: FieldValue.serverTimestamp()
        });

        // Send to Admin Group
        const msg = `🎁 <b>New MiniApp Task Submission</b>\n\n👤 User: <a href="tg://user?id=${userId}">${name}</a>\n🆔 ID: ${userId}\n💰 Type: Free TON (VIC)\n📍 Address: \`${address}\`\n\nReply with 'Ok' to approve or 'Wrong' to reject.`;
        
        const sentMsg = await bot.sendMessage(adminGroupId, msg, { parse_mode: 'HTML' }).catch(e => console.error(e.message));
        
        // Save msgId for reply tracking
        await db.collection('miniapp_tasks').doc(docRef.id).update({
            messageId: sentMsg.message_id
        });

        res.json({ success: true });
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/miniapp/build-tx', async (req, res) => {
    try {
        let { asset, amount, userAddress } = req.body;
        amount = parseFloat(amount) || 0;
        asset = (asset || 'GRAM').toUpperCase();
        const adminWallet = process.env.BOT_TON_ADDRESS || "UQC7hYHfrVJ_uT_esMr7vCv1bVh5ytQxYUUjRDiTUiG9s5Fb";

        if (asset === 'USDT') {
            const amountInMicro = Math.floor(amount * 1e6);
            const usdtMaster = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';
            let targetContract = adminWallet;
            if (userAddress) {
                try {
                    const jwRes = await axios.get(`https://tonapi.io/v2/blockchain/accounts/${usdtMaster}/methods/get_wallet_address?args=${userAddress}`);
                    if (jwRes.data?.decoded?.jetton_wallet_address) {
                        targetContract = Address.parse(jwRes.data.decoded.jetton_wallet_address).toString();
                    }
                } catch(e) {
                    console.error("Error finding user Jetton wallet:", e.message);
                }
            }

            let payload = null;
            try {
                const body = beginCell()
                    .storeUint(0xf8a7ea5, 32)
                    .storeUint(0, 64)
                    .storeCoins(amountInMicro)
                    .storeAddress(Address.parse(adminWallet))
                    .storeAddress(Address.parse(userAddress || adminWallet))
                    .storeBit(0)
                    .storeCoins(1)
                    .storeBit(0)
                    .endCell();
                payload = body.toBoc().toString('base64');
            } catch(e) {}

            res.json({
                success: true,
                tx: {
                    validUntil: Math.floor(Date.now() / 1000) + 600,
                    messages: [{
                        address: targetContract,
                        amount: '50000000', // 0.05 TON
                        payload: payload || undefined
                    }]
                }
            });
        } else {
            const amountInNano = Math.floor(amount * 1e9);
            res.json({
                success: true,
                tx: {
                    validUntil: Math.floor(Date.now() / 1000) + 600,
                    messages: [{
                        address: adminWallet,
                        amount: amountInNano.toString()
                    }]
                }
            });
        }
    } catch(e) {
        console.error("build-tx error:", e);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/miniapp/sell', async (req, res) => {
    try {
        const { userId, asset, amount, estimatedTk, wallet, status, orderId } = req.body;
        const numEstimatedTk = parseFloat(estimatedTk) || 0;
        const numAmount = parseFloat(amount) || 0;
        
        if (numEstimatedTk < 1 || numAmount <= 0) {
            return res.status(400).json({ error: 'নূন্যতম বিক্রয় ১ টাকা' });
        }

        if (status === 'pending') {
            const docRef = await db.collection('miniapp_sells').add({
                userId, 
                asset: asset || 'TON', 
                amount: numAmount, 
                estimatedTk: numEstimatedTk, 
                wallet: wallet || 'Manual',
                status: 'pending',
                timestamp: FieldValue.serverTimestamp()
            });
            return res.json({ success: true, orderId: docRef.id });
        }

        let savedOrderId = orderId;
        if (orderId) {
            await db.collection('miniapp_sells').doc(orderId).update({ 
                status: 'completed',
                completedAt: FieldValue.serverTimestamp()
            });
        } else {
            const docRef = await db.collection('miniapp_sells').add({
                userId, 
                asset: asset || 'TON', 
                amount: numAmount, 
                estimatedTk: numEstimatedTk, 
                wallet: wallet || 'Manual', 
                status: 'completed',
                timestamp: FieldValue.serverTimestamp()
            });
            savedOrderId = docRef.id;
        }

        // Increment user balance
        const userRef = db.collection('users').doc(userId.toString());
        const userDoc = await userRef.get();
        if (userDoc.exists) {
            await userRef.update({ 
                balance: FieldValue.increment(numEstimatedTk),
                hasSellBalance: true
            });
        } else {
            await userRef.set({ 
                balance: numEstimatedTk, 
                joinedAt: FieldValue.serverTimestamp(),
                hasSellBalance: true
            }, { merge: true });
        }

        const updatedDoc = await userRef.get();
        const newBalance = updatedDoc.data()?.balance || numEstimatedTk;

        // Notify Data Group
        const config = botConfig || {};
        const dataGroup = config.dataGroupId || config.adminGroupId;
        if (dataGroup && bot) {
            const msg = `<blockquote><b>⚡ নতুন ক্রিপ্টো বিক্রয় (Crypto Sold)!</b>\n\n` +
                `👤 <b>User:</b> <code>${userId}</code>\n` +
                `💎 <b>বিক্রয়:</b> <b>${numAmount} ${asset || 'TON'}</b>\n` +
                `💵 <b>ব্যালেন্সে যুক্ত:</b> <b>৳${numEstimatedTk} BDT</b>\n` +
                `💰 <b>নতুন ব্যালেন্স:</b> <b>৳${newBalance} BDT</b>\n` +
                `🏦 <b>Wallet/Trx:</b> <code>${wallet || 'Direct'}</code>\n` +
                `🆔 <b>Order ID:</b> <code>${savedOrderId}</code></blockquote>`;
            bot.sendMessage(dataGroup, msg, { parse_mode: 'HTML' }).catch(e=>console.error(e.message));
        }

        // Send confirmation to User in Telegram with Quote block (Matches Image 3)
        if (bot && userId) {
            const userSellMsg = `<b>🔄 𝗧𝗥𝗨𝗦𝗧 𝗣𝗔𝗬 — ক্রিপ্টো বিক্রি সফল!</b>\n` +
                `━━━━━━━━━━━━━━━━━━━━━━\n` +
                `✅ <b>স্ট্যাটাস:</b> <code>সফলভাবে ব্যালেন্সে যুক্ত</code> 💸\n\n` +
                `<blockquote>💎 <b>বিক্রিত ক্রিপ্টো:</b> ${numAmount} ${asset}\n` +
                `💵 <b>প্রাপ্ত টাকা:</b> ৳${numEstimatedTk} BDT\n` +
                `💰 <b>নতুন ব্যালেন্স:</b> <b>৳${newBalance} BDT</b></blockquote>\n\n` +
                `━━━━━━━━━━━━━━━━━━━━━━\n` +
                `🚀 <i>টাকাটি অ্যাপ ব্যালেন্সে জমা হয়েছে। প্রোফাইল থেকে যেকোনো সময় উইথড্র করতে পারবেন।</i>`;
            bot.sendMessage(userId, userSellMsg, { parse_mode: 'HTML', ...appOpenMarkup }).catch(e=>console.error(e.message));
        }

        res.json({ success: true, orderId: savedOrderId, newBalance });
    } catch(e) {
        console.error("Sell order error:", e);
        res.status(500).json({ error: e.message });
    }
});
// =======================================================

app.get('/api/stats', async (req, res) => {
    const now = Date.now();
    if (statsCache.data && (now - statsCache.timestamp < 25000)) {
        return res.json(statsCache.data);
    }

    try {
        console.log("/api/stats called");
        
        console.log("Fetching users...");
        let users = [];
        try {
            const [usersSnapshot, buysSnap, sellsSnap, withSnap] = await Promise.all([
                db.collection('users').get(),
                db.collection('miniapp_buys').limit(200).get().catch(() => ({ forEach: () => {} })),
                db.collection('miniapp_sells').limit(200).get().catch(() => ({ forEach: () => {} })),
                db.collection('fiat_withdrawals').limit(200).get().catch(() => ({ forEach: () => {} }))
            ]);

            const transactingUserIds = new Set();
            buysSnap.forEach(d => {
                const od = d.data();
                if (od.userId) transactingUserIds.add(od.userId.toString());
            });
            sellsSnap.forEach(d => {
                const od = d.data();
                if (od.userId) transactingUserIds.add(od.userId.toString());
            });
            withSnap.forEach(d => {
                const od = d.data();
                if (od.userId) transactingUserIds.add(od.userId.toString());
            });

            usersSnapshot.forEach(doc => {
                const u = doc.data();
                const uId = (u.chatId || doc.id).toString();
                u.chatId = uId;
                u.id = doc.id;
                u.firstName = u.firstName || u.first_name || u.name || u.fiatWallet?.name || '';
                u.username = u.username || '';
                u.photoUrl = u.photoUrl || u.photo_url || null;
                if (!u.mbsId) {
                    u.mbsId = 'MBS' + uId.slice(-5);
                }
                const hasTx = transactingUserIds.has(uId) || (u.totalBuy && u.totalBuy > 0) || (u.totalSell && u.totalSell > 0);
                u.isVerified = Boolean(hasTx || u.isVerified || u.status === 'verified');
                u.balance = parseFloat(u.balance || 0);
                users.push(u);
            });
        } catch (uErr) {
            console.warn("Firestore users fetch warning in /api/stats:", uErr.message);
            if (statsCache.data?.users) users = statsCache.data.users;
        }
        
        console.log("Fetching failed screenshots...");
        let failedScreenshots = [];
        try {
            const failedSnapshot = await db.collection('failed_screenshots').orderBy('timestamp', 'desc').limit(20).get();
            failedSnapshot.forEach(doc => {
                const data = doc.data();
                data.id = doc.id;
                failedScreenshots.push(data);
            });
        } catch (fsErr) {
            console.warn("Firestore failed screenshots warning:", fsErr.message);
            if (statsCache.data?.failedScreenshots) failedScreenshots = statsCache.data.failedScreenshots;
        }

        console.log("Fetching TON balances (USDT, TON, GRAM)...");
        let tonBalance = "0.00";
        let tonNativeBalance = "0.00";
        let tonUsdtBalance = "0.00";
        let gramBalance = "0.00";
        try {
            if (process.env.BOT_TON_ADDRESS) {
                const treasury = await getAdminTreasuryBalances();
                tonNativeBalance = treasury.ton.toFixed(2);
                tonUsdtBalance = treasury.usdt.toFixed(2);
                tonBalance = tonNativeBalance;

                // Also check GRAM jetton
                try {
                    const jettonRes = await axios.get(`https://tonapi.io/v2/accounts/${process.env.BOT_TON_ADDRESS}/jettons?_t=${Date.now()}`, { timeout: 3000 });
                    if (jettonRes.data && Array.isArray(jettonRes.data.balances)) {
                        const gramJetton = jettonRes.data.balances.find(j => j.jetton?.symbol === 'GRAM');
                        if (gramJetton) {
                            gramBalance = tonNativeBalance;
                        }
                    }
                } catch(e) {}
            }
        } catch(e) {
            console.error("TON Error:", e.message);
        }

        console.log("Fetching EVM balance...");
        let evmBalance = "0.00";
        try {
            const evmAddr = process.env.BOT_EVM_ADDRESS || process.env.BEP20_ADDRESS;
            if (evmAddr) {
                const provider = new ethers.JsonRpcProvider('https://bsc.publicnode.com');
                const usdtContract = new ethers.Contract('0x55d398326f99059fF775485246999027B3197955', ['function balanceOf(address) view returns (uint256)'], provider);
                const balanceWei = await usdtContract.balanceOf(evmAddr);
                evmBalance = parseFloat(ethers.formatUnits(balanceWei, 18)).toFixed(2);
            }
        } catch (e) {
            console.error("EVM Error:", e.message);
        }

        const resultData = {
            users: users,
            failedScreenshots: failedScreenshots,
            tonBalance: tonBalance,
            tonNativeBalance: tonNativeBalance,
            tonUsdtBalance: tonUsdtBalance,
            gramBalance: (parseFloat(gramBalance) > 0 ? gramBalance : tonNativeBalance),
            evmBalance: evmBalance,
            evmAddress: process.env.BOT_EVM_ADDRESS,
            tonAddress: process.env.BOT_TON_ADDRESS
        };

        statsCache = { data: resultData, timestamp: now };
        res.json(resultData);
    } catch (error) {
        console.error("Stats API error:", error.message);
        if (statsCache.data) {
            return res.json(statsCache.data);
        }
        res.json({
            users: [],
            failedScreenshots: [],
            tonBalance: "0.00",
            tonNativeBalance: "0.00",
            tonUsdtBalance: "0.00",
            gramBalance: "0.00",
            evmBalance: "0.00",
            evmAddress: process.env.BOT_EVM_ADDRESS || "",
            tonAddress: process.env.BOT_TON_ADDRESS || ""
        });
    }
});

// Serve static manifest and logo for TON Connect with CORS
app.get('/tonconnect-manifest.json', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.sendFile(path.join(__dirname, 'tonconnect-manifest.json'));
});
app.get(['/logo.png', '/trustpaylogo.png', '/logo-512.png', '/logo-256.png', '/trustpay-tp-512.png', '/trustpay-tp-logo.png'], (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.sendFile(path.join(__dirname, 'trustpay-tp-512.png'));
});

const { mnemonicToPrivateKey } = require('@ton/crypto');
const { WalletContractV4, internal, TonClient } = require('@ton/ton');


app.get('/api/transactions', async (req, res) => {
    try {
        const snapshot = await db.collection('free_claims').orderBy('timestamp', 'desc').limit(50).get();
        const txs = [];
        snapshot.forEach(doc => {
            txs.push({
                userId: doc.id,
                ...doc.data()
            });
        });
        res.json(txs);
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});


app.post('/api/miniapp/save-wallet', async (req, res) => {
    try {
        const { userId, method, number, name } = req.body;
        await db.collection('users').doc(userId.toString()).set({ fiatWallet: { method, number, name } }, { merge: true });
        res.json({ success: true });
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/miniapp/withdraw-fiat', async (req, res) => {
    try {
        const { userId, amount, fee, receiveAmount } = req.body;
        if (!userId) throw new Error("User ID is required");
        const userRef = db.collection('users').doc(userId.toString());
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) throw new Error("User not found");
        const userData = userDoc.data();
        if ((userData.balance || 0) < amount) throw new Error("Insufficient balance");

        if (!userData.fiatWallet || !userData.fiatWallet.number) {
            throw new Error("Please set your withdrawal wallet number first");
        }

        // Anti-Abuse Withdrawal System (Add Money vs Sell Crypto)
        const isDepositUser = (userData.hasDepositWithoutTrade === true) || 
                              (userData.hasDepositWithoutTrade === undefined && !userData.hasSellBalance);

        // Minimum withdrawal: 30 TK for deposit users, 20 TK for crypto sellers
        const minWithdrawAmount = isDepositUser ? 30 : 20;
        if (amount < minWithdrawAmount) {
            throw new Error(isDepositUser 
                ? "অ্যাড মানি ব্যবহারকারীদের জন্য নূন্যতম উইথড্র ৩০ টাকা।" 
                : "নূন্যতম উত্তোলন ২০ টাকা");
        }

        // Trade requirement: Deposit users must spend at least 20 TK on buying crypto
        if (isDepositUser) {
            const spentAmount = userData.spentSinceLastDeposit || 0;
            if (spentAmount < 20) {
                const remaining = (20 - spentAmount).toFixed(0);
                throw new Error(`অ্যাড মানি করার পর সাথে সাথে ক্যাশআউট করা যাবে না। নূন্যতম ২০ টাকার ক্রিপ্টো ক্রয়/ট্রেড করতে হবে (বাকি আছে ৳${remaining} টাকা)।`);
            }
        }

        // Check daily limit
        const limitDoc = await db.collection('settings').doc('limits').get();
        let dailyLimit = 9999;
        if (limitDoc.exists && limitDoc.data().dailyWithdrawLimit) {
            dailyLimit = limitDoc.data().dailyWithdrawLimit;
        }

        // Count today's withdrawals
        const todayStr = new Date().toISOString().split('T')[0];
        const countRef = db.collection('daily_counts').doc(todayStr);
        const countDoc = await countRef.get();
        let todayCount = countDoc.exists ? (countDoc.data().withdrawals || 0) : 0;
        
        if (todayCount >= dailyLimit) {
            throw new Error(`Daily withdrawal limit (${dailyLimit}) reached. Try again tomorrow.`);
        }

        // Get serial number
        const globalRef = db.collection('settings').doc('global_stats');
        const globalDoc = await globalRef.get();
        let serialNum = (globalDoc.exists && globalDoc.data().totalWithdrawals) ? globalDoc.data().totalWithdrawals + 1 : 1;
        await globalRef.set({ totalWithdrawals: serialNum }, { merge: true });
        
        // Increment daily count
        await countRef.set({ withdrawals: todayCount + 1 }, { merge: true });

        const calculateSendMoneyFee = (amt) => {
            const a = parseFloat(amt) || 0;
            if (a <= 0 || a <= 30) return 0; // 20 to 30 TK no fee
            if (a >= 1500) return 30;
            if (a > 1000) return 20;
            if (a > 500) return 10;
            if (a > 100) return 7;
            return 5;
        };
        let calcFee = (fee !== undefined && fee !== null) ? parseFloat(fee) : calculateSendMoneyFee(amount);
        if (parseFloat(amount) <= 30) {
            calcFee = 0;
        }
        const calcReceive = parseFloat(amount) <= 30 ? parseFloat(amount) : (receiveAmount || (amount - calcFee));

        // Record withdrawal in dedicated fiat_withdrawals collection
        const withdrawDoc = {
            userId: parseInt(userId) || userId,
            serial: serialNum,
            amount: amount,
            fee: calcFee,
            receiveAmount: calcReceive,
            status: 'pending',
            timestamp: FieldValue.serverTimestamp(),
            createdAt: Date.now(),
            method: userData.fiatWallet.method,
            number: userData.fiatWallet.number,
            name: userData.fiatWallet.name || userData.first_name || 'User'
        };

        const withdrawRef = await db.collection('fiat_withdrawals').add(withdrawDoc);

        // Deduct balance and update user fiatWithdrawPending with doc id
        await userRef.update({
            balance: FieldValue.increment(-amount),
            fiatWithdrawPending: {
                ...withdrawDoc,
                id: withdrawRef.id,
                timestamp: Date.now()
            }
        });
        
        // Notify Withdraw Request Group
        const withdrawGroup = botConfig.withdrawGroupId || botConfig.adminGroupId;
        if (withdrawGroup && bot) {
            const msg = `<blockquote><b>💳 নতুন উইথড্র রিকোয়েস্ট (Withdraw Request)</b>\n\n` +
                `#️⃣ <b>সিরিয়াল নং:</b> <b>#${serialNum}</b>\n` +
                `👤 <b>ইউজার:</b> <a href="tg://user?id=${userId}">${userData.first_name || 'User'}</a> (<code>${userId}</code>)\n` +
                `💰 <b>উত্তোলনের পরিমাণ:</b> <b>৳ ${amount} BDT</b>\n` +
                `📉 <b>সেন্ড মানি ফি:</b> <b>৳ ${calcFee.toFixed(2)} BDT</b>\n` +
                `✅ <b>পাঠাতে হবে (Send Exactly):</b> <b>৳ ${calcReceive.toFixed(2)} BDT</b>\n\n` +
                `🏦 <b>মাধ্যম:</b> <b>${userData.fiatWallet.method}</b>\n` +
                `📞 <b>নম্বর:</b> <code>${userData.fiatWallet.number}</code>\n` +
                `📛 <b>অ্যাকাউন্ট নাম:</b> <b>${userData.fiatWallet.name || 'User'}</b></blockquote>\n\n` +
                `⚙️ <b>অ্যাকশন (এই মেসেজে রিপ্লাই দিন):</b>\n` +
                `• <code>Ok</code> — পেমেন্ট কনফার্ম করুন (Payout গ্রুপে লাইভ প্রুফ যাবে)\n` +
                `• <code>Reject [কারণ]</code> — বাতিল করে ব্যালেন্স রিফান্ড করুন\n` +
                `• <code>wt 10:00</code> — প্রসেসিং টাইমার সেট করুন`;
            await bot.sendMessage(withdrawGroup, msg, { parse_mode: 'HTML' }).catch(e => console.error(e.message));
        }
        
        res.json({ success: true, serial: serialNum, withdrawId: withdrawRef.id });
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/withdraw', async (req, res) => {
    try {
        const { amount, destination, network, asset } = req.body;
        
        if (network === 'TON') {
            if (asset === 'USDT') {
                const txRes = await sendJettonUsdtOnChain(destination, amount);
                return res.json({ 
                    success: true, 
                    message: `Successfully transferred ${amount} USDT on-chain to ${destination}`,
                    tx: txRes 
                });
            }

            const { WalletContractV4, internal, beginCell, external, storeMessage } = require('@ton/ton');
            const { mnemonicToPrivateKey } = require('@ton/crypto');
            const { ethers } = require('ethers');

            const keyPair = await mnemonicToPrivateKey(process.env.BOT_TON_SEED.split(' '));
            const wallet = WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey });
            
            let seqno = 0;
            try {
                // Fetch seqno from Toncenter
                const seqnoRes = await axios.get(`https://toncenter.com/api/v2/getWalletInformation?address=${wallet.address.toString(true, true, true)}`);
                seqno = seqnoRes.data?.result?.seqno || 0;
            } catch(e) {
                seqno = 0;
            }

            const amountNano = ethers.parseUnits(amount.toString(), 9);

            const transfer = wallet.createTransfer({
                seqno,
                secretKey: keyPair.secretKey,
                messages: [
                    internal({
                        to: destination,
                        value: amountNano,
                        bounce: false,
                        body: "Withdrawal from Trust Pay"
                    })
                ]
            });
            
            // Wrap in External Message for Toncenter
            const extMsg = beginCell().store(storeMessage(external({
                to: wallet.address,
                body: transfer
            }))).endCell();

            const boc = extMsg.toBoc().toString('base64');
            
            try {
                await axios.post('https://toncenter.com/api/v2/sendBoc', { boc });
                res.json({ success: true, message: `Successfully sent ${amount} TON/GRAM to ${destination}` });
            } catch (err) {
                console.error(err.response?.data || err.message);
                const apiErr = err.response?.data?.error || err.message;
                res.status(500).json({ error: "Blockchain rejected transfer: " + apiErr });
            }
        } else {
            res.status(400).json({ error: "EVM Withdrawal not fully implemented yet." });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/approve-fraud', async (req, res) => {
    try {
        const { docId, chatId } = req.body;
        
        // 1. Mark user as verified
        await db.collection('users').doc(chatId.toString()).set({
            status: 'verified'
        }, { merge: true });
        
        // 2. Delete fraud log
        await db.collection('failed_screenshots').doc(docId).delete();
        
        // 3. Update bot state to ask for TON address
        userStates[chatId] = userStates[chatId] || {};
        userStates[chatId].step = 'awaiting_ton_address';
        
        // 4. Send message to user
        const lang = userStates[chatId].language || 'bn';
        const msgText = lang === 'bn' 
            ? `✅ *Admin আপনার পেমেন্ট ম্যানুয়ালি অ্যাপ্রুভ করেছে!*

আপনার পেমেন্ট রিসিভ করতে এখন আপনার *TON Address* দিন:` 
            : `✅ *Admin has manually approved your payment!*

To receive your payout, please send your *TON Address* now:`;
            
        bot.sendMessage(chatId, msgText, { parse_mode: 'Markdown' }).catch(e => console.error(e.message));
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/settings', (req, res) => {
    try {
        const config = botConfig || {};
        if (!config.adminBkash) config.adminBkash = '01752561935';
        if (!config.adminNagad) config.adminNagad = '01878580320';
        res.json(config);
    } catch (e) {
        res.json({ gramAmount: '0.07', usdtAmount: '0.05', freeLink: 'https://t.me/VictorsCompanybot/app?startapp=ref_DBF2368328', adminBkash: '01752561935', adminNagad: '01878580320' });
    }
});


app.post('/api/miniapp/add-money', async (req, res) => {
    try {
        let { userId, amount, paymentMethod, trxId } = req.body;
        if (!trxId || trxId.length < 5) {
            return res.status(400).json({ error: 'সঠিক Transaction ID দিন (কমপক্ষে ৫ অক্ষর)' });
        }
        trxId = trxId.trim().toUpperCase();
        amount = parseFloat(amount);
        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({ error: 'সঠিক টাকার পরিমাণ দিন' });
        }

        const verifiedRecord = await getVerifiedTrxRecord(trxId);
        
        // STRICT: If not found in database or memory, REJECT IMMEDIATELY! NO PENDING!
        if (!verifiedRecord || !verifiedRecord.data) {
            return res.status(400).json({ 
                error: 'ভুল অথবা আনভেরিফাইড Transaction ID! টাকা পাঠিয়ে সঠিক TrxID দিন বা এসএমএস আসা পর্যন্ত ১ মিনিট অপেক্ষা করে আবার চেষ্টা করুন।' 
            });
        }

        const verifiedData = verifiedRecord.data;

        // If already claimed, REJECT!
        if (verifiedData.claimed) {
            return res.status(400).json({ 
                error: 'এই Transaction ID টি ইতিমধ্যে ব্যবহার করা হয়েছে!' 
            });
        }

        // If amount mismatch, REJECT without leaking actual SMS amount to the user!
        if (verifiedData.amount && Math.abs(verifiedData.amount - amount) > 1) {
            // Secretly notify Data Group (Admin only)
            const config = botConfig || {};
            const dataGroup = config.dataGroupId || config.adminGroupId;
            if (dataGroup && bot) {
                const mismatchAlert = `<blockquote><b>⚠️ টাকার পরিমাণে অমিল সতর্কবার্তা (Add Money Mismatch)!</b>\n\n` +
                    `👤 <b>User:</b> <code>${userId}</code>\n` +
                    `💰 <b>ইউজার ইনপুট (Selected):</b> <b>৳${amount} BDT</b>\n` +
                    `💵 <b>প্রকৃত এসএমএস (Actual SMS):</b> <b>৳${verifiedData.amount} BDT</b>\n` +
                    `#️⃣ <b>TrxID:</b> <code>${trxId}</code>\n` +
                    `🔒 <b>স্ট্যাটাস:</b> ট্রানজেকশন ক্লেইম ব্লক করা হয়েছে (Protected)</blockquote>`;
                bot.sendMessage(dataGroup, mismatchAlert, { parse_mode: 'HTML' }).catch(e => console.error(e.message));
            }

            return res.status(400).json({ 
                error: 'টাকার পরিমাণে অমিল রয়েছে! অনুগ্রহ করে আপনার প্রেরিত সঠিক টাকার পরিমাণ ও TrxID পুনরায় যাচাই করে চেষ্টা করুন।' 
            });
        }

        // MATCH! Claim TrxID and instantly add money to user's balance!
        await markVerifiedTrxClaimed(verifiedRecord, trxId, userId);

        const userRef = db.collection('users').doc(userId.toString());
        await userRef.set({
            balance: FieldValue.increment(amount),
            hasDepositWithoutTrade: true,
            spentSinceLastDeposit: 0,
            lastDepositAt: Date.now()
        }, { merge: true });

        // Record completed deposit in database
        await db.collection('deposits').doc(trxId).set({
            userId,
            amount,
            paymentMethod,
            trxId,
            status: 'completed',
            type: 'add_money',
            timestamp: FieldValue.serverTimestamp()
        });

        // Also record in miniapp_buys for Admin Orders List history
        await db.collection('miniapp_buys').doc(trxId).set({
            userId,
            asset: 'BDT',
            amount,
            totalBdt: amount,
            paymentMethod,
            trxId,
            status: 'completed',
            type: 'add_money',
            timestamp: FieldValue.serverTimestamp()
        });

        const updatedDoc = await userRef.get();
        const newBalance = updatedDoc.data()?.balance || amount;

        const userAddMoneyMsg = `<b>💰 𝗧𝗥𝗨𝗦𝗧 𝗣𝗔𝗬 — ব্যালেন্স ডিপোজিট সফল!</b>\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n` +
            `✅ <b>স্ট্যাটাস:</b> <code>অটো-ভেরিফাইড ও যুক্ত হয়েছে</code> 💸\n` +
            `#️⃣ <b>TrxID:</b> <code>${trxId}</code>\n\n` +
            `<blockquote>💵 <b>জমা হওয়া টাকা:</b> ৳${amount} BDT (${paymentMethod})\n` +
            `💰 <b>নতুন ব্যালেন্স:</b> <b>৳${newBalance} BDT</b></blockquote>\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n` +
            `🚀 <i>টাকাটি আপনার অ্যাকাউন্টে স্বয়ংক্রিয়ভাবে জমা হয়েছে।</i>`;
        bot.sendMessage(userId, userAddMoneyMsg, { parse_mode: 'HTML', ...appOpenMarkup }).catch(e => console.error(e.message));

        // Notify Data Group
        const config = botConfig || {};
        const dataGroup = config.dataGroupId || config.adminGroupId;
        if (dataGroup && bot) {
            const dataAddMoneyMsg = `<blockquote><b>💰 নতুন টাকা যুক্ত (Add Money)!</b>\n\n` +
                `👤 <b>User:</b> <code>${userId}</code>\n` +
                `💵 <b>পরিমাণ:</b> <b>৳${amount} BDT</b> (${paymentMethod})\n` +
                `💰 <b>নতুন ব্যালেন্স:</b> <b>৳${newBalance} BDT</b>\n` +
                `#️⃣ <b>TrxID:</b> <code>${trxId}</code>\n` +
                `✅ <b>স্ট্যাটাস:</b> ব্যালেন্সে অটো যোগ হয়েছে</blockquote>`;
            bot.sendMessage(dataGroup, dataAddMoneyMsg, { parse_mode: 'HTML' }).catch(e => console.error(e.message));
        }

        res.json({
            success: true,
            message: `৳${amount} BDT সফলভাবে আপনার ব্যালেন্সে যোগ হয়েছে!`,
            amount,
            newBalance
        });
    } catch(e) {
        console.error("Add money error:", e);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/miniapp/buy-crypto', async (req, res) => {
    try {
        let { userId, asset, cryptoAmount, bdtAmount, receiveAddress } = req.body;
        if (!userId || !cryptoAmount || !bdtAmount || !receiveAddress) {
            return res.status(400).json({ error: 'সবগুলো তথ্য সঠিকভাবে পূরণ করুন' });
        }
        bdtAmount = parseFloat(bdtAmount);
        cryptoAmount = parseFloat(cryptoAmount);
        asset = (asset || 'TON').toUpperCase();
        receiveAddress = receiveAddress.trim();

        if (bdtAmount < 20 || cryptoAmount <= 0) {
            return res.status(400).json({ error: 'নূন্যতম ক্রিপ্টো ক্রয় ২০ টাকা' });
        }

        // 1. Verify User Balance First
        const userRef = db.collection('users').doc(userId.toString());
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }

        const currentBalance = userDoc.data()?.balance || 0;
        if (currentBalance < bdtAmount) {
            return res.status(400).json({ 
                error: `পর্যাপ্ত ব্যালেন্স নেই! আপনার ব্যালেন্স ৳${currentBalance} BDT, কিন্তু প্রয়োজন ৳${bdtAmount} BDT` 
            });
        }

        // 2. CRITICAL: CHECK ADMIN TREASURY & GAS FEE BEFORE DEDUCTING USER BALANCE!
        const treasury = await getAdminTreasuryBalances();
        const isTonAsset = (asset === 'GRAM' || asset === 'TON');
        const MIN_TON_GAS = 0.02;

        const config = botConfig || {};
        const adminGroupId = config.adminGroupId || 8799135330;

        if (isTonAsset) {
            const requiredTon = cryptoAmount + MIN_TON_GAS;
            if (treasury.ton < requiredTon) {
                // Insufficient TON/gas in Admin Wallet: DO NOT DEDUCT! DO NOT SAY SUCCESS!
                if (adminGroupId && bot) {
                    const alertMsg = `⚠️ <b>এডমিন ওয়ালেটে ক্রিপ্টো বা গ্যাস ফি অপর্যাপ্ত!</b>\n\n` +
                        `👤 ইউজার: <code>${userId}</code>\n` +
                        `💎 কিনতে চেয়েছে: <b>${cryptoAmount} ${asset}</b> (৳${bdtAmount} BDT)\n` +
                        `🏷 রিসিভ ওয়ালেট: <code>${receiveAddress}</code>\n\n` +
                        `🏦 <b>এডমিন ওয়ালেট ব্যালেন্স:</b>\n` +
                        `💎 বর্তমান TON: <b>${treasury.ton} TON</b>\n` +
                        `⛽ প্রয়োজনীয় TON: <b>${requiredTon.toFixed(4)} TON</b> (গ্যাস ফিসহ)\n\n` +
                        `<i>ইউজারের ব্যালেন্স কাটা হয়নি। এডমিন ওয়ালেটে ক্রিপ্টো ডিপোজিট করুন!</i>`;
                    bot.sendMessage(adminGroupId, alertMsg, { parse_mode: 'HTML' }).catch(e => console.error(e.message));
                }

                return res.status(400).json({
                    error: 'সার্ভার বা ব্লকচেইন নেটওয়ার্কে সাময়িক ট্রাফিকের কারণে ক্রিপ্টো ট্রান্সফার সম্পন্ন করা সম্ভব হয়নি। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন অথবা সাপোর্টে যোগাযোগ করুন। আপনার ব্যালেন্স সম্পূর্ণ নিরাপদ ও অক্ষত রয়েছে।'
                });
            }
        } else if (asset === 'USDT') {
            if (treasury.usdt < cryptoAmount) {
                if (adminGroupId && bot) {
                    const alertMsg = `⚠️ <b>এডমিন ওয়ালেটে USDT অপর্যাপ্ত!</b>\n\n` +
                        `👤 ইউজার: <code>${userId}</code>\n` +
                        `💵 কিনতে চেয়েছে: <b>${cryptoAmount} USDT</b> (৳${bdtAmount} BDT)\n` +
                        `🏷 রিসিভ ওয়ালেট: <code>${receiveAddress}</code>\n\n` +
                        `🏦 বর্তমান এডমিন USDT: <b>${treasury.usdt} USDT</b> (প্রয়োজন: ${cryptoAmount} USDT)\n\n` +
                        `<i>ইউজারের ব্যালেন্স কাটা হয়নি। এডমিন ওয়ালেটে USDT ডিপোজিট করুন!</i>`;
                    bot.sendMessage(adminGroupId, alertMsg, { parse_mode: 'HTML' }).catch(e => console.error(e.message));
                }

                return res.status(400).json({
                    error: 'সার্ভার বা ব্লকচেইন নেটওয়ার্কে সাময়িক ট্রাফিকের কারণে ক্রিপ্টো ট্রান্সফার সম্পন্ন করা সম্ভব হয়নি। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন অথবা সাপোর্টে যোগাযোগ করুন। আপনার ব্যালেন্স সম্পূর্ণ নিরাপদ ও অক্ষত রয়েছে।'
                });
            }

            if (treasury.ton < 0.05) {
                if (adminGroupId && bot) {
                    const alertMsg = `⚠️ <b>এডমিন ওয়ালেটে গ্যাস ফি (TON) অপর্যাপ্ত!</b>\n\n` +
                        `👤 ইউজার: <code>${userId}</code>\n` +
                        `💵 USDT অর্ডারের জন্য প্রয়োজনীয় গ্যাস: 0.05 TON\n` +
                        `🏦 বর্তমান এডমিন TON গ্যাস: <b>${treasury.ton} TON</b>\n\n` +
                        `<i>ইউজারের ব্যালেন্স কাটা হয়নি। এডমিন ওয়ালেটে TON গ্যাস ফি ডিপোজিট করুন!</i>`;
                    bot.sendMessage(adminGroupId, alertMsg, { parse_mode: 'HTML' }).catch(e => console.error(e.message));
                }

                return res.status(400).json({
                    error: 'সার্ভার বা ব্লকচেইন নেটওয়ার্কে সাময়িক ট্রাফিকের কারণে ক্রিপ্টো ট্রান্সফার সম্পন্ন করা সম্ভব হয়নি। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন অথবা সাপোর্টে যোগাযোগ করুন। আপনার ব্যালেন্স সম্পূর্ণ নিরাপদ ও অক্ষত রয়েছে।'
                });
            }
        }

        // 3. ADMIN WALLET HAS VERIFIED FUNDS: NOW DEDUCT USER BDT BALANCE
        const prevSpent = userDoc.data()?.spentSinceLastDeposit || 0;
        const newSpent = prevSpent + bdtAmount;
        const buyUpdates = {
            balance: FieldValue.increment(-bdtAmount),
            spentSinceLastDeposit: FieldValue.increment(bdtAmount)
        };
        if (newSpent >= 20) {
            buyUpdates.hasDepositWithoutTrade = false;
        }
        await userRef.update(buyUpdates);

        // 4. BROADCAST ON-CHAIN TRANSACTION!
        // Deduct gas fee from cryptoAmount (0.005 for TON/GRAM, 0.03 for USDT)
        const gasFee = (asset === 'USDT') ? 0.008 : 0.0015;
        const netCryptoAmount = Math.max(0.0001, parseFloat((cryptoAmount - gasFee).toFixed(6)));

        let txResult = null;
        try {
            if (isTonAsset) {
                txResult = await sendTonOnChain(receiveAddress, netCryptoAmount);
            } else if (asset === 'USDT') {
                txResult = await sendJettonUsdtOnChain(receiveAddress, netCryptoAmount);
            } else {
                throw new Error(`Unsupported crypto asset: ${asset}`);
            }
        } catch (txErr) {
            // ON-CHAIN BROADCAST FAILED: IMMEDIATELY ROLLBACK & REFUND BDT!
            await userRef.update({
                balance: FieldValue.increment(bdtAmount),
                spentSinceLastDeposit: FieldValue.increment(-bdtAmount),
                hasDepositWithoutTrade: userDoc.data()?.hasDepositWithoutTrade ?? true
            });
            console.error("Buy crypto on-chain transfer failed:", txErr.message);
            return res.status(500).json({ 
                error: `অন-চেইন ট্রান্সফার ব্যর্থ হয়েছে: ${txErr.message}। আপনার ৳${bdtAmount} BDT ব্যালেন্সে ফেরত দেওয়া হয়েছে।` 
            });
        }

        // 5. SAVE COMPLETED ORDER
        const orderId = 'BUY' + Date.now().toString().slice(-8);
        await db.collection('miniapp_buys').doc(orderId).set({
            orderId,
            userId,
            asset,
            amount: cryptoAmount,
            totalBdt: bdtAmount,
            paymentMethod: 'In-App Balance',
            trxId: orderId,
            receiveAddress,
            status: 'completed',
            txResult: txResult || null,
            timestamp: FieldValue.serverTimestamp()
        });

        const newBalance = currentBalance - bdtAmount;

        const userBuyInstantMsg = `<b>💎 𝗧𝗥𝗨𝗦𝗧 𝗣𝗔𝗬 — ক্রিপ্টো ক্রয় সফল!</b>\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n` +
            `⚡ <b>স্ট্যাটাস:</b> <code>অন-চেইনে ট্রান্সফার সম্পন্ন</code> ✅\n` +
            `🏷 <b>রিসিভার ওয়ালেট:</b>\n<code>${receiveAddress}</code>\n\n` +
            `<blockquote>📦 <b>প্রাপ্ত ক্রিপ্টো:</b> ${cryptoAmount} ${asset}\n` +
            `💵 <b>পরিশোধিত মূল্য:</b> ৳${bdtAmount} BDT\n` +
            `💰 <b>নতুন ব্যালেন্স:</b> <b>৳${newBalance} BDT</b></blockquote>\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n` +
            `🚀 <i>ক্রিপ্টো আপনার ওয়ালেটে সফলভাবে পাঠিয়ে দেওয়া হয়েছে।</i>`;
        bot.sendMessage(userId, userBuyInstantMsg, { parse_mode: 'HTML', ...appOpenMarkup }).catch(e => console.error(e.message));

        const dataGroup = config.dataGroupId || adminGroupId;
        if (dataGroup) {
            const dataBuyMsg = `<blockquote><b>💎 নতুন ক্রিপ্টো ক্রয় সম্পন্ন (Live Instant)!</b>\n\n` +
                `👤 <b>User:</b> <code>${userId}</code>\n` +
                `💎 <b>ক্রিপ্টো:</b> <b>${cryptoAmount} ${asset}</b>\n` +
                `💵 <b>ব্যালেন্স থেকে কাটা:</b> <b>৳${bdtAmount} BDT</b>\n` +
                `🏷 <b>Wallet:</b> <code>${receiveAddress}</code>\n` +
                `✅ <b>স্ট্যাটাস:</b> অন-চেইনে সফলভাবে সেন্ট হয়েছে</blockquote>`;
            bot.sendMessage(dataGroup, dataBuyMsg, { parse_mode: 'HTML' }).catch(e => console.error(e.message));
        }

        res.json({
            success: true,
            message: `সফলভাবে ${cryptoAmount} ${asset} আপনার ওয়ালেটে পাঠানো হয়েছে!`,
            orderId,
            asset,
            cryptoAmount,
            bdtAmount,
            newBalance,
            txResult
        });
    } catch(e) {
        console.error("Buy crypto error:", e);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/miniapp/buy', async (req, res) => {
    // Alias /api/miniapp/buy to add-money logic if it has no receiveAddress
    if (!req.body.receiveAddress) {
        req.body.amount = req.body.amount || req.body.totalBdt;
        return app._router.handle({ ...req, url: '/api/miniapp/add-money' }, res);
    }
    // If it has receiveAddress, route to buy-crypto or add-money
    try {
        let { userId, asset, amount, totalBdt, paymentMethod, trxId, receiveAddress } = req.body;
        if (!trxId || trxId.length < 5) {
            return res.status(400).json({ error: 'Please enter a valid Transaction ID (min 5 characters)' });
        }
        trxId = trxId.trim().toUpperCase();
        amount = parseFloat(amount || totalBdt);
        totalBdt = parseFloat(totalBdt || amount);

        const verifiedRecord = await getVerifiedTrxRecord(trxId);
        if (!verifiedRecord || !verifiedRecord.data) {
            return res.status(400).json({ 
                error: 'ভুল অথবা আনভেরিফাইড Transaction ID! টাকা পাঠিয়ে সঠিক TrxID দিন বা কিছুক্ষণ অপেক্ষা করে আবার চেষ্টা করুন।' 
            });
        }

        const verifiedData = verifiedRecord.data;
        if (verifiedData.claimed) {
            return res.status(400).json({ error: "এই Transaction ID টি ইতিমধ্যে ব্যবহার করা হয়েছে!" });
        }

        const amountDiff = verifiedData.amount ? Math.abs(verifiedData.amount - totalBdt) : 0;
        if (amountDiff > 1) {
            // Secretly notify Data Group (Admin only)
            const config = botConfig || {};
            const dataGroup = config.dataGroupId || config.adminGroupId;
            if (dataGroup && bot) {
                const mismatchAlert = `<blockquote><b>⚠️ টাকার পরিমাণে অমিল সতর্কবার্তা (Buy Order Mismatch)!</b>\n\n` +
                    `👤 <b>User:</b> <code>${userId}</code>\n` +
                    `💰 <b>ইউজার ইনপুট (Selected):</b> <b>৳${totalBdt} BDT</b>\n` +
                    `💵 <b>প্রকৃত এসএমএস (Actual SMS):</b> <b>৳${verifiedData.amount} BDT</b>\n` +
                    `#️⃣ <b>TrxID:</b> <code>${trxId}</code>\n` +
                    `🔒 <b>স্ট্যাটাস:</b> ট্রানজেকশন ক্লেইম ব্লক করা হয়েছে (Protected)</blockquote>`;
                bot.sendMessage(dataGroup, mismatchAlert, { parse_mode: 'HTML' }).catch(e => console.error(e.message));
            }

            return res.status(400).json({ 
                error: 'টাকার পরিমাণে অমিল রয়েছে! অনুগ্রহ করে আপনার প্রেরিত সঠিক টাকার পরিমাণ ও TrxID পুনরায় যাচাই করে চেষ্টা করুন।' 
            });
        }

        // MATCH!
        await markVerifiedTrxClaimed(verifiedRecord, trxId, userId);

        // Credit to balance!
        const userRef = db.collection('users').doc(userId.toString());
        await userRef.set({
            balance: FieldValue.increment(totalBdt),
            hasDepositWithoutTrade: true,
            spentSinceLastDeposit: 0,
            lastDepositAt: Date.now()
        }, { merge: true });

        await db.collection('miniapp_buys').doc(trxId).set({
            userId, asset: asset || 'BDT', amount, totalBdt, paymentMethod, trxId, receiveAddress: receiveAddress || '',
            status: 'completed',
            autoVerified: true,
            timestamp: FieldValue.serverTimestamp()
        });

        const updatedDoc = await userRef.get();
        const newBalance = updatedDoc.data()?.balance || totalBdt;

        const addOkMsg = `<b>💰 𝗧𝗥𝗨𝗦𝗧 𝗣𝗔𝗬 — ব্যালেন্স ডিপোজিট সফল!</b>\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n` +
            `✅ <b>স্ট্যাটাস:</b> <code>অ্যাকাউন্টে যুক্ত হয়েছে</code> 💸\n` +
            `#️⃣ <b>TrxID:</b> <code>${trxId}</code>\n\n` +
            `<blockquote>💵 <b>জমা হওয়া টাকা:</b> ৳${totalBdt} BDT\n` +
            `💰 <b>নতুন ব্যালেন্স:</b> <b>৳${newBalance} BDT</b></blockquote>\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n` +
            `🚀 <i>টাকাটি স্বয়ংক্রিয়ভাবে ব্যালেন্সে জমা হয়েছে।</i>`;
        bot.sendMessage(userId, addOkMsg, { parse_mode: 'HTML', ...appOpenMarkup }).catch(e => console.error(e.message));

        return res.json({ 
            success: true, 
            autoVerified: true, 
            status: 'completed', 
            message: 'Auto-verified instantly & added to balance!',
            newBalance
        });
    } catch (e) {
        console.error("Buy submission error:", e);
        res.status(500).json({ error: e.message });
    }
});


function parsePaymentSms(msg, rawSenderList) {
    if (!msg || typeof msg !== 'string') return null;
    const text = msg.trim();
    const textLower = text.toLowerCase();
    
    // Normalize all potential sender sources (string or array)
    const senders = [];
    function collectSender(val) {
        if (!val) return;
        if (typeof val === 'string') {
            senders.push(val.trim().toLowerCase());
        } else if (Array.isArray(val)) {
            val.forEach(v => collectSender(v));
        }
    }
    if (Array.isArray(rawSenderList)) {
        rawSenderList.forEach(s => collectSender(s));
    } else {
        collectSender(rawSenderList);
    }
    const senderCombined = senders.join(' ');

    // Authentic verification check for bKash and Nagad
    let provider = null;
    const isBkashSender = senderCombined.includes('bkash') || senderCombined.includes('16247');
    const isNagadSender = senderCombined.includes('nagad') || senderCombined.includes('16167');
    
    const isBkashBody = textLower.includes('bkash') && textLower.includes('trxid');
    const isNagadBody = (textLower.includes('nagad') || textLower.includes('txnid')) && (textLower.includes('txnid') || textLower.includes('trxid'));

    if (isNagadSender || isNagadBody) {
        provider = 'nagad';
    } else if (isBkashSender || isBkashBody) {
        provider = 'bKash';
    } else {
        // Untrusted source - blocked as fraud
        return { isFraud: true };
    }

    const trxMatch = text.match(/(?:TrxID|TxnId|TxnID|TrxId|Txn\s*ID|Trx\s*ID|Transaction\s*ID|TrxID\s*is|TxnID\s*is)[\s:.\-_=]*([A-Za-z0-9]{5,25})/i);
    if (!trxMatch) return null;
    const trxId = trxMatch[1].toUpperCase();

    let amount = 0;
    const recvMatch = text.match(/(?:received|cash in|deposit|payment of|transfer received)[\s:]*(?:Tk|BDT|টাকা)?\.?\s*([\d,]+(?:\.\d+)?)/i) ||
                      text.match(/(?:Tk|BDT|টাকা)\.?\s*([\d,]+(?:\.\d+)?)\s*(?:from|received|has been)/i) ||
                      text.match(/(?:Tk|BDT|টাকা)\.?\s*([\d,]+(?:\.\d+)?)/i) ||
                      text.match(/([\d,]+(?:\.\d+)?)\s*(?:Tk|BDT|টাকা)/i);

    if (recvMatch) {
        amount = parseFloat(recvMatch[1].replace(/,/g, ''));
    }

    let senderPhone = '';
    const phoneMatch = text.match(/(?:from|by)[\s:]*(01[3-9]\d{8})/i);
    if (phoneMatch) {
        senderPhone = phoneMatch[1];
    }

    return { trxId, amount, provider, senderPhone, rawMessage: text };
}

async function handleIncomingSmsWebhook(req, res) {
    try {
        try {
            db.collection('debug_logs').add({
                method: req.method || 'UNKNOWN',
                body: JSON.parse(JSON.stringify(req.body || {})),
                query: JSON.parse(JSON.stringify(req.query || {})),
                userAgent: req.headers['user-agent'] || '',
                contentType: req.headers['content-type'] || '',
                timestamp: FieldValue.serverTimestamp()
            }).catch(e => console.warn("debug_logs add error:", e.message));
        } catch (_) {}

        let rawMessage = req.body?.message || 
                         req.body?.sms_message ||
                         req.body?.text || 
                         req.body?.sms || 
                         req.body?.body || 
                         req.query?.message || 
                         req.query?.sms_message ||
                         req.query?.text || 
                         req.query?.sms || 
                         req.rawBody ||
                         (typeof req.body === 'string' ? req.body : '');

        if (!rawMessage && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
            rawMessage = JSON.stringify(req.body);
        }

        if (!rawMessage || typeof rawMessage !== 'string' || rawMessage.trim().length < 5) {
            return res.status(400).json({ error: "Missing SMS message content" });
        }

        // Pass all possible sender locations: body.sender, query.sender, body.from, query.from
        const senderSources = [
            req.body?.sender,
            req.body?.sms_sender,
            req.query?.sender,
            req.query?.sms_sender,
            req.body?.from,
            req.query?.from,
            req.headers['x-sender']
        ];

        const parsed = parsePaymentSms(rawMessage, senderSources);
        if (parsed?.isFraud) {
            console.warn("Blocked untrusted SMS attempt:", senderSources, rawMessage);
            return res.status(403).json({ error: "Fraud attempt blocked! Sender must be bKash or Nagad" });
        }
        if (!parsed || !parsed.trxId) {
            console.warn("Could not extract TrxID from SMS:", rawMessage);
            return res.status(400).json({ error: "No valid TrxID or TxnID found in message" });
        }

        const { trxId, amount, provider, senderPhone } = parsed;

        // 1. Save to in-memory store immediately
        const memItem = {
            id: trxId,
            trxId: trxId,
            sender: provider,
            senderPhone: senderPhone || '',
            message: rawMessage,
            amount: amount,
            claimed: false,
            timestamp: new Date()
        };
        inMemoryVerifiedTrx.set(trxId, memItem);
        inMemoryMockTrxs.unshift(memItem);
        if (inMemoryMockTrxs.length > 50) inMemoryMockTrxs.pop();

        // 2. Save to Firestore verified_trx
        const verifiedRef = db.collection('verified_trx').doc(trxId);
        await verifiedRef.set({
            message: rawMessage,
            amount: amount,
            sender: provider,
            senderPhone: senderPhone || '',
            claimed: false,
            timestamp: FieldValue.serverTimestamp()
        }, { merge: true }).catch(err => {
            console.warn("Firestore verified_trx write warning:", err.message);
        });

        // 3. Check for matching pending order
        const config = botConfig || {};
        const adminGroupId = config.adminGroupId || null;

        const buyRef = db.collection('miniapp_buys').doc(trxId);
        const buyDoc = await buyRef.get().catch(() => null);

        if (buyDoc && buyDoc.exists) {
            const order = buyDoc.data();
            if (order.status === 'pending') {
                if (amount && order.totalBdt && Math.abs(amount - order.totalBdt) > 1) {
                    const dataGroup = botConfig.dataGroupId || adminGroupId;
                    if (dataGroup && bot) {
                        const mismatchAlert = `<blockquote><b>⚠️ টাকার পরিমাণ কম/অসামঞ্জস্য (Amount Mismatch Warning)!</b>\n\n` +
                            `👤 <b>User:</b> <code>${order.userId}</code>\n` +
                            `💵 <b>প্রত্যাশিত (Expected):</b> <b>৳${order.totalBdt} BDT</b>\n` +
                            `📩 <b>SMS প্রাপ্ত:</b> <b>৳${amount} BDT</b>\n` +
                            `#️⃣ <b>TrxID:</b> <code>${trxId}</code>\n` +
                            `⚠️ <b>স্ট্যাটাস:</b> পেমেন্ট অসম্পূর্ণ থাকায় ভেরিফিকেশন স্থগিত।</blockquote>`;
                        bot.sendMessage(dataGroup, mismatchAlert, { parse_mode: 'HTML' }).catch(() => {});
                    }
                    return res.json({ success: true, message: "TrxID saved. Amount mismatch with pending order.", trxId, amount });
                }

                // AUTO-VERIFY order!
                await buyRef.update({ 
                    status: 'verified',
                    autoVerified: true,
                    smsVerifiedAt: FieldValue.serverTimestamp()
                }).catch(() => {});

                await verifiedRef.set({
                    claimed: true,
                    claimedBy: order.userId,
                    claimedAt: FieldValue.serverTimestamp()
                }, { merge: true }).catch(() => {});

                memItem.claimed = true;
                memItem.claimedBy = order.userId;

                if (bot && order.userId) {
                    const autoVerMsg = `<b>⚡ 𝗧𝗥𝗨𝗦𝗧 𝗣𝗔𝗬 — পেমেন্ট ভেরিফাইড!</b>\n` +
                        `━━━━━━━━━━━━━━━━━━━━━━\n` +
                        `✅ <b>স্ট্যাটাস:</b> <code>SMS দ্বারা অটো-ভেরিফাইড</code>\n` +
                        `#️⃣ <b>TrxID:</b> <code>${trxId}</code>\n\n` +
                        `<blockquote>💰 <b>অর্ডার:</b> ${order.amount} ${order.asset}\n` +
                        `💵 <b>পরিশোধিত:</b> <b>৳${order.totalBdt} BDT</b></blockquote>\n\n` +
                        `━━━━━━━━━━━━━━━━━━━━━━\n` +
                        `⏱ <i>অ্যাডমিন খুব দ্রুত ক্রিপ্টো আপনার ওয়ালেটে পাঠাচ্ছে।</i>`;
                    bot.sendMessage(order.userId, autoVerMsg, { parse_mode: 'HTML', ...appOpenMarkup }).catch(() => {});
                }

                if (bot && adminGroupId) {
                    const autoMsg = `<blockquote><b>⚡ Buy Order Auto-Verified via SMS!</b></blockquote>\n\n👤 User: <code>${order.userId}</code>\n💰 Asset: <b>${order.amount} ${order.asset}</b>\n💵 Paid: <b>৳${order.totalBdt} BDT</b>\n#️⃣ TrxID: <code>${trxId}</code>\n🏷 Wallet: <code>${order.receiveAddress}</code>\n\n⚙️ <b>Actions (Reply to this message):</b>\n- <code>ok</code> or <code>accept</code> to send ${order.asset} on-chain\n- <code>reject</code> to refund ৳${order.totalBdt} to user balance`;
                    bot.sendMessage(adminGroupId, autoMsg, { parse_mode: 'HTML' }).catch(() => {});
                }
            }
        }

        // Notify Data Group on Telegram
        const dataGroup = botConfig.dataGroupId || config.adminGroupId;
        if (dataGroup && bot) {
            const smsAlert = `<blockquote><b>📩 New SMS Captured & Verified in Database!</b></blockquote>\n\n` +
                `🏦 <b>Provider:</b> <b>${provider.toUpperCase()}</b>\n` +
                `💰 <b>Amount:</b> <b>৳${amount} BDT</b>\n` +
                `#️⃣ <b>TrxID:</b> <code>${trxId}</code>\n` +
                (senderPhone ? `📱 <b>Sender:</b> <code>${senderPhone}</code>\n` : '') +
                `⏱ <b>Status:</b> Ready in database for instant auto-verify.`;
            bot.sendMessage(dataGroup, smsAlert, { parse_mode: 'HTML' }).catch(() => {});
        }

        return res.json({
            success: true,
            message: `SMS parsed and saved in database for TrxID ${trxId}`,
            trxId,
            amount,
            provider,
            senderPhone: senderPhone || null
        });
    } catch (e) {
        console.error("SMS Webhook Error:", e);
        return res.status(500).json({ error: e.message });
    }
}

app.post('/api/macrodroid/webhook', handleIncomingSmsWebhook);
app.get('/api/macrodroid/webhook', handleIncomingSmsWebhook);
app.post('/api/webhook', handleIncomingSmsWebhook);
app.get('/api/webhook', handleIncomingSmsWebhook);
app.post('/webhook', handleIncomingSmsWebhook);
app.get('/webhook', handleIncomingSmsWebhook);
app.post('/api/sms', handleIncomingSmsWebhook);
app.get('/api/sms', handleIncomingSmsWebhook);



app.get('/api/admin/orders', async (req, res) => {
    const now = Date.now();
    if (ordersCache.data && (now - ordersCache.timestamp < 20000)) {
        return res.json(ordersCache.data);
    }

    try {
        let buys = [];
        let sells = [];
        let withdrawals = [];
        const seenWithdrawIds = new Set();

        try {
            const buysSnapshot = await db.collection('miniapp_buys').orderBy('timestamp', 'desc').limit(50).get();
            buys = buysSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch(e) {
            console.warn("Warning fetching miniapp_buys:", e.message);
            if (ordersCache.data?.buys) buys = ordersCache.data.buys;
        }

        try {
            const sellsSnapshot = await db.collection('miniapp_sells').orderBy('timestamp', 'desc').limit(50).get();
            sells = sellsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch(e) {
            console.warn("Warning fetching miniapp_sells:", e.message);
            if (ordersCache.data?.sells) sells = ordersCache.data.sells;
        }

        // 1. Get from fiat_withdrawals collection
        try {
            const fwSnap = await db.collection('fiat_withdrawals').orderBy('timestamp', 'desc').limit(50).get();
            fwSnap.forEach(doc => {
                const data = doc.data();
                seenWithdrawIds.add(doc.id);
                withdrawals.push({
                    id: doc.id,
                    withdrawId: doc.id,
                    userId: data.userId,
                    firstName: data.name || 'User',
                    status: data.status || 'pending',
                    ...data,
                    fiatWithdrawPending: data
                });
            });
        } catch(e) {
            console.warn("Warning fetching fiat_withdrawals:", e.message);
            if (ordersCache.data?.withdrawals) withdrawals = ordersCache.data.withdrawals;
        }

        // sort withdrawals safely by timestamp descending
        withdrawals.sort((a, b) => {
            const timeA = a.timestamp?._seconds ? a.timestamp._seconds * 1000 : (typeof a.timestamp === 'number' ? a.timestamp : (a.timestamp ? new Date(a.timestamp).getTime() : 0));
            const timeB = b.timestamp?._seconds ? b.timestamp._seconds * 1000 : (typeof b.timestamp === 'number' ? b.timestamp : (b.timestamp ? new Date(b.timestamp).getTime() : 0));
            return timeB - timeA;
        });

        const ordersResult = { buys, sells, withdrawals };
        ordersCache = { data: ordersResult, timestamp: now };
        res.json(ordersResult);
    } catch(e) {
        console.error("Admin orders error:", e.message);
        if (ordersCache.data) {
            return res.json(ordersCache.data);
        }
        res.json({ buys: [], sells: [], withdrawals: [] });
    }
});

app.post('/api/admin/approve-buy', async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) return res.status(400).json({ error: 'Order ID is required' });
        
        const buyRef = db.collection('miniapp_buys').doc(id);
        const doc = await buyRef.get();
        if(!doc.exists) return res.status(404).json({ error: 'Order not found' });
        
        const order = doc.data();
        if (order.status === 'completed') {
            return res.status(400).json({ error: 'Order is already completed.' });
        }

        let txResult = null;
        const gasFee = (order.asset === 'USDT') ? 0.008 : 0.0015;
        const netCryptoAmount = Math.max(0.0001, parseFloat(((order.amount || 0) - gasFee).toFixed(6)));

        if (order.asset === 'TON' || order.asset === 'GRAM') {
            try {
                txResult = await sendTonOnChain(order.receiveAddress, netCryptoAmount);
            } catch(txErr) {
                console.error("On-chain transfer failed:", txErr);
                return res.status(500).json({ error: `On-chain transfer failed: ${txErr.message}` });
            }
        } else if (order.asset === 'USDT') {
            try {
                txResult = await sendJettonUsdtOnChain(order.receiveAddress, netCryptoAmount);
            } catch(txErr) {
                console.error("On-chain USDT transfer failed:", txErr);
                return res.status(500).json({ error: `On-chain USDT transfer failed: ${txErr.message}` });
            }
        }
        
        await buyRef.update({ 
            status: 'completed',
            completedAt: FieldValue.serverTimestamp(),
            txResult: txResult || null
        });
        
        const sentOkMsg = `<b>💎 𝗧𝗥𝗨𝗦𝗧 𝗣𝗔𝗬 — ক্রিপ্টো ডেলিভারি সম্পন্ন!</b>\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n` +
            `✅ <b>স্ট্যাটাস:</b> <code>অন-চেইনে ট্রান্সফার সফল</code>\n` +
            `🏷 <b>ওয়ালেট:</b>\n<code>${order.receiveAddress}</code>\n` +
            `#️⃣ <b>TrxID:</b> <code>${order.trxId}</code>\n\n` +
            `<blockquote>📦 <b>ডেলিভারি:</b> <b>${order.amount} ${order.asset}</b></blockquote>\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n` +
            `🎉 <i>ক্রিপ্টো আপনার ওয়ালেটে জমা হয়েছে।</i>`;
        bot.sendMessage(order.userId, sentOkMsg, { parse_mode: 'HTML', ...appOpenMarkup }).catch(e => console.error(e.message));
        
        const config = botConfig || {};
        if (config.adminGroupId) {
            bot.sendMessage(config.adminGroupId, `✅ <b>Buy Order Completed!</b>\nUser: <code>${order.userId}</code>\nAsset: <b>${order.amount} ${order.asset}</b>\nWallet: <code>${order.receiveAddress}</code>\nTrxID: <code>${order.trxId}</code>`, { parse_mode: 'HTML' }).catch(e => console.error(e.message));
        }

        res.json({ success: true, message: `Successfully transferred ${order.amount} ${order.asset} and completed order.` });
    } catch(e) {
        console.error("Approve buy error:", e);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/admin/reject-buy', async (req, res) => {
    try {
        const { id, reason } = req.body;
        if (!id) return res.status(400).json({ error: 'Order ID is required' });
        
        const buyRef = db.collection('miniapp_buys').doc(id);
        const doc = await buyRef.get();
        if(!doc.exists) return res.status(404).json({ error: 'Order not found' });
        
        const order = doc.data();
        if (order.status === 'completed') {
            return res.status(400).json({ error: 'Cannot reject an already completed order.' });
        }
        if (order.status === 'rejected') {
            return res.status(400).json({ error: 'Order has already been rejected.' });
        }

        const refundBdt = parseFloat(order.totalBdt) || 0;
        
        await buyRef.update({
            status: 'rejected',
            rejectReason: reason || 'Rejected by admin',
            rejectedAt: FieldValue.serverTimestamp(),
            refundedBdt: refundBdt
        });

        if (refundBdt > 0 && order.userId) {
            const userRef = db.collection('users').doc(order.userId.toString());
            await userRef.set({
                balance: FieldValue.increment(refundBdt)
            }, { merge: true });
        }

        const buyRejectMsg = `<b>❌ 𝗧𝗥𝗨𝗦𝗧 𝗣𝗔𝗬 — বাই অর্ডার বাতিল ও রিফান্ড</b>\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n` +
            `ℹ️ <b>অর্ডার:</b> ${order.amount} ${order.asset} (<code>${order.trxId}</code>)\n\n` +
            `<blockquote>💰 <b>রিফান্ড পরিমাণ:</b> <b>৳${refundBdt} BDT</b></blockquote>\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n` +
            `🔄 <i>টাকাটি আপনার অ্যাপ ব্যালেন্সে রিফান্ড করা হয়েছে।</i>`;
        bot.sendMessage(order.userId, buyRejectMsg, { parse_mode: 'HTML', ...appOpenMarkup }).catch(e => console.error(e.message));

        const config = botConfig || {};
        if (config.adminGroupId) {
            bot.sendMessage(config.adminGroupId, `❌ <b>Buy Order Rejected!</b>\nUser: <code>${order.userId}</code>\nTrxID: <code>${order.trxId}</code>\nRefunded: <b>৳${refundBdt} BDT</b> to user balance.`, { parse_mode: 'HTML' }).catch(e => console.error(e.message));
        }

        res.json({ success: true, message: `Order rejected. ৳${refundBdt} BDT refunded to user ${order.userId}'s balance.` });
    } catch(e) {
        console.error("Reject buy error:", e);
        res.status(500).json({ error: e.message });
    }
});


app.post('/api/admin/bonus', async (req, res) => {
    try {
        let { username, amount } = req.body;
        if (!username || !amount) return res.status(400).json({ error: 'Missing username or amount' });
        username = username.replace('@', '');
        
        const snapshot = await db.collection('users').where('username', '==', username).limit(1).get();
        if (snapshot.empty) return res.status(404).json({ error: 'User not found' });
        
        const doc = snapshot.docs[0];
        const newBalance = (doc.data().balance || 0) + parseFloat(amount);
        await doc.ref.update({ balance: newBalance });
        
        const bonusMsg = `<b>🎉 𝗧𝗥𝗨𝗦𝗧 𝗣𝗔𝗬 — বোনাস প্রাপ্তি!</b>\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n` +
            `<blockquote>💰 <b>বোনাস পরিমাণ:</b> <b>৳${amount} BDT</b>\n` +
            `💳 <b>নতুন ব্যালেন্স:</b> <b>৳${newBalance.toFixed(2)} BDT</b></blockquote>\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n` +
            `🎁 <i>অ্যাডমিন আপনার অ্যাকাউন্টে বোনাস ব্যালেন্স যোগ করেছেন।</i>`;
        bot.sendMessage(doc.id, bonusMsg, { parse_mode: 'HTML', ...appOpenMarkup }).catch(e => console.error(e.message));
        res.json({ success: true, newBalance });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Admin User Management: Real-time Balance Add/Deduct
app.post('/api/admin/user/balance', async (req, res) => {
    try {
        const { userId, action, amount, reason } = req.body;
        if (!userId || !amount || !['add', 'deduct'].includes(action)) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        const delta = action === 'add' ? parseFloat(amount) : -parseFloat(amount);
        const userRef = db.collection('users').doc(userId.toString());
        const userDoc = await userRef.get();
        if (!userDoc.exists) return res.status(404).json({ error: "User not found" });

        const currentBalance = parseFloat(userDoc.data().balance || 0);
        const newBalance = Math.max(0, parseFloat((currentBalance + delta).toFixed(2)));

        await userRef.set({
            balance: newBalance,
            lastBalanceUpdate: FieldValue.serverTimestamp()
        }, { merge: true });

        // Invalidate stats cache so stats refresh instantly
        statsCache.timestamp = 0;

        // Send Telegram bot notification to the user
        if (bot) {
            const notifMsg = action === 'add' ?
                `<b>💰 𝗧𝗥𝗨𝗦𝗧 𝗣𝗔𝗬 — ব্যালেন্স যোগ হয়েছে!</b>\n` +
                `━━━━━━━━━━━━━━━━━━━━━━\n` +
                `<blockquote>➕ <b>যুক্ত করা টাকা:</b> <b>৳${parseFloat(amount).toFixed(2)} BDT</b>\n` +
                `💳 <b>বর্তমান ব্যালেন্স:</b> <b>৳${newBalance.toFixed(2)} BDT</b></blockquote>\n\n` +
                (reason ? `📝 <b>কারণ:</b> <i>${reason}</i>\n` : '') +
                `━━━━━━━━━━━━━━━━━━━━━━\n` +
                `🎉 <i>অ্যাডমিন আপনার ওয়ালেটে টাকা যোগ করেছেন।</i>` :
                `<b>📉 𝗧𝗥𝗨𝗦𝗧 𝗣𝗔𝗬 — ব্যালেন্স কর্তন করা হয়েছে!</b>\n` +
                `━━━━━━━━━━━━━━━━━━━━━━\n` +
                `<blockquote>➖ <b>কর্তন করা টাকা:</b> <b>৳${parseFloat(amount).toFixed(2)} BDT</b>\n` +
                `💳 <b>বর্তমান ব্যালেন্স:</b> <b>৳${newBalance.toFixed(2)} BDT</b></blockquote>\n\n` +
                (reason ? `📝 <b>কারণ:</b> <i>${reason}</i>\n` : '') +
                `━━━━━━━━━━━━━━━━━━━━━━\n` +
                `ℹ️ <i>অ্যাডমিন আপনার অ্যাকাউন্ট ব্যালেন্স সমন্বয় করেছেন।</i>`;
            bot.sendMessage(userId, notifMsg, { parse_mode: 'HTML', ...appOpenMarkup }).catch(() => {});
        }

        res.json({ success: true, newBalance, message: `Balance updated to ৳${newBalance} BDT` });
    } catch (e) {
        console.error("Admin balance update error:", e);
        res.status(500).json({ error: e.message });
    }
});

// Admin User Management: Ban, Unban, Restrict (with days)
app.post('/api/admin/user/status', async (req, res) => {
    try {
        const { userId, status, restrictionDays, reason } = req.body;
        if (!userId || !status) return res.status(400).json({ error: "Missing required fields" });

        const userRef = db.collection('users').doc(userId.toString());
        const userDoc = await userRef.get();
        if (!userDoc.exists) return res.status(404).json({ error: "User not found" });

        let updatePayload = {
            status: status, // 'active', 'banned', 'restricted'
            statusUpdatedAt: FieldValue.serverTimestamp()
        };

        if (status === 'restricted' && restrictionDays) {
            const until = new Date(Date.now() + parseInt(restrictionDays) * 24 * 60 * 60 * 1000);
            updatePayload.restrictedUntil = until.toISOString();
        } else if (status === 'active') {
            updatePayload.restrictedUntil = null;
        }

        await userRef.set(updatePayload, { merge: true });

        // Invalidate stats cache so stats refresh instantly
        statsCache.timestamp = 0;

        // Send Telegram bot notification
        if (bot) {
            let msg = '';
            if (status === 'banned') {
                msg = `<b>🚫 𝗧𝗥𝗨𝗦𝗧 𝗣𝗔𝗬 — অ্যাকাউন্ট স্থগিত (Banned)!</b>\n━━━━━━━━━━━━━━━━━━━━━━\n⚠️ আপনার অ্যাকাউন্টটি সাময়িকভাবে বন্ধ করা হয়েছে।\n${reason ? `📝 <b>কারণ:</b> <i>${reason}</i>\n` : ''}সহায়তার জন্য সাপোর্টে যোগাযোগ করুন।`;
            } else if (status === 'restricted') {
                msg = `<b>⚠️ 𝗧𝗥𝗨𝗦𝗧 𝗣𝗔𝗬 — অ্যাকাউন্ট রেস্ট্রিক্টেড!</b>\n━━━━━━━━━━━━━━━━━━━━━━\n⏱ আপনার অ্যাকাউন্টটি আগামী <b>${restrictionDays} দিনের জন্য</b> রেস্ট্রিক্ট করা হয়েছে।\n${reason ? `📝 <b>কারণ:</b> <i>${reason}</i>\n` : ''}`;
            } else if (status === 'active') {
                msg = `<b>✅ 𝗧𝗥𝗨𝗦𝗧 𝗣𝗔𝗬 — অ্যাকাউন্ট সক্রিয় (Active)!</b>\n━━━━━━━━━━━━━━━━━━━━━━\n🎉 আপনার অ্যাকাউন্টটি পুনরায় পুরোপুরি সক্রিয় করা হয়েছে। ধন্যবাদ!`;
            }
            if (msg) bot.sendMessage(userId, msg, { parse_mode: 'HTML', ...appOpenMarkup }).catch(() => {});
        }

        res.json({ success: true, status, message: `User status set to ${status}` });
    } catch (e) {
        console.error("Admin user status error:", e);
        res.status(500).json({ error: e.message });
    }
});

// In-memory cache for user avatars to protect Telegram API rate limits
const adminAvatarCache = new Map();

// Admin User Management: Fetch Telegram Profile Photo (JSON)
app.get('/api/admin/user-photo/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId || userId === '12345' || userId === '123456789' || !bot) {
            return res.json({ photoUrl: null });
        }
        
        const now = Date.now();
        if (adminAvatarCache.has(userId)) {
            const cached = adminAvatarCache.get(userId);
            if (cached.expireAt > now) {
                return res.json({ photoUrl: cached.url });
            }
        }

        const photos = await bot.getUserProfilePhotos(userId, { limit: 1 }).catch(() => null);
        if (photos && photos.total_count > 0 && photos.photos[0] && photos.photos[0].length > 0) {
            const bestPhoto = photos.photos[0][photos.photos[0].length - 1];
            const fileLink = await bot.getFileLink(bestPhoto.file_id).catch(() => null);
            if (fileLink) {
                adminAvatarCache.set(userId, { url: fileLink, expireAt: now + 3600000 });
                return res.json({ photoUrl: fileLink });
            }
        }
        adminAvatarCache.set(userId, { url: null, expireAt: now + 600000 });
        res.json({ photoUrl: null });
    } catch (e) {
        res.json({ photoUrl: null });
    }
});

// Admin User Management: Direct Image Avatar Redirect for <img> tags
app.get('/api/admin/user-avatar/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId || userId === '12345' || userId === '123456789' || !bot) {
            return res.status(404).send('No avatar');
        }

        const now = Date.now();
        if (adminAvatarCache.has(userId)) {
            const cached = adminAvatarCache.get(userId);
            if (cached.expireAt > now && cached.url) {
                return res.redirect(cached.url);
            }
        }

        const photos = await bot.getUserProfilePhotos(userId, { limit: 1 }).catch(() => null);
        if (photos && photos.total_count > 0 && photos.photos[0] && photos.photos[0].length > 0) {
            const bestPhoto = photos.photos[0][photos.photos[0].length - 1];
            const fileLink = await bot.getFileLink(bestPhoto.file_id).catch(() => null);
            if (fileLink) {
                adminAvatarCache.set(userId, { url: fileLink, expireAt: now + 3600000 });
                return res.redirect(fileLink);
            }
        }
        adminAvatarCache.set(userId, { url: null, expireAt: now + 600000 });
        return res.status(404).send('No avatar');
    } catch (e) {
        return res.status(404).send('No avatar');
    }
});

// MiniApp Profile Sync Endpoint (syncs telegram name, username, photo to db)
app.post('/api/miniapp/sync-profile', async (req, res) => {
    try {
        const { userId, username, firstName, lastName, photoUrl } = req.body;
        if (!userId || userId === 123456789) return res.json({ success: true });
        
        const updates = {
            chatId: userId.toString(),
            updatedAt: FieldValue.serverTimestamp()
        };
        if (username) updates.username = username;
        if (firstName) {
            updates.firstName = firstName;
            updates.first_name = firstName;
        }
        if (lastName) {
            updates.lastName = lastName;
            updates.last_name = lastName;
        }
        if (photoUrl) updates.photoUrl = photoUrl;

        await db.collection('users').doc(userId.toString()).set(updates, { merge: true });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/admin/limits', async (req, res) => {
    try {
        const { limit } = req.body;
        await db.collection('settings').doc('limits').set({ dailyWithdrawLimit: parseInt(limit) }, { merge: true });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/admin/limits', async (req, res) => {
    try {
        const doc = await db.collection('settings').doc('limits').get();
        res.json({ limit: doc.exists ? doc.data().dailyWithdrawLimit : 9999 });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/admin/approve-withdraw', async (req, res) => {
    try {
        const { userId, id, withdrawId } = req.body;
        const targetId = withdrawId || id;
        let targetUser = userId;
        
        // Update in fiat_withdrawals if id provided
        if (targetId) {
            try {
                const fwRef = db.collection('fiat_withdrawals').doc(targetId);
                const fwDoc = await fwRef.get();
                if (fwDoc.exists) {
                    if (!targetUser) targetUser = fwDoc.data().userId;
                    await fwRef.update({
                        status: 'completed',
                        completedAt: Date.now()
                    });
                }
            } catch(e) {}
        }

        if (targetUser) {
            const userRef = db.collection('users').doc(targetUser.toString());
            const doc = await userRef.get();
            if(doc.exists) {
                const pend = doc.data()?.fiatWithdrawPending;
                await userRef.update({
                    'fiatWithdrawPending.status': 'completed',
                    'fiatWithdrawPending.completedAt': Date.now()
                });
                const userMsg = `<b>💸 𝗧𝗥𝗨𝗦𝗧 𝗣𝗔𝗬 — উইথড্র সম্পন্ন!</b>\n` +
                    `━━━━━━━━━━━━━━━━━━━━━━\n` +
                    `✅ <b>স্ট্যাটাস:</b> <code>পেমেন্ট সফলভাবে পাঠানো হয়েছে</code> 💸\n` +
                    `🏦 <b>মাধ্যম:</b> <b>${(pend?.method || 'bKash').toUpperCase()}</b> (<code>${pend?.number || ''}</code>)\n\n` +
                    `<blockquote>💵 <b>উত্তোলনের পরিমাণ:</b> ৳${pend?.amount || 0} BDT\n` +
                    `📉 <b>সার্ভিস ফি:</b> ৳${pend?.fee || 0} BDT\n` +
                    `📦 <b>প্রাপ্য টাকা:</b> <b>৳${pend?.receiveAmount || pend?.amount || 0} BDT</b></blockquote>\n\n` +
                    `━━━━━━━━━━━━━━━━━━━━━━\n` +
                    `🎉 <i>আপনার একাউন্ট চেক করুন। TrustPay-এর সাথে থাকার জন্য ধন্যবাদ!</i>`;
                bot.sendMessage(targetUser, userMsg, { parse_mode: 'HTML', ...appOpenMarkup }).catch(e => console.error(e.message));
                
                await notifyPayoutGroup({
                    type: 'fiat',
                    userId: targetUser,
                    name: pend?.name || doc.data()?.first_name || 'User',
                    amount: pend?.amount || 0,
                    receiveAmount: pend?.receiveAmount || pend?.amount || 0,
                    method: pend?.method || 'bKash',
                    number: pend?.number || ''
                });
            }

            try {
                const pendSnaps = await db.collection('fiat_withdrawals')
                    .where('userId', 'in', [parseInt(targetUser), targetUser.toString()].filter(Boolean))
                    .where('status', '==', 'pending').get();
                for (const d of pendSnaps.docs) {
                    await d.ref.update({ status: 'completed', completedAt: Date.now() }).catch(()=>{});
                }
            } catch(e) {}
        }
        res.json({ success: true });
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/admin/reject-withdraw', async (req, res) => {
    try {
        const { userId, id, withdrawId, reason, refundAmt: reqRefund } = req.body;
        const targetId = withdrawId || id;
        if (!userId && !targetId) return res.status(400).json({ error: 'User ID or Withdrawal ID is required' });
        
        let refundAmt = parseFloat(reqRefund) || 0;
        let targetUser = userId;

        if (targetId) {
            try {
                const fwRef = db.collection('fiat_withdrawals').doc(targetId);
                const fwDoc = await fwRef.get();
                if (fwDoc.exists) {
                    const fwData = fwDoc.data();
                    if (!targetUser) targetUser = fwData.userId;
                    if (!refundAmt) refundAmt = parseFloat(fwData.amount) || 0;
                    await fwRef.update({
                        status: 'rejected',
                        rejectReason: reason || 'Rejected by admin',
                        rejectedAt: Date.now()
                    });
                }
            } catch(e) {}
        }
        
        if (targetUser) {
            const userRef = db.collection('users').doc(targetUser.toString());
            const doc = await userRef.get();
            if(doc.exists) {
                const data = doc.data();
                if (!refundAmt && data.fiatWithdrawPending) {
                    refundAmt = parseFloat(data.fiatWithdrawPending.amount) || 0;
                }
                await userRef.update({
                    'fiatWithdrawPending.status': 'rejected',
                    'fiatWithdrawPending.rejectReason': reason || 'Rejected by admin',
                    'fiatWithdrawPending.rejectedAt': Date.now(),
                    balance: FieldValue.increment(refundAmt)
                });
                const userRejectMsg = `<b>❌ 𝗧𝗥𝗨𝗦𝗧 𝗣𝗔𝗬 — উইথড্র বাতিল ও রিফান্ড</b>\n` +
                    `━━━━━━━━━━━━━━━━━━━━━━\n` +
                    `ℹ️ <b>কারণ:</b> <i>${reason || 'অ্যাকাউন্ট তথ্যে ভুল'}</i>\n\n` +
                    `<blockquote>💰 <b>রিফান্ড পরিমাণ:</b> <b>৳${refundAmt} BDT</b></blockquote>\n\n` +
                    `━━━━━━━━━━━━━━━━━━━━━━\n` +
                    `🔄 <i>টাকাটি আপনার অ্যাপ ব্যালেন্সে ফেরত দেওয়া হয়েছে। তথ্য যাচাই করে আবার চেষ্টা করুন।</i>`;
                bot.sendMessage(targetUser, userRejectMsg, { parse_mode: 'HTML', ...appOpenMarkup }).catch(e => console.error(e.message));
            }

            try {
                const pendSnaps = await db.collection('fiat_withdrawals')
                    .where('userId', 'in', [parseInt(targetUser), targetUser.toString()].filter(Boolean))
                    .where('status', '==', 'pending').get();
                for (const d of pendSnaps.docs) {
                    await d.ref.update({ status: 'rejected', rejectReason: reason || 'Rejected by admin', rejectedAt: Date.now() }).catch(()=>{});
                }
            } catch(e) {}
        }
        
        invalidateOrdersCache();
        res.json({ success: true, message: `Withdrawal rejected and ৳${refundAmt} refunded to user.` });
    } catch(e) {
        console.error("Reject withdraw error:", e);
        res.status(500).json({ error: e.message });
    }
});



app.post('/api/admin/create-mock-trx', async (req, res) => {
    try {
        let { trxId, amount, method } = req.body;
        if (!trxId || !amount) return res.status(400).json({ error: "Missing TrxID or Amount" });
        
        trxId = trxId.toString().trim().toUpperCase();
        const parsedAmount = parseFloat(amount);
        const selectedMethod = (method || 'bKash').toLowerCase();

        const fakeSms = selectedMethod === 'nagad'
            ? `You have received Tk ${parsedAmount.toFixed(2)} from 01878580320. Fee Tk 0.00. Balance Tk 5,420.50. TxnID ${trxId} at ${new Date().toLocaleString()}`
            : `You have received Tk ${parsedAmount.toFixed(2)} from 01752561935. Fee Tk 0.00. Balance Tk 5,420.50. TrxID ${trxId} at ${new Date().toLocaleString()}`;
        
        // 1. ALWAYS register in in-memory store first so mock creation ALWAYS succeeds
        const mockItem = {
            id: trxId,
            trxId: trxId,
            sender: selectedMethod,
            message: fakeSms,
            amount: parsedAmount,
            claimed: false,
            timestamp: new Date()
        };
        inMemoryVerifiedTrx.set(trxId, mockItem);
        inMemoryMockTrxs.unshift(mockItem);
        if (inMemoryMockTrxs.length > 50) inMemoryMockTrxs.pop();

        let autoVerified = false;

        // 2. Try Firestore persistence gracefully without failing if quota is exceeded
        try {
            const buyRef = db.collection('miniapp_buys').doc(trxId);
            const buyDoc = await buyRef.get();

            if (buyDoc.exists) {
                const order = buyDoc.data();
                if (order.status === 'pending') {
                    await buyRef.update({ 
                        status: 'verified',
                        autoVerified: true
                    });
                    autoVerified = true;
                    mockItem.claimed = true;
                    mockItem.claimedBy = order.userId;
                    
                    await db.collection('verified_trx').doc(trxId).set({
                        sender: selectedMethod,
                        message: fakeSms,
                        amount: parsedAmount,
                        claimed: true,
                        claimedBy: order.userId,
                        timestamp: FieldValue.serverTimestamp()
                    });

                    if (bot && order.userId) {
                        const mockVerMsg = `<b>⚡ 𝗧𝗥𝗨𝗦𝗧 𝗣𝗔𝗬 — পেমেন্ট ভেরিফাইড (মক টেস্ট)</b>\n` +
                            `━━━━━━━━━━━━━━━━━━━━━━\n` +
                            `✅ <b>স্ট্যাটাস:</b> <code>অটো ভেরিফাইড</code> ⚡\n` +
                            `📦 <b>অর্ডার:</b> <b>${order.amount} ${order.asset}</b> (TrxID: <code>${trxId}</code>)\n\n` +
                            `<blockquote>💵 <b>পরিশোধিত টাকা:</b> <b>৳${order.totalBdt} BDT</b></blockquote>\n\n` +
                            `━━━━━━━━━━━━━━━━━━━━━━\n` +
                            `⏳ <i>অ্যাডমিন শীঘ্রই আপনার ওয়ালেটে অ্যাসেট পাঠিয়ে দিচ্ছেন।</i>`;
                        bot.sendMessage(order.userId, mockVerMsg, { parse_mode: 'HTML', ...appOpenMarkup }).catch(e => console.error(e.message));
                    }

                    const config = botConfig || {};
                    if (config.adminGroupId) {
                        const mockMsg = `<blockquote><b>⚡ Buy Order Auto-Verified (Mock Test)!</b></blockquote>\n\n👤 User: <code>${order.userId}</code>\n💰 Asset: <b>${order.amount} ${order.asset}</b>\n💵 Paid: <b>৳${order.totalBdt} BDT</b>\n#️⃣ TrxID: <code>${trxId}</code>\n🏷 Wallet: <code>${order.receiveAddress}</code>\n\n⚙️ <b>Actions (Reply to this message):</b>\n- <code>ok</code> or <code>accept</code> to send ${order.asset} on-chain\n- <code>reject</code> to refund ৳${order.totalBdt} to user balance`;
                        bot.sendMessage(config.adminGroupId, mockMsg, { parse_mode: 'HTML' }).catch(e => console.error(e.message));
                    }
                }
            }

            if (!autoVerified) {
                await db.collection('verified_trx').doc(trxId).set({
                    sender: selectedMethod,
                    message: fakeSms,
                    amount: parsedAmount,
                    claimed: false,
                    timestamp: FieldValue.serverTimestamp()
                });
            }
        } catch (fsErr) {
            console.warn("Firestore sync warning in create-mock-trx (in-memory mock active):", fsErr.message);
        }
        
        return res.json({ 
            success: true, 
            message: `Mock TrxID ${trxId} (${parsedAmount} TK) created successfully!`,
            trxId,
            amount: parsedAmount,
            autoVerified,
            fakeSms
        });
    } catch(e) {
        console.error("Mock Trx Error:", e);
        return res.json({ 
            success: true, 
            message: `Mock TrxID created (memory fallback)`,
            trxId: req.body?.trxId,
            amount: req.body?.amount
        });
    }
});

app.get('/api/admin/mock-trxs', async (req, res) => {
    let list = [...inMemoryMockTrxs];
    try {
        const snap = await db.collection('verified_trx').orderBy('timestamp', 'desc').limit(20).get();
        const dbList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const seen = new Set();
        const merged = [];
        for (const item of list) {
            const id = item.trxId || item.id;
            if (id && !seen.has(id)) {
                seen.add(id);
                merged.push(item);
            }
        }
        for (const item of dbList) {
            if (item.id && !seen.has(item.id)) {
                seen.add(item.id);
                merged.push(item);
            }
        }
        return res.json({ success: true, list: merged.slice(0, 30) });
    } catch(e) {
        console.warn("Firestore warning in /api/admin/mock-trxs:", e.message);
        return res.json({ success: true, list });
    }
});

app.post('/api/settings', async (req, res) => {
    try {
        await saveConfig(req.body);
        res.json({ success: true, message: 'Deployed!' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// Serve Admin Frontend

// Serve MiniApp on /app with anti-cache headers for HTML
app.use('/app', (req, res, next) => {
    if (req.path === '/' || req.path === '' || req.path.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
    next();
});
app.use('/app', express.static(path.join(__dirname, 'miniapp/dist'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        } else {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
    }
}));

app.get('/api/miniapp/history/:userId', async (req, res) => {
    try {
        const rawUserId = req.params.userId;
        const numUserId = parseInt(rawUserId);
        const strUserId = rawUserId.toString();
        const userIds = [numUserId, strUserId].filter(Boolean);
        
        const history = [];

        // Parallelize all 5 Firestore queries for high-speed mobile data loading
        const [buysRes, sellsRes, depRes, withRes, userDocRes] = await Promise.allSettled([
            db.collection('miniapp_buys').where('userId', 'in', userIds).get(),
            db.collection('miniapp_sells').where('userId', 'in', userIds).get(),
            db.collection('deposits').where('userId', 'in', userIds).get(),
            db.collection('fiat_withdrawals').where('userId', 'in', userIds).get(),
            db.collection('users').doc(strUserId).get()
        ]);

        // 1. Miniapp Buys & Add Money
        if (buysRes.status === 'fulfilled' && buysRes.value) {
            buysRes.value.forEach(doc => {
                const data = doc.data();
                history.push({ 
                    id: doc.id, 
                    type: data.type || 'buy', 
                    ...data 
                });
            });
        }

        // 2. Miniapp Sells
        if (sellsRes.status === 'fulfilled' && sellsRes.value) {
            sellsRes.value.forEach(doc => {
                const data = doc.data();
                history.push({ 
                    id: doc.id, 
                    type: 'sell', 
                    ...data 
                });
            });
        }

        // 3. Deposits collection (if not already captured)
        if (depRes.status === 'fulfilled' && depRes.value) {
            depRes.value.forEach(doc => {
                if (!history.some(h => h.id === doc.id || h.trxId === doc.id)) {
                    const data = doc.data();
                    history.push({
                        id: doc.id,
                        type: 'add_money',
                        amount: data.amount,
                        paymentMethod: data.paymentMethod,
                        trxId: data.trxId || doc.id,
                        status: data.status || 'completed',
                        timestamp: data.timestamp || Date.now()
                    });
                }
            });
        }

        // 4. Fiat Withdrawals collection
        if (withRes.status === 'fulfilled' && withRes.value) {
            withRes.value.forEach(doc => {
                const data = doc.data();
                history.push({
                    id: doc.id,
                    type: 'withdraw',
                    asset: 'BDT',
                    amount: data.amount,
                    fee: data.fee,
                    receiveAmount: data.receiveAmount,
                    method: data.method,
                    number: data.number,
                    status: data.status || 'pending',
                    rejectReason: data.rejectReason || '',
                    timestamp: data.timestamp || data.createdAt || Date.now()
                });
            });
        }

        // 5. Check and sync user's fiatWithdrawPending (Self-healing!)
        if (userDocRes.status === 'fulfilled' && userDocRes.value && userDocRes.value.exists) {
            const userDoc = userDocRes.value;
            if (userDoc.data().fiatWithdrawPending) {
                const p = userDoc.data().fiatWithdrawPending;
                const existing = history.find(h => h.type === 'withdraw' && (h.id === p.id || (p.serial && h.serial === p.serial)));
                if (existing) {
                    if (p.status && p.status !== 'pending') {
                        existing.status = p.status;
                        if (p.rejectReason) existing.rejectReason = p.rejectReason;
                        if (p.id) {
                            db.collection('fiat_withdrawals').doc(p.id).update({
                                status: p.status,
                                ...(p.rejectReason ? { rejectReason: p.rejectReason } : {})
                            }).catch(()=>{});
                        }
                    }
                } else {
                    history.push({
                        id: p.id || 'legacy_withdraw',
                        type: 'withdraw',
                        asset: 'BDT',
                        amount: p.amount,
                        fee: p.fee,
                        receiveAmount: p.receiveAmount,
                        method: p.method,
                        number: p.number,
                        status: p.status || 'pending',
                        rejectReason: p.rejectReason || '',
                        timestamp: p.timestamp || Date.now()
                    });
                }

                // If userDoc says completed or rejected, heal any leftover 'pending' in history
                if (p.status === 'completed' || p.status === 'rejected') {
                    history.forEach(h => {
                        if (h.type === 'withdraw' && h.status === 'pending') {
                            h.status = p.status;
                            if (p.rejectReason) h.rejectReason = p.rejectReason;
                            if (h.id) {
                                db.collection('fiat_withdrawals').doc(h.id).update({
                                    status: p.status,
                                    ...(p.rejectReason ? { rejectReason: p.rejectReason } : {})
                                }).catch(()=>{});
                            }
                        }
                    });
                }
            }
        }
        
        history.sort((a, b) => {
            const getTime = (item) => {
                if (!item) return 0;
                if (item.timestamp?._seconds) return item.timestamp._seconds * 1000;
                if (item.timestamp?.toMillis) return item.timestamp.toMillis();
                if (typeof item.timestamp === 'number') return item.timestamp;
                if (item.timestamp) return new Date(item.timestamp).getTime();
                return 0;
            };
            return getTime(b) - getTime(a);
        });
        
        res.json({ success: true, history });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/miniapp/support', async (req, res) => {
    try {
        const { userId, name, username, message } = req.body;
        if (!message || !message.trim()) {
            return res.status(400).json({ error: 'মেসেজ খালি হতে পারে না (Message cannot be empty)' });
        }

        const trimmedMsg = message.trim();
        const ticketRef = await db.collection('support_tickets').add({
            userId: userId || 'Anonymous',
            name: name || 'User',
            username: username || '',
            message: trimmedMsg,
            status: 'open',
            timestamp: FieldValue.serverTimestamp()
        });

        const config = botConfig || {};
        const supportGroup = config.supportGroupId || config.adminGroupId || 8799135330;

        const safeMsg = trimmedMsg.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const adminAlert = `<blockquote><b>🎧 নতুন কাস্টমার সাপোর্ট মেসেজ (Customer Support)</b>\n\n` +
            `👤 <b>ইউজার:</b> <b>${name || 'User'}</b> ${username ? '(@' + username + ')' : ''}\n` +
            `🆔 <b>User ID:</b> <code>${userId || 'N/A'}</code>\n` +
            `🎫 <b>Ticket ID:</b> <code>${ticketRef.id}</code>\n\n` +
            `💬 <b>মেসেজ / সমস্যা:</b>\n` +
            `${safeMsg}</blockquote>\n\n` +
            `<i>👉 ইউজারের কাছে উত্তর পাঠাতে সরাসরি এই মেসেজে রিপ্লাই (Reply) দিন।</i>`;

        if (bot) {
            bot.sendMessage(supportGroup, adminAlert, { parse_mode: 'HTML' }).catch(err => {
                console.error("Support Telegram alert error:", err.message);
            });
        }

        res.json({ 
            success: true, 
            message: 'আপনার সাপোর্ট রিকোয়েস্ট সফলভাবে পাঠানো হয়েছে!',
            ticketId: ticketRef.id 
        });
    } catch (e) {
        console.error("Support API error:", e);
        res.status(500).json({ error: e.message });
    }
});

app.use('/app', (req, res) => {
    const p = path.join(__dirname, 'miniapp/dist/index.html');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    if (fs.existsSync(p)) res.sendFile(p);
    else res.send("MiniApp is not built yet.");
});

// Serve Admin on / with anti-cache headers for HTML
app.use(express.static(path.join(__dirname, 'admin/dist'), {
    maxAge: '1d',
    etag: true,
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        }
    }
}));
app.use((req, res) => {
    const p = path.join(__dirname, 'admin/dist/index.html');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    if (fs.existsSync(p)) res.sendFile(p);
    else res.send("Backend is running!");
});



// --- BSC USDT Auto-Verification Polling ---
const bscProvider = new ethers.JsonRpcProvider('https://bsc.publicnode.com');
const usdtAddress = '0x55d398326f99059fF775485246999027B3197955';
const botAddr = process.env.BOT_EVM_ADDRESS || process.env.BEP20_ADDRESS;

let lastBlockChecked = 0;

setInterval(async () => {
    try {
        const activeUsers = Object.keys(userStates).filter(chatId => 
            userStates[chatId].step === 'awaiting_bep20_auto' && 
            userStates[chatId].bep20Timer > Date.now()
        );
        
        if (activeUsers.length === 0) return; // Nobody waiting
        
        const currentBlock = await bscProvider.getBlockNumber();
        if (lastBlockChecked === 0) lastBlockChecked = currentBlock - 200; // Check last 200 blocks initially
        if (lastBlockChecked >= currentBlock) return;
        
        const filter = {
            address: usdtAddress,
            topics: [
                ethers.id('Transfer(address,address,uint256)'),
                null,
                ethers.zeroPadValue(botAddr, 32)
            ],
            fromBlock: lastBlockChecked,
            toBlock: currentBlock
        };
        
        const logs = await bscProvider.getLogs(filter);
        lastBlockChecked = currentBlock;
        
        for (const log of logs) {
            const amountReceived = parseFloat(ethers.formatUnits(log.data, 18));
            
            // Find user who is expecting this exact amount
            for (const chatId of activeUsers) {
                const expected = userStates[chatId].expectedUsdt;
                // Allow a tiny floating point tolerance
                if (Math.abs(amountReceived - expected) < 0.0001) {
                    // Match found!
                    userStates[chatId].step = 'awaiting_ton_address';
                    const lang = userStates[chatId].language || 'bn';
                    db.collection('users').doc(chatId.toString()).set({ status: 'verified' }, { merge: true });
                    
                    const msgText = lang === 'bn' 
            ? `✅ *Admin আপনার পেমেন্ট ম্যানুয়ালি অ্যাপ্রুভ করেছে!*

আপনার পেমেন্ট রিসিভ করতে এখন আপনার *TON Address* দিন:` 
            : `✅ *Admin has manually approved your payment!*

To receive your payout, please send your *TON Address* now:`;
                        
                    bot.sendMessage(chatId, msgText, { parse_mode: 'Markdown' }).catch(e => console.error(e.message));
                    
                    // Clear state
                    delete userStates[chatId].expectedUsdt;
                    delete userStates[chatId].bep20Timer;
                }
            }
        }
        
        // Notify expired users
        for (const chatId of Object.keys(userStates)) {
            if (userStates[chatId].step === 'awaiting_bep20_auto' && userStates[chatId].bep20Timer <= Date.now()) {
                const lang = userStates[chatId].language || 'bn';
                bot.sendMessage(chatId, lang === 'bn' ? "❌ **টাইমআউট!** ৫ মিনিট পার হয়ে গেছে। আবার চেষ্টা করতে মেনু থেকে অপশন বেছে নিন।" : "❌ **Timeout!** 5 minutes have passed. Please select an option from the menu to try again.", { parse_mode: 'Markdown' }).catch(e => console.error(e.message));
                userStates[chatId].step = 'menu';
                delete userStates[chatId].expectedUsdt;
                delete userStates[chatId].bep20Timer;
            }
        }
        
    } catch (e) {
        console.error("BSC Polling Error:", e.message);
    }
}, 15000); // Check every 15 seconds

const PORT = process.env.PORT || 3000; app.listen(PORT, () => { console.log('Server on ' + PORT); });


// Bot Wallet Commands for Admin
bot.onText(/\/msg (\d+) ([\s\S]+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const config = botConfig;
    if (config.adminGroupId !== chatId.toString()) return;

    const targetId = match[1];
    const textToSend = match[2];

    try {
        await bot.sendMessage(targetId, "?? **???????? ???? ?????:**\n\n" + textToSend, { parse_mode: 'Markdown' }).catch(e => console.error(e.message));
        bot.sendMessage(chatId, "? ??????? ??????? " + targetId + " ?????? ?????? ??????").catch(e => console.error(e.message));
    } catch(e) {
        bot.sendMessage(chatId, "? ????? ?????? ?????! ???? ????? ???? ???? ??? ?????? ???? ???? ????").catch(e => console.error(e.message));
    }
});

bot.onText(/\/wallet/, async (msg) => {
    const chatId = msg.chat.id;
    const config = await db.collection('config').doc('main').get();
    const adminGroupId = config.exists ? config.data().adminGroupId : null;
    if (chatId.toString() !== adminGroupId) return;

    try {
        const botWallet = await getOrCreateBotWallet();
        
        // Fetch balance from TonAPI
        const res = await axios.get(`https://tonapi.io/v2/accounts/${process.env.BOT_TON_ADDRESS}`);
        const tonBalance = (res.data.balance / 1e9).toFixed(4);
        
        // Fetch USDT balance
        let usdtBalance = '0.00';
        try {
            const jettonRes = await axios.get(`https://tonapi.io/v2/accounts/${process.env.BOT_TON_ADDRESS}/jettons/EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs`);
            if (jettonRes.data && jettonRes.data.balance) {
                usdtBalance = (parseFloat(jettonRes.data.balance) / 1e6).toFixed(2);
            }
        } catch(e) {}

        const text = `🏦 *Admin Treasury Wallet*\n\n🏷 Address: \`${botWallet.address}\`\n💎 Balance: **${tonBalance} TON**\n💵 USDT: **${usdtBalance} USDT**`;
        
        bot.sendMessage(chatId, text, { parse_mode: 'Markdown' }).catch(e => console.error(e.message));
    } catch(e) {
        bot.sendMessage(chatId, "Error fetching wallet: " + e.message).catch(e => console.error(e.message));
    }
});

// ============================================================
// WITHDRAW MANAGER BOT  (Dedicated Admin Helper Bot)
// Token: 8965853759:AAHdAas87oEfVY_fbqAdb9KXF3vHj6ECLGY
// ============================================================
// Features:
// 1. Presents pending cashout requests one-by-one in serial order
// 2. Exact format: "<number> <receiveAmount>" (e.g. 01752561935 490)
// 3. One-tap copyable text block and copy button
// 4. When Confirm is clicked:
//    - Previous message is DELETED immediately
//    - Request is marked completed in Firestore
//    - User is notified in Telegram
//    - Proof receipt is posted to payout channel (@bd_trust_pay_payout)
//    - Next pending request automatically appears
// 5. When Reject is clicked:
//    - Previous message is DELETED immediately
//    - User is refunded their BDT balance in Firestore
//    - Next pending request automatically appears
// 6. Fee Policy: 20-30 BDT has 0 fee; >30 BDT has tiered fee
// ============================================================

const WITHDRAW_BOT_TOKEN = '8965853759:AAHdAas87oEfVY_fbqAdb9KXF3vHj6ECLGY';

// Fee calculator: <=30 BDT is 0 fee; >30 BDT uses tiered fee
const calcWithdrawFee = (amt) => {
    const a = parseFloat(amt) || 0;
    if (a <= 0 || a <= 30) return 0; // 20-30 BDT no fee (per user instruction)
    if (a >= 1500) return 30;
    if (a > 1000) return 20;
    if (a > 500) return 10;
    if (a > 100) return 7;
    return 5;
};

// Format amount to avoid trailing .00 if integer
const formatSendAmount = (val) => {
    const num = parseFloat(val) || 0;
    return (num % 1 === 0) ? num.toFixed(0) : num.toFixed(2);
};

// Strict Bangladeshi phone number formatter - ALWAYS preserves/prepends leading 0 (01...)
const formatBdPhone = (num) => {
    if (!num) return '01XXXXXXXXX';
    let s = String(num).trim().replace(/[^\d+]/g, '');
    if (s.startsWith('+88')) s = s.slice(3);
    if (s.startsWith('88')) s = s.slice(2);
    if (s.length === 10 && !s.startsWith('0')) {
        s = '0' + s;
    }
    if (!s.startsWith('0') && s.length < 11) {
        s = '0' + s;
    }
    return s;
};

let withdrawBot;
try {
    withdrawBot = new TelegramBot(WITHDRAW_BOT_TOKEN, { polling: true });
    console.log('[WithdrawBot] ✓ Withdraw Manager Bot started successfully');

    withdrawBot.setMyCommands([
        { command: 'withdraw', description: 'ক্যাশআউট সিরিয়াল অনুযায়ী শুরু করুন' },
        { command: 'list', description: 'সকল পেন্ডিং রিকোয়েস্টের তালিকা' },
        { command: 'help', description: 'সাহায্য ও নিয়মাবলী' }
    ]).catch(() => {});
} catch(e) {
    console.error('[WithdrawBot] ✗ Failed to start Withdraw Bot:', e.message);
}

// In-memory navigation index
let withdrawQueueIndex = 0;

// Persistent keyboard with clean text
const adminReplyKeyboard = {
    keyboard: [
        [{ text: 'Withdraw Requests' }]
    ],
    resize_keyboard: true,
    persistent: true
};

// Fetch pending withdrawals from Firestore
const fetchPendingWithdrawals = async () => {
    const results = [];
    const seenIds = new Set();

    try {
        // Query without composite orderBy to avoid Firestore index requirement error
        const fwSnap = await db.collection('fiat_withdrawals')
            .where('status', '==', 'pending')
            .get();

        fwSnap.forEach(doc => {
            const d = doc.data();
            const id = doc.id;
            if (seenIds.has(id)) return;
            seenIds.add(id);

            const amount = parseFloat(d.amount) || 0;
            const fee = amount <= 30 ? 0 : ((d.fee !== undefined && d.fee !== null) ? parseFloat(d.fee) : calcWithdrawFee(amount));
            const receiveAmount = amount <= 30 ? amount : (d.receiveAmount ? parseFloat(d.receiveAmount) : (amount - fee));

            results.push({
                docId: id,
                userId: String(d.userId || ''),
                method: d.method || 'bKash',
                number: d.number || 'N/A',
                amount,
                fee,
                receiveAmount,
                name: d.name || 'User',
                serial: d.serial || '?',
                createdAt: d.createdAt || (d.timestamp?._seconds ? d.timestamp._seconds * 1000 : (typeof d.timestamp === 'number' ? d.timestamp : 0)) || 0,
                source: 'fiat_withdrawals'
            });
        });
    } catch(e) {
        console.error('[WithdrawBot] fiat_withdrawals fetch error:', e.message);
    }

    try {
        const usersSnap = await db.collection('users').get();
        usersSnap.forEach(doc => {
            const data = doc.data();
            if (!data.fiatWithdrawPending) return;
            const p = data.fiatWithdrawPending;
            if (p.status && p.status !== 'pending') return;
            const pendId = p.id || doc.id;
            if (seenIds.has(pendId)) return;
            seenIds.add(pendId);

            const amount = parseFloat(p.amount) || 0;
            const fee = amount <= 30 ? 0 : ((p.fee !== undefined && p.fee !== null) ? parseFloat(p.fee) : calcWithdrawFee(amount));
            const receiveAmount = amount <= 30 ? amount : (p.receiveAmount ? parseFloat(p.receiveAmount) : (amount - fee));

            results.push({
                docId: pendId,
                userId: doc.id,
                method: p.method || 'bKash',
                number: p.number || 'N/A',
                amount,
                fee,
                receiveAmount,
                name: p.name || data.first_name || 'User',
                serial: p.serial || '?',
                createdAt: p.createdAt || (p.timestamp ? (typeof p.timestamp === 'number' ? p.timestamp : new Date(p.timestamp).getTime()) : 0) || 0,
                source: 'users'
            });
        });
    } catch(e) {
        console.error('[WithdrawBot] users fetch error:', e.message);
    }

    // Sort chronologically (earliest first - FIFO)
    results.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

    return results;
};

// Build the message card with copyable code and clean icon buttons (NO colorful emojis)
const buildWithdrawCard = (w, index, total) => {
    const formattedNumber = formatBdPhone(w.number);
    const formattedSend = formatSendAmount(w.receiveAmount);
    const feeText = w.fee > 0 ? `\n• <b>ফি:</b> ৳${w.fee.toFixed(2)} BDT` : '\n• <b>ফি:</b> ৳০ (সম্পূর্ণ ফ্রি)';
    const copyString = `${formattedNumber} ${formattedSend}`;

    const msgText = 
`<blockquote><b>ক্যাশআউট রিকোয়েস্ট (${index + 1}/${total})</b></blockquote>

• <b>গ্রাহক:</b> ${w.name} (<code>${w.userId}</code>)
• <b>মেথড:</b> <b>${w.method?.toUpperCase()}</b>
• <b>নম্বর:</b> <code>${formattedNumber}</code>
• <b>রিকোয়েস্ট:</b> ৳${w.amount.toFixed(2)} BDT${feeText}
• <b>পাঠাবেন:</b> <b>৳${formattedSend} BDT</b>
• <b>সিরিয়াল:</b> #${w.serial}

━━━━━━━━━━━━━━━━━━
<b>কপি করতে চাপুন:</b>
<code>${copyString}</code>
━━━━━━━━━━━━━━━━━━
👆 <i>কোডে চাপ দিলে "${copyString}" কপি হবে।</i>`;

    const keyboard = {
        inline_keyboard: [
            [
                { text: `⎘ ${copyString}`, copy_text: { text: copyString } }
            ],
            [
                { text: `✓ Confirm (৳${formattedSend})`, callback_data: `wd_confirm:${w.docId}:${w.userId}` }
            ],
            [
                { text: `✕ Reject & Refund`, callback_data: `wd_reject:${w.docId}:${w.userId}:${w.amount}` }
            ],
            [
                { text: `➔ Next (${index + 1}/${total})`, callback_data: `wd_next` },
                { text: `⟳ Refresh`, callback_data: `wd_refresh` }
            ]
        ]
    };

    return { msgText, keyboard, copyString };
};

// Approve a withdrawal in Firestore, notify user & payout channel
const doApproveWithdraw = async (docId, userId) => {
    const targetUser = String(userId);
    let withdrawItem = null;

    try {
        const fwRef = db.collection('fiat_withdrawals').doc(docId);
        const fwDoc = await fwRef.get();
        if (fwDoc.exists) {
            withdrawItem = fwDoc.data();
            await fwRef.update({ status: 'completed', completedAt: Date.now() });
        }
    } catch(e) {
        console.error('[WithdrawBot] approve doc error:', e.message);
    }

    try {
        const userRef = db.collection('users').doc(targetUser);
        const doc = await userRef.get();
        if (doc.exists) {
            const userData = doc.data();
            if (!withdrawItem) {
                withdrawItem = userData?.fiatWithdrawPending;
            }
            if (userData?.fiatWithdrawPending?.id === docId || !userData?.fiatWithdrawPending?.id) {
                await userRef.update({
                    'fiatWithdrawPending.status': 'completed',
                    'fiatWithdrawPending.completedAt': Date.now()
                });
            }
        }
    } catch(e) {
        console.error('[WithdrawBot] approve user error:', e.message);
    }

    if (withdrawItem && bot) {
        const userMsg = `<b>💸 𝗧𝗥𝗨𝗦𝗧 𝗣𝗔𝗬 — উইথড্র সম্পন্ন!</b>\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n` +
            `✅ <b>স্ট্যাটাস:</b> <code>পেমেন্ট সফলভাবে পাঠানো হয়েছে</code> 💸\n` +
            `🏦 <b>মাধ্যম:</b> <b>${(withdrawItem?.method || 'bKash').toUpperCase()}</b> (<code>${formatBdPhone(withdrawItem?.number)}</code>)\n\n` +
            `<blockquote>💵 <b>উত্তোলনের পরিমাণ:</b> ৳${withdrawItem?.amount || 0} BDT\n` +
            `📉 <b>সার্ভিস ফি:</b> ৳${withdrawItem?.fee || 0} BDT\n` +
            `📦 <b>প্রাপ্য টাকা:</b> <b>৳${withdrawItem?.receiveAmount || withdrawItem?.amount || 0} BDT</b></blockquote>\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n` +
            `🎉 <i>আপনার একাউন্ট চেক করুন। TrustPay-এর সাথে থাকার জন্য ধন্যবাদ!</i>`;
        bot.sendMessage(targetUser, userMsg, { parse_mode: 'HTML', ...appOpenMarkup }).catch(e => console.error(e.message));

        await notifyPayoutGroup({
            type: 'fiat',
            userId: targetUser,
            name: withdrawItem?.name || 'User',
            amount: withdrawItem?.amount || 0,
            receiveAmount: withdrawItem?.receiveAmount || withdrawItem?.amount || 0,
            method: withdrawItem?.method || 'bKash',
            number: formatBdPhone(withdrawItem?.number)
        });
    }
};

// Reject a withdrawal and refund user balance
const doRejectWithdraw = async (docId, userId, refundAmt) => {
    const targetUser = String(userId);
    const reason = 'বাতিল করেছেন এডমিন (Rejected by admin)';
    let actualRefund = refundAmt || 0;

    try {
        const fwRef = db.collection('fiat_withdrawals').doc(docId);
        const fwDoc = await fwRef.get();
        if (fwDoc.exists) {
            const fwData = fwDoc.data();
            actualRefund = refundAmt || parseFloat(fwData.amount) || 0;
            await fwRef.update({ status: 'rejected', rejectReason: reason, rejectedAt: Date.now() });
        }
    } catch(e) {
        console.error('[WithdrawBot] reject doc error:', e.message);
    }

    try {
        const userRef = db.collection('users').doc(targetUser);
        const doc = await userRef.get();
        if (doc.exists) {
            const userData = doc.data();
            if (!actualRefund) {
                actualRefund = parseFloat(userData.fiatWithdrawPending?.amount) || 0;
            }
            const updatePayload = {
                balance: FieldValue.increment(actualRefund)
            };
            if (userData?.fiatWithdrawPending?.id === docId || !userData?.fiatWithdrawPending?.id) {
                updatePayload['fiatWithdrawPending.status'] = 'rejected';
                updatePayload['fiatWithdrawPending.rejectReason'] = reason;
                updatePayload['fiatWithdrawPending.rejectedAt'] = Date.now();
            }
            await userRef.update(updatePayload);

            if (bot) {
                const userRejectMsg = `<b>❌ 𝗧𝗥𝗨𝗦𝗧 𝗣𝗔𝗬 — উইথড্র বাতিল ও রিফান্ড</b>\n` +
                    `━━━━━━━━━━━━━━━━━━━━━━\n` +
                    `ℹ️ <b>কারণ:</b> <i>${reason}</i>\n\n` +
                    `<blockquote>💰 <b>রিফান্ড পরিমাণ:</b> <b>৳${actualRefund} BDT</b></blockquote>\n\n` +
                    `━━━━━━━━━━━━━━━━━━━━━━\n` +
                    `🔄 <i>টাকাটি আপনার অ্যাপ ব্যালেন্সে ফেরত দেওয়া হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।</i>`;
                bot.sendMessage(targetUser, userRejectMsg, { parse_mode: 'HTML', ...appOpenMarkup }).catch(e => console.error(e.message));
            }
        }
    } catch(e) { console.error('[WithdrawBot] reject user error:', e.message); }
};

// Send the next withdrawal from DB
const sendNextWithdrawal = async (chatId, targetIndex = 0) => {
    const pending = await fetchPendingWithdrawals();

    if (pending.length === 0) {
        await withdrawBot.sendMessage(chatId, 
            `<blockquote><b>✓ সকল ক্যাশআউট রিকোয়েস্ট সম্পন্ন!</b>\n\nডেটাবেসে আর কোনো পেন্ডিং উইথড্র রিকোয়েস্ট নেই। সব শেষ!</blockquote>`, 
            { parse_mode: 'HTML', reply_markup: adminReplyKeyboard }
        ).catch(() => {});
        return;
    }

    const idx = (targetIndex >= 0 && targetIndex < pending.length) ? targetIndex : 0;
    const w = pending[idx];
    const { msgText, keyboard } = buildWithdrawCard(w, idx, pending.length);

    await withdrawBot.sendMessage(chatId, msgText, {
        parse_mode: 'HTML',
        reply_markup: keyboard
    }).catch(e => console.error('[WithdrawBot] send error:', e.message));
};

if (withdrawBot) {
    // ─────────────────────────────────────────────────────────
    // Incoming Message Handler (/start, /withdraw, /w, button)
    // ─────────────────────────────────────────────────────────
    withdrawBot.on('message', async (msg) => {
        const text = (msg.text || '').trim();
        const chatId = msg.chat.id;

        if (text.startsWith('/list')) {
            const pending = await fetchPendingWithdrawals();
            if (pending.length === 0) {
                withdrawBot.sendMessage(chatId, '✓ কোনো পেন্ডিং ক্যাশআউট রিকোয়েস্ট নেই।', { reply_markup: adminReplyKeyboard }).catch(() => {});
                return;
            }
            let listMsg = `<b>📋 পেন্ডিং ক্যাশআউট তালিকা (${pending.length}টি):</b>\n\n`;
            pending.forEach((w, i) => {
                const num = formatBdPhone(w.number);
                listMsg += `<b>${i + 1}.</b> [${w.method?.toUpperCase()}] <code>${num}</code> → ৳${formatSendAmount(w.receiveAmount)}\n` +
                           `    👤 ${w.name} (ID: <code>${w.userId}</code>)\n\n`;
            });
            listMsg += `👇 নিচে <b>"Withdraw Requests"</b> বাটনে চাপুন অথবা /w লিখে শুরু করুন।`;
            withdrawBot.sendMessage(chatId, listMsg, { parse_mode: 'HTML', reply_markup: adminReplyKeyboard }).catch(() => {});
            return;
        }

        if (text.startsWith('/help')) {
            withdrawBot.sendMessage(chatId,
`<b>📌 Trust Pay Withdraw Bot — সাহায্য:</b>

১. <b>"Withdraw Requests"</b> বাটনে চাপুন অথবা /w কমান্ড দিন।
২. সাথে সাথে বটের প্রথম রিকোয়েস্ট আসবে।
৩. কোডে চাপ দিলে নম্বর ও টাকা সাথে সাথে কপি হবে।
৪. টাকা পাঠানোর পর <b>✓ Confirm</b> চাপলে আগের মেসেজ মুছে গিয়ে স্বয়ংক্রিয়ভাবে পরের রিকোয়েস্ট চলে আসবে।
৫. এভাবে সিরিয়াল অনুযায়ী সবগুলো শেষ না হওয়া পর্যন্ত একটির পর একটি আসতে থাকবে।
৬. সব শেষ হলে বট জানিয়ে দেবে সব শেষ!

<b>📋 ফি নীতি:</b>
• ২০ থেকে ৩০ টাকা পর্যন্ত: সম্পূর্ণ ফ্রি (০ টাকা ফি)
• ৩০ টাকার উপরে: স্ল্যাব অনুযায়ী ফি ধার্য হবে`, { parse_mode: 'HTML', reply_markup: adminReplyKeyboard }).catch(() => {});
            return;
        }

        // For /start, /withdraw, /w, or tapping the keyboard button
        withdrawQueueIndex = 0;
        await sendNextWithdrawal(chatId, 0);
    });

    // ─────────────────────────────────────────────────────────
    // Callback Query Handler: Confirm / Reject / Next / Refresh
    // When completed: DELETES current message, sends the next one automatically!
    // ─────────────────────────────────────────────────────────
    withdrawBot.on('callback_query', async (query) => {
        const chatId = query.message?.chat?.id;
        const messageId = query.message?.message_id;
        const data = query.data;
        if (!chatId || !data) return;

        // ─── 1. CONFIRM ──────────────────────────────────────────
        if (data.startsWith('wd_confirm:')) {
            const parts = data.split(':');
            const docId = parts[1];
            const userId = parts[2];

            await withdrawBot.answerCallbackQuery(query.id, { text: '✓ Confirming...', show_alert: false }).catch(() => {});

            // DELETE the current withdrawal message immediately
            if (messageId) {
                await withdrawBot.deleteMessage(chatId, messageId).catch(() => {});
            }

            // Process approval in Firestore, notify user and payout channel
            await doApproveWithdraw(docId, userId);
            invalidateOrdersCache();

            // Automatically send the next pending withdrawal!
            await sendNextWithdrawal(chatId, 0);
            return;
        }

        // ─── 2. REJECT ───────────────────────────────────────────
        if (data.startsWith('wd_reject:')) {
            const parts = data.split(':');
            const docId = parts[1];
            const userId = parts[2];
            const refundAmt = parseFloat(parts[3]) || 0;

            await withdrawBot.answerCallbackQuery(query.id, { text: '✕ Rejecting...', show_alert: false }).catch(() => {});

            // DELETE the current withdrawal message immediately
            if (messageId) {
                await withdrawBot.deleteMessage(chatId, messageId).catch(() => {});
            }

            // Process refund in Firestore and notify user
            await doRejectWithdraw(docId, userId, refundAmt);
            invalidateOrdersCache();

            // Automatically send the next pending withdrawal!
            await sendNextWithdrawal(chatId, 0);
            return;
        }

        // ─── 3. NEXT / SKIP ──────────────────────────────────────
        if (data === 'wd_next') {
            await withdrawBot.answerCallbackQuery(query.id).catch(() => {});
            if (messageId) {
                await withdrawBot.deleteMessage(chatId, messageId).catch(() => {});
            }
            const pending = await fetchPendingWithdrawals();
            if (pending.length === 0) {
                await withdrawBot.sendMessage(chatId,
                    `<blockquote><b>✓ সকল ক্যাশআউট রিকোয়েস্ট সম্পন্ন!</b></blockquote>`,
                    { parse_mode: 'HTML', reply_markup: adminReplyKeyboard }
                ).catch(() => {});
                return;
            }
            withdrawQueueIndex = (withdrawQueueIndex + 1) % pending.length;
            await sendNextWithdrawal(chatId, withdrawQueueIndex);
            return;
        }

        // ─── 4. REFRESH ──────────────────────────────────────────
        if (data === 'wd_refresh') {
            await withdrawBot.answerCallbackQuery(query.id, { text: '⟳ Refreshing...' }).catch(() => {});
            if (messageId) {
                await withdrawBot.deleteMessage(chatId, messageId).catch(() => {});
            }
            withdrawQueueIndex = 0;
            await sendNextWithdrawal(chatId, 0);
            return;
        }
    });

    console.log('[WithdrawBot] 📋 All handlers registered successfully.');
}
// END OF WITHDRAW MANAGER BOT
// ============================================================
