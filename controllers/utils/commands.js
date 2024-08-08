import weatherService from "./weatherService.js";
import searchService from "./searchService.js";
import NewsService from "../../News.js";

import {
  help,
  start,
  referral,
  leaderboard,
  daily,
  rewards,
  tutorial,
  account,
  ref,
} from "./commands/index.js";

const commands = async (bot, msg) => {
  const text = msg.text;
  const chatId = msg.chat.id;

  if (text.startsWith("/")) {
    const parts = text.substr(1).split(" ");
    const command = parts.shift().toLowerCase();
    const args = parts.join(" ");

    switch (command) {
      case "start":
        await start(bot, msg, args);
        break;
      case "ref":
        await ref(bot, msg, args);
        break;
      case "help":
        await help(bot, msg);
        break;
      case "account":
        await account(bot, msg);
        break;
      case "referral":
        await referral(bot, msg);
        break;
      case "leaderboard":
        await leaderboard(bot, msg);
        break;
      case "daily":
        await daily(bot, msg);
        break;
      case "rewards":
        await rewards(bot, msg);
        break;
      case "tutorial":
        tutorial(bot, msg);
        break;
      case "generate":
        await bot.sendMessage(
          chatId,
          `To generate images, please use /imagine followed by your description. Have fun!`,
          { parse_mode: "Markdown" },
        );
        break;
      case "search":
        if (!args) {
          await bot.sendMessage(
            chatId,
            "Please provide a search query. Usage: /search <query>",
          );
        } else {
          await searchService(bot, chatId, args);
        }
        break;
      case "weather":
        if (!args) {
          await bot.sendMessage(
            chatId,
            "Please provide a city name. Usage: /weather <city>",
          );
        } else {
          await weatherService(bot, chatId, args);
        }
        break;
      case "news":
        await bot.sendMessage(chatId, await NewsService.getNewsUpdate());
        break;
      case "support":
        await bot.sendMessage(
          chatId,
          `**💬 Need Assistance?**

If you have any questions, issues, or need help with NezaAI, we're here to assist you!

🔹 **Join Our Support Channel**:
For direct support and to connect with our team, join our Telegram support channel [NezaAI Support](https://t.me/NezaAI). We're ready to help you with any issues or questions you might have.

🔹 **Common Issues**:
- **Image Generation Not Working**: Make sure you're using the correct command format ('/imagine <description >').
- **Command Help**: Type  '/help' to see a list of available commands and features.

🔹 **Stay Updated**:
Follow us on [Telegram NezaAI](https://t.me/NezaAI), [Telegram NotifyCode Inc](https://t.me/NezaAI), and [Instagram NotifyCode Inc](https://instagram.com/notifycode) for updates, tips, and more.

Feel free to reach out if you have any questions. Let's create something amazing together! 🚀`,
          { parse_mode: "Markdown" },
        );
        break;
      default:
        await bot.sendMessage(
          chatId,
          "I don't recognize that command!\nUse /help to learn more about available commands.",
          { parse_mode: "Markdown" },
        );
        break;
    }
  }
};

export default commands;
