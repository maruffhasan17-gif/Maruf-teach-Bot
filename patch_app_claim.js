const fs = require('fs');
let code = fs.readFileSync('miniapp/src/App.jsx', 'utf8');

// First, make ClaimModal a full page and accessible via activeTab
code = code.replace(
  "{activeTab === 'profile' && <ProfilePage user={user} balance={balance} />}",
  "{activeTab === 'profile' && <ProfilePage user={user} balance={balance} />}\n          {activeTab === 'claim' && <ClaimPage user={user} onBack={() => setActiveTab('home')} />}"
);

// We need to change setModalOpen to setActiveTab('claim') in HomePage
code = code.replace(
  "function HomePage({ balance, user }) {",
  "function HomePage({ balance, user, onGoToClaim }) {"
);
code = code.replace(
  "onClick={() => setModalOpen(true)}",
  "onClick={onGoToClaim}"
);
code = code.replace(
  "{activeTab === 'home' && <HomePage balance={balance} user={user} />}",
  "{activeTab === 'home' && <HomePage balance={balance} user={user} onGoToClaim={() => setActiveTab('claim')} />}"
);

// Remove ClaimModal from HomePage return
code = code.replace("{modalOpen && <ClaimModal user={user} onClose={() => setModalOpen(false)} />}", "");
code = code.replace("const [modalOpen, setModalOpen] = useState(false);", "");

// Now replace ClaimModal with ClaimPage
const newClaimPage = `
function ClaimPage({ user, onBack }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [address, setAddress] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if(!address) return;
    setLoading(true);
    try {
      await submitFreeTonTask({
        userId: user.id,
        name: user.first_name,
        username: user.username,
        address: address
      });
      setSubmitted(true);
      setTimeout(() => onBack(), 2500);
    } catch(e) {
      setError('Submission failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in slide-in-from-right-4 duration-500 pb-10">
      {/* Top Header Back Button */}
      <button onClick={onBack} className="flex items-center gap-1 text-gray-500 hover:text-gray-800 mb-6 font-bold text-sm bg-white px-4 py-2 rounded-full shadow-sm w-max">
        <ChevronRight className="rotate-180" size={18} /> Back
      </button>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Massive Erupting Animation Header */}
        <div className="h-56 bg-gradient-to-b from-blue-50 to-white relative flex items-center justify-center overflow-hidden border-b border-gray-100">
           {/* Coins Fountain */}
           <div className="relative z-10">
               {/* Base of the box */}
               <div className="text-7xl absolute top-0 left-[-35px] z-20 mt-4">📦</div>
               
               {/* The Coins Flying Out */}
               <div className="text-4xl coin-erupt" style={{ '--tx': '-60px', '--ty': '-80px', animationDelay: '0.1s' }}>💎</div>
               <div className="text-4xl coin-erupt" style={{ '--tx': '0px', '--ty': '-100px', animationDelay: '0.2s' }}>💎</div>
               <div className="text-4xl coin-erupt" style={{ '--tx': '60px', '--ty': '-70px', animationDelay: '0.3s' }}>💎</div>
               <div className="text-3xl coin-erupt" style={{ '--tx': '-30px', '--ty': '-110px', animationDelay: '0.4s' }}>✨</div>
               <div className="text-3xl coin-erupt" style={{ '--tx': '40px', '--ty': '-90px', animationDelay: '0.5s' }}>✨</div>
           </div>
        </div>

        <div className="p-6">
          {submitted ? (
             <div className="text-center py-6">
               <div className="w-20 h-20 mx-auto mb-4 bg-green-50 rounded-full flex items-center justify-center">
                  <span className="text-5xl animate-bounce">✅</span>
               </div>
               <h3 className="text-2xl font-black text-theme-primary">Submitted!</h3>
               <p className="text-sm text-gray-500 mt-2 font-medium">Waiting for admin approval...</p>
             </div>
          ) : (
             <>
              <div className="text-center mb-6">
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">Claim Free TON</h3>
                  <p className="text-xs text-gray-500 font-medium mt-1">Submit your wallet to receive VIC mining reward</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Full Name</label>
                  <input readOnly value={user.first_name} className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl text-gray-500 outline-none text-sm font-bold shadow-inner" />
                </div>
                
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Select Network</label>
                  <div className="bg-theme-primary/10 border border-theme-primary/20 p-4 rounded-xl text-center">
                      <span className="text-theme-primary font-black text-sm tracking-widest">TON / GRAM</span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Your Wallet Address</label>
                  <input value={address} onChange={e=>setAddress(e.target.value)} placeholder="UQ..." className="w-full bg-white border-2 border-gray-200 p-4 rounded-xl text-gray-900 outline-none focus:border-theme-primary transition-colors text-sm font-mono font-bold shadow-sm" />
                </div>
                
                {error && <p className="text-red-500 text-xs text-center font-bold">{error}</p>}
                
                <button onClick={handleSubmit} disabled={loading} className="w-full bg-theme-primary text-white font-extrabold p-4 clip-btn mt-6 hover:bg-emerald-400 active:scale-95 transition-all disabled:opacity-50 text-[16px] shadow-[0_10px_25px_rgba(16,185,129,0.3)]">
                  {loading ? 'SUBMITTING...' : 'SUBMIT FOR REVIEW'}
                </button>
              </div>
             </>
          )}
        </div>
      </div>
    </div>
  );
}
`;

// Remove the old ClaimModal
code = code.replace(/function ClaimModal\(\{ user, onClose \}\) \{[\s\S]*?(?=function SellPage)/m, newClaimPage + '\n\n');

fs.writeFileSync('miniapp/src/App.jsx', code, 'utf8');
console.log("Patched full page claim with fountain animation!");
