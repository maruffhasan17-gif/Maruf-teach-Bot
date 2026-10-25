const fs = require('fs');
let code = fs.readFileSync('miniapp/src/App.jsx', 'utf8');

// 1. Change estimatedTk to estimatedCrypto calculation
code = code.replace(
    'const estimatedTk = (parseFloat(amount || 0) * rate).toFixed(2);',
    'const estimatedCrypto = (parseFloat(amount || 0) / rate).toFixed(4);'
);

// 2. Change buildTransaction payload
code = code.replace(
    /amount: parseFloat\(amount\),\s*userAddress: userTonAddress/g,
    'amount: parseFloat(estimatedCrypto),\n          userAddress: userTonAddress'
);

// 3. Change submitSellOrder payload
code = code.replace(
    /amount: parseFloat\(amount\),\s*estimatedTk: parseFloat\(estimatedTk\)/g,
    'amount: parseFloat(estimatedCrypto), estimatedTk: parseFloat(amount)'
);

// 4. Change Top Label (Input Box)
code = code.replace(
    '<label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-[0.15em]">You Pay</label>',
    '<label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-[0.15em]">You Receive</label>'
);

// 5. Change Top Asset Icon and Dropdown
const oldTopDropdown = `<div className="relative">
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
                  </div>`;

const newTopDropdown = `<div className="relative">
                     <div className="flex items-center gap-2 bg-white border border-[var(--color-border)] rounded-full px-3 py-1.5 shadow-sm z-10">
                        <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center"><span className="text-white text-[10px] font-bold">৳</span></div>
                        <span className="text-[11px] font-extrabold text-[var(--color-text-primary)]">TK BDT</span>
                     </div>
                  </div>`;

code = code.replace(oldTopDropdown, newTopDropdown);

// 6. Change top hint text
code = code.replace(
    '<p className="text-[10px] text-[var(--color-text-secondary)] mt-2 font-medium tracking-wide">Balance: 0.00 {asset}</p>',
    '<p className="text-[10px] text-[var(--color-text-secondary)] mt-2 font-medium tracking-wide">Enter the Taka amount you want to receive</p>'
);

// 7. Change Bottom Box logic (You Receive -> You Pay)
const oldBottomBox = `<div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-[0.15em]">You Receive</label>
                    <span className="bg-[var(--color-brand)]/10 text-[var(--color-brand)] px-2.5 py-1 rounded-full text-[9px] font-bold tracking-wider">TK BDT</span>
                 </div>
                 
                 <div key={receiveKey} className="text-[28px] font-semibold text-[var(--color-text-primary)] tracking-tight animate-in fade-in slide-in-from-bottom-1 duration-300">
                    {amount ? estimatedTk : '0.00'}
                 </div>`;

const newBottomBox = `<div className="flex justify-between items-center mb-1 relative">
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
                 </div>`;

code = code.replace(oldBottomBox, newBottomBox);

fs.writeFileSync('miniapp/src/App.jsx', code);
console.log("Successfully transformed!");
