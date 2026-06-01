const { GoogleGenerativeAI } = require("@google/generative-ai");
const TelegramBot = require("node-telegram-bot-api");

const token = process.env.TOKEN;
const geminiKey = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(geminiKey);

// ✅ Model yang masih aktif (gemini-2.5-flash)
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "Halo! Kirim pesan apapun, saya akan jawab pakai Gemini AI 🤖");
});

bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === "/start") return;

    try {
        const result = await model.generateContent(text);
        const response = await result.response;
        const answer = response.text();
        bot.sendMessage(chatId, answer);
    } catch (error) {
        console.error(error);
        bot.sendMessage(chatId, "Maaf, AI sedang error. Coba lagi nanti.");
    }
});

console.log("Gemini Bot aktif 🚀");
