const fs = require('fs');
let code = fs.readFileSync('miniapp/src/App.jsx', 'utf8');

code = code.replace(
  "import { TonConnectUIProvider, TonConnectButton, useTonAddress } from '@tonconnect/ui-react';",
  "import { TonConnectUIProvider, TonConnectButton, useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';"
);

code = code.replace(
  "const coinAnim = useLottieData(ANIMATIONS.coin);\n  const userTonAddress = useTonAddress();",
  "const coinAnim = useLottieData(ANIMATIONS.coin);\n  const userTonAddress = useTonAddress();\n  const [tonConnectUI] = useTonConnectUI();"
);

const txCode = `
      // Prepare TonConnect transaction
      const tx = {
        validUntil: Math.floor(Date.now() / 1000) + 600, // 10 minutes
        messages: [
          {
            address: "UQC7hYHfrVJ_uT_esMr7vCv1bVh5ytQxYUUjRDiTUiG9s5Fb", // Admin wallet
            amount: (parseFloat(amount) * 1e9).toString() // Assuming TON or GRAM for now
          }
        ]
      };
      
      await tonConnectUI.sendTransaction(tx);
      
      // If user confirms in Tonkeeper, the promise resolves and we proceed to backend
      await submitSellOrder({
`;

code = code.replace(
  "// In a real app, you would trigger TonConnect transaction here first\n      // For now, we simulate the backend submission\n      await submitSellOrder({",
  txCode
);

fs.writeFileSync('miniapp/src/App.jsx', code, 'utf8');
console.log("Patched App.jsx with TonConnect TX");
