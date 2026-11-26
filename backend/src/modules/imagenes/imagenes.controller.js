import { mkdir } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const carpetaProductos = fileURLToPath(
  new URL("../../../uploads/productos/", import.meta.url)
);

export async function convertirImagenWebp(req, res) {
  if (!req.file) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: 'Adjunta el archivo en el campo "imagen".'
    });
  }

  const nombreArchivo = `${randomUUID()}.webp`;
  const rutaArchivo = path.join(carpetaProductos, nombreArchivo);

  try {
    await mkdir(carpetaProductos, { recursive: true });

    const informacion = await sharp(req.file.buffer, {
      limitInputPixels: 40_000_000
    })
      .rotate()
      .resize({
        width: 1600,
        height: 1600,
        fit: "inside",
        withoutEnlargement: true
      })
      .webp({ quality: 82 })
      .toFile(rutaArchivo);

    return res.status(201).json({
      statusCode: 201,
      success: true,
      message: "Imagen convertida a WebP correctamente",
      data: {
        imagen: `/uploads/productos/${nombreArchivo}`,
        formato: "webp",
        ancho: informacion.width,
        alto: informacion.height
      }
    });
  } catch (error) {
    console.error("Error al convertir la imagen:", error.message);

    const esImagenInvalida = /unsupported image|input buffer|pixel limit/i.test(
      error.message
    );

    return res.status(esImagenInvalida ? 400 : 500).json({
      statusCode: esImagenInvalida ? 400 : 500,
      success: false,
      message: esImagenInvalida
        ? "El archivo no es una imagen compatible o supera el límite permitido"
        : "No se pudo convertir la imagen"
    });
  }
}
