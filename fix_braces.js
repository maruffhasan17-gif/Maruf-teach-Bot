const fs = require('fs');
let c = fs.readFileSync('index.js', 'utf8');
c = c.replace(/    \}\n\}\);\n    \}\n\}\);/g, "    }\n});");
fs.writeFileSync('index.js', c);
