import { Router } from "express";
import {
  obtenerClientes,
  obtenerClientePorId,
  crearCliente,
  actualizarCliente,
  eliminarCliente
} from "./clientes.controller.js";
import { verificarToken } from "../../middleware/auth.middleware.js";

const router = Router();

router.get("/show", verificarToken, obtenerClientes);
router.get("/info/:id", verificarToken, obtenerClientePorId);
router.post("/store", verificarToken, crearCliente);
router.put("/update/:id", verificarToken, actualizarCliente);
router.delete("/delete/:id", verificarToken, eliminarCliente);

export default router;