import { useEffect, useMemo, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
const API_ORIGIN = API.replace(/\/api\/?$/, "");
const CART_KEY = "block99_cart";
const COP = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

function imageUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return path.startsWith("/uploads/") ? API_ORIGIN + path : path;
}

function ProductImage({ product }) {
  return product.imagen
    ? <img src={imageUrl(product.imagen)} alt={product.nombre} />
    : <div className="store-image-placeholder">BLOCK 99</div>;
}

function readCart() {
  try {
    const cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    return Array.isArray(cart) ? cart : [];
  } catch {
    return [];
  }
}

function useCart() {
  const [items, setItems] = useState(readCart);
  useEffect(() => { localStorage.setItem(CART_KEY, JSON.stringify(items)); }, [items]);
  return [items, setItems];
}

function addItem(items, product, variant, quantity) {
  const key = product._id + "|" + variant.talla + "|" + variant.color;
  const found = items.find((item) => item.key === key);
  if (found) {
    return items.map((item) => item.key === key
      ? { ...item, quantity: Math.min(item.quantity + quantity, item.stock) }
      : item);
  }
  return [...items, {
    key, productId: product._id, name: product.nombre,
    image: product.imagen || "", price: Number(product.precio),
    size: variant.talla, color: variant.color, stock: Number(variant.stock),
    quantity: Math.min(quantity, Number(variant.stock))
  }];
}

function CartButton({ count, open }) {
  return <button className="cart-open-button" type="button" onClick={open} aria-label={"Abrir bolsa, " + count + " prendas"}>BOLSA <span>{count}</span></button>;
}

