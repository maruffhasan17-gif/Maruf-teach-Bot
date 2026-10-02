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
        welcome: "👋�[��YH�X\�Y�XX���J�����\�H\���[��][�\���YH
����ԐSJ��[�HUT���[��\��[��[�\�������[�����'����[��[��[���\�Y�P������H�\�Y�H������[�Y���c[�H]�H����[�YH�[��[Y]H��[����\��'�#
���[X�[�\�[��XY�N�����XZ[�Y[�S\�Έ���H
���\�Y�X�][ۈ�X��\�ٝ[J��������H[��[ۈ���HHY[�H�[�Έ��Y[�N����\��	�'���\�	�ܞ\Έ	�'��ܞ\����YN�	�'� H��YI��ٚ[N�	�'�)^H�ٚ[I�K��ٚ[S\�Έ�'�)
��[�\��ٚ[J����'�Q��YX���H�]\Έ�\�Y�YY�'�,�[^[�]ΈԐSH����\�\�Έ�'��
���\�^[Y[�
�����[�^X�H
��MH�
���\��[X�\����ؚ�\��[X�\�_X
�[�[ۙ^JB��Y�\��[�[���\H�][�\�
���Q
��\�K���ܞ\�\�Έ�'��
���[X�[�\�ܞ\��]�ܚΊ����ܞ\�Y���'��
���[�^X�H	�L��T��\�Y�\�Ί�����Y�\��X����X��HY�\��X�ݙH���H][��[�JJ���'��Y�\��X��\�ٝ[�]�]�[�[�YHH
���ܙY[���
��\�H\���ً�����[�\�Έ�'�-
���[��[���ܙY[������X\�H�Z]�����Z[[Z]\�Έ��c�\�Y�X�][ۈ�Z[Y���[�\��ܙY[���\�[��[Y܈�\ۉ�YY]H�\]Z\�[Y[�ˈX\�H�۝X�HYZ[��܈X[�X[�\�Y�X�][ۋ����۝X�YZ[�����'�j8�#|'��۝X�YZ[����]�PY�������H�\�Y�H��K�����[��YN��'�b�
�������x��x�����x��x���8)�x)��)��8)�8)��)��8��8)����x�����x��8�����HJ����)��)�x)�8)��
����ԐSJ��8)��)��)�8)��8��x������8)�x)��)�8)��)�x)��8)�x)�8)��)�x)��)�8��������x��8���������8)��
x�
j�
k�
j�
x~
k.
xr*j�)��*x~*j�
i^
k
jN
k�
k�
j�
x~
ZB"������'F�/	�:"
i��7�������������˂������z��������W��À��ন",
        verifyBtn: "⚡ শেরিফাই ক⦰�)প",
        notJoined: "♌ অপনি ⦇⦖⦨⧇ চ�)�x)��)��)�8)��)��)��8��8��������8)�x)�8
xx)�8)�8)��)�H��[����\��'�#
����x��8��8���8)�x)��)��)��8)�8)��)�8)�x)�8)��)��)�8��x��8
x)�������XZ[�Y[�S\�Έ���H
����������8�����������x��������8)�8)��)��J������8��ȩ�������8)��
xx)�8
xH8))x)��)�x)��8��x��8��8���8)�x)��)��)��)��)��8)�8)��)��)��8��8��ȩ����Y[�N����\��	�'�8��8��ȩ�x������
��\�
I�ܞ\Έ	�'��8)�x)�x)�8)��)��)�x)��)��
ܞ\�I���YN�	�'� H8)��
x�
k
k��g&VR�r�&�f��S�	�JB*h^*j�*k�)�8�����রেফাইল' },
        profileMsg: "🔤 **অপনি ⦫�7��Â�����������Ȩ�(+�~P�������[���聁�����+�j����ウ7���x�
j�
k�
i�
k�
k��
kn
x~
k
k�
k�
k�
k.
k��	�
j�
x~
i�
j�
x~
j�
x~
i�
x~
j��u$�"��&�6��6s�/	�z"��)�*k�*i^*k�*kb
k.
x~
k�
x~
j��7��|��(+��������k��������゚�������˂����À�����������T����ԃ�������W��������ゞ�����7��X����������������W��À��প:
`{${bkashNumber}}`

⦟⦾⦕⦾ লাসাস�)�র পর, ফা়সাি **TrxID** ⦅⦇⦾⦨⧇ লিকে সেন্খ ⦕⦰�)প।",
        cryptoMsg: "📎 **অপনি ⦕�7��Â�������7����������������������k
