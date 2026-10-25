const fs = require('fs');
let code = fs.readFileSync('admin/src/App.jsx', 'utf8');
code = code.replace("fetch(\/api/admin/orders)", "fetch(\\/api/admin/orders\)");
code = code.replace("fetch(\/api/admin/stats)", "fetch(\\/api/admin/stats\)");
code = code.replace("fetch(\/api/admin/orders/\/approve", "fetch(\\/api/admin/orders/\/approve\");
fs.writeFileSync('admin/src/App.jsx', code);
