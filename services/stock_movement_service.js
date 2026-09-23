import AppError from "../errors/app_error.js";

const VALID_TYPES = [
  "entrada",
  "salida",
  "ajuste"
];

export default class StockMovementService {
  constructor(
    productRepository,
    stockMovementRepository
  ) {
    this.productRepository =
      productRepository;

    this.stockMovementRepository =
      stockMovementRepository;
  }

  normalizeCode(code) {
    return code?.trim().toUpperCase();
  }

  async getAll() {
    return await this.stockMovementRepository
      .find()
      .populate(
        "product",
        "code name unit"
      )
      .populate(
        "performedBy",
        "username displayName role"
      )
      .sort({ createdAt: -1 });
  }

  async add(movementData, authenticatedUser) {
    const code =
      this.normalizeCode(
        movementData.productCode
      );

    const type = movementData.type;
    const reason =
      movementData.reason?.trim();

    if (!code) {
      throw new AppError(
        "El código del producto es obligatorio",
        400
      );
    }

    if (!VALID_TYPES.includes(type)) {
      throw new AppError(
        "El movimiento debe ser entrada, salida o ajuste",
        400
      );
    }

    if (!reason) {
      throw new AppError(
        "El motivo del movimiento es obligatorio",
        400
      );
    }

    let product;
    let previousStock;
    let newStock;
    let change;

    if (type === "entrada") {
      const quantity = movementData.quantity;

      this.validateQuantity(quantity);

      product =
        await this.productRepository
          .findOneAndUpdate(
            {
              code,
              active: true
            },
            {
              $inc: {
                stock: quantity
              }
            },
            {
              returnDocument: "after",
              runValidators: true
            }
          );

      if (!product) {
        throw new AppError(
          "Producto no encontrado",
          404
        );
      }

      newStock = product.stock;
      previousStock = newStock - quantity;
      change = quantity;
    }

    if (type === "salida") {
      const quantity = movementData.quantity;

      this.validateQuantity(quantity);

      product =
        await this.productRepository
          .findOneAndUpdate(
            {
              code,
              active: true,
              stock: {
                $gte: quantity
              }
            },
            {
              $inc: {
                stock: -quantity
              }
            },
            {
              returnDocument: "after",
              runValidators: true
            }
          );

      if (!product) {
        const productExists =
          await this.productRepository.exists({
            code,
            active: true
          });

        if (!productExists) {
          throw new AppError(
            "Producto no encontrado",
            404
          );
        }

        throw new AppError(
          "Stock insuficiente",
          409
        );
      }

      newStock = product.stock;
      previousStock = newStock + quantity;
      change = -quantity;
    }

    if (type === "ajuste") {
      if (authenticatedUser.role !== "admin") {
        throw new AppError(
          "Solo un administrador puede realizar ajustes de stock",
          403
        );
      }

      const requestedStock =
        movementData.newStock;

      if (
        typeof requestedStock !== "number" ||
        requestedStock < 0
      ) {
        throw new AppError(
          "El nuevo stock debe ser un número mayor o igual a cero",
          400
        );
      }

      const previousProduct =
        await this.productRepository
          .findOneAndUpdate(
            {
              code,
              active: true
            },
            {
              $set: {
                stock: requestedStock
              }
            },
            {
              returnDocument: "before",
              runValidators: true
            }
          );

      if (!previousProduct) {
        throw new AppError(
          "Producto no encontrado",
          404
        );
      }

      previousStock = previousProduct.stock;
      newStock = requestedStock;
      change = newStock - previousStock;

      product =
        await this.productRepository.findOne({
          code,
          active: true
        });
    }

    const movement =
      await this.stockMovementRepository.create({
        product: product._id,
        type,
        change,
        previousStock,
        newStock,
        reason,
        performedBy: authenticatedUser._id
      });

    await movement.populate([
      {
        path: "product",
        select: "code name unit"
      },
      {
        path: "performedBy",
        select:
          "username displayName role"
      }
    ]);

    return movement;
  }

  validateQuantity(quantity) {
    if (
      typeof quantity !== "number" ||
      quantity <= 0
    ) {
      throw new AppError(
        "La cantidad debe ser un número mayor que cero",
        400
      );
    }
  }
}