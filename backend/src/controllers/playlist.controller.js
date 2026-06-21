import mongoose from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ─── Create Playlist ──────────────────────────────────────────────────────────
export const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  const playlist = await Playlist.create({
    name,
    description,
    owner: req.user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, { playlist }, "Playlist created successfully"));
});

// ─── Get User Playlists ───────────────────────────────────────────────────────
export const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!mongoose.isValidObjectId(userId)) throw new ApiError(400, "Invalid user ID");

  const playlists = await Playlist.find({ owner: userId })
    .populate({
      path:    "videos",
      select:  "title thumbnail views duration",
      options: { limit: 1 }, // show first video as cover
    })
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, { playlists }, "Playlists fetched successfully"));
});

// ─── Get Playlist By ID ───────────────────────────────────────────────────────
export const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!mongoose.isValidObjectId(playlistId)) throw new ApiError(400, "Invalid playlist ID");

  const playlist = await Playlist.findById(playlistId)
    .populate("owner", "username avatar")
    .populate({
      path:   "videos",
      select: "title thumbnail views duration owner createdAt",
      populate: { path: "owner", select: "username avatar" },
    });

  if (!playlist) throw new ApiError(404, "Playlist not found");

  return res
    .status(200)
    .json(new ApiResponse(200, { playlist }, "Playlist fetched successfully"));
});

// ─── Update Playlist ──────────────────────────────────────────────────────────
export const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) throw new ApiError(404, "Playlist not found");
  if (playlist.owner.toString() !== req.user._id.toString())
    throw new ApiError(403, "You can only update your own playlists");

  if (name        !== undefined) playlist.name        = name;
  if (description !== undefined) playlist.description = description;
  await playlist.save();

  return res
    .status(200)
    .json(new ApiResponse(200, { playlist }, "Playlist updated successfully"));
});

// ─── Delete Playlist ──────────────────────────────────────────────────────────
export const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) throw new ApiError(404, "Playlist not found");
  if (playlist.owner.toString() !== req.user._id.toString())
    throw new ApiError(403, "You can only delete your own playlists");

  await Playlist.findByIdAndDelete(playlistId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Playlist deleted successfully"));
});

// ─── Add Video to Playlist ────────────────────────────────────────────────────
export const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) throw new ApiError(404, "Playlist not found");
  if (playlist.owner.toString() !== req.user._id.toString())
    throw new ApiError(403, "You can only modify your own playlists");

  const video = await Video.findById(videoId);
  if (!video || !video.isPublished) throw new ApiError(404, "Video not found");

  // Prevent duplicate videos in the same playlist
  if (playlist.videos.includes(videoId))
    throw new ApiError(409, "Video is already in this playlist");

  playlist.videos.push(videoId);
  await playlist.save();

  return res
    .status(200)
    .json(new ApiResponse(200, { playlist }, "Video added to playlist"));
});

// ─── Remove Video from Playlist ───────────────────────────────────────────────
export const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) throw new ApiError(404, "Playlist not found");
  if (playlist.owner.toString() !== req.user._id.toString())
    throw new ApiError(403, "You can only modify your own playlists");

  playlist.videos = playlist.videos.filter(
    (vid) => vid.toString() !== videoId
  );
  await playlist.save();

  return res
    .status(200)
    .json(new ApiResponse(200, { playlist }, "Video removed from playlist"));
});
