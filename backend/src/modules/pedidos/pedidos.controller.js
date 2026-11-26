import mongoose from "mongoose";
import * as pedidosService from "./pedidos.service.js";

const estadosPermitidos = [
  "pendiente",
  "pagado",
  "enviado",
  "entregado",
  "cancelado"
];

function responderError(res, error, operacion) {
  console.error(`Error al ${operacion}:`, error);

  if (error.statusCode) {
    return res.status(error.statusCode).json({
      statusCode: error.statusCode,
      success: false,
      message: error.message
    });
  }

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
      message: "Ya existe un cliente con ese correo."
    });
  }

  return res.status(500).json({
    statusCode: 500,
    success: false,
    message: `Error al ${operacion}`
  });
}

export async function obtenerPedidos(req, res) {
  const { estado } = req.query;

  if (estado && !estadosPermitidos.includes(estado)) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: "Estado de pedido inválido"
    });
  }

  try {
    const pedidos = await pedidosService.listarPedidos({ estado });

    return res.status(200).json({
      statusCode: 200,
      success: true,
      message: "Pedidos obtenidos correctamente",
      data: pedidos
    });
  } catch (error) {
    return responderError(res, error, "obtener pedidos");
  }
}

export async function obtenerPedidoPorId(req, res) {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: "ID de pedido inválido"
    });
  }

  try {
    const pedido = await pedidosService.obtenerPedidoPorId(id);

    if (!pedido) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        message: "Pedido no encontrado"
      });
    }

    return res.status(200).json({
      statusCode: 200,
      success: true,
      message: "Pedido obtenido correctamente",
      data: pedido
    });
  } catch (error) {
    return responderError(res, error, "obtener pedido");
  }
}

export async function crearPedido(req, res) {
  const datos = req.body ?? {};

  if (!mongoose.isValidObjectId(datos.cliente)) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: "Debes enviar un ID de cliente válido"
    });
  }

  if (!Array.isArray(datos.productos) || datos.productos.length === 0) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: "El pedido debe incluir al menos un producto"
    });
  }

  const productos = [];

  for (const item of datos.productos) {
    if (!mongoose.isValidObjectId(item?.producto)) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        message: "Cada producto debe tener un ID válido"
      });
    }

    if (
      typeof item.talla !== "string" ||
      !item.talla.trim() ||
      typeof item.color !== "string" ||
      !item.color.trim()
    ) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        message: "Cada producto debe incluir talla y color"
      });
    }

    if (!Number.isInteger(item.cantidad) || item.cantidad < 1) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        message: "La cantidad debe ser un número entero mayor que cero"
      });
    }

    productos.push({
      producto: item.producto,
      talla: item.talla.trim(),
      color: item.color.trim(),
      cantidad: item.cantidad
    });
  }

  if (datos.notas !== undefined && typeof datos.notas !== "string") {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: "Las notas deben ser texto"
    });
  }

  if (datos.notas && datos.notas.length > 500) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: "Las notas no pueden superar 500 caracteres"
    });
  }

  try {
    const pedido = await pedidosService.crearPedido({
      cliente: datos.cliente,
      productos,
      notas: datos.notas?.trim() ?? ""
    });

    return res.status(201).json({
      statusCode: 201,
      success: true,
      message: "Pedido creado correctamente",
      data: pedido
    });
  } catch (error) {
    return responderError(res, error, "crear pedido");
  }
}

export async function crearPedidoPublico(req, res) {
  const datos = req.body ?? {};
  const cliente = datos.cliente ?? {};

  if (
    typeof cliente.nombre !== "string" ||
    cliente.nombre.trim().length < 2 ||
    cliente.nombre.trim().length > 80 ||
    typeof cliente.apellido !== "string" ||
    cliente.apellido.trim().length < 2 ||
    cliente.apellido.trim().length > 80
  ) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: "Envía nombre y apellido válidos."
    });
  }

  if (
    typeof cliente.correo !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cliente.correo.trim())
  ) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: "Envía un correo válido."
    });
  }

  if (
    cliente.telefono !== undefined &&
    (typeof cliente.telefono !== "string" || cliente.telefono.trim().length > 20)
  ) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: "El teléfono debe tener máximo 20 caracteres."
    });
  }

  if (
    cliente.direccion !== undefined &&
    (typeof cliente.direccion !== "string" || cliente.direccion.trim().length > 200)
  ) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: "La dirección debe tener máximo 200 caracteres."
    });
  }

  if (!Array.isArray(datos.productos) || datos.productos.length === 0) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: "El pedido debe incluir al menos un producto."
    });
  }

  const productos = [];

  for (const item of datos.productos) {
    if (!mongoose.isValidObjectId(item?.producto)) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        message: "Cada producto debe tener un ID válido."
      });
    }

    if (
      typeof item.talla !== "string" ||
      !item.talla.trim() ||
      typeof item.color !== "string" ||
      !item.color.trim() ||
      !Number.isInteger(item.cantidad) ||
      item.cantidad < 1
    ) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        message: "Cada producto debe incluir talla, color y cantidad válida."
      });
    }

    productos.push({
      producto: item.producto,
      talla: item.talla.trim(),
      color: item.color.trim(),
      cantidad: item.cantidad
    });
  }

  const notas = datos.notas ?? "";

  if (typeof notas !== "string" || notas.length > 500) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: "Las notas deben ser texto de máximo 500 caracteres."
    });
  }

  try {
    const pedido = await pedidosService.crearPedido({
      cliente: {
        nombre: cliente.nombre.trim(),
        apellido: cliente.apellido.trim(),
        correo: cliente.correo.trim().toLowerCase(),
        telefono: cliente.telefono?.trim() ?? "",
        direccion: cliente.direccion?.trim() ?? ""
      },
      productos,
      notas: notas.trim()
    });

    return res.status(201).json({
      statusCode: 201,
      success: true,
      message: "Pedido creado correctamente.",
      data: pedido
    });
  } catch (error) {
    return responderError(res, error, "crear pedido");
  }
}

export async function actualizarEstadoPedido(req, res) {
  const { id } = req.params;
  const { estado } = req.body ?? {};

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: "ID de pedido inválido"
    });
  }

  if (!estadosPermitidos.includes(estado)) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: "Estado inválido"
    });
  }

  if (estado === "cancelado") {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: "Usa la ruta de cancelar pedido para devolver el inventario."
    });
  }

  try {
    const pedido = await pedidosService.actualizarEstadoPedido(id, estado);

    if (!pedido) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        message: "Pedido no encontrado"
      });
    }

    return res.status(200).json({
      statusCode: 200,
      success: true,
      message: "Estado del pedido actualizado correctamente",
      data: pedido
    });
  } catch (error) {
    return responderError(res, error, "actualizar estado del pedido");
  }
}

export async function cancelarPedido(req, res) {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: "ID de pedido inválido"
    });
  }

  try {
    const pedido = await pedidosService.cancelarPedido(id);

    return res.status(200).json({
      statusCode: 200,
      success: true,
      message: "Pedido cancelado y su inventario fue actualizado.",
      data: pedido
    });
  } catch (error) {
    return responderError(res, error, "cancelar pedido");
  }
}