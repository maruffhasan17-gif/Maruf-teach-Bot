const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

const txEndpoint = `
app.get('/api/transactions', async (req, res) => {
    try {
        const snapshot = await db.collection('free_claims').orderBy('timestamp', 'desc').limit(50).get();
        const txs = [];
        snapshot.forEach(doc => {
            txs.push({
                userId: doc.id,
                ...doc.data()
            });
        });
        res.json(txs);
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});
`;

code = code.replace("app.post('/api/withdraw', async (req, res) => {", txEndpoint + "\napp.post('/api/withdraw', async (req, res) => {");

fs.writeFileSync('index.js', code, 'utf8');
console.log("Added tx endpoint!");
