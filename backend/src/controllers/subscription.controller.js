import mongoose from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ─── Toggle Subscribe / Unsubscribe ──────────────────────────────────────────
export const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!mongoose.isValidObjectId(channelId)) throw new ApiError(400, "Invalid channel ID");
  if (channelId === req.user._id.toString())
    throw new ApiError(400, "You cannot subscribe to your own channel");

  const channel = await User.findById(channelId);
  if (!channel) throw new ApiError(404, "Channel not found");

  const existing = await Subscription.findOne({
    subscriber: req.user._id,
    channel:    channelId,
  });

  if (existing) {
    await Subscription.findByIdAndDelete(existing._id);
    const subscriberCount = await Subscription.countDocuments({ channel: channelId });
    return res.status(200).json(
      new ApiResponse(200, { subscribed: false, subscriberCount }, "Unsubscribed successfully")
    );
  }

  await Subscription.create({ subscriber: req.user._id, channel: channelId });
  const subscriberCount = await Subscription.countDocuments({ channel: channelId });

  return res.status(200).json(
    new ApiResponse(200, { subscribed: true, subscriberCount }, "Subscribed successfully")
  );
});

// ─── Get Subscriber Count + Subscription Status ───────────────────────────────
export const getChannelSubscriberInfo = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!mongoose.isValidObjectId(channelId)) throw new ApiError(400, "Invalid channel ID");

  const channel = await User.findById(channelId).select("username avatar");
  if (!channel) throw new ApiError(404, "Channel not found");

  const subscriberCount = await Subscription.countDocuments({ channel: channelId });

  // Check if the requesting user is subscribed (only when logged in)
  let isSubscribed = false;
  if (req.user) {
    const sub = await Subscription.findOne({
      subscriber: req.user._id,
      channel:    channelId,
    });
    isSubscribed = !!sub;
  }

  return res.status(200).json(
    new ApiResponse(200, { channel, subscriberCount, isSubscribed }, "Channel info fetched")
  );
});

// ─── Get Subscribed Channels for Current User ─────────────────────────────────
export const getSubscribedChannels = asyncHandler(async (req, res) => {
  const subscriptions = await Subscription.find({ subscriber: req.user._id })
    .populate("channel", "username avatar")
    .sort({ createdAt: -1 });

  const channels = subscriptions.map((s) => s.channel);

  return res.status(200).json(
    new ApiResponse(200, { channels }, "Subscribed channels fetched successfully")
  );
});

// ─── Get Channel Subscribers ──────────────────────────────────────────────────
export const getChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!mongoose.isValidObjectId(channelId)) throw new ApiError(400, "Invalid channel ID");

  const subscribers = await Subscription.find({ channel: channelId })
    .populate("subscriber", "username avatar")
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, {
      subscribers: subscribers.map((s) => s.subscriber),
      total:       subscribers.length,
    }, "Subscribers fetched successfully")
  );
});
