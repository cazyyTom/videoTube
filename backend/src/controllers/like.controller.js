import mongoose from "mongoose";
import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { CommunityPost } from "../models/communityPost.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { LikeTargetEnum } from "../config/constants.js";

// ─── Internal toggle helper ───────────────────────────────────────────────────
const toggleLike = async (filter, likedBy, targetType) => {
  const existing = await Like.findOne({ ...filter, likedBy });

  if (existing) {
    await Like.findByIdAndDelete(existing._id);
    return { liked: false };
  }

  await Like.create({ ...filter, likedBy, targetType });
  return { liked: true };
};

// ─── Toggle Like on Video ─────────────────────────────────────────────────────
export const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!mongoose.isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID");

  const video = await Video.findById(videoId);
  if (!video || !video.isPublished) throw new ApiError(404, "Video not found");

  const result = await toggleLike(
    { video: videoId },
    req.user._id,
    LikeTargetEnum.VIDEO
  );

  const likeCount = await Like.countDocuments({ video: videoId });

  return res.status(200).json(
    new ApiResponse(200, { ...result, likeCount }, result.liked ? "Video liked" : "Video unliked")
  );
});

// ─── Toggle Like on Comment ───────────────────────────────────────────────────
export const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!mongoose.isValidObjectId(commentId)) throw new ApiError(400, "Invalid comment ID");

  const comment = await Comment.findById(commentId);
  if (!comment) throw new ApiError(404, "Comment not found");

  const result = await toggleLike(
    { comment: commentId },
    req.user._id,
    LikeTargetEnum.COMMENT
  );

  const likeCount = await Like.countDocuments({ comment: commentId });

  return res.status(200).json(
    new ApiResponse(200, { ...result, likeCount }, result.liked ? "Comment liked" : "Comment unliked")
  );
});

// ─── Toggle Like on Community Post ────────────────────────────────────────────
export const toggleCommunityPostLike = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  if (!mongoose.isValidObjectId(postId)) throw new ApiError(400, "Invalid post ID");

  const post = await CommunityPost.findById(postId);
  if (!post) throw new ApiError(404, "Community post not found");

  const result = await toggleLike(
    { communityPost: postId },
    req.user._id,
    LikeTargetEnum.COMMUNITY_POST
  );

  const likeCount = await Like.countDocuments({ communityPost: postId });

  return res.status(200).json(
    new ApiResponse(200, { ...result, likeCount }, result.liked ? "Post liked" : "Post unliked")
  );
});

// ─── Get Liked Videos for Current User ───────────────────────────────────────
export const getLikedVideos = asyncHandler(async (req, res) => {
  const likes = await Like.find({
    likedBy:    req.user._id,
    targetType: LikeTargetEnum.VIDEO,
  })
    .populate({
      path:    "video",
      select:  "title thumbnail views duration owner createdAt",
      populate: { path: "owner", select: "username avatar" },
    })
    .sort({ createdAt: -1 });

  const likedVideos = likes.map((l) => l.video).filter(Boolean);

  return res
    .status(200)
    .json(new ApiResponse(200, { likedVideos }, "Liked videos fetched successfully"));
});
