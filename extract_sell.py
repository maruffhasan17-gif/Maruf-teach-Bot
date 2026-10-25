import re

with open('miniapp/src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find PremiumSellPage
start_idx = content.find('function PremiumSellPage() {')
if start_idx != -1:
    end_idx = content.find('function HistoryPage', start_idx)
    sell_page_code = content[start_idx:end_idx]
    
    with open('sell_temp.jsx', 'w', encoding='utf-8') as f:
        f.write(sell_page_code)
    print("Extracted to sell_temp.jsx")
