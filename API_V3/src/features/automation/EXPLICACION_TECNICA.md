# 🤖 Módulo de Automatización SmartOps - Explicación Técnica

## 🎯 Objetivo del Módulo

Este módulo permite crear **chatbots inteligentes** y **flujos de automatización** que se integran con **n8n** como motor de procesamiento, mientras mantienes el control total desde tu dashboard SmartOps.

## 🏗️ Arquitectura Técnica

### Flujo de Datos
```
Usuario (WhatsApp/Telegram/Instagram) 
    ↓ webhook
n8n Instance (Railway) 
    ↓ HTTP Request
SmartOps API (/automation endpoints)
    ↓ MongoDB operations
Database (Automatizaciones & Q&A Flows)
    ↓ Response data
Frontend Dashboard (React Admin)
```

### Componentes Principales

#### 1. **Modelos de Datos (MongoDB)**

**`Automation.js`** - Modelo principal:
```javascript
// Estructura básica
{
  tenantId: ObjectId,           // Multi-tenant
  name: "Chatbot WhatsApp",     // Nombre descriptivo
  type: "chatbot",              // Tipo: chatbot, social_media, email, workflow
  status: "active",             // Estado: active, inactive, draft
  
  config: {
    platforms: ["whatsapp"],     // Plataformas soportadas
    n8nWorkflowId: "uuid",       // ID del workflow en n8n
    n8nWebhookUrl: "https://...", // URL del webhook
    defaultResponse: "¡Hola!",   // Respuesta por defecto
    
    workingHours: {              // Horarios de funcionamiento
      enabled: true,
      timezone: "America/Mexico_City",
      schedule: [...]
    },
    
    socialMediaConfig: {         // Configuración redes sociales
      autoResponse: true,
      responseDelay: 2,          // segundos
      maxResponsesPerUser: 10
    }
  },
  
  metrics: {                     // Métricas automáticas
    totalInteractions: 1250,
    successfulResponses: 1180,
    failedResponses: 70,
    avgResponseTime: 1500        // ms
  }
}
```

**`QAFlow.js`** - Flujos de conversación:
```javascript
// Estructura del flujo
{
  automationId: ObjectId,        // Referencia a Automation
  name: "Consulta Servicios",
  
  flow: {
    welcome: {
      message: "¡Hola! ¿En qué puedo ayudarte?",
      options: [
        { text: "Servicios", value: "services", nextStep: "step1" },
        { text: "Precios", value: "pricing", nextStep: "step2" }
      ]
    },
    
    steps: [
      {
        id: "step1",
        type: "question",          // question, response, condition, action, end
        question: {
          text: "¿Qué servicio te interesa?",
          inputType: "choice",     // text, number, email, choice
          options: [...],
          validation: { required: true }
        },
        nextStep: "step2"
      },
      {
        id: "step2", 
        type: "response",
        response: {
          text: "Perfecto! Te contactaremos pronto.",
          media: { type: "image", url: "..." }
        },
        nextStep: "end"
      }
    ]
  },
  
  stats: {                       // Analytics automáticos
    totalStarts: 150,
    totalCompletions: 120,
    completionRate: 80,          // Calculado automáticamente
    stepAnalytics: [...]         // Por cada paso
  }
}
```

#### 2. **Servicio de Integración n8n**

**`N8nService.js`** - Cliente HTTP para n8n:
```javascript
class N8nService {
  constructor() {
    this.baseURL = process.env.N8N_BASE_URL;
    this.apiKey = process.env.N8N_API_KEY;
    this.client = axios.create({...});
  }

  // Gestión de workflows
  async getWorkflows()          // Listar todos
  async getWorkflow(id)         // Obtener uno específico
  async createWorkflow(data)    // Crear nuevo
  async updateWorkflow(id, data) // Actualizar
  async deleteWorkflow(id)      // Eliminar
  async toggleWorkflow(id, active) // Activar/Desactivar

  // Ejecuciones
  async executeWorkflow(id, data) // Ejecutar manualmente
  async getExecutions(id, options) // Historial
  
  // Webhooks
  createWebhookUrl(workflowId, path) // Generar URL
  async triggerWebhook(url, data)    // Disparar webhook
  
  // Chatbots específicos
  async createChatbotWorkflow(config) // Crear bot automático
  generateChatbotLogic(config)        // Generar lógica JS
  
  // Analytics
  async getWorkflowStats(id, days)    // Estadísticas
  async healthCheck()                 // Estado de n8n
}
```

