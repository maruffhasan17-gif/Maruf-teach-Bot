const fs = require('fs');
let c = fs.readFileSync('index.js', 'utf8');

const oldCode = \            let seqno = 0;
            try {
                const seqnoRes = await axios.get(\\\https://tonapi.io/v2/wallet/\/seqno\\\);
                seqno = seqnoRes.data.seqno || 0;
            } catch(e) {}\;

const newCode = \            let seqno = 0;
            try {
                const seqnoRes = await axios.get(\\\https://tonapi.io/v2/wallet/\/seqno\\\);
                seqno = seqnoRes.data.seqno || 0;
            } catch(e) {}
            
            try {
                const accountRes = await axios.get(\\\https://tonapi.io/v2/accounts/\\\\);
                const balance = accountRes.data.balance || 0;
                if (balance < (amount * 1e9 + 10000000)) { // amount + 0.01 TON for gas
                    throw new Error('Insufficient Admin Balance');
                }
            } catch (e) {
                if (e.message === 'Insufficient Admin Balance') throw e;
                // Ignore API errors and try anyway if we couldn't fetch balance
            }\;

c = c.replace(oldCode, newCode);
fs.writeFileSync('index.js', c);
