const TelegramBot = require("node-telegram-bot-api");

const token = process.env.TOKEN;
const bot = new TelegramBot(token, { polling: true });

const NINE_ROUTER_URL = "https://scant-opponent-drainage.ngrok-free.dev/v1/chat/completions";
const MODEL_NAME = "antigravity-bot";
const API_KEY = "sk-86350809175d5d3d-2mn5zu-a89d3c6b";

const systemPrompt = `Anda adalah asisten AI yang membantu.`;

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "🤖 Bot AI aktif!");
});

bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    if (text === "/start") return;
    if (!text) return;

    bot.sendChatAction(chatId, "typing");

    try {
        const response = await fetch(NINE_ROUTER_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`,
                "ngrok-skip-browser-warning": "true"
            },
            body: JSON.stringify({
                model: MODEL_NAME,
                messages: [{ role: "user", content: text }],
                temperature: 1.3,
                max_tokens: 4096
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            bot.sendMessage(chatId, `❌ Error: ${response.status}`);
            return;
        }

        let answer = data.choices?.[0]?.message?.content || "Tidak ada respons.";
        bot.sendMessage(chatId, answer);
        
    } catch (error) {
        console.error(error);
        bot.sendMessage(chatId, `❌ Error: ${error.message}`);
    }
});

console.log("Bot aktif 🚀");
