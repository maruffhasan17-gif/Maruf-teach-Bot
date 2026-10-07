const fs = require('fs');

let content = fs.readFileSync('index.js', 'utf8');

// 1. Update GET /api/miniapp/user/:id to include fiatWallet and fiatWithdrawPending
const oldGetUser =         const userDoc = await db.collection('users').doc(userId.toString()).get();
        if (!userDoc.exists) {
            return res.json({ balance: 0 });
        }
        res.json({ balance: userDoc.data().balance || 0 });;

const newGetUser =         const userDoc = await db.collection('users').doc(userId.toString()).get();
        if (!userDoc.exists) {
            return res.json({ balance: 0 });
        }
        const data = userDoc.data();
        res.json({ 
            balance: data.balance || 0,
            fiatWallet: data.fiatWallet || null,
            fiatWithdrawPending: data.fiatWithdrawPending || null
        });;

content = content.replace(oldGetUser, newGetUser);

// 2. Add API endpoints for saving wallet and requesting withdrawal
const newEndpoints = 
app.post('/api/miniapp/save-wallet', async (req, res) => {
    try {
        const { userId, method, number, name } = req.body;
        await db.collection('users').doc(userId.toString()).update({
            fiatWallet: { method, number, name }
        });
        res.json({ success: true });
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/miniapp/withdraw-fiat', async (req, res) => {
    try {
        const { userId, amount } = req.body;
        const userRef = db.collection('users').doc(userId.toString());
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) throw new Error("User not found");
        const userData = userDoc.data();
        if ((userData.balance || 0) < amount) throw new Error("Insufficient balance");
        if (userData.fiatWithdrawPending) throw new Error("You already have a pending withdrawal");
        
        // Deduct balance and set pending
        await userRef.update({
            balance: (userData.balance || 0) - amount,
            fiatWithdrawPending: {
                amount: amount,
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
            const msg = \?? <b>New Fiat Withdrawal</b>\\n\\n?? User: <a href="tg://user?id=\">\</a>\\n?? ID: \\\n?? Amount: <b>\ USDT</b>\\n?? Method: \\\n?? Number: \\\n?? Name: \\\n\\n?? <b>Actions (Reply to this):</b>\\n- <code>Done</code> or <code>Ok</code> to mark paid\\n- <code>Wait</code> to set a timer\\n- <code>Reject [reason]</code> to refund\;
            await bot.sendMessage(config.adminGroupId, msg, { parse_mode: 'HTML' });
        }
        
        res.json({ success: true });
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});
;

if (!content.includes('/api/miniapp/withdraw-fiat')) {
    content = content.replace("app.post('/api/withdraw'", newEndpoints + "\napp.post('/api/withdraw'");
}

// 3. Inject Bot Reply Logic
const botReplyLogic = 
                // --- FIAT WITHDRAWAL LOGIC ---
                if (caption.includes("New Fiat Withdrawal")) {
                    const idMatch = caption.match(/ID: (\\d+)/);
                    if (idMatch && idMatch[1]) {
                        const targetUserId = idMatch[1];
                        
                        if (['done', 'ok'].includes(replyText)) {
                            await db.collection('users').doc(targetUserId).update({
                                fiatWithdrawPending: null
                            });
                            bot.sendMessage(chatId, \? Marked withdrawal for \ as PAID.\);
                            bot.sendMessage(targetUserId, \?? <b>Withdrawal Successful!</b>\\nYour payment has been sent to your wallet. Thank you!\, { parse_mode: 'HTML' });
                        } 
                        else if (replyText === 'wt' || replyText === 'wait') {
                            const sentMsg = await bot.sendMessage(chatId, \? Reply to THIS message with the time format.\\n\\nMinutes: <code>10:00</code>\\nHours: <code>1:30:50</code>\\n\\nUser ID: \\, { parse_mode: 'HTML' });
                            // We rely on the admin replying to THIS prompt next
                        }
                        else if (replyText.startsWith('reject')) {
                            const reason = text.substring(6).trim() || 'No reason provided';
                            const userRef = db.collection('users').doc(targetUserId);
                            const userDoc = await userRef.get();
                            if (userDoc.exists && userDoc.data().fiatWithdrawPending) {
                                const amountToRefund = userDoc.data().fiatWithdrawPending.amount;
                                await userRef.update({
                                    balance: (userDoc.data().balance || 0) + amountToRefund,
                                    fiatWithdrawPending: null
                                });
                                bot.sendMessage(chatId, \? Rejected withdrawal for \ and refunded \ USDT.\\nReason: \\);
                                bot.sendMessage(targetUserId, \? <b>Withdrawal Rejected</b>\\nYour \ USDT has been refunded to your balance.\\nReason: \\, { parse_mode: 'HTML' });
                            }
                        }
                    }
                    return;
                }
                
                // --- FIAT WAIT TIMER LOGIC ---
                if (caption.includes("Reply to THIS message with the time format")) {
                    const idMatch = caption.match(/User ID: (\\d+)/);
                    if (idMatch && idMatch[1]) {
                        const targetUserId = idMatch[1];
                        let totalSeconds = 0;
                        const parts = text.split(':');
                        if (parts.length === 2) {
                            // MM:SS
                            totalSeconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
                        } else if (parts.length === 3) {
                            // HH:MM:SS
                            totalSeconds = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
                        }
                        
                        if (totalSeconds > 0) {
                            const endTime = Date.now() + (totalSeconds * 1000);
                            await db.collection('users').doc(targetUserId).update({
                                'fiatWithdrawPending.status': 'waiting',
                                'fiatWithdrawPending.endTime': endTime
                            });
                            bot.sendMessage(chatId, \? Timer set for \. They will see the countdown in the app.\);
                        } else {
                            bot.sendMessage(chatId, \?? Invalid time format. Please use MM:SS or HH:MM:SS\);
                        }
                    }
                    return;
                }
;

// Find where to inject the reply logic
const injectionPoint = "if (caption.includes(\"New MiniApp Task Submission\")) {";
if (content.includes(injectionPoint) && !content.includes("FIAT WITHDRAWAL LOGIC")) {
    content = content.replace(injectionPoint, botReplyLogic + "\n                " + injectionPoint);
}

fs.writeFileSync('index.js', content);
console.log("Patched index.js");
