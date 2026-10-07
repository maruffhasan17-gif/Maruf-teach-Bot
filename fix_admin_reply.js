const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

const targetIndex = code.indexOf("if (config.adminGroupId === chatId.toString() && text && !text.startsWith('/')) {");
if (targetIndex !== -1) {
    const newBlock = `
        // Handle Admin Manual Verification Reply
        if (config.adminGroupId === chatId.toString() && msg.reply_to_message && msg.reply_to_message.photo && text) {
            const replyText = text.toLowerCase().trim();
            const caption = msg.reply_to_message.caption || '';
            const match = caption.match(/ID: \`(\d+)\`/);
            
            if (match && match[1]) {
                const targetUserId = match[1];
                if (!userStates[targetUserId]) userStates[targetUserId] = { failedAttempts: 0, lang: 'en' };
                const lang = userStates[targetUserId].lang || 'en';
                
                if (replyText === 'ok') {
                    userStates[targetUserId].step = 'awaiting_ton_address_free';
                    const successText = lang === 'bn' ? \`✅ **অ্যাডমিন আপনার স্ক্রিনশট অ্যাপ্রুভ করেছেন!**\\n\\nএখন আপনার **TON Address** দিন পেমেন্ট রিসিভ করার জন্য:\` : \`✅ **Admin Approved!**\\n\\nNow send your **TON Address** to receive your payment:\`;
                    bot.sendMessage(targetUserId, successText, { parse_mode: 'Markdown' });
                    bot.sendMessage(chatId, \`✅ Approved user \${targetUserId}\`);
                } else if (replyText === 'wrong') {
                    delete userStates[targetUserId].step;
                    const rejectText = lang === 'bn' ? \`❌ **ভেরিফিকেশন ব্যর্থ!** আপনার স্ক্রিনশটটি বাতিল করা হয়েছে।\` : \`❌ **Verification Failed.** Your screenshot was rejected by the admin.\`;
                    bot.sendMessage(targetUserId, rejectText, { parse_mode: 'Markdown' });
                    bot.sendMessage(chatId, \`❌ Rejected user \${targetUserId}\`);
                }
            }
            return; // Stop processing since it's a reply
        }

        if (config.adminGroupId === chatId.toString() && text && !text.startsWith('/')) {`;
    
    code = code.replace("if (config.adminGroupId === chatId.toString() && text && !text.startsWith('/')) {", newBlock);
    fs.writeFileSync('index.js', code, 'utf8');
    console.log("Admin reply logic added successfully!");
} else {
    console.log("Could not find the target string!");
}
