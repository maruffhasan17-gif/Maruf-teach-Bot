const fs = require('fs');

let c = fs.readFileSync('index.js', 'utf8');

// 1. Invalidate ordersCache helper
if (!c.includes('function invalidateOrdersCache')) {
    c = c.replace(
        'let ordersCache = { data: null, timestamp: 0 };',
        `let ordersCache = { data: null, timestamp: 0 };
function invalidateOrdersCache() {
    ordersCache = { data: null, timestamp: 0 };
}`
    );
    console.log("Added invalidateOrdersCache helper");
}

// 2. Update checkUserCommunities to be STRICT (no false positive inChannel/inGroup)
const oldCheckFunc = `async function checkUserCommunities(userId) {
    let inChannel = false;
    let inGroup = false;
    const valid = ['creator', 'administrator', 'member', 'restricted'];
    try {
        const c1 = await bot.getChatMember(OFFICIAL_CHANNEL, userId);
        inChannel = valid.includes(c1?.status);
    } catch (e) {
        console.warn('Channel check warning:', e.message);
        if (!e.message.includes('PARTICIPANT_ID_INVALID') && !e.message.includes('USER_NOT_PARTICIPANT') && !e.message.includes('chat not found')) {
            inChannel = true;
        }
    }
    try {
        const c2 = await bot.getChatMember(PAYOUT_GROUP, userId);
        inGroup = valid.includes(c2?.status);
    } catch (e) {
        console.warn('Group check warning:', e.message);
        if (!e.message.includes('PARTICIPANT_ID_INVALID') && !e.message.includes('USER_NOT_PARTICIPANT') && !e.message.includes('chat not found')) {
            inGroup = true;
        }
    }
    return {
        inChannel,
        inGroup,
        allJoined: inChannel && inGroup
    };
}`;

const newCheckFunc = `async function checkUserCommunities(userId) {
    let inChannel = false;
    let inGroup = false;
    const valid = ['creator', 'administrator', 'member', 'restricted'];
    try {
        const c1 = await bot.getChatMember(OFFICIAL_CHANNEL, userId);
        inChannel = valid.includes(c1?.status);
    } catch (e) {
        console.warn('Channel check warning (@maruf_teach):', e.message);
        inChannel = false;
    }
    try {
        const c2 = await bot.getChatMember(PAYOUT_GROUP, userId);
        inGroup = valid.includes(c2?.status);
    } catch (e) {
        console.warn('Group check warning (@bd_trust_pay_payout):', e.message);
        inGroup = false;
    }
    return {
        inChannel,
        inGroup,
        allJoined: Boolean(inChannel && inGroup)
    };
}`;

if (c.includes(oldCheckFunc)) {
    c = c.replace(oldCheckFunc, newCheckFunc);
    console.log("Updated checkUserCommunities to strict mode");
} else {
    // Regex replace for CRLF
    c = c.replace(
        /async function checkUserCommunities\(userId\) \{[\s\S]*?return \{\s*inChannel,\s*inGroup,\s*allJoined:\s*inChannel && inGroup\s*\};\s*\}/,
        newCheckFunc
    );
    console.log("Regex replaced checkUserCommunities to strict mode");
}

// 3. Update /api/miniapp/check-membership error fallback to allJoined: false
c = c.replace(
    /\/\/ Community verification endpoints for MiniApp[\s\S]*?app\.get\('\/api\/miniapp\/check-membership', async \(req, res\) => \{[\s\S]*?res\.json\(\{\s*allJoined: true,\s*inChannel: true,\s*inGroup: true,\s*channelLink: OFFICIAL_CHANNEL_URL,\s*groupLink: PAYOUT_GROUP_URL\s*\}\);\s*\}\s*\}\);/,
    `// Community verification endpoints for MiniApp
app.get('/api/miniapp/check-membership', async (req, res) => {
    try {
        const rawUserId = req.query.userId;
        const userId = parseInt(rawUserId);
        if (!userId || userId === 123456789 || isNaN(userId)) {
            return res.json({ 
                allJoined: false, 
                inChannel: false, 
                inGroup: false, 
                channelLink: OFFICIAL_CHANNEL_URL, 
                groupLink: PAYOUT_GROUP_URL 
            });
        }
        const check = await checkUserCommunities(userId);
        res.json({
            ...check,
            channelLink: OFFICIAL_CHANNEL_URL,
            groupLink: PAYOUT_GROUP_URL
        });
    } catch (e) {
        console.warn('check-membership error:', e.message);
        res.json({ 
            allJoined: false, 
            inChannel: false, 
            inGroup: false, 
            channelLink: OFFICIAL_CHANNEL_URL, 
            groupLink: PAYOUT_GROUP_URL 
        });
    }
});`
);
console.log("Updated /api/miniapp/check-membership endpoint");

// 4. Update sendTonOnChain to include comment "TrustPay"
c = c.replace(
    /body:\s*"Crypto Buy payout from Trust Pay Bot"/,
    `body: (function() {
                    const { beginCell } = require('@ton/core');
                    return beginCell().storeUint(0, 32).storeStringTail("TrustPay").endCell();
                })()`
);

