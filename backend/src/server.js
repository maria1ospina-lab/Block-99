import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./config/database.js";

const PORT = process.env.PORT || 3000;

async function iniciarServidor() {
  await connectDB();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor activo en http://localhost:${PORT}`);
  });
}

iniciarServidor();