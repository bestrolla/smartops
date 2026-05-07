# Mejoras en la Gestión de Perfiles - Frontend Admin

## 🎯 Nuevas Funcionalidades Implementadas

Se han agregado nuevas funcionalidades al panel de administración para mejorar la gestión de perfiles:

### 🎨 **1. Editor de Colores del Perfil**
- **Componente**: `ProfileColorsEditor`
- **Ubicación**: `src/components/forms/ProfileColorsEditor.tsx`
- **Funcionalidades**:
  - Paletas de colores predefinidas
  - Editor de colores personalizados
  - Selector de fuentes
  - Vista previa en tiempo real
  - Validación de colores hexadecimales

### 📞 **2. Editor de Información de Contacto**
- **Componente**: `ProfileContactEditor`
- **Ubicación**: `src/components/forms/ProfileContactEditor.tsx`
- **Funcionalidades**:
  - Edición independiente de email, teléfono y website
  - Formateo automático de números de teléfono
  - Validación de email y URL
  - Vista previa de la información de contacto
  - Enlaces directos para probar la información

### 📋 **3. Editor de Ordenamiento de Secciones**
- **Componente**: `ProfileSectionsOrderEditor`
- **Ubicación**: `src/components/forms/ProfileSectionsOrderEditor.tsx`
- **Funcionalidades**:
  - Reordenamiento de secciones con botones de flecha
  - Toggle de visibilidad de secciones
  - Indicadores de estado (habilitada/deshabilitada/no disponible)
  - Información de features disponibles del tenant

### 💬 **4. Editor de Testimonios**
- **Componente**: `TestimonialsEditor`
- **Ubicación**: `src/components/forms/TestimonialsEditor.tsx`
- **Funcionalidades**:
  - Agregar, editar y eliminar testimonios
  - Campos: nombre, rol, contenido, calificación (1-5 estrellas)
  - Avatar opcional para cada testimonio
  - Vista previa de testimonios en tiempo real
  - Validación de campos requeridos

### 📍 **5. Editor de Ubicación**
- **Componente**: `LocationEditor`
- **Ubicación**: `src/components/forms/LocationEditor.tsx`
- **Funcionalidades**:
  - Información completa de ubicación (dirección, ciudad, país)
  - Horarios de negocio configurables
  - Geocodificación automática para obtener coordenadas
  - Vista previa con mapa simulado
  - Información adicional opcional

## 🚀 Cómo Usar las Nuevas Funcionalidades

### Acceso a las Funcionalidades

1. **Navegar a Perfil**: Ve a la página de Perfil en el admin
2. **Sistema de Pestañas**: Las nuevas funcionalidades están organizadas en pestañas:
   - **Básico**: Información básica y selección de template
   - **Colores**: Personalización de colores y fuentes
   - **Contacto**: Gestión de información de contacto
   - **Testimonios**: Gestión de testimonios de clientes
   - **Ubicación**: Información de ubicación y horarios
   - **Secciones**: Ordenamiento y configuración de secciones
   - **Social**: Gestión de redes sociales

### 🎨 Editor de Colores

#### Paletas Predefinidas
- Selecciona una de las 8 paletas predefinidas
- Incluye opciones como "SmartOps Blue", "Ocean Blue", "Emerald Green", etc.
- Aplica automáticamente los colores al perfil

#### Colores Personalizados
- Usa el selector de color o ingresa códigos hexadecimales
- Personaliza:
  - **Color Primario**: Color principal del perfil
  - **Color Secundario**: Color de acento
  - **Color de Acento**: Color para elementos destacados
  - **Fuente**: Selecciona entre 8 fuentes disponibles

#### Vista Previa
- Ve cómo se verán los colores en tiempo real
- Incluye ejemplos de títulos, texto y botones

### 📞 Editor de Contacto

#### Campos Disponibles
- **Email**: Con validación automática
- **Teléfono**: Formateo automático (+1 234 567 8900)
- **Sitio Web**: Con validación de URL

#### Características
- **Validación en tiempo real**: Errores se muestran inmediatamente
- **Vista previa**: Ve cómo se verá la información en el perfil
- **Enlaces directos**: Prueba email y teléfono directamente
- **Indicador de cambios**: Sabrás cuando tienes cambios sin guardar

