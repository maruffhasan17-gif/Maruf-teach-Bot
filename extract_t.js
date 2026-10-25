const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

const tStart = code.indexOf('const t = {');
const tEnd = code.indexOf('function getMenu(lang)');

if (tStart !== -1 && tEnd !== -1) {
    let before = code.substring(0, tStart);
    let after = code.substring(tEnd);
    
    let newT = `const t = {
    en: {
        welcome: '🌟 **Welcome to the Official Rewards Platform!**\\n\\nTo access your wallet, complete tasks, and withdraw funds, please join our official Telegram channel first.\\n\\n👇 Click below to join and verify your account:',
        joinBtn: '📢 Join Channel',
        verifyBtn: '✅ Verify',
        notJoined: '❌ You have not joined the channel yet!',
        langPrompt: '✅ **Verification Successful!**\\n\\nPlease select your language:',
        profileMsg: '👤 **Your Profile**\\n\\nID: {id}',
        bkashMsg: '🚀 **bKash Payment**',
        cryptoMsg: '💎 **Crypto Payment**',
        menu: { free: '🎁 Free', profile: '👤 Profile' },
        mainMenuMsg: "🎉 **Verification Successful!**\\n\\nWelcome to our platform.\\n👇 **Click the button below to open the app:**"
    },
    bn: {
        welcome: '🌟 **অফিসিয়াল রিওয়ার্ডস প্ল্যাটফর্মে আপনাকে স্বাগতম!**\\n\\nআপনার ওয়ালেট অ্যাক্সেস করতে, টাস্ক কমপ্লিট করতে এবং পেমেন্ট তুলতে, অনুগ্রহ করে প্রথমে আমাদের অফিসিয়াল টেলিগ্রাম চ্যানেলে যুক্ত হোন।\\n\\n👇 জয়েন করে আপনার অ্যাকাউন্ট ভেরিফাই করুন:',
        joinBtn: '📢 চ্যানেল জয়েন করুন',
        verifyBtn: '✅ ভেরিফাই করুন',
        notJoined: '❌ আপনি এখনও চ্যানেলে জয়েন করেননি!',
        langPrompt: '✅ **ভেরিফিকেশন সফল হয়েছে!**\\n\\nআপনার ভাষা নির্বাচন করুন:',
        profileMsg: '👤 **আপনার প্রোফাইল**\\n\\nআইডি: {id}',
        bkashMsg: '🚀 **বিকাশ পেমেন্ট**',
        cryptoMsg: '💎 **ক্রিপ্টো পেমেন্ট**',
        menu: { free: '🎁 ফ্রি (Free)', profile: '👤 আমার প্রোফাইল' },
        mainMenuMsg: "🎉 **ভেরিফিকেশন সফল হয়েছে!**\\n\\nআপনাকে আমাদের প্ল্যাটফর্মে স্বাগতম।\\n👇 **নিচের বোতামে ক্লিক করে অ্যাপটি ওপেন করুন:**"
    }
};

`;
    
    fs.writeFileSync('index.js', before + newT + after);
    console.log("Success");
}
