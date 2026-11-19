import { Router } from "express";
import {
  obtenerCategorias,
  obtenerCategoriaPorId,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria
} from "./categorias.controller.js";
import { verificarToken } from "../../middleware/auth.middleware.js";

const router = Router();

router.get("/show", obtenerCategorias);
router.get("/info/:id", obtenerCategoriaPorId);
router.post("/store", verificarToken, crearCategoria);
router.put("/update/:id", verificarToken, actualizarCategoria);
router.delete("/delete/:id", verificarToken, eliminarCategoria);

export default router;
