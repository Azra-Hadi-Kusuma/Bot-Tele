const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const bot = new TelegramBot(process.env.TOKEN, {
  polling: true
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

console.log('Gemini Bot aktif 🚀');

bot.on('message', async (msg) => {

  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text) return;

  try {

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash'
    });

    const result = await model.generateContent(text);

    const response = result.response.text();

    bot.sendMessage(chatId, response);

  } catch (err) {

    console.log(err);

    bot.sendMessage(chatId, 'Error 😢');
  }

});
