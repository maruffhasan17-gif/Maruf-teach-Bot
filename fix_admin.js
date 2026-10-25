const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');
code = code.replace(/admin\.firestore\.FieldValue/g, 'FieldValue');
fs.writeFileSync('index.js', code);
console.log("Fixed FieldValue references");
