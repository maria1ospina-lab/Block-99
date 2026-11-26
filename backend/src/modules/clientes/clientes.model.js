import mongoose from "mongoose";

const clienteSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80
    },

    apellido: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80
    },

    correo: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 120,
      unique: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },

    telefono: {
      type: String,
      trim: true,
      maxlength: 20,
      default: ""
    },

    direccion: {
      type: String,
      trim: true,
      maxlength: 200,
      default: ""
    },

    activo: {
      type: Boolean,
      default: true
    }
  },
  
  { timestamps: true, versionKey: false }
);

export default mongoose.model("Cliente", clienteSchema, "clientes");