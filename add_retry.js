const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

const targetStr = `          } catch (e) {
              console.error('Free payout error:', e);
              bot.sendMessage(chatId, '❌ Failed to send payment. Error: ' + e.message);
          }
          return;
      }`;

const replaceStr = `          } catch (e) {
              console.error('Free payout error:', e.response ? e.response.data : e.message);
              bot.sendMessage(chatId, '❌ Failed to send payment. Error: ' + (e.response && e.response.data && e.response.data.error ? e.response.data.error : e.message) + '\\n\\nThe network might be busy. Please try again.', {
                  reply_markup: {
                      inline_keyboard: [[{ text: '🔄 Try Again', callback_data: 'retry_free_payout' }]]
                  }
              });
              userStates[chatId].step = 'menu'; // Reset to menu so they have to click try again
          }
          return;
      }`;

if (code.includes(targetStr)) {
    code = code.replace(targetStr, replaceStr);
} else {
    console.log("Could not find catch block");
}

// Add callback query handler for retry_free_payout
const callbackTarget = `if (query.data === 'check_joined') {`;
const callbackReplace = `if (query.data === 'retry_free_payout') {
        userStates[chatId] = { step: 'awaiting_ton_address_free' };
        bot.sendMessage(chatId, '✅ Please send your TON address again:');
        return;
    }

    if (query.data === 'check_joined') {`;

if (code.includes(callbackTarget)) {
    code = code.replace(callbackTarget, callbackReplace);
    fs.writeFileSync('index.js', code, 'utf8');
    console.log("Patched retry logic!");
} else {
    console.log("Could not find callback check_joined");
}
