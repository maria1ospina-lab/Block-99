import mongoose from "mongoose";

const detallePedidoSchema = new mongoose.Schema(
  {
    producto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Producto",
      required: true
    },
    nombreProducto: {
      type: String,
      required: true,
      trim: true
    },
    talla: {
      type: String,
      required: true,
      trim: true
    },
    color: {
      type: String,
      required: true,
      trim: true
    },
    cantidad: {
      type: Number,
      required: true,
      min: 1
    },
    precioUnitario: {
      type: Number,
      required: true,
      min: 0
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: false }
);

const pedidoSchema = new mongoose.Schema(
  {
    cliente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cliente",
      required: true
    },
    productos: {
      type: [detallePedidoSchema],
      validate: {
        validator: (productos) => productos.length > 0,
        message: "El pedido debe tener al menos un producto"
      }
    },
    total: {
      type: Number,
      required: true,
      min: 0
    },
    estado: {
      type: String,
      enum: ["pendiente", "pagado", "enviado", "entregado", "cancelado"],
      default: "pendiente"
    },
    inventarioActualizado: {
      type: Boolean,
      default: false
    },
    notas: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ""
    }
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.model("Pedido", pedidoSchema, "pedidos");
