# Mejoras en la Gestión de Perfiles - SmartOps API V3

## 🎯 Resumen de Mejoras

Se han implementado nuevas funcionalidades para mejorar la gestión de perfiles en SmartOps API V3:

1. **🎨 Gestión de Colores**: Permite personalizar los colores del perfil
2. **📞 Gestión de Contacto**: Actualización independiente de información de contacto
3. **📋 Ordenamiento de Secciones**: Control total sobre el orden de las secciones del perfil

## 🚀 Nuevas Rutas Implementadas

### Gestión de Colores
- `GET /api/profiles/{tenant_id}/colors` - Obtener colores actuales
- `PUT /api/profiles/{tenant_id}/colors` - Actualizar colores

### Gestión de Contacto
- `GET /api/profiles/{tenant_id}/contact` - Obtener información de contacto
- `PUT /api/profiles/{tenant_id}/contact` - Actualizar información de contacto

### Ordenamiento de Secciones
- `GET /api/profiles/{tenant_id}/sections/order` - Obtener orden actual
- `PUT /api/profiles/{tenant_id}/sections/order` - Actualizar orden
- `GET /api/profiles/{tenant_id}/sections/config` - Configuración completa

## 📋 Cambios en el Modelo

### Nuevo Campo: `section_order`
```javascript
section_order: {
  type: [String],
  default: ['header', 'stats', 'services', 'products', 'testimonials', 'contact', 'social', 'appointments'],
  validate: {
    validator: function(v) {
      const validSections = ['header', 'stats', 'services', 'products', 'testimonials', 'contact', 'social', 'appointments'];
      return v.every(section => validSections.includes(section));
    },
    message: 'Secciones inválidas en el orden'
  }
}
```

## 🔧 Nuevos Controladores

### ProfileController
- `updateProfileColors()` - Actualizar colores del perfil
- `updateContactInfo()` - Actualizar información de contacto
- `getContactInfo()` - Obtener información de contacto
- `getProfileColors()` - Obtener configuración de colores

### ProfileSectionsController
- `updateSectionOrder()` - Actualizar orden de secciones
- `getSectionOrder()` - Obtener orden actual
- `getAllSectionsConfig()` - Configuración completa de secciones

## ✅ Validaciones Implementadas

### Colores
```javascript
const updateColorsSchema = Joi.object({
  primary_color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).optional(),
  secondary_color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).optional(),
  accent_color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).optional(),
  font_family: Joi.string().optional()
}).min(1);
```

### Contacto
```javascript
const updateContactSchema = Joi.object({
  email: Joi.string().email().allow('').optional(),
  phone: Joi.string().allow('').optional(),
  website: Joi.string().uri().allow('').optional()
}).min(1);
```

### Orden de Secciones
```javascript
const sectionOrderSchema = Joi.object({
  section_order: Joi.array().items(
    Joi.string().valid('header', 'stats', 'services', 'products', 'testimonials', 'contact', 'social', 'appointments')
  ).required()
});
```

## 🧪 Pruebas

### Script de Pruebas
Se incluye un script de pruebas completo en `scripts/test-profile-enhancements.js`

```bash
# Instalar dependencias si no están instaladas
npm install axios

# Ejecutar pruebas (actualizar TENANT_ID y AUTH_TOKEN primero)
node scripts/test-profile-enhancements.js
```

### Ejemplos de Uso

#### Actualizar Colores
```bash
curl -X PUT http://localhost:3000/api/profiles/{tenant_id}/colors \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "primary_color": "#ff6b6b",
    "secondary_color": "#4ecdc4",
    "accent_color": "#ffffff",
    "font_family": "Roboto"
  }'
```

#### Actualizar Contacto
```bash
curl -X PUT http://localhost:3000/api/profiles/{tenant_id}/contact \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nuevo@ejemplo.com",
    "phone": "+584141234567",
    "website": "https://miempresa.com"
  }'
```

#### Reordenar Secciones
```bash
curl -X PUT http://localhost:3000/api/profiles/{tenant_id}/sections/order \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "section_order": ["header", "contact", "stats", "services", "testimonials", "social"]
  }'
```

## 📚 Documentación

La documentación completa está disponible en:
- `docs/profile-enhancements.md` - Documentación técnica detallada
- Swagger UI en `/api-docs` - Documentación interactiva

## 🔒 Seguridad

- Todas las rutas de escritura requieren autenticación
- Validación de permisos de administrador para modificaciones
- Validación de entrada en todos los endpoints
- Sanitización de datos antes de guardar en la base de datos

## 🐛 Manejo de Errores

### Códigos de Error
- `400` - Datos de entrada inválidos
- `403` - Permisos insuficientes
- `404` - Recurso no encontrado
- `500` - Error interno del servidor

### Respuestas de Error
```json
{
  "success": false,
  "message": "Descripción del error",
  "error": "Detalles técnicos (en desarrollo)"
}
```

## 🚀 Despliegue

### Requisitos
- Node.js 16+
- MongoDB 4.4+
- Dependencias actualizadas

### Pasos
1. Actualizar dependencias: `npm install`
2. Verificar migraciones de base de datos
3. Reiniciar el servidor
4. Probar endpoints nuevos

## 📝 Notas de Implementación

### Compatibilidad
- ✅ Compatible con perfiles existentes
- ✅ Migración automática de datos
- ✅ Valores por defecto para campos nuevos

### Performance
- ✅ Consultas optimizadas
- ✅ Índices de base de datos
- ✅ Validación eficiente

### Escalabilidad
- ✅ Validación por tenant
- ✅ Control de acceso granular
- ✅ Logging detallado

## 🤝 Contribución

Para contribuir a estas mejoras:

1. Crear una rama feature: `git checkout -b feature/profile-enhancements`
2. Implementar cambios
3. Agregar pruebas
4. Actualizar documentación
5. Crear pull request

## 📞 Soporte

Para soporte técnico o preguntas sobre estas mejoras:
- Crear un issue en el repositorio
- Revisar la documentación en `docs/profile-enhancements.md`
- Consultar los ejemplos en `scripts/test-profile-enhancements.js`
