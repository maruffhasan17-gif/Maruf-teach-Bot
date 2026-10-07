const fs = require('fs');
let code = fs.readFileSync('miniapp/src/App.jsx', 'utf8');

const badCode = `  //
    if(!address) return;
    // We will send this to backend later
    setSubmitted(true);
    setTimeout(() => onClose(), 2500);
  };`;

code = code.replace(badCode, "");
fs.writeFileSync('miniapp/src/App.jsx', code, 'utf8');
console.log("Fixed App.jsx");
