const fs = require('fs');
let code = fs.readFileSync('miniapp/src/App.jsx', 'utf8');

// Fix rendering components with user prop
code = code.replace("{activeTab === 'buy' && <PremiumBuyPage />}", "{activeTab === 'buy' && <PremiumBuyPage user={user} />}");
code = code.replace("{activeTab === 'sell' && <PremiumSellPage />}", "{activeTab === 'sell' && <PremiumSellPage user={user} />}");

// Fix PremiumBuyPage function signature
code = code.replace("function PremiumBuyPage() {", "function PremiumBuyPage({ user }) {");

// Fix PremiumSellPage function signature
code = code.replace("function PremiumSellPage() {", "function PremiumSellPage({ user }) {");

fs.writeFileSync('miniapp/src/App.jsx', code);
