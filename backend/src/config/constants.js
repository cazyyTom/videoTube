// Cookie options
export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
};

export const ACCESS_TOKEN_MAX_AGE  = 15 * 60 * 1000;          // 15 min
export const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

// Cloudinary folders
export const CLOUDINARY_FOLDERS = {
  AVATARS:     "videotube/avatars",
  VIDEOS:      "videotube/videos",
  THUMBNAILS:  "videotube/thumbnails",
};

// Multer limits
export const MAX_IMAGE_SIZE = 5  * 1024 * 1024;  // 5 MB
export const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200 MB

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/ogg", "video/quicktime"];

// Like target types
export const LikeTargetEnum = {
  VIDEO:          "video",
  COMMENT:        "comment",
  COMMUNITY_POST: "communityPost",
};
export const AvailableLikeTargets = Object.values(LikeTargetEnum);
