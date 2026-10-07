const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

const newLogic = `
                // --- MINI APP TASK REPLY LOGIC ---
                if (caption.includes("New MiniApp Task Submission")) {
                    const addrMatch = caption.match(/Address: \`([a-zA-Z0-9_-]+)\`/);
                    if (addrMatch && addrMatch[1]) {
                        const targetAddress = addrMatch[1];
                        if (replyText === 'ok') {
                            bot.sendMessage(chatId, \`⏳ Paying \${targetAddress} via TonAPI...\`);
                            // Send payment directly
                            try {
                                const wallet = WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey });
                                const seqno = await wallet.getSeqno(tonapiClient);
                                const transfer = wallet.createTransfer({
                                    seqno,
                                    secretKey: keyPair.secretKey,
                                    messages: [internal({
                                        to: targetAddress,
                                        value: '0.05',
                                        body: 'Gift from VIC Mining Event'
                                    })]
                                });
                                
                                const extMsg = external({ to: wallet.address, init: seqno === 0 ? wallet.init : null, body: transfer });
                                const extCell = beginCell().store(storeMessage(extMsg)).endCell();
                                const boc = extCell.toBoc().toString('base64');

                                await axios.post('https://tonapi.io/v2/blockchain/message', { boc });
                                bot.sendMessage(targetUserId, \`✅ **Payment Sent!**\n\n0.05 TON has been sent to your wallet for completing the Free TON event!\`);
                                bot.sendMessage(chatId, \`✅ Successfully paid \${targetUserId} for MiniApp event.\`);
                                
                                // Clean up DB
                                const tasks = await db.collection('miniapp_tasks').where('userId', '==', targetUserId).get();
                                tasks.forEach(t => t.ref.update({ status: 'approved' }));
                                
                            } catch (e) {
                                bot.sendMessage(chatId, \`❌ Payment failed: \${e.message}\`);
                            }
                        } else if (replyText === 'wrong') {
                            const rejectText = \`❌ **Verification Failed.** You are ineligible for the Free TON event.\`;
                            bot.sendMessage(targetUserId, rejectText, { parse_mode: 'Markdown' });
                            bot.sendMessage(chatId, \`❌ Rejected user \${targetUserId} for MiniApp event.\`);
                            
                            const tasks = await db.collection('miniapp_tasks').where('userId', '==', targetUserId).get();
                            tasks.forEach(t => t.ref.update({ status: 'rejected' }));
                        }
                        return; // Stop processing
                    }
                }
                // ---------------------------------
`;

code = code.replace(
    "const match = caption.match(/ID:\\s*(\\d+)/);",
    newLogic + "\n                const match = caption.match(/ID:\\s*(\\d+)/);"
);

// Also I need to modify the miniapp/task endpoint to include the ID clearly for `targetUserId` regex, or parse `tg://user?id=X` instead.
// Actually `targetUserId` is parsed via `/ID: (\d+)/` in the old logic. So I should make sure the Mini App message contains `ID: userId` for targetUserId extraction.

code = code.replace(
    "const msg = `🎁 <b>New MiniApp Task Submission</b>\\n\\n👤 User: <a href=\"tg://user?id=${userId}\">${name}</a>\\n💰 Type: Free TON (VIC)\\n📍 Address: \\`${address}\\`\\n\\nReply with 'Ok' to approve or 'Wrong' to reject.`;",
    "const msg = `🎁 <b>New MiniApp Task Submission</b>\\n\\n👤 User: <a href=\"tg://user?id=${userId}\">${name}</a>\\n🆔 ID: ${userId}\\n💰 Type: Free TON (VIC)\\n📍 Address: \\`${address}\\`\\n\\nReply with 'Ok' to approve or 'Wrong' to reject.`;"
);

fs.writeFileSync('index.js', code, 'utf8');
console.log("Patched Mini App Reply Logic");
