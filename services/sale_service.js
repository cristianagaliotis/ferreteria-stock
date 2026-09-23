import { randomBytes } from "crypto";

import AppError from "../errors/app_error.js";

const VALID_PAYMENT_METHODS = [
  "efectivo",
  "debito",
  "credito",
  "transferencia",
  "otro"
];

export default class SaleService {
  constructor(
    productRepository,
    saleRepository,
    stockMovementRepository
  ) {
    this.productRepository =
      productRepository;

    this.saleRepository =
      saleRepository;

    this.stockMovementRepository =
      stockMovementRepository;
  }

  normalizeCode(code) {
    return code?.trim().toUpperCase();
  }

  roundMoney(value) {
    return Math.round(
      (value + Number.EPSILON) * 100
    ) / 100;
  }

  generateSaleNumber() {
    const randomPart = randomBytes(3)
      .toString("hex")
      .toUpperCase();

    return `VENTA-${Date.now()}-${randomPart}`;
  }

  async getAll(authenticatedUser) {
    const filter =
      authenticatedUser.role === "admin"
        ? {}
        : {
            soldBy: authenticatedUser._id
          };

    return await this.saleRepository
      .find(filter)
      .populate(
        "soldBy",
        "username displayName role"
      )
      .sort({ createdAt: -1 });
  }

  async getByNumber(
    saleNumber,
    authenticatedUser
  ) {
    const filter = {
      saleNumber:
        saleNumber.trim().toUpperCase()
    };

    if (authenticatedUser.role !== "admin") {
      filter.soldBy = authenticatedUser._id;
    }

    const sale = await this.saleRepository
      .findOne(filter)
      .populate(
        "soldBy",
        "username displayName role"
      );

    if (!sale) {
      throw new AppError(
        "Venta no encontrada",
        404
      );
    }

    return sale;
  }

  async add(saleData, authenticatedUser) {
    if (
      !Array.isArray(saleData.items) ||
      saleData.items.length === 0
    ) {
      throw new AppError(
        "La venta debe tener al menos un producto",
        400
      );
    }

    if (
      !VALID_PAYMENT_METHODS.includes(
        saleData.paymentMethod
      )
    ) {
      throw new AppError(
        "El método de pago no es válido",
        400
      );
    }

    const normalizedItems = [];
    const usedCodes = new Set();

    for (const item of saleData.items) {
      const productCode =
        this.normalizeCode(
          item.productCode
        );

      if (!productCode) {
        throw new AppError(
          "Todos los productos deben tener un código",
          400
        );
      }

      if (
        typeof item.quantity !== "number" ||
        item.quantity <= 0
      ) {
        throw new AppError(
          "Todas las cantidades deben ser mayores que cero",
          400
        );
      }

      if (usedCodes.has(productCode)) {
        throw new AppError(
          `El producto ${productCode} está repetido en la venta`,
          400
        );
      }

      usedCodes.add(productCode);

      normalizedItems.push({
        productCode,
        quantity: item.quantity
      });
    }

    const saleNumber =
      this.generateSaleNumber();

    const processedItems = [];
    const stockMovements = [];
    const stockUpdates = [];

    let createdSale = null;

    try {
      for (const item of normalizedItems) {
        const product =
          await this.productRepository
            .findOneAndUpdate(
              {
                code: item.productCode,
                active: true,
                stock: {
                  $gte: item.quantity
                }
              },
              {
                $inc: {
                  stock: -item.quantity
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
              code: item.productCode,
              active: true
            });

          if (!productExists) {
            throw new AppError(
              `Producto no encontrado: ${item.productCode}`,
              404
            );
          }

          throw new AppError(
            `Stock insuficiente para ${item.productCode}`,
            409
          );
        }

        const previousStock =
          product.stock + item.quantity;

        const subtotal = this.roundMoney(
          product.price * item.quantity
        );

        processedItems.push({
          product: product._id,
          code: product.code,
          name: product.name,
          quantity: item.quantity,
          unitPrice: product.price,
          subtotal
        });

        stockMovements.push({
          product: product._id,
          type: "salida",
          change: -item.quantity,
          previousStock,
          newStock: product.stock,
          reason: `Venta ${saleNumber}`,
          performedBy:
            authenticatedUser._id
        });

        stockUpdates.push({
          productId: product._id,
          quantity: item.quantity
        });
      }

      const total = this.roundMoney(
        processedItems.reduce(
          (accumulator, item) =>
            accumulator + item.subtotal,
          0
        )
      );

      createdSale =
        await this.saleRepository.create({
          saleNumber,
          items: processedItems,
          total,
          paymentMethod:
            saleData.paymentMethod,
          notes:
            saleData.notes?.trim() || "",
          soldBy: authenticatedUser._id,
          status: "completada"
        });

      const movementsWithSale =
        stockMovements.map((movement) => ({
          ...movement,
          sale: createdSale._id
        }));

      await this.stockMovementRepository
        .insertMany(movementsWithSale);

      await createdSale.populate(
        "soldBy",
        "username displayName role"
      );

      return createdSale;
    } catch (error) {
      if (createdSale) {
        await Promise.allSettled([
          this.stockMovementRepository
            .deleteMany({
              sale: createdSale._id
            }),

          this.saleRepository.deleteOne({
            _id: createdSale._id
          })
        ]);
      }

      await Promise.allSettled(
        stockUpdates.map((stockUpdate) =>
          this.productRepository.updateOne(
            {
              _id: stockUpdate.productId
            },
            {
              $inc: {
                stock: stockUpdate.quantity
              }
            }
          )
        )
      );

      throw error;
    }
  }
}