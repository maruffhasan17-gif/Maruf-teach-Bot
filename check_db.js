const admin = require('firebase-admin');
const serviceAccount = require('./maruf-teach-firebase-adminsdk-fbsvc-e0269310ba.json');
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();

async function check() {
    const snapshot = await db.collection('miniapp_buys').orderBy('timestamp', 'desc').limit(5).get();
    snapshot.forEach(doc => {
        console.log("ID:", doc.id, "=>", doc.data());
    });
    process.exit(0);
}
check();
