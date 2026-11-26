import multer from "multer";

const formatosPermitidos = new Set([
  "image/png",
  "image/jpeg",
  "image/webp"
]);

const recibirImagen = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024,
    files: 1,
    fields: 0,
    parts: 1
  },
  fileFilter(req, archivo, callback) {
    if (!formatosPermitidos.has(archivo.mimetype)) {
      return callback(new Error("Solo se permiten archivos PNG, JPG o WebP."));
    }

    return callback(null, true);
  }
});

export default recibirImagen;
