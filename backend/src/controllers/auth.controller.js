import crypto from "crypto";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateAccessAndRefreshTokens } from "../utils/generateTokens.js";
import {
  sendEmail,
  emailVerificationContent,
  forgotPasswordContent,
} from "../utils/mailer.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../config/cloudinary.js";
import {
  cookieOptions,
  ACCESS_TOKEN_MAX_AGE,
  REFRESH_TOKEN_MAX_AGE,
  CLOUDINARY_FOLDERS,
} from "../config/constants.js";

// ─── Register ─────────────────────────────────────────────────────────────────
export const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  const existing = await User.findOne({ $or: [{ email }, { username }] });
  if (existing) {
    throw new ApiError(
      409,
      existing.email === email ? "Email already registered" : "Username already taken"
    );
  }

  // Upload avatar if provided
  let avatar = { url: "", publicId: "" };
  if (req.file) {
    const uploaded = await uploadOnCloudinary(
      req.file.path,
      CLOUDINARY_FOLDERS.AVATARS,
      "image"
    );
    if (uploaded) avatar = { url: uploaded.secure_url, publicId: uploaded.public_id };
  }
  // Upload cover if provided
  let cover = { url: "", publicId: "" };
  if (req.file) {
    const uploaded = await uploadOnCloudinary(
      req.file.path,
      CLOUDINARY_FOLDERS.COVERS,
      "image"
    );
    if (uploaded) cover = { url: uploaded.secure_url, publicId: uploaded.public_id };
  }

  const user = await User.create({ username, email, password, avatar, cover });

  // Generate email verification token
  const { unhashedToken, hashedToken, tokenExpiry } = user.generateTemporaryToken();
  user.emailVerificationToken  = hashedToken;
  user.emailVerificationExpiry = tokenExpiry;
  await user.save({ validateBeforeSave: false });

  const verificationUrl = `${process.env.APP_URL}/api/v1/auth/verify-email/${unhashedToken}`;
  await sendEmail({
    to:             email,
    subject:        "Verify your VideoTube email",
    mailgenContent: emailVerificationContent(username, verificationUrl),
  });

  const created = await User.findById(user._id);
  return res.status(201).json(
    new ApiResponse(201, { user: created }, "Registration successful. Please verify your email.")
  );
});

// ─── Verify Email ─────────────────────────────────────────────────────────────
export const verifyEmail = asyncHandler(async (req, res) => {
  const { verificationToken } = req.params;
  const hashed = crypto.createHash("sha256").update(verificationToken).digest("hex");

  const user = await User.findOne({
    emailVerificationToken:  hashed,
    emailVerificationExpiry: { $gt: Date.now() },
  }).select("+emailVerificationToken +emailVerificationExpiry");

  if (!user) throw new ApiError(400, "Token is invalid or has expired");

  user.isEmailVerified         = true;
  user.emailVerificationToken  = undefined;
  user.emailVerificationExpiry = undefined;
  await user.save({ validateBeforeSave: false });

  return res.status(200).json(new ApiResponse(200, {}, "Email verified successfully"));
});

// ─── Resend Verification Email ────────────────────────────────────────────────
export const resendVerificationEmail = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "+emailVerificationToken +emailVerificationExpiry"
  );
  if (user.isEmailVerified) throw new ApiError(400, "Email is already verified");

  const { unhashedToken, hashedToken, tokenExpiry } = user.generateTemporaryToken();
  user.emailVerificationToken  = hashedToken;
  user.emailVerificationExpiry = tokenExpiry;
  await user.save({ validateBeforeSave: false });

  const verificationUrl = `${process.env.APP_URL}/api/v1/auth/verify-email/${unhashedToken}`;
  await sendEmail({
    to:             user.email,
    subject:        "Verify your VideoTube email",
    mailgenContent: emailVerificationContent(user.username, verificationUrl),
  });

  return res.status(200).json(new ApiResponse(200, {}, "Verification email resent"));
});

// ─── Login ────────────────────────────────────────────────────────────────────
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  if (!user) throw new ApiError(401, "Invalid email or password");

  const isValid = await user.isPasswordCorrect(password);
  if (!isValid) throw new ApiError(401, "Invalid email or password");

  if (!user.isEmailVerified)
    throw new ApiError(403, "Please verify your email before logging in");

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

  const loggedIn = await User.findById(user._id);

  return res
    .status(200)
    .cookie("accessToken",  accessToken,  { ...cookieOptions, maxAge: ACCESS_TOKEN_MAX_AGE })
    .cookie("refreshToken", refreshToken, { ...cookieOptions, maxAge: REFRESH_TOKEN_MAX_AGE })
    .json(new ApiResponse(200, { user: loggedIn, accessToken, refreshToken }, "Logged in successfully"));
});

// ─── Logout ───────────────────────────────────────────────────────────────────
export const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });

  return res
    .status(200)
    .clearCookie("accessToken",  cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "Logged out successfully"));
});

