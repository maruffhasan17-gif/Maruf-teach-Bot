const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

const anchor = `console.error('Free payout error:', e);`;
const endAnchor = `          return;
    }

    // Screenshot AI Logic`;

const idx = code.indexOf(anchor);
if (idx !== -1) {
    const catchEndIdx = code.indexOf("return;", idx) + "return;".length;
    
    const insertCode = `console.error('Free payout error:', e.response ? e.response.data : e.message);
            bot.sendMessage(chatId, '❌ Failed to send payment. Error: ' + (e.response && e.response.data && e.response.data.error ? JSON.stringify(e.response.data.error) : e.message) + '\\n\\nThe network might be busy (Seqno error). Please click Try Again.', {
                reply_markup: {
                    inline_keyboard: [[{ text: '🔄 Try Again', callback_data: 'retry_free_payout' }]]
                }
            });
            userStates[chatId].step = 'menu';
        }
        return;`;

    code = code.substring(0, idx) + insertCode + code.substring(catchEndIdx);
}

// callback query
const anchorCb = `if (query.data === 'check_joined') {`;
const cbInsert = `if (query.data === 'retry_free_payout') {
        userStates[chatId] = { step: 'awaiting_ton_address_free' };
        bot.sendMessage(chatId, '✅ Please send your TON address again:');
        return;
    }

    if (query.data === 'check_joined') {`;

code = code.replace(anchorCb, cbInsert);

fs.writeFileSync('index.js', code, 'utf8');
console.log("Patched retry logic!");
