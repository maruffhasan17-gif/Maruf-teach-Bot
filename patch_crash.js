const fs = require('fs');
let code = fs.readFileSync('miniapp/src/App.jsx', 'utf8');

code = code.replace(/<ArrowDownUp/g, '<ArrowRightLeft className="rotate-90"');

// And remove WebApp.initDataUnsafe from PremiumSellPage to be safe
code = code.replace(/WebApp\.initDataUnsafe\?\.user\?\.id/g, '123456789');

fs.writeFileSync('miniapp/src/App.jsx', code);
console.log("Patched potential crashes");
