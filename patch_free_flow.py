import io
import re

with io.open('index.js', 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Menu update: Remove bkash and crypto
menu_repl = "keyboard: [ [ { text: m.free }, { text: m.profile } ] ],"
c = re.sub(r'keyboard:\s*\[\s*\[\s*\{\s*text:\s*m\.bkash\s*\}.*?\].*?\],', menu_repl, c, flags=re.DOTALL)

# 2. Update 'if (text === m.free)' logic
old_free_block = """    else if (text === m.free) {
        try {
            const freeTaskLink = 'https://t.me/VictorsCompanybot/app?startapp=ref_DBF2368328';
            try {
                const config = botConfig;
                if (config && config.freeLink) {
                    freeTaskLink = config.freeLink;
                }
            } catch (err) {}
            
            const freeMsgText = lang === 'bn' 
                ? ?? **???? ?????!**"""

new_free_logic = """    else if (text === m.free) {
        try {
            const loadingMsg = await bot.sendMessage(chatId, lang === 'bn' ? "? *????? ?????????? ????? ??? ?????...*" : "? *Verifying your account...*", { parse_mode: 'Markdown' });
            
            // Simulate IP/VPN checking delay
            await new Promise(r => setTimeout(r, 2000));
            
            const bdHour = (new Date().getUTCHours() + 6) % 24;
            if (bdHour < 12) {
                bot.deleteMessage(chatId, loadingMsg.message_id).catch(()=>{});
                bot.sendMessage(chatId, lang === 'bn' ? "?? **??????!** ???? ????????? ????? ???? ???? ??? ???? ??????? ???? ????? ??????? ??? ??? ????? ????? ?? ???? ?????? ?????" : "?? **Sorry!** The bot is only open from 12 PM to 12 AM BD Time. Please try again later.", { parse_mode: 'Markdown' });
                return;
            }

            const claimDoc = await db.collection('free_claims').doc(chatId.toString()).get();
            if (claimDoc.exists) {
                bot.deleteMessage(chatId, loadingMsg.message_id).catch(()=>{});
                bot.sendMessage(chatId, lang === 'bn' ? "?? **???? ?????????!** ???? ????????? ????? ???? ???????? ?????? ??????? ???? ????? ????? ?????? ???? ??????!" : "?? **Fraud Detected!** You have already claimed your free reward!", { parse_mode: 'Markdown' });
                return;
            }

            bot.deleteMessage(chatId, loadingMsg.message_id).catch(()=>{});

            let freeTaskLink = 'https://t.me/VictorsCompanybot/app?startapp=ref_DBF2368328';
            try {
                const config = botConfig;
                if (config && config.freeLink) {
                    freeTaskLink = config.freeLink;
                }
            } catch (err) {}
            
            const freeMsgText = lang === 'bn' 
                ? ?? **???? ?????!**"""

c = c.replace(old_free_block, new_free_logic)

# 3. Add 15-second offline timeout in photo submission
admin_photo_send_block = """            if (config.adminGroupId) {
                bot.sendPhoto(config.adminGroupId, photo.file_id, {
                    caption: ?? **Manual Review Needed (Free Task)**\\n\\nUser:  (@)\\nID: \\n\\nReply to this photo with **ok** to approve, or **wrong** to reject.,
                    parse_mode: 'Markdown'
                });"""

offline_timeout_logic = """            if (config.adminGroupId) {
                bot.sendPhoto(config.adminGroupId, photo.file_id, {
                    caption: ?? **Manual Review Needed (Free Task)**\\n\\nUser:  (@)\\nID: \\n\\nReply to this photo with **ok** to approve, or **wrong** to reject.,
                    parse_mode: 'Markdown'
                });

                userStates[chatId].adminReplied = false;
                setTimeout(() => {
                    if (userStates[chatId] && !userStates[chatId].adminReplied) {
                        const offlineMsg = lang === 'bn' ? "? ???????? ??? ??????? ????? ???????? ??????? ???? ????? ???? ????? ??? ???? ??????? ??? ??????? ????, ????????" : "? Admin is currently offline. Your information will be verified when the admin comes online. Thank you.";
                        bot.sendMessage(chatId, offlineMsg);
                    }
                }, 15000);
"""
c = c.replace(admin_photo_send_block, offline_timeout_logic)

# 4. Mark adminReplied = true when admin replies
admin_reply_block = """    if (msg.reply_to_message && msg.reply_to_message.photo && msg.reply_to_message.caption) {
        const text = msg.text.toLowerCase().trim();"""

admin_reply_mark = """    if (msg.reply_to_message && msg.reply_to_message.photo && msg.reply_to_message.caption) {
        const text = msg.text.toLowerCase().trim();
        const extractedIdMatch = msg.reply_to_message.caption.match(/ID: (\d+)/);
        if (extractedIdMatch && userStates[extractedIdMatch[1]]) {
            userStates[extractedIdMatch[1]].adminReplied = true;
        }"""
c = c.replace(admin_reply_block, admin_reply_mark)

with io.open('index.js', 'w', encoding='utf-8') as f:
    f.write(c)

