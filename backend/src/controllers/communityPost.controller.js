import mongoose from "mongoose";
import { CommunityPost } from "../models/communityPost.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../config/cloudinary.js";
import { CLOUDINARY_FOLDERS } from "../config/constants.js";

// ─── Create Post ──────────────────────────────────────────────────────────────
export const createCommunityPost = asyncHandler(async (req, res) => {
  const { content } = req.body;

  let image = { url: "", publicId: "" };
  if (req.file) {
    const uploaded = await uploadOnCloudinary(
      req.file.path,
      CLOUDINARY_FOLDERS.THUMBNAILS, // reuse thumbnails folder
      "image"
    );
    if (uploaded) image = { url: uploaded.secure_url, publicId: uploaded.public_id };
  }

  const post = await CommunityPost.create({
    content,
    image,
    createdBy: req.user._id,
  });

  const populated = await post.populate("createdBy", "username avatar");

  return res
    .status(201)
    .json(new ApiResponse(201, { post: populated }, "Community post created successfully"));
});

// ─── Get Posts by Channel/User ────────────────────────────────────────────────
export const getChannelPosts = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!mongoose.isValidObjectId(userId)) throw new ApiError(400, "Invalid user ID");

  const posts = await CommunityPost.find({ createdBy: userId })
    .populate("createdBy", "username avatar")
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  const total = await CommunityPost.countDocuments({ createdBy: userId });

  return res.status(200).json(
    new ApiResponse(200, {
      posts,
      pagination: { total, page: Number(page), limit: Number(limit) },
    }, "Posts fetched successfully")
  );
});

// ─── Update Post ──────────────────────────────────────────────────────────────
export const updateCommunityPost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { content } = req.body;

  const post = await CommunityPost.findById(postId);
  if (!post) throw new ApiError(404, "Post not found");
  if (post.createdBy.toString() !== req.user._id.toString())
    throw new ApiError(403, "You can only update your own posts");

  // Replace image if new one uploaded
  if (req.file) {
    if (post.image?.publicId) await deleteFromCloudinary(post.image.publicId, "image");
    const uploaded = await uploadOnCloudinary(
      req.file.path,
      CLOUDINARY_FOLDERS.THUMBNAILS,
      "image"
    );
    if (uploaded) post.image = { url: uploaded.secure_url, publicId: uploaded.public_id };
  }

  if (content !== undefined) post.content = content;
  await post.save();

  return res
    .status(200)
    .json(new ApiResponse(200, { post }, "Post updated successfully"));
});

// ─── Delete Post ──────────────────────────────────────────────────────────────
export const deleteCommunityPost = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  const post = await CommunityPost.findById(postId);
  if (!post) throw new ApiError(404, "Post not found");
  if (post.createdBy.toString() !== req.user._id.toString())
    throw new ApiError(403, "You can only delete your own posts");

  if (post.image?.publicId) await deleteFromCloudinary(post.image.publicId, "image");
  await CommunityPost.findByIdAndDelete(postId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Post deleted successfully"));
});
