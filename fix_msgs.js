const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

code = code.replace("Choose an option from the menu below:", "Click the button below to open the Web App:");
code = code.replace("নিচের মেনু থেকে আপনার পছন্দমতো অপশনটি বেছে নিন:", "নিচের বোতামে ক্লিক করে ওয়েব অ্যাপটি ওপেন করুন:");

fs.writeFileSync('index.js', code);
