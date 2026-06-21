import { Router } from "express";
import {
  createCommunityPost,
  getChannelPosts,
  updateCommunityPost,
  deleteCommunityPost,
} from "../controllers/communityPost.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { uploadPostImage, handleMulterError } from "../middlewares/multer.middleware.js";
import { communityPostValidator } from "../validators/communityPost.validator.js";
import { validate } from "../validators/validate.js";

const router = Router();

// Public — read posts for any channel
router.get("/channel/:userId", getChannelPosts);

// Protected
router.use(verifyJWT);

router.post(
  "/",
  uploadPostImage,
  handleMulterError,
  communityPostValidator,
  validate,
  createCommunityPost
);

router.patch(
  "/:postId",
  uploadPostImage,
  handleMulterError,
  communityPostValidator,
  validate,
  updateCommunityPost
);

router.delete("/:postId", deleteCommunityPost);

export default router;
