import express from "express";

export default function createAuthRouter(
  authService,
  authenticate
) {
  const router = express.Router();

  router.post("/login", async (req, res, next) => {
    try {
      const { username, password } = req.body;

      const result = await authService.login(
        username,
        password
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  router.get(
    "/me",
    authenticate,
    async (req, res, next) => {
      try {
        const user = req.auth.user.toObject();

        delete user.password;

        res.status(200).json(user);
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    "/logout",
    authenticate,
    async (req, res, next) => {
      try {
        await authService.logout(
          req.auth.token
        );

        res.status(204).send();
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}