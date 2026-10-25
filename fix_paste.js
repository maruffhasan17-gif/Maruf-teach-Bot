const fs = require('fs');
let code = fs.readFileSync('miniapp/src/App.jsx', 'utf8');

const addressInputOld = `<input type="text" value={receiveAddress} onChange={e => setReceiveAddress(e.target.value)} placeholder="UQD..." className="w-full bg-[#F8FAFC] rounded-2xl p-4 text-sm font-bold text-[#101828] border border-[#E4E7EC] focus:border-[#00A878] focus:ring-4 focus:ring-[#00A878]/10 transition-all outline-none" />`;

const addressInputNew = `<div className="relative">
    <input type="text" value={receiveAddress} onChange={e => setReceiveAddress(e.target.value)} placeholder="UQD..." className="w-full bg-[#F8FAFC] rounded-2xl p-4 pr-12 text-sm font-bold text-[#101828] border border-[#E4E7EC] focus:border-[#00A878] focus:ring-4 focus:ring-[#00A878]/10 transition-all outline-none" />
    <button onClick={async () => { try { const text = await navigator.clipboard.readText(); setReceiveAddress(text); } catch(e){} }} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white text-[#98A2B3] hover:text-[#00A878] hover:bg-[#ECFDF3] rounded-lg transition-all shadow-sm border border-[#E4E7EC]">
        <ClipboardPaste size={16} />
    </button>
</div>`;

const trxInputOld = `<input type="text" value={trxId} onChange={e => setTrxId(e.target.value)} placeholder="8ABC123XYZ" className="w-full bg-[#F8FAFC] rounded-2xl p-4 text-sm font-bold text-[#101828] border border-[#E4E7EC] focus:border-[#00A878] focus:ring-4 focus:ring-[#00A878]/10 transition-all outline-none" />`;

const trxInputNew = `<div className="relative">
    <input type="text" value={trxId} onChange={e => setTrxId(e.target.value)} placeholder="8ABC123XYZ" className="w-full bg-[#F8FAFC] rounded-2xl p-4 pr-12 text-sm font-bold text-[#101828] border border-[#E4E7EC] focus:border-[#00A878] focus:ring-4 focus:ring-[#00A878]/10 transition-all outline-none" />
    <button onClick={async () => { try { const text = await navigator.clipboard.readText(); setTrxId(text); } catch(e){} }} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white text-[#98A2B3] hover:text-[#00A878] hover:bg-[#ECFDF3] rounded-lg transition-all shadow-sm border border-[#E4E7EC]">
        <ClipboardPaste size={16} />
    </button>
</div>`;

code = code.replace(addressInputOld, addressInputNew);
code = code.replace(trxInputOld, trxInputNew);

fs.writeFileSync('miniapp/src/App.jsx', code);
