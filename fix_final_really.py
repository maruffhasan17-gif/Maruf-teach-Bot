import io

with io.open('index.js', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('axios.get(https://tonapi.io/v2/accounts//jettons/EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs);', 'axios.get(https://tonapi.io/v2/accounts//jettons/EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs);')
c = c.replace('axios.get(https://tonapi.io/v2/accounts/);', 'axios.get(https://tonapi.io/v2/accounts/);')

with io.open('index.js', 'w', encoding='utf-8') as f:
    f.write(c)
