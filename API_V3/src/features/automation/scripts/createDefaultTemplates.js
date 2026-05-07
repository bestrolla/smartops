require('dotenv').config();
const mongoose = require('mongoose');
const Template = require('../models/Template');
const N8nServiceClass = require('../services/N8nService');
const N8nService = new N8nServiceClass();
const logger = require('../../../shared/logger');

// Conectar a MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/smartops');

/**
 * Crear templates por defecto en la base de datos
 */
async function createDefaultTemplates() {
  try {
    logger.info('Iniciando creación de templates por defecto...');

    // Template 1: Agente de Ventas con IA
    const salesAgentTemplate = await createSalesAgentTemplate();
    
    // Template 2: Soporte Técnico con IA
    const supportTemplate = await createSupportTemplate();
    
    // Template 3: Asistente de Citas con IA
    const appointmentTemplate = await createAppointmentTemplate();
    
    // Template 4: Bot E-commerce con IA
    const ecommerceTemplate = await createEcommerceTemplate();
    
    // Template 5: FAQ Básico (sin IA)
    const faqTemplate = await createBasicFAQTemplate();
    
    // Template 6: Consulta Médica con IA
    const medicalTemplate = await createMedicalConsultTemplate();
    
    // Template 7: Asesor Financiero con IA
    const financialTemplate = await createFinancialAdvisorTemplate();

    logger.info('Templates creados exitosamente:', {
      salesAgent: salesAgentTemplate._id,
      support: supportTemplate._id,
      appointment: appointmentTemplate._id,
      ecommerce: ecommerceTemplate._id,
      faq: faqTemplate._id,
      medical: medicalTemplate._id,
      financial: financialTemplate._id
    });

    process.exit(0);

  } catch (error) {
    logger.error('Error creando templates:', error);
    process.exit(1);
  }
}

/**
 * Crear template de agente de ventas con IA
 */
async function createSalesAgentTemplate() {
  // Configuración para el nuevo nodo AI Agent
  const workflowConfig = {
    name: 'Agente de Ventas IA',
    clientName: 'Cliente',
    tenantId: 'default',
    description: 'Workflow para agente de ventas inteligente con AI Agent',
    systemPrompt: `Eres un experto vendedor para {{CLIENT_NAME}}. Tu objetivo es:

1. Calificar leads preguntando sobre necesidades y presupuesto
2. Proporcionar información de productos de manera persuasiva  
3. Agendar demos o reuniones con prospects calificados
4. Usar herramientas para obtener información actualizada
5. Mantener contexto conversacional
6. Siempre ser amigable, profesional y orientado a resultados

Información de la empresa: {{COMPANY_INFO}}
Productos disponibles: {{PRODUCTS_INFO}}
Horarios de atención: {{BUSINESS_HOURS}}
Información de contacto: {{CONTACT_INFO}}

Recuerda: Tu rol es generar ventas, pero siempre de manera ética y profesional.`,
    
    aiModel: 'gpt-4',
    temperature: 0.7,
    maxTokens: 800,
    platforms: ['whatsapp', 'webchat', 'telegram'],
    webhookPath: 'sales-agent',
    
    tools: [
      {
        name: 'get_products',
        description: 'Obtener información actualizada de productos y servicios disponibles',
        type: 'function',
        parameters: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              description: 'Categoría de producto a consultar'
            },
            priceRange: {
              type: 'string',
              description: 'Rango de precios de interés'
            }
          }
        }
      },
      {
        name: 'check_availability',
        description: 'Verificar disponibilidad de productos o servicios',
        type: 'function',
        parameters: {
          type: 'object',
          properties: {
            productId: {
              type: 'string',
              description: 'ID del producto a verificar'
            },
            quantity: {
              type: 'number',
              description: 'Cantidad requerida'
            }
          }
        }
      },
      {
        name: 'get_prices',
        description: 'Consultar precios actuales y ofertas especiales',
        type: 'function',
        parameters: {
          type: 'object',
          properties: {
            products: {
              type: 'array',
              items: { type: 'string' },
              description: 'Lista de productos para cotizar'
            }
          }
        }
      },
      {
        name: 'book_appointment',
        description: 'Agendar reunión de ventas con el cliente',
        type: 'function',
        parameters: {
          type: 'object',
          properties: {
            clientName: {
              type: 'string',
              description: 'Nombre del cliente'
            },
            contactInfo: {
              type: 'string',
              description: 'Email o teléfono del cliente'
            },
            preferredDate: {
              type: 'string',
              description: 'Fecha preferida para la reunión'
            },
            topics: {
              type: 'array',
              items: { type: 'string' },
              description: 'Temas a tratar en la reunión'
            }
          },
          required: ['clientName', 'contactInfo']
        }
      }
    ]
  };

  const n8nWorkflow = await N8nService.createAIAgentTemplate(workflowConfig);

  // Crear template en MongoDB
  const template = new Template({
    name: 'Agente de Ventas con IA',
    description: 'Chatbot inteligente para calificar leads y procesar ventas usando GPT-4. Incluye memoria conversacional, herramientas de ventas y análisis de intención. Ideal para empresas que quieren automatizar su proceso de ventas inicial.',
    category: 'ai-agent',
    difficulty: 'advanced',
    n8nWorkflowId: n8nWorkflow.id,
    
    aiConfig: {
      enabled: true,
      model: 'gpt-4',
      systemPrompt: 'Eres un experto vendedor para {{CLIENT_NAME}}. Tu objetivo es:\n1. Calificar leads preguntando sobre necesidades y presupuesto\n2. Proporcionar información de productos de manera persuasiva\n3. Agendar demos o reuniones con prospects calificados\n4. Usar herramientas para obtener información actualizada\n5. Mantener contexto conversacional\n6. Siempre ser amigable, profesional y orientado a resultados\n\nInfo de la empresa: {{COMPANY_INFO}}\nProductos: {{PRODUCTS_INFO}}\nHorarios: {{BUSINESS_HOURS}}',
      temperature: 0.7,
      maxTokens: 800,
      features: ['conversation-memory', 'intent-recognition', 'entity-extraction']
    },

    platforms: ['whatsapp', 'webchat', 'telegram'],

    variables: [
      {
        name: 'CLIENT_NAME',
        label: 'Nombre de la empresa',
        type: 'text',
        required: true,
        description: 'Nombre comercial de tu empresa',
        defaultValue: 'Mi Empresa'
      },
      {
        name: 'COMPANY_INFO',
        label: 'Información de la empresa',
        type: 'textarea',
        required: true,
        description: 'Descripción de la empresa, misión, valores, años de experiencia',
        defaultValue: 'Empresa líder en su sector con años de experiencia'
      },
      {
        name: 'PRODUCTS_INFO',
        label: 'Información de productos',
        type: 'textarea',
        required: true,
        description: 'Lista de productos/servicios con precios y características principales',
        defaultValue: '1. Producto A - $100\n2. Producto B - $200\n3. Servicio Premium - $500'
      },
      {
        name: 'BUSINESS_HOURS',
        label: 'Horarios de atención',
        type: 'text',
        required: false,
        description: 'Horarios de atención al cliente',
        defaultValue: 'Lunes a Viernes 9:00 AM - 6:00 PM'
      },
      {
        name: 'CONTACT_INFO',
        label: 'Información de contacto',
        type: 'textarea',
        required: false,
        description: 'Teléfono, email, dirección para escalamiento',
        defaultValue: 'Teléfono: +1234567890\nEmail: ventas@empresa.com'
      }
    ],

    features: ['ai-powered', 'lead-capture', 'appointment-booking', 'context-aware', 'conversation-memory'],
    
    usage: {
      totalClones: 0,
      activeInstances: 0,
      rating: 4.8,
      reviews: [
        {
          user: 'Demo User',
          rating: 5,
          comment: 'Excelente template para automatizar ventas',
          date: new Date().toISOString()
        }
      ]
    },
    
    tags: ['ventas', 'ia', 'leads', 'automatización', 'gpt-4', 'memoria', 'herramientas'],
    
    preview: {
      thumbnail: '/images/templates/sales-agent-thumb.png',
      screenshots: [
        '/images/templates/sales-agent-chat1.png',
        '/images/templates/sales-agent-analytics.png',
        '/images/templates/sales-agent-tools.png'
      ],
      demoUrl: 'https://demo.smartops.com/sales-agent',
      videoUrl: 'https://youtube.com/watch?v=demo-sales-agent'
    },

    isPublic: true,
    isActive: true,
    version: '2.0.0',
    
    changelog: [
      {
        version: '2.0.0',
        changes: [
          'Agregada memoria conversacional',
          'Incluidas herramientas de ventas',
          'Mejorado análisis de intención',
          'Soporte para múltiples plataformas'
        ],
        date: new Date()
      }
    ]
  });

  return await template.save();
}

