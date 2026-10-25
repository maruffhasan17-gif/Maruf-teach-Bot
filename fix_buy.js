const fs = require('fs');
let code = fs.readFileSync('buy_temp.jsx', 'utf8');

// Change 1: Calculation
code = code.replace(
    "const totalBdt = amount ? (Number(amount) * (asset === 'USDT' ? liveUsdBdt : liveCryptoRate * liveUsdBdt)).toFixed(2) : '0.00';",
    "const totalCrypto = amount ? (Number(amount) / (asset === 'USDT' ? liveUsdBdt : liveCryptoRate * liveUsdBdt)).toFixed(4) : '0.00';"
);

// Change 2: API Payload
code = code.replace(
    'amount: parseFloat(amount),\n                totalBdt,',
    'amount: parseFloat(totalCrypto),\n                totalBdt: parseFloat(amount),'
);
code = code.replace(
    'amount: parseFloat(amount),\r\n                totalBdt,',
    'amount: parseFloat(totalCrypto),\n                totalBdt: parseFloat(amount),'
);
if (code.includes('userId: window.Telegram?.WebApp')) {
    code = code.replace(/userId: window\.Telegram\?\.WebApp\?\.initDataUnsafe\?.user\?.id/g, 'userId: user?.id');
}


// Change 3: UI Replacement
const oldUI = `<label className="text-[10px] font-extrabold text-[#98A2B3] block tracking-widest uppercase mb-1.5 ml-1">Amount to Buy</label>
        <div className="relative">
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full bg-[#F8FAFC] rounded-2xl p-4 pr-14 text-sm font-bold text-[#101828] border border-[#E4E7EC] focus:border-[#00A878] focus:ring-4 focus:ring-[#00A878]/10 transition-all outline-none" />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-sm text-[#98A2B3]">{asset}</span>
        </div>
        {amount && (
            <div className="mt-3 bg-[#ECFDF3] rounded-xl p-3 flex justify-between items-center border border-[#00A878]/10">
                <span className="text-xs font-bold text-[#027A48]">You will pay</span>
                <span className="text-sm font-extrabold text-[#027A48]">৳ {totalBdt} BDT</span>
            </div>
        )}`;
        
const newUI = `<label className="text-[10px] font-extrabold text-[#98A2B3] block tracking-widest uppercase mb-1.5 ml-1">Amount to Pay (BDT)</label>
        <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-sm text-[#101828]">৳</span>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full bg-[#F8FAFC] rounded-2xl p-4 pl-10 pr-14 text-sm font-bold text-[#101828] border border-[#E4E7EC] focus:border-[#00A878] focus:ring-4 focus:ring-[#00A878]/10 transition-all outline-none" />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-sm text-[#98A2B3]">BDT</span>
        </div>
        {amount && (
            <div className="mt-3 bg-[#ECFDF3] rounded-xl p-3 flex justify-between items-center border border-[#00A878]/10">
                <span className="text-xs font-bold text-[#027A48]">You will receive</span>
                <span className="text-sm font-extrabold text-[#027A48]">{totalCrypto} {asset}</span>
            </div>
        )}`;

// Sometimes regex or exact string match fails due to spaces, so let's use a regex replace for UI block:
const blockStart = '<label className="text-[10px] font-extrabold text-[#98A2B3] block tracking-widest uppercase mb-1.5 ml-1">Amount to Buy</label>';
const blockEnd = '</div>\n        )}';

const startIdx = code.indexOf(blockStart);
const endIdx = code.indexOf('</div>', code.indexOf('{totalBdt} BDT</span>', startIdx)) + 6;

if (startIdx !== -1 && endIdx !== -1) {
    code = code.slice(0, startIdx) + newUI + code.slice(endIdx);
} else {
    // Try exact
    code = code.replace(oldUI, newUI);
}

// Change 4: Step 2 "Send exactly"
code = code.replace(
    '<span className="text-sm font-extrabold text-[#00A878]">৳ {totalBdt} BDT</span>',
    '<span className="text-sm font-extrabold text-[#00A878]">৳ {amount} BDT</span>'
);

// Fallback for weird unicode if any:
code = code.replace(/{totalBdt} BDT/g, '{amount} BDT');

fs.writeFileSync('buy_temp_new.jsx', code);
console.log('Processed buy_temp.jsx successfully');
