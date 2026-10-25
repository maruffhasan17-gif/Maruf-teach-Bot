const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

const regex = /bot\.on\('message', async \\(msg\\) => \\{[\s\S]*?bot\.onText\(\/\\\\\/msg /;
const match = code.match(regex);
if (match) {
    fs.writeFileSync('msg_logic.txt', match[0], 'utf8');
} else {
    console.log("No match");
}
