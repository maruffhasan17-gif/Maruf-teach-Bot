import re

with open('admin/src/App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

pattern = re.compile(r"fetch\(\$\{import\.meta\.env\.VITE_API_URL \|\| 'http://localhost:3000'\}(/api/admin/[^\),]+)")
def repl(m):
    return f"fetch(`${{import.meta.env.VITE_API_URL || 'http://localhost:3000'}}{m.group(1)}`"

code = pattern.sub(repl, code)

with open('admin/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)
