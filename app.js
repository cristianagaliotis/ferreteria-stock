import express from "express";
import cors from "cors";

import UserMongo from "./mongo-db/user_mongo.js";
import SessionMongo from "./mongo-db/session_mongo.js";
import ProductMongo from "./mongo-db/product_mongo.js";
import StockMovementMongo from "./mongo-db/stock_movement_mongo.js";
import SaleMongo from "./mongo-db/sale_mongo.js";

import UserService from "./services/user_service.js";
import AuthService from "./services/auth_service.js";
import ProductService from "./services/product_service.js";
import StockMovementService from "./services/stock_movement_service.js";
import SaleService from "./services/sale_service.js";

import createAuthenticate from "./middlewares/authenticate.js";
import notFoundHandler from "./middlewares/not_found_handler.js";
import errorHandler from "./middlewares/error_handler.js";

import createAuthRouter from "./api/auth_router.js";
import createUserRouter from "./api/user_router.js";
import createProductRouter from "./api/product_router.js";
import createStockMovementRouter from "./api/stock_movement_router.js";
import createSaleRouter from "./api/sale_router.js";

const app = express();

const userService = new UserService(
  UserMongo
);

const authService = new AuthService(
  UserMongo,
  SessionMongo
);

const productService = new ProductService(
  ProductMongo
);

const stockMovementService =
  new StockMovementService(
    ProductMongo,
    StockMovementMongo
  );

const saleService = new SaleService(
  ProductMongo,
  SaleMongo,
  StockMovementMongo
);

const authenticate =
  createAuthenticate(SessionMongo);

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({
    message: "API de Ferretería Stock funcionando"
  });
});

app.use(
  "/auth",
  createAuthRouter(
    authService,
    authenticate
  )
);

app.use(
  "/users",
  createUserRouter(
    userService,
    authenticate
  )
);

app.use(
  "/products",
  createProductRouter(
    productService,
    authenticate
  )
);

app.use(
  "/stock-movements",
  createStockMovementRouter(
    stockMovementService,
    authenticate
  )
);

app.use(
  "/sales",
  createSaleRouter(
    saleService,
    authenticate
  )
);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;