# Sistema Completo de Templates de Automatización

## 🎯 Resumen

El sistema de clonado de templates de automatización está **completamente funcional** e incluye todas las características solicitadas:

✅ **Clonado de templates con nombre del tenant en N8N**  
✅ **Reemplazo de variables personalizado**  
✅ **Manejo de diferentes tipos de nodos**  
✅ **Integración completa con la base de datos**  
✅ **Manejo de errores y limpieza automática**  

## 🚀 Características Principales

### 1. **Nomenclatura Personalizada**
- Los workflows se crean con el formato: `[Nombre del Tenant] Nombre del Template`
- Ejemplo: `[SmartOps Technology] AI Agent: Agente de Ventas IA`

### 2. **Reemplazo de Variables Inteligente**
- **Variables del tenant**: `TENANT_ID`, `TENANT_NAME`, `TENANT_SLUG`
- **Variables del negocio**: `BUSINESS_TYPE`, `PRIMARY_COLOR`, `SECONDARY_COLOR`
- **Variables del cliente**: `CLIENT_NAME`, `COMPANY_INFO`, `CONTACT_INFO`
- **Variables personalizadas**: Definidas en cada template

### 3. **Tipos de Nodos Soportados**
- **OpenAI**: Manejo de mensajes con estructura `chatInput`
- **Webhooks**: Personalización con slug del tenant
- **HTTP Requests**: Inyección de headers con información del tenant
- **Funciones**: Inyección de contexto del tenant en el código
- **Otros nodos**: Procesamiento recursivo de parámetros

### 4. **Información del Tenant Automática**
- Obtención automática de datos del tenant desde la base de datos
- Uso de `displayName` o `name` como fallback
- Inclusión de tema visual (colores, modo oscuro)
- Metadata del negocio (tipo, características)

## 🔧 Uso del Sistema

### Método Principal: `cloneTemplate()`

```javascript
const clonedWorkflow = await N8nService.cloneTemplate(templateId, {
  tenantId: '685b7202893007e0f22d40dc',
  tenantName: 'SmartOps Technology',
  tenantSlug: 'smartops',
  name: 'Mi Automatización',
  clientConfig: {
    tenantId: '685b7202893007e0f22d40dc',
    tenantName: 'SmartOps Technology',
    tenantSlug: 'smartops',
    clientName: 'SmartOps Technology',
    companyInfo: {
      name: 'SmartOps Technology',
      description: 'Empresa de automatización',
      businessType: 'general'
    },
    variables: {
      CLIENT_NAME: 'SmartOps Technology',
      COMPANY_INFO: 'Empresa líder en automatización',
      CONTACT_INFO: 'info@smartops.com'
    },
    platforms: ['whatsapp', 'webchat']
  },
  aiConfig: {
    enabled: true,
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 800
  }
});
```

### Desde el Controlador

```javascript
// POST /api/automation/templates/:id/clone
const clonedAutomation = await templateController.cloneTemplate(req, res);
```

## 🧪 Testing y Validación

### Script de Prueba
```bash
node src/features/automation/scripts/testTemplateCloning.js
```

### Script de Debug
```bash
node src/features/automation/scripts/debugTemplate.js
```

### Crear Templates por Defecto
```bash
node src/features/automation/scripts/createDefaultTemplates.js
```

## 📊 Resultado de las Pruebas

**Última prueba exitosa:**
- ✅ Template clonado: `Agente de Ventas con IA`
- ✅ Tenant: `SmartOps Technology`
- ✅ Workflow ID: `M2VeFr6zCaYDJncJ`
- ✅ Nombre: `[SmartOps Technology] AI Agent: Agente de Ventas IA`
- ✅ Nodos procesados: 11
- ✅ Automatización creada en SmartOps
- ✅ Webhook configurado correctamente

## 🔄 Flujo Completo

1. **Selección del Template**: Usuario elige un template público
2. **Configuración**: Se proporciona información del tenant y variables
3. **Obtención del Workflow**: Se descarga el template desde N8N
4. **Procesamiento de Nodos**: Se actualizan todos los nodos con la configuración del tenant
5. **Creación en N8N**: Se crea el nuevo workflow con el nombre personalizado
6. **Registro en SmartOps**: Se crea el documento de automatización
7. **Validación**: Se verifica que todo funcione correctamente

## 🛠️ Métodos Auxiliares

### `getTenantInfo(tenantId)`
Obtiene información completa del tenant desde la base de datos.

### `createVariableMap(config, tenantInfo)`
Crea un mapa de variables para reemplazo en los nodos.

### `updateNodesWithClientConfig(nodes, config)`
Actualiza todos los nodos con la configuración específica del tenant.

### `validateCloneConfig(config)`
Valida que la configuración de clonado sea correcta.

### `replaceVariables(text, variableMap)`
Reemplaza variables en texto usando el formato `{{VARIABLE_NAME}}`.

## 📝 Tipos de Variables Soportadas

### Variables del Sistema
- `{{TENANT_ID}}` - ID del tenant
- `{{TENANT_NAME}}` - Nombre del tenant
- `{{TENANT_SLUG}}` - Slug único del tenant
- `{{BUSINESS_TYPE}}` - Tipo de negocio
- `{{PRIMARY_COLOR}}` - Color primario del tema
- `{{SECONDARY_COLOR}}` - Color secundario del tema

### Variables del Cliente
- `{{CLIENT_NAME}}` - Nombre del cliente
- `{{COMPANY_INFO}}` - Información de la empresa
- `{{CONTACT_INFO}}` - Información de contacto
- `{{AUTOMATION_NAME}}` - Nombre de la automatización

### Variables Personalizadas
Cualquier variable definida en `config.variables` puede ser usada.

## 🚨 Manejo de Errores

El sistema incluye manejo robusto de errores:
- **Validación previa**: Verifica configuración antes de proceder
- **Rollback automático**: Limpia N8N si falla la creación en SmartOps
- **Logging detallado**: Registra cada paso del proceso
- **Recuperación**: Maneja errores de nodos individuales sin fallar todo

## 🔐 Seguridad

- **Validación de tenant**: Verifica que el tenant exista y esté activo
- **Sanitización de variables**: Limpia variables antes de inyectar en workflows
- **Limitación de acceso**: Solo templates públicos pueden ser clonados
- **Audit trail**: Registra quién y cuándo clona templates

## 📈 Métricas y Monitoreo

- **Contadores de clones**: Cada template mantiene estadísticas de uso
- **Logs estructurados**: Información detallada para debugging
- **Métricas de rendimiento**: Tiempo de procesamiento y success rate
- **Alertas**: Notificaciones en caso de errores frecuentes

## 🎉 Conclusión

El sistema de clonado de templates está **completamente implementado y funcional**. Puede ser usado inmediatamente para crear automatizaciones personalizadas con los nombres de tenant incluidos en N8N.

**Próximos pasos recomendados:**
1. Integrar con la interfaz de usuario
2. Agregar más templates predefinidos
3. Implementar sistema de notificaciones
4. Agregar métricas avanzadas de uso 