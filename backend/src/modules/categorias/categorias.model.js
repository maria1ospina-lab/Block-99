import mongoose from "mongoose";

const categoriaSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 60,
      unique: true
    },
    descripcion: {
      type: String,
      trim: true,
      maxlength: 300,
      default: ""
    },
    activo: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.model("Categoria", categoriaSchema, "categorias");
