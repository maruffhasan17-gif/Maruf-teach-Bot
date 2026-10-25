const fs = require('fs');
let code = fs.readFileSync('admin/src/App.jsx', 'utf8');

code = code.replace(
    "{u.status.toUpperCase()}",
    "{u.status ? u.status.toUpperCase() : 'UNKNOWN'}"
);

fs.writeFileSync('admin/src/App.jsx', code);
