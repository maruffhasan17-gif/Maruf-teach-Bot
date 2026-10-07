const fs = require('fs');
const readline = require('readline');

async function search() {
    const fileStream = fs.createReadStream("C:/Users/HP/.gemini/antigravity/brain/7c874f1b-716d-4bc1-848e-cf1cb5ae4676/.system_generated/logs/transcript_full.jsonl");
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    for await (const line of rl) {
        if (line.includes("USER_INPUT") && line.toLowerCase().includes("youtube")) {
            console.log("\n--- USER:", JSON.parse(line).content);
        }
        if (line.includes("PLANNER_RESPONSE") && line.toLowerCase().includes("video title") && !line.includes("Select-String")) {
            const data = JSON.parse(line);
            if (data.content && data.content.includes("Title")) {
                console.log("\n--- MODEL:", data.content.substring(0, 500) + "...");
            }
        }
    }
}
search();
