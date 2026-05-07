# Sistema de Automatización y Workflows SmartOps

## 📋 Resumen

Este sistema permite crear, gestionar y ejecutar workflows de automatización completamente integrados con la API de SmartOps y n8n como motor de workflows.

## 🏗️ Arquitectura

### Backend (SmartOps_Api_V3)
- **Modelo**: `Automation.js` - Esquema completo MongoDB
- **Controlador**: `automationController.js` - CRUD y operaciones 
- **Servicio**: `N8nService.js` - Integración con n8n
- **Rutas**: `automation.routes.js` - API RESTful

### Frontend (admin_smartops)
- **Página Principal**: `Automation.tsx` - Lista y gestión
- **Página de Creación**: `AutomationCreate.tsx` - Templates y configuración avanzada
- **Formulario**: `WorkflowCreateForm.tsx` - Wizard de configuración por pasos
- **API Client**: `automationApi.ts` - Conexión con backend

## 🚀 Funcionalidades Implementadas

### ✅ Gestión de Automatizaciones
- **Listar** automatizaciones por tenant
- **Crear** nuevas automatizaciones
- **Activar/Pausar** automatizaciones
- **Eliminar** automatizaciones
- **Métricas en tiempo real**

### ✅ Tipos de Automatización
1. **Chatbot** - Respuestas automáticas en WhatsApp, Telegram, etc.
2. **Redes Sociales** - Gestión automática de comentarios y DMs
3. **Email Marketing** - Campañas automáticas de seguimiento
4. **Workflow Personalizado** - Flujos de trabajo custom
5. **Trigger Automático** - Activación basada en eventos

### ✅ Plataformas Soportadas
- WhatsApp
- Telegram  
- Instagram
- Facebook
- Sitio Web

### ✅ Configuraciones Avanzadas
- **Horarios de Trabajo** por día de la semana
- **Rate Limiting** y control de límites
- **Palabras Bloqueadas** y filtros
- **Respuestas Personalizadas**
- **Timeouts y Reintentos**
- **Logging configurable**

## 📝 Uso del Sistema

### 1. Crear una Nueva Automatización

#### Opción A: Templates Rápidos
```
1. Ir a /automation-create
2. Seleccionar un template predefinido
3. El formulario se abre con configuración base
4. Personalizar según necesidades
```

#### Opción B: Configuración Avanzada
```
1. Hacer clic en "Nueva Automatización" 
2. Completar wizard de 4 pasos:
   - Tipo y Plataformas
   - Configuración Básica  
   - Horarios y Límites
   - Configuración Avanzada
3. Crear automatización
```

### 2. Gestionar Automatizaciones Existentes
```
- Ver lista en /automation
- Activar/Pausar con botón toggle
- Ver métricas en tiempo real
- Eliminar con confirmación
- Navegar a configuración
```

## 🔧 Integración con n8n

### Creación de Workflows
```javascript
// El sistema automáticamente:
1. Crea workflow en n8n via N8nService
2. Configura webhooks personalizados
3. Establece lógica de procesamiento
4. Activa el workflow
5. Guarda n8nWorkflowId en la automatización
```

### Tipos de Workflows n8n

#### Chatbot Básico
```javascript
{
  nodes: [
    "Webhook" -> "Process Message" -> "Response"
  ],
  logic: "Procesamiento de mensajes con respuestas configuradas"
}
```

#### IA Agent Template  
```javascript
{
  nodes: [
    "Webhook" -> "OpenAI/Claude" -> "Response"
  ],
  logic: "Procesamiento con IA para respuestas inteligentes"
}
```

## 📊 Estructura de Datos

