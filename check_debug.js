require('dotenv').config();
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = require('./maruf-teach-firebase-adminsdk-fbsvc-e0269310ba.json');
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function check() {
    const snapshot = await db.collection('debug_logs').orderBy('timestamp', 'desc').limit(5).get();
    if(snapshot.empty) {
        console.log("No debug logs found");
        return;
    }
    snapshot.forEach(doc => {
        console.log("--- LOG ---");
        console.log(JSON.stringify(doc.data(), null, 2));
    });
}
check().catch(console.error);
