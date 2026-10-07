import io
import re

with io.open('index.js', 'r', encoding='utf-8') as f:
    c = f.read()

c = re.sub(
    r'axios\.get\(https://tonapi\.io/v2/accounts//jettons/EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs\);',
    r'axios.get(https://tonapi.io/v2/accounts//jettons/EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs);',
    c
)

c = re.sub(
    r'axios\.get\(https://tonapi\.io/v2/accounts/\);',
    r'axios.get(https://tonapi.io/v2/accounts/);',
    c
)

with io.open('index.js', 'w', encoding='utf-8') as f:
    f.write(c)
