require('dotenv').config({ override: true });
const TelegramBot = require('node-telegram-bot-api');
const path = require('path');
const express = require('express');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
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
const app = express();
const cors = require('cors');
app.use(cors());
app.use(express.json());
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const userStates = {}; 

const t = {
    en: {
        welcome: `👋 **Welcome to Maruf Teach Bot!**

To use this bot and get your free **0.07 GRAM**, you MUST join our channel first.`,
        joinBtn: `📢 Join Channel`,
        verifyBtn: `✅ Verify`,
        notJoined: `❌ You have not joined the channel yet!`,
        langPrompt: `🌍 **Select your Language:**`,
        mainMenuMsg: `✅ **Verification Successful!**

Choose an option from the menu below:`,
        menu: { bkash: '💳 bKash', crypto: '💎 Crypto', free: '🎁 Free', profile: '👤 My Profile' },
        profileMsg: `👤 **Your Profile**

🆔 ID: ${"{id}"}
✅ Status: Verified
💰 Total Payouts: 0 GRAM`,
        bkashMsg: `🟢 **bKash Payment**

Send exactly **15 BDT** to this number:
${"` + bkashNumber + `"} (Send Money)

After sending, reply with your **TrxID** here.`,
        cryptoMsg: `💎 **Select your Crypto Network:**`,
        cryptoAddr: `🏦 **Send exactly $0.12+ USDT to this address:**

${"{address}"}

*(Click the address above to copy it instantly)*

📸 After successful withdrawal, send me the **Screenshot** here as proof.`,
        scanMsg: `🔍 *Scanning screenshot... Please wait.*`,
        failLimitMsg: `❌ Verification Failed.

Your screenshot is invalid or doesn't meet the requirements. Please contact the admin for manual verification.`,
        contactAdminBtn: `👨‍💻 Contact Admin`,
        giveAddrBtn: `✅ Verify`,
        joinShardsBtn: `🎯 Start Task`,
        successMsg: `✅ **Screenshot Verified!**\n\nAmount: **{amount} USDT**\nNow send your **TON Address** to receive your payment:`
    },
    bn: {
        welcome: `👋 **মারুফ টিচ বটে স্বাগতম!**

ফ্রি **0.07 GRAM** পেতে হলে আপনাকে অবশ্যই আমাদের চ্যানেলে জয়েন করতে হবে।`,
        joinBtn: `📢 চ্যানেলে জয়েন করুন`,
        verifyBtn: `✅ ভেরিফাই করুন`,
        notJoined: `❌ আপনি এখনো চ্যানেলে জয়েন করেননি!`,
        langPrompt: `🌍 **আপনার ভাষা নির্বাচন করুন:**`,
        mainMenuMsg: `✅ **ভেরিফিকেশন সফল!**

নিচের মেনু থেকে আপনার অপশনটি বেছে নিন:`,
        menu: { bkash: '💳 বিকাশ (bKash)', crypto: '💎 ক্রিপ্টো (Crypto)', free: '🎁 ফ্রি (Free)', profile: '👤 আমার প্রোফাইল' },
        profileMsg: `👤 **আপনার প্রোফাইল**

🆔 আইডি: ${"{id}"}
✅ স্ট্যাটাস: ভেরিফাইড
💰 মোট পেয়েছেন: 0 GRAM`,
        bkashMsg: `🟢 **বিকাশ পেমেন্ট**

নিচের নাম্বারে ঠিক **15 টাকা** সেন্ড মানি করুন:
${"` + bkashNumber + `"}

টাকা পাঠানোর পর, আপনার **TrxID** এখানে লিখে সেন্ড করুন।`,
        cryptoMsg: `💎 **আপনার ক্রিপ্টো নেটওয়ার্ক সিলেক্ট করুন:**`,
        cryptoAddr: `🏦 **এই অ্যাড্রেসে ঠিক $0.12+ USDT সেন্ড করুন:**

${"{address}"}

*(অ্যাড্রেসের উপর ক্লিক করলেই কপি হয়ে যাবে)*

📸 পেমেন্ট সফল হওয়ার পর, প্রমাণ হিসেবে আমাকে **স্ক্রিনশট** দিন।`,
        scanMsg: `🔍 *স্ক্রিনশট চেক করা হচ্ছে... অপেক্ষা করুন।*`,
        failLimitMsg: `❌ ভেরিফিকেশন ব্যর্থ হয়েছে।

আপনার স্ক্রিনশটটি সঠিক নয় বা নিয়ম মানেনি। অনুগ্রহ করে ম্যানুয়াল ভেরিফিকেশনের জন্য অ্যাডমিনের সাথে যোগাযোগ করুন।`,
        contactAdminBtn: `👨‍💻 অ্যাডমিনকে মেসেজ দিন`,
        giveAddrBtn: `✅ ভেরিফাই করুন`,
        joinShardsBtn: `🎯 কাজ শুরু করুন`,
        successMsg: `✅ **স্ক্রিনশট ভেরিফাইড!**\n\nঅ্যামাউন্ট: **{amount} USDT**\nএখন আপনার **TON Address** দিন পেমেন্ট রিসিভ করার জন্য:`
    }
};

