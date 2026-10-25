import re

with open('index.js', 'r', encoding='utf-8') as f:
    content = f.read()

webhook_code = """
app.post('/api/miniapp/buy', async (req, res) => {
    try {
        const { userId, asset, amount, totalBdt, paymentMethod, trxId, receiveAddress } = req.body;
        
        await db.collection('miniapp_buys').doc(trxId).set({
            userId, asset, amount, totalBdt, paymentMethod, trxId, receiveAddress,
            status: 'pending',
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        // Check if Macrodroid already verified this TrxID before the user submitted
        const verifiedRef = await db.collection('verified_trx').doc(trxId).get();
        if (verifiedRef.exists) {
             await db.collection('miniapp_buys').doc(trxId).update({ status: 'completed' });
             bot.sendMessage(userId, ?? Your payment for   has been automatically verified via early SMS!\n\nThe admin will send the asset to your wallet shortly.);
             bot.sendMessage(8799135330, ? Auto-Verified Buy Order (Early SMS)!\nUser: \nAsset:  \nTrxID: \nWallet: );
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
        // bKash usually says "TrxID 8ABC123XYZ"
        // Nagad usually says "TxnID: 8ABC123XYZ"
        const match = message.match(/(?:TrxID|TxnID)[\\s:]*([A-Za-z0-9]+)/i);
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
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
            return res.json({ success: true, message: "TrxID cached for future auto-verify" });
        }

        const order = doc.data();
        if (order.status === 'pending') {
            await buyRef.update({ status: 'completed' });
            bot.sendMessage(order.userId, ?? Your payment for   has been automatically verified!\n\nThe admin will send the asset to your wallet shortly.);
            bot.sendMessage(8799135330, ? Auto-Verified Buy Order!\nUser: \nAsset:  \nTrxID: \nWallet: );
        }
        res.json({ success: true });
    } catch(e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});
"""

# Insert before app.post('/api/settings'
content = content.replace("app.post('/api/settings',", webhook_code + "\\napp.post('/api/settings',")

with open('index.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated backend")
