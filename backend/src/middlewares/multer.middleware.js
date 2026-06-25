import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { ApiError } from '../utils/ApiError.js';
import {
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
} from '../config/constants.js';

// Ensure temp directory exists
const tempDir = path.resolve('public/temp');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, tempDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  cb(new ApiError(400, `File type not allowed: ${file.mimetype}`), false);
};

// Image-only filter (used for avatar and cover image — rejects videos)
const imageOnlyFilter = (_req, file, cb) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) return cb(null, true);
  cb(
    new ApiError(400, `Only image files are allowed. Got: ${file.mimetype}`),
    false,
  );
};

// ─── Base instances ───────────────────────────────────────────────────────────

// Handles all file types (images + videos), up to MAX_VIDEO_SIZE
export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_VIDEO_SIZE },
});

// Handles images only, enforces the smaller MAX_IMAGE_SIZE limit
const imageUpload = multer({
  storage,
  fileFilter: imageOnlyFilter,
  limits: { fileSize: MAX_IMAGE_SIZE }, // 5 MB — stricter than video
});

// ─── Named presets (used directly in routes as middleware) ────────────────────

/** Single avatar image — field name must be "avatar" */
export const uploadAvatar = imageUpload.single('avatar');

/**
 * Single cover image — field name must be "coverImage"
 * Used on both initial upload and update (same logic, same field name)
 */
export const uploadCoverImage = imageUpload.single('coverImage');

/** Video file + thumbnail in one request */
export const uploadVideoFiles = upload.fields([
  { name: 'videoFile', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
]);

/** Single community post image */
export const uploadPostImage = imageUpload.single('image');

// ─── Multer error handler ─────────────────────────────────────────────────────
export const handleMulterError = (err, _req, _res, next) => {
  if (err instanceof multer.MulterError) {
    return next(
      new ApiError(
        400,
        err.code === 'LIMIT_FILE_SIZE'
          ? `File too large. Max allowed: ${MAX_IMAGE_SIZE / (1024 * 1024)} MB for images, ${MAX_VIDEO_SIZE / (1024 * 1024)} MB for videos`
          : err.message,
      ),
    );
  }
  next(err);
};
