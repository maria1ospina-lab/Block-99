import { Router } from "express";
import recibirImagen from "./imagenes.middleware.js";
import { convertirImagenWebp } from "./imagenes.controller.js";
import { verificarToken } from "../../middleware/auth.middleware.js";

const router = Router();

function procesarArchivo(req, res, next) {
  recibirImagen.single("imagen")(req, res, (error) => {
    if (error) {
      const statusCode = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
      return res.status(statusCode).json({
        statusCode,
        success: false,
        message: error.message
      });
    }

    return next();
  });
}

router.post("/webp", verificarToken, procesarArchivo, convertirImagenWebp);

export default router;
