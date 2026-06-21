import multer from "multer";
import path from "path";
import fs from "fs";
import { ApiError } from "../utils/ApiError.js";
import {
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
} from "../config/constants.js";

// Ensure temp directory exists
const tempDir = path.resolve("public/temp");
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, tempDir),
  filename:    (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  cb(new ApiError(400, `File type not allowed: ${file.mimetype}`), false);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_VIDEO_SIZE }, // videos are the largest
});

// Specific upload presets for convenience
export const uploadAvatar    = upload.single("avatar");
export const uploadVideoFiles = upload.fields([
  { name: "videoFile", maxCount: 1 },
  { name: "thumbnail", maxCount: 1 },
]);
export const uploadPostImage = upload.single("image");

// Multer error handler (place after routes)
export const handleMulterError = (err, _req, _res, next) => {
  if (err instanceof multer.MulterError) {
    return next(
      new ApiError(400, err.code === "LIMIT_FILE_SIZE"
        ? `File too large. Max allowed: ${MAX_VIDEO_SIZE / (1024 * 1024)} MB`
        : err.message)
    );
  }
  next(err);
};
