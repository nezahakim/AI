import TelegramBot from "node-telegram-bot-api";
import config from "./controllers/utils/config.js";
import messageHandler from "./controllers/messageHandler.js";
import mediaHandler from "./controllers/mediaHandler.js";
import groupHandler from "./controllers/groupHandler.js";
import express from "express";
import {
    userTutorialProgress,
    TutorialProcess,
} from "./controllers/utils/commands/index.js";

const app = express();
app.get("/", (req, res) => {
    res.send("NezaAI is running");
});

const port = 8000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

// Create a bot instance
const bot = new TelegramBot(config.BOT_TOKEN, { polling: true });

// Handle all incoming messages
bot.on("message", async (msg) => {
    const chatType = msg.chat.type;

    const telegramId = msg.from.id.toString();
    const progress = userTutorialProgress.get(telegramId);
    if (progress !== undefined) {
        await TutorialProcess(bot, msg);
    }
    // Check if it's a new chat member
    // if (msg.new_chat_members) {
    //     await groupHandler.handleNewMember(bot, msg);
    //     return;
    // }

    const botInfo = await bot.getMe();
    const botUsername = botInfo.username;

    if (
        msg.reply_to_message &&
        msg.reply_to_message.from.username === botUsername &&
        msg.from.username !== botUsername
    ) {
        messageHandler.handleReplyToBot(bot, msg);
    } else {
        // Handle different chat types
        switch (chatType) {
            case "private":
                messageHandler.handlePrivateMessage(bot, msg);
                break;
            case "group":
            case "supergroup":
                messageHandler.handleGroupMessage(bot, msg);
                break;
            case "channel":
                messageHandler.handleChannelMessage(bot, msg);
                break;
        }
    }

    // Check for media or documents
    if (
        msg.photo ||
        msg.video ||
        msg.audio ||
        msg.voice ||
        msg.document ||
        msg.sticker ||
        msg.animation ||
        msg.video_note
    ) {
        mediaHandler.handleMedia(bot, msg);
    }
});

// Log errors
bot.on("polling_error", (error) => {
    console.error("Polling error:", error);
});

console.log("NezaAI bot is running...");
