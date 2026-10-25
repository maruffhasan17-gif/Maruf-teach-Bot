const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

// I will just rewrite the `t = { en: {...}, bn: {...} }` object manually for the welcome messages.
const regex = /const t = \{[\s\S]*?mainMenuMsg: "🎉/;
const newBlock = `const t = {
    en: {
        welcome: \`🌟 **Welcome to the Official Rewards Platform!**\\n\\nTo access your wallet, complete tasks, and withdraw funds, please join our official Telegram channel first.\\n\\n👇 Click below to join and verify your account:\`,
        joinBtn: \`📢 Join Channel\`,
        verifyBtn: \`✅ Verify\`,
        notJoined: \`❌ You have not joined the channel yet!\`,
        langPrompt: \`✅ **Verification Successful!**\\n\\nPlease select your language:\`,
        profileMsg: \`👤 **Your Profile**\\n\\nID: \`{id}\`\`,
        bkashMsg: \`🚀 **bKash Payment**\`,
        cryptoMsg: \`💎 **Crypto Payment**\`,
        menu: { free: '🎁 Free', profile: '👤 Profile' },
        mainMenuMsg: "🎉`

code = code.replace(regex, newBlock);

// Now for bn:
const regexBn = /bn: \{[\s\S]*?mainMenuMsg: "🎉/;
const newBlockBn = `bn: {
        welcome: \`🌟 **অফিসিয়াল রিওয়ার্ডস প্ল্যাটফর্মে আপনাকে স্বাগতম!**\\n\\nআপনার ওয়ালেট অ্যাক্সেস করতে, টাস্ক কমপ্লিট করতে এবং পেমেন্ট তুলতে, অনুগ্রহ করে প্রথমে আমাদের অফিসিয়াল টেলিগ্রাম চ্যানেলে যুক্ত হোন।\\n\\n👇 জয়েন করে আপনার অ্যাকাউন্ট ভেরিফাই করুন:\`,
        joinBtn: \`📢 চ্যানেল জয়েন করুন\`,
        verifyBtn: \`✅ ভেরিফাই করুন\`,
        notJoined: \`❌ আপনি এখনও চ্যানেলে জয়েন করেননি!\`,
        langPrompt: \`✅ **ভেরিফিকেশন সফল হয়েছে!**\\n\\nআপনার ভাষা নির্বাচন করুন:\`,
        profileMsg: \`👤 **আপনার প্রোফাইল**\\n\\nআইডি: \`{id}\`\`,
        bkashMsg: \`🚀 **বিকাশ পেমেন্ট**\`,
        cryptoMsg: \`💎 **ক্রিপ্টো পেমেন্ট**\`,
        menu: { free: '🎁 ফ্রি (Free)', profile: '👤 আমার প্রোফাইল' },
        mainMenuMsg: "🎉`

code = code.replace(regexBn, newBlockBn);

fs.writeFileSync('index.js', code);
