const fs = require('fs');
let c = fs.readFileSync('miniapp/src/App.jsx', 'utf8');

// First, let's remove the modal overlay blocks at the bottom of the files.
c = c.replace(/\{showAssetModal && \([\s\S]*?<\/[a-zA-Z]*>\s*\)\s*\}/g, '');
c = c.replace(/\{showMethodModal && \([\s\S]*?<\/[a-zA-Z]*>\s*\)\s*\}/g, '');

// Now we need to inject the inline dropdowns right after the buttons.
// However, to make it perfectly safe, we'll just replace the entire button with the relative container + button + dropdown list.

const replaceButtonWithDropdown = (content, stateVar, options, isAsset = true) => {
    // Determine which string to match
    const modalSetter = isAsset ? 'setShowAssetModal(true)' : 'setShowMethodModal(true)';
    const dropdownState = isAsset ? 'showAssetModal' : 'showMethodModal';
    const setterState = isAsset ? 'setShowAssetModal' : 'setShowMethodModal';
    const valState = isAsset ? 'asset' : 'paymentMethod';
    const setVal = isAsset ? 'setAsset' : 'setPaymentMethod';
    
    const regex = new RegExp(`<button onClick=\\{\\(\\) => ${modalSetter}\\}.*?>[\\s\\S]*?<\\/button>`);
    
    const dropdownCode = `
    <div className="relative z-50">
        <button onClick={() => ${setterState}(!${dropdownState})} className="w-full bg-[#F8FAFC] rounded-2xl p-4 flex items-center justify-between border border-[#E4E7EC] active:bg-gray-100 transition-colors">
            <div className="flex items-center gap-2.5">
                <span className="font-extrabold text-[#101828] text-base">{${valState}}</span>
            </div>
            <ChevronDown size={18} className={"text-[#98A2B3] transition-transform " + (${dropdownState} ? "rotate-180" : "")} />
        </button>
        {${dropdownState} && (
            <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-xl border border-[#E4E7EC] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                {${JSON.stringify(options)}.map(a => (
                    <button key={a} onClick={() => { ${setVal}(a); ${setterState}(false); }} className={"w-full flex items-center justify-between p-3.5 border-b border-[#E4E7EC] last:border-0 hover:bg-gray-50 transition-colors " + (${valState} === a ? "bg-[#ECFDF3]" : "")}>
                        <span className={"font-bold " + (${valState} === a ? 'text-[#027A48]' : 'text-[#101828]')}>{a}</span>
                        {${valState} === a && <Sparkles size={14} className="text-[#00A878]"/>}
                    </button>
                ))}
            </div>
        )}
    </div>
    `.trim();
    
    return content.replace(regex, dropdownCode);
};

// We have 4 buttons to replace: 2 for Asset, 2 for Payment Method
// Replace first one (Buy Asset)
c = replaceButtonWithDropdown(c, 'showAssetModal', ['TON', 'USDT'], true);
// Replace second one (Sell Asset)
c = replaceButtonWithDropdown(c, 'showAssetModal', ['TON', 'USDT'], true);

// Replace first method (Buy Payment)
c = replaceButtonWithDropdown(c, 'showMethodModal', ['bKash', 'Nagad'], false);
// Replace second method (Sell Payment)
c = replaceButtonWithDropdown(c, 'showMethodModal', ['bKash', 'Nagad'], false);

fs.writeFileSync('miniapp/src/App.jsx', c);
console.log('Dropdowns patched');
