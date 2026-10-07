const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

const oldCatch = `} catch (error) {
            userStates[chatId].failedAttempts = (userStates[chatId].failedAttempts || 0) + 1;
            
            // Upload to Supabase and Log to Firestore
            try {
                const photo = msg.photo[msg.photo.length - 1];`;

const newCatch = `} catch (error) {
            console.error("AI Error:", error.message);
            
            if (isFreeTask) {
                // Fallback to manual review if AI throws an error (e.g. JSON parse failure, API error)
                const reviewMsg = lang === 'bn' ? "⏳ **আপনার স্ক্রিনশটটি ম্যানুয়াল রিভিউতে পাঠানো হয়েছে।**\\n\\nযাচাই হতে ৫ মিনিট পর্যন্ত সময় লাগতে পারে।" : "⏳ **Your screenshot has been sent for manual review.**\\n\\nVerification may take up to 5 minutes.";
                bot.sendMessage(chatId, reviewMsg, { parse_mode: 'Markdown' });
                
                try {
                    const config = JSON.parse(require('fs').readFileSync('config.json', 'utf8'));
                    if (config.adminGroupId) {
                        bot.sendPhoto(config.adminGroupId, msg.photo[msg.photo.length - 1].file_id, {
                            caption: \`🔍 **Manual Review Needed (Free Task Fallback)**\\n\\nUser: \${userFirstName} (@\${userUsername})\\nID: \\\`\${chatId}\\\`\\n\\nReply to this photo with **ok** to approve, or **wrong** to reject.\`,
                            parse_mode: 'Markdown'
                        });
                    }
                } catch(e) {}
                return; // Stop further processing
            }

            userStates[chatId].failedAttempts = (userStates[chatId].failedAttempts || 0) + 1;
            
            // Upload to Supabase and Log to Firestore
            try {
                const photo = msg.photo[msg.photo.length - 1];`;

code = code.replace(oldCatch, newCatch);
fs.writeFileSync('index.js', code, 'utf8');
console.log('Patched catch block');
