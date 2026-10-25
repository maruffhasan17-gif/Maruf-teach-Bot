const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

const buyEndpointStart = code.indexOf("app.post('/api/miniapp/buy'");
const buyEndpointEnd = code.indexOf("res.json({ success: true });\n    } catch (e) {", buyEndpointStart);

if (buyEndpointStart !== -1 && buyEndpointEnd !== -1) {
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
} else {
    console.error("Buy endpoint not found");
}

fs.writeFileSync('index.js', code);
