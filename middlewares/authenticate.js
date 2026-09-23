import AppError from "../errors/app_error.js";

export default function createAuthenticate(
  sessionRepository
) {
  return async function authenticate(
    req,
    res,
    next
  ) {
    try {
      const authorization =
        req.headers.authorization;

      if (
        !authorization ||
        !authorization.startsWith("Bearer ")
      ) {
        throw new AppError(
          "Token de sesión obligatorio",
          401
        );
      }

      const token = authorization
        .slice("Bearer ".length)
        .trim();

      if (!token) {
        throw new AppError(
          "Token de sesión obligatorio",
          401
        );
      }

      const session =
        await sessionRepository
          .findOne({ token })
          .populate("user");

      if (!session) {
        throw new AppError(
          "Token inválido o vencido",
          401
        );
      }

      if (session.expiresAt <= new Date()) {
        await sessionRepository.deleteOne({
          _id: session._id
        });

        throw new AppError(
          "Token inválido o vencido",
          401
        );
      }

      if (!session.user) {
        throw new AppError(
          "El usuario de la sesión no existe",
          401
        );
      }

      if (!session.user.active) {
        throw new AppError(
          "El usuario está desactivado",
          403
        );
      }

      req.auth = {
        token,
        user: session.user
      };

      next();
    } catch (error) {
      next(error);
    }
  };
}