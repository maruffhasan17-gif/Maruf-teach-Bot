const fs = require('fs');
let code = fs.readFileSync('miniapp/src/App.jsx', 'utf8');

// 1. Change Amount (USDT) to Amount (BDT)
code = code.replace(
    '<span className="text-[11px] font-extrabold text-[var(--color-text-secondary)] uppercase tracking-[0.2em]">Amount (USDT)</span>',
    '<span className="text-[11px] font-extrabold text-[var(--color-text-secondary)] uppercase tracking-[0.2em]">Amount (BDT)</span>'
);

// 2. Change pending text
code = code.replace(
    'Your request for {fiatWithdrawPending.amount} USDT is being processed.',
    'Your request for {fiatWithdrawPending.amount} BDT is being processed.'
);

// 3. Replace `$` sign in input with `৳`
code = code.replace(
    '<span className="absolute left-4 text-gray-400 font-medium">$</span>',
    '<span className="absolute left-4 text-gray-400 font-medium">৳</span>'
);

// 4. Change handleSubmit
const submitRegex = /const handleSubmit = async \(\) => \{\s*if \(\!amount \|\| isNaN\(amount\) \|\| parseFloat\(amount\) <= 0\) return WebApp\.showAlert\("Invalid amount"\);\s*if \(parseFloat\(amount\) > balance\) return WebApp\.showAlert\("Insufficient balance"\);\s*setIsSubmitting\(true\);\s*try \{\s*await withdrawFiat\(\{\s*userId: user\?\.id \|\| 123456789,\s*amount: parseFloat\(amount\)\s*\}\);\s*WebApp\.showAlert\("Withdrawal submitted successfully!"\);\s*reloadData\(\);\s*\} catch \(e\) \{\s*WebApp\.showAlert\(e\.message \|\| "Withdrawal failed"\);\s*\} finally \{\s*setIsSubmitting\(false\);\s*\}\s*\};/g;

const newSubmit = `const handleSubmit = async () => {
          const amt = parseFloat(amount);
          if (!amount || isNaN(amt) || amt <= 0) return window.Telegram?.WebApp?.showAlert("Invalid amount") || alert("Invalid amount");
          if (amt < 20) return window.Telegram?.WebApp?.showAlert("Minimum withdraw amount is 20 BDT") || alert("Minimum withdraw amount is 20 BDT");
          if (amt > balance) return window.Telegram?.WebApp?.showAlert("Insufficient balance") || alert("Insufficient balance");
          
          setIsSubmitting(true);
          try {
              await withdrawFiat({
                  userId: user?.id || 123456789,
                  amount: amt,
                  fee: parseFloat((amt * 0.05).toFixed(2)),
                  receiveAmount: parseFloat((amt * 0.95).toFixed(2))
              });
              if(window.Telegram?.WebApp?.showAlert) window.Telegram.WebApp.showAlert("Withdrawal submitted successfully!");
              else alert("Withdrawal submitted successfully!");
              reloadData();
          } catch (e) {
              if(window.Telegram?.WebApp?.showAlert) window.Telegram.WebApp.showAlert(e.message || "Withdrawal failed");
              else alert(e.message || "Withdrawal failed");
          } finally {
              setIsSubmitting(false);
          }
      };`;

code = code.replace(submitRegex, newSubmit);

// 5. Inject Breakdown UI
const breakdownUI = `
                      {amount && !isNaN(amount) && parseFloat(amount) > 0 && (
                          <div className="bg-[#F8FAFC] p-4 rounded-[20px] border border-[#E4E7EC] shadow-sm mb-2 mt-2">
                              <div className="flex justify-between items-center text-sm mb-2">
                                  <span className="text-[#475467] font-medium">Withdraw Amount</span>
                                  <span className="font-bold text-[#101828]">৳ {parseFloat(amount).toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between items-center text-sm mb-2">
                                  <span className="text-red-500 font-medium">Fee (5%)</span>
                                  <span className="font-bold text-red-500">- ৳ {(parseFloat(amount) * 0.05).toFixed(2)}</span>
                              </div>
                              <div className="h-px bg-[#E4E7EC] my-2 w-full"></div>
                              <div className="flex justify-between items-center text-sm">
                                  <span className="text-[#00A878] font-bold">You will receive</span>
                                  <span className="font-black text-[#00A878]">৳ {(parseFloat(amount) * 0.95).toFixed(2)}</span>
                              </div>
                          </div>
                      )}`;

const btnRegex = /<button onClick=\{handleMax\} className="absolute right-3 px-3 py-1\.5 bg-\[var\(--color-brand\)\]\/10 text-\[var\(--color-brand\)\] font-bold text-\[11px\] rounded-full active:scale-95 transition-transform">MAX<\/button>\s*<\/div>\s*<\/div>/g;

code = code.replace(btnRegex, (match) => {
    return match + breakdownUI;
});

fs.writeFileSync('miniapp/src/App.jsx', code);
console.log('Modified Withdraw page successfully.');
