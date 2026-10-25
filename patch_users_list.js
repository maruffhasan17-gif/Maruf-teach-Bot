const fs = require('fs');
let code = fs.readFileSync('admin/src/App.jsx', 'utf8');

code = code.replace("data.users.length === 0", "(!data.users || data.users.length === 0)");
code = code.replace("data.users.map", "(data.users || []).map");

fs.writeFileSync('admin/src/App.jsx', code);
