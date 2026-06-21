/**
 * Wraps an async Express route handler and forwards errors to next().
 */
const asyncHandler = (requestHandler) => (req, res, next) => {
  Promise.resolve(requestHandler(req, res, next)).catch(next);
};

export { asyncHandler };