function getMenu(lang) {
    const m = t[lang].menu;
    return {
        reply_markup: {
            keyboard: [ [ { text: m.bkash }, { text: m.crypto } ], [ { text: m.free }, { text: m.profile } ] ],
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
    bot.sendMessage(chatId, t.en.welcome, opts);
});

bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    if (!userStates[chatId]) userStates[chatId] = { step: 'menu', failedAttempts: 0, lang: 'en' };
    const lang = userStates[chatId].lang;

    if (query.data === 'retry_free_payout') {
        userStates[chatId] = { step: 'awaiting_ton_address_free' };
        bot.sendMessage(chatId, '✅ Please send your TON address again:');
        return;
    }

    if (query.data === 'verify_join') {
        try {
            const chatMember = await bot.getChatMember(channelUsername, userId);
            if (chatMember.status === 'member' || chatMember.status === 'administrator' || chatMember.status === 'creator') {
                
                await db.collection('users').doc(chatId.toString()).update({ status: 'verified' });

                bot.sendMessage(chatId, t.en.langPrompt, {
                    reply_markup: {
                        inline_keyboard: [[ { text: '🇬🇧 English', callback_data: 'lang_en' }, { text: '🇧🇩 বাংলা', callback_data: 'lang_bn' } ]]
                    }
                });
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
        bot.sendMessage(chatId, t[l].mainMenuMsg, getMenu(l));
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
                bot.sendMessage(chatId, msg, { parse_mode: 'Markdown' });
            });
            return;
        }

        userStates[chatId].step = 'awaiting_screenshot';
        userStates[chatId].failedAttempts = 0;
        bot.sendMessage(chatId, t[lang].cryptoAddr.replace('{address}', addr), { parse_mode: 'Markdown' });
    }

    if (query.data === 'give_address') {
        const username = query.from.username ? query.from.username.toLowerCase() : null;
        if (!username) {
            bot.sendMessage(chatId, "⚠️ You need to set a Telegram Username in your profile to use the Free method!");
            return;
        }

        // Check if username is in valid_referrals
        const doc = await db.collection('valid_referrals').doc(username).get();
        if (doc.exists) {
            userStates[chatId].step = 'awaiting_ton_address_free';
            bot.sendMessage(chatId, "🎉 *Referral Verified!*\n\nPlease send your *TON Address* to receive your free payment:", { parse_mode: 'Markdown' });
        } else {
            // Check cooldown
            const now = Date.now();
            if (userStates[chatId].verifyCooldown && now < userStates[chatId].verifyCooldown) {
                const mins = Math.ceil((userStates[chatId].verifyCooldown - now) / 60000);
                bot.sendMessage(chatId, `⏳ *Referral not complete!*\nWe are still checking. Please try again in ${mins} minutes.`, { parse_mode: 'Markdown' });
                return;
            }

            // Set 30 mins cooldown
            userStates[chatId].verifyCooldown = now + 30 * 60000;
            bot.sendMessage(chatId, `⏳ *Referral not complete!*\nWe have sent a request to the admin to check your username. Please click Verify again after 30 minutes.`, { parse_mode: 'Markdown' });
            
            // Notify Admin Group
            const config = botConfig;
            if (config.adminGroupId) {
                bot.sendMessage(config.adminGroupId, `🔔 *New Verify Request*\nUser: @${username} (ID: ${chatId})\n\nAdmin: Check your dashboard. If valid, just reply with \`@${username}\` here.`, { parse_mode: 'Markdown' });
            }
        }
    }
});

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text ? msg.text.trim() : '';
    
    if (msg.chat.type === 'group' || msg.chat.type === 'supergroup') {
        if (text === '/setgroup') {
            const config = botConfig;
            await saveConfig({ adminGroupId: chatId.toString() });
            bot.sendMessage(chatId, '✅ Admin group set successfully!');
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
                            await db.collection('users').doc(targetUserId).update({
                                fiatWithdrawPending: null
                            });
                            bot.sendMessage(chatId, `✅ Marked withdrawal for ${targetUserId} as PAID.`);
                            bot.sendMessage(targetUserId, `🎉 <b>Withdrawal Successful!</b>\nYour payment has been sent to your wallet. Thank you!`, { parse_mode: 'HTML' });
                        } 
                        else if (replyText === 'wt' || replyText === 'wait') {
                            await bot.sendMessage(chatId, `⏱ Reply to THIS message with the time format.\n\nMinutes: <code>10:00</code>\nHours: <code>1:30:50</code>\n\nUser ID: ${targetUserId}`, { parse_mode: 'HTML' });
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
                                bot.sendMessage(chatId, `❌ Rejected withdrawal for ${targetUserId} and refunded ${amountToRefund} USDT.\nReason: ${reason}`);
                                bot.sendMessage(targetUserId, `❌ <b>Withdrawal Rejected</b>\nYour ${amountToRefund} USDT has been refunded to your balance.\nReason: ${reason}`, { parse_mode: 'HTML' });
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
                            bot.sendMessage(chatId, `⏳ Timer set for ${targetUserId}. They will see the countdown in the app.`);
                        } else {
                            bot.sendMessage(chatId, `⚠️ Invalid time format. Please use MM:SS or HH:MM:SS`);
                        }
                    }
                    return;
                }

                if (caption.includes("New MiniApp Task Submission")) {
                    const addrMatch = caption.match(/Address: `([a-zA-Z0-9_-]+)`/);
                    if (addrMatch && addrMatch[1]) {
                        const targetAddress = addrMatch[1];
                        if (replyText === 'ok') {
                            bot.sendMessage(chatId, `⏳ Paying ${targetAddress} via TonAPI...`);
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

0.05 TON has been sent to your wallet for completing the Free TON event!`);
                                bot.sendMessage(chatId, `✅ Successfully paid ${targetUserId} for MiniApp event.`);
                                
                                // Clean up DB
                                const tasks = await db.collection('miniapp_tasks').where('userId', '==', targetUserId).get();
                                tasks.forEach(t => t.ref.update({ status: 'approved' }));
                                
                            } catch (e) {
                                bot.sendMessage(chatId, `❌ Payment failed: ${e.message}`);
                            }
                        } else if (replyText === 'wrong') {
                            const rejectText = `❌ **Verification Failed.** You are ineligible for the Free TON event.`;
                            bot.sendMessage(targetUserId, rejectText, { parse_mode: 'Markdown' });
                            bot.sendMessage(chatId, `❌ Rejected user ${targetUserId} for MiniApp event.`);
                            
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
                    bot.sendMessage(targetUserId, successText, { parse_mode: 'Markdown' });
                    bot.sendMessage(chatId, `✅ Approved user ${targetUserId}`);
                } else if (replyText === 'wrong') {
                    delete userStates[targetUserId].step;
                    const rejectText = lang === 'bn' ? `❌ **ভেরিফিকেশন ব্যর্থ!** আপনার স্ক্রিনশটটি বাতিল করা হয়েছে।` : `❌ **Verification Failed.** Your screenshot was rejected by the admin.`;
                    bot.sendMessage(targetUserId, rejectText, { parse_mode: 'Markdown' });
                    bot.sendMessage(chatId, `❌ Rejected user ${targetUserId}`);
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
            bot.sendMessage(chatId, '✅ Usernames added: ' + usernames.join(', '));
        }
        return; // Stop processing further for group messages
    }

    if (text.startsWith('/')) return;
    
    if (!userStates[chatId]) userStates[chatId] = { step: 'menu', failedAttempts: 0, lang: 'en' };
    const lang = userStates[chatId].lang;
    const m = t[lang].menu;

    if (text === m.profile) {
        bot.sendMessage(chatId, t[lang].profileMsg.replace('{id}', chatId), { parse_mode: 'Markdown' });
    }
    else if (text === m.bkash) {
        bot.sendMessage(chatId, t[lang].bkashMsg, { parse_mode: 'Markdown' });
    }
    else if (text === m.crypto) {
        bot.sendMessage(chatId, t[lang].cryptoMsg, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🔺 AVAX-C', callback_data: 'crypto_avax' }],
                    [{ text: '⚫ APTOS', callback_data: 'crypto_aptos' }]
                ]
            }
        });
    }
    else if (text === m.free) {
        try {
            const freeTaskLink = 'https://t.me/VictorsCompanybot/app?startapp=ref_DBF2368328';
            try {
                const config = botConfig;
                // Hardcoded permanently
            } catch (err) {}
            
            const freeMsgText = lang === 'bn' 
                ? `🎁 **ফ্রি টাস্ক!**

নিচের লিংকে গিয়ে টাস্কটি কমপ্লিট করুন।

কাজ শেষ হলে আপনার **প্রোফাইলের/কাজের স্ক্রিনশট** এখানে সেন্ড করুন। (স্ক্রিনশটে আপনার নাম দেখা যেতে হবে)` 
                : `🎁 **Free Task!**

Complete the task using the link below.

Once done, send your **Profile/Task Screenshot** here. (Your name must be visible in the screenshot)`;
                
            bot.sendMessage(chatId, freeMsgText, {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: lang === 'bn' ? "🎯 কাজ শুরু করুন" : "🎯 Start Task", url: freeTaskLink }]
                    ]
                }
            });
            userStates[chatId].step = 'awaiting_free_screenshot';
        } catch (e) {
            console.error(e);
        }
    }

    if (userStates[chatId].step === 'awaiting_ton_address_free' && text) {
        const address = text;
        if (address.length < 48) {
            bot.sendMessage(chatId, '❌ Invalid TON Address. Please send a valid address.');
            return;
        }

        // Check if user already claimed
        const claimDoc = await db.collection('free_claims').doc(chatId.toString()).get();
        if (claimDoc.exists) {
            bot.sendMessage(chatId, '⚠️ You have already claimed your free reward!');
            userStates[chatId].step = 'menu';
            return;
        }

        // Check if address is already used by someone else
        const addressCheck = await db.collection('free_claims').where('address', '==', address).get();
        if (!addressCheck.empty) {
            bot.sendMessage(chatId, '🚫 Fraud Detected! This TON address has already been used to claim a reward.');
            userStates[chatId].step = 'menu';
            return;
        }

        bot.sendMessage(chatId, '⏳ Processing your payment...');

        try {
            const config = botConfig;
            const amount = config.gramAmount; // 0.07 TON
            
                        const { WalletContractV4, internal } = require('@ton/ton');
            const { mnemonicToPrivateKey } = require('@ton/crypto');
            const axios = require('axios');
            const { ethers } = require('ethers');

            const keyPair = await mnemonicToPrivateKey(process.env.BOT_TON_SEED.split(' '));
            const wallet = WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey });
            
            let seqno = 0;
            try {
                const seqnoRes = await axios.get(`https://tonapi.io/v2/wallet/${wallet.address.toString(true, true, true)}/seqno`);
                seqno = seqnoRes.data.seqno || 0;
            } catch(e) {}

            const amountNano = ethers.parseUnits(amount.toString(), 9);

            const transfer = wallet.createTransfer({
                seqno,
                secretKey: keyPair.secretKey,
                messages: [
                    internal({
                        to: address,
                        value: amountNano,
                        bounce: false,
                        body: 'Free Reward from Maruf Teach'
                    })
                ]
            });

            const { external, storeMessage, beginCell } = require('@ton/ton');
            const extMessage = external({
                to: wallet.address,
                init: seqno === 0 ? wallet.init : null,
                body: transfer
            });
            const boc = beginCell().store(storeMessage(extMessage)).endCell().toBoc().toString('base64');
            await axios.post('https://tonapi.io/v2/blockchain/message', { boc });

            await db.collection('free_claims').doc(chatId.toString()).set({
                address,
                amount,
                timestamp: new Date().toISOString()
            });

            userStates[chatId].step = 'menu';
            bot.sendMessage(chatId, '✅ *Success!* ' + amount + ' TON has been sent to your wallet.', { parse_mode: 'Markdown' });

        } catch (e) {
            console.error('Free payout error:', e.response ? e.response.data : e.message);
            bot.sendMessage(chatId, '❌ Failed to send payment. Error: ' + (e.response && e.response.data && e.response.data.error ? JSON.stringify(e.response.data.error) : e.message) + '\n\nThe network might be busy (Seqno conflict). Please click Try Again.', {
                reply_markup: {
                    inline_keyboard: [[{ text: '🔄 Try Again', callback_data: 'retry_free_payout' }]]
                }
            });
            userStates[chatId].step = 'menu';
        }
        return;
    }

    // Screenshot AI Logic
    
    if (msg.photo) {
        if (userStates[chatId].step !== 'awaiting_screenshot' && userStates[chatId].step !== 'awaiting_free_screenshot') return;

        const isFreeTask = userStates[chatId].step === 'awaiting_free_screenshot';
        const userFirstName = msg.from.first_name || '';
        const userUsername = msg.from.username || '';
        const photo = msg.photo[msg.photo.length - 1];

        if (isFreeTask) {
            // BYPASS AI ENTIRELY for Free Tasks
            const reviewMsg = lang === 'bn' ? "⏳ **আপনার স্ক্রিনশটটি ম্যানুয়াল রিভিউতে পাঠানো হয়েছে।**\n\nযাচাই হতে ৫ মিনিট পর্যন্ত সময় লাগতে পারে।" : "⏳ **Your screenshot has been sent for manual review.**\n\nVerification may take up to 5 minutes.";
            bot.sendMessage(chatId, reviewMsg, { parse_mode: 'Markdown' });
            
            const config = botConfig;
            if (config.adminGroupId) {
                bot.sendPhoto(config.adminGroupId, photo.file_id, {
                    caption: `🔍 **Manual Review Needed (Free Task)**\n\nUser: ${userFirstName} (@${userUsername})\nID: ${chatId}\n\nReply to this photo with **ok** to approve, or **wrong** to reject.`,
                    parse_mode: 'Markdown'
                });
            }
            return;
        }

        bot.sendMessage(chatId, t[lang].scanMsg, { parse_mode: 'Markdown' });
        
        try {
            const fileLink = await bot.getFileLink(photo.file_id);
            const response = await axios.get(fileLink, { responseType: 'arraybuffer' });
            const base64Image = Buffer.from(response.data).toString('base64');

            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            const prompt = `Analyze this payment screenshot strictly. Look for:
            1. Text "Withdrawal Submitted!"
            2. Gateway text (e.g. "USDT BEP20")
            3. Amount (e.g. "$0.10 USDT").
            Return JSON format ONLY: {"hasWithdrawalText": true/false, "gateway": "extracted text", "amount": extracted_number_as_float}.`;

            const imagePart = { inlineData: { data: base64Image, mimeType: 'image/jpeg' } };
            const result = await model.generateContent([prompt, imagePart]);
            const responseText = result.response.text();
            
            const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            const aiData = JSON.parse(jsonStr);

            if (aiData.hasWithdrawalText && aiData.gateway.includes('BEP20') && aiData.amount >= 0.10) {
                userStates[chatId].step = 'awaiting_ton';
                bot.sendMessage(chatId, t[lang].successMsg.replace('{amount}', aiData.amount), { parse_mode: 'Markdown' });
            } else {
                throw new Error("Validation Failed");
            }
        } catch (error) {
            console.error("AI Error:", error.message);
            userStates[chatId].failedAttempts = (userStates[chatId].failedAttempts || 0) + 1;
            
            // Upload to Supabase and Log to Firestore
            try {
                const fileLink = await bot.getFileLink(photo.file_id);
                const response = await axios.get(fileLink, { responseType: 'arraybuffer' });
                const buffer = Buffer.from(response.data);
                
                const fileName = `fraud_${chatId}_${Date.now()}.jpg`;
                const { data, error: uploadError } = await supabase.storage.from('image').upload(fileName, buffer, { contentType: 'image/jpeg' });
                
                if (!uploadError) {
                    const { data: publicUrlData } = supabase.storage.from('image').getPublicUrl(fileName);
                    await db.collection('failed_screenshots').add({
                        chatId: chatId,
                        username: msg.from.username || 'Unknown',
                        imageUrl: publicUrlData.publicUrl,
                        timestamp: new Date(),
                        reason: error.message || 'AI Validation Failed'
                    });
                }
            } catch (err) {
                console.error("Supabase Upload Error:", err.message);
            }

            if (userStates[chatId].failedAttempts >= 2) {
                const adminText = encodeURIComponent(`Hello Admin, my payment failed verification in the bot. My ID is ${chatId}.`);
                bot.sendMessage(chatId, t[lang].failLimitMsg, { 
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [[{ text: t[lang].contactAdminBtn, url: `https://t.me/${adminUsername}?text=${adminText}` }]]
                    }
                });
                userStates[chatId].step = 'menu';
            } else {
                bot.sendMessage(chatId, t[lang].invalidMsg, { parse_mode: 'Markdown' });
            }
        }
    }
});

