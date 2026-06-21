import { body } from "express-validator";

export const createVideoValidator = [
  body("title")
    .trim()
    .notEmpty().withMessage("Title is required")
    .isLength({ min: 3, max: 150 }).withMessage("Title must be 3–150 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage("Description cannot exceed 2000 characters"),
];

export const updateVideoValidator = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 3, max: 150 }).withMessage("Title must be 3–150 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage("Description cannot exceed 2000 characters"),
];
