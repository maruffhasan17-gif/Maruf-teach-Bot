const fs = require('fs');
let code = fs.readFileSync('miniapp/src/App.jsx', 'utf8');

// Update handleContinue definition
const buyLimitCheck = \if (parseFloat(amount) < 20) return window.Telegram?.WebApp?.showAlert("Minimum buy amount is 20 BDT");
          if (parseFloat(amount) > 30000) return window.Telegram?.WebApp?.showAlert("Maximum buy amount is 30000 BDT");\;

code = code.replace(
    'const handleContinue = () => {',
    \const handleContinue = (e) => {
          if (e && e.preventDefault) e.preventDefault();
          \\
);

// Update onClick to onPointerDown for the PAYMENT button
code = code.replace(
    'onClick={handleContinue} disabled={!isValidStep1}',
    'onPointerDown={handleContinue} disabled={!isValidStep1}'
);

fs.writeFileSync('miniapp/src/App.jsx', code);
