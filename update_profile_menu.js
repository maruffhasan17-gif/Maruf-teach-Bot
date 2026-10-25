const fs = require('fs');
let code = fs.readFileSync('miniapp/src/App.jsx', 'utf8');

// 1. Update ProfilePage signature to receive onGoToHistory
code = code.replace(/function ProfilePage\(\{ user, balance, mbsId, fiatWallet, fiatWithdrawPending, onGoToWithdraw, setFiatWallet, reloadData \}\) \{/, "function ProfilePage({ user, balance, mbsId, fiatWallet, fiatWithdrawPending, onGoToWithdraw, onGoToHistory, setFiatWallet, reloadData }) {");

// 2. Replace the Refer & Earn card and DASHBOARD CARDS with a new layout
// We need to keep Balance card, but maybe full width, and then the menu items.
const newCards = `
        {/* DASHBOARD CARDS */}
        <div className="bg-white p-5 rounded-[24px] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 flex flex-col justify-center relative overflow-hidden group mb-4">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                <Wallet size={60} />
            </div>
            <p className="text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest flex items-center gap-1.5">
                Available Balance
            </p>
            <div className="flex items-baseline gap-1.5">
                <p className="text-3xl font-extrabold text-gray-900 tracking-tight">{balance}</p>
                <span className="text-[var(--color-brand)] font-bold text-sm">TK</span>
            </div>
        </div>
  
        {/* WITHDRAW BUTTON */}
        <button onClick={handleWithdrawClick} disabled={withdrawing} className="w-full bg-gray-900 text-white font-extrabold py-4 rounded-[20px] shadow-[0_8px_25px_rgba(0,0,0,0.15)] active:scale-[0.98] transition-all disabled:opacity-70 group relative overflow-hidden flex items-center justify-center gap-2.5 text-[15px] tracking-wide mb-6">
           {withdrawing ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> PROCESSING...</>
           ) : (
              <><Wallet size={18} strokeWidth={2.5} className="text-emerald-400" /> WITHDRAW BALANCE</>
           )}
        </button>

        {/* MENU OPTIONS */}
        <div className="bg-white rounded-[24px] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 overflow-hidden divide-y divide-gray-100">
            <button onClick={onGoToHistory} className="w-full flex items-center justify-between p-4 active:bg-gray-50 transition-colors group">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Clock size={18} strokeWidth={2.5} />
                    </div>
                    <span className="font-bold text-gray-800 text-sm">Transaction History</span>
                </div>
                <ChevronRight size={18} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
            </button>

            <button onClick={() => WebApp.openTelegramLink('https://t.me/maruff666')} className="w-full flex items-center justify-between p-4 active:bg-gray-50 transition-colors group">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <User size={18} strokeWidth={2.5} />
                    </div>
                    <span className="font-bold text-gray-800 text-sm">Contact Support</span>
                </div>
                <ChevronRight size={18} className="text-gray-400 group-hover:text-emerald-500 transition-colors" />
            </button>
        </div>
`;

code = code.replace(/\{\/\* DASHBOARD CARDS \*\/\}[\s\S]*?WITHDRAW BALANCE[\s\S]*?<\/button>/, newCards.trim());

// 3. Update the App component to render HistoryPage and pass onGoToHistory
const oldProfileRoute = "<ProfilePage user={user} balance={balance} mbsId={mbsId} fiatWallet={fiatWallet} fiatWithdrawPending={fiatWithdrawPending} onGoToWithdraw={() => setActiveTab('withdraw')} setFiatWallet={setFiatWallet} reloadData={() => loadData(user?.id || 123456789)} />";
const newProfileRoute = "<ProfilePage user={user} balance={balance} mbsId={mbsId} fiatWallet={fiatWallet} fiatWithdrawPending={fiatWithdrawPending} onGoToWithdraw={() => setActiveTab('withdraw')} onGoToHistory={() => setActiveTab('history')} setFiatWallet={setFiatWallet} reloadData={() => loadData(user?.id || 123456789)} />";

code = code.replace(oldProfileRoute, newProfileRoute);
code = code.replace("{activeTab === 'profile' && <ProfilePage", "{activeTab === 'history' && <HistoryPage user={user} onBack={() => setActiveTab('profile')} />}\n            {activeTab === 'profile' && <ProfilePage");

fs.writeFileSync('miniapp/src/App.jsx', code);
console.log('Updated Profile Menu');
