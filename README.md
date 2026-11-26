# BLOCK 99

Tienda urbana con panel administrativo. El proyecto usa React/Vite para el frontend, Node.js/Express para la API y MongoDB Atlas para guardar los datos.

## Carpetas principales

- `backend/src/auth`: login de administrador y generación/verificación del token.
- `backend/src/modules/productos`: catálogo, variantes e imágenes.
- `backend/src/modules/categorias`: categorías de ropa.
- `backend/src/modules/clientes`: datos de clientes.
- `backend/src/modules/pedidos`: pedidos y estados.
- `backend/uploads/productos`: imágenes WebP que carga el panel.
- `frontend/src`: panel React.
- `frontend/public/images`: imágenes agregadas manualmente al frontend.

## Requisitos

Instala Node.js 20.9 o superior. El backend de imágenes usa Sharp para convertir archivos a WebP.

## Configurar y ejecutar

1. En `backend`, crea `.env` tomando como referencia `.env.example` y configura `PORT`, `MONGO_URI`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` y `JWT_SECRET`.
2. Instala dependencias en `backend` y ejecuta `npm run dev`.
3. En otra terminal, instala dependencias en `frontend` y ejecuta `npm run dev`.
4. Abre la dirección de Vite que aparece en la terminal, normalmente `http://localhost:5173`.
5. La API corre en `http://localhost:3001`; su comprobación es `http://localhost:3001/api/health`.

No subas `.env` a GitHub. Cada integrante crea su propio archivo local con sus credenciales de Atlas. El backend y el frontend deben correr en el mismo computador para que la dirección `localhost` funcione tal como está configurada.

## Funciones implementadas

- Login administrativo con token JWT.
- La administración de clientes y pedidos requiere autenticación. La ruta pública `POST /api/pedidos/public` recibe los datos del comprador y los productos, calcula el total con los precios de MongoDB y descuenta el inventario.
- El pedido público requiere correo del comprador. Las rutas `GET /api/pedidos/show`, `GET /api/pedidos/info/:id`, `POST /api/pedidos/store`, `PATCH /api/pedidos/estado/:id` y `PATCH /api/pedidos/cancel/:id` son administrativas y requieren token.
- El backend valida los pedidos con los datos de MongoDB, calcula el total desde el precio del producto y descuenta existencias de la talla y color solicitados. Al cancelar, devuelve el inventario dentro de una transacción.
- Panel de productos para registrar nombre, descripción, categoría, precio, estilo, variantes, stock e imagen.
- Carga de PNG, JPG o WebP en `POST /api/imagenes/webp`; requiere token y campo `imagen` de tipo archivo. El backend limita el archivo a 8 MB, convierte a WebP y guarda la salida en `backend/uploads/productos`.

El panel guarda en MongoDB la ruta de imagen devuelta por la API. La imagen en sí se guarda como archivo, no dentro del documento MongoDB.

## Agregar imágenes manualmente

- Para una imagen que ya está optimizada, colócala en `frontend/public/images/` y escribe en el formulario una ruta como `/images/buzo-negro.webp`.
- Para convertir PNG/JPG a WebP, selecciona el archivo desde el campo de carga del panel. El backend lo convierte y lo guarda en `backend/uploads/productos`.
- Si agregas archivos manualmente a `backend/uploads/productos`, registra la ruta `/uploads/productos/nombre.webp` en el campo de imagen. Las imágenes que quieras compartir con el compañero deben incluirse en el commit del repositorio.

## MongoDB

Mongoose usa las colecciones `productos`, `categorias`, `clientes` y `pedidos`. MongoDB puede crear cada colección cuando se inserta el primer documento. El campo `imagen` de un producto contiene una ruta, no los bytes de la foto.

## Postman

La colección organizada en Postman sirve para enviar solicitudes a la API, pero por sí sola no inicia el backend ni controla el login de la página. Para compartir las solicitudes con el repositorio, exporta la colección como JSON a una carpeta `postman/` y no incluyas contraseñas ni tokens. Debe tener solicitudes para health, login, productos, categorías, clientes, pedidos e imágenes WebP.

## Pendientes recomendados

- Exportar la colección de Postman al repositorio y completar sus solicitudes de clientes, pedidos e imágenes.
- Añadir formularios del panel para editar productos/categorías, gestionar clientes y consultar pedidos.
- Completar las reglas de negocio de pedidos: verificar que cliente/productos existan, calcular precios desde MongoDB y ajustar stock al crear o cancelar pedidos.
- Revisar expiración de sesión, errores y datos de prueba antes de la entrega.


