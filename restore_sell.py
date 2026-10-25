import re

with open('miniapp/src/App.jsx', 'r', encoding='utf-8') as f:
    app_code = f.read()

with open('sell_temp.jsx', 'r', encoding='utf-8') as f:
    sell_code = f.read()

start_idx = app_code.find('function PremiumSellPage() {')
end_idx = app_code.find('function HistoryPage', start_idx)

if start_idx != -1 and end_idx != -1:
    new_app_code = app_code[:start_idx] + sell_code + "\n\n" + app_code[end_idx:]
    with open('miniapp/src/App.jsx', 'w', encoding='utf-8') as f:
        f.write(new_app_code)
    print("Injected into App.jsx successfully!")
else:
    print("Could not find boundaries.")
