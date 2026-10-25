const fs = require('fs');
let c = fs.readFileSync('miniapp/src/App.jsx', 'utf8');

// The replacement logic:
// Replace the big modal block with an empty string.
c = c.replace(/\{showAssetModal && \([\s\S]*?<\/[a-zA-Z]*>\s*\)\s*\}/g, '');
c = c.replace(/\{showMethodModal && \([\s\S]*?<\/[a-zA-Z]*>\s*\)\s*\}/g, '');

// Now we need to inject the inline dropdowns right after the buttons.
// Buy Asset Dropdown:
c = c.replace(
    /(<button onClick=\{\(\) => setShowAssetModal\(true\)\}.*?>[\s\S]*?<\/button>)/,
    \<div className="relative">
        <button onClick={() => setShowAssetModal(!showAssetModal)} className="w-full bg-[#F8FAFC] rounded-2xl p-3.5 flex items-center justify-between border border-[#E4E7EC] active:bg-gray-100 transition-colors">
            <div className="flex items-center gap-2.5">
                <span className="font-extrabold text-[#101828] text-base">{asset}</span>
            </div>
            <ChevronDown size={18} className={"text-[#98A2B3] transition-transform " + (showAssetModal ? "rotate-180" : "")} />
        </button>
        {showAssetModal && (
            <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-xl border border-[#E4E7EC] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                {['TON', 'USDT'].map(a => (
                    <button key={a} onClick={() => { setAsset(a); setShowAssetModal(false); }} className={"w-full flex items-center justify-between p-3.5 border-b border-[#E4E7EC] last:border-0 hover:bg-gray-50 transition-colors " + (asset === a ? "bg-[#ECFDF3]" : "")}>
                        <span className={"font-bold " + (asset === a ? 'text-[#027A48]' : 'text-[#101828]')}>{a}</span>
                        {asset === a && <Sparkles size={14} className="text-[#00A878]"/>}
                    </button>
                ))}
            </div>
        )}
    </div>\
);

// Buy Payment Method Dropdown:
c = c.replace(
    /(<button onClick=\{\(\) => setShowMethodModal\(true\)\}.*?>[\s\S]*?<\/button>)/,
    \<div className="relative">
        <button onClick={() => setShowMethodModal(!showMethodModal)} className="w-full bg-[#F8FAFC] rounded-2xl p-4 flex items-center justify-between border border-[#E4E7EC] active:bg-gray-100 transition-colors">
            <span className="text-sm font-bold text-[#101828]">{paymentMethod}</span>
            <ChevronDown size={18} className={"text-[#98A2B3] transition-transform " + (showMethodModal ? "rotate-180" : "")} />
        </button>
        {showMethodModal && (
            <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-xl border border-[#E4E7EC] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                {['bKash', 'Nagad'].map(a => (
                    <button key={a} onClick={() => { setPaymentMethod(a); setShowMethodModal(false); }} className={"w-full flex items-center justify-between p-3.5 border-b border-[#E4E7EC] last:border-0 hover:bg-gray-50 transition-colors " + (paymentMethod === a ? "bg-[#ECFDF3]" : "")}>
                        <span className={"font-bold " + (paymentMethod === a ? 'text-[#027A48]' : 'text-[#101828]')}>{a}</span>
                        {paymentMethod === a && <Sparkles size={14} className="text-[#00A878]"/>}
                    </button>
                ))}
            </div>
        )}
    </div>\
);

// Sell Asset Dropdown:
c = c.replace(
    /(<button onClick=\{\(\) => setShowAssetModal\(true\)\}.*?>[\s\S]*?<\/button>)/,
    \<div className="relative z-20">
        <button onClick={() => setShowAssetModal(!showAssetModal)} className="w-full bg-[#F8FAFC] rounded-2xl p-3.5 flex items-center justify-between border border-[#E4E7EC] active:bg-gray-100 transition-colors">
            <div className="flex items-center gap-2.5">
                <span className="font-extrabold text-[#101828] text-base">{asset}</span>
            </div>
            <ChevronDown size={18} className={"text-[#98A2B3] transition-transform " + (showAssetModal ? "rotate-180" : "")} />
        </button>
        {showAssetModal && (
            <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-xl border border-[#E4E7EC] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                {['TON', 'USDT'].map(a => (
                    <button key={a} onClick={() => { setAsset(a); setShowAssetModal(false); }} className={"w-full flex items-center justify-between p-3.5 border-b border-[#E4E7EC] last:border-0 hover:bg-gray-50 transition-colors " + (asset === a ? "bg-[#ECFDF3]" : "")}>
                        <span className={"font-bold " + (asset === a ? 'text-[#027A48]' : 'text-[#101828]')}>{a}</span>
                        {asset === a && <Sparkles size={14} className="text-[#00A878]"/>}
                    </button>
                ))}
            </div>
        )}
    </div>\
);

// Sell Receive Method Dropdown:
c = c.replace(
    /(<button onClick=\{\(\) => setShowMethodModal\(true\)\}.*?>[\s\S]*?<\/button>)/,
    \<div className="relative z-10">
        <button onClick={() => setShowMethodModal(!showMethodModal)} className="w-full bg-[#F8FAFC] rounded-2xl p-4 flex items-center justify-between border border-[#E4E7EC] active:bg-gray-100 transition-colors">
            <span className="text-sm font-bold text-[#101828]">{paymentMethod}</span>
            <ChevronDown size={18} className={"text-[#98A2B3] transition-transform " + (showMethodModal ? "rotate-180" : "")} />
        </button>
        {showMethodModal && (
            <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-xl border border-[#E4E7EC] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                {['bKash', 'Nagad'].map(a => (
                    <button key={a} onClick={() => { setPaymentMethod(a); setShowMethodModal(false); }} className={"w-full flex items-center justify-between p-3.5 border-b border-[#E4E7EC] last:border-0 hover:bg-gray-50 transition-colors " + (paymentMethod === a ? "bg-[#ECFDF3]" : "")}>
                        <span className={"font-bold " + (paymentMethod === a ? 'text-[#027A48]' : 'text-[#101828]')}>{a}</span>
                        {paymentMethod === a && <Sparkles size={14} className="text-[#00A878]"/>}
                    </button>
                ))}
            </div>
        )}
    </div>\
);

fs.writeFileSync('miniapp/src/App.jsx', c);
console.log('Dropdowns patched');