// 5. Update sendJettonUsdtOnChain to include comment "TrustPay" in forward payload
c = c.replace(
    /const jettonBody = beginCell\(\)[\s\S]*?\.endCell\(\);[\r\n\s]*const transfer = wallet\.createTransfer/,
    `const commentCell = beginCell()
        .storeUint(0, 32)
        .storeStringTail("TrustPay")
        .endCell();

    const jettonBody = beginCell()
        .storeUint(0xf8a7ea5, 32)
        .storeUint(0, 64)
        .storeCoins(amountInMicro)
        .storeAddress(Address.parse(destination))
        .storeAddress(Address.parse(walletAddrStr))
        .storeBit(0) // custom payload
        .storeCoins(1) // forward_ton_amount
        .storeBit(1) // forward_payload in ref
        .storeRef(commentCell)
        .endCell();

    const transfer = wallet.createTransfer`
);

// 6. In /api/miniapp/buy-crypto, deduct gas fee (0.005 for GRAM/TON, 0.03 for USDT) and send net amount
c = c.replace(
    /\/\/ 4\. BROADCAST ON-CHAIN TRANSACTION![\r\n\s]*let txResult = null;[\r\n\s]*try \{[\r\n\s]*if \(isTonAsset\) \{[\r\n\s]*txResult = await sendTonOnChain\(receiveAddress, cryptoAmount\);[\r\n\s]*\} else if \(asset === 'USDT'\) \{[\r\n\s]*txResult = await sendJettonUsdtOnChain\(receiveAddress, cryptoAmount\);[\r\n\s]*\}/,
    `// 4. BROADCAST ON-CHAIN TRANSACTION!
        // Deduct gas fee from cryptoAmount (0.005 for TON/GRAM, 0.03 for USDT)
        const gasFee = (asset === 'USDT') ? 0.03 : 0.005;
        const netCryptoAmount = Math.max(0.0001, parseFloat((cryptoAmount - gasFee).toFixed(6)));

        let txResult = null;
        try {
            if (isTonAsset) {
                txResult = await sendTonOnChain(receiveAddress, netCryptoAmount);
            } else if (asset === 'USDT') {
                txResult = await sendJettonUsdtOnChain(receiveAddress, netCryptoAmount);
            }`
);

// 7. In /api/admin/approve-buy, deduct gas fee and send net amount
c = c.replace(
    /if \(order\.asset === 'TON' \|\| order\.asset === 'GRAM'\) \{[\r\n\s]*try \{[\r\n\s]*txResult = await sendTonOnChain\(order\.receiveAddress, order\.amount\);/,
    `const gasFee = (order.asset === 'USDT') ? 0.03 : 0.005;
        const netCryptoAmount = Math.max(0.0001, parseFloat(((order.amount || 0) - gasFee).toFixed(6)));

        if (order.asset === 'TON' || order.asset === 'GRAM') {
            try {
                txResult = await sendTonOnChain(order.receiveAddress, netCryptoAmount);`
);

c = c.replace(
    /\} else if \(order\.asset === 'USDT'\) \{[\r\n\s]*try \{[\r\n\s]*txResult = await sendJettonUsdtOnChain\(order\.receiveAddress, order\.amount\);/,
    `} else if (order.asset === 'USDT') {
            try {
                txResult = await sendJettonUsdtOnChain(order.receiveAddress, netCryptoAmount);`
);

// 8. In /api/admin/orders, explicitly pass status: data.status || 'pending'
c = c.replace(
    /withdrawals\.push\(\{[\r\n\s]*id: doc\.id,[\r\n\s]*withdrawId: doc\.id,[\r\n\s]*userId: data\.userId,[\r\n\s]*firstName: data\.name \|\| 'User',[\r\n\s]*\.\.\.data,[\r\n\s]*fiatWithdrawPending: data[\r\n\s]*\}\);/,
    `withdrawals.push({
                    id: doc.id,
                    withdrawId: doc.id,
                    userId: data.userId,
                    firstName: data.name || 'User',
                    status: data.status || 'pending',
                    ...data,
                    fiatWithdrawPending: data
                });`
);

// 9. Invalidate ordersCache whenever cashouts are approved/rejected
c = c.replace(
    /await doApproveWithdraw\(docId, userId\);/,
    `await doApproveWithdraw(docId, userId);
            invalidateOrdersCache();`
);
c = c.replace(
    /await doRejectWithdraw\(docId, userId, refundAmt\);/,
    `await doRejectWithdraw(docId, userId, refundAmt);
            invalidateOrdersCache();`
);
c = c.replace(
    /res\.json\(\{ success: true \}\);\s*\}\s*catch\(e\)\s*\{\s*console\.error\("Approve withdraw error:"/,
    `invalidateOrdersCache();
        res.json({ success: true });
    } catch(e) {
        console.error("Approve withdraw error:"`
);
c = c.replace(
    /res\.json\(\{ success: true, message: `Withdrawal rejected and ৳\$\{refundAmt\} refunded to user\.` \}\);\s*\}\s*catch\(e\)\s*\{\s*console\.error\("Reject withdraw error:"/,
    `invalidateOrdersCache();
        res.json({ success: true, message: \`Withdrawal rejected and ৳\${refundAmt} refunded to user.\` });
    } catch(e) {
        console.error("Reject withdraw error:"`
);

fs.writeFileSync('index.js', c, 'utf8');
console.log("Finished updating index.js!");
