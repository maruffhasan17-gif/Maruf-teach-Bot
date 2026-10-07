const fs = require('fs'); let c = fs.readFileSync('index.js', 'utf8'); c = c.split('\\\\n').join('\n'); fs.writeFileSync('index.js', c);
