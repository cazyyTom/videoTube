import { body } from "express-validator";

export const createPlaylistValidator = [
  body("name")
    .trim()
    .notEmpty().withMessage("Playlist name is required")
    .isLength({ min: 2, max: 100 }).withMessage("Playlist name must be 2–100 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage("Description cannot exceed 500 characters"),
];

export const updatePlaylistValidator = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage("Playlist name must be 2–100 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage("Description cannot exceed 500 characters"),
];
