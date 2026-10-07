const fs = require('fs');
let c = fs.readFileSync('index.js', 'utf8');

c = c.replace(/const text = \?\? \*Admin Treasury Wallet.*?;/gs, "const text = ?? *Admin Treasury Wallet*\\n\\n?? Address: \\${botWallet.address}\\\\n?? Balance: ** TON**\\n?? USDT: ** USDT**;");

fs.writeFileSync('index.js', c);
