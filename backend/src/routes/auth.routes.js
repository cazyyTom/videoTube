import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  changePassword,
  changeUsername,
  updateAvatar,
  uploadCoverImage,
  updateCoverImage,
  deleteCoverImage,
  getWatchHistory,
  clearWatchHistory,
  forgotPassword,
  resetPassword,
  deleteAccount,
  verifyEmail,
  resendVerificationEmail,
} from '../controllers/auth.controller.js';
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { 
  uploadAvatar,
  uploadCoverImage as multerCoverImage, // renamed to avoid clash with controller export
  handleMulterError,
}  from '../middlewares/multer.middleware.js';

import {
  registerValidator,
  loginValidator,
  changePasswordValidator,
  changeUsernameValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} from "../validators/auth.validator.js";
import { validate } from "../validators/validate.js";

const router = Router();

// ─── Public ───────────────────────────────────────────────────────────────────
router.post(
  '/register',
  uploadAvatar,
  registerValidator,
  validate,
  registerUser,
);
router.post("/login",                        loginValidator,           validate, loginUser);
router.post("/refresh-token",                                                   refreshAccessToken);
router.get( "/verify-email/:verificationToken",                                 verifyEmail);
router.post("/forgot-password",              forgotPasswordValidator,  validate, forgotPassword);
router.post("/reset-password/:resetToken",   resetPasswordValidator,   validate, resetPassword);
// Cover Image
// POST   → upload for the first time (returns 409 if one already exists)
// PATCH  → replace existing cover image (deletes old from Cloudinary first)
// DELETE → remove cover image entirely
router.post(  "/cover-image",      multerCoverImage,         handleMulterError,              uploadCoverImage);


// ─── Protected ────────────────────────────────────────────────────────────────
router.use(verifyJWT);

router.post(  "/logout",                                                               logoutUser);
router.get(   "/me",                                                                   getCurrentUser);
router.post(  "/resend-verification",                                                  resendVerificationEmail);
router.patch( "/change-password", changePasswordValidator,  validate,                  changePassword);
router.patch( "/change-username", changeUsernameValidator,  validate,                  changeUsername);
router.patch('/avatar', uploadAvatar, updateAvatar);
router.patch(
  '/cover-image',
  multerCoverImage,
  handleMulterError,
  updateCoverImage,
);
router.delete('/cover-image', deleteCoverImage);
router.get(   "/watch-history",                                                        getWatchHistory);
router.delete("/watch-history",                                                        clearWatchHistory);
router.delete("/account",                                                              deleteAccount);

export default router;
