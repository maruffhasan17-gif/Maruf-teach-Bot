const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');
code = code.replace("app.post('/api/settings', (req, res) => {", "app.post('/api/settings', async (req, res) => {");
fs.writeFileSync('index.js', code, 'utf8');
console.log('Fixed post');
