const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

// Patch /api/macrodroid/webhook
const webhookStart = code.indexOf("app.post('/api/macrodroid/webhook'");
const webhookEnd = code.indexOf("});", webhookStart + 100) + 3;

const newWebhook = `app.post('/api/macrodroid/webhook', async (req, res) => {
    try {
        const sender = req.body.sender || req.query.sender || 'Unknown';
        const message = req.body.message || req.query.message || '';
        
        const match = message.match(/(?:TrxID|TxnId|TxnID|TrxId)[\\s:]*([A-Za-z0-9]+)/i);
        if (!match) {
            return res.status(400).json({ error: "No TrxID found" });
        }
        const trxId = match[1].toUpperCase();

        const amountMatch = message.match(/Tk[\\s:]*([\\d,]+(?:\\.\\d+)?)/i);
        const msgAmount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0;

        const buyRef = db.collection('miniapp_buys').doc(trxId);
        const doc = await buyRef.get();

        if (!doc.exists) {
            await db.collection('verified_trx').doc(trxId).set({
                message,
                amount: msgAmount,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
            return res.json({ success: true, message: "TrxID cached for future auto-verify" });
        }

        const order = doc.data();
        if (order.status === 'pending') {
            if (msgAmount && Math.abs(msgAmount - order.totalBdt) > 1) {
                bot.sendMessage(8799135330, '⚠️ Amount Mismatch Warning!\\nUser: ' + order.userId + '\\nExpected: ' + order.totalBdt + '\\nReceived: ' + msgAmount + '\\nTrxID: ' + trxId).catch(e=>console.error(e));
                return res.json({ success: true, message: "Amount mismatch, left as pending" });
            }
            await buyRef.update({ status: 'completed' });
            bot.sendMessage(order.userId, '🎉 Your payment for ' + order.amount + ' ' + order.asset + ' has been automatically verified!\\n\\nThe admin will send the asset to your wallet shortly.').catch(e => console.error(e.message));
            bot.sendMessage(8799135330, '✅ Auto-Verified Buy Order!\\nUser: ' + order.userId + '\\nAsset: ' + order.amount + ' ' + order.asset + '\\nTrxID: ' + trxId + '\\nWallet: ' + order.receiveAddress).catch(e => console.error(e.message));
        }
        res.json({ success: true });
    } catch(e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});`;

code = code.substring(0, webhookStart) + newWebhook + code.substring(webhookEnd);

// Patch /api/miniapp/buy for checking cached amount
const buyEndpointStart = code.indexOf("app.post('/api/miniapp/buy'");
const buyEndpointEnd = code.indexOf("res.json({ success: true });\n    } catch (e) {", buyEndpointStart);

let buyEndpointBlock = code.substring(buyEndpointStart, buyEndpointEnd);

buyEndpointBlock = buyEndpointBlock.replace(
    /if \(verifiedRef\.exists\) \{[\s\S]*?return res\.json\(\{ success: true, message: 'Auto-verified instantly' \}\);\n\s*\}/,
    `if (verifiedRef.exists) {
             const verifiedData = verifiedRef.data();
             if (verifiedData.amount && Math.abs(verifiedData.amount - totalBdt) > 1) {
                 bot.sendMessage(8799135330, '⚠️ Amount Mismatch Warning!\\nUser: ' + userId + '\\nExpected: ' + totalBdt + '\\nReceived: ' + verifiedData.amount + '\\nTrxID: ' + trxId).catch(e=>console.error(e));
                 // Leave as pending
             } else {
                 await db.collection('miniapp_buys').doc(trxId).update({ status: 'completed' });
                 bot.sendMessage(userId, '🎉 Your payment for ' + amount + ' ' + asset + ' has been automatically verified via early SMS!\\n\\nThe admin will send the asset to your wallet shortly.').catch(e => console.log('Message error:', e.message));
                 bot.sendMessage(8799135330, '✅ Auto-Verified Buy Order (Early SMS)!\\nUser: ' + userId + '\\nAsset: ' + amount + ' ' + asset + '\\nTrxID: ' + trxId + '\\nWallet: ' + receiveAddress).catch(e => console.log('Message error:', e.message));
                 return res.json({ success: true, message: 'Auto-verified instantly' });
             }
        }`
);

code = code.substring(0, buyEndpointStart) + buyEndpointBlock + code.substring(buyEndpointEnd);

fs.writeFileSync('index.js', code);