### 💬 Editor de Testimonios

#### Funcionalidades
- **Agregar testimonio**: Formulario completo con validación
- **Editar testimonio**: Modificar testimonios existentes
- **Eliminar testimonio**: Remover testimonios no deseados
- **Calificación**: Sistema de 1-5 estrellas
- **Avatar**: URL opcional para imagen del cliente

#### Campos Requeridos
- **Nombre**: Nombre del cliente
- **Rol**: Cargo o posición del cliente
- **Contenido**: Testimonio del cliente
- **Calificación**: Puntuación de 1 a 5 estrellas

### 📍 Editor de Ubicación

#### Funcionalidades
- **Información completa**: Dirección, ciudad, estado, país, código postal
- **Horarios de negocio**: Configuración por día de la semana
- **Geocodificación**: Obtención automática de coordenadas
- **Mapa simulado**: Vista previa de la ubicación
- **Información adicional**: Notas adicionales sobre la ubicación

#### Campos Disponibles
- **Dirección**: Dirección completa del negocio
- **Ciudad**: Ciudad donde se encuentra
- **Estado/Provincia**: Estado o provincia (opcional)
- **País**: País donde se encuentra
- **Código Postal**: Código postal (opcional)
- **Horarios**: Configuración de horarios por día
- **Información adicional**: Notas sobre la ubicación

### 📋 Editor de Secciones

#### Funcionalidades
- **Reordenamiento**: Usa las flechas para mover secciones arriba/abajo
- **Visibilidad**: Toggle para mostrar/ocultar secciones
- **Estado visual**: 
  - 🟢 Habilitada
  - ⚫ Deshabilitada  
  - 🔴 No disponible (según plan)

#### Secciones Disponibles
- **Header**: Encabezado del perfil
- **Stats**: Estadísticas y logros
- **Services**: Servicios (si está habilitado)
- **Products**: Productos (si está habilitado)
- **Testimonials**: Testimonios
- **Contact**: Información de contacto
- **Location**: Información de ubicación
- **Social**: Redes sociales
- **Appointments**: Citas (si está habilitado)

### 📱 Preview Móvil

#### Características
- **Dispositivo realista**: Simula un iPhone con bordes redondeados y barra de estado
- **Scroll automático**: Aparece solo al hacer hover o scroll activo, transparente por defecto
- **Orden dinámico**: Respeta el orden de secciones configurado
- **Colores del tema**: Aplica los colores personalizados en tiempo real
- **Fondo degradado**: Entorno visual que simula un escritorio
- **Espacio optimizado**: Padding adicional al final para mejor visualización

### 🖼️ Carga de Imágenes

#### Problemas Corregidos
- **Error CORS**: Eliminado el error `ERR_BLOCKED_BY_RESPONSE.NotSameOrigin`
- **Cross-Origin-Resource-Policy**: Agregado header `cross-origin` para permitir acceso desde otros dominios
- **URLs incorrectas**: Corregida la construcción de URLs de imágenes
- **Acceso directo**: Las imágenes ahora se sirven directamente desde `/uploads`
- **CORS configurado**: Headers CORS optimizados para permitir acceso desde el frontend

#### Funcionalidades
- **URLs directas**: Acceso directo a imágenes sin pasar por el API
- **Fallback automático**: Imagen por defecto si no se encuentra la especificada
- **Múltiples formatos**: Soporte para JPG, PNG, GIF, WebP
- **Cache optimizado**: Headers de cache para mejor rendimiento
- **Política de recursos**: Headers de seguridad configurados para permitir acceso cruzado

#### Funcionalidades
- **Vista previa en tiempo real**: Los cambios se reflejan inmediatamente
- **Scroll inteligente**: Aparece solo al hacer hover o scroll activo
- **Responsive**: Se adapta al contenido del perfil
- **Sombras realistas**: Efectos visuales que mejoran la experiencia
- **Redes sociales mejoradas**: Mejor espaciado y iconos optimizados

## 🔧 Componentes Técnicos

### API Methods Agregados

