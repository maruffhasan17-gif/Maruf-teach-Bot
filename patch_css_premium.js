const fs = require('fs');

const css = `@import "tailwindcss";

@theme {
  --color-brand: #08B98A;
  --color-brand-light: #10B981;
  --color-brand-secondary: #0EA5E9;
  --color-bg-primary: #F5F8F7;
  --color-card: #FFFFFF;
  --color-text-primary: #0B1220;
  --color-text-secondary: #667085;
  --color-border: #E7ECEB;
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-danger: #EF4444;
}

body {
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  margin: 0;
  padding: 0;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.premium-shadow {
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
}

.floating-nav-shadow {
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.06);
}

.sell-btn-shadow {
  box-shadow: 0 8px 24px rgba(8, 185, 138, 0.25);
}

.chest-float {
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
  100% { transform: translateY(0px); }
}

.pulse-glow {
  animation: pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse-glow {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: .7; transform: scale(1.05); }
}
`;

fs.writeFileSync('miniapp/src/index.css', css);
console.log('index.css patched successfully');
