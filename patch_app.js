const fs = require('fs');
let code = fs.readFileSync('miniapp/src/App.jsx', 'utf8');

code = code.replace(
  "import Lottie from 'lottie-react';",
  "import Lottie from 'lottie-react';\nimport { fetchUserData, submitFreeTonTask, submitSellOrder } from './api';"
);

code = code.replace(
  "const [balance, setBalance] = useState(0);",
  "const [balance, setBalance] = useState(0);\n  const [loading, setLoading] = useState(true);\n\n  const loadData = async (userId) => {\n    const data = await fetchUserData(userId);\n    setBalance(data.balance);\n    setLoading(false);\n  };\n"
);

code = code.replace(
  "if (WebApp.initDataUnsafe?.user) {\n      setUser(WebApp.initDataUnsafe.user);\n    }",
  "if (WebApp.initDataUnsafe?.user) {\n      setUser(WebApp.initDataUnsafe.user);\n      loadData(WebApp.initDataUnsafe.user.id);\n    } else {\n      // Fallback for local testing\n      loadData(8799135330);\n    }"
);

code = code.replace(
  "function ClaimModal({ user, onClose }) {",
  "function ClaimModal({ user, onClose }) {\n  const [loading, setLoading] = useState(false);\n  const [error, setError] = useState('');"
);

code = code.replace(
  "const handleSubmit = () => {",
  "const handleSubmit = async () => {\n    if(!address) return;\n    setLoading(true);\n    try {\n      await submitFreeTonTask({\n        userId: user.id,\n        name: user.first_name,\n        username: user.username,\n        address: address\n      });\n      setSubmitted(true);\n      setTimeout(() => onClose(), 2500);\n    } catch(e) {\n      setError('Submission failed. Try again.');\n    } finally {\n      setLoading(false);\n    }\n  };\n  //"
);

code = code.replace(
  "<button onClick={handleSubmit}",
  "{error && <p className=\"text-red-500 text-xs text-center\">{error}</p>}\n              <button onClick={handleSubmit} disabled={loading}"
);

code = code.replace(
  "function SellPage() {",
  "function SellPage() {\n  const [loading, setLoading] = useState(false);\n  const [success, setSuccess] = useState(false);"
);

code = code.replace(
  "const estimatedTk = (parseFloat(amount || 0) * rate).toFixed(2);",
  "const estimatedTk = (parseFloat(amount || 0) * rate).toFixed(2);\n\n  const handleSell = async () => {\n    if(!userTonAddress || !amount) return;\n    setLoading(true);\n    try {\n      // In a real app, you would trigger TonConnect transaction here first\n      // For now, we simulate the backend submission\n      await submitSellOrder({\n        userId: WebApp.initDataUnsafe?.user?.id || 8799135330,\n        asset,\n        amount: parseFloat(amount),\n        estimatedTk: parseFloat(estimatedTk),\n        wallet: userTonAddress\n      });\n      setSuccess(true);\n    } catch(e) {\n      alert('Error selling asset');\n    } finally {\n      setLoading(false);\n    }\n  };"
);

code = code.replace(
  "CONFIRM & SELL\n            </button>",
  "CONFIRM & SELL\n            </button>\n            {success && <p className=\"text-theme-primary text-center font-bold mt-2\">Sell order placed successfully!</p>}"
);

code = code.replace(
  "<button disabled={!userTonAddress || !amount}",
  "<button onClick={handleSell} disabled={!userTonAddress || !amount || loading}"
);

fs.writeFileSync('miniapp/src/App.jsx', code, 'utf8');
console.log("Patched App.jsx");
