import mongoose, { Schema } from "mongoose";
import { AvailableLikeTargets, LikeTargetEnum } from "../config/constants.js";

const likeSchema = new Schema(
  {
    // Only ONE of these three will be set per document
    video: {
      type: Schema.Types.ObjectId,
      ref: "Video",
      default: null,
    },
    comment: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
    communityPost: {
      type: Schema.Types.ObjectId,
      ref: "CommunityPost",
      default: null,
    },
    likedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    targetType: {
      type: String,
      enum: AvailableLikeTargets,
      required: true,
    },
  },
  { timestamps: true }
);

// Prevent a user from liking the same target twice
likeSchema.index({ video:        1, likedBy: 1 }, { unique: true, sparse: true });
likeSchema.index({ comment:      1, likedBy: 1 }, { unique: true, sparse: true });
likeSchema.index({ communityPost: 1, likedBy: 1 }, { unique: true, sparse: true });

export const Like = mongoose.model("Like", likeSchema);
