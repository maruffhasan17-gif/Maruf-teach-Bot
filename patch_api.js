const fs = require('fs');
let c = fs.readFileSync('miniapp/src/api.js', 'utf8');
c = c.substring(0, c.lastIndexOf('};')) + c.substring(c.lastIndexOf('};') + 2);
fs.writeFileSync('miniapp/src/api.js', c);