```typescript
// Gestión de colores
profileApi.getProfileColors(tenantId)
profileApi.updateProfileColors(tenantId, colors)

// Gestión de contacto
profileApi.getContactInfo(tenantId)
profileApi.updateContactInfo(tenantId, contact)

// Ordenamiento de secciones
profileApi.getSectionsConfig(tenantId)
profileApi.getSectionOrder(tenantId)
profileApi.updateSectionOrder(tenantId, { section_order })
```

### Interfaces TypeScript

```typescript
interface ProfileColors {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_family: string;
}

interface ContactInfo {
  email: string;
  phone: string;
  website: string;
}

interface Section {
  id: string;
  name: string;
  description: string;
  available: boolean;
  enabled: boolean;
  order: number;
  icon: string;
  category: 'basic' | 'conditional';
}
```

## 🎨 Paletas de Colores Predefinidas

1. **SmartOps Blue**: `#4f46e5`, `#7c3aed`, `#ffffff`
2. **Ocean Blue**: `#0ea5e9`, `#0284c7`, `#ffffff`
3. **Emerald Green**: `#10b981`, `#059669`, `#ffffff`
4. **Sunset Orange**: `#f97316`, `#ea580c`, `#ffffff`
5. **Purple Dream**: `#8b5cf6`, `#7c3aed`, `#ffffff`
6. **Rose Pink**: `#ec4899`, `#db2777`, `#ffffff`
7. **Dark Mode**: `#1f2937`, `#374151`, `#ffffff`
8. **Light Mode**: `#f3f4f6`, `#e5e7eb`, `#1f2937`

## 🔤 Fuentes Disponibles

- Montserrat (por defecto)
- Roboto
- Open Sans
- Poppins
- Inter
- Lato
- Source Sans Pro
- Nunito

## 🎯 Flujo de Trabajo Recomendado

### Para Nuevos Perfiles
1. **Básico**: Completa información básica y selecciona template
2. **Colores**: Personaliza los colores según tu marca
3. **Contacto**: Agrega información de contacto
4. **Secciones**: Configura qué secciones mostrar y en qué orden
5. **Social**: Agrega enlaces a redes sociales
6. **Guardar**: Guarda todos los cambios

### Para Perfiles Existentes
1. **Revisar**: Ve cada pestaña para ver la configuración actual
2. **Personalizar**: Haz los cambios que necesites
3. **Probar**: Usa las vistas previas para verificar
4. **Guardar**: Guarda los cambios por pestaña

## 🚀 Nuevas Funcionalidades de Guardado

### ✅ Guardado Independiente por Pestaña
- **Cada pestaña se guarda de forma independiente**
- **Notificaciones con emojis**: ✅ Éxito, ❌ Error
- **Redirección automática**: Después de guardar, redirige al perfil para ver los cambios
- **Botón "Ver Perfil"**: Acceso directo para ver el resultado

### 🎨 Editor de Colores
- **Guardado**: `🎨 Colores actualizados exitosamente`
- **Error**: `❌ Error al guardar los colores`
- **Redirección**: 1 segundo después del guardado exitoso

### 📞 Editor de Contacto
- **Guardado**: `📞 Información de contacto actualizada exitosamente`
- **Error**: `❌ Error al guardar la información de contacto`
- **Validación**: Verifica email y URL antes de guardar

### 💬 Editor de Testimonios
- **Guardado**: `💬 Testimonios actualizados exitosamente`
- **Error**: `❌ Error al guardar los testimonios`
- **Validación**: Verifica campos requeridos antes de guardar

### 📍 Editor de Ubicación
- **Guardado**: `📍 Información de ubicación actualizada exitosamente`
- **Error**: `❌ Error al guardar la información de ubicación`
- **Geocodificación**: Obtiene coordenadas automáticamente

### 📋 Editor de Secciones
- **Guardado**: `📋 Orden de secciones actualizado exitosamente`
- **Error**: `❌ Error al guardar el orden de secciones`
- **Recarga**: Recarga automática de configuración después de guardar

