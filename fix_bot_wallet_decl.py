import io

with io.open('index.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
wallet_seen = False
for line in lines:
    if "const { getOrCreateBotWallet } = require('./walletManager');" in line:
        if not wallet_seen:
            new_lines.append(line)
            wallet_seen = True
    else:
        new_lines.append(line)

with io.open('index.js', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
