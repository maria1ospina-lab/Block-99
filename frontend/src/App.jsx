import { useEffect, useState } from "react";

const API = "http://localhost:3001/api";
const formatoPrecio = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0
});

export default function App() {
  const [correo, setCorreo] = useState("admin@block99.com");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(() => sessionStorage.getItem("block99_token") || "");
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    if (!token) return;

    async function cargarResumen() {
      setCargando(true);
      try {
        const [respuestaProductos, respuestaCategorias] = await Promise.all([
          fetch(API + "/productos/show"),
          fetch(API + "/categorias/show")
        ]);
        const resultadoProductos = await respuestaProductos.json();
        const resultadoCategorias = await respuestaCategorias.json();

        if (!respuestaProductos.ok || !resultadoProductos.success) {
          throw new Error("No se pudo cargar el catálogo");
        }

        setProductos(resultadoProductos.data || []);
        setCategorias(resultadoCategorias.data || []);
      } catch {
        setMensaje("Sesión iniciada. No se pudo cargar el resumen de datos.");
      } finally {
        setCargando(false);
      }
    }

    cargarResumen();
  }, [token]);

  async function iniciarSesion(evento) {
    evento.preventDefault();
    setError("");
    setCargando(true);

    try {
      const respuesta = await fetch(API + "/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, password })
      });
      const resultado = await respuesta.json();

      if (!respuesta.ok || !resultado.success) {
        throw new Error(resultado.message || "No se pudo iniciar sesión");
      }

      sessionStorage.setItem("block99_token", resultado.data.token);
      setToken(resultado.data.token);
      setPassword("");
    } catch (err) {
      setError(err.message || "No se pudo conectar con el servidor");
    } finally {
      setCargando(false);
    }
  }

  function cerrarSesion() {
    sessionStorage.removeItem("block99_token");
    setToken("");
    setProductos([]);
    setCategorias([]);
    setMensaje("");
  }

  if (token) {
    return (
      <main className="admin-shell">
        <aside className="sidebar">
          <a className="brand" href="#panel">BLOCK<span>99</span></a>
          <p className="sidebar-label">PANEL DE CONTROL</p>
          <a className="side-link active" href="#panel">Resumen</a>
          <a className="side-link" href="#catalogo">Productos</a>
          <a className="side-link" href="#categorias">Categorías</a>
          <div className="sidebar-bottom">
            <span>ADMINISTRADOR</span>
            <button className="logout-button" onClick={cerrarSesion}>Cerrar sesión</button>
          </div>
        </aside>

        <section className="dashboard" id="panel">
          <header className="dashboard-header">
            <div>
              <p className="eyebrow">BLOCK 99 / ADMINISTRACIÓN</p>
              <h1>Resumen</h1>
            </div>
            <span className="admin-pill"><i /> Sesión activa</span>
          </header>

          {mensaje && <p className="notice">{mensaje}</p>}

          <div className="welcome-card">
            <div>
              <p className="eyebrow light">PANEL PRIVADO</p>
              <h2>Tu tienda, bajo control.</h2>
              <p>Administra el catálogo urbano de BLOCK 99 desde un solo lugar.</p>
            </div>
            <div className="welcome-mark"><span>BLOCK</span><strong>99</strong></div>
          </div>

          <div className="stats-grid">
            <article className="stat-card">
              <span>PRODUCTOS ACTIVOS</span>
              <strong>{cargando ? "…" : productos.length}</strong>
              <small>Prendas visibles en el catálogo</small>
            </article>
            <article className="stat-card">
              <span>CATEGORÍAS</span>
              <strong>{cargando ? "…" : categorias.length}</strong>
              <small>Secciones de la tienda</small>
            </article>
            <article className="stat-card dark-stat">
              <span>ESTADO DE LA API</span>
              <strong>EN LÍNEA</strong>
              <small>Conectada a MongoDB Atlas</small>
            </article>
          </div>

          <section className="catalog-section" id="catalogo">
            <div className="section-heading">
              <div>
                <p className="eyebrow">INVENTARIO</p>
                <h2>Productos recientes</h2>
              </div>
              <span className="item-count">{productos.length} PRENDAS</span>
            </div>

            {productos.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">＋</span>
                <h3>El catálogo está listo para comenzar</h3>
                <p>Cuando registres prendas desde Postman, aparecerán aquí y en MongoDB.</p>
              </div>
            ) : (
              <div className="product-grid">
                {productos.slice(0, 6).map((producto) => (
                  <article className="product-card" key={producto._id}>
                    <div className="product-image">
                      {producto.imagen ? (
                        <img src={producto.imagen} alt={producto.nombre} />
                      ) : (
                        <span>BLOCK 99</span>
                      )}
                      <small>{producto.categoria}</small>
                    </div>
                    <div className="product-info">
                      <div>
                        <span className="product-style">{producto.estilo || "URBANO"}</span>
                        <h3>{producto.nombre}</h3>
                      </div>
                      <strong>{formatoPrecio.format(producto.precio)}</strong>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="category-strip" id="categorias">
            <div>
              <p className="eyebrow">ORGANIZACIÓN</p>
              <h2>Categorías de la tienda</h2>
            </div>
            <div className="category-list">
              {categorias.length
                ? categorias.map((categoria) => (
                    <span key={categoria._id}>{categoria.nombre}</span>
                  ))
                : <span>Las categorías aparecerán aquí al registrarlas.</span>}
            </div>
          </section>

          <footer className="dashboard-footer">
            <span>BLOCK 99 · PEREIRA, COLOMBIA</span>
            <span>Proyecto académico · 2026</span>
          </footer>
        </section>
      </main>
    );
  }

  return (
    <main className="login-page">
      <section className="login-art">
        <div className="art-top"><span>BLOCK 99</span><span>EST. 2026</span></div>
        <div className="art-center">
          <p>FUERZA · ORIGINALIDAD · PERSONALIDAD</p>
          <h1>Vístete con<br />tu propia actitud.</h1>
          <div className="art-stamp"><span>BLOCK</span><strong>99</strong></div>
        </div>
        <div className="art-bottom"><span>TIENDA URBANA</span><span>PEREIRA / COLOMBIA</span></div>
      </section>

      <section className="login-side">
        <a className="mobile-brand" href="#login">BLOCK<span>99</span></a>
        <form className="login-card" id="login" onSubmit={iniciarSesion}>
          <p className="eyebrow">ÁREA PRIVADA</p>
          <h2>Bienvenido de vuelta.</h2>
          <p className="login-intro">Ingresa con tu cuenta de administrador para gestionar la tienda.</p>

          <label htmlFor="correo">Correo electrónico</label>
          <input
            id="correo"
            type="email"
            autoComplete="username"
            placeholder="admin@block99.com"
            value={correo}
            onChange={(evento) => setCorreo(evento.target.value)}
            required
          />

          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="Escribe tu contraseña"
            value={password}
            onChange={(evento) => setPassword(evento.target.value)}
            required
          />

          {error && <p className="login-error" role="alert">{error}</p>}

          <button className="login-submit" type="submit" disabled={cargando}>
            {cargando ? "VALIDANDO..." : "INICIAR SESIÓN"}
            <span>↗</span>
          </button>

          <p className="login-footnote">Acceso exclusivo para administración BLOCK 99.</p>
        </form>
        <div className="login-copyright">© 2026 BLOCK 99 · TODOS LOS DERECHOS RESERVADOS</div>
      </section>
    </main>
  );
}
