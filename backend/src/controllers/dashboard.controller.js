import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js";
import { CommunityPost } from "../models/communityPost.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { LikeTargetEnum } from "../config/constants.js";

// ─── Get Channel Stats ────────────────────────────────────────────────────────
export const getChannelStats = asyncHandler(async (req, res) => {
  const channelId = req.user._id;

  // Run all aggregations in parallel for performance
  const [
    videoStats,
    subscriberCount,
    totalComments,
    totalPosts,
  ] = await Promise.all([
    // Total videos, total views, total video likes
    Video.aggregate([
      { $match: { owner: new mongoose.Types.ObjectId(channelId) } },
      {
        $lookup: {
          from:         "likes",
          localField:   "_id",
          foreignField: "video",
          as:           "likes",
        },
      },
      {
        $group: {
          _id:        null,
          totalVideos: { $sum: 1 },
          totalViews:  { $sum: "$views" },
          totalLikes:  { $sum: { $size: "$likes" } },
        },
      },
    ]),

    // Total subscribers
    Subscription.countDocuments({ channel: channelId }),

    // Total comments on channel's videos
    Comment.aggregate([
      {
        $lookup: {
          from:         "videos",
          localField:   "video",
          foreignField: "_id",
          as:           "videoDoc",
        },
      },
      { $unwind: "$videoDoc" },
      {
        $match: {
          "videoDoc.owner": new mongoose.Types.ObjectId(channelId),
        },
      },
      { $count: "total" },
    ]),

    // Total community posts
    CommunityPost.countDocuments({ createdBy: channelId }),
  ]);

  const stats = videoStats[0] || { totalVideos: 0, totalViews: 0, totalLikes: 0 };

  return res.status(200).json(
    new ApiResponse(200, {
      totalVideos:      stats.totalVideos,
      totalViews:       stats.totalViews,
      totalLikes:       stats.totalLikes,
      totalSubscribers: subscriberCount,
      totalComments:    totalComments[0]?.total || 0,
      totalPosts:       totalPosts,
    }, "Channel stats fetched successfully")
  );
});

// ─── Get Channel Videos ───────────────────────────────────────────────────────
export const getChannelVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, sortBy = "createdAt", sortType = "desc" } = req.query;

  const videos = await Video.aggregate([
    { $match: { owner: new mongoose.Types.ObjectId(req.user._id) } },
    {
      $lookup: {
        from:         "likes",
        localField:   "_id",
        foreignField: "video",
        as:           "likes",
      },
    },
    {
      $lookup: {
        from:         "comments",
        localField:   "_id",
        foreignField: "video",
        as:           "comments",
      },
    },
    {
      $addFields: {
        likeCount:    { $size: "$likes"    },
        commentCount: { $size: "$comments" },
      },
    },
    { $project: { likes: 0, comments: 0 } },
    { $sort: { [sortBy]: sortType === "asc" ? 1 : -1 } },
    { $skip: (Number(page) - 1) * Number(limit) },
    { $limit: Number(limit) },
  ]);

  const total = await Video.countDocuments({ owner: req.user._id });

  return res.status(200).json(
    new ApiResponse(200, {
      videos,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
    }, "Channel videos fetched successfully")
  );
});

// ─── Get Public Channel Profile ───────────────────────────────────────────────
export const getChannelProfile = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!mongoose.isValidObjectId(channelId)) throw new ApiError(400, "Invalid channel ID");

  const profile = await Video.aggregate([
    { $match: { owner: new mongoose.Types.ObjectId(channelId), isPublished: true } },
    {
      $lookup: {
        from:         "users",
        localField:   "owner",
        foreignField: "_id",
        as:           "ownerDetails",
      },
    },
    { $unwind: "$ownerDetails" },
    {
      $group: {
        _id:         "$owner",
        username:    { $first: "$ownerDetails.username" },
        avatar:      { $first: "$ownerDetails.avatar"   },
        joinedAt:    { $first: "$ownerDetails.createdAt"},
        totalVideos: { $sum: 1 },
        totalViews:  { $sum: "$views" },
        videos:      {
          $push: {
            _id:       "$_id",
            title:     "$title",
            thumbnail: "$thumbnail",
            views:     "$views",
            duration:  "$duration",
            createdAt: "$createdAt",
          },
        },
      },
    },
    {
      $lookup: {
        from:         "subscriptions",
        localField:   "_id",
        foreignField: "channel",
        as:           "subscribers",
      },
    },
    {
      $addFields: {
        subscriberCount: { $size: "$subscribers" },
        // Slice to show only 12 recent videos on profile
        videos: { $slice: ["$videos", 12] },
      },
    },
    { $project: { subscribers: 0 } },
  ]);

  if (!profile.length) throw new ApiError(404, "Channel not found");

  return res.status(200).json(
    new ApiResponse(200, { channel: profile[0] }, "Channel profile fetched successfully")
  );
});
