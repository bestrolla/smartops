# 🎨 Sistema de Temas de Perfiles - SmartOps API

Este documento describe el sistema de **temas de perfiles** implementado en la API de SmartOps, basado en el análisis del proyecto `profile-smartops`.

## 📋 Resumen

El sistema incluye **4 temas de perfiles** profesionales predefinidos, cada uno con su propio estilo visual, configuración de colores y layout específico para diferentes tipos de profesionales. Todos los temas están basados en el análisis del proyecto `profile-smartops` y incluyen datos de ejemplo realistas.

> **⚠️ Importante**: Este sistema es diferente al sistema de **templates de automatización** que existe en `/features/automation/models/Template.js`. Los templates de automatización son para workflows de n8n, mientras que estos temas son para el diseño visual de perfiles profesionales.

## 🎯 Temas Disponibles

### 1. **Carlos Carrasco** - Diseñador Web
- **Estilo**: Minimalista y Elegante
- **Colores**: Negro (#111111) y Blanco (#ffffff)
- **Layout**: Header oscuro, estadísticas minimalistas
- **Categoría**: `designer`
- **Ideal para**: Diseñadores, desarrolladores frontend, UX/UI

### 2. **Santiago Oliveira** - Consultor Digital
- **Estilo**: Corporativo y Limpio
- **Colores**: Blanco (#ffffff) y Azul oscuro (#0f172a)
- **Layout**: Header claro, estadísticas corporativas
- **Categoría**: `consultant`
- **Ideal para**: Consultores, asesores, ejecutivos

### 3. **Dra. Elena Ruiz** - Médico Especialista
- **Estilo**: Profesional Médico
- **Colores**: Azul médico (#0ea5e9, #0284c7)
- **Layout**: Header con gradiente azul, estadísticas médicas
- **Categoría**: `medical`
- **Ideal para**: Médicos, profesionales de la salud

### 4. **Marco Torres** - Artista Visual
- **Estilo**: Creativo y Dinámico
- **Colores**: Indigo (#6366f1) y gradientes artísticos
- **Layout**: Header con gradiente artístico, estadísticas creativas
- **Categoría**: `creative`
- **Ideal para**: Artistas, creativos, diseñadores gráficos

## 🚀 Instalación y Configuración

### 1. Ejecutar el Script de Temas

```bash
# Navegar al directorio de la API
cd SmartOps_Api_V3

# Ejecutar el script para agregar temas
node scripts/add-profile-themes.js
```

### 2. Verificar la Instalación

```bash
# Ejecutar el script de prueba
node test-profile-themes.js
```

## 📡 Endpoints de la API

### Obtener Todos los Temas
```http
GET /api/profiles/themes
```

**Parámetros de consulta:**
- `category`: Filtrar por categoría (designer, consultant, medical, creative, business, technology)
- `search`: Buscar por nombre, descripción, profesión o estilo
- `limit`: Número de temas a retornar (default: 20)
- `page`: Número de página para paginación (default: 1)

### Obtener Temas Populares
```http
GET /api/profiles/themes/popular?limit=10
```

### Buscar Temas
```http
GET /api/profiles/themes/search?q=web
```

### Obtener Temas por Categoría
```http
GET /api/profiles/themes/category/designer
```

### Obtener Tema Específico
```http
GET /api/profiles/themes/carlos-carrasco
```

### Incrementar Uso de Tema
```http
POST /api/profiles/themes/carlos-carrasco/usage
```

### Agregar Review a Tema
```http
POST /api/profiles/themes/carlos-carrasco/review
Content-Type: application/json
Authorization: Bearer <token>

{
  "rating": 5,
  "comment": "Excelente tema, muy profesional"
}
```

### Obtener Estadísticas
```http
GET /api/profiles/themes/stats
```

## 🗄️ Estructura de la Base de Datos

### Modelo ProfileTheme

```javascript
{
  id: "carlos-carrasco",                    // ID único del tema
  name: "Carlos Carrasco",                  // Nombre del tema
  description: "Diseñador Web - Estilo...", // Descripción
  profession: "Diseñador Web",              // Profesión objetivo
  style: "Minimalista y Elegante",          // Estilo visual
  image: "https://...",                     // URL de imagen de preview
  preview_url: "/carlos-carrasco",          // URL de preview
  colors: {                                 // Configuración de colores
    primary: "#111111",
    secondary: "#1a1a1a", 
    accent: "#ffffff"
  },
  layout: {                                 // Configuración de layout
    header: "dark",
    stats: "minimal",
    services: "minimal",
    testimonials: "minimal"
  },
  default_sections: {                       // Secciones por defecto
    show_stats: true,
    show_testimonials: true,
    show_contact: true,
    show_social: true,
    show_services: false,
    show_products: false,
    show_appointments: false
  },
  sample_data: {                            // Datos de ejemplo
    name: "Carlos Carrasco",
    title: "Diseñador Web",
    bio: "Especialista en crear...",
    stats: [...],
    contact: {...},
    social_links: [...]
  },
  category: "designer",                     // Categoría
  tags: ["diseño", "web", "minimalista"],   // Etiquetas
  usage: {                                  // Estadísticas de uso
    total_profiles: 0,
    rating: 5,
    reviews: [...]
  }
}
```

## 🎨 Configuración de Estilos

### Tipos de Header
- `dark`: Fondo oscuro con texto claro
- `light`: Fondo claro con texto oscuro  
- `gradient-blue`: Gradiente azul médico
- `gradient-art`: Gradiente artístico multicolor

### Tipos de Estadísticas
- `minimal`: Diseño minimalista con círculos
- `corporate`: Diseño corporativo con badges
- `medical`: Diseño médico con tarjetas azules
- `creative`: Diseño creativo con colores vibrantes

### Tipos de Servicios
- `minimal`: Lista simple
- `corporate`: Tarjetas corporativas
- `medical`: Tarjetas médicas con iconos
- `creative`: Diseño artístico con colores

## 🔧 Uso en el Frontend

### 1. Cargar Temas

```javascript
// Obtener todos los temas
const response = await fetch('/api/profiles/themes');
const { data } = await response.json();
const themes = data.themes;

// Obtener temas por categoría
const designerThemes = await fetch('/api/profiles/themes/category/designer');
```

### 2. Aplicar Tema a un Perfil

```javascript
// Al seleccionar un tema
const selectedTheme = themes.find(t => t.id === 'carlos-carrasco');

// Aplicar configuración del tema
const profileData = {
  ...existingProfileData,
  theme: {
    template_id: selectedTheme.id,
    primary_color: selectedTheme.colors.primary,
    secondary_color: selectedTheme.colors.secondary,
    accent_color: selectedTheme.colors.accent,
    layout_style: selectedTheme.layout.header
  },
  profile_sections: selectedTheme.default_sections
};
```

### 3. Incrementar Uso

```javascript
// Cuando se usa un tema
await fetch(`/api/profiles/themes/${themeId}/usage`, {
  method: 'POST'
});
```

## 📊 Estadísticas y Métricas

El sistema incluye:

- **Contador de uso**: Número de perfiles que usan cada tema
- **Sistema de reviews**: Calificaciones y comentarios de usuarios
- **Rating promedio**: Calificación media de cada tema
- **Estadísticas por categoría**: Distribución de temas por tipo
- **Temas populares**: Ranking por uso y rating

## 🔄 Actualización de Temas

Para actualizar o agregar nuevos temas:

1. Modificar el array `profileThemes` en `scripts/add-profile-themes.js`
2. Ejecutar el script nuevamente
3. Los temas existentes se actualizarán automáticamente

## 🧪 Testing

```bash
# Ejecutar tests de temas
node test-profile-themes.js

# Verificar endpoints
curl http://localhost:3000/api/profiles/themes
curl http://localhost:3000/api/profiles/themes/carlos-carrasco
```

## 🔍 Diferencias con Templates de Automatización

| Aspecto | Temas de Perfiles | Templates de Automatización |
|---------|------------------|---------------------------|
| **Propósito** | Diseño visual de perfiles | Workflows de n8n |
| **Ubicación** | `/core/profiles/models/profileTheme.model.js` | `/features/automation/models/Template.js` |
| **Contenido** | Colores, layouts, estilos | Nodos, conexiones, IA |
| **Uso** | Frontend de perfiles | Backend de automatización |
| **Endpoints** | `/api/profiles/themes/*` | `/api/automation/templates/*` |

## 📝 Notas de Implementación

- Los temas están basados en el análisis del proyecto `profile-smartops`
- Cada tema incluye datos de ejemplo realistas
- El sistema es extensible para agregar nuevos temas
- Los colores y layouts están optimizados para móviles
- Incluye soporte para modo oscuro/claro
- Sistema de reviews y ratings integrado

## 🎯 Próximos Pasos

1. **Integración con el frontend**: Conectar con el componente `ProfileTemplateSelector`
2. **Sistema de preview**: Implementar vista previa en tiempo real
3. **Personalización avanzada**: Permitir modificar colores y layouts
4. **Temas premium**: Sistema de temas exclusivos
5. **Analytics**: Métricas detalladas de uso y conversión