/**
 * Crear template de soporte técnico
 */
async function createSupportTemplate() {
  const workflowConfig = {
    name: 'Soporte Técnico IA',
    clientName: 'Cliente',
    tenantId: 'default',
    description: 'Workflow para soporte técnico automatizado con memoria y herramientas',
    systemPrompt: 'Eres un agente de soporte técnico experto para {{CLIENT_NAME}}.',
    aiModel: 'gpt-3.5-turbo',
    temperature: 0.3,
    maxTokens: 600,
    platforms: ['whatsapp', 'telegram', 'webchat'],
    clientConfig: {
      companyInfo: {
        name: 'Soporte Demo',
        description: 'Equipo de soporte técnico especializado'
      }
    },
    businessHours: {
      enabled: true,
      monday: { start: '08:00', end: '20:00' },
      tuesday: { start: '08:00', end: '20:00' },
      wednesday: { start: '08:00', end: '20:00' },
      thursday: { start: '08:00', end: '20:00' },
      friday: { start: '08:00', end: '20:00' },
      saturday: { start: '09:00', end: '17:00' }
    },
    tools: [
      { name: 'get_tickets', description: 'Consultar tickets existentes' },
      { name: 'create_ticket', description: 'Crear nuevo ticket de soporte' },
      { name: 'check_system_status', description: 'Verificar estado del sistema' },
      { name: 'get_user_info', description: 'Obtener información del usuario' }
    ]
  };

  const n8nWorkflow = await N8nService.createAIAgentTemplate(workflowConfig);

  const template = new Template({
    name: 'Soporte Técnico con IA',
    description: 'Agente de soporte que resuelve consultas técnicas automáticamente usando memoria conversacional y herramientas. Escala tickets complejos al equipo humano cuando es necesario. Incluye análisis de sentimiento y seguimiento de casos.',
    category: 'support',
    difficulty: 'advanced',
    n8nWorkflowId: n8nWorkflow.id,
    
    aiConfig: {
      enabled: true,
      model: 'gpt-3.5-turbo',
      systemPrompt: 'Eres un agente de soporte técnico experto para {{CLIENT_NAME}}. Tu función es:\n1. Resolver problemas técnicos comunes paso a paso\n2. Proporcionar troubleshooting detallado\n3. Usar herramientas para consultar información\n4. Mantener contexto conversacional\n5. Detectar frustración y escalar cuando sea necesario\n6. Ser paciente, claro y profesional\n\nBase de conocimiento: {{KNOWLEDGE_BASE}}\nEscalación: {{ESCALATION_EMAIL}}',
      temperature: 0.3,
      maxTokens: 600,
      features: ['conversation-memory', 'sentiment-analysis', 'intent-recognition']
    },

    platforms: ['whatsapp', 'telegram', 'webchat'],

    variables: [
      {
        name: 'CLIENT_NAME',
        label: 'Nombre de la empresa',
        type: 'text',
        required: true,
        description: 'Nombre de tu empresa o producto',
        defaultValue: 'Mi Empresa'
      },
      {
        name: 'KNOWLEDGE_BASE',
        label: 'Base de conocimiento',
        type: 'textarea',
        required: true,
        description: 'FAQ y soluciones técnicas comunes, problemas frecuentes',
        defaultValue: 'FAQ:\n1. ¿Cómo resetear mi contraseña? R: Ve a configuración > seguridad > cambiar contraseña\n2. Error de conexión: R: Verifica tu conexión a internet y reinicia la aplicación'
      },
      {
        name: 'ESCALATION_EMAIL',
        label: 'Email para escalación',
        type: 'text',
        required: true,
        description: 'Email del equipo de soporte humano para escalaciones',
        defaultValue: 'soporte@empresa.com'
      },
      {
        name: 'PRODUCT_INFO',
        label: 'Información del producto',
        type: 'textarea',
        required: false,
        description: 'Información técnica del producto o servicio',
        defaultValue: 'Software versión 2.0 - Compatible con Windows, Mac, Linux'
      },
      {
        name: 'SLA_RESPONSE_TIME',
        label: 'Tiempo de respuesta SLA',
        type: 'text',
        required: false,
        description: 'Tiempo comprometido de respuesta',
        defaultValue: '2 horas en horario laboral'
      }
    ],

    features: ['ai-powered', 'customer-support', 'context-aware', 'conversation-memory', 'sentiment-analysis'],
    
    usage: {
      totalClones: 0,
      activeInstances: 0,
      rating: 4.6,
      reviews: [
        {
          user: 'Tech Manager',
          rating: 5,
          comment: 'Reduce significativamente la carga de tickets nivel 1',
          date: new Date().toISOString()
        },
        {
          user: 'Support Lead',
          rating: 4,
          comment: 'Excelente para problemas comunes, necesita ajustes para casos específicos',
          date: new Date().toISOString()
        }
      ]
    },
    
    tags: ['soporte', 'ia', 'tickets', 'troubleshooting', 'escalacion', 'memoria'],
    
    preview: {
      thumbnail: '/images/templates/support-agent-thumb.png',
      screenshots: [
        '/images/templates/support-chat.png',
        '/images/templates/support-escalation.png',
        '/images/templates/support-analytics.png'
      ],
      demoUrl: 'https://demo.smartops.com/support-agent'
    },

    isPublic: true,
    isActive: true,
    version: '2.0.0',
    
    changelog: [
      {
        version: '2.0.0',
        changes: [
          'Agregada memoria conversacional',
          'Incluido análisis de sentimiento',
          'Herramientas de gestión de tickets',
          'Escalación automática inteligente'
        ],
        date: new Date()
      }
    ]
  });

  return await template.save();
}

