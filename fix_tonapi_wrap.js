const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

const target1 = `const boc = transfer.toBoc().toString('base64');
            const broadcastRes = await axios.post('https://tonapi.io/v2/blockchain/message', { boc });`;

const new1 = `const { external, storeMessage, beginCell } = require('@ton/ton');
            const extMessage = external({
                to: wallet.address,
                init: seqno === 0 ? wallet.init : null,
                body: transfer
            });
            const boc = beginCell().store(storeMessage(extMessage)).endCell().toBoc().toString('base64');
            const broadcastRes = await axios.post('https://tonapi.io/v2/blockchain/message', { boc });`;

const target2 = `const boc = transfer.toBoc().toString('base64');
            await axios.post('https://tonapi.io/v2/blockchain/message', { boc });`;

const new2 = `const { external, storeMessage, beginCell } = require('@ton/ton');
            const extMessage = external({
                to: wallet.address,
                init: seqno === 0 ? wallet.init : null,
                body: transfer
            });
            const boc = beginCell().store(storeMessage(extMessage)).endCell().toBoc().toString('base64');
            await axios.post('https://tonapi.io/v2/blockchain/message', { boc });`;

code = code.replace(target1, new1);
code = code.replace(target2, new2);

fs.writeFileSync('index.js', code, 'utf8');
console.log("Patched!");
