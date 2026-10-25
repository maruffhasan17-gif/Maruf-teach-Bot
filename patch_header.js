const fs = require('fs');
let code = fs.readFileSync('miniapp/src/App.jsx', 'utf8');
code = code.replace(/user\.first_name\.charAt\(0\)\.toUpperCase\(\)/g, "(user?.first_name?.charAt(0)?.toUpperCase() || 'U')");
fs.writeFileSync('miniapp/src/App.jsx', code);
console.log("Patched header crash");
