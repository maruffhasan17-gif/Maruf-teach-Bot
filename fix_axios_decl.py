import io

with io.open('index.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
axios_seen = False
for line in lines:
    if "const axios = require('axios');" in line:
        if not axios_seen:
            new_lines.append(line)
            axios_seen = True
    else:
        new_lines.append(line)

with io.open('index.js', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
