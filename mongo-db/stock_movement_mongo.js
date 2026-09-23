import mongoose from "mongoose";

const stockMovementSchema =
  new mongoose.Schema(
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
      },

      type: {
        type: String,
        enum: [
          "entrada",
          "salida",
          "ajuste"
        ],
        required: true
      },

      change: {
        type: Number,
        required: true
      },

      previousStock: {
        type: Number,
        required: true,
        min: 0
      },

      newStock: {
        type: Number,
        required: true,
        min: 0
      },

      reason: {
        type: String,
        required: true,
        trim: true
      },

      performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },

      sale: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Sale",
        default: null
      }
    },
    {
      timestamps: true,
      versionKey: false
    }
  );

const StockMovementMongo = mongoose.model(
  "StockMovement",
  stockMovementSchema,
  "stockmovements"
);

export default StockMovementMongo;