import io

with io.open('index.js', 'r', encoding='utf-8') as f:
    c = f.read()

# Fix literal '\n' which was committed accidentally
c = c.replace(r"\nconst app = express();", "\nconst app = express();")
c = c.replace(r"require('@ton/core');\nconst axios = require('axios');", "require('@ton/core');\nconst axios = require('axios');")

# Remove any extra duplicate walletManagers
c = c.replace("const { getOrCreateBotWallet } = require('./walletManager');\n", "")
c = c.replace("const axios = require('axios');\n", "const axios = require('axios');\n")

# Re-apply correctly
c = c.replace(
    "const axios = require('axios');",
    "const axios = require('axios');\nconst { getOrCreateBotWallet } = require('./walletManager');",
    1
)

# Re-apply build tx
old_build_tx = "const { asset, amount, userAddress, adminWallet } = req.body;"
new_build_tx = "const { asset, amount, userAddress } = req.body;\n        const botWallet = await getOrCreateBotWallet();\n        const adminWallet = botWallet.address;"
c = c.replace(old_build_tx, new_build_tx)

# Fix tonapi calls that were broken
c = c.replace(
    "axios.get(https://tonapi.io/v2/accounts//jettons/EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs);",
    "axios.get(https://tonapi.io/v2/accounts//jettons/EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs);"
)

# Fix wallet_address
c = c.replace("if (response.data && response.data.balances && response.data.balances.length > 0) {", "if (response.data && response.data.wallet_address) {")
c = c.replace("userJettonWallet = response.data.balances[0].wallet_address.address;", "userJettonWallet = response.data.wallet_address.address;")


cmd = """
// Bot Wallet Commands for Admin
bot.onText(/\/wallet/, async (msg) => {
    const chatId = msg.chat.id;
    const config = await db.collection('config').doc('main').get();
    const adminGroupId = config.exists ? config.data().adminGroupId : null;
    if (chatId.toString() !== adminGroupId) return;

    try {
        const botWallet = await getOrCreateBotWallet();
        
        // Fetch balance from TonAPI
        const res = await axios.get(https://tonapi.io/v2/accounts/);
        const tonBalance = (res.data.balance / 1e9).toFixed(4);
        
        // Fetch USDT balance
        let usdtBalance = '0.00';
        try {
            const jettonRes = await axios.get(https://tonapi.io/v2/accounts//jettons/EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs);
            if (jettonRes.data && jettonRes.data.balance) {
                usdtBalance = (parseFloat(jettonRes.data.balance) / 1e6).toFixed(2);
            }
        } catch(e) {}

        const text = ?? *Admin Treasury Wallet*\n\n*Address:* \${botWallet.address}\\n\n?? *TON Balance:*  TON\n?? *USDT Balance:*  USDT\n\n_To withdraw, use the admin panel (coming soon) or contact developer._;
        
        bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
    } catch(e) {
        bot.sendMessage(chatId, "Error fetching wallet: " + e.message);
    }
});
"""

if "Bot Wallet Commands for Admin" not in c:
    c = c + "\n" + cmd

with io.open('index.js', 'w', encoding='utf-8') as f:
    f.write(c)

