import re
import sys

with open('miniapp/src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

new_sell_page = """function PremiumSellPage() {
    const [asset, setAsset] = React.useState('TON');
    const [amount, setAmount] = React.useState('');
    const [showAssetModal, setShowAssetModal] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [txStatus, setTxStatus] = React.useState(null);
    const [txMessage, setTxMessage] = React.useState('');
    
    const userTonAddress = useTonAddress();
    const [tonConnectUI] = useTonConnectUI();
    const liveCryptoRate = 1.9;
    const liveUsdBdt = 120;
    
    const totalBdt = amount ? (Number(amount) * (asset === 'USDT' ? liveUsdBdt : liveCryptoRate * liveUsdBdt)).toFixed(2) : '0.00';

    const isValid = amount && parseFloat(amount) > 0;

    const handleSell = async () => {
        if (!userTonAddress) {
            tonConnectUI.connectWallet();
            return;
        }
        
        setLoading(true);
        setTxStatus(null);
        try {
            // 1. Build transaction
            const txRes = await buildTransaction({ asset, amount: parseFloat(amount) });
            if (!txRes.success) throw new Error('Transaction build failed');
            
            // 2. Send via TonConnect
            await tonConnectUI.sendTransaction(txRes.tx);

            // 3. Save order and credit FIAT balance
            await submitSellOrder({
                userId: WebApp.initDataUnsafe?.user?.id || 8799135330, 
                asset, 
                amount: parseFloat(amount), 
                estimatedTk: parseFloat(totalBdt), 
                wallet: userTonAddress
            });
            
            // 4. Reload global balance in App.jsx
            if (window.reloadGlobalData) window.reloadGlobalData();

            setTxStatus('success');
            setTxMessage('Successfully sold. Balance added!');
            setAmount('');
            setTimeout(() => setTxStatus(null), 3000);
        } catch(e) {
            console.error(e);
            setTxStatus('error');
            setTxMessage('Transaction failed or cancelled.');
            setTimeout(() => setTxStatus(null), 3000);
        }
        setLoading(false);
    };

    if (txStatus === 'success') {
        return (
            <div className="flex flex-col h-full animate-in zoom-in-95 duration-500 justify-center items-center pb-24 px-5">
                <div className="w-20 h-20 bg-[#ECFDF3] rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(2,122,72,0.2)]">
                    <CheckCircle2 size={40} className="text-[#027A48]" />
                </div>
                <h2 className="text-2xl font-extrabold text-[#101828] mb-2 text-center tracking-tight">Sell Successful!</h2>
                <p className="text-[#475467] text-sm text-center mb-8 font-medium">Your TK balance has been credited with {totalBdt} BDT.</p>
                <button onClick={() => setTxStatus(null)} className="w-full bg-[#101828] text-white font-extrabold rounded-2xl p-4 shadow-lg active:scale-95 transition-all text-sm tracking-wide">
                    DONE
                </button>
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
                    <p className="text-[#475467] text-xs mt-0.5">Sell crypto to receive TK balance instantly</p>
                </div>
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
                        <label className="text-[10px] font-extrabold text-[#98A2B3] block tracking-widest uppercase mb-1.5 ml-1">Amount to Sell</label>
                        <div className="relative">
                            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full bg-[#F8FAFC] rounded-2xl p-4 pr-14 text-sm font-bold text-[#101828] border border-[#E4E7EC] focus:border-[#00A878] focus:ring-4 focus:ring-[#00A878]/10 transition-all outline-none" />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-sm text-[#98A2B3]">{asset}</span>
                        </div>
                        {amount && (
                            <div className="mt-3 bg-[#ECFDF3] rounded-xl p-3 flex justify-between items-center border border-[#00A878]/10">
                                <span className="text-xs font-bold text-[#027A48]">You will receive in-app</span>
                                <span className="text-sm font-extrabold text-[#027A48]">৳{totalBdt} BDT</span>
                            </div>
                        )}
                    </div>
                </div>
                
                {txStatus === 'error' && (
                    <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-3 text-red-600 shadow-sm animate-in fade-in">
                        <Info size={20} className="shrink-0 mt-0.5" />
                        <p className="text-xs font-medium leading-relaxed">{txMessage}</p>
                    </div>
                )}

                <div className="bg-[#F8FAFC] border border-[#E4E7EC] rounded-2xl p-4 flex gap-3 mb-6 shadow-sm">
                    <Info size={20} className="text-[#98A2B3] shrink-0 mt-0.5" />
                    <p className="text-[#475467] text-xs font-medium leading-relaxed">Selling crypto will open your Tonkeeper wallet to approve the transaction. Once approved, the equivalent TK balance will be added immediately.</p>
                </div>

                <div className="mt-auto pt-4">
                    <button onClick={handleSell} disabled={!isValid || loading} className="w-full bg-[#101828] disabled:bg-[#101828]/50 disabled:cursor-not-allowed text-white font-extrabold rounded-2xl p-4 shadow-lg shadow-black/20 active:scale-95 transition-all flex justify-center items-center gap-2 text-sm tracking-wide">
                        {loading ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> PROCESSING...</> : (!userTonAddress ? 'CONNECT WALLET' : 'SELL NOW')}
                    </button>
                </div>
            </div>
        </div>
    );
}"""

pattern = re.compile(r'function PremiumSellPage\(\) \{.*?(?=function ClaimPage\(\) \{)', re.DOTALL)
new_content = pattern.sub(new_sell_page + '\n\n', content)

with open('miniapp/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Replaced PremiumSellPage successfully.")
