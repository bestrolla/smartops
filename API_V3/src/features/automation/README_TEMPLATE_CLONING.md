# Template Cloning System - Documentación

## Descripción General

El sistema de clonado de templates permite crear automatizaciones personalizadas a partir de templates predefinidos, incluyendo el nombre del tenant en el workflow de N8N y configuraciones específicas por tenant.

## Mejoras Implementadas

### 1. Nomenclatura de Workflows
- **Antes**: `${clientConfig.name} - ${template.name}`
- **Ahora**: `[${tenantName}] ${template.name}`

Los workflows en N8N ahora incluyen el nombre del tenant entre corchetes para fácil identificación.

### 2. Información del Tenant
- Obtención automática de información del tenant desde la base de datos
- Uso del `displayName` si está disponible, o `name` como fallback
- Inclusión de metadata del tenant en el workflow

### 3. Sistema de Variables Mejorado
- **Mapa de variables completo** con información del tenant
- **Variables automáticas** disponibles en todos los workflows:
  - `TENANT_ID`: ID del tenant
  - `TENANT_NAME`: Nombre de display del tenant
  - `TENANT_SLUG`: Slug único del tenant
  - `BUSINESS_TYPE`: Tipo de negocio del tenant
  - `PRIMARY_COLOR`: Color primario del tema
  - `SECONDARY_COLOR`: Color secundario del tema
  - Y muchas más...

### 4. Webhooks con Información del Tenant
- **Antes**: `${tenantId}-${webhook}`
- **Ahora**: `${tenantSlug}-${webhook}`

Los webhooks ahora usan el slug del tenant para mejor organización.

### 5. Contexto del Tenant en Funciones
Cada nodo de función JavaScript incluye automáticamente:
```javascript
const TENANT_CONTEXT = {
  id: 'tenant-id',
  name: 'Tenant Name',
  slug: 'tenant-slug',
  businessType: 'general',
  theme: { primaryColor: '#4f46e5', secondaryColor: '#f43f5e' },
  features: { appointments: true, crm: false },
  clonedAt: '2024-01-01T00:00:00.000Z'
};

const CONFIG_VARS = {
  // Todas las variables disponibles
};
```

### 6. Validaciones y Manejo de Errores
- Validación de configuración antes de clonar
- Verificación de templates válidos
- Manejo de errores específicos
- Logging detallado para debugging

## Uso del Sistema

### 1. Clonar un Template (API)

```javascript
POST /api/automation/templates/:id/clone
{
  "name": "Mi Automatización",
  "clientConfig": {
    "businessHours": {
      "monday": { "start": "09:00", "end": "18:00" }
    },
    "companyInfo": {
      "name": "Mi Empresa",
      "description": "Descripción de la empresa"
    }
  },
  "aiConfig": {
    "model": "gpt-4",
    "temperature": 0.7
  },
  "platforms": ["whatsapp", "telegram"],
  "variables": {
    "CONTACT_EMAIL": "contacto@empresa.com",
    "WELCOME_MESSAGE": "Bienvenido a nuestro servicio"
  }
}
```

### 2. Clonar un Template (Código)

```javascript
const N8nService = require('./services/N8nService');

const cloneConfig = {
  tenantId: 'tenant-id',
  tenantName: 'Nombre del Tenant',
  name: 'Mi Automatización',
  clientName: 'Mi Cliente',
  variables: {
    CONTACT_EMAIL: 'test@example.com',
    CUSTOM_VAR: 'valor personalizado'
  }
};

const clonedWorkflow = await N8nService.cloneTemplate(templateId, cloneConfig);
```

## Variables Disponibles

### Variables del Sistema
- `TENANT_ID`: ID único del tenant
- `TENANT_NAME`: Nombre de display del tenant
- `TENANT_SLUG`: Slug único del tenant
- `CLIENT_NAME`: Nombre del cliente
- `AUTOMATION_NAME`: Nombre de la automatización
- `SMARTOPS_API_URL`: URL base de la API
- `WEBHOOK_BASE_URL`: URL base para webhooks

