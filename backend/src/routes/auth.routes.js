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
  getWatchHistory,
  clearWatchHistory,
  forgotPassword,
  resetPassword,
  deleteAccount,
  verifyEmail,
  resendVerificationEmail,
} from "../controllers/auth.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { uploadAvatarandCover } from '../middlewares/multer.middleware.js';
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
  uploadAvatarandCover,
  registerValidator,
  validate,
  registerUser,
);
router.post("/login",                        loginValidator,           validate, loginUser);
router.post("/refresh-token",                                                   refreshAccessToken);
router.get( "/verify-email/:verificationToken",                                 verifyEmail);
router.post("/forgot-password",              forgotPasswordValidator,  validate, forgotPassword);
router.post("/reset-password/:resetToken",   resetPasswordValidator,   validate, resetPassword);

// ─── Protected ────────────────────────────────────────────────────────────────
router.use(verifyJWT);

router.post(  "/logout",                                                               logoutUser);
router.get(   "/me",                                                                   getCurrentUser);
router.post(  "/resend-verification",                                                  resendVerificationEmail);
router.patch( "/change-password", changePasswordValidator,  validate,                  changePassword);
router.patch( "/change-username", changeUsernameValidator,  validate,                  changeUsername);
router.patch('/avatar', uploadAvatarandCover, updateAvatar);
router.get(   "/watch-history",                                                        getWatchHistory);
router.delete("/watch-history",                                                        clearWatchHistory);
router.delete("/account",                                                              deleteAccount);

export default router;
