const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

const regex = /\/\/ MAINTENANCE MODE \(Bypass for admin group\)[\s\S]*?return;\s*\}/;
code = code.replace(regex, "// Maintenance block removed");
fs.writeFileSync('index.js', code);
