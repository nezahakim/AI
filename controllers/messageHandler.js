import commands from "./utils/commands.js";
import mediaHandler from "./mediaHandler.js";
import CheckMSG from "./checkMSG.js";
import { getGeneratedText } from "./utils/model.js";
import config from "./utils/config.js";
import Engine from "./utils/Engine.js";
import { checkUser } from "../checks.js";
import groupHandler from "./groupHandler.js";

const messageHandler = {
    handlePrivateMessage: async (bot, msg) => {
        const chatId = msg.chat.id;
        const text = msg.text || "";

        console.log(`Private message received: ${text}`);

        const responce = await checkUser(bot, msg);
        if (responce) {
            if (text.toLowerCase().startsWith("/imagine")) {
                await mediaHandler.generateImage(bot, msg);
            } else if (text.startsWith("/")) {
                await commands(bot, msg);
            } else if (!text) {
                await mediaHandler.handleMedia(bot, msg);
            } else {
                const response = CheckMSG(text);

                if (response) {
                    await bot.sendMessage(chatId, response);
                } else {
                    await messageHandler.generateLiveResponse(
                        bot,
                        chatId,
                        text,
                    );
                }
            }
        }
    },

    handleGroupMessage: async (bot, msg) => {
        const chatId = msg.chat.id;
        const text = msg.text || "";
        const botInfo = await bot.getMe();
        //const botUsername = botInfo.username.toLowerCase();
        const botUsername = "nezaai";
        console.log(`Group message received: ${text}`);

        if (text.startsWith("/")) {
            await groupHandler.handleGroupCommand(bot, msg);
        } else if (text.toLowerCase().includes(`${botUsername}`)) {
            const cleanText = text
                .toLowerCase()
                .replace(`${botUsername}`, "")
                .trim();
            if (cleanText.length > 0) {
                const responce = CheckMSG(cleanText);
                if (responce) {
                    await bot.sendMessage(chatId, responce);
                } else {
                    await messageHandler.generateLiveResponse(
                        bot,
                        chatId,
                        cleanText,
                        msg.message_id,
                    );
                }
            } else {
                await bot.sendMessage(chatId, "I'm sorry what do you mean ?");
            }
        } else if (msg.new_chat_members) {
            await groupHandler.handleNewMember(bot, msg);
            return;
        } else if (msg.left_chat_member) {
            await groupHandler.handleLeftMember(bot, msg);
        }
    },

    handleChannelMessage: async (bot, msg) => {
        const chatId = msg.chat.id;
        const text = new String(msg.text) || "";
        console.log(`Channel message received: ${text}`);

        // Check if the message is from the channel owner
        const sender = await bot.getChatMember(chatId, msg.from.id);
        if (sender.status === "owner" || sender.status === "administrator") {
            if (text.toLowerCase().startsWith("/generate")) {
                const prompt = text.slice("/generate".length).trim();
                if (prompt) {
                    await messageHandler.generateChannelContent(
                        bot,
                        chatId,
                        prompt,
                    );
                } else {
                    await bot.sendMessage(
                        chatId,
                        "Please provide a topic after /generate. For example: /generate channel description",
                    );
                }
            }
        }
        // Ignore messages from non-owners/admins
    },

    generateChannelContent: async (bot, chatId, prompt) => {
        try {
            const channelInfo = await bot.getChat(chatId);
            const fullPrompt = `Generate content for a Telegram channel named "${channelInfo.title}" about ${prompt}. Include relevant hashtags.`;

            await bot.sendMessage(
                chatId,
                "Generating content for your channel...",
            );

            let fullResponse = "";
            const textGenerator = getGeneratedText(fullPrompt);

            for await (const textChunk of textGenerator) {
                fullResponse += textChunk;
                if (
                    fullResponse.length % 100 === 0 ||
                    textChunk.endsWith(".")
                ) {
                    await bot.sendMessage(chatId, fullResponse);
                    fullResponse = ""; // Reset for the next chunk
                    await new Promise((resolve) => setTimeout(resolve, 100)); // Small delay
                }
            }

            // Send any remaining content
            if (fullResponse.trim()) {
                await bot.sendMessage(chatId, fullResponse.trim());
            }
        } catch (error) {
            console.error("Error generating channel content:", error);
            await bot.sendMessage(
                chatId,
                "Sorry, there was an error generating content for your channel. Please try again later.",
            );
        }
    },

    handleReplyToBot: async (bot, msg) => {
        const chatId = msg.chat.id;
        const text = msg.text || "";

        console.log(`Reply to bot received: ${text}`);

        await messageHandler.generateLiveResponse(
            bot,
            chatId,
            text,
            msg.message_id,
        );
    },

    generateLiveResponse: async (
        bot,
        chatId,
        userMessage,
        replyToMessageId = null,
    ) => {
        let messageId = null;
        let fullResponse = "";
        let wordBuffer = [];
        const updateInterval = 200; // Update every 200ms for a smoother experience
        let lastUpdateTime = 0;
        let typingInterval;

        const updateMessage = async (force = false) => {
            const currentTime = Date.now();
            if (force || currentTime - lastUpdateTime >= updateInterval) {
                if (wordBuffer.length > 0) {
                    fullResponse += wordBuffer.join(" ") + " ";
                    wordBuffer = [];
                }
                if (fullResponse.trim()) {
                    try {
                        if (!messageId) {
                            const sentMessage = await bot.sendMessage(
                                chatId,
                                fullResponse.trim(),
                                {
                                    reply_to_message_id: replyToMessageId,
                                    parse_mode: "Markdown",
                                },
                            );
                            messageId = sentMessage.message_id;
                        } else {
                            await bot.editMessageText(fullResponse.trim(), {
                                chat_id: chatId,
                                message_id: messageId,
                                parse_mode: "Markdown",
                            });
                        }
                        lastUpdateTime = currentTime;
                    } catch (error) {
                        console.error("Error updating message:", error);
                    }
                }
            }
        };

        try {
            // Start a repeating typing indicator
            typingInterval = setInterval(
                () => bot.sendChatAction(chatId, "typing"),
                4000,
            );

            const engine = new Engine();
            const { modelType, enhancedInput } =
                await engine.processInput(userMessage);

            // const modelInput = createModelInput(
            //     session[chatId].history,
            //     userMessage,
            // );

            for await (const word of getGeneratedText(
                chatId,
                enhancedInput,
                modelType,
            )) {
                wordBuffer.push(word);
                await updateMessage();
            }

            // Final update
            await updateMessage(true);
        } catch (error) {
            console.error("Error in generateLiveResponse:", error);
            await bot.sendMessage(chatId, config.ERROR_MESSAGE);
        } finally {
            // Clear the typing indicator interval
            clearInterval(typingInterval);
        }
    },
};

export default messageHandler;
