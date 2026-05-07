# Módulo de Automatización SmartOps

Este módulo integra SmartOps con n8n para crear flujos de automatización potentes y flexibles.

## 🚀 Características

- **Integración con n8n**: Usa n8n como motor de automatización
- **Flujos Q&A**: Crear conversaciones interactivas 
- **Múltiples Plataformas**: WhatsApp, Telegram, Instagram, Facebook
- **Analytics**: Estadísticas detalladas y métricas de rendimiento
- **Configuración Flexible**: Horarios, respuestas personalizadas, etc.

## 📋 Configuración

### Variables de Entorno

```bash
# Configuración de n8n
N8N_BASE_URL=https://tu-n8n-instance.railway.app
N8N_API_KEY=tu_api_key_aqui
N8N_WEBHOOK_BASE_URL=https://tu-n8n-instance.railway.app
```

### Integración en la API

```javascript
// En tu app.js o donde manejes las rutas
const automationModule = require('./features/automation');

// Registrar rutas
app.use('/api/automation', automationModule.routes);
```

## 🔧 Uso Básico

### 1. Crear una Automatización

```javascript
POST /api/automation/automations
{
  "name": "Chatbot WhatsApp",
  "description": "Bot para atender consultas en WhatsApp",
  "type": "chatbot",
  "config": {
    "platforms": ["whatsapp"],
    "defaultResponse": "¡Hola! ¿En qué puedo ayudarte?",
    "fallbackResponse": "Lo siento, no entendí tu mensaje.",
    "workingHours": {
      "enabled": true,
      "timezone": "America/Mexico_City",
      "schedule": [
        {
          "day": "monday",
          "startTime": "09:00",
          "endTime": "18:00",
          "enabled": true
        }
      ]
    }
  }
}
```

### 2. Crear un Flujo Q&A

```javascript
POST /api/automation/qa-flows
{
  "name": "Consulta de Servicios",
  "automationId": "672abc123def456789",
  "flow": {
    "welcome": {
      "message": "¡Hola! Soy tu asistente virtual. ¿En qué te puedo ayudar?",
      "options": [
        { "text": "Información de servicios", "value": "services", "nextStep": "step1" },
        { "text": "Precios", "value": "pricing", "nextStep": "step2" },
        { "text": "Contacto", "value": "contact", "nextStep": "step3" }
      ]
    },
    "steps": [
      {
        "id": "step1",
        "name": "Información de Servicios",
        "type": "response",
        "response": {
          "text": "Ofrecemos servicios de desarrollo web, marketing digital y automatización. ¿Te interesa alguno en particular?"
        },
        "nextStep": "end"
      }
    ]
  }
}
```

### 3. Procesar Conversación

```javascript
POST /api/automation/qa-flows/672abc123def456789/conversation
{
  "userResponse": "Hola",
  "currentStep": null,
  "sessionId": "user123_session456"
}

// Respuesta:
{
  "success": true,
  "data": {
    "message": "¡Hola! Soy tu asistente virtual. ¿En qué te puedo ayudar?",
    "options": [...],
    "stepId": "welcome",
    "type": "welcome"
  }
}
```

## 📊 Analytics y Estadísticas

### Dashboard General

```javascript
GET /api/automation/automations/stats/dashboard

// Respuesta:
{
  "success": true,
  "data": {
    "summary": {
      "totalAutomations": 5,
      "activeAutomations": 3,
      "inactiveAutomations": 2
    }
  }
}
```

### Estadísticas de Flujo

```javascript
GET /api/automation/qa-flows/672abc123def456789/stats

// Respuesta:
{
  "success": true,
  "data": {
    "overview": {
      "totalStarts": 150,
      "totalCompletions": 120,
      "totalDropoffs": 30,
      "completionRate": 80,
      "dropoffRate": 20,
      "avgCompletionTime": 45
    },
    "stepAnalytics": [...]
  }
}
```

## 🔗 Integración con n8n

### Workflows Automáticos

El sistema puede crear workflows básicos en n8n automáticamente:

```javascript
POST /api/automation/automations
{
  "name": "Mi Chatbot",
  "type": "chatbot",
  "createN8nWorkflow": true,
  "responses": {
    "hola": "¡Hola! ¿Cómo estás?",
    "precios": "Nuestros precios comienzan desde $99 USD",
    "contacto": "Puedes contactarnos al +52 123 456 7890"
  }
}
```

### Webhooks Personalizados

Los flujos pueden triggear webhooks de n8n para integraciones avanzadas:

```javascript
{
  "integrations": {
    "n8n": {
      "webhookUrl": "https://tu-n8n.railway.app/webhook/mi-webhook",
      "triggerOnStart": false,
      "triggerOnEnd": true,
      "sendUserData": true
    }
  }
}
```

## 🛠️ Arquitectura

```
SmartOps Dashboard (Frontend)
       ↓
SmartOps API (Backend)
       ↓
n8n Instance (Railway)
       ↓
Redes Sociales (WhatsApp, Telegram, etc.)
```

## 🎯 Casos de Uso

1. **Chatbot de Atención al Cliente**
   - Respuestas automáticas 24/7
   - Escalamiento a humanos en horarios laborales
   - Integración con CRM

2. **Generación de Leads**
   - Formularios interactivos
   - Calificación automática de leads
   - Notificaciones al equipo de ventas

3. **Soporte Técnico**
   - Troubleshooting automático
   - Base de conocimientos
   - Tickets automáticos

4. **Marketing Automation**
   - Campañas multicanal
   - Segmentación de audiencia
   - Follow-ups automáticos

## 📝 Próximas Funcionalidades

- [ ] Editor visual de flujos (drag & drop)
- [ ] Plantillas predefinidas
- [ ] Inteligencia artificial con GPT
- [ ] Análisis de sentimientos
- [ ] Integración con más plataformas
- [ ] A/B Testing de respuestas 