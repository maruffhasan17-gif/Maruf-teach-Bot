const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

const anchor1 = "axios.get(`https://tonapi.io/v2/accounts/${process.env.BOT_TON_ADDRESS}/jettons`, { timeout: 3000 })";
const replace1 = "axios.get(`https://tonapi.io/v2/accounts/${process.env.BOT_TON_ADDRESS}/jettons?_t=${Date.now()}`, { timeout: 3000 })";

const anchor2 = "axios.get(`https://tonapi.io/v2/accounts/${process.env.BOT_TON_ADDRESS}`, { timeout: 3000 })";
const replace2 = "axios.get(`https://tonapi.io/v2/accounts/${process.env.BOT_TON_ADDRESS}?_t=${Date.now()}`, { timeout: 3000 })";

let patched = false;
if (code.includes(anchor1)) {
    code = code.replace(anchor1, replace1);
    patched = true;
}
if (code.includes(anchor2)) {
    code = code.replace(anchor2, replace2);
    patched = true;
}
if (patched) {
    fs.writeFileSync('index.js', code, 'utf8');
    console.log("Patched TonAPI fetch!");
} else {
    console.log("TonAPI anchors not found");
}
