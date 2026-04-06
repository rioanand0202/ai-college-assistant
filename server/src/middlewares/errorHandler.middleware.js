const errorHandlerMiddleware = (err, req, res, next) => {
  const status = err.statusCode || err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
};

module.exports = errorHandlerMiddleware;
