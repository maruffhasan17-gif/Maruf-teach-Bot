const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');
code = code.replace(
    "await db.collection('valid_referrals').doc(uname).set({",
    "if (uname.includes('/')) return;\n                await db.collection('valid_referrals').doc(uname).set({"
);
fs.writeFileSync('index.js', code, 'utf8');
