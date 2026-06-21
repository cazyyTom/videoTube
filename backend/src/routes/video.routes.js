import { Router } from "express";
import {
  uploadVideo,
  getAllVideos,
  getVideoById,
  updateVideo,
  togglePublish,
  deleteVideo,
} from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload, uploadVideoFiles, handleMulterError } from "../middlewares/multer.middleware.js";
import { createVideoValidator, updateVideoValidator } from "../validators/video.validator.js";
import { validate } from "../validators/validate.js";

const router = Router();

// Public — getAll & getById (view count increments; auth optional for watch history)
router.get("/",           getAllVideos);
router.get("/:videoId",   verifyJWT, getVideoById); // verifyJWT optional here; see controller

// Protected
router.use(verifyJWT);

router.post(
  "/",
  uploadVideoFiles,
  handleMulterError,
  createVideoValidator,
  validate,
  uploadVideo
);

router.patch(
  "/:videoId",
  upload.single("thumbnail"),
  handleMulterError,
  updateVideoValidator,
  validate,
  updateVideo
);

router.patch("/:videoId/toggle-publish", togglePublish);
router.delete("/:videoId",               deleteVideo);

export default router;
