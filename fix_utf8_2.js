const fs = require('fs');
let c = fs.readFileSync('index.js', 'utf8');

c = c.replace(/lang === 'bn' \? ".*?" : ".*?Sorry!.*?"/, "lang === 'bn' ? '🚫 **দুঃখিত!** বটটি শুধুমাত্র দুপুর ১২টা থেকে রাত ১২টা পর্যন্ত চালু থাকে। অনুগ্রহ করে কাল দুপুর ১২টার পর আবার চেষ্টা করুন।' : '🚫 **Sorry!** The bot is only open from 12 PM to 12 AM BD Time. Please try again later.'");

c = c.replace(/lang === 'bn' \? ".*?" : ".*?Fraud Detected!.*?"/, "lang === 'bn' ? '⚠️ **ফ্রড ডিটেক্টেড!** আপনি ইতিমধ্যেই আপনার ফ্রি রিওয়ার্ড ক্লেইম করেছেন। একজন ইউজার মাত্র একবারই নিতে পারবেন!' : '⚠️ **Fraud Detected!** You have already claimed your free reward!'");

c = c.replace(/lang === 'bn' \? ".*?" : ".*?Verifying your account.*?\"/, "lang === 'bn' ? '⏳ *আপনার অ্যাকাউন্ট যাচাই করা হচ্ছে...*' : '⏳ *Verifying your account...*'");

fs.writeFileSync('index.js', c, 'utf8');
