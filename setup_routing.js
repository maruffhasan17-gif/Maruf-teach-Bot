const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

const newRouting = `
// Serve MiniApp on /app
app.use('/app', express.static(path.join(__dirname, 'miniapp/dist')));
app.get('/app/*', (req, res) => {
    const p = path.join(__dirname, 'miniapp/dist/index.html');
    if (fs.existsSync(p)) res.sendFile(p);
    else res.send("MiniApp is not built yet.");
});

// Serve Admin on /
app.use(express.static(path.join(__dirname, 'admin/dist')));
app.use((req, res) => {
    const p = path.join(__dirname, 'admin/dist/index.html');
    if (fs.existsSync(p)) res.sendFile(p);
    else res.send("Backend is running!");
});
`;

code = code.replace(/app\.use\(express\.static\(path\.join\(__dirname, 'admin\/dist'\)\)\);[\s\S]*?else res\.send\("Backend is running!"\);\r?\n\}\);/, newRouting);
fs.writeFileSync('index.js', code, 'utf8');
console.log("Routing updated");
