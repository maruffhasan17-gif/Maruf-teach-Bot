const fs = require('fs');
const content = fs.readFileSync('miniapp/src/App.jsx', 'utf8');

const startIdx = content.indexOf('function PremiumSellPage() {');
const endIdx = content.indexOf('function HistoryPage', startIdx);
const before = content.slice(0, startIdx);
const after = content.slice(endIdx);
const sellPage = content.slice(startIdx, endIdx);

fs.writeFileSync('old_sell.txt', sellPage);
console.log('Saved to old_sell.txt');
