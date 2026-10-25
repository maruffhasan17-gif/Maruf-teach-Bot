const fs = require('fs');
const appCode = fs.readFileSync('miniapp/src/App.jsx', 'utf8');
const buyCode = fs.readFileSync('buy_temp_new.jsx', 'utf8');

const startIdx = appCode.indexOf('function PremiumBuyPage() {');
const endIdx = appCode.indexOf('function PremiumSellPage() {', startIdx);

const newAppCode = appCode.slice(0, startIdx) + buyCode + "\\n" + appCode.slice(endIdx);
fs.writeFileSync('miniapp/src/App.jsx', newAppCode);
console.log('Injected properly.');
