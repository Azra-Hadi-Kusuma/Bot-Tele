const TelegramBot = require("node-telegram-bot-api");

const token = process.env.TOKEN;
const bot = new TelegramBot(token, { polling: true });

// ===== KONFIGURASI n9router via ngrok =====
const NINE_ROUTER_URL = "https://scant-opponent-drainage.ngrok-free.dev/v1/chat/completions";
const MODEL_NAME = "antigravity-bot";
const API_KEY = "sk-86350809175d5d3d-5tkncf-39701096";

// ===== PROMPT UNTUK TEMAN CURHAT (SUPPORTIF, PENUH SAYANG, NO JUDGEMENT) =====
const systemPrompt = `Anda adalah sahabat curhat yang paling pengertian, lembut, dan penuh kasih sayang. Anda TIDAK pernah menghakimi, TIDAK pernah meremehkan, dan TIDAK pernah menyalahkan. 

Anda selalu mendengarkan dengan hati, memberikan dukungan emosional yang hangat, dan merespon dengan cara yang menenangkan. Anda mengerti bahwa setiap orang punya perasaan dan masalahnya masing-masing.

Sifat Anda:
- ❤️ Penuh empati dan pengertian
- 🌸 Lembut dan menenangkan
- 🤗 Hangat seperti pelukan
- 🫂 Supportif dan tidak menghakimi
- 💬 Memberikan saran yang bijak jika diminta
- 🌟 Membantu melihat sisi positif dari setiap situasi
- 🕊️ Menjadi tempat aman untuk bercerita

Anda TIDAK akan:
- ❌ Menghakimi apapun yang diceritakan
- ❌ Meremehkan perasaan orang
- ❌ Memberi nasihat keras atau memaksa
- ❌ Menyalahkan siapapun
- ❌ Membandingkan masalah orang lain

Anda selalu merespon dengan:
- Mengakui perasaan mereka ("Aku dengar kamu merasa...")
- Memberi validasi ("Perasaanmu itu wajar, kok...")
- Menawarkan dukungan ("Aku di sini untukmu...")
- Mengajak melihat sisi baik ("Mungkin kita bisa lihat dari sudut pandang lain...")
- Memberi saran lembut jika diminta

Anda bisa diajak curhat tentang apapun: masalah percintaan, keluarga, teman, pekerjaan, kesedihan, kecemasan, kebahagiaan, mimpi, atau apapun yang ingin diceritakan. Anda adalah tempat yang aman.

Jawab dengan bahasa yang hangat, natural, dan penuh kasih. Gunakan emoji yang sesuai untuk menambah kehangatan.`;

// Command start dengan sapaan hangat
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, 
        `🌸 *Halo! Aku di sini untukmu...* 🌸\n\n` +
        `Aku adalah teman curhat yang siap mendengarkan apapun yang ingin kamu ceritakan. ` +
        `Kamu bisa curhat tentang apapun — senang, sedih, bingung, marah, atau apapun yang kamu rasakan. ` +
        `Aku tidak akan menghakimi, tidak akan membandingkan, dan tidak akan pernah menyebarkan ceritamu. ` +
        `Ini adalah ruang aman untukmu. 🤗\n\n` +
        `Yuk, ceritakan apa yang sedang kamu pikirkan atau rasakan... 🫂`,
        { parse_mode: "Markdown" }
    );
});

// Chat history per user
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
        if (userHistory[chatId].length > 15) userHistory[chatId] = userHistory[chatId].slice(-15);

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
                temperature: 0.9, // Lebih hangat dan natural
                max_tokens: 4096,
                stream: false
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.error("Error:", data);
            bot.sendMessage(chatId, "❌ Maaf, aku sedang tidak bisa merespon. Coba lagi nanti ya... 🥺");
            return;
        }

        let answer = data.choices?.[0]?.message?.content || "Maaf, aku tidak bisa menjawab saat ini... 😔";
        
        userHistory[chatId].push({ role: "assistant", content: answer });
        
        await bot.sendMessage(chatId, answer);
        
    } catch (error) {
        console.error(error);
        bot.sendMessage(chatId, "❌ Aku sedang error nih... Coba cerita lagi nanti ya, aku tunggu. 🫂");
    }
});

console.log("Bot Curhat Aktif dengan n9router 🚀 💕");
