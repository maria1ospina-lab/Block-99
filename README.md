# BLOCK 99

Tienda virtual de ropa urbana desarrollada con React, Node.js, Express y MongoDB Atlas.

## Estructura

- backend: API REST, módulos de productos y categorías, autenticación administrativa.
- frontend: interfaz React para el acceso administrativo.
- La base de este proyecto se llama block99 y la API usa el puerto 3001.

## Backend

Desde backend, ejecuta npm install y npm run dev.

Rutas principales:
- GET /api/health
- POST /api/auth/login
- GET /api/productos/show
- POST /api/productos/store (requiere token Bearer)
- GET /api/categorias/show
- POST /api/categorias/store (requiere token Bearer)

Las operaciones de escritura requieren sesión. Eliminar productos y categorías los desactiva para conservar el historial.

## Frontend

Desde frontend, ejecuta npm install y npm run dev.

## Acceso de demostración

El correo y la contraseña están en backend/.env. No publiques ese archivo. El .gitignore excluye .env y node_modules.
