const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

// Fix emoji artifacts
code = code.replace(/dYZ%/g, '🎉');
code = code.replace(/o\./g, '✅');
code = code.replace(/o\./g, '✅');

// We will find "bot.sendMessage" and manually find the balancing parentheses
let pos = 0;
while (true) {
    pos = code.indexOf('bot.sendMessage', pos);
    if (pos === -1) break;
    
    // find the opening parenthesis
    let openParen = code.indexOf('(', pos);
    let closeParen = -1;
    let depth = 0;
    let inQuotes = false;
    let quoteChar = '';
    
    for (let i = openParen; i < code.length; i++) {
        const char = code[i];
        if (inQuotes) {
            if (char === quoteChar && code[i-1] !== '\\') {
                inQuotes = false;
            }
        } else {
            if (char === '"' || char === "'" || char === '`') {
                inQuotes = true;
                quoteChar = char;
            } else if (char === '(') {
                depth++;
            } else if (char === ')') {
                depth--;
                if (depth === 0) {
                    closeParen = i;
                    break;
                }
            }
        }
    }
    
    if (closeParen !== -1) {
        // Now insert `.catch(e => console.error(e.message))` right after the closing parenthesis
        // Only if it doesn't already have one
        const after = code.substring(closeParen + 1, closeParen + 10);
        if (!after.includes('.catch')) {
            code = code.substring(0, closeParen + 1) + '.catch(e => console.error(e.message))' + code.substring(closeParen + 1);
        }
    }
    pos += 15; // advance past bot.sendMessage
}

fs.writeFileSync('index.js', code);