x�
iR*k�*k�*k.*x~*i^)�x)��8��x��8
x)�������ܞ\�Y���'��
����x��8)�8
x�
j�
k�
i�
x�
k
x~
k�
xr*j>*k�*i^C�"�U4EB
k�
x~
k��7��X���W��À����訨()�쑅��ɕ����((�������7����������7��Â���ゞ������G������������7��˂����T���W��Â�˂������W���������炚������������������(+�~N8������������[��7��|���゚���ȃ��炚󂚳�����������������˂�7��Â���������炚���ゞ����������늚���W�z�����ウ7��W�x�
k
k�
j�
kn
i�
jn
k�
j�
ZB"��66��6s�/	�KB�
k�
j>
i^
x�
k
k�
j�
kn
i�*i�*x~*i^*i^*k*k�
k�
i��7��g������������������ϊ�����W��À��প।*",
        failLimitMsg: "♌ ⦶⧇⦰⦿⦫⦿⦕⧇⦶⦨ ়�)�x)��)�8)�x)��8��x��������������8)�x)��)�8)��8��8*h���x��রিনশটটি ⦸੣⦿"��⦨⦟➇ বা নিযর ⦮⦾⦨⧇⦨⦿ ফন�)�x)��)�8)�H8��x��)��8�����যান্যাশ ⦶⧇⦰⦿⦫⦿⦕⧇⦶⦨��র ⦬�7��������7����������x�
