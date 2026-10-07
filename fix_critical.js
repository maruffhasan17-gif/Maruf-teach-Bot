const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

const initCode = `
let botConfig = {
    gramAmount: '0.07',
    usdtAmount: '0.05',
    freeLink: 'https://t.me/ShardsEarnBot/app?startapp=8799135330',
    adminGroupId: ''
};
async function loadConfig() {
    try {
        const doc = await db.collection('settings').doc('config').get();
        if (doc.exists) botConfig = { ...botConfig, ...doc.data() };
    } catch(e) { console.error("Config load error:", e); }
}
loadConfig();
async function saveConfig(newConf) {
    botConfig = { ...botConfig, ...newConf };
    try { await db.collection('settings').doc('config').set(botConfig, { merge: true }); } catch(e) {}
}
`;

code = code.replace("const db = getFirestore();", "const db = getFirestore();\n" + initCode);

// Fix ENOENT for admin/dist
code = code.replace(/app\.use\(\(req, res\) => \{\s*res\.sendFile\(path\.join\(__dirname, 'admin\/dist\/index\.html'\)\);\s*\}\);/, `app.use((req, res) => {
    const p = path.join(__dirname, 'admin/dist/index.html');
    if (require('fs').existsSync(p)) res.sendFile(p);
    else res.send("Backend is running!");
});`);

fs.writeFileSync('index.js', code, 'utf8');
console.log("Fixed!");
