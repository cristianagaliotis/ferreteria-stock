import AppError from "../errors/app_error.js";

export default function requireRole(
  ...allowedRoles
) {
  return function roleMiddleware(
    req,
    res,
    next
  ) {
    if (!req.auth?.user) {
      return next(
        new AppError(
          "Debes iniciar sesión",
          401
        )
      );
    }

    const userRole = req.auth.user.role;

    if (!allowedRoles.includes(userRole)) {
      return next(
        new AppError(
          "No tienes permisos para realizar esta acción",
          403
        )
      );
    }

    next();
  };
}