import User from "./models/User.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

export const checkUser = async (bot, msg) => {
  const userId = msg.from.id;

  const channelUsername = "@NezaAi"; // Replace with your actual channel username
  const generateReferralCode = () =>
    Math.random().toString(36).substring(2, 10).toUpperCase();

  try {
    // Check if user is a member of the channel
    const data = await bot.getChatMember(channelUsername, userId);

    if (
      data.status === "member" ||
      data.status === "administrator" ||
      data.status === "creator"
    ) {
      // User is a member, proceed with checking and creating user in DB
      const user = await User.findOne({ telegramId: userId });

      if (!user) {
        // User does not exist, create a new user
        const newUser = new User({
          telegramId: userId,
          username: msg.from.username,
          names: `${msg.from.first_name} ${msg.from.last_name || ""}`.trim(),
          referralCode: generateReferralCode(),
        });

        await newUser.save();
        console.log("New user created:", newUser);

        bot.sendMessage(
          msg.chat.id,
          `🎉 Welcome aboard!\nYou've successfully joined our channel, and we've created a new account for you. 🚀\n\nExplore NezaAI's amazing features and stay tuned for updates and exclusive content. Feel free to ask me anything or start generating images! 🌟`,
        );
      } else {
        // User already exists
        return true;
      }
    } else {
      // User is not a member, ask them to join the channel
      bot.sendMessage(
        msg.chat.id,
        `🔔 To get started with NezaAI, please join our official channel: ${channelUsername}. By joining, you'll receive updates, exclusive features, and support. Join now to unlock all the benefits and start exploring our AI-powered tools! 🌟`,
      );
    }
  } catch (error) {
    console.error("Error:", error);
    bot.sendMessage(
      msg.chat.id,
      "Sorry, something went wrong. Please try again later.",
    );
  }
};
