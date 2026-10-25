const fs = require('fs');

const tonLogo = '<img src="https://cryptologos.cc/logos/toncoin-ton-logo.svg?v=035" className="w-5 h-5" alt="TON" />';
const usdtLogo = '<img src="https://cryptologos.cc/logos/tether-usdt-logo.svg?v=035" className="w-5 h-5" alt="USDT" />';

const assetOptions = `
    <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-xl shadow-xl border border-[#E4E7EC] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
        <button onClick={() => { setAsset('TON'); setShowAssetModal(false); }} className={"w-full flex items-center gap-2.5 p-4 border-b border-[#E4E7EC] hover:bg-gray-50 transition-colors " + (asset === 'TON' ? "bg-[#ECFDF3]" : "")}>
            ${tonLogo}
            <span className={"font-bold text-sm " + (asset === 'TON' ? 'text-[#027A48]' : 'text-[#101828]')}>TON</span>
        </button>
        <button onClick={() => { setAsset('USDT'); setShowAssetModal(false); }} className={"w-full flex items-center gap-2.5 p-4 hover:bg-gray-50 transition-colors " + (asset === 'USDT' ? "bg-[#ECFDF3]" : "")}>
            ${usdtLogo}
            <span className={"font-bold text-sm " + (asset === 'USDT' ? 'text-[#027A48]' : 'text-[#101828]')}>USDT</span>
        </button>
    </div>
`;

const getAssetSelector = () => `
    <div className="relative z-50">
        <button onClick={() => setShowAssetModal(!showAssetModal)} className="w-full bg-[#F8FAFC] rounded-2xl p-4 flex items-center justify-between border border-[#E4E7EC] active:bg-gray-100 transition-colors">
            <div className="flex items-center gap-2.5">
                {asset === 'TON' ? ${tonLogo} : ${usdtLogo}}
                <span className="font-bold text-[#101828] text-sm">{asset}</span>
            </div>
            <ChevronDown size={18} className={"text-[#98A2B3] transition-transform " + (showAssetModal ? "rotate-180" : "")} />
        </button>
        {showAssetModal && (
            ${assetOptions}
        )}
    </div>
`;

const paymentOptions = `
    <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-xl shadow-xl border border-[#E4E7EC] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-40">
        {['bKash', 'Nagad'].map(a => (
            <button key={a} onClick={() => { setPaymentMethod(a); setShowMethodModal(false); }} className={"w-full flex items-center justify-between p-4 border-b border-[#E4E7EC] last:border-0 hover:bg-gray-50 transition-colors " + (paymentMethod === a ? "bg-[#ECFDF3]" : "")}>
                <span className={"font-bold text-sm " + (paymentMethod === a ? 'text-[#027A48]' : 'text-[#101828]')}>{a}</span>
                {paymentMethod === a && <Sparkles size={14} className="text-[#00A878]"/>}
            </button>
        ))}
    </div>
`;

const getPaymentSelector = (isReceive) => `
    <div className="relative z-40">
        <button onClick={() => setShowMethodModal(!showMethodModal)} className="w-full bg-[#F8FAFC] rounded-2xl p-4 flex items-center justify-between border border-[#E4E7EC] active:bg-gray-100 transition-colors">
            <span className="font-bold text-[#101828] text-sm">{paymentMethod}</span>
            <ChevronDown size={18} className={"text-[#98A2B3] transition-transform " + (showMethodModal ? "rotate-180" : "")} />
        </button>
        {showMethodModal && (
            ${paymentOptions}
        )}
    </div>
`;

let c = fs.readFileSync('miniapp/src/App.jsx', 'utf8');

