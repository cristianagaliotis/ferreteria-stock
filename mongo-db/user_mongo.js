import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },

    password: {
      type: String,
      required: true,
      select: false
    },

    displayName: {
      type: String,
      required: true,
      trim: true
    },

    role: {
      type: String,
      enum: ["admin", "employee"],
      default: "employee"
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

const UserMongo = mongoose.model(
  "User",
  userSchema,
  "users"
);

export default UserMongo;