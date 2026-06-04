const TelegramBot = require("node-telegram-bot-api");

const token = process.env.TOKEN;
const OPENROUTER_API_KEY = "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";

const bot = new TelegramBot(token, { polling: true });

// Daftar model (prioritas: paling stabil di awal)
const MODELS = [
    "mistralai/mistral-7b-instruct:free",
    "meta-llama/llama-3.2-3b-instruct:free",
    "nousresearch/hermes-3-llama-3.1-405b:free"
];

const systemPrompt = `Anda adalah asisten AI yang netral, objektif, profesional, dan tidak menghakimi...`;

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

// Fungsi panggil API dengan fallback ke model lain
async function callOpenRouterWithFallback(messages) {
    let lastError = null;
    
    for (let i = 0; i < MODELS.length; i++) {
        const model = MODELS[i];
        try {
            console.log(`🔄 Mencoba model: ${model}`);
            
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                    "HTTP-Referer": "https://t.me/your_bot",
                    "X-Title": "Telegram AI Bot"
                },
                body: JSON.stringify({
                    model: model,
                    messages: messages,
                    temperature: 1.3,
                    max_tokens: 4096
                })
            });

            const data = await response.json();
            
            if (response.ok && data.choices && data.choices[0]) {
                console.log(`✅ Berhasil dengan model: ${model}`);
                return data.choices[0].message.content;
            } else {
                console.log(`❌ Model ${model} gagal:`, data.error?.message);
                lastError = data.error?.message;
            }
        } catch (err) {
            console.log(`❌ Model ${model} error:`, err.message);
            lastError = err.message;
        }
    }
    
    throw new Error(`Semua model gagal: ${lastError}`);
}

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "🤖 Bot aktif! Kirim pertanyaan apapun.");
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

        const answer = await callOpenRouterWithFallback(messagesToSend);
        
        userHistory[chatId].push({ role: "assistant", content: answer });
        
        let safeAnswer = escapeMarkdown(answer);
        if (safeAnswer.length > 4000) safeAnswer = safeAnswer.substring(0, 3900) + "\n\n...";
        
        await bot.sendMessage(chatId, safeAnswer, { parse_mode: "MarkdownV2" });
        
    } catch (error) {
        console.error(error);
        bot.sendMessage(chatId, "❌ Semua model AI sedang sibuk. Coba lagi nanti.");
    }
});

console.log(`Bot aktif dengan ${MODELS.length} model fallback 🚀`);
