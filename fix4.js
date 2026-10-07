const fs = require('fs'); let c = fs.readFileSync('miniapp/src/App.jsx', 'utf8'); c = c.split('}\\n\\nexport').join('}\n\nexport'); fs.writeFileSync('miniapp/src/App.jsx', c);
