import imageModel from "./utils/imageModel.js";
import Promise from "bluebird";

const mediaHandler = {
    handleMedia: async (bot, msg) => {
        const chatId = msg.chat.id;
        let mediaType;

        if (msg.photo) {
            mediaType = "photo";
        } else if (msg.video) {
            mediaType = "video";
        } else if (msg.audio) {
            mediaType = "audio";
        } else if (msg.voice) {
            mediaType = "voice";
        } else if (msg.document) {
            mediaType = "document";
        }

        if (mediaType) {
            if (msg.chat.type == "group" || msg.chat.type == "supergroup") {
                console.log("i");
            } else {
                await bot.sendMessage(
                    chatId,
                    "I'm sorry, but I'm currently not available for processing files or media. Is there anything else I can help you with?",
                );
            }
        }

        if (msg.sticker || msg.animation || msg.video_note) {
            if (msg.chat.type == "group" || msg.chat.type == "supergroup") {
                console.log("i");
            } else {
                await sendMessage(chatId, "✌️");
            }
        }
    },

    generateImage: async (bot, msg) => {
        const chatId = msg.chat.id;
        const prompt = msg.text.toLowerCase().replace("/imagine", "").trim();

        if (!prompt) {
            await bot.sendMessage(
                chatId,
                "Please provide a description for the image.",
            );
            return;
        }

        await bot.sendMessage(chatId, "Sure, Here's your Image...");

        const imageBuffer = await imageModel.generateTextToImage(prompt, {
            resize: { width: 512, height: 512 },
            format: "jpeg",
            quality: 90,
        });

        if (imageBuffer) {
            await bot.sendPhoto(chatId, imageBuffer, {
                caption: `Generated image for: "${prompt}"`,
            });
        } else {
            const imageBuffer = await imageModel.generateTextToImage2(prompt, {
                resize: { width: 512, height: 512 },
                format: "jpeg",
                quality: 90,
            });
            if (imageBuffer) {
                await bot.sendPhoto(chatId, imageBuffer, {
                    caption: `Generated image for: "${prompt}"`,
                });
            } else {
                await bot.sendMessage(
                    chatId,
                    "Sorry, there was an error generating the image. Please try again.",
                );
            }
        }
    },
};

export default mediaHandler;
