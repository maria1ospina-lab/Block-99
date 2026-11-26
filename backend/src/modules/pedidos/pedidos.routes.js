import { Router } from "express";
import {
  obtenerPedidos,
  obtenerPedidoPorId,
  crearPedido,
  actualizarEstadoPedido,
  cancelarPedido,
  crearPedidoPublico
} from "./pedidos.controller.js";
import { verificarToken } from "../../middleware/auth.middleware.js";

const router = Router();

router.get("/show", verificarToken, obtenerPedidos);
router.get("/info/:id", verificarToken, obtenerPedidoPorId);
router.post("/store", verificarToken, crearPedido);
router.post("/public", crearPedidoPublico);
router.patch("/estado/:id", verificarToken, actualizarEstadoPedido);
router.patch("/cancel/:id", verificarToken, cancelarPedido);

export default router;