/**
 * Crear template de citas
 */
async function createAppointmentTemplate() {
  const workflowConfig = {
    name: 'Asistente de Citas IA',
    clientName: 'Cliente',
    tenantId: 'default',
    description: 'Workflow para agendamiento inteligente de citas con memoria',
    systemPrompt: 'Eres un asistente de citas para {{CLIENT_NAME}}.',
    aiModel: 'gpt-3.5-turbo',
    temperature: 0.5,
    maxTokens: 400,
    platforms: ['whatsapp', 'instagram', 'webchat'],
    clientConfig: {
      companyInfo: {
        name: 'Servicios Demo',
        description: 'Centro de servicios profesionales'
      }
    },
    businessHours: {
      enabled: true,
      monday: { start: '09:00', end: '18:00' },
      tuesday: { start: '09:00', end: '18:00' },
      wednesday: { start: '09:00', end: '18:00' },
      thursday: { start: '09:00', end: '18:00' },
      friday: { start: '09:00', end: '18:00' },
      saturday: { start: '09:00', end: '14:00' }
    },
    tools: [
      { name: 'check_availability', description: 'Verificar disponibilidad de horarios' },
      { name: 'book_appointment', description: 'Agendar nueva cita' },
      { name: 'get_services', description: 'Obtener lista de servicios' },
      { name: 'send_confirmation', description: 'Enviar confirmación de cita' }
    ]
  };

  const n8nWorkflow = await N8nService.createAIAgentTemplate(workflowConfig);

  const template = new Template({
    name: 'Asistente de Citas con IA',
    description: 'Bot inteligente para agendar citas considerando disponibilidad en tiempo real y preferencias del cliente. Incluye memoria conversacional, gestión de servicios y confirmaciones automáticas. Perfecto para salones, clínicas y consultorios.',
    category: 'appointment',
    difficulty: 'intermediate',
    n8nWorkflowId: n8nWorkflow.id,
    
    aiConfig: {
      enabled: true,
      model: 'gpt-3.5-turbo',
      systemPrompt: 'Eres un asistente de citas para {{CLIENT_NAME}}. Ayudas a:\n1. Verificar disponibilidad en tiempo real usando herramientas\n2. Sugerir horarios que funcionen para el cliente\n3. Confirmar datos de contacto y servicio requerido\n4. Mantener contexto conversacional\n5. Enviar confirmaciones y recordatorios automáticos\n\nServicios: {{SERVICES}}\nDuración: {{APPOINTMENT_DURATION}} minutos\nPolíticas: {{BOOKING_POLICIES}}',
      temperature: 0.5,
      maxTokens: 400,
      features: ['conversation-memory', 'intent-recognition']
    },

    platforms: ['whatsapp', 'instagram', 'webchat'],

    variables: [
      {
        name: 'CLIENT_NAME',
        label: 'Nombre del negocio',
        type: 'text',
        required: true,
        description: 'Nombre de tu salón, clínica o consultorio',
        defaultValue: 'Mi Salón'
      },
      {
        name: 'SERVICES',
        label: 'Servicios disponibles',
        type: 'textarea',
        required: true,
        description: 'Lista de servicios con duración y precio',
        defaultValue: '1. Corte de cabello - 30 min - $25\n2. Coloración - 120 min - $80\n3. Manicure - 45 min - $20\n4. Tratamiento facial - 60 min - $50'
      },
      {
        name: 'APPOINTMENT_DURATION',
        label: 'Duración promedio (minutos)',
        type: 'number',
        defaultValue: 60,
        required: true,
        description: 'Duración promedio de las citas'
      },
      {
        name: 'BOOKING_POLICIES',
        label: 'Políticas de agendamiento',
        type: 'textarea',
        required: false,
        description: 'Políticas de cancelación, anticipación requerida, etc.',
        defaultValue: '- Cancelaciones con 24h de anticipación\n- Confirmar 1 día antes\n- Llegar 10 minutos antes'
      },
      {
        name: 'CONTACT_INFO',
        label: 'Información de contacto',
        type: 'text',
        required: true,
        description: 'Teléfono o dirección del establecimiento',
        defaultValue: 'Teléfono: +1234567890 - Dirección: Calle Principal 123'
      }
    ],

    features: ['ai-powered', 'appointment-booking', 'context-aware', 'conversation-memory'],
    
    usage: {
      totalClones: 0,
      activeInstances: 0,
      rating: 4.7,
      reviews: [
        {
          user: 'Salon Owner',
          rating: 5,
          comment: 'Redujo las llamadas de agendamiento en 70%',
          date: new Date().toISOString()
        },
        {
          user: 'Clinic Manager',
          rating: 4,
          comment: 'Funciona muy bien, los pacientes lo aman',
          date: new Date().toISOString()
        }
      ]
    },
    
    tags: ['citas', 'agendamiento', 'calendario', 'ia', 'salones', 'clinicas', 'memoria'],
    
    preview: {
      thumbnail: '/images/templates/appointment-agent-thumb.png',
      screenshots: [
        '/images/templates/appointment-booking.png',
        '/images/templates/appointment-calendar.png',
        '/images/templates/appointment-confirmation.png'
      ],
      demoUrl: 'https://demo.smartops.com/appointment-agent'
    },

    isPublic: true,
    isActive: true,
    version: '2.0.0',
    
    changelog: [
      {
        version: '2.0.0',
        changes: [
          'Agregada memoria conversacional',
          'Herramientas de disponibilidad en tiempo real',
          'Confirmaciones automáticas',
          'Gestión de políticas de agendamiento'
        ],
        date: new Date()
      }
    ]
  });

  return await template.save();
}

