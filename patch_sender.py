import sys

with open('index.js', 'r', encoding='utf-8') as f:
    code = f.read()

target = """app.post('/api/macrodroid/webhook', async (req, res) => {
    try {
        const sender = req.body.sender || req.query.sender || 'Unknown';
        const message = req.body.message || req.query.message || '';
        
        const match = message.match(/(?:TrxID|TxnId|TxnID|TrxId)[\\s:]*([A-Za-z0-9]+)/i);"""

replacement = """app.post('/api/macrodroid/webhook', async (req, res) => {
    try {
        const sender = req.body.sender || req.query.sender || 'Unknown';
        const message = req.body.message || req.query.message || '';
        
        // SECURITY BLOCK: Prevent spoofed SMS
        const validSenders = ['bkash', 'nagad'];
        if (!validSenders.includes(sender.toLowerCase())) {
            console.warn(?? Blocked fake SMS from );
            return res.status(403).json({ error: "Fraud attempt blocked! Sender must be bKash or Nagad" });
        }
        
        const match = message.match(/(?:TrxID|TxnId|TxnID|TrxId)[\\s:]*([A-Za-z0-9]+)/i);"""

if target in code:
    code = code.replace(target, replacement)
    with open('index.js', 'w', encoding='utf-8') as f:
        f.write(code)
    print("Patched successfully")
else:
    print("Target not found")
