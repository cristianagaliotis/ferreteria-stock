import mongoose from "mongoose";

import config from "../config.js";
import UserMongo from "../mongo-db/user_mongo.js";
import UserService from "../services/user_service.js";

async function createAdmin() {
  const [
    username,
    password,
    ...displayNameParts
  ] = process.argv.slice(2);

  const displayName = displayNameParts.join(" ");

  if (!username || !password || !displayName) {
    console.error(
      "Uso: node scripts/create_admin.js usuario contraseña nombre completo"
    );

    process.exitCode = 1;
    return;
  }

  try {
    await mongoose.connect(config.mongoUrl);

    const userService = new UserService(UserMongo);

    const admin = await userService.add({
      username,
      password,
      displayName,
      role: "admin"
    });

    console.log("Administrador creado correctamente:");
    console.log(admin);
  } catch (error) {
    console.error(
      "No se pudo crear el administrador:",
      error.message
    );

    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

createAdmin();