// The original UI has these blocks for Select Asset and Amount:
// Buy Card 1
c = c.replace(
    /<div className="bg-white rounded-3xl p-5 border border-\[#E4E7EC\] shadow-sm">[\s\S]*?<label className="text-\[10px\] font-extrabold text-\[#98A2B3\] block tracking-widest uppercase mb-2">Select Asset<\/label>[\s\S]*?<button onClick=\{\(\) => setShowAssetModal\(true\)\}[\s\S]*?<\/button>[\s\S]*?<label className="text-\[10px\] font-extrabold text-\[#98A2B3\] block tracking-widest uppercase mt-4 mb-2">Amount to Buy<\/label>[\s\S]*?<div className="relative">[\s\S]*?<input type="number"[\s\S]*?<\/div>[\s\S]*?(\{amount && \([\s\S]*?<\/[a-zA-Z]*>\s*\)\s*\})[\s\S]*?<\/div>/,
    `<div className="bg-white rounded-3xl p-5 border border-[#E4E7EC] shadow-sm space-y-4">
    <div>
        <label className="text-[10px] font-extrabold text-[#98A2B3] block tracking-widest uppercase mb-1.5 ml-1">Select Asset</label>
        ${getAssetSelector()}
    </div>
    <div>
        <label className="text-[10px] font-extrabold text-[#98A2B3] block tracking-widest uppercase mb-1.5 ml-1">Amount to Buy</label>
        <div className="relative">
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full bg-[#F8FAFC] rounded-2xl p-4 pr-14 text-sm font-bold text-[#101828] border border-[#E4E7EC] focus:border-[#00A878] focus:ring-4 focus:ring-[#00A878]/10 transition-all outline-none" />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-sm text-[#98A2B3]">{asset}</span>
        </div>
        {amount && (
            <div className="mt-3 bg-[#ECFDF3] rounded-xl p-3 flex justify-between items-center border border-[#00A878]/10">
                <span className="text-xs font-bold text-[#027A48]">You will pay</span>
                <span className="text-sm font-extrabold text-[#027A48]">৳{totalBdt} BDT</span>
            </div>
        )}
    </div>
</div>`
);

// Sell Card 1
c = c.replace(
    /<div className="bg-white rounded-3xl p-5 border border-\[#E4E7EC\] shadow-sm">[\s\S]*?<label className="text-\[10px\] font-extrabold text-\[#98A2B3\] block tracking-widest uppercase mb-2">Select Asset<\/label>[\s\S]*?<button onClick=\{\(\) => setShowAssetModal\(true\)\}[\s\S]*?<\/button>[\s\S]*?<label className="text-\[10px\] font-extrabold text-\[#98A2B3\] block tracking-widest uppercase mt-4 mb-2">Amount to Sell<\/label>[\s\S]*?<div className="relative">[\s\S]*?<input type="number"[\s\S]*?<\/div>[\s\S]*?(\{amount && \([\s\S]*?<\/[a-zA-Z]*>\s*\)\s*\})[\s\S]*?<\/div>/,
    `<div className="bg-white rounded-3xl p-5 border border-[#E4E7EC] shadow-sm space-y-4">
    <div>
        <label className="text-[10px] font-extrabold text-[#98A2B3] block tracking-widest uppercase mb-1.5 ml-1">Select Asset</label>
        ${getAssetSelector()}
    </div>
    <div>
        <label className="text-[10px] font-extrabold text-[#98A2B3] block tracking-widest uppercase mb-1.5 ml-1">Amount to Sell</label>
        <div className="relative">
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full bg-[#F8FAFC] rounded-2xl p-4 pr-14 text-sm font-bold text-[#101828] border border-[#E4E7EC] focus:border-[#00A878] focus:ring-4 focus:ring-[#00A878]/10 transition-all outline-none" />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-sm text-[#98A2B3]">{asset}</span>
        </div>
        {amount && (
            <div className="mt-3 bg-[#ECFDF3] rounded-xl p-3 flex justify-between items-center border border-[#00A878]/10">
                <span className="text-xs font-bold text-[#027A48]">You will receive</span>
                <span className="text-sm font-extrabold text-[#027A48]">৳{totalBdt} BDT</span>
            </div>
        )}
    </div>
</div>`
);

// Buy Card 2 (Payment Method)
c = c.replace(
    /<button onClick=\{\(\) => setShowMethodModal\(true\)\}[\s\S]*?<ChevronDown size=\{18\} className="text-\[#98A2B3\]" \/>[\s\S]*?<\/button>/,
    getPaymentSelector(false)
);

// Sell Card 2 (Receive Method)
c = c.replace(
    /<button onClick=\{\(\) => setShowMethodModal\(true\)\}[\s\S]*?<ChevronDown size=\{18\} className="text-\[#98A2B3\]" \/>[\s\S]*?<\/button>/,
    getPaymentSelector(true)
);

fs.writeFileSync('miniapp/src/App.jsx', c);
console.log('Fixed cards and dropdowns');
