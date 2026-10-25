const fs = require('fs');
let code = fs.readFileSync('miniapp/src/App.jsx', 'utf8');

const oldHandleSell = /const handleSell = async \(e\) => \{[\s\S]*?setLoading\(false\);\s*\}\s*\};/g;

const newHandleSell = `const handleSell = async (e) => {
    if(e.preventDefault) e.preventDefault();
    if(!userTonAddress || !cryptoAmount || !fiatAmount) return;
    
    if (parseFloat(fiatAmount) < 1) return window.Telegram?.WebApp?.showAlert("Minimum sell amount is 1 BDT");
    if (parseFloat(fiatAmount) > 20000) return window.Telegram?.WebApp?.showAlert("Maximum sell amount is 20000 BDT");
    
    setLoading(true);
    let pendingOrderId = null;
    
    try {
      const txRes = await buildTransaction({
          asset,
          amount: parseFloat(cryptoAmount),
          userAddress: userTonAddress,
          adminWallet: "UQC7hYHfrVJ_uT_esMr7vCv1bVh5ytQxYUUjRDiTUiG9s5Fb"
      });
      if (!txRes.success) throw new Error(txRes.error || "Failed to build transaction");

      // 1. Submit pending order to DB before confirming in wallet (in case app closes)
      const pendingRes = await submitSellOrder({
        userId: user?.id || WebApp.initDataUnsafe?.user?.id || 123456789, 
        asset, 
        amount: parseFloat(cryptoAmount), 
        estimatedTk: parseFloat(fiatAmount), 
        wallet: userTonAddress,
        status: 'pending'
      });
      
      if (pendingRes && pendingRes.orderId) {
          pendingOrderId = pendingRes.orderId;
      }

      // 2. Open wallet and send
      await tonConnectUI.sendTransaction(txRes.tx);

      // 3. Mark completed and add TK to user balance
      await submitSellOrder({
        userId: user?.id || WebApp.initDataUnsafe?.user?.id || 123456789, 
        asset, 
        amount: parseFloat(cryptoAmount), 
        estimatedTk: parseFloat(fiatAmount), 
        wallet: userTonAddress,
        orderId: pendingOrderId,
        status: 'completed'
      });
      
      if (window.reloadGlobalData) window.reloadGlobalData();

      setTxStatus('success');
      setTxMessage('Successfully swapped to TK BDT');
      setCryptoAmount('');
      setFiatAmount('');
      setShowKeyboard(false);
      setTimeout(() => setTxStatus(null), 3000);
    } catch(e) {
      setTxStatus('error');
      setTxMessage('There will be no changes to your account.');
      setTimeout(() => setTxStatus(null), 3000);
    } finally {
      setLoading(false);
    }
  };`;

code = code.replace(oldHandleSell, newHandleSell);
fs.writeFileSync('miniapp/src/App.jsx', code);
console.log("Patched handleSell");
