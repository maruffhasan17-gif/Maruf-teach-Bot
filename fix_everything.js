const fs = require('fs');
let code = fs.readFileSync('miniapp/src/App.jsx', 'utf8');

// The handleContinue is already defined as:
/*
const handleContinue = () => {
    if(isValidStep1) { setStep(2); window.scrollTo({top:0, behavior:'smooth'}); }
};
*/
// Let's replace it with the limits check and e.preventDefault
const oldHandleContinue = `const handleContinue = () => {
        if(isValidStep1) { setStep(2); window.scrollTo({top:0, behavior:'smooth'}); }
    };`;
    
const newHandleContinue = `const handleContinue = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (parseFloat(amount) < 20) return window.Telegram?.WebApp?.showAlert("Minimum buy amount is 20 BDT");
        if (parseFloat(amount) > 30000) return window.Telegram?.WebApp?.showAlert("Maximum buy amount is 30000 BDT");
        if(isValidStep1) { setStep(2); window.scrollTo({top:0, behavior:'smooth'}); }
    };`;

code = code.replace(oldHandleContinue, newHandleContinue);
// Fallback if formatting is different
if (!code.includes("if (parseFloat(amount) < 20)")) {
    code = code.replace(
        /const handleContinue = \(\) => \{\s*if\(isValidStep1\)/g,
        `const handleContinue = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (parseFloat(amount) < 20) return window.Telegram?.WebApp?.showAlert("Minimum buy amount is 20 BDT");
        if (parseFloat(amount) > 30000) return window.Telegram?.WebApp?.showAlert("Maximum buy amount is 30000 BDT");
        if(isValidStep1)`
    );
}

// Button replacement
code = code.replace(
    'onClick={handleContinue} disabled={!isValidStep1}',
    'onPointerDown={handleContinue} disabled={!isValidStep1}'
);

// Sell Page Crash Fix
// When we reverted PremiumSellPage, we left `{amount ? estimatedTk : '0.00'}`.
code = code.replace(
    /\{amount \? estimatedTk : '0\.00'\}/g,
    "{amount ? estimatedCrypto : '0.00'}"
);

// Sell Page Limits
if (!code.includes("Minimum sell amount is 1 BDT")) {
    code = code.replace(
        'if(!userTonAddress || !amount) return;',
        `if(!userTonAddress || !amount) return;
        if (parseFloat(amount) < 1) return window.Telegram?.WebApp?.showAlert("Minimum sell amount is 1 BDT");
        if (parseFloat(amount) > 20000) return window.Telegram?.WebApp?.showAlert("Maximum sell amount is 20000 BDT");`
    );
}

fs.writeFileSync('miniapp/src/App.jsx', code);