// ─── Refresh Access Token ─────────────────────────────────────────────────────
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingToken = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!incomingToken) throw new ApiError(401, "Refresh token is required");

  let decoded;
  try {
    decoded = jwt.verify(incomingToken, process.env.REFRESH_TOKEN_SECRET);
  } catch {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const user = await User.findById(decoded._id).select("+refreshToken");
  if (!user || user.refreshToken !== incomingToken)
    throw new ApiError(401, "Refresh token is invalid or already used");

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

  return res
    .status(200)
    .cookie("accessToken",  accessToken,  { ...cookieOptions, maxAge: ACCESS_TOKEN_MAX_AGE })
    .cookie("refreshToken", refreshToken, { ...cookieOptions, maxAge: REFRESH_TOKEN_MAX_AGE })
    .json(new ApiResponse(200, { accessToken, refreshToken }, "Access token refreshed"));
});

// ─── Get Current User ─────────────────────────────────────────────────────────
export const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, { user: req.user }, "User fetched successfully"));
});

// ─── Change Password ──────────────────────────────────────────────────────────
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select("+password");

  const isValid = await user.isPasswordCorrect(currentPassword);
  if (!isValid) throw new ApiError(400, "Current password is incorrect");

  user.password = newPassword;
  await user.save();

  return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"));
});

// ─── Change Username ──────────────────────────────────────────────────────────
export const changeUsername = asyncHandler(async (req, res) => {
  const { username } = req.body;

  const taken = await User.findOne({ username });
  if (taken && taken._id.toString() !== req.user._id.toString())
    throw new ApiError(409, "Username is already taken");

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { username } },
    { new: true, runValidators: true }
  );

  return res.status(200).json(new ApiResponse(200, { user }, "Username changed successfully"));
});

// ─── Update Avatar ────────────────────────────────────────────────────────────
export const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "Avatar file is required");

  // Delete old avatar from cloudinary
  const currentUser = await User.findById(req.user._id);
  if (currentUser.avatar?.publicId) {
    await deleteFromCloudinary(currentUser.avatar.publicId, "image");
  }

  const uploaded = await uploadOnCloudinary(
    req.file.path,
    CLOUDINARY_FOLDERS.AVATARS,
    "image"
  );
  if (!uploaded) throw new ApiError(500, "Failed to upload avatar");

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { avatar: { url: uploaded.secure_url, publicId: uploaded.public_id } } },
    { new: true }
  );

  return res.status(200).json(new ApiResponse(200, { user }, "Avatar updated successfully"));
});

// ─── Get Watch History ────────────────────────────────────────────────────────
export const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path:     "viewHistory",
    select:   "title thumbnail owner views createdAt",
    populate: { path: "owner", select: "username avatar" },
  });

  return res.status(200).json(
    new ApiResponse(200, { watchHistory: user.viewHistory }, "Watch history fetched")
  );
});

// ─── Clear Watch History ──────────────────────────────────────────────────────
export const clearWatchHistory = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $set: { viewHistory: [] } });
  return res.status(200).json(new ApiResponse(200, {}, "Watch history cleared"));
});

// ─── Forgot Password ──────────────────────────────────────────────────────────
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Always 200 to prevent user enumeration
  if (!user) {
    return res.status(200).json(
      new ApiResponse(200, {}, "If an account exists with this email, a reset link was sent")
    );
  }

  const { unhashedToken, hashedToken, tokenExpiry } = user.generateTemporaryToken();
  user.forgotPasswordToken  = hashedToken;
  user.forgotPasswordExpiry = tokenExpiry;
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${unhashedToken}`;
  await sendEmail({
    to:             email,
    subject:        "Reset your VideoTube password",
    mailgenContent: forgotPasswordContent(user.username, resetUrl),
  });

  return res.status(200).json(
    new ApiResponse(200, {}, "If an account exists with this email, a reset link was sent")
  );
});

// ─── Reset Password ───────────────────────────────────────────────────────────
export const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken } = req.params;
  const { newPassword } = req.body;

  const hashed = crypto.createHash("sha256").update(resetToken).digest("hex");

  const user = await User.findOne({
    forgotPasswordToken:  hashed,
    forgotPasswordExpiry: { $gt: Date.now() },
  }).select("+forgotPasswordToken +forgotPasswordExpiry");

  if (!user) throw new ApiError(400, "Token is invalid or has expired");

  user.password             = newPassword;
  user.forgotPasswordToken  = undefined;
  user.forgotPasswordExpiry = undefined;
  await user.save();

  return res.status(200).json(new ApiResponse(200, {}, "Password reset successfully"));
});

// ─── Delete Account ───────────────────────────────────────────────────────────
export const deleteAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  // Delete avatar from Cloudinary
  if (user.avatar?.publicId) {
    await deleteFromCloudinary(user.avatar.publicId, "image");
  }

  await User.findByIdAndDelete(req.user._id);

  return res
    .status(200)
    .clearCookie("accessToken",  cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "Account deleted successfully"));
});
