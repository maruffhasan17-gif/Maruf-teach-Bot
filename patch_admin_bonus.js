const fs = require('fs');
let code = fs.readFileSync('admin/src/App.jsx', 'utf8');

// 1. Add Bonus state
const stateRegex = /const \[withdraws, setWithdraws\] = React\.useState\(\[\]\);/;
const stateReplace = `const [withdraws, setWithdraws] = React.useState([]);
    const [bonusUser, setBonusUser] = React.useState('');
    const [bonusAmt, setBonusAmt] = React.useState('');
    const [dailyLimit, setDailyLimit] = React.useState('');`;
code = code.replace(stateRegex, stateReplace);

// 2. Add Tab Button
const tabsRegex = /<button onClick=\{\(\) => setTab\('withdraw'\)\} className=\{`px-6 py-3 font-bold text-sm transition-all \$\{tab === 'withdraw' \? 'bg-purple-500 text-white shadow-lg shadow-purple-500\/20' : 'text-gray-400 hover:text-white'\}`\}>Withdrawals<\/button>/;
const newTabs = `<button onClick={() => setTab('withdraw')} className={\`px-6 py-3 font-bold text-sm transition-all \${tab === 'withdraw' ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'text-gray-400 hover:text-white'}\`}>Withdrawals</button>
<button onClick={() => setTab('bonus')} className={\`px-6 py-3 font-bold text-sm transition-all \${tab === 'bonus' ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/20' : 'text-gray-400 hover:text-white'}\`}>Bonus & Limits</button>`;
code = code.replace(tabsRegex, newTabs);

// 3. Add Bonus Panel
const sellPanelRegex = /\{tab === 'sell' && \(/g;
const newTabContent = `{tab === 'bonus' && (
  <div className="p-8 space-y-8">
      <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">Give User Bonus</h3>
          <div className="flex gap-4">
              <input type="text" value={bonusUser} onChange={e => setBonusUser(e.target.value)} placeholder="@username" className="bg-gray-900 border border-gray-700 text-white px-4 py-2 rounded-lg flex-1 focus:outline-none focus:border-pink-500" />
              <input type="number" value={bonusAmt} onChange={e => setBonusAmt(e.target.value)} placeholder="Amount (BDT)" className="bg-gray-900 border border-gray-700 text-white px-4 py-2 rounded-lg w-32 focus:outline-none focus:border-pink-500" />
              <button onClick={async () => {
                  if(!bonusUser || !bonusAmt) return alert("Fill all fields");
                  try {
                      const r = await fetch(\`\${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/admin/bonus\`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ username: bonusUser, amount: bonusAmt })
                      });
                      const d = await r.json();
                      if(d.success) { alert("Bonus sent! New Balance: " + d.newBalance); setBonusUser(''); setBonusAmt(''); }
                      else alert(d.error);
                  } catch(e) { alert("Error sending bonus"); }
              }} className="bg-pink-500 text-white font-bold px-6 py-2 rounded-lg hover:bg-pink-600 transition-colors">Send Bonus</button>
          </div>
      </div>
      
      <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">Global Settings</h3>
          <div className="flex gap-4">
              <input type="number" value={dailyLimit} onChange={e => setDailyLimit(e.target.value)} placeholder="Daily Fiat Withdraw Limit (e.g. 50)" className="bg-gray-900 border border-gray-700 text-white px-4 py-2 rounded-lg flex-1 focus:outline-none focus:border-blue-500" />
              <button onClick={async () => {
                  if(!dailyLimit) return;
                  try {
                      const r = await fetch(\`\${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/admin/limits\`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ limit: dailyLimit })
                      });
                      const d = await r.json();
                      if(d.success) alert("Daily Limit Updated!");
                      else alert(d.error);
                  } catch(e) { alert("Error setting limit"); }
              }} className="bg-blue-500 text-white font-bold px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors">Set Limit</button>
          </div>
      </div>
  </div>
)}
{tab === 'sell' && (`;
code = code.replace(sellPanelRegex, newTabContent);

fs.writeFileSync('admin/src/App.jsx', code);
