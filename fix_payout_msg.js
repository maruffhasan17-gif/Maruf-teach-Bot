const fs = require('fs');
let c = fs.readFileSync('index.js', 'utf8');

const oldErrorStr = "bot.sendMessage(chatId, '❌ Failed to send payment. Error: ' + (e.response && e.response.data && e.response.data.error ? JSON.stringify(e.response.data.error) : e.message) + '\\n\\nThe network might be busy (Seqno conflict). Please click Try Again.', {";

const newErrorStr = "const errorMsg = lang === 'bn' ? '⚠️ **পেমেন্ট ফেইলড!**\\n\\nঅ্যাডমিন ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই অথবা নেটওয়ার্ক বিজি আছে। দয়া করে কিছুক্ষণ পর আবার চেষ্টা করুন।' : '⚠️ **Payment Failed!**\\n\\nAdmin wallet balance might be low or network is busy. Please try again later.';\\n            bot.sendMessage(chatId, errorMsg, { parse_mode: 'Markdown',";

c = c.replace(oldErrorStr, newErrorStr);
fs.writeFileSync('index.js', c, 'utf8');
