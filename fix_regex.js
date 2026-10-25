const fs = require('fs');
let code = fs.readFileSync('replace_profile.js', 'utf8');
code = code.replace(/function ProfilePage\\\(\\\{ user, balance, mbsId/g, "function ProfilePage\\\\(\\\\{ user, balance, fiatWallet");
fs.writeFileSync('replace_profile.js', code);
