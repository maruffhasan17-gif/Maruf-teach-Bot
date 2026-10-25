const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

code = code.replace(/bot\.sendMessage\(userId, 'dYZ% Your payment/g, "bot.sendMessage(userId, '🎉 Your payment").replace(/\)\;/g, ").catch(e => console.log('Message error:', e.message));");
// wait, replacing `);` is dangerous!

// Let's do it manually with regex for the specific lines.
code = code.replace(/bot\.sendMessage\(userId, 'dYZ% /g, "bot.sendMessage(userId, '🎉 ").replace(/bot\.sendMessage\(8799135330, 'o\. /g, "bot.sendMessage(8799135330, '✅ ");

// Also we need to catch the promise errors:
code = code.replace(/bot\.sendMessage\(([^;]+)\);/g, "bot.sendMessage($1).catch(e => console.error('TG Error:', e.message));");

fs.writeFileSync('index.js', code);
