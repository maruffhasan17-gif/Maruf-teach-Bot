const fs = require('fs');
let code = fs.readFileSync('miniapp/src/App.jsx', 'utf8');

code = code.replace(
    /const GUEST_ID = 123456789;\s*if \(WebApp\.initDataUnsafe\?\.user\) \{/,
    `const GUEST_ID = 123456789;
        const tgWebApp = window.Telegram?.WebApp;
        if (tgWebApp?.initDataUnsafe?.user) {`
);

code = code.replace(
    /setUser\(WebApp\.initDataUnsafe\.user\);/g,
    `setUser(tgWebApp.initDataUnsafe.user);`
);

code = code.replace(
    /loadData\(WebApp\.initDataUnsafe\.user\.id\);/g,
    `loadData(tgWebApp.initDataUnsafe.user.id);`
);

code = code.replace(
    /useEffect\(\(\) => \{/g,
    `useEffect(() => {\n    window.scrollTo(0,0);`
);

// We need to also scroll to top when changing tabs. The setTab logic is usually handled by buttons in bottom nav.
// Let's replace setTab("...") with a function call or just add window.scrollTo(0,0) after setTab calls.
code = code.replace(/setTab\((.*?)\)/g, "setTab($1); setTimeout(() => window.scrollTo({top:0, behavior:'smooth'}), 50)");

// And for step changes in buy/sell:
code = code.replace(/setStep\((.*?)\)/g, "setStep($1); setTimeout(() => window.scrollTo({top:0, behavior:'smooth'}), 50)");

fs.writeFileSync('miniapp/src/App.jsx', code);
