/**
 * Wraps an async route handler and forwards any thrown error to next()
 * Eliminates the repetitive try/catch boilerplate in every route.
 *
 * @param {Function} fn - async (req, res, next) => {}
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
