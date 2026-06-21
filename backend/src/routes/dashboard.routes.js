import { Router } from "express";
import {
  getChannelStats,
  getChannelVideos,
  getChannelProfile,
} from "../controllers/dashboard.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Public — any visitor can see a channel's public profile
router.get("/channel/:channelId", getChannelProfile);

// Protected — only the channel owner sees their private dashboard
router.use(verifyJWT);

router.get("/stats",  getChannelStats);
router.get("/videos", getChannelVideos);

export default router;
