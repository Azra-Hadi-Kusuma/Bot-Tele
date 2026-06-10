const TelegramBot = require("node-telegram-bot-api");

const token = process.env.TOKEN;
const bot = new TelegramBot(token, { polling: true });

// ===== KONFIGURASI 9ROUTER =====
const NINE_ROUTER_URL = "http://localhost:20128/v1/chat/completions";
const MODEL_NAME = "antigravity-bot"; // Nama combo kamu
const API_KEY = "sk_9router"; // API key default 9Router

// System prompt
const systemPrompt = `Anda adalah asisten AI yang membantu dan ramah.`;

// Escape MarkdownV2
function escapeMarkdown(text) {
    const reservedChars = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'];
    let escaped = '';
    for (let i = 0; i < text.length; i++) {
        if (reservedChars.includes(text[i])) {
            escaped += '\\' + text[i];
        } else {
            escaped += text[i];
        }
    }
    return escaped;
}

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
                "Authorization": `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: MODEL_NAME,
                messages: messagesToSend,
                temperature: 1.3,
                max_tokens: 4096
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.error("Error:", data);
            bot.sendMessage(chatId, `❌ Error: ${data.error?.message || "Unknown"}`);
            return;
        }

        let answer = data.choices[0]?.message?.content || "Tidak ada respons.";
        userHistory[chatId].push({ role: "assistant", content: answer });
        
        let safeAnswer = escapeMarkdown(answer);
        if (safeAnswer.length > 4000) safeAnswer = safeAnswer.substring(0, 3900) + "\n\n...";
        
        await bot.sendMessage(chatId, safeAnswer, { parse_mode: "MarkdownV2" });
        
    } catch (error) {
        console.error(error);
        bot.sendMessage(chatId, "❌ Error. Coba lagi nanti.");
    }
});

console.log(`Bot aktif dengan combo ${MODEL_NAME} 🚀`);
