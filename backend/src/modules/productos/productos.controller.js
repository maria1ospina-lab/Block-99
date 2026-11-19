import mongoose from "mongoose";
import * as productosService from "./productos.service.js";

function responderError(res, error, operacion) {
  console.error(`Error al ${operacion}:`, error);

  if (error.name === "ValidationError" || error.name === "CastError") {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: error.message,
    });
  }

  return res.status(500).json({
    statusCode: 500,
    success: false,
    message: `Error al ${operacion}`,
  });
}

export async function obtenerProductos(req, res) {
  try {
    const productos = await productosService.listarProductos({
      categoria: req.query.categoria,
      busqueda: req.query.busqueda,
    });

    return res.status(200).json({
      statusCode: 200,
      success: true,
      message: "Productos obtenidos correctamente",
      data: productos,
    });
  } catch (error) {
    return responderError(res, error, "obtener productos");
  }
}

export async function obtenerProductoPorId(req, res) {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: "ID de producto inválido",
    });
  }

  try {
    const producto = await productosService.obtenerProductoPorId(id);

    if (!producto) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        message: "Producto no encontrado",
      });
    }

    return res.status(200).json({
      statusCode: 200,
      success: true,
      message: "Producto obtenido correctamente",
      data: producto,
    });
  } catch (error) {
    return responderError(res, error, "obtener producto");
  }
}

export async function crearProducto(req, res) {
  try {
    const producto = await productosService.crearProducto(req.body ?? {});

    return res.status(201).json({
      statusCode: 201,
      success: true,
      message: "Producto creado correctamente",
      data: producto,
    });
  } catch (error) {
    return responderError(res, error, "crear producto");
  }
}

export async function actualizarProducto(req, res) {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: "ID de producto inválido",
    });
  }

  const camposPermitidos = [
    "nombre",
    "descripcion",
    "categoria",
    "precio",
    "imagen",
    "estilo",
    "variantes",
  ];

  const datos = Object.fromEntries(
    Object.entries(req.body ?? {}).filter(([campo]) =>
      camposPermitidos.includes(campo)
    )
  );

  if (Object.keys(datos).length === 0) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: "Envía al menos un campo válido para actualizar",
    });
  }

  try {
    const producto = await productosService.actualizarProducto(id, datos);

    if (!producto) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        message: "Producto no encontrado",
      });
    }

    return res.status(200).json({
      statusCode: 200,
      success: true,
      message: "Producto actualizado correctamente",
      data: producto,
    });
  } catch (error) {
    return responderError(res, error, "actualizar producto");
  }
}

export async function eliminarProducto(req, res) {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: "ID de producto inválido",
    });
  }

  try {
    const producto = await productosService.desactivarProducto(id);

    if (!producto) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        message: "Producto no encontrado",
      });
    }

    return res.status(200).json({
      statusCode: 200,
      success: true,
      message: "Producto desactivado correctamente",
      data: producto,
    });
  } catch (error) {
    return responderError(res, error, "desactivar producto");
  }
}