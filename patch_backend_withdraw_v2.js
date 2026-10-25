const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

// 1. Update /api/miniapp/withdraw-fiat
const regexWithdraw = /app\.post\('\/api\/miniapp\/withdraw-fiat', async \(req, res\) => \{[\s\S]*?res\.status\(500\)\.json\(\{ error: e\.message \}\);\s*\}\s*\}\);/m;

const newWithdraw = `app.post('/api/miniapp/withdraw-fiat', async (req, res) => {
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
            throw new Error(\`Daily withdrawal limit (\${dailyLimit}) reached. Try again tomorrow.\`);
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
            const msg = \`<blockquote><b>💳 New Fiat Withdrawal</b></blockquote>\\n\\n👤 User: <a href="tg://user?id=\${userId}">\${userData.first_name || 'User'}</a>\\n🆔 ID: \${userId}\\n\\n#️⃣ <b>Serial No: \${serialNum}</b>\\n💰 Total Amount: <b>৳ \${amount} BDT</b>\\n📉 Fee (5%): <b>৳ \${calcFee.toFixed(2)} BDT</b>\\n✅ Send Exactly: <b>৳ \${calcReceive.toFixed(2)} BDT</b>\\n\\n🏦 Method: \${userData.fiatWallet.method}\\n📞 Number: <code>\${userData.fiatWallet.number}</code>\\n📛 Name: \${userData.fiatWallet.name}\\n\\n⚙️ <b>Actions (Reply to this):</b>\\n- <code>Ok</code> to mark paid\\n- <code>Reject [reason]</code> to refund\`;
            await bot.sendMessage(config.adminGroupId, msg, { parse_mode: 'HTML' });
        }
        
        res.json({ success: true, serial: serialNum });
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});`;

code = code.replace(regexWithdraw, newWithdraw);

// 2. Update Reply handler for 'ok'
const okRegex = /if \(\['done', 'ok'\]\.includes\(replyText\)\) \{[\s\S]*?else if \(replyText === 'wt'/;
const newOk = `if (['done', 'ok'].includes(replyText)) {
                            const uRef = db.collection('users').doc(targetUserId);
                            const uDoc = await uRef.get();
                            if (uDoc.exists && uDoc.data().fiatWithdrawPending) {
                                await uRef.update({
                                    'fiatWithdrawPending.status': 'completed',
                                    'fiatWithdrawPending.completedAt': Date.now()
                                });
                            }
                            bot.sendMessage(chatId, \`✅ Marked withdrawal for \${targetUserId} as PAID.\`);
                            bot.sendMessage(targetUserId, \`✅ <b>Withdrawal Successful!</b>\\nYour payment has been sent to your wallet. Thank you!\`, { parse_mode: 'HTML' });
                        } 
                        else if (replyText === 'wt'`;
code = code.replace(okRegex, newOk);

// Update admin approve-withdraw
const adminApproveRegex = /await userRef\.update\(\{ fiatWithdrawPending: null \}\);/;
const adminApproveNew = `await userRef.update({ 'fiatWithdrawPending.status': 'completed', 'fiatWithdrawPending.completedAt': Date.now() });`;
code = code.replace(adminApproveRegex, adminApproveNew);

// 3. Admin Bonus Route
const adminBonus = `
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
        
        bot.sendMessage(doc.id, \`🎉 <b>Bonus Received!</b>\\nAdmin has credited your account with \${amount} BDT.\`, { parse_mode: 'HTML' });
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
`;

code = code.replace("app.post('/api/admin/approve-withdraw',", adminBonus + "\napp.post('/api/admin/approve-withdraw',");

fs.writeFileSync('index.js', code);
