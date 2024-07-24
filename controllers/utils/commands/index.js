import User from "../../../models/User.js";
import Referral from "../../../models/Referral.js";
import { welcomeMSG, helpMSG } from "./messages.js";
import { refProcess } from "./refferalSystem.js";

const generateReferralCode = () =>
    Math.random().toString(36).substring(2, 10).toUpperCase();

// Bot Commands
export const start = async (bot, msg, args) => {
    const telegramId = msg.from.id.toString();

    let user = await User.findOne({ telegramId });
    if (!user) {
        user = new User({
            telegramId: telegramId,
            username: msg.from.username,
            names: `${msg.from.first_name} ${msg.from.last_name || ""}`.trim(),
            referralCode: generateReferralCode(),
        });
        await user.save();
        bot.sendMessage(telegramId, welcomeMSG, {
            parse_mode: "Markdown",
            disable_web_page_preview: true,
        });
    } else {
        bot.sendMessage(telegramId, welcomeMSG, {
            parse_mode: "Markdown",
            disable_web_page_preview: true,
        });
    }

    if (args) {
        await refProcess(bot, msg, args);
    }
};

import moment from "moment";

export const account = async (bot, msg) => {
    const telegramId = msg.from.id.toString();
    try {
        const user = await User.findOne({ telegramId });
        if (user) {
            const referralCount = await Referral.countDocuments({
                referrerId: telegramId,
                status: "completed",
            });
            const premiumStatus =
                user.premiumUntil && user.premiumUntil > new Date()
                    ? `until ${moment(user.premiumUntil).format("MMMM D, YYYY")}`
                    : "Not active";

            // const escapeMarkdown = (text) => {
            //     return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, "\\$&");
            // };

            const accountInfo = `🌟 <b>Your Account Dashboard</b> 🌟

👤 <b>User Profile</b>
• Name: ${escapeHTML(user.names || "Not set")}
• Username: ${user.username ? "@" + escapeHTML(user.username) : "Not set"}
• Joined: ${moment(user.joinedAt).format("MMM D, YYYY")}
• Account Age: ${moment().diff(user.joinedAt, "days")} days

📊 <b>Account Statistics</b>
• 🏆 Referrals: ${referralCount}
• 💎 Points: ${user.points || 0}
• 🎯 Tasks Completed: ${user.tasksCompleted || 0}
• 💰 Total Earnings: $${(user.totalEarnings || 0).toFixed(2)}

🚀 <b>Account Status</b>
• 🌟 Level: ${calculateLevel(user.points)}
• ⭐️ Premium: ${escapeHTML(premiumStatus)}
• 🔑 Referral Code: <code>${escapeHTML(user.referralCode || "Not generated")}</code>

📈 <b>Progress to Next Level</b>
${generateProgressBar(user.points, getNextLevelPoints(user.points))}

🏅 <b>Achievements</b>
${generateAchievements(user)}

💡 <b>Quick Tips</b>
• Use /referral to get your unique referral link
• Complete daily tasks with /tasks to earn more points
• Invite friends to boost your referral count
• Upgrade to Premium for exclusive benefits

<i>Need help or have questions? Use /help for assistance!</i>`;

            await bot.sendMessage(telegramId, accountInfo, {
                parse_mode: "HTML",
                disable_web_page_preview: true,
            });

            // Helper functions
            function escapeHTML(text) {
                return text
                    .toString()
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/"/g, "&quot;")
                    .replace(/'/g, "&#039;");
            }

            function calculateLevel(points) {
                return Math.floor(Math.sqrt(points / 100)) + 1;
            }

            function getNextLevelPoints(points) {
                const currentLevel = calculateLevel(points);
                return currentLevel * currentLevel * 100;
            }

            function generateProgressBar(current, max, length = 20) {
                const filledLength = Math.round((length * current) / max);
                const emptyLength = length - filledLength;
                return (
                    "█".repeat(filledLength) +
                    "░".repeat(emptyLength) +
                    ` ${current}/${max}`
                );
            }

            function generateAchievements(user) {
                const achievements = [];
                if (user.referralCount >= 10)
                    achievements.push("🎉 Super Referrer");
                if (user.tasksCompleted >= 100)
                    achievements.push("🏆 Task Master");
                if (user.points >= 1000)
                    achievements.push("💎 Point Collector");
                if (moment().diff(user.joinedAt, "months") >= 6)
                    achievements.push("🏅 Loyal Member");

                return achievements.length > 0
                    ? achievements.join(" | ")
                    : "Complete tasks and refer friends to earn achievements!";
            }
        } else {
            await bot.sendMessage(
                telegramId,
                "Oops! 😅 We couldn't find your account. Use /start to create one!",
            );
        }
    } catch (error) {
        console.error("Error in account function:", error);

        const allUsers = await User.findOne({ telegramId: telegramId });
        console.log("All users in database:");
        console.log(JSON.stringify(allUsers, null, 2));

        await bot.sendMessage(
            telegramId,
            "An error occurred while fetching your account information. Please try again later.",
        );
    }
};

export const referral = async (bot, msg) => {
    const telegramId = msg.from.id.toString();
    const user = await User.findOne({ telegramId });

    if (user) {
        const referralCount = await Referral.countDocuments({
            referrerId: telegramId,
            status: "completed",
        });
        const referralMessage = `
🎉 *Your VIP Referral Program* 🎉

Your unique code: ${user.referralCode}
Current successful referrals: ${referralCount}

🚀 Share the magic! Invite friends and unlock awesome rewards:
• 50 referrals: 1 week Premium + 200 points
• 100 referrals: 1 month Premium + 700 points
• 250 referrals: 3 months Premium + 1200 points

🏆 Top referrer this month gets 1 MONTH of Premium!

Share this link with your friends:
t.me/nezaAIbot?start=${user.referralCode}

Let's grow together! 💪
        `;
        bot.sendMessage(telegramId, referralMessage, {
            parse_mode: "Markdown",
        });
    } else {
        bot.sendMessage(
            telegramId,
            "Hmm, something's not right. 🤔 Use /start to create your account first!",
        );
    }
};

export const leaderboard = async (bot, msg) => {
    try {
        const topReferrers = await Referral.aggregate([
            { $match: { status: "completed", isPromoCode: { $ne: true } } },
            { $group: { _id: "$referrerId", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
        ]);

        let leaderboardMessage = `
🏆 *Referral Champions* 🏆
Who will be our Referral Superstar? 🌟
        `;

        for (let i = 0; i < topReferrers.length; i++) {
            const user = await User.findOne({
                telegramId: topReferrers[i]._id,
            });
            const medal =
                i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "🏅";
            const displayName = user
                ? user.names || user.username || "Unknown User"
                : "Unknown User";
            leaderboardMessage += `\n${medal} ${i + 1}. ${displayName}: ${topReferrers[i].count} referrals`;
        }

        leaderboardMessage += `
        
🚀 You could be here too! Use /referral to get started.
🔥 Remember, the #1 referrer this month gets 1 MONTH of Premium! 🔥
        `;

        await bot.sendMessage(msg.chat.id, leaderboardMessage, {
            parse_mode: "Markdown",
        });
    } catch (error) {
        console.error("Error generating leaderboard:", error);
        await bot.sendMessage(
            msg.chat.id,
            "An error occurred while generating the leaderboard. Please try again later.",
        );
    }
};

export const ref = async (bot, msg, args) => {
    await refProcess(bot, msg, args);
};

// Daily Bonus
export const daily = async (bot, msg) => {
    const telegramId = msg.from.id.toString();
    const user = await User.findOne({ telegramId });

    if (user) {
        const now = new Date();
        if (
            !user.lastDailyBonus ||
            moment(user.lastDailyBonus).isBefore(moment(now).startOf("day"))
        ) {
            user.points += 10;
            user.lastDailyBonus = now;
            await user.save();
            bot.sendMessage(
                telegramId,
                "🎁 You've claimed your daily bonus of 10 points! Come back tomorrow for more!",
            );
        } else {
            bot.sendMessage(
                telegramId,
                "⏳ You've already claimed your daily bonus today. Come back tomorrow!",
            );
        }
    } else {
        bot.sendMessage(
            telegramId,
            "Oops! 😅 We couldn't find your account. Use /start to create one!",
        );
    }
};

export const help = async (bot, msg) => {
    const telegramId = msg.from.id.toString();
    bot.sendMessage(telegramId, helpMSG, {
        parse_mode: "Markdown",
    });
};

const calculateRewards = async (telegramId) => {
    const user = await User.findOne({ telegramId });
    if (!user) return null;

    const referrals = await Referral.find({
        referrerId: telegramId,
        status: "completed",
    });
    const referralCount = referrals.length;

    let rewards = {
        points: user.points,
        premiumDays: 0,
        tier: "Bronze",
        nextTier: {},
        availablePerks: [],
    };

    // Calculate premium days
    if (user.premiumUntil && user.premiumUntil > new Date()) {
        rewards.premiumDays = Math.ceil(
            (user.premiumUntil - new Date()) / (1000 * 60 * 60 * 24),
        );
    }

    // Determine tier and next tier goals
    if (referralCount >= 250) {
        rewards.tier = "Platinum";
        rewards.availablePerks.push(
            "Custom AI Model Training",
            "Priority Support",
        );
    } else if (referralCount >= 100) {
        rewards.tier = "Gold";
        rewards.nextTier = { name: "Platinum", referrals: 25 - referralCount };
        rewards.availablePerks.push(
            "Advanced Image Editing",
            "Bulk Generation",
        );
    } else if (referralCount >= 50) {
        rewards.tier = "Silver";
        rewards.nextTier = { name: "Gold", referrals: 10 - referralCount };
        rewards.availablePerks.push(
            "Extended Generation Time",
            "4K Resolution",
        );
    } else {
        rewards.nextTier = { name: "Silver", referrals: 5 - referralCount };
        rewards.availablePerks.push("Daily Bonus", "Basic Image Generation");
    }

    // Calculate points-based perks
    if (user.points >= 1200)
        rewards.availablePerks.push("Redeem Custom AI Art");
    if (user.points >= 700)
        rewards.availablePerks.push("Exclusive Telegram Stickers");
    if (user.points >= 200) rewards.availablePerks.push("AI-Generated Avatar");

    return rewards;
};

export const rewards = async (bot, msg) => {
    const telegramId = msg.from.id.toString();
    const rewards = await calculateRewards(telegramId);

    if (!rewards) {
        return bot.sendMessage(
            telegramId,
            "Oops! We couldn't find your account. Use /start to create one!",
        );
    }

    const rewardsMessage = `
🏆 *Your NezaAI Rewards*

🌟 Tier: ${rewards.tier}
💎 Points: ${rewards.points}
⏳ Premium Days: ${rewards.premiumDays}

${rewards.nextTier.name ? `Next Tier: ${rewards.nextTier.name} (${rewards.nextTier.referrals} more referrals needed)` : "You've reached the highest tier!"}

🎁 Available Perks:
${rewards.availablePerks.map((perk) => `• ${perk}`).join("\n")}

Invite more friends to unlock exciting rewards!
Use /referral to get your unique referral code.
    `;

    bot.sendMessage(telegramId, rewardsMessage, { parse_mode: "Markdown" });
};

const tutorialSteps = [
    {
        message:
            "Welcome to the NezaAI tutorial! Let's start with image generation. Type '/imagine a futuristic city' to create your first AI image.",
        expectedCommand: "/imagine",
        response:
            "Great job! You've created your first AI-generated image. Let's try something else.",
    },
    {
        message:
            "Now, let's check the weather. Type '/weather' followed by your city name.",
        expectedCommand: "/weather",
        response:
            "Excellent! You now know how to check weather updates. Moving on to the next feature.",
    },
    {
        message:
            "Let's explore the web with AI. Type '/search latest AI trends' to see how it works.",
        expectedCommand: "/search",
        response:
            "Perfect! You've mastered the search feature. Let's check out your rewards next.",
    },
    {
        message: "Check your rewards and tier status by typing '/rewards'.",
        expectedCommand: "/rewards",
        response: "Awesome! You now know how to track your rewards and perks.",
    },
    {
        message:
            "Finally, get your referral code by typing '/referral'. Share this with friends to earn more rewards!",
        expectedCommand: "/referral",
        response:
            "Congratulations! You've completed the NezaAI tutorial. You're now ready to explore all our features!",
    },
];

export const userTutorialProgress = new Map();

export const tutorial = (bot, msg) => {
    try {
        const telegramId = msg.from.id.toString();
        userTutorialProgress.set(telegramId, 0);
        bot.sendMessage(telegramId, tutorialSteps[0].message);
    } catch (error) {
        console.error("Error sending tutorial message:", error);
    }
};

export const TutorialProcess = async (bot, msg) => {
    const telegramId = msg.from.id.toString();
    const progress = userTutorialProgress.get(telegramId);

    if (progress !== undefined) {
        const currentStep = tutorialSteps[progress];
        if (msg.text.startsWith(currentStep.expectedCommand)) {
            bot.sendMessage(telegramId, currentStep.response);

            if (progress < tutorialSteps.length - 1) {
                userTutorialProgress.set(telegramId, progress + 1);
                bot.sendMessage(
                    telegramId,
                    tutorialSteps[progress + 1].message,
                );
            } else {
                userTutorialProgress.delete(telegramId);
                const user = await User.findOne({ telegramId });
                user.points += 50; // Reward for completing tutorial
                await user.save();
                bot.sendMessage(
                    telegramId,
                    "Tutorial completed! You've earned 50 points. Enjoy using NezaAI!",
                );
            }
        }
    }
};
