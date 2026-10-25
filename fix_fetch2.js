const fs = require('fs');
let code = fs.readFileSync('admin/src/App.jsx', 'utf8');

code = code.replace(
    /fetch\(\\\\/api\/admin\/orders\)/g,
    "fetch(\\\\/api/admin/orders\\\)"
);

code = code.replace(
    /fetch\(\\\\/api\/admin\/approve-buy/g,
    "fetch(\\\\/api/admin/approve-buy\\\"
);

fs.writeFileSync('admin/src/App.jsx', code);
