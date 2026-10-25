const fs = require('fs');
let code = fs.readFileSync('miniapp/src/App.jsx', 'utf8');

// 1. Sticky Header Fix
code = code.replace(/<div className="flex items-center justify-between mb-6">/g, '<div className="flex items-center justify-between mb-6 sticky top-0 bg-[#f8f9fa] z-50 py-2 border-b border-gray-100/50">');
code = code.replace(/<div className="flex items-center justify-between mb-5">/g, '<div className="flex items-center justify-between mb-5 sticky top-0 bg-[#f8f9fa] z-50 py-2 border-b border-gray-100/50">');

// 2. WebApp API Fix
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

// 3. Scroll to top on Tab change
// Find `setTab(` occurrences and wrap them if necessary
code = code.replace(/\(\) => setTab\('([^']+)'\)/g, "() => { setTab('$1'); window.scrollTo(0,0); }");

// 4. Scroll to top on Step change
code = code.replace(/\(\) => setStep\(([^)]+)\)/g, "() => { setStep($1); window.scrollTo({top:0, behavior:'smooth'}); }");

fs.writeFileSync('miniapp/src/App.jsx', code);
