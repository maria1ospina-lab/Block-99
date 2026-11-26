import Cliente from "./clientes.model.js";

export async function listarClientes(filtros = {}) {
  const consulta = { activo: true };

  if (filtros.busqueda) {
    consulta.$or = [
      { nombre: { $regex: filtros.busqueda, $options: "i" } },
      { apellido: { $regex: filtros.busqueda, $options: "i" } },
      { correo: { $regex: filtros.busqueda, $options: "i" } }
    ];
  }

  return Cliente.find(consulta).sort({ createdAt: -1 });
}

export async function obtenerClientePorId(id) {
  return Cliente.findOne({ _id: id, activo: true });
}

export async function crearCliente(datos) {
  return Cliente.create(datos);
}

export async function actualizarCliente(id, datos) {
  return Cliente.findOneAndUpdate(
    { _id: id, activo: true },
    datos,
    { returnDocument: "after", runValidators: true }
  );
}

export async function desactivarCliente(id) {
  return Cliente.findOneAndUpdate(
    { _id: id, activo: true },
    { activo: false },
    { returnDocument: "after" }
  );
}