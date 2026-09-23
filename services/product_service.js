import AppError from "../errors/app_error.js";

const VALID_UNITS = [
  "unidad",
  "metro",
  "kilogramo",
  "litro",
  "caja"
];

export default class ProductService {
  constructor(productRepository) {
    this.productRepository = productRepository;
  }

  normalizeCode(code) {
    return code?.trim().toUpperCase();
  }

  async getAll(includeInactive = false) {
    const filter = includeInactive
      ? {}
      : { active: true };

    return await this.productRepository
      .find(filter)
      .sort({ name: 1 });
  }

  async getByCode(
    code,
    includeInactive = false
  ) {
    const normalizedCode =
      this.normalizeCode(code);

    const filter = {
      code: normalizedCode
    };

    if (!includeInactive) {
      filter.active = true;
    }

    const product =
      await this.productRepository.findOne(
        filter
      );

    if (!product) {
      throw new AppError(
        "Producto no encontrado",
        404
      );
    }

    return product;
  }

  async add(productData) {
    const code =
      this.normalizeCode(productData.code);

    const name = productData.name?.trim();
    const category =
      productData.category?.trim();

    if (!code) {
      throw new AppError(
        "El código del producto es obligatorio",
        400
      );
    }

    if (!name) {
      throw new AppError(
        "El nombre del producto es obligatorio",
        400
      );
    }

    if (!category) {
      throw new AppError(
        "La categoría es obligatoria",
        400
      );
    }

    if (
      typeof productData.price !== "number" ||
      productData.price < 0
    ) {
      throw new AppError(
        "El precio debe ser un número mayor o igual a cero",
        400
      );
    }

    const unit =
      productData.unit || "unidad";

    if (!VALID_UNITS.includes(unit)) {
      throw new AppError(
        "La unidad de venta no es válida",
        400
      );
    }

    const minimumStock =
      productData.minimumStock ?? 0;

    if (
      typeof minimumStock !== "number" ||
      minimumStock < 0
    ) {
      throw new AppError(
        "El stock mínimo debe ser un número mayor o igual a cero",
        400
      );
    }

    const existingProduct =
      await this.productRepository.findOne({
        code
      });

    if (existingProduct) {
      throw new AppError(
        "El código del producto ya existe",
        409
      );
    }

    return await this.productRepository.create({
      code,
      name,
      description:
        productData.description?.trim() || "",
      category,
      unit,
      price: productData.price,
      stock: 0,
      minimumStock,
      active: true
    });
  }

  async update(code, newData) {
    const normalizedCode =
      this.normalizeCode(code);

    const allowedFields = [
      "name",
      "description",
      "category",
      "unit",
      "price",
      "minimumStock",
      "active"
    ];

    const updateData = {};

    for (const field of allowedFields) {
      if (newData[field] !== undefined) {
        updateData[field] = newData[field];
      }
    }

    if (
      updateData.unit !== undefined &&
      !VALID_UNITS.includes(updateData.unit)
    ) {
      throw new AppError(
        "La unidad de venta no es válida",
        400
      );
    }

    if (
      updateData.price !== undefined &&
      (
        typeof updateData.price !== "number" ||
        updateData.price < 0
      )
    ) {
      throw new AppError(
        "El precio debe ser un número mayor o igual a cero",
        400
      );
    }

    if (
      updateData.minimumStock !== undefined &&
      (
        typeof updateData.minimumStock !==
          "number" ||
        updateData.minimumStock < 0
      )
    ) {
      throw new AppError(
        "El stock mínimo debe ser un número mayor o igual a cero",
        400
      );
    }

    const updatedProduct =
      await this.productRepository.findOneAndUpdate(
        {
          code: normalizedCode
        },
        updateData,
        {
          returnDocument: "after",
          runValidators: true
        }
      );

    if (!updatedProduct) {
      throw new AppError(
        "Producto no encontrado",
        404
      );
    }

    return updatedProduct;
  }

  async delete(code) {
    const normalizedCode =
      this.normalizeCode(code);

    const product =
      await this.productRepository.findOneAndUpdate(
        {
          code: normalizedCode
        },
        {
          active: false
        },
        {
          returnDocument: "after"
        }
      );

    if (!product) {
      throw new AppError(
        "Producto no encontrado",
        404
      );
    }

    return product;
  }
}