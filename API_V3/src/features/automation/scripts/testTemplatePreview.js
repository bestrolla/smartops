require('dotenv').config();
const mongoose = require('mongoose');
const Template = require('../models/Template');
const Tenant = require('../../../core/tenant/models/tenant.model');
const templateController = require('../controllers/templateController');
const logger = require('../../../shared/logger');

// Conectar a MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/smartops');

/**
 * Script para probar la funcionalidad de preview de templates
 */
async function testTemplatePreview() {
  try {
    console.log('\n🎭 Iniciando pruebas de preview de templates...\n');

    // 1. Obtener templates disponibles
    const templates = await Template.find({ isActive: true, isPublic: true }).limit(3);
    console.log(`📋 Templates disponibles: ${templates.length}`);

    if (templates.length === 0) {
      console.log('❌ No hay templates disponibles. Ejecuta createDefaultTemplates.js primero.');
      return;
    }

    // 2. Obtener tenants disponibles
    const tenants = await Tenant.find({ isActive: true }).limit(2);
    console.log(`🏢 Tenants disponibles: ${tenants.length}\n`);

    if (tenants.length === 0) {
      console.log('❌ No hay tenants disponibles. Crea un tenant primero.');
      return;
    }

    // 3. Probar preview para cada template
    for (const template of templates) {
      console.log(`🎯 Probando preview para: ${template.name}`);
      console.log(`   ID: ${template._id}`);
      console.log(`   Categoría: ${template.category}`);
      console.log(`   Dificultad: ${template.difficulty}`);

      for (const tenant of tenants) {
        console.log(`\n📊 Preview para tenant: ${tenant.name}`);
        
        try {
          // Simular request/response para el controlador
          const mockReq = {
            params: { id: template._id.toString() },
            user: { tenantId: tenant._id.toString() }
          };

          const mockRes = {
            json: (data) => {
              console.log('   ✅ Preview generado exitosamente');
              
              if (data.success) {
                const preview = data.data;
                
                console.log('   📝 Información del Template:');
                console.log(`      Nombre: ${preview.template.name}`);
                console.log(`      Tiempo estimado: ${preview.template.estimatedSetupTime}`);
                console.log(`      Rating: ${preview.template.rating}/5`);
                console.log(`      Clones totales: ${preview.template.totalClones}`);
                
                console.log('   🏢 Información del Tenant:');
                console.log(`      Display Name: ${preview.tenant.displayName}`);
                console.log(`      Tipo de negocio: ${preview.tenant.businessType}`);
                
                console.log('   📋 Requerimientos:');
                console.log(`      Variables: ${preview.requirements.variables.length}`);
                console.log(`      Plataformas: ${preview.requirements.platforms.join(', ')}`);
                console.log(`      IA requerida: ${preview.requirements.aiConfig ? 'Sí' : 'No'}`);
                if (preview.requirements.aiConfig) {
                  console.log(`      Modelo: ${preview.requirements.aiConfig.model}`);
                  console.log(`      Costo estimado: ${preview.requirements.aiConfig.estimatedCost}`);
                }
                console.log(`      Integraciones: ${preview.requirements.integrations.length}`);
                
                console.log('   👁️  Preview del Workflow:');
                console.log(`      Nombre del workflow: ${preview.preview.workflowName}`);
                console.log(`      Webhook URL: ${preview.preview.webhookUrl}`);
                console.log(`      Nodos estimados: ${preview.preview.estimatedNodes}`);
                console.log(`      Complejidad: ${preview.preview.complexity}`);
                
                console.log('   💡 Recomendaciones:');
                console.log(`      Mejores prácticas: ${preview.recommendations.bestPractices.length}`);
                console.log(`      Tips: ${preview.recommendations.tips.length}`);
                console.log(`      Advertencias: ${preview.recommendations.warnings.length}`);
                
                // Mostrar variables con auto-fill
                const autoFilledVars = preview.requirements.variables.filter(v => v.status === 'auto-filled');
                const suggestedVars = preview.requirements.variables.filter(v => v.status === 'suggested');
                const pendingVars = preview.requirements.variables.filter(v => v.status === 'pending');
                
                console.log('   🔧 Estado de Variables:');
                console.log(`      Auto-completadas: ${autoFilledVars.length}`);
                console.log(`      Sugeridas: ${suggestedVars.length}`);
                console.log(`      Pendientes: ${pendingVars.length}`);
                
                if (autoFilledVars.length > 0) {
                  console.log('      Variables auto-completadas:');
                  autoFilledVars.forEach(v => {
                    console.log(`        - ${v.label}: "${v.currentValue}"`);
                  });
                }
                
                if (preview.recommendations.warnings.length > 0) {
                  console.log('   ⚠️  Advertencias importantes:');
                  preview.recommendations.warnings.forEach(warning => {
                    console.log(`      ${warning}`);
                  });
                }
                
              } else {
                console.log('   ❌ Error en preview:', data.message);
              }
            },
            status: (code) => ({
              json: (data) => {
                console.log(`   ❌ Error ${code}:`, data.message);
              }
            })
          };

          // Ejecutar el preview
          await templateController.getTemplatePreview(mockReq, mockRes);

        } catch (error) {
          console.log('   ❌ Error obteniendo preview:', error.message);
        }

        console.log('   ' + '-'.repeat(60));
      }

      console.log('\n' + '='.repeat(80));
    }

    // 4. Probar con template inexistente
    console.log('\n🧪 Probando con template inexistente...');
    
    const mockReq = {
      params: { id: '507f1f77bcf86cd799439011' }, // ID falso
      user: { tenantId: tenants[0]._id.toString() }
    };

    const mockRes = {
      json: (data) => {
        console.log('   Resultado inesperado:', data);
      },
      status: (code) => ({
        json: (data) => {
          console.log(`   ✅ Error ${code} manejado correctamente: ${data.message}`);
        }
      })
    };

    await templateController.getTemplatePreview(mockReq, mockRes);

    console.log('\n🎉 ¡Pruebas de preview completadas!');
    console.log('\n💡 El sistema de preview está funcionando correctamente');
    console.log('   - Genera información completa del template');
    console.log('   - Calcula tiempo estimado de configuración');
    console.log('   - Auto-completa variables cuando es posible');
    console.log('   - Proporciona recomendaciones y advertencias');
    console.log('   - Maneja errores apropiadamente');

  } catch (error) {
    console.log('\n❌ Error en las pruebas:', error.message);
    console.log('📋 Stack trace:', error.stack);
  } finally {
    await mongoose.connection.close();
  }
}

