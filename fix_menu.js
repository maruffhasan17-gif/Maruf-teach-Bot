const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

const oldGetMenu = `function getMenu(lang) {
    const m = t[lang].menu;
    return {
        reply_markup: {
            keyboard: [ [ { text: m.free }, { text: m.profile } ] ],
            resize_keyboard: true
        }
    };
}`;

const newGetMenu = `function getMenu(lang) {
    return {
        reply_markup: {
            inline_keyboard: [
                [ { text: lang === 'bn' ? '🚀 অ্যাপ ওপেন করুন (Open App)' : '🚀 Open App', web_app: { url: 'https://maruf-teach-bot.onrender.com/app/' } } ]
            ]
        }
    };
}`;

code = code.replace(oldGetMenu, newGetMenu);
fs.writeFileSync('index.js', code);
