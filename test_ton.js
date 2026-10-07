require('dotenv').config();
const { TonClient, WalletContractV4 } = require('@ton/ton');
const { mnemonicToPrivateKey } = require('@ton/crypto');
const { getHttpEndpoint } = require('@orbs-network/ton-access');

async function test() {
    try {
        const keyPair = await mnemonicToPrivateKey(process.env.BOT_TON_SEED.split(' '));
        const wallet = WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey });
        const endpoint = await getHttpEndpoint();
        const client = new TonClient({ endpoint });
        const contract = client.open(wallet);
        console.log("Endpoint:", endpoint);
        const balance = await contract.getBalance();
        console.log("Balance:", balance.toString());
        const seqno = await contract.getSeqno();
        console.log("Seqno:", seqno);
    } catch(e) {
        console.error("Error:", e.message);
    }
}
test();
