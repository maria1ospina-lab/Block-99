import jwt from "jsonwebtoken";
import { createHash, timingSafeEqual } from "node:crypto";

function compararSeguro(valor, esperado) {
  const hashValor = createHash("sha256").update(valor).digest();
  const hashEsperado = createHash("sha256").update(esperado).digest();
  return timingSafeEqual(hashValor, hashEsperado);
}

export async function iniciarSesion(req, res) {
  const correo = req.body?.correo?.trim().toLowerCase();
  const password = req.body?.password;

  if (!correo || typeof password !== "string" || !password) {
    return res.status(400).json({
      success: false,
      message: "Envía correo y contraseña."
    });
  }

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  const jwtSecret = process.env.JWT_SECRET;

  if (!adminEmail || !adminPassword || !jwtSecret) {
    return res.status(500).json({
      success: false,
      message: "Falta configurar las credenciales administrativas en .env."
    });
  }

  const correoValido = correo === adminEmail;
  const passwordValido = compararSeguro(password, adminPassword);

  if (!correoValido || !passwordValido) {
    return res.status(401).json({
      success: false,
      message: "Correo o contraseña incorrectos."
    });
  }

  const token = jwt.sign(
    { sub: adminEmail, rol: "admin" },
    jwtSecret,
    { expiresIn: "8h" }
  );

  return res.status(200).json({
    success: true,
    message: "Inicio de sesión correcto.",
    data: {
      correo: adminEmail,
      token,
      venceEn: "8h"
    }
  });
}
