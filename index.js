const { GoogleGenerativeAI } = require("@google/generative-ai");
const TelegramBot = require("node-telegram-bot-api");

const token = process.env.TOKEN;
const geminiKey = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(geminiKey);

// Konfigurasi keamanan minimal (untuk mengurangi filter)
// Catatan: Gemini tetap punya safety settings bawaan dari Google
const safetySettings = [
    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
];

// Model dengan safety settings
const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    safetySettings: safetySettings
});

const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "Halo! Kirim pesan apapun. Mode tanpa filter aktif (sesuai batasan Gemini). 🤖");
});

bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === "/start") return;

    try {
        const result = await model.generateContent(text);
        const response = await result.response;
        let answer = response.text();
        
        // Jika response kosong karena diblokir safety filter
        if (!answer || answer.trim() === "") {
            answer = "⚠️ Konten tidak dapat diproses. Coba dengan pertanyaan lain.";
        }
        
        bot.sendMessage(chatId, answer);
    } catch (error) {
        console.error(error);
        
        // Tangani error karena filter safety
        if (error.message && error.message.includes("SAFETY")) {
            bot.sendMessage(chatId, "⚠️ Pertanyaan Anda terblokir oleh safety filter Gemini. Coba gunakan bahasa yang lebih netral.");
        } else {
            bot.sendMessage(chatId, "Maaf, AI sedang error. Coba lagi nanti.");
        }
    }
});

console.log("Gemini Bot aktif 🚀 (Mode tanpa filter maksimal)");