#### 3. **Controladores**

**`automationController.js`** - CRUD de automatizaciones:
```javascript
// Endpoints principales
getAutomations()        // GET /automations (con filtros y paginación)
createAutomation()      // POST /automations (crea + n8n workflow opcional)
getDashboardStats()     // GET /automations/stats/dashboard
```

**`qaFlowController.js`** - Gestión de flujos Q&A:
```javascript
// Endpoints principales
getQAFlows()           // GET /qa-flows 
createQAFlow()         // POST /qa-flows
getQAFlow(id)          // GET /qa-flows/:id
updateQAFlow(id)       // PUT /qa-flows/:id
deleteQAFlow(id)       // DELETE /qa-flows/:id
processConversation(id) // POST /qa-flows/:id/conversation (público)
getFlowStats(id)       // GET /qa-flows/:id/stats
```

## 🔧 Funcionamiento Paso a Paso

### 1. **Crear una Automatización**
```javascript
// Frontend envía
POST /api/features/automation/automations
{
  name: "Bot WhatsApp Ventas",
  type: "chatbot",
  config: {
    platforms: ["whatsapp"],
    defaultResponse: "¡Hola! ¿En qué puedo ayudarte?"
  }
}

// Backend:
1. Valida datos de entrada
2. Crea registro en MongoDB (Automation)
3. Opcionalmente crea workflow en n8n
4. Retorna automatización creada con ID de n8n
```

### 2. **Crear Flujo Q&A**
```javascript
// Frontend envía
POST /api/features/automation/qa-flows
{
  automationId: "672abc...",
  name: "Flujo Ventas",
  flow: {
    welcome: { message: "¡Hola!", options: [...] },
    steps: [...]
  }
}

// Backend:
1. Verifica que la automatización existe
2. Valida estructura del flujo
3. Crea QAFlow en MongoDB
4. Retorna flujo creado
```

### 3. **Procesamiento de Conversación** (El corazón del sistema)
```javascript
// Webhook desde n8n o llamada directa
POST /api/features/automation/qa-flows/672def.../conversation
{
  userResponse: "servicios",
  currentStep: "welcome", 
  sessionId: "user123_456"
}

// Lógica del controlador:
async processConversation(req, res) {
  const { userResponse, currentStep, sessionId } = req.body;
  const flow = await QAFlow.findById(id);
  
  let nextStep, response;
  
  if (!currentStep) {
    // Iniciar conversación
    response = flow.flow.welcome;
    await flow.updateStats('start');
  } else {
    // Buscar siguiente paso
    nextStep = flow.getNextStep(currentStep, userResponse);
    
    switch (nextStep.type) {
      case 'question':
        response = {
          message: nextStep.question.text,
          inputType: nextStep.question.inputType,
          options: nextStep.question.options
        };
        break;
        
      case 'response':
        response = { message: nextStep.response.text };
        break;
        
      case 'end':
        response = { message: flow.settings.endMessage, completed: true };
        await flow.updateStats('complete');
        break;
    }
  }
  
  // Triggear n8n si está configurado
  if (flow.integrations.n8n.enabled) {
    await N8nService.triggerWebhook(flow.integrations.n8n.webhookUrl, {
      flowId: flow._id,
      sessionId,
      userResponse,
      nextStep: response.stepId
    });
  }
  
  res.json({ success: true, data: response });
}
```

### 4. **Algoritmo de Navegación en Flujos**
```javascript
// Método en QAFlow.js
getNextStep(currentStepId, userResponse) {
  const currentStep = this.flow.steps.find(step => step.id === currentStepId);
  
  if (currentStep.type === 'condition') {
    // Evaluar condición
    const condition = currentStep.condition;
    let result = false;
    
    switch (condition.operator) {
      case 'equals':
        result = userResponse === condition.value;
        break;
      case 'contains':
        result = userResponse.includes(condition.value);
        break;
      case 'regex':
        result = new RegExp(condition.value).test(userResponse);
        break;
    }
    
    const nextStepId = result ? condition.trueStep : condition.falseStep;
    return this.flow.steps.find(step => step.id === nextStepId);
  }
  
  // Para otros tipos, seguir flujo lineal
  return this.flow.steps.find(step => step.id === currentStep.nextStep);
}
```

## 🌐 Integración con n8n