/**
 * Crear template de e-commerce
 */
async function createEcommerceTemplate() {
  const workflowConfig = {
    name: 'Agente E-commerce IA',
    clientName: 'Tienda Demo',
    tenantId: 'default',
    description: 'Workflow para asistente de compras inteligente con memoria y herramientas',
    systemPrompt: 'Eres un asistente de ventas experto para la tienda {{CLIENT_NAME}}.',
    aiModel: 'gpt-4',
    temperature: 0.6,
    maxTokens: 700,
    platforms: ['whatsapp', 'instagram', 'facebook', 'webchat'],
    clientConfig: {
      companyInfo: {
        name: 'Tienda Online Demo',
        description: 'Tienda online con los mejores productos'
      }
    },
    businessHours: {
      enabled: true,
      monday: { start: '09:00', end: '21:00' },
      tuesday: { start: '09:00', end: '21:00' },
      wednesday: { start: '09:00', end: '21:00' },
      thursday: { start: '09:00', end: '21:00' },
      friday: { start: '09:00', end: '22:00' },
      saturday: { start: '09:00', end: '22:00' },
      sunday: { start: '10:00', end: '20:00' }
    },
    tools: [
      { name: 'get_products', description: 'Buscar productos en catálogo' },
      { name: 'check_inventory', description: 'Verificar stock disponible' },
      { name: 'get_prices', description: 'Consultar precios y promociones' },
      { name: 'create_order', description: 'Crear nueva orden de compra' },
      { name: 'track_order', description: 'Rastrear estado de orden' }
    ]
  };

  const n8nWorkflow = await N8nService.createAIAgentTemplate(workflowConfig);

  const template = new Template({
    name: 'Agente E-commerce con IA',
    description: 'Asistente de compras inteligente que recomienda productos personalizados, verifica inventario en tiempo real y procesa órdenes automáticamente. Incluye memoria conversacional, análisis de preferencias y seguimiento de pedidos. Ideal para tiendas online.',
    category: 'ecommerce',
    difficulty: 'advanced',
    n8nWorkflowId: n8nWorkflow.id,
    
    aiConfig: {
      enabled: true,
      model: 'gpt-4',
      systemPrompt: 'Eres un asistente de ventas experto para la tienda {{CLIENT_NAME}}. Tu función es:\n1. Recomendar productos basado en preferencias del cliente\n2. Verificar disponibilidad y precios en tiempo real\n3. Asistir en el proceso de compra paso a paso\n4. Mantener contexto conversacional\n5. Procesar órdenes y dar seguimiento\n6. Ofrecer promociones relevantes\n\nCatálogo: {{PRODUCTS_CATALOG}}\nPolíticas: {{SHIPPING_POLICIES}}\nPagos: {{PAYMENT_METHODS}}',
      temperature: 0.6,
      maxTokens: 700,
      features: ['conversation-memory', 'intent-recognition', 'entity-extraction']
    },

    platforms: ['whatsapp', 'instagram', 'facebook', 'webchat'],

    variables: [
      {
        name: 'CLIENT_NAME',
        label: 'Nombre de la tienda',
        type: 'text',
        required: true,
        description: 'Nombre comercial de tu tienda online',
        defaultValue: 'Mi Tienda'
      },
      {
        name: 'PRODUCTS_CATALOG',
        label: 'Catálogo de productos',
        type: 'textarea',
        required: true,
        description: 'Productos disponibles con precios, características y categorías',
        defaultValue: 'Categoría Ropa:\n1. Camiseta básica - $25 - Tallas S,M,L,XL\n2. Jeans clásico - $60 - Tallas 28-38\n3. Sudadera con capucha - $45 - Tallas S,M,L,XL\n\nCategoría Accesorios:\n1. Gorra deportiva - $15\n2. Mochila urbana - $80\n3. Reloj casual - $120'
      },
      {
        name: 'PAYMENT_METHODS',
        label: 'Métodos de pago',
        type: 'textarea',
        required: true,
        description: 'Métodos de pago disponibles y condiciones',
        defaultValue: '- Tarjeta de crédito/débito (Visa, Mastercard)\n- PayPal\n- Transferencia bancaria\n- Pago contra entrega (+$5)'
      },
      {
        name: 'SHIPPING_POLICIES',
        label: 'Políticas de envío',
        type: 'textarea',
        required: false,
        description: 'Información sobre envíos, tiempos y costos',
        defaultValue: '- Envío gratis en compras >$100\n- Entrega 1-3 días hábiles\n- Costo estándar: $10\n- Envío express: $20 (24h)'
      },
      {
        name: 'PROMOTIONS',
        label: 'Promociones activas',
        type: 'textarea',
        required: false,
        description: 'Descuentos y promociones vigentes',
        defaultValue: '- 20% descuento en segunda prenda\n- Envío gratis por compras >$100\n- Descuento 10% para nuevos clientes: NUEVO10'
      }
    ],

    features: ['ai-powered', 'order-processing', 'context-aware', 'conversation-memory', 'multilingual'],
    
    usage: {
      totalClones: 0,
      activeInstances: 0,
      rating: 4.9,
      reviews: [
        {
          user: 'Store Owner',
          rating: 5,
          comment: 'Aumentó las ventas un 40% y mejoró la experiencia de compra',
          date: new Date().toISOString()
        },
        {
          user: 'E-commerce Manager',
          rating: 5,
          comment: 'Los clientes aman poder consultar productos 24/7',
          date: new Date().toISOString()
        },
        {
          user: 'Online Retailer',
          rating: 4,
          comment: 'Excelente para reducir carritos abandonados',
          date: new Date().toISOString()
        }
      ]
    },
    
    tags: ['ecommerce', 'ventas', 'productos', 'recomendaciones', 'ia', 'inventario', 'memoria'],
    
    preview: {
      thumbnail: '/images/templates/ecommerce-agent-thumb.png',
      screenshots: [
        '/images/templates/ecommerce-products.png',
        '/images/templates/ecommerce-checkout.png',
        '/images/templates/ecommerce-recommendations.png'
      ],
      demoUrl: 'https://demo.smartops.com/ecommerce-agent',
      videoUrl: 'https://youtube.com/watch?v=demo-ecommerce'
    },

    isPublic: true,
    isActive: true,
    version: '2.0.0',
    
    changelog: [
      {
        version: '2.0.0',
        changes: [
          'Agregada memoria conversacional',
          'Herramientas de inventario en tiempo real',
          'Recomendaciones personalizadas',
          'Procesamiento automático de órdenes',
          'Seguimiento de pedidos'
        ],
        date: new Date()
      }
    ]
  });

  return await template.save();
}

