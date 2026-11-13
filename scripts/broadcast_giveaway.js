const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const token = '8686002539:AAEefk3EZSCWQJbRTGit8ElvDqIxQVB0xR4';
const TELEGRAM_API = `https://api.telegram.org/bot${token}`;

const messageText = `🎁 <b>৫০,০০০ টাকার মেগা গিভওয়ে শুরু হয়েছে! (TrustPay Mega Giveaway)</b>

সম্মানিত ট্রাস্টপে ব্যবহারকারী,
TrustPay-এর ১ মাসের গ্র্যান্ড সেলিব্রেশনে আপনাদের জন্য নিয়ে আসা হয়েছে বিশাল <b>৳৫০,০০০ টাকার মেগা গিভওয়ে ইভেন্ট!</b> 🏆✨

💰 <b>মোট প্রাইজ পুল:</b> <b>৳৬৭,১৪০ টাকা</b>
🥇 <b>১ম মেগা প্রাইজ:</b> <b>৳৫০,০০০ টাকা</b> (নগদ ক্যাশ)
🥈 <b>২য় পুরষ্কার:</b> <b>৳১৫,০০০ টাকা</b>
🥉 <b>৩য় পুরষ্কার:</b> <b>৳২,০০০ টাকা</b>
🎁 <b>৪র্থ – ১০ম পুরষ্কার:</b> প্রত্যেকের জন্য বিশেষ ক্যাশ পুরষ্কার!

⚡ <b>অংশগ্রহণের নিয়ম একদম সহজ:</b>
১️⃣ অ্যাকাউন্টে মাত্র ৳২০ ব্যালেন্স হোল্ড (ইভেন্ট শেষে সাথে সাথে সম্পূর্ণ ফেরত/আনলক)
২️⃣ কমপক্ষে ২ জন বন্ধুকে সফল রেফার
৩️⃣ যেকোনো ১টি ক্রিপ্টো Buy অথবা Sell সম্পন্ন

🚀 <b>সীমিত সময়ের মেগা সুযোগ!</b> এখনই নিচের <b>Claim Now</b> বাটনে ক্লিক করে সরাসরি গিভওয়েতে জয়েন করুন! 👇`;

const replyMarkup = {
    inline_keyboard: [
        [{ text: '🎁 Claim Now', web_app: { url: 'https://trustpay-bot.com/app/?tab=giveaway' } }],
        [{ text: '📢 অফিশিয়াল পেআউট চ্যানেল', url: 'https://t.me/bd_trust_pay_payout' }]
    ]
};

async function getAllTargetUsers() {
    const userIds = new Set();

    // 1. Load from all_users_backup.json
    const backupPath = path.join(__dirname, '..', 'all_users_backup.json');
    if (fs.existsSync(backupPath)) {
        try {
            const raw = fs.readFileSync(backupPath, 'utf8');
            const data = JSON.parse(raw);
            for (const [key, u] of Object.entries(data)) {
                const uid = String(u.chatId || u.userId || key || '').trim();
                if (/^\d+$/.test(uid) && uid !== '12345' && uid !== '123456789') {
                    if (u.status !== 'banned') {
                        userIds.add(uid);
                    }
                }
            }
            console.log(`Loaded ${userIds.size} users from local backup.`);
        } catch (e) {
            console.warn('Backup parse error:', e.message);
        }
    }

    // 2. Fetch fresh users from Firestore
    try {
        const serviceAccount = require('../maruf-teach-firebase-adminsdk-fbsvc-e0269310ba.json');
        initializeApp({ credential: cert(serviceAccount) });
        const db = getFirestore();
        const snap = await db.collection('users').limit(500).get();
        snap.forEach(doc => {
            const d = doc.data() || {};
            const uid = String(d.chatId || doc.id || '').trim();
            if (/^\d+$/.test(uid) && uid !== '12345' && uid !== '123456789') {
                if (d.status !== 'banned') {
                    userIds.add(uid);
                }
            }
        });
        console.log(`After Firestore sync, total unique users: ${userIds.size}`);
    } catch (e) {
        console.warn('Firestore fetch notice:', e.message);
    }

    // Always include admin Maruf
    userIds.add('8799135330');

    return Array.from(userIds);
}

async function sendTelegramMessage(chatId) {
    try {
        await axios.post(`${TELEGRAM_API}/sendMessage`, {
            chat_id: chatId,
            text: messageText,
            parse_mode: 'HTML',
            disable_web_page_preview: true,
            reply_markup: replyMarkup
        }, { timeout: 10000 });
        return { success: true };
    } catch (err) {
        const desc = err.response?.data?.description || err.message;
        return { success: false, error: desc };
    }
}

async function run() {
    const list = await getAllTargetUsers();
    console.log(`\n🚀 Starting Giveaway broadcast to ${list.length} users...\n`);

    let sent = 0;
    let failed = 0;
    const startTime = Date.now();

    for (let i = 0; i < list.length; i++) {
        const uid = list[i];
        const res = await sendTelegramMessage(uid);
        if (res.success) {
            sent++;
        } else {
            failed++;
        }

        if ((i + 1) % 15 === 0 || i === list.length - 1) {
            const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
            console.log(`[${i + 1}/${list.length}] Sent: ${sent} | Blocked/Failed: ${failed} | Elapsed: ${elapsedSec}s`);
            await new Promise(r => setTimeout(r, 600)); // Respect Telegram rate limits
        } else {
            await new Promise(r => setTimeout(r, 45));
        }
    }

    // Also send to Payout Channel if desired
    try {
        await axios.post(`${TELEGRAM_API}/sendMessage`, {
            chat_id: '-1004405147138',
            text: messageText,
            parse_mode: 'HTML',
            reply_markup: replyMarkup
        }, { timeout: 10000 });
        console.log('✅ Sent copy to official Payout Channel!');
    } catch (_) {}

    const totalSec = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n🎉 BROADCAST COMPLETE in ${totalSec}s!`);
    console.log(`   - Successfully Delivered: ${sent}`);
    console.log(`   - Blocked/Unreachable: ${failed}`);
    console.log(`   - Total Targeted: ${list.length}`);
}

run().then(() => process.exit(0)).catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
