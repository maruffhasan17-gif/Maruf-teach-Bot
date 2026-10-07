import io
import re

with io.open('index.js', 'r', encoding='utf-8') as f:
    content = f.read()

header = "const { beginCell, Address } = require('@ton/core');\\nconst axios = require('axios');\\nconst app = express();"
content = content.replace('const app = express();', header)

build_tx = """app.post('/api/miniapp/build-tx', async (req, res) => {
    try {
        const { asset, amount, userAddress, adminWallet } = req.body;
        if (asset === 'USDT') {
            const response = await axios.get(https://tonapi.io/v2/accounts//jettons/EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs);
            let userJettonWallet = null;
            if (response.data && response.data.balances && response.data.balances.length > 0) {
                userJettonWallet = response.data.balances[0].wallet_address.address;
            } else {
                return res.status(400).json({ error: "USDT Wallet not found for this user" });
            }
            
            const amountInMicro = Math.floor(parseFloat(amount) * 1e6);
            const body = beginCell()
                .storeUint(0xf8a7ea5, 32)
                .storeUint(0, 64)
                .storeCoins(amountInMicro)
                .storeAddress(Address.parse(adminWallet))
                .storeAddress(Address.parse(userAddress))
                .storeBit(0)
                .storeCoins(1)
                .storeBit(0)
                .endCell();
            
            res.json({
                success: true,
                tx: {
                    validUntil: Math.floor(Date.now() / 1000) + 600,
                    messages: [{
                        address: userJettonWallet,
                        amount: '50000000',
                        payload: body.toBoc().toString('base64')
                    }]
                }
            });
        } else {
            const amountInNano = Math.floor(parseFloat(amount) * 1e9);
            res.json({
                success: true,
                tx: {
                    validUntil: Math.floor(Date.now() / 1000) + 600,
                    messages: [{
                        address: adminWallet,
                        amount: amountInNano.toString()
                    }]
                }
            });
        }
    } catch(e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/miniapp/sell', async (req, res) => {"""

content = content.replace("app.post('/api/miniapp/sell', async (req, res) => {", build_tx)

with io.open('index.js', 'w', encoding='utf-8') as f:
    f.write(content)
