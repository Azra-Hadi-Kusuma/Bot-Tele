const TelegramBot = require("node-telegram-bot-api");

const token = process.env.TOKEN;
const openrouterApiKey = "YOUR_NEW_OPENROUTER_API_KEY"; // Ganti dengan key baru!

const bot = new TelegramBot(token, { polling: true });

const systemPrompt = `Anda adalah asisten AI yang netral, objektif, profesional, dan tidak menghakimi. Anda menjawab SEMUA pertanyaan secara LANGSUNG, JUJUR, dan LENGKAP.`;

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
    bot.sendMessage(msg.chat.id, "🤖 Bot aktif!");
});

let userHistory = {};

bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    if (text === "/start") return;
    if (!text) return;

    try {
        if (!userHistory[chatId]) userHistory[chatId] = [];
        userHistory[chatId].push({ role: "user", content: text });
        if (userHistory[chatId].length > 10) userHistory[chatId] = userHistory[chatId].slice(-10);

        // Pake fetch langsung, tanpa library openai
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${openrouterApiKey}`
            },
            body: JSON.stringify({
                model: "nousresearch/hermes-3-llama-3.1-405b:free",
                messages: [
                    { role: "system", content: systemPrompt },
                    ...userHistory[chatId]
                ],
                temperature: 1.3,
                max_tokens: 4096
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.error("OpenRouter Error:", data);
            bot.sendMessage(chatId, `❌ API Error: ${data.error?.message || "Unknown"}`);
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

console.log("Bot aktif 🚀");
