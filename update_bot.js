const fs = require('fs');

const botCode = `require('dotenv').config({ override: true });
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

const serviceAccount = require('./maruf-teach-firebase-adminsdk-fbsvc-e0269310ba.json');
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const token = process.env.BOT_TOKEN;
const channelUsername = process.env.CHANNEL_USERNAME;
const bkashNumber = process.env.BKASH_NUMBER;
const botEvmAddress = process.env.BOT_EVM_ADDRESS || process.env.BEP20_ADDRESS;
const adminUsername = "maruff666";

const bot = new TelegramBot(token, { polling: true });
const app = express();
app.use(express.json());
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const userStates = {}; 

const t = {
    en: {
        welcome: "👋 **Welcome to Maruf Teach Bot!**\\n\\nTo use this bot and get your free **0.07 GRAM**, you MUST join our channel first.",
        joinBtn: "📣 Join Channel",
        verifyBtn: "✅ Verify",
        notJoined: "❌ You have not joined the channel yet!",
        langPrompt: "🌍 **Select your language:**",
        mainMenuMsg: "✅ **Verification Successful!**\\n\\nChoose an option from the menu below:",
        menu: { bkash: '💳 bKash', crypto: '💎 Crypto', free: '🎁 Free', profile: '👤 My Profile' },
        profileMsg: "👤 **Your Profile**\\n\\n🆔 ID: \\\`{id}\\\`\\n✅ Status: Verified\\n💰 Total Payouts: 0 GRAM",
        bkashMsg: "🟢 **bKash Payment**\\n\\nSend exactly **15 BDT** to this number:\\n\\\`\${bkashNumber}\\\` (Send Money)\\n\\nAfter sending, reply with your **TrxID** here.",
        cryptoMsg: "💎 **Select your Crypto Network:**",
        cryptoAddr: "🏦 **Send exactly $0.12+ USDT to this address:**\\n\\n\\\`{address}\\\`\\n\\n*(Click the address above to copy it instantly)*\\n\\n📸 After successful withdrawal, send me the **Screenshot** here as proof.",
        freeMsg: "🎁 **Free 0.07 GRAM via Shards Bot**\\n\\n1️⃣ Click 'Join Shards Bot' to start earning.\\n2️⃣ Complete tasks and withdraw to our address.\\n3️⃣ Click 'Give me address' to get the withdrawal address.",
        joinShardsBtn: "🚀 Join Shards Bot",
        giveAddrBtn: "📝 Give me address",
        scanMsg: "🔍 **Scanning your screenshot with AI...** Please wait ⏳",
        successMsg: "✅ **Verification Success!**\\n\\n🎉 Screenshot is valid. Amount: **\${amount}**.\\n\\n📥 Please send your **TON Wallet Address** (Must start with \`UQ\`) to receive 0.07 GRAM.",
        failLimitMsg: "❌ **Payment Failed!**\\n\\nYou have submitted an invalid screenshot twice.\\nPlease contact the admin for manual verification.",
        invalidMsg: "⚠️ **Invalid Screenshot!**\\n\\nThe screenshot does not match our requirements.\\nEnsure it shows **$0.10+ USDT**, **BEP20**, and **Withdrawal Submitted!**.\\n\\nPlease submit the real screenshot.",
        contactAdminBtn: "🎧 Contact Admin"
    },
    bn: {
        welcome: "👋 **মারুফ টিচ বটে স্বাগতম!**\\n\\nফ্রি **0.07 GRAM** পেতে হলে আপনাকে অবশ্যই আমাদের চ্যানেলে জয়েন করতে হবে।",
        joinBtn: "📣 চ্যানেলে জয়েন করুন",
        verifyBtn: "✅ ভেরিফাই করুন",
        notJoined: "❌ আপনি এখনো চ্যানেলে জয়েন করেননি!",
        langPrompt: "🌍 **আপনার ভাষা নির্বাচন করুন:**",
        mainMenuMsg: "✅ **ভেরিফিকেশন সফল!**\\n\\nনিচের মেনু থেকে আপনার অপশনটি বেছে নিন:",
        menu: { bkash: '💳 বিকাশ (bKash)', crypto: '💎 ক্রিপ্টো (Crypto)', free: '🎁 ফ্রি (Free)', profile: '👤 আমার প্রোফাইল' },
        profileMsg: "👤 **আপনার প্রোফাইল**\\n\\n🆔 আইডি: \\\`{id}\\\`\\n✅ স্ট্যাটাস: ভেরিফাইড\\n💰 মোট পেয়েছেন: 0 GRAM",
        bkashMsg: "🟢 **বিকাশ পেমেন্ট**\\n\\nনিচের নাম্বারে ঠিক **15 টাকা** সেন্ড মানি করুন:\\n\\\`\${bkashNumber}\\\`\\n\\nটাকা পাঠানোর পর, আপনার **TrxID** এখানে লিখে সেন্ড করুন।",
        cryptoMsg: "💎 **আপনার ক্রিপ্টো নেটওয়ার্ক সিলেক্ট করুন:**",
        cryptoAddr: "🏦 **এই অ্যাড্রেসে ঠিক $0.12+ USDT সেন্ড করুন:**\\n\\n\\\`{address}\\\`\\n\\n*(অ্যাড্রেসের উপর ক্লিক করলেই কপি হয়ে যাবে)*\\n\\n📸 পেমেন্ট সফল হওয়ার পর, প্রমাণ হিসেবে আমাকে **স্ক্রিনশট** দিন।",
        freeMsg: "🎁 **Shards Bot এর মাধ্যমে ফ্রি 0.07 GRAM**\\n\\n1️⃣ 'Join Shards Bot' এ ক্লিক করে কাজ শুরু করুন।\\n2️⃣ কাজ করে আমাদের অ্যাড্রেসে উইথড্র দিন।\\n3️⃣ অ্যাড্রেস পেতে 'Give me address' এ ক্লিক করুন।",
        joinShardsBtn: "🚀 Shards Bot এ জয়েন করুন",
        giveAddrBtn: "📝 অ্যাড্রেস দিন",
        scanMsg: "🔍 **AI আপনার স্ক্রিনশট চেক করছে...** দয়া করে অপেক্ষা করুন ⏳",
        successMsg: "✅ **ভেরিফিকেশন সফল!**\\n\\n🎉 স্ক্রিনশট সঠিক। পরিমাণ: **\${amount}**.\\n\\n📥 আপনার 0.07 GRAM রিসিভ করার জন্য আপনার **TON Wallet Address** (UQ দিয়ে শুরু হতে হবে) সেন্ড করুন।",
        failLimitMsg: "❌ **পেমেন্ট ফেইল!**\\n\\nআপনি দুইবার ভুল স্ক্রিনশট দিয়েছেন।\\nম্যানুয়াল ভেরিফিকেশনের জন্য এডমিনের সাথে যোগাযোগ করুন।",
        invalidMsg: "⚠️ **ভুল স্ক্রিনশট!**\\n\\nআপনার স্ক্রিনশট আমাদের নিয়মের সাথে মিলছে না।\\nনিশ্চিত করুন এতে **$0.10+ USDT**, **BEP20**, এবং **Withdrawal Submitted!** লেখা আছে।\\n\\nঅনুগ্রহ করে সঠিক স্ক্রিনশটটি দিন।",
        contactAdminBtn: "🎧 এডমিনের সাথে কথা বলুন"
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

bot.onText(/\\/start/, async (msg) => {
    const chatId = msg.chat.id;
    userStates[chatId] = { step: 'start', failedAttempts: 0, lang: 'en' };
    
    const opts = {
        reply_markup: {
            inline_keyboard: [
                [{ text: t.en.joinBtn, url: \`https://t.me/\${channelUsername.replace('@', '')}\` }],
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

    if (query.data === 'verify_join') {
        try {
            const chatMember = await bot.getChatMember(channelUsername, userId);
            if (chatMember.status === 'member' || chatMember.status === 'administrator' || chatMember.status === 'creator') {
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
        bot.sendMessage(chatId, t[l].mainMenuMsg, getMenu(l));
    }

    if (query.data.startsWith('crypto_') || query.data === 'give_address') {
        userStates[chatId].step = 'awaiting_screenshot';
        userStates[chatId].failedAttempts = 0;
        bot.sendMessage(chatId, t[lang].cryptoAddr.replace('{address}', botEvmAddress), { parse_mode: 'Markdown' });
    }
});

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text ? msg.text.trim() : '';
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
                    [{ text: '🔶 BEP20', callback_data: 'crypto_bep20' }, { text: '🔺 AVAX-C', callback_data: 'crypto_avax' }],
                    [{ text: '🔵 Arbitrum One', callback_data: 'crypto_arb' }, { text: '⚫ APTOS', callback_data: 'crypto_aptos' }]
                ]
            }
        });
    }
    else if (text === m.free) {
        bot.sendMessage(chatId, t[lang].freeMsg, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: t[lang].joinShardsBtn, url: 'https://t.me/ShardsEarnBot/app?startapp=8799135330' }],
                    [{ text: t[lang].giveAddrBtn, callback_data: 'give_address' }]
                ]
            }
        });
    }

    // Screenshot AI Logic
    if (msg.photo) {
        if (userStates[chatId].step !== 'awaiting_screenshot') return;

        bot.sendMessage(chatId, t[lang].scanMsg, { parse_mode: 'Markdown' });
        
        try {
            const photo = msg.photo[msg.photo.length - 1];
            const fileLink = await bot.getFileLink(photo.file_id);
            const response = await axios.get(fileLink, { responseType: 'arraybuffer' });
            const base64Image = Buffer.from(response.data).toString('base64');

            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            const prompt = \`Analyze this withdrawal screenshot strictly. Look for:
            1. Text "Withdrawal Submitted!"
            2. Gateway text (e.g. "USDT BEP20")
            3. Amount (e.g. "$0.10 USDT").
            Return JSON format ONLY: {"hasWithdrawalText": true/false, "gateway": "extracted text", "amount": extracted_number_as_float}.\`;

            const imagePart = { inlineData: { data: base64Image, mimeType: 'image/jpeg' } };
            const result = await model.generateContent([prompt, imagePart]);
            const responseText = result.response.text();
            
            const jsonStr = responseText.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
            const aiData = JSON.parse(jsonStr);

            if (aiData.hasWithdrawalText && aiData.gateway.includes('BEP20') && aiData.amount >= 0.10) {
                userStates[chatId].step = 'awaiting_ton';
                bot.sendMessage(chatId, t[lang].successMsg.replace('{amount}', aiData.amount), { parse_mode: 'Markdown' });
            } else {
                throw new Error("Validation Failed");
            }
        } catch (error) {
            userStates[chatId].failedAttempts = (userStates[chatId].failedAttempts || 0) + 1;
            
            if (userStates[chatId].failedAttempts >= 2) {
                const adminText = encodeURIComponent(\`Hello Admin, my payment failed verification in the bot. My ID is \${chatId}.\`);
                bot.sendMessage(chatId, t[lang].failLimitMsg, { 
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [[{ text: t[lang].contactAdminBtn, url: \`https://t.me/\${adminUsername}?text=\${adminText}\` }]]
                    }
                });
                userStates[chatId].step = 'menu';
            } else {
                bot.sendMessage(chatId, t[lang].invalidMsg, { parse_mode: 'Markdown' });
            }
        }
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => { console.log(\`Server on \${PORT}\`); });
`;

fs.writeFileSync('index.js', botCode);
console.log("Rewrote index.js successfully!");
