import re

with open('admin/src/App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Add states for Mock TrxID
state_block = """
  const [limits, setLimits] = useState({ maxWithdrawPerDay: 50 });
  const [mockTrx, setMockTrx] = useState({ id: '', amount: '' });
  const [mockStatus, setMockStatus] = useState('');
"""
code = code.replace("const [settings, setSettings] = useState(null);", "const [settings, setSettings] = useState(null);\n" + state_block)

# Add handler for Mock TrxID
handler_block = """
  const handleMockTrx = async () => {
      if(!mockTrx.id || !mockTrx.amount) return alert('Enter TrxID and Amount');
      try {
          const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/admin/create-mock-trx`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ trxId: mockTrx.id, amount: mockTrx.amount })
          });
          const data = await res.json();
          if(data.success) {
              setMockStatus('Success: injected ' + mockTrx.id);
              setMockTrx({ id: '', amount: '' });
          } else {
              setMockStatus('Error: ' + data.error);
          }
      } catch(e) {
          setMockStatus('Error: ' + e.message);
      }
      setTimeout(() => setMockStatus(''), 3000);
  };
"""
code = code.replace("const handleLimitChange = async (type) => {", handler_block + "\n  const handleLimitChange = async (type) => {")

# Add UI
ui_block = """
                      {/* TrxID Mocker for Testing */}
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                           <Activity size={24} className="text-purple-500" /> Test Webhook TrxID Generator
                        </h2>
                        <div className="flex items-center gap-3">
                           <input type="text" placeholder="TrxID (e.g. A1B2C3D4)" value={mockTrx.id} onChange={(e) => setMockTrx({...mockTrx, id: e.target.value})} className="px-4 py-2 border rounded-xl flex-1 focus:ring-2 outline-none"/>
                           <input type="number" placeholder="Amount (e.g. 100)" value={mockTrx.amount} onChange={(e) => setMockTrx({...mockTrx, amount: e.target.value})} className="px-4 py-2 border rounded-xl w-32 focus:ring-2 outline-none"/>
                           <button onClick={handleMockTrx} className="bg-purple-500 text-white px-5 py-2 rounded-xl font-bold hover:bg-purple-600 transition-colors">Inject</button>
                        </div>
                        {mockStatus && <p className="text-sm font-bold mt-2 text-purple-600">{mockStatus}</p>}
                      </div>
"""
code = code.replace("{/* Platform Settings */}", ui_block + "\n                      {/* Platform Settings */}")

# Ensure Activity is imported from lucide-react
code = code.replace("Settings, Save", "Settings, Save, Activity")

with open('admin/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)
