const TelegramBot = require("node-telegram-bot-api");

const token = process.env.TOKEN;
const bot = new TelegramBot(token, { polling: true });

// ===== KONFIGURASI n9router via ngrok =====
const NINE_ROUTER_URL = "https://scant-opponent-drainage.ngrok-free.dev/v1/chat/completions";
const MODEL_NAME = "antigravity-bot";
const API_KEY = "sk-86350809175d5d3d-5tkncf-39701096"; // Sudah benar

const systemPrompt = `Anda adalah asisten AI yang membantu dan ramah.`;

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "🤖 Bot AI aktif! Kirim pesan apapun.");
});

let userHistory = {};

bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === "/start") return;
    if (!text) return;

    bot.sendChatAction(chatId, "typing");

    try {
        if (!userHistory[chatId]) userHistory[chatId] = [];
        userHistory[chatId].push({ role: "user", content: text });
        if (userHistory[chatId].length > 10) userHistory[chatId] = userHistory[chatId].slice(-10);

        const messagesToSend = [
            { role: "system", content: systemPrompt },
            ...userHistory[chatId]
        ];

        const response = await fetch(NINE_ROUTER_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`,
                "ngrok-skip-browser-warning": "true"
            },
            body: JSON.stringify({
                model: MODEL_NAME,
                messages: messagesToSend,
                temperature: 1.3,
                max_tokens: 4096,
                stream: false
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.error("Error:", data);
            bot.sendMessage(chatId, `❌ Error ${response.status}: ${data.error?.message || "Unknown"}`);
            return;
        }

        let answer = data.choices?.[0]?.message?.content || "Tidak ada respons.";
        
        userHistory[chatId].push({ role: "assistant", content: answer });
        
        await bot.sendMessage(chatId, answer);
        
    } catch (error) {
        console.error(error);
        bot.sendMessage(chatId, "❌ Error. Coba lagi nanti.");
    }
});

console.log("Bot aktif dengan n9router 🚀");