function CartDrawer({ open, close, items, setItems }) {
  const [buyer, setBuyer] = useState({ nombre: "", apellido: "", correo: "", telefono: "", direccion: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState(null);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  if (!open) return null;

  function quantity(key, value) {
    setItems((current) => current.map((item) => item.key === key
      ? { ...item, quantity: Math.max(1, Math.min(Number(value), item.stock)) }
      : item));
  }

  async function checkout(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch(API + "/pedidos/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente: buyer,
          productos: items.map((item) => ({
            producto: item.productId, talla: item.size, color: item.color, cantidad: item.quantity
          }))
        })
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "No se pudo registrar el pedido.");
      setOrder(result.data);
      setItems([]);
      localStorage.removeItem(CART_KEY);
    } catch (err) {
      setError(err.message || "No se pudo conectar con la tienda.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="cart-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
      <aside className="cart-drawer" role="dialog" aria-modal="true" aria-label="Bolsa de compras">
        <div className="cart-heading">
          <div><p className="eyebrow">BLOCK 99</p><h2>Tu bolsa <span>({count})</span></h2></div>
          <button className="cart-close" type="button" onClick={close} aria-label="Cerrar">×</button>
        </div>
        {order ? (
          <div className="order-success">
            <p className="eyebrow">PEDIDO REGISTRADO</p><h3>¡Gracias por tu compra!</h3>
            <p>Tu pedido quedó pendiente de confirmación.</p>
            <p className="order-number">Número de pedido: {order._id}</p>
            <strong>{COP.format(order.total)}</strong>
            <button className="checkout-button" type="button" onClick={() => { setOrder(null); close(); }}>SEGUIR COMPRANDO</button>
          </div>
        ) : items.length === 0 ? (
          <div className="cart-empty"><span>＋</span><h3>Tu bolsa está vacía</h3><p>Explora la colección y encuentra tu próxima prenda.</p><a className="checkout-button" href="/tienda">VER COLECCIÓN</a></div>
        ) : (
          <>
            <div className="cart-items">
              {items.map((item) => (
                <article className="cart-item" key={item.key}>
                  <div className="cart-item-image">{item.image ? <img src={imageUrl(item.image)} alt={item.name} /> : <span>BLOCK 99</span>}</div>
                  <div className="cart-item-info">
                    <h3>{item.name}</h3><p>Talla {item.size} · {item.color}</p>
                    <strong>{COP.format(item.price)}</strong>
                    <div className="cart-item-controls">
                      <div className="quantity-control">
                        <button type="button" onClick={() => quantity(item.key, item.quantity - 1)} aria-label="Restar">−</button>
                        <span>{item.quantity}</span>
                        <button type="button" onClick={() => quantity(item.key, item.quantity + 1)} disabled={item.quantity >= item.stock} aria-label="Sumar">+</button>
                      </div>
                      <button className="cart-remove" type="button" onClick={() => setItems((current) => current.filter((entry) => entry.key !== item.key))}>Quitar</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <div className="cart-summary"><span>Subtotal</span><strong>{COP.format(total)}</strong><small>El envío se coordina al confirmar el pedido.</small></div>
            <form className="checkout-form" onSubmit={checkout}>
              <h3>Datos de compra</h3>
              <div className="checkout-fields">
                <label>Nombre *<input required minLength="2" maxLength="80" value={buyer.nombre} onChange={(e) => setBuyer({ ...buyer, nombre: e.target.value })} /></label>
                <label>Apellido *<input required minLength="2" maxLength="80" value={buyer.apellido} onChange={(e) => setBuyer({ ...buyer, apellido: e.target.value })} /></label>
                <label className="checkout-wide">Correo electrónico *<input required type="email" value={buyer.correo} onChange={(e) => setBuyer({ ...buyer, correo: e.target.value })} /></label>
                <label>Teléfono<input type="tel" maxLength="20" value={buyer.telefono} onChange={(e) => setBuyer({ ...buyer, telefono: e.target.value })} /></label>
                <label className="checkout-wide">Dirección<input maxLength="200" value={buyer.direccion} onChange={(e) => setBuyer({ ...buyer, direccion: e.target.value })} /></label>
              </div>
              <p className="checkout-note">El correo se solicita para registrar la compra. El pago y el envío se coordinan después.</p>
              {error && <p className="store-message" role="alert">{error}</p>}
              <button className="checkout-button" disabled={busy} type="submit">{busy ? "REGISTRANDO…" : "CONFIRMAR PEDIDO · " + COP.format(total)}</button>
            </form>
          </>
        )}
      </aside>
    </div>
  );
}

function StoreHeader({ count, open, search = "", onSearch }) {
  return (
    <header className="store-header store-main-header">
      <a className="store-logo" href="/tienda" aria-label="BLOCK 99, inicio"><img src="/images/block99-logo.png" alt="BLOCK 99" /></a>
      <nav className="store-main-nav">
        <a href="/tienda">INICIO</a><a href="/tienda/productos">PRODUCTOS</a><a href="/tienda/productos">CATEGORÍAS</a>
      </nav>
      {onSearch
        ? <label className="store-search"><span>⌕</span><input type="search" placeholder="Buscar prendas" aria-label="Buscar prendas" value={search} onChange={(event) => onSearch(event.target.value)} /></label>
        : <span className="store-header-spacer" />}
      <CartButton count={count} open={open} />
    </header>
  );
}

function ProductCard({ product }) {
  return (
    <a className="store-product-card" href={"/producto/" + product._id} key={product._id}>
      <div className="store-product-image">
        {product.imagen ? <img src={imageUrl(product.imagen)} alt={product.nombre} /> : <div className="store-image-placeholder">BLOCK 99</div>}
        <span>{product.categoria}</span><b className="product-view-label">VER PRENDA ↗</b>
      </div>
      <div className="store-product-meta"><div><small>{product.estilo || "URBANO"}</small><h3>{product.nombre}</h3></div><strong>{COP.format(product.precio)}</strong></div>
    </a>
  );
}

export function PublicStore() {
  const catalogo = window.location.pathname.replace(/\/$/, "") === "/tienda/productos";
  const queryCategoria = new URLSearchParams(window.location.search).get("categoria");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState(queryCategoria || "Todas");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("recent");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [maxPrice, setMaxPrice] = useState(500000);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cart, setCart] = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const pageSize = 12;

  useEffect(() => {
    Promise.all([
      fetch(API + "/productos/show").then((r) => r.json()),
      fetch(API + "/categorias/show").then((r) => r.json()).catch(() => ({ data: [] }))
    ]).then(([p, c]) => {
      if (!p.success) throw new Error(p.message || "No se pudo cargar la colección.");
      setProducts(p.data || []);
      setCategories(c.data || []);
    }).catch((err) => setError(err.message || "No pudimos cargar los productos."))
      .finally(() => setLoading(false));
  }, []);

  const sizes = useMemo(() => [...new Set(products.flatMap((p) => p.variantes?.map((v) => v.talla) || []))].sort(), [products]);
  const colors = useMemo(() => [...new Set(products.flatMap((p) => p.variantes?.map((v) => v.color) || []))].sort(), [products]);
  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      const text = (p.nombre + " " + p.descripcion + " " + p.categoria).toLowerCase();
      const hasVariant = (variantSize, variantColor) => (p.variantes || []).some((v) =>
        (!size || v.talla === size) && (!color || v.color === color) &&
        (!variantSize || v.talla === variantSize) && (!variantColor || v.color === variantColor)
      );
      return (category === "Todas" || p.categoria === category) &&
        text.includes(search.trim().toLowerCase()) &&
        Number(p.precio) <= maxPrice &&
        (!size || hasVariant(size, "")) &&
        (!color || hasVariant("", color));
    });
    if (sort === "low") list = [...list].sort((a, b) => a.precio - b.precio);
    if (sort === "high") list = [...list].sort((a, b) => b.precio - a.precio);
    if (sort === "name") list = [...list].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    return list;
  }, [products, category, search, sort, size, color, maxPrice]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);

  function clearFilters() { setCategory("Todas"); setSize(""); setColor(""); setMaxPrice(500000); setSearch(""); setPage(1); }
  const collectionProducts = visible;

  return (
    <main className="store-page">
      <StoreHeader count={count} open={() => setCartOpen(true)} search={search} onSearch={(value) => { setSearch(value); setPage(1); }} />
      {catalogo && <nav className="store-category-nav" id="categorias" aria-label="Categorías">
        <a href="/tienda/productos" className={category === "Todas" ? "category-nav-link selected" : "category-nav-link"}>TODAS</a>
        {categories.map((item) => <a key={item._id} href={"/tienda/productos?categoria=" + encodeURIComponent(item.nombre)} className={category === item.nombre ? "category-nav-link selected" : "category-nav-link"}>{item.nombre.toUpperCase()}</a>)}
      </nav>}

      {!catalogo && <>
        <section className="store-hero">
          <div className="store-hero-copy"><p className="eyebrow">NUEVA COLECCIÓN · BLOCK 99</p><h1>Tu estilo.<br /><span>Tus reglas.</span></h1><p>Ropa urbana para quienes crean su propio camino.</p><a className="store-cta" href="/tienda/productos">EXPLORAR COLECCIÓN <span>→</span></a></div>
          <div className="store-hero-gallery">
            <div className="hero-brand-panel">
              <img src="/images/block99-logo.png" alt="Logo BLOCK 99" />
            </div>
          </div>
        </section>
        <div className="store-perks"><span>✦ ENVÍOS COORDINADOS</span><span>✦ COMPRA SEGURA</span><span>✦ ESTILO URBANO</span><span>✦ PEREIRA / COLOMBIA</span></div>

        <section className="store-category-section" id="coleccion">
          <div className="store-section-heading">
            <div><p className="eyebrow">CATÁLOGO BLOCK 99</p><h2>Todas las prendas</h2></div>
            <a className="store-text-link" href="/tienda/productos">VER CATÁLOGO COMPLETO ↗</a>
          </div>
          {error && <p className="store-message" role="alert">{error}</p>}
          {loading && <p className="store-message">Cargando prendas…</p>}
          {!loading && !error && products.length === 0 && <p className="store-message">Todavía no hay prendas activas. Agrégalas desde el panel de administración.</p>}
          {!loading && !error && products.length > 0 && (
            <div className="store-grid">{products.map((product) => <ProductCard product={product} key={product._id} />)}</div>
          )}
        </section>

      </>}

      {catalogo && <section className="catalog-page">
        <p className="store-breadcrumb"><a href="/tienda">Inicio</a> / Productos</p>
        <div className="catalog-heading"><div><p className="eyebrow">BLOCK 99 · CATÁLOGO</p><h1>Productos</h1></div><label>Ordenar por <select value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }}><option value="recent">Más recientes</option><option value="low">Precio: menor a mayor</option><option value="high">Precio: mayor a menor</option><option value="name">Nombre</option></select></label></div>
        <div className="store-catalog-layout">
          <aside className="store-filter-sidebar">
            <div className="filter-title"><h2>Filtros</h2><button onClick={clearFilters}>Limpiar</button></div>
            <fieldset><legend>Categoría</legend><label className="filter-option"><input type="radio" name="category" checked={category === "Todas"} onChange={() => { setCategory("Todas"); setPage(1); }} />Todas</label>{categories.map((item) => <label className="filter-option" key={item._id}><input type="radio" name="category" checked={category === item.nombre} onChange={() => { setCategory(item.nombre); setPage(1); }} />{item.nombre}</label>)}</fieldset>
            <fieldset><legend>Talla</legend>{sizes.length ? sizes.map((item) => <label className="filter-option" key={item}><input type="radio" name="size" checked={size === item} onChange={() => { setSize(size === item ? "" : item); setPage(1); }} />{item}</label>) : <small>Las tallas aparecerán con los productos.</small>}</fieldset>
            <fieldset><legend>Color</legend>{colors.length ? colors.map((item) => <label className="filter-option" key={item}><input type="radio" name="color" checked={color === item} onChange={() => { setColor(color === item ? "" : item); setPage(1); }} />{item}</label>) : <small>Los colores aparecerán con los productos.</small>}</fieldset>
            <fieldset><legend>Precio máximo</legend><input className="price-filter" type="range" min="0" max="500000" step="10000" value={maxPrice} onChange={(event) => { setMaxPrice(Number(event.target.value)); setPage(1); }} /><div className="price-range-label"><span>$0</span><b>{COP.format(maxPrice)}</b></div></fieldset>
          </aside>
          <div className="catalog-results">
            <div className="collection-tools"><span>{filtered.length} PRENDA{filtered.length === 1 ? "" : "S"}</span><span>{category === "Todas" ? "Toda la colección" : category}</span></div>
            {error && <p className="store-message" role="alert">{error}</p>}
            {loading && <p className="store-message">Cargando prendas…</p>}
            {!loading && !error && filtered.length === 0 && <p className="store-message">No encontramos prendas con esos filtros.</p>}
            {!loading && !error && filtered.length > 0 && <div className="store-grid">{collectionProducts.map((product) => <ProductCard product={product} key={product._id} />)}</div>}
            {pages > 1 && <nav className="store-pagination"><button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>← ANTERIOR</button><span>PÁGINA {page} DE {pages}</span><button onClick={() => setPage(Math.min(pages, page + 1))} disabled={page === pages}>SIGUIENTE →</button></nav>}
          </div>
        </div>
      </section>}
      <footer className="store-footer"><span>BLOCK 99 · PEREIRA, COLOMBIA</span><span>EST. 2026</span></footer>
      <CartDrawer open={cartOpen} close={() => setCartOpen(false)} items={cart} setItems={setCart} />
    </main>
  );
}
export function PublicProductDetail({ id }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [variantIndex, setVariantIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    fetch(API + "/productos/info/" + id).then(async (r) => {
      const result = await r.json();
      if (!r.ok || !result.success) throw new Error("No encontramos esta prenda.");
      setProduct(result.data);
    }).catch((err) => setError(err.message || "No pudimos cargar la prenda."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <main className="detail-page"><p className="store-message">Cargando prenda…</p></main>;
  if (error || !product) return <main className="detail-page"><a className="back-to-store" href="/tienda">← Volver a la tienda</a><p className="store-message">{error}</p></main>;

  const variants = product.variantes || [];
  const variant = variants[variantIndex] || variants[0];
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);

  function addToCart() {
    if (!variant || variant.stock < 1) return;
    setCart((current) => addItem(current, product, variant, quantity));
    setNotice("Agregada a tu bolsa.");
    setCartOpen(true);
  }

  return (
    <main className="detail-page">
      <StoreHeader count={count} open={() => setCartOpen(true)} />
      <div className="detail-breadcrumb"><a href="/tienda">Inicio</a> / {product.categoria} / {product.nombre}</div>
      <section className="detail-layout">
        <div className="detail-image"><ProductImage product={product} /></div>
        <div className="detail-copy"><p className="eyebrow">{product.categoria} · {product.estilo || "URBANO"}</p><h1>{product.nombre}</h1><strong className="detail-price">{COP.format(product.precio)}</strong>
          <div className="detail-divider" /><h2>Descripción</h2><p className="detail-description">{product.descripcion}</p>
          {variants.length > 0 && <div className="detail-variants"><label htmlFor="variant">Elige talla y color</label>
            <select id="variant" value={variantIndex} onChange={(e) => { setVariantIndex(Number(e.target.value)); setQuantity(1); }}>
              {variants.map((item, index) => <option key={index} value={index} disabled={Number(item.stock) < 1}>{item.talla} · {item.color}{Number(item.stock) < 1 ? " · Agotado" : " · " + item.stock + " disponibles"}</option>)}
            </select>
            {variant && Number(variant.stock) > 0 && <div className="detail-buy-row"><div className="quantity-control"><button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button><span>{quantity}</span><button type="button" disabled={quantity >= variant.stock} onClick={() => setQuantity(Math.min(variant.stock, quantity + 1))}>+</button></div><span>{variant.stock} DISPONIBLES</span></div>}
          </div>}
          {notice && <p className="cart-added-message">{notice}</p>}
          <button className="store-cta add-cart-button" type="button" disabled={!variant || Number(variant.stock) < 1} onClick={addToCart}>AÑADIR A LA BOLSA <span>↗</span></button>
        </div>
      </section>
      <footer className="store-footer"><span>BLOCK 99 · PEREIRA, COLOMBIA</span><span>EST. 2026</span></footer>
      <CartDrawer open={cartOpen} close={() => setCartOpen(false)} items={cart} setItems={setCart} />
    </main>
  );
}



