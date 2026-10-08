const fs = require('fs');
let c = fs.readFileSync('admin/src/App.jsx', 'utf8');

c = c.replace(
  "const [settings, setSettings] = useState({ gramAmount: '', usdtAmount: '', freeLink: '' });",
  "const [settings, setSettings] = useState({ gramAmount: '', usdtAmount: '', freeLink: '', adminBkash: '01752561935', adminNagad: '01878580320' });"
);

const insertSettingsFields = \
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 font-bold mb-2 uppercase tracking-wider text-xs">Admin bKash</label>
                <input type="text" value={settings.adminBkash || ''} onChange={e => setSettings({...settings, adminBkash: e.target.value})} className="w-full bg-gray-800 border border-gray-700 text-white p-4 rounded-xl outline-none focus:border-blue-500 font-bold transition-colors" />
              </div>
              <div>
                <label className="block text-gray-400 font-bold mb-2 uppercase tracking-wider text-xs">Admin Nagad</label>
                <input type="text" value={settings.adminNagad || ''} onChange={e => setSettings({...settings, adminNagad: e.target.value})} className="w-full bg-gray-800 border border-gray-700 text-white p-4 rounded-xl outline-none focus:border-blue-500 font-bold transition-colors" />
              </div>
            </div>
\;

c = c.replace(
    "<button onClick={handleDeploy}",
    insertSettingsFields + "\n            <button onClick={handleDeploy}"
);

fs.writeFileSync('admin/src/App.jsx', c);
console.log('Admin settings updated');
