const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

const target = 'const match = message.match(/(?:TrxID|TxnId|TxnID|TrxId)[\\\\s:]*([A-Za-z0-9]+)/i);';
const replacement = 'const match = message.match(/(?:TrxID|TxnId|TxnID|TrxId|Txn\\\\s*ID|Trx\\\\s*ID)[\\\\s:]*([A-Za-z0-9]+)/i);';

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('index.js', code);
    console.log("Patched successfully");
} else {
    console.log("Not found");
}
