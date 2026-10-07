const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

const regex = /const msg = `dYZ\? <b>New MiniApp Task Submission<\/b>[\s\S]*?reject\.\`;/m;

const replacement = `const msg = \`🎁 <b>New MiniApp Task Submission</b>\\n\\n👤 User: <a href="tg://user?id=\${userId}">\${name}</a>\\n🆔 ID: \${userId}\\n💰 Type: Free TON (VIC)\\n📍 Address: \\\`\${address}\\\`\\n\\nReply with 'Ok' to approve or 'Wrong' to reject.\`;`;

if (code.match(regex)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync('index.js', code, 'utf8');
    console.log("Fixed!");
} else {
    console.log("Regex not found again");
}
