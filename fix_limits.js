const fs = require('fs');
let code = fs.readFileSync('miniapp/src/App.jsx', 'utf8');

// Fix the estimatedTk ReferenceError in Sell page
code = code.replace(
    /\{amount \? estimatedTk : '0\.00'\}/g,
    "{amount ? estimatedCrypto : '0.00'}"
);

// Sell Limits
const sellLimitCheck = `if (parseFloat(amount) < 1) return window.Telegram?.WebApp?.showAlert("Minimum sell amount is 1 BDT");
      if (parseFloat(amount) > 20000) return window.Telegram?.WebApp?.showAlert("Maximum sell amount is 20000 BDT");`;

code = code.replace(
    'if(!userTonAddress || !amount) return;',
    `if(!userTonAddress || !amount) return;\n      ${sellLimitCheck}`
);

// Buy Limits
const buyLimitCheck = `if (parseFloat(amount) < 20) return window.Telegram?.WebApp?.showAlert("Minimum buy amount is 20 BDT");
          if (parseFloat(amount) > 30000) return window.Telegram?.WebApp?.showAlert("Maximum buy amount is 30000 BDT");`;

const handleContinueReplace = `const handleContinue = () => {
          ${buyLimitCheck}
          if(isValidStep1) { setStep(2); window.scrollTo({top:0, behavior:'smooth'}); }
      };`;

code = code.replace(
    /const handleContinue = \(\) => \{\s*if\(isValidStep1\) \{ setStep\(2\); window\.scrollTo\(\{top:0, behavior:'smooth'\}\); \}\s*\};/g,
    handleContinueReplace
);

fs.writeFileSync('miniapp/src/App.jsx', code);