### Modelo Automation
```javascript
{
  _id: ObjectId,
  tenantId: ObjectId,
  name: String,
  description: String,
  type: 'chatbot' | 'social_media' | 'email' | 'workflow' | 'trigger',
  status: 'active' | 'inactive' | 'draft',
  
  config: {
    platforms: ['whatsapp', 'telegram', ...],
    n8nWorkflowId: String,
    n8nWebhookUrl: String,
    defaultResponse: String,
    fallbackResponse: String,
    workingHours: {
      enabled: Boolean,
      timezone: String,
      schedule: [{ day, startTime, endTime, enabled }]
    },
    socialMediaConfig: {
      autoResponse: Boolean,
      responseDelay: Number,
      maxResponsesPerUser: Number,
      blacklistedWords: [String]
    }
  },
  
  metrics: {
    totalInteractions: Number,
    successfulResponses: Number,
    failedResponses: Number,
    avgResponseTime: Number,
    lastExecution: Date
  },
  
  advanced: {
    retryAttempts: Number,
    timeout: Number,
    rateLimiting: {
      enabled: Boolean,
      maxRequests: Number,
      windowMs: Number
    }
  },
  
  createdBy: ObjectId,
  tags: [String],
  timestamps: true
}
```

## 🔗 API Endpoints

### Automatizaciones
```
GET    /api/automation           - Listar automatizaciones
POST   /api/automation           - Crear automatización  
GET    /api/automation/:id       - Obtener automatización
PUT    /api/automation/:id       - Actualizar automatización
DELETE /api/automation/:id       - Eliminar automatización
POST   /api/automation/:id/toggle - Activar/Desactivar
```

### Templates
```
GET    /api/automation/templates - Listar templates
POST   /api/automation/templates/clone - Clonar template
```

## 🎯 Flujo de Trabajo Completo

### 1. Usuario crea automatización
```
Frontend → API → N8nService → n8n → Webhook URL generada
```

### 2. Automatización recibe mensaje
```
Plataforma → Webhook → n8n → Lógica de procesamiento → Respuesta
```

### 3. Métricas se actualizan
```
n8n execution → API callback → Update metrics → Frontend dashboard
```

## 🔐 Seguridad y Validaciones

### Autenticación
- JWT tokens para todas las requests
- Middleware de autenticación en rutas
- Validación de tenantId en cada operación

### Validaciones
- Esquemas de validación con Joi
- Sanitización de datos de entrada
- Rate limiting por automatización
- Timeouts configurables

## 📈 Métricas y Monitoreo

### Métricas Disponibles
```javascript
{
  totalInteractions: "Total de mensajes procesados",
  successfulResponses: "Respuestas exitosas", 
  failedResponses: "Respuestas fallidas",
  avgResponseTime: "Tiempo promedio de respuesta",
  lastExecution: "Última ejecución"
}
```

### Dashboard Stats
- Automatizaciones activas
- Mensajes del día
- Tiempo promedio de respuesta
- Total de workflows

## 🚀 Próximas Funcionalidades

### En Desarrollo
- [ ] IA Predictiva para demanda
- [ ] Chatbot con IA avanzada  
- [ ] Analytics detallado
- [ ] Templates de comunidad
- [ ] Integración con más plataformas

### Roadmap
- [ ] Visual workflow builder
- [ ] A/B testing de respuestas
- [ ] Machine learning para optimización
- [ ] API webhooks personalizados

## 🛠️ Instalación y Configuración

### Variables de Entorno Requeridas
```env
# n8n Configuration
N8N_BASE_URL=http://localhost:5678
N8N_API_KEY=your_n8n_api_key
N8N_WEBHOOK_BASE_URL=http://localhost:5678

# SmartOps API
VITE_API_URL=http://localhost:5000/api
```

### Dependencias
```bash
# Backend
npm install n8n axios mongoose joi

# Frontend  
npm install lucide-react @radix-ui/react-*
```

## 📞 Soporte

Para soporte técnico o consultas sobre el sistema de automatización:
- **Email**: soporte@smartops.com
- **Documentación**: `/docs/automation`
- **API Docs**: `/api/docs` (Swagger)

---

**Versión**: 1.0.0  
**Última actualización**: Enero 2024  
**Autor**: Equipo SmartOps 