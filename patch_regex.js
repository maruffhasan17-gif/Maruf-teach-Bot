const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

code = code.replace(/const match = caption\.match\(\/ID: `\(d\+\)`\/\);/g, "const match = caption.match(/ID:\\s*(\\d+)/);");
code = code.replace(/const match = caption\.match\(\/ID: \\`\(\\d\+\)\\`\/\);/g, "const match = caption.match(/ID:\\s*(\\d+)/);");

fs.writeFileSync('index.js', code, 'utf8');
console.log('Patched regex');
