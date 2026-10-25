const fs = require('fs');
const appCode = fs.readFileSync('miniapp/src/App.jsx', 'utf8');
const sellCode = fs.readFileSync('new_sell.txt', 'utf8');

const startIdx = appCode.indexOf('function PremiumSellPage() {');
const endIdx = appCode.indexOf('function HistoryPage', startIdx);

const newAppCode = appCode.slice(0, startIdx) + sellCode + "\\n\\n" + appCode.slice(endIdx);
fs.writeFileSync('miniapp/src/App.jsx', newAppCode);
console.log('Injected properly.');
