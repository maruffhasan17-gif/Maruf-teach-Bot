const fs = require('fs');
let code = fs.readFileSync('miniapp/src/App.jsx', 'utf8');

code = code.replace(/if\(isValidStep1\) setStep\(2\);/g, "if(isValidStep1) { setStep(2); window.scrollTo({top:0, behavior:'smooth'}); }");
code = code.replace(/setStep\(3\);/g, "setStep(3); window.scrollTo({top:0, behavior:'smooth'});");

fs.writeFileSync('miniapp/src/App.jsx', code);
