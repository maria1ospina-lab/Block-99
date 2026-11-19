import mongoose from "mongoose";

const varianteSchema = new mongoose.Schema(
  {
    talla: { type: String, required: true, trim: true },
    color: { type: String, required: true, trim: true },
    stock: { type: Number, required: true, min: 0, default: 0 }
  },
  { _id: false }
);

const productoSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    descripcion: { type: String, required: true, trim: true, maxlength: 1000 },
    categoria: { type: String, required: true, trim: true },
    precio: { type: Number, required: true, min: 0 },
    imagen: { type: String, trim: true, default: "" },
    estilo: { type: String, trim: true, default: "Urbano" },
    variantes: { type: [varianteSchema], default: [] },
    activo: { type: Boolean, default: true }
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.model("Producto", productoSchema, "productos");
