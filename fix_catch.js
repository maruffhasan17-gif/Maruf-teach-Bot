const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

const anchor = "console.error('Free payout error:', e);";
const endAnchor = "          return;";

const idx = code.indexOf(anchor);
if (idx !== -1) {
    const catchEndIdx = code.indexOf(endAnchor, idx);
    
    const insertCode = `console.error('Free payout error:', e.response ? e.response.data : e.message);
            bot.sendMessage(chatId, '❌ Failed to send payment. Error: ' + (e.response && e.response.data && e.response.data.error ? JSON.stringify(e.response.data.error) : e.message) + '\\n\\nThe network might be busy. Please click Try Again.', {
                reply_markup: {
                    inline_keyboard: [[{ text: '🔄 Try Again', callback_data: 'retry_free_payout' }]]
                }
            });
            userStates[chatId].step = 'menu';
        }
`;
    code = code.substring(0, idx) + insertCode + code.substring(catchEndIdx);
    fs.writeFileSync('index.js', code, 'utf8');
    console.log("Patched catch block!");
} else {
    console.log("Anchor not found");
}
