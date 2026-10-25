const fs = require('fs');
let code = fs.readFileSync('admin/src/App.jsx', 'utf8');

// Replace fetch(\) with fetch(\\\)
const backtick = String.fromCharCode(96);
code = code.replace(/fetch\(\$\{import\.meta\.env\.VITE_API_URL \|\| 'http:\/\/localhost:3000'\}(\/api\/admin\/orders)\)/g, "fetch(" + backtick + "\" + backtick + ")");
code = code.replace(/fetch\(\$\{import\.meta\.env\.VITE_API_URL \|\| 'http:\/\/localhost:3000'\}(\/api\/admin\/approve-withdraw),/g, "fetch(" + backtick + "\" + backtick + ",");
code = code.replace(/fetch\(\$\{import\.meta\.env\.VITE_API_URL \|\| 'http:\/\/localhost:3000'\}(\/api\/admin\/approve-buy),/g, "fetch(" + backtick + "\" + backtick + ",");
code = code.replace(/fetch\(\$\{import\.meta\.env\.VITE_API_URL \|\| 'http:\/\/localhost:3000'\}(\/api\/admin\/bonus),/g, "fetch(" + backtick + "\" + backtick + ",");
code = code.replace(/fetch\(\$\{import\.meta\.env\.VITE_API_URL \|\| 'http:\/\/localhost:3000'\}(\/api\/admin\/limits),/g, "fetch(" + backtick + "\" + backtick + ",");

fs.writeFileSync('admin/src/App.jsx', code);
console.log("Patched successfully");
