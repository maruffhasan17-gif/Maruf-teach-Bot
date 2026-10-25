const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

const newApi = `app.get('/api/miniapp/user/:id', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const userRef = db.collection('users').doc(userId.toString());
        const userDoc = await userRef.get();
        
        let data = {};
        if (userDoc.exists) {
            data = userDoc.data();
        }

        let mbsId = data.mbsId;
        if (!mbsId) {
            let unique = false;
            while (!unique) {
                const randomDigits = Math.floor(10000 + Math.random() * 90000);
                const tempId = 'MBS' + randomDigits;
                const existing = await db.collection('users').where('mbsId', '==', tempId).get();
                if (existing.empty) {
                    mbsId = tempId;
                    unique = true;
                }
            }
            await userRef.set({ mbsId }, { merge: true });
        }

        res.json({ 
            balance: data.balance || 0,
            fiatWallet: data.fiatWallet || null,
            fiatWithdrawPending: data.fiatWithdrawPending || null,
            mbsId: mbsId
        });
    } catch(e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});`;

code = code.replace(/app\.get\('\/api\/miniapp\/user\/:id', async \(req, res\) => \{[\s\S]*?res\.status\(500\)\.json\(\{ error: e\.message \}\);\r?\n\s*\}\r?\n\}\);/, newApi);
fs.writeFileSync('index.js', code);
console.log("Updated user api");
