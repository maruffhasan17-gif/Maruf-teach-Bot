import io
import re

with io.open('index.js', 'r', encoding='utf-8') as f:
    c = f.read()

# 1. 15 second offline timeout logic
offline_regex = r'(bot\.sendPhoto\(config\.adminGroupId,\s*photo\.file_id,\s*\{\s*caption:[\s\S]*?parse_mode:\s*\'Markdown\'\s*\}\);)'
offline_replacement = r'''\1
                userStates[chatId].adminReplied = false;
                setTimeout(() => {
                    if (userStates[chatId] && !userStates[chatId].adminReplied) {
                        const offlineMsg = lang === 'bn' ? "? ???????? ??? ??????? ????? ???????? ??????? ???? ????? ???? ????? ??? ???? ??????? ??? ??????? ????, ????????" : "? Admin is currently offline. Your information will be verified when the admin comes online. Thank you.";
                        bot.sendMessage(chatId, offlineMsg);
                    }
                }, 15000);'''
c = re.sub(offline_regex, offline_replacement, c)

with io.open('index.js', 'w', encoding='utf-8') as f:
    f.write(c)
