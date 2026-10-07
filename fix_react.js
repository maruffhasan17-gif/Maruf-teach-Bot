const fs = require('fs');
let code = fs.readFileSync('admin/src/App.jsx', 'utf8');

const anchor = `fetch(\`\${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/stats\`)`;
const replace = `fetch(\`\${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/stats?_t=\${Date.now()}\`)`;

if (code.includes(anchor)) {
    code = code.replace(anchor, replace);
    fs.writeFileSync('admin/src/App.jsx', code, 'utf8');
    console.log("Patched React app fetch!");
} else {
    console.log("Fetch anchor not found");
}
