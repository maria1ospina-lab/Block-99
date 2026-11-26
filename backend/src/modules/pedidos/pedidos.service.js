import mongoose from "mongoose";
import Cliente from "../clientes/clientes.model.js";
import Producto from "../productos/productos.model.js";
import Pedido from "./pedidos.model.js";

function crearError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function buscarVariante(producto, talla, color) {
  return producto.variantes.find(
    (variante) =>
      variante.talla.trim().toLowerCase() === talla.trim().toLowerCase() &&
      variante.color.trim().toLowerCase() === color.trim().toLowerCase()
  );
}

export async function listarPedidos(filtros = {}) {
  const consulta = {};

  if (filtros.estado) {
    consulta.estado = filtros.estado;
  }

  return Pedido.find(consulta)
    .populate("cliente", "nombre apellido correo")
    .populate("productos.producto", "nombre categoria imagen")
    .sort({ createdAt: -1 });
}

export async function obtenerPedidoPorId(id) {
  return Pedido.findById(id)
    .populate("cliente", "nombre apellido correo")
    .populate("productos.producto", "nombre categoria imagen");
}

export async function crearPedido(datos) {
  const session = await mongoose.startSession();
  let pedidoId;

  try {
    await session.withTransaction(async () => {
      let cliente;

      if (typeof datos.cliente === "string") {
        // Pedido creado desde administración: recibe el ID de un cliente existente.
        cliente = await Cliente.findOne({
          _id: datos.cliente,
          activo: true
        }).session(session);
      } else if (
        datos.cliente &&
        typeof datos.cliente === "object" &&
        !Array.isArray(datos.cliente)
      ) {
        // Pedido público: busca al comprador por correo o crea su registro.
        const correo = datos.cliente.correo.trim().toLowerCase();

        cliente = await Cliente.findOne({ correo }).session(session);

        if (cliente && !cliente.activo) {
          throw crearError("El cliente está inactivo.", 409);
        }

        if (!cliente) {
          const [nuevoCliente] = await Cliente.create(
            [{
              nombre: datos.cliente.nombre,
              apellido: datos.cliente.apellido,
              correo,
              telefono: datos.cliente.telefono ?? "",
              direccion: datos.cliente.direccion ?? "",
              activo: true
            }],
            { session }
          );

          cliente = nuevoCliente;
        }
      }

      if (!cliente) {
        throw crearError("El cliente no existe o está inactivo.", 404);
      }

      const productosPedido = [];

      for (const item of datos.productos) {
        const producto = await Producto.findOne({
          _id: item.producto,
          activo: true
        }).session(session);

        if (!producto) {
          throw crearError(
            "Uno de los productos no existe o está inactivo.",
            404
          );
        }

        const variante = buscarVariante(producto, item.talla, item.color);

        if (!variante) {
          throw crearError(
            `El producto ${producto.nombre} no tiene esa talla y ese color.`,
            400
          );
        }

        if (variante.stock < item.cantidad) {
          throw crearError(
            `Stock insuficiente para ${producto.nombre} talla ${variante.talla}, color ${variante.color}.`,
            409
          );
        }

        variante.stock -= item.cantidad;
        await producto.save({ session });

        productosPedido.push({
          producto: producto._id,
          nombreProducto: producto.nombre,
          talla: variante.talla,
          color: variante.color,
          cantidad: item.cantidad,
          precioUnitario: producto.precio,
          subtotal: item.cantidad * producto.precio
        });
      }

      const total = productosPedido.reduce(
        (suma, item) => suma + item.subtotal,
        0
      );

      const [pedido] = await Pedido.create(
        [{
          cliente: cliente._id,
          productos: productosPedido,
          total,
          estado: "pendiente",
          notas: datos.notas?.trim() ?? "",
          inventarioActualizado: true
        }],
        { session }
      );

      pedidoId = pedido._id;
    });

    return obtenerPedidoPorId(pedidoId);
  } finally {
    await session.endSession();
  }
}

export async function cancelarPedido(id) {
  const session = await mongoose.startSession();
  let pedidoId;

  try {
    await session.withTransaction(async () => {
      const pedido = await Pedido.findById(id).session(session);

      if (!pedido) {
        throw crearError("Pedido no encontrado.", 404);
      }

      if (["entregado", "cancelado"].includes(pedido.estado)) {
        throw crearError(
          `No se puede cancelar un pedido ${pedido.estado}.`,
          409
        );
      }

      if (pedido.inventarioActualizado) {
        for (const item of pedido.productos) {
          const producto = await Producto.findById(item.producto).session(session);

          if (!producto) {
            throw crearError(
              "No se pudo devolver el inventario porque falta un producto del pedido.",
              409
            );
          }

          const variante = buscarVariante(producto, item.talla, item.color);

          if (!variante) {
            throw crearError(
              `No se encontró la variante para devolver el inventario de ${producto.nombre}.`,
              409
            );
          }

          variante.stock += item.cantidad;
          await producto.save({ session });
        }

        pedido.inventarioActualizado = false;
      }

      pedido.estado = "cancelado";
      await pedido.save({ session });
      pedidoId = pedido._id;
    });

    return obtenerPedidoPorId(pedidoId);
  } finally {
    await session.endSession();
  }
}

export async function actualizarEstadoPedido(id, estado) {
  const pedido = await Pedido.findById(id);

  if (!pedido) {
    return null;
  }

  if (estado === "cancelado") {
    throw crearError(
      "Usa la ruta de cancelar pedido para devolver el inventario.",
      400
    );
  }

  if (["entregado", "cancelado"].includes(pedido.estado)) {
    throw crearError(
      `No se puede cambiar el estado de un pedido ${pedido.estado}.`,
      409
    );
  }

  pedido.estado = estado;
  await pedido.save();

  return obtenerPedidoPorId(id);
}