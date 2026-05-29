const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TOKEN;

const bot = new TelegramBot(token, { polling: true });

console.log('Bot jalan...');

bot.on('message', (msg) => {
  const text = msg.text;

  if (text === '/start') {
    bot.sendMessage(msg.chat.id, 'Halo 👋 Bot aktif!');
  } else {
    bot.sendMessage(msg.chat.id, 'Kamu bilang: ' + text);
  }
});
