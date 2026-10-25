const fs = require('fs');
let code = fs.readFileSync('miniapp/src/App.jsx', 'utf8');

const newProfilePage = `
function ProfilePage({ user, balance, mbsId, fiatWallet, fiatWithdrawPending, onGoToWithdraw, onGoToHistory, setFiatWallet, reloadData }) {
    const [withdrawing, setWithdrawing] = useState(false);
  
    const [showWalletModal, setShowWalletModal] = useState(false);
    const [walletMethod, setWalletMethod] = useState('bKash');
    const [showMethodDropdown, setShowMethodDropdown] = useState(false);
    const [walletNumber, setWalletNumber] = useState('');
    const [walletName, setWalletName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    
    // Sound preference state
    const [soundEnabled, setSoundEnabled] = useState(() => {
        const saved = localStorage.getItem('app_sound_enabled');
        return saved !== null ? JSON.parse(saved) : true;
    });

    const toggleSound = () => {
        const newState = !soundEnabled;
        setSoundEnabled(newState);
        localStorage.setItem('app_sound_enabled', JSON.stringify(newState));
        if (newState) {
            WebApp.HapticFeedback.impactOccurred('light');
            WebApp.showAlert('Sound enabled');
        } else {
            WebApp.HapticFeedback.impactOccurred('light');
            WebApp.showAlert('Sound muted');
        }
    };
    
    const handleWithdrawClick = () => {
        if (fiatWallet) {
            onGoToWithdraw();
        } else {
            setShowWalletModal(true);
        }
    };
  
    const handleSaveWallet = async () => {
        if (!walletNumber || !walletName) return;
        setIsSaving(true);
        try {
            await saveFiatWallet({
                userId: WebApp.initDataUnsafe?.user?.id || 123456789,
                method: walletMethod,
                number: walletNumber,
                name: walletName
            });
            setFiatWallet({ method: walletMethod, number: walletNumber, name: walletName });
            setShowWalletModal(false);
            onGoToWithdraw();
        } catch (e) {
            WebApp.showAlert(e.message || 'Failed to save wallet');
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleCopyId = () => {
        if (!mbsId) return;
        navigator.clipboard.writeText(mbsId);
        WebApp.HapticFeedback.impactOccurred('medium');
        WebApp.showAlert('Member ID copied');
    };

    const displayName = user?.first_name ? \`\${user.first_name} \${user.last_name || ''}\`.trim() : 'Guest Account';
    const displayUsername = user?.username ? \`@\${user.username}\` : '@user';
    const initial = user?.first_name ? user.first_name.charAt(0).toUpperCase() : 'G';
  
    return (
      <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-400 max-w-md mx-auto font-sans pb-32 px-1">
        
        {/* PREMIUM PROFILE HEADER */}
        <div className="bg-gradient-to-b from-white to-gray-50/50 p-6 rounded-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 relative overflow-hidden group">
           
           {/* Top Actions */}
           <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
                <button onClick={toggleSound} className="w-10 h-10 bg-white/80 backdrop-blur-md rounded-full shadow-sm border border-gray-100 flex items-center justify-center text-gray-500 hover:text-[var(--color-brand)] active:scale-95 transition-all">
                    {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                </button>
                <button className="w-10 h-10 bg-white/80 backdrop-blur-md rounded-full shadow-sm border border-gray-100 flex items-center justify-center text-gray-500 hover:text-[var(--color-brand)] active:scale-95 transition-all">
                    <Settings size={18} />
                </button>
           </div>

           {/* Subtle glow background */}
           <div className="absolute left-1/2 -translate-x-1/2 top-0 w-48 h-48 bg-[var(--color-brand)]/5 rounded-full blur-3xl pointer-events-none transition-opacity duration-700" />
           
           <div className="flex flex-col items-center relative z-10 text-center mt-2">
               {/* Avatar */}
               <div className="relative mb-4">
                   <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-br from-[var(--color-brand)]/20 to-[var(--color-brand)]/5 shadow-inner">
                       {user?.photo_url ? (
                           <img src={user.photo_url} alt="Profile" className="w-full h-full rounded-full object-cover border-2 border-white shadow-sm" />
                       ) : (
                           <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-[var(--color-brand)] font-extrabold text-4xl shadow-sm border-2 border-white">
                              {initial}
                           </div>
                       )}
                   </div>
                   <div className="absolute bottom-1 right-1 w-6 h-6 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center shadow-sm">
                        <Check size={12} strokeWidth={4} className="text-white" />
                   </div>
               </div>

               {/* Name & Username */}
               <h2 className="text-[22px] font-extrabold text-gray-900 tracking-tight flex items-center gap-1.5">
                   {displayName}
               </h2>
               <div className="flex items-center justify-center gap-1.5 mt-0.5 mb-5">
                   <span className="text-gray-500 font-medium text-sm tracking-wide">{displayUsername}</span>
                   <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                       <Check size={10} strokeWidth={3} /> VERIFIED
                   </span>
               </div>
               
               {/* Member ID */}
               <div className="w-full pt-4 border-t border-gray-100/80">
                   <p className="text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Member ID</p>
                   <button onClick={handleCopyId} className="group/btn flex items-center justify-center mx-auto gap-3 bg-gray-50 hover:bg-emerald-50/50 active:bg-emerald-50 border border-gray-200 hover:border-emerald-200 px-5 py-2.5 rounded-xl transition-all w-fit">
                       <span className="font-mono text-[17px] font-bold tracking-widest text-gray-800 group-hover/btn:text-emerald-700 transition-colors">
                           {mbsId || 'MBS-----'}
                       </span>
                       <div className="w-7 h-7 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-center text-gray-400 group-hover/btn:text-emerald-600 group-hover/btn:border-emerald-200 transition-all">
                           <Copy size={13} strokeWidth={2.5} />
                       </div>
                   </button>
               </div>
           </div>
        </div>
  
        {/* DASHBOARD CARDS */}
        <div className="bg-white p-6 rounded-[24px] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 flex flex-col justify-center relative overflow-hidden group mb-4">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                <Wallet size={80} />
            </div>
            <p className="text-[11px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest flex items-center gap-1.5">
                Available Balance
            </p>
            <div className="flex items-baseline gap-1.5">
                <p className="text-4xl font-extrabold text-gray-900 tracking-tight">{balance}</p>
                <span className="text-[var(--color-brand)] font-bold text-lg">TK</span>
            </div>
        </div>
  
        {/* WITHDRAW BUTTON */}
        <button onClick={handleWithdrawClick} disabled={withdrawing} className="w-full bg-gray-900 text-white font-extrabold py-4.5 rounded-[20px] shadow-[0_8px_25px_rgba(0,0,0,0.15)] active:scale-[0.98] transition-all disabled:opacity-70 group relative overflow-hidden flex items-center justify-center gap-2.5 text-[15px] tracking-wide mb-6">
           {withdrawing ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> PROCESSING...</>
           ) : (
              <><Wallet size={18} strokeWidth={2.5} className="text-emerald-400" /> WITHDRAW BALANCE</>
           )}
        </button>

        {/* MENU OPTIONS */}
        <div className="bg-white rounded-[24px] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 overflow-hidden divide-y divide-gray-100">
            <button onClick={onGoToHistory} className="w-full flex items-center justify-between p-4.5 active:bg-gray-50 transition-colors group">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Clock size={20} strokeWidth={2.5} />
                    </div>
                    <span className="font-extrabold text-gray-800 text-[15px]">Transaction History</span>
                </div>
                <ChevronRight size={18} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
            </button>

            <button onClick={() => WebApp.openTelegramLink('https://t.me/maruff666')} className="w-full flex items-center justify-between p-4.5 active:bg-gray-50 transition-colors group">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <User size={20} strokeWidth={2.5} />
                    </div>
                    <span className="font-extrabold text-gray-800 text-[15px]">Contact Support</span>
                </div>
                <ChevronRight size={18} className="text-gray-400 group-hover:text-emerald-500 transition-colors" />
            </button>
        </div>
  
        {/* Wallet Setup Modal */}
        {showWalletModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="bg-white rounded-[28px] p-6 w-full max-w-[320px] shadow-2xl border border-gray-100 animate-in zoom-in-95 slide-in-from-bottom-4">
                    <div className="flex justify-between items-center mb-5">
                        <h3 className="text-xl font-extrabold text-gray-900">Wallet Setup</h3>
                        <button onClick={() => setShowWalletModal(false)} className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-colors">
                            <X size={16} strokeWidth={3} />
                        </button>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Select Method</label>
                            <div className="relative">
                                <div onClick={() => setShowMethodDropdown(!showMethodDropdown)} className="w-full h-[52px] bg-gray-50 border border-gray-200 rounded-[16px] px-4 flex items-center justify-between cursor-pointer hover:border-[var(--color-brand)]/50 transition-all">
                                    <div className="flex items-center gap-3">
                                        <img src={walletMethod === 'bKash' ? 'https://mohammadalinijhoom.com/wp-content/uploads/2024/07/bKash-Logo.png' : 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRPpmAeJ7t7z55yJVOQLeKQazhA8FjJvfKDSrobAhxljA&s=10'} alt={walletMethod} className="w-6 h-6 rounded-full object-cover border border-gray-200" />
                                        <span className="font-bold text-gray-800">{walletMethod}</span>
                                    </div>
                                    <ChevronRight size={16} className={\`text-gray-400 transition-transform \${showMethodDropdown ? '-rotate-90' : 'rotate-90'}\`} />
                                </div>
                                
                                {showMethodDropdown && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setShowMethodDropdown(false)}></div>
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-[14px] shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                                            {['bKash', 'Nagad'].filter(method => method !== walletMethod).map(method => (
                                                <button key={method} onClick={() => { setWalletMethod(method); setShowMethodDropdown(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors">
                                                    <img src={method === 'bKash' ? 'https://mohammadalinijhoom.com/wp-content/uploads/2024/07/bKash-Logo.png' : 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRPpmAeJ7t7z55yJVOQLeKQazhA8FjJvfKDSrobAhxljA&s=10'} alt={method} className="w-6 h-6 rounded-full object-cover border border-gray-100" />
                                                    <span className="font-bold text-[14px] text-gray-800">{method}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Wallet Number</label>
                            <input type="tel" placeholder="e.g. 017XXXXXXXX" value={walletNumber} onChange={(e) => setWalletNumber(e.target.value)} className="w-full h-[52px] bg-gray-50 border border-gray-200 rounded-[16px] px-4 font-bold text-gray-800 outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/20 transition-all placeholder:text-gray-300 placeholder:font-medium" />
                        </div>
  
                        <div>
                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Account Name</label>
                            <input type="text" placeholder="Enter Full Name" value={walletName} onChange={(e) => setWalletName(e.target.value)} className="w-full h-[52px] bg-gray-50 border border-gray-200 rounded-[16px] px-4 font-bold text-gray-800 outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/20 transition-all placeholder:text-gray-300 placeholder:font-medium" />
                        </div>
                    </div>
  
                    <button onClick={handleSaveWallet} disabled={!walletNumber || !walletName || isSaving} className="w-full h-[52px] mt-6 bg-gray-900 hover:bg-black text-white rounded-[16px] font-extrabold text-[14px] tracking-wide flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50">
                        {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
                        SAVE WALLET
                    </button>
                </div>
            </div>
        )}
      </div>
    );
}
`;

// Now we need to be extremely careful.
// Let's find the start of ProfilePage, and slice up to PremiumSellPage or something similar.
const profileStartIdx = code.indexOf('function ProfilePage(');
const exportStartIdx = code.indexOf('function PremiumSellPage');

if (profileStartIdx !== -1 && exportStartIdx !== -1) {
    const beforeProfile = code.slice(0, profileStartIdx);
    const afterProfile = code.slice(exportStartIdx);
    code = beforeProfile + newProfilePage + "\n\n" + afterProfile;
    fs.writeFileSync('miniapp/src/App.jsx', code);
    console.log('Successfully brute-forced ProfilePage replacement');
} else {
    console.log('Could not find markers to replace ProfilePage.');
}
