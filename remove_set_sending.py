import re
with open('miniapp/src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("setSendingNumber(''); ", "")
content = content.replace("sendingNumber, ", "")

with open('miniapp/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
