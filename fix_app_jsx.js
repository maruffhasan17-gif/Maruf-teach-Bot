const fs = require('fs'); let c = fs.readFileSync('miniapp/src/App.jsx', 'utf8'); c = c.split('\\\\n').join('\n'); fs.writeFileSync('miniapp/src/App.jsx', c);
