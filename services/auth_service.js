import bcrypt from "bcrypt";
import { randomBytes } from "crypto";

import AppError from "../errors/app_error.js";

const SESSION_DURATION_MS =
  24 * 60 * 60 * 1000;

export default class AuthService {
  constructor(userRepository, sessionRepository) {
    this.userRepository = userRepository;
    this.sessionRepository = sessionRepository;
  }

  toPublicUser(userDocument) {
    const user = userDocument.toObject();

    delete user.password;

    return user;
  }

  async login(username, password) {
    const normalizedUsername =
      username?.trim().toLowerCase();

    if (!normalizedUsername || !password) {
      throw new AppError(
        "Usuario y contraseña son obligatorios",
        400
      );
    }

    const user = await this.userRepository
      .findOne({
        username: normalizedUsername
      })
      .select("+password");

    if (!user) {
      throw new AppError(
        "Usuario o contraseña incorrectos",
        401
      );
    }

    if (!user.active) {
      throw new AppError(
        "El usuario está desactivado",
        403
      );
    }

    const passwordIsCorrect =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordIsCorrect) {
      throw new AppError(
        "Usuario o contraseña incorrectos",
        401
      );
    }

    const token = randomBytes(32).toString("hex");

    const expiresAt = new Date(
      Date.now() + SESSION_DURATION_MS
    );

    await this.sessionRepository.create({
      token,
      user: user._id,
      expiresAt
    });

    return {
      token,
      expiresAt,
      user: this.toPublicUser(user)
    };
  }

  async logout(token) {
    if (!token) {
      throw new AppError(
        "Token de sesión obligatorio",
        401
      );
    }

    await this.sessionRepository.deleteOne({
      token
    });
  }
}