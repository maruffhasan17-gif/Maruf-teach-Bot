const fs = require('fs');
let code = fs.readFileSync('miniapp/src/App.jsx', 'utf8');

const historyPageCode = `
function HistoryPage({ user, onBack }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const userId = user?.id || 123456789;
                const isLocal = window.location.hostname === 'localhost' || window.location.hostname.includes('192.168');
                const API_URL = isLocal ? 'http://localhost:3000' : 'https://maruf-teach-bot.onrender.com';
                const res = await fetch(\`\${API_URL}/api/miniapp/history/\${userId}\`);
                const data = await res.json();
                if(data.success) {
                    setHistory(data.history);
                }
            } catch(e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [user]);

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 pb-20 max-w-md mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <button onClick={onBack} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 active:scale-95 transition-transform text-gray-600">
                    <ChevronRight size={20} className="rotate-180" />
                </button>
                <h2 className="text-xl font-extrabold text-gray-900">Transaction History</h2>
            </div>
            
            {loading ? (
                <div className="flex justify-center py-10">
                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : history.length === 0 ? (
                <div className="bg-white p-8 rounded-[24px] text-center shadow-sm border border-gray-100 flex flex-col items-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-4">
                        <Clock size={24} />
                    </div>
                    <p className="font-bold text-gray-900 mb-1">No Transactions Yet</p>
                    <p className="text-sm text-gray-500">Your buying and selling history will appear here.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {history.map((tx, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-[20px] shadow-sm border border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={\`w-12 h-12 rounded-full flex items-center justify-center \${tx.type === 'buy' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}\`}>
                                    {tx.type === 'buy' ? <ArrowDown size={20} /> : <ArrowUp size={20} />}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 capitalize">{tx.type} {tx.asset}</p>
                                    <p className="text-[11px] font-medium text-gray-400 mt-0.5">{new Date(tx.timestamp?._seconds * 1000 || Date.now()).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-extrabold text-gray-900">{tx.amount} {tx.asset}</p>
                                <p className={\`text-[11px] font-bold mt-0.5 \${tx.status === 'completed' ? 'text-emerald-500' : tx.status === 'pending' ? 'text-orange-500' : 'text-red-500'}\`}>
                                    {tx.status?.toUpperCase() || 'PENDING'}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
`;

if (!code.includes('function HistoryPage')) {
    code = code.replace("function ProfilePage", historyPageCode + "\n\nfunction ProfilePage");
}
fs.writeFileSync('miniapp/src/App.jsx', code);
console.log('Added History Page');
