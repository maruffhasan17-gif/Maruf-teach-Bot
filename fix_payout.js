const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

const regexFreePayout = /const \{ TonClient, WalletContractV4, internal \} = require\('@ton\/ton'\);[\s\S]*?await contract\.sendTransfer\(\{\s*seqno,\s*secretKey: keyPair\.secretKey,\s*messages: \[\s*internal\(\{\s*to: address,\s*value: amount\.toString\(\),\s*bounce: false,\s*body: 'Free Reward from Maruf Teach'\s*\}\)\s*\]\s*\}\);/g;

const newFreePayout = `const { WalletContractV4, internal } = require('@ton/ton');
            const { mnemonicToPrivateKey } = require('@ton/crypto');
            const { ethers } = require('ethers');
            const axios = require('axios');

            const keyPair = await mnemonicToPrivateKey(process.env.BOT_TON_SEED.split(' '));
            const wallet = WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey });
            
            // Fetch seqno from TonAPI
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
            const broadcastRes = await axios.post('https://tonapi.io/v2/blockchain/message', { boc });
`;

if (code.match(regexFreePayout)) {
    code = code.replace(regexFreePayout, newFreePayout);
    fs.writeFileSync('index.js', code, 'utf8');
    console.log("Patched free payout!");
} else {
    console.log("Free payout regex failed!");
}

// Now admin withdraw API
const regexAdminWithdraw = /const \{ getHttpEndpoint \} = require\('@orbs-network\/ton-access'\);[\s\S]*?await contract\.sendTransfer\(\{\s*seqno,\s*secretKey: keyPair\.secretKey,\s*messages: \[\s*internal\(\{\s*to: destination,\s*value: amount\.toString\(\),\s*bounce: false,\s*body: "Withdrawal from Maruf Teach Bot"\s*\}\)\s*\]\s*\}\);/g;

const newAdminWithdraw = `const { WalletContractV4, internal } = require('@ton/ton');
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

if (code.match(regexAdminWithdraw)) {
    code = code.replace(regexAdminWithdraw, newAdminWithdraw);
    fs.writeFileSync('index.js', code, 'utf8');
    console.log("Patched admin withdraw!");
} else {
    console.log("Admin withdraw regex failed!");
}
