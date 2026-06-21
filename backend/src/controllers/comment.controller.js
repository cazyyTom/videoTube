import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ─── Get Comments for a Video ─────────────────────────────────────────────────
export const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  if (!mongoose.isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID");

  const comments = await Comment.find({ video: videoId })
    .populate("owner", "username avatar")
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  const total = await Comment.countDocuments({ video: videoId });

  return res.status(200).json(
    new ApiResponse(200, {
      comments,
      pagination: { total, page: Number(page), limit: Number(limit) },
    }, "Comments fetched successfully")
  );
});

// ─── Add Comment ──────────────────────────────────────────────────────────────
export const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;

  const video = await Video.findById(videoId);
  if (!video || !video.isPublished) throw new ApiError(404, "Video not found");

  const comment = await Comment.create({
    content,
    video:  videoId,
    owner:  req.user._id,
  });

  const populated = await comment.populate("owner", "username avatar");

  return res.status(201).json(new ApiResponse(201, { comment: populated }, "Comment added successfully"));
});

// ─── Edit Comment ─────────────────────────────────────────────────────────────
export const editComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  const comment = await Comment.findById(commentId);
  if (!comment) throw new ApiError(404, "Comment not found");
  if (comment.owner.toString() !== req.user._id.toString())
    throw new ApiError(403, "You can only edit your own comments");

  comment.content = content;
  await comment.save();

  return res.status(200).json(new ApiResponse(200, { comment }, "Comment updated successfully"));
});

// ─── Delete Comment ───────────────────────────────────────────────────────────
export const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  const comment = await Comment.findById(commentId);
  if (!comment) throw new ApiError(404, "Comment not found");
  if (comment.owner.toString() !== req.user._id.toString())
    throw new ApiError(403, "You can only delete your own comments");

  await Comment.findByIdAndDelete(commentId);

  return res.status(200).json(new ApiResponse(200, {}, "Comment deleted successfully"));
});
