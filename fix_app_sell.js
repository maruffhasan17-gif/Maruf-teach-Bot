const fs = require('fs');
let code = fs.readFileSync('miniapp/src/App.jsx', 'utf8');
code = code.replace(/userId: WebApp\.initDataUnsafe\?\.user\?\.id \|\| 123456789/g, "userId: user?.id || WebApp.initDataUnsafe?.user?.id");
fs.writeFileSync('miniapp/src/App.jsx', code);
