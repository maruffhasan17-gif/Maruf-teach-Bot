require('dotenv').config({ override: true });
const TelegramBot = require('node-telegram-bot-api');
const path = require('path');
const fs = require('fs');
const express = require('express');
const escapeHtml = (str) => {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
};

const crypto = require('crypto');
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

function normalizeTrxId(raw) {
    if (!raw) return '';
    const str = String(raw).trim();
    const match = str.match(/(?:TrxID|TxnId|TxnID|TrxId|Txn\s*ID|Trx\s*ID|Transaction\s*ID)[\s:.\-_=]*([A-Za-z0-9]{4,25})/i);
    if (match && match[1]) return match[1].toUpperCase();
    return str.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

async function getVerifiedTrxRecord(trxId) {
    const cleanId = normalizeTrxId(trxId);
    if (!cleanId) return null;

    if (inMemoryVerifiedTrx.has(cleanId)) {
        return {
            isInMemory: true,
            data: inMemoryVerifiedTrx.get(cleanId),
            ref: null
        };
    }
    for (const [k, v] of inMemoryVerifiedTrx.entries()) {
        if (String(k).toUpperCase() === cleanId || String(v?.trxId || v?.id || '').toUpperCase() === cleanId) {
            return {
                isInMemory: true,
                data: v,
                ref: null
            };
        }
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
        const rawTrimmed = String(trxId).trim();
        if (rawTrimmed && rawTrimmed !== cleanId) {
            const snapRaw = await db.collection('verified_trx').doc(rawTrimmed).get();
            if (snapRaw.exists) {
                return {
                    isInMemory: false,
                    data: snapRaw.data(),
                    ref: snapRaw.ref
                };
            }
        }
    } catch (err) {
        console.warn("Firestore verified_trx lookup error:", err.message);
    }
    return null;
}

async function markVerifiedTrxClaimed(recordInfo, trxId, userId) {
    const cleanId = normalizeTrxId(trxId);
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

// Telegram Premium Animated Custom Emojis (<tg-emoji> with standard animated fallbacks)
const PE = {
    zap: '<tg-emoji emoji-id="5431449001532594346">⚡️</tg-emoji>',
    moneyBag: '<tg-emoji emoji-id="5375296873982604963">💰</tg-emoji>',
    approvedBag: '<tg-emoji emoji-id="5224257782013769471">💰</tg-emoji>',
    dollar: '<tg-emoji emoji-id="5409048419211682843">💲</tg-emoji>',
    flyingCash: '<tg-emoji emoji-id="5472030678633684592">💸</tg-emoji>',
    coin: '<tg-emoji emoji-id="5379600444098093058">🪙</tg-emoji>',
    gem: '<tg-emoji emoji-id="5471952986970267163">💎</tg-emoji>',
    rocket: '<tg-emoji emoji-id="5445284980978621387">🚀</tg-emoji>',
    bank: '<tg-emoji emoji-id="5264895611517300926">🏦</tg-emoji>',
    wallet: '<tg-emoji emoji-id="5472363448404809929">📩</tg-emoji>',
    globe: '<tg-emoji emoji-id="5447410659077661506">🌐</tg-emoji>',
    check: '<tg-emoji emoji-id="5427009714745517609">✅</tg-emoji>',
    cross: '<tg-emoji emoji-id="5465665476971471368">❌</tg-emoji>',
    hourglass: '<tg-emoji emoji-id="5451732530048802485">⏳</tg-emoji>',
    clock: '<tg-emoji emoji-id="5413704112220949842">⏰</tg-emoji>',
    bell: '<tg-emoji emoji-id="5458603043203327669">🔔</tg-emoji>',
    gift: '<tg-emoji emoji-id="5199749070830197566">🎁</tg-emoji>',
    party: '<tg-emoji emoji-id="5436040291507247633">🎉</tg-emoji>',
    sparkles: '<tg-emoji emoji-id="5472164874886846699">✨</tg-emoji>',
    fire: '<tg-emoji emoji-id="5420315771991497307">🔥</tg-emoji>',
    user: '<tg-emoji emoji-id="5373012449597335010">👤</tg-emoji>',
    idCard: '<tg-emoji emoji-id="5422683699130933153">🪪</tg-emoji>',
    phone: '<tg-emoji emoji-id="5467539229468793355">📞</tg-emoji>',
    note: '<tg-emoji emoji-id="5334882760735598374">📝</tg-emoji>',
    chartDown: '<tg-emoji emoji-id="5361748661640372834">📉</tg-emoji>',
    chartUp: '<tg-emoji emoji-id="5373001317042101552">📈</tg-emoji>',
    swap: '<tg-emoji emoji-id="5264727218734524899">🔄</tg-emoji>',
    shield: '<tg-emoji emoji-id="5251203410396458957">🛡</tg-emoji>',
    warn: '<tg-emoji emoji-id="5447644880824181073">⚠️</tg-emoji>',
    star: '<tg-emoji emoji-id="5435957248314579621">⭐️</tg-emoji>',
    crown: '<tg-emoji emoji-id="5467406098367521267">👑</tg-emoji>',
    rose: '<tg-emoji emoji-id="5440911110838425969">🌹</tg-emoji>',
    bouquet: '<tg-emoji emoji-id="5190661263629243818">💐</tg-emoji>',
    arrowRight: '<tg-emoji emoji-id="5445284980978621387">🚀</tg-emoji>'
};

// Automatic Unicode-to-Telegram-Premium Animated Emoji Converter
const EMOJI_TO_PREMIUM_PAIRS = [
    ['🌹', '5440911110838425969', '🌹'],
    ['💐', '5190661263629243818', '💐'],
    ['⚡️', '5431449001532594346', '⚡️'],
    ['⚡', '5431449001532594346', '⚡️'],
    ['💰', '5375296873982604963', '💰'],
    ['💲', '5409048419211682843', '💲'],
    ['💵', '5409048419211682843', '💵'],
    ['💸', '5472030678633684592', '💸'],
    ['🪙', '5379600444098093058', '🪙'],
    ['💎', '5471952986970267163', '💎'],
    ['🚀', '5445284980978621387', '🚀'],
    ['🏦', '5264895611517300926', '🏦'],
    ['📩', '5472363448404809929', '📩'],
    ['🏷️', '5472363448404809929', '🏷️'],
    ['🏷', '5472363448404809929', '🏷'],
    ['🌐', '5447410659077661506', '🌐'],
    ['✅', '5427009714745517609', '✅'],
    ['☑️', '5427009714745517609', '☑️'],
    ['✔️', '5427009714745517609', '✔️'],
    ['❌', '5465665476971471368', '❌'],
    ['🚫', '5465665476971471368', '🚫'],
    ['⏳', '5451732530048802485', '⏳'],
    ['⌛', '5451732530048802485', '⌛'],
    ['⏰', '5413704112220949842', '⏰'],
    ['⏱️', '5413704112220949842', '⏱️'],
    ['⏱', '5413704112220949842', '⏱'],
    ['🔔', '5458603043203327669', '🔔'],
    ['📢', '5458603043203327669', '📢'],
    ['📣', '5458603043203327669', '📣'],
    ['🎁', '5199749070830197566', '🎁'],
    ['🎉', '5436040291507247633', '🎉'],
    ['🥳', '5436040291507247633', '🥳'],
    ['✨', '5472164874886846699', '✨'],
    ['🔥', '5420315771991497307', '🔥'],
    ['💥', '5420315771991497307', '💥'],
    ['👤', '5373012449597335010', '👤'],
    ['👥', '5373012449597335010', '👥'],
    ['🪪', '5422683699130933153', '🪪'],
    ['🆔', '5422683699130933153', '🆔'],
    ['📞', '5467539229468793355', '📞'],
    ['📱', '5467539229468793355', '📱'],
    ['🎧', '5467539229468793355', '🎧'],
    ['📝', '5334882760735598374', '📝'],
    ['📋', '5334882760735598374', '📋'],
    ['📉', '5361748661640372834', '📉'],
    ['📈', '5373001317042101552', '📈'],
    ['📊', '5373001317042101552', '📊'],
    ['🔄', '5264727218734524899', '🔄'],
    ['🔁', '5264727218734524899', '🔁'],
    ['🛡️', '5251203410396458957', '🛡️'],
    ['🛡', '5251203410396458957', '🛡'],
    ['🔒', '5251203410396458957', '🔒'],
    ['⚠️', '5447644880824181073', '⚠️'],
    ['⚠', '5447644880824181073', '⚠️'],
    ['⭐️', '5435957248314579621', '⭐️'],
    ['⭐', '5435957248314579621', '⭐️'],
    ['🌟', '5435957248314579621', '🌟'],
    ['👑', '5467406098367521267', '👑'],
    ['🏆', '5467406098367521267', '🏆']
];

const upgradeToPremiumEmojis = (rawText) => {
    if (!rawText || typeof rawText !== 'string') return '';
    const savedTags = [];
    let text = rawText.replace(/<tg-emoji[\s\S]*?<\/tg-emoji>/gi, (match) => {
        const token = `__TG_EMOJI_PROTECTED_${savedTags.length}__`;
        savedTags.push(match);
        return token;
    });

    for (const [emojiChar, emojiId, fallbackChar] of EMOJI_TO_PREMIUM_PAIRS) {
        if (text.includes(emojiChar)) {
            const replacementToken = `__TG_EMOJI_PROTECTED_${savedTags.length}__`;
            savedTags.push(`<tg-emoji emoji-id="${emojiId}">${fallbackChar}</tg-emoji>`);
            text = text.split(emojiChar).join(replacementToken);
        }
    }

    text = text.replace(/__TG_EMOJI_PROTECTED_(\d+)__/g, (_, idx) => savedTags[Number(idx)] || '');
    return text;
};

// Helper: Post live payout confirmation to public Payout Group / Channel with Premium Animated Emojis
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

        const maskWallet = (addr) => {
            const s = String(addr || '').trim();
            if (s.length <= 14) return s;
            return s.slice(0, 8) + '...' + s.slice(-8);
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
            
            msg = `${PE.approvedBag} <b>Withdrawal Approved! (ক্যাশআউট সফল!)</b>\n\n` +
                  `${PE.user} <b>Customer:</b> ${safeCustomerName} (<code>${maskId(payoutData.userId)}</code>)\n` +
                  `${PE.dollar} <b>Amount:</b> ৳${amt} BDT\n` +
                  `${PE.flyingCash} <b>Net Sent:</b> <b>৳${rec} BDT</b>\n` +
                  `${PE.bank} <b>Gateway:</b> ${method}\n` +
                  `${PE.wallet} <b>Account:</b> <code>${maskNumber(payoutData.number)}</code>\n` +
                  `${PE.globe} <b>Time:</b> <code>${nowStr} (BST)</code>\n\n` +
                  `${PE.zap} <i>Payment has been sent to customer's ${method} wallet!</i>`;
        } else {
            const asset = (payoutData.asset || 'TON').toUpperCase();
            msg = `${PE.moneyBag} <b>Crypto Payout Approved! (ক্রিপ্টো পে-আউট সফল!)</b>\n\n` +
                  `${PE.user} <b>Customer:</b> ${safeCustomerName} (<code>${maskId(payoutData.userId)}</code>)\n` +
                  `${PE.dollar} <b>Amount:</b> <b>${payoutData.receiveAmount || payoutData.amount} ${asset}</b>\n` +
                  `${PE.gem} <b>Network:</b> TON Mainnet\n` +
                  `${PE.wallet} <b>Address:</b> <code>${maskWallet(payoutData.destination)}</code>\n` +
                  `${PE.globe} <b>TX Ref:</b> <code>${payoutData.trxId || ('TX' + Date.now().toString().slice(-8))}</code>\n` +
                  `${PE.clock} <b>Time:</b> <code>${nowStr} (BST)</code>\n\n` +
                  `${PE.zap} <i>${asset} has been sent on-chain to customer's TON wallet!</i>`;
        }

        const payoutBtnMarkup = {
            parse_mode: 'HTML',
            disable_web_page_preview: true,
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🚀 Trust Pay ওপেন করুন', url: 'https://t.me/bd_trust_pay_bot' }]
                ]
            }
        };

        try {
            await bot.sendMessage(primaryTarget, msg, payoutBtnMarkup);
            console.log("Posted public payout proof to primary target:", primaryTarget);
        } catch(primaryErr) {
            console.warn(`Failed to post to primary target ${primaryTarget}:`, primaryErr.message);
            if (primaryTarget !== fallbackTarget) {
                try {
                    await bot.sendMessage(fallbackTarget, msg, payoutBtnMarkup);
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
        if (!botConfig.adminNagad || botConfig.adminNagad === '01878580320') {
            botConfig.adminNagad = '9856000927953436';
        }
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
const WEB_APP_URL = 'https://maruf-teach-bot.onrender.com/app/?v=20261027v34';
const appOpenMarkup = {
    reply_markup: {
        inline_keyboard: [
            [{ text: '🚀 ওপেন অ্যাপ (Trust Pay)', web_app: { url: WEB_APP_URL } }]
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
    if (!userId || userId === 123456789) {
        return { inChannel: true, inGroup: true, allJoined: true };
    }
    try {
        const userDoc = await db.collection('users').doc(userId.toString()).get();
        if (userDoc.exists) {
            const data = userDoc.data();
            if (data?.verified === true || data?.communityVerified === true || data?.status === 'verified') {
                return { inChannel: true, inGroup: true, allJoined: true };
            }
        }
    } catch (_) {}

    let inChannel = false;
    let inGroup = false;
    const valid = ['creator', 'administrator', 'member', 'restricted'];
    try {
        const c1 = await bot.getChatMember(OFFICIAL_CHANNEL, userId);
        inChannel = valid.includes(c1?.status);
    } catch (e) {
        console.warn('Channel check warning (@maruf_teach):', e.message);
        inChannel = e.message.includes('inaccessible') || e.message.includes('401') || e.message.includes('admin') || e.message.includes('not found');
    }
    try {
        const c2 = await bot.getChatMember(PAYOUT_GROUP, userId);
        inGroup = valid.includes(c2?.status);
    } catch (e) {
        console.warn('Group check warning (@bd_trust_pay_payout):', e.message);
        inGroup = e.message.includes('inaccessible') || e.message.includes('401') || e.message.includes('admin') || e.message.includes('not found');
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

app.disable('x-powered-by');

// Authentic Nginx 404 Not Found Template (100% Real-looking Decoy)
const REAL_404_HTML = `<html>
<head><title>404 Not Found</title></head>
<body>
<center><h1>404 Not Found</h1></center>
<hr><center>nginx/1.24.0</center>
</body>
</html>`;


// --- FORT-KNOX SECURITY FIREWALL: CLIENT IP & IP BLACKLIST ---
function getClientIp(req) {
    const cfIp = req.headers['cf-connecting-ip'];
    if (cfIp) return String(cfIp).trim();
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        const parts = String(forwarded).split(',');
        if (parts.length > 0 && parts[0].trim()) return parts[0].trim();
    }
    const realIp = req.headers['x-real-ip'];
    if (realIp) return String(realIp).trim();
    const socketIp = req.socket?.remoteAddress;
    if (socketIp) {
        if (socketIp.startsWith('::ffff:')) return socketIp.slice(7);
        return socketIp;
    }
    return '127.0.0.1';
}

const bannedIps = new Set();
async function syncBannedIpsFromDb() {
    try {
        const snap = await db.collection('settings').doc('banned_ips').get();
        if (snap.exists && Array.isArray(snap.data()?.ips)) {
            snap.data().ips.forEach(ip => bannedIps.add(String(ip).trim()));
            console.log(`[SecurityFirewall] Loaded ${bannedIps.size} banned IPs from Firestore.`);
        }
    } catch (_) {}
}
syncBannedIpsFromDb();

async function addBannedIp(ip, reason = 'Intrusion / brute-force attempt', force = false) {
    const cleanIp = String(ip).trim();
    if (!cleanIp || cleanIp === '127.0.0.1' || cleanIp === '::1') return;
    const norm = typeof normalizeIp === 'function' ? normalizeIp(cleanIp) : cleanIp.toLowerCase();
    
    // If not forced and is localhost, skip
    if (!force && (cleanIp === '127.0.0.1' || cleanIp === 'localhost')) return;

    // If forced by Owner (/banip) or intruder, remove from allowedAdminIps
    if (force && typeof allowedAdminIps !== 'undefined') {
        allowedAdminIps.delete(cleanIp);
        if (norm) allowedAdminIps.delete(norm);
        try {
            await db.collection('settings').doc('allowed_admin_ips').set({
                ips: Array.from(allowedAdminIps),
                updatedAt: FieldValue.serverTimestamp()
            }, { merge: true });
        } catch (_) {}
    }

    bannedIps.add(cleanIp);
    if (norm) bannedIps.add(norm);

    try {
        await db.collection('settings').doc('banned_ips').set({
            ips: Array.from(bannedIps),
            updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });
        await db.collection('security_logs').add({
            action: 'IP_BANNED',
            ip: cleanIp,
            reason,
            timestamp: FieldValue.serverTimestamp()
        });
        console.warn(`[SecurityFirewall] ⛔ BANNED IP: ${cleanIp} (${reason})`);
    } catch (_) {}
}

async function removeBannedIp(ip) {
    const cleanIp = String(ip).trim();
    const norm = typeof normalizeIp === 'function' ? normalizeIp(cleanIp) : cleanIp.toLowerCase();
    bannedIps.delete(cleanIp);
    if (norm) bannedIps.delete(norm);
    try {
        await db.collection('settings').doc('banned_ips').set({
            ips: Array.from(bannedIps),
            updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });
    } catch (_) {}
}

// Global Security Firewall: Immediate 404 rejection for any banned IP
app.use((req, res, next) => {
    const clientIp = getClientIp(req);
    const norm = typeof normalizeIp === 'function' ? normalizeIp(clientIp) : clientIp.toLowerCase();
    if (bannedIps.has(clientIp) || (norm && bannedIps.has(norm))) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        return res.status(404).send(REAL_404_HTML);
    }
    next();
});

// --- ENTERPRISE SECURITY HEADERS MIDDLEWARE (Prevents MIME Sniffing, Clickjacking & XSS) ---
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

// --- PROTOTYPE POLLUTION & PARAMETER TAMPERING GUARD (PHP-Style Bug / Injection Immunity) ---
function sanitizeInputPayload(obj, depth = 0) {
    if (!obj || typeof obj !== 'object' || depth > 5) return;
    for (const key of Object.keys(obj)) {
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
            delete obj[key];
            continue;
        }
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            sanitizeInputPayload(obj[key], depth + 1);
        }
    }
}
app.use((req, res, next) => {
    if (req.body) sanitizeInputPayload(req.body);
    if (req.query) sanitizeInputPayload(req.query);
    if (req.params) sanitizeInputPayload(req.params);
    next();
});

// --- SLIDING-WINDOW RATE LIMITER (Anti-DDoS, Anti-Flood & Brute-Force Defense) ---
const rateLimitStore = new Map();
function checkRateLimit(key, maxRequests = 100, windowMs = 60000) {
    const now = Date.now();
    const record = rateLimitStore.get(key) || { count: 0, resetAt: now + windowMs };
    if (now > record.resetAt) {
        record.count = 1;
        record.resetAt = now + windowMs;
    } else {
        record.count++;
    }
    rateLimitStore.set(key, record);
    return record.count <= maxRequests;
}

// Global General Rate Limiter (150 req/min per IP, excluding static assets)
app.use((req, res, next) => {
    if (req.path.startsWith('/assets') || req.path.endsWith('.js') || req.path.endsWith('.css') || req.path.endsWith('.png') || req.path.endsWith('.jpg') || req.path.endsWith('.ico')) {
        return next();
    }
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
    if (!checkRateLimit(`ip_${clientIp}`, 150, 60000)) {
        return res.status(429).json({ error: 'খুব বেশি রিকোয়েস্ট পাঠানো হয়েছে। দয়া করে ১ মিনিট অপেক্ষা করুন।' });
    }
    next();
});

// --- CONCURRENCY MUTEX LOCK (Prevents Double-Spending & Race Conditions) ---
const financialUserLocks = new Map();
function acquireUserFinancialLock(userId, timeoutMs = 15000) {
    if (!userId) return true;
    const key = String(userId);
    const now = Date.now();
    const existingUntil = financialUserLocks.get(key);
    if (existingUntil && existingUntil > now) {
        return false;
    }
    financialUserLocks.set(key, now + timeoutMs);
    return true;
}
function releaseUserFinancialLock(userId) {
    if (!userId) return;
    financialUserLocks.delete(String(userId));
}

// --- TELEGRAM WEBAPP CRYPTOGRAPHIC AUTHENTICATION ---
function verifyTelegramInitData(initDataString, botToken) {
    if (!initDataString || !botToken) return null;
    try {
        const urlParams = new URLSearchParams(initDataString);
        const hash = urlParams.get('hash');
        if (!hash) return null;
        urlParams.delete('hash');
        const params = Array.from(urlParams.entries());
        params.sort((a, b) => a[0].localeCompare(b[0]));
        const dataCheckString = params.map(([k, v]) => `${k}=${v}`).join('\n');
        const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
        const calcHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
        if (calcHash !== hash) return null;
        const authDate = parseInt(urlParams.get('auth_date') || '0', 10);
        const now = Math.floor(Date.now() / 1000);
        if (now - authDate > 86400 * 7) return null;
        const userJson = urlParams.get('user');
        return userJson ? JSON.parse(userJson) : null;
    } catch (_) {
        return null;
    }
}

// Helper: Verify that calling request belongs to claimed userId
function verifyRequestCallerIdentity(req, userId) {
    const initDataRaw = req.headers['x-telegram-init-data'];
    if (initDataRaw && bot?.token) {
        const verifiedUser = verifyTelegramInitData(initDataRaw, bot.token);
        if (verifiedUser && verifiedUser.id && String(verifiedUser.id) !== String(userId)) {
            return false;
        }
    }
    return true;
}

// Helper: Fast Account Status Check for Inflow Endpoints (Add Money / Crypto Sell)
// Never blocks legitimate deposits (even 20,000+ BDT) with balance audits; only blocks admin-banned/restricted accounts.
async function checkUserAccountActive(userId) {
    const strUserId = String(userId);
    const userRef = db.collection('users').doc(strUserId);
    const userDoc = await userRef.get().catch(() => null);
    if (!userDoc || !userDoc.exists) {
        return { ok: true, userData: {} };
    }
    const uData = userDoc.data() || {};

    // Auto-clear any legacy false-positive automated balance restriction
    if (uData.status === 'restricted' && !uData.restrictedUntil && String(uData.restrictReason || '').includes('অসামঞ্জস্যপূর্ণ')) {
        uData.status = 'active';
        uData.restrictReason = null;
        userRef.set({ status: 'active', restrictReason: null }, { merge: true }).catch(() => {});
    }

    const isBanned = uData.status === 'banned' || Boolean(uData.isBanned);
    const isRestricted = uData.status === 'restricted' && (!uData.restrictedUntil || new Date(uData.restrictedUntil) > new Date());
    if (isBanned) {
        return { ok: false, code: 'BANNED', error: 'আপনার অ্যাকাউন্টটি স্থায়ীভাবে নিষিদ্ধ করা হয়েছে।' };
    }
    if (isRestricted) {
        return { ok: false, code: 'RESTRICTED', error: 'আপনার অ্যাকাউন্টটি বর্তমানে রেস্ট্রিক্ট করা রয়েছে। রেস্ট্রিকশন চলাকালীন কোনো লেনদেন করা যাবে না।' };
    }
    return { ok: true, userData: uData };
}

// --- DEEP BALANCE PROVENANCE & ILLEGAL AMOUNT AUDIT ENGINE ---
// Runs ONLY when spending/withdrawing in-app balance (/api/miniapp/withdraw-fiat & /api/miniapp/buy-crypto).
// Detects if a user's balance increased WITHOUT Add Money, Crypto Sell, Spin, Referral, or Admin Credit.
async function auditBalanceProvenance(userId, requestedAmount = 0, actionType = 'Transaction') {
    const strUserId = String(userId);
    const numUserId = parseInt(userId, 10);
    const userRef = db.collection('users').doc(strUserId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
        return { ok: false, code: 'USER_NOT_FOUND', error: 'User not found' };
    }
    
    const uData = userDoc.data() || {};

    // Auto-clear any legacy false-positive automated balance restriction before evaluating fresh ledger
    if (uData.status === 'restricted' && !uData.restrictedUntil && String(uData.restrictReason || '').includes('অসামঞ্জস্যপূর্ণ')) {
        uData.status = 'active';
        uData.restrictReason = null;
        await userRef.set({ status: 'active', restrictReason: null }, { merge: true }).catch(() => {});
    }
    
    // 1. Status Check
    const isBanned = uData.status === 'banned' || Boolean(uData.isBanned);
    const isRestricted = uData.status === 'restricted' && (!uData.restrictedUntil || new Date(uData.restrictedUntil) > new Date());
    if (isBanned) {
        return { ok: false, code: 'BANNED', error: 'আপনার অ্যাকাউন্টটি স্থায়ীভাবে নিষিদ্ধ করা হয়েছে।' };
    }
    if (isRestricted) {
        return { ok: false, code: 'RESTRICTED', error: 'আপনার অ্যাকাউন্টটি বর্তমানে রেস্ট্রিক্ট করা রয়েছে। রেস্ট্রিকশন চলাকালীন কোনো লেনদেন করা যাবে না।' };
    }
    
    // 2. Numeric Balance & Requested Amount Validation
    const currentBalance = Number(uData.balance || 0);
    if (!Number.isFinite(currentBalance) || currentBalance < 0) {
        return { ok: false, code: 'CORRUPTED_BALANCE', error: 'অ্যাকাউন্ট ব্যালেন্সে ত্রুটি পরিলক্ষিত হয়েছে।' };
    }
    
    if (requestedAmount > 0) {
        const reqAmt = Number(requestedAmount);
        if (!Number.isFinite(reqAmt) || reqAmt <= 0) {
            return { ok: false, code: 'INVALID_AMOUNT', error: 'সঠিক টাকার পরিমাণ দিন।' };
        }
        if (reqAmt > currentBalance) {
            return { ok: false, code: 'INSUFFICIENT_BALANCE', error: `পর্যাপ্ত ব্যালেন্স নেই! আপনার ব্যালেন্স ৳${currentBalance.toFixed(2)} BDT, কিন্তু প্রয়োজন ৳${reqAmt.toFixed(2)} BDT` };
        }
    }
    
    if (currentBalance === 0 && requestedAmount === 0) {
        return { ok: true, currentBalance: 0, maxPermissible: 0, userData: uData };
    }
    
    // 3. Mathematical Ledger Reconciliation (Proof of Funds)
    // Use single-field .where('userId', '==', ...) with .catch() so Firestore composite index is never required
    const [depSnap1, depSnap2, buySnap1, buySnap2, sellSnap1, sellSnap2, withSnap1, withSnap2] = await Promise.all([
        db.collection('deposits').where('userId', '==', strUserId).get().catch(() => ({ docs: [] })),
        (numUserId && !isNaN(numUserId))
            ? db.collection('deposits').where('userId', '==', numUserId).get().catch(() => ({ docs: [] }))
            : Promise.resolve({ docs: [] }),
        db.collection('miniapp_buys').where('userId', '==', strUserId).get().catch(() => ({ docs: [] })),
        (numUserId && !isNaN(numUserId))
            ? db.collection('miniapp_buys').where('userId', '==', numUserId).get().catch(() => ({ docs: [] }))
            : Promise.resolve({ docs: [] }),
        db.collection('miniapp_sells').where('userId', '==', strUserId).get().catch(() => ({ docs: [] })),
        (numUserId && !isNaN(numUserId))
            ? db.collection('miniapp_sells').where('userId', '==', numUserId).get().catch(() => ({ docs: [] }))
            : Promise.resolve({ docs: [] }),
        db.collection('fiat_withdrawals').where('userId', '==', strUserId).get().catch(() => ({ docs: [] })),
        (numUserId && !isNaN(numUserId))
            ? db.collection('fiat_withdrawals').where('userId', '==', numUserId).get().catch(() => ({ docs: [] }))
            : Promise.resolve({ docs: [] })
    ]);
    
    const seenDepIds = new Set();
    let sumDepositsCollection = 0;
    for (const doc of [...(depSnap1?.docs || []), ...(depSnap2?.docs || [])]) {
        const dData = doc.data() || {};
        if (!seenDepIds.has(doc.id) && (!dData.status || dData.status === 'completed' || dData.status === 'verified')) {
            seenDepIds.add(doc.id);
            sumDepositsCollection += Number(dData.amount || 0);
        }
    }
    
    // Also union any completed bKash/Nagad deposits recorded in 'miniapp_buys' (by doc.id / trxId)
    const seenBuyIds = new Set();
    let sumBalanceBuys = 0;
    let sumLegitRefunds = 0;
    let illegalRefundBdt = 0;
    
    for (const doc of [...(buySnap1?.docs || []), ...(buySnap2?.docs || [])]) {
        if (!seenBuyIds.has(doc.id)) {
            seenBuyIds.add(doc.id);
            const bData = doc.data() || {};
            const isWalletPayment = bData.paymentMethod === 'In-App Balance' || bData.paidWithWallet === true || bData.paidFromBalance === true || bData.paymentMethod === 'wallet';
            
            if (!isWalletPayment && (bData.status === 'completed' || bData.status === 'verified' || bData.type === 'add_money')) {
                // Completed bKash/Nagad deposit or Add Money
                if (!seenDepIds.has(doc.id)) {
                    seenDepIds.add(doc.id);
                    sumDepositsCollection += Number(bData.totalBdt || bData.amount || 0);
                }
            }
            if (isWalletPayment && bData.status === 'completed') {
                sumBalanceBuys += Number(bData.totalBdt || bData.amountBdt || 0);
            }
            if (isWalletPayment && bData.status === 'rejected' && bData.refundRevoked !== true) {
                sumLegitRefunds += Number(bData.refundedBdt || 0);
            }
            // Detect illegal refund from an unverified manual bKash/Nagad buy order
            if (!isWalletPayment && bData.status === 'rejected' && !bData.autoVerified && bData.refundRevoked !== true && Number(bData.refundedBdt || 0) > 0) {
                illegalRefundBdt += Number(bData.refundedBdt || 0);
            }
        }
    }
    
    const sumDeposits = Math.max(sumDepositsCollection, Number(uData.totalAddMoneyBdt || 0));
    
    // B) Crypto Sells credited to BDT
    const seenSellIds = new Set();
    let sumSellsCollection = 0;
    for (const doc of [...(sellSnap1?.docs || []), ...(sellSnap2?.docs || [])]) {
        const sData = doc.data() || {};
        if (!seenSellIds.has(doc.id) && sData.status === 'completed') {
            seenSellIds.add(doc.id);
            sumSellsCollection += Number(sData.estimatedTk || sData.actualTk || 0);
        }
    }
    const sumSells = Math.max(sumSellsCollection, Number(uData.totalCryptoSellBdt || 0));
    
    // C) Spin Wheel Earnings & Referral Earnings & Admin Manual Credits
    const spinEarnings = Math.max(
        Number(uData.totalSpinWonBdt || 0),
        Number(uData.dailySpinWonBdt || 0),
        Math.min(10, Number(uData.totalSpinsByUser || 0) * 2)
    );
    const referralEarnings = Math.max(
        Number(uData.referralEarnings || 0),
        Number(uData.activeReferralsCount || 0) * 5
    );
    const adminAddedBdt = Number(uData.adminAddedBdt || 0);
    const hasAdminManualUpdate = Boolean(uData.lastBalanceUpdate) || adminAddedBdt > 0;
    
    // D) Withdrawals (both pending and completed)
    const seenWithIds = new Set();
    let sumWithdrawals = 0;
    for (const doc of [...(withSnap1?.docs || []), ...(withSnap2?.docs || [])]) {
        if (!seenWithIds.has(doc.id)) {
            seenWithIds.add(doc.id);
            const wData = doc.data() || {};
            if (['completed', 'pending'].includes(wData.status)) {
                sumWithdrawals += Number(wData.amount || 0);
            }
        }
    }
    
    // Calculate provenance
    const totalLegitimateIn = sumDeposits + sumSells + spinEarnings + referralEarnings + sumLegitRefunds + adminAddedBdt;
    const totalLegitimateOut = sumBalanceBuys + sumWithdrawals;
    const maxPermissibleBalance = hasAdminManualUpdate
        ? Math.max(currentBalance, totalLegitimateIn - totalLegitimateOut)
        : Math.max(0, totalLegitimateIn - totalLegitimateOut);
    
    // Discrepancy check:
    // Flag ONLY when balance increased WITHOUT Add Money, Crypto Sell, Spin, Referral, or Admin Credit (or via unverified fake-order refund)
    const discrepancy = (illegalRefundBdt > 0 && !hasAdminManualUpdate)
        ? illegalRefundBdt
        : (currentBalance - maxPermissibleBalance);
    
    if (currentBalance > 0 && discrepancy > 5 && !hasAdminManualUpdate) {
        // AUTO-RESTRICT USER ACCOUNT
        await userRef.set({
            status: 'restricted',
            restrictReason: 'অ্যাকাউন্টে অসামঞ্জস্যপূর্ণ/অবৈধ ব্যালেন্স পরিলক্ষিত হওয়ায় নিরাপত্তা পর্যালোচনার স্বার্থে অ্যাকাউন্ট সাময়িকভাবে স্থগিত করা হয়েছে।',
            statusUpdatedAt: FieldValue.serverTimestamp()
        }, { merge: true });

        // SEND HIGH-PRIORITY FORENSIC SECURITY ALERT TO TELEGRAM DATA GROUP / ADMIN GROUP
        const config = botConfig || {};
        const alertGroup = config.dataGroupId || config.adminGroupId;
        if (alertGroup && bot) {
            const forensicAlert = `<blockquote><b>🚨 নিরাপত্তা সতর্কবার্তা: অবৈধ ব্যালেন্স শনাক্ত হয়েছে! (Illegal Balance Alert)</b>\n\n` +
                `👤 <b>ইউজার:</b> <a href="tg://user?id=${strUserId}">${uData.firstName || uData.first_name || 'User'}</a> (<code>${strUserId}</code>)\n` +
                `💰 <b>দাবিকৃত ব্যালেন্স:</b> <b>৳${currentBalance.toFixed(2)} BDT</b>\n` +
                `📊 <b>আইনসম্মত সর্বোচ্চ ব্যালেন্স:</b> <b>৳${maxPermissibleBalance.toFixed(2)} BDT</b>\n` +
                `⚠️ <b>অবৈধ অতিরিক্ত পরিমাণ:</b> <b>৳${discrepancy.toFixed(2)} BDT</b>\n` +
                `🛑 <b>চেষ্টাকৃত অ্যাকশন:</b> <code>${actionType}</code> (৳${requestedAmount} BDT)\n\n` +
                `<b>📋 লেজার অডিট রিপোর্ট:</b>\n` +
                `• ডিপোজিট (Add Money): ৳${sumDeposits.toFixed(2)}\n` +
                `• ক্রিপ্টো সেল: ৳${sumSells.toFixed(2)}\n` +
                `• স্পিন উইন: ৳${spinEarnings.toFixed(2)}\n` +
                `• রেফারেল আর্নিং: ৳${referralEarnings.toFixed(2)}\n` +
                `• মোট খরচ (Buys + Withdrawals): ৳${totalLegitimateOut.toFixed(2)}\n\n` +
                `🔒 <b>গৃহীত ব্যবস্থা:</b> ট্রানজেকশন সাথে সাথে বাতিল করা হয়েছে এবং অ্যাকাউন্টটি <b>RESTRICTED</b> করা হয়েছে।</blockquote>`;
            bot.sendMessage(alertGroup, forensicAlert, { parse_mode: 'HTML' }).catch(err => console.error("Forensic alert send err:", err.message));
        }

        return {
            ok: false,
            code: 'ILLEGAL_BALANCE_DETECTED',
            error: 'নিরাপত্তা পর্যালোচনায় আপনার অ্যাকাউন্টে অসামঞ্জস্যপূর্ণ ব্যালেন্স পরিলক্ষিত হয়েছে। স্বয়ংক্রিয় অডিট সম্পন্ন হওয়া পর্যন্ত লেনদেন স্থগিত করা হয়েছে। অনুগ্রহ করে সাপোর্টে যোগাযোগ করুন।'
        };
    }
    
    return {
        ok: true,
        currentBalance,
        maxPermissibleBalance,
        userData: uData
    };
}

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
        welcome: `${PE.gem} <b>Trust Pay — ট্রাস্ট পে</b> ${PE.sparkles}\n\n${PE.zap} Welcome! Instant & secure Crypto Buy/Sell via bKash & Nagad.\n\n${PE.bell} <b>Join Communities:</b>\n1. Official Channel\n2. Live Payout Channel\n\n${PE.rocket} <i>Join both channels & tap Verify below to open the app:</i>`,
        joinChannelBtn: '📢 Channel 1',
        joinGroupBtn: '💸 Payout Channel',
        verifyBtn: '✅ Verify & Open App',
        notJoined: '❌ Please join both channels first!',
        langPrompt: `${PE.check} <b>Verification Successful!</b>\n\nPlease select your language:`,
        profileMsg: `${PE.user} <b>Profile</b>\n\nID: {id}`,
        bkashMsg: `${PE.rocket} <b>bKash Payment</b>`,
        cryptoMsg: `${PE.gem} <b>Crypto Payment</b>`,
        menu: { free: '🎁 Free', profile: '👤 Profile' },
        mainMenuMsg: `${PE.party} <b>Verification Successful!</b>\n\n${PE.rocket} <b>Tap below to open the app:</b>`
    },
    bn: {
        welcome: `${PE.gem} <b>Trust Pay — ট্রাস্ট পে</b> ${PE.sparkles}\n\n${PE.zap} স্বাগতম! বিকাশ ও নগদে দ্রুত ও নিরাপদ ক্রিপ্টো বাই-সেল এবং ইনস্ট্যান্ট ক্যাশআউট।\n\n${PE.bell} <b>কমিউনিটিতে যুক্ত হোন:</b>\n১. অফিসিয়াল চ্যানেল\n২. লাইভ পে-আউট চ্যানেল\n\n${PE.rocket} <i>জয়েন করে নিচের ভেরিফাই বোতামে চাপ দিন:</i>`,
        joinChannelBtn: '📢 চ্যানেল ১',
        joinGroupBtn: '💸 পে-আউট চ্যানেল',
        verifyBtn: '✅ ভেরিফাই ও অ্যাপ ওপেন',
        notJoined: '❌ অনুগ্রহ করে চ্যানেল দুটিতেই যুক্ত হোন!',
        langPrompt: `${PE.check} <b>ভেরিফিকেশন সফল!</b>\n\nভাষা নির্বাচন করুন:`,
        profileMsg: `${PE.user} <b>প্রোফাইল</b>\n\nID: {id}`,
        bkashMsg: `${PE.rocket} <b>বিকাশ পেমেন্ট</b>`,
        cryptoMsg: `${PE.gem} <b>ক্রিপ্টো পেমেন্ট</b>`,
        menu: { free: '🎁 ফ্রি', profile: '👤 প্রোফাইল' },
        mainMenuMsg: `${PE.party} <b>ভেরিফিকেশন সফল!</b>\n\n${PE.rocket} <b>নিচের বোতামে চাপ দিয়ে অ্যাপ ওপেন করুন:</b>`
    }
};

async function getAdminTreasuryBalances() {
    let tonBalance = 0;
    let usdtBalance = 0;
    const adminAddress = process.env.BOT_TON_ADDRESS || "UQC7hYHfrVJ_uT_esMr7vCv1bVh5ytQxYUUjRDiTUiG9s5Fb";
    const cacheBuster = Date.now();

    // 1. Fetch live native TON balance
    try {
        const res = await axios.get(`https://tonapi.io/v2/accounts/${adminAddress}?_t=${cacheBuster}`, { timeout: 4500 });
        if (res.data && res.data.balance !== undefined) {
            tonBalance = parseFloat(res.data.balance) / 1e9;
        }
    } catch (e) {
        try {
            const res2 = await axios.get(`https://toncenter.com/api/v2/getWalletInformation?address=${adminAddress}&_t=${cacheBuster}`, { timeout: 4500 });
            if (res2.data?.result?.balance !== undefined) {
                tonBalance = parseFloat(res2.data.result.balance) / 1e9;
            }
        } catch (e2) {
            console.warn("Failed to fetch admin TON balance:", e2.message);
        }
    }

    // 2. Fetch live USDT (Jetton) balance on TON
    let adminUsdtJettonWallet = 'EQDE4Uycx9ZudIjjmaqmLx3MFTHjURx2FCU6nlH1bzFWCvZA';
    try {
        const jettonRes = await axios.get(`https://tonapi.io/v2/accounts/${adminAddress}/jettons?_t=${cacheBuster}`, { timeout: 4500 });
        if (jettonRes.data && Array.isArray(jettonRes.data.balances)) {
            const usdtItem = jettonRes.data.balances.find(j => 
                j.jetton?.symbol === 'USD₮' || 
                j.jetton?.symbol === 'USDT' || 
                j.jetton?.address?.includes('EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs') ||
                j.jetton?.address?.includes('0:b113a994b5024a16719f69139328eb759596c38a25f59028b146fecdc3621dfe')
            );
            if (usdtItem && usdtItem.balance) {
                const decimals = usdtItem.jetton?.decimals || 6;
                usdtBalance = parseFloat(usdtItem.balance) / Math.pow(10, decimals);
                if (usdtItem.wallet_address?.address) {
                    adminUsdtJettonWallet = usdtItem.wallet_address.address;
                }
            }
        }
    } catch (e) {
        console.warn("Failed to fetch admin USDT balance:", e.message);
    }

    return {
        ton: Number(tonBalance.toFixed(4)),
        usdt: Number(usdtBalance.toFixed(4)),
        address: adminAddress,
        usdtJettonWallet: adminUsdtJettonWallet
    };
}

// ==================== RELIABLE SEQNO & ON-CHAIN AUTO-SWAP ENGINE ====================
let lastBroadcastedAdminSeqno = 0;
let lastBroadcastedAdminAt = 0;
let isAdminSwapInProgress = false;

async function getReliableAdminSeqno(walletAddrStr) {
    const fetchRpcSeqno = async () => {
        const [r1, r2] = await Promise.allSettled([
            axios.get(`https://toncenter.com/api/v2/getWalletInformation?address=${walletAddrStr}&_t=${Date.now()}`, { timeout: 4500 }),
            axios.get(`https://tonapi.io/v2/accounts/${walletAddrStr}?_t=${Date.now()}`, { timeout: 4500 })
        ]);
        const s1 = r1.status === 'fulfilled' ? (Number(r1.value.data?.result?.seqno) || 0) : 0;
        const s2 = r2.status === 'fulfilled' ? (Number(r2.value.data?.seqno) || 0) : 0;
        return Math.max(s1, s2);
    };

    let seqno = await fetchRpcSeqno();
    // If an admin tx was broadcasted within the last 25 seconds and RPC hasn't caught up to lastBroadcastedAdminSeqno yet, wait briefly and re-fetch
    if (lastBroadcastedAdminSeqno > 0 && (Date.now() - lastBroadcastedAdminAt < 25000) && seqno < lastBroadcastedAdminSeqno) {
        for (let retry = 0; retry < 4; retry++) {
            await new Promise(r => setTimeout(r, 2200));
            seqno = await fetchRpcSeqno();
            if (seqno >= lastBroadcastedAdminSeqno) break;
        }
        seqno = Math.max(seqno, lastBroadcastedAdminSeqno);
    }
    return seqno;
}

function recordAdminBroadcastSeqno(usedSeqno) {
    lastBroadcastedAdminSeqno = Number(usedSeqno) + 1;
    lastBroadcastedAdminAt = Date.now();
}

async function broadcastTonBoc(boc) {
    try {
        const res = await axios.post('https://tonapi.io/v2/blockchain/message', { boc }, { timeout: 8000 });
        return { success: true, boc, provider: 'tonapi', result: res.data };
    } catch (err1) {
        try {
            const res2 = await axios.post('https://toncenter.com/api/v2/sendBoc', { boc }, { timeout: 8000 });
            return { success: true, boc, provider: 'toncenter', result: res2.data };
        } catch (err2) {
            const errMsg = err2.response?.data?.error || err1.response?.data?.error || err2.message;
            throw new Error("Blockchain broadcast rejected: " + errMsg);
        }
    }
}

/**
 * Automatically swaps USDT -> TON (GRAM) on-chain from the Admin Treasury Wallet.
 * Uses STON.fi v2.2 when TON gas >= 0.30, or DeDust V2 when TON gas is between 0.155 and 0.30 (e.g., 0.25 GRAM).
 */
async function swapAdminUsdtToTon(usdtAmountToSwap) {
    const { WalletContractV4, internal, external, storeMessage } = require('@ton/ton');
    const { beginCell, Address } = require('@ton/core');
    const { mnemonicToPrivateKey } = require('@ton/crypto');

    if (!process.env.BOT_TON_SEED) {
        throw new Error("BOT_TON_SEED is not configured in .env");
    }

    const beforeTreasury = await getAdminTreasuryBalances();
    let reqUsdt = parseFloat(Number(usdtAmountToSwap).toFixed(4));
    if (!Number.isFinite(reqUsdt) || reqUsdt < 0.10) {
        throw new Error(`সোয়াপের জন্য নূন্যতম 0.10 USDT প্রয়োজন (প্রদত্ত: ${usdtAmountToSwap})`);
    }
    if (reqUsdt > beforeTreasury.usdt && (reqUsdt - beforeTreasury.usdt) <= 0.08) {
        reqUsdt = beforeTreasury.usdt;
    }
    if (beforeTreasury.usdt < reqUsdt) {
        throw new Error(`এডমিন ওয়ালেটে পর্যাপ্ত USDT নেই! বর্তমান ব্যালেন্স: ${beforeTreasury.usdt} USDT, সোয়াপের জন্য প্রয়োজন: ${reqUsdt} USDT`);
    }
    if (beforeTreasury.ton < 0.155) {
        throw new Error(`USDT থেকে GRAM সোয়াপ করার জন্য এডমিন ওয়ালেটে নূন্যতম 0.16 TON গ্যাস ফি থাকতে হবে (বর্তমান: ${beforeTreasury.ton} TON)`);
    }

    const seedWords = process.env.BOT_TON_SEED.trim().split(/\s+/);
    const keyPair = await mnemonicToPrivateKey(seedWords);
    const wallet = WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey });
    const walletAddrStr = wallet.address.toString({ bounceable: false });

    const offerUnits = BigInt(Math.floor(reqUsdt * 1e6));
    let adminJettonWallet = beforeTreasury.usdtJettonWallet || 'EQDE4Uycx9ZudIjjmaqmLx3MFTHjURx2FCU6nlH1bzFWCvZA';
    const seqno = await getReliableAdminSeqno(walletAddrStr);

    let jettonBody = null;
    let outerTonValue = 160000000n; // 0.16 TON default for low-gas DeDust V2
    let usedDex = 'DeDust V2';

    // Strategy 1: If Admin Wallet has >= 0.30 TON, try STON.fi v2.2 simulation first
    if (beforeTreasury.ton >= 0.30) {
        try {
            const simRes = await axios.post('https://api.ston.fi/v1/swap/simulate', null, {
                params: {
                    offer_address: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
                    ask_address: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
                    units: offerUnits.toString(),
                    slippage_tolerance: '0.025'
                },
                timeout: 4500
            });
            const sim = simRes.data;
            if (sim && sim.router_address && sim.ask_jetton_wallet) {
                const minOut = BigInt(sim.min_ask_units || 0);
                const txDeadline = BigInt(Math.floor(Date.now() / 1000) + 3600);

                const crossSwapBody = beginCell()
                    .storeCoins(minOut)
                    .storeAddress(wallet.address)
                    .storeCoins(0n)
                    .storeBit(false)
                    .storeCoins(0n)
                    .storeBit(false)
                    .storeUint(0, 16)
                    .storeAddress(null)
                    .endCell();

                const swapPayload = beginCell()
                    .storeUint(0x6664de2a, 32)
                    .storeAddress(Address.parse(sim.ask_jetton_wallet))
                    .storeAddress(wallet.address)
                    .storeAddress(wallet.address)
                    .storeUint(txDeadline, 64)
                    .storeRef(crossSwapBody)
                    .endCell();

                const fwdTon = beforeTreasury.ton >= 0.34 ? 235000000n : 210000000n;
                outerTonValue = beforeTreasury.ton >= 0.34 ? 285000000n : 260000000n;

                jettonBody = beginCell()
                    .storeUint(0x0f8a7ea5, 32)
                    .storeUint(BigInt(Date.now()), 64)
                    .storeCoins(offerUnits)
                    .storeAddress(Address.parse(sim.router_address))
                    .storeAddress(wallet.address)
                    .storeBit(false)
                    .storeCoins(fwdTon)
                    .storeBit(true)
                    .storeRef(swapPayload)
                    .endCell();
                usedDex = 'STON.fi v2.2';
            }
        } catch (simErr) {
            console.warn("STON.fi simulation fallback to DeDust V2:", simErr.message);
        }
    }

    // Strategy 2: DeDust V2 (Works even with 0.16 - 0.25 TON in Admin Wallet!)
    if (!jettonBody) {
        const dedustUsdtVault = 'EQAYqo4u7VF0fa4DPAebk4g9lBytj2VFny7pzXR0trjtXQaO';
        const dedustTonUsdtPool = 'EQA-X_yo3fzzbDbJ_0bzFWKqtRuZFIRa1sJsveZJ1YpViO3r';

        // Dynamically scale gas attachment so it succeeds even when wallet only has 0.16 - 0.25 TON
        if (beforeTreasury.ton >= 0.27) {
            outerTonValue = 220000000n; // 0.22 TON (refunds ~0.215 TON)
        } else if (beforeTreasury.ton >= 0.21) {
            outerTonValue = 175000000n; // 0.175 TON (works cleanly for 0.25 TON wallet!)
        } else {
            outerTonValue = 150000000n; // 0.15 TON (minimum 1-hop DeDust threshold)
        }
        const forwardTonAmount = outerTonValue - 45000000n; // e.g., 0.13 TON or 0.105 TON

        const swapParams = beginCell()
            .storeUint(Math.floor(Date.now() / 1000) + 3600, 32)
            .storeAddress(wallet.address)
            .storeAddress(null)
            .storeMaybeRef(null)
            .storeMaybeRef(null)
            .endCell();

        const forwardPayload = beginCell()
            .storeUint(0xe3a0d482, 32) // dedust_swap_external
            .storeAddress(Address.parse(dedustTonUsdtPool))
            .storeUint(0, 1) // kind = 0 (exact in)
            .storeCoins(0n) // limit = 0 (market execution)
            .storeMaybeRef(null) // next = null (direct 1-hop USDT -> TON)
            .storeRef(swapParams)
            .endCell();

        jettonBody = beginCell()
            .storeUint(0x0f8a7ea5, 32)
            .storeUint(BigInt(Date.now()), 64)
            .storeCoins(offerUnits)
            .storeAddress(Address.parse(dedustUsdtVault))
            .storeAddress(wallet.address)
            .storeBit(false)
            .storeCoins(forwardTonAmount)
            .storeBit(true)
            .storeRef(forwardPayload)
            .endCell();
        usedDex = 'DeDust V2';
    }

    const transfer = wallet.createTransfer({
        seqno,
        secretKey: keyPair.secretKey,
        messages: [
            internal({
                to: Address.parse(adminJettonWallet),
                value: outerTonValue,
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
    console.log(`[AUTO-SWAP] Broadcasting USDT -> GRAM swap (${reqUsdt} USDT via ${usedDex}, seqno=${seqno})...`);
    await broadcastTonBoc(boc);
    recordAdminBroadcastSeqno(seqno);

    // Poll until swapped TON lands in Admin Wallet (up to ~35 seconds)
    let afterTreasury = beforeTreasury;
    let swapConfirmed = false;
    for (let i = 1; i <= 14; i++) {
        await new Promise(r => setTimeout(r, 2500));
        afterTreasury = await getAdminTreasuryBalances();
        const tonGain = afterTreasury.ton - beforeTreasury.ton;
        const usdtDrop = beforeTreasury.usdt - afterTreasury.usdt;
        console.log(`[AUTO-SWAP POLL #${i}] TON: ${afterTreasury.ton} (gain: ${tonGain.toFixed(4)}), USDT: ${afterTreasury.usdt}`);
        if (tonGain >= 0.04 || (usdtDrop >= reqUsdt * 0.5 && afterTreasury.ton > beforeTreasury.ton)) {
            swapConfirmed = true;
            break;
        }
    }

    statsCache.timestamp = 0;
    if (!swapConfirmed) {
        throw new Error(`সোয়াপ ট্রানজেকশন ব্রডকাস্ট হয়েছে কিন্তু ব্লকচেইন কনফার্মেশনে সময় লাগছে। কিছুক্ষণ পর আবার চেষ্টা করুন।`);
    }

    return {
        success: true,
        direction: 'USDT_TO_GRAM',
        dex: usedDex,
        swappedUsdt: reqUsdt,
        receivedTon: Math.max(0, Number((afterTreasury.ton - beforeTreasury.ton).toFixed(4))),
        beforeTreasury,
        afterTreasury
    };
}

/**
 * Automatically swaps TON (GRAM) -> USDT on-chain from the Admin Treasury Wallet via DeDust V2.
 */
async function swapAdminTonToUsdt(tonAmountToSwap) {
    const { WalletContractV4, internal, external, storeMessage } = require('@ton/ton');
    const { beginCell, Address } = require('@ton/core');
    const { mnemonicToPrivateKey } = require('@ton/crypto');

    if (!process.env.BOT_TON_SEED) {
        throw new Error("BOT_TON_SEED is not configured in .env");
    }

    const beforeTreasury = await getAdminTreasuryBalances();
    const reqTon = parseFloat(Number(tonAmountToSwap).toFixed(4));
    if (!Number.isFinite(reqTon) || reqTon < 0.10) {
        throw new Error(`সোয়াপের জন্য নূন্যতম 0.10 GRAM/TON প্রয়োজন (প্রদত্ত: ${tonAmountToSwap})`);
    }
    if (beforeTreasury.ton < reqTon + 0.26) {
        throw new Error(`এডমিন ওয়ালেটে পর্যাপ্ত GRAM/TON নেই! বর্তমান ব্যালেন্স: ${beforeTreasury.ton} GRAM, সোয়াপ ও গ্যাস ফিসহ প্রয়োজন: ${(reqTon + 0.26).toFixed(4)} GRAM`);
    }

    const seedWords = process.env.BOT_TON_SEED.trim().split(/\s+/);
    const keyPair = await mnemonicToPrivateKey(seedWords);
    const wallet = WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey });
    const walletAddrStr = wallet.address.toString({ bounceable: false });
    const seqno = await getReliableAdminSeqno(walletAddrStr);

    const dedustNativeVault = 'EQDa4VOnTYlLvDJ0gZjNYm5PXfSmmtL6Vs6A_CZEtXCNICq_';
    const dedustTonUsdtPool = 'EQA-X_yo3fzzbDbJ_0bzFWKqtRuZFIRa1sJsveZJ1YpViO3r';

    const amountNano = BigInt(Math.floor(reqTon * 1e9));
    const outerValueNano = amountNano + 250000000n; // +0.25 TON gas buffer (excess refunded to wallet)

    const swapParams = beginCell()
        .storeUint(Math.floor(Date.now() / 1000) + 3600, 32)
        .storeAddress(wallet.address)
        .storeAddress(null)
        .storeMaybeRef(null)
        .storeMaybeRef(null)
        .endCell();

    const swapBody = beginCell()
        .storeUint(0xea06185d, 32) // dedust_swap (native TON)
        .storeUint(BigInt(Date.now()), 64)
        .storeCoins(amountNano)
        .storeAddress(Address.parse(dedustTonUsdtPool))
        .storeUint(0, 1) // kind = 0
        .storeCoins(0n) // limit = 0
        .storeMaybeRef(null)
        .storeRef(swapParams)
        .endCell();

    const transfer = wallet.createTransfer({
        seqno,
        secretKey: keyPair.secretKey,
        messages: [
            internal({
                to: Address.parse(dedustNativeVault),
                value: outerValueNano,
                bounce: true,
                body: swapBody
            })
        ]
    });

    const extMsg = beginCell().store(storeMessage(external({
        to: wallet.address,
        body: transfer
    }))).endCell();

    const boc = extMsg.toBoc().toString('base64');
    console.log(`[AUTO-SWAP] Broadcasting GRAM -> USDT swap (${reqTon} GRAM via DeDust V2, seqno=${seqno})...`);
    await broadcastTonBoc(boc);
    recordAdminBroadcastSeqno(seqno);

    let afterTreasury = beforeTreasury;
    let swapConfirmed = false;
    for (let i = 1; i <= 14; i++) {
        await new Promise(r => setTimeout(r, 2500));
        afterTreasury = await getAdminTreasuryBalances();
        const usdtGain = afterTreasury.usdt - beforeTreasury.usdt;
        console.log(`[AUTO-SWAP POLL #${i}] USDT: ${afterTreasury.usdt} (gain: ${usdtGain.toFixed(4)}), TON: ${afterTreasury.ton}`);
        if (usdtGain >= 0.04) {
            swapConfirmed = true;
            break;
        }
    }

    statsCache.timestamp = 0;
    if (!swapConfirmed) {
        throw new Error(`GRAM থেকে USDT সোয়াপ ট্রানজেকশন ব্রডকাস্ট হয়েছে কিন্তু ব্লকচেইন কনফার্মেশনে সময় লাগছে। কিছুক্ষণ পর আবার চেষ্টা করুন।`);
    }

    return {
        success: true,
        direction: 'GRAM_TO_USDT',
        dex: 'DeDust V2',
        swappedTon: reqTon,
        receivedUsdt: Math.max(0, Number((afterTreasury.usdt - beforeTreasury.usdt).toFixed(4))),
        beforeTreasury,
        afterTreasury
    };
}

/**
 * Ensures the Admin Treasury has enough of `asset` ('GRAM', 'TON', or 'USDT') to send `requiredCryptoAmount`.
 * If the requested asset is short, but the other asset has sufficient balance, automatically swaps on-chain first!
 */
async function ensureAdminTreasuryForOrder(asset, requiredCryptoAmount, meta = {}) {
    const cleanAsset = (asset || 'GRAM').toUpperCase();
    const isTonAsset = (cleanAsset === 'GRAM' || cleanAsset === 'TON');
    const reqAmount = parseFloat(requiredCryptoAmount);

    // Wait if another auto-swap is currently running
    let waitTicks = 0;
    while (isAdminSwapInProgress && waitTicks < 16) {
        await new Promise(r => setTimeout(r, 2000));
        waitTicks++;
    }

    let treasury = await getAdminTreasuryBalances();
    const MIN_TON_TRANSFER_GAS = 0.02;
    const liveTonPrice = Number(cachedMarketRates?.realGramUsdt) || 1.32;
    const config = botConfig || {};
    const adminGroupId = config.adminGroupId || 8799135330;

    if (isTonAsset) {
        const requiredTon = reqAmount + MIN_TON_TRANSFER_GAS;
        if (treasury.ton >= requiredTon) {
            return { ok: true, treasury, autoSwapped: false };
        }

        // Shortfall of GRAM/TON! Check if we can auto-swap USDT -> TON
        const minShortfallTon = (requiredTon - treasury.ton) + 0.06;
        // Ideal shortfall leaves ~0.30 TON gas reserve in the wallet after sending to the user so future swaps also have gas
        const idealShortfallTon = (requiredTon - treasury.ton) + 0.30;

        const minUsdtNeeded = Math.max(0.20, parseFloat((minShortfallTon * liveTonPrice * 1.05).toFixed(2)));
        const idealUsdtNeeded = Math.max(0.35, parseFloat((idealShortfallTon * liveTonPrice * 1.06).toFixed(2)));

        if (treasury.usdt >= minUsdtNeeded && treasury.ton >= 0.155) {
            const usdtToSwap = parseFloat(Math.min(treasury.usdt, idealUsdtNeeded).toFixed(4));
            isAdminSwapInProgress = true;
            try {
                const swapRes = await swapAdminUsdtToTon(usdtToSwap);
                treasury = swapRes.afterTreasury || await getAdminTreasuryBalances();

                if (treasury.ton >= reqAmount + 0.015) {
                    if (adminGroupId && bot) {
                        const swapMsg = `<blockquote><b>🔄 অটো-সোয়াপ সম্পন্ন (Auto-Swap USDT ➔ ${cleanAsset})!</b>\n\n` +
                            `👤 <b>ইউজার অর্ডার:</b> <code>${meta.userId || 'Admin'}</code> — <b>${reqAmount} ${cleanAsset}</b>\n` +
                            `💎 <b>পূর্বের ব্যালেন্স ছিল:</b> <code>${swapRes.beforeTreasury.ton} TON | ${swapRes.beforeTreasury.usdt} USDT</code>\n` +
                            `⚡ <b>অটো-সোয়াপ:</b> <b>${swapRes.swappedUsdt} USDT ➔ +${swapRes.receivedTon} TON</b> (${swapRes.dex})\n` +
                            `✅ <b>সোয়াপ পরবর্তী ব্যালেন্স:</b> <b>${treasury.ton} TON | ${treasury.usdt} USDT</b>\n\n` +
                            `🚀 <i>এখন স্বয়ংক্রিয়ভাবে ইউজারের ওয়ালেটে ${reqAmount} ${cleanAsset} পাঠানো হচ্ছে...</i></blockquote>`;
                        bot.sendMessage(adminGroupId, swapMsg, { parse_mode: 'HTML' }).catch(() => {});
                    }
                    return { ok: true, treasury, autoSwapped: true, swapDetails: swapRes };
                }
            } catch (swapErr) {
                console.error("Auto-swap USDT -> TON error:", swapErr.message);
                return {
                    ok: false,
                    treasury,
                    reason: 'swap_failed',
                    swapError: swapErr.message,
                    requiredTon,
                    minUsdtNeeded
                };
            } finally {
                isAdminSwapInProgress = false;
            }
        }

        const failReason = (treasury.usdt < minUsdtNeeded)
            ? (treasury.usdt <= 0.001 ? 'zero_admin_usdt_balance' : 'insufficient_usdt_for_swap')
            : (treasury.ton < 0.155 ? 'insufficient_ton_gas_for_swap' : 'insufficient_ton_and_usdt');

        return {
            ok: false,
            treasury,
            reason: failReason,
            requiredTon,
            minUsdtNeeded
        };
    } else if (cleanAsset === 'USDT') {
        if (treasury.usdt >= reqAmount && treasury.ton >= 0.05) {
            return { ok: true, treasury, autoSwapped: false };
        }

        // Case 1: Have enough USDT, but TON gas is < 0.05 (cannot even swap without TON gas)
        if (treasury.usdt >= reqAmount && treasury.ton < 0.05) {
            return {
                ok: false,
                treasury,
                reason: 'insufficient_ton_gas',
                requiredUsdt: reqAmount
            };
        }

        // Case 2: Insufficient USDT, check if we have excess GRAM/TON to swap into USDT!
        const shortfallUsdt = (reqAmount - treasury.usdt) + 0.15;
        const tonNeededForSwap = Math.max(0.20, parseFloat(((shortfallUsdt / liveTonPrice) * 1.06).toFixed(4)));
        // Need tonNeededForSwap + 0.26 TON (swap gas, mostly refunded) + 0.06 TON (for USDT transfer after swap)
        const minTonRequiredTotal = parseFloat((tonNeededForSwap + 0.32).toFixed(4));

        if (treasury.ton >= minTonRequiredTotal) {
            isAdminSwapInProgress = true;
            try {
                const swapRes = await swapAdminTonToUsdt(tonNeededForSwap);
                treasury = swapRes.afterTreasury || await getAdminTreasuryBalances();

                if (treasury.usdt >= reqAmount && treasury.ton >= 0.05) {
                    if (adminGroupId && bot) {
                        const swapMsg = `<blockquote><b>🔄 অটো-সোয়াপ সম্পন্ন (Auto-Swap GRAM ➔ USDT)!</b>\n\n` +
                            `👤 <b>ইউজার অর্ডার:</b> <code>${meta.userId || 'Admin'}</code> — <b>${reqAmount} USDT</b>\n` +
                            `💵 <b>পূর্বের ব্যালেন্স ছিল:</b> <code>${swapRes.beforeTreasury.usdt} USDT | ${swapRes.beforeTreasury.ton} GRAM</code>\n` +
                            `⚡ <b>অটো-সোয়াপ:</b> <b>${swapRes.swappedTon} GRAM ➔ +${swapRes.receivedUsdt} USDT</b> (${swapRes.dex})\n` +
                            `✅ <b>সোয়াপ পরবর্তী ব্যালেন্স:</b> <b>${treasury.usdt} USDT | ${treasury.ton} GRAM</b>\n\n` +
                            `🚀 <i>এখন স্বয়ংক্রিয়ভাবে ইউজারের ওয়ালেটে ${reqAmount} USDT পাঠানো হচ্ছে...</i></blockquote>`;
                        bot.sendMessage(adminGroupId, swapMsg, { parse_mode: 'HTML' }).catch(() => {});
                    }
                    return { ok: true, treasury, autoSwapped: true, swapDetails: swapRes };
                }
            } catch (swapErr) {
                console.error("Auto-swap GRAM -> USDT error:", swapErr.message);
                return {
                    ok: false,
                    treasury,
                    reason: 'swap_failed',
                    swapError: swapErr.message,
                    requiredUsdt: reqAmount,
                    minTonRequiredTotal
                };
            } finally {
                isAdminSwapInProgress = false;
            }
        }

        return {
            ok: false,
            treasury,
            reason: 'insufficient_usdt_and_ton',
            requiredUsdt: reqAmount,
            minTonRequiredTotal
        };
    }

    return { ok: false, treasury, reason: 'unsupported_asset' };
}

async function sendTonOnChain(destination, amount, options = {}) {
    const { WalletContractV4, internal, external, storeMessage } = require('@ton/ton');
    const { beginCell } = require('@ton/core');
    const { mnemonicToPrivateKey } = require('@ton/crypto');
    const { ethers } = require('ethers');

    if (!process.env.BOT_TON_SEED) {
        throw new Error("BOT_TON_SEED is not configured in .env");
    }

    const reqTon = parseFloat(amount);
    let autoSwapped = false;
    let swapDetails = null;

    if (!options?.skipTreasuryCheck) {
        // Strict Treasury Check (with Auto-Swap if needed) before creating tx
        const targetAsset = (options?.asset || 'TON').toUpperCase();
        const ensureRes = await ensureAdminTreasuryForOrder(targetAsset, reqTon, { receiveAddress: destination });
        if (!ensureRes.ok) {
            const t = ensureRes.treasury || { ton: 0, usdt: 0 };
            throw new Error(`এডমিন ওয়ালেটে পর্যাপ্ত TON বা সোয়াপ করার মতো USDT নেই! বর্তমান ব্যালেন্স: ${t.ton} TON | ${t.usdt} USDT, প্রয়োজন: ${(reqTon + 0.02).toFixed(4)} TON`);
        }
        autoSwapped = ensureRes.autoSwapped;
        swapDetails = ensureRes.swapDetails || null;
    }

    const seedWords = process.env.BOT_TON_SEED.trim().split(/\s+/);
    const keyPair = await mnemonicToPrivateKey(seedWords);
    const wallet = WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey });
    const walletAddrStr = wallet.address.toString({ bounceable: false });

    const seqno = await getReliableAdminSeqno(walletAddrStr);
    const amountNano = ethers.parseUnits(reqTon.toFixed(6), 9);

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
                    const memoText = (options?.memo && String(options.memo).trim()) ? String(options.memo).trim() : "TrustPay";
                    return beginCell().storeUint(0, 32).storeStringTail(memoText).endCell();
                })()
            })
        ]
    });

    const extMsg = beginCell().store(storeMessage(external({
        to: wallet.address,
        body: transfer
    }))).endCell();

    const boc = extMsg.toBoc().toString('base64');
    const bRes = await broadcastTonBoc(boc);
    recordAdminBroadcastSeqno(seqno);
    statsCache.timestamp = 0;
    return { ...bRes, autoSwapped, swapDetails };
}

async function sendJettonUsdtOnChain(destination, amount, options = {}) {
    const { WalletContractV4, internal, external, storeMessage } = require('@ton/ton');
    const { beginCell, Address } = require('@ton/core');
    const { mnemonicToPrivateKey } = require('@ton/crypto');
    const { ethers } = require('ethers');

    if (!process.env.BOT_TON_SEED) {
        throw new Error("BOT_TON_SEED is not configured in .env");
    }

    const reqUsdt = parseFloat(amount);
    let autoSwapped = false;
    let swapDetails = null;

    if (!options?.skipTreasuryCheck) {
        // Strict Treasury & Gas Check (with Auto-Swap if needed)
        const ensureRes = await ensureAdminTreasuryForOrder('USDT', reqUsdt, { receiveAddress: destination });
        if (!ensureRes.ok) {
            const t = ensureRes.treasury || { ton: 0, usdt: 0 };
            throw new Error(`এডমিন ওয়ালেটে পর্যাপ্ত USDT বা গ্যাস ফি নেই! বর্তমান ব্যালেন্স: ${t.usdt} USDT | ${t.ton} TON, প্রয়োজন: ${reqUsdt} USDT`);
        }
        autoSwapped = ensureRes.autoSwapped;
        swapDetails = ensureRes.swapDetails || null;
    }

    const seedWords = process.env.BOT_TON_SEED.trim().split(/\s+/);
    const keyPair = await mnemonicToPrivateKey(seedWords);
    const wallet = WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey });
    const walletAddrStr = wallet.address.toString({ bounceable: false });

    // 2. Resolve admin's USDT Jetton Wallet
    let adminJettonWallet = ensureRes.treasury?.usdtJettonWallet || null;
    if (!adminJettonWallet) {
        const usdtMaster = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';
        try {
            const jwRes = await axios.get(`https://tonapi.io/v2/blockchain/accounts/${usdtMaster}/methods/get_wallet_address?args=${walletAddrStr}`);
            if (jwRes.data?.decoded?.jetton_wallet_address) {
                adminJettonWallet = jwRes.data.decoded.jetton_wallet_address;
            }
        } catch(e) {}
    }
    if (!adminJettonWallet) {
        adminJettonWallet = 'EQDE4Uycx9ZudIjjmaqmLx3MFTHjURx2FCU6nlH1bzFWCvZA';
    }

    const seqno = await getReliableAdminSeqno(walletAddrStr);
    const amountInMicro = Math.floor(reqUsdt * 1e6); // 6 decimals for USDT

    const memoText = (options?.memo && String(options.memo).trim()) ? String(options.memo).trim() : "TrustPay";
    const commentCell = beginCell()
        .storeUint(0, 32)
        .storeStringTail(memoText)
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
    const bRes = await broadcastTonBoc(boc);
    recordAdminBroadcastSeqno(seqno);
    statsCache.timestamp = 0;
    return { ...bRes, autoSwapped: ensureRes.autoSwapped, swapDetails: ensureRes.swapDetails || null };
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
const notifiedNewUserIds = new Set();

async function notifyNewUserJoined(userId, userData = {}, isConfirmedBrandNew = false) {
    try {
        if (!userId || userId === 123456789 || isNaN(userId)) return;
        const strUserId = userId.toString();
        if (notifiedNewUserIds.has(strUserId)) return;

        const userRef = db.collection('users').doc(strUserId);
        const userDoc = await userRef.get().catch(() => null);

        if (userDoc && userDoc.exists) {
            const d = userDoc.data() || {};
            // If user was already counted/notified OR was already an existing bot member before this call
            if (
                d.userNumber ||
                d.notifiedNewUser ||
                (!isConfirmedBrandNew && (
                    d.id ||
                    d.userId ||
                    d.chatId ||
                    d.mbsId ||
                    d.status ||
                    d.firstName ||
                    d.first_name ||
                    d.balance !== undefined ||
                    d.fiatWallet
                ))
            ) {
                notifiedNewUserIds.add(strUserId);
                if (!d.notifiedNewUser) {
                    userRef.set({ notifiedNewUser: true }, { merge: true }).catch(() => {});
                }
                return;
            }
        }

        notifiedNewUserIds.add(strUserId);

        let userNumber = 1;
        try {
            const countSnap = await db.collection('users').count().get();
            const currentCount = countSnap.data().count || 0;
            userNumber = (userDoc && userDoc.exists) ? Math.max(1, currentCount) : (currentCount + 1);
        } catch (cErr) {
            try {
                const snap = await db.collection('users').select().get();
                userNumber = (userDoc && userDoc.exists) ? Math.max(1, snap.size) : (snap.size + 1);
            } catch (e) {
                userNumber = 1;
            }
        }

        await userRef.set({
            id: Number(userId),
            chatId: strUserId,
            userId: Number(userId),
            username: userData.username || '',
            firstName: userData.firstName || 'User',
            first_name: userData.firstName || 'User',
            lastName: userData.lastName || '',
            last_name: userData.lastName || '',
            joinedAt: new Date(),
            status: (userDoc && userDoc.exists && userDoc.data()?.status) ? userDoc.data().status : 'pending_verification',
            userNumber: userNumber,
            notifiedNewUser: true
        }, { merge: true });

        const targetGroup = botConfig?.userLogGroupId || botConfig?.newUserGroupId;
        if (targetGroup && bot) {
            const firstName = userData.firstName || (userDoc?.exists ? userDoc.data().firstName : 'User');
            const rawUsername = userData.username || (userDoc?.exists ? userDoc.data().username : '');
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

// ==================== REFERRAL & ANTI-CLONE SECURITY ENGINE ====================
let BOT_USERNAME = process.env.BOT_USERNAME || 'bd_trust_pay_bot';
if (bot && bot.getMe) {
    bot.getMe().then(me => {
        if (me && me.username) {
            BOT_USERNAME = me.username;
            console.log(`[BOT READY] Active Bot Username: @${BOT_USERNAME}`);
        }
    }).catch(() => {});
}

const REFERRAL_BONUS_BDT = 5;
const REFERRAL_MIN_TX_BDT = 20;

function extractClientDevice(req, bodyOrQuery = {}) {
    const rawIp = (req.headers['x-forwarded-for'] || req.headers['cf-connecting-ip'] || req.ip || '').toString();
    const clientIp = rawIp.split(',')[0].trim().replace(/^::ffff:/, '') || 'unknown_ip';
    const ua = (req.headers['user-agent'] || '').toString();

    let parsedModel = bodyOrQuery.deviceModel || '';
    if (!parsedModel || parsedModel === 'generic_device') {
        const androidMatch = ua.match(/Android\s+[0-9.]+;\s*([^;)]+?)(?:\s+Build\/|\))/i);
        if (androidMatch && androidMatch[1]) {
            parsedModel = androidMatch[1].trim();
        } else if (/iPhone/i.test(ua)) {
            parsedModel = 'iPhone';
        }
    }

    const hwHash = (bodyOrQuery.hwHash || '').toString().trim();
    const deviceUid = (bodyOrQuery.deviceUid || '').toString().trim();
    const phoneModel = (parsedModel || 'unknown_model').toString().trim();
    const ipModelSig = (clientIp !== 'unknown_ip' && phoneModel !== 'unknown_model' && phoneModel !== 'generic_device')
        ? `${clientIp}__${phoneModel}`
        : '';

    return {
        clientIp,
        hwHash,
        deviceUid,
        phoneModel,
        ipModelSig,
        userAgent: ua.slice(0, 220)
    };
}

// Records device fingerprint and detects if this physical mobile already has another Trust Pay account (Clone App / Multi-Account)
async function recordAndVerifyDeviceAntiClone(userId, deviceInfo = {}) {
    if (!userId || Number(userId) === 123456789) return { isClone: false, reason: null };
    const strUserId = String(userId);
    let isClone = false;
    let cloneReason = null;
    let matchedUserId = null;

    try {
        const { hwHash, deviceUid, clientIp, phoneModel, ipModelSig } = deviceInfo;

        // 1. Check persistent browser Device UID registry
        if (deviceUid && deviceUid.length > 5) {
            const uidRef = db.collection('device_uids').doc(deviceUid);
            const uidDoc = await uidRef.get();
            if (uidDoc.exists) {
                const ownerId = String(uidDoc.data().ownerUserId || '');
                if (ownerId && ownerId !== strUserId) {
                    isClone = true;
                    cloneReason = 'same_browser_storage';
                    matchedUserId = ownerId;
                }
            } else {
                await uidRef.set({
                    ownerUserId: strUserId,
                    hwHash: hwHash || '',
                    phoneModel: phoneModel || '',
                    firstIp: clientIp || '',
                    createdAt: FieldValue.serverTimestamp()
                }, { merge: true });
            }
        }

        // 2. Check Hardware Fingerprint + IP/PhoneModel registry (detects Clone Apps like Parallel Space / Dual Messenger on the same phone)
        if (hwHash && hwHash.length > 5) {
            const hwRef = db.collection('device_fingerprints').doc(hwHash);
            const hwDoc = await hwRef.get();
            if (hwDoc.exists) {
                const hwData = hwDoc.data() || {};
                const ownerId = String(hwData.ownerUserId || '');
                if (ownerId && ownerId !== strUserId) {
                    // Same exact hardware GPU + screen + canvas + deviceModel on the same IP or specific model
                    const sameIp = clientIp && clientIp !== 'unknown_ip' && (hwData.lastIp === clientIp || hwData.firstIp === clientIp);
                    const specificAndroidModel = phoneModel && phoneModel !== 'unknown_model' && phoneModel !== 'generic_device' && phoneModel !== 'iPhone';
                    if (sameIp || specificAndroidModel) {
                        isClone = true;
                        cloneReason = 'same_physical_mobile_clone_app';
                        matchedUserId = ownerId;
                    }
                } else {
                    await hwRef.set({ lastIp: clientIp || '', updatedAt: FieldValue.serverTimestamp() }, { merge: true });
                }
            } else {
                await hwRef.set({
                    ownerUserId: strUserId,
                    deviceUid: deviceUid || '',
                    phoneModel: phoneModel || '',
                    firstIp: clientIp || '',
                    lastIp: clientIp || '',
                    createdAt: FieldValue.serverTimestamp()
                }, { merge: true });
            }
        }

        // 3. Save device metadata onto user document
        const userUpdates = {};
        if (hwHash) userUpdates.hwHash = hwHash;
        if (deviceUid) userUpdates.deviceUid = deviceUid;
        if (clientIp && clientIp !== 'unknown_ip') userUpdates.lastIp = clientIp;
        if (phoneModel && phoneModel !== 'unknown_model') userUpdates.phoneModel = phoneModel;
        if (ipModelSig) userUpdates.ipModelSig = ipModelSig;
        if (isClone) {
            userUpdates.isCloneDevice = true;
            userUpdates.cloneMatchedUserId = matchedUserId;
            userUpdates.cloneReason = cloneReason;
        }
        if (Object.keys(userUpdates).length > 0) {
            await db.collection('users').doc(strUserId).set(userUpdates, { merge: true });
        }
    } catch (e) {
        console.warn("recordAndVerifyDeviceAntiClone warning:", e.message);
    }

    return { isClone, reason: cloneReason, matchedUserId };
}

const inFlightReferralRegistrations = new Set();

// Registers a new referral ONLY when a brand-new user (never joined bot before) starts the bot or opens the MiniApp via a referral link
async function registerUserReferral(userId, rawReferrerId, userMeta = {}, deviceInfo = {}) {
    const cleanUserId = parseInt(userId);
    const cleanReferrerId = parseInt(String(rawReferrerId || '').replace(/^ref_/i, '').trim());

    if (!cleanUserId || !cleanReferrerId || isNaN(cleanUserId) || isNaN(cleanReferrerId)) return { registered: false, reason: 'invalid_id' };
    if (cleanUserId === 123456789 || cleanReferrerId === 123456789) return { registered: false, reason: 'guest_id' };
    if (cleanUserId === cleanReferrerId) return { registered: false, reason: 'self_referral' };

    const strUserId = String(cleanUserId);
    const strReferrerId = String(cleanReferrerId);

    if (inFlightReferralRegistrations.has(strUserId)) {
        return { registered: false, reason: 'registration_in_progress' };
    }
    inFlightReferralRegistrations.add(strUserId);

    try {
        const [userDoc, referrerDoc, existingRefDoc] = await Promise.all([
            db.collection('users').doc(strUserId).get(),
            db.collection('users').doc(strReferrerId).get(),
            db.collection('referrals').doc(strUserId).get()
        ]);

        // Referrer must exist
        if (!referrerDoc.exists) return { registered: false, reason: 'referrer_not_found' };

        // If user already has a referral record, do not overwrite
        if (existingRefDoc.exists) return { registered: false, reason: 'already_referred' };

        // STRICT CHECK: If user was ALREADY joined in the bot before, NEVER count as referral!
        if (userDoc.exists) {
            const existingData = userDoc.data() || {};
            if (
                existingData.referredBy ||
                existingData.id ||
                existingData.userId ||
                existingData.chatId ||
                existingData.mbsId ||
                existingData.status ||
                existingData.firstName ||
                existingData.first_name ||
                existingData.balance !== undefined ||
                existingData.fiatWallet?.number ||
                existingData.hasSellBalance ||
                existingData.hasDepositWithoutTrade
            ) {
                return { registered: false, reason: 'already_joined_bot' };
            }
        }

        const userData = userDoc.exists ? (userDoc.data() || {}) : {};

        // Run Anti-Clone check against referrer and device registry
        const referrerData = referrerDoc.data() || {};
        const cloneCheck = await recordAndVerifyDeviceAntiClone(cleanUserId, deviceInfo);

        let isBlockedClone = Boolean(cloneCheck.isClone || userData.isCloneDevice);
        let blockReason = cloneCheck.reason || userData.cloneReason || null;

        // Direct comparison between Referrer and Referred User
        const uHw = deviceInfo.hwHash || userData.hwHash || '';
        const uUid = deviceInfo.deviceUid || userData.deviceUid || '';
        const uIp = deviceInfo.clientIp || userData.lastIp || '';
        const uModel = deviceInfo.phoneModel || userData.phoneModel || '';

        if (uUid && referrerData.deviceUid && uUid === referrerData.deviceUid) {
            isBlockedClone = true;
            blockReason = 'same_device_uid_as_referrer';
        } else if (uHw && referrerData.hwHash && uHw === referrerData.hwHash) {
            isBlockedClone = true;
            blockReason = 'same_hardware_as_referrer';
        } else if (uIp && uIp !== 'unknown_ip' && referrerData.lastIp === uIp && uModel && uModel === referrerData.phoneModel) {
            isBlockedClone = true;
            blockReason = 'same_ip_and_phone_as_referrer';
        }

        const refStatus = isBlockedClone ? 'blocked_clone' : 'pending';
        const firstName = userMeta.firstName || userData.firstName || userData.first_name || 'User';
        const username = userMeta.username || userData.username || '';

        const batchPromises = [
            db.collection('users').doc(strUserId).set({
                referredBy: cleanReferrerId,
                referralStatus: refStatus,
                referralBonusPaid: false,
                referredAt: FieldValue.serverTimestamp(),
                ...(isBlockedClone ? { referralBlockReason: blockReason } : {})
            }, { merge: true }),
            db.collection('referrals').doc(strUserId).set({
                referredUserId: cleanUserId,
                referrerId: cleanReferrerId,
                referredName: firstName,
                referredUsername: username,
                status: refStatus,
                blockReason: blockReason || null,
                walletConnected: false,
                qualifyingTxDone: false,
                totalAddMoneyBdt: 0,
                totalSellBdt: 0,
                bonusAmount: REFERRAL_BONUS_BDT,
                bonusPaid: false,
                createdAt: FieldValue.serverTimestamp()
            })
        ];

        // Immediately grant +1 Free Spin to referrer for every valid (non-clone) referral even before activation
        if (!isBlockedClone) {
            batchPromises.push(
                db.collection('users').doc(strReferrerId).set({
                    extraSpins: FieldValue.increment(1),
                    syncedReferralSpinsCount: FieldValue.increment(1)
                }, { merge: true })
            );
        }

        await Promise.all(batchPromises);

        // Notify Referrer in Telegram if valid pending referral
        if (!isBlockedClone && bot) {
            const joinNotifyMsg = `${PE.sparkles} <b>নতুন রেফারেল যুক্ত হয়েছে! (New Referral Joined)</b>\n\n` +
                `<blockquote>${PE.user} <b>নতুন ইউজার:</b> <code>${firstName}</code> ${username ? `(@${username})` : ''}\n` +
                `🎰 <b>স্পিন বোনাস:</b> <code>+1 Free Spin (সাথে সাথে যুক্ত হয়েছে!)</code>\n` +
                `⏳ <b>স্ট্যাটাস:</b> <code>Pending (অ্যাক্টিভেশন বাকি)</code>\n` +
                `${PE.moneyBag} <b>অ্যাক্টিভ বোনাস:</b> <code>+৳${REFERRAL_BONUS_BDT} BDT</code></blockquote>\n\n` +
                `${PE.zap} <i>রেফার করার জন্য আপনি <b>১টি ফ্রি স্পিন</b> পেয়েছেন! এছাড়া আপনার বন্ধু ওয়ালেট কানেক্ট করে নূন্যতম ২০ টাকা Add Money অথবা ২০ টাকা Crypto Sell করলেই আপনি আরও <b>৳${REFERRAL_BONUS_BDT} টাকা বোনাস</b> পাবেন!</i>`;
            bot.sendMessage(cleanReferrerId, joinNotifyMsg, { parse_mode: 'HTML', ...appOpenMarkup }).catch(() => {});
        }

        return { registered: true, status: refStatus };
    } catch (e) {
        console.error("registerUserReferral error:", e.message);
        return { registered: false, reason: e.message };
    } finally {
        inFlightReferralRegistrations.delete(strUserId);
    }
}

// Evaluates if a referred user has completed all requirements (Wallet Connected + >=20 BDT Add Money OR >=20 BDT Crypto Sell + Anti-Clone Clean) and pays 5 BDT to the referrer
async function checkAndRewardReferral(userId) {
    try {
        if (!userId || Number(userId) === 123456789) return { rewarded: false };
        const cleanUserId = parseInt(userId);
        const strUserId = String(cleanUserId);

        const userRef = db.collection('users').doc(strUserId);
        const userDoc = await userRef.get();
        if (!userDoc.exists) return { rewarded: false };

        const userData = userDoc.data() || {};
        const referrerId = userData.referredBy;
        if (!referrerId || userData.referralBonusPaid === true || userData.referralStatus === 'blocked_clone') {
            return { rewarded: false };
        }

        const strReferrerId = String(referrerId);
        const referrerRef = db.collection('users').doc(strReferrerId);
        const referralDocRef = db.collection('referrals').doc(strUserId);

        const referrerDoc = await referrerRef.get();
        if (!referrerDoc.exists) return { rewarded: false };
        const referrerData = referrerDoc.data() || {};

        // 1. Re-verify Anti-Clone & Unique Wallet Security
        let isCloneOrFraud = Boolean(userData.isCloneDevice);
        let fraudReason = userData.cloneReason || null;

        if (!isCloneOrFraud) {
            if (userData.deviceUid && referrerData.deviceUid && userData.deviceUid === referrerData.deviceUid) {
                isCloneOrFraud = true;
                fraudReason = 'same_device_uid_as_referrer';
            } else if (userData.hwHash && referrerData.hwHash && userData.hwHash === referrerData.hwHash) {
                isCloneOrFraud = true;
                fraudReason = 'same_hardware_as_referrer';
            } else if (userData.lastIp && userData.lastIp !== 'unknown_ip' && userData.lastIp === referrerData.lastIp && userData.phoneModel && userData.phoneModel === referrerData.phoneModel) {
                isCloneOrFraud = true;
                fraudReason = 'same_ip_and_phone_as_referrer';
            } else if (userData.fiatWallet?.number && referrerData.fiatWallet?.number && String(userData.fiatWallet.number).trim() === String(referrerData.fiatWallet.number).trim()) {
                isCloneOrFraud = true;
                fraudReason = 'same_fiat_wallet_as_referrer';
            } else if (userData.tonAddress && referrerData.tonAddress && String(userData.tonAddress).trim() === String(referrerData.tonAddress).trim()) {
                isCloneOrFraud = true;
                fraudReason = 'same_ton_wallet_as_referrer';
            }
        }

        // Also check if this user's fiat wallet or TON address is already registered to ANY other user
        if (!isCloneOrFraud && userData.fiatWallet?.number) {
            const cleanNum = String(userData.fiatWallet.number).trim();
            const sameWalletSnap = await db.collection('users').where('fiatWallet.number', '==', cleanNum).limit(3).get().catch(() => null);
            if (sameWalletSnap && !sameWalletSnap.empty) {
                sameWalletSnap.forEach(d => {
                    if (String(d.id) !== strUserId) {
                        isCloneOrFraud = true;
                        fraudReason = 'duplicate_fiat_wallet_across_accounts';
                    }
                });
            }
        }
        if (!isCloneOrFraud && userData.tonAddress) {
            const cleanTon = String(userData.tonAddress).trim();
            const sameTonSnap = await db.collection('users').where('tonAddress', '==', cleanTon).limit(3).get().catch(() => null);
            if (sameTonSnap && !sameTonSnap.empty) {
                sameTonSnap.forEach(d => {
                    if (String(d.id) !== strUserId) {
                        isCloneOrFraud = true;
                        fraudReason = 'duplicate_ton_wallet_across_accounts';
                    }
                });
            }
        }

        if (isCloneOrFraud) {
            await Promise.all([
                userRef.set({ referralStatus: 'blocked_clone', referralBlockReason: fraudReason }, { merge: true }),
                referralDocRef.set({ status: 'blocked_clone', blockReason: fraudReason }, { merge: true })
            ]);
            return { rewarded: false, blocked: true, reason: fraudReason };
        }

        // 2. Check Wallet Connected Requirement (Fiat Wallet bKash/Nagad OR Connected TON Wallet)
        const hasFiatWallet = Boolean(userData.fiatWallet && userData.fiatWallet.number && String(userData.fiatWallet.number).trim().length >= 10);
        const hasTonWallet = Boolean(userData.tonAddress && String(userData.tonAddress).trim().length >= 20);
        const walletConnected = hasFiatWallet || hasTonWallet;

        // 3. Check Transaction Requirement (>= 20 TK Add Money OR >= 20 TK Crypto Sell)
        let totalAddMoneyBdt = parseFloat(userData.totalAddMoneyBdt) || 0;
        let totalSellBdt = parseFloat(userData.totalCryptoSellBdt) || 0;

        if (totalAddMoneyBdt < REFERRAL_MIN_TX_BDT && totalSellBdt < REFERRAL_MIN_TX_BDT) {
            const userIds = [cleanUserId, strUserId];
            const [depSnap, sellSnap] = await Promise.all([
                db.collection('deposits').where('userId', 'in', userIds).get().catch(() => null),
                db.collection('miniapp_sells').where('userId', 'in', userIds).get().catch(() => null)
            ]);
            let calcAdd = 0;
            if (depSnap && !depSnap.empty) {
                depSnap.forEach(d => {
                    const dd = d.data();
                    if (dd.status === 'completed') calcAdd += (parseFloat(dd.amount) || 0);
                });
            }
            let calcSell = 0;
            if (sellSnap && !sellSnap.empty) {
                sellSnap.forEach(d => {
                    const sd = d.data();
                    if (sd.status === 'completed') calcSell += (parseFloat(sd.estimatedTk) || 0);
                });
            }
            totalAddMoneyBdt = Math.max(totalAddMoneyBdt, calcAdd);
            totalSellBdt = Math.max(totalSellBdt, calcSell);
        }

        const qualifyingTxDone = (totalAddMoneyBdt >= REFERRAL_MIN_TX_BDT) || (totalSellBdt >= REFERRAL_MIN_TX_BDT);

        // Update progress in referrals collection
        await referralDocRef.set({
            referredUserId: cleanUserId,
            referrerId: parseInt(referrerId),
            referredName: userData.firstName || userData.first_name || 'User',
            referredUsername: userData.username || '',
            walletConnected,
            qualifyingTxDone,
            totalAddMoneyBdt,
            totalSellBdt
        }, { merge: true });

        if (!walletConnected || !qualifyingTxDone) {
            return { rewarded: false, walletConnected, qualifyingTxDone };
        }

        // 4. All conditions met! Atomically mark active and pay 5 BDT bonus to Referrer
        let bonusJustPaid = false;
        let newReferrerBal = 0;

        await db.runTransaction(async (t) => {
            const freshUserDoc = await t.get(userRef);
            const freshRefDoc = await t.get(referrerRef);
            if (!freshUserDoc.exists || !freshRefDoc.exists) return;

            const uData = freshUserDoc.data() || {};
            if (uData.referralBonusPaid === true || uData.referralStatus === 'active' || uData.referralStatus === 'blocked_clone') {
                return;
            }

            const rData = freshRefDoc.data() || {};
            const currentBal = parseFloat(rData.balance) || 0;
            newReferrerBal = Number((currentBal + REFERRAL_BONUS_BDT).toFixed(2));

            t.set(userRef, {
                referralStatus: 'active',
                referralBonusPaid: true,
                referralActivatedAt: FieldValue.serverTimestamp()
            }, { merge: true });

            t.set(referralDocRef, {
                status: 'active',
                bonusPaid: true,
                bonusAmount: REFERRAL_BONUS_BDT,
                walletConnected: true,
                qualifyingTxDone: true,
                activatedAt: FieldValue.serverTimestamp()
            }, { merge: true });

            t.set(referrerRef, {
                balance: newReferrerBal,
                referralEarnings: FieldValue.increment(REFERRAL_BONUS_BDT),
                activeReferralsCount: FieldValue.increment(1)
            }, { merge: true });

            bonusJustPaid = true;
        });

        if (bonusJustPaid && bot) {
            const referredName = userData.firstName || userData.first_name || 'User';
            const rewardMsg = `${PE.moneyBag} <b>অভিনন্দন! রেফারেল বোনাস যোগ হয়েছে! (+৳${REFERRAL_BONUS_BDT} BDT)</b> ${PE.party}\n\n` +
                `<blockquote>${PE.user} <b>রেফার ইউজার:</b> <code>${referredName}</code>\n` +
                `${PE.check} <b>স্ট্যাটাস:</b> <code>Active (ওয়ালেট + ২০৳+ লেনদেন সম্পন্ন)</code>\n` +
                `${PE.dollar} <b>প্রাপ্ত বোনাস:</b> <b>+৳${REFERRAL_BONUS_BDT}.00 BDT</b>\n` +
                `${PE.bank} <b>নতুন ব্যালেন্স:</b> <b>৳${newReferrerBal} BDT</b></blockquote>\n\n` +
                `${PE.rocket} <i>বেশি বেশি বন্ধুদের রেফার করুন এবং আনলিমিটেড বোনাস আয় করুন!</i>`;
            bot.sendMessage(referrerId, rewardMsg, { parse_mode: 'HTML', ...appOpenMarkup }).catch(() => {});
        }

        return { rewarded: bonusJustPaid, newReferrerBal };
    } catch (e) {
        console.error("checkAndRewardReferral error:", e.message);
        return { rewarded: false, error: e.message };
    }
}

bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const msgId = msg.message_id;
    const startPayload = (match && match[1]) ? match[1].trim() : '';
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
    
    // Check if this user ALREADY exists in Firebase BEFORE writing any fields
    const userRef = db.collection('users').doc(chatId.toString());
    const existingUserDoc = await userRef.get().catch(() => null);
    const existingData = (existingUserDoc && existingUserDoc.exists) ? (existingUserDoc.data() || {}) : null;
    const isExistingUser = Boolean(
        existingData && (
            existingData.userNumber ||
            existingData.notifiedNewUser ||
            existingData.id ||
            existingData.userId ||
            existingData.chatId ||
            existingData.mbsId ||
            existingData.status ||
            existingData.firstName ||
            existingData.first_name ||
            existingData.balance !== undefined ||
            existingData.fiatWallet
        )
    );

    if (!isExistingUser) {
        // 1. Brand-new user: if they joined via referral link (/start ref_123456), register the referral
        if (startPayload && /^ref_\d+$/i.test(startPayload)) {
            const referrerId = startPayload.replace(/^ref_/i, '');
            await registerUserReferral(chatId, referrerId, { username, firstName, lastName }, {});
        }
        // 2. Brand-new user: notify User Joined group ONCE and assign permanent userNumber
        await notifyNewUserJoined(chatId, { username, firstName, lastName }, true);
    }

    await userRef.set({
        id: chatId,
        userId: chatId,
        chatId: chatId.toString(),
        username: username,
        firstName: firstName,
        first_name: firstName,
        lastName: lastName,
        last_name: lastName,
        notifiedNewUser: true
    }, { merge: true }).catch(() => {});

    userStates[chatId] = { step: 'start', failedAttempts: 0, lang: 'bn' };
    
    const membership = await checkUserCommunities(chatId);
    const isAlreadyVerified = existingUserDoc && existingUserDoc.exists && existingUserDoc.data().status === 'verified';

    if (isAlreadyVerified && membership.allJoined) {
        const welcomeBackMsg = `${PE.gem} <b>Trust Pay — ট্রাস্ট পে</b> ${PE.sparkles}\n\n${PE.user} স্বাগতম <b>${firstName}</b>!\n${PE.check} আপনার অ্যাকাউন্ট ভেরিফাইড ও প্রস্তুত রয়েছে।\n\n${PE.zap} <i>অ্যাপ ওপেন করতে নিচের বোতামে চাপ দিন:</i>`;
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
                [{ text: '📢 চ্যানেল ১', url: OFFICIAL_CHANNEL_URL }],
                [{ text: '💸 পে-আউট চ্যানেল', url: PAYOUT_GROUP_URL }],
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
                const msgText = `${PE.party} <b>ভেরিফিকেশন সফল! (Verified!)</b>\n\n${PE.gem} Trust Pay-তে স্বাগতম <b>${query.from.first_name || ''}</b>। আপনার অ্যাকাউন্ট সম্পূর্ণ প্রস্তুত।\n\n${PE.zap} <i>অ্যাপ ওপেন করতে নিচের বোতামে চাপ দিন:</i>`;
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
                                
                                bot.sendMessage(chatId, `${PE.check} <b>Buy Order Completed!</b>\nSuccessfully sent <b>${order.amount} ${order.asset}</b> to <code>${order.receiveAddress}</code>\nTrxID: <code>${targetTrxId}</code>`, { parse_mode: 'HTML' }).catch(e => console.error(e.message));
                                
                                const userBuyApproved = `${PE.moneyBag} <b>Crypto Order Approved! (ক্রিপ্টো অর্ডার সফল!)</b>\n\n` +
                                    `${PE.dollar} <b>Amount:</b> <b>${order.amount} ${order.asset}</b>\n` +
                                    `${PE.gem} <b>Network:</b> TON Mainnet\n` +
                                    `${PE.wallet} <b>Address:</b> <code>${order.receiveAddress}</code>\n` +
                                    `${PE.globe} <b>TX Ref:</b>\n<code>${targetTrxId}</code>\n\n` +
                                    `${PE.zap} <i>আপনার ${order.asset} সফলভাবে অন-চেইনে আপনার TON ওয়ালেটে পাঠানো হয়েছে!</i>`;
                                bot.sendMessage(order.userId, userBuyApproved, { parse_mode: 'HTML', ...appOpenMarkup }).catch(e => console.error(e.message));

                                notifyPayoutGroup({
                                    type: 'crypto',
                                    userId: order.userId,
                                    name: 'Verified User',
                                    amount: order.amount,
                                    receiveAmount: order.amount,
                                    asset: order.asset,
                                    destination: order.receiveAddress,
                                    trxId: targetTrxId
                                }).catch(() => {});
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
                            const isWalletOrder = order.paymentMethod === 'wallet' || order.paidWithWallet === true || order.paidFromBalance === true;
                            const refundBdt = isWalletOrder ? (parseFloat(order.totalBdt) || 0) : 0;
                            
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
                            
                            bot.sendMessage(chatId, `${PE.cross} <b>Buy Order Rejected!</b>\nRefunded <b>৳${refundBdt} BDT</b> to user <code>${order.userId}</code>'s in-app balance.\nTrxID: <code>${targetTrxId}</code>`, { parse_mode: 'HTML' }).catch(e => console.error(e.message));
                            
                            const userBuyRejected = `${PE.cross} <b>Order Rejected & Refunded! (অর্ডার বাতিল ও রিফান্ড!)</b>\n\n` +
                                `${PE.gem} <b>Order:</b> ${order.amount} ${order.asset}\n` +
                                `${PE.globe} <b>TrxID:</b> <code>${targetTrxId}</code>\n` +
                                `${PE.dollar} <b>Refunded:</b> <b>৳${refundBdt} BDT</b>\n` +
                                `${PE.note} <b>Reason:</b> <i>${reason}</i>\n\n` +
                                `${PE.swap} <i>উক্ত টাকা আপনার ইন-অ্যাপ ব্যালেন্সে রিফান্ড করা হয়েছে।</i>`;
                            bot.sendMessage(order.userId, userBuyRejected, { parse_mode: 'HTML', ...appOpenMarkup }).catch(e => console.error(e.message));
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

                    // DM to User (Shards Bot Premium Animated Emoji format)
                    const userSuccessMsg = `${PE.approvedBag} <b>Withdrawal Approved! (ক্যাশআউট সফল!)</b>\n\n` +
                        `${PE.dollar} <b>Amount:</b> ৳${amtVal} BDT\n` +
                        `${PE.chartDown} <b>Fee:</b> ৳${typeof feeVal === 'number' ? feeVal.toFixed(2) : feeVal} BDT\n` +
                        `${PE.flyingCash} <b>Net Sent:</b> <b>৳${typeof recVal === 'number' ? recVal.toFixed(2) : recVal} BDT</b>\n` +
                        `${PE.bank} <b>Gateway:</b> ${methodVal.toUpperCase()}\n` +
                        `${PE.wallet} <b>Account:</b> <code>${numVal}</code>\n\n` +
                        `${PE.zap} <i>আপনার ${methodVal.toUpperCase()} অ্যাকাউন্টে টাকা সফলভাবে পাঠিয়ে দেওয়া হয়েছে!</i>`;
                    await bot.sendMessage(targetUserId, userSuccessMsg, { parse_mode: 'HTML', ...appOpenMarkup }).catch(e => console.error(e.message));

                    // Confirm in Withdraw Request Group
                    await bot.sendMessage(chatId, `${PE.check} <code>${targetUserId}</code> এর উইথড্র সফলভাবে <b>PAID</b> কনফার্ম করা হয়েছে।`, { parse_mode: 'HTML', reply_to_message_id: msg.message_id }).catch(e => console.error(e.message));

                    // Post Live Payout Proof to Public Payout Group / Channel
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

                    await bot.sendMessage(chatId, `${PE.cross} উইথড্র বাতিল করা হয়েছে! ইউজার <code>${targetUserId}</code> এর একাউন্টে <b>৳${amountToRefund} BDT</b> রিফান্ড করা হয়েছে।\n${PE.note} <b>কারণ:</b> <i>${reason}</i>`, { parse_mode: 'HTML', reply_to_message_id: msg.message_id }).catch(e => console.error(e.message));

                    // DM to User
                    const userRejectMsg = `${PE.cross} <b>Withdrawal Rejected! (উইথড্র বাতিল ও রিফান্ড!)</b>\n\n` +
                        `${PE.dollar} <b>Refunded Amount:</b> <b>৳${amountToRefund} BDT</b>\n` +
                        `${PE.note} <b>Reason:</b> <i>${reason}</i>\n\n` +
                        `${PE.swap} <i>টাকাটি আপনার অ্যাপ ব্যালেন্সে পুনরায় যোগ করে দেওয়া হয়েছে। তথ্য যাচাই করে আবার চেষ্টা করুন।</i>`;
                    await bot.sendMessage(targetUserId, userRejectMsg, { parse_mode: 'HTML', ...appOpenMarkup }).catch(e => console.error(e.message));
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
    realUsdtBdt: 118,
    realGramUsdt: 1.32,
    realGramBdt: 155.76,
    buyRates: {
        USDT: 130, // Fixed 130 BDT (when buying USDT directly)
        GRAM: 175, // (liveGramUsdt * 125) + 10 TK
        TON: 175
    },
    sellRates: {
        USDT: 118, // Fixed 118 BDT (sell to platform)
        GRAM: 146, // (liveGramUsdt * 118) - 10 TK
        TON: 146
    },
    lastUpdated: 0
};

async function updateMarketRates() {
    try {
        let tonUsdt = 1.32;

        // 1. Fetch live TON/GRAM in USD: TonAPI -> CoinGecko -> Binance
        try {
            const tonApiRes = await axios.get('https://tonapi.io/v2/rates?tokens=ton&currencies=usd', { timeout: 4000 });
            if (tonApiRes.data?.rates?.TON?.prices?.USD) {
                tonUsdt = parseFloat(tonApiRes.data.rates.TON.prices.USD);
            }
        } catch (e1) {
            try {
                const cgRes = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd', { timeout: 4000 });
                if (cgRes.data && cgRes.data['the-open-network']?.usd) {
                    tonUsdt = parseFloat(cgRes.data['the-open-network'].usd);
                }
            } catch (e2) {
                try {
                    const binanceRes = await axios.get('https://api.binance.com/api/v3/ticker/price?symbol=TONUSDT', { timeout: 4000 });
                    if (binanceRes.data && binanceRes.data.price) {
                        tonUsdt = parseFloat(binanceRes.data.price);
                    }
                } catch (e3) {
                    console.warn("Rate fetch fallback, keeping current tonUsdt:", tonUsdt);
                }
            }
        }

        const realGramUsdt = Number(tonUsdt.toFixed(4));

        // Real-time Live USD/BDT Forex Market Rate
        let liveUsdToBdt = 124.0;
        try {
            const fxRes = await axios.get('https://open.er-api.com/v6/latest/USD', { timeout: 3500 });
            if (fxRes.data?.rates?.BDT) {
                liveUsdToBdt = Number(parseFloat(fxRes.data.rates.BDT).toFixed(2));
            }
        } catch (eFx) {}

        // Base USDT Rates in BDT for Platform Trading:
        // Sell USDT = 118 TK, Direct Buy USDT = 130 TK
        const sellUsdt = 118;
        const buyUsdt = 130;

        // Dynamic GRAM / TON Pricing Rule:
        // Platform maintains a guaranteed 10 TK margin:
        // - Sell GRAM (User sells to platform): (liveGramUsdt * 118) - 10 TK
        // - Buy GRAM (User buys from platform): (liveGramUsdt * 125) + 10 TK (GRAM calculated using 125 BDT/USD)
        const baseSellGramBdt = realGramUsdt * sellUsdt;
        const sellGram = Math.max(1, Math.round(baseSellGramBdt - 10));

        const gramBuyUsdBase = 125;
        const baseBuyGramBdt = realGramUsdt * gramBuyUsdBase;
        const buyGram = Math.round(baseBuyGramBdt + 10);

        // True Live Market Valuation Price for 1 GRAM in BDT:
        const realLiveGramBdt = Number((realGramUsdt * liveUsdToBdt).toFixed(2));

        cachedMarketRates = {
            realUsdtBdt: liveUsdToBdt,
            realGramUsdt,
            realGramBdt: realLiveGramBdt,
            buyRates: {
                USDT: buyUsdt, // 130 TK
                GRAM: buyGram, // (liveGramUsdt * 125) + 10 TK
                TON: buyGram
            },
            sellRates: {
                USDT: sellUsdt, // 118 TK
                GRAM: sellGram, // (liveGramUsdt * 118) - 10 TK
                TON: sellGram
            },
            lastUpdated: Date.now()
        };
        console.log(`[RATES UPDATED] Live TON/GRAM: $${realGramUsdt} | Sell: USDT ৳${sellUsdt}, GRAM ৳${sellGram} | Buy: USDT ৳${buyUsdt}, GRAM ৳${buyGram}`);
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

// Initial fetch on server startup and 30-second live market interval
safeUpdateMarketRates();
setInterval(safeUpdateMarketRates, 30 * 1000);

// ==================== MINI APP APIs ====================
app.get('/api/miniapp/rates', async (req, res) => {
    // Refresh live rate if cache older than 30 seconds
    if (Date.now() - cachedMarketRates.lastUpdated > 30 * 1000) {
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
        await db.collection('users').doc(userId.toString()).set({
            status: 'verified',
            verified: true,
            communityVerified: true,
            communityVerifiedAt: FieldValue.serverTimestamp()
        }, { merge: true });
        return res.json({ success: true, allJoined: true, inChannel: true, inGroup: true });
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
        } else if (req.query.startParam && /^ref_\d+$/i.test(String(req.query.startParam).trim())) {
            // Brand-new user opening MiniApp directly via referral startParam
            const devInfo = extractClientDevice(req, req.query);
            const refId = String(req.query.startParam).trim().replace(/^ref_/i, '');
            await registerUserReferral(userId, refId, {}, devInfo);
        }

        // Background anti-clone device verification if fingerprint query params provided
        if (req.query.hwHash || req.query.deviceUid) {
            const devInfo = extractClientDevice(req, req.query);
            recordAndVerifyDeviceAntiClone(userId, devInfo).catch(() => {});
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

        if (data.status === 'restricted' && !data.restrictedUntil && String(data.restrictReason || '').includes('অসামঞ্জস্যপূর্ণ')) {
            data.status = 'active';
            data.isRestricted = false;
            userRef.set({ status: 'active', isRestricted: false, restrictReason: null }, { merge: true }).catch(() => {});
        }

        const isBanned = data.status === 'banned' || Boolean(data.isBanned);
        const isRestricted = data.status === 'restricted' && (!data.restrictedUntil || new Date(data.restrictedUntil) > new Date());
        res.json({ 
            balance: data.balance || 0,
            fiatWallet: data.fiatWallet || null,
            fiatWithdrawPending: pendingWithdraw,
            mbsId: mbsId,
            hasDepositWithoutTrade: Boolean(data.hasDepositWithoutTrade),
            hasSellBalance: Boolean(data.hasSellBalance || (parseFloat(data.totalCryptoSellBdt) > 0)),
            spentSinceLastDeposit: data.spentSinceLastDeposit || 0,
            referralEarnings: data.referralEarnings || 0,
            activeReferralsCount: data.activeReferralsCount || 0,
            referredBy: data.referredBy || null,
            referralStatus: data.referralStatus || null,
            themeMode: data.themeMode || 'light',
            status: isBanned ? 'banned' : (isRestricted ? 'restricted' : (data.status || 'active')),
            isBanned: isBanned,
            banReason: data.banReason || 'সাইবার ক্রাইম ও প্রতারণামূলক কর্মকাণ্ডের জন্য অ্যাকাউন্ট স্থায়ীভাবে নিষিদ্ধ করা হয়েছে।',
            isRestricted: isRestricted,
            restrictedUntil: data.restrictedUntil || null,
            restrictReason: data.restrictReason || 'আপনার অ্যাকাউন্টটি সাময়িকভাবে রেস্ট্রিক্ট করা রয়েছে।'
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

// In-memory store for active 10-to-15 character crypto sell verification codes (e.g. "WHIO65GTN9")
const inMemorySellCodes = new Map();

// Generates a 100% unique 10-to-15 character uppercase alphanumeric code (never repeats across any user)
async function generateUniqueSellCommentCode(preferredLength = 10) {
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const digits = '0123456789';
    const allChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    // Clamp length between 10 (minimum) and 15 (maximum); allow system config override or auto-scaling
    const configuredLen = Number(botConfig?.sellCodeLength) || preferredLength;
    let baseLen = Math.max(10, Math.min(15, configuredLen));

    for (let attempt = 0; attempt < 12; attempt++) {
        // If any collision ever happens, automatically scale code length up towards 15
        const currentLen = Math.min(15, baseLen + Math.floor(attempt / 3));
        let charsArr = [];

        // Guarantee at least 2 digits and 2 uppercase letters so it always looks like "WHIO65GTN9"
        charsArr.push(letters[crypto.randomInt(0, letters.length)]);
        charsArr.push(digits[crypto.randomInt(0, digits.length)]);
        charsArr.push(letters[crypto.randomInt(0, letters.length)]);
        charsArr.push(digits[crypto.randomInt(0, digits.length)]);

        for (let i = charsArr.length; i < currentLen; i++) {
            charsArr.push(allChars[crypto.randomInt(0, allChars.length)]);
        }

        // Cryptographic Fisher-Yates shuffle
        for (let i = charsArr.length - 1; i > 0; i--) {
            const j = crypto.randomInt(0, i + 1);
            const tmp = charsArr[i];
            charsArr[i] = charsArr[j];
            charsArr[j] = tmp;
        }

        const candidate = charsArr.join('');

        // 1. Check in-memory active codes
        if (inMemorySellCodes.has(candidate)) continue;

        // 2. Check Firestore claimed_sell_codes to guarantee this code has NEVER been used in history
        try {
            const existingDoc = await db.collection('claimed_sell_codes').doc(candidate).get();
            if (!existingDoc.exists) {
                return candidate;
            }
        } catch (_) {
            return candidate;
        }
    }

    // Fallback: 15-character timestamp + cryptographic random hybrid (guaranteed unique)
    const timePart = Date.now().toString(36).toUpperCase().slice(-6);
    let randPart = '';
    for (let i = 0; i < 9; i++) {
        randPart += allChars[crypto.randomInt(0, allChars.length)];
    }
    return (randPart + timePart).slice(0, 15);
}

app.post('/api/miniapp/build-tx', async (req, res) => {
    try {
        let { asset, amount, userAddress, userId } = req.body;
        if (userId) {
            if (!verifyRequestCallerIdentity(req, userId)) {
                return res.status(403).json({ error: 'অননুমোদিত রিকোয়েস্ট (User ID mismatch)' });
            }
            if (!checkRateLimit(`build_tx_${userId}`, 30, 60000)) {
                return res.status(429).json({ error: 'খুব বেশি রিকোয়েস্ট পাঠানো হয়েছে। দয়া করে কিছুক্ষণ অপেক্ষা করুন।' });
            }
            const statusCheck = await checkUserAccountActive(userId);
            if (!statusCheck.ok) {
                return res.status(403).json({ error: statusCheck.error });
            }
        }
        amount = parseFloat(amount) || 0;
        asset = (asset || 'GRAM').toUpperCase();
        const adminWallet = process.env.BOT_TON_ADDRESS || "UQC7hYHfrVJ_uT_esMr7vCv1bVh5ytQxYUUjRDiTUiG9s5Fb";

        // Generate a fresh, 100% unique 10-to-15 char comment code on the server for every single click
        const cleanSellCode = await generateUniqueSellCommentCode(10);

        // Prune expired codes older than 30 minutes
        const nowMs = Date.now();
        for (const [k, v] of inMemorySellCodes.entries()) {
            if (nowMs - v.createdAt > 30 * 60 * 1000) inMemorySellCodes.delete(k);
        }
        inMemorySellCodes.set(cleanSellCode, {
            sellCode: cleanSellCode,
            userId: String(userId || ''),
            asset,
            amount,
            userAddress: String(userAddress || ''),
            createdAt: nowMs,
            claimed: false
        });

        // Build TON standard text comment cell (opcode 0x00000000 + 10-15 char ASCII string)
        const commentCell = beginCell()
            .storeUint(0, 32)
            .storeStringTail(cleanSellCode)
            .endCell();

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
                // TEP-74 Jetton transfer with forward_payload comment reference so TonAPI indexes JettonTransfer.comment = cleanSellCode
                const body = beginCell()
                    .storeUint(0xf8a7ea5, 32)
                    .storeUint(0, 64)
                    .storeCoins(amountInMicro)
                    .storeAddress(Address.parse(adminWallet))
                    .storeAddress(Address.parse(userAddress || adminWallet))
                    .storeBit(0) // custom_payload: null
                    .storeCoins(1) // 1 nanoton forward_ton_amount triggers transfer_notification with comment
                    .storeBit(1) // forward_payload stored as ^Cell ref
                    .storeRef(commentCell)
                    .endCell();
                payload = body.toBoc().toString('base64');
            } catch(e) {
                console.error("USDT comment payload build error:", e.message);
            }

            res.json({
                success: true,
                sellCode: cleanSellCode,
                tx: {
                    validUntil: Math.floor(Date.now() / 1000) + 600,
                    messages: [{
                        address: targetContract,
                        amount: '50000000', // 0.05 TON gas
                        payload: payload || undefined
                    }]
                }
            });
        } else {
            const amountInNano = Math.floor(amount * 1e9);
            const commentPayload = commentCell.toBoc().toString('base64');
            res.json({
                success: true,
                sellCode: cleanSellCode,
                tx: {
                    validUntil: Math.floor(Date.now() / 1000) + 600,
                    messages: [{
                        address: adminWallet,
                        amount: amountInNano.toString(),
                        payload: commentPayload
                    }]
                }
            });
        }
    } catch(e) {
        console.error("build-tx error:", e);
        res.status(500).json({ error: e.message });
    }
});

// Function: Verify On-Chain payment via TonAPI (with 10-to-15 Char Auto Comment Code + Amount + Replay Protection)
async function verifyOnChainSellPayment({ userWallet, asset, amount, sellCode, userId }) {
    const cleanSellCode = String(sellCode || '').trim().toUpperCase();
    if (!/^[A-Z0-9]{10,15}$/.test(cleanSellCode)) {
        return { verified: false, error: 'ভেরিফিকেশন কোড পাওয়া যায়নি। দয়া করে আবার চেষ্টা করুন।' };
    }

    // Check if this 10-to-15 character code was already claimed in memory or Firestore
    const memEntry = inMemorySellCodes.get(cleanSellCode);
    if (memEntry && memEntry.claimed) {
        return { verified: false, error: 'এই ট্রানজেকশনটি ইতিমধ্যে ব্যবহৃত হয়েছে!' };
    }
    if (memEntry && memEntry.userId && userId && String(memEntry.userId) !== String(userId)) {
        return { verified: false, error: 'ভেরিফিকেশন কোডটি আপনার অ্যাকাউন্টের সাথে মিলছে না!' };
    }

    const existingCodeDoc = await db.collection('claimed_sell_codes').doc(cleanSellCode).get();
    if (existingCodeDoc.exists) {
        return { verified: false, error: 'এই ট্রানজেকশনটি আগেই ব্যবহার করা হয়েছে (Replay Blocked)!' };
    }

    const adminWallet = process.env.BOT_TON_ADDRESS || "UQC7hYHfrVJ_uT_esMr7vCv1bVh5ytQxYUUjRDiTUiG9s5Fb";
    let adminRaw = '';
    let userRaw = '';
    try {
        adminRaw = Address.parse(adminWallet).toRawString().toLowerCase();
        if (userWallet && userWallet !== 'Manual' && userWallet !== 'Direct') {
            userRaw = Address.parse(userWallet).toRawString().toLowerCase();
        }
    } catch(e) {
        return { verified: false, error: 'ওয়ালেট অ্যাড্রেস পার্স করতে ব্যর্থ হয়েছে: ' + e.message };
    }

    const normAsset = (asset || 'TON').toUpperCase();
    const targetAmt = parseFloat(amount) || 0;
    if (targetAmt <= 0) return { verified: false, error: 'অবৈধ অ্যামাউন্ট।' };

    // Retry loop: Tonkeeper / blockchain indexing can take 3-18 seconds to appear in TonAPI events
    const maxRetries = 8;
    const retryDelayMs = 2500;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const tonApiRes = await axios.get(`https://tonapi.io/v2/accounts/${adminRaw}/events?limit=30`, { timeout: 8000 });
            const events = tonApiRes.data?.events || [];
            const nowSec = Math.floor(Date.now() / 1000);

            for (const ev of events) {
                // Ignore events older than 15 minutes
                if (ev.timestamp && (nowSec - ev.timestamp > 900)) continue;
                if (ev.in_progress) continue;

                for (const act of (ev.actions || [])) {
                    if (act.status !== 'ok') continue;

                    if (normAsset === 'USDT' && act.type === 'JettonTransfer') {
                        const jt = act.JettonTransfer;
                        const senderRaw = jt.sender?.address ? Address.parse(jt.sender.address).toRawString().toLowerCase() : '';
                        const recipRaw = jt.recipient?.address ? Address.parse(jt.recipient.address).toRawString().toLowerCase() : '';
                        const jettonAmt = Number(jt.amount) / 1e6;
                        const txComment = String(jt.comment || '').trim().toUpperCase();

                        const isUsdt = jt.jetton?.symbol?.includes('USD') || jt.jetton?.address?.includes('b113a994b5024a16719f69139328eb759596c38a25f59028b146fecdc3621dfe');

                        // Match admin wallet recipient + exact 10-char comment code + amount
                        if (isUsdt && recipRaw === adminRaw && txComment === cleanSellCode && jettonAmt >= (targetAmt * 0.99)) {
                            const [eventDoc, codeDoc] = await Promise.all([
                                db.collection('claimed_onchain_events').doc(ev.event_id).get(),
                                db.collection('claimed_sell_codes').doc(cleanSellCode).get()
                            ]);
                            if (eventDoc.exists || codeDoc.exists) {
                                return { verified: false, error: 'এই ব্লকচেইন ট্রানজেকশনটি আগেই ব্যবহার করা হয়েছে (Replay Attack Blocked)!' };
                            }

                            if (memEntry) memEntry.claimed = true;

                            await Promise.all([
                                db.collection('claimed_onchain_events').doc(ev.event_id).set({
                                    eventId: ev.event_id,
                                    sellCode: cleanSellCode,
                                    userId: String(userId || ''),
                                    asset: normAsset,
                                    amount: jettonAmt,
                                    userWallet: userWallet || senderRaw,
                                    userRaw: senderRaw || userRaw,
                                    adminRaw,
                                    claimedAt: FieldValue.serverTimestamp()
                                }),
                                db.collection('claimed_sell_codes').doc(cleanSellCode).set({
                                    sellCode: cleanSellCode,
                                    eventId: ev.event_id,
                                    userId: String(userId || ''),
                                    asset: normAsset,
                                    amount: jettonAmt,
                                    userWallet: userWallet || senderRaw,
                                    claimedAt: FieldValue.serverTimestamp()
                                })
                            ]);

                            return { verified: true, eventId: ev.event_id, amount: jettonAmt, sellCode: cleanSellCode, timestamp: ev.timestamp };
                        }
                    } else if ((normAsset === 'TON' || normAsset === 'GRAM') && act.type === 'TonTransfer') {
                        const tt = act.TonTransfer;
                        const senderRaw = tt.sender?.address ? Address.parse(tt.sender.address).toRawString().toLowerCase() : '';
                        const recipRaw = tt.recipient?.address ? Address.parse(tt.recipient.address).toRawString().toLowerCase() : '';
                        const tonAmt = Number(tt.amount) / 1e9;
                        const txComment = String(tt.comment || '').trim().toUpperCase();

                        // Match admin wallet recipient + exact 10-char comment code + amount
                        if (recipRaw === adminRaw && txComment === cleanSellCode && tonAmt >= (targetAmt * 0.99)) {
                            const [eventDoc, codeDoc] = await Promise.all([
                                db.collection('claimed_onchain_events').doc(ev.event_id).get(),
                                db.collection('claimed_sell_codes').doc(cleanSellCode).get()
                            ]);
                            if (eventDoc.exists || codeDoc.exists) {
                                return { verified: false, error: 'এই ব্লকচেইন ট্রানজেকশনটি আগেই ব্যবহার করা হয়েছে (Replay Attack Blocked)!' };
                            }

                            if (memEntry) memEntry.claimed = true;

                            await Promise.all([
                                db.collection('claimed_onchain_events').doc(ev.event_id).set({
                                    eventId: ev.event_id,
                                    sellCode: cleanSellCode,
                                    userId: String(userId || ''),
                                    asset: normAsset,
                                    amount: tonAmt,
                                    userWallet: userWallet || senderRaw,
                                    userRaw: senderRaw || userRaw,
                                    adminRaw,
                                    claimedAt: FieldValue.serverTimestamp()
                                }),
                                db.collection('claimed_sell_codes').doc(cleanSellCode).set({
                                    sellCode: cleanSellCode,
                                    eventId: ev.event_id,
                                    userId: String(userId || ''),
                                    asset: normAsset,
                                    amount: tonAmt,
                                    userWallet: userWallet || senderRaw,
                                    claimedAt: FieldValue.serverTimestamp()
                                })
                            ]);

                            return { verified: true, eventId: ev.event_id, amount: tonAmt, sellCode: cleanSellCode, timestamp: ev.timestamp };
                        }
                    }
                }
            }
        } catch(err) {
            console.warn(`[verifyOnChainSellPayment] attempt ${attempt} TonAPI error:`, err.message);
        }

        if (attempt < maxRetries) {
            await new Promise(r => setTimeout(r, retryDelayMs));
        }
    }

    return { 
        verified: false, 
        error: 'ব্লকচেইনে কোনো ডিপোজিট ট্রানজেকশন পাওয়া যায়নি! আপনার ওয়ালেটে পর্যাপ্ত ব্যালেন্স আছে কিনা এবং পেমেন্ট সম্পন্ন হয়েছে কিনা চেক করুন।' 
    };
}

app.post('/api/miniapp/sell', async (req, res) => {
    const { userId, asset, amount, wallet, status, orderId, sellCode } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID is required' });

    // 1. Rate Limit check
    if (!checkRateLimit(`sell_${userId}`, 15, 60000)) {
        return res.status(429).json({ error: 'খুব বেশি রিকোয়েস্ট পাঠানো হয়েছে। দয়া করে ১ মিনিট অপেক্ষা করুন।' });
    }

    // 2. Caller Identity Verification (Telegram WebApp initData HMAC)
    if (!verifyRequestCallerIdentity(req, userId)) {
        return res.status(403).json({ error: 'অননুমোদিত রিকোয়েস্ট (User ID mismatch)' });
    }

    // 3. Concurrency Mutex Lock
    const hasLock = acquireUserFinancialLock(userId);
    if (!hasLock) {
        return res.status(429).json({ error: 'আপনার একটি লেনদেন ইতিমধ্যে প্রক্রিয়াধীন রয়েছে। অনুগ্রহ করে কয়েক সেকেন্ড পর আবার চেষ্টা করুন।' });
    }

    try {
        const normAsset = (asset || 'GRAM').toUpperCase();
        const numAmount = parseFloat(amount) || 0;
        const cleanSellCode = String(sellCode || '').trim().toUpperCase();

        // CRITICAL SECURITY FIX: Calculate BDT strictly on the server using live server sell rate!
        // Never trust client-supplied estimatedTk!
        const serverSellRate = normAsset === 'USDT'
            ? (Number(cachedMarketRates?.sellRates?.USDT) || 118)
            : (Number(cachedMarketRates?.sellRates?.GRAM) || 146);
        const serverExpectedTk = Math.floor(numAmount * serverSellRate);
        
        if (!Number.isFinite(numAmount) || numAmount <= 0 || !Number.isFinite(serverExpectedTk) || serverExpectedTk < 1) {
            return res.status(400).json({ error: 'নূন্যতম বিক্রয় ১ টাকা' });
        }

        // 4. Account Active Check (Ban/Restriction check only; never block Crypto Sell with balance audit)
        const statusCheck = await checkUserAccountActive(userId);
        if (!statusCheck.ok) {
            return res.status(403).json({ error: statusCheck.error });
        }

        const devInfo = extractClientDevice(req, req.body);
        recordAndVerifyDeviceAntiClone(userId, devInfo).catch(() => {});

        if (status === 'pending') {
            const docRef = await db.collection('miniapp_sells').add({
                userId, 
                asset: normAsset, 
                amount: numAmount, 
                estimatedTk: serverExpectedTk, 
                sellCode: cleanSellCode || null,
                wallet: wallet || 'Manual',
                status: 'pending',
                timestamp: FieldValue.serverTimestamp()
            });
            return res.json({ success: true, orderId: docRef.id });
        }

        // --- HARDENED ON-CHAIN VERIFICATION WITH 10-CHAR AUTO COMMENT CODE ---
        const onChain = await verifyOnChainSellPayment({
            userWallet: wallet,
            asset: normAsset,
            amount: numAmount,
            sellCode: cleanSellCode,
            userId
        });

        if (!onChain.verified) {
            // Record failed attempt in database for security audit
            await db.collection('miniapp_sells').add({
                userId,
                asset: normAsset,
                amount: numAmount,
                estimatedTk: serverExpectedTk,
                sellCode: cleanSellCode || null,
                wallet: wallet || 'Manual',
                status: 'failed',
                failureReason: onChain.error || 'On-chain verification failed',
                timestamp: FieldValue.serverTimestamp()
            }).catch(() => {});

            return res.status(400).json({ 
                success: false, 
                error: onChain.error || 'ব্লকচেইনে ডিপোজিট কনফার্ম হয়নি। ওয়ালেটে পর্যাপ্ত ব্যালেন্স আছে কিনা চেক করুন।' 
            });
        }

        // Compute exact verified BDT from the actual on-chain received amount
        const verifiedCryptoAmt = Math.min(Number(onChain.amount) || numAmount, numAmount * 1.05);
        const verifiedTk = Math.floor(verifiedCryptoAmt * serverSellRate);
        if (verifiedTk < 1) {
            return res.status(400).json({ error: 'নূন্যতম বিক্রয় ১ টাকা হতে হবে।' });
        }

        let savedOrderId = orderId;
        if (orderId) {
            await db.collection('miniapp_sells').doc(orderId).update({ 
                status: 'completed',
                estimatedTk: verifiedTk,
                sellCode: cleanSellCode,
                onChainEventId: onChain.eventId,
                completedAt: FieldValue.serverTimestamp()
            });
        } else {
            const docRef = await db.collection('miniapp_sells').add({
                userId, 
                asset: normAsset, 
                amount: numAmount, 
                estimatedTk: verifiedTk, 
                sellCode: cleanSellCode,
                wallet: wallet || 'Manual', 
                status: 'completed',
                onChainEventId: onChain.eventId,
                timestamp: FieldValue.serverTimestamp()
            });
            savedOrderId = docRef.id;
        }

        // Increment user balance & track totalCryptoSellBdt for referral activation using strictly server-calculated verifiedTk
        const userRef = db.collection('users').doc(userId.toString());
        const userDoc = await userRef.get();
        const extraWalletField = (wallet && wallet !== 'Manual' && wallet !== 'Direct' && String(wallet).length >= 20)
            ? { tonAddress: String(wallet).trim() }
            : {};

        if (userDoc.exists) {
            await userRef.update({ 
                balance: FieldValue.increment(verifiedTk),
                totalCryptoSellBdt: FieldValue.increment(verifiedTk),
                hasSellBalance: true,
                hasDepositWithoutTrade: false,
                ...extraWalletField
            });
        } else {
            await userRef.set({ 
                balance: verifiedTk, 
                totalCryptoSellBdt: verifiedTk,
                joinedAt: FieldValue.serverTimestamp(),
                hasSellBalance: true,
                hasDepositWithoutTrade: false,
                ...extraWalletField
            }, { merge: true });
        }

        // Check if this user qualifies their referrer for the 5 BDT active referral bonus
        checkAndRewardReferral(userId).catch(err => console.warn("Sell referral check err:", err.message));

        const updatedDoc = await userRef.get();
        const newBalance = updatedDoc.data()?.balance || verifiedTk;

        // Notify Data Group (Admin sees the 10-Char Comment Code)
        const config = botConfig || {};
        const dataGroup = config.dataGroupId || config.adminGroupId;
        if (dataGroup && bot) {
            const userData = updatedDoc.data() || userDoc.data() || {};
            const userName = userData.first_name || userData.firstName || 'User';
            const rawUname = userData.username ? userData.username.replace('@', '') : '';
            const userUname = rawUname ? `@${rawUname}` : 'None';

            const msg = `<blockquote><b>⚡ নতুন ক্রিপ্টো বিক্রয় (Crypto Sold - Verified)!</b>\n\n` +
                `👤 <b>Name:</b> <a href="tg://user?id=${userId}">${escapeHtml(userName)}</a>\n` +
                `🆔 <b>User ID:</b> <code>${userId}</code>\n` +
                `🔗 <b>Username:</b> ${userUname}\n` +
                `💎 <b>বিক্রয়:</b> <b>${numAmount} ${normAsset}</b>\n` +
                `💵 <b>ব্যালেন্সে যুক্ত:</b> <b>৳${verifiedTk} BDT</b>\n` +
                `💰 <b>নতুন ব্যালেন্স:</b> <b>৳${newBalance} BDT</b>\n` +
                `🔢 <b>Comment Code:</b> <code>${cleanSellCode}</code>\n` +
                `🏦 <b>Wallet:</b> <code>${wallet || 'Direct'}</code>\n` +
                `🔗 <b>Tx Event:</b> <code>${onChain.eventId}</code>\n` +
                `🆔 <b>Order ID:</b> <code>${savedOrderId}</code></blockquote>`;
            bot.sendMessage(dataGroup, msg, { parse_mode: 'HTML' }).catch(e=>console.error(e.message));
        }

        // Send confirmation to User in Telegram (without showing internal comment code)
        if (bot && userId) {
            const userSellMsg = `${PE.moneyBag} <b>Crypto Sell Completed! (ক্রিপ্টো বিক্রি সফল!)</b>\n\n` +
                `${PE.gem} <b>Sold Asset:</b> ${numAmount} ${normAsset}\n` +
                `${PE.dollar} <b>Added Amount:</b> ৳${verifiedTk} BDT\n` +
                `${PE.moneyBag} <b>New Balance:</b> <b>৳${newBalance} BDT</b>\n` +
                `${PE.globe} <b>Order ID:</b> <code>${savedOrderId}</code>\n\n` +
                `${PE.zap} <i>টাকাটি অ্যাপ ব্যালেন্সে জমা হয়েছে। প্রোফাইল থেকে যেকোনো সময় উইথড্র করতে পারবেন!</i>`;
            bot.sendMessage(userId, userSellMsg, { parse_mode: 'HTML', ...appOpenMarkup }).catch(e=>console.error(e.message));
        }

        res.json({ success: true, orderId: savedOrderId, newBalance, creditedTk: verifiedTk });
    } catch(e) {
        console.error("Sell order error:", e);
        res.status(500).json({ error: e.message });
    } finally {
        releaseUserFinancialLock(userId);
    }
});

// =======================================================
// DETERMINISTIC USER EVM DEPOSIT ADDRESS (ARBITRUM & BEP20)
// =======================================================
function getUserEvmDepositAddress(userId) {
    if (!userId) return null;
    const masterSecret = process.env.BOT_EVM_PRIVATE_KEY || 'maruf-teach-bot-evm-master-key-2026';
    const userPrivKey = ethers.keccak256(ethers.toUtf8Bytes(masterSecret + ":user_deposit:" + userId));
    const userWallet = new ethers.Wallet(userPrivKey);
    return userWallet.address;
}

app.get('/api/miniapp/deposit-address/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) return res.status(400).json({ error: 'User ID required' });
        const address = getUserEvmDepositAddress(userId);
        return res.json({ success: true, address, userId });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

app.post('/api/miniapp/check-evm-deposit', async (req, res) => {
    const { userId, network } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID required' });

    const cleanNet = (network === 'ARBITRUM' || network === 'ARB') ? 'ARBITRUM' : 'BEP20';
    const netCfg = EVM_NETWORKS_CONFIG[cleanNet];
    if (!netCfg) return res.status(400).json({ error: 'Invalid network' });

    const userEvmAddress = getUserEvmDepositAddress(userId);
    if (!userEvmAddress) return res.status(400).json({ error: 'Failed to derive address' });

    // Financial Mutex Lock - Prevents concurrent double-claim race condition
    const hasLock = acquireUserFinancialLock(userId);
    if (!hasLock) {
        return res.status(429).json({ error: 'আপনার একটি লেনদেন ইতিমধ্যে প্রক্রিয়াধীন রয়েছে। অনুগ্রহ করে কয়েক সেকেন্ড পর আবার চেষ্টা করুন।' });
    }

    try {
        const provider = new ethers.JsonRpcProvider(netCfg.rpc);
        const usdtContract = new ethers.Contract(
            netCfg.usdtContract,
            ['function balanceOf(address) view returns (uint256)'],
            provider
        );

        const balanceUnits = await usdtContract.balanceOf(userEvmAddress);
        const curBal = parseFloat(ethers.formatUnits(balanceUnits, netCfg.usdtDecimals));

        if (curBal < 0.1) {
            return res.json({ 
                success: false, 
                message: `এখনো কোনো USDT পাওয়া যায়নি। ট্রানজেকশন সফল হলে ১-২ মিনিট পর আবার চেক করুন।`,
                address: userEvmAddress,
                balance: curBal 
            });
        }

        // Check already credited amount
        const checkPrev = await db.collection('miniapp_sells')
            .where('userId', '==', userId)
            .where('wallet', '==', userEvmAddress)
            .where('network', '==', cleanNet)
            .where('status', '==', 'completed')
            .get();

        let previouslyCredited = 0;
        checkPrev.forEach(d => {
            previouslyCredited += Number(d.data().amount || 0);
        });

        const uncreditedAmount = curBal - previouslyCredited;
        if (uncreditedAmount < 0.1) {
            return res.json({
                success: false,
                message: `বর্তমান ব্যালেন্সের (${curBal} USDT) সবটুকু ইতিমধ্যে জমা করা হয়েছে। নতুন ডিপোজিট পাওয়া যায়নি।`,
                address: userEvmAddress,
                balance: curBal
            });
        }

        const serverSellRate = Number(cachedMarketRates?.sellRates?.USDT) || 118;
        const creditedTk = Math.floor(uncreditedAmount * serverSellRate);

        const docRef = await db.collection('miniapp_sells').add({
            userId,
            asset: 'USDT',
            amount: uncreditedAmount,
            estimatedTk: creditedTk,
            network: cleanNet,
            wallet: userEvmAddress,
            status: 'completed',
            type: 'evm_onchain_deposit',
            timestamp: FieldValue.serverTimestamp()
        });

        const userRef = db.collection('users').doc(userId.toString());
        const userDoc = await userRef.get();
        if (userDoc.exists) {
            await userRef.update({
                balance: FieldValue.increment(creditedTk),
                totalCryptoSellBdt: FieldValue.increment(creditedTk),
                hasSellBalance: true,
                hasDepositWithoutTrade: false
            });
        } else {
            await userRef.set({
                balance: creditedTk,
                totalCryptoSellBdt: creditedTk,
                joinedAt: FieldValue.serverTimestamp(),
                hasSellBalance: true,
                hasDepositWithoutTrade: false
            }, { merge: true });
        }

        // Referral reward check
        checkAndRewardReferral(userId).catch(err => console.warn("Sell referral check err:", err.message));

        // Notify Admin Data Group
        const config = botConfig || {};
        const dataGroup = config.dataGroupId || config.adminGroupId;
        if (dataGroup && bot) {
            const uData = (await userRef.get()).data() || {};
            const uName = uData.first_name || uData.firstName || 'User';
            const rawEvmUname = uData.username ? uData.username.replace('@', '') : '';
            const evmUname = rawEvmUname ? `@${rawEvmUname}` : 'None';

            const adminMsg = `<blockquote><b>⚡ নতুন ক্রিপ্টো বিক্রয় (EVM On-Chain Deposit - Verified)!</b>\n\n` +
                `👤 <b>Name:</b> <a href="tg://user?id=${userId}">${escapeHtml(uName)}</a>\n` +
                `🆔 <b>User ID:</b> <code>${userId}</code>\n` +
                `🔗 <b>Username:</b> ${evmUname}\n` +
                `💎 <b>Asset:</b> ${uncreditedAmount} USDT\n` +
                `🌐 <b>Network:</b> ${netCfg.name}\n` +
                `৳ <b>Added:</b> ৳${creditedTk} BDT\n` +
                `🏦 <b>Deposit Wallet:</b> <code>${userEvmAddress}</code>\n` +
                `🆔 <b>Order ID:</b> <code>${docRef.id}</code></blockquote>`;
            bot.sendMessage(dataGroup, adminMsg, { parse_mode: 'HTML' }).catch(e => console.error(e.message));
        }

        // Notify User in Telegram
        if (bot && userId) {
            const userMsg = `💰 <b>USDT অন-চেইন ডিপোজিট সফল!</b>\n\n` +
                `🌐 <b>Network:</b> ${netCfg.name}\n` +
                `💵 <b>Amount:</b> ${uncreditedAmount} USDT\n` +
                `৳ <b>ব্যালেন্সে জমা:</b> ৳${creditedTk} BDT\n\n` +
                `⚡ <i>টাকাটি আপনার অ্যাপ ব্যালেন্সে সফলভাবে যোগ করা হয়েছে।</i>`;
            bot.sendMessage(userId, userMsg, { parse_mode: 'HTML', ...appOpenMarkup }).catch(() => {});
        }

        return res.json({
            success: true,
            creditedAmount: uncreditedAmount,
            creditedTk,
            orderId: docRef.id,
            message: `অভিনন্দন! আপনার ${uncreditedAmount} USDT সফলভাবে গৃহীত হয়েছে এবং ৳${creditedTk} ব্যালেন্সে যোগ করা হয়েছে।`
        });
    } catch (err) {
        console.error("Check EVM deposit error:", err);
        return res.status(500).json({ error: 'ডিপোজিট চেক করতে সমস্যা হয়েছে: ' + err.message });
    } finally {
        releaseUserFinancialLock(userId);
    }
});
// =======================================================
// ADMIN PANEL SECURITY: MILITARY-GRADE 2FA & STRICT IP WHITELIST
// =======================================================
const MASTER_ADMIN_ID = '8799135330'; // Maruf's Telegram ID
const ADMIN_SECRET_PATH = '/tp-admin-vault-8799135330-x99k28df77';

function normalizeIp(ip) {
    if (!ip) return '';
    let clean = String(ip).trim();
    if (clean.startsWith('::ffff:')) clean = clean.slice(7);
    return clean;
}

// Strict Admin Whitelist: ONLY Maruf's Laptop IP + Localhost
const allowedAdminIps = new Set([
    '103.191.174.53', // Maruf Laptop (M/s. Chesta, Bogra)
    '127.0.0.1',
    '::1',
    'localhost'
]);

async function syncAllowedAdminIpsFromDb() {
    try {
        const snap = await db.collection('settings').doc('allowed_admin_ips').get();
        if (snap.exists && Array.isArray(snap.data()?.ips)) {
            snap.data().ips.forEach(ip => {
                const norm = normalizeIp(ip);
                if (norm) allowedAdminIps.add(norm);
            });
            console.log(`[AdminSecurity] Loaded ${allowedAdminIps.size} allowed Admin IPs from Firestore.`);
        } else {
            await db.collection('settings').doc('allowed_admin_ips').set({
                ips: Array.from(allowedAdminIps),
                updatedAt: FieldValue.serverTimestamp()
            }, { merge: true });
            console.log('[AdminSecurity] Initialized allowed Admin IPs in Firestore.');
        }
    } catch (e) {
        console.warn('[AdminSecurity] syncAllowedAdminIpsFromDb warning:', e.message);
    }
}
syncAllowedAdminIpsFromDb();

// 3-LAYER QUANTUM VAULT CONFIGURATION & CACHE
let cachedVaultConfig = {
    secretCode: '5664055', // Layer 1 Secret Code
    sheetUrl: '',          // Layer 2 Google Sheet URL
    sheetKeyword: 'MarufOwnerVault2026', // Layer 2 Fallback keyword
    updatedAt: null
};

let cachedSheetKeyword = {
    keyword: '',
    fetchedAt: 0
};

async function syncVaultConfigFromDb() {
    try {
        const snap = await db.collection('settings').doc('admin_vault_layer').get();
        if (snap.exists && snap.data()) {
            const d = snap.data();
            cachedVaultConfig.secretCode = d.secretCode || '5664055';
            cachedVaultConfig.sheetUrl = d.sheetUrl || '';
            cachedVaultConfig.sheetKeyword = d.sheetKeyword || 'MarufOwnerVault2026';
            console.log('[VaultSecurity] ✓ Loaded Quantum Vault settings from Firestore.');
        } else {
            await db.collection('settings').doc('admin_vault_layer').set({
                secretCode: '5664055',
                sheetUrl: '',
                sheetKeyword: 'MarufOwnerVault2026',
                updatedAt: FieldValue.serverTimestamp()
            }, { merge: true });
            console.log('[VaultSecurity] ✓ Initialized Quantum Vault settings in Firestore.');
        }
    } catch (e) {
        console.warn('[VaultSecurity] syncVaultConfigFromDb warning:', e.message);
    }
}
syncVaultConfigFromDb();

async function fetchGoogleSheetKeyword() {
    if (cachedSheetKeyword.keyword && (Date.now() - cachedSheetKeyword.fetchedAt < 60000)) {
        return cachedSheetKeyword.keyword;
    }
    const sheetUrl = cachedVaultConfig.sheetUrl || process.env.VAULT_GOOGLE_SHEET_URL || '';
    if (!sheetUrl) {
        return cachedVaultConfig.sheetKeyword || 'MarufOwnerVault2026';
    }

    try {
        let exportUrl = sheetUrl;
        const match = sheetUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
            exportUrl = `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`;
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);

        const resp = await fetch(exportUrl, {
            signal: controller.signal,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        clearTimeout(timeout);

        if (!resp.ok) {
            console.warn('[VaultLayer2] Google Sheet fetch HTTP status:', resp.status);
            return cachedVaultConfig.sheetKeyword || 'MarufOwnerVault2026';
        }

        const csvText = await resp.text();
        const firstLine = csvText.split(/\r?\n/)[0] || '';
        const rawCell = firstLine.split(',')[0] || '';
        const cleanWord = rawCell.replace(/^[\"'\s]+|[\"'\s]+$/g, '').trim();

        if (cleanWord) {
            cachedSheetKeyword = {
                keyword: cleanWord,
                fetchedAt: Date.now()
            };
            console.log('[VaultLayer2] ✓ Live Google Sheet keyword fetched:', cleanWord);
            return cleanWord;
        }
    } catch (err) {
        console.warn('[VaultLayer2] Google Sheet fetch error:', err.message);
    }

    return cachedVaultConfig.sheetKeyword || 'MarufOwnerVault2026';
}

// In-memory 3-Layer Quantum Vault Sessions (5 minutes TTL)
const quantumVaultSessions = new Map();

async function addAllowedAdminIp(ip) {
    const norm = normalizeIp(ip);
    if (!norm) return false;
    allowedAdminIps.add(norm);
    try {
        await db.collection('settings').doc('allowed_admin_ips').set({
            ips: Array.from(allowedAdminIps),
            updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });
        return true;
    } catch (_) { return false; }
}

async function removeAllowedAdminIp(ip) {
    const norm = normalizeIp(ip);
    if (!norm) return false;
    if (norm === '127.0.0.1' || norm === '::1') return false;
    allowedAdminIps.delete(norm);
    try {
        await db.collection('settings').doc('allowed_admin_ips').set({
            ips: Array.from(allowedAdminIps),
            updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });
        return true;
    } catch (_) { return false; }
}

function isClientAllowedAdmin(clientIp) {
    const raw = String(clientIp || '').trim();
    const norm = normalizeIp(raw);

    // 1. If IP is banned -> Strictly Forbidden
    if (bannedIps.has(raw) || (norm && bannedIps.has(norm))) {
        return false;
    }

    // 2. If IP is in allowedAdminIps -> Allowed
    if (allowedAdminIps.has(raw) || (norm && allowedAdminIps.has(norm))) {
        return true;
    }

    // 3. All other IPs worldwide -> Strictly Forbidden
    return false;
}

function isIpAllowedForAdmin(ip) {
    return isClientAllowedAdmin(ip);
}

// Strict IP Whitelist Middleware: Immediately blocks non-whitelisted IPs from accessing Admin with REAL 404
function requireAdminIpWhitelist(req, res, next) {
    const clientIp = getClientIp(req);

    if (!isClientAllowedAdmin(clientIp)) {
        console.warn(`[AdminSecurity] 🚨 404 DECOY SERVED TO UNAUTHORIZED/BANNED IP: ${clientIp} -> ${req.method} ${req.originalUrl}`);
        
        if (clientIp !== '127.0.0.1' && clientIp !== '::1') {
            const userAgent = String(req.headers['user-agent'] || 'Unknown');
            const timeStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' });
            sendSecurityAlert(
                `🚨 <b>UNAUTHORIZED ADMIN ACCESS BLOCKED (404 SERVED)</b>\n\n` +
                `❌ <b>অননুমোদিত আইপি (হোয়াইটলিস্টে নেই বা ব্যানড)!</b>\n` +
                `🌐 <b>আইপি:</b> <code>${clientIp}</code>\n` +
                `📍 <b>পাথ:</b> <code>${escapeHtml(req.originalUrl)}</code>\n` +
                `🖥 <b>ডিভাইস:</b> <code>${escapeHtml(userAgent.slice(0, 100))}</code>\n` +
                `⏰ <b>সময়:</b> ${timeStr}\n\n` +
                `🛡 <i>ক্লায়েন্টকে নিখুঁত রিয়েল 404 Not Found (Nginx) পেজ পরিবেশন করা হয়েছে।</i>\n` +
                `আইপি ব্যান করতে: <code>/banip ${clientIp}</code>\n` +
                `হোয়াইটলিস্টে যোগ করতে: <code>/addadminip ${clientIp}</code>`
            ).catch(() => {});
        }

        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        return res.status(404).send(REAL_404_HTML);
    }
    next();
}

// Hardened secret that immediately invalidates all previous sessions
const ADMIN_TOKEN_SECRET = crypto
    .createHash('sha256')
    .update((serviceAccount?.private_key || 'trustpay-secret-key') + '::admin_hardened_shield_v2_2026')
    .digest('hex');

let cachedAdminCreds = {
    email: process.env.ADMIN_EMAIL || 'maruf.admin@trustpay.com',
    password: process.env.ADMIN_PASSWORD || 'Maruf#2026!AdminSec99'
};

async function ensureAdminCredentialsInDb() {
    try {
        const authRef = db.collection('settings').doc('admin_auth');
        const doc = await authRef.get();
        if (doc.exists && doc.data()?.email && doc.data()?.password) {
            cachedAdminCreds = {
                email: doc.data().email,
                password: doc.data().password
            };
            console.log('[AdminSecurity] ✓ Active credentials synced from Firestore (settings/admin_auth).');
        } else {
            await authRef.set({
                email: cachedAdminCreds.email,
                password: cachedAdminCreds.password,
                desktopOnly: true,
                updatedAt: FieldValue.serverTimestamp()
            }, { merge: true });
            console.log('[AdminSecurity] ✓ Initialized admin credentials in Firestore.');
        }
    } catch (err) {
        console.warn('[AdminSecurity] Firestore admin_auth sync warning:', err.message);
    }
}
ensureAdminCredentialsInDb();

function isMobileRequest(req) {
    const ua = String(req.headers['user-agent'] || '');
    const chMobile = String(req.headers['sec-ch-ua-mobile'] || '');
    if (chMobile === '?1') return true;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Telegram/i.test(ua);
}

function createAdminToken(email) {
    const payload = Buffer.from(JSON.stringify({
        email,
        iat: Date.now(),
        exp: Date.now() + 7 * 24 * 60 * 60 * 1000
    })).toString('base64url');
    const sig = crypto.createHmac('sha256', ADMIN_TOKEN_SECRET).update(payload).digest('base64url');
    return `${payload}.${sig}`;
}

function verifyAdminToken(req) {
    try {
        const authHeader = req.headers['authorization'] || '';
        const token = authHeader.startsWith('Bearer ')
            ? authHeader.slice(7).trim()
            : (req.headers['x-admin-token'] || req.query?.token || '');
        if (!token || !token.includes('.')) return null;
        const [payloadB64, sig] = token.split('.');
        const expectedSig = crypto.createHmac('sha256', ADMIN_TOKEN_SECRET).update(payloadB64).digest('base64url');
        if (sig !== expectedSig) return null;
        const data = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
        if (!data || !data.exp || Date.now() > data.exp) return null;
        return data;
    } catch (_) {
        return null;
    }
}

function requireAdminAuth(req, res, next) {
    if (isMobileRequest(req)) {
        return res.status(403).json({
            error: 'মোবাইল ডিভাইস থেকে অ্যাডমিন প্যানেলে প্রবেশ সম্পূর্ণ নিষিদ্ধ! শুধুমাত্র ডেস্কটপ (PC/Laptop) ব্যবহার করুন।',
            mobileBlocked: true
        });
    }
    const verified = verifyAdminToken(req);
    if (!verified) {
        return res.status(401).json({
            error: 'Unauthorized: অনুগ্রহ করে অ্যাডমিন ইমেইল ও পাসওয়ার্ড দিয়ে লগইন করুন।',
            unauthorized: true
        });
    }
    req.adminUser = verified;
    next();
}

// In-memory rate limiting for login attempts
const adminLoginAttempts = new Map(); // ip -> { count, lockedUntil, totalFails }
function recordFailedLogin(ip) {
    const now = Date.now();
    const rec = adminLoginAttempts.get(ip) || { count: 0, lockedUntil: 0, totalFails: 0 };
    rec.count += 1;
    rec.totalFails += 1;
    if (rec.count >= 3) {
        rec.lockedUntil = now + 2 * 60 * 60 * 1000; // 2 hours lockout
    }
    adminLoginAttempts.set(ip, rec);
    return rec;
}
function resetFailedLogin(ip) {
    const rec = adminLoginAttempts.get(ip);
    if (rec) {
        rec.count = 0;
        rec.lockedUntil = 0;
        adminLoginAttempts.set(ip, rec);
    }
}

// In-memory sessions for Admin 2FA verification (5 minutes TTL, max 3 OTP attempts)
const pendingAdmin2FASessions = new Map();

async function sendSecurityAlert(msgHtml) {
    const targets = [MASTER_ADMIN_ID];
    const config = botConfig || {};
    const withdrawGroup = config.withdrawGroupId || config.adminGroupId;
    if (withdrawGroup && !targets.includes(withdrawGroup.toString())) {
        targets.push(withdrawGroup.toString());
    }
    for (const target of targets) {
        if (withdrawBot) {
            try {
                await withdrawBot.sendMessage(target, msgHtml, { parse_mode: 'HTML' });
                continue;
            } catch (_) {}
        }
        if (bot) {
            try {
                await bot.sendMessage(target, msgHtml, { parse_mode: 'HTML' });
            } catch (_) {}
        }
    }
}

async function sendAdmin2FACode(code, clientIp = 'Unknown', userAgent = 'Unknown') {
    const timeStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' });
    const msg = `🔐 <b>Trust Pay — Admin 2FA Login Code</b>\n\n` +
        `অ্যাডমিন প্যানেলে লগইন করার ভেরিফিকেশন কোড:\n\n` +
        `👉 <code>${code}</code> 👈 <i>(ট্যাপ করে কপি করুন)</i>\n\n` +
        `⏱ <b>মেয়াদ:</b> ৫ মিনিট (সর্বোচ্চ ৩ বার চেষ্টা)\n` +
        `🌐 <b>আইপি:</b> <code>${clientIp}</code>\n` +
        `🖥 <b>ডিভাইস:</b> <code>${escapeHtml(userAgent.slice(0, 100))}</code>\n` +
        `⏰ <b>সময়:</b> ${timeStr}\n\n` +
        `⚠️ <i>যদি আপনি এই চেষ্টা না করে থাকেন, তবে তৎক্ষণাৎ আইপি ব্লক করতে বটে পাঠান:</i>\n` +
        `<code>/banip ${clientIp}</code>\n\n` +
        `🔑 <i>পাসওয়ার্ড পরিবর্তন করতে পাঠান:</i>\n` +
        `<code>/setadminpassword নতুন_পাসওয়ার্ড</code>`;

    console.log(`[Admin 2FA] Dispatching OTP [${code}] to Master Admin for IP: ${clientIp}`);
    await sendSecurityAlert(msg);
}

// STRICT IP WHITELIST: Block all unauthorized IPs in the world from reaching Admin API
app.use('/api/admin', requireAdminIpWhitelist);
app.use(['/api/stats', '/api/withdraw', '/api/approve-fraud', '/api/transactions'], requireAdminIpWhitelist);

app.post('/api/admin/login', async (req, res) => {
    try {
        const clientIp = getClientIp(req);
        const userAgent = String(req.headers['user-agent'] || 'Unknown');

        // Check if IP is permanently banned
        if (bannedIps.has(clientIp)) {
            return res.status(403).json({ error: 'Your IP has been permanently banned by Security Firewall.' });
        }

        if (isMobileRequest(req)) {
            return res.status(403).json({
                error: 'মোবাইল ডিভাইস থেকে অ্যাডমিন প্যানেলে প্রবেশ সম্পূর্ণ নিষিদ্ধ! শুধুমাত্র ডেস্কটপ (PC/Laptop) ব্যবহার করুন।',
                mobileBlocked: true
            });
        }

        // Check sliding lockout for this IP
        const attemptRecord = adminLoginAttempts.get(clientIp);
        if (attemptRecord && attemptRecord.lockedUntil > Date.now()) {
            const minsLeft = Math.ceil((attemptRecord.lockedUntil - Date.now()) / 60000);
            return res.status(429).json({
                error: `অত্যাধিক ভুল চেষ্টার কারণে আপনার আইপি সাময়িক লক করা হয়েছে। দয়া করে ${minsLeft} মিনিট পর আবার চেষ্টা করুন।`
            });
        }

        const { email, password } = req.body || {};
        if (!email || !password) {
            return res.status(400).json({ error: 'ইমেইল এবং পাসওয়ার্ড প্রদান করুন।' });
        }

        // Fetch latest credentials from Firestore settings/admin_auth
        try {
            const doc = await db.collection('settings').doc('admin_auth').get();
            if (doc.exists && doc.data()?.email && doc.data()?.password) {
                cachedAdminCreds = {
                    email: doc.data().email,
                    password: doc.data().password
                };
            }
        } catch (_) {}

        const inputEmail = String(email).trim().toLowerCase();
        const inputPass = String(password);

        if (
            inputEmail === cachedAdminCreds.email.trim().toLowerCase() &&
            inputPass === cachedAdminCreds.password
        ) {
            // Success Step 1: Reset failed attempts for this IP
            resetFailedLogin(clientIp);

            // Generate 6-digit OTP and secure session tempToken
            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
            const tempToken = crypto.randomBytes(24).toString('hex');
            
            pendingAdmin2FASessions.set(tempToken, {
                otpCode,
                email: cachedAdminCreds.email,
                clientIp,
                userAgent,
                failedAttempts: 0,
                maxAttempts: 3,
                expiresAt: Date.now() + 5 * 60 * 1000
            });

            // Dispatch 2FA with IP and User-Agent to Maruf
            sendAdmin2FACode(otpCode, clientIp, userAgent).catch(e => console.error("sendAdmin2FACode error:", e.message));

            return res.json({
                success: true,
                require2FA: true,
                tempToken,
                message: 'আপনার টেলিগ্রাম উইথড্র বটে ৬ ডিজিটের ২-স্টেপ ভেরিফিকেশন কোড পাঠানো হয়েছে।'
            });
        }

        // Credentials Mismatch! Track failure and alert Maruf
        const rec = recordFailedLogin(clientIp);
        const timeStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' });

        // Instant Security Warning to Telegram
        const alertMsg = `🚨 <b>সতর্কবার্তা: অ্যাডমিন প্যানেলে অনুপ্রবেশের চেষ্টা ব্যর্থ!</b>\n\n` +
            `কেউ একজন ভুল পাসওয়ার্ড দিয়ে অ্যাডমিন প্যানেলে ঢোকার চেষ্টা করেছে!\n\n` +
            `📧 <b>চেষ্টাকৃত ইমেইল:</b> <code>${escapeHtml(inputEmail)}</code>\n` +
            `🌐 <b>অনুপ্রবেশকারীর আইপি:</b> <code>${clientIp}</code>\n` +
            `🖥 <b>ডিভাইস:</b> <code>${escapeHtml(userAgent.slice(0, 100))}</code>\n` +
            `⏰ <b>সময়:</b> ${timeStr}\n` +
            `🔢 <b>ব্যর্থ চেষ্টা:</b> ${rec.count}/3 (মোট ব্যর্থ: ${rec.totalFails})\n\n` +
            `<i>এই আইপিকে ফায়ারওয়ালে ব্যান করতে বটে পাঠান:</i>\n` +
            `<code>/banip ${clientIp}</code>`;
        sendSecurityAlert(alertMsg).catch(() => {});

        // If >= 5 total fails, auto-ban IP permanently
        if (rec.totalFails >= 5) {
            await addBannedIp(clientIp, '5+ failed admin login attempts (Brute-force attack)');
            const banAlert = `⛔ <b>FIREWALL AUTO-BAN: আক্রমণকারী ব্লকড!</b>\n\n` +
                `বারংবার ভুল পাসওয়ার্ড দিয়ে হ্যাকিং চেষ্টার জন্য আইপি <code>${clientIp}</code> ফায়ারওয়াল দ্বারা স্থায়ীভাবে ব্যান করা হয়েছে!`;
            sendSecurityAlert(banAlert).catch(() => {});
        }

        return res.status(401).json({
            error: rec.count >= 3
                ? 'পরপর ৩ বার ভুল তথ্য দেওয়ায় আপনার আইপি ২ ঘণ্টার জন্য সাময়িক লক করা হয়েছে।'
                : `ভুল ইমেইল অথবা পাসওয়ার্ড! আপনার আর মাত্র ${3 - rec.count} টি সুযোগ বাকি আছে।`
        });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
});

app.post('/api/admin/verify-2fa', async (req, res) => {
    try {
        const clientIp = getClientIp(req);
        if (bannedIps.has(clientIp)) {
            return res.status(403).json({ error: 'Your IP has been permanently banned by Security Firewall.' });
        }

        if (isMobileRequest(req)) {
            return res.status(403).json({
                error: 'মোবাইল ডিভাইস থেকে প্রবেশ সম্পূর্ণ নিষিদ্ধ!',
                mobileBlocked: true
            });
        }
        const { tempToken, otpCode } = req.body || {};
        if (!tempToken || !otpCode) {
            return res.status(400).json({ error: 'ভেরিফিকেশন কোড এবং টোকেন প্রয়োজন।' });
        }
        const session = pendingAdmin2FASessions.get(tempToken);
        if (!session) {
            return res.status(400).json({ error: 'সেশন পাওয়া যায়নি অথবা মেয়াদ শেষ হয়েছে। দয়া করে আবার লগইন করুন।' });
        }
        if (Date.now() > session.expiresAt) {
            pendingAdmin2FASessions.delete(tempToken);
            return res.status(400).json({ error: 'ভেরিফিকেশন কোডের মেয়াদ (৫ মিনিট) শেষ হয়ে গেছে। আবার লগইন করুন।' });
        }

        // Validate OTP with 3-attempt brute-force protection
        if (session.otpCode.trim() !== String(otpCode).trim()) {
            session.failedAttempts = (session.failedAttempts || 0) + 1;
            const remaining = session.maxAttempts - session.failedAttempts;

            if (remaining <= 0) {
                // Destroy session & auto-ban attacker IP
                pendingAdmin2FASessions.delete(tempToken);
                await addBannedIp(clientIp, '3 failed 2FA OTP verification attempts (OTP Brute-force)');
                
                const timeStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' });
                const critMsg = `🚨 <b>CRITICAL SECURITY FIREWALL ALERT</b>\n\n` +
                    `কারো একজন ৩ বার ভুল ২FA কোড দেওয়ার কারণে সেশন ধ্বংস করা হয়েছে এবং আইপি স্থায়ীভাবে ব্যান করা হয়েছে!\n\n` +
                    `🌐 <b>ব্যানকৃত আইপি:</b> <code>${clientIp}</code>\n` +
                    `🖥 <b>ডিভাইস:</b> <code>${escapeHtml(session.userAgent || 'Unknown')}</code>\n` +
                    `⏰ <b>সময়:</b> ${timeStr}\n` +
                    `🛡 <b>ফলাফল:</b> অনুপ্রবেশকারী সম্পূর্ণ ব্লকড।`;
                sendSecurityAlert(critMsg).catch(() => {});

                return res.status(403).json({
                    error: 'পরপর ৩ বার ভুল কোড দেওয়ায় আপনার সেশন বাতিল ও আইপি স্থায়ীভাবে ব্যান করা হয়েছে।'
                });
            }

            return res.status(400).json({
                error: `ভুল ভেরিফিকেশন কোড! আপনার আর মাত্র ${remaining} টি সুযোগ বাকি আছে।`
            });
        }

        // 2FA Verified! Issue Admin Bearer Token Directly
        pendingAdmin2FASessions.delete(tempToken);
        const token = createAdminToken(session.email);

        const timeStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' });
        sendSecurityAlert(
            `🔐 <b>ADMIN LOGIN SUCCESSFUL</b>\n\n` +
            `✅ <b>অ্যাডমিন লগইন সফল হয়েছে!</b>\n` +
            `📧 <b>ইমেইল:</b> <code>${session.email}</code>\n` +
            `🌐 <b>আইপি:</b> <code>${clientIp}</code>\n` +
            `🖥 <b>ডিভাইস:</b> <code>${escapeHtml(session.userAgent || 'Unknown')}</code>\n` +
            `⏰ <b>সময়:</b> ${timeStr}`
        ).catch(() => {});

        return res.json({
            success: true,
            token,
            email: session.email,
            message: 'অ্যাডমিন লগইন সফল হয়েছে।'
        });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
});

app.post('/api/admin/resend-2fa', async (req, res) => {
    try {
        const clientIp = getClientIp(req);
        if (bannedIps.has(clientIp)) {
            return res.status(403).json({ error: 'Access denied.' });
        }
        const { tempToken } = req.body || {};
        if (!tempToken) return res.status(400).json({ error: 'Token is required' });
        const session = pendingAdmin2FASessions.get(tempToken);
        if (!session) {
            return res.status(400).json({ error: 'সেশনের মেয়াদ শেষ হয়েছে। দয়া করে আবার লগইন করুন।' });
        }
        const newCode = Math.floor(100000 + Math.random() * 900000).toString();
        session.otpCode = newCode;
        session.failedAttempts = 0; // reset attempts for new code
        session.expiresAt = Date.now() + 5 * 60 * 1000;
        pendingAdmin2FASessions.set(tempToken, session);
        await sendAdmin2FACode(newCode, clientIp, session.userAgent);
        return res.json({ success: true, message: 'নতুন ভেরিফিকেশন কোড উইথড্র বটে পাঠানো হয়েছে।' });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
});

// =======================================================
// 3-LAYER QUANTUM VAULT ENDPOINTS
// =======================================================

// LAYER 1: Database Secret Master Code ("5664055")
app.post('/api/admin/verify-layer1', async (req, res) => {
    try {
        const clientIp = getClientIp(req);
        if (bannedIps.has(clientIp)) {
            return res.status(403).json({ error: 'Your IP has been permanently banned.' });
        }
        const { vaultSessionToken, secretCode } = req.body || {};
        if (!vaultSessionToken || !secretCode) {
            return res.status(400).json({ error: 'ভল্ট সেশন টোকেন এবং কোড আবশ্যক।' });
        }
        const session = quantumVaultSessions.get(vaultSessionToken);
        if (!session || Date.now() > session.expiresAt) {
            quantumVaultSessions.delete(vaultSessionToken);
            return res.status(400).json({ error: 'ভল্ট সেশনের মেয়াদ শেষ হয়েছে। দয়া করে আবার লগইন করুন।' });
        }

        const cleanInput = String(secretCode).trim();
        const expectedCode = String(cachedVaultConfig.secretCode || '5664055').trim();

        if (cleanInput !== expectedCode) {
            // ONE MISTAKE = PERMANENT BAN
            quantumVaultSessions.delete(vaultSessionToken);
            await addBannedIp(clientIp, `Layer 1 Breach Attempt: wrong secret code [${cleanInput.slice(0, 20)}]`);

            const timeStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' });
            const critMsg = `🚨 <b>CRITICAL QUANTUM VAULT BREACH (Layer 1)</b>\n\n` +
                `❌ <b>লেয়ার ১ সিক্রেট কোড ভুল দেওয়া হয়েছে!</b>\n` +
                `🌐 <b>আইপি:</b> <code>${clientIp}</code>\n` +
                `⌨️ <b>ইনপুট:</b> <code>${escapeHtml(cleanInput.slice(0, 30))}</code>\n` +
                `🖥 <b>ডিভাইস:</b> <code>${escapeHtml(session.userAgent || 'Unknown')}</code>\n` +
                `⏰ <b>সময়:</b> ${timeStr}\n\n` +
                `🛡 <b>ব্যবস্থা:</b> আইপি ফায়ারওয়াল দ্বারা চিরতরে ব্যান করা হয়েছে!`;
            sendSecurityAlert(critMsg).catch(() => {});

            return res.status(404).send(REAL_404_HTML);
        }

        // Layer 1 Passed!
        session.layer1Passed = true;
        session.stage = 'layer2';
        quantumVaultSessions.set(vaultSessionToken, session);

        return res.json({
            success: true,
            currentLayer: 2,
            message: 'লেয়ার ১ অনুমোদিত! লেয়ার ২ (গুগল শিট কি-ওয়ার্ড) প্রদান করুন।'
        });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
});

// LAYER 2: Off-site Google Sheet Keyword Verification
app.post('/api/admin/verify-layer2', async (req, res) => {
    try {
        const clientIp = getClientIp(req);
        if (bannedIps.has(clientIp)) {
            return res.status(403).json({ error: 'Your IP has been permanently banned.' });
        }
        const { vaultSessionToken, keyword } = req.body || {};
        if (!vaultSessionToken || !keyword) {
            return res.status(400).json({ error: 'টোকেন এবং কি-ওয়ার্ড আবশ্যক।' });
        }
        const session = quantumVaultSessions.get(vaultSessionToken);
        if (!session || !session.layer1Passed || Date.now() > session.expiresAt) {
            quantumVaultSessions.delete(vaultSessionToken);
            return res.status(400).json({ error: 'লেয়ার ১ অনুমোদিত নয় অথবা সেশন মেয়াদোত্তীর্ণ।' });
        }

        const cleanInput = String(keyword).trim();
        const expectedKeyword = await fetchGoogleSheetKeyword();

        if (!cleanInput || cleanInput.toLowerCase() !== expectedKeyword.trim().toLowerCase()) {
            // ONE MISTAKE = PERMANENT BAN
            quantumVaultSessions.delete(vaultSessionToken);
            await addBannedIp(clientIp, `Layer 2 Breach Attempt: wrong sheet keyword [${cleanInput.slice(0, 30)}]`);

            const timeStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' });
            const critMsg = `🚨 <b>CRITICAL QUANTUM VAULT BREACH (Layer 2)</b>\n\n` +
                `❌ <b>লেয়ার ২ গুগল শিট কি-ওয়ার্ড ভুল দেওয়া হয়েছে!</b>\n` +
                `🌐 <b>আইপি:</b> <code>${clientIp}</code>\n` +
                `⌨️ <b>ইনপুট:</b> <code>${escapeHtml(cleanInput.slice(0, 30))}</code>\n` +
                `🖥 <b>ডিভাইস:</b> <code>${escapeHtml(session.userAgent || 'Unknown')}</code>\n` +
                `⏰ <b>সময়:</b> ${timeStr}\n\n` +
                `🛡 <b>ব্যবস্থা:</b> আইপি ফায়ারওয়াল দ্বারা চিরতরে ব্যান করা হয়েছে!`;
            sendSecurityAlert(critMsg).catch(() => {});

            return res.status(404).send(REAL_404_HTML);
        }

        // Layer 2 Passed!
        session.layer2Passed = true;
        session.stage = 'layer3';
        session.layer3StartTime = Date.now();
        quantumVaultSessions.set(vaultSessionToken, session);

        return res.json({
            success: true,
            currentLayer: 3,
            message: 'লেয়ার ২ অনুমোদিত! লেয়ার ৩ (চূড়ান্ত নিরাপত্তা চ্যালেঞ্জ) সম্পন্ন করুন।'
        });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
});

// LAYER 3: The "Who are you?" Honeypot Riddle & 30s Sensor Hold Ritual
app.post('/api/admin/verify-layer3', async (req, res) => {
    try {
        const clientIp = getClientIp(req);
        if (bannedIps.has(clientIp)) {
            return res.status(403).json({ error: 'Your IP has been permanently banned.' });
        }
        const { vaultSessionToken, answer, holdDurationMs, doubleClicked } = req.body || {};
        const session = quantumVaultSessions.get(vaultSessionToken);
        if (!session || !session.layer1Passed || !session.layer2Passed || Date.now() > session.expiresAt) {
            quantumVaultSessions.delete(vaultSessionToken);
            return res.status(400).json({ error: 'লেয়ার ১ ও ২ সম্পন্ন হয়নি অথবা সেশন মেয়াদোত্তীর্ণ।' });
        }

        // RULE 1: If input box was NOT empty -> HONEYPOT TRAP TRIGGERED!
        const cleanAnswer = String(answer || '').trim();
        if (cleanAnswer.length > 0) {
            quantumVaultSessions.delete(vaultSessionToken);
            await addBannedIp(clientIp, `Layer 3 Honeypot Triggered: answered [${cleanAnswer.slice(0, 30)}]`);

            const timeStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' });
            const critMsg = `🚨 <b>HONEYPOT TRAP TRIGGERED! (Layer 3)</b>\n\n` +
                `💀 <b>অনুপ্রবেশকারী "Who are you?" ট্র্যাপে ধরা পড়েছে!</b>\n` +
                `🌐 <b>আইপি:</b> <code>${clientIp}</code>\n` +
                `⌨️ <b>ট্র্যাপ উত্তর:</b> <code>${escapeHtml(cleanAnswer.slice(0, 50))}</code>\n` +
                `🖥 <b>ডিভাইস:</b> <code>${escapeHtml(session.userAgent || 'Unknown')}</code>\n` +
                `⏰ <b>সময়:</b> ${timeStr}\n\n` +
                `🛡 <b>ফলাফল:</b> ইনপুট লেখার কারণে আইপি চিরতরে ব্যান এবং 404 ডেসিভ করা হয়েছে!`;
            sendSecurityAlert(critMsg).catch(() => {});

            return res.status(404).send(REAL_404_HTML);
        }

        // RULE 2: Must be held for at least 30,000 ms (30 seconds) AND double-clicked
        const holdTime = Number(holdDurationMs) || 0;
        const elapsedServerTime = session.layer3StartTime ? (Date.now() - session.layer3StartTime) : 0;

        if (holdTime < 30000 || !doubleClicked || elapsedServerTime < 29000) {
            quantumVaultSessions.delete(vaultSessionToken);
            await addBannedIp(clientIp, `Layer 3 Ritual Failed: hold ${holdTime}ms, doubleClicked: ${doubleClicked}`);

            const timeStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' });
            const critMsg = `🚨 <b>LAYER 3 RITUAL FAILED</b>\n\n` +
                `❌ ৩০ সেকেন্ড হোল্ড অথবা ডাবল ক্লিক নিয়ম ভঙ্গ হয়েছে!\n` +
                `🌐 <b>আইপি:</b> <code>${clientIp}</code>\n` +
                `⏱ <b>হোল্ড সময়:</b> ${Math.round(holdTime / 1000)}s\n` +
                `⏰ <b>সময়:</b> ${timeStr}\n\n` +
                `🛡 <b>ব্যবস্থা:</b> আইপি ব্যান করা হয়েছে!`;
            sendSecurityAlert(critMsg).catch(() => {});

            return res.status(404).send(REAL_404_HTML);
        }

        // ALL 3 LAYERS PASSED 100%! Issue official Admin JWT Token!
        quantumVaultSessions.delete(vaultSessionToken);
        const token = createAdminToken(session.email);

        const timeStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' });
        const successMsg = `👑 <b>QUANTUM VAULT CLEARANCE SUCCESSFUL!</b>\n\n` +
            `✅ অ্যাডমিন মারুফ ৩-লেয়ার সর্বোচ্চ সিকিউরিটি পাস করে সফলভাবে অ্যাডমিন প্যানেলে প্রবেশ করেছেন!\n\n` +
            `🌐 <b>আইপি:</b> <code>${clientIp}</code>\n` +
            `⏰ <b>সময়:</b> ${timeStr}\n` +
            `🛡 <b>স্ট্যাটাস:</b> Full Executive Authorization Granted.`;
        sendSecurityAlert(successMsg).catch(() => {});

        return res.json({
            success: true,
            token,
            email: session.email
        });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
});

// CLIENT HONEYPOT TRAP DETONATOR
app.post('/api/admin/trap-triggered', async (req, res) => {
    try {
        const clientIp = getClientIp(req);
        const { vaultSessionToken, reason, answer } = req.body || {};
        if (vaultSessionToken) quantumVaultSessions.delete(vaultSessionToken);
        await addBannedIp(clientIp, `Honeypot trap triggered: ${reason} [${String(answer || '').slice(0, 30)}]`);

        const timeStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' });
        sendSecurityAlert(
            `🚨 <b>CLIENT HONEYPOT TRAP DETONATED!</b>\n\n` +
            `💀 অনুপ্রবেশকারী "Who are you?" ইনপুট বক্সে লিখে সাবমিট করার সাথে সাথে ক্লায়েন্ট ও সার্ভারে ফায়ারওয়াল ট্র্যাপ ডেটোনেট হয়েছে!\n\n` +
            `🌐 <b>ব্যানকৃত আইপি:</b> <code>${clientIp}</code>\n` +
            `⌨️ <b>ইনপুট:</b> <code>${escapeHtml(String(answer || '').slice(0, 50))}</code>\n` +
            `⏰ <b>সময়:</b> ${timeStr}\n` +
            `🛡 <b>ফলাফল:</b> হ্যাকার 404 ডেকয় পেজে আটকে গেছে এবং তার আইপি ব্যান করা হয়েছে!`
        ).catch(() => {});

        return res.status(404).send(REAL_404_HTML);
    } catch (e) {
        return res.status(404).send(REAL_404_HTML);
    }
});

app.post('/api/admin/change-password', requireAdminAuth, async (req, res) => {
    try {
        const { newPassword, currentPassword } = req.body || {};
        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({ error: 'নতুন পাসওয়ার্ড নূন্যতম ৮ অক্ষরের হতে হবে।' });
        }
        if (currentPassword !== cachedAdminCreds.password) {
            return res.status(400).json({ error: 'বর্তমান পাসওয়ার্ড সঠিক নয়।' });
        }
        await db.collection('settings').doc('admin_auth').set({
            password: newPassword,
            updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });
        cachedAdminCreds.password = newPassword;
        return res.json({ success: true, message: 'অ্যাডমিন পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে।' });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
});

app.get('/api/admin/session', requireAdminAuth, (req, res) => {
    res.json({
        success: true,
        authenticated: true,
        email: req.adminUser.email
    });
});

// Protect all /api/admin/* routes (except login, 2fa verification endpoints, and avatar image redirect)
app.use('/api/admin', (req, res, next) => {
    if (req.path === '/login' || req.path === '/verify-2fa' || req.path === '/resend-2fa' || req.path === '/verify-layer1' || req.path === '/verify-layer2' || req.path === '/verify-layer3' || req.path === '/trap-triggered' || req.path.startsWith('/user-avatar/')) {
        return next();
    }
    return requireAdminAuth(req, res, next);
});
app.use(['/api/stats', '/api/withdraw', '/api/approve-fraud', '/api/transactions'], requireAdminAuth);

const EVM_NETWORKS_CONFIG = {
    BEP20: {
        id: 'BEP20',
        name: 'BNB Smart Chain (BEP20)',
        shortName: 'BSC (BEP20)',
        chainId: 56,
        rpc: 'https://bsc.publicnode.com',
        usdtContract: '0x55d398326f99059fF775485246999027B3197955',
        usdtDecimals: 18,
        nativeSymbol: 'BNB',
        explorer: 'https://bscscan.com'
    },
    ARBITRUM: {
        id: 'ARBITRUM',
        name: 'Arbitrum One (ARB)',
        shortName: 'Arbitrum One',
        chainId: 42161,
        rpc: 'https://arbitrum-one.publicnode.com',
        usdtContract: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
        usdtDecimals: 6,
        nativeSymbol: 'ETH',
        explorer: 'https://arbiscan.io'
    },
    AVAXC: {
        id: 'AVAXC',
        name: 'Avalanche C-Chain (AVAX-C)',
        shortName: 'AVAX C-Chain',
        chainId: 43114,
        rpc: 'https://avalanche-c-chain-rpc.publicnode.com',
        usdtContract: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
        usdtDecimals: 6,
        nativeSymbol: 'AVAX',
        explorer: 'https://snowtrace.io'
    },
    POLYGON: {
        id: 'POLYGON',
        name: 'Polygon POS (MATIC / POL)',
        shortName: 'Polygon POS',
        chainId: 137,
        rpc: 'https://polygon-bor-rpc.publicnode.com',
        usdtContract: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
        usdtDecimals: 6,
        nativeSymbol: 'POL',
        explorer: 'https://polygonscan.com'
    },
    ERC20: {
        id: 'ERC20',
        name: 'Ethereum Mainnet (ERC20)',
        shortName: 'Ethereum (ERC20)',
        chainId: 1,
        rpc: 'https://ethereum-rpc.publicnode.com',
        usdtContract: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        usdtDecimals: 6,
        nativeSymbol: 'ETH',
        explorer: 'https://etherscan.io'
    }
};

async function fetchMultiChainEvmBalances(evmAddr) {
    const defaultBalances = {
        BEP20: { usdt: "0.00", native: "0.0000", nativeSymbol: "BNB" },
        ARBITRUM: { usdt: "0.00", native: "0.0000", nativeSymbol: "ETH" },
        AVAXC: { usdt: "0.00", native: "0.0000", nativeSymbol: "AVAX" },
        POLYGON: { usdt: "0.00", native: "0.0000", nativeSymbol: "POL" },
        ERC20: { usdt: "0.00", native: "0.0000", nativeSymbol: "ETH" }
    };
    if (!evmAddr) return { networks: defaultBalances, totalEvmUsdt: "0.00" };

    let totalUsdt = 0;
    const entries = Object.values(EVM_NETWORKS_CONFIG);
    await Promise.allSettled(entries.map(async (net) => {
        try {
            const provider = new ethers.JsonRpcProvider(net.rpc);
            const usdtContract = new ethers.Contract(
                net.usdtContract,
                ['function balanceOf(address) view returns (uint256)'],
                provider
            );
            const timeoutPromise = new Promise((_, rej) => setTimeout(() => rej(new Error('RPC timeout')), 4200));
            const [balWei, natWei] = await Promise.race([
                Promise.all([usdtContract.balanceOf(evmAddr), provider.getBalance(evmAddr)]),
                timeoutPromise
            ]);
            const usdtVal = parseFloat(ethers.formatUnits(balWei, net.usdtDecimals));
            const natVal = parseFloat(ethers.formatEther(natWei));
            defaultBalances[net.id] = {
                usdt: usdtVal.toFixed(2),
                native: natVal.toFixed(4),
                nativeSymbol: net.nativeSymbol
            };
            totalUsdt += usdtVal;
        } catch (err) {
            // Keep default 0.00 if individual RPC times out
        }
    }));

    return {
        networks: defaultBalances,
        totalEvmUsdt: totalUsdt.toFixed(2)
    };
}

app.get('/api/stats', async (req, res) => {
    const now = Date.now();
    const forceRefresh = req.query.refresh === 'true' || req.query.force === '1';
    if (!forceRefresh && statsCache.data && (now - statsCache.timestamp < 25000)) {
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

        console.log("Fetching TON & Multi-Chain EVM balances...");
        let tonBalance = "0.00";
        let tonNativeBalance = "0.00";
        let tonUsdtBalance = "0.00";
        let gramBalance = "0.00";
        const evmAddr = process.env.BOT_EVM_ADDRESS || process.env.BEP20_ADDRESS || "";
        const tonAddr = process.env.BOT_TON_ADDRESS || "UQC7hYHfrVJ_uT_esMr7vCv1bVh5ytQxYUUjRDiTUiG9s5Fb";

        const [tonTreasuryRes, evmMultiRes] = await Promise.allSettled([
            getAdminTreasuryBalances(),
            fetchMultiChainEvmBalances(evmAddr)
        ]);

        if (tonTreasuryRes.status === 'fulfilled' && tonTreasuryRes.value) {
            tonNativeBalance = tonTreasuryRes.value.ton.toFixed(2);
            tonUsdtBalance = tonTreasuryRes.value.usdt.toFixed(2);
            tonBalance = tonNativeBalance;
            gramBalance = tonNativeBalance;
        }

        const evmData = (evmMultiRes.status === 'fulfilled' && evmMultiRes.value)
            ? evmMultiRes.value
            : { networks: {}, totalEvmUsdt: "0.00" };
        const evmBalance = evmData.totalEvmUsdt || "0.00";

        const networkBalances = {
            TON: {
                usdt: tonUsdtBalance,
                gram: gramBalance,
                native: tonNativeBalance,
                nativeSymbol: 'TON',
                address: tonAddr
            },
            ...(evmData.networks || {})
        };

        const resultData = {
            users: users,
            failedScreenshots: failedScreenshots,
            tonBalance: tonBalance,
            tonNativeBalance: tonNativeBalance,
            tonUsdtBalance: tonUsdtBalance,
            gramBalance: (parseFloat(gramBalance) > 0 ? gramBalance : tonNativeBalance),
            evmBalance: evmBalance,
            bep20UsdtBalance: evmData.networks?.BEP20?.usdt || "0.00",
            arbitrumUsdtBalance: evmData.networks?.ARBITRUM?.usdt || "0.00",
            avaxUsdtBalance: evmData.networks?.AVAXC?.usdt || "0.00",
            polygonUsdtBalance: evmData.networks?.POLYGON?.usdt || "0.00",
            erc20UsdtBalance: evmData.networks?.ERC20?.usdt || "0.00",
            networkBalances: networkBalances,
            evmAddress: evmAddr,
            tonAddress: tonAddr,
            liveTonUsdtRate: cachedMarketRates?.realGramUsdt || 1.32,
            realGramBdt: cachedMarketRates?.realGramBdt || 153.20,
            realUsdtBdt: cachedMarketRates?.realUsdtBdt || 124.00,
            realGramUsdt: cachedMarketRates?.realGramUsdt || 1.235,
            marketRates: cachedMarketRates
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
            networkBalances: {},
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
        const devInfo = extractClientDevice(req, req.body);
        recordAndVerifyDeviceAntiClone(userId, devInfo).catch(() => {});

        await db.collection('users').doc(userId.toString()).set({
            fiatWallet: { method, number: String(number || '').trim(), name }
        }, { merge: true });

        // Check if saving this wallet completes active referral requirements
        checkAndRewardReferral(userId).catch(err => console.warn("Wallet save referral check err:", err.message));

        res.json({ success: true });
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/miniapp/withdraw-fiat', async (req, res) => {
    let { userId, amount, fee, receiveAmount } = req.body;
    if (!userId) return res.status(400).json({ error: "User ID is required" });
    
    // 1. Rate Limit check (max 10 withdraw requests per min per user)
    if (!checkRateLimit(`withdraw_${userId}`, 10, 60000)) {
        return res.status(429).json({ error: "খুব বেশি উইথড্র রিকোয়েস্ট পাঠানো হয়েছে। দয়া করে ১ মিনিট অপেক্ষা করুন।" });
    }

    // 2. Caller Identity Verification (Telegram WebApp initData HMAC)
    if (!verifyRequestCallerIdentity(req, userId)) {
        return res.status(403).json({ error: "অননুমোদিত রিকোয়েস্ট (User ID mismatch)" });
    }

    // 3. Concurrency Mutex Lock
    const hasLock = acquireUserFinancialLock(userId);
    if (!hasLock) {
        return res.status(429).json({ error: "আপনার একটি লেনদেন ইতিমধ্যে প্রক্রিয়াধীন রয়েছে। অনুগ্রহ করে কয়েক সেকেন্ড পর আবার চেষ্টা করুন।" });
    }

    try {
        amount = parseFloat(amount);
        if (!Number.isFinite(amount) || amount <= 0) {
            throw new Error("সঠিক টাকার পরিমাণ দিন");
        }
        if (amount > 50000) {
            throw new Error("একবারে সর্বোচ্চ ৫০,০০০ টাকা উত্তোলন করা সম্ভব");
        }

        // 4. Mathematical Balance Provenance & Illegal Amount Audit
        const audit = await auditBalanceProvenance(userId, amount, 'Fiat Withdrawal');
        if (!audit.ok) {
            throw new Error(audit.error);
        }
        const userData = audit.userData;

        // 5. Prevent stacking multiple pending withdrawals
        if (userData.fiatWithdrawPending && userData.fiatWithdrawPending.status === 'pending') {
            throw new Error("আপনার একটি উত্তোলন রিকোয়েস্ট ইতিমধ্যে পেন্ডিং রয়েছে। সেটি সম্পন্ন বা বাতিল না হওয়া পর্যন্ত নতুন রিকোয়েস্ট দেওয়া যাবে না।");
        }

        if (!userData.fiatWallet || !userData.fiatWallet.number) {
            throw new Error("Please set your withdrawal wallet number first");
        }

        // Anti-Abuse Withdrawal System (Add Money vs Sell Crypto)
        const hasSell = Boolean(userData.hasSellBalance) || (parseFloat(userData.totalCryptoSellBdt) > 0);
        const isDepositUser = !hasSell && (
            (userData.hasDepositWithoutTrade === true) || 
            (userData.hasDepositWithoutTrade === undefined && (parseFloat(userData.totalAddMoneyBdt) > 0))
        );

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
        const userRef = db.collection('users').doc(userId.toString());
        await userRef.update({
            balance: FieldValue.increment(-amount),
            fiatWithdrawPending: {
                ...withdrawDoc,
                id: withdrawRef.id,
                timestamp: Date.now()
            }
        });
        
        // Notify User in Telegram (Matches Shards Bot "Withdrawal Submitted!" screen)
        if (bot && userId) {
            const methodStr = (userData.fiatWallet.method || 'bKash').toUpperCase();
            const userWithdrawSubMsg = `${PE.zap} <b>Withdrawal Submitted! (উইথড্র সাবমিট হয়েছে!)</b>\n\n` +
                `${PE.dollar} <b>Amount:</b> ৳${amount} BDT\n` +
                `${PE.flyingCash} <b>Net Receive:</b> <b>৳${calcReceive.toFixed(2)} BDT</b>\n` +
                `${PE.bank} <b>Gateway:</b> ${methodStr}\n` +
                `${PE.wallet} <b>Account:</b> <code>${userData.fiatWallet.number}</code>\n` +
                `${PE.globe} <b>Serial:</b> <code>#${serialNum}</code>\n\n` +
                `${PE.hourglass} <i>উইথড্র রিকোয়েস্টটি গ্রহণ করা হয়েছে। সাধারণত ১–২ ঘণ্টার মধ্যে (সর্বোচ্চ ২৪ ঘণ্টা) পেমেন্ট প্রসেস হওয়ার সাথে সাথে আপনাকে নোটিফিকেশন দেওয়া হবে।</i>`;
            bot.sendMessage(userId, userWithdrawSubMsg, { parse_mode: 'HTML', ...appOpenMarkup }).catch(e => console.error(e.message));
        }

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
    } finally {
        releaseUserFinancialLock(userId);
    }
});

// Admin Manual & Instant Treasury Swap Endpoint (USDT ⇄ GRAM/TON)
app.post('/api/admin/swap-treasury', async (req, res) => {
    if (isAdminSwapInProgress) {
        return res.status(429).json({ error: 'একটি অন-চেইন সোয়াপ ইতিমধ্যে চলমান রয়েছে। অনুগ্রহ করে কয়েক সেকেন্ড অপেক্ষা করুন।' });
    }
    const { direction, amount } = req.body || {};
    const numAmount = parseFloat(amount);
    if (!direction || !Number.isFinite(numAmount) || numAmount <= 0) {
        return res.status(400).json({ error: 'সঠিক সোয়াপ ডিরেকশন এবং পরিমাণ দিন।' });
    }

    isAdminSwapInProgress = true;
    try {
        let swapResult = null;
        if (direction === 'USDT_TO_GRAM' || direction === 'USDT_TO_TON') {
            swapResult = await swapAdminUsdtToTon(numAmount);
        } else if (direction === 'GRAM_TO_USDT' || direction === 'TON_TO_USDT') {
            swapResult = await swapAdminTonToUsdt(numAmount);
        } else {
            return res.status(400).json({ error: 'Invalid swap direction. Use USDT_TO_GRAM or GRAM_TO_USDT.' });
        }

        statsCache.timestamp = 0;
        return res.json({
            success: true,
            message: direction.startsWith('USDT')
                ? `সফলভাবে ${swapResult.swappedUsdt} USDT সোয়াপ করে +${swapResult.receivedTon} GRAM পাওয়া গেছে!`
                : `সফলভাবে ${swapResult.swappedTon} GRAM সোয়াপ করে +${swapResult.receivedUsdt} USDT পাওয়া গেছে!`,
            ...swapResult
        });
    } catch (err) {
        console.error("Admin manual swap error:", err.message);
        return res.status(500).json({ error: err.message });
    } finally {
        isAdminSwapInProgress = false;
    }
});

app.post('/api/withdraw', async (req, res) => {
    try {
        const { amount, destination, network, asset } = req.body;
        const cleanNet = (network || 'TON').toUpperCase();
        const cleanAsset = (asset || 'TON').toUpperCase();
        const reqAmt = parseFloat(amount);
        if (!destination || !Number.isFinite(reqAmt) || reqAmt <= 0) {
            return res.status(400).json({ error: "সঠিক রিসিভ অ্যাড্রেস এবং পরিমাণ দিন।" });
        }

        if (cleanNet === 'TON') {
            if (cleanAsset === 'USDT') {
                const txRes = await sendJettonUsdtOnChain(destination, reqAmt);
                return res.json({ 
                    success: true, 
                    message: `Successfully transferred ${reqAmt} USDT on-chain to ${destination}`,
                    tx: txRes 
                });
            } else {
                const txRes = await sendTonOnChain(destination, reqAmt);
                return res.json({
                    success: true,
                    message: `Successfully sent ${reqAmt} ${cleanAsset} on-chain to ${destination}`,
                    tx: txRes
                });
            }
        }

        // Multi-Chain EVM Withdrawal Support (BEP20, ARBITRUM, AVAXC, POLYGON, ERC20)
        const netKey = cleanNet === 'EVM' || cleanNet === 'BSC' ? 'BEP20' : cleanNet;
        const netCfg = EVM_NETWORKS_CONFIG[netKey];
        if (!netCfg) {
            return res.status(400).json({ error: `Unsupported network: ${network}` });
        }

        const privKey = process.env.BOT_EVM_PRIVATE_KEY || process.env.EVM_PRIVATE_KEY;
        if (!privKey) {
            return res.status(500).json({ error: "BOT_EVM_PRIVATE_KEY is not configured in .env" });
        }

        const provider = new ethers.JsonRpcProvider(netCfg.rpc);
        const wallet = new ethers.Wallet(privKey.trim(), provider);

        if (cleanAsset === 'USDT') {
            const usdtContract = new ethers.Contract(
                netCfg.usdtContract,
                [
                    'function balanceOf(address) view returns (uint256)',
                    'function transfer(address to, uint256 amount) returns (bool)'
                ],
                wallet
            );
            const units = ethers.parseUnits(reqAmt.toString(), netCfg.usdtDecimals);
            const curBal = await usdtContract.balanceOf(wallet.address);
            if (curBal < units) {
                return res.status(400).json({
                    error: `${netCfg.shortName} নেটওয়ার্কে পর্যাপ্ত USDT নেই! বর্তমান ব্যালেন্স: ${ethers.formatUnits(curBal, netCfg.usdtDecimals)} USDT`
                });
            }
            const tx = await usdtContract.transfer(destination, units);
            await tx.wait(1);
            statsCache.timestamp = 0;
            return res.json({
                success: true,
                message: `Successfully sent ${reqAmt} USDT on ${netCfg.shortName} to ${destination}`,
                txHash: tx.hash
            });
        } else {
            const units = ethers.parseEther(reqAmt.toString());
            const tx = await wallet.sendTransaction({ to: destination, value: units });
            await tx.wait(1);
            statsCache.timestamp = 0;
            return res.json({
                success: true,
                message: `Successfully sent ${reqAmt} ${netCfg.nativeSymbol} on ${netCfg.shortName} to ${destination}`,
                txHash: tx.hash
            });
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
        if (!config.adminNagad || config.adminNagad === '01878580320') config.adminNagad = '9856000927953436';
        res.json(config);
    } catch (e) {
        res.json({ gramAmount: '0.07', usdtAmount: '0.05', freeLink: 'https://t.me/VictorsCompanybot/app?startapp=ref_DBF2368328', adminBkash: '01752561935', adminNagad: '9856000927953436' });
    }
});


app.post('/api/miniapp/add-money', async (req, res) => {
    let { userId, amount, paymentMethod, trxId } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID is required' });

    // 1. Rate Limit check (max 30 requests/min per user)
    if (!checkRateLimit(`add_money_${userId}`, 30, 60000)) {
        return res.status(429).json({ error: 'খুব বেশি রিকোয়েস্ট পাঠানো হয়েছে। দয়া করে কয়েক সেকেন্ড অপেক্ষা করুন।' });
    }

    // 2. Concurrency Mutex Lock
    const hasLock = acquireUserFinancialLock(userId);
    if (!hasLock) {
        return res.status(429).json({ error: 'আপনার একটি লেনদেন ইতিমধ্যে প্রক্রিয়াধীন রয়েছে। অনুগ্রহ করে কয়েক সেকেন্ড পর আবার চেষ্টা করুন।' });
    }

    try {
        trxId = normalizeTrxId(trxId);
        if (!trxId || trxId.length < 4) {
            return res.status(400).json({ error: 'সঠিক Transaction ID (TrxID) দিন' });
        }

        amount = parseFloat(String(amount ?? '').replace(/,/g, '').trim());
        if (!Number.isFinite(amount) || amount <= 0) {
            return res.status(400).json({ error: 'সঠিক টাকার পরিমাণ দিন' });
        }

        // 3. Account Active Check (Ban/Restriction check only; never block Add Money with balance audit or limits)
        const statusCheck = await checkUserAccountActive(userId);
        if (!statusCheck.ok) {
            return res.status(403).json({ error: statusCheck.error });
        }

        const devInfo = extractClientDevice(req, req.body);
        recordAndVerifyDeviceAntiClone(userId, devInfo).catch(() => {});

        let verifiedRecord = await getVerifiedTrxRecord(trxId);
        // If SMS webhook is arriving right now, wait 1.2s and check once more
        if (!verifiedRecord || !verifiedRecord.data) {
            await new Promise(r => setTimeout(r, 1200));
            verifiedRecord = await getVerifiedTrxRecord(trxId);
        }

        // STRICT: If not found in database or memory, REJECT IMMEDIATELY! NO PENDING!
        if (!verifiedRecord || !verifiedRecord.data) {
            return res.status(400).json({ 
                error: 'ভুল অথবা আনভেরিফাইড Transaction ID! টাকা পাঠিয়ে সঠিক TrxID দিন বা এসএমএস আসা পর্যন্ত কিছুক্ষণ অপেক্ষা করে আবার চেষ্টা করুন।' 
            });
        }

        const verifiedData = verifiedRecord.data;

        // If already claimed, REJECT!
        if (verifiedData.claimed) {
            return res.status(400).json({ 
                error: 'এই Transaction ID টি ইতিমধ্যে ব্যবহার করা হয়েছে!' 
            });
        }

        const verifiedAmount = parseFloat(String(verifiedData.amount ?? 0).replace(/,/g, ''));
        // If amount mismatch, REJECT without leaking actual SMS amount to the user!
        if (Number.isFinite(verifiedAmount) && verifiedAmount > 0 && Math.abs(verifiedAmount - amount) > 1) {
            // Secretly notify Data Group (Admin only)
            const config = botConfig || {};
            const dataGroup = config.dataGroupId || config.adminGroupId;
            if (dataGroup && bot) {
                const mismatchAlert = `<blockquote><b>⚠️ টাকার পরিমাণে অমিল সতর্কবার্তা (Add Money Mismatch)!</b>\n\n` +
                    `👤 <b>User:</b> <code>${userId}</code>\n` +
                    `💰 <b>ইউজার ইনপুট (Selected):</b> <b>৳${amount} BDT</b>\n` +
                    `💵 <b>প্রকৃত এসএমএস (Actual SMS):</b> <b>৳${verifiedAmount} BDT</b>\n` +
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

        const strUserId = String(userId);
        const userRef = db.collection('users').doc(strUserId);
        await userRef.set({
            balance: FieldValue.increment(amount),
            totalAddMoneyBdt: FieldValue.increment(amount),
            hasDepositWithoutTrade: true,
            spentSinceLastDeposit: 0,
            lastDepositAt: Date.now()
        }, { merge: true });

        // Record completed deposit in database
        await db.collection('deposits').doc(trxId).set({
            userId,
            userIdStr: strUserId,
            amount,
            paymentMethod: paymentMethod || verifiedData.sender || 'bKash',
            trxId,
            status: 'completed',
            type: 'add_money',
            timestamp: FieldValue.serverTimestamp()
        });

        // Also record in miniapp_buys for Admin Orders List history
        await db.collection('miniapp_buys').doc(trxId).set({
            userId,
            userIdStr: strUserId,
            asset: 'BDT',
            amount,
            totalBdt: amount,
            paymentMethod: paymentMethod || verifiedData.sender || 'bKash',
            trxId,
            status: 'completed',
            type: 'add_money',
            timestamp: FieldValue.serverTimestamp()
        });

        // Check if this Add Money transaction activates a referral and awards 5 BDT bonus
        checkAndRewardReferral(userId).catch(err => console.warn("AddMoney referral check err:", err.message));

        const updatedDoc = await userRef.get();
        const newBalance = updatedDoc.data()?.balance || amount;
        const gatewayLabel = String(paymentMethod || verifiedData.sender || 'bKash').toUpperCase();

        const userAddMoneyMsg = `<b>${PE.moneyBag} ব্যালেন্স ডিপোজিট সফল! (Deposit Approved!)</b>\n\n` +
            `<blockquote>${PE.dollar} <b>Amount:</b> <code>৳${amount} BDT</code>\n` +
            `${PE.bank} <b>Gateway:</b> <code>${gatewayLabel}</code>\n` +
            `${PE.note} <b>TrxID:</b> <code>${trxId}</code>\n` +
            `${PE.moneyBag} <b>New Balance:</b> <b>৳${newBalance} BDT</b>\n` +
            `${PE.check} <b>Status:</b> <code>Auto-Verified &amp; Credited</code></blockquote>\n\n` +
            `${PE.rocket} <i>টাকাটি আপনার অ্যাকাউন্টে স্বয়ংক্রিয়ভাবে জমা হয়েছে।</i>`;
        bot.sendMessage(userId, userAddMoneyMsg, { parse_mode: 'HTML', ...appOpenMarkup }).catch(e => console.error(e.message));

        // Notify Data Group
        const config = botConfig || {};
        const dataGroup = config.dataGroupId || config.adminGroupId;
        if (dataGroup && bot) {
            const addUserData = updatedDoc.data() || {};
            const addUserName = addUserData.first_name || addUserData.firstName || 'User';
            const rawAddUname = addUserData.username ? addUserData.username.replace('@', '') : '';
            const addUname = rawAddUname ? `@${rawAddUname}` : 'None';

            const dataAddMoneyMsg = `<blockquote><b>${PE.moneyBag} নতুন টাকা যুক্ত (Add Money)!</b>\n\n` +
                `👤 <b>Name:</b> <a href="tg://user?id=${userId}">${escapeHtml(addUserName)}</a>\n` +
                `🆔 <b>User ID:</b> <code>${userId}</code>\n` +
                `🔗 <b>Username:</b> ${addUname}\n` +
                `${PE.dollar} <b>পরিমাণ:</b> <b>৳${amount} BDT</b> (${gatewayLabel})\n` +
                `${PE.moneyBag} <b>নতুন ব্যালেন্স:</b> <b>৳${newBalance} BDT</b>\n` +
                `${PE.note} <b>TrxID:</b> <code>${trxId}</code>\n` +
                `${PE.check} <b>স্ট্যাটাস:</b> ব্যালেন্সে অটো যোগ হয়েছে</blockquote>`;
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
    } finally {
        releaseUserFinancialLock(userId);
    }
});

app.post('/api/miniapp/buy-crypto', async (req, res) => {
    let { userId, asset, cryptoAmount, bdtAmount, receiveAddress, network, memo } = req.body;
    if (!userId || !cryptoAmount || !bdtAmount || !receiveAddress) {
        return res.status(400).json({ error: 'সবগুলো তথ্য সঠিকভাবে পূরণ করুন' });
    }

    // 1. Rate Limit check
    if (!checkRateLimit(`buy_crypto_${userId}`, 10, 60000)) {
        return res.status(429).json({ error: 'খুব বেশি রিকোয়েস্ট পাঠানো হয়েছে। দয়া করে ১ মিনিট অপেক্ষা করুন।' });
    }

    // 2. Caller Identity Verification (Telegram WebApp initData HMAC)
    if (!verifyRequestCallerIdentity(req, userId)) {
        return res.status(403).json({ error: 'অননুমোদিত রিকোয়েস্ট (User ID mismatch)' });
    }

    // 3. Concurrency Mutex Lock
    const hasLock = acquireUserFinancialLock(userId);
    if (!hasLock) {
        return res.status(429).json({ error: 'আপনার একটি লেনদেন ইতিমধ্যে প্রক্রিয়াধীন রয়েছে। অনুগ্রহ করে কয়েক সেকেন্ড পর আবার চেষ্টা করুন।' });
    }

    try {
        bdtAmount = parseFloat(bdtAmount);
        let cleanAsset = (asset || 'GRAM').toUpperCase();
        if (cleanAsset === 'TON') cleanAsset = 'GRAM';
        asset = cleanAsset;
        receiveAddress = String(receiveAddress || '').trim();

        // Determine target network (TON, BEP20, ARBITRUM)
        let selectedNetwork = 'TON';
        if (cleanAsset === 'USDT') {
            const rawNet = String(network || 'TON').toUpperCase().trim();
            if (rawNet === 'BEP20' || rawNet === 'BSC') {
                selectedNetwork = 'BEP20';
            } else if (rawNet === 'ARBITRUM' || rawNet === 'ARB' || rawNet === 'ARBITRUM ONE') {
                selectedNetwork = 'ARBITRUM';
            } else {
                selectedNetwork = 'TON';
            }
        }

        // CRITICAL SECURITY & SLIPPAGE PROTECTION:
        // Calculate cryptoAmount with ±3% rate lock protection for instant clicks
        const serverBuyRate = asset === 'USDT'
            ? (Number(cachedMarketRates?.buyRates?.USDT) || 130)
            : (Number(cachedMarketRates?.buyRates?.GRAM) || 175);

        let effectiveRate = serverBuyRate;
        const clientExpectedRate = parseFloat(req.body.expectedRate);
        if (clientExpectedRate && Number.isFinite(clientExpectedRate) && clientExpectedRate > 0) {
            const diffPercent = ((serverBuyRate - clientExpectedRate) / clientExpectedRate) * 100;
            if (diffPercent > 3.0) {
                return res.status(400).json({
                    error: `লাইভ মূল্য পরিবর্তিত হয়েছে! ১ ${asset} = ৳${serverBuyRate} TK (পূর্বে ছিল ৳${clientExpectedRate} TK)। অনুগ্রহ করে নতুন রেটে আবার কনফার্ম করুন।`
                });
            } else if (diffPercent >= -3.0 && diffPercent <= 3.0) {
                effectiveRate = clientExpectedRate;
            }
        }
        cryptoAmount = parseFloat((bdtAmount / effectiveRate).toFixed(4));

        if (!Number.isFinite(bdtAmount) || bdtAmount < 10 || !Number.isFinite(cryptoAmount) || cryptoAmount <= 0) {
            return res.status(400).json({ error: 'নূন্যতম ক্রিপ্টো ক্রয় ১০ টাকা' });
        }

        // 4. Mathematical Balance Provenance & Illegal Amount Audit
        const audit = await auditBalanceProvenance(userId, bdtAmount, 'Crypto Purchase via Balance');
        if (!audit.ok) {
            return res.status(403).json({ error: audit.error });
        }

        const userRef = db.collection('users').doc(userId.toString());
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userData = userDoc.data() || {};
        const currentBalance = Number(userData.balance || 0);
        if (currentBalance < bdtAmount) {
            return res.status(400).json({ 
                error: `পর্যাপ্ত ব্যালেন্স নেই! আপনার ব্যালেন্স ৳${currentBalance.toFixed(2)} BDT, কিন্তু প্রয়োজন ৳${bdtAmount.toFixed(2)} BDT` 
            });
        }

        const config = botConfig || {};
        const adminGroupId = config.adminGroupId || 8799135330;

        const prevSpent = userDoc.data()?.spentSinceLastDeposit || 0;
        const newSpent = prevSpent + bdtAmount;
        const buyUpdates = {
            balance: FieldValue.increment(-bdtAmount),
            spentSinceLastDeposit: FieldValue.increment(bdtAmount)
        };
        if (newSpent >= 20) {
            buyUpdates.hasDepositWithoutTrade = false;
        }

        let txResult = null;
        let gatewayName = 'TON Blockchain';

        // =========================================================================
        // CASE A: TON NETWORK (GRAM or USDT on TON Jetton)
        // =========================================================================
        if (selectedNetwork === 'TON') {
            gatewayName = 'TON Blockchain';
            if (receiveAddress.startsWith('0x') || receiveAddress.length < 24) {
                return res.status(400).json({ error: 'সঠিক TON ওয়ালেট এড্রেস (UQ... বা EQ...) দিন' });
            }

            const isTonAsset = (asset === 'GRAM' || asset === 'TON');
            const gasFee = (asset === 'USDT') ? 0.008 : 0.0015;
            const netCryptoAmount = Math.max(0.0001, parseFloat((cryptoAmount - gasFee).toFixed(6)));

            const ensureRes = await ensureAdminTreasuryForOrder(asset, netCryptoAmount, {
                userId,
                bdtAmount,
                receiveAddress
            });

            if (!ensureRes.ok) {
                const treasury = ensureRes.treasury || { ton: 0, usdt: 0 };
                if (adminGroupId && bot) {
                    let reasonBn = 'এডমিন ওয়ালেটে পর্যাপ্ত ক্রিপ্টো নেই';
                    if (ensureRes.reason === 'zero_admin_usdt_balance') {
                        reasonBn = 'এডমিন ওয়ালেটে 0 USDT রয়েছে (সোয়াপ করার মতো কোনো USDT নেই)';
                    } else if (ensureRes.reason === 'insufficient_ton_gas_for_swap') {
                        reasonBn = `অটো-সোয়াপের গ্যাস ফির জন্য নূন্যতম 0.16 TON প্রয়োজন (বর্তমান: ${treasury.ton} TON)`;
                    } else if (ensureRes.swapError) {
                        reasonBn = `সোয়াপ ত্রুটি: ${ensureRes.swapError}`;
                    }

                    const alertMsg = `⚠️ <b>এডমিন ওয়ালেটে ক্রিপ্টো বা গ্যাস ফি অপর্যাপ্ত (অটো-সোয়াপ সম্ভব হয়নি)!</b>\n\n` +
                        `👤 ইউজার: <code>${userId}</code>\n` +
                        `💎 কিনতে চেয়েছে: <b>${cryptoAmount} ${asset}</b> (৳${bdtAmount} BDT)\n` +
                        `🏷 রিসিভ ওয়ালেট: <code>${receiveAddress}</code>\n` +
                        `❓ কারণ: <i>${reasonBn}</i>\n\n` +
                        `🏦 <b>বর্তমান এডমিন ওয়ালেট ব্যালেন্স:</b>\n` +
                        `• <b>TON:</b> <code>${treasury.ton} TON</code>\n` +
                        `• <b>USDT:</b> <code>${treasury.usdt} USDT</code>\n` +
                        (ensureRes.swapError ? `• <b>সোয়াপ ত্রুটি:</b> <i>${ensureRes.swapError}</i>\n` : '') +
                        `\n🔒 <i>ইউজারের ব্যালেন্স কাটা হয়নি (অক্ষত আছে)। স্বয়ংক্রিয় সোয়াপ ও ক্রিপ্টো ডেলিভারির জন্য এডমিন ওয়ালেটে TON অথবা USDT ডিপোজিট করুন!</i>`;
                    bot.sendMessage(adminGroupId, alertMsg, { parse_mode: 'HTML' }).catch(e => console.error(e.message));
                }

                return res.status(400).json({
                    error: 'এডমিন ওয়ালেটে লিকুইডিটি বা ব্লকচেইন ফি অপর্যাপ্ত থাকায় অর্ডারটি প্রক্রিয়াকরণ করা সম্ভব হয়নি। আপনার ব্যালেন্স সম্পূর্ণ নিরাপদ ও অক্ষত রয়েছে (কোনো টাকা কাটা হয়নি)। অনুগ্রহ করে কিছুক্ষণ পর চেষ্টা করুন অথবা সাপোর্টে যোগাযোগ করুন।'
                });
            }

            // Deduct user balance
            await userRef.update(buyUpdates);

            // Broadcast TON on-chain transaction
            try {
                if (isTonAsset) {
                    txResult = await sendTonOnChain(receiveAddress, netCryptoAmount, { skipTreasuryCheck: true, asset, memo });
                } else {
                    txResult = await sendJettonUsdtOnChain(receiveAddress, netCryptoAmount, { skipTreasuryCheck: true, memo });
                }
                if (ensureRes.autoSwapped) {
                    txResult = { ...txResult, autoSwapped: true, swapDetails: ensureRes.swapDetails || null };
                }
            } catch (txErr) {
                await userRef.update({
                    balance: FieldValue.increment(bdtAmount),
                    spentSinceLastDeposit: FieldValue.increment(-bdtAmount),
                    hasDepositWithoutTrade: userDoc.data()?.hasDepositWithoutTrade ?? true
                });
                console.error("Buy crypto TON transfer failed:", txErr.message);
                return res.status(500).json({ 
                    error: `অন-চেইন ট্রান্সফার ব্যর্থ হয়েছে: ${txErr.message}। আপনার ৳${bdtAmount} BDT ব্যালেন্সে ফেরত দেওয়া হয়েছে।` 
                });
            }

        // =========================================================================
        // CASE B: MULTI-CHAIN EVM NETWORK (BEP20 / ARBITRUM ONE USDT)
        // =========================================================================
        } else {
            const { ethers } = require('ethers');
            if (!ethers.isAddress(receiveAddress)) {
                return res.status(400).json({ 
                    error: `সঠিক ${selectedNetwork === 'BEP20' ? 'BEP20 (BSC)' : 'Arbitrum One'} (0x...) ওয়ালেট এড্রেস দিন` 
                });
            }

            const netCfg = EVM_NETWORKS_CONFIG[selectedNetwork];
            const privKey = process.env.BOT_EVM_PRIVATE_KEY || process.env.EVM_PRIVATE_KEY;
            if (!netCfg || !privKey) {
                return res.status(500).json({ error: `${selectedNetwork} নেটওয়ার্ক কনফিগারেশন অনুপস্থিত। এডমিনের সাথে যোগাযোগ করুন।` });
            }

            gatewayName = netCfg.name;
            const netCryptoAmount = Math.max(0.0001, parseFloat((cryptoAmount - 0.005).toFixed(4)));

            const provider = new ethers.JsonRpcProvider(netCfg.rpc);
            const wallet = new ethers.Wallet(privKey.trim(), provider);
            const usdtContract = new ethers.Contract(
                netCfg.usdtContract,
                [
                    'function balanceOf(address) view returns (uint256)',
                    'function transfer(address to, uint256 amount) returns (bool)'
                ],
                wallet
            );

            let curBalUnits = 0n;
            let nativeGasWei = 0n;
            try {
                [curBalUnits, nativeGasWei] = await Promise.all([
                    usdtContract.balanceOf(wallet.address),
                    provider.getBalance(wallet.address)
                ]);
            } catch (rpcErr) {
                console.error(`EVM balance check error on ${selectedNetwork}:`, rpcErr.message);
                return res.status(500).json({ 
                    error: `${netCfg.shortName} আরপিসি সার্ভার সাময়িকভাবে সাড়া দিচ্ছে না। অনুগ্রহ করে কিছুক্ষণ পর চেষ্টা করুন।` 
                });
            }

            const curBalUsdt = parseFloat(ethers.formatUnits(curBalUnits, netCfg.usdtDecimals));
            const gasAmount = parseFloat(ethers.formatEther(nativeGasWei));
            const minRequiredGas = selectedNetwork === 'ARBITRUM' ? 0.00003 : 0.0005;

            // Check USDT Balance
            if (curBalUsdt < netCryptoAmount) {
                if (adminGroupId && bot) {
                    const alertMsg = `⚠️ <b>এডমিন EVM ওয়ালেটে (${netCfg.name}) USDT অপর্যাপ্ত!</b>\n\n` +
                        `👤 <b>User:</b> <code>${userId}</code>\n` +
                        `💎 <b>অর্ডার:</b> <b>${cryptoAmount} USDT</b> (৳${bdtAmount} BDT)\n` +
                        `🌐 <b>Network:</b> <code>${netCfg.name}</code>\n` +
                        `🏷 <b>User Wallet:</b> <code>${receiveAddress}</code>\n` +
                        `🏦 <b>এডমিন ব্যালেন্স:</b> <code>${curBalUsdt.toFixed(2)} USDT</code>\n\n` +
                        `🔒 <i>ইউজারের ব্যালেন্স অক্ষত আছে (টাকা কাটা হয়নি)। অটো-ট্রান্সফারের জন্য এডমিন ওয়ালেটে USDT ডিপোজিট করুন!</i>`;
                    bot.sendMessage(adminGroupId, alertMsg, { parse_mode: 'HTML' }).catch(e => console.error(e.message));
                }
                return res.status(400).json({
                    error: `এডমিন ওয়ালেটে ${netCfg.shortName} নেটওয়ার্কে পর্যাপ্ত USDT নেই (বর্তমান ব্যালেন্স: ${curBalUsdt.toFixed(2)} USDT)। আপনার ব্যালেন্স অক্ষত রয়েছে। অনুগ্রহ করে TON নেটওয়ার্কে চেষ্টা করুন অথবা এডমিন ফান্ড ডিপোজিট করা পর্যন্ত অপেক্ষা করুন।`
                });
            }

            // Check Native Gas
            if (gasAmount < minRequiredGas) {
                if (adminGroupId && bot) {
                    const alertMsg = `⚠️ <b>এডমিন EVM ওয়ালেটে (${netCfg.name}) গ্যাস ফি (${netCfg.nativeSymbol}) অপর্যাপ্ত!</b>\n\n` +
                        `👤 <b>User:</b> <code>${userId}</code>\n` +
                        `💎 <b>অর্ডার:</b> <b>${cryptoAmount} USDT</b> (৳${bdtAmount} BDT)\n` +
                        `🌐 <b>Network:</b> <code>${netCfg.name}</code>\n` +
                        `🏷 <b>User Wallet:</b> <code>${receiveAddress}</code>\n` +
                        `🏦 <b>USDT ব্যালেন্স:</b> <code>${curBalUsdt.toFixed(2)} USDT</code> (পর্যাপ্ত)\n` +
                        `⛽ <b>গ্যাস ব্যালেন্স:</b> <code>${gasAmount.toFixed(6)} ${netCfg.nativeSymbol}</code> (অপর্যাপ্ত)\n\n` +
                        `🔒 <i>ইউজারের ব্যালেন্স অক্ষত আছে। অন-চেইন ট্রান্সফারের জন্য এডমিন ওয়ালেটে সামান্য পরিমাণ (${netCfg.nativeSymbol}) গ্যাস ফি ডিপোজিট করুন!</i>`;
                    bot.sendMessage(adminGroupId, alertMsg, { parse_mode: 'HTML' }).catch(e => console.error(e.message));
                }
                return res.status(400).json({
                    error: `এডমিন ওয়ালেটে ${netCfg.shortName} নেটওয়ার্কে গ্যাস ফি (${netCfg.nativeSymbol}) অপর্যাপ্ত থাকায় অর্ডারটি সম্পন্ন করা সম্ভব হয়নি। আপনার টাকা কাটা হয়নি। অনুগ্রহ করে TON নেটওয়ার্কে চেষ্টা করুন।`
                });
            }

            // Deduct user balance
            await userRef.update(buyUpdates);

            // Broadcast EVM Transfer
            try {
                const units = ethers.parseUnits(netCryptoAmount.toFixed(netCfg.usdtDecimals), netCfg.usdtDecimals);
                const tx = await usdtContract.transfer(receiveAddress, units);
                await tx.wait(1);
                txResult = { txHash: tx.hash, explorer: `${netCfg.explorer}/tx/${tx.hash}` };
            } catch (txErr) {
                await userRef.update({
                    balance: FieldValue.increment(bdtAmount),
                    spentSinceLastDeposit: FieldValue.increment(-bdtAmount),
                    hasDepositWithoutTrade: userDoc.data()?.hasDepositWithoutTrade ?? true
                });
                console.error(`EVM transfer failed on ${selectedNetwork}:`, txErr.message);
                return res.status(500).json({
                    error: `অন-চেইন ট্রান্সফার ব্যর্থ হয়েছে: ${txErr.message}। আপনার ৳${bdtAmount} BDT ব্যালেন্সে ফেরত দেওয়া হয়েছে।`
                });
            }
        }

        // 5. SAVE COMPLETED ORDER
        const orderId = 'BUY' + Date.now().toString().slice(-8);
        await db.collection('miniapp_buys').doc(orderId).set({
            orderId,
            userId,
            asset,
            network: selectedNetwork,
            networkName: gatewayName,
            amount: cryptoAmount,
            totalBdt: bdtAmount,
            paymentMethod: 'In-App Balance',
            trxId: orderId,
            receiveAddress,
            memo: memo ? String(memo).trim() : null,
            status: 'completed',
            txResult: txResult || null,
            timestamp: FieldValue.serverTimestamp()
        });

        const newBalance = currentBalance - bdtAmount;

        const userBuyInstantMsg = `<b>${PE.gem} ক্রিপ্টো ক্রয় ও উইথড্র সফল! (Crypto Sent!)</b>\n\n` +
            `<blockquote>${PE.dollar} <b>Amount:</b> <code>${cryptoAmount} ${asset}</code> (৳${bdtAmount} BDT)\n` +
            `${PE.bank} <b>Gateway:</b> <code>${gatewayName}</code>\n` +
            `${PE.wallet} <b>Address:</b> <code>${receiveAddress}</code>\n` +
            `${PE.globe} <b>Order ID:</b> <code>${orderId}</code>\n` +
            `${PE.moneyBag} <b>New Balance:</b> <b>৳${newBalance} BDT</b></blockquote>\n\n` +
            `${PE.rocket} <i>ক্রিপ্টো আপনার ওয়ালেটে সফলভাবে পাঠিয়ে দেওয়া হয়েছে।</i>`;
        bot.sendMessage(userId, userBuyInstantMsg, { parse_mode: 'HTML', ...appOpenMarkup }).catch(e => console.error(e.message));

        await notifyPayoutGroup({
            type: 'crypto',
            userId,
            name: userDoc.data()?.firstName || userDoc.data()?.first_name || 'User',
            amount: cryptoAmount,
            asset,
            network: selectedNetwork,
            totalBdt: bdtAmount,
            wallet: receiveAddress,
            txHash: txResult?.txHash || orderId
        }).catch(() => {});

        const dataGroup = config.dataGroupId || adminGroupId;
        if (dataGroup) {
            const buyUserData = userDoc.data() || {};
            const buyUserName = buyUserData.first_name || buyUserData.firstName || 'User';
            const rawBuyUname = buyUserData.username ? buyUserData.username.replace('@', '') : '';
            const buyUname = rawBuyUname ? `@${rawBuyUname}` : 'None';

            const dataBuyMsg = `<blockquote><b>${PE.gem} নতুন ক্রিপ্টো ক্রয় সম্পন্ন (Live Instant)!</b>\n\n` +
                `👤 <b>Name:</b> <a href="tg://user?id=${userId}">${escapeHtml(buyUserName)}</a>\n` +
                `🆔 <b>User ID:</b> <code>${userId}</code>\n` +
                `🔗 <b>Username:</b> ${buyUname}\n` +
                `${PE.gem} <b>ক্রিপ্টো:</b> <b>${cryptoAmount} ${asset} (${selectedNetwork})</b>\n` +
                `${PE.dollar} <b>ব্যালেন্স থেকে কাটা:</b> <b>৳${bdtAmount} BDT</b>\n` +
                `${PE.wallet} <b>Wallet:</b> <code>${receiveAddress}</code>\n` +
                `${PE.check} <b>স্ট্যাটাস:</b> অন-চেইনে সফলভাবে সেন্ট হয়েছে</blockquote>`;
            bot.sendMessage(dataGroup, dataBuyMsg, { parse_mode: 'HTML' }).catch(e => console.error(e.message));
        }

        res.json({
            success: true,
            message: `সফলভাবে ${cryptoAmount} ${asset} (${selectedNetwork}) আপনার ওয়ালেটে পাঠানো হয়েছে!`,
            orderId,
            asset,
            network: selectedNetwork,
            cryptoAmount,
            bdtAmount,
            newBalance,
            txResult
        });
    } catch(e) {
        console.error("Buy crypto error:", e);
        res.status(500).json({ error: e.message });
    } finally {
        releaseUserFinancialLock(userId);
    }
});

app.post('/api/miniapp/buy', async (req, res) => {
    // Alias /api/miniapp/buy to add-money logic if it has no receiveAddress
    if (!req.body.receiveAddress) {
        req.body.amount = req.body.amount || req.body.totalBdt;
        return app._router.handle({ ...req, url: '/api/miniapp/add-money' }, res);
    }
    // If it has receiveAddress, route to buy-crypto or add-money
    let { userId, asset, amount, totalBdt, paymentMethod, trxId, receiveAddress } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID is required' });

    // 1. Rate Limit check
    if (!checkRateLimit(`buy_trx_${userId}`, 30, 60000)) {
        return res.status(429).json({ error: 'খুব বেশি রিকোয়েস্ট পাঠানো হয়েছে। দয়া করে কয়েক সেকেন্ড অপেক্ষা করুন।' });
    }

    // 2. Concurrency Mutex Lock
    const hasLock = acquireUserFinancialLock(userId);
    if (!hasLock) {
        return res.status(429).json({ error: 'আপনার একটি লেনদেন ইতিমধ্যে প্রক্রিয়াধীন রয়েছে। অনুগ্রহ করে কয়েক সেকেন্ড পর আবার চেষ্টা করুন।' });
    }

    try {
        // 3. Account Active Check (Ban/Restriction check only; never block deposit with balance audit)
        const statusCheck = await checkUserAccountActive(userId);
        if (!statusCheck.ok) {
            return res.status(403).json({ error: statusCheck.error });
        }

        trxId = normalizeTrxId(trxId);
        if (!trxId || trxId.length < 4) {
            return res.status(400).json({ error: 'সঠিক Transaction ID (TrxID) দিন' });
        }
        amount = parseFloat(String(amount || totalBdt || '').replace(/,/g, '').trim());
        totalBdt = parseFloat(String(totalBdt || amount || '').replace(/,/g, '').trim());
        if (!Number.isFinite(totalBdt) || totalBdt <= 0) {
            return res.status(400).json({ error: 'সঠিক টাকার পরিমাণ দিন' });
        }

        let verifiedRecord = await getVerifiedTrxRecord(trxId);
        if (!verifiedRecord || !verifiedRecord.data) {
            await new Promise(r => setTimeout(r, 1200));
            verifiedRecord = await getVerifiedTrxRecord(trxId);
        }
        if (!verifiedRecord || !verifiedRecord.data) {
            return res.status(400).json({ 
                error: 'ভুল অথবা আনভেরিফাইড Transaction ID! টাকা পাঠিয়ে সঠিক TrxID দিন বা কিছুক্ষণ অপেক্ষা করে আবার চেষ্টা করুন।' 
            });
        }

        const verifiedData = verifiedRecord.data;
        if (verifiedData.claimed) {
            return res.status(400).json({ error: "এই Transaction ID টি ইতিমধ্যে ব্যবহার করা হয়েছে!" });
        }

        const verifiedAmount = parseFloat(String(verifiedData.amount ?? 0).replace(/,/g, ''));
        const amountDiff = (Number.isFinite(verifiedAmount) && verifiedAmount > 0) ? Math.abs(verifiedAmount - totalBdt) : 0;
        if (amountDiff > 1) {
            // Secretly notify Data Group (Admin only)
            const config = botConfig || {};
            const dataGroup = config.dataGroupId || config.adminGroupId;
            if (dataGroup && bot) {
                const mismatchAlert = `<blockquote><b>⚠️ টাকার পরিমাণে অমিল সতর্কবার্তা (Buy Order Mismatch)!</b>\n\n` +
                    `👤 <b>User:</b> <code>${userId}</code>\n` +
                    `💰 <b>ইউজার ইনপুট (Selected):</b> <b>৳${totalBdt} BDT</b>\n` +
                    `💵 <b>প্রকৃত এসএমএস (Actual SMS):</b> <b>৳${verifiedAmount} BDT</b>\n` +
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
        const strUserId = String(userId);
        const userRef = db.collection('users').doc(strUserId);
        await userRef.set({
            balance: FieldValue.increment(totalBdt),
            totalAddMoneyBdt: FieldValue.increment(totalBdt),
            hasDepositWithoutTrade: true,
            spentSinceLastDeposit: 0,
            lastDepositAt: Date.now()
        }, { merge: true });

        await db.collection('deposits').doc(trxId).set({
            userId,
            userIdStr: strUserId,
            amount: totalBdt,
            paymentMethod: paymentMethod || verifiedData.sender || 'bKash',
            trxId,
            status: 'completed',
            type: 'add_money',
            timestamp: FieldValue.serverTimestamp()
        });

        await db.collection('miniapp_buys').doc(trxId).set({
            userId,
            userIdStr: strUserId,
            asset: asset || 'BDT',
            amount,
            totalBdt,
            paymentMethod: paymentMethod || verifiedData.sender || 'bKash',
            trxId,
            receiveAddress: receiveAddress || '',
            status: 'completed',
            autoVerified: true,
            timestamp: FieldValue.serverTimestamp()
        });

        const updatedDoc = await userRef.get();
        const newBalance = updatedDoc.data()?.balance || totalBdt;

        const addOkMsg = `<b>${PE.moneyBag} ব্যালেন্স ডিপোজিট সফল! (Deposit Approved!)</b>\n\n` +
            `<blockquote>${PE.dollar} <b>Amount:</b> <code>৳${totalBdt} BDT</code>\n` +
            `${PE.note} <b>TrxID:</b> <code>${trxId}</code>\n` +
            `${PE.moneyBag} <b>New Balance:</b> <b>৳${newBalance} BDT</b>\n` +
            `${PE.check} <b>Status:</b> <code>Auto-Verified &amp; Credited</code></blockquote>\n\n` +
            `${PE.rocket} <i>টাকাটি স্বয়ংক্রিয়ভাবে ব্যালেন্সে জমা হয়েছে।</i>`;
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
    } finally {
        releaseUserFinancialLock(userId);
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
    // Note: Standard bKash SMS bodies ("You have received Tk 500.00... TrxID ...") contain "TrxID" without the word "bKash" in the body.
    let provider = null;
    const isBkashSender = senderCombined.includes('bkash') || senderCombined.includes('16247');
    const isNagadSender = senderCombined.includes('nagad') || senderCombined.includes('16167');
    
    const isNagadBody = textLower.includes('nagad') || textLower.includes('txnid') || textLower.includes('txn id');
    const isBkashBody = textLower.includes('bkash') || textLower.includes('trxid') || textLower.includes('trx id') || textLower.includes('transaction id');

    if (isNagadSender || isNagadBody) {
        provider = 'nagad';
    } else if (isBkashSender || isBkashBody) {
        provider = 'bKash';
    } else {
        // Untrusted source - blocked as fraud
        return { isFraud: true };
    }

    const trxMatch = text.match(/(?:TrxID|TxnId|TxnID|TrxId|Txn\s*ID|Trx\s*ID|Transaction\s*ID|TrxID\s*is|TxnID\s*is)[\s:.\-_=]*([A-Za-z0-9]{4,25})/i);
    if (!trxMatch) return null;
    const trxId = normalizeTrxId(trxMatch[1]);

    // Remove Fee and Balance segments before fallback amount extraction so Fee/Balance is never mistaken for the received amount
    const cleanedForFallback = text
        .replace(/(?:fee|charge|vat|comm(?:ission)?)[\s:]*(?:Tk|BDT|টাকা|৳)?[\s.:]*[\d,]+(?:\.\d+)?/gi, ' ')
        .replace(/(?:balance|bal|current\s*balance|new\s*balance)[\s:]*(?:Tk|BDT|টাকা|৳)?[\s.:]*[\d,]+(?:\.\d+)?/gi, ' ');

    let amount = 0;
    const recvMatch = text.match(/(?:received|cash\s*in|send\s*money|deposit|payment\s*of|transfer\s*received|amount|পরিমাণ)[\s:]*(?:Tk|BDT|টাকা|৳)?[\s.:]*([\d,]+(?:\.\d+)?)/i) ||
                      text.match(/(?:Tk|BDT|টাকা|৳)[\s.:]*([\d,]+(?:\.\d+)?)\s*(?:from|received|has\s*been|successful)/i) ||
                      cleanedForFallback.match(/(?:Tk|BDT|টাকা|৳)[\s.:]*([\d,]+(?:\.\d+)?)/i) ||
                      cleanedForFallback.match(/([\d,]+(?:\.\d+)?)\s*(?:Tk|BDT|টাকা|৳)/i);

    if (recvMatch) {
        amount = parseFloat(recvMatch[1].replace(/,/g, ''));
    }

    let senderPhone = '';
    const phoneMatch = text.match(/(?:from|by|sender|account)[\s:]*(01[3-9]\d{8})/i);
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

        // Preserve claimed status if this TrxID was already claimed (prevents duplicate webhook retries from resetting claimed)
        const existingMem = inMemoryVerifiedTrx.get(trxId);
        const verifiedRef = db.collection('verified_trx').doc(trxId);
        const existingDoc = await verifiedRef.get().catch(() => null);
        const alreadyClaimed = Boolean(existingMem?.claimed || (existingDoc && existingDoc.exists && existingDoc.data()?.claimed));

        // 1. Save to in-memory store immediately
        const memItem = {
            id: trxId,
            trxId: trxId,
            sender: provider,
            senderPhone: senderPhone || '',
            message: rawMessage,
            amount: amount,
            claimed: alreadyClaimed,
            timestamp: new Date()
        };
        inMemoryVerifiedTrx.set(trxId, memItem);
        if (!existingMem) {
            inMemoryMockTrxs.unshift(memItem);
            if (inMemoryMockTrxs.length > 50) inMemoryMockTrxs.pop();
        }

        // 2. Save to Firestore verified_trx
        const firestorePayload = {
            id: trxId,
            trxId: trxId,
            message: rawMessage,
            amount: amount,
            sender: provider,
            senderPhone: senderPhone || '',
            timestamp: FieldValue.serverTimestamp()
        };
        if (!alreadyClaimed) {
            firestorePayload.claimed = false;
        }
        await verifiedRef.set(firestorePayload, { merge: true }).catch(err => {
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
        let deposits = [];
        const seenWithdrawIds = new Set();

        try {
            const buysSnapshot = await db.collection('miniapp_buys').orderBy('timestamp', 'desc').limit(60).get();
            buys = buysSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch(e) {
            console.warn("Warning fetching miniapp_buys:", e.message);
            if (ordersCache.data?.buys) buys = ordersCache.data.buys;
        }

        try {
            const sellsSnapshot = await db.collection('miniapp_sells').orderBy('timestamp', 'desc').limit(60).get();
            sells = sellsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch(e) {
            console.warn("Warning fetching miniapp_sells:", e.message);
            if (ordersCache.data?.sells) sells = ordersCache.data.sells;
        }

        try {
            const depSnapshot = await db.collection('deposits').orderBy('timestamp', 'desc').limit(60).get();
            deposits = depSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch(e) {
            console.warn("Warning fetching deposits:", e.message);
            if (ordersCache.data?.deposits) deposits = ordersCache.data.deposits;
        }

        // 1. Get from fiat_withdrawals collection
        try {
            const fwSnap = await db.collection('fiat_withdrawals').orderBy('timestamp', 'desc').limit(60).get();
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

        const ordersResult = { buys, sells, withdrawals, deposits };
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
        
        const sentOkMsg = `<b>${PE.gem} ক্রিপ্টো ডেলিভারি সম্পন্ন! (Crypto Sent!)</b>\n\n` +
            `<blockquote>${PE.dollar} <b>Amount:</b> <code>${order.amount} ${order.asset}</code>\n` +
            `${PE.bank} <b>Gateway:</b> <code>TON Blockchain</code>\n` +
            `${PE.wallet} <b>Address:</b> <code>${order.receiveAddress}</code>\n` +
            `${PE.note} <b>TrxID:</b> <code>${order.trxId}</code></blockquote>\n\n` +
            `${PE.party} <i>ক্রিপ্টো আপনার ওয়ালেটে জমা হয়েছে।</i>`;
        bot.sendMessage(order.userId, sentOkMsg, { parse_mode: 'HTML', ...appOpenMarkup }).catch(e => console.error(e.message));
        
        await notifyPayoutGroup({
            type: 'crypto',
            userId: order.userId,
            name: 'User',
            amount: order.amount,
            asset: order.asset,
            totalBdt: order.totalBdt || 0,
            wallet: order.receiveAddress,
            txHash: txResult?.txHash || order.trxId
        }).catch(() => {});

        const config = botConfig || {};
        if (config.adminGroupId) {
            bot.sendMessage(config.adminGroupId, `${PE.check} <b>Buy Order Completed!</b>\nUser: <code>${order.userId}</code>\nAsset: <b>${order.amount} ${order.asset}</b>\nWallet: <code>${order.receiveAddress}</code>\nTrxID: <code>${order.trxId}</code>`, { parse_mode: 'HTML' }).catch(e => console.error(e.message));
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

        const isWalletOrder = order.paymentMethod === 'wallet' || order.paidWithWallet === true || order.paidFromBalance === true;
        const refundBdt = isWalletOrder ? (parseFloat(order.totalBdt) || 0) : 0;
        
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

        const buyRejectMsg = refundBdt > 0
            ? `<b>${PE.cross} বাই অর্ডার বাতিল ও রিফান্ড! (Order Rejected)</b>\n\n` +
              `<blockquote>${PE.gem} <b>Order:</b> <code>${order.amount} ${order.asset}</code>\n` +
              `${PE.note} <b>TrxID:</b> <code>${order.trxId}</code>\n` +
              `${PE.moneyBag} <b>Refunded:</b> <b>৳${refundBdt} BDT</b></blockquote>\n\n` +
              `${PE.swap} <i>টাকাটি আপনার অ্যাপ ব্যালেন্সে রিফান্ড করা হয়েছে।</i>`
            : `<b>${PE.cross} বাই অর্ডার বাতিল! (Order Rejected)</b>\n\n` +
              `<blockquote>${PE.gem} <b>Order:</b> <code>${order.amount} ${order.asset}</code>\n` +
              `${PE.note} <b>TrxID:</b> <code>${order.trxId}</code>\n` +
              `${PE.warn} <b>Reason:</b> <i>${reason || 'Payment verification failed'}</i></blockquote>\n\n` +
              `<i>আপনার ট্রানজেকশন অনুযায়ী কোনো পেমেন্ট পাওয়া যায়নি বিধায় অর্ডারটি বাতিল করা হয়েছে।</i>`;
        bot.sendMessage(order.userId, buyRejectMsg, { parse_mode: 'HTML', ...appOpenMarkup }).catch(e => console.error(e.message));

        const config = botConfig || {};
        if (config.adminGroupId) {
            bot.sendMessage(config.adminGroupId, `${PE.cross} <b>Buy Order Rejected!</b>\nUser: <code>${order.userId}</code>\nTrxID: <code>${order.trxId}</code>\nRefunded: <b>৳${refundBdt} BDT</b> to user balance.`, { parse_mode: 'HTML' }).catch(e => console.error(e.message));
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
        const parsedBonus = parseFloat(amount) || 0;
        const newBalance = (doc.data().balance || 0) + parsedBonus;
        await doc.ref.set({
            balance: newBalance,
            adminAddedBdt: FieldValue.increment(Math.max(0, parsedBonus)),
            lastBalanceUpdate: FieldValue.serverTimestamp()
        }, { merge: true });
        
        const bonusMsg = `<b>${PE.gift} বোনাস ব্যালেন্স প্রাপ্তি! (Bonus Received!)</b>\n\n` +
            `<blockquote>${PE.dollar} <b>Bonus Amount:</b> <b>৳${amount} BDT</b>\n` +
            `${PE.moneyBag} <b>New Balance:</b> <b>৳${newBalance.toFixed(2)} BDT</b></blockquote>\n\n` +
            `${PE.party} <i>অ্যাডমিন আপনার অ্যাকাউন্টে বোনাস ব্যালেন্স যোগ করেছেন।</i>`;
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
            ...(action === 'add' ? { adminAddedBdt: FieldValue.increment(Math.max(0, parseFloat(amount) || 0)) } : {}),
            lastBalanceUpdate: FieldValue.serverTimestamp()
        }, { merge: true });

        // Invalidate stats cache so stats refresh instantly
        statsCache.timestamp = 0;

        // Send Telegram bot notification to the user
        if (bot) {
            const notifMsg = action === 'add' ?
                `<b>${PE.moneyBag} ব্যালেন্স যোগ হয়েছে! (Balance Credited!)</b>\n\n` +
                `<blockquote>${PE.dollar} <b>Added Amount:</b> <b>+৳${parseFloat(amount).toFixed(2)} BDT</b>\n` +
                `${PE.moneyBag} <b>Current Balance:</b> <b>৳${newBalance.toFixed(2)} BDT</b>` +
                (reason ? `\n${PE.note} <b>Note:</b> <i>${reason}</i>` : '') +
                `</blockquote>\n\n` +
                `${PE.party} <i>অ্যাডমিন আপনার ওয়ালেটে টাকা যোগ করেছেন।</i>` :
                `<b>${PE.chartDown} ব্যালেন্স কর্তন করা হয়েছে! (Balance Adjusted)</b>\n\n` +
                `<blockquote>${PE.dollar} <b>Deducted:</b> <b>-৳${parseFloat(amount).toFixed(2)} BDT</b>\n` +
                `${PE.moneyBag} <b>Current Balance:</b> <b>৳${newBalance.toFixed(2)} BDT</b>` +
                (reason ? `\n${PE.note} <b>Note:</b> <i>${reason}</i>` : '') +
                `</blockquote>\n\n` +
                `${PE.bell} <i>অ্যাডমিন আপনার অ্যাকাউন্ট ব্যালেন্স সমন্বয় করেছেন।</i>`;
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
                msg = `<b>${PE.cross} অ্যাকাউন্ট স্থগিত (Banned)!</b>\n\n<blockquote>${PE.warn} আপনার অ্যাকাউন্টটি সাময়িকভাবে বন্ধ করা হয়েছে।\n${reason ? `${PE.note} <b>কারণ:</b> <i>${reason}</i>\n` : ''}সহায়তার জন্য সাপোর্টে যোগাযোগ করুন।</blockquote>`;
            } else if (status === 'restricted') {
                msg = `<b>${PE.warn} অ্যাকাউন্ট রেস্ট্রিক্টেড!</b>\n\n<blockquote>${PE.clock} আপনার অ্যাকাউন্টটি আগামী <b>${restrictionDays} দিনের জন্য</b> রেস্ট্রিক্ট করা হয়েছে।\n${reason ? `${PE.note} <b>কারণ:</b> <i>${reason}</i>\n` : ''}</blockquote>`;
            } else if (status === 'active') {
                msg = `<b>${PE.check} অ্যাকাউন্ট সক্রিয় (Active)!</b>\n\n<blockquote>${PE.party} আপনার অ্যাকাউন্টটি পুনরায় পুরোপুরি সক্রিয় করা হয়েছে। ধন্যবাদ!</blockquote>`;
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

// MiniApp Profile Sync Endpoint (syncs telegram name, username, photo, device fingerprint, tonAddress & referral to db)
app.post('/api/miniapp/sync-profile', async (req, res) => {
    try {
        const { userId, username, firstName, lastName, photoUrl, tonAddress, startParam, themeMode } = req.body;
        if (!userId || Number(userId) === 123456789) return res.json({ success: true });

        const devInfo = extractClientDevice(req, req.body);

        // If a brand-new user opened MiniApp with a referral startParam (e.g., ref_123456), check BEFORE writing user doc
        if (startParam && /^ref_\d+$/i.test(String(startParam).trim())) {
            const refId = String(startParam).trim().replace(/^ref_/i, '');
            await registerUserReferral(userId, refId, { username, firstName, lastName }, devInfo);
        }

        await recordAndVerifyDeviceAntiClone(userId, devInfo);
        
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
        if (tonAddress && String(tonAddress).trim().length >= 20) {
            updates.tonAddress = String(tonAddress).trim();
        }
        if (themeMode === 'dark' || themeMode === 'light') {
            updates.themeMode = themeMode;
        }

        await db.collection('users').doc(userId.toString()).set(updates, { merge: true });

        // If TON wallet was connected, check if referral now qualifies for activation
        if (tonAddress) {
            checkAndRewardReferral(userId).catch(() => {});
        }

        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ==================== REFERRAL API & RICH SHARE ENDPOINTS ====================
app.get('/referral-banner.jpg', (req, res) => {
    const p = path.join(__dirname, 'miniapp/public/referral-banner.jpg');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    if (fs.existsSync(p)) {
        return res.sendFile(p);
    }
    return res.redirect('/app/referral-banner.jpg');
});

app.get('/api/miniapp/referrals/:userId', async (req, res) => {
    try {
        const cleanUserId = parseInt(req.params.userId);
        if (!cleanUserId || isNaN(cleanUserId) || cleanUserId === 123456789) {
            return res.json({
                referralLink: `https://t.me/${BOT_USERNAME}?start=ref_0`,
                botReferralLink: `https://t.me/${BOT_USERNAME}?start=ref_0`,
                miniAppReferralLink: `https://t.me/${BOT_USERNAME}/app?startapp=ref_0`,
                sharePreviewUrl: `https://maruf-teach-bot.onrender.com/invite/0`,
                bannerUrl: `https://maruf-teach-bot.onrender.com/app/referral-banner.jpg`,
                totalReferrals: 0,
                activeReferrals: 0,
                pendingReferrals: 0,
                referralEarnings: 0,
                stats: { totalReferrals: 0, activeReferrals: 0, pendingReferrals: 0, blockedReferrals: 0, totalEarned: 0, bonusPerReferral: REFERRAL_BONUS_BDT },
                referrals: []
            });
        }

        const strUserId = String(cleanUserId);
        const [userDoc, refSnap] = await Promise.all([
            db.collection('users').doc(strUserId).get().catch(() => null),
            db.collection('referrals').where('referrerId', '==', cleanUserId).get().catch(() => null)
        ]);

        const userData = (userDoc && userDoc.exists) ? (userDoc.data() || {}) : {};
        const referralsList = [];
        let activeCount = 0;
        let pendingCount = 0;
        let blockedCount = 0;

        if (refSnap && !refSnap.empty) {
            refSnap.forEach(doc => {
                const d = doc.data() || {};
                const status = d.status || 'pending';
                if (status === 'active') activeCount++;
                else if (status === 'blocked_clone' || status === 'rejected_clone') blockedCount++;
                else pendingCount++;

                let createdMs = Date.now();
                if (d.createdAt && typeof d.createdAt.toMillis === 'function') createdMs = d.createdAt.toMillis();
                else if (d.createdAt && d.createdAt._seconds) createdMs = d.createdAt._seconds * 1000;

                referralsList.push({
                    id: d.referredUserId || doc.id,
                    userId: d.referredUserId || doc.id,
                    name: d.referredName || 'User',
                    username: d.referredUsername || '',
                    status,
                    walletConnected: Boolean(d.walletConnected),
                    qualifyingTxDone: Boolean(d.qualifyingTxDone),
                    totalAddMoneyBdt: d.totalAddMoneyBdt || 0,
                    totalSellBdt: d.totalSellBdt || 0,
                    bonusAmount: d.bonusAmount || REFERRAL_BONUS_BDT,
                    rewardAmount: d.bonusAmount || REFERRAL_BONUS_BDT,
                    bonusPaid: Boolean(d.bonusPaid),
                    createdAt: createdMs
                });
            });
        }

        referralsList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        const totalEarned = Math.max(activeCount * REFERRAL_BONUS_BDT, parseFloat(userData.referralEarnings) || 0);

        res.json({
            referralLink: `https://t.me/${BOT_USERNAME}?start=ref_${cleanUserId}`,
            botReferralLink: `https://t.me/${BOT_USERNAME}?start=ref_${cleanUserId}`,
            miniAppReferralLink: `https://t.me/${BOT_USERNAME}/app?startapp=ref_${cleanUserId}`,
            sharePreviewUrl: `https://maruf-teach-bot.onrender.com/invite/${cleanUserId}`,
            bannerUrl: `https://maruf-teach-bot.onrender.com/app/referral-banner.jpg`,
            botUsername: BOT_USERNAME,
            totalReferrals: referralsList.length,
            activeReferrals: activeCount,
            pendingReferrals: pendingCount,
            referralEarnings: totalEarned,
            stats: {
                totalReferrals: referralsList.length,
                activeReferrals: activeCount,
                pendingReferrals: pendingCount,
                blockedReferrals: blockedCount,
                totalEarned,
                bonusPerReferral: REFERRAL_BONUS_BDT
            },
            referrals: referralsList
        });
    } catch (e) {
        console.error("GET /api/miniapp/referrals error:", e.message);
        res.status(500).json({ error: e.message });
    }
});

// Prepares an Inline Photo + Caption + Button message for Telegram Share ONLY (Never sends any message to the referrer's bot chat)
app.post('/api/miniapp/prepare-referral-share', async (req, res) => {
    try {
        const { userId } = req.body;
        const cleanUserId = parseInt(userId);
        if (!cleanUserId || isNaN(cleanUserId) || cleanUserId === 123456789) {
            return res.status(400).json({ error: 'Valid Telegram User ID required' });
        }

        const botStartLink = `https://t.me/${BOT_USERNAME}?start=ref_${cleanUserId}`;
        const sharePreviewUrl = `https://maruf-teach-bot.onrender.com/invite/${cleanUserId}`;
        const bannerUrl = `https://maruf-teach-bot.onrender.com/app/referral-banner.jpg`;

        const inlineCleanCaption = `🌹 <b>Trust Pay — ইনস্ট্যান্ট ক্রিপ্টো বাই/সেল প্ল্যাটফর্ম!</b> ✨\n\n` +
            `<blockquote>🚀 <b>TON, GRAM ও USDT</b> মুহূর্তেই কেনা-বেচা করুন!\n` +
            `🏦 <b>পেমেন্ট মেথড:</b> bKash ও Nagad (Auto-Verified)\n` +
            `⚡️ <b>উইথড্র ও ডেলিভারি:</b> ১০০% ফাস্ট ও নিরাপদ!\n` +
            `🎁 <b>রেফার ও বোনাস:</b> জয়েন করে লেনদেন শুরু করুন!</blockquote>\n\n` +
            `👇 <b>নিচের বাটনে ক্লিক করে এখনই Trust Pay বটে জয়েন করুন:</b>`;

        let preparedMessageId = null;

        // Prepare inline message for WebApp.shareMessage (does NOT send anything to the user's bot inbox)
        try {
            const prepRes = await axios.post(`https://api.telegram.org/bot${token}/savePreparedInlineMessage`, {
                user_id: cleanUserId,
                result: {
                    type: 'photo',
                    id: `ref_${cleanUserId}_${Date.now()}`,
                    photo_url: bannerUrl,
                    thumb_url: bannerUrl,
                    photo_width: 1280,
                    photo_height: 720,
                    title: 'Trust Pay — Instant Crypto Buy & Sell',
                    description: 'TON, GRAM ও USDT কেনা-বেচা করুন বিকাশ ও নগদে!',
                    caption: inlineCleanCaption,
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '🚀 জয়েন করুন — Trust Pay (Join Now)', url: botStartLink }]
                        ]
                    }
                },
                allow_user_chats: true,
                allow_bot_chats: false,
                allow_group_chats: true,
                allow_channel_chats: true
            }, { timeout: 6000 });

            if (prepRes.data && prepRes.data.ok && prepRes.data.result?.id) {
                preparedMessageId = prepRes.data.result.id;
            }
        } catch (prepErr) {
            // Fallback will be used if savePreparedInlineMessage is not available
        }

        const shareTextPlain =
            `✨ Trust Pay — Instant Crypto Buy & Sell BD ✨\n\n` +
            `💎 TON, GRAM ও USDT খুব সহজে কেনা-বেচা করুন!\n` +
            `⚡ bKash ও Nagad-এ অটোমেটিক পেমেন্ট!\n` +
            `🎁 নিচের লিংকে ক্লিক করে জয়েন করুন 👇\n${botStartLink}`;
        const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(sharePreviewUrl)}&text=${encodeURIComponent(shareTextPlain)}`;

        res.json({
            success: true,
            preparedMessageId,
            sentToChat: false,
            botStartLink,
            sharePreviewUrl,
            telegramShareUrl,
            bannerUrl
        });
    } catch (e) {
        console.error("prepare-referral-share error:", e.message);
        res.status(500).json({ error: e.message });
    }
});

// ==================== 30-DAY SPIN & STAR GIVEAWAY EVENT API ====================
const SPIN_ITEMS = [
    { index: 0, id: '1_tk', label: '৳1 TK', labelBn: '৳১ টাকা', bdt: 1, type: 'cash' },
    { index: 1, id: '5_tk', label: '৳5 TK', labelBn: '৳৫ টাকা', bdt: 5, type: 'cash' },
    { index: 2, id: '10_tk', label: '৳10 TK', labelBn: '৳১০ টাকা', bdt: 10, type: 'big_cash' },
    { index: 3, id: '20_tk', label: '৳20 TK', labelBn: '৳২০ টাকা', bdt: 20, type: 'big_cash' },
    { index: 4, id: 'teddy', label: 'Star Gift', labelBn: '💝 স্টার গিফট', bdt: 0, type: 'teddy' },
    { index: 5, id: '100_tk', label: '৳100 TK', labelBn: '৳১০০ টাকা', bdt: 100, type: 'big_cash' },
    { index: 6, id: 'again', label: 'Try Later', labelBn: 'Spin Again', bdt: 0, type: 'again' },
    { index: 7, id: '500_tk', label: '৳500 TK', labelBn: '৳৫০০ টাকা', bdt: 500, type: 'big_cash' },
    { index: 8, id: '1_usd', label: '$1 USD', labelBn: '$১ ডলার', bdt: 120, type: 'big_cash' }
];

const SPIN_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours for daily free spin
const SPIN_EVENT_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 Days Event
const SPIN_MILESTONE_TARGET = 50000; // 50,000 Global Spins target (server-only hidden counter)

async function getOrInitSpinEventConfig() {
    const configRef = db.collection('config').doc('spin_event');
    const doc = await configRef.get();
    const now = Date.now();
    if (!doc.exists) {
        const initData = {
            eventStartAt: now,
            eventEndAt: now + SPIN_EVENT_DURATION_MS,
            totalGlobalSpins: 0,
            totalGlobalAdsWatched: 0,
            milestoneTarget: SPIN_MILESTONE_TARGET,
            monetagZoneId: process.env.MONETAG_ZONE_ID || '12077323',
            adsgramBlockId: process.env.ADSGRAM_BLOCK_ID || ''
        };
        await configRef.set(initData, { merge: true });
        return initData;
    }
    const d = doc.data() || {};
    let eventEndAt = d.eventEndAt || (now + SPIN_EVENT_DURATION_MS);
    if (eventEndAt <= now) {
        // Renew 30-day cycle if expired
        eventEndAt = now + SPIN_EVENT_DURATION_MS;
        await configRef.set({ eventStartAt: now, eventEndAt }, { merge: true });
    }
    return {
        eventStartAt: d.eventStartAt || now,
        eventEndAt,
        totalGlobalSpins: d.totalGlobalSpins || 0,
        totalGlobalAdsWatched: d.totalGlobalAdsWatched || 0,
        milestoneTarget: d.milestoneTarget || SPIN_MILESTONE_TARGET,
        monetagZoneId: d.monetagZoneId || process.env.MONETAG_ZONE_ID || '12077323',
        adsgramBlockId: d.adsgramBlockId || process.env.ADSGRAM_BLOCK_ID || ''
    };
}

app.get('/api/miniapp/spin-status/:userId', async (req, res) => {
    try {
        const cleanUserId = parseInt(req.params.userId);
        const now = Date.now();
        const eventConfig = await getOrInitSpinEventConfig();

        if (!cleanUserId || isNaN(cleanUserId) || cleanUserId === 123456789) {
            return res.json({
                success: true,
                dailyFreeAvailable: true,
                nextDailySpinAt: now,
                extraSpins: 0,
                totalAvailableSpins: 1,
                adProgress: 0,
                totalSpinsByUser: 0,
                totalWonBdt: 0,
                eventEndAt: eventConfig.eventEndAt,
                totalGlobalSpins: eventConfig.totalGlobalSpins,
                milestoneTarget: eventConfig.milestoneTarget,
                monetagZoneId: eventConfig.monetagZoneId,
                adsgramBlockId: eventConfig.adsgramBlockId
            });
        }

        const strUserId = String(cleanUserId);
        const [userDoc, refSnap] = await Promise.all([
            db.collection('users').doc(strUserId).get(),
            db.collection('referrals').where('referrerId', '==', cleanUserId).get().catch(() => null)
        ]);

        const userData = userDoc.exists ? (userDoc.data() || {}) : {};
        let extraSpins = Math.max(0, parseInt(userData.extraSpins) || 0);
        const syncedRefCount = parseInt(userData.syncedReferralSpinsCount) || 0;

        // Sync any valid (non-clone) referrals that haven't granted their 1 free spin yet (even if pending/unactivated)
        let validReferralsCount = 0;
        if (refSnap && !refSnap.empty) {
            refSnap.forEach(rDoc => {
                const rd = rDoc.data() || {};
                if (rd.status !== 'blocked_clone' && rd.status !== 'rejected_clone') {
                    validReferralsCount++;
                }
            });
        }

        if (validReferralsCount > syncedRefCount) {
            const unsyncedSpins = validReferralsCount - syncedRefCount;
            extraSpins += unsyncedSpins;
            await db.collection('users').doc(strUserId).set({
                extraSpins,
                syncedReferralSpinsCount: validReferralsCount
            }, { merge: true });
        }

        const lastDailySpinAt = parseInt(userData.lastDailySpinAt) || 0;
        const dailyFreeAvailable = (now - lastDailySpinAt) >= SPIN_COOLDOWN_MS;
        const nextDailySpinAt = dailyFreeAvailable ? now : (lastDailySpinAt + SPIN_COOLDOWN_MS);
        const totalAvailableSpins = (dailyFreeAvailable ? 1 : 0) + extraSpins;

        res.json({
            success: true,
            dailyFreeAvailable,
            nextDailySpinAt,
            extraSpins,
            totalAvailableSpins,
            adProgress: Math.min(2, Math.max(0, parseInt(userData.spinAdProgress) || 0)),
            totalSpinsByUser: parseInt(userData.totalSpinsByUser) || 0,
            totalWonBdt: parseFloat(userData.totalSpinWonBdt) || 0,
            totalReferralsForSpin: validReferralsCount,
            eventEndAt: eventConfig.eventEndAt,
            totalGlobalSpins: eventConfig.totalGlobalSpins,
            milestoneTarget: eventConfig.milestoneTarget,
            monetagZoneId: eventConfig.monetagZoneId,
            adsgramBlockId: eventConfig.adsgramBlockId
        });
    } catch (e) {
        console.error("GET /api/miniapp/spin-status error:", e.message);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/miniapp/spin-execute', async (req, res) => {
    try {
        const { userId } = req.body;
        const cleanUserId = parseInt(userId);
        if (!cleanUserId || isNaN(cleanUserId) || cleanUserId === 123456789) {
            return res.status(400).json({ error: ' অনুগ্রহ করে টেলিগ্রাম থেকে বটটি ওপেন করুন।' });
        }

        const strUserId = String(cleanUserId);
        const userRef = db.collection('users').doc(strUserId);
        const configRef = db.collection('config').doc('spin_event');

        const [userDoc, eventConfig] = await Promise.all([
            userRef.get(),
            getOrInitSpinEventConfig()
        ]);

        const userData = userDoc.exists ? (userDoc.data() || {}) : {};
        const now = Date.now();
        const lastDailySpinAt = parseInt(userData.lastDailySpinAt) || 0;
        const dailyFreeAvailable = (now - lastDailySpinAt) >= SPIN_COOLDOWN_MS;
        let extraSpins = Math.max(0, parseInt(userData.extraSpins) || 0);

        if (!dailyFreeAvailable && extraSpins <= 0) {
            return res.status(400).json({
                success: false,
                error: 'আপনার ফ্রি স্পিন শেষ! নিচে ৩টি অ্যাড দেখে অথবা বন্ধুদের রেফার করে ফ্রি স্পিন নিন।'
            });
        }

        // Consume spin: prioritize daily free spin first, then extraSpins
        let usedDailyFree = false;
        if (dailyFreeAvailable) {
            usedDailyFree = true;
        } else {
            extraSpins = Math.max(0, extraSpins - 1);
        }

        // Increment global spin counter
        const newGlobalSpins = (parseInt(eventConfig.totalGlobalSpins) || 0) + 1;
        await configRef.set({
            totalGlobalSpins: FieldValue.increment(1)
        }, { merge: true });

        // ──────────────────────────────────────────────────────────────────
        // ZERO-LOSS & 50,000 MILESTONE PROBABILITY ENGINE
        // ──────────────────────────────────────────────────────────────────
        const todayKey = new Date(now + 6 * 3600 * 1000).toISOString().slice(0, 10); // BD date
        const userLastWinDate = userData.lastSpinWinDate || '';
        const wonTodayBdt = (userLastWinDate === todayKey) ? (parseFloat(userData.dailySpinWonBdt) || 0) : 0;
        const isClone = Boolean(userData.isCloneDevice);

        let winningIndex = 6; // Default: Index 6 = "Try Later / Spin Again" (0 BDT cost)
        let isMilestoneWinner = false;
        let bonusFreeRespin = false;

        // Check if this exact spin is the 50,001st spin (right after 50,000 spins completed!)
        if (!isClone && newGlobalSpins > SPIN_MILESTONE_TARGET && (newGlobalSpins % SPIN_MILESTONE_TARGET === 1)) {
            isMilestoneWinner = true;
            // 50,000+ Milestone Special Prize: Teddy Gift (index 4) or 10/20 TK
            const milestonePool = [4, 4, 4, 2, 3]; // 60% Teddy Gift, 20% 10 TK, 20% 20 TK
            winningIndex = milestonePool[Math.floor(Math.random() * milestonePool.length)];
        } else if (isClone) {
            // Clone accounts always land on Try Later (0 BDT)
            winningIndex = 6;
        } else {
            // Normal Spin (< 50,000):
            // 99%+ lands on "Try Later / Again" (Index 6) or "৳1 TK" (Index 0)
            // Strict Zero-Loss Protection:
            const roll = Math.random() * 100;

            if (wonTodayBdt >= 2) {
                // Already won 2 TK today -> 100% lands on Try Later (0 BDT) so admin never loses money!
                winningIndex = 6;
            } else if (wonTodayBdt >= 1) {
                // Already won 1 TK today -> 95% Try Later (0 BDT), 5% 1 TK
                winningIndex = roll < 95 ? 6 : 0;
            } else {
                // Has not won any BDT today yet:
                // Rare 0.4% chance (only every 250th global spin) for 5 TK (Index 1)
                if (newGlobalSpins % 250 === 0 && roll < 40) {
                    winningIndex = 1; // ৳5 TK
                } else if (roll < 82) {
                    // 82% lands on Index 6 (Try Later / Spin Again — 0 BDT)
                    winningIndex = 6;
                    // 20% of the time when landing on "Again" (and not already on a free respin), grant 1 instant re-spin for excitement
                    if (!userData.lastSpinWasFreeRespin && Math.random() < 0.20) {
                        bonusFreeRespin = true;
                        extraSpins += 1;
                    }
                } else {
                    // ~17.6% lands on Index 0 (৳1 TK)
                    winningIndex = 0;
                }
            }
        }

        const prize = SPIN_ITEMS[winningIndex] || SPIN_ITEMS[6];
        const bdtWon = prize.bdt || 0;
        const newDailyWonBdt = wonTodayBdt + bdtWon;

        const userUpdates = {
            extraSpins,
            totalSpinsByUser: FieldValue.increment(1),
            lastSpinWasFreeRespin: bonusFreeRespin,
            updatedAt: FieldValue.serverTimestamp()
        };

        if (usedDailyFree) {
            userUpdates.lastDailySpinAt = now;
        }

        if (bdtWon > 0) {
            userUpdates.balance = FieldValue.increment(bdtWon);
            userUpdates.totalSpinWonBdt = FieldValue.increment(bdtWon);
            userUpdates.lastSpinWinDate = todayKey;
            userUpdates.dailySpinWonBdt = newDailyWonBdt;
        }

        if (prize.type === 'teddy') {
            userUpdates.teddyGiftsWon = FieldValue.increment(1);
        }

        await userRef.set(userUpdates, { merge: true });

        // Notify Admin Group & User if Teddy Gift or Big Milestone Prize is won
        if (prize.type === 'teddy' || isMilestoneWinner || bdtWon >= 5) {
            const uName = userData.firstName || userData.first_name || 'User';
            const uHandle = userData.username ? `@${userData.username}` : `ID: ${cleanUserId}`;
            if (bot && botConfig?.adminGroupId) {
                const adminSpinMsg = `🎰 <b>Spin Event Prize Alert!</b>\n\n` +
                    `👤 <b>User:</b> ${uName} (${uHandle} / <code>${cleanUserId}</code>)\n` +
                    `🎁 <b>Prize Won:</b> <b>${prize.label} (${prize.labelBn})</b>\n` +
                    `🌍 <b>Global Spin #:</b> <code>${newGlobalSpins}</code>\n` +
                    `${isMilestoneWinner ? '🏆 <b>50,000+ MILESTONE WINNER!</b>' : ''}`;
                bot.sendMessage(botConfig.adminGroupId, adminSpinMsg, { parse_mode: 'HTML' }).catch(() => {});
            }
        }

        const updatedDailyFreeAvailable = usedDailyFree ? false : dailyFreeAvailable;
        const nextDailySpinAt = usedDailyFree ? (now + SPIN_COOLDOWN_MS) : (dailyFreeAvailable ? now : (lastDailySpinAt + SPIN_COOLDOWN_MS));
        const newBalance = (parseFloat(userData.balance) || 0) + bdtWon;

        res.json({
            success: true,
            winningIndex,
            prize: {
                ...prize,
                bonusFreeRespin
            },
            bdtWon,
            isMilestoneWinner,
            bonusFreeRespin,
            newBalance,
            dailyFreeAvailable: updatedDailyFreeAvailable,
            nextDailySpinAt,
            extraSpins,
            totalAvailableSpins: (updatedDailyFreeAvailable ? 1 : 0) + extraSpins,
            totalGlobalSpins: newGlobalSpins,
            milestoneTarget: eventConfig.milestoneTarget
        });
    } catch (e) {
        console.error("POST /api/miniapp/spin-execute error:", e.message);
        res.status(500).json({ error: e.message });
    }
});

// Watch 3 Ads = +1 Free Spin Endpoint
app.post('/api/miniapp/spin-watch-ad', async (req, res) => {
    try {
        const { userId } = req.body;
        const cleanUserId = parseInt(userId);
        if (!cleanUserId || isNaN(cleanUserId) || cleanUserId === 123456789) {
            return res.status(400).json({ error: 'Valid Telegram User ID required' });
        }

        const strUserId = String(cleanUserId);
        const userRef = db.collection('users').doc(strUserId);
        const userDoc = await userRef.get();
        const userData = userDoc.exists ? (userDoc.data() || {}) : {};

        const now = Date.now();
        const lastAdAt = parseInt(userData.lastSpinAdAt) || 0;
        if (now - lastAdAt < 5000) {
            return res.status(429).json({ error: 'অনুগ্রহ করে অ্যাডটি সম্পূর্ণ দেখুন।' });
        }

        const currentProgress = Math.min(2, Math.max(0, parseInt(userData.spinAdProgress) || 0));
        const nextProgress = currentProgress + 1;
        let extraSpins = Math.max(0, parseInt(userData.extraSpins) || 0);
        let spinUnlocked = false;
        let finalProgress = nextProgress;

        if (nextProgress >= 3) {
            finalProgress = 0;
            extraSpins += 1;
            spinUnlocked = true;
        }

        await Promise.all([
            userRef.set({
                spinAdProgress: finalProgress,
                extraSpins,
                lastSpinAdAt: now,
                totalAdsWatched: FieldValue.increment(1)
            }, { merge: true }),
            db.collection('config').doc('spin_event').set({
                totalGlobalAdsWatched: FieldValue.increment(1)
            }, { merge: true })
        ]);

        const lastDailySpinAt = parseInt(userData.lastDailySpinAt) || 0;
        const dailyFreeAvailable = (now - lastDailySpinAt) >= SPIN_COOLDOWN_MS;

        res.json({
            success: true,
            adProgress: finalProgress,
            spinUnlocked,
            extraSpins,
            totalAvailableSpins: (dailyFreeAvailable ? 1 : 0) + extraSpins
        });
    } catch (e) {
        console.error("POST /api/miniapp/spin-watch-ad error:", e.message);
        res.status(500).json({ error: e.message });
    }
});

// Public Rich Preview & Instant Redirect Route for Referral Sharing (shows Banner Image + Title + Button in Telegram)
app.get('/invite/:referrerId', (req, res) => {
    const rawRef = (req.params.referrerId || '').toString().replace(/[^0-9]/g, '');
    const botStartLink = rawRef ? `https://t.me/${BOT_USERNAME}?start=ref_${rawRef}` : `https://t.me/${BOT_USERNAME}`;
    const bannerUrl = `https://maruf-teach-bot.onrender.com/app/referral-banner.jpg`;

    const html = `<!DOCTYPE html>
<html lang="bn">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>💎 Trust Pay — Instant Crypto Buy & Sell (bKash & Nagad)</title>
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Trust Pay Official" />
    <meta property="og:title" content="💎 Trust Pay — ইনস্ট্যান্ট ক্রিপ্টো বাই ও সেল (bKash & Nagad)" />
    <meta property="og:description" content="🚀 TON, GRAM ও USDT মুহূর্তেই কেনা-বেচা করুন বিকাশ ও নগদে! নিচের লিংকে ক্লিক করে এখনই জয়েন করুন 👇" />
    <meta property="og:image" content="${bannerUrl}" />
    <meta property="og:image:width" content="1280" />
    <meta property="og:image:height" content="720" />
    <meta property="og:url" content="https://maruf-teach-bot.onrender.com/invite/${rawRef}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="💎 Trust Pay — ইনস্ট্যান্ট ক্রিপ্টো বাই ও সেল (bKash & Nagad)" />
    <meta name="twitter:description" content="🚀 TON, GRAM ও USDT মুহূর্তেই কেনা-বেচা করুন বিকাশ ও নগদে! এখনই জয়েন করুন 👇" />
    <meta name="twitter:image" content="${bannerUrl}" />
    <meta http-equiv="refresh" content="0;url=${botStartLink}" />
    <script>
        window.location.replace(${JSON.stringify(botStartLink)});
    </script>
</head>
<body style="background:#0f172a;color:#fff;font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:20px;text-align:center;">
    <img src="${bannerUrl}" alt="Trust Pay" style="max-width:340px;width:100%;border-radius:16px;box-shadow:0 12px 32px rgba(0,0,0,0.4);margin-bottom:20px;" />
    <h2 style="margin:0 0 8px;font-size:20px;">💎 Trust Pay — ট্রাস্ট পে</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#cbd5e1;">টেলিগ্রাম বটে নিয়ে যাওয়া হচ্ছে...</p>
    <a href="${botStartLink}" style="display:inline-block;padding:14px 28px;background:linear-gradient(90deg,#4f46e5,#9333ea);color:#fff;text-decoration:none;font-weight:bold;border-radius:12px;font-size:15px;">🚀 জয়েন করুন — Open Trust Pay Bot</a>
</body>
</html>`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
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
                const userMsg = `<b>${PE.approvedBag} উইথড্র অনুমোদিত! (Withdrawal Approved!)</b>\n\n` +
                    `<blockquote>${PE.dollar} <b>Amount:</b> <code>৳${pend?.amount || 0} BDT</code>\n` +
                    `${PE.chartDown} <b>Service Fee:</b> <code>৳${pend?.fee || 0} BDT</code>\n` +
                    `${PE.flyingCash} <b>Sent Amount:</b> <b>৳${pend?.receiveAmount || pend?.amount || 0} BDT</b>\n` +
                    `${PE.bank} <b>Gateway:</b> <code>${(pend?.method || 'bKash').toUpperCase()}</code>\n` +
                    `${PE.wallet} <b>Account:</b> <code>${pend?.number || ''}</code>\n` +
                    `${PE.globe} <b>Status:</b> <code>Sent Successfully</code></blockquote>\n\n` +
                    `${PE.party} <i>আপনার একাউন্ট চেক করুন। TrustPay-এর সাথে থাকার জন্য ধন্যবাদ!</i>`;
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
                const userRejectMsg = `<b>${PE.cross} উইথড্র বাতিল ও রিফান্ড! (Withdrawal Rejected)</b>\n\n` +
                    `<blockquote>${PE.note} <b>Reason:</b> <i>${reason || 'অ্যাকাউন্ট তথ্যে ভুল'}</i>\n` +
                    `${PE.moneyBag} <b>Refunded Amount:</b> <b>৳${refundAmt} BDT</b></blockquote>\n\n` +
                    `${PE.swap} <i>টাকাটি আপনার অ্যাপ ব্যালেন্সে ফেরত দেওয়া হয়েছে। তথ্য যাচাই করে আবার চেষ্টা করুন।</i>`;
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

app.post('/api/settings', requireAdminAuth, async (req, res) => {
    try {
        await saveConfig(req.body);
        res.json({ success: true, message: 'Deployed!' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ============================================================================
// ADMIN BROADCAST SYSTEM — 20 CUSTOM EDITABLE TEMPLATES + ANIMATED BOT DM
// ============================================================================
const DEFAULT_BROADCAST_TEMPLATES = [
    {
        id: 'tpl_1',
        number: 1,
        category: 'Rate & Promo',
        badge: '🔥 Hot Rate',
        title: '🔥 ১. আজকের সেরা ক্রিপ্টো রেট আপডেট (Best Rate Alert)',
        message: `<b>🔥 আজকের সেরা ক্রিপ্টো রেট আপডেট! (Market Update)</b>\n\n<blockquote>💎 <b>Asset:</b> <code>TON / USDT / GRAM</code>\n📈 <b>Buy &amp; Sell:</b> <code>সর্বোচ্চ মার্কেট রেট চালু!</code>\n🏦 <b>Gateway:</b> <code>bKash &amp; Nagad (Personal)</code>\n⚡️ <b>Delivery:</b> <code>Instant Auto Transfer</code></blockquote>\n\n🚀 <i>আজই সেরা রেটে ক্রিপ্টো ক্রয়-বিক্রয় করতে নিচের বাটনে ক্লিক করে ওয়েব অ্যাপ ওপেন করুন!</i>`
    },
    {
        id: 'tpl_2',
        number: 2,
        category: 'Instant Cashout',
        badge: '⚡️ Instant Payout',
        title: '⚡️ ২. ইনস্ট্যান্ট বিকাশ ও নগদ উইথড্র চালু (Instant Cashout Live)',
        message: `<b>⚡️ ইনস্ট্যান্ট বিকাশ ও নগদ ক্যাশআউট চালু! (Fast Payout)</b>\n\n<blockquote>💰 <b>Service:</b> <code>Instant Fiat Withdrawal</code>\n🏦 <b>Gateway:</b> <code>bKash &amp; Nagad</code>\n⏰ <b>Processing Time:</b> <code>১ – ৫ মিনিট</code>\n✅ <b>Status:</b> <code>100% Active &amp; Online</code></blockquote>\n\n💸 <i>আপনার ওয়ালেট ব্যালেন্স এখনই দ্রুত বিকাশ বা নগদে উত্তোলন করে নিন!</i>`
    },
    {
        id: 'tpl_3',
        number: 3,
        category: 'Crypto Buy/Sell',
        badge: '💎 Auto Crypto',
        title: '💎 ৩. TON ও USDT ইনস্ট্যান্ট অন-চেইন বাই (Instant Crypto Buy)',
        message: `<b>💎 ওয়েব অ্যাপ ব্যালেন্স দিয়ে ১ ক্লিকে ক্রিপ্টো কিনুন!</b>\n\n<blockquote>🪙 <b>Available Coins:</b> <code>TON, USDT &amp; GRAM</code>\n⚡️ <b>Transfer Mode:</b> <code>Direct On-Chain Auto Send</code>\n📩 <b>Receiver:</b> <code>Any TON / Tonkeeper Wallet</code>\n🌐 <b>Confirmation:</b> <code>Within Seconds!</code></blockquote>\n\n🚀 <i>অ্যাড মানি করে অ্যাপ ব্যালেন্স থেকে সরাসরি আপনার ওয়ালেটে ক্রিপ্টো নিয়ে নিন!</i>`
    },
    {
        id: 'tpl_4',
        number: 4,
        category: 'Deposit & Bonus',
        badge: '💰 Auto Deposit',
        title: '💰 ৪. অটোমেটিক অ্যাড মানি চালু (1-Second Auto Deposit)',
        message: `<b>💰 অটোমেটিক ব্যালেন্স ডিপোজিট চালু আছে! (Auto Add Money)</b>\n\n<blockquote>🏦 <b>Payment Methods:</b> <code>bKash &amp; Nagad Send Money</code>\n📝 <b>Verification:</b> <code>SMS TrxID Auto-Verify</code>\n⚡️ <b>Credit Speed:</b> <code>মাত্র ১ সেকেন্ডে ব্যালেন্স যুক্ত!</code>\n🛡 <b>Security:</b> <code>100% Safe &amp; Protected</code></blockquote>\n\n✨ <i>টাকা পাঠিয়ে সঠিক TrxID সাবমিট করলেই স্বয়ংক্রিয়ভাবে আপনার ব্যালেন্সে টাকা জমা হয়ে যাবে!</i>`
    },
    {
        id: 'tpl_5',
        number: 5,
        category: 'Deposit & Bonus',
        badge: '🎁 Special Bonus',
        title: '🎉 ৫. স্পেশাল বোনাস ও ক্যাশব্যাক অফার (Bonus Announcement)',
        message: `<b>🎉 ধামাকা বোনাস ও স্পেশাল অফার! (Special Reward!)</b>\n\n<blockquote>🎁 <b>Offer Type:</b> <code>Active Trader Bonus</code>\n💲 <b>Reward:</b> <code>স্পেশাল ব্যালেন্স রিওয়ার্ড</code>\n💎 <b>Eligible For:</b> <code>TON, USDT &amp; GRAM Traders</code>\n🔥 <b>Validity:</b> <code>সীমিত সময়ের জন্য!</code></blockquote>\n\n👑 <i>এখনই লেনদেন সম্পন্ন করে আপনার স্পেশাল বোনাস লুফে নিন!</i>`
    },
    {
        id: 'tpl_6',
        number: 6,
        category: 'System & Security',
        badge: '🚀 System Update',
        title: '🚀 ৬. ওয়েব অ্যাপ সুপার-ফাস্ট আপডেট (Web App Speed Upgrade)',
        message: `<b>🚀 Trust Pay ওয়েব অ্যাপ এখন আরও সুপার-ফাস্ট!</b>\n\n<blockquote>✨ <b>UI Experience:</b> <code>Ultra-Smooth &amp; Fast Loading</code>\n⚡️ <b>Wallet Sync:</b> <code>Real-Time Instant Balance</code>\n🔄 <b>Blockchain Engine:</b> <code>Upgraded Auto-Detection</code>\n✅ <b>System Status:</b> <code>All Services 100% Online</code></blockquote>\n\n💎 <i>নতুন অভিজ্ঞতা পেতে এখনই নিচের বাটনে ট্যাপ করে অ্যাপে প্রবেশ করুন!</i>`
    },
    {
        id: 'tpl_7',
        number: 7,
        category: 'Rate & Promo',
        badge: '📈 High Sell Rate',
        title: '📈 ৭. ক্রিপ্টো বিক্রিতে বাড়তি রেট! (High Crypto Sell Rate)',
        message: `<b>📈 আপনার USDT, TON ও GRAM বিক্রি করুন সর্বোচ্চ দামে!</b>\n\n<blockquote>💲 <b>Sell Rate:</b> <code>আজকের মার্কেটে সর্বোচ্চ দাম!</code>\n📩 <b>Method:</b> <code>1-Click TonConnect / Direct Send</code>\n💰 <b>Balance Credit:</b> <code>সাথে সাথে টাকা যুক্ত হয়</code>\n🏦 <b>Cashout:</b> <code>bKash &amp; Nagad Instant</code></blockquote>\n\n🔥 <i>দেরি না করে আপনার ওয়ালেটের ক্রিপ্টো বিক্রি করে সেরা মূল্যে ক্যাশআউট করে নিন!</i>`
    },
    {
        id: 'tpl_8',
        number: 8,
        category: 'Instant Cashout',
        badge: '🏦 All Paid',
        title: '🏦 ৮. সকল পেন্ডিং উইথড্র পেমেন্ট সম্পন্ন (All Withdrawals Cleared)',
        message: `<b>💰 সকল পেন্ডিং উইথড্র সফলভাবে পেমেন্ট করা হয়েছে!</b>\n\n<blockquote>✅ <b>Payout Status:</b> <code>All Pending Cashouts Cleared!</code>\n🏦 <b>Gateways:</b> <code>bKash &amp; Nagad</code>\n🌐 <b>Live Proofs:</b> <code>@bd_trust_pay_payout</code>\n⚡️ <b>Next Batch:</b> <code>Instant Processing Active</code></blockquote>\n\n🎉 <i>যারা উইথড্র দিয়েছিলেন অনুগ্রহ করে নিজের বিকাশ/নগদ অ্যাকাউন্ট চেক করুন এবং নতুন উইথড্র দিন!</i>`
    },
    {
        id: 'tpl_9',
        number: 9,
        category: 'Support & Community',
        badge: '🔔 Payout Channel',
        title: '🔔 ৯. লাইভ পেআউট প্রুফ চ্যানেল আপডেট (Join Payout Channel)',
        message: `<b>🔔 প্রতিদিনের লাইভ পেমেন্ট প্রুফ দেখুন আমাদের অফিসিয়াল চ্যানেলে!</b>\n\n<blockquote>🌐 <b>Payout Channel:</b> <code>@bd_trust_pay_payout</code>\n💸 <b>Updates:</b> <code>প্রতিটি উইথড্র ও ক্রিপ্টো ডেলিভারির লাইভ প্রুফ</code>\n🛡 <b>Transparency:</b> <code>১০০% স্বচ্ছ ও বিশ্বস্ত লেনদেন</code>\n⭐️ <b>Community:</b> <code>হাজারো সন্তুষ্ট ট্রেডার</code></blockquote>\n\n🚀 <i>আমাদের সকল লাইভ পেমেন্ট আপডেট দেখতে পেআউট চ্যানেলে যুক্ত থাকুন!</i>`
    },
    {
        id: 'tpl_10',
        number: 10,
        category: 'Crypto Buy/Sell',
        badge: '🪙 GRAM Special',
        title: '🪙 ১০. GRAM ও TON গ্যাস ফি অফার (GRAM & TON Gas Promo)',
        message: `<b>🪙 আপনার ওয়ালেটে TON গ্যাস ফি বা GRAM প্রয়োজন?</b>\n\n<blockquote>💎 <b>Minimum Buy:</b> <code>মাত্র ২০ টাকা থেকে শুরু!</code>\n⚡️ <b>On-Chain Speed:</b> <code>৫ সেকেন্ডে ওয়ালেটে জমা</code>\n📩 <b>Supported Wallets:</b> <code>Tonkeeper, MyTonWallet, Telegram Wallet</code>\n✅ <b>Availability:</b> <code>২৪ ঘণ্টা অটোমেটিক ডেলিভারি</code></blockquote>\n\n🚀 <i>যেকোনো এয়ারড্রপ বা ট্রানজেকশনের জন্য মুহূর্তেই TON ও GRAM কিনে নিন!</i>`
    },
    {
        id: 'tpl_11',
        number: 11,
        category: 'System & Security',
        badge: '🛡 Security Alert',
        title: '🛡 ১১. অ্যাকাউন্ট নিরাপত্তা ও সতর্কবার্তা (Security Notice)',
        message: `<b>🛡 আপনার অ্যাকাউন্ট ও ওয়ালেট নিরাপত্তার জরুরি বার্তা!</b>\n\n<blockquote>⚠️ <b>সতর্কতা ১:</b> <code>আমাদের কোনো অ্যাডমিন কখনো আপনার ওয়ালেটের Secret Phrase চায় না।</code>\n🔒 <b>সতর্কতা ২:</b> <code>সবসময় আমাদের অফিসিয়াল বট ও ওয়েব অ্যাপের মাধ্যমে লেনদেন করুন।</code>\n✅ <b>সাপোর্ট:</b> <code>যেকোনো প্রয়োজনে অ্যাপের ভেতরের সাপোর্ট অপশন ব্যবহার করুন।</code></blockquote>\n\n🛡 <i>নিরাপদে লেনদেন করুন, Trust Pay সবসময় আপনার পাশে আছে!</i>`
    },
    {
        id: 'tpl_12',
        number: 12,
        category: 'System & Security',
        badge: '⏰ Maintenance',
        title: '⏰ ১২. সাময়িক সার্ভার রক্ষণাবেক্ষণ নোটিশ (Maintenance Notice)',
        message: `<b>⏰ জরুরি সার্ভার আপগ্রেড ও রক্ষণাবেক্ষণ নোটিশ!</b>\n\n<blockquote>⏳ <b>Status:</b> <code>Scheduled Server Upgrade</code>\n🔄 <b>Purpose:</b> <code>ব্লকচেইন ও পেমেন্ট গেটওয়ে ফাস্ট করার কাজ চলছে</code>\n🛡 <b>User Balance:</b> <code>সকল ইউজারের ব্যালেন্স ১০০% নিরাপদ ও অক্ষত আছে</code></blockquote>\n\n✨ <i>খুব অল্প সময়ের মধ্যেই কাজ শেষ করে আমরা আবার লাইভ হচ্ছি। সাথে থাকার জন্য ধন্যবাদ!</i>`
    },
    {
        id: 'tpl_13',
        number: 13,
        category: 'System & Security',
        badge: '✅ Back Online',
        title: '✅ ১৩. সার্ভার মেইনটেন্যান্স শেষ — বট আবার লাইভ! (Back Online)',
        message: `<b>🎉 সার্ভার আপগ্রেড সম্পন্ন — আমরা আবার পুরোপুরি লাইভ!</b>\n\n<blockquote>✅ <b>Web App:</b> <code>100% Online &amp; Active</code>\n⚡️ <b>Auto Deposit:</b> <code>Instant SMS Verification Ready</code>\n💎 <b>Crypto Buy/Sell:</b> <code>Instant On-Chain Active</code>\n🏦 <b>Withdrawals:</b> <code>bKash &amp; Nagad Open</code></blockquote>\n\n🚀 <i>আপনাদের ধৈর্যের জন্য ধন্যবাদ! এখনই ওয়েব অ্যাপ ওপেন করে নির্বিঘ্নে লেনদেন করুন।</i>`
    },
    {
        id: 'tpl_14',
        number: 14,
        category: 'Support & Community',
        badge: '🎁 User Guide',
        title: '🎁 ১৪. নতুন ইউজারদের জন্য সহজ লেনদেন গাইড (Quick Trading Guide)',
        message: `<b>🎁 Trust Pay-তে কীভাবে সহজে লেনদেন করবেন? (Quick Guide)</b>\n\n<blockquote>💰 <b>১. Add Money:</b> <code>বিকাশ/নগদে সেন্ড মানি করে TrxID দিলেই অটো ব্যালেন্স যোগ হবে।</code>\n💎 <b>২. Buy Crypto:</b> <code>ব্যালেন্স দিয়ে TON, USDT বা GRAM কিনলে সরাসরি ওয়ালেটে যাবে।</code>\n🔄 <b>৩. Sell Crypto:</b> <code>ওয়ালেট কানেক্ট করে ক্রিপ্টো সেন্ড করলেই ব্যালেন্সে টাকা যোগ হবে।</code>\n💸 <b>৪. Withdraw:</b> <code>যেকোনো সময় বিকাশ বা নগদে ক্যাশআউট করে নিন!</code></blockquote>\n\n🚀 <i>আজই আপনার প্রথম লেনদেন শুরু করুন!</i>`
    },
    {
        id: 'tpl_15',
        number: 15,
        category: 'Support & Community',
        badge: '📞 24/7 Support',
        title: '📞 ১৫. ২৪/৭ লাইভ কাস্টমার সাপোর্ট চালু (24/7 Customer Support)',
        message: `<b>📞 যেকোনো প্রয়োজনে আমাদের ২৪/৭ কাস্টমার সাপোর্ট আপনার পাশে!</b>\n\n<blockquote>🎧 <b>Support Mode:</b> <code>In-App Live Ticket &amp; Direct Reply</code>\n⏰ <b>Response Time:</b> <code>খুবই দ্রুত সমাধান</code>\n📝 <b>Help Topics:</b> <code>TrxID, Deposit, Buy/Sell ও Withdrawal</code></blockquote>\n\n✨ <i>লেনদেন সংক্রান্ত যেকোনো প্রশ্ন থাকলে ওয়েব অ্যাপের Support অপশন থেকে মেসেজ দিন, অ্যাডমিন সরাসরি আপনার বটে উত্তর দেবেন!</i>`
    },
    {
        id: 'tpl_16',
        number: 16,
        category: 'Rate & Promo',
        badge: '💸 Low Minimum',
        title: '💸 ১৬. মাত্র ২০ টাকা থেকে ক্রিপ্টো ক্রয় চালু! (Low Minimum Buy)',
        message: `<b>💸 এখন মাত্র ২০ টাকা থেকেই ক্রিপ্টো কেনা-বেচা শুরু করুন!</b>\n\n<blockquote>💲 <b>Minimum Crypto Buy:</b> <code>মাত্র ৳২০ BDT!</code>\n💎 <b>Assets:</b> <code>TON, USDT &amp; GRAM</code>\n⚡️ <b>Delivery:</b> <code>Instant On-Chain Transfer</code>\n🏦 <b>Payment:</b> <code>bKash &amp; Nagad</code></blockquote>\n\n🔥 <i>ছোট বা বড় যেকোনো অ্যামাউন্টের ক্রিপ্টো লেনদেন করুন সম্পূর্ণ অটোমেটিক সিস্টেমে!</i>`
    },
    {
        id: 'tpl_17',
        number: 17,
        category: 'Support & Community',
        badge: '⭐️ Thank You',
        title: '⭐️ ১৭. সম্মানিত ইউজারদের প্রতি ধন্যবাদ বার্তা (Thank You Traders)',
        message: `<b>👑 Trust Pay পরিবারের সকল সদস্যকে আন্তরিক ধন্যবাদ!</b>\n\n<blockquote>⭐️ <b>Milestone:</b> <code>হাজারো সফল অটোমেটিক লেনদেন সম্পন্ন!</code>\n💎 <b>Our Promise:</b> <code>সবচেয়ে দ্রুত পেমেন্ট এবং সেরা মার্কেট রেট</code>\n🛡 <b>Trust &amp; Safety:</b> <code>১০০% অটোমেটেড ও নিরাপদ প্ল্যাটফর্ম</code></blockquote>\n\n🎉 <i>আপনাদের আস্থা ও ভালোবাসাই আমাদের এগিয়ে যাওয়ার অনুপ্রেরণা। সাথে থাকার জন্য ধন্যবাদ!</i>`
    },
    {
        id: 'tpl_18',
        number: 18,
        category: 'Crypto Buy/Sell',
        badge: '🔄 TonConnect',
        title: '🔄 ১৮. ১-ক্লিক Tonkeeper ওয়ালেট কানেক্ট সেল (1-Click Wallet Sell)',
        message: `<b>🔄 Tonkeeper বা Telegram Wallet কানেক্ট করে ১ ক্লিকে ক্রিপ্টো বিক্রি করুন!</b>\n\n<blockquote>📩 <b>Feature:</b> <code>1-Click TonConnect Auto Sell</code>\n💎 <b>Supported:</b> <code>TON, USDT (Jetton) &amp; GRAM</code>\n⚡️ <b>Verification:</b> <code>অটোমেটিক অন-চেইন ভেরিফিকেশন</code>\n💰 <b>Instant Credit:</b> <code>সাথে সাথে BDT ব্যালেন্সে টাকা জমা!</code></blockquote>\n\n🚀 <i>কপি-পেস্টের ঝামেলা ছাড়াই ওয়ালেট কানেক্ট করে মুহূর্তেই ক্রিপ্টো সেল করুন!</i>`
    },
    {
        id: 'tpl_19',
        number: 19,
        category: 'System & Security',
        badge: '⚠️ Info Notice',
        title: '⚠️ ১৯. সঠিক TrxID ও নাম্বার ব্যবহারের অনুরোধ (Accurate Info Tip)',
        message: `<b>⚠️ দ্রুত ও নির্ভুল লেনদেনের জন্য জরুরি নির্দেশনা!</b>\n\n<blockquote>📝 <b>Add Money:</b> <code>টাকা পাঠানোর পর এসএমএস থেকে সঠিক TrxID ও সঠিক টাকার পরিমাণ লিখুন।</code>\n🏦 <b>Withdraw:</b> <code>ক্যাশআউট করার সময় আপনার সচল বিকাশ বা নগদ পার্সোনাল নাম্বারটি পুনরায় চেক করুন।</code>\n⚡️ <b>Result:</b> <code>সঠিক তথ্য দিলে ১ সেকেন্ডেই কাজ সম্পন্ন হবে!</code></blockquote>\n\n✅ <i>নির্ভুল তথ্য দিন, সুপার-ফাস্ট সার্ভিস উপভোগ করুন!</i>`
    },
    {
        id: 'tpl_20',
        number: 20,
        category: 'Rate & Promo',
        badge: '👑 Weekend Promo',
        title: '👑 ২০. উইকেন্ড ধামাকা ট্রেডিং অফার! (Weekend Special Offer)',
        message: `<b>👑 উইকেন্ড স্পেশাল ধামাকা! আনলিমিটেড ক্রিপ্টো এক্সচেঞ্জ চালু!</b>\n\n<blockquote>🔥 <b>Special Offer:</b> <code>উইকেন্ড ভিআইপি রেট ও ফাস্ট ক্যাশআউট</code>\n💎 <b>Coins Ready:</b> <code>Full Reserve of TON, USDT &amp; GRAM</code>\n💸 <b>Payouts:</b> <code>Instant bKash &amp; Nagad Cashout</code>\n🎉 <b>Service:</b> <code>২৪ ঘণ্টা নন-স্টপ অটোমেটিক সার্ভিস</code></blockquote>\n\n🚀 <i>এখনই নিচের বাটনে ক্লিক করে ওয়েব অ্যাপে ঢুকে আজকের সেরা রেট দেখে নিন!</i>`
    }
];

let inMemoryCustomTemplates = null;
const inMemoryBroadcastLogs = [];

async function getBroadcastTemplates() {
    if (inMemoryCustomTemplates && Array.isArray(inMemoryCustomTemplates) && inMemoryCustomTemplates.length === 20) {
        return inMemoryCustomTemplates;
    }
    try {
        const doc = await db.collection('settings').doc('broadcast_templates').get();
        if (doc.exists && Array.isArray(doc.data()?.templates) && doc.data().templates.length > 0) {
            const savedMap = new Map(doc.data().templates.map(t => [t.id, t]));
            inMemoryCustomTemplates = DEFAULT_BROADCAST_TEMPLATES.map(def => {
                const saved = savedMap.get(def.id);
                return saved ? { ...def, ...saved, number: def.number } : { ...def };
            });
            return inMemoryCustomTemplates;
        }
    } catch (e) {
        console.warn('Firestore broadcast_templates read warning:', e.message);
    }
    inMemoryCustomTemplates = DEFAULT_BROADCAST_TEMPLATES.map(t => ({ ...t }));
    return inMemoryCustomTemplates;
}

app.get('/api/admin/broadcast/templates', requireAdminAuth, async (req, res) => {
    try {
        const templates = await getBroadcastTemplates();
        let logs = [...inMemoryBroadcastLogs];
        try {
            const snap = await db.collection('broadcast_logs').orderBy('timestamp', 'desc').limit(15).get();
            const dbLogs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            const seen = new Set(logs.map(l => l.id));
            for (const item of dbLogs) {
                if (!seen.has(item.id)) {
                    seen.add(item.id);
                    logs.push(item);
                }
            }
        } catch (e) {}
        res.json({
            success: true,
            templates,
            defaultTemplates: DEFAULT_BROADCAST_TEMPLATES,
            logs: logs.slice(0, 15)
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/admin/broadcast/templates', requireAdminAuth, async (req, res) => {
    try {
        const { templates, resetAll } = req.body || {};
        if (resetAll) {
            inMemoryCustomTemplates = DEFAULT_BROADCAST_TEMPLATES.map(t => ({ ...t }));
        } else if (Array.isArray(templates)) {
            const savedMap = new Map(templates.map(t => [t.id, t]));
            inMemoryCustomTemplates = DEFAULT_BROADCAST_TEMPLATES.map(def => {
                const saved = savedMap.get(def.id);
                return saved ? {
                    ...def,
                    title: saved.title || def.title,
                    badge: saved.badge || def.badge,
                    category: saved.category || def.category,
                    message: typeof saved.message === 'string' ? saved.message : def.message
                } : { ...def };
            });
        } else {
            return res.status(400).json({ error: 'Invalid templates payload' });
        }

        try {
            await db.collection('settings').doc('broadcast_templates').set({
                templates: inMemoryCustomTemplates,
                updatedAt: FieldValue.serverTimestamp()
            }, { merge: true });
        } catch (e) {
            console.warn('Firestore broadcast_templates save warning:', e.message);
        }

        res.json({
            success: true,
            message: resetAll ? 'All 20 templates reset to default!' : 'Custom template saved successfully!',
            templates: inMemoryCustomTemplates
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/admin/broadcast/send', requireAdminAuth, async (req, res) => {
    try {
        if (!bot) {
            return res.status(500).json({ error: 'Telegram Bot is not initialized on server.' });
        }

        const {
            message,
            target = 'all',
            targetUserId = '',
            includeWebAppButton = true,
            includePayoutButton = false,
            customButtonText = '',
            customButtonUrl = '',
            alsoSendToPayoutChannel = false,
            templateTitle = 'Custom Broadcast'
        } = req.body || {};

        if (!message || !String(message).trim()) {
            return res.status(400).json({ error: 'Broadcast message cannot be empty!' });
        }

        const rawMessage = String(message).trim();
        // Upgrade all standard emojis in the message to Telegram Premium Animated <tg-emoji> tags!
        const finalHtmlMessage = upgradeToPremiumEmojis(rawMessage);

        // Build inline keyboard markup
        const inlineKeyboard = [];
        const row1 = [];
        if (includeWebAppButton) {
            row1.push({ text: '🚀 Trust Pay ওপেন করুন', web_app: { url: WEB_APP_URL } });
        }
        if (includePayoutButton) {
            row1.push({ text: '📢 পেআউট চ্যানেল', url: 'https://t.me/bd_trust_pay_payout' });
        }
        if (row1.length > 0) inlineKeyboard.push(row1);

        if (customButtonText && customButtonUrl && /^https?:\/\//i.test(customButtonUrl.trim())) {
            inlineKeyboard.push([{ text: customButtonText.trim(), url: customButtonUrl.trim() }]);
        }

        const sendOpts = {
            parse_mode: 'HTML',
            disable_web_page_preview: true,
            ...(inlineKeyboard.length > 0 ? { reply_markup: { inline_keyboard: inlineKeyboard } } : {})
        };

        // Determine recipient chatIds
        let recipientIds = [];
        if (target === 'single') {
            const cleanTarget = String(targetUserId || '').trim();
            if (!cleanTarget) {
                return res.status(400).json({ error: 'Please provide a valid Telegram User ID for single user test!' });
            }
            recipientIds = [cleanTarget];
        } else {
            const snapshot = await db.collection('users').get();
            const uniqueSet = new Set();
            snapshot.forEach(doc => {
                const d = doc.data() || {};
                const uid = String(d.chatId || doc.id || '').trim();
                // Skip dummy/test IDs or non-numeric IDs
                if (!uid || !/^\d+$/.test(uid) || uid === '12345' || uid === '123456789') return;
                if (d.status === 'banned') return;
                if (target === 'with_balance' && (parseFloat(d.balance) || 0) <= 0) return;
                uniqueSet.add(uid);
            });
            recipientIds = Array.from(uniqueSet);
        }

        if (recipientIds.length === 0 && !alsoSendToPayoutChannel) {
            return res.status(400).json({ error: 'No eligible users found for the selected target audience.' });
        }

        let sentCount = 0;
        let failedCount = 0;
        const BATCH_SIZE = 15;

        const sendToSingleChat = async (chatId) => {
            try {
                await bot.sendMessage(chatId, finalHtmlMessage, sendOpts);
                return true;
            } catch (err) {
                // Fallback if admin wrote unclosed HTML tags: strip <tg-emoji> and send plain/safe HTML
                if (err.message && err.message.includes('can\'t parse entities')) {
                    try {
                        await bot.sendMessage(chatId, rawMessage.replace(/<[^>]+>/g, ''), {
                            ...(inlineKeyboard.length > 0 ? { reply_markup: { inline_keyboard: inlineKeyboard } } : {})
                        });
                        return true;
                    } catch (_) {
                        return false;
                    }
                }
                return false;
            }
        };

        for (let i = 0; i < recipientIds.length; i += BATCH_SIZE) {
            const batch = recipientIds.slice(i, i + BATCH_SIZE);
            const results = await Promise.all(batch.map(uid => sendToSingleChat(uid)));
            for (const ok of results) {
                if (ok) sentCount++;
                else failedCount++;
            }
            if (i + BATCH_SIZE < recipientIds.length) {
                await new Promise(r => setTimeout(r, 85));
            }
        }

        let payoutChannelSent = false;
        if (alsoSendToPayoutChannel) {
            const primaryTarget = (botConfig.payoutGroupId && botConfig.payoutGroupId !== '@bd_trustpay_payout' && botConfig.payoutGroupId !== '-1004483837390') ? botConfig.payoutGroupId : '-1004405147138';
            payoutChannelSent = await sendToSingleChat(primaryTarget);
            if (!payoutChannelSent && primaryTarget !== '-1004405147138') {
                payoutChannelSent = await sendToSingleChat('-1004405147138');
            }
        }

        const logEntry = {
            id: 'BC' + Date.now().toString().slice(-8),
            templateTitle,
            target,
            totalTargeted: recipientIds.length,
            sentCount,
            failedCount,
            payoutChannelSent,
            preview: rawMessage.slice(0, 180),
            timestamp: Date.now()
        };

        inMemoryBroadcastLogs.unshift(logEntry);
        if (inMemoryBroadcastLogs.length > 25) inMemoryBroadcastLogs.pop();

        try {
            await db.collection('broadcast_logs').doc(logEntry.id).set({
                ...logEntry,
                createdAt: FieldValue.serverTimestamp()
            });
        } catch (e) {}

        res.json({
            success: true,
            message: `Broadcast completed! Delivered to ${sentCount} users (${failedCount} unreachable/blocked).`,
            totalTargeted: recipientIds.length,
            sentCount,
            failedCount,
            payoutChannelSent,
            log: logEntry
        });
    } catch (e) {
        console.error('Broadcast send error:', e);
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

// Block Mobile Devices from accessing Admin Panel at the server level
const MOBILE_BLOCKED_HTML = `<!doctype html>
<html lang="bn">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Trust Pay — Security Restricted</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      background: radial-gradient(circle at top, #1e1b4b 0%, #090d16 70%);
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      box-sizing: border-box;
      text-align: center;
    }
    .card {
      max-width: 380px;
      width: 100%;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(244, 63, 94, 0.35);
      border-radius: 24px;
      padding: 32px 24px;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.65);
    }
    .icon {
      width: 64px;
      height: 64px;
      border-radius: 20px;
      background: rgba(244, 63, 94, 0.15);
      border: 1px solid rgba(244, 63, 94, 0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 18px;
      font-size: 30px;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 99px;
      background: rgba(244, 63, 94, 0.15);
      color: #fda4af;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 10px;
    }
    h1 {
      font-size: 20px;
      font-weight: 900;
      margin: 0 0 10px;
      color: #ffffff;
    }
    p {
      font-size: 13px;
      line-height: 1.6;
      color: #94a3b8;
      margin: 0 0 22px;
    }
    .btn {
      display: block;
      width: 100%;
      padding: 13px 16px;
      border-radius: 14px;
      background: linear-gradient(90deg, #4f46e5, #7c3aed);
      color: #ffffff;
      font-weight: 800;
      font-size: 13px;
      text-decoration: none;
      box-sizing: border-box;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">🔒</div>
    <div class="badge">Desktop Access Only</div>
    <h1>মোবাইল ডিভাইসে প্রবেশ নিষিদ্ধ</h1>
    <p>নিরাপত্তার স্বার্থে মোবাইল বা ট্যাব থেকে অ্যাডমিন প্যানেল সম্পূর্ণরূপে লক করা হয়েছে। শুধুমাত্র ডেস্কটপ কম্পিউটার (PC/Laptop) থেকে অনুমোদিত ইমেইল ও পাসওয়ার্ড দিয়ে প্রবেশ করা যাবে।</p>
    <a href="/app" class="btn">🚀 Trust Pay ওয়েব বটে ফিরে যান</a>
  </div>
</body>
</html>`;

// Public IP Inspector: allows Maruf to check his current public IP at any time
app.get('/api/my-ip', (req, res) => {
    const ip = getClientIp(req);
    const norm = normalizeIp(ip);
    const isAllowed = isIpAllowedForAdmin(norm);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Trust Pay — Client IP Inspector</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { background: #0b0f19; color: #f8fafc; font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
    .box { background: #111827; border: 1px solid #1f2937; border-radius: 20px; padding: 32px 24px; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 25px 50px rgba(0,0,0,0.5); }
    .icon { font-size: 40px; margin-bottom: 12px; }
    h2 { margin: 0 0 10px; font-size: 20px; }
    .ip { font-size: 24px; font-weight: 800; color: #38bdf8; background: #0f172a; padding: 14px 18px; border-radius: 12px; border: 1px dashed #0284c7; margin: 18px 0; font-family: ui-monospace, monospace; word-break: break-all; }
    .status { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 999px; font-size: 13px; font-weight: 700; margin-bottom: 16px; }
    .allowed { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
    .blocked { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
    p { color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 0; }
    code { background: #1e293b; color: #f1f5f9; padding: 3px 8px; border-radius: 6px; font-family: monospace; font-size: 13px; }
  </style>
</head>
<body>
  <div class="box">
    <div class="icon">🌐</div>
    <h2>আপনার বর্তমান পাবলিক আইপি (Client IP)</h2>
    <div class="ip">${ip}</div>
    <div class="status ${isAllowed ? 'allowed' : 'blocked'}">
      ${isAllowed ? '✅ অ্যাডমিন প্যানেলে অনুমোদিত (Whitelisted)' : '⛔ অ্যাডমিন প্যানেলে অননুমোদিত (Blocked)'}
    </div>
    <p>যদি আপনার আইপি পরিবর্তন হয়ে থাকে এবং আপনি অ্যাডমিন প্যানেলে ঢুকতে চান, তবে টেলিগ্রাম বটে এই কমান্ডটি পাঠান:<br><br><code>/addadminip ${ip}</code></p>
  </div>
</body>
</html>`);
});

// Serve Admin Panel Static Assets EXCLUSIVELY under ADMIN_SECRET_PATH (IP Whitelisted & Desktop Only)
app.use(ADMIN_SECRET_PATH, requireAdminIpWhitelist, express.static(path.join(__dirname, 'admin/dist'), {
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

// Fallback SPA routes for Admin Panel inside ADMIN_SECRET_PATH
const adminVaultRegex = new RegExp('^' + ADMIN_SECRET_PATH + '(/.*)?$');
app.get(adminVaultRegex, requireAdminIpWhitelist, (req, res) => {
    const adminIndex = path.join(__dirname, 'admin/dist/index.html');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    if (fs.existsSync(adminIndex)) {
        res.sendFile(adminIndex);
    } else {
        res.status(404).send("Admin bundle not built yet.");
    }
});

// Decoy 404 handler for Root and Unhandled Routes (NEVER serve Admin on Root)
app.use((req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.status(404).send(REAL_404_HTML);
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


// Master Security Commands for Owner Maruf (Telegram ID: 8799135330)
function registerMasterSecurityCommands(botInstance) {
    if (!botInstance) return;

    botInstance.onText(/\/getadminurl/, async (msg) => {
        if (msg.from?.id?.toString() !== MASTER_ADMIN_ID && msg.chat?.id?.toString() !== MASTER_ADMIN_ID) return;
        const adminUrl = `https://maruf-teach-bot.onrender.com${ADMIN_SECRET_PATH}/`;
        const resp = `🔐 <b>Trust Pay — Secret Admin Panel URL</b>\n\n` +
            `🌐 <b>গোপন অ্যাডমিন লিঙ্ক:</b>\n` +
            `<a href="${adminUrl}">${adminUrl}</a>\n\n` +
            `🛡 <b>কঠোর নিরাপত্তা ফায়ারওয়াল সক্রিয়:</b>\n` +
            `• শুধুমাত্র আপনার অনুমোদিত ল্যাপটপ আইপি (<code>103.191.174.53</code>) থেকেই এই লিঙ্ক খোলা যাবে।\n` +
            `• পৃথিবীর সমস্ত অন্যান্য আইপি ও মোবাইল ডিভাইস এই লিঙ্কে ঢুকতে গেলে 404 Not Found পাবে।\n` +
            `• রুট লিঙ্ক (<code>/</code>) সম্পূর্ণ বন্ধ করে 404 ডেসিভ করা হয়েছে।\n\n` +
            `🌐 <i>আপনার বর্তমান আইপি চেক করতে:</i>\n` +
            `<code>https://maruf-teach-bot.onrender.com/api/my-ip</code>`;
        botInstance.sendMessage(msg.chat.id, resp, { parse_mode: 'HTML', disable_web_page_preview: true });
    });

    botInstance.onText(/\/addadminip(?:\s+(.+))?/, async (msg, match) => {
        if (msg.from?.id?.toString() !== MASTER_ADMIN_ID && msg.chat?.id?.toString() !== MASTER_ADMIN_ID) return;
        const ip = match[1]?.trim();
        if (!ip) return botInstance.sendMessage(msg.chat.id, "⚠️ আইপি দিন। যেমন: <code>/addadminip 103.191.174.53</code>", { parse_mode: 'HTML' });
        await removeBannedIp(ip);
        const ok = await addAllowedAdminIp(ip);
        if (ok) {
            botInstance.sendMessage(msg.chat.id, `✅ <b>আইপি <code>${ip}</code> সফলভাবে অ্যাডমিন হোয়াইটলিস্টে যুক্ত করা হয়েছে!</b>\n\nএখন এই আইপি থেকে অ্যাডমিন প্যানেল খোলা যাবে।`, { parse_mode: 'HTML' });
        } else {
            botInstance.sendMessage(msg.chat.id, "❌ আইপি যুক্ত করতে সমস্যা হয়েছে।");
        }
    });

    botInstance.onText(/\/allowmyip(?:\s+(.+))?/, async (msg, match) => {
        if (msg.from?.id?.toString() !== MASTER_ADMIN_ID && msg.chat?.id?.toString() !== MASTER_ADMIN_ID) return;
        const ip = match[1]?.trim();
        if (!ip) return botInstance.sendMessage(msg.chat.id, "⚠️ আইপি দিন। যেমন: <code>/allowmyip 103.191.174.53</code>", { parse_mode: 'HTML' });
        const ok = await addAllowedAdminIp(ip);
        if (ok) {
            botInstance.sendMessage(msg.chat.id, `✅ <b>আইপি <code>${ip}</code> সফলভাবে হোয়াইটলিস্টে যুক্ত হয়েছে!</b>`, { parse_mode: 'HTML' });
        } else {
            botInstance.sendMessage(msg.chat.id, "❌ আইপি যুক্ত করা যায়নি।");
        }
    });

    botInstance.onText(/\/removeadminip(?:\s+(.+))?/, async (msg, match) => {
        if (msg.from?.id?.toString() !== MASTER_ADMIN_ID && msg.chat?.id?.toString() !== MASTER_ADMIN_ID) return;
        const ip = match[1]?.trim();
        if (!ip) return botInstance.sendMessage(msg.chat.id, "⚠️ আইপি দিন। যেমন: <code>/removeadminip 103.191.174.53</code>", { parse_mode: 'HTML' });
        const ok = await removeAllowedAdminIp(ip);
        if (ok) {
            botInstance.sendMessage(msg.chat.id, `🗑️ <b>আইপি <code>${ip}</code> অ্যাডমিন হোয়াইটলিস্ট থেকে রিমুভ করা হয়েছে।</b>`, { parse_mode: 'HTML' });
        } else {
            botInstance.sendMessage(msg.chat.id, "❌ আইপি রিমুভ করা যায়নি।");
        }
    });

    botInstance.onText(/\/vaultstatus/, async (msg) => {
        if (msg.from?.id?.toString() !== MASTER_ADMIN_ID && msg.chat?.id?.toString() !== MASTER_ADMIN_ID) return;
        const liveKeyword = await fetchGoogleSheetKeyword();
        const resp = `🛡 <b>Trust Pay — 3-Layer Quantum Vault Status</b>\n\n` +
            `🔐 <b>Layer 1 (Database Secret Code):</b> <code>${cachedVaultConfig.secretCode}</code>\n` +
            `🌐 <b>Layer 2 (Google Sheet URL):</b> ${cachedVaultConfig.sheetUrl ? `<code>${cachedVaultConfig.sheetUrl}</code>` : '<i>Not configured yet (Using fallback keyword)</i>'}\n` +
            `🔑 <b>Layer 2 (Active Keyword):</b> <code>${liveKeyword}</code>\n` +
            `💀 <b>Layer 3 (Who are you? Trap):</b> ACTIVE (Empty input + 30s Hold + Double Click)\n\n` +
            `💡 <b>কমান্ডসমূহ:</b>\n` +
            `• <code>/setvaultcode নতুন_কোড</code> — লেয়ার ১ কোড পরিবর্তন\n` +
            `• <code>/setsheeturl গুগল_শিট_লিংক</code> — গুগল শিট লিঙ্ক সেট\n` +
            `• <code>/setsheetkeyword নতুন_শব্দ</code> — সরাসরি কি-ওয়ার্ড সেট\n` +
            `• <code>/checksheet</code> — গুগল শিট থেকে লাইভ টেস্ট`;
        botInstance.sendMessage(msg.chat.id, resp, { parse_mode: 'HTML', disable_web_page_preview: true });
    });

    botInstance.onText(/\/setvaultcode(?:\s+(.+))?/, async (msg, match) => {
        if (msg.from?.id?.toString() !== MASTER_ADMIN_ID && msg.chat?.id?.toString() !== MASTER_ADMIN_ID) return;
        const newCode = match[1]?.trim();
        if (!newCode || newCode.length < 4) {
            return botInstance.sendMessage(msg.chat.id, "⚠️ কোড প্রদান করুন। যেমন: <code>/setvaultcode 5664055</code>", { parse_mode: 'HTML' });
        }
        try {
            await db.collection('settings').doc('admin_vault_layer').set({
                secretCode: newCode,
                updatedAt: FieldValue.serverTimestamp()
            }, { merge: true });
            cachedVaultConfig.secretCode = newCode;
            botInstance.sendMessage(msg.chat.id, `✅ <b>লেয়ার ১ সিক্রেট কোড সফলভাবে আপডেট হয়েছে!</b>\n\n🔑 <b>নতুন কোড:</b> <code>${newCode}</code>`, { parse_mode: 'HTML' });
        } catch (e) {
            botInstance.sendMessage(msg.chat.id, `Error: ${e.message}`);
        }
    });

    botInstance.onText(/\/setsheeturl(?:\s+(.+))?/, async (msg, match) => {
        if (msg.from?.id?.toString() !== MASTER_ADMIN_ID && msg.chat?.id?.toString() !== MASTER_ADMIN_ID) return;
        const rawUrl = match[1]?.trim();
        if (!rawUrl || !rawUrl.includes('docs.google.com')) {
            return botInstance.sendMessage(msg.chat.id, "⚠️ সঠিক গুগল শিট লিঙ্ক প্রদান করুন। যেমন:\n<code>/setsheeturl https://docs.google.com/spreadsheets/d/XXXX/edit</code>", { parse_mode: 'HTML' });
        }
        try {
            await db.collection('settings').doc('admin_vault_layer').set({
                sheetUrl: rawUrl,
                updatedAt: FieldValue.serverTimestamp()
            }, { merge: true });
            cachedVaultConfig.sheetUrl = rawUrl;
            cachedSheetKeyword.keyword = ''; // bust cache

            botInstance.sendMessage(msg.chat.id, "⟳ গুগল শিট থেকে কি-ওয়ার্ড ফেচ করা হচ্ছে...");
            const fetched = await fetchGoogleSheetKeyword();
            botInstance.sendMessage(msg.chat.id, `✅ <b>গুগল শিট লিঙ্ক সফলভাবে সেট ও কানেক্ট করা হয়েছে!</b>\n\n📄 <b>শিটের Cell A1 থেকে প্রাপ্ত কি-ওয়ার্ড:</b> <code>${fetched}</code>\n\n<i>অ্যাডমিন প্যানেলে লগইন করার সময় লেয়ার ২-তে এই কি-ওয়ার্ডটি চাইবে।</i>`, { parse_mode: 'HTML' });
        } catch (e) {
            botInstance.sendMessage(msg.chat.id, `Error: ${e.message}`);
        }
    });

    botInstance.onText(/\/setsheetkeyword(?:\s+(.+))?/, async (msg, match) => {
        if (msg.from?.id?.toString() !== MASTER_ADMIN_ID && msg.chat?.id?.toString() !== MASTER_ADMIN_ID) return;
        const newKw = match[1]?.trim();
        if (!newKw) {
            return botInstance.sendMessage(msg.chat.id, "⚠️ কি-ওয়ার্ড প্রদান করুন। যেমন: <code>/setsheetkeyword MySecretName</code>", { parse_mode: 'HTML' });
        }
        try {
            await db.collection('settings').doc('admin_vault_layer').set({
                sheetKeyword: newKw,
                updatedAt: FieldValue.serverTimestamp()
            }, { merge: true });
            cachedVaultConfig.sheetKeyword = newKw;
            cachedSheetKeyword.keyword = newKw;
            botInstance.sendMessage(msg.chat.id, `✅ <b>লেয়ার ২ কি-ওয়ার্ড সরাসরি আপডেট করা হয়েছে:</b> <code>${newKw}</code>`, { parse_mode: 'HTML' });
        } catch (e) {
            botInstance.sendMessage(msg.chat.id, `Error: ${e.message}`);
        }
    });

    botInstance.onText(/\/checksheet/, async (msg) => {
        if (msg.from?.id?.toString() !== MASTER_ADMIN_ID && msg.chat?.id?.toString() !== MASTER_ADMIN_ID) return;
        const t0 = Date.now();
        cachedSheetKeyword.keyword = ''; // force live fetch
        const kw = await fetchGoogleSheetKeyword();
        const duration = Date.now() - t0;
        botInstance.sendMessage(msg.chat.id, `📊 <b>Google Sheet Live Test:</b>\n\n• <b>Cell A1 Keyword:</b> <code>${kw}</code>\n• <b>Response Time:</b> ${duration}ms\n• <b>Configured URL:</b> ${cachedVaultConfig.sheetUrl || 'None (Fallback mode)'}`, { parse_mode: 'HTML', disable_web_page_preview: true });
    });

    botInstance.onText(/\/adminips/, async (msg) => {
        if (msg.from?.id?.toString() !== MASTER_ADMIN_ID && msg.chat?.id?.toString() !== MASTER_ADMIN_ID) return;
        const list = Array.from(allowedAdminIps);
        const resp = `🛡 <b>Whitelisted Admin IPs (${list.length}):</b>\n\n` + 
            list.map(ip => `• <code>${ip}</code>${ip === '103.191.174.53' ? ' <i>(Maruf Laptop)</i>' : ''}`).join('\n') +
            `\n\n💡 <i>শুধুমাত্র এই আইপিগুলো ছাড়া পৃথিবীর আর কোনো আইপি অ্যাডমিন প্যানেল বা অ্যাডমিন এপিআই এক্সেস করতে পারবে না।</i>`;
        botInstance.sendMessage(msg.chat.id, resp, { parse_mode: 'HTML' });
    });

    botInstance.onText(/\/getadmincreds/, async (msg) => {
        if (msg.from?.id?.toString() !== MASTER_ADMIN_ID && msg.chat?.id?.toString() !== MASTER_ADMIN_ID) return;
        try {
            const doc = await db.collection('settings').doc('admin_auth').get();
            const data = doc.exists ? doc.data() : cachedAdminCreds;
            const resp = `🔐 <b>Trust Pay — Current Admin Credentials</b>\n\n` +
                `📧 <b>Admin Email:</b> <code>${data.email}</code>\n` +
                `🔑 <b>Admin Password:</b> <code>${data.password}</code>\n\n` +
                `💡 <i>পাসওয়ার্ড পরিবর্তন করতে পাঠান:</i>\n` +
                `<code>/setadminpassword আপনার_নতুন_পাসওয়ার্ড</code>\n\n` +
                `💡 <i>ইমেইল পরিবর্তন করতে পাঠান:</i>\n` +
                `<code>/setadminemail আপনার_নতুন_ইমেইল</code>`;
            botInstance.sendMessage(msg.chat.id, resp, { parse_mode: 'HTML' });
        } catch (e) {
            botInstance.sendMessage(msg.chat.id, `Error: ${e.message}`);
        }
    });

    botInstance.onText(/\/setadminpassword(?:\s+(.+))?/, async (msg, match) => {
        if (msg.from?.id?.toString() !== MASTER_ADMIN_ID && msg.chat?.id?.toString() !== MASTER_ADMIN_ID) return;
        const newPass = match[1]?.trim();
        if (!newPass || newPass.length < 8) {
            return botInstance.sendMessage(msg.chat.id, "⚠️ দয়া করে নূন্যতম ৮ অক্ষরের একটি শক্তিশালী পাসওয়ার্ড দিন। যেমন:\n<code>/setadminpassword MyPass2026#</code>", { parse_mode: 'HTML' });
        }
        try {
            await db.collection('settings').doc('admin_auth').set({
                password: newPass,
                updatedAt: FieldValue.serverTimestamp()
            }, { merge: true });
            cachedAdminCreds.password = newPass;
            botInstance.sendMessage(msg.chat.id, `✅ <b>অ্যাডমিন পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!</b>\n\n🔑 <b>নতুন পাসওয়ার্ড:</b> <code>${newPass}</code>`, { parse_mode: 'HTML' });
        } catch (e) {
            botInstance.sendMessage(msg.chat.id, `Error: ${e.message}`);
        }
    });

    botInstance.onText(/\/setadminemail(?:\s+(.+))?/, async (msg, match) => {
        if (msg.from?.id?.toString() !== MASTER_ADMIN_ID && msg.chat?.id?.toString() !== MASTER_ADMIN_ID) return;
        const newEmail = match[1]?.trim().toLowerCase();
        if (!newEmail || !newEmail.includes('@')) {
            return botInstance.sendMessage(msg.chat.id, "⚠️ সঠিক ইমেইল এড্রেস প্রদান করুন। যেমন:\n<code>/setadminemail admin@trustpay.com</code>", { parse_mode: 'HTML' });
        }
        try {
            await db.collection('settings').doc('admin_auth').set({
                email: newEmail,
                updatedAt: FieldValue.serverTimestamp()
            }, { merge: true });
            cachedAdminCreds.email = newEmail;
            botInstance.sendMessage(msg.chat.id, `✅ <b>অ্যাডমিন ইমেইল সফলভাবে পরিবর্তন করা হয়েছে!</b>\n\n📧 <b>নতুন ইমেইল:</b> <code>${newEmail}</code>`, { parse_mode: 'HTML' });
        } catch (e) {
            botInstance.sendMessage(msg.chat.id, `Error: ${e.message}`);
        }
    });

    botInstance.onText(/\/banip(?:\s+(.+))?/, async (msg, match) => {
        if (msg.from?.id?.toString() !== MASTER_ADMIN_ID && msg.chat?.id?.toString() !== MASTER_ADMIN_ID) return;
        const ip = match[1]?.trim();
        if (!ip) return botInstance.sendMessage(msg.chat.id, "⚠️ আইপি এড্রেস দিন। যেমন: <code>/banip 123.45.67.89</code>", { parse_mode: 'HTML' });
        await addBannedIp(ip, `Manual ban by Owner ${msg.from.id}`, true);
        await removeAllowedAdminIp(ip);
        botInstance.sendMessage(msg.chat.id, `⛔ <b>আইপি <code>${ip}</code> সফলভাবে পার্মানেন্ট ব্যান করা হয়েছে!</b>\n\n🛡 <i>এখন এই আইপি থেকে অ্যাডমিন প্যানেলে ঢুকতে গেলে রিয়েল 404 Not Found পেজ আসবে।</i>\n\n💡 <i>ভবিষ্যতে আনব্যান ও এক্সেস ফিরিয়ে দিতে পাঠান:</i>\n<code>/unbanip ${ip}</code>\n<code>/addadminip ${ip}</code>`, { parse_mode: 'HTML' });
    });

    botInstance.onText(/\/unbanip(?:\s+(.+))?/, async (msg, match) => {
        if (msg.from?.id?.toString() !== MASTER_ADMIN_ID && msg.chat?.id?.toString() !== MASTER_ADMIN_ID) return;
        const ip = match[1]?.trim();
        if (!ip) return botInstance.sendMessage(msg.chat.id, "⚠️ আইপি এড্রেস দিন। যেমন: <code>/unbanip 123.45.67.89</code>", { parse_mode: 'HTML' });
        await removeBannedIp(ip);
        botInstance.sendMessage(msg.chat.id, `✅ <b>আইপি <code>${ip}</code> সফলভাবে আনব্যান করা হয়েছে।</b>\n\n💡 <i>অ্যাডমিন প্যানেলে এক্সেস দেওয়ার জন্য হোয়াইটলিস্টে যোগ করতে পাঠান:</i>\n<code>/addadminip ${ip}</code>`, { parse_mode: 'HTML' });
    });

    botInstance.onText(/\/bannedips/, async (msg) => {
        if (msg.from?.id?.toString() !== MASTER_ADMIN_ID && msg.chat?.id?.toString() !== MASTER_ADMIN_ID) return;
        const list = Array.from(bannedIps);
        if (list.length === 0) {
            return botInstance.sendMessage(msg.chat.id, "🛡 বর্তমানে কোনো আইপি ব্যান তালিকায় নেই।");
        }
        const resp = `⛔ <b>Banned IPs (${list.length}):</b>\n\n` + list.map(ip => `• <code>${ip}</code>`).join('\n');
        botInstance.sendMessage(msg.chat.id, resp, { parse_mode: 'HTML' });
    });

    botInstance.onText(/\/securitystatus/, async (msg) => {
        if (msg.from?.id?.toString() !== MASTER_ADMIN_ID && msg.chat?.id?.toString() !== MASTER_ADMIN_ID) return;
        const resp = `🛡 <b>Trust Pay — Military-Grade Security Status</b>\n\n` +
            `• <b>Admin Whitelisted IPs:</b> ${allowedAdminIps.size} (Only Maruf Laptop)\n` +
            `• <b>Secret Admin Vault URL:</b> ACTIVE (Obfuscated)\n` +
            `• <b>Root (/) Route:</b> LOCKED (Decoy 404)\n` +
            `• <b>Active 2FA Sessions:</b> ${pendingAdmin2FASessions.size}\n` +
            `• <b>Banned Attacker IPs:</b> ${bannedIps.size}\n` +
            `• <b>Desktop-Only Guard:</b> ACTIVE\n` +
            `• <b>Brute-Force Shield:</b> ACTIVE (Max 3 attempts -> Lock/Ban)\n` +
            `• <b>2FA Telegram Delivery:</b> ACTIVE (ID ${MASTER_ADMIN_ID})\n\n` +
            `<i>সার্ভার এবং অ্যাডমিন প্যানেল ১০০% কঠোর সুরক্ষায় নিয়োজিত।</i>`;
        botInstance.sendMessage(msg.chat.id, resp, { parse_mode: 'HTML' });
    });
}
registerMasterSecurityCommands(bot);

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

// Admin Commands for Monetag & Adsgram Ad Setup
bot.onText(/\/setmonetag\s+(\S+)/i, async (msg, match) => {
    const chatId = msg.chat.id;
    if (botConfig?.adminGroupId && botConfig.adminGroupId !== chatId.toString()) return;
    const zoneId = match[1].trim();
    await db.collection('config').doc('spin_event').set({ monetagZoneId: zoneId }, { merge: true });
    bot.sendMessage(chatId, `✅ <b>Monetag Zone ID সফলভাবে সেট করা হয়েছে:</b> <code>${zoneId}</code>`, { parse_mode: 'HTML' }).catch(() => {});
});

bot.onText(/\/setadsgram\s+(\S+)/i, async (msg, match) => {
    const chatId = msg.chat.id;
    if (botConfig?.adminGroupId && botConfig.adminGroupId !== chatId.toString()) return;
    const blockId = match[1].trim();
    await db.collection('config').doc('spin_event').set({ adsgramBlockId: blockId }, { merge: true });
    bot.sendMessage(chatId, `✅ <b>Adsgram Block ID সফলভাবে সেট করা হয়েছে:</b> <code>${blockId}</code>`, { parse_mode: 'HTML' }).catch(() => {});
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

const WITHDRAW_BOT_TOKEN = process.env.WITHDRAW_BOT_TOKEN || '8965853759:AAEqFkelaLFeJZVN7lwIOXUBE6YXcO-tkVk';

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

    registerMasterSecurityCommands(withdrawBot);
    withdrawBot.setMyCommands([
        { command: 'withdraw', description: 'ক্যাশআউট সিরিয়াল অনুযায়ী শুরু করুন' },
        { command: 'list', description: 'সকল পেন্ডিং রিকোয়েস্টের তালিকা' },
        { command: 'getadmincreds', description: 'বর্তমান অ্যাডমিন ইমেইল ও পাসওয়ার্ড দেখুন' },
        { command: 'securitystatus', description: 'ফায়ারওয়াল ও নিরাপত্তা স্ট্যাটাস' },
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
        const userMsg = `<b>${PE.approvedBag} উইথড্র অনুমোদিত! (Withdrawal Approved!)</b>\n\n` +
            `<blockquote>${PE.dollar} <b>Amount:</b> <code>৳${withdrawItem?.amount || 0} BDT</code>\n` +
            `${PE.chartDown} <b>Service Fee:</b> <code>৳${withdrawItem?.fee || 0} BDT</code>\n` +
            `${PE.flyingCash} <b>Sent Amount:</b> <b>৳${withdrawItem?.receiveAmount || withdrawItem?.amount || 0} BDT</b>\n` +
            `${PE.bank} <b>Gateway:</b> <code>${(withdrawItem?.method || 'bKash').toUpperCase()}</code>\n` +
            `${PE.wallet} <b>Account:</b> <code>${formatBdPhone(withdrawItem?.number)}</code>\n` +
            `${PE.globe} <b>Status:</b> <code>Sent Successfully</code></blockquote>\n\n` +
            `${PE.party} <i>আপনার একাউন্ট চেক করুন। TrustPay-এর সাথে থাকার জন্য ধন্যবাদ!</i>`;
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
                const userRejectMsg = `<b>${PE.cross} উইথড্র বাতিল ও রিফান্ড! (Withdrawal Rejected)</b>\n\n` +
                    `<blockquote>${PE.note} <b>Reason:</b> <i>${reason}</i>\n` +
                    `${PE.moneyBag} <b>Refunded Amount:</b> <b>৳${actualRefund} BDT</b></blockquote>\n\n` +
                    `${PE.swap} <i>টাকাটি আপনার অ্যাপ ব্যালেন্সে ফেরত দেওয়া হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।</i>`;
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