// Add this before app.listen
const { ethers } = require('ethers');


// ==================== MINI APP APIs ====================
app.get('/api/miniapp/user/:id', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const userDoc = await db.collection('users').doc(userId.toString()).get();
        if (!userDoc.exists) {
            return res.json({ balance: 0 });
        }
        const data = userDoc.data();
        res.json({ 
            balance: data.balance || 0,
            fiatWallet: data.fiatWallet || null,
            fiatWithdrawPending: data.fiatWithdrawPending || null
        });
    } catch(e) {
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
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        // Send to Admin Group
        const msg = `🎁 <b>New MiniApp Task Submission</b>\n\n👤 User: <a href="tg://user?id=${userId}">${name}</a>\n🆔 ID: ${userId}\n💰 Type: Free TON (VIC)\n📍 Address: \`${address}\`\n\nReply with 'Ok' to approve or 'Wrong' to reject.`;
        
        const sentMsg = await bot.sendMessage(adminGroupId, msg, { parse_mode: 'HTML' });
        
        // Save msgId for reply tracking
        await db.collection('miniapp_tasks').doc(docRef.id).update({
            messageId: sentMsg.message_id
        });

        res.json({ success: true });
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/miniapp/sell', async (req, res) => {
    try {
        const { userId, asset, amount, estimatedTk, wallet } = req.body;
        
        // Save to DB
        await db.collection('miniapp_sells').add({
            userId, asset, amount, estimatedTk, wallet,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        // Increment user balance
        const userRef = db.collection('users').doc(userId.toString());
        const userDoc = await userRef.get();
        if (userDoc.exists) {
            await userRef.update({ balance: admin.firestore.FieldValue.increment(estimatedTk) });
        } else {
            await userRef.set({ balance: estimatedTk, joinedAt: admin.firestore.FieldValue.serverTimestamp() });
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
app.use('/logo.png', express.static('logo.png'));

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
        await db.collection('users').doc(userId.toString()).update({
            fiatWallet: { method, number, name }
        });
        res.json({ success: true });
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/miniapp/withdraw-fiat', async (req, res) => {
    try {
        const { userId, amount } = req.body;
        const userRef = db.collection('users').doc(userId.toString());
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) throw new Error("User not found");
        const userData = userDoc.data();
        if ((userData.balance || 0) < amount) throw new Error("Insufficient balance");
        if (userData.fiatWithdrawPending) throw new Error("You already have a pending withdrawal");
        
        // Deduct balance and set pending
        await userRef.update({
            balance: (userData.balance || 0) - amount,
            fiatWithdrawPending: {
                amount: amount,
                status: 'pending',
                timestamp: Date.now(),
                method: userData.fiatWallet.method,
                number: userData.fiatWallet.number,
                name: userData.fiatWallet.name
            }
        });
        
        // Notify Admin Group
        const config = require('./config.json');
        if (config.adminGroupId) {
            const msg = `💰 <b>New Fiat Withdrawal</b>\n\n👤 User: <a href="tg://user?id=${userId}">${userData.first_name || 'User'}</a>\n🆔 ID: ${userId}\n💲 Amount: <b>${amount} USDT</b>\n🏦 Method: ${userData.fiatWallet.method}\n📱 Number: ${userData.fiatWallet.number}\n📛 Name: ${userData.fiatWallet.name}\n\n⚙️ <b>Actions (Reply to this):</b>\n- <code>Done</code> or <code>Ok</code> to mark paid\n- <code>Wait</code> to set a timer\n- <code>Reject [reason]</code> to refund`;
            await bot.sendMessage(config.adminGroupId, msg, { parse_mode: 'HTML' });
        }
        
        res.json({ success: true });
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
            const axios = require('axios');

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
            
        bot.sendMessage(chatId, msgText, { parse_mode: 'Markdown' });
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/settings', (req, res) => {
    try {
        const config = botConfig;
        res.json(config);
    } catch (e) {
        res.json({ gramAmount: '0.07', usdtAmount: '0.05', freeLink: 'https://t.me/VictorsCompanybot/app?startapp=ref_DBF2368328' });
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
app.use(express.static(path.join(__dirname, 'admin/dist')));
app.use((req, res) => {
    const p = path.join(__dirname, 'admin/dist/index.html');
    if (require('fs').existsSync(p)) res.sendFile(p);
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
                        
                    bot.sendMessage(chatId, msgText, { parse_mode: 'Markdown' });
                    
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
                bot.sendMessage(chatId, lang === 'bn' ? "❌ **টাইমআউট!** ৫ মিনিট পার হয়ে গেছে। আবার চেষ্টা করতে মেনু থেকে অপশন বেছে নিন।" : "❌ **Timeout!** 5 minutes have passed. Please select an option from the menu to try again.", { parse_mode: 'Markdown' });
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
