import { Router } from "express";
import {
  getVideoComments,
  addComment,
  editComment,
  deleteComment,
} from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { commentValidator } from "../validators/comment.validator.js";
import { validate } from "../validators/validate.js";

const router = Router();

// GET comments is public; all mutations require auth
router.get("/:videoId",          getVideoComments);

router.use(verifyJWT);

router.post(  "/:videoId",       commentValidator, validate, addComment);
router.patch( "/:commentId",     commentValidator, validate, editComment);
router.delete("/:commentId",                                 deleteComment);

export default router;
