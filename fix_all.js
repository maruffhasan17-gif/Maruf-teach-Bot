const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

// 1. Fraud protection
const fraudRegex = /const claimDoc = await db\.collection\('free_claims'\)\.doc\(chatId\.toString\(\)\)\.get\(\);\s*if \(claimDoc\.exists\) \{\s*bot\.sendMessage\(chatId, '[^']+'\);\s*userStates\[chatId\]\.step = 'menu';\s*return;\s*\}/;

const fraudReplace = `const claimDoc = await db.collection('free_claims').doc(chatId.toString()).get();
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

if (code.match(fraudRegex)) {
    code = code.replace(fraudRegex, fraudReplace);
    console.log("Fraud patched");
} else {
    console.log("Fraud regex failed");
}

// 2. Try Again logic
const catchRegex = /console\.error\('Free payout error:', e\);\s*bot\.sendMessage\(chatId, '❌ Failed to send payment\. Error: ' \+ e\.message\);\s*\}\s*return;/;

const catchReplace = `console.error('Free payout error:', e.response ? e.response.data : e.message);
            bot.sendMessage(chatId, '❌ Failed to send payment. Error: ' + (e.response && e.response.data && e.response.data.error ? JSON.stringify(e.response.data.error) : e.message) + '\\n\\nThe network might be busy (Seqno conflict). Please click Try Again.', {
                reply_markup: {
                    inline_keyboard: [[{ text: '🔄 Try Again', callback_data: 'retry_free_payout' }]]
                }
            });
            userStates[chatId].step = 'menu';
        }
        return;`;

if (code.match(catchRegex)) {
    code = code.replace(catchRegex, catchReplace);
    console.log("Catch patched");
} else {
    console.log("Catch regex failed");
}

// 3. Callback query logic
const cbRegex = /if \(query\.data === 'check_joined'\) \{/;
const cbReplace = `if (query.data === 'retry_free_payout') {
        userStates[chatId] = { step: 'awaiting_ton_address_free' };
        bot.sendMessage(chatId, '✅ Please send your TON address again:');
        return;
    }

    if (query.data === 'check_joined') {`;

if (code.match(cbRegex)) {
    code = code.replace(cbRegex, cbReplace);
    console.log("Callback patched");
} else {
    console.log("Callback regex failed");
}

fs.writeFileSync('index.js', code, 'utf8');
console.log("Done");
