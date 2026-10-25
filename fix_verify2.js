const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

const regex = /if \(query\.data === 'verify_join'\) \{[\s\S]*?if \(query\.data === 'lang_en' \|\| query\.data === 'lang_bn'\)/;

const newLogic = `if (query.data === 'verify_join') {
        try {
            const chatMember = await bot.getChatMember(channelUsername, userId);
            if (chatMember.status === 'member' || chatMember.status === 'administrator' || chatMember.status === 'creator') {
                
                await db.collection('users').doc(chatId.toString()).update({ status: 'verified', language: 'bn' }); // Default to BN
                userStates[chatId].lang = 'bn';
                
                // 1. Remove the old inline keyboard from the /start message
                bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: chatId, message_id: query.message.message_id }).catch(()=>{});

                // 2. Send a nice welcome message and remove any persistent bottom keyboard
                await bot.sendMessage(chatId, "🎉 **ভেরিফিকেশন সফল হয়েছে!**\\n\\nআপনাকে আমাদের প্ল্যাটফর্মে স্বাগতম।", { 
                    parse_mode: 'Markdown',
                    reply_markup: { remove_keyboard: true } 
                });
                
                // 3. Send the App Open button
                bot.sendMessage(chatId, "👇 **নিচের বোতামে ক্লিক করে অ্যাপটি ওপেন করুন:**", getMenu('bn'));
                
            } else {
                bot.answerCallbackQuery(query.id, { text: t.en.notJoined, show_alert: true });
            }
        } catch (error) {
            bot.answerCallbackQuery(query.id, { text: t.en.notJoined, show_alert: true });
        }
    }
    
    if (query.data === 'lang_en' || query.data === 'lang_bn')`;

code = code.replace(regex, newLogic);
fs.writeFileSync('index.js', code);
