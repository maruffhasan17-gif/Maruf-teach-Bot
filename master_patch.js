const fs = require('fs');

let content = fs.readFileSync('miniapp/src/App.jsx', 'utf8');

// 1. SCROLL FIX
const scrollRegex = /const \[activeTab, setActiveTab\] = useState\('home'\);/;
const scrollReplace = `const [activeTab, setActiveTab] = useState('home');

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [activeTab]);`;
content = content.replace(scrollRegex, scrollReplace);

// 2. ERROR HANDLING IN handleSubmit (PremiumBuyPage)
content = content.replace(
    /alert\('Failed to submit order'\);/g, 
    "alert(e.message || 'Failed to submit order'); window.Telegram?.WebApp?.showAlert(e.message || 'Failed to submit order');"
);

// 3. HOME PAGE WITHDRAWAL CARD
content = content.replace(
    /<HomePage balance=\{balance\} user=\{user\} onGoToClaim/g,
    "<HomePage balance={balance} user={user} fiatWithdrawPending={fiatWithdrawPending} onGoToClaim"
);
content = content.replace(
    /function HomePage\(\{ balance, user, onGoToClaim \}\) \{/g,
    "function HomePage({ balance, user, fiatWithdrawPending, onGoToClaim }) {"
);
const returnRegex = /return \(\s*<div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">/m;
const newReturn = `return (
    <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
      
      {fiatWithdrawPending && (
          fiatWithdrawPending.status === 'completed' ? (
              Date.now() - (fiatWithdrawPending.completedAt || Date.now()) < 3 * 60 * 60 * 1000 && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-3xl flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 shrink-0 shadow-inner">
                          <CheckCircle2 size={24} />
                      </div>
                      <div>
                          <h3 className="text-emerald-500 font-extrabold text-sm tracking-widest uppercase">Withdrawal Successful</h3>
                          <p className="text-[var(--color-text-secondary)] text-xs mt-0.5">Your <b>{fiatWithdrawPending.amount} TK</b> has been sent to {fiatWithdrawPending.method} ({fiatWithdrawPending.number}).</p>
                      </div>
                  </div>
              )
          ) : (
              <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-3xl flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-500 shrink-0 shadow-inner">
                      <Clock size={24} />
                  </div>
                  <div>
                      <h3 className="text-amber-500 font-extrabold text-sm tracking-widest uppercase">Withdrawal Pending</h3>
                      <p className="text-[var(--color-text-secondary)] text-xs mt-0.5">Serial <b>#{fiatWithdrawPending.serial || 'N/A'}</b>: <b>{fiatWithdrawPending.amount} TK</b> via {fiatWithdrawPending.method} ({fiatWithdrawPending.number}).</p>
                  </div>
              </div>
          )
      )}`;
content = content.replace(returnRegex, newReturn);


// 4. PREMIUM SELL PAGE
const startStr = "function PremiumSellPage() {";
const endStr = "\nfunction HistoryPage";
const startIdx = content.indexOf(startStr);
const endIdx = content.indexOf(endStr);

if (startIdx !== -1 && endIdx !== -1) {
    const newComponent = `function PremiumSellPage() {
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState(null);
  const [txMessage, setTxMessage] = useState('');
  const [asset, setAsset] = useState('USDT');
  
  // Bidirectional Input State
  const [inputType, setInputType] = useState('crypto'); // 'crypto' or 'fiat'
  const [cryptoAmount, setCryptoAmount] = useState('');
  const [fiatAmount, setFiatAmount] = useState('');
  
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [liveCryptoRate, setLiveCryptoRate] = useState(1.9);
  const [liveUsdBdt, setLiveUsdBdt] = useState(120);

  const userTonAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();

  useEffect(() => {
     const fetchPrice = async () => {
         try {
             const cached = localStorage.getItem('maruf_crypto_rates');
             if (cached) {
                 const parsed = JSON.parse(cached);
                 const now = Date.now();
                 if (now - parsed.timestamp < 3600000) {
                     setLiveCryptoRate(parsed.tonPrice);
                     setLiveUsdBdt(parsed.usdBdt);
                     return;
                 }
             }

             const resTon = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=TONUSDT');
             const dataTon = await resTon.json();
             const tonPrice = parseFloat(dataTon.price) || 1.9;

             const resBdt = await fetch('https://open.er-api.com/v6/latest/USD');
             const dataBdt = await resBdt.json();
             const usdBdt = dataBdt.rates.BDT || 120;

             localStorage.setItem('maruf_crypto_rates', JSON.stringify({
                 tonPrice, usdBdt, timestamp: Date.now()
             }));

             setLiveCryptoRate(tonPrice);
             setLiveUsdBdt(usdBdt);
         } catch(e) {
             console.error("Failed to fetch live price", e);
             const cached = localStorage.getItem('maruf_crypto_rates');
             if (cached) {
                 const parsed = JSON.parse(cached);
                 setLiveCryptoRate(parsed.tonPrice);
                 setLiveUsdBdt(parsed.usdBdt);
             }
         }
     };
     fetchPrice();
     const interval = setInterval(fetchPrice, 60000);
     return () => clearInterval(interval);
  }, []);

  const profitMargin = 0.90; // We take 10% profit
  const marketRate = asset === 'USDT' ? liveUsdBdt : (liveCryptoRate * liveUsdBdt);
  const rate = marketRate * profitMargin;

  // Sync the inputs whenever one changes or asset changes
  useEffect(() => {
      if (inputType === 'crypto') {
          if (!cryptoAmount) {
              setFiatAmount('');
          } else {
              setFiatAmount(Math.floor(parseFloat(cryptoAmount) * rate).toString());
          }
      } else {
          if (!fiatAmount) {
              setCryptoAmount('');
          } else {
              setCryptoAmount((parseFloat(fiatAmount) / rate).toFixed(4));
          }
      }
  }, [cryptoAmount, fiatAmount, inputType, asset, rate]);

  useEffect(() => {
     if(showKeyboard) {
        setTimeout(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, 100);
     }
  }, [showKeyboard]);

  const handleKeyPress = (key) => {
     if (inputType === 'crypto') {
         if (key === 'del') {
            setCryptoAmount(prev => prev.slice(0, -1));
         } else if (key === '.') {
            if (!cryptoAmount.includes('.')) setCryptoAmount(prev => prev + (prev === '' ? '0.' : '.'));
         } else {
            if (cryptoAmount.length < 10) setCryptoAmount(prev => prev + key);
         }
     } else {
         // Fiat input (no decimals allowed)
         if (key === 'del') {
            setFiatAmount(prev => prev.slice(0, -1));
         } else if (key === '.') {
            // Do nothing, no dot allowed in BDT
         } else {
            if (fiatAmount.length < 10) setFiatAmount(prev => prev + key);
         }
     }
  };

  const handleSell = async (e) => {
    if(e.preventDefault) e.preventDefault();
    if(!userTonAddress || !cryptoAmount || !fiatAmount) return;
    
    if (parseFloat(fiatAmount) < 1) return window.Telegram?.WebApp?.showAlert("Minimum sell amount is 1 BDT");
    if (parseFloat(fiatAmount) > 20000) return window.Telegram?.WebApp?.showAlert("Maximum sell amount is 20000 BDT");
    
    setLoading(true);
    try {
      const txRes = await buildTransaction({
          asset,
          amount: parseFloat(cryptoAmount),
          userAddress: userTonAddress,
          adminWallet: "UQC7hYHfrVJ_uT_esMr7vCv1bVh5ytQxYUUjRDiTUiG9s5Fb"
      });
      if (!txRes.success) throw new Error(txRes.error || "Failed to build transaction");

      await tonConnectUI.sendTransaction(txRes.tx);

      await submitSellOrder({
        userId: WebApp.initDataUnsafe?.user?.id || 123456789, 
        asset, 
        amount: parseFloat(cryptoAmount), 
        estimatedTk: parseFloat(fiatAmount), 
        wallet: userTonAddress
      });
      
      if (window.reloadGlobalData) window.reloadGlobalData();

      setTxStatus('success');
      setTxMessage('Successfully swapped to TK BDT');
      setCryptoAmount('');
      setFiatAmount('');
      setShowKeyboard(false);
      setTimeout(() => setTxStatus(null), 3000);
    } catch(e) {
      setTxStatus('error');
      setTxMessage('There will be no changes to your account.');
      setTimeout(() => setTxStatus(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const AssetIcon = () => {
      if (asset === 'USDT') return <CircleDollarSign size={14} className="text-emerald-500" />;
      return <Gem size={14} className="text-blue-500" />;
  };

  return (
    <>
      {showKeyboard && (
          <style>{\`
              .fixed.bottom-0.z-50.flex.justify-center { display: none !important; }
              #main-app-header { max-height: 0px !important; opacity: 0 !important; pointer-events: none; margin: 0 !important; padding: 0 !important; overflow: hidden; }
              body { overflow: hidden !important; }
          \`}</style>
      )}
      <div className={\`animate-in fade-in max-w-md mx-auto relative h-full transition-all duration-300 ease-out \${showKeyboard ? 'pb-[280px] pt-4' : 'pb-24'}\`}>
        
        {showKeyboard && (
           <div className="flex items-center mb-4 animate-in slide-in-from-top-4 duration-300">
               <button onClick={() => setShowKeyboard(false)} className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-[var(--color-border)] premium-shadow active-scale transition-colors text-[var(--color-text-primary)]">
                  <ChevronDown size={16} className="rotate-90" />
                  <span className="text-[11px] font-bold">Back</span>
               </button>
           </div>
        )}
        <div className="glass-panel p-4 rounded-[28px] relative overflow-visible z-10 transition-all duration-300 hover:premium-shadow">
           
           <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 bg-[var(--color-brand)]/10 rounded-full flex items-center justify-center text-[var(--color-brand)] shadow-inner">
                  <ArrowRightLeft size={16} strokeWidth={2.5} />
              </div>
              <h2 className="text-lg font-extrabold text-[var(--color-text-primary)] tracking-tight">Swap to Taka</h2>
           </div>
           {!showKeyboard && (
              <>
                 <p className="text-[var(--color-text-secondary)] text-[11px] mb-5 font-medium tracking-wide">
                               Instantly convert Crypto to TK. Securely via Tonkeeper.
                            </p>
                            
                            <div className="flex items-center justify-center mb-5">
                               {!userTonAddress ? (
                                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50/80 border border-red-100/50 rounded-full">
                                     <div className="w-1.5 h-1.5 bg-[var(--color-danger)] rounded-full animate-pulse" />
                                     <span className="text-[9px] font-bold text-[var(--color-danger)] tracking-[0.1em] uppercase">Wallet Disconnected</span>
                                  </div>
                               ) : (
                                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--color-brand)]/5 border border-[var(--color-brand)]/10 rounded-full">
                                     <div className="w-1.5 h-1.5 bg-[var(--color-brand)] rounded-full" />
                                     <span className="text-[9px] font-bold text-[var(--color-brand)] tracking-[0.1em] uppercase">Wallet Connected</span>
                                  </div>
                               )}
                            </div>
              </>
           )}

           <div className="space-y-1.5 relative z-10">
              <div onClick={() => { setInputType('crypto'); setShowKeyboard(true); }} className={\`p-3.5 rounded-[22px] cursor-pointer transition-all duration-300 \${showKeyboard && inputType === 'crypto' ? 'glass-button ring-1 ring-[var(--color-brand)]/50' : 'glass-input-container input-shadow'}\`}>
               <div className="flex justify-between items-center mb-3">
                  <label className={\`text-[10px] font-bold uppercase tracking-[0.15em] \${inputType === 'crypto' ? 'text-[var(--color-brand)]' : 'text-[var(--color-text-secondary)]'}\`}>You Pay</label>
                  
                  <div className="relative">
                     <div onClick={(e) => { e.stopPropagation(); setShowAssetModal(!showAssetModal); }} className="flex items-center gap-2 bg-white border border-[var(--color-border)] rounded-full px-2.5 py-1.5 cursor-pointer hover:border-[var(--color-brand)]/50 transition-colors shadow-sm active-scale z-10">
                        <AssetIcon />
                        <span className="text-[11px] font-extrabold text-[var(--color-text-primary)]">{asset}</span>
                        <ChevronDown size={14} className="text-[var(--color-text-secondary)] ml-0.5" />
                     </div>
                     
                     {showAssetModal && (
                        <>
                           <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setShowAssetModal(false); }}></div>
                           {asset !== 'USDT' && (
                              <button onClick={(e) => { e.stopPropagation(); setAsset('USDT'); setShowAssetModal(false); }} className="absolute left-0 right-0 top-full mt-2 w-full flex items-center justify-center gap-2 bg-white border border-[var(--color-border)] rounded-full px-2.5 py-1.5 hover:border-[var(--color-brand)]/50 transition-colors shadow-sm active-scale z-50 animate-in fade-in zoom-in-95 duration-200">
                                 <CircleDollarSign size={14} className="text-emerald-500" />
                                 <span className="text-[11px] font-extrabold text-[var(--color-text-primary)]">USDT</span>
                              </button>
                           )}
                           {asset !== 'GRAM' && (
                              <button onClick={(e) => { e.stopPropagation(); setAsset('GRAM'); setShowAssetModal(false); }} className="absolute left-0 right-0 top-full mt-2 w-full flex items-center justify-center gap-2 bg-white border border-[var(--color-border)] rounded-full px-2.5 py-1.5 hover:border-[var(--color-brand)]/50 transition-colors shadow-sm active-scale z-50 animate-in fade-in zoom-in-95 duration-200">
                                 <Gem size={14} className="text-blue-500" />
                                 <span className="text-[11px] font-extrabold text-[var(--color-text-primary)]">GRAM</span>
                              </button>
                           )}
                        </>
                     )}
                  </div>
               </div>
                 
               <div className="flex items-baseline">
                  <div className={\`text-4xl font-black tracking-tight \${cryptoAmount ? 'text-[var(--color-text-primary)]' : 'text-gray-300'}\`}>
                     {cryptoAmount || '0'}
                  </div>
                  {inputType === 'crypto' && showKeyboard && (
                      <span className="w-0.5 h-8 bg-[var(--color-brand)] animate-pulse ml-1 rounded-full"></span>
                  )}
               </div>
               
               <div className="mt-2 text-[10px] font-bold text-[var(--color-text-secondary)]/70 uppercase tracking-widest">
                  Enter {asset} amount
               </div>
              </div>

              {/* Swap Icon */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                  <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md border border-[var(--color-border)]/50">
                      <ArrowDownUp size={16} className="text-[var(--color-text-secondary)]" />
                  </div>
              </div>

              {/* Fiat Receive Block */}
              <div onClick={() => { setInputType('fiat'); setShowKeyboard(true); }} className={\`p-3.5 rounded-[22px] cursor-pointer transition-all duration-300 \${showKeyboard && inputType === 'fiat' ? 'glass-button ring-1 ring-[var(--color-brand)]/50' : 'glass-input-container input-shadow'}\`}>
               <div className="flex justify-between items-center mb-3">
                  <label className={\`text-[10px] font-bold uppercase tracking-[0.15em] \${inputType === 'fiat' ? 'text-[var(--color-brand)]' : 'text-[var(--color-text-secondary)]'}\`}>You Receive</label>
                  
                  <div className="flex items-center gap-1.5 bg-emerald-50/50 border border-emerald-100/50 rounded-full px-2.5 py-1">
                      <span className="text-[9px] font-black text-emerald-600 tracking-widest">TK BDT</span>
                  </div>
               </div>
                 
               <div className="flex items-baseline">
                  <div className={\`text-4xl font-black tracking-tight \${fiatAmount ? 'text-[var(--color-text-primary)]' : 'text-gray-300'}\`}>
                     {fiatAmount || '0'}
                  </div>
                  {inputType === 'fiat' && showKeyboard && (
                      <span className="w-0.5 h-8 bg-[var(--color-brand)] animate-pulse ml-1 rounded-full"></span>
                  )}
               </div>
               <div className="mt-2 text-[10px] font-bold text-[var(--color-text-secondary)]/70 uppercase tracking-widest">
                  Enter Taka amount
               </div>
              </div>
           </div>

           {!showKeyboard && (
              <div className="mt-6 mb-2">
                 <button onPointerDown={handleSell} disabled={loading || !cryptoAmount || parseFloat(cryptoAmount) <= 0 || !userTonAddress} className={\`w-full py-4 rounded-2xl font-extrabold text-sm tracking-[0.1em] transition-all duration-300 \${!userTonAddress ? 'bg-gray-100 text-gray-400' : loading ? 'bg-[var(--color-brand)]/70 text-white' : 'bg-[var(--color-brand)] text-white premium-shadow active-scale'}\`}>
                    {loading ? (
                        <div className="flex items-center justify-center gap-2">
                            <Loader2 size={18} className="animate-spin" />
                            <span>PROCESSING...</span>
                        </div>
                    ) : !userTonAddress ? (
                        "CONNECT WALLET FIRST"
                    ) : (
                        "CONFIRM SWAP"
                    )}
                 </button>
              </div>
           )}
        </div>

        {/* Custom Numpad Keyboard */}
        <div className={\`fixed bottom-0 left-0 w-full bg-[#f2f4f7] rounded-t-[32px] p-5 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] z-[60] transition-transform duration-300 ease-out \${showKeyboard ? 'translate-y-0' : 'translate-y-full pointer-events-none'}\`}>
          <div className="flex justify-between items-center mb-4 px-2">
             <span className="text-[10px] font-extrabold text-[#98A2B3] tracking-[0.2em] uppercase">ENTER AMOUNT</span>
             <button onClick={() => setShowKeyboard(false)} className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm text-[#475467] active:scale-90 transition-transform">
                <ChevronDown size={18} />
             </button>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
             {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(key => (
                <button key={key} onClick={() => handleKeyPress(key)} className="h-14 bg-white rounded-2xl text-2xl font-semibold text-[#101828] active:bg-[#E4E7EC] active:scale-95 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
                   {key}
                </button>
             ))}
             <button onClick={() => handleKeyPress('.')} className={\`h-14 bg-white rounded-2xl text-2xl font-bold text-[#101828] active:bg-[#E4E7EC] active:scale-95 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] \${inputType === 'fiat' ? 'opacity-50 cursor-not-allowed' : ''}\`}>
                .
             </button>
             <button onClick={() => handleKeyPress('0')} className="h-14 bg-white rounded-2xl text-2xl font-semibold text-[#101828] active:bg-[#E4E7EC] active:scale-95 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
                0
             </button>
             <button onClick={() => handleKeyPress('del')} className="h-14 bg-white rounded-2xl flex justify-center items-center text-[#475467] active:bg-[#E4E7EC] active:scale-95 transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
                <Delete size={24} />
             </button>
          </div>

          <button onPointerDown={handleSell} disabled={loading || !cryptoAmount || parseFloat(cryptoAmount) <= 0} className="w-full mt-4 h-14 bg-[#101828] disabled:bg-[#101828]/50 text-white rounded-2xl font-extrabold tracking-wide text-sm active:scale-95 transition-all shadow-lg shadow-[#101828]/20 flex items-center justify-center gap-2">
             {loading ? <Loader2 size={18} className="animate-spin" /> : 'CONFIRM SWAP'}
          </button>
        </div>

        <TransactionStatusModal status={txStatus} message={txMessage} />
      </div>
    </>
  );
}
`;
    content = content.substring(0, startIdx) + newComponent + content.substring(endIdx);
}
fs.writeFileSync('miniapp/src/App.jsx', content);

// UPDATE miniapp/src/api.js TOO
let apiCode = fs.readFileSync('miniapp/src/api.js', 'utf8');
apiCode = apiCode.replace(
    /export const submitBuyOrder = async \(payload\) => \{[\s\S]*?throw e;\s*\}/m,
    `export const submitBuyOrder = async (payload) => {
    try {
        const res = await axios.post(\`\${API_URL}/api/miniapp/buy\`, payload);
        return res.data;
    } catch (e) {
        throw new Error(e.response?.data?.error || e.message || 'Unknown error');
    }
}`
);
fs.writeFileSync('miniapp/src/api.js', apiCode);

console.log("SUCCESS");
