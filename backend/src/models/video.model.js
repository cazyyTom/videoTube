import mongoose, { Schema } from "mongoose";

const videoSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Video title is required"],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    videoFile: {
      url:      { type: String, required: true },
      publicId: { type: String, required: true },
    },
    thumbnail: {
      url:      { type: String, required: true },
      publicId: { type: String, required: true },
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    duration: {
      type: Number, // seconds (returned by Cloudinary on upload)
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Text index for search
videoSchema.index({ title: "text", description: "text" });

export const Video = mongoose.model("Video", videoSchema);
