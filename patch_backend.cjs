const fs = require('fs');
let c = fs.readFileSync('index.js', 'utf8');

c = c.replace(
    /app\.get\('\/api\/settings', \(req, res\) => \{[\s\S]*?\}\);/,
    `app.get('/api/settings', (req, res) => {
    try {
        const config = botConfig || {};
        if (!config.adminBkash) config.adminBkash = '01752561935';
        if (!config.adminNagad) config.adminNagad = '01878580320';
        res.json(config);
    } catch (e) {
        res.json({ gramAmount: '0.07', usdtAmount: '0.05', freeLink: 'https://t.me/VictorsCompanybot/app?startapp=ref_DBF2368328', adminBkash: '01752561935', adminNagad: '01878580320' });
    }
});`
);

fs.writeFileSync('index.js', c);
console.log('Backend patched');
