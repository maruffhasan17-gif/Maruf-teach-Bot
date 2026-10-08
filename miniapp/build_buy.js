const fs = require('fs');
let c = fs.readFileSync('src/App.jsx', 'utf8');

const start = c.indexOf('function BuyPage()');
const end = c.indexOf('function SellPage()');

if(start !== -1 && end !== -1) {
    const buy_code = \unction BuyPage() {
    const [loading, setLoading] = useState(false);
    const [txStatus, setTxStatus] = useState(null);
    const [txMessage, setTxMessage] = useState('');
    const [asset, setAsset] = useState('TON');
    const [name, setName] = useState('');
    const [sendingNumber, setSendingNumber] = useState('');
    const [trxId, setTrxId] = useState('');
    const [receiveAddress, setReceiveAddress] = useState('');
    const [amount, setAmount] = useState('');
    const [showAssetModal, setShowAssetModal] = useState(false);
    
    const adminBkash = "01931368630";
    const liveCryptoRate = 1.9;
    const liveUsdBdt = 120;

    const handleBuy = async () => {
        if (!name || !sendingNumber || !trxId || !receiveAddress || !amount) {
            setTxStatus('error');
            setTxMessage('Please fill all fields');
            setTimeout(() => setTxStatus(null), 3000);
            return;
        }

        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setTxStatus('success');
            setTxMessage('Order submitted! Waiting for auto-verification.');
            setName('');
            setSendingNumber('');
            setTrxId('');
            setReceiveAddress('');
            setAmount('');
            setTimeout(() => setTxStatus(null), 4000);
        }, 1500);
    };

    return (
        <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex items-center gap-3 mb-6 mt-2">
                <div className="w-9 h-9 bg-[var(--color-brand)]/10 rounded-full flex items-center justify-center text-[var(--color-brand)] shadow-inner">
                    <ArrowDown size={16} strokeWidth={2.5} />
                </div>
                <h2 className="text-lg font-extrabold text-[var(--color-text-primary)] tracking-tight">Buy little amount of Gram and USDT</h2>
             </div>

             <div className="bg-[var(--color-bg-secondary)] rounded-2xl p-5 mb-6 border border-white/40 shadow-sm relative overflow-hidden group">
                <h3 className="text-sm font-semibold mb-3 text-[var(--color-text-secondary)]">Payment Instructions</h3>
                <div className="bg-white/60 rounded-xl p-3 mb-4">
                    <p className="text-sm">1. Send money to our bKash/Nagad Personal number:</p>
                    <p className="text-lg font-bold text-[var(--color-brand)] mt-1 tracking-wider">{adminBkash}</p>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1">2. Copy the Transaction ID (TrxID)</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">3. Fill out the form below</p>
                </div>

                <div className="space-y-4 relative z-10">
                    <div>
                        <label className="text-[11px] font-bold text-[var(--color-text-secondary)] ml-1 mb-1.5 block tracking-wider uppercase">Select Asset</label>
                        <button onClick={() => setShowAssetModal(true)} className="w-full bg-white rounded-xl p-3 flex items-center justify-between border border-[var(--color-border)] shadow-sm hover:border-[var(--color-brand)]/30 transition-colors">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-[var(--color-text-primary)]">{asset}</span>
                            </div>
                            <ChevronDown size={16} className="text-[var(--color-text-secondary)]" />
                        </button>
                    </div>

                    <div>
                        <label className="text-[11px] font-bold text-[var(--color-text-secondary)] ml-1 mb-1.5 block tracking-wider uppercase">Amount to Buy ({asset})</label>
                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full bg-white rounded-xl p-3.5 text-lg font-bold border border-[var(--color-border)] shadow-sm focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/20 transition-all outline-none" />
                        {amount && (
                            <p className="text-xs font-semibold text-[var(--color-brand)] mt-1.5 ml-1">You will pay: ?{(Number(amount) * (asset === 'USDT' ? liveUsdBdt : liveCryptoRate * liveUsdBdt)).toFixed(2)} BDT</p>
                        )}
                    </div>

                    <div>
                        <label className="text-[11px] font-bold text-[var(--color-text-secondary)] ml-1 mb-1.5 block tracking-wider uppercase">Your Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" className="w-full bg-white rounded-xl p-3 text-sm font-medium border border-[var(--color-border)] shadow-sm focus:border-[var(--color-brand)] outline-none" />
                    </div>

                    <div>
                        <label className="text-[11px] font-bold text-[var(--color-text-secondary)] ml-1 mb-1.5 block tracking-wider uppercase">Sending Number</label>
                        <input type="tel" value={sendingNumber} onChange={e => setSendingNumber(e.target.value)} placeholder="01XXXXXXXXX" className="w-full bg-white rounded-xl p-3 text-sm font-medium border border-[var(--color-border)] shadow-sm focus:border-[var(--color-brand)] outline-none" />
                    </div>

                    <div>
                        <label className="text-[11px] font-bold text-[var(--color-text-secondary)] ml-1 mb-1.5 block tracking-wider uppercase">Transaction ID</label>
                        <input type="text" value={trxId} onChange={e => setTrxId(e.target.value)} placeholder="8ABC123XYZ" className="w-full bg-white rounded-xl p-3 text-sm font-medium border border-[var(--color-border)] shadow-sm focus:border-[var(--color-brand)] outline-none" />
                    </div>

                    <div>
                        <label className="text-[11px] font-bold text-[var(--color-text-secondary)] ml-1 mb-1.5 block tracking-wider uppercase">Receive Address ({asset})</label>
                        <input type="text" value={receiveAddress} onChange={e => setReceiveAddress(e.target.value)} placeholder={"Paste your " + asset + " address"} className="w-full bg-white rounded-xl p-3 text-sm font-medium border border-[var(--color-border)] shadow-sm focus:border-[var(--color-brand)] outline-none" />
                    </div>
                </div>
             </div>

             <div className="mt-auto mb-24">
                <button onClick={handleBuy} disabled={loading} className="w-full bg-[var(--color-brand)] text-white font-extrabold rounded-2xl p-4 flex items-center justify-center gap-2 buy-btn-shadow active:scale-95 transition-all relative overflow-hidden disabled:opacity-70">
                   <span className="text-[13px] tracking-wide">{loading ? 'SUBMITTING...' : 'CONFIRM BUY'}</span>
                </button>
             </div>

             {showAssetModal && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAssetModal(false)} />
                    <div className="bg-white w-full max-w-sm rounded-[24px] p-5 relative z-10 shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg">Select Asset</h3>
                            <button onClick={() => setShowAssetModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
                        </div>
                        <div className="space-y-2">
                            {['TON', 'USDT'].map(a => (
                                <button key={a} onClick={() => { setAsset(a); setShowAssetModal(false); }} className={"w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all " + (asset === a ? "border-[var(--color-brand)] bg-[var(--color-brand)]/5" : "border-transparent hover:bg-gray-50")}>
                                    <span className="font-bold text-lg">{a}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
             )}

             {txStatus && (
                <div className={"fixed top-4 left-4 right-4 p-4 rounded-2xl shadow-lg flex items-start gap-3 z-50 animate-in slide-in-from-top-4 fade-in duration-300 " + (txStatus === 'success' ? 'bg-[#10B981] text-white' : 'bg-[#EF4444] text-white')}>
                   <p className="font-medium text-sm leading-snug">{txMessage}</p>
                </div>
             )}
        </div>
    );
}
\;

    c = c.substring(0, start) + buy_code + c.substring(end);
    fs.writeFileSync('src/App.jsx', c, 'utf8');
}
