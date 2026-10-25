const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

const searchStr = `const { userId, asset, amount, totalBdt, paymentMethod, trxId, receiveAddress } = req.body;
        
        await db.collection('miniapp_buys').doc(trxId).set({`;

const replaceStr = `const { userId, asset, amount, totalBdt, paymentMethod, trxId, receiveAddress } = req.body;
        
        // Prevent duplicate TRX ID submission
        const existingBuy = await db.collection('miniapp_buys').doc(trxId).get();
        if (existingBuy.exists) {
            throw new Error("This Transaction ID has already been used.");
        }

        await db.collection('miniapp_buys').doc(trxId).set({`;

code = code.replace(searchStr, replaceStr);
fs.writeFileSync('index.js', code);
