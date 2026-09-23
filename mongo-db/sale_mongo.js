import mongoose from "mongoose";

const saleItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },

    code: {
      type: String,
      required: true
    },

    name: {
      type: String,
      required: true
    },

    quantity: {
      type: Number,
      required: true,
      min: 0.001
    },

    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0
    }
  },
  {
    _id: false
  }
);

const saleSchema = new mongoose.Schema(
  {
    saleNumber: {
      type: String,
      required: true,
      unique: true
    },

    items: {
      type: [saleItemSchema],
      required: true
    },

    total: {
      type: Number,
      required: true,
      min: 0
    },

    paymentMethod: {
      type: String,
      enum: [
        "efectivo",
        "debito",
        "credito",
        "transferencia",
        "otro"
      ],
      required: true
    },

    notes: {
      type: String,
      trim: true,
      default: ""
    },

    soldBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    status: {
      type: String,
      enum: [
        "completada",
        "cancelada"
      ],
      default: "completada"
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

const SaleMongo = mongoose.model(
  "Sale",
  saleSchema,
  "sales"
);

export default SaleMongo;