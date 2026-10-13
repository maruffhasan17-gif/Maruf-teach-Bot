require('dotenv').config({ override: true });
const TelegramBot = require('node-telegram-bot-api');
const path = require('path');
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

let botConfig = {
    gramAmount: '0.07',
    usdtAmount: '0.05',
    freeLink: 'https://t.me/VictorsCompanybot/app?startapp=ref_DBF2368328',
    adminGroupId: '',
    dataGroupId: '',
    supportGroupId: '',
    withdrawGroupId: '',
    payoutGroupId: ''
};

// Helper: Post live payout confirmation to public Payout Group / Channel (Matches Image 2)
const notifyPayoutGroup = async (payoutData) => {
    try {
        const payoutChatId = botConfig.payoutGroupId;
        if (!payoutChatId || !bot) return;

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

        let msg = '';
        if (payoutData.type === 'fiat') {
            const amt = parseFloat(payoutData.amount || 0).toFixed(2);
            const rec = parseFloat(payoutData.receiveAmount || payoutData.amount || 0).toFixed(2);
            msg = `<blockquote><b>🎉 New Withdrawal Processed!</b>

` +
                  `👤 <b>User:</b> ${payoutData.name || 'User'} (<code>${maskId(payoutData.userId)}</code>)
` +
                  `💰 <b>Amount:</b> ৳ ${amt} BDT
` +
                  `📦 <b>Send (after fee):</b> ৳ ${rec} BDT
` +
                  `🏦 <b>To:</b> ${payoutData.method || 'bKash'} (<code>${maskNumber(payoutData.number)}</code>)

` +
                  `✅ <b>Paid successfully</b></blockquote>`;
        } else {
            msg = `<blockquote><b>🎉 New Withdrawal Processed!</b>

` +
                  `👤 <b>User:</b> ${payoutData.name || 'User'} (<code>${maskId(payoutData.userId)}</code>)
` +
                  `💰 <b>Amount:</b> ${payoutData.amount} ${payoutData.asset || 'TON'}
` +
                  `📦 <b>Sent:</b> ${payoutData.receiveAmount || payoutData.amount} ${payoutData.asset || 'TON'}
` +
                  `🏛 <b>To:</b> <code>${payoutData.destination || ''}</code>

` +
                  `✅ <b>Paid on-chain • view transaction</b></blockquote>`;
        }

        await bot.sendMessage(payoutChatId, msg, { parse_mode: 'HTML', disable_web_page_preview: true });
        console.log("Posted public payout proof to", payoutChatId);
    } catch(err) {
        console.error("Failed to post to payoutGroupId:", err.message);
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
const channelUsername = process.env.CHANNEL_USERNAME;
const bkashNumber = process.env.BKASH_NUMBER;
const botEvmAddress = process.env.BOT_EVM_ADDRESS || process.env.BEP20_ADDRESS;
const adminUsername = "maruff666";

const bot = new TelegramBot(token, { polling: true });
bot.on('polling_error', (error) => {
    // Ignore transient Telegram network polling resets
    if (error.code !== 'ETELEGRAM' && !error.message?.includes('EFATAL')) {
        console.warn('[Telegram Polling Notice]:', error.message || error.code);
    }
});
const { beginCell, Address } = require('@ton/core');
const app = express();
const cors = require('cors');
app.use(cors());
app.use(express.json());
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const userStates = {}; 

const t = {
    en: {
        welcome: `💎 <b>Crypto Buy Sell — Official Platform</b> 💎\n\nWelcome! Buy & Sell <b>USDT, TON & GRAM</b> instantly in Bangladesh via bKash & Nagad.\n\n⚡ <b>Key Features:</b>\n• Live Instant Crypto Buy & Sell\n• Automated bKash & Nagad Verification\n• Sell Crypto starting from just 1 BDT\n• Instant Payouts & Zero Hassle\n\n📢 Please join our official Telegram channel first to access the platform:\n\n👇 <b>Click below to join and verify:</b>`,
        joinBtn: '📢 Join Official Channel',
        verifyBtn: '✅ Verify & Open App',
        notJoined: '❌ You have not joined the channel yet! Please join first.',
        langPrompt: '✅ <b>Verification Successful!</b>\n\nPlease select your language:',
        profileMsg: '👤 <b>Your Profile</b>\n\nID: {id}',
        bkashMsg: '🚀 <b>bKash Payment</b>',
        cryptoMsg: '💎 <b>Crypto Payment</b>',
        menu: { free: '🎁 Free', profile: '👤 Profile' },
        mainMenuMsg: "🎉 <b>Verification Successful!</b>\n\nWelcome to Crypto Buy Sell.\n👇 <b>Click the button below to open the app:</b>"
    },
    bn: {
        welcome: `💎 <b>Crypto Buy Sell — ক্রিপ্টো বাই সেল প্ল্যাটফর্ম</b> 💎\n\nস্বাগতম! বাংলাদেশ থেকে সবচেয়ে দ্রুত ও নিরাপদে <b>USDT, TON ও GRAM</b> ক্রয়-বিক্রয় করুন বিকাশ ও নগদের মাধ্যমে।\n\n⚡ <b>আমাদের সুবিধাসমূহ:</b>\n• ইনস্ট্যান্ট ক্রিপ্টো ক্রয় ও বিক্রয় (লাইভ রেট)\n• বিকাশ ও নগদ অটো-ভেরিফিকেশন\n• মাত্র ১ টাকা থেকেও ক্রিপ্টো বিক্রি\n• দ্রুত ও নিরাপদ পেমেন্ট উইথড্র\n\n📢 প্ল্যাটফর্ম ব্যবহার করতে প্রথমে আমাদের অফিসিয়াল চ্যানেলে যুক্ত হোন:\n\n👇 <b>নিচে জয়েন করে ভেরিফাই করুন:</b>`,
        joinBtn: '📢 অফিসিয়াল চ্যানেল জয়েন করুন',
        verifyBtn: '✅ ভেরিফাই ও অ্যাপ ওপেন করুন',
        notJoined: '❌ আপনি এখনও চ্যানেলে জয়েন করেননি! দয়া করে চ্যানেলে জয়েন করে আবার চেষ্টা করুন।',
        langPrompt: '✅ <b>ভেরিফিকেশন সফল হয়েছে!</b>\n\nআপনার ভাষা নির্বাচন করুন:',
        profileMsg: '👤 <b>আপনার প্রোফাইল</b>\n\nআইডি: {id}',
        bkashMsg: '🚀 <b>বিকাশ পেমেন্ট</b>',
        cryptoMsg: '💎 <b>ক্রিপ্টো পেমেন্ট</b>',
        menu: { free: '🎁 ফ্রি (Free)', profile: '👤 আমার প্রোফাইল' },
        mainMenuMsg: "🎉 <b>ভেরিফিকেশন সফল হয়েছে!</b>\n\nআপনাকে Crypto Buy Sell প্ল্যাটফর্মে স্বাগতম।\n👇 <b>নিচের বোতামে ক্লিক করে অ্যাপটি ওপেন করুন:</b>"
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
                body: "Crypto Buy payout from Crypto Buy Sell Bot"
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

    const jettonBody = beginCell()
        .storeUint(0xf8a7ea5, 32)
        .storeUint(0, 64)
        .storeCoins(amountInMicro)
        .storeAddress(Address.parse(destination))
        .storeAddress(Address.parse(walletAddrStr))
        .storeBit(0)
        .storeCoins(1)
        .storeBit(0)
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

    const username = msg.from.username || "Unknown";
    const firstName = msg.from.first_name || "User";
    
    // Save user to Firebase
    const userRef = db.collection('users').doc(chatId.toString());
    const existingUserDoc = await userRef.get().catch(() => null);

    if (!existingUserDoc || !existingUserDoc.exists) {
        await userRef.set({
            chatId: chatId,
            username: username,
            firstName: firstName,
            joinedAt: new Date(),
            status: 'pending_verification',
            totalPayouts: 0
        }, { merge: true });
    }

    userStates[chatId] = { step: 'start', failedAttempts: 0, lang: 'bn' };
    
    const isAlreadyVerified = existingUserDoc && existingUserDoc.exists && existingUserDoc.data().status === 'verified';

    if (isAlreadyVerified) {
        const welcomeBackMsg = `💎 <b>Crypto Buy Sell — ক্রিপ্টো বাই সেল</b> 💎\n\nস্বাগতম <b>${firstName}</b>!\nআপনার অ্যাকাউন্ট ভেরিফাইড রয়েছে।\n\n👇 <b>নিচের বোতামে ক্লিক করে অ্যাপ ওপেন করুন:</b>`;
        return bot.sendMessage(chatId, welcomeBackMsg, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [ { text: '🚀 অ্যাপ ওপেন করুন (Open App)', web_app: { url: 'https://maruf-teach-bot.onrender.com/app/' } } ]
                ]
            }
        }).catch(e => console.error(e.message));
    }

    const opts = {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [{ text: t.bn.joinBtn, url: `https://t.me/${channelUsername.replace('@', '')}` }],
                [{ text: t.bn.verifyBtn, callback_data: 'verify_join' }]
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
            const chatMember = await bot.getChatMember(channelUsername, userId);
            if (chatMember.status === 'member' || chatMember.status === 'administrator' || chatMember.status === 'creator') {
                
                await db.collection('users').doc(chatId.toString()).update({ status: 'verified', language: 'bn' });
                if (userStates[chatId]) userStates[chatId].lang = 'bn';
                
                // 1. Remove the old inline keyboard from the /start message
                bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: chatId, message_id: query.message.message_id }).catch(()=>{});

                // 2. Clear old persistent keyboard with a silent fast-deleting message
                bot.sendMessage(chatId, "...", { reply_markup: { remove_keyboard: true } }).catch(e => console.error(e.message)).then(delMsg => {
                    if (delMsg && delMsg.message_id) {
                        setTimeout(() => bot.deleteMessage(chatId, delMsg.message_id).catch(()=>{}), 100);
                    }
                }).catch(()=>{});

                // 3. Send ONE clean welcome message with the Open App button
                const msgText = `🎉 <b>ভেরিফিকেশন সফল হয়েছে!</b>\n\nCrypto Buy Sell প্ল্যাটফর্মে আপনাকে স্বাগতম। আপনার অ্যাকাউন্ট সফলভাবে ভেরিফাই সম্পন্ন হয়েছে।\n\n👇 <b>নিচের বোতামে ক্লিক করে অ্যাপ ওপেন করুন:</b>`;
                bot.sendMessage(chatId, msgText, {
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [
                            [ { text: '🚀 অ্যাপ ওপেন করুন (Open App)', web_app: { url: 'https://maruf-teach-bot.onrender.com/app/' } } ]
                        ]
                    }
                }).catch(e => console.error(e.message));
                
            } else {
                bot.answerCallbackQuery(query.id, { text: t.bn.notJoined, show_alert: true });
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
                `4️⃣ <b>Payout Group / Channel:</b> <code>${botConfig.payoutGroupId || 'Not set'}</code></blockquote>`;
            bot.sendMessage(chatId, resp, { parse_mode: 'HTML' }).catch(e => console.error(e.message));
            return;
        }

        const isConfiguredAdmin = [
            botConfig.adminGroupId,
            botConfig.dataGroupId,
            botConfig.supportGroupId,
            botConfig.withdrawGroupId,
            botConfig.payoutGroupId
        ].filter(Boolean).map(String).includes(chatId.toString());

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
                    const userSupportMsg = `<blockquote><b>🎧 কাস্টমার সাপোর্ট থেকে বার্তা</b>\n\n${safeReply}</blockquote>`;
                    await bot.sendMessage(targetUserId, userSupportMsg, { parse_mode: 'HTML' }).catch(e => console.error("Support reply to user error:", e.message));
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
            if (caption.includes("New Fiat Withdrawal") || caption.includes("নতুন উইথড্র রিকোয়েস্ট") || caption.includes("Withdraw Request")) {
                const idMatch = caption.match(/ID:\s*(?:<code>)?(\d+)(?:<\/code>)?/i);
                if (idMatch && idMatch[1]) {
                    const targetUserId = idMatch[1];
                    
                    if (['done', 'ok', 'paid', 'accept', 'approve'].includes(replyText)) {
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
                            try {
                                const pendSnaps = await db.collection('fiat_withdrawals')
                                    .where('userId', 'in', [parseInt(targetUserId), targetUserId.toString()].filter(Boolean))
                                    .where('status', '==', 'pending').get();
                                for (const doc of pendSnaps.docs) {
                                    await doc.ref.update({ status: 'completed', completedAt: Date.now() }).catch(()=>{});
                                }
                            } catch(e) {}

                            await uRef.update({
                                'fiatWithdrawPending.status': 'completed',
                                'fiatWithdrawPending.completedAt': Date.now()
                            });
                        }

                        const amtVal = pend?.amount || 0;
                        const feeVal = pend?.fee !== undefined ? pend.fee : 0;
                        const recVal = pend?.receiveAmount || amtVal;
                        const methodVal = pend?.method || 'bKash';
                        const numVal = pend?.number || '';

                        // Redesigned Quote DM to User (Image 3 quality)
                        const userSuccessMsg = `<blockquote><b>✅ ক্যাশআউট সম্পন্ন হয়েছে (Withdrawal Successful)!</b>\n\n` +
                            `💰 <b>উত্তোলনের পরিমাণ:</b> ৳${amtVal} BDT\n` +
                            `📉 <b>সেন্ড মানি ফি:</b> ৳${typeof feeVal === 'number' ? feeVal.toFixed(2) : feeVal} BDT\n` +
                            `💵 <b>প্রদান করা হয়েছে:</b> ৳${typeof recVal === 'number' ? recVal.toFixed(2) : recVal} BDT\n` +
                            `🏦 <b>মাধ্যম:</b> ${methodVal} (<code>${numVal}</code>)\n\n` +
                            `আপনার অ্যাকাউন্টে টাকা সফলভাবে পাঠিয়ে দেওয়া হয়েছে। ধন্যবাদ আমাদের সাথে থাকার জন্য!</blockquote>`;
                        bot.sendMessage(targetUserId, userSuccessMsg, { parse_mode: 'HTML' }).catch(e => console.error(e.message));

                        // Confirm in Withdraw Request Group
                        bot.sendMessage(chatId, `✅ <code>${targetUserId}</code> এর উইথড্র সফলভাবে PAID মার্ক করা হয়েছে।`, { parse_mode: 'HTML', reply_to_message_id: msg.message_id }).catch(e => console.error(e.message));

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
                    else if (replyText === 'wt' || replyText === 'wait') {
                        await bot.sendMessage(chatId, `⏱ Reply to THIS message with the time format.\n\nMinutes: <code>10:00</code>\nHours: <code>1:30:50</code>\n\nUser ID: ${targetUserId}`, { parse_mode: 'HTML' }).catch(e => console.error(e.message));
                        return;
                    }
                    else if (replyText.startsWith('reject')) {
                        const reason = text.substring(6).trim() || 'No reason provided';
                        const userRef = db.collection('users').doc(targetUserId);
                        const userDoc = await userRef.get();
                        if (userDoc.exists && userDoc.data().fiatWithdrawPending) {
                            const pend = userDoc.data().fiatWithdrawPending;
                            const amountToRefund = pend.amount;
                            if (pend.id) {
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
                                for (const doc of pendSnaps.docs) {
                                    await doc.ref.update({ status: 'rejected', rejectReason: reason, rejectedAt: Date.now() }).catch(()=>{});
                                }
                            } catch(e) {}

                            await userRef.update({
                                balance: (userDoc.data().balance || 0) + amountToRefund,
                                'fiatWithdrawPending.status': 'rejected',
                                'fiatWithdrawPending.rejectReason': reason,
                                'fiatWithdrawPending.rejectedAt': Date.now()
                            });

                            bot.sendMessage(chatId, `❌ Rejected withdrawal for <code>${targetUserId}</code> and refunded ৳${amountToRefund} BDT.\nReason: ${reason}`, { parse_mode: 'HTML', reply_to_message_id: msg.message_id }).catch(e => console.error(e.message));
                            
                            // Redesigned Quote DM to User (Image 3 quality)
                            const userRejectMsg = `<blockquote><b>❌ উইথড্র বাতিল ও রিফান্ড (Withdrawal Rejected)!</b>\n\n` +
                                `💰 <b>রিফান্ড পরিমাণ:</b> ৳${amountToRefund} BDT\n` +
                                `📝 <b>কারণ:</b> <i>${reason}</i>\n\n` +
                                `টাকাটি আপনার অ্যাপ ব্যালেন্সে পুনরায় যোগ করে দেওয়া হয়েছে। তথ্য যাচাই করে আবার চেষ্টা করুন।</blockquote>`;
                            bot.sendMessage(targetUserId, userRejectMsg, { parse_mode: 'HTML' }).catch(e => console.error(e.message));
                        }
                        return;
                    }
                }
                return;
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
    realGramUsdt: 1.80,
    realGramBdt: 216,
    buyRates: {
        USDT: 130, // 120 + 10
        GRAM: 226  // (1.80 * 120) + 10
    },
    sellRates: {
        USDT: 115, // 120 - 5
        GRAM: 211  // (1.80 * 120) - 5
    },
    lastUpdated: 0
};

