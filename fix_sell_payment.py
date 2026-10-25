import re

with open('sell_temp.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace estimatedTk with estimatedCrypto calculation
code = code.replace(
    'const estimatedTk = (parseFloat(amount || 0) * rate).toFixed(2);',
    'const estimatedCrypto = (parseFloat(amount || 0) / rate).toFixed(4);'
)

# Update handleSell payload
handle_sell_old = '''const txRes = await buildTransaction({
            asset,
            amount: parseFloat(amount),
            userAddress: userTonAddress,
            adminWallet: "UQC7hYHfrVJ_uT_esMr7vCv1bVh5ytQxYUUjRDiTUiG9s5Fb"
        });
  
        // 2. Send via TonConnect
        await tonConnectUI.sendTransaction(txRes.tx);
  
        // 3. Save order and credit FIAT balance
        await submitSellOrder({
          userId: WebApp.initDataUnsafe?.user?.id || 123456789, asset, amount: parseFloat(amount), 
  estimatedTk: parseFloat(estimatedTk), wallet: userTonAddress
        });'''

handle_sell_new = '''const txRes = await buildTransaction({
            asset,
            amount: parseFloat(estimatedCrypto),
            userAddress: userTonAddress,
            adminWallet: "UQC7hYHfrVJ_uT_esMr7vCv1bVh5ytQxYUUjRDiTUiG9s5Fb"
        });
  
        // 2. Send via TonConnect
        await tonConnectUI.sendTransaction(txRes.tx);
  
        // 3. Save order and credit FIAT balance
        await submitSellOrder({
          userId: user?.id || 123456789, asset, amount: parseFloat(estimatedCrypto), 
          estimatedTk: parseFloat(amount), wallet: userTonAddress
        });'''
        
code = code.replace(handle_sell_old, handle_sell_new)
code = code.replace('userId: WebApp.initDataUnsafe?.user?.id', 'userId: user?.id')


# UI Label: Top input
code = code.replace(
    '<label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-[0.15em]">You Pay</label>',
    '<label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-[0.15em]">You Receive</label>'
)
code = code.replace(
    '<span className="text-[11px] font-extrabold text-[var(--color-text-primary)]">{asset}</span>',
    '<span className="text-[11px] font-extrabold text-[var(--color-text-primary)]">BDT</span>'
)
# Top input asset icon logic (remove AssetIcon for BDT and replace with a standard icon)
code = code.replace(
    '<AssetIcon />',
    '<div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center"><span className="text-white text-[10px] font-bold">?</span></div>'
)

# Remove the dropdown for Asset selection from the Top input box!
# The top box shouldn't have the dropdown since it's ALWAYS BDT.
dropdown_old = '''<div onClick={() => setShowAssetModal(!showAssetModal)} className="flex items-center gap-2 bg-white border border-[var(--color-border)] rounded-full px-2.5 py-1.5 cursor-pointer hover:border-[var(--color-brand)]/50 transition-colors shadow-sm active-scale z-10">
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
                     )}'''

dropdown_new = '''<div className="flex items-center gap-2 bg-white border border-[var(--color-border)] rounded-full px-2.5 py-1.5 shadow-sm z-10">
                        <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center"><span className="text-white text-[10px] font-bold">?</span></div>
                        <span className="text-[11px] font-extrabold text-[var(--color-text-primary)]">BDT</span>
                     </div>'''
                     
code = code.replace(dropdown_old, dropdown_new)

# Fix the balance showing in top input (should just show TK balance maybe?)
# Actually we can just say "Enter Taka Amount"
code = code.replace(
    '<p className="text-[10px] text-[var(--color-text-secondary)] mt-2 font-medium tracking-wide">Balance: 0.00 {asset}</p>',
    '<p className="text-[10px] text-[var(--color-text-secondary)] mt-2 font-medium tracking-wide">Enter the amount of Taka you want</p>'
)

# Now move the Dropdown logic to the BOTTOM box!
# Bottom box old UI:
bottom_old = '''<div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-[0.15em]">You Receive</label>
                    <span className="bg-[var(--color-brand)]/10 text-[var(--color-brand)] px-2.5 py-1 rounded-full text-[9px] font-bold tracking-wider">TK BDT</span>
                 </div>
                 
                 <div key={receiveKey} className="text-[28px] font-semibold text-[var(--color-text-primary)] tracking-tight animate-in fade-in slide-in-from-bottom-1 duration-300">
                    {amount ? estimatedTk : '0.00'}
                 </div>'''

bottom_new = '''<div className="flex justify-between items-center mb-1 relative">
                    <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-[0.15em]">You Pay</label>
                    
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

code = code.replace(bottom_old, bottom_new)

with open('sell_temp.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Modification done!")