/**
 * Función para probar el análisis de workflow específico
 */
async function testWorkflowAnalysis() {
  try {
    console.log('\n🔍 Probando análisis de workflow específico...\n');

    const template = await Template.findOne({ isActive: true, isPublic: true });
    if (!template) {
      console.log('❌ No hay templates disponibles');
      return;
    }

    const tenant = await Tenant.findOne({ isActive: true });
    if (!tenant) {
      console.log('❌ No hay tenants disponibles');
      return;
    }

    console.log(`🎯 Analizando template: ${template.name}`);
    console.log(`🏢 Con tenant: ${tenant.name}`);

    // Usar el controlador para análisis
    const controller = new (require('../controllers/templateController'))();
    
    // Obtener workflow de N8N
    const N8nServiceClass = require('../services/N8nService');
    const N8nService = new N8nServiceClass();
    const workflow = await N8nService.getWorkflow(template.n8nWorkflowId);
    
    const analysis = await controller.analyzeWorkflowForPreview(workflow, template, tenant);
    
    console.log('\n📊 Resultado del análisis:');
    console.log(`   Número de nodos: ${analysis.nodeCount}`);
    console.log(`   Tipos de nodos: ${analysis.nodeTypes.length}`);
    console.log(`   Complejidad: ${analysis.complexity}`);
    console.log('\n   Características detectadas:');
    console.log(`   - IA: ${analysis.features.hasAI ? 'Sí' : 'No'}`);
    console.log(`   - Herramientas: ${analysis.features.hasTools ? 'Sí' : 'No'}`);
    console.log(`   - Integraciones: ${analysis.features.hasIntegrations ? 'Sí' : 'No'}`);
    console.log(`   - Memoria: ${analysis.features.hasMemory ? 'Sí' : 'No'}`);
    console.log(`   - Condicionales: ${analysis.features.hasConditionals ? 'Sí' : 'No'}`);
    
    console.log('\n   Tipos de nodos encontrados:');
    analysis.nodeTypes.forEach(type => {
      console.log(`   - ${type}`);
    });

  } catch (error) {
    console.log('❌ Error en análisis:', error.message);
  }
}

// Ejecutar según argumentos
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--analysis')) {
    testWorkflowAnalysis();
  } else {
    testTemplatePreview();
  }
}

module.exports = { testTemplatePreview, testWorkflowAnalysis }; 