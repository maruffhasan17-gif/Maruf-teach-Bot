const fs = require('fs');
let code = fs.readFileSync('admin/src/App.jsx', 'utf8');

// 1. Add route
code = code.replace('<Route path="/fraud" element={<FraudList />} />', '<Route path="/fraud" element={<FraudList />} />\n              <Route path="/transactions" element={<TransactionsList />} />');

// 2. Add to menuItems
code = code.replace(`{ path: '/fraud', name: 'Fraud Logs', icon: <Activity size={20} className="text-red-400" /> },`, `{ path: '/fraud', name: 'Fraud Logs', icon: <AlertTriangle size={20} className="text-red-400" /> },
    { path: '/transactions', name: 'Transactions', icon: <List size={20} /> },`);

// 3. Add lucide-react imports (List, AlertTriangle)
code = code.replace(/import {([^}]+)} from 'lucide-react';/, "import {$1, List, AlertTriangle} from 'lucide-react';");

// 4. Create TransactionsList component
const txComponent = `
function TransactionsList() {
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/transactions')
      .then(r => r.json())
      .then(d => { setTxs(d); setLoading(false); })
      .catch(e => { console.error(e); setLoading(false); });
  }, []);

  if (loading) return <div className="p-8 text-2xl font-bold text-white">Loading Transactions...</div>;

  return (
    <div className="p-8">
      <h2 className="text-3xl font-extrabold text-blue-400 mb-8">Transaction History</h2>
      <div className="bg-gray-900 rounded-2xl p-6 shadow-2xl border border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-400 border-b border-gray-800">
                <th className="pb-4 font-bold">User ID</th>
                <th className="pb-4 font-bold">Address</th>
                <th className="pb-4 font-bold">Amount (TON)</th>
                <th className="pb-4 font-bold">Date</th>
              </tr>
            </thead>
            <tbody>
              {txs.map((t, i) => (
                <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                  <td className="py-4 font-medium text-white">{t.userId}</td>
                  <td className="py-4 text-sm text-gray-400 break-all">{t.address}</td>
                  <td className="py-4 font-bold text-green-400">{t.amount}</td>
                  <td className="py-4 text-gray-500">{new Date(t.timestamp).toLocaleString()}</td>
                </tr>
              ))}
              {txs.length === 0 && (
                <tr><td colSpan="4" className="py-8 text-center text-gray-500">No transactions found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
`;

code = code + "\n" + txComponent;

fs.writeFileSync('admin/src/App.jsx', code, 'utf8');
console.log("React tx patched!");
