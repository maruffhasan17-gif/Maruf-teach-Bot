import io
import re

with io.open('index.js', 'r', encoding='utf-8') as f:
    c = f.read()

# 1. 15 second offline timeout logic
offline_regex = r'(bot\.sendPhoto\(config\.adminGroupId,\s*photo\.file_id,\s*\{[\s\S]*?\}\);)'
offline_replacement = r'''\1
                userStates[chatId].adminReplied = false;
                setTimeout(() => {
                    if (userStates[chatId] && !userStates[chatId].adminReplied) {
                        const offlineMsg = lang === 'bn' ? "? ???????? ??? ??????? ????? ???????? ??????? ???? ????? ???? ????? ??? ???? ??????? ??? ??????? ????, ????????" : "? Admin is currently offline. Your information will be verified when the admin comes online. Thank you.";
                        bot.sendMessage(chatId, offlineMsg);
                    }
                }, 15000);'''
c = re.sub(offline_regex, offline_replacement, c)

# 2. Mark adminReplied = true when admin replies
admin_reply_regex = r'(if\s*\(msg\.reply_to_message\s*&&\s*msg\.reply_to_message\.photo\s*&&\s*msg\.reply_to_message\.caption\)\s*\{\s*const text = msg\.text\.toLowerCase\(\)\.trim\(\);)'
admin_reply_replacement = r'''\1
        const extractedIdMatch = msg.reply_to_message.caption.match(/ID: (\d+)/);
        if (extractedIdMatch && userStates[extractedIdMatch[1]]) {
            userStates[extractedIdMatch[1]].adminReplied = true;
        }'''
c = re.sub(admin_reply_regex, admin_reply_replacement, c)

with io.open('index.js', 'w', encoding='utf-8') as f:
    f.write(c)
