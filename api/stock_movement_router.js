import express from "express";

import requireRole from "../middlewares/require_role.js";

export default function createStockMovementRouter(
  stockMovementService,
  authenticate
) {
  const router = express.Router();

  router.use(authenticate);

  router.get(
    "/",
    requireRole("admin"),
    async (req, res, next) => {
      try {
        const movements =
          await stockMovementService.getAll();

        res.status(200).json(movements);
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    "/",
    requireRole("admin", "employee"),
    async (req, res, next) => {
      try {
        const movement =
          await stockMovementService.add(
            req.body,
            req.auth.user
          );

        res.status(201).json(movement);
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}