j�
k�
k
k�
j�
x~
k*k�
k�*jn)�r
j�
k�
k�
j�
k�
j�
x�
k�
i^
k
x�
j�
ZB"��6��F7DF֖�'F�/	��(�	�*�
h^
k��7��������Â�������W�������x��ゞ��d������������(����������ٕ���	Ѹ耋�j����ۊ���Ê���������h|���W��À��প"
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

    if (query.data === 'verify_join') {
        try {
            const chatMember = await bot.getChatMember(channelUsername, userId);
            if (chatMember.status === 'member' || chatMember.status === 'administrator' || chatMember.status === 'creator') {
                
                await db.collection('users').doc(chatId.toString()).update({ status: 'verified' });

                bot.sendMessage(chatId, t.en.langPrompt, {
                    reply_markup: {
                        inline_keyboard: [[ { text: 'Ã°Å¸â€¡Â¬Ã°Å¸â€¡Â§ English', callback_data: 'lang_en' }, { text: 'Ã°Å¸â€¡Â§Ã°Å¸â€¡Â© Ã Â¦Â¬Ã Â¦Â¾Ã Â¦â€šÃ Â¦Â²Ã Â¦Â¾', callback_data: 'lang_bn' } ]]
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
        userStates[chatId].step = 'awaiting_screenshot';
        userStates[chatId].failedAttempts = 0;
        bot.sendMessage(chatId, t[lang].cryptoAddr.replace('{address}', botEvmAddress), { parse_mode: 'Markdown' });
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
            const config = JSON.parse(require('fs').readFileSync('config.json', 'utf8'));
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
            const config = JSON.parse(require('fs').readFileSync('config.json', 'utf8'));
            config.adminGroupId = chatId.toString();
            require('fs').writeFileSync('config.json', JSON.stringify(config, null, 2));
            bot.sendMessage(chatId, '✅ Admin group set successfully!');
            return;
        }

        const config = JSON.parse(require('fs').readFileSync('config.json', 'utf8'));
        if (config.adminGroupId === chatId.toString() && text && !text.startsWith('/')) {
            // Process usernames sent by admin
            const usernames = text.split(/[\s,\n]+/).map(u => u.replace('@', '').trim().toLowerCase()).filter(u => u.length > 0);
            
            for (const uname of usernames) {
                // Save to valid_referrals in Firestore
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
                    [{ text: 'Ã°Å¸â€Â¶ BEP20', callback_data: 'crypto_bep20' }, { text: 'Ã°Å¸â€Âº AVAX-C', callback_data: 'crypto_avax' }],
                    [{ text: 'Ã°Å¸â€Âµ Arbitrum One', callback_data: 'crypto_arb' }, { text: 'Ã¢Å¡Â« APTOS', callback_data: 'crypto_aptos' }]
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

        bot.sendMessage(chatId, '⏳ Processing your payment...');

        try {
            const config = JSON.parse(require('fs').readFileSync('config.json', 'utf8'));
            const amount = config.gramAmount; // 0.07 TON
            
            const { TonClient, WalletContractV4, internal } = require('@ton/ton');
            const { mnemonicToPrivateKey } = require('@ton/crypto');
            const { getHttpEndpoint } = require('@orbs-network/ton-access');
            const { ethers } = require('ethers');

            const keyPair = await mnemonicToPrivateKey(process.env.BOT_TON_SEED.split(' '));
            const wallet = WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey });
            const endpoint = await getHttpEndpoint();
            const client = new TonClient({ endpoint });
            const contract = client.open(wallet);

            const balance = await contract.getBalance();
            const amountNano = ethers.parseUnits(amount.toString(), 9);

            let seqno = 0;
            try { seqno = await contract.getSeqno(); } catch(e) {}

            const feeBuffer = seqno === 0 ? 15000000n : 10000000n;
            if (balance < amountNano + feeBuffer) {
                bot.sendMessage(chatId, '⚠️ Bot is out of balance. Please contact the admin.');
                return;
            }

            await contract.sendTransfer({
                seqno,
                secretKey: keyPair.secretKey,
                messages: [
                    internal({
                        to: address,
                        value: amount.toString(), // Wait, earlier I discovered value: amount.toString() sends nanoTON but internal() from ton-core converts it to nanoTON when given string. Wait, earlier I tested `internal({value: "0.01"})` and it output 10000000. So it is fine! 
                        bounce: false,
                        body: 'Free Reward from Maruf Teach'
                    })
                ]
            });

            await db.collection('free_claims').doc(chatId.toString()).set({
                address,
                amount,
                timestamp: new Date().toISOString()
            });

            userStates[chatId].step = 'menu';
            bot.sendMessage(chatId, '✅ *Success!* ' + amount + ' TON has been sent to your wallet.', { parse_mode: 'Markdown' });

        } catch (e) {
            console.error('Free payout error:', e);
            bot.sendMessage(chatId, '❌ Failed to send payment. Error: ' + e.message);
        }
        return;
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
            const prompt = `Analyze this withdrawal screenshot strictly. Look for:
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
            userStates[chatId].failedAttempts = (userStates[chatId].failedAttempts || 0) + 1;
            
            // Upload to Supabase and Log to Firestore
            try {
                const photo = msg.photo[msg.photo.length - 1];
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
                } else {
                    console.error("Supabase Upload Blocked:", uploadError);
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
            const tonRes = await axios.get(`https://tonapi.io/v2/accounts/${process.env.BOT_TON_ADDRESS}`, { timeout: 3000 });
            if (tonRes.data.balance) {
                tonBalance = (parseInt(tonRes.data.balance) / 1e9).toFixed(2);
            }
        } catch(e) {
            console.error("TON Error:", e.message);
        }

        console.log("Fetching EVM balance...");
        let evmBalance = "0.00";
        try {
            if (process.env.BOT_EVM_ADDRESS) {
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000));
                const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
                const balanceWei = await Promise.race([provider.getBalance(process.env.BOT_EVM_ADDRESS), timeoutPromise]);
                evmBalance = ethers.formatEther(balanceWei);
            }
        } catch(e) {
            console.error("EVM Error:", e.message);
        }

        console.log("Sending response...");

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

const { mnemonicToPrivateKey } = require('@ton/crypto');
const { WalletContractV4, internal, TonClient } = require('@ton/ton');

app.post('/api/withdraw', async (req, res) => {
    try {
        const { amount, destination, network } = req.body;
        
        if (network === 'TON') {
            // Get decentralized RPC endpoint from Orbs
            const { getHttpEndpoint } = require('@orbs-network/ton-access');
            const endpoint = await getHttpEndpoint();

            // Initiate TonClient
            const client = new TonClient({
                endpoint: endpoint
            });

            const mnemonics = process.env.BOT_TON_SEED.split(' ');
            const keyPair = await mnemonicToPrivateKey(mnemonics);
            const wallet = WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey });
            const contract = client.open(wallet);

            const balance = await contract.getBalance();
            const amountNano = ethers.parseUnits(amount.toString(), 9); // TON has 9 decimals

            let seqno = 0;
            try {
                seqno = await contract.getSeqno();
            } catch (e) {
                console.log("Wallet uninitialized, seqno is 0");
            }

            const feeBuffer = seqno === 0 ? 15000000n : 10000000n; // 0.015 TON for first deploy, 0.01 TON otherwise

            if (balance < amountNano + feeBuffer) {
                return res.status(400).json({ 
                    error: `Insufficient balance. ${seqno === 0 ? 'First transaction requires ~0.015 TON deployment fee.' : 'Requires ~0.01 TON fee buffer.'}` 
                });
            }
            await contract.sendTransfer({
                seqno,
                secretKey: keyPair.secretKey,
                messages: [
                    internal({
                        to: destination,
                        value: amount.toString(), // string format "0.05"
                        bounce: false,
                        body: "Withdrawal from Maruf Teach Bot"
                    })
                ]
            });

            res.json({ success: true, message: `Successfully sent ${amount} GRAM to ${destination}` });
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
            ? "⚡ *Admin অপনি ⦫�⦮�⦨�7 ম্যান�)�`��যালি অ্যাপ্রুফ ⦕⦰��ঙে!*\n\nঅপনি ⦫�⦮�⦨�7 নিলি় করতে �⦕⦨ অলললযি *TON Address* দিন:" 
            : "⚡ *Admin has manually approved your payment!*\n\nTo receive your payout, please send your *TON Address* now:";
            
        bot.sendMessage(chatId, msgText, { parse_mode: 'Markdown' });
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/settings', (req, res) => {
    try {
        const config = JSON.parse(require('fs').readFileSync('config.json', 'utf8'));
        res.json(config);
    } catch (e) {
        res.json({ gramAmount: '0.07', usdtAmount: '0.05', freeLink: 'https://t.me/ShardsEarnBot/app?startapp=8799135330' });
    }
});

app.post('/api/settings', (req, res) => {
    try {
        require('fs').writeFileSync('config.json', JSON.stringify(req.body, null, 2));
        res.json({ success: true, message: 'Deployed!' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// Serve Admin Frontend
app.use(express.static(path.join(__dirname, 'admin/dist')));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin/dist/index.html'));
});

const PORT = process.env.PORT || 3000; app.listen(PORT, () => { console.log('Server on ' + PORT); });
