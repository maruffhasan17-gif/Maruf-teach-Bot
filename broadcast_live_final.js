const https = require('https');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
require('dotenv').config({ path: __dirname + '/.env' });

const sa = require('./maruf-teach-firebase-adminsdk-fbsvc-e0269310ba.json');
initializeApp({ credential: cert(sa) });
const db = getFirestore();

const BOT_TOKEN = '8686002539:AAEefk3EZSCWQJbRTGit8ElvDqIxQVB0xR4';
const WEB_APP_URL = 'https://maruf-teach-bot.onrender.com/app/?v=20261030v38';
const STICKER_FILE_ID = 'CAACAgIAAxUAAWrm5sXWeZVR7SpzamLHpnHE5uCWAAIbAAPANk8Tfb2Kg8tETWo9BA'; // 🥳 Animated celebration

function tgPost(endpoint, body) {
    return new Promise((resolve) => {
        const data = JSON.stringify(body);
        const req = https.request(`https://api.telegram.org/bot${BOT_TOKEN}/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            },
            timeout: 10000
        }, (res) => {
            let resData = '';
            res.on('data', chunk => resData += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(resData));
                } catch (e) {
                    resolve({ ok: false, error: e.message });
                }
            });
        });

        req.on('error', (err) => resolve({ ok: false, error: err.message }));
        req.on('timeout', () => {
            req.destroy();
            resolve({ ok: false, error: 'Request timeout' });
        });

        req.write(data);
        req.end();
    });
}

// Telegram Premium Animated Emojis Mapping
const PE = {
    rose: '<tg-emoji emoji-id="5440911110838425969">🌹</tg-emoji>',
    gem: '<tg-emoji emoji-id="5471952986970267163">💎</tg-emoji>',
    sparkles: '<tg-emoji emoji-id="5472164874886846699">✨</tg-emoji>',
    check: '<tg-emoji emoji-id="5427009714745517609">✅</tg-emoji>',
    rocket: '<tg-emoji emoji-id="5445284980978621387">🚀</tg-emoji>',
    fire: '<tg-emoji emoji-id="5420315771991497307">🔥</tg-emoji>',
    party: '<tg-emoji emoji-id="5436040291507247633">🎉</tg-emoji>',
    zap: '<tg-emoji emoji-id="5431449001532594346">⚡️</tg-emoji>',
    moneyBag: '<tg-emoji emoji-id="5375296873982604963">💰</tg-emoji>'
};

const broadcastHtml = 
`${PE.rose} <b>আসসালামু আলাইকুম সবাইকে!</b> ${PE.rose}\n\n` +
`${PE.party} <b>Trust Pay এখন সম্পূর্ণ লাইভ ও সচল!</b> ${PE.sparkles}\n\n` +
`প্রিয় গ্রাহক,\n` +
`আমাদের সিস্টেম অপ্টিমাইজেশন চলাকালীন আপনারা যে ধৈর্য ও সহযোগিতা দেখিয়েছেন, তার জন্য আপনাদের সবাইকে <b>অসংখ্য আন্তরিক ধন্যবাদ ও কৃতজ্ঞতা</b>। ${PE.check}\n\n` +
`${PE.gem} <b>Trust Pay</b> পরিবারের ওপর আস্থা ও বিশ্বাস রাখার জন্য আন্তরিকভাবে ধন্যবাদ।\n\n` +
`${PE.rocket} <b>এখন থেকে আপনারা নিয়মিত নিশ্চিন্তে ক্রিপ্টো Buy এবং Sell করতে পারবেন।</b> আমাদের প্ল্যাটফর্মে ক্রিপ্টো রেট সম্পূর্ণ ফিক্সড করা হয়েছে:\n\n` +
`${PE.moneyBag} <b>ফিক্সড রেট চার্ট:</b>\n` +
`🔹 <b>USDT:</b> Buy ৳১৩০ | Sell ৳১১৮\n` +
`🔹 <b>GRAM:</b> Buy ৳১৭০ | Sell ৳১৩০\n\n` +
`${PE.zap} <i>নিচের বাটনে ক্লিক করে অ্যাপে প্রবেশ করুন ও নিরাপদে লেনদেন করুন:</i>`;

async function run() {
    console.log('Fetching users from Firestore...');
    const usersSnap = await db.collection('users').get();
    const chatIds = new Set();
    usersSnap.forEach(doc => {
        const d = doc.data() || {};
        const uid = String(d.chatId || doc.id || '').trim();
        if (uid && /^\d+$/.test(uid) && uid !== '12345' && uid !== '123456789' && d.status !== 'banned') {
            chatIds.add(uid);
        }
    });

    const targetList = Array.from(chatIds);
    console.log(`Found ${targetList.length} users to broadcast.`);

    const userKeyboard = {
        inline_keyboard: [
            [ { text: '🚀 Trust Pay ওপেন করুন (Open App)', web_app: { url: WEB_APP_URL } } ],
            [ { text: '📢 অফিশিয়াল চ্যানেল', url: 'https://t.me/maruf_teach' } ]
        ]
    };

    const channelKeyboard = {
        inline_keyboard: [
            [ { text: '🚀 ট্রাস্ট পে বটে যান (Open Bot)', url: 'https://t.me/bd_trust_pay_bot' } ],
            [ { text: '📢 অফিশিয়াল চ্যানেল', url: 'https://t.me/maruf_teach' } ]
        ]
    };

    let sent = 0;
    let fail = 0;

    for (const chatId of targetList) {
        try {
            // Send sticker with remove_keyboard to clear any old bottom keyboard
            await tgPost('sendSticker', {
                chat_id: chatId,
                sticker: STICKER_FILE_ID,
                reply_markup: { remove_keyboard: true }
            });

            // Send broadcast message
            const res = await tgPost('sendMessage', {
                chat_id: chatId,
                text: broadcastHtml,
                parse_mode: 'HTML',
                reply_markup: userKeyboard
            });

            if (res.ok) {
                sent++;
                console.log(`Delivered to user: ${chatId}`);
            } else {
                fail++;
                console.log(`Failed user: ${chatId}`, res.description);
            }
        } catch (e) {
            fail++;
            console.log(`Err user: ${chatId}`, e.message);
        }

        await new Promise(r => setTimeout(r, 100));
    }

    // Payout Channel
    try {
        console.log('Sending to Payout Channel...');
        const chRes = await tgPost('sendMessage', {
            chat_id: '@bd_trust_pay_payout',
            text: broadcastHtml,
            parse_mode: 'HTML',
            reply_markup: channelKeyboard
        });
        console.log('Channel response:', chRes.ok ? 'SUCCESS' : chRes);
    } catch (e) {
        console.error('Channel error:', e.message);
    }

    console.log(`ALL DONE! Sent: ${sent}, Failed: ${fail}`);
    process.exit(0);
}

run().catch(console.error);
