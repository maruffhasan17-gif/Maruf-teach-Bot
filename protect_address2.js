const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

const anchor = `const claimDoc = await db.collection('free_claims').doc(chatId.toString()).get();`;
const endAnchor = `userStates[chatId].step = 'menu';
            return;
        }`;

const idx = code.indexOf(anchor);
if (idx !== -1) {
    const endIdx = code.indexOf(endAnchor, idx) + endAnchor.length;
    
    const insertCode = `

        // Check if address is already used by someone else
        const addressCheck = await db.collection('free_claims').where('address', '==', address).get();
        if (!addressCheck.empty) {
            bot.sendMessage(chatId, '🚫 Fraud Detected! This TON address has already been used to claim a reward.');
            userStates[chatId].step = 'menu';
            return;
        }`;

    code = code.substring(0, endIdx) + insertCode + code.substring(endIdx);
    fs.writeFileSync('index.js', code, 'utf8');
    console.log("Patched!");
} else {
    console.log("Not found!");
}
