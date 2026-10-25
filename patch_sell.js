const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

const sellEndpointStart = code.indexOf("app.post('/api/miniapp/sell'");
const sellEndpointEnd = code.indexOf("});\n// =======================================================", sellEndpointStart);

const newSellEndpoint = `app.post('/api/miniapp/sell', async (req, res) => {
    try {
        const { userId, asset, amount, estimatedTk, wallet, status } = req.body;
        
        if (status === 'pending') {
            const docRef = await db.collection('miniapp_sells').add({
                userId, asset, amount, estimatedTk, wallet,
                status: 'pending',
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
            return res.json({ success: true, orderId: docRef.id });
        }

        const { orderId } = req.body;
        if (orderId) {
            await db.collection('miniapp_sells').doc(orderId).update({ status: 'completed' });
        } else {
            await db.collection('miniapp_sells').add({
                userId, asset, amount, estimatedTk, wallet, status: 'completed',
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
        }

        // Increment user balance
        const userRef = db.collection('users').doc(userId.toString());
        const userDoc = await userRef.get();
        if (userDoc.exists) {
            await userRef.update({ balance: admin.firestore.FieldValue.increment(estimatedTk) });
        } else {
            await userRef.set({ balance: estimatedTk, joinedAt: admin.firestore.FieldValue.serverTimestamp() });
        }

        // Notify Admin Group
        const config = require('./config.json');
        if (config.adminGroupId) {
            const msg = \`<blockquote><b>🔄 Crypto Sold (User to Bot)</b></blockquote>\\n\\n👤 User ID: <code>\${userId}</code>\\n💰 Asset: <b>\${amount} \${asset}</b>\\n💵 Credited: <b>৳ \${estimatedTk} BDT</b>\\n🏦 From Wallet: <code>\${wallet}</code>\`;
            bot.sendMessage(config.adminGroupId, msg, { parse_mode: 'HTML' }).catch(e=>console.error(e.message));
        }

        res.json({ success: true });
    } catch(e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});`;

if (sellEndpointStart !== -1 && sellEndpointEnd !== -1) {
    code = code.substring(0, sellEndpointStart) + newSellEndpoint + code.substring(sellEndpointEnd + 3);
    fs.writeFileSync('index.js', code);
    console.log("Patched sell endpoint");
} else {
    console.log("Could not find sell endpoint");
}
