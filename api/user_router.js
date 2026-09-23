import express from "express";

import AppError from "../errors/app_error.js";
import requireRole from "../middlewares/require_role.js";

export default function createUserRouter(
  userService,
  authenticate
) {
  const router = express.Router();

  router.use(authenticate);
  router.use(requireRole("admin"));

  router.get("/", async (req, res, next) => {
    try {
      const users = await userService.getAll();

      res.status(200).json(users);
    } catch (error) {
      next(error);
    }
  });

  router.get(
    "/:username",
    async (req, res, next) => {
      try {
        const user =
          await userService.getByUsername(
            req.params.username
          );

        res.status(200).json(user);
      } catch (error) {
        next(error);
      }
    }
  );

  router.post("/", async (req, res, next) => {
    try {
      const user = await userService.add(
        req.body
      );

      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  });

  router.patch(
    "/:username",
    async (req, res, next) => {
      try {
        const requestedUsername =
          req.params.username
            .trim()
            .toLowerCase();

        const authenticatedUsername =
          req.auth.user.username;

        const isOwnAccount =
          requestedUsername ===
          authenticatedUsername;

        const removesOwnAdminRole =
          req.body.role !== undefined &&
          req.body.role !== "admin";

        const deactivatesOwnAccount =
          req.body.active === false;

        if (
          isOwnAccount &&
          (
            removesOwnAdminRole ||
            deactivatesOwnAccount
          )
        ) {
          throw new AppError(
            "No puedes quitarte el rol de administrador ni desactivar tu propia cuenta",
            400
          );
        }

        const updatedUser =
          await userService.update(
            req.params.username,
            req.body
          );

        res.status(200).json(updatedUser);
      } catch (error) {
        next(error);
      }
    }
  );

  router.delete(
    "/:username",
    async (req, res, next) => {
      try {
        const requestedUsername =
          req.params.username
            .trim()
            .toLowerCase();

        if (
          requestedUsername ===
          req.auth.user.username
        ) {
          throw new AppError(
            "No puedes eliminar tu propia cuenta",
            400
          );
        }

        await userService.delete(
          req.params.username
        );

        res.status(204).send();
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}