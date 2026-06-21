import { Router } from "express";
import {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  updatePlaylist,
  deletePlaylist,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
} from "../controllers/playlist.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createPlaylistValidator,
  updatePlaylistValidator,
} from "../validators/playlist.validator.js";
import { validate } from "../validators/validate.js";

const router = Router();

// Public
router.get("/user/:userId",   getUserPlaylists);
router.get("/:playlistId",    getPlaylistById);

// Protected
router.use(verifyJWT);

router.post("/",                                   createPlaylistValidator, validate, createPlaylist);
router.patch("/:playlistId",                       updatePlaylistValidator, validate, updatePlaylist);
router.delete("/:playlistId",                                                         deletePlaylist);
router.patch( "/:playlistId/videos/:videoId",                                         addVideoToPlaylist);
router.delete("/:playlistId/videos/:videoId",                                         removeVideoFromPlaylist);

export default router;
