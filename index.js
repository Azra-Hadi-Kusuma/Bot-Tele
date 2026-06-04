const { Groq } = require('groq-sdk');
const TelegramBot = require("node-telegram-bot-api");

const token = process.env.TOKEN;
const groqApiKey = process.env.GROQ_API_KEY;

const groq = new Groq({ apiKey: groqApiKey });

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
    bot.sendMessage(msg.chat.id, "Halo! Kirim pesan apapun. AI Groq akan menjawab dengan cepat 🚀", { parse_mode: "MarkdownV2" });
});

bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === "/start") return;

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: text
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
            max_tokens: 4096
        });

        let answer = completion.choices[0]?.message?.content || "Maaf, tidak ada respons.";
        
        // Escape karakter khusus MarkdownV2 biar gak error
        let safeAnswer = escapeMarkdown(answer);
        
        // Kirim dengan parse_mode MarkdownV2
        await bot.sendMessage(chatId, safeAnswer, { parse_mode: "MarkdownV2" });
        
    } catch (error) {
        console.error(error);
        bot.sendMessage(chatId, "Maaf, AI sedang error. Coba lagi nanti.");
    }
});

console.log("Groq Bot aktif 🚀 (Model: Llama 3.3 70B)");
