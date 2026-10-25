const fs = require('fs');
let code = fs.readFileSync('miniapp/index.html', 'utf8');

if (!code.includes('no-cache')) {
    code = code.replace(
        /<title>Maruf Earn Bot<\/title>/,
        `<title>Maruf Earn Bot</title>
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
    <meta http-equiv="Pragma" content="no-cache" />
    <meta http-equiv="Expires" content="0" />`
    );
    fs.writeFileSync('miniapp/index.html', code);
}
