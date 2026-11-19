import jwt from "jsonwebtoken";

export function verificarToken(req, res, next) {
  const autorizacion = req.headers.authorization ?? "";
  const [tipo, token] = autorizacion.split(" ");

  if (tipo !== "Bearer" || !token) {
    return res.status(401).json({
      success: false,
      message: "Debes iniciar sesión para realizar esta acción."
    });
  }

  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "La sesión venció o el token no es válido."
    });
  }
}
