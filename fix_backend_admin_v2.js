const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

const regexOrders = /app\.get\('\/api\/admin\/orders', async \(req, res\) => \{[\s\S]*?res\.status\(500\)\.json\(\{ error: e\.message \}\);\s*\}\s*\}\);/m;

const newOrders = `app.get('/api/admin/orders', async (req, res) => {
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
});`;

code = code.replace(regexOrders, newOrders);

// Append approve-withdraw endpoint
const appendRegex = /app\.post\('\/api\/admin\/approve-buy', async \(req, res\) => \{[\s\S]*?res\.status\(500\)\.json\(\{ error: e\.message \}\);\s*\}\s*\}\);/m;

const newApprove = `app.post('/api/admin/approve-buy', async (req, res) => {
    try {
        const { id } = req.body;
        const buyRef = db.collection('miniapp_buys').doc(id);
        const doc = await buyRef.get();
        if(!doc.exists) return res.status(404).json({ error: 'Not found' });
        
        const data = doc.data();
        await buyRef.update({ status: 'completed' });
        
        bot.sendMessage(data.userId, \`🎉 Your payment for \${data.amount} \${data.asset} has been automatically verified via Admin Panel!\\n\\nThe asset has been sent to your wallet.\`);
        res.json({ success: true });
    } catch(e) {
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
        
        await userRef.update({ fiatWithdrawPending: null });
        bot.sendMessage(userId, '✅ <b>Withdrawal Successful!</b>\\nYour payment has been sent to your wallet. Thank you!', { parse_mode: 'HTML' });
        res.json({ success: true });
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});`;

code = code.replace(appendRegex, newApprove);

fs.writeFileSync('index.js', code);
