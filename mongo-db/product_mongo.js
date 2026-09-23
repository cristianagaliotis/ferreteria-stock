import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      trim: true,
      default: ""
    },

    category: {
      type: String,
      required: true,
      trim: true
    },

    unit: {
      type: String,
      enum: [
        "unidad",
        "metro",
        "kilogramo",
        "litro",
        "caja"
      ],
      default: "unidad"
    },

    price: {
      type: Number,
      required: true,
      min: 0
    },

    stock: {
      type: Number,
      default: 0,
      min: 0
    },

    minimumStock: {
      type: Number,
      default: 0,
      min: 0
    },

    active: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

const ProductMongo = mongoose.model(
  "Product",
  productSchema,
  "products"
);

export default ProductMongo;