# 🤖 Módulo de Automatización SmartOps - Guía para Desarrolladores

## 📋 Resumen Ejecutivo

Este módulo integra **SmartOps** con **n8n** para crear chatbots y automatizaciones de redes sociales. Tu dashboard controla la configuración y analytics, mientras n8n procesa los mensajes en tiempo real.

## 🏗️ Arquitectura

### Diagrama de Flujo
```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│   WhatsApp      │───▶│     n8n      │───▶│  SmartOps API   │
│   Instagram     │    │  (Railway)   │    │   (Node.js)     │
│   Telegram      │    │              │    │                 │
└─────────────────┘    └──────────────┘    └─────────────────┘
                              │                       │
                              ▼                       ▼
                       ┌──────────────┐    ┌─────────────────┐
                       │   Webhooks   │    │    MongoDB      │
                       │   Processing │    │   (Database)    │
                       └──────────────┘    └─────────────────┘
```

### Stack Técnico
- **Backend**: Node.js + Express + MongoDB
- **Automatización**: n8n (self-hosted en Railway)
- **Frontend**: React Admin Dashboard
- **APIs**: WhatsApp Business API, Telegram Bot API, etc.

## 📁 Estructura de Archivos

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

## 🔧 Modelos de Datos

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
    fallbackResponse: String,
    
    workingHours: {
      enabled: Boolean,
      timezone: String,    // "America/Mexico_City"
      schedule: [{
        day: String,       // "monday"
        startTime: String, // "09:00"
        endTime: String,   // "18:00"
        enabled: Boolean
      }]
    }
  },
  
  metrics: {
    totalInteractions: Number,
    successfulResponses: Number,
    failedResponses: Number,
    avgResponseTime: Number,    // milliseconds
    lastExecution: Date
  }
}
```

### QAFlow (Flujos de Conversación)
```javascript
const qaFlowSchema = {
  automationId: ObjectId,  // Referencia a Automation
  name: String,            // "Consulta de Servicios"
  
  flow: {
    welcome: {
      message: String,     // "¡Hola! ¿En qué puedo ayudarte?"
      options: [{
        text: String,      // "Ver servicios"
        value: String,     // "services"
        nextStep: String   // "step1"
      }]
    },
    
    steps: [{
      id: String,          // "step1"
      type: String,        // "question" | "response" | "condition" | "end"
      
      // Para preguntas
      question: {
        text: String,
        inputType: String, // "text" | "email" | "choice"
        options: Array,
        validation: Object
      },
      
      // Para respuestas
      response: {
        text: String,
        media: {
          type: String,    // "image" | "video"
          url: String
        }
      },
      
      nextStep: String     // ID del siguiente paso
    }]
  },
  
  stats: {
    totalStarts: Number,
    totalCompletions: Number,
    completionRate: Number,     // Calculado automáticamente
    stepAnalytics: Array
  }
}
```

## 🌐 API Endpoints

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
Query params: ?automationId=xxx&status=active

// Crear flujo
POST /api/features/automation/qa-flows
Body: { name, automationId, flow }

// Procesar conversación (endpoint público)
POST /api/features/automation/qa-flows/:id/conversation
Body: { userResponse, currentStep, sessionId }

// Estadísticas del flujo
GET /api/features/automation/qa-flows/:id/stats
```

## 🔄 Flujo de Procesamiento

### 1. Usuario Envía Mensaje
```
Usuario escribe "Hola" en WhatsApp
     ↓
WhatsApp Business API detecta mensaje
     ↓
Webhook enviado a n8n
```

### 2. n8n Procesa Mensaje
```javascript
// Workflow n8n recibe:
{
  "message": { "text": "Hola" },
  "from": "+521234567890",
  "platform": "whatsapp"
}

// Function node procesa:
const response = findResponse(message.text);
return { 
  from: message.from, 
  response: response,
  platform: "whatsapp"
};
```

### 3. n8n Llama a SmartOps API
```javascript
// HTTP Request node:
POST /api/features/automation/qa-flows/{flowId}/conversation
{
  "userResponse": "Hola",
  "currentStep": null,
  "sessionId": "whatsapp_+521234567890"
}
```

