import io
import re

with io.open('index.js', 'r', encoding='utf-8') as f:
    content = f.read()

old_logic = """if (response.data && response.data.balances && response.data.balances.length > 0) {
                userJettonWallet = response.data.balances[0].wallet_address.address;
            } else {"""

new_logic = """if (response.data && response.data.wallet_address) {
                userJettonWallet = response.data.wallet_address.address;
            } else {"""

content = content.replace(old_logic, new_logic)

with io.open('index.js', 'w', encoding='utf-8') as f:
    f.write(content)
