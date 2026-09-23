import AppError from "../errors/app_error.js";

export default function notFoundHandler(req, res, next) {
  const message =
    `Ruta no encontrada: ${req.method} ${req.originalUrl}`;

  next(new AppError(message, 404));
}