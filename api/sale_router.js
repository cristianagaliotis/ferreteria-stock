import express from "express";

import requireRole from "../middlewares/require_role.js";

export default function createSaleRouter(
  saleService,
  authenticate
) {
  const router = express.Router();

  router.use(authenticate);

  router.use(
    requireRole("admin", "employee")
  );

  router.get(
    "/",
    async (req, res, next) => {
      try {
        const sales =
          await saleService.getAll(
            req.auth.user
          );

        res.status(200).json(sales);
      } catch (error) {
        next(error);
      }
    }
  );

  router.get(
    "/:saleNumber",
    async (req, res, next) => {
      try {
        const sale =
          await saleService.getByNumber(
            req.params.saleNumber,
            req.auth.user
          );

        res.status(200).json(sale);
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    "/",
    async (req, res, next) => {
      try {
        const sale =
          await saleService.add(
            req.body,
            req.auth.user
          );

        res.status(201).json(sale);
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}