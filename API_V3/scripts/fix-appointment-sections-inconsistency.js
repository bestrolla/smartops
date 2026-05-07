/**
 * Script para arreglar la inconsistencia entre appointment_config.enabled y profile_sections.show_appointments
 * 
 * Este script busca todos los perfiles que tienen inconsistencias entre:
 * - appointment_config.enabled 
 * - profile_sections.show_appointments
 * 
 * Y los sincroniza según la regla: si cualquiera está habilitado, ambos deben estarlo.
 */

const mongoose = require('mongoose');
const ProfileModel = require('../src/core/profiles/models/profile.model');

// Configuración de la base de datos
const DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartops';

async function connectDB() {
  try {
    await mongoose.connect(DB_URI);
    console.log('📄 Conectado a MongoDB');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    process.exit(1);
  }
}

async function findInconsistentProfiles() {
  console.log('🔍 Buscando perfiles con inconsistencias en citas...');
  
  const profiles = await ProfileModel.find({});
  const inconsistentProfiles = [];
  
  for (const profile of profiles) {
    const configEnabled = profile.appointment_config?.enabled || false;
    const sectionEnabled = profile.profile_sections?.show_appointments || false;
    
    if (configEnabled !== sectionEnabled) {
      inconsistentProfiles.push({
        _id: profile._id,
        tenant_id: profile.tenant_id,
        configEnabled,
        sectionEnabled,
        shouldEnable: configEnabled || sectionEnabled // Si cualquiera está habilitado, habilitar ambos
      });
    }
  }
  
  return inconsistentProfiles;
}

async function fixInconsistency(profile) {
  console.log(`🔧 Arreglando perfil ${profile.tenant_id}...`);
  
  const updateData = {
    'appointment_config.enabled': profile.shouldEnable,
    'profile_sections.show_appointments': profile.shouldEnable
  };
  
  try {
    await ProfileModel.findByIdAndUpdate(profile._id, { $set: updateData });
    console.log(`   ✅ Actualizado: config=${profile.shouldEnable}, section=${profile.shouldEnable}`);
    return true;
  } catch (error) {
    console.error(`   ❌ Error actualizando perfil ${profile.tenant_id}:`, error.message);
    return false;
  }
}

async function main() {
  await connectDB();
  
  try {
    const inconsistentProfiles = await findInconsistentProfiles();
    
    if (inconsistentProfiles.length === 0) {
      console.log('✅ No se encontraron inconsistencias en los perfiles');
      return;
    }
    
    console.log(`⚠️  Se encontraron ${inconsistentProfiles.length} perfiles con inconsistencias:`);
    
    for (const profile of inconsistentProfiles) {
      console.log(`   - Tenant ${profile.tenant_id}: config=${profile.configEnabled}, section=${profile.sectionEnabled} → fix=${profile.shouldEnable}`);
    }
    
    console.log('\n🚀 Iniciando corrección...');
    
    let fixed = 0;
    let errors = 0;
    
    for (const profile of inconsistentProfiles) {
      const success = await fixInconsistency(profile);
      if (success) {
        fixed++;
      } else {
        errors++;
      }
    }
    
    console.log(`\n📊 Resultados:`);
    console.log(`   ✅ Perfiles corregidos: ${fixed}`);
    console.log(`   ❌ Errores: ${errors}`);
    console.log(`   📝 Total procesados: ${inconsistentProfiles.length}`);
    
    if (fixed > 0) {
      console.log('\n🎉 ¡Corrección completada exitosamente!');
    }
    
  } catch (error) {
    console.error('❌ Error durante la corrección:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📄 Conexión a MongoDB cerrada');
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { findInconsistentProfiles, fixInconsistency };
