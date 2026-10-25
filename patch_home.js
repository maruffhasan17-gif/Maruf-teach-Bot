const fs = require('fs');
let code = fs.readFileSync('miniapp/src/App.jsx', 'utf8');

// 1. Pass prop to HomePage
code = code.replace(
    /<HomePage balance=\{balance\} user=\{user\} onGoToClaim/g,
    "<HomePage balance={balance} user={user} fiatWithdrawPending={fiatWithdrawPending} onGoToClaim"
);

// 2. Add prop to HomePage function definition
code = code.replace(
    /function HomePage\(\{ balance, user, onGoToClaim \}\) \{/g,
    "function HomePage({ balance, user, fiatWithdrawPending, onGoToClaim }) {"
);

// 3. Add the card inside HomePage
const returnRegex = /return \(\s*<div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">/m;
const newReturn = eturn (
    <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
      
      {fiatWithdrawPending && (
          fiatWithdrawPending.status === 'completed' ? (
              Date.now() - (fiatWithdrawPending.completedAt || Date.now()) < 3 * 60 * 60 * 1000 && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-3xl flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 shrink-0 shadow-inner">
                          <CheckCircle2 size={24} />
                      </div>
                      <div>
                          <h3 className="text-emerald-500 font-extrabold text-sm tracking-widest uppercase">Withdrawal Successful</h3>
                          <p className="text-[var(--color-text-secondary)] text-xs mt-0.5">Your <b>{fiatWithdrawPending.amount} TK</b> has been sent to {fiatWithdrawPending.method} ({fiatWithdrawPending.number}).</p>
                      </div>
                  </div>
              )
          ) : (
              <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-3xl flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-500 shrink-0 shadow-inner">
                      <Clock size={24} />
                  </div>
                  <div>
                      <h3 className="text-amber-500 font-extrabold text-sm tracking-widest uppercase">Withdrawal Pending</h3>
                      <p className="text-[var(--color-text-secondary)] text-xs mt-0.5">Serial <b>#{fiatWithdrawPending.serial || 'N/A'}</b>: <b>{fiatWithdrawPending.amount} TK</b> via {fiatWithdrawPending.method} ({fiatWithdrawPending.number}).</p>
                  </div>
              </div>
          )
      )};

code = code.replace(returnRegex, newReturn);
fs.writeFileSync('miniapp/src/App.jsx', code);
