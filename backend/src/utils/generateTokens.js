import { User } from "../models/user.model.js";
import { ApiError } from "./ApiError.js";

/**
 * Generates access + refresh tokens and persists the refresh token on the user doc.
 * @param {string} userId
 * @returns {{ accessToken: string, refreshToken: string }}
 */
export const generateAccessAndRefreshTokens = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  const accessToken  = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};
