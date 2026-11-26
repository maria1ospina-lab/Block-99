import { useEffect, useState } from "react";
import { PublicProductDetail, PublicStore } from "./PublicStore.jsx";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
const API_ORIGIN = API.replace(/\/api\/?$/, "");
const varianteInicial = { talla: "M", color: "Negro", stock: "0" };
const productoInicial = {
  nombre: "",
  descripcion: "",
  categoria: "",
  precio: "",
  imagen: "",
  estilo: "Urbano"
};
const formatoPrecio = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0
});

function resolverImagen(imagen) {
  if (!imagen) return "";
  if (/^https?:\/\//i.test(imagen)) return imagen;
  if (imagen.startsWith("/uploads/")) return API_ORIGIN + imagen;
  return imagen;
}

function leerPaginaAdmin() {
  const hash = window.location.hash.replace("#", "");
  if (hash === "catalogo" || hash === "categorias") return "productos";
  return ["panel", "productos"].includes(hash) ? hash : "panel";
}
function AdminApp() {
  const [correo, setCorreo] = useState("admin@block99.com");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(() => localStorage.getItem("block99_token") || "");
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [guardandoProducto, setGuardandoProducto] = useState(false);
  const [eliminandoProducto, setEliminandoProducto] = useState("");
  const [archivoImagen, setArchivoImagen] = useState(null);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [errorProducto, setErrorProducto] = useState("");
  const [mensajeProducto, setMensajeProducto] = useState("");
  const [productoForm, setProductoForm] = useState(productoInicial);
  const [variantesForm, setVariantesForm] = useState([varianteInicial]);
  const [paginaAdmin, setPaginaAdmin] = useState(leerPaginaAdmin);

  useEffect(() => {
    const cambiarPagina = () => setPaginaAdmin(leerPaginaAdmin());
    window.addEventListener("hashchange", cambiarPagina);
    return () => window.removeEventListener("hashchange", cambiarPagina);
  }, []);

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

      localStorage.setItem("block99_token", resultado.data.token);
      setToken(resultado.data.token);
      setPassword("");
    } catch (err) {
      setError(err.message || "No se pudo conectar con el servidor");
    } finally {
      setCargando(false);
    }
  }

  function actualizarCampoProducto(evento) {
    const { name, value } = evento.target;
    setProductoForm((actual) => ({ ...actual, [name]: value }));
  }

  function actualizarVariante(indice, campo, valor) {
    setVariantesForm((actuales) =>
      actuales.map((variante, posicion) =>
        posicion === indice ? { ...variante, [campo]: valor } : variante
      )
    );
  }

  function agregarVariante() {
    setVariantesForm((actuales) => [
      ...actuales,
      { talla: "", color: "", stock: "0" }
    ]);
  }

  function quitarVariante(indice) {
    setVariantesForm((actuales) => actuales.filter((_, posicion) => posicion !== indice));
  }

  async function guardarProducto(evento) {
    evento.preventDefault();
    setErrorProducto("");
    setMensajeProducto("");
    setGuardandoProducto(true);

    try {
      let imagen = productoForm.imagen.trim();

      if (archivoImagen) {
        const formularioImagen = new FormData();
        formularioImagen.append("imagen", archivoImagen);

        const respuestaImagen = await fetch(API + "/imagenes/webp", {
          method: "POST",
          headers: { Authorization: "Bearer " + token },
          body: formularioImagen
        });
        const resultadoImagen = await respuestaImagen.json();

        if (!respuestaImagen.ok || !resultadoImagen.success) {
          throw new Error(resultadoImagen.message || "No se pudo convertir la imagen");
        }

        imagen = resultadoImagen.data.imagen;
      }

      const producto = {
        ...productoForm,
        imagen,
        precio: Number(productoForm.precio),
        variantes: variantesForm.map((variante) => ({
          talla: variante.talla.trim(),
          color: variante.color.trim(),
          stock: Number(variante.stock)
        }))
      };

      const respuesta = await fetch(API + "/productos/store", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token
        },
        body: JSON.stringify(producto)
      });
      const resultado = await respuesta.json();

      if (!respuesta.ok || !resultado.success) {
        throw new Error(resultado.message || "No se pudo guardar el producto");
      }

      setProductos((actuales) => [resultado.data, ...actuales]);
      setProductoForm(productoInicial);
      setVariantesForm([varianteInicial]);
      setArchivoImagen(null);
      setMensajeProducto("Prenda guardada correctamente.");
    } catch (err) {
      setErrorProducto(err.message || "No se pudo conectar con el servidor");
    } finally {
      setGuardandoProducto(false);
    }
  }

  async function eliminarProductoAdmin(producto) {
    if (!window.confirm("¿Retirar " + producto.nombre + " del catálogo?")) return;
    setEliminandoProducto(producto._id);
    setErrorProducto("");
    setMensajeProducto("");
    try {
      const respuesta = await fetch(API + "/productos/delete/" + producto._id, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + token }
      });
      const resultado = await respuesta.json();
      if (!respuesta.ok || !resultado.success) throw new Error(resultado.message || "No se pudo retirar la prenda.");
      setProductos((actuales) => actuales.filter((item) => item._id !== producto._id));
      setMensajeProducto("Prenda retirada del catálogo.");
    } catch (err) {
      setErrorProducto(err.message || "No se pudo conectar con el servidor.");
    } finally {
      setEliminandoProducto("");
    }
  }
  function cerrarSesion() {
    localStorage.removeItem("block99_token");
    setToken("");
    setProductos([]);
    setCategorias([]);
    setMensaje("");
    setErrorProducto("");
    setMensajeProducto("");
    setArchivoImagen(null);
  }

  if (token) {
    return (
      <main className="admin-shell">
        <aside className="sidebar">
          <a className="brand" href="#panel">BLOCK<span>99</span></a>
          <p className="sidebar-label">PANEL DE CONTROL</p>
          <a className={"side-link " + (paginaAdmin === "panel" ? "active" : "")} href="#panel">Resumen</a>
          <a className={"side-link " + (paginaAdmin === "productos" ? "active" : "")} href="#productos">Productos</a>
          <div className="sidebar-bottom">
            <span>ADMINISTRADOR</span>
            <button className="logout-button" onClick={cerrarSesion}>Cerrar sesión</button>
          </div>
        </aside>

        <section className="dashboard" id="panel">
          <header className="dashboard-header">
            <div>
              <p className="eyebrow">BLOCK 99 / ADMINISTRACIÓN</p>
              <h1>{paginaAdmin === "panel" ? "Resumen" : "Productos"}</h1>
            </div>
            <span className="admin-pill"><i /> Sesión activa</span>
          </header>

          {mensaje && <p className="notice">{mensaje}</p>}

          {paginaAdmin === "panel" && <>
          <div className="welcome-card">
            <div>
              <p className="eyebrow light">PANEL PRIVADO</p>
              <h2>Tu tienda, bajo control.</h2>
              <p>Administra el catálogo urbano de BLOCK 99 desde un solo lugar.</p>
            </div>
            <img className="welcome-logo" src="/images/block99-logo.png" alt="BLOCK 99" />
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
            </div>

                    </>}
          {paginaAdmin === "productos" && (
          <section className="catalog-section" id="catalogo">
            <div className="section-heading">
              <div>
                <p className="eyebrow">INVENTARIO</p>
                <h2>Productos recientes</h2>
              </div>
              <span className="item-count">{productos.length} PRENDAS</span>
            </div>

            <details className="product-form-disclosure">
              <summary>+ AGREGAR PRODUCTO</summary>
              <form className="product-form" onSubmit={guardarProducto}>
              <div className="form-heading">
                <div>
                  <p className="eyebrow">NUEVA PRENDA</p>
                  <h3>Agregar al inventario</h3>
                </div>
                <span>Los campos con * son obligatorios</span>
              </div>

              <div className="form-grid">
                <label>
                  Nombre *
                  <input name="nombre" value={productoForm.nombre} onChange={actualizarCampoProducto} minLength={2} maxLength={120} required placeholder="Ej. Buzo Oversize" />
                </label>
                <label>
                  Categoría *
                  <input name="categoria" list="categorias-disponibles" value={productoForm.categoria} onChange={actualizarCampoProducto} required placeholder="Ej. Buzos" />
                  <datalist id="categorias-disponibles">
                    {categorias.map((categoria) => <option key={categoria._id} value={categoria.nombre} />)}
                  </datalist>
                </label>
                <label className="field-wide">
                  Descripción *
                  <textarea name="descripcion" value={productoForm.descripcion} onChange={actualizarCampoProducto} rows={4} maxLength={1000} required placeholder="Describe la prenda, su material, corte y detalles." />
                </label>
                <label>
                  Precio en pesos colombianos *
                  <input name="precio" type="number" min="0" step="100" value={productoForm.precio} onChange={actualizarCampoProducto} required placeholder="69900" />
                </label>
                <label className="field-wide">
                  O selecciona una imagen para convertirla a WebP
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(evento) => setArchivoImagen(evento.target.files?.[0] ?? null)} />
                  <small className="form-help">PNG, JPG o WebP; máximo 8 MB. Al guardar, el backend crea la versión WebP.</small>
                </label>
              </div>

              <div className="variants-heading">
                <div>
                  <h4>Tallas, colores y stock</h4>
                  <p>Agrega una variante por cada combinación de talla y color.</p>
                </div>
                <button className="secondary-button" type="button" onClick={agregarVariante}>+ Agregar variante</button>
              </div>

              <div className="variants-list">
                {variantesForm.map((variante, indice) => (
                  <div className="variant-row" key={indice}>
                    <label>
                      Talla *
                      <input value={variante.talla} onChange={(evento) => actualizarVariante(indice, "talla", evento.target.value)} required placeholder="M" />
                    </label>
                    <label>
                      Color *
                      <input value={variante.color} onChange={(evento) => actualizarVariante(indice, "color", evento.target.value)} required placeholder="Negro" />
                    </label>
                    <label>
                      Stock *
                      <input type="number" min="0" step="1" value={variante.stock} onChange={(evento) => actualizarVariante(indice, "stock", evento.target.value)} required />
                    </label>
                    {variantesForm.length > 1 && (
                      <button className="remove-variant" type="button" onClick={() => quitarVariante(indice)} aria-label={`Quitar variante ${indice + 1}`}>Quitar</button>
                    )}
                  </div>
                ))}
              </div>

              {errorProducto && <p className="form-error" role="alert">{errorProducto}</p>}
              {mensajeProducto && <p className="form-success" role="status">{mensajeProducto}</p>}
              <button className="save-product-button" type="submit" disabled={guardandoProducto}>
                {guardandoProducto ? "GUARDANDO…" : "GUARDAR PRENDA"}
                <span>↗</span>
              </button>
            </form>
              </details>

            <div className="admin-table-wrap">
              {productos.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">＋</span>
                  <h3>Tu inventario está listo</h3>
                  <p>Selecciona “Agregar producto” para registrar la primera prenda.</p>
                </div>
              ) : (
                <table className="admin-products-table">
                  <thead><tr><th>Imagen</th><th>Nombre</th><th>Categoría</th><th>Precio</th><th>Variantes</th><th>Stock</th><th>Acciones</th></tr></thead>
                  <tbody>
                    {productos.map((producto) => (
                      <tr key={producto._id}>
                        <td data-label="Imagen"><div className="admin-table-thumb">{producto.imagen ? <img src={resolverImagen(producto.imagen)} alt={producto.nombre} /> : <span>99</span>}</div></td>
                        <td className="admin-table-name" data-label="Nombre">{producto.nombre}<small>{producto.descripcion}</small></td>
                        <td data-label="Categoría">{producto.categoria}</td>
                        <td data-label="Precio">{formatoPrecio.format(producto.precio)}</td>
                        <td data-label="Tallas y colores">{producto.variantes?.map((variante) => variante.talla + " / " + variante.color).join(", ") || "—"}</td>
                        <td data-label="Stock">{producto.variantes?.reduce((suma, variante) => suma + Number(variante.stock || 0), 0) ?? 0}</td>
                        <td data-label="Acciones"><button className="delete-product-button" type="button" onClick={() => eliminarProductoAdmin(producto)} disabled={eliminandoProducto === producto._id}>{eliminandoProducto === producto._id ? "RETIRANDO…" : "RETIRAR"}</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div></section>
          )}

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
          <a className="public-store-link" href="/tienda">Visitar tienda pública ↗</a>
        </form>
        <div className="login-copyright">© 2026 BLOCK 99 · TODOS LOS DERECHOS RESERVADOS</div>
      </section>
    </main>
  );
}

export default function App() {
  const ruta = window.location.pathname;
  const detalle = ruta.match(/^\/producto\/([a-fA-F0-9]{24})\/?$/);

  if (ruta === "/tienda" || ruta === "/tienda/" || ruta === "/tienda/productos") return <PublicStore />;
  if (detalle) return <PublicProductDetail id={detalle[1]} />;
  return <AdminApp />;
}








