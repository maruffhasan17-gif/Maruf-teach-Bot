const fs = require('fs');
let code = fs.readFileSync('miniapp/src/App.jsx', 'utf8');

code = code.replace(/receiveAddress: receiveNumber/g, 'receiveAddress: receiveAddress');

fs.writeFileSync('miniapp/src/App.jsx', code);
