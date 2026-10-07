const fs = require('fs'); let c = fs.readFileSync('miniapp/src/App.jsx', 'utf8'); c = c.replace(/\\n  const loadData/g, '\n  const loadData'); fs.writeFileSync('miniapp/src/App.jsx', c);
