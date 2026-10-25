import re

with open('miniapp/src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

start_idx = content.find('function PremiumBuyPage() {')
if start_idx != -1:
    end_idx = content.find('function PremiumSellPage() {', start_idx)
    buy_page_code = content[start_idx:end_idx]
    
    with open('buy_temp.jsx', 'w', encoding='utf-8') as f:
        f.write(buy_page_code)
    print("Extracted to buy_temp.jsx")
