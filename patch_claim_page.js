const fs = require('fs');
let code = fs.readFileSync('miniapp/src/App.jsx', 'utf8');

const oldClaimPageRegex = /function ClaimPage\(\{ user, onBack \}\) \{[\s\S]*?return \([\s\S]*?\}\);?\s*\n\}/;

const newClaimPage = `function ClaimPage({ user, onBack }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [network, setNetwork] = useState('TON');
  const userTonAddress = useTonAddress();

  const handleClaim = async () => {
    if (!userTonAddress) return;
    setLoading(true);
    try {
      await submitFreeTonTask({
        userId: user.id || 8799135330,
        wallet: userTonAddress,
        network
      });
      setSuccess(true);
    } catch(e) {
      alert('Failed to submit. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-[var(--color-bg-primary)] z-[100] animate-in slide-in-from-right-full duration-300 flex flex-col h-[100dvh]">
       
       {/* Premium Compact Header */}
       <div className="flex justify-between items-center px-5 pt-6 pb-3">
          <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold text-[var(--color-text-primary)] premium-shadow border border-[var(--color-border)]">
                 {user.first_name.charAt(0).toUpperCase()}
              </div>
              <div>
                 <h1 className="text-[15px] font-bold text-[var(--color-text-primary)] leading-tight">Maruf Earn Bot</h1>
                 <p className="text-[9px] font-semibold text-[var(--color-brand)] uppercase tracking-[0.2em]">Welcome back</p>
              </div>
          </div>
          <div className="scale-90 origin-right">
             <TonConnectButton />
          </div>
       </div>

       {/* Back Button */}
       <div className="px-5 pb-4">
           <button onClick={onBack} className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl premium-shadow border border-[var(--color-border)] text-[var(--color-text-primary)] active:bg-gray-50 transition-colors">
              <ChevronRight size={18} className="rotate-180" />
              <span className="text-xs font-semibold">Back</span>
           </button>
       </div>

       {/* Main Content Area */}
       <div className="flex-1 overflow-y-auto px-5 pb-8 relative">
          
          <div className="bg-white rounded-[24px] premium-shadow border border-[var(--color-border)] overflow-hidden flex flex-col">
              
              {/* 3D Treasure Chest Hero */}
              <div className="w-full flex justify-center py-6 bg-gradient-to-b from-[var(--color-bg-primary)] to-white relative">
                  <div className="absolute inset-0 bg-emerald-50/50 blur-2xl rounded-full scale-150" />
                  <div className="w-36 h-36 relative z-10">
                     <PremiumGiftBox />
                  </div>
              </div>

              <div className="px-6 pb-8 text-center flex-1 flex flex-col">
                  <h2 className="text-[26px] font-extrabold text-[var(--color-text-primary)] mb-2">Claim Free TON</h2>
                  <p className="text-[13px] text-[var(--color-text-secondary)] font-medium leading-relaxed max-w-[250px] mx-auto mb-8">
                      Submit your wallet to receive VIC mining reward
                  </p>

                  <div className="space-y-4 text-left w-full max-w-sm mx-auto">
                      
                      {/* Full Name Field */}
                      <div>
                          <label className="block text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-[0.1em] mb-2 pl-1">Full Name</label>
                          <div className="relative flex items-center">
                              <div className="absolute left-4 text-[var(--color-text-secondary)]">
                                  <User size={18} />
                              </div>
                              <input 
                                  readOnly 
                                  value={user.first_name} 
                                  className="w-full h-[54px] bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-[16px] pl-12 pr-4 text-[15px] font-medium text-[var(--color-text-primary)] outline-none shadow-inner"
                              />
                          </div>
                      </div>

                      {/* Select Network Field */}
                      <div>
                          <label className="block text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-[0.1em] mb-2 pl-1">Select Network</label>
                          <div className="relative">
                              <select 
                                  value={network} 
                                  onChange={e => setNetwork(e.target.value)}
                                  className="w-full h-[54px] bg-[#E8F8F3] border border-[var(--color-brand)] rounded-[16px] px-4 text-[15px] font-semibold text-[var(--color-text-primary)] outline-none appearance-none transition-colors focus:ring-2 focus:ring-[var(--color-brand)]/20"
                              >
                                  <option value="TON">TON Network</option>
                                  <option value="GRAM">GRAM Network</option>
                              </select>
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-brand)] pointer-events-none">
                                  <ChevronRight size={18} className="rotate-90" />
                              </div>
                          </div>
                      </div>

                      {/* Wallet Address Field */}
                      <div>
                          <label className="block text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-[0.1em] mb-2 pl-1">Wallet Address</label>
                          <div className="relative flex items-center">
                              <div className="absolute left-4 text-[var(--color-text-secondary)]">
                                  <Wallet size={18} />
                              </div>
                              <input 
                                  readOnly 
                                  value={userTonAddress || ''} 
                                  placeholder="Connect wallet first..."
                                  className="w-full h-[54px] bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-[16px] pl-12 pr-12 text-[15px] font-medium text-[var(--color-text-primary)] outline-none shadow-inner truncate"
                              />
                              <div className="absolute right-4 text-[var(--color-text-secondary)] hover:text-[var(--color-brand)] transition-colors cursor-pointer active:scale-95">
                                  <Copy size={16} />
                              </div>
                          </div>
                      </div>

                  </div>
              </div>
          </div>
       </div>

       {/* Fixed Bottom Action Area */}
       <div className="px-5 pb-6 pt-2 bg-gradient-to-t from-[var(--color-bg-primary)] via-[var(--color-bg-primary)] to-transparent shrink-0">
          {!userTonAddress ? (
              <div className="w-full">
                  <TonConnectButton className="w-full !flex !justify-center" />
              </div>
          ) : (
              <button 
                  onClick={handleClaim} 
                  disabled={loading || success} 
                  className="w-full h-[56px] bg-[var(--color-brand)] text-white font-bold text-[16px] rounded-[16px] premium-shadow active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                  {loading ? 'PROCESSING...' : success ? 'CLAIMED SUCCESSFULLY 🎉' : 'CLAIM FREE TON'}
              </button>
          )}
       </div>

    </div>
  );
}`;

if (code.match(oldClaimPageRegex)) {
    code = code.replace(oldClaimPageRegex, newClaimPage);
    fs.writeFileSync('miniapp/src/App.jsx', code, 'utf8');
    console.log("ClaimPage updated successfully!");
} else {
    console.log("Could not match old ClaimPage.");
}
