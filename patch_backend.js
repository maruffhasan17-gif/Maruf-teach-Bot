const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

const apiCode = `
// ==================== MINI APP APIs ====================
app.get('/api/miniapp/user/:id', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const userDoc = await db.collection('users').doc(userId.toString()).get();
        if (!userDoc.exists) {
            return res.json({ balance: 0 });
        }
        res.json({ balance: userDoc.data().balance || 0 });
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/miniapp/task', async (req, res) => {
    try {
        const { userId, name, username, address } = req.body;
        
        const docRef = await db.collection('miniapp_tasks').add({
            userId,
            name,
            username,
            address,
            status: 'pending',
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        // Send to Admin Group
        const msg = \`🎁 <b>New MiniApp Task Submission</b>\n\n👤 User: <a href="tg://user?id=\${userId}">\${name}</a>\n💰 Type: Free TON (VIC)\n📍 Address: \`\${address}\`\n\nReply with 'Ok' to approve or 'Wrong' to reject.\`;
        
        const sentMsg = await bot.sendMessage(adminGroupId, msg, { parse_mode: 'HTML' });
        
        // Save msgId for reply tracking
        await db.collection('miniapp_tasks').doc(docRef.id).update({
            messageId: sentMsg.message_id
        });

        res.json({ success: true });
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/miniapp/sell', async (req, res) => {
    try {
        const { userId, asset, amount, estimatedTk, wallet } = req.body;
        
        // Save to DB
        await db.collection('miniapp_sells').add({
            userId, asset, amount, estimatedTk, wallet,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        // Increment user balance
        const userRef = db.collection('users').doc(userId.toString());
        const userDoc = await userRef.get();
        if (userDoc.exists) {
            await userRef.update({ balance: admin.firestore.FieldValue.increment(estimatedTk) });
        } else {
            await userRef.set({ balance: estimatedTk, joinedAt: admin.firestore.FieldValue.serverTimestamp() });
        }

        res.json({ success: true });
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});
// =======================================================
`;

if (!code.includes('/api/miniapp/user/:id')) {
    code = code.replace(
        "app.get('/api/stats', async (req, res) => {",
        apiCode + "\napp.get('/api/stats', async (req, res) => {"
    );
    fs.writeFileSync('index.js', code, 'utf8');
    console.log("Added backend APIs");
} else {
    console.log("Backend APIs already exist");
}
