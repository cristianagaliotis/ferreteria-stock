import mongoose from "mongoose";

import app from "./app.js";
import config from "./config.js";

async function startServer() {
  try {
    await mongoose.connect(config.mongoUrl);

    console.log("Conectado correctamente a MongoDB");

    app.listen(config.port, () => {
      console.log(
        `Servidor iniciado en http://localhost:${config.port}`
      );
    });
  } catch (error) {
    console.error(
      "Error al iniciar el servidor:",
      error.message
    );

    process.exit(1);
  }
}

startServer();