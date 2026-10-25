const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

const regex = /if \(text\.startsWith\('\/'\)\) return;\s*\/\/ Default reply for any other message\s*bot\.sendMessage\(chatId, "🎉 \*\*Click the button below to open the Web App:\*\*", getMenu\('bn'\)\);/;

const replaceWith = `if (text.startsWith('/')) return;
    
    // Default reply for any other message: send and remove keyboard
    bot.sendMessage(chatId, "👇 **নিচের বোতামে ক্লিক করে অ্যাপটি ওপেন করুন:**", getMenu('bn'));`;

code = code.replace(regex, replaceWith);
fs.writeFileSync('index.js', code);
