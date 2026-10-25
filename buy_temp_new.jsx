function PremiumBuyPage() {
    const [step, setStep] = React.useState(1);
    const [asset, setAsset] = React.useState('TON');
    const [amount, setAmount] = React.useState('');
    const [paymentMethod, setPaymentMethod] = React.useState('bKash');
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
    const totalCrypto = amount ? (Number(amount) / (asset === 'USDT' ? liveUsdBdt : liveCryptoRate * liveUsdBdt)).toFixed(4) : '0.00';

    const isValidStep1 = amount && paymentMethod && receiveAddress;
    const isValidStep2 = trxId;

    const handleContinue = () => {
        if(isValidStep1) { setStep(2); window.scrollTo({top:0, behavior:'smooth'}); }
    };

    const handleSubmit = async () => {
        if(!isValidStep2) return;
        setLoading(true);
        try {
            await submitBuyOrder({
                userId: user?.id || 123456789,
                asset,
                amount: parseFloat(totalCrypto),
                totalBdt: parseFloat(amount),
                paymentMethod,
                trxId,
                receiveAddress: receiveAddress
            });
            setStep(3); window.scrollTo({top:0, behavior:'smooth'});
        } catch (e) {
            alert('Failed to submit order');
        }
        setLoading(false);
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
                <button onClick={() => { setStep(1); setAmount(''); setTrxId(''); setReceiveAddress(''); }} className="w-full bg-[#F8FAFC] text-[#475467] font-bold border border-[#E4E7EC] rounded-2xl p-4 transition-all active:scale-95 shadow-sm">
                    BACK TO HOME
                </button>
            </div>
        );
    }

    if (step === 2) {
        return (
            <div className="flex flex-col h-full animate-in slide-in-from-right duration-300 pb-24">
                <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => { setStep(1); window.scrollTo({top:0, behavior:'smooth'}); }} className="p-2 -ml-2 bg-white rounded-full shadow-sm text-[#101828]"><ArrowDown size={20} className="rotate-90" /></button>
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
                            <span className="text-sm font-extrabold text-[#00A878]">৳{amount} BDT</span>
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
                <div className="bg-white rounded-3xl p-5 border border-[#E4E7EC] shadow-sm space-y-4">
    <div>
        <label className="text-[10px] font-extrabold text-[#98A2B3] block tracking-widest uppercase mb-1.5 ml-1">Select Asset</label>
        
    <div className="relative z-50">
        <button onClick={() => setShowAssetModal(!showAssetModal)} className="w-full bg-[#F8FAFC] rounded-2xl p-4 flex items-center justify-between border border-[#E4E7EC] active:bg-gray-100 transition-colors">
            <div className="flex items-center gap-2.5">
                {asset === 'TON' ? <img src="https://cryptologos.cc/logos/toncoin-ton-logo.svg?v=035" className="w-5 h-5" alt="TON" /> : <img src="https://cryptologos.cc/logos/tether-usdt-logo.svg?v=035" className="w-5 h-5" alt="USDT" />}
                <span className="font-bold text-[#101828] text-sm">{asset}</span>
            </div>
            <ChevronDown size={18} className={"text-[#98A2B3] transition-transform " + (showAssetModal ? "rotate-180" : "")} />
        </button>
        {showAssetModal && (
            
    <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-xl shadow-xl border border-[#E4E7EC] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
        <button onClick={() => { setAsset('TON'); setShowAssetModal(false); }} className={"w-full flex items-center gap-2.5 p-4 border-b border-[#E4E7EC] hover:bg-gray-50 transition-colors " + (asset === 'TON' ? "bg-[#ECFDF3]" : "")}>
            <img src="https://cryptologos.cc/logos/toncoin-ton-logo.svg?v=035" className="w-5 h-5" alt="TON" />
            <span className={"font-bold text-sm " + (asset === 'TON' ? 'text-[#027A48]' : 'text-[#101828]')}>TON</span>
        </button>
        <button onClick={() => { setAsset('USDT'); setShowAssetModal(false); }} className={"w-full flex items-center gap-2.5 p-4 hover:bg-gray-50 transition-colors " + (asset === 'USDT' ? "bg-[#ECFDF3]" : "")}>
            <img src="https://cryptologos.cc/logos/tether-usdt-logo.svg?v=035" className="w-5 h-5" alt="USDT" />
            <span className={"font-bold text-sm " + (asset === 'USDT' ? 'text-[#027A48]' : 'text-[#101828]')}>USDT</span>
        </button>
    </div>

        )}
    </div>

    </div>
    <div>
        <label className="text-[10px] font-extrabold text-[#98A2B3] block tracking-widest uppercase mb-1.5 ml-1">Amount to Pay (BDT)</label>
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
        )}
        )}
    </div>
