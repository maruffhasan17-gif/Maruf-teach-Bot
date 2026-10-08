const fs = require('fs');

const buyCode = `
function PremiumBuyPage() {
    const [step, setStep] = React.useState(1);
    const [asset, setAsset] = React.useState('TON');
    const [amount, setAmount] = React.useState('');
    const [paymentMethod, setPaymentMethod] = React.useState('bKash');
    const [sendingNumber, setSendingNumber] = React.useState('');
    const [trxId, setTrxId] = React.useState('');
    const [receiveAddress, setReceiveAddress] = React.useState('');
    
    const [showAssetModal, setShowAssetModal] = React.useState(false);
    const [showMethodModal, setShowMethodModal] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [copied, setCopied] = React.useState(false);
    
    const [adminBkash, setAdminBkash] = React.useState("01752561935");
    const [adminNagad, setAdminNagad] = React.useState("01878580320");
    
    React.useEffect(() => {
        fetch((window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://maruf-teach-bot.onrender.com') + '/api/settings')
            .then(res => res.json())
            .then(data => {
                if(data.adminBkash) setAdminBkash(data.adminBkash);
                if(data.adminNagad) setAdminNagad(data.adminNagad);
            }).catch(e => console.log(e));
    }, []);

    const adminNumber = paymentMethod === 'bKash' ? adminBkash : adminNagad;
    
    const handleCopy = () => {
        navigator.clipboard.writeText(adminNumber);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    
    const liveCryptoRate = 1.9;
    const liveUsdBdt = 120;
    const totalBdt = amount ? (Number(amount) * (asset === 'USDT' ? liveUsdBdt : liveCryptoRate * liveUsdBdt)).toFixed(2) : '0.00';

    const isValidStep1 = amount && paymentMethod && receiveAddress;
    const isValidStep2 = sendingNumber && trxId;

    const handleContinue = () => {
        if(isValidStep1) setStep(2);
    };

    const handleSubmit = () => {
        if(!isValidStep2) return;
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setStep(3);
        }, 2000);
    };

    if (step === 3) {
        return (
            <div className="flex flex-col h-full items-center justify-center animate-in fade-in zoom-in-95 duration-500 p-6 text-center">
                <div className="w-24 h-24 bg-[#ECFDF3] rounded-full flex items-center justify-center mb-6 shadow-sm border-[6px] border-[#D1FADF]">
                    <Sparkles size={40} className="text-[#027A48]" />
                </div>
                <h2 className="text-2xl font-extrabold text-[#101828] mb-2">Payment Submitted</h2>
                <p className="text-[#475467] text-sm mb-8 leading-relaxed max-w-[260px]">
                    Your payment is being verified. We’ll process your order once verification is complete.
                </p>
                <div className="bg-white border border-[#E4E7EC] rounded-2xl p-5 w-full max-w-[300px] mb-8 shadow-sm">
                    <p className="text-xs text-[#98A2B3] font-bold uppercase tracking-wider mb-1">Order ID</p>
                    <p className="text-lg font-bold text-[#101828] mb-3">#TON-{Math.floor(Math.random() * 900000) + 100000}</p>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-xs font-bold border border-amber-200">
                        <Clock size={12} />
                        Verification Pending
                    </div>
                </div>
                <button onClick={() => { setStep(1); setAmount(''); setTrxId(''); setSendingNumber(''); setReceiveAddress(''); }} className="w-full bg-[#F8FAFC] text-[#475467] font-bold border border-[#E4E7EC] rounded-2xl p-4 transition-all active:scale-95 shadow-sm">
                    BACK TO HOME
                </button>
            </div>
        );
    }

    if (step === 2) {
        return (
            <div className="flex flex-col h-full animate-in slide-in-from-right duration-300 pb-24">
                <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => setStep(1)} className="p-2 -ml-2 bg-white rounded-full shadow-sm text-[#101828]"><ArrowDown size={20} className="rotate-90" /></button>
                    <div>
                        <h2 className="text-xl font-extrabold text-[#101828] tracking-tight">Payment Verification</h2>
                        <p className="text-[#475467] text-xs mt-0.5">Submit your payment details</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 mb-6 px-2">
                    <div className="h-1.5 flex-1 bg-[#00A878] rounded-full"></div>
                    <div className="h-1.5 flex-1 bg-[#00A878] rounded-full relative">
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-[#00A878] rounded-full ring-4 ring-[#ECFDF3]"></div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl p-5 mb-5 border border-[#E4E7EC] shadow-sm">
                    <h3 className="text-sm font-bold text-[#101828] mb-4">Complete Payment</h3>
                    <div className="bg-[#F8FAFC] rounded-2xl p-4 space-y-3 mb-4">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-[#475467]">Send exactly</span>
                            <span className="text-sm font-extrabold text-[#00A878]">৳{totalBdt} BDT</span>
                        </div>
                        <div className="h-px bg-[#E4E7EC] w-full"></div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-[#475467]">To {paymentMethod} Number</span>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-[#101828] bg-white px-2 py-1 rounded-md shadow-sm border border-[#E4E7EC]">{adminNumber}</span>
                                <button onClick={handleCopy} className={"p-1.5 rounded-md transition-colors shadow-sm " + (copied ? "bg-[#00A878] text-white" : "bg-white text-[#475467] border border-[#E4E7EC] hover:bg-gray-50")}>
                                    {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <h3 className="text-sm font-bold text-[#101828] mb-4 mt-6">Payment Details</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-extrabold text-[#98A2B3] block tracking-widest uppercase mb-1.5 ml-1">Sending Number ({paymentMethod})</label>
                            <input type="tel" value={sendingNumber} onChange={e => setSendingNumber(e.target.value)} placeholder="01XXXXXXXXX" className="w-full bg-[#F8FAFC] rounded-2xl p-4 text-sm font-bold text-[#101828] border border-[#E4E7EC] focus:border-[#00A878] focus:ring-4 focus:ring-[#00A878]/10 transition-all outline-none" />
                        </div>
                        <div>
                            <label className="text-[10px] font-extrabold text-[#98A2B3] block tracking-widest uppercase mb-1.5 ml-1">Transaction ID</label>
                            <input type="text" value={trxId} onChange={e => setTrxId(e.target.value)} placeholder="8ABC123XYZ" className="w-full bg-[#F8FAFC] rounded-2xl p-4 text-sm font-bold text-[#101828] border border-[#E4E7EC] focus:border-[#00A878] focus:ring-4 focus:ring-[#00A878]/10 transition-all outline-none" />
                        </div>
                    </div>
                </div>

                <div className="bg-[#ECFDF3] border border-[#00A878]/20 rounded-2xl p-4 flex gap-3 mb-6 shadow-sm">
                    <Info size={20} className="text-[#027A48] shrink-0 mt-0.5" />
                    <p className="text-[#027A48] text-xs font-medium leading-relaxed">Your payment will be verified before the {asset} is sent to your wallet.</p>
                </div>

                <div className="mt-auto">
                    <button onClick={handleSubmit} disabled={!isValidStep2 || loading} className="w-full bg-[#00A878] disabled:bg-[#E4E7EC] disabled:text-[#98A2B3] text-white font-extrabold rounded-2xl p-[18px] shadow-lg shadow-[#00A878]/20 active:scale-95 transition-all flex justify-center items-center gap-2">
                        {loading ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> VERIFYING...</> : 'SUBMIT FOR VERIFICATION'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
            <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-[#ECFDF3] rounded-full flex items-center justify-center text-[#00A878] border border-[#00A878]/20 shadow-sm">
                    <ArrowDown size={18} strokeWidth={2.5} />
                </div>
                <div>
                    <h2 className="text-xl font-extrabold text-[#101828] tracking-tight">Buy {asset}</h2>
                    <p className="text-[#475467] text-xs mt-0.5">Enter your order details to continue</p>
                </div>
            </div>

            <div className="flex items-center gap-2 mb-6 px-2">
                <div className="h-1.5 flex-1 bg-[#00A878] rounded-full relative">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-[#00A878] rounded-full ring-4 ring-[#ECFDF3]"></div>
                </div>
                <div className="h-1.5 flex-1 bg-[#E4E7EC] rounded-full"></div>
            </div>

            <div className="space-y-4">
                <div className="bg-white rounded-3xl p-5 border border-[#E4E7EC] shadow-sm">
                    <label className="text-[10px] font-extrabold text-[#98A2B3] block tracking-widest uppercase mb-2">Select Asset</label>
                    <button onClick={() => setShowAssetModal(true)} className="w-full bg-[#F8FAFC] rounded-2xl p-3.5 flex items-center justify-between border border-[#E4E7EC] active:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-2.5">
                            <span className="font-extrabold text-[#101828] text-base">{asset}</span>
                        </div>
                        <ChevronDown size={18} className="text-[#98A2B3]" />
                    </button>
                    
                    <label className="text-[10px] font-extrabold text-[#98A2B3] block tracking-widest uppercase mt-4 mb-2">Amount to Buy</label>
                    <div className="relative">
                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full bg-[#F8FAFC] rounded-2xl p-4 pr-14 text-xl font-extrabold text-[#101828] border border-[#E4E7EC] focus:border-[#00A878] focus:ring-4 focus:ring-[#00A878]/10 transition-all outline-none shadow-inner" />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-[#98A2B3]">{asset}</span>
                    </div>
                    {amount && (
                        <div className="mt-3 bg-[#ECFDF3] rounded-xl p-3 flex justify-between items-center border border-[#00A878]/10">
                            <span className="text-xs font-bold text-[#027A48]">You will pay</span>
                            <span className="text-sm font-extrabold text-[#027A48]">৳{totalBdt} BDT</span>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-3xl p-5 border border-[#E4E7EC] shadow-sm space-y-4">
                    <div>
                        <label className="text-[10px] font-extrabold text-[#98A2B3] block tracking-widest uppercase mb-1.5 ml-1">Payment Method</label>
                        <button onClick={() => setShowMethodModal(true)} className="w-full bg-[#F8FAFC] rounded-2xl p-4 flex items-center justify-between border border-[#E4E7EC] active:bg-gray-100 transition-colors">
                            <span className="text-sm font-bold text-[#101828]">{paymentMethod}</span>
                            <ChevronDown size={18} className="text-[#98A2B3]" />
                        </button>
                    </div>
                    <div>
                        <label className="text-[10px] font-extrabold text-[#98A2B3] block tracking-widest uppercase mb-1.5 ml-1">Receive Address ({asset})</label>
                        <input type="text" value={receiveAddress} onChange={e => setReceiveAddress(e.target.value)} placeholder={"Paste your " + asset + " address"} className="w-full bg-[#F8FAFC] rounded-2xl p-4 text-sm font-bold text-[#101828] border border-[#E4E7EC] focus:border-[#00A878] focus:ring-4 focus:ring-[#00A878]/10 transition-all outline-none" />
                    </div>
                </div>
            </div>

            <div className="mt-6">
                <button onClick={handleContinue} disabled={!isValidStep1} className="w-full bg-[#101828] disabled:bg-[#E4E7EC] disabled:text-[#98A2B3] text-white font-extrabold rounded-2xl p-[18px] shadow-lg active:scale-95 transition-all">
                    CONTINUE TO PAYMENT
                </button>
            </div>

             {showAssetModal && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center p-4">
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowAssetModal(false)} />
                    <div className="bg-white w-full max-w-sm rounded-t-[32px] rounded-b-[24px] p-6 relative z-10 shadow-2xl animate-in slide-in-from-bottom-full duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-extrabold text-lg text-[#101828]">Select Asset</h3>
                            <button onClick={() => setShowAssetModal(false)} className="p-2 bg-[#F8FAFC] text-[#475467] rounded-full"><X size={20} /></button>
                        </div>
                        <div className="space-y-3">
                            {['TON', 'USDT'].map(a => (
                                <button key={a} onClick={() => { setAsset(a); setShowAssetModal(false); }} className={"w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all " + (asset === a ? "border-[#00A878] bg-[#ECFDF3]" : "border-[#E4E7EC] hover:bg-gray-50")}>
                                    <span className={"font-bold text-lg " + (asset === a ? 'text-[#027A48]' : 'text-[#101828]')}>{a}</span>
                                    {asset === a && <div className="w-5 h-5 rounded-full bg-[#00A878] text-white flex items-center justify-center"><Sparkles size={12}/></div>}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
             )}

             {showMethodModal && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center p-4">
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowMethodModal(false)} />
                    <div className="bg-white w-full max-w-sm rounded-t-[32px] rounded-b-[24px] p-6 relative z-10 shadow-2xl animate-in slide-in-from-bottom-full duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-extrabold text-lg text-[#101828]">Payment Method</h3>
                            <button onClick={() => setShowMethodModal(false)} className="p-2 bg-[#F8FAFC] text-[#475467] rounded-full"><X size={20} /></button>
                        </div>
                        <div className="space-y-3">
                            {['bKash', 'Nagad'].map(a => (
                                <button key={a} onClick={() => { setPaymentMethod(a); setShowMethodModal(false); }} className={"w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all " + (paymentMethod === a ? "border-[#00A878] bg-[#ECFDF3]" : "border-[#E4E7EC] hover:bg-gray-50")}>
                                    <span className={"font-bold text-lg " + (paymentMethod === a ? 'text-[#027A48]' : 'text-[#101828]')}>{a}</span>
                                    {paymentMethod === a && <div className="w-5 h-5 rounded-full bg-[#00A878] text-white flex items-center justify-center"><Sparkles size={12}/></div>}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
             )}
        </div>
    );
}

function PremiumSellPage() {
    const [step, setStep] = React.useState(1);
    const [asset, setAsset] = React.useState('TON');
    const [amount, setAmount] = React.useState('');
    const [paymentMethod, setPaymentMethod] = React.useState('bKash');
    const [receiveNumber, setReceiveNumber] = React.useState('');
    const [trxId, setTrxId] = React.useState('');
    const [showAssetModal, setShowAssetModal] = React.useState(false);
    const [showMethodModal, setShowMethodModal] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [copied, setCopied] = React.useState(false);
    
    const adminWallet = "UQDa...n4Ck"; // Placeholder
    
    const handleCopy = () => {
        navigator.clipboard.writeText(adminWallet);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const liveCryptoRate = 1.9;
    const liveUsdBdt = 120;
    
    const totalBdt = amount ? (Number(amount) * (asset === 'USDT' ? liveUsdBdt : liveCryptoRate * liveUsdBdt)).toFixed(2) : '0.00';

    const isValidStep1 = amount && receiveNumber && paymentMethod;
    const isValidStep2 = trxId;

    const handleContinue = () => {
        if(isValidStep1) setStep(2);
    };

    const handleSubmit = () => {
        if(!isValidStep2) return;
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setStep(3);
        }, 2000);
    };

    if (step === 3) {
        return (
            <div className="flex flex-col h-full items-center justify-center animate-in fade-in zoom-in-95 duration-500 p-6 text-center">
                <div className="w-24 h-24 bg-[#ECFDF3] rounded-full flex items-center justify-center mb-6 shadow-sm border-[6px] border-[#D1FADF]">
                    <Sparkles size={40} className="text-[#027A48]" />
                </div>
                <h2 className="text-2xl font-extrabold text-[#101828] mb-2">Sell Submitted</h2>
                <p className="text-[#475467] text-sm mb-8 leading-relaxed max-w-[260px]">
                    Your crypto transfer is being verified. We’ll send BDT to your number once verified.
                </p>
                <div className="bg-white border border-[#E4E7EC] rounded-2xl p-5 w-full max-w-[300px] mb-8 shadow-sm">
                    <p className="text-xs text-[#98A2B3] font-bold uppercase tracking-wider mb-1">Order ID</p>
                    <p className="text-lg font-bold text-[#101828] mb-3">#SELL-{Math.floor(Math.random() * 900000) + 100000}</p>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-xs font-bold border border-amber-200">
                        <Clock size={12} />
                        Verification Pending
                    </div>
                </div>
                <button onClick={() => { setStep(1); setAmount(''); setTrxId(''); setReceiveNumber(''); }} className="w-full bg-[#F8FAFC] text-[#475467] font-bold border border-[#E4E7EC] rounded-2xl p-4 transition-all active:scale-95 shadow-sm">
                    BACK TO HOME
                </button>
            </div>
        );
    }

    if (step === 2) {
        return (
            <div className="flex flex-col h-full animate-in slide-in-from-right duration-300 pb-24">
                <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => setStep(1)} className="p-2 -ml-2 bg-white rounded-full shadow-sm text-[#101828]"><ArrowDown size={20} className="rotate-90" /></button>
                    <div>
                        <h2 className="text-xl font-extrabold text-[#101828] tracking-tight">Sell Verification</h2>
                        <p className="text-[#475467] text-xs mt-0.5">Submit your transfer details</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 mb-6 px-2">
                    <div className="h-1.5 flex-1 bg-[#00A878] rounded-full"></div>
                    <div className="h-1.5 flex-1 bg-[#00A878] rounded-full relative">
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-[#00A878] rounded-full ring-4 ring-[#ECFDF3]"></div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl p-5 mb-5 border border-[#E4E7EC] shadow-sm">
                    <h3 className="text-sm font-bold text-[#101828] mb-4">Complete Transfer</h3>
                    <div className="bg-[#F8FAFC] rounded-2xl p-4 space-y-3 mb-4">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-[#475467]">Send exactly</span>
                            <span className="text-sm font-extrabold text-[#00A878]">{amount} {asset}</span>
                        </div>
                        <div className="h-px bg-[#E4E7EC] w-full"></div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-[#475467]">To Address</span>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-[#101828] bg-white px-2 py-1 rounded-md shadow-sm border border-[#E4E7EC] truncate max-w-[120px]">{adminWallet}</span>
                                <button onClick={handleCopy} className={"p-1.5 rounded-md transition-colors shadow-sm " + (copied ? "bg-[#00A878] text-white" : "bg-white text-[#475467] border border-[#E4E7EC] hover:bg-gray-50")}>
                                    {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <h3 className="text-sm font-bold text-[#101828] mb-4 mt-6">Transfer Details</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-extrabold text-[#98A2B3] block tracking-widest uppercase mb-1.5 ml-1">Crypto Transfer TxID</label>
                            <input type="text" value={trxId} onChange={e => setTrxId(e.target.value)} placeholder="Tx Hash..." className="w-full bg-[#F8FAFC] rounded-2xl p-4 text-sm font-bold text-[#101828] border border-[#E4E7EC] focus:border-[#00A878] focus:ring-4 focus:ring-[#00A878]/10 transition-all outline-none" />
                        </div>
                    </div>
                </div>

                <div className="bg-[#ECFDF3] border border-[#00A878]/20 rounded-2xl p-4 flex gap-3 mb-6 shadow-sm">
                    <Info size={20} className="text-[#027A48] shrink-0 mt-0.5" />
                    <p className="text-[#027A48] text-xs font-medium leading-relaxed">Your transfer will be verified before BDT is sent to your number.</p>
                </div>

                <div className="mt-auto">
                    <button onClick={handleSubmit} disabled={!isValidStep2 || loading} className="w-full bg-[#00A878] disabled:bg-[#E4E7EC] disabled:text-[#98A2B3] text-white font-extrabold rounded-2xl p-[18px] shadow-lg shadow-[#00A878]/20 active:scale-95 transition-all flex justify-center items-center gap-2">
                        {loading ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> VERIFYING...</> : 'SUBMIT FOR VERIFICATION'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
            <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-[#ECFDF3] rounded-full flex items-center justify-center text-[#00A878] border border-[#00A878]/20 shadow-sm">
                    <ArrowUp size={18} strokeWidth={2.5} />
                </div>
                <div>
                    <h2 className="text-xl font-extrabold text-[#101828] tracking-tight">Sell {asset}</h2>
                    <p className="text-[#475467] text-xs mt-0.5">Sell crypto to receive BDT</p>
                </div>
            </div>

            <div className="flex items-center gap-2 mb-6 px-2">
                <div className="h-1.5 flex-1 bg-[#00A878] rounded-full relative">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-[#00A878] rounded-full ring-4 ring-[#ECFDF3]"></div>
                </div>
                <div className="h-1.5 flex-1 bg-[#E4E7EC] rounded-full"></div>
            </div>

            <div className="space-y-4">
                <div className="bg-white rounded-3xl p-5 border border-[#E4E7EC] shadow-sm">
                    <label className="text-[10px] font-extrabold text-[#98A2B3] block tracking-widest uppercase mb-2">Select Asset</label>
                    <button onClick={() => setShowAssetModal(true)} className="w-full bg-[#F8FAFC] rounded-2xl p-3.5 flex items-center justify-between border border-[#E4E7EC] active:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-2.5">
                            <span className="font-extrabold text-[#101828] text-base">{asset}</span>
                        </div>
                        <ChevronDown size={18} className="text-[#98A2B3]" />
                    </button>
                    
                    <label className="text-[10px] font-extrabold text-[#98A2B3] block tracking-widest uppercase mt-4 mb-2">Amount to Sell</label>
                    <div className="relative">
                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full bg-[#F8FAFC] rounded-2xl p-4 pr-14 text-xl font-extrabold text-[#101828] border border-[#E4E7EC] focus:border-[#00A878] focus:ring-4 focus:ring-[#00A878]/10 transition-all outline-none shadow-inner" />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-[#98A2B3]">{asset}</span>
                    </div>
                    {amount && (
                        <div className="mt-3 bg-[#ECFDF3] rounded-xl p-3 flex justify-between items-center border border-[#00A878]/10">
                            <span className="text-xs font-bold text-[#027A48]">You will receive</span>
                            <span className="text-sm font-extrabold text-[#027A48]">৳{totalBdt} BDT</span>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-3xl p-5 border border-[#E4E7EC] shadow-sm space-y-4">
                    <div>
                        <label className="text-[10px] font-extrabold text-[#98A2B3] block tracking-widest uppercase mb-1.5 ml-1">Receive Method</label>
                        <button onClick={() => setShowMethodModal(true)} className="w-full bg-[#F8FAFC] rounded-2xl p-4 flex items-center justify-between border border-[#E4E7EC] active:bg-gray-100 transition-colors">
                            <span className="text-sm font-bold text-[#101828]">{paymentMethod}</span>
                            <ChevronDown size={18} className="text-[#98A2B3]" />
                        </button>
                    </div>
                    <div>
                        <label className="text-[10px] font-extrabold text-[#98A2B3] block tracking-widest uppercase mb-1.5 ml-1">Receive Number ({paymentMethod})</label>
                        <input type="tel" value={receiveNumber} onChange={e => setReceiveNumber(e.target.value)} placeholder="01XXXXXXXXX" className="w-full bg-[#F8FAFC] rounded-2xl p-4 text-sm font-bold text-[#101828] border border-[#E4E7EC] focus:border-[#00A878] focus:ring-4 focus:ring-[#00A878]/10 transition-all outline-none" />
                    </div>
                </div>
            </div>

            <div className="mt-6">
                <button onClick={handleContinue} disabled={!isValidStep1} className="w-full bg-[#101828] disabled:bg-[#E4E7EC] disabled:text-[#98A2B3] text-white font-extrabold rounded-2xl p-[18px] shadow-lg active:scale-95 transition-all">
                    CONTINUE TO TRANSFER
                </button>
            </div>

             {showAssetModal && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center p-4">
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowAssetModal(false)} />
                    <div className="bg-white w-full max-w-sm rounded-t-[32px] rounded-b-[24px] p-6 relative z-10 shadow-2xl animate-in slide-in-from-bottom-full duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-extrabold text-lg text-[#101828]">Select Asset</h3>
                            <button onClick={() => setShowAssetModal(false)} className="p-2 bg-[#F8FAFC] text-[#475467] rounded-full"><X size={20} /></button>
                        </div>
                        <div className="space-y-3">
                            {['TON', 'USDT'].map(a => (
                                <button key={a} onClick={() => { setAsset(a); setShowAssetModal(false); }} className={"w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all " + (asset === a ? "border-[#00A878] bg-[#ECFDF3]" : "border-[#E4E7EC] hover:bg-gray-50")}>
                                    <span className={"font-bold text-lg " + (asset === a ? 'text-[#027A48]' : 'text-[#101828]')}>{a}</span>
                                    {asset === a && <div className="w-5 h-5 rounded-full bg-[#00A878] text-white flex items-center justify-center"><Sparkles size={12}/></div>}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
             )}

             {showMethodModal && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center p-4">
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowMethodModal(false)} />
                    <div className="bg-white w-full max-w-sm rounded-t-[32px] rounded-b-[24px] p-6 relative z-10 shadow-2xl animate-in slide-in-from-bottom-full duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-extrabold text-lg text-[#101828]">Receive Method</h3>
                            <button onClick={() => setShowMethodModal(false)} className="p-2 bg-[#F8FAFC] text-[#475467] rounded-full"><X size={20} /></button>
                        </div>
                        <div className="space-y-3">
                            {['bKash', 'Nagad'].map(a => (
                                <button key={a} onClick={() => { setPaymentMethod(a); setShowMethodModal(false); }} className={"w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all " + (paymentMethod === a ? "border-[#00A878] bg-[#ECFDF3]" : "border-[#E4E7EC] hover:bg-gray-50")}>
                                    <span className={"font-bold text-lg " + (paymentMethod === a ? 'text-[#027A48]' : 'text-[#101828]')}>{a}</span>
                                    {paymentMethod === a && <div className="w-5 h-5 rounded-full bg-[#00A878] text-white flex items-center justify-center"><Sparkles size={12}/></div>}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
             )}
        </div>
    );
}
`;

let c2 = fs.readFileSync('src/App.jsx', 'utf8');
const sBuy = c2.indexOf('function PremiumBuyPage()');
const eSell = c2.indexOf('function ProfilePage');

if(sBuy !== -1 && eSell !== -1) {
    c2 = c2.substring(0, sBuy) + buyCode + c2.substring(eSell);
    fs.writeFileSync('src/App.jsx', c2, 'utf8');
    console.log("Pages updated!");
} else {
    console.log("Could not find functions");
}
