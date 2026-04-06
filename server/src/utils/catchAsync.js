const pickRequest = (req) => ({
  req,
  body: req.body || {},
  query: req.query || {},
  params: req.params || {},
});

/**
 * Wraps async route handlers: passes `{ req, body, query, params }` as the first argument.
 * Rejected promises are forwarded to Express `next(err)`.
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(pickRequest(req), res, next)).catch(next);
};

module.exports = { catchAsync, pickRequest };
