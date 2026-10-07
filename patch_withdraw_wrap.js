const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

const newWithdraw = `app.post('/api/withdraw', async (req, res) => {
    try {
        const { amount, destination, network } = req.body;
        
        if (network === 'TON') {
            const { WalletContractV4, internal, beginCell, external, storeMessage } = require('@ton/ton');
            const { mnemonicToPrivateKey } = require('@ton/crypto');
            const { ethers } = require('ethers');
            const axios = require('axios');

            const keyPair = await mnemonicToPrivateKey(process.env.BOT_TON_SEED.split(' '));
            const wallet = WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey });
            
            let seqno = 0;
            try {
                // Fetch seqno from Toncenter
                const seqnoRes = await axios.get(\`https://toncenter.com/api/v2/getWalletInformation?address=\${wallet.address.toString(true, true, true)}\`);
                seqno = seqnoRes.data?.result?.seqno || 0;
            } catch(e) {
                seqno = 0;
            }

            const amountNano = ethers.parseUnits(amount.toString(), 9);

            const transfer = wallet.createTransfer({
                seqno,
                secretKey: keyPair.secretKey,
                messages: [
                    internal({
                        to: destination,
                        value: amountNano,
                        bounce: false,
                        body: "Withdrawal from Maruf Teach Bot"
                    })
                ]
            });
            
            // Wrap in External Message for Toncenter
            const extMsg = beginCell().store(storeMessage(external({
                to: wallet.address,
                body: transfer
            }))).endCell();

            const boc = extMsg.toBoc().toString('base64');
            
            try {
                await axios.post('https://toncenter.com/api/v2/sendBoc', { boc });
                res.json({ success: true, message: \`Successfully sent \${amount} TON/GRAM to \${destination}\` });
            } catch (err) {
                console.error(err.response?.data || err.message);
                const apiErr = err.response?.data?.error || err.message;
                res.status(500).json({ error: "Blockchain rejected transfer: " + apiErr });
            }
        } else {
            res.status(400).json({ error: "EVM Withdrawal not fully implemented yet." });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});`;

const oldWithdraw = /app\.post\('\/api\/withdraw', async \(req, res\) => \{[\s\S]*?res\.status\(500\)\.json\(\{ error: error\.message \}\);\s*\}\s*\}\);/;

if(code.match(oldWithdraw)) {
    code = code.replace(oldWithdraw, newWithdraw);
    fs.writeFileSync('index.js', code, 'utf8');
    console.log("Patched to wrap BOC in external message!");
} else {
    console.log("Could not find old withdraw API.");
}
