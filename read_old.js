const fs = require('fs');
const readline = require('readline');

async function read() {
    const fileStream = fs.createReadStream("C:/Users/HP/.gemini/antigravity/brain/7c874f1b-716d-4bc1-848e-cf1cb5ae4676/.system_generated/logs/transcript_full.jsonl");
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let lastUserRequest = "";
    for await (const line of rl) {
        const data = JSON.parse(line);
        if (data.type === "USER_INPUT" && data.content.includes("video")) {
            lastUserRequest = data.content;
            console.log("\nUSER:", data.content.substring(0, 100));
        }
        if (data.type === "PLANNER_RESPONSE" && data.content && data.content.includes("Title:")) {
            console.log("\nMODEL:", data.content);
        }
    }
}
read();