async function updateMarketRates() {
    try {
        let usdtBdt = 120;
        let tonUsdt = 1.80;

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

        // Buyer Price Rule (+10 TK):
        // USDT: realUsdtBdt + 10 TK (e.g. 120 + 10 = 130 TK)
        // GRAM: (realGramUsdt in BDT) + 10 TK (e.g. 1.80 * 120 = 216 + 10 = 226 TK)
        const buyUsdt = Math.round(realUsdtBdt + 10);
        // Seller Price Rule:
        // USDT: realUsdtBdt - 5 TK (e.g. 130 - 5 = 125 TK or 120 - 5 = 115 TK)
        // GRAM: Fixed at 200 BDT as requested by admin
        const sellUsdt = Math.max(1, Math.round(realUsdtBdt - 5));
        const sellGram = 200; // Fixed 200 BDT

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
        console.log(`[RATES UPDATED] Real USDT: ৳${realUsdtBdt}, Real TON: $${realGramUsdt} (৳${realGramBdt}) => Buy: USDT ৳${buyUsdt}, GRAM ৳${buyGram} | Sell: USDT ৳${sellUsdt}, GRAM ৳${sellGram}`);
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
            mbsId: mbsId
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
            await userRef.update({ balance: FieldValue.increment(numEstimatedTk) });
        } else {
            await userRef.set({ balance: numEstimatedTk, joinedAt: FieldValue.serverTimestamp() }, { merge: true });
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
            const userSellMsg = `<blockquote><b>🎉 ক্রিপ্টো বিক্রয় সফল হয়েছে!</b>\n\n` +
                `💎 <b>বিক্রয়:</b> <b>${numAmount} ${asset}</b>\n` +
                `💵 <b>প্রাপ্ত টাকা:</b> <b>৳${numEstimatedTk} BDT</b>\n` +
                `💰 <b>বর্তমান ব্যালেন্স:</b> <b>৳${newBalance} BDT</b>\n\n` +
                `<i>টাকাটি আপনার ব্যালেন্সে সফলভাবে যোগ করা হয়েছে।</i></blockquote>`;
            bot.sendMessage(userId, userSellMsg, { parse_mode: 'HTML' }).catch(e=>console.error(e.message));
        }

        res.json({ success: true, orderId: savedOrderId, newBalance });
    } catch(e) {
        console.error("Sell order error:", e);
        res.status(500).json({ error: e.message });
    }
});
// =======================================================

