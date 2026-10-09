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
    adminGroupId: ''
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


const token = process.env.BOT_TOKEN;
const channelUsername = process.env.CHANNEL_USERNAME;
const bkashNumber = process.env.BKASH_NUMBER;
const botEvmAddress = process.env.BOT_EVM_ADDRESS || process.env.BEP20_ADDRESS;
const adminUsername = "maruff666";

const bot = new TelegramBot(token, { polling: true });
const { beginCell, Address } = require('@ton/core');
const app = express();
const cors = require('cors');
app.use(cors());
app.use(express.json());
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const userStates = {}; 

const t = {
    en: {
        welcome: '🌟 **Welcome to the Official Rewards Platform!**\n\nTo access your wallet, complete tasks, and withdraw funds, please join our official Telegram channel first.\n\n👇 Click below to join and verify your account:',
        joinBtn: '📢 Join Channel',
        verifyBtn: '✅ Verify',
        notJoined: '❌ You have not joined the channel yet!',
        langPrompt: '✅ **Verification Successful!**\n\nPlease select your language:',
        profileMsg: '👤 **Your Profile**\n\nID: {id}',
        bkashMsg: '🚀 **bKash Payment**',
        cryptoMsg: '💎 **Crypto Payment**',
        menu: { free: '🎁 Free', profile: '👤 Profile' },
        mainMenuMsg: "🎉 **Verification Successful!**\n\nWelcome to our platform.\n👇 **Click the button below to open the app:**"
    },
    bn: {
        welcome: '🌟 **অফিসিয়াল রিওয়ার্ডস প্ল্যাটফর্মে আপনাকে স্বাগতম!**\n\nআপনার ওয়ালেট অ্যাক্সেস করতে, টাস্ক কমপ্লিট করতে এবং পেমেন্ট তুলতে, অনুগ্রহ করে প্রথমে আমাদের অফিসিয়াল টেলিগ্রাম চ্যানেলে যুক্ত হোন।\n\n👇 জয়েন করে আপনার অ্যাকাউন্ট ভেরিফাই করুন:',
        joinBtn: '📢 চ্যানেল জয়েন করুন',
        verifyBtn: '✅ ভেরিফাই করুন',
        notJoined: '❌ আপনি এখনও চ্যানেলে জয়েন করেননি!',
        langPrompt: '✅ **ভেরিফিকেশন সফল হয়েছে!**\n\nআপনার ভাষা নির্বাচন করুন:',
        profileMsg: '👤 **আপনার প্রোফাইল**\n\nআইডি: {id}',
        bkashMsg: '🚀 **বিকাশ পেমেন্ট**',
        cryptoMsg: '💎 **ক্রিপ্টো পেমেন্ট**',
        menu: { free: '🎁 ফ্রি (Free)', profile: '👤 আমার প্রোফাইল' },
        mainMenuMsg: "🎉 **ভেরিফিকেশন সফল হয়েছে!**\n\nআপনাকে আমাদের প্ল্যাটফর্মে স্বাগতম।\n👇 **নিচের বোতামে ক্লিক করে অ্যাপটি ওপেন করুন:**"
    }
};

function getMenu(lang) {
    const m = t[lang].menu;
    return {
        reply_markup: {
            keyboard: [ [ { text: m.free }, { text: m.profile } ] ],
            resize_keyboard: true
        }
    };
}

bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const username = msg.from.username || "Unknown";
    const firstName = msg.from.first_name || "";
    
    // Save user to Firebase
    await db.collection('users').doc(chatId.toString()).set({
        chatId: chatId,
        username: username,
        firstName: firstName,
        joinedAt: new Date(),
        status: 'pending_verification',
        totalPayouts: 0
    }, { merge: true });

    userStates[chatId] = { step: 'start', failedAttempts: 0, lang: 'en' };
    
    const opts = {
        reply_markup: {
            inline_keyboard: [
                [{ text: t.en.joinBtn, url: `https://t.me/${channelUsername.replace('@', '')}` }],
                [{ text: t.en.verifyBtn, callback_data: 'verify_join' }]
            ]
        }
    };
    bot.sendMessage(chatId, t.en.welcome, opts).catch(e => console.error(e.message));
});

bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    if (!userStates[chatId]) userStates[chatId] = { step: 'menu', failedAttempts: 0, lang: 'en' };
    const lang = userStates[chatId].lang;

    if (query.data === 'retry_free_payout') {
        userStates[chatId] = { step: 'awaiting_ton_address_free' };
        bot.sendMessage(chatId, '✅ Please send your TON address again:').catch(e => console.error(e.message));
        return;
    }

    if (query.data === 'verify_join') {
        try {
            const chatMember = await bot.getChatMember(channelUsername, userId);
            if (chatMember.status === 'member' || chatMember.status === 'administrator' || chatMember.status === 'creator') {
                
                await db.collection('users').doc(chatId.toString()).update({ status: 'verified', language: 'bn' }); // Default to BN
                if (userStates[chatId]) userStates[chatId].lang = 'bn';
                
                // 1. Remove the old inline keyboard from the /start message
                bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: chatId, message_id: query.message.message_id }).catch(()=>{});

                // 2. Clear old persistent keyboard with a silent fast-deleting message
                bot.sendMessage(chatId, "...", { reply_markup: { remove_keyboard: true } }).catch(e => console.error(e.message)).then(delMsg => {
                    setTimeout(() => bot.deleteMessage(chatId, delMsg.message_id).catch(()=>{}), 100);
                }).catch(()=>{});

                // 3. Send ONE combined nice welcome message with the Open App button attached
                const msgText = "🎉 **ভেরিফিকেশন সফল হয়েছে!**\n\nআপনাকে আমাদের প্ল্যাটফর্মে স্বাগতম।\n👇 **নিচের বোতামে ক্লিক করে অ্যাপটি ওপেন করুন:**";
                bot.sendMessage(chatId, msgText, {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [ { text: '🚀 অ্যাপ ওপেন করুন (Open App)', web_app: { url: 'https://maruf-teach-bot.onrender.com/app/' } } ]
                        ]
                    }
                }).catch(e => console.error(e.message));
                
            } else {
                bot.answerCallbackQuery(query.id, { text: t.en.notJoined, show_alert: true });
            }
        } catch (error) {
            bot.answerCallbackQuery(query.id, { text: t.en.notJoined, show_alert: true });
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

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text ? msg.text.trim() : '';

    // Maintenance block removed

    
    if (msg.chat.type === 'group' || msg.chat.type === 'supergroup') {
        if (text === '/setgroup') {
            const config = botConfig;
            await saveConfig({ adminGroupId: chatId.toString() });
            bot.sendMessage(chatId, '✅ Admin group set successfully!').catch(e => console.error(e.message));
            return;
        }

        const config = botConfig;
        
// Handle Admin Manual Verification Reply
        if (config.adminGroupId === chatId.toString() && msg.reply_to_message && text) {
            const replyText = text.toLowerCase().trim();
            const caption = msg.reply_to_message.caption || msg.reply_to_message.text || '';
            
                // --- MINI APP TASK REPLY LOGIC ---
                
                // --- FIAT WITHDRAWAL LOGIC ---
                if (caption.includes("New Fiat Withdrawal")) {
                    const idMatch = caption.match(/ID: (\d+)/);
                    if (idMatch && idMatch[1]) {
                        const targetUserId = idMatch[1];
                        
                        if (['done', 'ok'].includes(replyText)) {
                            const uRef = db.collection('users').doc(targetUserId);
                            const uDoc = await uRef.get();
                            if (uDoc.exists && uDoc.data().fiatWithdrawPending) {
                                await uRef.update({
                                    'fiatWithdrawPending.status': 'completed',
                                    'fiatWithdrawPending.completedAt': Date.now()
                                });
                            }
                            bot.sendMessage(chatId, `✅ Marked withdrawal for ${targetUserId} as PAID.`).catch(e => console.error(e.message));
                            bot.sendMessage(targetUserId, `✅ <b>Withdrawal Successful!</b>\nYour payment has been sent to your wallet. Thank you!`, { parse_mode: 'HTML' }).catch(e => console.error(e.message));
                        } 
                        else if (replyText === 'wt' || replyText === 'wait') {
                            await bot.sendMessage(chatId, `⏱ Reply to THIS message with the time format.\n\nMinutes: <code>10:00</code>\nHours: <code>1:30:50</code>\n\nUser ID: ${targetUserId}`, { parse_mode: 'HTML' }).catch(e => console.error(e.message));
                        }
                        else if (replyText.startsWith('reject')) {
                            const reason = text.substring(6).trim() || 'No reason provided';
                            const userRef = db.collection('users').doc(targetUserId);
                            const userDoc = await userRef.get();
                            if (userDoc.exists && userDoc.data().fiatWithdrawPending) {
                                const amountToRefund = userDoc.data().fiatWithdrawPending.amount;
                                await userRef.update({
                                    balance: (userDoc.data().balance || 0) + amountToRefund,
                                    fiatWithdrawPending: null
                                });
                                bot.sendMessage(chatId, `❌ Rejected withdrawal for ${targetUserId} and refunded ${amountToRefund} BDT.\nReason: ${reason}`).catch(e => console.error(e.message));
                                bot.sendMessage(targetUserId, `❌ <b>Withdrawal Rejected</b>\nYour ${amountToRefund} BDT has been refunded to your balance.\nReason: ${reason}`, { parse_mode: 'HTML' }).catch(e => console.error(e.message));
                            }
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


// ==================== MINI APP APIs ====================
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

        res.json({ 
            balance: data.balance || 0,
            fiatWallet: data.fiatWallet || null,
            fiatWithdrawPending: data.fiatWithdrawPending || null,
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
        const { asset, amount, userAddress } = req.body;
        const botWallet = await getOrCreateBotWallet();
        const adminWallet = botWallet.address;
        if (asset === 'USDT') {
            const response = await axios.get(`https://tonapi.io/v2/accounts/${process.env.BOT_TON_ADDRESS}/jettons/EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs`);
            let userJettonWallet = null;
            if (response.data && response.data.wallet_address) {
                userJettonWallet = response.data.wallet_address.address;
            } else {
                return res.status(400).json({ error: "USDT Wallet not found for this user" });
            }
            
            const amountInMicro = Math.floor(parseFloat(amount) * 1e6);
            const body = beginCell()
                .storeUint(0xf8a7ea5, 32)
                .storeUint(0, 64)
                .storeCoins(amountInMicro)
                .storeAddress(Address.parse(adminWallet))
                .storeAddress(Address.parse(userAddress))
                .storeBit(0)
                .storeCoins(1)
                .storeBit(0)
                .endCell();
            
            res.json({
                success: true,
                tx: {
                    validUntil: Math.floor(Date.now() / 1000) + 600,
                    messages: [{
                        address: userJettonWallet,
                        amount: '50000000',
                        payload: body.toBoc().toString('base64')
                    }]
                }
            });
        } else {
            const amountInNano = Math.floor(parseFloat(amount) * 1e9);
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
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/miniapp/sell', async (req, res) => {
    try {
        const { userId, asset, amount, estimatedTk, wallet } = req.body;
        
        // Save to DB
        await db.collection('miniapp_sells').add({
            userId, asset, amount, estimatedTk, wallet,
            timestamp: FieldValue.serverTimestamp()
        });

        // Increment user balance
        const userRef = db.collection('users').doc(userId.toString());
        const userDoc = await userRef.get();
        if (userDoc.exists) {
            await userRef.update({ balance: FieldValue.increment(estimatedTk) });
        } else {
            await userRef.set({ balance: estimatedTk, joinedAt: FieldValue.serverTimestamp() });
        }

        res.json({ success: true });
    } catch(e) {
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

        console.log("Fetching TON balance...");
        let tonBalance = "0.00";
        try {
            if (process.env.BOT_TON_ADDRESS) {
                // Fetch Jettons (GRAM)
                const jettonRes = await axios.get(`https://tonapi.io/v2/accounts/${process.env.BOT_TON_ADDRESS}/jettons?_t=${Date.now()}`, { timeout: 3000 });
                if (jettonRes.data && jettonRes.data.balances) {
                    const gramJetton = jettonRes.data.balances.find(j => j.jetton.symbol === 'GRAM');
                    if (gramJetton) {
                        tonBalance = (parseFloat(gramJetton.balance) / Math.pow(10, gramJetton.jetton.decimals)).toFixed(2);
                    } else {
                        // Fallback to native TON
                        const tonRes = await axios.get(`https://tonapi.io/v2/accounts/${process.env.BOT_TON_ADDRESS}?_t=${Date.now()}`, { timeout: 3000 });
                        if (tonRes.data && tonRes.data.balance) {
                            tonBalance = (parseInt(tonRes.data.balance) / 1e9).toFixed(2);
                        }
                    }
                }
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
            evmBalance: evmBalance,
            evmAddress: process.env.BOT_EVM_ADDRESS,
            tonAddress: process.env.BOT_TON_ADDRESS
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Serve static manifest for TON Connect
app.use('/tonconnect-manifest.json', express.static('tonconnect-manifest.json'));
app.use('/log✅png', express.static('log✅png'));

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
        const userRef = db.collection('users').doc(userId.toString());
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) throw new Error("User not found");
        const userData = userDoc.data();
        if ((userData.balance || 0) < amount) throw new Error("Insufficient balance");
        
        // Remove old pending if it's expired
        if (userData.fiatWithdrawPending && userData.fiatWithdrawPending.status === 'completed' && (Date.now() - userData.fiatWithdrawPending.completedAt > 3 * 60 * 60 * 1000)) {
            // It's old, allow new withdraw
        } else if (userData.fiatWithdrawPending && userData.fiatWithdrawPending.status === 'pending') {
            throw new Error("You already have a pending withdrawal");
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

        const calcFee = fee || (amount * 0.05);
        const calcReceive = receiveAmount || (amount - calcFee);

        // Deduct balance and set pending
        const withdrawData = {
            serial: serialNum,
            amount: amount,
            fee: calcFee,
            receiveAmount: calcReceive,
            status: 'pending',
            timestamp: Date.now(),
            method: userData.fiatWallet.method,
            number: userData.fiatWallet.number,
            name: userData.fiatWallet.name
        };

        await userRef.update({
            balance: (userData.balance || 0) - amount,
            fiatWithdrawPending: withdrawData
        });
        
        // Notify Admin Group
        const config = require('./config.json');
        if (config.adminGroupId) {
            const msg = `<blockquote><b>💳 New Fiat Withdrawal</b></blockquote>\n\n👤 User: <a href="tg://user?id=${userId}">${userData.first_name || 'User'}</a>\n🆔 ID: ${userId}\n\n#️⃣ <b>Serial No: ${serialNum}</b>\n💰 Total Amount: <b>৳ ${amount} BDT</b>\n📉 Fee (5%): <b>৳ ${calcFee.toFixed(2)} BDT</b>\n✅ Send Exactly: <b>৳ ${calcReceive.toFixed(2)} BDT</b>\n\n🏦 Method: ${userData.fiatWallet.method}\n📞 Number: <code>${userData.fiatWallet.number}</code>\n📛 Name: ${userData.fiatWallet.name}\n\n⚙️ <b>Actions (Reply to this):</b>\n- <code>Ok</code> to mark paid\n- <code>Reject [reason]</code> to refund`;
            await bot.sendMessage(config.adminGroupId, msg, { parse_mode: 'HTML' }).catch(e => console.error(e.message));
        }
        
        res.json({ success: true, serial: serialNum });
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/withdraw', async (req, res) => {
    try {
        const { amount, destination, network } = req.body;
        
        if (network === 'TON') {
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


app.post('/api/miniapp/buy', async (req, res) => {
    try {
        const { userId, asset, amount, totalBdt, paymentMethod, trxId, receiveAddress } = req.body;
        if(!trxId || trxId.length < 5) return res.status(400).json({ error: 'Please enter a valid Transaction ID (min 5 characters)' });
        
        // Prevent duplicate TRX ID submission
        const existingBuy = await db.collection('miniapp_buys').doc(trxId).get();
        if (existingBuy.exists) {
            throw new Error("This Transaction ID has already been used.");
        }

        await db.collection('miniapp_buys').doc(trxId).set({
            userId, asset, amount, totalBdt, paymentMethod, trxId, receiveAddress,
            status: 'pending',
            timestamp: FieldValue.serverTimestamp()
        });

        // Check if Macrodroid already verified this TrxID before the user submitted
        const verifiedRef = await db.collection('verified_trx').doc(trxId).get();
        if (verifiedRef.exists) {
             await db.collection('miniapp_buys').doc(trxId).update({ status: 'completed' });
             bot.sendMessage(userId, '🎉 Your payment for ' + amount + ' ' + asset + ' has been automatically verified via early SMS!\n\nThe admin will send the asset to your wallet shortly.').catch(e => console.error(e.message));
             bot.sendMessage(8799135330, '✅ Auto-Verified Buy Order (Early SMS)!\nUser: ' + userId + '\nAsset: ' + amount + ' ' + asset + '\nTrxID: ' + trxId + '\nWallet: ' + receiveAddress).catch(e => console.error(e.message));
             return res.json({ success: true, message: 'Auto-verified instantly' });
        }

        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/macrodroid/webhook', async (req, res) => {
    try {
        // Macrodroid will send data either as JSON or URL encoded
        const sender = req.body.sender || req.query.sender || 'Unknown';
        const message = req.body.message || req.query.message || '';
        
        // Extract TrxID/TxnID
        const match = message.match(/(?:TrxID|TxnID)[\s:]*([A-Za-z0-9]+)/i);
        if (!match) {
            return res.status(400).json({ error: "No TrxID found" });
        }
        const trxId = match[1].toUpperCase();

        const buyRef = db.collection('miniapp_buys').doc(trxId);
        const doc = await buyRef.get();

        if (!doc.exists) {
            // Save it so when the user submits, it auto-verifies
            await db.collection('verified_trx').doc(trxId).set({
                message,
                timestamp: FieldValue.serverTimestamp()
            });
            return res.json({ success: true, message: "TrxID cached for future auto-verify" });
        }

        const order = doc.data();
        if (order.status === 'pending') {
            await buyRef.update({ status: 'completed' });
            bot.sendMessage(order.userId, '🎉 Your payment for ' + order.amount + ' ' + order.asset + ' has been automatically verified!\n\nThe admin will send the asset to your wallet shortly.').catch(e => console.error(e.message));
            bot.sendMessage(8799135330, '✅ Auto-Verified Buy Order!\nUser: ' + order.userId + '\nAsset: ' + order.amount + ' ' + order.asset + '\nTrxID: ' + trxId + '\nWallet: ' + order.receiveAddress).catch(e => console.error(e.message));
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

        // Get all users who have a pending fiat withdrawal
        const usersSnapshot = await db.collection('users').get();
        const withdrawals = [];
        usersSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.fiatWithdrawPending) {
                withdrawals.push({
                    id: doc.id,
                    userId: doc.id,
                    firstName: data.first_name || 'Unknown',
                    username: data.username || '',
                    ...data.fiatWithdrawPending
                });
            }
        });

        // sort withdrawals by timestamp descending
        withdrawals.sort((a, b) => b.timestamp - a.timestamp);

        res.json({ buys, sells, withdrawals });
    } catch(e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/admin/approve-buy', async (req, res) => {
    try {
        const { id } = req.body;
        const buyRef = db.collection('miniapp_buys').doc(id);
        const doc = await buyRef.get();
        if(!doc.exists) return res.status(404).json({ error: 'Not found' });
        
        const data = doc.data();
        await buyRef.update({ status: 'completed' });
        
        bot.sendMessage(data.userId, `🎉 Your payment for ${data.amount} ${data.asset} has been automatically verified via Admin Panel!\n\nThe asset has been sent to your wallet.`).catch(e => console.error(e.message));
        res.json({ success: true });
    } catch(e) {
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
        
        bot.sendMessage(doc.id, `🎉 <b>Bonus Received!</b>\nAdmin has credited your account with ${amount} BDT.`, { parse_mode: 'HTML' }).catch(e => console.error(e.message));
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
        const { userId } = req.body;
        const userRef = db.collection('users').doc(userId.toString());
        const doc = await userRef.get();
        if(!doc.exists) return res.status(404).json({ error: 'Not found' });
        
        const data = doc.data();
        if(!data.fiatWithdrawPending) return res.status(400).json({ error: 'No pending withdrawal' });
        
        await userRef.update({ 'fiatWithdrawPending.status': 'completed', 'fiatWithdrawPending.completedAt': Date.now() });
        bot.sendMessage(userId, '✅ <b>Withdrawal Successful!</b>\nYour payment has been sent to your wallet. Thank you!', { parse_mode: 'HTML' }).catch(e => console.error(e.message));
        res.json({ success: true });
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

// Serve MiniApp on /app
app.use('/app', express.static(path.join(__dirname, 'miniapp/dist')));

app.get('/api/miniapp/history/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        
        const buysSnapshot = await db.collection('miniapp_buys').where('userId', '==', userId).get();
        const sellsSnapshot = await db.collection('miniapp_sells').where('userId', '==', userId).get();
        
        const history = [];
        buysSnapshot.forEach(doc => history.push({ id: doc.id, type: 'buy', ...doc.data() }));
        sellsSnapshot.forEach(doc => history.push({ id: doc.id, type: 'sell', ...doc.data() }));
        
        history.sort((a, b) => {
            const timeA = a.timestamp ? a.timestamp.toMillis() : Date.now();
            const timeB = b.timestamp ? b.timestamp.toMillis() : Date.now();
            return timeB - timeA;
        });
        
        res.json({ success: true, history });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

app.use('/app', (req, res) => {
    const p = path.join(__dirname, 'miniapp/dist/index.html');
    if (fs.existsSync(p)) res.sendFile(p);
    else res.send("MiniApp is not built yet.");
});

// Serve Admin on /
app.use(express.static(path.join(__dirname, 'admin/dist')));
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