/**
 * Crear template básico FAQ (sin IA)
 */
async function createBasicFAQTemplate() {
  // Este es un workflow simple sin IA
  const workflowConfig = {
    name: 'FAQ Básico',
    clientName: 'Cliente',
    tenantId: 'default',
    description: 'Workflow simple para preguntas frecuentes sin IA',
    platforms: ['whatsapp', 'telegram', 'instagram', 'facebook', 'webchat'],
    webhookPath: 'faq-basic',
    responses: {
      'hola': '¡Hola! ¿En qué puedo ayudarte?',
      'horarios': 'Nuestros horarios son de Lunes a Viernes de 9:00 AM a 6:00 PM',
      'ubicación': 'Estamos ubicados en el centro de la ciudad',
      'servicios': 'Ofrecemos servicios de consultoría, desarrollo y automatización',
      'precios': 'Para información sobre precios, contáctanos al WhatsApp'
    },
    fallbackMessage: 'Lo siento, no entendí tu pregunta. ¿Puedes ser más específico?'
  };

  const n8nWorkflow = await N8nService.createChatbotWorkflow(workflowConfig);

  const template = new Template({
    name: 'FAQ Básico',
    description: 'Template simple para responder preguntas frecuentes sin inteligencia artificial. Perfecto para empezar con automatización básica. Fácil de configurar y mantener. Incluye respuestas predefinidas y opciones de escalamiento.',
    category: 'basic',
    difficulty: 'basic',
    n8nWorkflowId: n8nWorkflow.id,
    
    aiConfig: {
      enabled: false,
      model: 'none',
      systemPrompt: '',
      temperature: 0,
      maxTokens: 0,
      features: []
    },

    platforms: ['whatsapp', 'telegram', 'instagram', 'facebook', 'webchat'],

    variables: [
      {
        name: 'CLIENT_NAME',
        label: 'Nombre de la empresa',
        type: 'text',
        required: true,
        description: 'Nombre de tu empresa o negocio',
        defaultValue: 'Mi Empresa'
      },
      {
        name: 'FAQ_RESPONSES',
        label: 'Preguntas y respuestas',
        type: 'textarea',
        required: true,
        description: 'Lista de preguntas frecuentes y sus respuestas (una por línea)',
        defaultValue: 'horarios|Atendemos de Lunes a Viernes 9:00 AM - 6:00 PM\nubicación|Estamos en el centro de la ciudad\nservicios|Ofrecemos consultoría, desarrollo y soporte\nprecios|Contáctanos para cotización personalizada\ncontacto|Teléfono: +1234567890, Email: info@empresa.com'
      },
      {
        name: 'WELCOME_MESSAGE',
        label: 'Mensaje de bienvenida',
        type: 'text',
        required: true,
        description: 'Primer mensaje que reciben los usuarios',
        defaultValue: '¡Hola! Soy el asistente virtual de {{CLIENT_NAME}}. ¿En qué puedo ayudarte?'
      },
      {
        name: 'FALLBACK_MESSAGE',
        label: 'Mensaje de fallback',
        type: 'text',
        defaultValue: 'Lo siento, no entendí tu pregunta. Escribe "ayuda" para ver las opciones disponibles.',
        required: true,
        description: 'Mensaje cuando no se entiende la pregunta'
      },
      {
        name: 'CONTACT_INFO',
        label: 'Información de contacto',
        type: 'textarea',
        required: false,
        description: 'Datos de contacto para escalamiento humano',
        defaultValue: 'Para más ayuda contacta:\nTeléfono: +1234567890\nEmail: info@empresa.com\nHorario: Lun-Vie 9AM-6PM'
      }
    ],

    features: ['faq-automation', 'multi-platform'],
    
    usage: {
      totalClones: 0,
      activeInstances: 0,
      rating: 4.2,
      reviews: [
        {
          user: 'Small Business',
          rating: 4,
          comment: 'Perfecto para empezar, fácil de configurar',
          date: new Date().toISOString()
        },
        {
          user: 'Startup Owner',
          rating: 4,
          comment: 'Simple pero efectivo para preguntas básicas',
          date: new Date().toISOString()
        }
      ]
    },
    
    tags: ['faq', 'básico', 'simple', 'preguntas', 'sin-ia', 'facil'],
    
    preview: {
      thumbnail: '/images/templates/faq-basic-thumb.png',
      screenshots: [
        '/images/templates/faq-basic-setup.png',
        '/images/templates/faq-basic-chat.png'
      ],
      demoUrl: 'https://demo.smartops.com/faq-basic'
    },

    isPublic: true,
    isActive: true,
    version: '2.0.0',
    
    changelog: [
      {
        version: '2.0.0',
        changes: [
          'Mejorada configuración de respuestas',
          'Agregado soporte para más plataformas',
          'Incluido mensaje de bienvenida personalizable',
          'Agregada información de contacto'
        ],
        date: new Date()
      }
    ]
  });

  return await template.save();
}

