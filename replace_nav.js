const fs = require('fs');
let code = fs.readFileSync('miniapp/src/App.jsx', 'utf8');

const navCode = `
        {/* PREMIUM BOTTOM NAVIGATION */}
        {!isKeyboardVisible && (
            <div className="fixed bottom-0 left-0 w-full z-50 flex justify-center pb-[env(safe-area-inset-bottom,16px)] px-5 mb-5 pointer-events-none">
                <div className="w-full max-w-[380px] bg-white/90 backdrop-blur-2xl rounded-[32px] flex justify-between items-center px-2 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.06)] border border-gray-100/50 pointer-events-auto">
                    
                    {/* HOME */}
                    <button onClick={() => setActiveTab('home')} className="relative flex flex-col items-center justify-center w-[76px] h-[64px] transition-all duration-300 group active:scale-95">
                        <div className="relative flex flex-col items-center justify-center z-10">
                            <Home size={22} strokeWidth={activeTab === 'home' ? 2.5 : 2} className={\`mb-1.5 transition-colors duration-300 \${activeTab === 'home' ? 'text-emerald-500' : 'text-gray-400 group-hover:text-gray-600'}\`} />
                            <span className={\`text-[9px] font-extrabold tracking-widest transition-colors duration-300 \${activeTab === 'home' ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-600'}\`}>HOME</span>
                        </div>
                        {/* Active Indicator & Background */}
                        <div className={\`absolute bottom-0 w-5 h-1 bg-emerald-500 rounded-t-full transition-all duration-300 \${activeTab === 'home' ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-50'}\`} />
                        <div className={\`absolute inset-1 bg-emerald-50/50 rounded-[24px] transition-opacity duration-300 \${activeTab === 'home' ? 'opacity-100' : 'opacity-0'}\`} />
                    </button>
  
                    {/* BUY */}
                    <button onClick={() => setActiveTab('buy')} className="relative flex flex-col items-center justify-center w-[76px] h-[64px] transition-all duration-300 group active:scale-95">
                        <div className="relative flex flex-col items-center justify-center z-10">
                            <ArrowDown size={22} strokeWidth={activeTab === 'buy' ? 2.5 : 2} className={\`mb-1.5 transition-colors duration-300 \${activeTab === 'buy' ? 'text-emerald-500' : 'text-gray-400 group-hover:text-gray-600'}\`} />
                            <span className={\`text-[9px] font-extrabold tracking-widest transition-colors duration-300 \${activeTab === 'buy' ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-600'}\`}>BUY</span>
                        </div>
                        {/* Active Indicator & Background */}
                        <div className={\`absolute bottom-0 w-5 h-1 bg-emerald-500 rounded-t-full transition-all duration-300 \${activeTab === 'buy' ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-50'}\`} />
                        <div className={\`absolute inset-1 bg-emerald-50/50 rounded-[24px] transition-opacity duration-300 \${activeTab === 'buy' ? 'opacity-100' : 'opacity-0'}\`} />
                    </button>
  
                    {/* SELL */}
                    <button onClick={() => setActiveTab('sell')} className="relative flex flex-col items-center justify-center w-[76px] h-[64px] transition-all duration-300 group active:scale-95">
                        <div className="relative flex flex-col items-center justify-center z-10">
                            <ArrowUp size={22} strokeWidth={activeTab === 'sell' ? 2.5 : 2} className={\`mb-1.5 transition-colors duration-300 \${activeTab === 'sell' ? 'text-emerald-500' : 'text-gray-400 group-hover:text-gray-600'}\`} />
                            <span className={\`text-[9px] font-extrabold tracking-widest transition-colors duration-300 \${activeTab === 'sell' ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-600'}\`}>SELL</span>
                        </div>
                        {/* Active Indicator & Background */}
                        <div className={\`absolute bottom-0 w-5 h-1 bg-emerald-500 rounded-t-full transition-all duration-300 \${activeTab === 'sell' ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-50'}\`} />
                        <div className={\`absolute inset-1 bg-emerald-50/50 rounded-[24px] transition-opacity duration-300 \${activeTab === 'sell' ? 'opacity-100' : 'opacity-0'}\`} />
                    </button>
  
                    {/* PROFILE */}
                    <button onClick={() => setActiveTab('profile')} className="relative flex flex-col items-center justify-center w-[76px] h-[64px] transition-all duration-300 group active:scale-95">
                        <div className="relative flex flex-col items-center justify-center z-10">
                            <User size={22} strokeWidth={activeTab === 'profile' ? 2.5 : 2} className={\`mb-1.5 transition-colors duration-300 \${activeTab === 'profile' ? 'text-emerald-500' : 'text-gray-400 group-hover:text-gray-600'}\`} />
                            <span className={\`text-[9px] font-extrabold tracking-widest transition-colors duration-300 \${activeTab === 'profile' ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-600'}\`}>PROFILE</span>
                        </div>
                        {/* Active Indicator & Background */}
                        <div className={\`absolute bottom-0 w-5 h-1 bg-emerald-500 rounded-t-full transition-all duration-300 \${activeTab === 'profile' ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-50'}\`} />
                        <div className={\`absolute inset-1 bg-emerald-50/50 rounded-[24px] transition-opacity duration-300 \${activeTab === 'profile' ? 'opacity-100' : 'opacity-0'}\`} />
                    </button>
                </div>
            </div>
        )}
`;

code = code.replace(/\{\/\* Bottom Navigation \*\/\}\s*\{!isKeyboardVisible && <div className="fixed bottom-0 left-0 w-full z-50 flex justify-center">[\s\S]*?<\/div>\s*<\/div>\}/, navCode.trim());

fs.writeFileSync('miniapp/src/App.jsx', code);
console.log('Replaced navigation');