</div>

                <div className="bg-white rounded-3xl p-5 border border-[#E4E7EC] shadow-sm space-y-4">
                    <div>
                        <label className="text-[10px] font-extrabold text-[#98A2B3] block tracking-widest uppercase mb-1.5 ml-1">Payment Method</label>
                        
    
    
    
    <div className="relative z-40">
        <button onClick={() => setShowMethodModal(!showMethodModal)} className="w-full bg-[#F8FAFC] rounded-2xl p-4 flex items-center justify-between border border-[#E4E7EC] active:bg-gray-100 transition-colors">
            <div className="flex items-center gap-2.5">
                {paymentMethod === 'bKash' ? <img src="https://mohammadalinijhoom.com/wp-content/uploads/2024/07/bKash-Logo.png" className="w-5 h-5 object-contain" alt="bKash" /> : <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ1M8VPPADiai-0lEgQMNXBEir230b0dAn61cgVHRVQat7qn3-H0L4m1Zg&s=10" className="w-5 h-5 object-contain" alt="Nagad" />}
                <span className="font-bold text-[#101828] text-sm">{paymentMethod}</span>
            </div>
            <ChevronDown size={18} className={"text-[#98A2B3] transition-transform " + (showMethodModal ? "rotate-180" : "")} />
        </button>
        {showMethodModal && (
            
    <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-xl shadow-xl border border-[#E4E7EC] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-40">
        <button onClick={() => { setPaymentMethod('bKash'); setShowMethodModal(false); }} className={"w-full flex items-center justify-between p-4 border-b border-[#E4E7EC] hover:bg-gray-50 transition-colors " + (paymentMethod === 'bKash' ? "bg-[#ECFDF3]" : "")}>
            <div className="flex items-center gap-2.5">
                <img src="https://mohammadalinijhoom.com/wp-content/uploads/2024/07/bKash-Logo.png" className="w-5 h-5 object-contain" alt="bKash" />
                <span className={"font-bold text-sm " + (paymentMethod === 'bKash' ? 'text-[#027A48]' : 'text-[#101828]')}>bKash</span>
            </div>
            {paymentMethod === 'bKash' && <Sparkles size={14} className="text-[#00A878]"/>}
        </button>
        <button onClick={() => { setPaymentMethod('Nagad'); setShowMethodModal(false); }} className={"w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors " + (paymentMethod === 'Nagad' ? "bg-[#ECFDF3]" : "")}>
            <div className="flex items-center gap-2.5">
                <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ1M8VPPADiai-0lEgQMNXBEir230b0dAn61cgVHRVQat7qn3-H0L4m1Zg&s=10" className="w-5 h-5 object-contain" alt="Nagad" />
                <span className={"font-bold text-sm " + (paymentMethod === 'Nagad' ? 'text-[#027A48]' : 'text-[#101828]')}>Nagad</span>
            </div>
            {paymentMethod === 'Nagad' && <Sparkles size={14} className="text-[#00A878]"/>}
        </button>
    </div>

        )}
    </div>

    </div>
                    <div>
                        <label className="text-[10px] font-extrabold text-[#98A2B3] block tracking-widest uppercase mb-1.5 ml-1">Receive Address ({asset})</label>
                        <input type="text" value={receiveAddress} onChange={e => setReceiveAddress(e.target.value)} placeholder={"Paste your " + asset + " address"} className="w-full bg-[#F8FAFC] rounded-2xl p-4 text-sm font-bold text-[#101828] border border-[#E4E7EC] focus:border-[#00A878] focus:ring-4 focus:ring-[#00A878]/10 transition-all outline-none" />
                    </div>
                </div>
            </div>

            <div className="mt-6">
                <button onClick={handleContinue} disabled={!isValidStep1} className="w-full bg-[#101828] disabled:bg-[#101828]/50 disabled:cursor-not-allowed text-white font-extrabold rounded-2xl p-4 shadow-lg shadow-black/20 active:scale-95 transition-all text-sm tracking-wide">
        PAYMENT
    </button>
            </div>

             

             
        </div>
    );
}


