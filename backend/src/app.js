import express from "express";
import cors from "cors";
import authRoutes from "./auth/auth.routes.js";
import productosRoutes from "./modules/productos/productos.routes.js";
import categoriasRoutes from "./modules/categorias/categorias.routes.js";
import clientesRoutes from "./modules/clientes/clientes.routes.js";
import pedidosRoutes from "./modules/pedidos/pedidos.routes.js";
import imagenesRoutes from "./modules/imagenes/imagenes.routes.js";
import { fileURLToPath } from "node:url";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(fileURLToPath(new URL("../uploads/", import.meta.url))));

app.get("/api/health", (req, res) => {
  return res.status(200).json({
    statusCode: 200,
    success: true,
    message: "La API de BLOCK 99 está funcionando"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/productos", productosRoutes);
app.use("/api/categorias", categoriasRoutes);
app.use("/api/clientes", clientesRoutes);
app.use("/api/pedidos", pedidosRoutes);
app.use("/api/imagenes", imagenesRoutes);

export default app;
