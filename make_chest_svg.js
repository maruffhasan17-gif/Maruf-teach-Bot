const fs = require('fs');
let code = fs.readFileSync('miniapp/src/App.jsx', 'utf8');

const animatedChestSVG = `
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
`;

const coinSVG = `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="45" fill="#FFD700" stroke="#DAA520" strokeWidth="5" />
  <circle cx="50" cy="50" r="35" fill="none" stroke="#DAA520" strokeWidth="2" strokeDasharray="5,5" />
  <text x="50" y="65" fontSize="40" fontWeight="bold" fill="#B8860B" textAnchor="middle">T</text>
</svg>
`;

// Replace the previous static chest with this masterpiece
const oldRegex = /<img src="https:\/\/raw\.githubusercontent\.com\/Tarikul-Islam-Anik\/Animated-Fluent-Emojis\/master\/Emojis\/Objects\/Treasure%20Chest\.png"[^>]+>/;

if (code.match(oldRegex)) {
    code = code.replace(oldRegex, animatedChestSVG);
    fs.writeFileSync('miniapp/src/App.jsx', code, 'utf8');
    console.log("Patched chest with massive animated SVG!");
} else {
    console.log("Could not find the old chest to replace");
}
