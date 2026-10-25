import re

with open('index.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix broken emojis
content = content.replace("dYZ%", "??")
content = content.replace("o.", "?")

# Wrap bot.sendMessage with .catch
# Since there are multiple lines sometimes, we need a robust regex or just string replacement for the specific ones
content = content.replace("bot.sendMessage(userId, '?? Your payment for ' + amount + ' ' + asset + ' has been automatically verified via early SMS!\\n\\nThe admin will send the asset to your wallet shortly.');", 
"bot.sendMessage(userId, '?? Your payment for ' + amount + ' ' + asset + ' has been automatically verified via early SMS!\\n\\nThe admin will send the asset to your wallet shortly.').catch(e=>console.error(e));")

content = content.replace("bot.sendMessage(8799135330, '? Auto-Verified Buy Order (Early SMS)!\\nUser: ' + userId + '\\nAsset: ' + amount + ' ' + asset + '\\nTrxID: ' + trxId + '\\nWallet: ' + receiveAddress);",
"bot.sendMessage(8799135330, '? Auto-Verified Buy Order (Early SMS)!\\nUser: ' + userId + '\\nAsset: ' + amount + ' ' + asset + '\\nTrxID: ' + trxId + '\\nWallet: ' + receiveAddress).catch(e=>console.error(e));")

content = content.replace("bot.sendMessage(order.userId, '?? Your payment for ' + order.amount + ' ' + order.asset + ' has been automatically verified!\\n\\nThe admin will send the asset to your wallet shortly.');",
"bot.sendMessage(order.userId, '?? Your payment for ' + order.amount + ' ' + order.asset + ' has been automatically verified!\\n\\nThe admin will send the asset to your wallet shortly.').catch(e=>console.error(e));")

content = content.replace("bot.sendMessage(8799135330, '? Auto-Verified Buy Order!\\nUser: ' + order.userId + '\\nAsset: ' + order.amount + ' ' + order.asset + '\\nTrxID: ' + trxId + '\\nWallet: ' + order.receiveAddress);",
"bot.sendMessage(8799135330, '? Auto-Verified Buy Order!\\nUser: ' + order.userId + '\\nAsset: ' + order.amount + ' ' + order.asset + '\\nTrxID: ' + trxId + '\\nWallet: ' + order.receiveAddress).catch(e=>console.error(e));")

with open('index.js', 'w', encoding='utf-8') as f:
    f.write(content)
