import io
import re

with io.open('miniapp/src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add buildTransaction to api.js import
content = content.replace('submitFreeTonTask, saveFiatWallet, withdrawFiat, submitSellOrder', 'submitFreeTonTask, saveFiatWallet, withdrawFiat, submitSellOrder, buildTransaction')

# Replace handleSell
old_handleSell = """  const handleSell = async () => {
    if(!userTonAddress || !amount) return;
    setLoading(true);
    try {
      const tx = {
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [{ address: "UQC7hYHfrVJ_uT_esMr7vCv1bVh5ytQxYUUjRDiTUiG9s5Fb", amount: (parseFloat(amount) * 1e9).toString() }]
      };
      await tonConnectUI.sendTransaction(tx);
      await submitSellOrder({
        userId: WebApp.initDataUnsafe?.user?.id || 8799135330, asset, amount: parseFloat(amount), estimatedTk: parseFloat(estimatedTk), wallet: userTonAddress
      });
      setTxStatus('success');
      setTxMessage('Successfully swapped to TK BDT');
      setAmount('');
      setShowKeyboard(false);
      setTimeout(() => setTxStatus(null), 3000);
    } catch(e) {
      setTxStatus('error');
      setTxMessage('There will be no changes to your account.');
      setTimeout(() => setTxStatus(null), 3000);
    } finally {
      setLoading(false);
    }
  };"""

new_handleSell = """  const handleSell = async () => {
    if(!userTonAddress || !amount) return;
    setLoading(true);
    try {
      // 1. Get Transaction Payload from Backend
      const txRes = await buildTransaction({
          asset,
          amount: parseFloat(amount),
          userAddress: userTonAddress,
          adminWallet: "UQC7hYHfrVJ_uT_esMr7vCv1bVh5ytQxYUUjRDiTUiG9s5Fb"
      });
      if (!txRes.success) throw new Error(txRes.error || "Failed to build transaction");

      // 2. Send via TonConnect
      await tonConnectUI.sendTransaction(txRes.tx);

      // 3. Save order and credit FIAT balance
      await submitSellOrder({
        userId: WebApp.initDataUnsafe?.user?.id || 8799135330, asset, amount: parseFloat(amount), estimatedTk: parseFloat(estimatedTk), wallet: userTonAddress
      });
      
      // 4. Reload global balance in App.jsx
      if (window.reloadGlobalData) window.reloadGlobalData();

      setTxStatus('success');
      setTxMessage('Successfully swapped to TK BDT');
      setAmount('');
      setShowKeyboard(false);
      setTimeout(() => setTxStatus(null), 3000);
    } catch(e) {
      setTxStatus('error');
      setTxMessage('There will be no changes to your account.');
      setTimeout(() => setTxStatus(null), 3000);
    } finally {
      setLoading(false);
    }
  };"""

content = content.replace(old_handleSell, new_handleSell)

# Add window.reloadGlobalData to App component
content = content.replace('const loadData = async (userId) => {', 'window.reloadGlobalData = () => loadData(user.id || 8799135330);\\n  const loadData = async (userId) => {')

with io.open('miniapp/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

# Patch api.js to include buildTransaction
with io.open('miniapp/src/api.js', 'r', encoding='utf-8') as f:
    api_c = f.read()

api_add = """
export const buildTransaction = async (payload) => {
    try {
        const res = await axios.post(${API_URL}/api/miniapp/build-tx, payload);
        return res.data;
    } catch (e) {
        console.error(e);
        throw e.response?.data || e;
    }
};
"""
api_c += api_add
with io.open('miniapp/src/api.js', 'w', encoding='utf-8') as f:
    f.write(api_c)