### Flujo de Creación Automática de Workflows
1. **Frontend**: Usuario crea automatización tipo "chatbot"
2. **Backend**: `createAutomation()` detecta `type: "chatbot"`
3. **N8nService**: Genera workflow automáticamente:
   ```javascript
   createChatbotWorkflow({
     name: "SmartOps Bot",
     webhookPath: `smartops-${automationId}`,
     responses: { "hola": "¡Hola! ¿Cómo estás?" }
   })
   ```
4. **n8n**: Recibe workflow con nodes:
   - **Webhook**: Recibe mensajes
   - **Function**: Procesa con lógica JavaScript generada
   - **HTTP Request**: Llama de vuelta a SmartOps API
   - **Response**: Envía respuesta al usuario

### Ejemplo de Workflow n8n Generado
```json
{
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": { "path": "smartops-672abc..." }
    },
    {
      "name": "Process Message", 
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": `
          const message = $json.message?.text || '';
          const responses = {"hola": "¡Hola!"};
          
          let response = 'No entendí';
          for (const [key, value] of Object.entries(responses)) {
            if (message.toLowerCase().includes(key)) {
              response = value;
              break;
            }
          }
          
          return { response, from: $json.from };
        `
      }
    },
    {
      "name": "Send Response",
      "type": "n8n-nodes-base.httpRequest", 
      "parameters": {
        "url": "https://whatsapp-api.com/send",
        "method": "POST",
        "body": { "to": "{{$json.from}}", "message": "{{$json.response}}" }
      }
    }
  ]
}
```

## 📊 Sistema de Analytics

### Métricas Automáticas
```javascript
// En Automation model
updateMetrics(success, responseTime, error) {
  this.metrics.totalInteractions += 1;
  
  if (success) {
    this.metrics.successfulResponses += 1;
    // Calcular tiempo promedio
    this.metrics.avgResponseTime = 
      (this.metrics.avgResponseTime * (successful - 1) + responseTime) / successful;
  } else {
    this.metrics.failedResponses += 1;
    this.metrics.lastError = { message: error.message, timestamp: new Date() };
  }
  
  this.metrics.lastExecution = new Date();
  return this.save();
}

// Virtual calculado
get successRate() {
  if (this.metrics.totalInteractions === 0) return 0;
  return (this.metrics.successfulResponses / this.metrics.totalInteractions) * 100;
}
```

### Analytics por Paso (QAFlow)
```javascript
// Tracking granular
updateStats(event, stepId, timeSpent) {
  switch (event) {
    case 'start': this.stats.totalStarts += 1; break;
    case 'complete': this.stats.totalCompletions += 1; break; 
    case 'dropout': this.stats.totalDropoffs += 1; break;
  }
  
  if (stepId) {
    let stepStat = this.stats.stepAnalytics.find(s => s.stepId === stepId);
    if (!stepStat) {
      stepStat = { stepId, visits: 0, dropoffs: 0, avgTimeSpent: 0 };
      this.stats.stepAnalytics.push(stepStat);
    }
    
    stepStat.visits += 1;
    if (event === 'dropout') stepStat.dropoffs += 1;
    if (timeSpent) stepStat.avgTimeSpent = (stepStat.avgTimeSpent + timeSpent) / 2;
  }
}
```

## 🔒 Seguridad y Autenticación

### Endpoints Protegidos
```javascript
// Requieren JWT token
router.get('/automations', authenticate, authorize(['admin', 'user']));
router.post('/automations', authenticate, authorize(['admin']));

// Endpoint público (webhooks)
router.post('/qa-flows/:id/conversation', qaFlowController.processConversation);
```

### Validación Multi-Tenant
```javascript
// Todos los queries incluyen tenantId automáticamente
const { tenantId } = req.user;
const automations = await Automation.find({ tenantId });
```

## 🚀 Casos de Uso Técnicos

### 1. **Chatbot Básico**
```javascript
// Configuración simple
{
  type: "chatbot",
  config: {
    platforms: ["whatsapp"],
    responses: {
      "hola": "¡Hola! ¿Cómo estás?",
      "precios": "Nuestros precios desde $99",
      "contacto": "Llámanos al +123456789"
    }
  }
}
```

