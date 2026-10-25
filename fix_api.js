const fs = require('fs');
let c = fs.readFileSync('miniapp/src/api.js', 'utf8');
c = c.replace(/axios\.post\(\$\{API_URL\}\/api\/miniapp\/buy, payload\);/, 'axios.post(${API_URL}/api/miniapp/buy, payload);');
fs.writeFileSync('miniapp/src/api.js', c);
