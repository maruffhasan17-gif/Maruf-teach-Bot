const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

const flexPattern = /app\.post\('\/api\/macrodroid\/webhook', async \(req, res\) => \{\s*try \{\s*const sender = req\.body\.sender \|\| req\.query\.sender \|\| 'Unknown';\s*const message = req\.body\.message \|\| req\.query\.message \|\| '';\s*const validSenders = \['bkash', 'nagad'\];\s*if \(!validSenders\.includes\(sender\.toLowerCase\(\)\)\) \{/;

if (flexPattern.test(code)) {
    code = code.replace(flexPattern, `app.post('/api/macrodroid/webhook', async (req, res) => {
    try {
        const sender = (req.body.sender || req.query.sender || 'Unknown').trim();
        const message = req.body.message || req.query.message || '';
        
        const validSenders = ['bkash', 'nagad'];
        if (!validSenders.includes(sender.toLowerCase())) {`);
    fs.writeFileSync('index.js', code);
    console.log("Patched trim successfully");
} else {
    console.log("Not found");
}
