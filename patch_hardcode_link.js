const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

// Replace botConfig default
code = code.replace(/freeLink: 'https:\/\/t\.me\/ShardsEarnBot\/app\?startapp=8799135330'/g, "freeLink: 'https://t.me/VictorsCompanybot/app?startapp=ref_DBF2368328'");

// Replace the fallback logic
code = code.replace(/let freeTaskLink = 'https:\/\/t\.me\/ShardsEarnBot\/app\?startapp=8799135330';/g, "const freeTaskLink = 'https://t.me/VictorsCompanybot/app?startapp=ref_DBF2368328';");
code = code.replace(/if \(config\.freeLink\) freeTaskLink = config\.freeLink;/g, "// Hardcoded permanently");

fs.writeFileSync('index.js', code, 'utf8');
console.log("Patched!");
