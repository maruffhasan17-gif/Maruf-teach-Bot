const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

const regex = /if \(query\.data === 'verify_join'\) \{[\s\S]*?if \(query\.data === 'lang_en' \|\| query\.data === 'lang_bn'\)/;

const newLogic = `if (query.data === 'verify_join') {
        try {
            const chatMember = await bot.getChatMember(channelUsername, userId);
            if (chatMember.status === 'member' || chatMember.status === 'administrator' || chatMember.status === 'creator') {
                
                await db.collection('users').doc(chatId.toString()).update({ status: 'verified', language: 'bn' }); // Default to BN
                if (userStates[chatId]) userStates[chatId].lang = 'bn';
                
                // 1. Remove the old inline keyboard from the /start message
                bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: chatId, message_id: query.message.message_id }).catch(()=>{});

                // 2. Clear old persistent keyboard with a silent fast-deleting message
                bot.sendMessage(chatId, "...", { reply_markup: { remove_keyboard: true } }).then(delMsg => {
                    setTimeout(() => bot.deleteMessage(chatId, delMsg.message_id).catch(()=>{}), 100);
                }).catch(()=>{});

                // 3. Send ONE combined nice welcome message with the Open App button attached
                const msgText = "🎉 **ভেরিফিকেশন সফল হয়েছে!**\\n\\nআপনাকে আমাদের প্ল্যাটফর্মে স্বাগতম।\\n👇 **নিচের বোতামে ক্লিক করে অ্যাপটি ওপেন করুন:**";
                bot.sendMessage(chatId, msgText, {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [ { text: '🚀 অ্যাপ ওপেন করুন (Open App)', web_app: { url: 'https://maruf-teach-bot.onrender.com/app/' } } ]
                        ]
                    }
                });
                
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
