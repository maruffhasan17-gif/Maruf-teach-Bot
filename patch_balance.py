import io, re
with io.open('index.js', 'r', encoding='utf-8') as f:
    c = f.read()

pattern = r"(let seqno = 0;[\s\S]*?\} catch\(e\) \{\})"

new_code = '''\g<1>
            
            try {
                const accountRes = await axios.get(https://tonapi.io/v2/accounts/);
                const balance = accountRes.data.balance || 0;
                if (balance < (amount * 1e9 + 10000000)) {
                    throw new Error('Insufficient Admin Balance');
                }
            } catch (e) {
                if (e.message === 'Insufficient Admin Balance') throw e;
            }'''

c = re.sub(pattern, new_code, c, count=1)
with io.open('index.js', 'w', encoding='utf-8') as f:
    f.write(c)
print("Replaced!")
