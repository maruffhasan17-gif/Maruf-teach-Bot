const fs = require('fs');
let code = fs.readFileSync('miniapp/src/App.jsx', 'utf8');

// Update handleSubmit button in Buy Page
code = code.replace(
    'onClick={handleSubmit} disabled={!isValidStep2 || loading}',
    'onPointerDown={(e) => { if (e && e.preventDefault) e.preventDefault(); handleSubmit(); }} disabled={!isValidStep2 || loading}'
);

// Update handleSubmit button in Withdraw Page
code = code.replace(
    'onClick={handleSubmit} \\n                        disabled={!amount || isSubmitting}',
    'onPointerDown={(e) => { if (e && e.preventDefault) e.preventDefault(); handleSubmit(); }}\\n                        disabled={!amount || isSubmitting}'
);
code = code.replace(
    'onClick={handleSubmit} \\r\\n                          disabled={!amount || isSubmitting}',
    'onPointerDown={(e) => { if (e && e.preventDefault) e.preventDefault(); handleSubmit(); }}\\n                          disabled={!amount || isSubmitting}'
);
if (code.includes('onClick={handleSubmit}\\n                          disabled={!amount || isSubmitting}')) {
    code = code.replace(/onClick=\{handleSubmit\}\s*disabled=\{!amount \|\| isSubmitting\}/g, 'onPointerDown={(e) => { if (e && e.preventDefault) e.preventDefault(); handleSubmit(); }}\n                          disabled={!amount || isSubmitting}');
}

fs.writeFileSync('miniapp/src/App.jsx', code);
