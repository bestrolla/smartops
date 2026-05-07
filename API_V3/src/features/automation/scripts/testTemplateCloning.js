require('dotenv').config();
const mongoose = require('mongoose');
const Template = require('../models/Template');
const Automation = require('../models/Automation');
const Tenant = require('../../../core/tenant/models/tenant.model');
const N8nServiceClass = require('../services/N8nService');
const N8nService = new N8nServiceClass();
const logger = require('../../../shared/logger');

// Conectar a MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/smartops');

/**
 * Script de prueba para verificar la funcionalidad de clonado de templates
 */
async function testTemplateCloning() {
  try {
    console.log('\n🧪 Iniciando pruebas de clonado de templates...\n');

    // 1. Verificar que existan templates
    const templates = await Template.find({ isActive: true, isPublic: true }).limit(5);
    console.log(`📋 Templates disponibles: ${templates.length}`);
    
    if (templates.length === 0) {
      console.log('❌ No hay templates disponibles. Ejecuta createDefaultTemplates.js primero.');
      return;
    }

    // 2. Verificar que existan tenants
    const tenants = await Tenant.find({ isActive: true }).limit(3);
    console.log(`🏢 Tenants disponibles: ${tenants.length}`);
    
    if (tenants.length === 0) {
      console.log('❌ No hay tenants disponibles. Crea un tenant primero.');
      return;
    }

    // 3. Seleccionar un template para probar
    const testTemplate = templates[0];
    console.log(`\n🎯 Probando template: ${testTemplate.name}`);
    console.log(`   Categoría: ${testTemplate.category}`);
    console.log(`   IA habilitada: ${testTemplate.aiConfig.enabled}`);
    console.log(`   Plataformas: ${testTemplate.platforms.join(', ')}`);

    // 4. Seleccionar un tenant para probar
    const testTenant = tenants[0];
    console.log(`\n🏢 Probando con tenant: ${testTenant.name}`);
    console.log(`   Slug: ${testTenant.slug}`);
    console.log(`   Tipo de negocio: ${testTenant.businessType}`);

    // 5. Configurar datos de prueba
    const testConfig = {
      tenantId: testTenant._id.toString(),
      tenantName: testTenant.publicProfile?.displayName || testTenant.name,
      tenantSlug: testTenant.slug,
      name: `Test Automation ${Date.now()}`,
      clientConfig: {
        tenantId: testTenant._id.toString(),
        tenantName: testTenant.publicProfile?.displayName || testTenant.name,
        tenantSlug: testTenant.slug,
        clientName: testTenant.publicProfile?.displayName || testTenant.name,
        companyInfo: {
          name: testTenant.publicProfile?.displayName || testTenant.name,
          description: testTenant.publicProfile?.description || 'Empresa de prueba',
          businessType: testTenant.businessType || 'general'
        },
        businessHours: {
          enabled: true,
          monday: { start: '09:00', end: '18:00' },
          tuesday: { start: '09:00', end: '18:00' },
          wednesday: { start: '09:00', end: '18:00' },
          thursday: { start: '09:00', end: '18:00' },
          friday: { start: '09:00', end: '18:00' }
        },
        variables: {
          CLIENT_NAME: testTenant.publicProfile?.displayName || testTenant.name,
          COMPANY_INFO: testTenant.publicProfile?.description || 'Empresa líder en su sector',
          BUSINESS_TYPE: testTenant.businessType || 'general',
          CONTACT_INFO: testTenant.publicProfile?.contactEmail || 'info@empresa.com'
        },
        platforms: testTemplate.platforms || ['whatsapp', 'webchat']
      },
      aiConfig: testTemplate.aiConfig.enabled ? {
        enabled: true,
        model: testTemplate.aiConfig.model || 'gpt-3.5-turbo',
        temperature: testTemplate.aiConfig.temperature || 0.7,
        maxTokens: testTemplate.aiConfig.maxTokens || 500
      } : null,
      // Usar ObjectId válido para createdBy
      createdBy: testTenant._id,
      // Usar tipo válido (chatbot para templates de IA)
      type: 'chatbot',
      category: testTemplate.category || 'general'
    };

    console.log('\n⚙️  Configuración de prueba preparada');
    console.log(`   Nombre de automatización: ${testConfig.name}`);
    console.log(`   Variables personalizadas: ${testConfig.clientConfig?.variables ? Object.keys(testConfig.clientConfig.variables).length : 0}`);

    // 6. Verificar conectividad con N8N
    console.log('\n🔌 Verificando conectividad con N8N...');
    try {
      const healthCheck = await N8nService.healthCheck();
      console.log('   ✅ N8N conectado correctamente');
      console.log(`   URL: ${process.env.N8N_BASE_URL || 'http://localhost:5678'}`);
    } catch (error) {
      console.log('   ❌ Error conectando con N8N:', error.message);
      console.log('   ⚠️  Verifica que N8N esté ejecutándose y las variables de entorno estén configuradas');
      return;
    }

    // 7. Intentar clonar el template
    console.log('\n🔄 Clonando template...');
    let clonedWorkflow;
    try {
      clonedWorkflow = await N8nService.cloneTemplate(testTemplate.n8nWorkflowId, testConfig);
      console.log('   ✅ Template clonado exitosamente');
      console.log(`   Workflow ID: ${clonedWorkflow.id}`);
      console.log(`   Workflow Name: ${clonedWorkflow.name}`);
      console.log(`   Nodos procesados: ${clonedWorkflow.nodes?.length || 0}`);
    } catch (error) {
      console.log('   ❌ Error clonando template:', error.message);
      console.log('   📋 Detalles del error:');
      console.log(error.stack);
      return;
    }

    // 8. Crear automatización en SmartOps
    console.log('\n📝 Creando automatización en SmartOps...');
    try {
      const automation = new Automation({
        name: testConfig.name,
        description: `Automatización de prueba basada en template: ${testTemplate.name}`,
        type: testConfig.type,
        platforms: testConfig.clientConfig.platforms,
        tenantId: testTenant._id,
        createdBy: testConfig.createdBy,
        isActive: false,
        config: {
          n8nWorkflowId: clonedWorkflow.id,
          templateId: testTemplate._id,
          originalTemplate: testTemplate.name,
          aiConfig: testConfig.aiConfig,
          variables: testConfig.clientConfig.variables,
          webhookUrl: N8nService.createWebhookUrl(clonedWorkflow.id, `${testTenant.slug}-test`)
        },
        stats: {
          totalMessages: 0,
          successfulResponses: 0,
          failedResponses: 0,
          averageResponseTime: 0,
          leadsGenerated: 0,
          appointmentsBooked: 0
        }
      });

      await automation.save();
      console.log('   ✅ Automatización creada exitosamente');
      console.log(`   Automation ID: ${automation._id}`);
      console.log(`   Webhook URL: ${automation.config.webhookUrl}`);

      // 9. Incrementar contador de clones
      await testTemplate.incrementClones();
      console.log('   ✅ Contador de clones actualizado');

    } catch (error) {
      console.log('   ❌ Error creando automatización:', error.message);
      
      // Limpiar workflow en N8N si falló la creación de la automatización
      try {
        await N8nService.deleteWorkflow(clonedWorkflow.id);
        console.log('   🧹 Workflow limpiado de N8N');
      } catch (cleanupError) {
        console.log('   ⚠️  Error limpiando workflow:', cleanupError.message);
      }
      return;
    }

    // 10. Verificar resultados
    console.log('\n📊 Verificando resultados...');
    
    // Verificar que el workflow existe en N8N
    try {
      const workflowInfo = await N8nService.getWorkflow(clonedWorkflow.id);
      console.log('   ✅ Workflow verificado en N8N');
      console.log(`   Nombre: ${workflowInfo.name}`);
      console.log(`   Estado: ${workflowInfo.active ? 'Activo' : 'Inactivo'}`);
    } catch (error) {
      console.log('   ❌ Error verificando workflow:', error.message);
    }

    // Verificar que la automatización existe en SmartOps
    const automationCount = await Automation.countDocuments({ 
      tenantId: testTenant._id,
      'config.n8nWorkflowId': clonedWorkflow.id
    });
    console.log(`   ✅ Automatizaciones encontradas: ${automationCount}`);

    // 11. Mostrar resumen
    console.log('\n📈 Resumen del test:');
    console.log(`   Template usado: ${testTemplate.name}`);
    console.log(`   Tenant: ${testTenant.name}`);
    console.log(`   Workflow ID: ${clonedWorkflow.id}`);
    console.log(`   Nombre del workflow: ${clonedWorkflow.name}`);
    console.log(`   Total de clones del template: ${testTemplate.usage.totalClones + 1}`);

    console.log('\n🎉 ¡Prueba completada exitosamente!');
    console.log('\n💡 Siguiente paso: Prueba el webhook en tu plataforma de chat');

  } catch (error) {
    console.log('\n❌ Error en las pruebas:', error.message);
    console.log('📋 Stack trace:', error.stack);
  } finally {
    // Cerrar conexión
    await mongoose.connection.close();
  }
}

// Ejecutar pruebas si se llama directamente
if (require.main === module) {
  testTemplateCloning();
}

module.exports = { testTemplateCloning }; 