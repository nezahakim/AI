import dotenv from "dotenv";
dotenv.config();

import { getGeneratedText } from "./controllers/utils/model.js";
import NewsService from "./News.js";
import User from "./models/User.js";
import axios from "axios";
import cron from "node-cron";

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
        message += `Have a great ${timeOfDay}! Remember, I'm here to help. Just ask if you need anything! 😊\n\n`;

        // Salutation
        message += `Best regards,\nYour AI Assistant @NezaAI`;

        console.log(message);

        await bot.sendMessage(user.telegramId, message, {
          parse_mode: "Markdown",
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

async function getNewsTeaser() {
  const fallbackNews = [
    {
      category: "General",
      title: "Stay informed on current events",
      description: "Keep up with the latest developments around the world.",
    },
    {
      category: "Palestine Update",
      title: "Ongoing situation in Palestine",
      description:
        "Continue to monitor the evolving circumstances in the region.",
    },
    {
      category: "Global Conflict",
      title: "Various global conflicts persist",
      description:
        "Stay aware of ongoing conflicts and their impact on international relations.",
    },
  ];

  try {
    const response = await axios.get(
      `https://newsapi.org/v2/top-headlines?apiKey=${process.env.NEWS_API_KEY}&language=en&pageSize=50`,
      { timeout: 5000 }, // 5 second timeout
    );

    const articles = response.data.articles;

    if (!articles || articles.length === 0) {
      throw new Error("No articles returned from API");
    }

    let newsCategories = {
      general: null,
      palestine: null,
      conflict: null,
    };

    for (let article of articles) {
      if (article && article.title && article.description) {
        const lowerTitle = article.title.toLowerCase();
        const lowerDesc = article.description.toLowerCase();

        if (!newsCategories.general) {
          newsCategories.general = article;
        }

        if (
          !newsCategories.palestine &&
          (lowerTitle.includes("palestine") ||
            lowerDesc.includes("palestine") ||
            lowerTitle.includes("gaza") ||
            lowerDesc.includes("gaza"))
        ) {
          newsCategories.palestine = article;
        }

        if (
          !newsCategories.conflict &&
          (lowerTitle.includes("war") ||
            lowerDesc.includes("war") ||
            lowerTitle.includes("conflict") ||
            lowerDesc.includes("conflict"))
        ) {
          newsCategories.conflict = article;
        }

        if (Object.values(newsCategories).every((val) => val !== null)) {
          break;
        }
      }
    }

    let newsTeaser = "📰 *Today's Top News:*\n\n";

    Object.entries(newsCategories).forEach(([category, article]) => {
      if (article) {
        const title =
          article.title.length > 100
            ? article.title.substring(0, 97) + "..."
            : article.title;
        const desc =
          article.description.length > 100
            ? article.description.substring(0, 97) + "..."
            : article.description;
        newsTeaser += `*${category.charAt(0).toUpperCase() + category.slice(1)}:* ${title}\n_${desc}_\n\n`;
      } else {
        const fallback = fallbackNews.find((news) =>
          news.category.toLowerCase().includes(category),
        );
        if (fallback) {
          newsTeaser += `*${fallback.category}:* ${fallback.title}\n_${fallback.description}_\n\n`;
        }
      }
    });

    newsTeaser += "_For more detailed news updates, use /notifynews_";

    return newsTeaser;
  } catch (error) {
    console.error("Error fetching news teaser:", error);
    let fallbackTeaser = "📰 *Today's Top News:*\n\n";
    fallbackNews.forEach((news) => {
      fallbackTeaser += `*${news.category}:* ${news.title}\n_${news.description}_\n\n`;
    });
    fallbackTeaser += "_For more detailed news updates, use /notifynews_";
    return fallbackTeaser;
  }
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
    return quote.trim();
  } catch (error) {
    console.error("Error fetching quote:", error);
    return fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
  }
}

function Updates(bot) {
  // Schedule tasks for 06:00 and 19:00 GMT+2

  cron.schedule(
    "0 6 * * *",
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
    "0 21 * * *",
    () => {
      console.log("Sending evening updates");
      sendUpdatesToUsers(bot);
    },
    {
      scheduled: true,
      timezone: "Etc/GMT-2",
    },
  );
  console.log("Scheduler started");
}
export default Updates;
