import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../config/cloudinary.js";
import { CLOUDINARY_FOLDERS } from "../config/constants.js";

// ─── Upload Video ─────────────────────────────────────────────────────────────
export const uploadVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  const videoLocalPath     = req.files?.videoFile?.[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

  if (!videoLocalPath)     throw new ApiError(400, "Video file is required");
  if (!thumbnailLocalPath) throw new ApiError(400, "Thumbnail is required");

  // Upload both to Cloudinary in parallel
  const [uploadedVideo, uploadedThumbnail] = await Promise.all([
    uploadOnCloudinary(videoLocalPath,     CLOUDINARY_FOLDERS.VIDEOS,     "video"),
    uploadOnCloudinary(thumbnailLocalPath, CLOUDINARY_FOLDERS.THUMBNAILS, "image"),
  ]);

  if (!uploadedVideo)     throw new ApiError(500, "Failed to upload video");
  if (!uploadedThumbnail) throw new ApiError(500, "Failed to upload thumbnail");

  const video = await Video.create({
    title,
    description,
    videoFile: { url: uploadedVideo.secure_url,     publicId: uploadedVideo.public_id },
    thumbnail: { url: uploadedThumbnail.secure_url, publicId: uploadedThumbnail.public_id },
    duration:  uploadedVideo.duration || 0,
    owner:     req.user._id,
  });

  return res.status(201).json(new ApiResponse(201, { video }, "Video uploaded successfully"));
});

// ─── Get All Videos (with search, pagination) ─────────────────────────────────
export const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page  = 1,
    limit = 10,
    query = "",
    sortBy    = "createdAt",
    sortType  = "desc",
    userId,
  } = req.query;

  const matchStage = { isPublished: true };
  if (query) matchStage.$text = { $search: query };
  if (userId && mongoose.isValidObjectId(userId)) matchStage.owner = new mongoose.Types.ObjectId(userId);

  const videos = await Video.aggregate([
    { $match: matchStage },
    {
      $lookup: {
        from:         "users",
        localField:   "owner",
        foreignField: "_id",
        as:           "ownerDetails",
        pipeline:     [{ $project: { username: 1, avatar: 1 } }],
      },
    },
    { $unwind: "$ownerDetails" },
    { $sort: { [sortBy]: sortType === "asc" ? 1 : -1 } },
    { $skip: (Number(page) - 1) * Number(limit) },
    { $limit: Number(limit) },
  ]);

  const total = await Video.countDocuments(matchStage);

  return res.status(200).json(
    new ApiResponse(200, {
      videos,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
    }, "Videos fetched successfully")
  );
});

// ─── Get Video By ID (also increments view count) ────────────────────────────
export const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!mongoose.isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID");

  const video = await Video.findById(videoId).populate("owner", "username avatar");
  if (!video || !video.isPublished) throw new ApiError(404, "Video not found");

  // Increment view count by 1 (simple counter)
  await Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } });

  // Add to user's watch history if logged in
  if (req.user) {
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { viewHistory: video._id }, // addToSet prevents duplicates
    });
  }

  return res.status(200).json(new ApiResponse(200, { video }, "Video fetched successfully"));
});

// ─── Update Video ─────────────────────────────────────────────────────────────
export const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;

  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(404, "Video not found");
  if (video.owner.toString() !== req.user._id.toString())
    throw new ApiError(403, "You are not authorized to update this video");

  // Update thumbnail if new one provided
  if (req.file) {
    if (video.thumbnail?.publicId) {
      await deleteFromCloudinary(video.thumbnail.publicId, "image");
    }
    const uploaded = await uploadOnCloudinary(
      req.file.path,
      CLOUDINARY_FOLDERS.THUMBNAILS,
      "image"
    );
    if (uploaded) {
      video.thumbnail = { url: uploaded.secure_url, publicId: uploaded.public_id };
    }
  }

  if (title       !== undefined) video.title       = title;
  if (description !== undefined) video.description = description;
  await video.save();

  return res.status(200).json(new ApiResponse(200, { video }, "Video updated successfully"));
});

// ─── Toggle Publish ───────────────────────────────────────────────────────────
export const togglePublish = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(404, "Video not found");
  if (video.owner.toString() !== req.user._id.toString())
    throw new ApiError(403, "Unauthorized");

  video.isPublished = !video.isPublished;
  await video.save({ validateBeforeSave: false });

  return res.status(200).json(
    new ApiResponse(200, { isPublished: video.isPublished }, `Video ${video.isPublished ? "published" : "unpublished"}`)
  );
});

// ─── Delete Video ─────────────────────────────────────────────────────────────
export const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(404, "Video not found");
  if (video.owner.toString() !== req.user._id.toString())
    throw new ApiError(403, "You are not authorized to delete this video");

  // Delete both assets from Cloudinary
  await Promise.all([
    deleteFromCloudinary(video.videoFile.publicId, "video"),
    deleteFromCloudinary(video.thumbnail.publicId, "image"),
  ]);

  await Video.findByIdAndDelete(videoId);

  return res.status(200).json(new ApiResponse(200, {}, "Video deleted successfully"));
});
