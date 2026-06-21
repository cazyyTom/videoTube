import { ApiError } from "../utils/ApiError.js";

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || (error.name === "ValidationError" ? 400 : 500);
    error = new ApiError(statusCode, error.message || "Something went wrong", error?.errors || [], err.stack);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {}).join(", ");
    error = new ApiError(409, `Duplicate value for: ${field}`);
  }

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    error = new ApiError(400, `Invalid ID for field: ${err.path}`);
  }

  return res.status(error.statusCode).json({
    statusCode: error.statusCode,
    message:    error.message,
    success:    false,
    ...(error.errors?.length && { errors: error.errors }),
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  });
};

export default errorHandler;
