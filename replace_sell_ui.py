import re

with open('miniapp/src/App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace the top input box label
code = re.sub(
    r'<label className="text-\[10px\] font-bold text-\[var\(--color-text-secondary\)\] uppercase tracking-\[0\.15em\]">You Pay</label>',
    '<label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-[0.15em]">You Receive</label>',
    code,
    count=1
)

# Replace the AssetIcon dropdown with a static BDT badge
old_top_dropdown = r'<div onClick=\{[^}]+\} className="flex items-center gap-2 bg-white border border-\[var\(--color-border\)\] rounded-full px-2\.5 py-1\.5 cursor-pointer hover:border-\[var\(--color-brand\)\]/50 transition-colors shadow-sm active-scale z-10">\s*<AssetIcon />\s*<span className="text-\[11px\] font-extrabold text-\[var\(--color-text-primary\)\]">\{asset\}</span>\s*<ChevronDown size=\{14\} className="text-\[var\(--color-text-secondary\)\] ml-0\.5" />\s*</div>\s*\{showAssetModal && \([\s\S]*?\)\}'

new_top_dropdown = '''<div className="flex items-center gap-2 bg-white border border-[var(--color-border)] rounded-full px-3 py-1.5 shadow-sm z-10">
                        <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center"><span className="text-white text-[10px] font-bold">?</span></div>
                        <span className="text-[11px] font-extrabold text-[var(--color-text-primary)]">TK BDT</span>
                     </div>'''
                     
code = re.sub(old_top_dropdown, new_top_dropdown, code, count=1)

# Replace the balance hint text
code = re.sub(
    r'Balance: 0\.00 \{asset\}',
    'Enter Taka amount',
    code,
    count=1
)

# Now, we need to swap the bottom box to be the crypto dropdown
bottom_box_pattern = r'<label className="text-\[10px\] font-bold text-\[var\(--color-text-secondary\)\] uppercase tracking-\[0\.15em\]">You Receive</label>\s*<span className="bg-\[var\(--color-brand\)\]/10 text-\[var\(--color-brand\)\] px-2\.5 py-1 rounded-full text-\[9px\] font-bold tracking-wider">TK BDT</span>\s*</div>\s*<div key=\{receiveKey\} className="text-\[28px\] font-semibold text-\[var\(--color-text-primary\)\] tracking-tight animate-in fade-in slide-in-from-bottom-1 duration-300">\s*\{amount \? estimatedTk : \'0\.00\'\}\s*</div>'

new_bottom_box = '''<label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-[0.15em]">You Pay</label>
                    <div className="relative">
                     <div onClick={() => setShowAssetModal(!showAssetModal)} className="flex items-center gap-2 bg-white border border-[var(--color-border)] rounded-full px-2.5 py-1.5 cursor-pointer hover:border-[var(--color-brand)]/50 transition-colors shadow-sm active-scale z-10">
                        <AssetIcon />
                        <span className="text-[11px] font-extrabold text-[var(--color-text-primary)]">{asset}</span>
                        <ChevronDown size={14} className="text-[var(--color-text-secondary)] ml-0.5" />
                     </div>
                     
                     {showAssetModal && (
                        <>
                           <div className="fixed inset-0 z-40" onClick={() => setShowAssetModal(false)}></div>
                           {asset !== 'USDT' && (
                              <button onClick={() => {setAsset('USDT'); setShowAssetModal(false);}} className="absolute left-0 right-0 top-full mt-2 w-full flex items-center justify-center gap-2 bg-white border border-[var(--color-border)] rounded-full px-2.5 py-1.5 hover:border-[var(--color-brand)]/50 transition-colors shadow-sm active-scale z-50 animate-in fade-in zoom-in-95 duration-200">
                                 <CircleDollarSign size={14} className="text-emerald-500" />
                                 <span className="text-[11px] font-extrabold text-[var(--color-text-primary)]">USDT</span>
                              </button>
                           )}
                           {asset !== 'GRAM' && (
                              <button onClick={() => {setAsset('GRAM'); setShowAssetModal(false);}} className="absolute left-0 right-0 top-full mt-2 w-full flex items-center justify-center gap-2 bg-white border border-[var(--color-border)] rounded-full px-2.5 py-1.5 hover:border-[var(--color-brand)]/50 transition-colors shadow-sm active-scale z-50 animate-in fade-in zoom-in-95 duration-200">
                                 <Gem size={14} className="text-blue-500" />
                                 <span className="text-[11px] font-extrabold text-[var(--color-text-primary)]">GRAM</span>
                              </button>
                           )}
                        </>
                     )}
                   </div>
                 </div>
                 
                 <div key={receiveKey} className="text-[28px] font-semibold text-[var(--color-text-primary)] tracking-tight animate-in fade-in slide-in-from-bottom-1 duration-300 mt-2">
                    {amount ? estimatedCrypto : '0.00'}
                 </div>'''
                 
code = re.sub(bottom_box_pattern, new_bottom_box, code, count=1)

with open('miniapp/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Regex replacement completed!")
