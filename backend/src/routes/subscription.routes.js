import { Router } from "express";
import {
  toggleSubscription,
  getChannelSubscriberInfo,
  getSubscribedChannels,
  getChannelSubscribers,
} from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Public — channel info (subscriber count) viewable by anyone
router.get("/channel/:channelId", getChannelSubscriberInfo);
router.get("/channel/:channelId/subscribers", getChannelSubscribers);

// Protected
router.use(verifyJWT);

router.post("/channel/:channelId", toggleSubscription);
router.get("/",                    getSubscribedChannels);

export default router;
