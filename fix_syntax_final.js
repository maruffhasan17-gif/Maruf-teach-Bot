const fs = require('fs');
let c = fs.readFileSync('index.js', 'utf8');

c = c.replace(/    \}\r?\n\}\);\r?\n    \}\r?\n\}\);/g, "    }\n});");
fs.writeFileSync('index.js', c);
