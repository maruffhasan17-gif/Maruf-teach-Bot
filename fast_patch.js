const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

const target1 = `            const { TonClient, WalletContractV4, internal } = require('@ton/ton');
            const { mnemonicToPrivateKey } = require('@ton/crypto');
            const { getHttpEndpoint } = require('@orbs-network/ton-access');
            const { ethers } = require('ethers');

            const keyPair = await mnemonicToPrivateKey(process.env.BOT_TON_SEED.split(' '));
            const wallet = WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey });
            const endpoint = await getHttpEndpoint();
            const client = new TonClient({ endpoint });
            const contract = client.open(wallet);

            const balance = await contract.getBalance();
            const amountNano = ethers.parseUnits(amount.toString(), 9);

            let seqno = 0;
            try { seqno = await contract.getSeqno(); } catch(e) {}

            const feeBuffer = seqno === 0 ? 15000000n : 10000000n;
            if (balance < amountNano + feeBuffer) {
                bot.sendMessage(chatId, '⚠️ Bot is out of balance. Please contact the admin.');
                return;
            }

            await contract.sendTransfer({
                seqno,
                secretKey: keyPair.secretKey,
                messages: [
                    internal({
                        to: address,
                        value: amount.toString(), // Wait, earlier I discovered value: amount.toString() sends nanoTON but internal() from ton-core converts it to nanoTON when given string. Wait, earlier I tested \`internal({value: "0.01"})\` and it output 10000000. So it is fine! 
                        bounce: false,
                        body: 'Free Reward from Maruf Teach'
                    })
                ]
            });`;

const new1 = `            const { WalletContractV4, internal } = require('@ton/ton');
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
                        to: address,
                        value: amountNano,
                        bounce: false,
                        body: 'Free Reward from Maruf Teach'
                    })
                ]
            });

            const boc = transfer.toBoc().toString('base64');
            await axios.post('https://tonapi.io/v2/blockchain/message', { boc });`;

const idx = code.indexOf(`const { TonClient, WalletContractV4, internal } = require('@ton/ton');`);
const endIdx = code.indexOf(`});`, code.indexOf(`body: 'Free Reward from Maruf Teach'`)) + 3;

if (idx !== -1 && endIdx !== -1) {
    code = code.substring(0, idx) + new1 + code.substring(endIdx);
    fs.writeFileSync('index.js', code, 'utf8');
    console.log("Patched 1!");
} else {
    console.log("Failed to find 1");
}
