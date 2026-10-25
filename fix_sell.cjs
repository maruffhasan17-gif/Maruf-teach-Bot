const fs = require('fs');
let code = fs.readFileSync('old_sell.txt', 'utf8');

// Calculate estimatedCrypto instead of estimatedTk
code = code.replace(
    'const estimatedTk = (parseFloat(amount || 0) * rate).toFixed(2);',
    'const estimatedCrypto = (parseFloat(amount || 0) / rate).toFixed(4);'
);

// handleSell adjustments
code = code.replace(
    'amount: parseFloat(amount),\n          userAddress: userTonAddress',
    'amount: parseFloat(estimatedCrypto),\n          userAddress: userTonAddress'
);

code = code.replace(
    'amount: parseFloat(amount), \nestimatedTk: parseFloat(estimatedTk)',
    'amount: parseFloat(estimatedCrypto), estimatedTk: parseFloat(amount)'
);

// We need to swap the UI blocks.
// Top block is:
/*
<div className="flex justify-between items-center mb-3">
    <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-[0.15em]">You Pay</label>
    
    <div className="relative">
       <div onClick={() => setShowAssetModal(!showAssetModal)} className="flex items-center gap-2 bg-white border border-[var(--color-border)] rounded-full px-2.5 py-1.5 cursor-pointer hover:border-[var(--color-brand)]/50 transition-colors shadow-sm active-scale z-10">
          <AssetIcon />
          <span className="text-[11px] font-extrabold text-[var(--color-text-primary)]">{asset}</span>
          <ChevronDown size={14} className="text-[var(--color-text-secondary)] ml-0.5" />
       </div>
       
       {showAssetModal && (
          ...
       )}
    </div>
 </div>
*/

// I'll just find and replace the whole block manually
const newTopBlock = \<div className="flex justify-between items-center mb-3">
    <label className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-[0.15em]">You Receive</label>
    
    <div className="relative">
       <div className="flex items-center gap-2 bg-white border border-[var(--color-border)] rounded-full px-3 py-1.5 shadow-sm z-10">
          <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center"><span className="text-white text-[10px] font-bold">?</span></div>
          <span className="text-[11px] font-extrabold text-[var(--color-text-primary)]">TK BDT</span>
       </div>
    </div>
 </div>\;

const startIndexTop = code.indexOf('<div className="flex justify-between items-center mb-3">');
const endIndexTop = code.indexOf('</div>', code.indexOf('</>', startIndexTop)) + 6 + 23; // roughly past the dropdown

code = code.replace(
    code.slice(startIndexTop, code.indexOf('<div onClick={() => setShowKeyboard(true)}', startIndexTop)),
    newTopBlock + '\\n               '
);

code = code.replace(
    'Balance: 0.00 {asset}',
    'Enter Taka amount'
);

// Bottom block is:
const newBottomBlock = \<div className="flex justify-between items-center mb-1 relative">
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
 </div>\;

const startIndexBottom = code.indexOf('<div className="flex justify-between items-center mb-1">');
const endIndexBottom = code.indexOf('</div>', code.indexOf('estimatedTk', startIndexBottom)) + 6;

code = code.replace(
    code.slice(startIndexBottom, endIndexBottom),
    newBottomBlock
);

fs.writeFileSync('new_sell.txt', code);
console.log('Saved to new_sell.txt');
