const fs = require('fs');

const bkashLogo = '<img src="/bkash.png" className="w-5 h-5 object-contain" alt="bKash" />';
const nagadLogo = '<img src="https://upload.wikimedia.org/wikipedia/commons/7/74/Nagad_Logo.svg" className="w-5 h-5 object-contain" alt="Nagad" />';

const paymentOptions = `
    <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-xl shadow-xl border border-[#E4E7EC] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-40">
        <button onClick={() => { setPaymentMethod('bKash'); setShowMethodModal(false); }} className={"w-full flex items-center justify-between p-4 border-b border-[#E4E7EC] hover:bg-gray-50 transition-colors " + (paymentMethod === 'bKash' ? "bg-[#ECFDF3]" : "")}>
            <div className="flex items-center gap-2.5">
                ${bkashLogo}
                <span className={"font-bold text-sm " + (paymentMethod === 'bKash' ? 'text-[#027A48]' : 'text-[#101828]')}>bKash</span>
            </div>
            {paymentMethod === 'bKash' && <Sparkles size={14} className="text-[#00A878]"/>}
        </button>
        <button onClick={() => { setPaymentMethod('Nagad'); setShowMethodModal(false); }} className={"w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors " + (paymentMethod === 'Nagad' ? "bg-[#ECFDF3]" : "")}>
            <div className="flex items-center gap-2.5">
                ${nagadLogo}
                <span className={"font-bold text-sm " + (paymentMethod === 'Nagad' ? 'text-[#027A48]' : 'text-[#101828]')}>Nagad</span>
            </div>
            {paymentMethod === 'Nagad' && <Sparkles size={14} className="text-[#00A878]"/>}
        </button>
    </div>
`;

const getPaymentSelector = (isReceive) => `
    <div className="relative z-40">
        <button onClick={() => setShowMethodModal(!showMethodModal)} className="w-full bg-[#F8FAFC] rounded-2xl p-4 flex items-center justify-between border border-[#E4E7EC] active:bg-gray-100 transition-colors">
            <div className="flex items-center gap-2.5">
                {paymentMethod === 'bKash' ? ${bkashLogo} : ${nagadLogo}}
                <span className="font-bold text-[#101828] text-sm">{paymentMethod}</span>
            </div>
            <ChevronDown size={18} className={"text-[#98A2B3] transition-transform " + (showMethodModal ? "rotate-180" : "")} />
        </button>
        {showMethodModal && (
            ${paymentOptions}
        )}
    </div>
`;

let c = fs.readFileSync('miniapp/src/App.jsx', 'utf8');

// Replace Buy Payment Method Box
c = c.replace(
    /<div className="relative z-40">[\s\S]*?<button onClick=\{\(\) => setShowMethodModal\(!showMethodModal\)\}[\s\S]*?<span className="font-bold text-\[#101828\] text-sm">\{paymentMethod\}<\/span>[\s\S]*?<\/div>\s*<\/div>/,
    getPaymentSelector(false) + '\n    </div>'
);

// Replace Sell Receive Method Box
c = c.replace(
    /<div className="relative z-40">[\s\S]*?<button onClick=\{\(\) => setShowMethodModal\(!showMethodModal\)\}[\s\S]*?<span className="font-bold text-\[#101828\] text-sm">\{paymentMethod\}<\/span>[\s\S]*?<\/div>\s*<\/div>/,
    getPaymentSelector(true) + '\n    </div>'
);

// Now replace the "CONTINUE TO PAYMENT" and "CONTINUE TO TRANSFER" buttons
c = c.replace(
    /<button onClick=\{handleContinue\} disabled=\{\!isValidStep1\} className="w-full bg-\[#101828\] disabled:bg-\[#E4E7EC\] disabled:text-\[#98A2B3\] text-white font-extrabold rounded-2xl p-\[18px\] shadow-lg active:scale-95 transition-all">\s*CONTINUE TO PAYMENT\s*<\/button>/,
    `<button onClick={handleContinue} disabled={!isValidStep1} className="w-full bg-[#101828] disabled:bg-[#101828]/50 disabled:cursor-not-allowed text-white font-extrabold rounded-2xl p-4 shadow-lg shadow-black/20 active:scale-95 transition-all text-sm tracking-wide">
        PAYMENT
    </button>`
);

c = c.replace(
    /<button onClick=\{handleContinue\} disabled=\{\!isValidStep1\} className="w-full bg-\[#101828\] disabled:bg-\[#E4E7EC\] disabled:text-\[#98A2B3\] text-white font-extrabold rounded-2xl p-\[18px\] shadow-lg active:scale-95 transition-all">\s*CONTINUE TO TRANSFER\s*<\/button>/,
    `<button onClick={handleContinue} disabled={!isValidStep1} className="w-full bg-[#101828] disabled:bg-[#101828]/50 disabled:cursor-not-allowed text-white font-extrabold rounded-2xl p-4 shadow-lg shadow-black/20 active:scale-95 transition-all text-sm tracking-wide">
        PAYMENT
    </button>`
);

fs.writeFileSync('miniapp/src/App.jsx', c);
console.log('Payment method and buttons fixed');
