const fs = require('fs');
let code = fs.readFileSync('miniapp/src/App.jsx', 'utf8');

if (!code.includes('const [mbsId, setMbsId] = useState(null);')) {
    code = code.replace("const [fiatWithdrawPending, setFiatWithdrawPending] = useState(null);", "const [fiatWithdrawPending, setFiatWithdrawPending] = useState(null);\n  const [mbsId, setMbsId] = useState(null);");
    code = code.replace("setFiatWithdrawPending(data.fiatWithdrawPending || null);", "setFiatWithdrawPending(data.fiatWithdrawPending || null);\n      setMbsId(data.mbsId);");
    code = code.replace("<ProfilePage user={user} balance={balance} fiatWallet={fiatWallet} fiatWithdrawPending={fiatWithdrawPending}", "<ProfilePage user={user} balance={balance} mbsId={mbsId} fiatWallet={fiatWallet} fiatWithdrawPending={fiatWithdrawPending}");
    fs.writeFileSync('miniapp/src/App.jsx', code);
    console.log("App.jsx state updated");
}
