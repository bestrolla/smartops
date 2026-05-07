require('dotenv').config();
const mongoose = require('mongoose');
const Template = require('../models/Template');
const N8nServiceClass = require('../services/N8nService');
const N8nService = new N8nServiceClass();
const logger = require('../../../shared/logger');

// Conectar a MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/smartops');

/**
 * Crear template de prueba con el nuevo nodo AI Agent
 */
async function createAIAgentTemplate() {
  try {
    console.log('\n🤖 Creando template con nodo AI Agent...\n');

    // Configuración del nuevo template
    const templateConfig = {
      name: 'AI Agent Test Template',
      clientName: 'Test Client',
      tenantId: 'test-tenant',
      description: 'Template de prueba con el nuevo nodo AI Agent',
      systemPrompt: `Eres un asistente virtual inteligente para {{CLIENT_NAME}}. 

Tu función es ayudar a los usuarios de manera amigable y profesional. Puedes:
- Responder preguntas sobre la empresa
- Proporcionar información de productos y servicios
- Ayudar con consultas generales
- Usar herramientas cuando sea necesario

Información de la empresa: {{COMPANY_INFO}}
Horarios de atención: {{BUSINESS_HOURS}}

Mantén siempre un tono profesional y amigable.`,
      
      aiModel: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 500,
      platforms: ['whatsapp', 'webchat'],
      webhookPath: 'ai-agent-test',
      
      tools: [
        {
          name: 'get_business_info',
          description: 'Obtener información básica de la empresa',
          type: 'function',
          parameters: {
            type: 'object',
            properties: {
              infoType: {
                type: 'string',
                enum: ['hours', 'services', 'contact', 'about'],
                description: 'Tipo de información a obtener'
              }
            }
          }
        },
        {
          name: 'search_products',
          description: 'Buscar productos en el catálogo',
          type: 'function',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Término de búsqueda'
              },
              category: {
                type: 'string',
                description: 'Categoría específica'
              }
            }
          }
        }
      ]
    };

    console.log('⚙️  Configuración del template:');
    console.log(`   Nombre: ${templateConfig.name}`);
    console.log(`   Modelo IA: ${templateConfig.aiModel}`);
    console.log(`   Herramientas: ${templateConfig.tools.length}`);
    console.log(`   Plataformas: ${templateConfig.platforms.join(', ')}`);

    // Crear workflow en N8N
    console.log('\n📡 Creando workflow en N8N...');
    const n8nWorkflow = await N8nService.createAIAgentTemplate(templateConfig);
    
    console.log('✅ Workflow creado exitosamente:');
    console.log(`   ID: ${n8nWorkflow.id}`);
    console.log(`   Nombre: ${n8nWorkflow.name}`);
    console.log(`   Nodos: ${n8nWorkflow.nodes?.length || 0}`);

    // Inspeccionar el workflow creado
    console.log('\n🔍 Inspeccionando workflow creado:');
    if (n8nWorkflow.nodes) {
      console.log('   Nodos encontrados:');
      n8nWorkflow.nodes.forEach((node, index) => {
        console.log(`   ${index + 1}. ${node.name} (${node.type})`);
        
        // Mostrar detalles del nodo AI Agent
        if (node.type === 'n8n-nodes-base.aiAgent') {
          console.log(`      - System Message: ${node.parameters.systemMessage ? 'Configurado' : 'No configurado'}`);
          console.log(`      - Chat Model: ${node.parameters.chatModel?.model || 'No configurado'}`);
          console.log(`      - Memoria: ${node.parameters.memory?.enabled ? 'Habilitada' : 'Deshabilitada'}`);
          console.log(`      - Herramientas: ${node.parameters.tools?.length || 0}`);
        }
      });
    }

    // Crear entrada en la base de datos
    console.log('\n💾 Creando entrada en la base de datos...');
    
    const template = new Template({
      name: 'AI Agent Test Template',
      description: 'Template de prueba usando el nuevo nodo AI Agent de N8N. Incluye memoria conversacional, herramientas integradas y configuración personalizable.',
      category: 'ai-agent',
      difficulty: 'intermediate',
      n8nWorkflowId: n8nWorkflow.id,
      
      aiConfig: {
        enabled: true,
        model: templateConfig.aiModel,
        systemPrompt: templateConfig.systemPrompt,
        temperature: templateConfig.temperature,
        maxTokens: templateConfig.maxTokens,
        features: ['conversation-memory', 'intent-recognition', 'entity-extraction'] // Valores válidos del enum
      },

      platforms: templateConfig.platforms,

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
          description: 'Descripción de la empresa, servicios y valores',
          defaultValue: 'Empresa líder en su sector con años de experiencia brindando soluciones de calidad'
        },
        {
          name: 'BUSINESS_HOURS',
          label: 'Horarios de atención',
          type: 'text',
          required: false,
          description: 'Horarios de atención al cliente',
          defaultValue: 'Lunes a Viernes de 9:00 AM a 6:00 PM'
        }
      ],

      features: ['ai-powered', 'conversation-memory', 'context-aware', 'multi-platform'], // Valores válidos del enum
      
      usage: {
        totalClones: 0,
        activeInstances: 0,
        rating: 5, // Valor válido (min: 1, max: 5)
        reviews: []
      },
      
      tags: ['ai-agent', 'memoria', 'herramientas', 'test', 'n8n'],
      
      preview: {
        thumbnail: '/images/templates/ai-agent-test-thumb.png',
        screenshots: []
      },

      isPublic: true,
      isActive: true,
      version: '1.0.0',
      
      changelog: [
        {
          version: '1.0.0',
          changes: [
            'Creación inicial del template',
            'Implementación del nodo AI Agent',
            'Configuración de memoria conversacional',
            'Integración de herramientas básicas'
          ],
          date: new Date()
        }
      ]
    });

    const savedTemplate = await template.save();
    
    console.log('✅ Template guardado en la base de datos:');
    console.log(`   ID: ${savedTemplate._id}`);
    console.log(`   Nombre: ${savedTemplate.name}`);

    // Probar la configuración
    console.log('\n🧪 Probando configuración del template...');
    
    // Verificar que el workflow esté accesible
    const retrievedWorkflow = await N8nService.getWorkflow(n8nWorkflow.id);
    console.log(`✅ Workflow accesible: ${retrievedWorkflow ? 'Sí' : 'No'}`);

    // Verificar nodos AI Agent
    const aiAgentNodes = retrievedWorkflow.nodes?.filter(node => node.type === 'n8n-nodes-base.aiAgent') || [];
    console.log(`✅ Nodos AI Agent encontrados: ${aiAgentNodes.length}`);

    if (aiAgentNodes.length > 0) {
      const aiAgent = aiAgentNodes[0];
      console.log('   Configuración del AI Agent:');
      console.log(`   - System Message: ${aiAgent.parameters.systemMessage ? 'Sí' : 'No'}`);
      console.log(`   - Chat Model: ${aiAgent.parameters.chatModel?.model || 'No configurado'}`);
      console.log(`   - Temperature: ${aiAgent.parameters.chatModel?.temperature || 'No configurado'}`);
      console.log(`   - Max Tokens: ${aiAgent.parameters.chatModel?.maxTokens || 'No configurado'}`);
      console.log(`   - Memoria habilitada: ${aiAgent.parameters.memory?.enabled ? 'Sí' : 'No'}`);
      console.log(`   - Herramientas: ${aiAgent.parameters.tools?.length || 0}`);
    }

    console.log('\n🎉 ¡Template AI Agent creado exitosamente!');
    console.log('\n📋 Resumen:');
    console.log(`   - Workflow ID: ${n8nWorkflow.id}`);
    console.log(`   - Template ID: ${savedTemplate._id}`);
    console.log(`   - Nodos totales: ${n8nWorkflow.nodes?.length || 0}`);
    console.log(`   - Nodos AI Agent: ${aiAgentNodes.length}`);
    console.log(`   - Webhook Path: ${templateConfig.webhookPath}`);

    return {
      workflowId: n8nWorkflow.id,
      templateId: savedTemplate._id,
      success: true
    };

  } catch (error) {
    console.log('\n❌ Error creando template AI Agent:', error.message);
    console.log('📋 Stack trace:', error.stack);
    return {
      success: false,
      error: error.message
    };
  } finally {
    await mongoose.connection.close();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createAIAgentTemplate();
}

module.exports = { createAIAgentTemplate }; 