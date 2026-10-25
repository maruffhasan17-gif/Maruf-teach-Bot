const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');
code = code.replace("app.get('/app/*', (req, res) => {", "app.use('/app', (req, res) => {");
fs.writeFileSync('index.js', code);
