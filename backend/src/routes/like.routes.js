import { Router } from "express";
import {
  toggleVideoLike,
  toggleCommentLike,
  toggleCommunityPostLike,
  getLikedVideos,
} from "../controllers/like.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.post("/video/:videoId",      toggleVideoLike);
router.post("/comment/:commentId",  toggleCommentLike);
router.post("/post/:postId",        toggleCommunityPostLike);
router.get( "/videos",              getLikedVideos);

export default router;
