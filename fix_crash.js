const fs = require('fs');
let code = fs.readFileSync('miniapp/src/App.jsx', 'utf8');

// Replace all WebApp.initDataUnsafe?.user?.id with user?.id
code = code.replace(/WebApp\.initDataUnsafe\?\.user\?\.id/g, 'user?.id');
code = code.replace(/window\.Telegram\?\.WebApp\?\.initDataUnsafe\?\.user\?\.id/g, 'user?.id');

// The user also wants a beautiful animation on success:
// Right now, setTxStatus('success') sets the status, and it probably renders a small success block.
// I will add a Confetti effect to the success block!
// Wait, I can't easily add a new npm package like react-confetti. 
// I can just improve the success message UI with some CSS animation.
// Let's find the txStatus render block:
// {txStatus === 'success' && ( ... )}
// Let's replace it with a more animated version if we can find it.

// Let's just fix the bugs first.
fs.writeFileSync('miniapp/src/App.jsx', code);
