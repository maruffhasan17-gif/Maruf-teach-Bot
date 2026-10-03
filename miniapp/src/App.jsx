import React, { useState, useEffect } from 'react';
import { Home, User, ChevronRight, Zap, Share2, Copy, X, TrendingUp, DollarSign, Wallet } from 'lucide-react';
import { TonConnectUIProvider, TonConnectButton, useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import WebApp from '@twa-dev/sdk';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchUserData, submitFreeTonTask, submitSellOrder } from './api';

// Live dummy data for the graph
const initialGraphData = [
  { time: '10:00', price: 118.5 },
  { time: '10:05', price: 119.2 },
  { time: '10:10', price: 118.8 },
  { time: '10:15', price: 119.5 },
  { time: '10:20', price: 120.1 },
  { time: '10:25', price: 119.9 },
  { time: 'Now', price: 120.0 },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState({ id: 0, first_name: 'User', username: '' });
  const [balance, setBalance] = useState(0);

  const loadData = async (userId) => {
    const data = await fetchUserData(userId);
    setBalance(data.balance);
  };

  useEffect(() => {
    if (WebApp.initDataUnsafe?.user) {
      setUser(WebApp.initDataUnsafe.user);
      loadData(WebApp.initDataUnsafe.user.id);
    } else {
      loadData(8799135330);
    }
  }, []);

  return (
    <TonConnectUIProvider manifestUrl="https://maruf-teach-bot.onrender.com/tonconnect-manifest.json">
      <div className="min-h-screen bg-theme-bg text-theme-text pb-24 relative overflow-x-hidden font-sans selection:bg-theme-primary/20">
        
        {/* Header Background Accent */}
        <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-b from-theme-primary/10 to-transparent rounded-b-[40px] pointer-events-none" />
        
        <div className="relative z-10 p-4">
          {/* Header */}
          <div className="flex justify-between items-center mb-6 pt-2">
             <div className="flex items-center gap-3">
                 <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center font-extrabold text-theme-primary shadow-sm border border-theme-border">
                    {user.first_name.charAt(0).toUpperCase()}
                 </div>
                 <div>
                    <h1 className="text-lg font-black text-gray-900 leading-tight tracking-tight">Maruf Earn Bot</h1>
                    <p className="text-[10px] font-bold text-theme-primary uppercase tracking-wider">Welcome back</p>
                 </div>
             </div>
             <TonConnectButton />
          </div>

          {activeTab === 'home' && <HomePage balance={balance} user={user} onGoToClaim={() => setActiveTab('claim')} />}
          {activeTab === 'sell' && <SellPage />}
          {activeTab === 'profile' && <ProfilePage user={user} balance={balance} />}
          {activeTab === 'claim' && <ClaimPage user={user} onBack={() => setActiveTab('home')} />}
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 w-full z-50">
          <div className="glass-nav rounded-t-[30px] flex justify-around items-end px-4 pb-4 pt-3 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
            <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center p-2 w-20 transition-all duration-300 ${activeTab === 'home' ? 'text-theme-primary scale-110' : 'text-gray-400 hover:text-gray-600'}`}>
              <Home size={24} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
              <span className="text-[10px] mt-1 font-bold">HOME</span>
            </button>

            <button onClick={() => setActiveTab('sell')} className={`relative -top-6 flex flex-col items-center justify-center w-[70px] h-[70px] rounded-full bg-theme-primary border-4 border-[#F4F7F5] shadow-[0_8px_20px_rgba(16,185,129,0.4)] text-white transition-transform active:scale-95`}>
              <Zap size={28} fill="currentColor" className={activeTab === 'sell' ? 'animate-pulse' : ''} />
              <span className="text-[10px] mt-0.5 font-black tracking-widest">SELL</span>
            </button>

            <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center p-2 w-20 transition-all duration-300 ${activeTab === 'profile' ? 'text-theme-primary scale-110' : 'text-gray-400 hover:text-gray-600'}`}>
              <User size={24} strokeWidth={activeTab === 'profile' ? 2.5 : 2} />
              <span className="text-[10px] mt-1 font-bold">PROFILE</span>
            </button>
          </div>
        </div>
      </div>
    </TonConnectUIProvider>
  );
}

function HomePage({ balance, user, onGoToClaim }) {
  
  const [graphData, setGraphData] = useState(initialGraphData);

  // Simulate live graph updates
  useEffect(() => {
    const interval = setInterval(() => {
        setGraphData(prev => {
            const newData = [...prev.slice(1)];
            const lastPrice = prev[prev.length - 1].price;
            const change = (Math.random() - 0.5) * 2.5; // Bigger fluctuation for visual effect
            newData.push({ time: 'Live', price: parseFloat((lastPrice + change).toFixed(2)) });
            return newData;
        });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      {/* Balance Card */}
      <div className="bg-theme-card p-6 relative overflow-hidden clip-card shadow-sm border border-gray-100">
        <div className="absolute -right-10 -bottom-10 opacity-[0.03] pointer-events-none">
           <Wallet size={180} />
        </div>
        
        <div className="flex justify-between items-start">
            <div>
                <p className="text-[11px] font-bold tracking-widest text-gray-400 mb-1 uppercase">Total Balance</p>
                <div className="text-5xl font-black text-gray-900 flex items-baseline gap-2 tracking-tight">
                {balance} <span className="text-2xl text-theme-primary">TK</span>
                </div>
            </div>
            {/* Animated CSS Money Icon */}
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-theme-primary animate-bounce shadow-[0_5px_15px_rgba(16,185,129,0.2)]">
               <DollarSign size={24} strokeWidth={3} />
            </div>
        </div>
      </div>

      {/* LIVE GRAPH SECTION */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="flex justify-between items-end mb-4">
              <div>
                  <div className="flex items-center gap-2 mb-1">
                      <TrendingUp size={16} className="text-theme-primary" />
                      <h3 className="text-sm font-bold text-gray-800">USDT/TK Live Chart</h3>
                  </div>
                  <p className="text-2xl font-black text-gray-900 tracking-tight">
                      120.00 <span className="text-sm text-gray-400 font-medium">TK/USDT</span>
                  </p>
              </div>
              <div className="bg-emerald-50 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-theme-primary rounded-full animate-pulse shadow-[0_0_8px_#10B981]" />
                  <span className="text-[10px] font-bold text-theme-primary uppercase tracking-widest">Live</span>
              </div>
          </div>
          
          <div className="h-[120px] w-full -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={graphData}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }} />
                <YAxis domain={['dataMin - 0.5', 'dataMax + 0.5']} hide />
                <Area type="monotone" dataKey="price" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorPrice)" isAnimationActive={true} animationDuration={800} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
      </div>

      {/* Task Banner - ULTRA PREMIUM */}
      <div onClick={onGoToClaim} className="premium-card-bg p-[2px] rounded-2xl cursor-pointer group hover:scale-[1.03] transition-all duration-300 relative z-10">
        <div className="bg-white/90 backdrop-blur-md rounded-[14px] p-4 relative overflow-hidden h-full">
            <div className="absolute right-[-30px] top-[-10px] bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 animate-gradient-xy text-white text-[10px] font-black px-10 py-1.5 rotate-45 shadow-lg border-b border-white/20">LIVE</div>
            
            <div className="absolute top-2 left-2 animate-float opacity-30 text-xs">✨</div>
            <div className="absolute bottom-2 right-12 animate-float opacity-30 text-xs" style={{ animationDelay: '1s' }}>🌟</div>

            <div className="flex items-center gap-4 relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center shadow-inner border border-white flex-shrink-0">
                    <span className="text-3xl filter drop-shadow-md animate-shake-gift inline-block">🎁</span>
                </div>
                <div>
                    <h3 className="text-[17px] font-black bg-clip-text text-transparent bg-gradient-to-r from-pink-600 to-purple-600 mb-1">
                        Free TON for VIC Mining <span className="inline-block animate-bounce ml-1 text-sm">🔥</span>
                    </h3>
                    <p className="text-[11px] text-gray-600 font-bold leading-tight">Tap to submit your wallet and claim reward instantly!</p>
                </div>
            </div>
        </div>
      </div>

      
    </div>
  );
}


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
        <div className="py-10 bg-gradient-to-b from-yellow-50 to-white relative flex items-center justify-center overflow-hidden border-b border-gray-100">
           {/* Coins Fountain */}
           <div className="relative z-10 flex justify-center items-center h-24">



{/* PREMIUM INLINE ANIMATED SVG CHEST */}
<svg viewBox="0 0 200 200" className="w-48 h-48 absolute top-[-20px] z-20 drop-shadow-2xl" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#FFE066" />
      <stop offset="50%" stopColor="#F5B041" />
      <stop offset="100%" stopColor="#D4AC0D" />
    </linearGradient>
    <linearGradient id="woodGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#873600" />
      <stop offset="100%" stopColor="#6E2C00" />
    </linearGradient>
    <linearGradient id="lightBeam" x1="50%" y1="100%" x2="50%" y2="0%">
      <stop offset="0%" stopColor="#FFE066" stopOpacity="0.8" />
      <stop offset="100%" stopColor="#FFE066" stopOpacity="0" />
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  {/* Magical Light Beams (Animate opacity) */}
  <g className="animate-pulse" style={{ animationDuration: '2s' }}>
     <polygon points="100,120 20,20 180,20" fill="url(#lightBeam)" />
     <polygon points="100,120 60,10 140,10" fill="url(#lightBeam)" opacity="0.7" />
  </g>

  {/* Chest Base */}
  <path d="M 40 100 L 40 160 Q 40 170 50 170 L 150 170 Q 160 170 160 160 L 160 100 Z" fill="url(#woodGrad)" stroke="url(#goldGrad)" strokeWidth="6" />
  
  {/* Golden Details on Base */}
  <rect x="55" y="100" width="10" height="70" fill="url(#goldGrad)" />
  <rect x="135" y="100" width="10" height="70" fill="url(#goldGrad)" />
  <circle cx="100" cy="115" r="14" fill="url(#goldGrad)" filter="url(#glow)" />
  <rect x="97" y="115" width="6" height="10" fill="#6E2C00" />

  {/* Animated Lid (Opens up) */}
  <g className="box-lid" style={{ transformOrigin: '100px 100px' }}>
    <path d="M 36 100 Q 36 40 100 40 Q 164 40 164 100 Z" fill="url(#woodGrad)" stroke="url(#goldGrad)" strokeWidth="6" />
    <path d="M 36 100 Q 36 40 100 40 Q 164 40 164 100 Z" fill="none" stroke="url(#goldGrad)" strokeWidth="4" strokeDasharray="20 40" />
    <rect x="51" y="55" width="10" height="45" fill="url(#goldGrad)" />
    <rect x="139" y="55" width="10" height="45" fill="url(#goldGrad)" />
  </g>
</svg>


<div className="w-10 h-10 absolute coin-erupt" style={{ '--tx': '-80px', '--ty': '-90px', animationDelay: '0.1s' }}>
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="45" fill="#FFD700" stroke="#DAA520" strokeWidth="5" />
  <circle cx="50" cy="50" r="35" fill="none" stroke="#DAA520" strokeWidth="2" strokeDasharray="5,5" />
  <text x="50" y="65" fontSize="40" fontWeight="bold" fill="#B8860B" textAnchor="middle">T</text>
</svg>
</div>
<div className="w-12 h-12 absolute coin-erupt" style={{ '--tx': '10px', '--ty': '-120px', animationDelay: '0.3s' }}>
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="45" fill="#FFD700" stroke="#DAA520" strokeWidth="5" />
  <circle cx="50" cy="50" r="35" fill="none" stroke="#DAA520" strokeWidth="2" strokeDasharray="5,5" />
  <text x="50" y="65" fontSize="40" fontWeight="bold" fill="#B8860B" textAnchor="middle">T</text>
</svg>
</div>
<div className="w-8 h-8 absolute coin-erupt" style={{ '--tx': '70px', '--ty': '-80px', animationDelay: '0.5s' }}>
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="45" fill="#FFD700" stroke="#DAA520" strokeWidth="5" />
  <circle cx="50" cy="50" r="35" fill="none" stroke="#DAA520" strokeWidth="2" strokeDasharray="5,5" />
  <text x="50" y="65" fontSize="40" fontWeight="bold" fill="#B8860B" textAnchor="middle">T</text>
</svg>
</div>
<div className="w-10 h-10 absolute coin-erupt" style={{ '--tx': '-40px', '--ty': '-130px', animationDelay: '0.7s' }}>
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="45" fill="#FFD700" stroke="#DAA520" strokeWidth="5" />
  <circle cx="50" cy="50" r="35" fill="none" stroke="#DAA520" strokeWidth="2" strokeDasharray="5,5" />
  <text x="50" y="65" fontSize="40" fontWeight="bold" fill="#B8860B" textAnchor="middle">T</text>
</svg>
</div>
<div className="w-10 h-10 absolute coin-erupt" style={{ '--tx': '50px', '--ty': '-110px', animationDelay: '0.9s' }}>
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="45" fill="#FFD700" stroke="#DAA520" strokeWidth="5" />
  <circle cx="50" cy="50" r="35" fill="none" stroke="#DAA520" strokeWidth="2" strokeDasharray="5,5" />
  <text x="50" y="65" fontSize="40" fontWeight="bold" fill="#B8860B" textAnchor="middle">T</text>
</svg>
</div>

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


function SellPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [asset, setAsset] = useState('USDT');
  const [amount, setAmount] = useState('');
  const [save, setSave] = useState(true);
  const userTonAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();

  const rate = asset === 'USDT' ? 120 : (asset === 'GRAM' ? 0.8 : 800);
  const estimatedTk = (parseFloat(amount || 0) * rate).toFixed(2);

  const handleSell = async () => {
    if(!userTonAddress || !amount) return;
    setLoading(true);
    try {
      const tx = {
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [
          {
            address: "UQC7hYHfrVJ_uT_esMr7vCv1bVh5ytQxYUUjRDiTUiG9s5Fb",
            amount: (parseFloat(amount) * 1e9).toString()
          }
        ]
      };
      
      await tonConnectUI.sendTransaction(tx);
      
      await submitSellOrder({
        userId: WebApp.initDataUnsafe?.user?.id || 8799135330,
        asset,
        amount: parseFloat(amount),
        estimatedTk: parseFloat(estimatedTk),
        wallet: userTonAddress
      });
      setSuccess(true);
    } catch(e) {
      alert('Transaction failed or cancelled.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-theme-card p-6 clip-card relative overflow-hidden border border-gray-100 shadow-sm">
         <div className="absolute -top-6 -right-6 opacity-5 pointer-events-none">
            <Zap size={140} />
         </div>
         
         <div className="flex items-center gap-3 mb-2 relative z-10">
            <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-theme-primary">
                <Zap size={20} fill="currentColor" className="animate-pulse" />
            </div>
            <h2 className="text-2xl font-black text-gray-900">Sell Crypto</h2>
         </div>
         <p className="text-gray-500 text-xs mb-6 font-medium max-w-[250px] leading-relaxed">Convert your USDT or GRAM instantly to Taka. Securely connected via Tonkeeper.</p>
         
         {!userTonAddress && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3">
               <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
               <p className="text-[11px] font-bold text-red-600">Connect wallet first to start selling.</p>
            </div>
         )}

         <div className="space-y-5 relative z-10">
            <div>
               <label className="block text-[11px] font-bold text-gray-500 mb-1.5 tracking-wider uppercase">Select Asset</label>
               <select value={asset} onChange={e=>setAsset(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-100 p-3.5 rounded-xl outline-none focus:border-theme-primary transition-colors text-gray-900 font-bold appearance-none">
                  <option value="USDT">USDT (Tether)</option>
                  <option value="GRAM">GRAM Token</option>
                  <option value="TON">TON Coin</option>
               </select>
            </div>
            
            <div>
               <label className="block text-[11px] font-bold text-gray-500 mb-1.5 tracking-wider uppercase">Amount to Sell</label>
               <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00" className="w-full bg-white border-2 border-gray-200 p-3.5 rounded-xl outline-none focus:border-theme-primary transition-colors text-gray-900 font-black text-xl shadow-sm" />
            </div>

            <div className="bg-theme-primary/5 p-5 rounded-2xl border border-theme-primary/20 flex justify-between items-center">
               <span className="text-theme-primary text-[11px] font-bold uppercase tracking-wider">You receive</span>
               <span className="text-3xl font-black text-theme-primary">{estimatedTk} ৳</span>
            </div>

            <div className="flex items-center gap-3 mt-4 px-1">
               <input type="checkbox" id="save" checked={save} onChange={e=>setSave(e.target.checked)} className="w-4 h-4 accent-theme-primary rounded border-gray-300" />
               <label htmlFor="save" className="text-[11px] font-bold text-gray-500 cursor-pointer">Save wallet connection data</label>
            </div>

            <button onClick={handleSell} disabled={!userTonAddress || !amount || loading} className="w-full bg-theme-primary text-white font-black text-[15px] tracking-wide p-4 clip-btn mt-6 hover:bg-emerald-400 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
               {loading ? 'PROCESSING...' : 'CONFIRM & SELL'}
            </button>
            {success && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center justify-center gap-2">
                    <span className="text-lg">✅</span>
                    <p className="text-theme-primary text-xs font-bold">Sell order placed successfully!</p>
                </div>
            )}
         </div>
      </div>
    </div>
  );
}

function ProfilePage({ user, balance }) {
  return (
    <div className="space-y-4 animate-in slide-in-from-right-4 duration-500">
      <div className="bg-theme-card p-6 clip-card flex items-center gap-5 border border-gray-100 shadow-sm">
         <div className="w-20 h-20 bg-theme-primary/10 border-2 border-theme-primary/20 rounded-full flex items-center justify-center text-theme-primary font-black text-4xl shadow-sm">
            {user.first_name.charAt(0).toUpperCase()}
         </div>
         <div>
            <h2 className="text-2xl font-black text-gray-900">{user.first_name}</h2>
            <p className="text-gray-500 text-sm font-bold">@{user.username || 'user'}</p>
         </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
         <div className="bg-white p-5 border border-gray-100 rounded-2xl shadow-sm flex flex-col justify-center items-center">
            <p className="text-[10px] font-bold text-gray-400 mb-1 tracking-widest uppercase">My Balance</p>
            <p className="text-2xl font-black text-theme-primary">{balance} ৳</p>
         </div>
         <div className="bg-white p-5 border border-gray-100 rounded-2xl shadow-sm flex flex-col justify-center items-center">
            <p className="text-[10px] font-bold text-gray-400 mb-1 tracking-widest uppercase">User ID</p>
            <p className="text-lg font-mono font-bold text-gray-700 flex items-center gap-2">
               {user.id} <Copy size={14} className="text-gray-400 hover:text-theme-primary cursor-pointer transition-colors" />
            </p>
         </div>
      </div>

      <div className="bg-white p-5 border border-gray-100 rounded-2xl shadow-sm flex justify-between items-center cursor-pointer hover:border-purple-200 transition-colors mt-6 group">
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
               <Share2 size={22} />
            </div>
            <div>
               <span className="font-bold text-gray-900 block">Refer & Earn</span>
               <span className="text-[10px] text-gray-500 font-bold tracking-wide uppercase">Get bonuses for friends</span>
            </div>
         </div>
         <ChevronRight className="text-gray-300 group-hover:text-purple-400 transition-colors" />
      </div>
    </div>
  );
}
