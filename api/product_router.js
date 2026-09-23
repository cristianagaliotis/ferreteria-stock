import express from "express";

import requireRole from "../middlewares/require_role.js";

export default function createProductRouter(
  productService,
  authenticate
) {
  const router = express.Router();

  router.use(authenticate);

  router.get(
    "/",
    requireRole("admin", "employee"),
    async (req, res, next) => {
      try {
        const includeInactive =
          req.auth.user.role === "admin" &&
          req.query.includeInactive === "true";

        const products =
          await productService.getAll(
            includeInactive
          );

        res.status(200).json(products);
      } catch (error) {
        next(error);
      }
    }
  );

  router.get(
    "/:code",
    requireRole("admin", "employee"),
    async (req, res, next) => {
      try {
        const includeInactive =
          req.auth.user.role === "admin";

        const product =
          await productService.getByCode(
            req.params.code,
            includeInactive
          );

        res.status(200).json(product);
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    "/",
    requireRole("admin"),
    async (req, res, next) => {
      try {
        const product =
          await productService.add(req.body);

        res.status(201).json(product);
      } catch (error) {
        next(error);
      }
    }
  );

  router.patch(
    "/:code",
    requireRole("admin"),
    async (req, res, next) => {
      try {
        const product =
          await productService.update(
            req.params.code,
            req.body
          );

        res.status(200).json(product);
      } catch (error) {
        next(error);
      }
    }
  );

  router.delete(
    "/:code",
    requireRole("admin"),
    async (req, res, next) => {
      try {
        await productService.delete(
          req.params.code
        );

        res.status(204).send();
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}