### 🔍 Verificación de Guardado
Se incluyen scripts de verificación completos:
```bash
# Ejecutar verificación completa
node scripts/verify-sections-save.js

# Ejecutar prueba específica de orden de secciones
node scripts/test-section-order.js

# Ejecutar prueba del preview móvil
node scripts/test-mobile-preview.js

# Ejecutar prueba de mejoras del preview móvil
node scripts/test-mobile-preview-improvements.js

# Ejecutar prueba de carga de imágenes
node scripts/test-image-loading.js

# Ejecutar prueba específica de Cross-Origin-Resource-Policy
node scripts/test-cross-origin-policy.js

# Ejecutar prueba de testimonios y ubicación
node scripts/test-testimonials-location.js

# Ejecutar prueba de las correcciones implementadas
node scripts/test-fixes.js

# Ejecutar prueba de endpoints del API
node scripts/test-api-endpoints.js

# Ejecutar prueba de estructura del API
node scripts/test-api-structure.js

**Los scripts verifican:**
- ✅ Que las secciones se guarden correctamente
- ✅ Que los colores se guarden correctamente  
- ✅ Que el contacto se guarde correctamente
- ✅ Que los testimonios se guarden correctamente
- ✅ Que la ubicación se guarde correctamente
- ✅ Que el orden de secciones se aplique correctamente
- ✅ Que el preview móvil funcione correctamente
- ✅ Que el scroll automático funcione correctamente
- ✅ Que las redes sociales tengan mejor espaciado
- ✅ Que los datos se restauren correctamente
- ✅ Que las imágenes se carguen correctamente
- ✅ Que no haya errores CORS en las imágenes
- ✅ Que el header Cross-Origin-Resource-Policy esté configurado correctamente
- ✅ Que getApiUrl esté exportado correctamente
- ✅ Que las funciones loadTestimonials y loadLocation estén definidas correctamente
- ✅ Que las interfaces TypeScript incluyan location y section_order
- ✅ Que tenantId se maneje correctamente con null checks
- ✅ Que el API incluya endpoints para testimonials y location
- ✅ Que el modelo de perfil incluya campos para testimonials y location
- ✅ Que las validaciones incluyan testimonials y location
- ✅ Que la configuración de secciones incluya location
- ✅ Que el manejo de errores sea robusto en testimonials y location
- ✅ Que los tabs tengan espaciado adecuado

## 🐛 Solución de Problemas

### Errores Comunes

#### "Error al cargar los colores actuales"
- Verifica que el tenant_id sea válido
- Revisa la conexión con el backend
- Asegúrate de que el perfil exista

#### "Formato de email inválido"
- Asegúrate de que el email tenga formato válido (ejemplo@dominio.com)
- No dejes espacios al inicio o final

#### "URL inválida"
- Incluye `http://` o `https://` al inicio
- Verifica que la URL sea válida

#### "Sección no disponible"
- Algunas secciones requieren features específicas del plan
- Contacta al administrador para habilitar features adicionales

#### "Error al cargar imagen de perfil"
- Verifica que el servidor backend esté ejecutándose
- Revisa que la imagen exista en la carpeta de uploads
- Asegúrate de que CORS esté configurado correctamente
- Verifica que el header `Cross-Origin-Resource-Policy` esté configurado como `cross-origin`
- Ejecuta el script de prueba: `node scripts/test-image-loading.js`

#### "loadTestimonials is not defined"
- Verifica que las funciones estén definidas antes de los useEffect
- Asegúrate de que getApiUrl esté exportado desde api.ts
- Ejecuta el script de prueba: `node scripts/test-fixes.js`

#### "getApiUrl is not exported"
- Verifica que getApiUrl tenga la palabra `export` en su declaración
- Asegúrate de que la importación en testimonialsApi.ts y locationApi.ts sea correcta
- Ejecuta el script de prueba: `node scripts/test-fixes.js`

#### "Cannot read properties of undefined (reading 'testimonials')"
- Verifica que el API esté ejecutándose correctamente
- Asegúrate de que el usuario esté autenticado
- Los componentes ahora manejan mejor los casos donde no hay datos
- Ejecuta el script de prueba: `node scripts/test-api-structure.js`

#### "Cannot read properties of undefined (reading 'location')"
- Verifica que el API esté ejecutándose correctamente
- Asegúrate de que el usuario esté autenticado
- Los componentes ahora manejan mejor los casos donde no hay datos
- Ejecuta el script de prueba: `node scripts/test-api-structure.js`

### Validaciones

