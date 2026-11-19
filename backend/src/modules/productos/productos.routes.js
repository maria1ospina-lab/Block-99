import { Router } from "express";
import {
  obtenerProductos,
  obtenerProductoPorId,
  crearProducto,
  actualizarProducto,
  eliminarProducto
} from "./productos.controller.js";
import { verificarToken } from "../../middleware/auth.middleware.js";

const router = Router();

router.get("/show", obtenerProductos);
router.get("/info/:id", obtenerProductoPorId);
router.post("/store", verificarToken, crearProducto);
router.put("/update/:id", verificarToken, actualizarProducto);
router.delete("/delete/:id", verificarToken, eliminarProducto);

export default router;
