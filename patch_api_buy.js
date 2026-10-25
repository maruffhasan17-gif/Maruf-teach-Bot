const fs = require('fs');
let code = fs.readFileSync('miniapp/src/api.js', 'utf8');

code = code.replace(
    /export const submitBuyOrder = async \(payload\) => \{[\s\S]*?throw e;\s*\}/m,
    `export const submitBuyOrder = async (payload) => {
    try {
        const res = await axios.post(\`\${API_URL}/api/miniapp/buy\`, payload);
        return res.data;
    } catch (e) {
        throw new Error(e.response?.data?.error || e.message || 'Unknown error');
    }
}`
);

fs.writeFileSync('miniapp/src/api.js', code);

let appCode = fs.readFileSync('miniapp/src/App.jsx', 'utf8');
appCode = appCode.replace(/alert\('Failed to submit order'\);/g, "alert(e.message || 'Failed to submit order'); window.Telegram?.WebApp?.showAlert(e.message || 'Failed to submit order');");
fs.writeFileSync('miniapp/src/App.jsx', appCode);
