const { mnemonicNew, mnemonicToPrivateKey } = require('@ton/crypto');
const { WalletContractV4, TonClient, internal, SendMode } = require('@ton/ton');
const { getFirestore } = require('firebase-admin/firestore');

async function getOrCreateBotWallet() {
    const db = getFirestore();
    const docRef = db.collection('config').doc('botWallet');
    const doc = await docRef.get();
    
    let mnemonics;
    if (doc.exists) {
        mnemonics = doc.data().mnemonics;
    } else {
        mnemonics = await mnemonicNew();
        await docRef.set({ mnemonics });
    }
    
    const keyPair = await mnemonicToPrivateKey(mnemonics);
    const workchain = 0;
    const wallet = WalletContractV4.create({ workchain, publicKey: keyPair.publicKey });
    
    return {
        address: wallet.address.toString({ testOnly: false }),
        wallet,
        keyPair
    };
}

module.exports = { getOrCreateBotWallet };
