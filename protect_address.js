const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

const targetStr = `        const claimDoc = await db.collection('free_claims').doc(chatId.toString()).get();
        if (claimDoc.exists) {
            bot.sendMessage(chatId, '⚠️ You have already claimed your free reward!');
            userStates[chatId].step = 'menu';
            return;
        }`;

const replaceStr = `        const claimDoc = await db.collection('free_claims').doc(chatId.toString()).get();
        if (claimDoc.exists) {
            bot.sendMessage(chatId, '⚠️ You have already claimed your free reward!');
            userStates[chatId].step = 'menu';
            return;
        }

        // Check if address is already used by someone else
        const addressCheck = await db.collection('free_claims').where('address', '==', address).get();
        if (!addressCheck.empty) {
            bot.sendMessage(chatId, '🚫 Fraud Detected! This TON address has already been used to claim a reward.');
            userStates[chatId].step = 'menu';
            return;
        }`;

if (code.includes(targetStr)) {
    code = code.replace(targetStr, replaceStr);
    fs.writeFileSync('index.js', code, 'utf8');
    console.log("Patched address protection!");
} else {
    console.log("Target string not found!");
}
