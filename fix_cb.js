const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

const cbRegex = /if \(query\.data === 'verify_join'\) \{/;
const cbReplace = `if (query.data === 'retry_free_payout') {
        userStates[chatId] = { step: 'awaiting_ton_address_free' };
        bot.sendMessage(chatId, '✅ Please send your TON address again:');
        return;
    }

    if (query.data === 'verify_join') {`;

if (code.match(cbRegex)) {
    code = code.replace(cbRegex, cbReplace);
    fs.writeFileSync('index.js', code, 'utf8');
    console.log("Callback patched");
} else {
    console.log("Callback regex failed");
}
