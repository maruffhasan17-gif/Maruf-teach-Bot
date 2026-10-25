import re

with open('admin/src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# I will replace the entire OrdersList function with a clean one
start = content.find("function OrdersList()")
if start != -1:
    content = content[:start] + """function OrdersList() {
  const [buys, setBuys] = React.useState([]);
  const [sells, setSells] = React.useState([]);
  const [withdraws, setWithdraws] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [tab, setTab] = React.useState('buy');
  
  const [bonusUser, setBonusUser] = React.useState('');
  const [bonusAmt, setBonusAmt] = React.useState('');
  const [dailyLimit, setDailyLimit] = React.useState('');

  React.useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = () => {
      fetch(${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/admin/orders)
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
        const res = await fetch(${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/admin/approve-withdraw, {
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
  };

  const handleApprove = async (id) => {
    if(!window.confirm("Approve this Buy Order manually?")) return;
    try {
      const res = await fetch(${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/admin/approve-buy, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if(data.success) {
        alert('Approved!');
        fetchOrders();
      } else {
        alert(data.error);
      }
    } catch(e) {
      alert('Error approving');
    }
  };

  if (loading) return <div className="p-8 text-2xl font-bold text-white">Loading Orders...</div>;

  return (
    <div className="p-8">
      <h2 className="text-3xl font-extrabold text-blue-400 mb-6">Orders History</h2>
      
      <div className="flex gap-4 mb-6">
        <button onClick={() => setTab('buy')} className={px-6 py-2 rounded-xl font-bold transition-all }>Buy Orders</button>
        <button onClick={() => setTab('sell')} className={px-6 py-2 rounded-xl font-bold transition-all }>Sell Orders</button>
        <button onClick={() => setTab('withdraw')} className={px-6 py-2 rounded-xl font-bold transition-all }>Fiat Withdrawals</button>
        <button onClick={() => setTab('bonus')} className={px-6 py-2 rounded-xl font-bold transition-all }>Bonus & Limits</button>
      </div>

      <div className="bg-gray-900 rounded-2xl p-6 shadow-2xl border border-gray-800 overflow-x-auto">
        {tab === 'bonus' && (
          <div className="space-y-8">
              <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700">
                  <h3 className="text-xl font-bold text-white mb-4">Give User Bonus</h3>
                  <div className="flex gap-4">
                      <input type="text" value={bonusUser} onChange={e => setBonusUser(e.target.value)} placeholder="@username" className="bg-gray-900 border border-gray-700 text-white px-4 py-2 rounded-lg flex-1 focus:outline-none focus:border-pink-500" />
                      <input type="number" value={bonusAmt} onChange={e => setBonusAmt(e.target.value)} placeholder="Amount (BDT)" className="bg-gray-900 border border-gray-700 text-white px-4 py-2 rounded-lg w-32 focus:outline-none focus:border-pink-500" />
                      <button onClick={async () => {
                          if(!bonusUser || !bonusAmt) return alert("Fill all fields");
                          try {
                              const r = await fetch(${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/admin/bonus, {
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
                              const r = await fetch(${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/admin/limits, {
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

        {tab === 'withdraw' && (
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-gray-800/50 text-gray-400 font-bold border-b border-gray-800">
              <tr>
                <th className="py-3 px-4 rounded-tl-lg">User</th>
                <th className="py-3">Method</th>
                <th className="py-3">Number</th>
                <th className="py-3">Amount</th>
                <th className="py-3">Timestamp</th>
                <th className="py-3 px-4 rounded-tr-lg">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {withdraws.map(w => (
                <tr key={w.userId} className="hover:bg-gray-800/30 transition-colors">
                  <td className="py-4 px-4 font-bold text-blue-400">{w.userId}</td>
                  <td className="py-4 text-emerald-400 font-bold">{w.fiatWithdrawPending.method}</td>
                  <td className="py-4 font-mono">{w.fiatWithdrawPending.number}</td>
                  <td className="py-4 font-bold">{w.fiatWithdrawPending.amount} TK</td>
                  <td className="py-4 text-xs text-gray-500">{(w.fiatWithdrawPending.timestamp && w.fiatWithdrawPending.timestamp._seconds) ? new Date(w.fiatWithdrawPending.timestamp._seconds * 1000).toLocaleString() : 'Just now'}</td>
                  <td className="py-4 px-4">
                      <button onClick={() => handleApproveWithdraw(w.userId)} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold shadow-md">
                        Approve
                      </button>
                  </td>
                </tr>
              ))}
              {withdraws.length === 0 && <tr><td colSpan="6" className="py-8 text-center text-gray-500 font-bold">No pending withdrawals.</td></tr>}
            </tbody>
          </table>
        )}

        {tab === 'buy' && (
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-gray-800/50 text-gray-400 font-bold border-b border-gray-800">
              <tr>
                <th className="py-3 px-4 rounded-tl-lg">TrxID</th>
                <th className="py-3">User</th>
                <th className="py-3">Amount</th>
                <th className="py-3">Paid (BDT)</th>
                <th className="py-3">Method</th>
                <th className="py-3">Wallet</th>
                <th className="py-3">Status</th>
                <th className="py-3 px-4 rounded-tr-lg">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {buys.map(b => (
                <tr key={b.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="py-4 px-4 font-mono text-cyan-400">{b.trxId}</td>
                  <td className="py-4">{b.userId}</td>
                  <td className="py-4 font-bold text-white">{b.amount} {b.asset}</td>
                  <td className="py-4 text-emerald-400 font-bold">?{b.totalBdt}</td>
                  <td className="py-4 capitalize">{b.paymentMethod}</td>
                  <td className="py-4 text-xs text-gray-400 break-all max-w-[150px]">{b.receiveAddress}</td>
                  <td className="py-4">
                    <span className={px-3 py-1 rounded-full text-xs font-bold }>
                      {b.status ? b.status.toUpperCase() : 'PENDING'}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    {b.status === 'pending' && (
                      <button onClick={() => handleApprove(b.id)} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold shadow-md">
                        Accept
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {buys.length === 0 && <tr><td colSpan="8" className="py-8 text-center text-gray-500 font-bold">No buy orders yet</td></tr>}
            </tbody>
          </table>
        )}

        {tab === 'sell' && (
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-gray-800/50 text-gray-400 font-bold border-b border-gray-800">
              <tr>
                <th className="py-3 px-4 rounded-tl-lg">ID</th>
                <th className="py-3">User</th>
                <th className="py-3">Amount</th>
                <th className="py-3">Pay (BDT)</th>
                <th className="py-3">User Wallet</th>
                <th className="py-3 px-4 rounded-tr-lg">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {sells.map(s => (
                <tr key={s.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="py-4 px-4 font-mono text-cyan-400 text-xs">{s.id.slice(0, 8)}...</td>
                  <td className="py-4">{s.userId}</td>
                  <td className="py-4 font-bold text-white">{s.amount} {s.asset}</td>
                  <td className="py-4 text-emerald-400 font-bold">?{s.estimatedTk}</td>
                  <td className="py-4 text-xs text-gray-400 font-mono break-all max-w-[150px]">{s.wallet}</td>
                  <td className="py-4 px-4 text-xs text-gray-500">
                    {(s.timestamp && s.timestamp._seconds) ? new Date(s.timestamp._seconds * 1000).toLocaleString() : 'Just now'}
                  </td>
                </tr>
              ))}
              {sells.length === 0 && <tr><td colSpan="6" className="py-8 text-center text-gray-500 font-bold">No sell orders yet</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
"""

with open('admin/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