/**
 * Crear template de consulta médica con IA
 */
async function createMedicalConsultTemplate() {
  const workflowConfig = {
    name: 'Consulta Médica IA',
    clientName: 'Clínica Demo',
    tenantId: 'default',
    description: 'Workflow para pre-consulta médica con IA especializada',
    systemPrompt: 'Eres un asistente médico virtual para {{CLIENT_NAME}}.',
    aiModel: 'gpt-4',
    temperature: 0.2,
    maxTokens: 600,
    platforms: ['whatsapp', 'webchat'],
    clientConfig: {
      companyInfo: {
        name: 'Centro Médico Demo',
        description: 'Centro médico especializado en atención integral'
      }
    },
    businessHours: {
      enabled: true,
      monday: { start: '07:00', end: '19:00' },
      tuesday: { start: '07:00', end: '19:00' },
      wednesday: { start: '07:00', end: '19:00' },
      thursday: { start: '07:00', end: '19:00' },
      friday: { start: '07:00', end: '19:00' },
      saturday: { start: '08:00', end: '14:00' }
    },
    tools: [
      { name: 'check_doctor_availability', description: 'Verificar disponibilidad de doctores' },
      { name: 'book_medical_appointment', description: 'Agendar cita médica' },
      { name: 'get_medical_services', description: 'Consultar servicios médicos' },
      { name: 'emergency_protocol', description: 'Protocolo de emergencias' }
    ]
  };

  const n8nWorkflow = await N8nService.createAIAgentTemplate(workflowConfig);

  const template = new Template({
    name: 'Consulta Médica con IA',
    description: 'Asistente médico virtual para pre-consulta, triaje básico y agendamiento de citas. Incluye protocolos de emergencia, memoria conversacional y escalamiento inteligente. IMPORTANTE: No sustituye consulta médica profesional.',
    category: 'healthcare',
    difficulty: 'advanced',
    n8nWorkflowId: n8nWorkflow.id,
    
    aiConfig: {
      enabled: true,
      model: 'gpt-4',
      systemPrompt: 'Eres un asistente médico virtual para {{CLIENT_NAME}}. IMPORTANTE: No das diagnósticos médicos.\n\nTu función es:\n1. Recopilar síntomas básicos para triaje\n2. Determinar urgencia (emergencia, urgente, programada)\n3. Agendar citas con especialistas apropiados\n4. Proporcionar información general sobre servicios\n5. Escalar emergencias inmediatamente\n\nServicios: {{MEDICAL_SERVICES}}\nEspecialistas: {{SPECIALISTS}}\nProtocolos: {{EMERGENCY_PROTOCOLS}}',
      temperature: 0.2,
      maxTokens: 600,
      features: ['conversation-memory', 'intent-recognition', 'emergency-detection']
    },

    platforms: ['whatsapp', 'webchat'],

    variables: [
      {
        name: 'CLIENT_NAME',
        label: 'Nombre del centro médico',
        type: 'text',
        required: true,
        description: 'Nombre de la clínica, hospital o centro médico',
        defaultValue: 'Centro Médico Integral'
      },
      {
        name: 'MEDICAL_SERVICES',
        label: 'Servicios médicos',
        type: 'textarea',
        required: true,
        description: 'Lista de especialidades y servicios disponibles',
        defaultValue: 'Especialidades:\n- Medicina General\n- Cardiología\n- Dermatología\n- Ginecología\n- Pediatría\n- Traumatología\n\nServicios:\n- Laboratorio clínico\n- Radiología\n- Ecografía\n- Electrocardiograma'
      },
      {
        name: 'SPECIALISTS',
        label: 'Especialistas disponibles',
        type: 'textarea',
        required: true,
        description: 'Doctores y sus horarios de atención',
        defaultValue: 'Dr. García - Medicina General - Lun-Vie 8AM-5PM\nDra. López - Cardiología - Mar-Jue 2PM-6PM\nDr. Martínez - Traumatología - Lun-Mie-Vie 9AM-1PM'
      },
      {
        name: 'EMERGENCY_PROTOCOLS',
        label: 'Protocolos de emergencia',
        type: 'textarea',
        required: true,
        description: 'Síntomas de emergencia y protocolos de acción',
        defaultValue: 'EMERGENCIAS INMEDIATAS:\n- Dolor de pecho intenso\n- Dificultad para respirar severa\n- Pérdida de consciencia\n- Sangrado abundante\n- Accidente cerebrovascular\n\nACCIÓN: Llamar 911 inmediatamente'
      },
      {
        name: 'INSURANCE_INFO',
        label: 'Información de seguros',
        type: 'textarea',
        required: false,
        description: 'Seguros médicos aceptados',
        defaultValue: 'Seguros aceptados:\n- Seguro Social\n- ISAPRE principales\n- Fonasa\n- Seguros privados\n\nConsultar cobertura específica'
      }
    ],

    features: ['ai-powered', 'medical-triage', 'emergency-detection', 'conversation-memory'],
    
    usage: {
      totalClones: 0,
      activeInstances: 0,
      rating: 4.9,
      reviews: [
        {
          user: 'Medical Director',
          rating: 5,
          comment: 'Excelente para triaje inicial y reducir llamadas innecesarias',
          date: new Date().toISOString()
        },
        {
          user: 'Clinic Manager',
          rating: 5,
          comment: 'Los pacientes aprecian la disponibilidad 24/7',
          date: new Date().toISOString()
        }
      ]
    },
    
    tags: ['medicina', 'salud', 'triaje', 'citas-medicas', 'emergencias', 'ia'],
    
    preview: {
      thumbnail: '/images/templates/medical-agent-thumb.png',
      screenshots: [
        '/images/templates/medical-triage.png',
        '/images/templates/medical-appointment.png',
        '/images/templates/medical-emergency.png'
      ],
      demoUrl: 'https://demo.smartops.com/medical-agent'
    },

    isPublic: true,
    isActive: true,
    version: '2.0.0',
    
    changelog: [
      {
        version: '2.0.0',
        changes: [
          'Protocolo de emergencias mejorado',
          'Triaje inteligente por síntomas',
          'Memoria conversacional médica',
          'Integración con sistemas de citas'
        ],
        date: new Date()
      }
    ]
  });

  return await template.save();
}

