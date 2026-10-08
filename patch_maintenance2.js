const fs = require('fs');
let c = fs.readFileSync('index.js', 'utf8');

const regex = /const maintenanceText = "([^]+?)";/g;
c = c.replace(regex, "const maintenanceText = \\\;");

fs.writeFileSync('index.js', c, 'utf8');
