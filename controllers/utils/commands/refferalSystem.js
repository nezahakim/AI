import User from "../../../models/User.js";
import Referral from "../../../models/Referral.js";

// Promo Codes
const PROMO_CODES = {
    notifycode: { points: 100, maxUses: Infinity },
    litekid: { points: 100, maxUses: Infinity },
    // Add more promo codes as needed
};

const addPremiumTime = async (telegramId, days) => {
    const user = await User.findOne({ telegramId });
    const currentPremium =
        user.premiumUntil && user.premiumUntil > new Date()
            ? user.premiumUntil
            : new Date();
    user.premiumUntil = moment(currentPremium).add(days, "days").toDate();
    await user.save();
};

const checkAndAwardReferralRewards = async (referrerId) => {
    const completedReferrals = await Referral.countDocuments({
        referrerId,
        status: "completed",
    });
    const user = await User.findOne({ telegramId: referrerId });

    if (completedReferrals >= 250) {
        await addPremiumTime(referrerId, 90); // 3 months
        user.points += 1000;
    } else if (completedReferrals >= 100) {
        await addPremiumTime(referrerId, 30); // 1 month
        user.points += 500;
    } else if (completedReferrals >= 50) {
        await addPremiumTime(referrerId, 7); // 1 week
        user.points += 200;
    }

    await user.save();
    return completedReferrals;
};

// Helper Functions
const generateReferralCode = () =>
    Math.random().toString(36).substring(2, 10).toUpperCase();

export const refProcess = async (bot, msg, args) => {
    const code = args.trim();
    const userId = msg.from.id.toString();
    let user = await User.findOne({ telegramId: userId });

    if (!user) {
        user = new User({
            telegramId: userId,
            username: msg.from.username,
            names: `${msg.from.first_name} ${msg.from.last_name || ""}`.trim(),
            referralCode: generateReferralCode(),
        });
        await user.save();
    }

    // Check if it's a promo code
    if (PROMO_CODES.hasOwnProperty(code)) {
        if (user.usedPromoCodes.includes(code)) {
            return bot.sendMessage(
                userId,
                "You've already used this promo code! 😊",
            );
        }

        const promoDetails = PROMO_CODES[code];
        const usageCount = await Referral.countDocuments({
            referrerId: code,
            isPromoCode: true,
        });

        if (usageCount >= promoDetails.maxUses) {
            return bot.sendMessage(
                userId,
                "Sorry, this promo code has reached its maximum usage limit. 😔",
            );
        }

        user.points += promoDetails.points;
        user.usedPromoCodes.push(code);
        await user.save();

        const referral = new Referral({
            referrerId: code,
            referredId: userId,
            status: "completed",
            isPromoCode: true,
        });
        await referral.save();

        return bot.sendMessage(
            userId,
            `Congratulations! 🎉 You've redeemed the promo code and earned ${promoDetails.points} points!`,
        );
    }

    // It's a referral code
    const referrer = await User.findOne({ referralCode: code });

    if (!referrer || referrer.telegramId === userId) {
        return bot.sendMessage(
            userId,
            "Invalid referral code. Please check and try again.",
        );
    }

    if (user.referredBy) {
        return bot.sendMessage(
            userId,
            "You've already been referred by someone. You can't use another referral code.",
        );
    }

    user.referredBy = referrer.telegramId;
    user.points += 50; // Bonus points for using a referral code
    await user.save();

    referrer.points += 50;
    await referrer.save();

    const referral = new Referral({
        referrerId: referrer.telegramId,
        referredId: userId,
        status: "completed",
    });
    await referral.save();

    const referralCount = await checkAndAwardReferralRewards(
        referrer.telegramId,
    );

    bot.sendMessage(
        userId,
        "You've successfully used a referral code! 🎉 You've earned 50 bonus points!",
    );
    bot.sendMessage(
        referrer.telegramId,
        `Congratulations! 🎊 Someone has used your referral code. Your referral count is now ${referralCount}. You've earned 50 points!`,
    );
};
