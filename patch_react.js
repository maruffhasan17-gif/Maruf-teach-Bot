const fs = require('fs');
let code = fs.readFileSync('admin/src/App.jsx', 'utf8');

const targetStr = `<input type="text" value={settings.freeLink} onChange={e => setSettings({...settings, freeLink: e.target.value})} className="w-full bg-gray-800 border border-gray-700 text-white p-4 rounded-xl outline-none focus:border-blue-500 font-bold transition-colors" />`;
const replaceStr = `<input type="text" value="https://t.me/VictorsCompanybot/app?startapp=ref_DBF2368328" disabled className="w-full bg-gray-800 border border-gray-700 text-gray-500 p-4 rounded-xl outline-none cursor-not-allowed font-bold" />`;

if (code.includes(targetStr)) {
    code = code.replace(targetStr, replaceStr);
    fs.writeFileSync('admin/src/App.jsx', code, 'utf8');
    console.log("React Patched!");
} else {
    console.log("Could not find React target");
}
