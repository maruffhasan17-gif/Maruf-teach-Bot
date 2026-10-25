import os

with open('index.js', 'r', encoding='utf-8') as f:
    code = f.read()

mockEndpoint = """
app.post('/api/admin/create-mock-trx', async (req, res) => {
    try {
        const { trxId, amount } = req.body;
        if (!trxId || !amount) return res.status(400).json({ error: "Missing TrxID or Amount" });
        
        await db.collection('verified_trx').doc(trxId.toUpperCase()).set({
            message: 'You have received Tk ' + amount + ' from 01915898899. Fee Tk 0.00. Balance Tk 5,000.00. TrxID ' + trxId.toUpperCase() + ' at 10/10/2026 15:20',
            amount: parseFloat(amount),
            timestamp: FieldValue.serverTimestamp()
        });
        
        res.json({ success: true, message: 'Mock TrxID injected!' });
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});
"""

code = code.replace("app.post('/api/settings',", mockEndpoint + "\napp.post('/api/settings',")

with open('index.js', 'w', encoding='utf-8') as f:
    f.write(code)
