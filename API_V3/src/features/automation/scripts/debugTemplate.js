require('dotenv').config();
const mongoose = require('mongoose');
const Template = require('../models/Template');
const N8nServiceClass = require('../services/N8nService');
const N8nService = new N8nServiceClass();
const logger = require('../../../shared/logger');

// Conectar a MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/smartops');

/**
 * Script para debuggear la estructura de templates y workflows
 */
async function debugTemplate() {
  try {
    console.log('\n🔍 Iniciando debug de templates...\n');

    // 1. Obtener templates disponibles
    const templates = await Template.find({ isActive: true, isPublic: true }).limit(3);
    console.log(`📋 Templates disponibles: ${templates.length}\n`);

    for (const template of templates) {
      console.log(`\n🎯 Template: ${template.name}`);
      console.log(`   ID: ${template._id}`);
      console.log(`   N8N Workflow ID: ${template.n8nWorkflowId}`);
      console.log(`   Categoría: ${template.category}`);
      console.log(`   IA habilitada: ${template.aiConfig.enabled}`);

      try {
        // 2. Obtener workflow de N8N
        console.log('\n📥 Obteniendo workflow de N8N...');
        const workflow = await N8nService.getWorkflow(template.n8nWorkflowId);
        
        console.log(`   Nombre: ${workflow.name}`);
        console.log(`   Activo: ${workflow.active}`);
        console.log(`   Nodos: ${workflow.nodes?.length || 0}`);

        // 3. Analizar estructura de nodos
        if (workflow.nodes && workflow.nodes.length > 0) {
          console.log('\n🔧 Análisis de nodos:');
          
          workflow.nodes.forEach((node, index) => {
            console.log(`\n   Nodo ${index + 1}:`);
            console.log(`     - Nombre: ${node.name}`);
            console.log(`     - Tipo: ${node.type}`);
            console.log(`     - ID: ${node.id || 'No definido'}`);
            
            if (node.parameters) {
              console.log(`     - Parámetros disponibles:`);
              Object.keys(node.parameters).forEach(param => {
                const value = node.parameters[param];
                const type = Array.isArray(value) ? 'array' : typeof value;
                const preview = type === 'string' && value.length > 50 
                  ? value.substring(0, 50) + '...' 
                  : type === 'object' 
                    ? JSON.stringify(value).substring(0, 100) + '...'
                    : value;
                
                console.log(`       * ${param}: (${type}) ${preview}`);
                
                // Analizar estructura específica de mensajes
                if (param === 'messages') {
                  console.log(`         └─ Estructura de messages:`);
                  console.log(`            - Es array: ${Array.isArray(value)}`);
                  console.log(`            - Tipo real: ${typeof value}`);
                  console.log(`            - Contenido: ${JSON.stringify(value, null, 12).substring(0, 200)}...`);
                }
              });
            } else {
              console.log(`     - Sin parámetros`);
            }

            // Identificar tipos especiales
            if (node.type === 'n8n-nodes-base.webhook') {
              console.log(`     🔗 WEBHOOK detectado`);
            } else if (node.type.includes('openAi') || node.name.includes('AI')) {
              console.log(`     🤖 NODO IA detectado`);
            } else if (node.type === 'n8n-nodes-base.function') {
              console.log(`     ⚙️  FUNCIÓN detectada`);
            } else if (node.type === 'n8n-nodes-base.httpRequest') {
              console.log(`     🌐 HTTP REQUEST detectado`);
            }
          });
        }

        // 4. Verificar conexiones
        if (workflow.connections) {
          console.log(`\n🔗 Conexiones: ${Object.keys(workflow.connections).length} nodos conectados`);
        }

      } catch (workflowError) {
        console.log(`   ❌ Error obteniendo workflow: ${workflowError.message}`);
      }

      console.log('\n' + '='.repeat(80));
    }

    console.log('\n✅ Debug completado');

  } catch (error) {
    console.log('\n❌ Error en debug:', error.message);
    console.log('📋 Stack trace:', error.stack);
  } finally {
    await mongoose.connection.close();
  }
}

// Función para debuggear un template específico
async function debugSpecificTemplate(templateId) {
  try {
    console.log(`\n🎯 Debug específico para template: ${templateId}\n`);

    const template = await Template.findById(templateId);
    if (!template) {
      console.log('❌ Template no encontrado');
      return;
    }

    console.log(`Template: ${template.name}`);
    console.log(`N8N Workflow ID: ${template.n8nWorkflowId}`);

    const workflow = await N8nService.getWorkflow(template.n8nWorkflowId);
    
    console.log('\n📋 Estructura completa del workflow:');
    console.log(JSON.stringify(workflow, null, 2));

  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

// Ejecutar según argumentos
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    // Debug específico
    debugSpecificTemplate(args[0]);
  } else {
    // Debug general
    debugTemplate();
  }
}

module.exports = { debugTemplate, debugSpecificTemplate }; 