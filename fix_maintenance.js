const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

const regex = /\/\/ MAINTENANCE MODE[\\s\\S]*?return;\\s*\\}/;
code = code.replace(regex, "// MAINTENANCE MODE REMOVED");

fs.writeFileSync('index.js', code);
