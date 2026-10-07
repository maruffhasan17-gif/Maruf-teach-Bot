const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

const targetStr = `        // Handle Admin Manual Verification Reply
        if (config.adminGroupId === chatId.toString() && msg.reply_to_message && msg.reply_to_message.photo && text) {`;

const endTarget = `bot.sendMessage(chatId, '✅ Usernames added: ' + usernames.join(', '));
        }
        return; // Stop processing further for group messages`;

const newBlock = `
        // Handle Admin Manual Verification Reply
        if (config.adminGroupId === chatId.toString() && msg.reply_to_message && text) {
            const replyText = text.toLowerCase().trim();
            const caption = msg.reply_to_message.caption || msg.reply_to_message.text || '';
            const match = caption.match(/ID:\\s*(\\d+)/);
            
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
                return; // Stop processing since it was handled
            }
        }

        if (config.adminGroupId === chatId.toString() && text && !text.startsWith('/')) {
            const replyText = text.toLowerCase().trim();
            if (replyText === 'ok' || replyText === 'wrong') return; // Ignore bare ok/wrong

            // Process usernames sent by admin
            const usernames = text.split(/[\\s,\\n]+/).map(u => u.replace('@', '').trim().toLowerCase()).filter(u => u.length > 0);
            
            for (const uname of usernames) {
                // Save to valid_referrals in Firestore
                await db.collection('valid_referrals').doc(uname).set({
                    addedAt: new Date().toISOString()
                }, {merge: true});
            }
            bot.sendMessage(chatId, '✅ Usernames added: ' + usernames.join(', '));
        }
        return; // Stop processing further for group messages`;

const startIndex = code.indexOf(`        // Handle Admin Manual Verification Reply`);
const endIndex = code.indexOf(`return; // Stop processing further for group messages`, startIndex) + `return; // Stop processing further for group messages`.length;

if (startIndex !== -1 && endIndex !== -1) {
    code = code.substring(0, startIndex) + newBlock.trim() + code.substring(endIndex);
    fs.writeFileSync('index.js', code, 'utf8');
    console.log("Admin group block fully replaced!");
} else {
    console.log("Could not find blocks to replace");
}
