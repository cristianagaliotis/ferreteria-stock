export default function errorHandler(error, req, res, next) {
  console.error(error);

  if (error.name === "ValidationError") {
    return res.status(400).json({
      error: error.message
    });
  }

  if (error.code === 11000) {
    return res.status(409).json({
      error: "Ya existe un registro con esos datos"
    });
  }

  const statusCode = error.statusCode || 500;

  const message =
    error.statusCode
      ? error.message
      : "Error interno del servidor";

  return res.status(statusCode).json({
    error: message
  });
}