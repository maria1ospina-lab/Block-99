import Producto from "./productos.model.js";

export async function listarProductos(filtros = {}) {
  const consulta = { activo: true };

  if (filtros.categoria) {
    consulta.categoria = filtros.categoria;
  }

  if (filtros.busqueda) {
    consulta.nombre = {
      $regex: filtros.busqueda,
      $options: "i"
    };
  }

  return Producto.find(consulta).sort({ createdAt: -1 });
}

export async function obtenerProductoPorId(id) {
  return Producto.findOne({ _id: id, activo: true });
}

export async function crearProducto(datos) {
  return Producto.create(datos);
}

export async function actualizarProducto(id, datos) {
  return Producto.findOneAndUpdate(
    { _id: id, activo: true },
    datos,
    { returnDocument: "after", runValidators: true }
  );
}

export async function desactivarProducto(id) {
  return Producto.findOneAndUpdate(
    { _id: id, activo: true },
    { activo: false },
    { returnDocument: "after" }
  );
}