### 4. SmartOps Procesa Flujo
```javascript
// En qaFlowController.js
async processConversation(req, res) {
  const { userResponse, currentStep, sessionId } = req.body;
  const flow = await QAFlow.findById(flowId);
  
  let response;
  
  if (!currentStep) {
    // Iniciar conversación
    response = {
      message: flow.flow.welcome.message,
      options: flow.flow.welcome.options,
      stepId: "welcome",
      type: "welcome"
    };
    await flow.updateStats('start');
  } else {
    // Buscar siguiente paso
    const nextStep = flow.getNextStep(currentStep, userResponse);
    response = processStep(nextStep);
  }
  
  res.json({ success: true, data: response });
}
```

### 5. n8n Envía Respuesta
```javascript
// HTTP Request node envía a WhatsApp:
POST https://graph.facebook.com/v18.0/{phone-id}/messages
{
  "messaging_product": "whatsapp",
  "to": "+521234567890",
  "text": { "body": response.message }
}
```

## 🧠 Lógica de Navegación

### Algoritmo de Siguiente Paso
```javascript
// En QAFlow.js
getNextStep(currentStepId, userResponse) {
  const currentStep = this.flow.steps.find(s => s.id === currentStepId);
  
  if (currentStep.type === 'condition') {
    // Evaluar condición
    const { operator, value, trueStep, falseStep } = currentStep.condition;
    let result = false;
    
    switch (operator) {
      case 'equals':
        result = userResponse === value;
        break;
      case 'contains':
        result = userResponse.toLowerCase().includes(value.toLowerCase());
        break;
      case 'regex':
        result = new RegExp(value).test(userResponse);
        break;
    }
    
    const nextStepId = result ? trueStep : falseStep;
    return this.flow.steps.find(s => s.id === nextStepId);
  }
  
  // Flujo lineal
  return this.flow.steps.find(s => s.id === currentStep.nextStep);
}
```

## 📊 Sistema de Analytics

### Métricas Automáticas
```javascript
// Cada interacción actualiza métricas
await automation.updateMetrics(
  success: true,
  responseTime: 1500,  // ms
  error: null
);

// Se calcula automáticamente:
// - Tasa de éxito (%)
// - Tiempo promedio de respuesta
// - Total de interacciones
// - Última ejecución
```

### Analytics por Paso
```javascript
// Tracking granular en QAFlow
await flow.updateStats('start', 'welcome', timeSpent);
await flow.updateStats('dropout', 'step2', timeSpent);
await flow.updateStats('complete', 'end', totalTime);

// Genera métricas como:
// - Conversiones por paso
// - Puntos de abandono
// - Tiempo en cada paso
```

## 🔧 Servicio n8n

### Cliente HTTP
```javascript
class N8nService {
  constructor() {
    this.baseURL = process.env.N8N_BASE_URL;
    this.apiKey = process.env.N8N_API_KEY;
    this.client = axios.create({
      baseURL: `${this.baseURL}/api/v1`,
      headers: { 'X-N8N-API-KEY': this.apiKey }
    });
  }

  // Gestión workflows
  async getWorkflows() { /* ... */ }
  async createWorkflow(data) { /* ... */ }
  async toggleWorkflow(id, active) { /* ... */ }
  
  // Ejecuciones
  async executeWorkflow(id, inputData) { /* ... */ }
  async getExecutions(workflowId, options) { /* ... */ }
  
  // Webhooks
  createWebhookUrl(workflowId, path) { /* ... */ }
  async triggerWebhook(url, data) { /* ... */ }
  
  // Chatbots específicos
  async createChatbotWorkflow(config) { /* ... */ }
  generateChatbotLogic(config) { /* ... */ }
}
```

## 🚀 Casos de Uso

### 1. Chatbot Básico
```javascript
// Crear automatización
const automation = await Automation.create({
  name: "Bot WhatsApp Soporte",
  type: "chatbot",
  config: {
    platforms: ["whatsapp"],
    defaultResponse: "¡Hola! ¿En qué puedo ayudarte?",
    fallbackResponse: "Lo siento, no entendí tu mensaje."
  }
});

// n8n workflow automático con respuestas predefinidas
const responses = {
  "hola": "¡Hola! ¿Cómo estás?",
  "precios": "Nuestros precios desde $99 USD",
  "contacto": "Llámanos al +52 123 456 7890"
};
```

