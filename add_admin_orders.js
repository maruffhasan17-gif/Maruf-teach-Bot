const fs = require('fs');
let content = fs.readFileSync('index.js', 'utf8');

const orderEndpoints = `
app.get('/api/admin/orders', async (req, res) => {
    try {
        const buysSnapshot = await db.collection('miniapp_buys').orderBy('timestamp', 'desc').limit(100).get();
        const sellsSnapshot = await db.collection('miniapp_sells').orderBy('timestamp', 'desc').limit(100).get();
        
        const buys = buysSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        const sells = sellsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

        res.json({ buys, sells });
    } catch(e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/admin/approve-buy', async (req, res) => {
    try {
        const { id } = req.body;
        const buyRef = db.collection('miniapp_buys').doc(id);
        const doc = await buyRef.get();
        if(!doc.exists) return res.status(404).json({ error: 'Not found' });
        
        const order = doc.data();
        if (order.status !== 'pending') return res.status(400).json({ error: 'Already processed' });

        await buyRef.update({ status: 'completed' });
        bot.sendMessage(order.userId, '🎉 Your payment for ' + order.amount + ' ' + order.asset + ' has been manually verified by Admin!\\n\\nThe admin will send the asset to your wallet shortly.');
        
        res.json({ success: true });
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

`;

if (!content.includes('/api/admin/orders')) {
    content = content.replace("app.post('/api/settings',", orderEndpoints + "\napp.post('/api/settings',");
    fs.writeFileSync('index.js', content, 'utf8');
    console.log("Added admin endpoints.");
} else {
    console.log("Endpoints already exist.");
}
