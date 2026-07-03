const TelegramBot = require("node-telegram-bot-api");

const token = process.env.TOKEN;
const bot = new TelegramBot(token, { polling: true });

// ===== KONFIGURASI HERMES VIA n9router =====
const NINE_ROUTER_URL = "http://localhost:20128/v1/chat/completions";
const MODEL_NAME = "antigravity-bot";  // Combo Hermes + Antigravity
const API_KEY = "sk_9router";          // API key n9router

// ===== SYSTEM PROMPT UNTUK HERMES =====
const systemPrompt = `Anda adalah Hermes Agent, AI assistant yang cerdas dan membantu. 
Anda memiliki akses ke berbagai tools dan memory. 
Jawab pertanyaan dengan akurat dan profesional.`;

// ===== SESSION MANAGEMENT (Agar Hermes ingat percakapan) =====
let userSessions = {};

// Fungsi escape MarkdownV2
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
    const chatId = msg.chat.id;
    // Reset session untuk user ini
    userSessions[chatId] = [];
    bot.sendMessage(chatId, "🤖 Hermes Agent aktif! Kirim pesan apapun. Saya punya memory dan tools!", { parse_mode: "MarkdownV2" });
});

bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === "/start") return;
    if (!text) return;

    bot.sendChatAction(chatId, "typing");

    try {
        // 1. Inisialisasi session user
        if (!userSessions[chatId]) {
            userSessions[chatId] = [];
        }

        // 2. Tambahkan pesan user ke history
        userSessions[chatId].push({ role: "user", content: text });

        // 3. Batasi history (10 pesan terakhir)
        if (userSessions[chatId].length > 10) {
            userSessions[chatId] = userSessions[chatId].slice(-10);
        }

        // 4. Siapkan messages untuk Hermes
        const messages = [
            { role: "system", content: systemPrompt },
            ...userSessions[chatId]
        ];

        // 5. Panggil Hermes via n9router
        const response = await fetch(NINE_ROUTER_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: MODEL_NAME,
                messages: messages,
                temperature: 1.0,
                max_tokens: 4096,
                stream: false
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Error:", data);
            bot.sendMessage(chatId, `❌ Error: ${data.error?.message || "Unknown"}`);
            return;
        }

        let answer = data.choices?.[0]?.message?.content || "Tidak ada respons.";

        // 6. Simpan jawaban ke history
        userSessions[chatId].push({ role: "assistant", content: answer });

        // 7. Escape dan kirim ke user
        let safeAnswer = escapeMarkdown(answer);
        if (safeAnswer.length > 4000) {
            safeAnswer = safeAnswer.substring(0, 3900) + "\n\n... (pesan dipotong)";
        }

        await bot.sendMessage(chatId, safeAnswer, { parse_mode: "MarkdownV2" });

    } catch (error) {
        console.error(error);
        bot.sendMessage(chatId, "❌ Error. Coba lagi nanti.");
    }
});

console.log("🤖 Bot Telegram dengan Hermes Agent aktif 🚀");
