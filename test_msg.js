require('dotenv').config();
const { WalletContractV4, internal, external, storeMessage, beginCell } = require('@ton/ton');
const { mnemonicToPrivateKey } = require('@ton/crypto');
const axios = require('axios');
const { ethers } = require('ethers');

async function test() {
    try {
        const keyPair = await mnemonicToPrivateKey(process.env.BOT_TON_SEED.split(' '));
        const wallet = WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey });
        
        let seqno = 0;
        try {
            const seqnoRes = await axios.get(`https://tonapi.io/v2/wallet/${wallet.address.toString(true, true, true)}/seqno`);
            seqno = seqnoRes.data.seqno || 0;
        } catch(e) {}

        const amountNano = ethers.parseUnits('0.07', 9);

        const transfer = wallet.createTransfer({
            seqno,
            secretKey: keyPair.secretKey,
            messages: [
                internal({
                    to: 'UQDaMgqOpvhdqNXHicYl_muvjEHVkDjJRn3-2iUFKhZPn4Ck',
                    value: amountNano,
                    bounce: false,
                    body: 'Free Reward from Maruf Teach'
                })
            ]
        });

        // Wrap in external message
        const extMessage = external({
            to: wallet.address,
            init: seqno === 0 ? wallet.init : null,
            body: transfer
        });

        const boc = beginCell().store(storeMessage(extMessage)).endCell().toBoc().toString('base64');
        console.log("Sending BOC...");
        try {
            const broadcastRes = await axios.post('https://tonapi.io/v2/blockchain/message', { boc });
            console.log("Success:", broadcastRes.data);
        } catch (err) {
            console.error("406 Error response:", err.response?.data || err.message);
        }
    } catch(e) {
        console.error("Error:", e.message);
    }
}
test();
