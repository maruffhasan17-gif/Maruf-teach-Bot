const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./maruf-teach-firebase-adminsdk-fbsvc-e0269310ba.json');
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function cleanup() {
    console.log('Cleaning verified_trx...');
    const snapshot1 = await db.collection('verified_trx').get();
    for (const doc of snapshot1.docs) {
        if (doc.id.length < 5) {
            console.log('Deleting verified_trx:', doc.id);
            await doc.ref.delete();
        }
    }

    console.log('Cleaning miniapp_buys...');
    const snapshot2 = await db.collection('miniapp_buys').get();
    for (const doc of snapshot2.docs) {
        if (doc.id.length < 5 || doc.data().trxId.length < 5) {
            console.log('Deleting miniapp_buys:', doc.id);
            await doc.ref.delete();
        }
    }
    console.log('Done!');
    process.exit(0);
}
cleanup();
