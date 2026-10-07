import io
import re

with io.open('index.js', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace(
    'const text = ?? *Admin Treasury Wallet*',
    'const text = ?? *Admin Treasury Wallet*'
)
c = c.replace(
    '?? Address: ????\\n',
    '\\n?? Address: \${botWallet.address}\\\n'
)
c = c.replace(
    '?? Balance: ** TON**\\n',
    '?? Balance: ** TON**\\n'
)
c = c.replace(
    '?? USDT: ** USDT**??;',
    '?? USDT: ** USDT**;'
)
# Just in case there are missing backticks
c = re.sub(r'const text = [^]*Admin Treasury Wallet.*?;', r'const text = ?? *Admin Treasury Wallet*\n\n?? Address: \${botWallet.address}\\n?? Balance: ** TON**\n?? USDT: ** USDT**;', c, flags=re.DOTALL)


with io.open('index.js', 'w', encoding='utf-8') as f:
    f.write(c)
