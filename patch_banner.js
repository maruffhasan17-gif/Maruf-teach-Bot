const fs = require('fs');
let code = fs.readFileSync('miniapp/src/App.jsx', 'utf8');

const oldBanner = `      {/* Task Banner */}
      <div onClick={() => setModalOpen(true)} className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-2xl cursor-pointer group hover:scale-[1.02] transition-all duration-300 shadow-[0_4px_15px_rgba(236,72,153,0.1)] border border-pink-100 relative overflow-hidden">
        <div className="absolute right-[-30px] top-[-10px] bg-gradient-to-r from-pink-500 to-purple-500 text-white text-[9px] font-black px-10 py-1.5 rotate-45 shadow-sm">EVENT</div>
        <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm flex-shrink-0 group-hover:animate-spin">
                <span className="text-2xl filter drop-shadow-sm">🎁</span>
            </div>
            <div>
            <h3 className="text-lg font-bold text-gray-900 mb-0.5">Free TON for VIC Mining</h3>
            <p className="text-[11px] text-gray-500 font-medium leading-tight">Tap to submit your wallet and claim free reward instantly!</p>
            </div>
        </div>
      </div>`;

const newBanner = `      {/* Task Banner - ULTRA PREMIUM */}
      <div onClick={() => setModalOpen(true)} className="premium-card-bg p-[2px] rounded-2xl cursor-pointer group hover:scale-[1.03] transition-all duration-300 relative z-10">
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
      </div>`;

if(code.includes('bg-gradient-to-r from-purple-50 to-pink-50')) {
    code = code.replace(oldBanner, newBanner);
    fs.writeFileSync('miniapp/src/App.jsx', code, 'utf8');
    console.log("Patched banner!");
} else {
    console.log("Banner not found!");
}
