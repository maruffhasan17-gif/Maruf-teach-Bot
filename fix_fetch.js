const fs = require('fs');
let code = fs.readFileSync('admin/src/App.jsx', 'utf8');

// Replace local-only fetches with the environment variable one
code = code.replace(
    /fetch\('\/api\/admin\/orders'\)/g,
    "fetch(${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/admin/orders)"
);
code = code.replace(
    /fetch\('\/api\/admin\/approve-buy'/g,
    "fetch(${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/admin/approve-buy'"
);

fs.writeFileSync('admin/src/App.jsx', code);
