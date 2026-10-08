const fs = require('fs');
let c = fs.readFileSync('src/App.jsx', 'utf8');

const navNew = `        <div className="fixed bottom-0 left-0 w-full z-50 flex justify-center">
          <div className="w-full max-w-md bg-white rounded-t-[24px] flex justify-between items-center px-6 pb-5 pt-3 floating-nav-shadow">
            <button onClick={() => setActiveTab('home')} className={\`flex flex-col items-center p-2 transition-all duration-300 \${activeTab === 'home' ? 'text-[var(--color-brand)] scale-110' : 'text-[var(--color-text-secondary)]'}\`}>
              <Home size={24} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
              <span className="text-[10px] mt-1.5 font-bold tracking-wide">HOME</span>
            </button>

            <button onClick={() => setActiveTab('buy')} className={\`flex flex-col items-center p-2 transition-all duration-300 \${activeTab === 'buy' ? 'text-[#10B981] scale-110' : 'text-[var(--color-text-secondary)]'}\`}>
              <ArrowDown size={24} strokeWidth={activeTab === 'buy' ? 2.5 : 2} />
              <span className="text-[10px] mt-1.5 font-bold tracking-wide">BUY</span>
            </button>

            <button onClick={() => setActiveTab('sell')} className={\`flex flex-col items-center p-2 transition-all duration-300 \${activeTab === 'sell' ? 'text-[#EF4444] scale-110' : 'text-[var(--color-text-secondary)]'}\`}>
              <ArrowUp size={24} strokeWidth={activeTab === 'sell' ? 2.5 : 2} />
              <span className="text-[10px] mt-1.5 font-bold tracking-wide">SELL</span>
            </button>

            <button onClick={() => setActiveTab('profile')} className={\`flex flex-col items-center p-2 transition-all duration-300 \${activeTab === 'profile' ? 'text-[var(--color-brand)] scale-110' : 'text-[var(--color-text-secondary)]'}\`}>
              <User size={24} strokeWidth={activeTab === 'profile' ? 2.5 : 2} />
              <span className="text-[10px] mt-1.5 font-bold tracking-wide">PROFILE</span>
            </button>
          </div>
        </div>`;

const navStart = c.indexOf('{/* Bottom Navigation */}');
const navEnd = c.indexOf('</TonConnectUIProvider>', navStart);
if(navStart !== -1 && navEnd !== -1) {
    const replacement = `{/* Bottom Navigation */}\n` + navNew + `\n        </div>\n      `;
    c = c.substring(0, navStart) + replacement + c.substring(navEnd);
    fs.writeFileSync('src/App.jsx', c, 'utf8');
    console.log("Replaced nav!");
} else {
    console.log("Nav not found!");
}
