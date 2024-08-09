import dotenv from "dotenv";
dotenv.config();

import { getGeneratedText } from "./controllers/utils/model.js";
import NewsService from "./News.js";
import User from "./models/User.js";
import axios from "axios";
import cron from "node-cron";

const escapeMarkdown = (text) => {
  const specialChars = "_`[";
  return text
    .split("")
    .map((char) => {
      if (specialChars.includes(char)) {
        return "\\" + char;
      }
      return char;
    })
    .join("");
};

async function sendUpdatesToUsers(bot) {
  try {
    const users = await User.find({});

    for (const user of users) {
      try {
        const currentHour = new Date().getHours();
        const greeting = currentHour < 12 ? "Good morning" : "Good evening";
        const timeOfDay = currentHour < 12 ? "day" : "evening";

        let message = `${greeting}, ${user.names}! 👋\n\n`;

        // Weather teaser
        const weatherTeaser = await getWeatherTeaser(user.city || "europe");
        message += `🌡 *Weather Highlight:*\n${weatherTeaser}\n`;
        message += `_For detailed weather, if you want to know weather in your city and have some Advise of how you can treat yourself today, use /weather <name of your city>_\n\n`;
        // News Update
        const newsUpdate = await NewsService.getNewsUpdate();
        message += `${newsUpdate}\n\n`;

        // Telegram trends
        const telegramTrends = await getTelegramTrends();
        message += `🔥 *Trending on Telegram:*\n${telegramTrends}\n\n`;

        // Motivational quote
        const quote = await getQuoteOfTheDay();
        message += `💡 *Quote of the Day:*\n${quote}\n\n`;

        // Call-to-action
        message += `Have a great ${timeOfDay}! Remember, I'm here to help. Just ask if you need anything! 😊\n\n from @Notifycode .`;

        // Salutation
        message += `Best regards,\nYour AI Assistant @NezaAI`;
        const sanitizedMessage = escapeMarkdown(message);
        await bot.sendMessage(user.telegramId, sanitizedMessage, {
          parse_mode: "Markdown",
          disable_web_page_preview: true,
        });

        console.log(`Message sent to user: ${user.username}`);
      } catch (error) {
        console.error(`Error sending message to user ${user.username}:`, error);
      }
    }
  } catch (error) {
    console.error("Error in sendUpdatesToUsers:", error);
  }
}

async function getWeatherTeaser(city) {
  try {
    const response = await axios.get(
      `http://api.weatherapi.com/v1/current.json?key=${process.env.WEATHER_API_KEY}&q=${city}&aqi=no`,
    );
    const { current, location } = response.data;
    return `It's currently ${current.temp_c}°C in ${location.name} with ${current.condition.text.toLowerCase()}.`;
  } catch (error) {
    console.error("Error fetching weather teaser:", error);
    return "Weather information is currently unavailable.";
  }
}

async function getTelegramTrends() {
  return `1. #NezaAI\n2. @Notifycode We have Introduced new Features and Services. \n3. #Remember to use Our Bot in your Groups also.`;
}

async function getQuoteOfTheDay() {
  const fallbackQuotes = [
    "Be the change you wish to see in the world. - Mahatma Gandhi",
    "The only way to do great work is to love what you do. - Steve Jobs",
    "In the middle of difficulty lies opportunity. - Albert Einstein",
    "Believe you can and you're halfway there. - Theodore Roosevelt",
    "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt",
  ];

  try {
    let quote = "";
    let enhancedInput =
      fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)] +
      " With The Given Example of Quote make a qoute for the user and then Make a simple Advice for Him/her in 50 words about the qoute you made.";
    for await (const c of getGeneratedText(1, enhancedInput)) {
      quote += c;
    }
    return quote;
  } catch (error) {
    console.error("Error fetching quote:", error);
    return fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
  }
}

function Updates(bot) {
  // Schedule tasks for 06:00 and 19:00 GMT+2

  cron.schedule(
    "15 9 * * *",
    () => {
      console.log("Sending morning updates");
      sendUpdatesToUsers(bot);
    },
    {
      scheduled: true,
      timezone: "Etc/GMT-2",
    },
  );
  cron.schedule(
    "0 18 * * *",
    () => {
      const now = new Date();
      console.log(
        `Sending evening updates at ${now.toLocaleString("de-DE", { timeZone: "Europe/Berlin" })}`,
      );
      sendUpdatesToUsers(bot);
    },
    {
      scheduled: true,
      timezone: "Europe/Berlin",
    },
  );
  console.log("Scheduler started");
}

export default Updates;
