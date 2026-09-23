import bcrypt from "bcrypt";

import AppError from "../errors/app_error.js";

const SALT_ROUNDS = 10;

export default class UserService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  toPublicUser(userDocument) {
    const user =
      typeof userDocument.toObject === "function"
        ? userDocument.toObject()
        : { ...userDocument };

    delete user.password;

    return user;
  }

  async getAll() {
    const users = await this.userRepository
      .find()
      .sort({ displayName: 1 });

    return users.map((user) => this.toPublicUser(user));
  }

  async getByUsername(username) {
    const normalizedUsername =
      username.trim().toLowerCase();

    const user = await this.userRepository.findOne({
      username: normalizedUsername
    });

    if (!user) {
      throw new AppError("Usuario no encontrado", 404);
    }

    return this.toPublicUser(user);
  }

  async add(userData) {
    const username =
      userData.username?.trim().toLowerCase();

    const displayName =
      userData.displayName?.trim();

    if (!username) {
      throw new AppError(
        "El nombre de usuario es obligatorio",
        400
      );
    }

    if (!displayName) {
      throw new AppError(
        "El nombre completo es obligatorio",
        400
      );
    }

    if (
      typeof userData.password !== "string" ||
      userData.password.length < 6
    ) {
      throw new AppError(
        "La contraseña debe tener al menos 6 caracteres",
        400
      );
    }

    const role = userData.role || "employee";

    if (!["admin", "employee"].includes(role)) {
      throw new AppError(
        "El rol debe ser admin o employee",
        400
      );
    }

    const existingUser =
      await this.userRepository.findOne({
        username
      });

    if (existingUser) {
      throw new AppError(
        "El nombre de usuario ya existe",
        409
      );
    }

    const hashedPassword = await bcrypt.hash(
      userData.password,
      SALT_ROUNDS
    );

    const createdUser =
      await this.userRepository.create({
        username,
        password: hashedPassword,
        displayName,
        role,
        active: true
      });

    return this.toPublicUser(createdUser);
  }

  async update(username, newData) {
    const normalizedUsername =
      username.trim().toLowerCase();

    const updateData = {};

    if (newData.displayName !== undefined) {
      const displayName = newData.displayName.trim();

      if (!displayName) {
        throw new AppError(
          "El nombre completo no puede estar vacío",
          400
        );
      }

      updateData.displayName = displayName;
    }

    if (newData.role !== undefined) {
      if (
        !["admin", "employee"].includes(newData.role)
      ) {
        throw new AppError(
          "El rol debe ser admin o employee",
          400
        );
      }

      updateData.role = newData.role;
    }

    if (newData.active !== undefined) {
      if (typeof newData.active !== "boolean") {
        throw new AppError(
          "El campo active debe ser verdadero o falso",
          400
        );
      }

      updateData.active = newData.active;
    }

    if (newData.password !== undefined) {
      if (
        typeof newData.password !== "string" ||
        newData.password.length < 6
      ) {
        throw new AppError(
          "La contraseña debe tener al menos 6 caracteres",
          400
        );
      }

      updateData.password = await bcrypt.hash(
        newData.password,
        SALT_ROUNDS
      );
    }

    const updatedUser =
      await this.userRepository.findOneAndUpdate(
        {
          username: normalizedUsername
        },
        updateData,
        {
          returnDocument: "after",
          runValidators: true
        }
      );

    if (!updatedUser) {
      throw new AppError("Usuario no encontrado", 404);
    }

    return this.toPublicUser(updatedUser);
  }

  async delete(username) {
    const normalizedUsername =
      username.trim().toLowerCase();

    const deletedUser =
      await this.userRepository.findOneAndDelete({
        username: normalizedUsername
      });

    if (!deletedUser) {
      throw new AppError("Usuario no encontrado", 404);
    }

    return this.toPublicUser(deletedUser);
  }
}