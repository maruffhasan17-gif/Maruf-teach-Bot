import sys

with open('admin/src/App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace(\"fetch(/api/admin/orders)\", \"fetch(\\/api/admin/orders)\")
code = code.replace(\"fetch(/api/admin/stats)\", \"fetch(\\/api/admin/stats)\")
code = code.replace(\"fetch(/api/admin/orders//approve\", \"fetch(\\/api/admin/orders/\\/approve\")

with open('admin/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)
