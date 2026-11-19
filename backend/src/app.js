import express from "express";
import cors from "cors";
import authRoutes from "./auth/auth.routes.js";
import productosRoutes from "./modules/productos/productos.routes.js";
import categoriasRoutes from "./modules/categorias/categorias.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "La API de BLOCK 99 está funcionando"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/productos", productosRoutes);
app.use("/api/categorias", categoriasRoutes);

export default app;
// Recarga del servidor tras corregir la URI local de MongoDB.
