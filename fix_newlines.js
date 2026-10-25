const fs = require('fs');
let code = fs.readFileSync('miniapp/src/App.jsx', 'utf8');

code = code.replace(/\\n\\nfunction HistoryPage/g, '\n\nfunction HistoryPage');
code = code.replace(/\\nfunction PremiumSellPage/g, '\nfunction PremiumSellPage');

fs.writeFileSync('miniapp/src/App.jsx', code);
