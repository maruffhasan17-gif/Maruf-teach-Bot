const fs = require('fs');
let code = fs.readFileSync('miniapp/src/App.jsx', 'utf8');
code = code.replace(/\\n\\nfunction HistoryPage/g, '\n\nfunction HistoryPage');
fs.writeFileSync('miniapp/src/App.jsx', code);
