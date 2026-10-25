const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

const target = "app.post('/api/macrodroid/webhook', async (req, res) => {\n    try {";
const replacement = `app.post('/api/macrodroid/webhook', async (req, res) => {
    try {
        await db.collection('debug_logs').add({
            body: req.body || {},
            query: req.query || {},
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('index.js', code);
    console.log("Patched debugger successfully");
} else {
    console.log("Not found");
}
