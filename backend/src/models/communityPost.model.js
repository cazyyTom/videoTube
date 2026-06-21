import mongoose, { Schema } from "mongoose";

const communityPostSchema = new Schema(
  {
    content: {
      type: String,
      required: [true, "Post content is required"],
      trim: true,
      maxlength: [2000, "Post content cannot exceed 2000 characters"],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    image: {
      url:      { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

export const CommunityPost = mongoose.model("CommunityPost", communityPostSchema);
