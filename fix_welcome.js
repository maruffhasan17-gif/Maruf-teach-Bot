const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

// Replace EN welcome
const enWelcomeRegex = /welcome: `[\s\S]*?GRAM[\s\S]*?`,/;
const newEnWelcome = `welcome: \`🌟 **Welcome to the Official Rewards Platform!**\\n\\nTo access your wallet, complete tasks, and withdraw funds, please join our official Telegram channel first.\\n\\n👇 Click below to join and verify your account:\`,`;
code = code.replace(enWelcomeRegex, newEnWelcome);

// Replace BN welcome
const bnWelcomeRegex = /welcome: `[\s\S]*?GRAM[\s\S]*?`,/g;
// Because I used global, it will replace the second match which is the BN one
const newBnWelcome = `welcome: \`🌟 **অফিসিয়াল রিওয়ার্ডস প্ল্যাটফর্মে আপনাকে স্বাগতম!**\\n\\nআপনার ওয়ালেট অ্যাক্সেস করতে, টাস্ক কমপ্লিট করতে এবং পেমেন্ট তুলতে, অনুগ্রহ করে প্রথমে আমাদের অফিসিয়াল টেলিগ্রাম চ্যানেলে যুক্ত হোন।\\n\\n👇 জয়েন করে আপনার অ্যাকাউন্ট ভেরিফাই করুন:\`,`;
code = code.replace(enWelcomeRegex, newBnWelcome);

fs.writeFileSync('index.js', code);
