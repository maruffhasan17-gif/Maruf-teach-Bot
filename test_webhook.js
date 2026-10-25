const axios = require('axios');
axios.post('https://maruf-teach-bot.onrender.com/api/macrodroid/webhook', {
    message: "You have received Tk 15.00 from 017xxxxxx. Ref: . TrxID 8J7XABCD12 at 12/10/2026 14:00"
}).then(res => console.log(res.data)).catch(err => console.error(err.message));
