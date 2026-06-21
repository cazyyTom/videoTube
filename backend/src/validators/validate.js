import { validationResult } from "express-validator";
import { ApiError } from "../utils/ApiError.js";

export const validate = (req, _res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const extracted = errors.array().map((e) => ({
    field:   e.path,
    message: e.msg,
  }));

  throw new ApiError(422, "Validation failed", extracted);
};
