const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

const regex = /if \(query\.data === 'verify_join'\) \{[\s\S]*?if \(query\.data === 'lang_en' \|\| query\.data === 'lang_bn'\)/;

const newLogic = `if (query.data === 'verify_join') {
        try {
            const chatMember = await bot.getChatMember(channelUsername, userId);
            if (chatMember.status === 'member' || chatMember.status === 'administrator' || chatMember.status === 'creator') {
                
                await db.collection('users').doc(chatId.toString()).update({ status: 'verified', language: 'bn' }); // Default to BN
                userStates[chatId].lang = 'bn';
                
                // Remove old bottom keyboard invisibly by sending and deleting a message
                const delMsg = await bot.sendMessage(chatId, '...', { reply_markup: { remove_keyboard: true } });
                bot.deleteMessage(chatId, delMsg.message_id).catch(()=>{});

                // Send the Open App message
                bot.sendMessage(chatId, t.bn.mainMenuMsg, getMenu('bn'));
                
                // Optionally delete the Verify message to keep it clean
                bot.deleteMessage(chatId, query.message.message_id).catch(()=>{});
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
