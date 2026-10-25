const fs = require('fs');
let code = fs.readFileSync('miniapp/src/App.jsx', 'utf8');

// Replace {amount ? estimatedTk : '0.00'} with {amount ? estimatedCrypto : '0.00'} in PremiumSellPage
code = code.replace(
    /\{amount \? estimatedTk : '0\.00'\}/g,
    "{amount ? estimatedCrypto : '0.00'}"
);

// We need to implement limits!
// For Buy: 20 TK to 30000 TK
// For Sell: 1 TK to 20000 TK

// Let's modify handleSell to check limits
const sellLimitCheck = \if (parseFloat(amount) < 1) return WebApp.showAlert("Minimum sell amount is 1 BDT");
    if (parseFloat(amount) > 20000) return WebApp.showAlert("Maximum sell amount is 20000 BDT");\;

code = code.replace(
    'if(!userTonAddress || !amount) return;',
    \if(!userTonAddress || !amount) return;
    \\
);

// Let's modify handleSubmit in BuyPage to check limits
// In Buy page, amount is TK.
const buyLimitCheck = \if (parseFloat(amount) < 20) return WebApp.showAlert("Minimum buy amount is 20 BDT");
          if (parseFloat(amount) > 30000) return WebApp.showAlert("Maximum buy amount is 30000 BDT");\;

code = code.replace(
    'if(!isValidStep2) return;',
    \if(!isValidStep2) return;\n          \\
);

// Wait, the "Continue" button in Step 1 of Buy Page should also check limits!
// In Buy page:
/*
const handleContinue = () => {
    if(isValidStep1) { setStep(2); window.scrollTo({top:0, behavior:'smooth'}); }
};
*/
const handleContinueReplace = \const handleContinue = () => {
          \
          if(isValidStep1) { setStep(2); window.scrollTo({top:0, behavior:'smooth'}); }
      };\;

code = code.replace(
    /const handleContinue = \(\) => \{\s*if\(isValidStep1\) \{ setStep\(2\); window\.scrollTo\(\{top:0, behavior:'smooth'\}\); \}\s*\};/g,
    handleContinueReplace
);

fs.writeFileSync('miniapp/src/App.jsx', code);
