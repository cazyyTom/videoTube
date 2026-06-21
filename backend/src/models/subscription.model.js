import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema(
  {
    subscriber: {
      type: Schema.Types.ObjectId, // the user who subscribed
      ref: "User",
      required: true,
    },
    channel: {
      type: Schema.Types.ObjectId, // the user/channel being subscribed to
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// A user can only subscribe to a channel once
subscriptionSchema.index({ subscriber: 1, channel: 1 }, { unique: true });

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
