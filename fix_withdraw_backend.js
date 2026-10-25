const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

const regex = /app\.post\('\/api\/miniapp\/withdraw-fiat', async \(req, res\) => \{[\s\S]*?res\.status\(500\)\.json\(\{ error: e\.message \}\);\s*\}\s*\}\);/m;

const newEndpoint = `app.post('/api/miniapp/withdraw-fiat', async (req, res) => {
    try {
        const { userId, amount, fee, receiveAmount } = req.body;
        const userRef = db.collection('users').doc(userId.toString());
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) throw new Error("User not found");
        const userData = userDoc.data();
        if ((userData.balance || 0) < amount) throw new Error("Insufficient balance");
        if (userData.fiatWithdrawPending) throw new Error("You already have a pending withdrawal");
        
        const calcFee = fee || (amount * 0.05);
        const calcReceive = receiveAmount || (amount - calcFee);

        // Deduct balance and set pending
        await userRef.update({
            balance: (userData.balance || 0) - amount,
            fiatWithdrawPending: {
                amount: amount,
                fee: calcFee,
                receiveAmount: calcReceive,
                status: 'pending',
                timestamp: Date.now(),
                method: userData.fiatWallet.method,
                number: userData.fiatWallet.number,
                name: userData.fiatWallet.name
            }
        });
        
        // Notify Admin Group
        const config = require('./config.json');
        if (config.adminGroupId) {
            const msg = \`💸 <b>New Fiat Withdrawal</b>\\n\\n👤 User: <a href="tg://user?id=\${userId}">\${userData.first_name || 'User'}</a>\\n🆔 ID: \${userId}\\n\\n💰 Total Amount: <b>৳ \${amount} BDT</b>\\n📉 Fee (5%): <b>৳ \${calcFee.toFixed(2)} BDT</b>\\n✅ Send Exactly: <b>৳ \${calcReceive.toFixed(2)} BDT</b>\\n\\n🏦 Method: \${userData.fiatWallet.method}\\n📞 Number: \${userData.fiatWallet.number}\\n🏷 Name: \${userData.fiatWallet.name}\\n\\n👇 <b>Actions (Reply to this):</b>\\n- <code>Done</code> or <code>Ok</code> to mark paid\\n- <code>Wait</code> to set a timer\\n- <code>Reject [reason]</code> to refund\`;
            await bot.sendMessage(config.adminGroupId, msg, { parse_mode: 'HTML' });
        }
        
        res.json({ success: true });
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});`;

code = code.replace(regex, newEndpoint);

// Also fix the USDT mention in the refund logic when rejected!
code = code.replace(
    'Rejected withdrawal for ${targetUserId} and refunded ${amountToRefund} USDT.',
    'Rejected withdrawal for ${targetUserId} and refunded ${amountToRefund} BDT.'
);
code = code.replace(
    'Your ${amountToRefund} USDT has been refunded to your balance.',
    'Your ${amountToRefund} BDT has been refunded to your balance.'
);

fs.writeFileSync('index.js', code);
