import mediaHandler from "./mediaHandler.js";

const groupHandler = {
    handleNewMember: async (bot, msg) => {
        const chatId = msg.chat.id;
        const newMembers = msg.new_chat_members;

        for (const member of newMembers) {
            if (member.username !== bot.getMe().username) {
                const welcomeMessage =
                    groupHandler.generateWelcomeMessage(member);
                await bot.sendMessage(chatId, welcomeMessage, {
                    parse_mode: "Markdown",
                });
            }
        }
    },

    generateWelcomeMessage: (member) => {
        const name = member.first_name || member.username || "New member";
        return `Welcome, ${name}! 👋

I'm NezaAI, your friendly AI assistant. Here's how I can help you:

- Answer questions on various topics
- Assist with calculations and data analysis
- Help with language translations
- Provide summaries of long texts
- And much more!
- For more information, visit our official page:[NezaAI](https://t.me/nezaai)

Feel free to tag me in your messages or reply to my messages for assistance. Enjoy your time in the group!`;
    },

    handleLeftMember: async (bot, msg) => {
        const chatId = msg.chat.id;
        const leftMember = msg.left_chat_member;

        if (leftMember.username !== bot.options.username) {
            const goodbyeMessage = `Goodbye, ${leftMember.first_name || leftMember.username || "member"}! We hope to see you again soon.`;
            await bot.sendMessage(chatId, goodbyeMessage);
        }
    },

    handleGroupCommand: async (bot, msg) => {
        const chatId = msg.chat.id;
        const command = msg.text.split(" ")[0].toLowerCase();

        switch (command) {
            case "/rules":
                await bot.sendMessage(chatId, "Here are the group rules: ...");
                break;
            case "/imagine":
                const inappropriateKeywords = [
                    "naked",
                    "nude",
                    "porn",
                    "sex",
                    "xxx",
                    "explicit",
                    "dirty",
                    "inappropriate",
                ];

                if (
                    inappropriateKeywords.some((keyword) =>
                        msg.text.toLowerCase().includes(keyword),
                    )
                ) {
                    await bot.sendMessage(
                        chatId,
                        "Sorry I can't assist you with that.",
                    );
                } else {
                    await mediaHandler.generateImage(bot, msg);
                }
                break;
            case "/help":
                await bot.sendMessage(
                    chatId,
                    "To get help, please tag me in your message or use /ask followed by your question.",
                );
                break;
            case "/nezaai":
                await bot.sendMessage(
                    chatId,
                    "Yoo sup. ✌️\nI'm NezaAI Ask me anything I'm here to help you!",
                );
                break;
            // Add more group-specific commands as needed
        }
    },
};

export default groupHandler;
