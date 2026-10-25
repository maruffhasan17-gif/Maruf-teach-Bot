const fs = require('fs');
let code = fs.readFileSync('admin/src/App.jsx', 'utf8');
code = code.replace(/fetch\(\$\{import\.meta\.env\.VITE_API_URL \|\| 'http:\/\/localhost:3000'\}\/api\/admin\/orders\)/g, "fetch(\\/api/admin/orders\)");
code = code.replace(/fetch\(\$\{import\.meta\.env\.VITE_API_URL \|\| 'http:\/\/localhost:3000'\}\/api\/admin\/stats\)/g, "fetch(\\/api/admin/stats\)");
code = code.replace(/fetch\(\$\{import\.meta\.env\.VITE_API_URL \|\| 'http:\/\/localhost:3000'\}\/api\/admin\/orders\/\$\{id\}\/approve\/g, "fetch(\\/api/admin/orders/\/approve\");
fs.writeFileSync('admin/src/App.jsx', code);
console.log("Patched admin fetch urls");
