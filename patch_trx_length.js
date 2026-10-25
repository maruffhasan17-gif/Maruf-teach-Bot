const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

code = code.replace("const { userId, asset, amount, totalBdt, paymentMethod, trxId, receiveAddress } = req.body;",
"const { userId, asset, amount, totalBdt, paymentMethod, trxId, receiveAddress } = req.body;\n        if(!trxId || trxId.length < 5) return res.status(400).json({ error: 'Please enter a valid Transaction ID (min 5 characters)' });");

fs.writeFileSync('index.js', code);
