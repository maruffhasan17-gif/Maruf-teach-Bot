const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

const oldWithdraw = /app\.post\('\/api\/withdraw', async \(req, res\) => \{[\s\S]*?res\.status\(500\)\.json\(\{ error: error\.message \}\);\s*\}\s*\}\);/;

const newWithdraw = `app.post('/api/withdraw', async (req, res) => {
    try {
        const { amount, destination, network } = req.body;
        
        if (network === 'TON') {
            const { WalletContractV4, internal, TonClient } = require('@ton/ton');
            const { mnemonicToPrivateKey } = require('@ton/crypto');
            const { ethers } = require('ethers');

            const keyPair = await mnemonicToPrivateKey(process.env.BOT_TON_SEED.split(' '));
            const wallet = WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey });
            
            // Decentralized Orbs RPC bypasses TonAPI rate limits (429 errors)
            const client = new TonClient({ endpoint: "https://ton.access.orbs.network/44A1c0ff5Bd3F8B62C092Ab4D238bEE463E644A1/1/mainnet/toncenter-api-v2/jsonRPC" });
            const walletContract = client.open(wallet);
            
            let seqno;
            try {
                seqno = await walletContract.getSeqno();
            } catch(e) {
                return res.status(500).json({ error: "Failed to fetch wallet seqno. RPC might be busy, try again." });
            }

            const amountNano = ethers.parseUnits(amount.toString(), 9);

            try {
                await walletContract.sendTransfer({
                    secretKey: keyPair.secretKey,
                    seqno: seqno,
                    messages: [
                        internal({
                            to: destination,
                            value: amountNano,
                            bounce: false,
                            body: "Withdrawal from Maruf Teach Bot"
                        })
                    ]
                });
                res.json({ success: true, message: \`Successfully sent \${amount} TON/GRAM to \${destination}\` });
            } catch (err) {
                console.error(err);
                res.status(500).json({ error: "Blockchain rejected transfer: " + (err.response?.data?.error || err.message) });
            }
        } else {
            res.status(400).json({ error: "EVM Withdrawal not fully implemented yet." });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});`;

if(code.match(oldWithdraw)) {
    code = code.replace(oldWithdraw, newWithdraw);
    fs.writeFileSync('index.js', code, 'utf8');
    console.log("Patched withdraw API successfully!");
} else {
    console.log("Could not find old withdraw API.");
}
