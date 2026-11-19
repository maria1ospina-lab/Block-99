import Categoria from "./categorias.model.js";

export async function listarCategorias() {
  return Categoria.find({ activo: true }).sort({ nombre: 1 });
}

export async function obtenerCategoriaPorId(id) {
  return Categoria.findOne({ _id: id, activo: true });
}

export async function crearCategoria(datos) {
  return Categoria.create(datos);
}

export async function actualizarCategoria(id, datos) {
  return Categoria.findOneAndUpdate(
    { _id: id, activo: true },
    datos,
    { returnDocument: "after", runValidators: true }
  );
}

export async function desactivarCategoria(id) {
  return Categoria.findOneAndUpdate(
    { _id: id, activo: true },
    { activo: false },
    { returnDocument: "after" }
  );
}
