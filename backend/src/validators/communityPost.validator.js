import { body } from "express-validator";

export const communityPostValidator = [
  body("content")
    .trim()
    .notEmpty().withMessage("Post content is required")
    .isLength({ max: 2000 }).withMessage("Post cannot exceed 2000 characters"),
];
