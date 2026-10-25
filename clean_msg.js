const fs = require('fs');

const original = fs.readFileSync('original_block.txt', 'utf8');

// Find the spot where user command logic starts
const userLogicStart = original.indexOf("if (text.startsWith('/')) return;");

if (userLogicStart !== -1) {
    let cleanBlock = original.substring(0, userLogicStart);
    
    // Add the Web App reply logic for non-admin users
    cleanBlock += `
    if (text.startsWith('/')) return;
    
    // Default reply for any other message
    bot.sendMessage(chatId, "🎉 **Click the button below to open the Web App:**", getMenu('bn'));
});`;

    let code = fs.readFileSync('index.js', 'utf8');
    code = code.replace(original, cleanBlock);
    fs.writeFileSync('index.js', code);
    console.log("Replaced successfully!");
} else {
    console.log("Could not find user logic start.");
}
