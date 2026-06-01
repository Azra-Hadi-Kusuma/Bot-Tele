const { GoogleGenerativeAI } = require("@google/generative-ai");
const TelegramBot = require("node-telegram-bot-api");

const token = process.env.TOKEN;
const geminiKey = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(geminiKey);

// Konfigurasi keamanan minimal
const safetySettings = [
    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
];

const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    safetySettings: safetySettings
});

const bot = new TelegramBot(token, { polling: true });

// Fungsi untuk escape karakter MarkdownV2
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
    bot.sendMessage(msg.chat.id, "Halo! Kirim pesan apapun. AI akan menjawab dengan format yang rapi 🤖", { parse_mode: "MarkdownV2" });
});

bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === "/start") return;

    try {
        const result = await model.generateContent(text);
        const response = await result.response;
        let answer = response.text();
        
        // Escape karakter khusus MarkdownV2 biar gak error
        let safeAnswer = escapeMarkdown(answer);
        
        // Kirim dengan parse_mode MarkdownV2 biar bold/italic bisa tampil
        await bot.sendMessage(chatId, safeAnswer, { parse_mode: "MarkdownV2" });
        
    } catch (error) {
        console.error(error);
        
        if (error.message && error.message.includes("SAFETY")) {
            bot.sendMessage(chatId, "⚠️ Pertanyaan Anda terblokir oleh safety filter.");
        } else {
            // Fallback: kirim tanpa parse_mode kalau error
            bot.sendMessage(chatId, "Maaf, AI sedang error. Coba lagi nanti.");
        }
    }
});

console.log("Gemini Bot aktif 🚀 (Mode Markdown siap)");
