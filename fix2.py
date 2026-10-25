import re
with open('admin/src/App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

code = re.sub(r'className=\{([^{}"]+)\}', r'className="\1"', code)

with open('admin/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)
