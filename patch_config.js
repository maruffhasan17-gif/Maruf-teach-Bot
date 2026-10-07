const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

// 1. Inject config initialization near the top (after db init)
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
code = code.replace("const db = admin.firestore();", "const db = admin.firestore();\n" + initCode);

// 2. Replace all readSyncs with botConfig
code = code.replace(/const config = JSON\.parse\(require\('fs'\)\.readFileSync\('config\.json', 'utf8'\)\);/g, "const config = botConfig;");

// 3. Replace writeSync in /setgroup
code = code.replace(/config\.adminGroupId = chatId\.toString\(\);\s*require\('fs'\)\.writeFileSync\('config\.json', JSON\.stringify\(config, null, 2\)\);/g, "await saveConfig({ adminGroupId: chatId.toString() });");

// 4. Replace writeSync in /api/settings
code = code.replace(/require\('fs'\)\.writeFileSync\('config\.json', JSON\.stringify\(req\.body, null, 2\)\);/g, "await saveConfig(req.body);");

fs.writeFileSync('index.js', code, 'utf8');
console.log('Config patched successfully!');
