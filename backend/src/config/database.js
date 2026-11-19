import mongoose from "mongoose";

export async function connectDB() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("Falta configurar MONGO_URI en el archivo .env");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("Conexión con MongoDB establecida correctamente");
  } catch (error) {
    console.error("Error al conectar con MongoDB:", error.message);
    process.exit(1);
  }
}