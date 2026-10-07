import io

with io.open('index.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix the "Marked withdrawal"
content = content.replace("bot.sendMessage(chatId, ? Marked withdrawal for  as PAID.);", "bot.sendMessage(chatId, \? Marked withdrawal for \ as PAID.\);")

# 2. Fix the user success message
content = content.replace("bot.sendMessage(targetUserId, ?? <b>Withdrawal Successful!</b>\\nYour payment has been sent to your wallet. Thank you!, { parse_mode: 'HTML' });", "bot.sendMessage(targetUserId, \?? <b>Withdrawal Successful!</b>\\nYour payment has been sent to your wallet. Thank you!\, { parse_mode: 'HTML' });")

# 3. Fix the wait timer message
content = content.replace("await bot.sendMessage(chatId, ? Reply to THIS message with the time format.\\n\\nMinutes: <code>10:00</code>\\nHours: <code>1:30:50</code>\\n\\nUser ID: , { parse_mode: 'HTML' });", "await bot.sendMessage(chatId, \? Reply to THIS message with the time format.\\n\\nMinutes: <code>10:00</code>\\nHours: <code>1:30:50</code>\\n\\nUser ID: \\, { parse_mode: 'HTML' });")

# 4. Fix the rejected admin message
content = content.replace("bot.sendMessage(chatId, ? Rejected withdrawal for  and refunded  USDT.\\nReason: );", "bot.sendMessage(chatId, \? Rejected withdrawal for \ and refunded \ USDT.\\nReason: \\);")

# 5. Fix the rejected user message
content = content.replace("bot.sendMessage(targetUserId, ? <b>Withdrawal Rejected</b>\\nYour  USDT has been refunded to your balance.\\nReason: , { parse_mode: 'HTML' });", "bot.sendMessage(targetUserId, \? <b>Withdrawal Rejected</b>\\nYour \ USDT has been refunded to your balance.\\nReason: \\, { parse_mode: 'HTML' });")

# 6. Fix the timer set message in wait timer logic
content = content.replace("bot.sendMessage(chatId, ? Timer set for . They will see the countdown in the app.);", "bot.sendMessage(chatId, \? Timer set for \. They will see the countdown in the app.\);")

# 7. Fix invalid time message
content = content.replace("bot.sendMessage(chatId, ?? Invalid time format. Please use MM:SS or HH:MM:SS);", "bot.sendMessage(chatId, \?? Invalid time format. Please use MM:SS or HH:MM:SS\);")

with io.open('index.js', 'w', encoding='utf-8') as f:
    f.write(content)