#### Colores
- Formato hexadecimal: `#RRGGBB`
- Ejemplos válidos: `#4f46e5`, `#7c3aed`, `#ffffff`

#### Contacto
- **Email**: Formato estándar de email
- **Teléfono**: Formato automático, solo números
- **Website**: URL válida con protocolo

#### Secciones
- Solo secciones válidas permitidas
- Orden debe incluir todas las secciones disponibles
- No se permiten duplicados

## 🚀 Próximas Mejoras

### Funcionalidades Planificadas
- [ ] Arrastrar y soltar para reordenar secciones
- [ ] Más paletas de colores predefinidas
- [ ] Vista previa en desktop y tablet
- [ ] Historial de cambios
- [ ] Exportar/importar configuración
- [ ] Temas estacionales automáticos

### Mejoras de UX
- [ ] Tutorial interactivo para nuevos usuarios
- [ ] Sugerencias de colores basadas en la imagen de perfil
- [ ] Modo oscuro para el editor
- [ ] Atajos de teclado
- [ ] Guardado automático

## 📞 Soporte

Para soporte técnico o preguntas sobre estas funcionalidades:

1. **Documentación**: Revisa este README
2. **Código**: Consulta los archivos de componentes
3. **API**: Revisa la documentación del backend
4. **Issues**: Crea un issue en el repositorio

### Archivos Relacionados

**Frontend:**
- `src/components/forms/ProfileColorsEditor.tsx`
- `src/components/forms/ProfileContactEditor.tsx`
- `src/components/forms/ProfileSectionsOrderEditor.tsx`
- `src/components/forms/TestimonialsEditor.tsx`
- `src/components/forms/LocationEditor.tsx`
- `src/components/forms/MobileProfilePreview.tsx`
- `src/lib/profileApi.ts`
- `src/lib/testimonialsApi.ts`
- `src/lib/locationApi.ts`
- `src/lib/api.ts`
- `src/types/profile.ts`
- `src/pages/Profile.tsx`
- `src/index.css`

**Backend:**
- `SmartOps_Api_V3/src/core/profiles/models/profile.model.js`
- `SmartOps_Api_V3/src/core/profiles/validations/profile.validation.js`
- `SmartOps_Api_V3/src/core/profiles/controllers/profileSections.controller.js`

**Scripts de Prueba:**
- `scripts/verify-sections-save.js`
- `scripts/test-section-order.js`
- `scripts/test-mobile-preview.js`
- `scripts/test-mobile-preview-improvements.js`
- `scripts/test-image-loading.js`
- `scripts/test-cross-origin-policy.js`
- `scripts/test-testimonials-location.js`
- `scripts/test-fixes.js`
- `scripts/test-api-endpoints.js`
- `scripts/test-api-structure.js`

## 🎯 Características Destacadas

### ✨ Experiencia de Usuario Mejorada
- **Sistema de pestañas organizado**: 5 pestañas para mejor organización
- **Guardado independiente**: Cada sección se guarda por separado
- **Notificaciones visuales**: Toast con emojis para mejor feedback
- **Redirección automática**: Ve los cambios inmediatamente después de guardar
- **Botones de acción**: "Ver Perfil" en cada editor

### 🔧 Funcionalidades Técnicas
- **Validación en tiempo real**: Errores se muestran inmediatamente
- **Formateo automático**: Teléfonos se formatean automáticamente
- **Vistas previas**: Ve cómo se verá antes de guardar
- **Orden de secciones dinámico**: El preview respeta el orden configurado
- **Preview móvil realista**: Simula un dispositivo móvil con scroll inteligente
- **Scroll automático**: Aparece solo al hacer hover o scroll activo
- **Redes sociales optimizadas**: Mejor espaciado y iconos mejorados
- **Carga de imágenes optimizada**: URLs directas sin problemas de CORS
- **Verificación completa**: Scripts para verificar que todo funcione correctamente

### 🎨 Personalización Avanzada
- **8 paletas predefinidas**: Desde SmartOps Blue hasta Dark Mode
- **8 fuentes disponibles**: Desde Montserrat hasta Nunito
- **Editor de colores personalizado**: Selector de color + input hexadecimal
- **Ordenamiento de secciones**: Control total sobre el orden de visualización