/**
 * Crear template de asesor financiero con IA
 */
async function createFinancialAdvisorTemplate() {
  const workflowConfig = {
    name: 'Asesor Financiero IA',
    clientName: 'Asesoría Financiera Demo',
    tenantId: 'default',
    description: 'Workflow para asesoría financiera personalizada con IA',
    systemPrompt: 'Eres un asesor financiero experto para {{CLIENT_NAME}}.',
    aiModel: 'gpt-4',
    temperature: 0.3,
    maxTokens: 800,
    platforms: ['whatsapp', 'webchat', 'telegram'],
    clientConfig: {
      companyInfo: {
        name: 'Asesoría Financiera Integral',
        description: 'Expertos en planificación financiera personal y empresarial'
      }
    },
    businessHours: {
      enabled: true,
      monday: { start: '09:00', end: '18:00' },
      tuesday: { start: '09:00', end: '18:00' },
      wednesday: { start: '09:00', end: '18:00' },
      thursday: { start: '09:00', end: '18:00' },
      friday: { start: '09:00', end: '17:00' }
    },
    tools: [
      { name: 'calculate_loan', description: 'Calcular préstamos y cuotas' },
      { name: 'investment_analysis', description: 'Análisis de inversiones' },
      { name: 'risk_assessment', description: 'Evaluación de riesgo financiero' },
      { name: 'book_consultation', description: 'Agendar consulta con asesor' }
    ]
  };

  const n8nWorkflow = await N8nService.createAIAgentTemplate(workflowConfig);

  const template = new Template({
    name: 'Asesor Financiero con IA',
    description: 'Asesor financiero virtual que proporciona consultas personalizadas, calculadoras financieras y recomendaciones de inversión. Incluye análisis de riesgo, planificación de retiro y asesoría en préstamos. Ideal para entidades financieras.',
    category: 'finance',
    difficulty: 'advanced',
    n8nWorkflowId: n8nWorkflow.id,
    
    aiConfig: {
      enabled: true,
      model: 'gpt-4',
      systemPrompt: 'Eres un asesor financiero certificado para {{CLIENT_NAME}}. Tu función es:\n1. Analizar situación financiera del cliente\n2. Recomendar productos financieros apropiados\n3. Calcular préstamos, inversiones y seguros\n4. Educar sobre finanzas personales\n5. Evaluar perfiles de riesgo\n6. Agendar consultas personalizadas\n\nProductos: {{FINANCIAL_PRODUCTS}}\nTasas: {{INTEREST_RATES}}\nRiesgos: Siempre mencionar riesgos de inversión',
      temperature: 0.3,
      maxTokens: 800,
      features: ['conversation-memory', 'intent-recognition', 'financial-calculations']
    },

    platforms: ['whatsapp', 'webchat', 'telegram'],

    variables: [
      {
        name: 'CLIENT_NAME',
        label: 'Nombre de la institución',
        type: 'text',
        required: true,
        description: 'Nombre del banco, asesoría o institución financiera',
        defaultValue: 'Asesoría Financiera Integral'
      },
      {
        name: 'FINANCIAL_PRODUCTS',
        label: 'Productos financieros',
        type: 'textarea',
        required: true,
        description: 'Lista de productos y servicios financieros disponibles',
        defaultValue: 'Préstamos:\n- Hipotecario: desde 3.5% anual\n- Personal: desde 8% anual\n- Automotriz: desde 6% anual\n\nInversiones:\n- Fondos mutuos\n- Depósitos a plazo\n- Acciones\n- Bonos\n\nSeguros:\n- Vida\n- Hogar\n- Automotriz\n- Salud'
      },
      {
        name: 'INTEREST_RATES',
        label: 'Tasas de interés',
        type: 'textarea',
        required: true,
        description: 'Tasas actuales de productos financieros',
        defaultValue: 'Tasas vigentes:\n- Hipotecario: 3.5% - 4.2%\n- Personal: 8% - 12%\n- Automotriz: 6% - 9%\n- Depósitos a plazo: 2% - 3.5%\n- Línea de crédito: 10% - 15%'
      },
      {
        name: 'RISK_PROFILES',
        label: 'Perfiles de riesgo',
        type: 'textarea',
        required: false,
        description: 'Definición de perfiles de inversión',
        defaultValue: 'Perfiles de riesgo:\n- Conservador: 80% renta fija, 20% variable\n- Moderado: 60% renta fija, 40% variable\n- Agresivo: 30% renta fija, 70% variable'
      },
      {
        name: 'CONTACT_INFO',
        label: 'Información de contacto',
        type: 'text',
        required: true,
        description: 'Datos para agendar consultas presenciales',
        defaultValue: 'Consultas: +1234567890 - Sucursales en toda la ciudad'
      }
    ],

    features: ['ai-powered', 'financial-analysis', 'risk-assessment', 'conversation-memory'],
    
    usage: {
      totalClones: 0,
      activeInstances: 0,
      rating: 4.7,
      reviews: [
        {
          user: 'Bank Manager',
          rating: 5,
          comment: 'Genera más leads calificados para nuestros asesores',
          date: new Date().toISOString()
        },
        {
          user: 'Financial Advisor',
          rating: 4,
          comment: 'Los clientes llegan mejor preparados a las citas',
          date: new Date().toISOString()
        }
      ]
    },
    
    tags: ['finanzas', 'prestamos', 'inversiones', 'seguros', 'asesoría', 'ia'],
    
    preview: {
      thumbnail: '/images/templates/financial-agent-thumb.png',
      screenshots: [
        '/images/templates/financial-calculator.png',
        '/images/templates/financial-advice.png',
        '/images/templates/financial-products.png'
      ],
      demoUrl: 'https://demo.smartops.com/financial-agent'
    },

    isPublic: true,
    isActive: true,
    version: '2.0.0',
    
    changelog: [
      {
        version: '2.0.0',
        changes: [
          'Calculadoras financieras inteligentes',
          'Análisis de perfil de riesgo',
          'Recomendaciones personalizadas',
          'Memoria conversacional financiera'
        ],
        date: new Date()
      }
    ]
  });

  return await template.save();
}

// Ejecutar script si se llama directamente
if (require.main === module) {
  createDefaultTemplates();
}

module.exports = { createDefaultTemplates }; 