### 2. **Flujo de Captura de Leads**
```javascript
// Q&A Flow estructurado
{
  flow: {
    welcome: { message: "¡Hola! Necesito algunos datos..." },
    steps: [
      {
        id: "step1",
        type: "question",
        question: { text: "¿Cuál es tu nombre?", inputType: "text" },
        nextStep: "step2"
      },
      {
        id: "step2", 
        type: "question",
        question: { text: "¿Tu email?", inputType: "email" },
        nextStep: "step3"
      },
      {
        id: "step3",
        type: "action",
        action: { type: "create_lead", config: {...} },
        nextStep: "end"
      }
    ]
  }
}
```

### 3. **Lógica Condicional**
```javascript
// Paso con condición
{
  id: "check_age",
  type: "condition",
  condition: {
    variable: "userAge",
    operator: "greater", 
    value: "18",
    trueStep: "adult_flow",
    falseStep: "minor_flow"
  }
}
```

## 🛠️ Configuración de Desarrollo

### Variables de Entorno
```bash
# n8n Configuration
N8N_BASE_URL=https://tu-n8n.railway.app
N8N_API_KEY=tu_api_key_secreto
N8N_WEBHOOK_BASE_URL=https://tu-n8n.railway.app

# SmartOps API
SMARTOPS_API_URL=https://tu-api.com
SMARTOPS_API_TOKEN=jwt_token_para_n8n

# WhatsApp Business API (ejemplo)
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_API_TOKEN=tu_whatsapp_token
```

### Instalación
```bash
cd SmartOps_Api_V3
npm install axios              # Para peticiones HTTP a n8n
npm install express-validator  # Validaciones (si no está)
```

### Testing
```bash
# Probar conexión con n8n
curl -H "X-N8N-API-KEY: tu_key" https://tu-n8n.railway.app/api/v1/workflows

# Probar endpoint de conversación
curl -X POST http://localhost:3000/api/features/automation/qa-flows/672abc.../conversation \
  -H "Content-Type: application/json" \
  -d '{"userResponse": "hola", "sessionId": "test123"}'
```

## 📈 Optimizaciones y Rendimiento

### Índices MongoDB
```javascript
// En Automation.js
automationSchema.index({ tenantId: 1, type: 1 });
automationSchema.index({ tenantId: 1, status: 1 });
automationSchema.index({ 'config.n8nWorkflowId': 1 });

// En QAFlow.js  
qaFlowSchema.index({ tenantId: 1, status: 1 });
qaFlowSchema.index({ automationId: 1 });
```

### Caché y Rate Limiting
```javascript
// En n8nService.js
constructor() {
  this.client = axios.create({
    timeout: 30000,                    // 30s timeout
    // Rate limiting por defecto en headers
  });
}

// En Automation config
advanced: {
  rateLimiting: {
    enabled: true,
    maxRequests: 100,
    windowMs: 60000                    // 100 req/min
  }
}
```

## 🔄 Flujo Completo de Ejemplo

1. **Usuario**: Envía "Hola" por WhatsApp
2. **WhatsApp API**: Webhook a n8n
3. **n8n Workflow**: Procesa mensaje, llama a SmartOps API
4. **SmartOps API**: `processConversation()` evalúa flujo Q&A
5. **MongoDB**: Busca siguiente paso, actualiza estadísticas
6. **SmartOps API**: Retorna respuesta JSON
7. **n8n**: Procesa respuesta, envía a WhatsApp API
8. **WhatsApp**: Entrega mensaje al usuario
9. **Analytics**: Se actualizan métricas en tiempo real

## 🎯 Beneficios Técnicos

- **Separación de Responsabilidades**: SmartOps = UI/Data, n8n = Processing
- **Escalabilidad**: n8n puede manejar miles de mensajes concurrentes
- **Flexibilidad**: Fácil agregar nuevas plataformas
- **Observabilidad**: Métricas detalladas en ambos sistemas
- **Multi-tenant**: Completamente aislado por tenant
- **Extensibilidad**: Fácil agregar nuevos tipos de automación

Este módulo te da el poder de n8n con la simplicidad de tu dashboard SmartOps! 🚀 

🤖 Automatización:
• GET    /api/features/automation/automations
• POST   /api/features/automation/automations  
• GET    /api/features/automation/automations/stats/dashboard

❓ Flujos Q&A:
• GET    /api/features/automation/qa-flows
• POST   /api/features/automation/qa-flows
• GET    /api/features/automation/qa-flows/{id}
• PUT    /api/features/automation/qa-flows/{id}
• DELETE /api/features/automation/qa-flows/{id}
• POST   /api/features/automation/qa-flows/{id}/conversation (público)
• GET    /api/features/automation/qa-flows/{id}/stats 