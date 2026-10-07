import io

with io.open('index.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Add require at top
content = content.replace("const axios = require('axios');", "const axios = require('axios');\\nconst { getOrCreateBotWallet } = require('./walletManager');")

# Patch build-tx to use bot wallet
old_build_tx = "const { asset, amount, userAddress, adminWallet } = req.body;"
new_build_tx = """const { asset, amount, userAddress } = req.body;
        const botWallet = await getOrCreateBotWallet();
        const adminWallet = botWallet.address;"""
content = content.replace(old_build_tx, new_build_tx)

# Add telegram command to show balance and withdraw
withdraw_cmd = """
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

        const text = ?? *Admin Treasury Wallet*\n\n +
                     *Address:* \${botWallet.address}\\n\n +
                     ?? *TON Balance:*  TON\n +
                     ?? *USDT Balance:*  USDT\n\n +
                     _To withdraw, use the admin panel (coming soon) or contact developer._;
        
        bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
    } catch(e) {
        bot.sendMessage(chatId, "Error fetching wallet: " + e.message);
    }
});
"""

content = content.replace("// Bot Wallet Commands for Admin", "") # remove if exists
content = content + withdraw_cmd

with io.open('index.js', 'w', encoding='utf-8') as f:
    f.write(content)
