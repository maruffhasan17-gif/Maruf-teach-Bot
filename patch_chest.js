const fs = require('fs');
let code = fs.readFileSync('miniapp/src/App.jsx', 'utf8');

const oldClaimPageRegex = /<div className="h-56 bg-gradient-to-b from-blue-50 to-white relative flex items-center justify-center overflow-hidden border-b border-gray-100">[\s\S]*?<\/div>\s*<\/div>/;

const newChestAnimation = `<div className="py-10 bg-gradient-to-b from-yellow-50 to-white relative flex items-center justify-center overflow-hidden border-b border-gray-100">
           {/* Coins Fountain */}
           <div className="relative z-10 flex justify-center items-center h-24">
               {/* Base of the Treasure Chest */}
               <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Treasure%20Chest.png" alt="Treasure Chest" className="w-32 h-32 absolute top-[-10px] z-20 drop-shadow-xl animate-pulse" />
               
               {/* The Coins Flying Out */}
               <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Coin.png" alt="Coin" className="w-10 h-10 absolute coin-erupt" style={{ '--tx': '-80px', '--ty': '-90px', animationDelay: '0.1s' }} />
               <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Coin.png" alt="Coin" className="w-12 h-12 absolute coin-erupt" style={{ '--tx': '10px', '--ty': '-120px', animationDelay: '0.3s' }} />
               <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Coin.png" alt="Coin" className="w-8 h-8 absolute coin-erupt" style={{ '--tx': '70px', '--ty': '-80px', animationDelay: '0.5s' }} />
               <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Coin.png" alt="Coin" className="w-10 h-10 absolute coin-erupt" style={{ '--tx': '-40px', '--ty': '-130px', animationDelay: '0.7s' }} />
               <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Coin.png" alt="Coin" className="w-10 h-10 absolute coin-erupt" style={{ '--tx': '50px', '--ty': '-110px', animationDelay: '0.9s' }} />
           </div>
        </div>`;

code = code.replace(oldClaimPageRegex, newChestAnimation);

fs.writeFileSync('miniapp/src/App.jsx', code, 'utf8');
console.log("Patched chest animation!");