app.get('/api/stats', async (req, res) => {
    try {
        console.log("/api/stats called");
        
        console.log("Fetching users...");
        const usersSnapshot = await db.collection('users').get();
        const users = [];
        usersSnapshot.forEach(doc => users.push(doc.data()));
        
        console.log("Fetching failed screenshots...");
        const failedSnapshot = await db.collection('failed_screenshots').orderBy('timestamp', 'desc').limit(20).get();
        const failedScreenshots = [];
        failedSnapshot.forEach(doc => {
            const data = doc.data();
            data.id = doc.id;
            failedScreenshots.push(data);
        });

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
                            gramBalance = (parseFloat(gramJetton.balance) / Math.pow(10, gramJetton.jetton.decimals || 9)).toFixed(2);
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

        res.json({
            users: users,
            failedScreenshots: failedScreenshots,
            tonBalance: tonBalance,
            tonNativeBalance: tonNativeBalance,
            tonUsdtBalance: tonUsdtBalance,
            gramBalance: gramBalance,
            evmBalance: evmBalance,
            evmAddress: process.env.BOT_EVM_ADDRESS,
            tonAddress: process.env.BOT_TON_ADDRESS
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Serve static manifest and logo for TON Connect with CORS
app.get('/tonconnect-manifest.json', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.sendFile(path.join(__dirname, 'tonconnect-manifest.json'));
});
app.get('/logo.png', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.sendFile(path.join(__dirname, 'logo.png'));
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
            if (a <= 0) return 0;
            if (a >= 1500) return 30;
            if (a > 1000) return 20;
            if (a > 500) return 10;
            if (a > 100) return 7;
            return 5;
        };
        const calcFee = (fee !== undefined && fee !== null) ? parseFloat(fee) : calculateSendMoneyFee(amount);
        const calcReceive = receiveAmount || (amount - calcFee);

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
                        body: "Withdrawal from Maruf Teach Bot"
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

        const verifiedRef = await db.collection('verified_trx').doc(trxId).get();
        
        // STRICT: If not found in database, REJECT IMMEDIATELY! NO PENDING!
        if (!verifiedRef.exists) {
            return res.status(400).json({ 
                error: 'ভুল অথবা আনভেরিফাইড Transaction ID! টাকা পাঠিয়ে সঠিক TrxID দিন বা এসএমএস আসা পর্যন্ত ১ মিনিট অপেক্ষা করে আবার চেষ্টা করুন।' 
            });
        }

        const verifiedData = verifiedRef.data();

        // If already claimed, REJECT!
        if (verifiedData.claimed) {
            return res.status(400).json({ 
                error: 'এই Transaction ID টি ইতিমধ্যে ব্যবহার করা হয়েছে!' 
            });
        }

        // If amount mismatch, REJECT!
        if (verifiedData.amount && Math.abs(verifiedData.amount - amount) > 1) {
            return res.status(400).json({ 
                error: `টাকার পরিমাণ মেলেনি! এসএমএস-এ পাওয়া গেছে ৳${verifiedData.amount} BDT, কিন্তু আপনি দিয়েছেন ৳${amount} BDT` 
            });
        }

        // MATCH! Claim TrxID and instantly add money to user's balance!
        await verifiedRef.ref.update({
            claimed: true,
            claimedBy: userId,
            claimedAt: FieldValue.serverTimestamp()
        });

        const userRef = db.collection('users').doc(userId.toString());
        await userRef.set({
            balance: FieldValue.increment(amount)
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

        // Send confirmation to User in Telegram with Quote block (Matches Image 3)
        const userAddMoneyMsg = `<blockquote><b>🎉 টাকা যুক্ত সফল হয়েছে!</b>\n\n` +
            `💵 <b>যোগ করা হয়েছে:</b> <b>৳${amount} BDT</b> (${paymentMethod})\n` +
            `💰 <b>বর্তমান ব্যালেন্স:</b> <b>৳${newBalance} BDT</b>\n` +
            `#️⃣ <b>TrxID:</b> <code>${trxId}</code>\n\n` +
            `<i>টাকাটি আপনার অ্যাকাউন্টে স্বয়ংক্রিয়ভাবে যুক্ত হয়েছে।</i></blockquote>`;
        bot.sendMessage(userId, userAddMoneyMsg, { parse_mode: 'HTML' }).catch(e => console.error(e.message));

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
        await userRef.update({
            balance: FieldValue.increment(-bdtAmount)
        });

        // 4. BROADCAST ON-CHAIN TRANSACTION!
        let txResult = null;
        try {
            if (isTonAsset) {
                txResult = await sendTonOnChain(receiveAddress, cryptoAmount);
            } else if (asset === 'USDT') {
                txResult = await sendJettonUsdtOnChain(receiveAddress, cryptoAmount);
            } else {
                throw new Error(`Unsupported crypto asset: ${asset}`);
            }
        } catch (txErr) {
            // ON-CHAIN BROADCAST FAILED: IMMEDIATELY ROLLBACK & REFUND BDT!
            await userRef.update({
                balance: FieldValue.increment(bdtAmount)
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

        // 6. TELEGRAM CONFIRMATIONS with Quote block
        const userBuyInstantMsg = `<blockquote><b>💎 ক্রিপ্টো ক্রয় সফল হয়েছে!</b>\n\n` +
            `💎 <b>প্রাপ্ত ক্রিপ্টো:</b> <b>${cryptoAmount} ${asset}</b>\n` +
            `💵 <b>পরিশোধ:</b> <b>৳${bdtAmount} BDT</b>\n` +
            `💰 <b>বর্তমান ব্যালেন্স:</b> <b>৳${newBalance} BDT</b>\n` +
            `🏷 <b>ওয়ালেট:</b> <code>${receiveAddress}</code>\n\n` +
            `<i>ক্রিপ্টো আপনার ওয়ালেটে অন-চেইনে সফলভাবে পাঠানো হয়েছে।</i></blockquote>`;
        bot.sendMessage(userId, userBuyInstantMsg, { parse_mode: 'HTML' }).catch(e => console.error(e.message));

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

        const verifiedRef = await db.collection('verified_trx').doc(trxId).get();
        if (!verifiedRef.exists) {
            return res.status(400).json({ 
                error: 'ভুল অথবা আনভেরিফাইড Transaction ID! টাকা পাঠিয়ে সঠিক TrxID দিন বা কিছুক্ষণ অপেক্ষা করে আবার চেষ্টা করুন।' 
            });
        }

        const verifiedData = verifiedRef.data();
        if (verifiedData.claimed) {
            return res.status(400).json({ error: "এই Transaction ID টি ইতিমধ্যে ব্যবহার করা হয়েছে!" });
        }

        const amountDiff = verifiedData.amount ? Math.abs(verifiedData.amount - totalBdt) : 0;
        if (amountDiff > 1) {
            return res.status(400).json({ 
                error: `টাকার পরিমাণ মেলেনি! এসএমএস-এ পাওয়া গেছে ৳${verifiedData.amount} BDT, কিন্তু আপনি দিয়েছেন ৳${totalBdt} BDT` 
            });
        }

        // MATCH!
        await verifiedRef.ref.update({
            claimed: true,
            claimedBy: userId,
            claimedAt: FieldValue.serverTimestamp()
        });

        // Credit to balance!
        const userRef = db.collection('users').doc(userId.toString());
        await userRef.set({
            balance: FieldValue.increment(totalBdt)
        }, { merge: true });

        await db.collection('miniapp_buys').doc(trxId).set({
            userId, asset: asset || 'BDT', amount, totalBdt, paymentMethod, trxId, receiveAddress: receiveAddress || '',
            status: 'completed',
            autoVerified: true,
            timestamp: FieldValue.serverTimestamp()
        });

        const updatedDoc = await userRef.get();
        const newBalance = updatedDoc.data()?.balance || totalBdt;

        bot.sendMessage(userId, `🎉 <b>টাকা যুক্ত সফল হয়েছে!</b>\n\nআপনার অ্যাকাউন্টে <b>৳${totalBdt} BDT</b> যোগ করা হয়েছে।\n💰 বর্তমান ব্যালেন্স: <b>৳${newBalance} BDT</b>`, { parse_mode: 'HTML' }).catch(e => console.error(e.message));

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

app.post('/api/macrodroid/webhook', async (req, res) => {
    try {
        await db.collection('debug_logs').add({
            body: req.body || {},
            query: req.query || {},
            timestamp: FieldValue.serverTimestamp()
        });
        const sender = (req.body.sender || req.query.sender || 'Unknown').trim();
        const message = req.body.message || req.query.message || '';
        
        const validSenders = ['bkash', 'nagad'];
        if (!validSenders.includes(sender.toLowerCase())) {
            console.warn('Blocked fake SMS from ' + sender);
            return res.status(403).json({ error: "Fraud attempt blocked! Sender must be bKash or Nagad" });
        }
        
        const match = message.match(/(?:TrxID|TxnId|TxnID|TrxId|Txn\s*ID|Trx\s*ID)[\s:]*([A-Za-z0-9]+)/i);
        if (!match) {
            return res.status(400).json({ error: "No TrxID found" });
        }
        const trxId = match[1].toUpperCase();

        const amountMatch = message.match(/(?:Tk|Amount)[\s:]*([\d,]+(?:\.\d+)?)/i) || message.match(/([\d,]+(?:\.\d+)?)[\s]*Tk/i);
        const msgAmount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0;

        const config = botConfig || {};
        const adminGroupId = config.adminGroupId || null;

        const buyRef = db.collection('miniapp_buys').doc(trxId);
        const doc = await buyRef.get();

        if (!doc.exists) {
            // User hasn't submitted yet. Save to verified_trx as unclaimed!
            await db.collection('verified_trx').doc(trxId).set({
                message,
                amount: msgAmount,
                sender,
                claimed: false,
                timestamp: FieldValue.serverTimestamp()
            });
            return res.json({ success: true, message: "TrxID cached for future auto-verify" });
        }

        const order = doc.data();
        if (order.status === 'pending') {
            if (msgAmount && Math.abs(msgAmount - order.totalBdt) > 1) {
                const dataGroup = botConfig.dataGroupId || adminGroupId;
                if (dataGroup) {
                    const mismatchAlert = `<blockquote><b>⚠️ টাকার পরিমাণ কম/অসামঞ্জস্য (Amount Mismatch Warning)!</b>\n\n` +
                        `👤 <b>User:</b> <code>${order.userId}</code>\n` +
                        `💵 <b>প্রত্যাশিত (Expected):</b> <b>৳${order.totalBdt} BDT</b>\n` +
                        `📩 <b>SMS প্রাপ্ত:</b> <b>৳${msgAmount} BDT</b>\n` +
                        `#️⃣ <b>TrxID:</b> <code>${trxId}</code>\n` +
                        `⚠️ <b>স্ট্যাটাস:</b> পেমেন্ট অসম্পূর্ণ থাকায় ভেরিফিকেশন স্থগিত।</blockquote>`;
                    bot.sendMessage(dataGroup, mismatchAlert, { parse_mode: 'HTML' }).catch(e=>console.error(e));
                }
                return res.json({ success: true, message: "Amount mismatch, left as pending" });
            }

            // AUTO-VERIFY!
            await buyRef.update({ 
                status: 'verified',
                autoVerified: true,
                smsVerifiedAt: FieldValue.serverTimestamp()
            });
            await db.collection('verified_trx').doc(trxId).set({
                message,
                amount: msgAmount,
                sender,
                claimed: true,
                claimedBy: order.userId,
                timestamp: FieldValue.serverTimestamp()
            });

            bot.sendMessage(order.userId, `🎉 <b>Payment Auto-Verified!</b>\n\nYour payment for <b>${order.amount} ${order.asset}</b> (TrxID: <code>${trxId}</code>) has been automatically verified via SMS!\n\nAdmin will dispatch your ${order.asset} shortly.`, { parse_mode: 'HTML' }).catch(e => console.error(e.message));
            
            if (adminGroupId) {
                const autoMsg = `<blockquote><b>⚡ Buy Order Auto-Verified via SMS!</b></blockquote>\n\n👤 User: <code>${order.userId}</code>\n💰 Asset: <b>${order.amount} ${order.asset}</b>\n💵 Paid: <b>৳${order.totalBdt} BDT</b>\n#️⃣ TrxID: <code>${trxId}</code>\n🏷 Wallet: <code>${order.receiveAddress}</code>\n\n⚙️ <b>Actions (Reply to this message):</b>\n- <code>ok</code> or <code>accept</code> to send ${order.asset} on-chain\n- <code>reject</code> to refund ৳${order.totalBdt} to user balance`;
                bot.sendMessage(adminGroupId, autoMsg, { parse_mode: 'HTML' }).catch(e => console.error(e.message));
            }
        }
        res.json({ success: true });
    } catch(e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});


app.get('/api/admin/orders', async (req, res) => {
    try {
        const buysSnapshot = await db.collection('miniapp_buys').orderBy('timestamp', 'desc').limit(100).get();
        const sellsSnapshot = await db.collection('miniapp_sells').orderBy('timestamp', 'desc').limit(100).get();
        
        const buys = buysSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        const sells = sellsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

        const withdrawals = [];
        const seenWithdrawIds = new Set();

        // 1. Get from fiat_withdrawals collection
        try {
            const fwSnap = await db.collection('fiat_withdrawals').get();
            fwSnap.forEach(doc => {
                const data = doc.data();
                seenWithdrawIds.add(doc.id);
                withdrawals.push({
                    id: doc.id,
                    withdrawId: doc.id,
                    userId: data.userId,
                    firstName: data.name || 'User',
                    ...data,
                    fiatWithdrawPending: data
                });
            });
        } catch(e) {
            console.error("Error reading fiat_withdrawals collection:", e);
        }

        // 2. Get from users collection (legacy support)
        const usersSnapshot = await db.collection('users').get();
        usersSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.fiatWithdrawPending) {
                const pendId = data.fiatWithdrawPending.id || doc.id;
                if (!seenWithdrawIds.has(pendId)) {
                    seenWithdrawIds.add(pendId);
                    withdrawals.push({
                        id: pendId,
                        withdrawId: pendId,
                        userId: doc.id,
                        firstName: data.first_name || 'Unknown',
                        username: data.username || '',
                        fiatWithdrawPending: data.fiatWithdrawPending,
                        ...data.fiatWithdrawPending
                    });
                }
            }
        });

        // sort withdrawals safely by timestamp descending
        withdrawals.sort((a, b) => {
            const timeA = a.timestamp?._seconds ? a.timestamp._seconds * 1000 : (typeof a.timestamp === 'number' ? a.timestamp : (a.timestamp ? new Date(a.timestamp).getTime() : 0));
            const timeB = b.timestamp?._seconds ? b.timestamp._seconds * 1000 : (typeof b.timestamp === 'number' ? b.timestamp : (b.timestamp ? new Date(b.timestamp).getTime() : 0));
            return timeB - timeA;
        });

        res.json({ buys, sells, withdrawals });
    } catch(e) {
        console.error(e);
        res.status(500).json({ error: e.message });
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
        if (order.asset === 'TON' || order.asset === 'GRAM') {
            try {
                txResult = await sendTonOnChain(order.receiveAddress, order.amount);
            } catch(txErr) {
                console.error("On-chain transfer failed:", txErr);
                return res.status(500).json({ error: `On-chain transfer failed: ${txErr.message}` });
            }
        } else if (order.asset === 'USDT') {
            try {
                txResult = await sendJettonUsdtOnChain(order.receiveAddress, order.amount);
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
        
        bot.sendMessage(order.userId, `🎉 <b>Payment Approved & Sent!</b>\n\n<b>${order.amount} ${order.asset}</b> has been transferred to your wallet on-chain!\n\n🏷 <b>Wallet:</b> <code>${order.receiveAddress}</code>\n#️⃣ <b>TrxID:</b> <code>${order.trxId}</code>`, { parse_mode: 'HTML' }).catch(e => console.error(e.message));
        
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

        bot.sendMessage(order.userId, `❌ <b>Buy Order Rejected</b>\n\nYour order for ${order.amount} ${order.asset} (TrxID: <code>${order.trxId}</code>) was rejected.\n\n💰 <b>৳${refundBdt} BDT has been refunded to your in-app balance!</b>\nYou can check your balance in the app.`, { parse_mode: 'HTML' }).catch(e => console.error(e.message));

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
        
        const bonusMsg = `<blockquote><b>🎉 বোনাস প্রাপ্তি (Bonus Received)!</b>\n\n` +
            `💰 <b>পরিমাণ:</b> <b>৳${amount} BDT</b>\n\n` +
            `<i>অ্যাডমিন আপনার অ্যাকাউন্টে বোনাস ব্যালেন্স যোগ করেছেন।</i></blockquote>`;
        bot.sendMessage(doc.id, bonusMsg, { parse_mode: 'HTML' }).catch(e => console.error(e.message));
        res.json({ success: true, newBalance });
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
                const userMsg = `<blockquote><b>✅ ক্যাশআউট সম্পন্ন হয়েছে (Withdrawal Successful)!</b>\n\n` +
                    `💰 <b>উত্তোলনের পরিমাণ:</b> ৳${pend?.amount || 0} BDT\n` +
                    `📉 <b>সেন্ড মানি ফি:</b> ৳${pend?.fee || 0} BDT\n` +
                    `💵 <b>প্রদান করা হয়েছে:</b> ৳${pend?.receiveAmount || pend?.amount || 0} BDT\n` +
                    `🏦 <b>মাধ্যম:</b> ${pend?.method || 'bKash'} (<code>${pend?.number || ''}</code>)\n\n` +
                    `আপনার অ্যাকাউন্টে টাকা সফলভাবে পাঠিয়ে দেওয়া হয়েছে। ধন্যবাদ আমাদের সাথে থাকার জন্য!</blockquote>`;
                bot.sendMessage(targetUser, userMsg, { parse_mode: 'HTML' }).catch(e => console.error(e.message));
                
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
                const userRejectMsg = `<blockquote><b>❌ উইথড্র বাতিল ও রিফান্ড (Withdrawal Rejected)!</b>\n\n` +
                    `💰 <b>রিফান্ড পরিমাণ:</b> ৳${refundAmt} BDT\n` +
                    `📝 <b>কারণ:</b> <i>${reason || 'অ্যাকাউন্ট তথ্যে ভুল'}</i>\n\n` +
                    `টাকাটি আপনার অ্যাপ ব্যালেন্সে পুনরায় যোগ করে দেওয়া হয়েছে। তথ্য যাচাই করে আবার চেষ্টা করুন।</blockquote>`;
                bot.sendMessage(targetUser, userRejectMsg, { parse_mode: 'HTML' }).catch(e => console.error(e.message));
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
        
        const buyRef = db.collection('miniapp_buys').doc(trxId);
        const buyDoc = await buyRef.get();
        let autoVerified = false;

        if (buyDoc.exists) {
            const order = buyDoc.data();
            if (order.status === 'pending') {
                await buyRef.update({ 
                    status: 'verified',
                    autoVerified: true
                });
                autoVerified = true;
                
                await db.collection('verified_trx').doc(trxId).set({
                    sender: selectedMethod,
                    message: fakeSms,
                    amount: parsedAmount,
                    claimed: true,
                    claimedBy: order.userId,
                    timestamp: FieldValue.serverTimestamp()
                });

                if (bot && order.userId) {
                    bot.sendMessage(order.userId, `🎉 <b>Payment Auto-Verified!</b>\n\nYour payment for <b>${order.amount} ${order.asset}</b> (TrxID: <code>${trxId}</code>) has been automatically verified via Mock Test!\n\nAdmin will dispatch the asset shortly.`, { parse_mode: 'HTML' }).catch(e => console.error(e.message));
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
        
        res.json({ 
            success: true, 
            message: `Mock TrxID ${trxId} (${parsedAmount} TK) created successfully!`,
            trxId,
            amount: parsedAmount,
            autoVerified,
            fakeSms
        });
    } catch(e) {
        console.error("Mock Trx Error:", e);
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/admin/mock-trxs', async (req, res) => {
    try {
        const snap = await db.collection('verified_trx').orderBy('timestamp', 'desc').limit(20).get();
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json({ success: true, list });
    } catch(e) {
        res.status(500).json({ error: e.message });
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

// Serve MiniApp on /app with caching
app.use('/app', express.static(path.join(__dirname, 'miniapp/dist'), { maxAge: '1d', etag: true }));

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
    if (fs.existsSync(p)) res.sendFile(p);
    else res.send("MiniApp is not built yet.");
});

// Serve Admin on / with caching
app.use(express.static(path.join(__dirname, 'admin/dist'), { maxAge: '1d', etag: true }));
app.use((req, res) => {
    const p = path.join(__dirname, 'admin/dist/index.html');
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
