const fs = require('fs');
let code = fs.readFileSync('miniapp/src/App.jsx', 'utf8');

// The massive SVG string for a beautiful treasure chest
const chestSVG = `
<svg viewBox="0 0 100 100" className="w-32 h-32 absolute top-[-10px] z-20 drop-shadow-2xl animate-pulse" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M10 50 L10 80 Q10 90 20 90 L80 90 Q90 90 90 80 L90 50 Z" fill="#8B4513" />
  <path d="M10 50 L10 80 Q10 90 20 90 L80 90 Q90 90 90 80 L90 50 Z" fill="url(#wood-grad)" />
  <path d="M10 50 Q10 30 50 20 Q90 30 90 50 Z" fill="#A0522D" />
  <!-- Golden Bands -->
  <rect x="20" y="20" width="10" height="70" fill="#FFD700" />
  <rect x="70" y="20" width="10" height="70" fill="#FFD700" />
  <rect x="10" y="45" width="80" height="10" fill="#DAA520" />
  <!-- Lock -->
  <circle cx="50" cy="50" r="10" fill="#FFD700" />
  <rect x="47" y="50" width="6" height="8" fill="#B8860B" />
  <!-- Glow -->
  <circle cx="50" cy="50" r="40" fill="#FFD700" opacity="0.3" filter="blur(10px)" />
  <defs>
    <linearGradient id="wood-grad" x1="0" y1="0" x2="0" y2="100%">
      <stop offset="0%" stopColor="#A0522D" />
      <stop offset="100%" stopColor="#5C4033" />
    </linearGradient>
  </defs>
</svg>
`;

const coinSVG = `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="45" fill="#FFD700" stroke="#DAA520" strokeWidth="5" />
  <circle cx="50" cy="50" r="35" fill="none" stroke="#DAA520" strokeWidth="2" strokeDasharray="5,5" />
  <text x="50" y="65" fontSize="40" fontWeight="bold" fill="#B8860B" textAnchor="middle">T</text>
</svg>
`;

// Find the chest area to replace
const oldChestStart = `<img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Treasure%20Chest.png"`;
const chestReplacement = `
${chestSVG}
<div className="w-10 h-10 absolute coin-erupt" style={{ '--tx': '-80px', '--ty': '-90px', animationDelay: '0.1s' }}>${coinSVG}</div>
<div className="w-12 h-12 absolute coin-erupt" style={{ '--tx': '10px', '--ty': '-120px', animationDelay: '0.3s' }}>${coinSVG}</div>
<div className="w-8 h-8 absolute coin-erupt" style={{ '--tx': '70px', '--ty': '-80px', animationDelay: '0.5s' }}>${coinSVG}</div>
<div className="w-10 h-10 absolute coin-erupt" style={{ '--tx': '-40px', '--ty': '-130px', animationDelay: '0.7s' }}>${coinSVG}</div>
<div className="w-10 h-10 absolute coin-erupt" style={{ '--tx': '50px', '--ty': '-110px', animationDelay: '0.9s' }}>${coinSVG}</div>
`;

// We just replace the entire contents of the h-24 div
const fullRegex = /<div className="relative z-10 flex justify-center items-center h-24">[\s\S]*?<\/div>\s*<\/div>/;

const replacementBlock = `<div className="relative z-10 flex justify-center items-center h-24">
${chestReplacement}
</div>
</div>`;

code = code.replace(fullRegex, replacementBlock);

fs.writeFileSync('miniapp/src/App.jsx', code, 'utf8');
console.log("Patched to inline SVG");
