# Sincronización de Configuración de Citas

## 🎯 Problema Resuelto

Se identificó una inconsistencia lógica en el sistema donde:
- `appointment_config.enabled` podía estar en `true` 
- `profile_sections.show_appointments` podía estar en `false`

Esto causaba que las citas estuvieran configuradas pero no se mostraran en el perfil, o viceversa.

## ✅ Solución Implementada

### 1. **Sincronización Automática en la API**

#### Backend (`ProfileSectionsController`)
- Cuando se actualiza `show_appointments`, automáticamente sincroniza con `appointment_config.enabled`
- Mantiene la configuración existente de citas (título, descripción, etc.)

#### Backend (`ProfileController`)
- Cuando se actualiza `appointment_config.enabled`, automáticamente sincroniza con `show_appointments`

### 2. **Detección de Inconsistencias en el Frontend**

#### `ProfileSectionsOrderEditor`
- Detecta automáticamente inconsistencias al cargar
- Muestra alerta visual cuando hay discrepancias
- Proporciona botones para resolver fácilmente

#### `ProfileSectionsSelector`
- Notifica al usuario cuando activa/desactiva citas
- Informa que la sincronización ocurrirá automáticamente

### 3. **Script de Migración**

```bash
npm run fix-appointments
```

Este script:
- Busca todos los perfiles con inconsistencias
- Aplica la regla: "Si cualquiera está habilitado, ambos deben estarlo"
- Reporta resultados detallados

## 🔧 Uso

### Para Desarrolladores

1. **API**: Los cambios son automáticos. No requiere código adicional.

2. **Frontend**: El componente detecta y resuelve inconsistencias automáticamente.

3. **Migración de datos existentes**:
   ```bash
   cd SmartOps_Api_V3
   npm run fix-appointments
   ```

### Para Usuarios

1. **Si ves la alerta de inconsistencia**:
   - Haz clic en "Activar Ambos" para habilitar citas completamente
   - Haz clic en "Desactivar Ambos" para deshabilitar citas completamente

2. **Al activar/desactivar citas**:
   - La configuración se sincroniza automáticamente
   - Recibirás notificaciones de confirmación

## 📊 Reglas de Sincronización

| Acción | appointment_config.enabled | show_appointments | Resultado |
|--------|---------------------------|-------------------|-----------|
| Activar sección de citas | ✅ true | ✅ true | Citas habilitadas y visibles |
| Desactivar sección de citas | ❌ false | ❌ false | Citas deshabilitadas y ocultas |
| Habilitar config de citas | ✅ true | ✅ true | Citas habilitadas y visibles |
| Deshabilitar config de citas | ❌ false | ❌ false | Citas deshabilitadas y ocultas |

## 🚨 Detección de Inconsistencias

El sistema detecta automáticamente estas situaciones problemáticas:

1. **Citas configuradas pero no visibles**:
   - `appointment_config.enabled: true`
   - `show_appointments: false`

2. **Sección visible pero citas no configuradas**:
   - `appointment_config.enabled: false`
   - `show_appointments: true`

## 🔍 Monitoreo

### Logs en el Backend
```javascript
console.log('SINCRONIZACIÓN: Actualizando appointment_config.enabled según show_appointments');
```

### Notificaciones en el Frontend
- Toast de confirmación cuando se resuelven inconsistencias
- Alertas visuales cuando se detectan problemas
- Información contextual durante cambios

## 🛠️ Archivos Modificados

### Backend
- `src/core/profiles/controllers/profileSections.controller.js`
- `src/core/profiles/controllers/profile.controller.js`

### Frontend
- `src/components/forms/ProfileSectionsOrderEditor.tsx`
- `src/components/forms/ProfileSectionsSelector.tsx`

### Scripts
- `scripts/fix-appointment-sections-inconsistency.js`
- `package.json` (nuevo script)

## 📋 Testing

Para probar la funcionalidad:

1. **Crear inconsistencia manualmente** (solo para testing):
   ```javascript
   // En MongoDB
   db.profiles.updateOne(
     { tenant_id: "tu_tenant_id" },
     { 
       $set: { 
         "appointment_config.enabled": true,
         "profile_sections.show_appointments": false 
       }
     }
   )
   ```

2. **Ir al admin** → Perfil → Orden de Secciones
3. **Verificar** que aparezca la alerta de inconsistencia
4. **Resolver** usando los botones de la alerta
5. **Confirmar** que ambos campos queden sincronizados

## 🎉 Beneficios

1. **Consistencia de datos**: No más estados contradictorios
2. **UX mejorada**: Los usuarios ven claramente el estado real
3. **Sincronización automática**: Sin intervención manual requerida
4. **Migración segura**: Script para datos existentes
5. **Detección proactiva**: Alertas visuales para inconsistencias
