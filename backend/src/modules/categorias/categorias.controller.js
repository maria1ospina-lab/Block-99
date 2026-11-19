import mongoose from "mongoose";
import * as categoriasService from "./categorias.service.js";

function responderError(res, error, operacion) {
  console.error(`Error al ${operacion}:`, error);

  if (error.name === "ValidationError" || error.name === "CastError") {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: error.message
    });
  }

  if (error.code === 11000) {
    return res.status(409).json({
      statusCode: 409,
      success: false,
      message: "Ya existe una categoría con ese nombre"
    });
  }

  return res.status(500).json({
    statusCode: 500,
    success: false,
    message: `Error al ${operacion}`
  });
}

export async function obtenerCategorias(req, res) {
  try {
    const categorias = await categoriasService.listarCategorias();
    return res.status(200).json({
      statusCode: 200,
      success: true,
      message: "Categorías obtenidas correctamente",
      data: categorias
    });
  } catch (error) {
    return responderError(res, error, "obtener categorías");
  }
}

export async function obtenerCategoriaPorId(req, res) {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: "ID de categoría inválido"
    });
  }

  try {
    const categoria = await categoriasService.obtenerCategoriaPorId(id);

    if (!categoria) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        message: "Categoría no encontrada"
      });
    }

    return res.status(200).json({
      statusCode: 200,
      success: true,
      message: "Categoría obtenida correctamente",
      data: categoria
    });
  } catch (error) {
    return responderError(res, error, "obtener categoría");
  }
}

export async function crearCategoria(req, res) {
  const nombre = req.body?.nombre;
  const descripcion = req.body?.descripcion ?? "";

  if (typeof nombre !== "string" || nombre.trim().length < 2 || nombre.trim().length > 60) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: "El nombre debe tener entre 2 y 60 caracteres"
    });
  }

  try {
    const categoria = await categoriasService.crearCategoria({
      nombre: nombre.trim(),
      descripcion: typeof descripcion === "string" ? descripcion.trim() : ""
    });

    return res.status(201).json({
      statusCode: 201,
      success: true,
      message: "Categoría creada correctamente",
      data: categoria
    });
  } catch (error) {
    return responderError(res, error, "crear categoría");
  }
}

export async function actualizarCategoria(req, res) {
  const { id } = req.params;
  const { nombre, descripcion } = req.body ?? {};

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: "ID de categoría inválido"
    });
  }

  const datos = {};

  if (nombre !== undefined) {
    if (typeof nombre !== "string" || nombre.trim().length < 2 || nombre.trim().length > 60) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        message: "El nombre debe tener entre 2 y 60 caracteres"
      });
    }
    datos.nombre = nombre.trim();
  }

  if (descripcion !== undefined) {
    if (typeof descripcion !== "string" || descripcion.length > 300) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        message: "La descripción debe ser un texto de máximo 300 caracteres"
      });
    }
    datos.descripcion = descripcion.trim();
  }

  if (Object.keys(datos).length === 0) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: "Envía nombre o descripción para actualizar"
    });
  }

  try {
    const categoria = await categoriasService.actualizarCategoria(id, datos);

    if (!categoria) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        message: "Categoría no encontrada"
      });
    }

    return res.status(200).json({
      statusCode: 200,
      success: true,
      message: "Categoría actualizada correctamente",
      data: categoria
    });
  } catch (error) {
    return responderError(res, error, "actualizar categoría");
  }
}

export async function eliminarCategoria(req, res) {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: "ID de categoría inválido"
    });
  }

  try {
    const categoria = await categoriasService.desactivarCategoria(id);

    if (!categoria) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        message: "Categoría no encontrada"
      });
    }

    return res.status(200).json({
      statusCode: 200,
      success: true,
      message: "Categoría desactivada correctamente",
      data: categoria
    });
  } catch (error) {
    return responderError(res, error, "desactivar categoría");
  }
}
