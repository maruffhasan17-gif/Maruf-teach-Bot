require('dotenv').config();
const { WalletContractV4, internal } = require('@ton/ton');
const { mnemonicToPrivateKey } = require('@ton/crypto');
const axios = require('axios');

async function test() {
    try {
        const keyPair = await mnemonicToPrivateKey(process.env.BOT_TON_SEED.split(' '));
        const wallet = WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey });
        
        // 1. Get seqno from TonAPI
        let seqno = 0;
        try {
            const res = await axios.get(`https://tonapi.io/v2/wallet/${wallet.address.toString(true, true, true)}/seqno`);
            seqno = res.data.seqno || 0;
        } catch(e) { console.log("Seqno err:", e.message); }
        console.log("Seqno:", seqno);

        // 2. Create transfer
        const transfer = wallet.createTransfer({
            seqno,
            secretKey: keyPair.secretKey,
            messages: [
                internal({
                    to: 'UQDaMgqOpvhdqNXHicYl_muvjEHVkDjJRn3-2iUFKhZPn4Ck',
                    value: '0.001', // test tiny amount
                    bounce: false,
                    body: 'Test'
                })
            ]
        });

        // 3. Serialize
        const boc = transfer.toBoc().toString('base64');
        console.log("BOC:", boc);

        // We won't actually broadcast it yet, just checking generation
    } catch(e) {
        console.error("Error:", e.message);
    }
}
test();
