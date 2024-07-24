import mongoose from "mongoose";

const ReferralSchema = new mongoose.Schema({
  referrerId: { type: String, required: true },
  referredId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  status: { type: String, enum: ["pending", "completed"], default: "pending" },
  rewardClaimed: { type: Boolean, default: false },
  isPromoCode: { type: Boolean, default: false },
});

const Referral = mongoose.model("Referral", ReferralSchema);
export default Referral;