### 2. Generación de Leads
```javascript
// Flujo Q&A para capturar datos
const leadFlow = await QAFlow.create({
  name: "Captura de Leads",
  automationId: automation._id,
  flow: {
    welcome: {
      message: "¡Hola! Para ayudarte mejor, necesito algunos datos.",
      options: [{ text: "Continuar", value: "continue", nextStep: "step1" }]
    },
    steps: [
      {
        id: "step1",
        type: "question",
        question: {
          text: "¿Cuál es tu nombre?",
          inputType: "text",
          validation: { required: true }
        },
        nextStep: "step2"
      },
      {
        id: "step2",
        type: "question", 
        question: {
          text: "¿Tu email?",
          inputType: "email",
          validation: { required: true }
        },
        nextStep: "step3"
      },
      {
        id: "step3",
        type: "action",
        action: {
          type: "create_lead",
          config: { source: "whatsapp_bot" }
        },
        nextStep: "end"
      }
    ]
  }
});
```

### 3. Lógica Condicional
```javascript
// Flujo con ramificación
{
  id: "check_budget",
  type: "condition",
  condition: {
    variable: "budget",
    operator: "greater",
    value: "1000",
    trueStep: "premium_flow",
    falseStep: "basic_flow"
  }
}
```

## 🔒 Seguridad

### Autenticación
```javascript
// Endpoints protegidos
router.get('/automations', authenticate, authorize(['admin', 'user']));

// Endpoint público para webhooks
router.post('/qa-flows/:id/conversation', qaFlowController.processConversation);
```

### Validación Multi-Tenant
```javascript
// Automático en todos los queries
const { tenantId } = req.user;
const automations = await Automation.find({ tenantId });
```

## ⚙️ Configuración

### Variables de Entorno
```bash
# n8n Integration
N8N_BASE_URL=https://tu-n8n.railway.app
N8N_API_KEY=tu_secret_api_key
N8N_WEBHOOK_BASE_URL=https://tu-n8n.railway.app

# External APIs
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_API_TOKEN=tu_whatsapp_token
TELEGRAM_BOT_TOKEN=tu_telegram_token
```

### Instalación
```bash
npm install axios express-validator
```

## 📈 Optimizaciones

### Índices MongoDB
```javascript
// Automatización
{ tenantId: 1, type: 1 }
{ tenantId: 1, status: 1 }
{ 'config.n8nWorkflowId': 1 }

// QAFlow
{ tenantId: 1, status: 1 }
{ automationId: 1 }
```

### Rate Limiting
```javascript
// En config de automatización
advanced: {
  rateLimiting: {
    enabled: true,
    maxRequests: 100,
    windowMs: 60000  // 100 req/min
  }
}
```

## 🧪 Testing

### Probar Endpoints
```bash
# Crear automatización
curl -X POST http://localhost:3000/api/features/automation/automations \
  -H "Authorization: Bearer jwt_token" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Bot", "type": "chatbot"}'

# Simular conversación
curl -X POST http://localhost:3000/api/features/automation/qa-flows/ID/conversation \
  -H "Content-Type: application/json" \
  -d '{"userResponse": "hola", "sessionId": "test123"}'
```

### Probar n8n
```bash
# Health check
curl -H "X-N8N-API-KEY: tu_key" \
  https://tu-n8n.railway.app/api/v1/workflows
```

## 📚 Documentación API

Accede a la documentación completa en Swagger:
```
http://localhost:3000/api-docs
```

### Endpoints principales:
- `GET /automations` - Listar bots
- `POST /automations` - Crear bot
- `POST /qa-flows` - Crear flujo de conversación
- `POST /qa-flows/:id/conversation` - Procesar mensaje (webhook)

## 🎯 Beneficios

1. **Separación clara**: Dashboard para UI, n8n para procesamiento
2. **Escalabilidad**: n8n maneja miles de mensajes concurrentes
3. **Flexibilidad**: Fácil agregar nuevas plataformas
4. **Analytics**: Métricas detalladas automáticas
5. **Multi-tenant**: Aislamiento completo por tenant

## 🚀 Próximos Pasos

1. Configura variables de entorno
2. Conecta tu instancia n8n de Railway
3. Crea tu primera automatización desde el dashboard
4. Importa el workflow de ejemplo
5. ¡Comienza a recibir mensajes automáticamente!

¡Ya tienes todo listo para crear chatbots increíbles! 🎉 