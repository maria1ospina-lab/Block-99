import mongoose from "mongoose";
import * as clientesService from "./clientes.service.js";

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
      message: "Ya existe un cliente con ese correo"
    });
  }

  return res.status(500).json({
    statusCode: 500,
    success: false,
    message: `Error al ${operacion}`
  });
}

function textoValido(valor, minimo, maximo) {
  return (
    typeof valor === "string" &&
    valor.trim().length >= minimo &&
    valor.trim().length <= maximo
  );
}

function correoValido(correo) {
  return (
    textoValido(correo, 5, 120) &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())
  );
}

function validarCamposOpcionales(datos) {
  if (
    datos.telefono !== undefined &&
    (typeof datos.telefono !== "string" || datos.telefono.trim().length > 20)
  ) {
    return "El teléfono debe ser texto de máximo 20 caracteres";
  }

  if (
    datos.direccion !== undefined &&
    (typeof datos.direccion !== "string" || datos.direccion.trim().length > 200)
  ) {
    return "La dirección debe ser texto de máximo 200 caracteres";
  }

  return null;
}

export async function obtenerClientes(req, res) {
  try {
    const clientes = await clientesService.listarClientes({
      busqueda: req.query.busqueda
    });

    return res.status(200).json({
      statusCode: 200,
      success: true,
      message: "Clientes obtenidos correctamente",
      data: clientes
    });
  } catch (error) {
    return responderError(res, error, "obtener clientes");
  }
}

export async function obtenerClientePorId(req, res) {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: "ID de cliente inválido"
    });
  }

  try {
    const cliente = await clientesService.obtenerClientePorId(id);

    if (!cliente) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        message: "Cliente no encontrado"
      });
    }

    return res.status(200).json({
      statusCode: 200,
      success: true,
      message: "Cliente obtenido correctamente",
      data: cliente
    });
  } catch (error) {
    return responderError(res, error, "obtener cliente");
  }
}

export async function crearCliente(req, res) {
  const datos = req.body ?? {};

  if (!textoValido(datos.nombre, 2, 80)) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: "El nombre debe tener entre 2 y 80 caracteres"
    });
  }

  if (!textoValido(datos.apellido, 2, 80)) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: "El apellido debe tener entre 2 y 80 caracteres"
    });
  }

  if (!correoValido(datos.correo)) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: "Escribe un correo válido"
    });
  }

  const errorOpcionales = validarCamposOpcionales(datos);

  if (errorOpcionales) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: errorOpcionales
    });
  }

  try {
    const cliente = await clientesService.crearCliente({
      nombre: datos.nombre.trim(),
      apellido: datos.apellido.trim(),
      correo: datos.correo.trim().toLowerCase(),
      telefono: datos.telefono?.trim() ?? "",
      direccion: datos.direccion?.trim() ?? ""
    });

    return res.status(201).json({
      statusCode: 201,
      success: true,
      message: "Cliente creado correctamente",
      data: cliente
    });
  } catch (error) {
    return responderError(res, error, "crear cliente");
  }
}

export async function actualizarCliente(req, res) {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: "ID de cliente inválido"
    });
  }

  const camposPermitidos = [
    "nombre",
    "apellido",
    "correo",
    "telefono",
    "direccion"
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
      message: "Envía al menos un campo válido para actualizar"
    });
  }

  if (datos.nombre !== undefined && !textoValido(datos.nombre, 2, 80)) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: "El nombre debe tener entre 2 y 80 caracteres"
    });
  }

  if (datos.apellido !== undefined && !textoValido(datos.apellido, 2, 80)) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: "El apellido debe tener entre 2 y 80 caracteres"
    });
  }

  if (datos.correo !== undefined && !correoValido(datos.correo)) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: "Escribe un correo válido"
    });
  }

  const errorOpcionales = validarCamposOpcionales(datos);

  if (errorOpcionales) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: errorOpcionales
    });
  }

  for (const campo of ["nombre", "apellido", "correo", "telefono", "direccion"]) {
    if (typeof datos[campo] === "string") {
      datos[campo] = datos[campo].trim();
    }
  }

  if (datos.correo) {
    datos.correo = datos.correo.toLowerCase();
  }

  try {
    const cliente = await clientesService.actualizarCliente(id, datos);

    if (!cliente) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        message: "Cliente no encontrado"
      });
    }

    return res.status(200).json({
      statusCode: 200,
      success: true,
      message: "Cliente actualizado correctamente",
      data: cliente
    });
  } catch (error) {
    return responderError(res, error, "actualizar cliente");
  }
}

export async function eliminarCliente(req, res) {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: "ID de cliente inválido"
    });
  }

  try {
    const cliente = await clientesService.desactivarCliente(id);

    if (!cliente) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        message: "Cliente no encontrado"
      });
    }

    return res.status(200).json({
      statusCode: 200,
      success: true,
      message: "Cliente desactivado correctamente",
      data: cliente
    });
  } catch (error) {
    return responderError(res, error, "desactivar cliente");
  }
}