### Variables del Tenant
- `BUSINESS_TYPE`: Tipo de negocio (salon, restaurant, medical, etc.)
- `PRIMARY_COLOR`: Color primario del tema
- `SECONDARY_COLOR`: Color secundario del tema
- `TENANT_DESCRIPTION`: Descripción del tenant
- `TENANT_LOGO`: URL del logo del tenant
- `TENANT_FEATURES`: Características habilitadas del tenant

### Variables de IA
- `AI_MODEL`: Modelo de IA configurado
- `AI_TEMPERATURE`: Temperatura de la IA
- `AI_MAX_TOKENS`: Máximo de tokens por respuesta

### Variables Personalizadas
Todas las variables pasadas en `config.variables` están disponibles.

## Estructura de Templates

### Template Base
```javascript
{
  name: "Nombre del Template",
  description: "Descripción del template",
  category: "ai-agent",
  aiConfig: {
    enabled: true,
    model: "gpt-4",
    systemPrompt: "Tu eres un asistente para {{CLIENT_NAME}}..."
  },
  platforms: ["whatsapp", "telegram"],
  variables: [
    {
      name: "CLIENT_NAME",
      label: "Nombre del Cliente",
      type: "text",
      required: true
    }
  ]
}
```

### Workflow Clonado
```javascript
{
  name: "[Nombre del Tenant] Nombre del Template",
  settings: {
    tenant: {
      id: "tenant-id",
      name: "Nombre del Tenant",
      clonedFrom: "template-id",
      clonedAt: "2024-01-01T00:00:00.000Z"
    }
  },
  nodes: [
    // Nodos actualizados con variables del tenant
  ]
}
```

## Testing

### Script de Prueba
```bash
node src/features/automation/scripts/testTemplateCloning.js
```

Este script:
1. Verifica templates disponibles
2. Obtiene tenants de prueba
3. Clona un template
4. Verifica el resultado
5. Muestra resumen detallado

### Pruebas Manuales
1. Crear templates por defecto: `node src/features/automation/scripts/createDefaultTemplates.js`
2. Ejecutar pruebas: `node src/features/automation/scripts/testTemplateCloning.js`
3. Verificar workflows en N8N
4. Probar webhooks en plataformas de chat

## Troubleshooting

### Error: "Template no encontrado"
- Verifica que el template esté activo y público
- Ejecuta `createDefaultTemplates.js` para crear templates por defecto

### Error: "Tenant no encontrado"
- Verifica que el tenant existe y está activo
- Revisa que el `tenantId` sea correcto

### Error: "N8N no responde"
- Verifica que N8N esté ejecutándose
- Revisa las variables de entorno `N8N_BASE_URL` y `N8N_API_KEY`

### Error: "Webhook no funciona"
- Verifica que el webhook esté configurado correctamente
- Revisa que el workflow esté activo en N8N
- Confirma que la URL del webhook sea accesible

## Configuración Requerida

### Variables de Entorno
```bash
N8N_BASE_URL=http://localhost:5678
N8N_API_KEY=your-api-key
N8N_WEBHOOK_BASE_URL=https://your-domain.com
MONGO_URI=mongodb://localhost:27017/smartops
API_BASE_URL=https://api.smartops.com
```

### Dependencias
- MongoDB con datos de tenants
- N8N ejecutándose con API habilitada
- Templates creados en la base de datos

## Mejores Prácticas

1. **Nomenclatura**: Usa nombres descriptivos para las automatizaciones
2. **Variables**: Define variables claras y específicas
3. **Testing**: Siempre prueba los workflows después de clonar
4. **Monitoring**: Revisa los logs para identificar errores
5. **Cleanup**: Elimina workflows de prueba después de testear

## Próximos Pasos

1. Implementar activación automática de workflows
2. Agregar métricas de uso por tenant
3. Crear dashboard de monitoreo
4. Implementar backup automático de workflows
5. Agregar plantillas de mensajes por tipo de negocio 