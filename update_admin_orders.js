const fs = require('fs');
let appContent = fs.readFileSync('admin/src/App.jsx', 'utf8');

const OrdersListCode = `
function OrdersList() {
  const [buys, setBuys] = React.useState([]);
  const [sells, setSells] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [tab, setTab] = React.useState('buy');

  React.useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = () => {
    fetch('/api/admin/orders')
      .then(r => r.json())
      .then(d => {
        setBuys(d.buys || []);
        setSells(d.sells || []);
        setLoading(false);
      })
      .catch(e => { console.error(e); setLoading(false); });
  };

  const handleApprove = async (id) => {
    if(!window.confirm("Approve this Buy Order manually?")) return;
    try {
      const res = await fetch('/api/admin/approve-buy', {
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
        <button onClick={() => setTab('buy')} className={\`px-6 py-2 rounded-xl font-bold transition-all \${tab === 'buy' ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-400'}\`}>Buy Orders</button>
        <button onClick={() => setTab('sell')} className={\`px-6 py-2 rounded-xl font-bold transition-all \${tab === 'sell' ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-400'}\`}>Sell Orders</button>
      </div>

      <div className="bg-gray-900 rounded-2xl p-6 shadow-2xl border border-gray-800 overflow-x-auto">
        {tab === 'buy' ? (
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-400 border-b border-gray-800">
                <th className="pb-4 font-bold">TrxID</th>
                <th className="pb-4 font-bold">User</th>
                <th className="pb-4 font-bold">Amount</th>
                <th className="pb-4 font-bold">Method</th>
                <th className="pb-4 font-bold">Wallet</th>
                <th className="pb-4 font-bold">Status</th>
                <th className="pb-4 font-bold">Action</th>
              </tr>
            </thead>
            <tbody>
              {buys.map(b => (
                <tr key={b.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                  <td className="py-4 font-mono text-sm text-gray-300">{b.trxId}</td>
                  <td className="py-4 font-medium text-white">{b.userId}</td>
                  <td className="py-4 font-bold text-emerald-400">{b.amount} {b.asset} <span className="text-xs text-gray-500 block">৳{b.totalBdt} BDT</span></td>
                  <td className="py-4 text-gray-300">{b.paymentMethod}</td>
                  <td className="py-4 text-xs text-gray-400 break-all max-w-[150px]">{b.receiveAddress}</td>
                  <td className="py-4">
                    <span className={\`px-3 py-1 rounded-full text-xs font-bold \${b.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}\`}>
                      {b.status ? b.status.toUpperCase() : 'PENDING'}
                    </span>
                  </td>
                  <td className="py-4">
                    {b.status === 'pending' && (
                      <button onClick={() => handleApprove(b.id)} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold shadow-md">
                        Accept
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {buys.length === 0 && <tr><td colSpan="7" className="py-8 text-center text-gray-500">No buy orders yet</td></tr>}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-400 border-b border-gray-800">
                <th className="pb-4 font-bold">User</th>
                <th className="pb-4 font-bold">Sold Asset</th>
                <th className="pb-4 font-bold">BDT Credit</th>
                <th className="pb-4 font-bold">Sender Wallet</th>
                <th className="pb-4 font-bold">Date</th>
              </tr>
            </thead>
            <tbody>
              {sells.map(s => (
                <tr key={s.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                  <td className="py-4 font-medium text-white">{s.userId}</td>
                  <td className="py-4 font-bold text-amber-400">{s.amount} {s.asset}</td>
                  <td className="py-4 font-bold text-emerald-400">৳{s.estimatedTk}</td>
                  <td className="py-4 text-xs text-gray-400 break-all">{s.wallet}</td>
                  <td className="py-4 text-gray-500 text-sm">{s.timestamp?._seconds ? new Date(s.timestamp._seconds * 1000).toLocaleString() : ''}</td>
                </tr>
              ))}
              {sells.length === 0 && <tr><td colSpan="5" className="py-8 text-center text-gray-500">No sell orders yet</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
`;

appContent = appContent.replace(/function TransactionsList\(\) \{[\s\S]*$/, OrdersListCode);
appContent = appContent.replace(/<Route path="\/transactions" element=\{<TransactionsList \/>\} \/>/g, '<Route path="/transactions" element={<OrdersList />} />');

fs.writeFileSync('admin/src/App.jsx', appContent, 'utf8');
console.log("Updated Admin App.jsx");
