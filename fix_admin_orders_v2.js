const fs = require('fs');
let code = fs.readFileSync('admin/src/App.jsx', 'utf8');

// Replace fetchOrders function
const fetchOrdersRegex = /const fetchOrders = \(\) => \{[\s\S]*?\.catch\(e => \{ console\.error\(e\); setLoading\(false\); \}\);\s*\};/m;
const newFetchOrders = `const [withdraws, setWithdraws] = React.useState([]);
    const fetchOrders = () => {
      fetch(\`\${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/admin/orders\`)
        .then(r => r.json())
        .then(d => {
          setBuys(d.buys || []);
          setSells(d.sells || []);
          setWithdraws(d.withdrawals || []);
          setLoading(false);
        })
        .catch(e => { console.error(e); setLoading(false); });
    };
    
    const handleApproveWithdraw = async (userId) => {
      if(!window.confirm("Approve this Withdrawal and notify user?")) return;
      try {
        const res = await fetch(\`\${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/admin/approve-withdraw\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        });
        const data = await res.json();
        if(data.success) {
          alert("Withdrawal Approved & User Notified!");
          fetchOrders();
        } else {
          alert(data.error);
        }
      } catch(e) {
        alert("Error approving withdrawal");
      }
    };`;
code = code.replace(fetchOrdersRegex, newFetchOrders);

// Add Tab Button
const tabsRegex = /<button onClick=\{\(\) => setTab\('sell'\)\} className=\{`px-6 py-3 font-bold text-sm transition-all \$\{tab === 'sell' \? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500\/20' : 'text-gray-400 hover:text-white'\}`\}>Sell Orders<\/button>/g;
const newTabs = `<button onClick={() => setTab('sell')} className={\`px-6 py-3 font-bold text-sm transition-all \${tab === 'sell' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-gray-400 hover:text-white'}\`}>Sell Orders</button>
<button onClick={() => setTab('withdraw')} className={\`px-6 py-3 font-bold text-sm transition-all \${tab === 'withdraw' ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'text-gray-400 hover:text-white'}\`}>Withdrawals</button>`;
code = code.replace(tabsRegex, newTabs);

// Add Withdrawals Panel
const sellPanelRegex = /\{tab === 'sell' && \(/g;
const newTabContent = `{tab === 'withdraw' && (
  <table className="w-full text-left">
    <thead className="bg-gray-900/50 border-b border-gray-800">
      <tr>
        <th className="p-6 font-bold text-gray-400 uppercase tracking-wider text-xs">User ID</th>
        <th className="p-6 font-bold text-gray-400 uppercase tracking-wider text-xs">Details</th>
        <th className="p-6 font-bold text-gray-400 uppercase tracking-wider text-xs">Amounts</th>
        <th className="p-6 font-bold text-gray-400 uppercase tracking-wider text-xs">Status / Action</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-800">
      {withdraws.length === 0 ? (
        <tr><td colSpan="4" className="p-8 text-center text-gray-500 font-bold">No pending withdrawals.</td></tr>
      ) : withdraws.map(w => (
        <tr key={w.id} className="hover:bg-gray-800/50 transition-colors">
          <td className="p-6 font-mono text-sm text-gray-300">{w.userId}</td>
          <td className="p-6">
            <div className="font-bold text-white">{w.method}</div>
            <div className="text-gray-400 text-sm">{w.number}</div>
            <div className="text-gray-500 text-xs">{w.name}</div>
          </td>
          <td className="p-6">
            <div className="text-sm">Req: <span className="text-white font-bold">{w.amount} BDT</span></div>
            <div className="text-sm">Fee: <span className="text-red-400 font-bold">-{w.fee} BDT</span></div>
            <div className="text-sm mt-1">Send: <span className="text-emerald-400 font-bold text-lg">{w.receiveAmount} BDT</span></div>
          </td>
          <td className="p-6">
            <button onClick={() => handleApproveWithdraw(w.userId)} className="px-4 py-2 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600 transition-colors">Approve</button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
)}
{tab === 'sell' && (`;
code = code.replace(sellPanelRegex, newTabContent);

fs.writeFileSync('admin/src/App.jsx', code);
