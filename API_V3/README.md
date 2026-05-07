# 🚀 SmartOps_Api_V3

SmartOps_Api_V3 es una API multi-tenant desarrollada en Node.js y Express, diseñada para gestionar operaciones empresariales como usuarios, roles, pagos, perfiles, suscripciones, planes y módulos de inventario, productos, órdenes y ecommerce. Utiliza MongoDB como base de datos y está preparada para entornos SaaS multi-tenant.

---

## ✨ Características principales
- 🏢 Arquitectura multi-tenant (cada tenant puede tener su propio espacio de datos)
- 🔐 Autenticación y autorización con JWT
- 👥 Gestión de usuarios y roles
- 💳 Módulos de pagos, perfiles, suscripciones y planes
- 📦 Módulos adicionales: productos, inventario, órdenes y ecommerce
- 📄 Documentación automática de la API con Swagger
- 🛡️ Seguridad con Helmet y CORS configurado
- 📋 Logging avanzado con Winston y Morgan

## 🗂️ Estructura del proyecto

```
SmartOps_Api_V3/
│
├── package.json           # Dependencias y scripts
├── src/
│   ├── app.js             # Punto de entrada principal de la API
│   ├── config/            # Configuración de base de datos, servidor y Swagger
│   ├── core/              # Módulos principales: auth, tenants, pagos, perfiles, suscripciones, planes
│   ├── features/          # Módulos adicionales: productos, inventario, órdenes, ecommerce
│   ├── shared/            # Middlewares, logger, manejo de errores y utilidades compartidas
│   ├── uploads/           # Carpeta para archivos subidos
│   ├── migrations/        # Migraciones de base de datos
│   └── scripts/           # Scripts de utilidad y mantenimiento
├── uploads/               # Archivos subidos (persistencia fuera de src)
├── logs/                  # Archivos de logs
└── README.md              # Este archivo
```

## ⚙️ Instalación

1. Clona el repositorio:
   ```bash
   git clone <url-del-repo>
   cd SmartOps_Api_V3
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:
   ```env
   NODE_ENV=development
   PORT=3000
   MONGO_URI=mongodb://localhost:27017/smartops
   JWT_SECRET=tu_clave_secreta
   ```

## ▶️ Ejecución

- En desarrollo (con recarga automática):
  ```bash
  npm run dev
  ```
- En producción:
  ```bash
  npm start
  ```

La API estará disponible en `http://localhost:3000` (o el puerto que definas).

## 📚 Documentación de la API

La documentación interactiva de la API está disponible en:
```
http://localhost:3000/api-docs
```

## 🛣️ Principales módulos y rutas

- `/api/tenants`         → 🏢 Gestión de tenants (multi-tenant)
- `/api/auth`            → 🔐 Autenticación y usuarios
- `/api/payments`        → 💳 Pagos y métodos de pago
- `/api/profiles`        → 👤 Perfiles de usuario
- `/api/subscriptions`   → 📅 Suscripciones
- `/api/plans`           → 📝 Planes de servicio
- `/api/products`        → 📦 Productos (feature)
- `/api/inventory`       → 🏬 Inventario (feature)
- `/api/orders`          → 🧾 Órdenes (feature)
- `/api/cart`            → 🛒 Carrito de compras (feature)
- `/api/checkout`        → 💸 Checkout de ecommerce (feature)

## 🛠️ Ejemplos de uso

### 🔐 Autenticación (Login)
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "usuario1",
    "password": "tu_password"
  }'
```
Respuesta esperada:
```json
{
  "token": "<JWT_TOKEN>",
  "user": { "_id": "...", "username": "usuario1", ... }
}
```

### 📦 Obtener productos
```bash
curl -X GET http://localhost:3000/api/products \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### 📦 Crear un producto
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Producto de ejemplo",
    "price": 19.99,
    "currency": "USD",
    "features": ["Característica 1", "Característica 2"],
    "description": "Descripción del producto"
  }'
```

### 🛒 Agregar producto al carrito
```bash
curl -X POST http://localhost:3000/api/cart/items \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "<ID_DEL_PRODUCTO>",
    "quantity": 2
  }'
```

## 🛡️ Seguridad
- Helmet para cabeceras seguras
- CORS configurado para entornos de desarrollo y producción
- Autenticación JWT en rutas protegidas

## 🤝 Contribuir
1. Haz un fork del repositorio
2. Crea una rama para tu feature/fix: `git checkout -b mi-feature`
3. Realiza tus cambios y haz commit: `git commit -m 'Agrega mi feature'`
4. Haz push a tu rama: `git push origin mi-feature`
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la licencia ISC. 