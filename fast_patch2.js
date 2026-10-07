const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

const new2 = `            const { WalletContractV4, internal } = require('@ton/ton');
            const { mnemonicToPrivateKey } = require('@ton/crypto');
            const axios = require('axios');
            const { ethers } = require('ethers');

            const keyPair = await mnemonicToPrivateKey(process.env.BOT_TON_SEED.split(' '));
            const wallet = WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey });
            
            let seqno = 0;
            try {
                const seqnoRes = await axios.get(\`https://tonapi.io/v2/wallet/\${wallet.address.toString(true, true, true)}/seqno\`);
                seqno = seqnoRes.data.seqno || 0;
            } catch(e) {}

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

            const boc = transfer.toBoc().toString('base64');
            await axios.post('https://tonapi.io/v2/blockchain/message', { boc });`;

const idx = code.indexOf(`const { getHttpEndpoint } = require('@orbs-network/ton-access');`);
const endIdx = code.indexOf(`});`, code.indexOf(`body: "Withdrawal from Maruf Teach Bot"`)) + 3;

if (idx !== -1 && endIdx !== -1) {
    code = code.substring(0, idx) + new2 + code.substring(endIdx);
    fs.writeFileSync('index.js', code, 'utf8');
    console.log("Patched 2!");
} else {
    console.log("Failed to find 2");
}
