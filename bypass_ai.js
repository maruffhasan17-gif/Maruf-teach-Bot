const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

const photoBlockRegex = /if \(msg\.photo\) \{[\s\S]*?(?=if \(userStates\[chatId\]\.failedAttempts >= 2\))/;

const newPhotoBlock = `if (msg.photo) {
        if (userStates[chatId].step !== 'awaiting_screenshot' && userStates[chatId].step !== 'awaiting_free_screenshot') return;

        const isFreeTask = userStates[chatId].step === 'awaiting_free_screenshot';
        const userFirstName = msg.from.first_name || '';
        const userUsername = msg.from.username || '';
        const photo = msg.photo[msg.photo.length - 1];

        if (isFreeTask) {
            // BYPASS AI ENTIRELY for Free Tasks
            const reviewMsg = lang === 'bn' ? "⏳ **আপনার স্ক্রিনশটটি ম্যানুয়াল রিভিউতে পাঠানো হয়েছে।**\\n\\nযাচাই হতে ৫ মিনিট পর্যন্ত সময় লাগতে পারে।" : "⏳ **Your screenshot has been sent for manual review.**\\n\\nVerification may take up to 5 minutes.";
            bot.sendMessage(chatId, reviewMsg, { parse_mode: 'Markdown' });
            
            const config = botConfig;
            if (config.adminGroupId) {
                bot.sendPhoto(config.adminGroupId, photo.file_id, {
                    caption: \`🔍 **Manual Review Needed (Free Task)**\\n\\nUser: \${userFirstName} (@\${userUsername})\\nID: \${chatId}\\n\\nReply to this photo with **ok** to approve, or **wrong** to reject.\`,
                    parse_mode: 'Markdown'
                });
            }
            return;
        }

        bot.sendMessage(chatId, t[lang].scanMsg, { parse_mode: 'Markdown' });
        
        try {
            const fileLink = await bot.getFileLink(photo.file_id);
            const response = await axios.get(fileLink, { responseType: 'arraybuffer' });
            const base64Image = Buffer.from(response.data).toString('base64');

            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            const prompt = \`Analyze this payment screenshot strictly. Look for:
            1. Text "Withdrawal Submitted!"
            2. Gateway text (e.g. "USDT BEP20")
            3. Amount (e.g. "$0.10 USDT").
            Return JSON format ONLY: {"hasWithdrawalText": true/false, "gateway": "extracted text", "amount": extracted_number_as_float}.\`;

            const imagePart = { inlineData: { data: base64Image, mimeType: 'image/jpeg' } };
            const result = await model.generateContent([prompt, imagePart]);
            const responseText = result.response.text();
            
            const jsonStr = responseText.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
            const aiData = JSON.parse(jsonStr);

            if (aiData.hasWithdrawalText && aiData.gateway.includes('BEP20') && aiData.amount >= 0.10) {
                userStates[chatId].step = 'awaiting_ton';
                bot.sendMessage(chatId, t[lang].successMsg.replace('{amount}', aiData.amount), { parse_mode: 'Markdown' });
            } else {
                throw new Error("Validation Failed");
            }
        } catch (error) {
            console.error("AI Error:", error.message);
            userStates[chatId].failedAttempts = (userStates[chatId].failedAttempts || 0) + 1;
            
            // Upload to Supabase and Log to Firestore
            try {
                const fileLink = await bot.getFileLink(photo.file_id);
                const response = await axios.get(fileLink, { responseType: 'arraybuffer' });
                const buffer = Buffer.from(response.data);
                
                const fileName = \`fraud_\${chatId}_\${Date.now()}.jpg\`;
                const { data, error: uploadError } = await supabase.storage.from('image').upload(fileName, buffer, { contentType: 'image/jpeg' });
                
                if (!uploadError) {
                    const { data: publicUrlData } = supabase.storage.from('image').getPublicUrl(fileName);
                    await db.collection('failed_screenshots').add({
                        chatId: chatId,
                        username: msg.from.username || 'Unknown',
                        imageUrl: publicUrlData.publicUrl,
                        timestamp: new Date(),
                        reason: error.message || 'AI Validation Failed'
                    });
                }
            } catch (err) {
                console.error("Supabase Upload Error:", err.message);
            }

            `;

const match = code.match(photoBlockRegex);
if (match) {
    code = code.replace(photoBlockRegex, newPhotoBlock);
    fs.writeFileSync('index.js', code, 'utf8');
    console.log("Replaced successfully!");
} else {
    console.log("Regex did not match!");
}
