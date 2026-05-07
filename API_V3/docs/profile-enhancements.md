# Mejoras en la Gestión de Perfiles

## Nuevas Funcionalidades Implementadas

### 1. Gestión de Colores del Perfil

#### Actualizar Colores
```http
PUT /api/profiles/{tenant_id}/colors
Content-Type: application/json
Authorization: Bearer {token}

{
  "primary_color": "#4f46e5",
  "secondary_color": "#7c3aed", 
  "accent_color": "#ffffff",
  "font_family": "Montserrat"
}
```

#### Obtener Colores Actuales
```http
GET /api/profiles/{tenant_id}/colors
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "theme": {
      "primary_color": "#4f46e5",
      "secondary_color": "#7c3aed",
      "accent_color": "#ffffff",
      "font_family": "Montserrat"
    },
    "profile_id": "64f8a1b2c3d4e5f6a7b8c9d0"
  }
}
```

### 2. Gestión de Información de Contacto

#### Actualizar Información de Contacto
```http
PUT /api/profiles/{tenant_id}/contact
Content-Type: application/json
Authorization: Bearer {token}

{
  "email": "contact@example.com",
  "phone": "+1234567890",
  "website": "https://example.com"
}
```

#### Obtener Información de Contacto
```http
GET /api/profiles/{tenant_id}/contact
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "contact": {
      "email": "contact@example.com",
      "phone": "+1234567890",
      "website": "https://example.com"
    },
    "profile_id": "64f8a1b2c3d4e5f6a7b8c9d0"
  }
}
```

### 3. Ordenamiento de Secciones del Perfil

#### Actualizar Orden de Secciones
```http
PUT /api/profiles/{tenant_id}/sections/order
Content-Type: application/json
Authorization: Bearer {token}

{
  "section_order": [
    "header",
    "stats", 
    "services",
    "testimonials",
    "contact",
    "social"
  ]
}
```

#### Obtener Orden Actual de Secciones
```http
GET /api/profiles/{tenant_id}/sections/order
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "section_order": [
      "header",
      "stats",
      "services", 
      "testimonials",
      "contact",
      "social"
    ],
    "profile_id": "64f8a1b2c3d4e5f6a7b8c9d0"
  }
}
```

#### Obtener Configuración Completa de Secciones
```http
GET /api/profiles/{tenant_id}/sections/config
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "tenant_features": {
      "services": true,
      "ecommerce": false,
      "appointments": true
    },
    "sections": {
      "header": {
        "id": "header",
        "name": "Encabezado",
        "description": "Información principal del perfil",
        "available": true,
        "enabled": true,
        "order": 0,
        "icon": "user",
        "category": "basic"
      },
      "stats": {
        "id": "stats",
        "name": "Estadísticas",
        "description": "Muestra tus logros y números importantes",
        "available": true,
        "enabled": true,
        "order": 1,
        "icon": "chart-bar",
        "category": "basic"
      },
      "services": {
        "id": "services",
        "name": "Servicios",
        "description": "Muestra los servicios que ofreces",
        "available": true,
        "enabled": true,
        "order": 2,
        "icon": "briefcase",
        "category": "conditional"
      }
    },
    "current_order": [
      "header",
      "stats",
      "services",
      "testimonials",
      "contact",
      "social"
    ],
    "profile_id": "64f8a1b2c3d4e5f6a7b8c9d0"
  }
}
```

## Secciones Disponibles

### Secciones Básicas (siempre disponibles)
- **header**: Encabezado del perfil
- **stats**: Estadísticas y logros
- **testimonials**: Testimonios de clientes
- **contact**: Información de contacto
- **social**: Redes sociales

### Secciones Condicionales (según features del tenant)
- **services**: Servicios (requiere feature `services`)
- **products**: Productos (requiere feature `ecommerce` o `products`)
- **appointments**: Citas (requiere feature `appointments`)

## Validaciones

### Colores
- Formato hexadecimal: `#RRGGBB`
- Ejemplos válidos: `#4f46e5`, `#7c3aed`, `#ffffff`

### Información de Contacto
- **email**: Formato de email válido
- **phone**: Cualquier formato de teléfono
- **website**: URL válida

### Orden de Secciones
- Debe ser un array de strings
- Solo secciones válidas permitidas
- No se permiten duplicados

## Códigos de Error

### 400 - Bad Request
- Colores en formato inválido
- Email en formato inválido
- URL de website inválida
- Orden de secciones inválido

### 403 - Forbidden
- Usuario sin permisos de administrador

### 404 - Not Found
- Perfil no encontrado
- Tenant no encontrado

### 500 - Internal Server Error
- Error interno del servidor

## Ejemplos de Uso

### Actualizar Solo el Color Primario
```json
{
  "primary_color": "#ff6b6b"
}
```

### Actualizar Solo el Email
```json
{
  "email": "nuevo@email.com"
}
```

### Reordenar Secciones (mover contacto al principio)
```json
{
  "section_order": [
    "header",
    "contact",
    "stats",
    "services",
    "testimonials",
    "social"
  ]
}
```

## Notas Importantes

1. **Permisos**: Todas las operaciones de escritura requieren permisos de administrador
2. **Validación**: Los colores deben estar en formato hexadecimal válido
3. **Secciones**: Solo se pueden ordenar secciones que estén habilitadas según las features del tenant
4. **Campos Opcionales**: Puedes actualizar solo los campos que necesites, no es necesario enviar todos
5. **Respuestas**: Todas las respuestas incluyen el `profile_id` para referencia
