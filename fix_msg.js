const fs = require('fs');
const lines = fs.readFileSync('index.js', 'utf8').split('\n');

let startMsg = -1;
let endMsg = -1;
let openBraces = 0;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("bot.on('message', async (msg) => {")) {
        startMsg = i;
    }
    
    if (startMsg !== -1) {
        openBraces += (lines[i].match(/\{/g) || []).length;
        openBraces -= (lines[i].match(/\}/g) || []).length;
        
        if (openBraces === 0) {
            endMsg = i;
            break;
        }
    }
}

let code = fs.readFileSync('index.js', 'utf8');
const originalBlock = lines.slice(startMsg, endMsg + 1).join('\n');
console.log("Original Block Length:", originalBlock.length);
fs.writeFileSync('original_block.txt', originalBlock);
