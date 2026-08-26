require('dotenv').config();
const mongoose = require('mongoose');
const config = require('../../config');

const { setupPermissionsAndRoles } = require('../../scripts/setup-permissions-roles');
const { seedPlans } = require('./plan.seed');
const { seedSuperAdminsAndProfile } = require('./superadmin.seed');
const { createInitialData } = require('./initial.seed');

async function seedAll() {
  console.log('🚀 === INICIANDO RECONSTRUCCIÓN COMPLETA DE LA BASE DE DATOS DE SMARTOPS === 🚀\n');
  const uri = config.MONGO_URI || process.env.MONGO_URI;

  if (!uri) {
    console.error('❌ Error: MONGO_URI no está definido en el archivo .env');
    process.exit(1);
  }

  try {
    console.log(`🔗 Conectando a MongoDB Atlas...`);
    await mongoose.connect(uri);
    console.log('✅ Conexión a MongoDB establecida exitosamente.\n');

    console.log('--- PASO 1: Configuración de Permisos y Roles Globales ---');
    await setupPermissionsAndRoles();
    console.log('✅ Paso 1 completado.\n');

    console.log('--- PASO 2: Generación de Planes del Sistema ---');
    await seedPlans();
    console.log('✅ Paso 2 completado.\n');

    console.log('--- PASO 3: Generación de Tenant Principal, Superadmins y Perfil ---');
    await seedSuperAdminsAndProfile();
    console.log('✅ Paso 3 completado.\n');

    console.log('--- PASO 4: Generación de Datos Iniciales (Productos, Inventario, Clientes, Citas, Servicios) ---');
    await createInitialData();
    console.log('✅ Paso 4 completado.\n');

    // Cargar plantillas de automatización si existen los scripts
    try {
      console.log('--- PASO 5: Intentando cargar plantillas de Automatización e IA ---');
      const createDefaultTemplates = require('../../features/automation/scripts/createDefaultTemplates');
      if (typeof createDefaultTemplates === 'function') {
        await createDefaultTemplates();
      }
      const createAIAgentTemplates = require('../../features/automation/scripts/createAIAgentTemplates');
      if (typeof createAIAgentTemplates === 'function') {
        await createAIAgentTemplates();
      }
      console.log('✅ Paso 5 completado.\n');
    } catch (e) {
      console.log('ℹ️ Omitiendo plantillas adicionales de IA (opcional):', e.message, '\n');
    }

    console.log('🎉 === ¡BASE DE DATOS EN MONGODB ATLAS GENERADA Y RESTAURADA CON ÉXITO! === 🎉');
  } catch (error) {
    console.error('❌ Error durante la generación de la base de datos:', error);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('🔌 Conexión con MongoDB cerrada.');
    }
  }
}

if (require.main === module) {
  seedAll();
}

module.exports = { seedAll };
