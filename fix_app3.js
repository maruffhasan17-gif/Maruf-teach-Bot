const fs = require('fs');
let code = fs.readFileSync('miniapp/src/App.jsx', 'utf8');

const regex = /\s*\)\}\s*\)\}/;
code = code.replace(regex, '\n        )}');

fs.writeFileSync('miniapp/src/App.jsx', code);
