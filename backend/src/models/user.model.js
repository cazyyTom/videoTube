import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    avatar: {
      url:      { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    viewHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken:  { type: String, select: false },
    emailVerificationExpiry: { type: Date,   select: false },
    forgotPasswordToken:     { type: String, select: false },
    forgotPasswordExpiry:    { type: Date,   select: false },
    refreshToken:            { type: String, select: false },
  },
  { timestamps: true }
);

// ─── Hooks ────────────────────────────────────────────────────────────────────
// Mongoose v7+ async hooks: do NOT use next(), just return the promise
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// ─── Instance Methods ─────────────────────────────────────────────────────────
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign({ _id: this._id }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
  });
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign({ _id: this._id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
  });
};

/**
 * Generates a secure random token pair: plain (sent via email) + hashed (stored in DB).
 * @returns {{ unhashedToken: string, hashedToken: string, tokenExpiry: Date }}
 */
userSchema.methods.generateTemporaryToken = function () {
  const unhashedToken = crypto.randomBytes(32).toString("hex");
  const hashedToken   = crypto.createHash("sha256").update(unhashedToken).digest("hex");
  const tokenExpiry   = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return { unhashedToken, hashedToken, tokenExpiry };
};

export const User = mongoose.model("User", userSchema);
