import re

with open('miniapp/src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove state
content = re.sub(r'const \[sendingNumber, setSendingNumber\] = React\.useState\(\'\'\);\n\s*', '', content)

# Remove isValidStep2 requirement
content = re.sub(r'const isValidStep2 = sendingNumber && trxId;', 'const isValidStep2 = trxId;', content)

# Remove input field block
input_block = r'<div>\s*<label className="text-\[10px\] font-extrabold text-\[#98A2B3\] block tracking-widest uppercase mb-1\.5 ml-1">Sending Number \(\{paymentMethod\}\)</label>\s*<input type="tel" value=\{sendingNumber\} onChange=\{e => setSendingNumber\(e\.target\.value\)\} placeholder="01XXXXXXXXX" className="w-full bg-\[#F8FAFC\] rounded-2xl p-4 text-sm font-bold text-\[#101828\] border border-\[#E4E7EC\] focus:border-\[#00A878\] focus:ring-4 focus:ring-\[#00A878\]/10 transition-all outline-none" />\s*</div>'
content = re.sub(input_block, '', content)

with open('miniapp/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Removed sendingNumber from App.jsx")
