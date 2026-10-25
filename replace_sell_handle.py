import re

with open('miniapp/src/App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace amount: parseFloat(amount) with amount: parseFloat(estimatedCrypto) inside handleSell
code = re.sub(
    r'amount:\s*parseFloat\(amount\),\s*userAddress:\s*userTonAddress',
    r'amount: parseFloat(estimatedCrypto),\n          userAddress: userTonAddress',
    code
)

# Replace the payload in submitSellOrder
code = re.sub(
    r'amount:\s*parseFloat\(amount\),\s*estimatedTk:\s*parseFloat\(estimatedTk\)',
    r'amount: parseFloat(estimatedCrypto), estimatedTk: parseFloat(amount)',
    code
)

with open('miniapp/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)
print("Replaced handleSell logic")
