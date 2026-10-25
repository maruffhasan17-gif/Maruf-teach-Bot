const fs = require('fs');

let code = fs.readFileSync('index.js', 'utf8');

const target = \pp.post('/api/macrodroid/webhook', async (req, res) => {
    try {
        const sender = req.body.sender || req.query.sender || 'Unknown';
        const message = req.body.message || req.query.message || '';
        
        const match = message.match(/(?:TrxID|TxnID)[\\\\s:]*([A-Za-z0-9]+)/i);\;

const replacement = \pp.post('/api/macrodroid/webhook', async (req, res) => {
    try {
        const sender = req.body.sender || req.query.sender || 'Unknown';
        const message = req.body.message || req.query.message || '';
        
        const validSenders = ['bkash', 'nagad'];
        if (!validSenders.includes(sender.toLowerCase())) {
            console.warn('Blocked fake SMS from ' + sender);
            return res.status(403).json({ error: "Fraud attempt blocked! Sender must be bKash or Nagad" });
        }
        
        const match = message.match(/(?:TrxID|TxnID)[\\\\s:]*([A-Za-z0-9]+)/i);\;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('index.js', code);
    console.log("Patched successfully");
} else {
    console.log("Target not found. Let's try flexible replace");
    
    // flexible regex replace
    const flexPattern = /app\\.post\\('\\/api\\/macrodroid\\/webhook', async \\(req, res\\) => \\{\\s*try \\{\\s*const sender = req\\.body\\.sender \\|\\| req\\.query\\.sender \\|\\| 'Unknown';\\s*const message = req\\.body\\.message \\|\\| req\\.query\\.message \\|\\| '';/;
    if (flexPattern.test(code)) {
        code = code.replace(flexPattern, \pp.post('/api/macrodroid/webhook', async (req, res) => {
    try {
        const sender = req.body.sender || req.query.sender || 'Unknown';
        const message = req.body.message || req.query.message || '';
        
        const validSenders = ['bkash', 'nagad'];
        if (!validSenders.includes(sender.toLowerCase())) {
            console.warn('Blocked fake SMS from ' + sender);
            return res.status(403).json({ error: "Fraud attempt blocked! Sender must be bKash or Nagad" });
        }\);
        fs.writeFileSync('index.js', code);
        console.log("Patched with regex successfully");
    } else {
        console.log("Still not found");
    }
}
