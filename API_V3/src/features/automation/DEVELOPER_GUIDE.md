# Módulo de Automatización SmartOps - Guía para Desarrolladores

## Resumen Ejecutivo

Este módulo integra **SmartOps** con **n8n** para crear chatbots y automatizaciones de redes sociales. Tu dashboard controla la configuración y analytics, mientras n8n procesa los mensajes en tiempo real.

## Arquitectura

### Diagrama de Flujo
```
Usuario (WhatsApp/Telegram) → n8n (Railway) → SmartOps API → MongoDB
```

### Stack Técnico
- **Backend**: Node.js + Express + MongoDB
- **Automatización**: n8n (self-hosted en Railway)
- **Frontend**: React Admin Dashboard
- **APIs**: WhatsApp Business API, Telegram Bot API, etc.

## Estructura de Archivos

```
src/features/automation/
├── models/
│   ├── Automation.js      # Configuración de bots
│   └── QAFlow.js         # Flujos de conversación
├── services/
│   └── N8nService.js     # Cliente para n8n API
├── controllers/
│   ├── automationController.js
│   └── qaFlowController.js
├── routes.js             # Endpoints REST
└── examples/
    └── whatsapp-chatbot-workflow.json
```

## Modelos de Datos

### Automation (Configuración del Bot)
```javascript
const automationSchema = {
  tenantId: ObjectId,      // Multi-tenant isolation
  name: String,            // "Chatbot WhatsApp Ventas"
  type: String,            // "chatbot" | "social_media" | "email"
  status: String,          // "active" | "inactive" | "draft"
  
  config: {
    platforms: [String],   // ["whatsapp", "telegram"]
    n8nWorkflowId: String, // UUID del workflow en n8n
    n8nWebhookUrl: String, // URL del webhook
    defaultResponse: String,
    fallbackResponse: String
  },
  
  metrics: {
    totalInteractions: Number,
    successfulResponses: Number,
    failedResponses: Number,
    avgResponseTime: Number    // milliseconds
  }
}
```

## API Endpoints

### Automatizaciones
```javascript
// Listar automatizaciones
GET /api/features/automation/automations
Query params: ?type=chatbot&status=active&page=1&limit=10

// Crear automatización
POST /api/features/automation/automations
Body: { name, type, config }

// Estadísticas del dashboard
GET /api/features/automation/automations/stats/dashboard
```

### Flujos Q&A
```javascript
// Listar flujos
GET /api/features/automation/qa-flows

// Crear flujo
POST /api/features/automation/qa-flows
Body: { name, automationId, flow }

// Procesar conversación (endpoint público)
POST /api/features/automation/qa-flows/:id/conversation
Body: { userResponse, currentStep, sessionId }
```

## Flujo de Procesamiento

1. **Usuario Envía Mensaje** → WhatsApp detecta → Webhook a n8n
2. **n8n Procesa** → Lógica JavaScript → Llama SmartOps API
3. **SmartOps Procesa** → Busca flujo Q&A → Retorna siguiente paso
4. **n8n Responde** → Envía mensaje a usuario

## Casos de Uso

### 1. Chatbot Básico
```javascript
const automation = await Automation.create({
  name: "Bot WhatsApp Soporte",
  type: "chatbot",
  config: {
    platforms: ["whatsapp"],
    defaultResponse: "¡Hola! ¿En qué puedo ayudarte?"
  }
});
```

### 2. Generación de Leads
```javascript
const leadFlow = await QAFlow.create({
  name: "Captura de Leads",
  flow: {
    welcome: { message: "¡Hola! Para ayudarte mejor, necesito algunos datos." },
    steps: [
      { id: "step1", type: "question", question: { text: "¿Cuál es tu nombre?" }},
      { id: "step2", type: "question", question: { text: "¿Tu email?" }}
    ]
  }
});
```

## Configuración

### Variables de Entorno
```bash
N8N_BASE_URL=https://tu-n8n.railway.app
N8N_API_KEY=tu_secret_api_key
WHATSAPP_API_TOKEN=tu_whatsapp_token
```

## Documentación API

Accede a la documentación completa en Swagger:
```
http://localhost:3000/api-docs
```

## Beneficios

1. **Separación clara**: Dashboard para UI, n8n para procesamiento
2. **Escalabilidad**: n8n maneja miles de mensajes concurrentes
3. **Analytics**: Métricas detalladas automáticas
4. **Multi-tenant**: Aislamiento completo por tenant

¡Ya tienes todo listo para crear chatbots increíbles! 🎉 