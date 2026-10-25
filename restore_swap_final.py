import re
with open('old_sell.txt', 'r', encoding='utf-16') as f:
    lines = f.readlines()
cleaned_lines = []
for line in lines:
    cleaned = re.sub(r'^old_app\.jsx:\d+:', '', line)
    cleaned = re.sub(r'^>\s*old_app\.jsx:\d+:', '', cleaned)
    cleaned_lines.append(cleaned)

old_sell_code = "".join(cleaned_lines)
old_sell_code = old_sell_code.replace('function SellPage() {', 'function PremiumSellPage() {')

with open('miniapp/src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = re.compile(r'function PremiumSellPage\(\) \{.*?(?=function ProfilePage)', re.DOTALL)
new_content = pattern.sub(old_sell_code + '\n\n', content)

with open('miniapp/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(new_content)
print("Replaced properly!")
