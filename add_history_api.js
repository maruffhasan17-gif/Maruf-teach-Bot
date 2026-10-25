const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

const historyApi = `
app.get('/api/miniapp/history/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        
        const buysSnapshot = await db.collection('miniapp_buys').where('userId', '==', userId).get();
        const sellsSnapshot = await db.collection('miniapp_sells').where('userId', '==', userId).get();
        
        const history = [];
        buysSnapshot.forEach(doc => history.push({ id: doc.id, type: 'buy', ...doc.data() }));
        sellsSnapshot.forEach(doc => history.push({ id: doc.id, type: 'sell', ...doc.data() }));
        
        history.sort((a, b) => {
            const timeA = a.timestamp ? a.timestamp.toMillis() : Date.now();
            const timeB = b.timestamp ? b.timestamp.toMillis() : Date.now();
            return timeB - timeA;
        });
        
        res.json({ success: true, history });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});
`;

code = code.replace("app.use('/app', (req, res) => {", historyApi + "\napp.use('/app', (req, res) => {");
fs.writeFileSync('index.js', code);
