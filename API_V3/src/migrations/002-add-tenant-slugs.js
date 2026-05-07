const mongoose = require('mongoose');
require('dotenv').config();

// Función para generar slug desde un nombre
function generateSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remover caracteres especiales
    .replace(/\s+/g, '-') // Reemplazar espacios con guiones
    .replace(/-+/g, '-') // Remover guiones múltiples
    .replace(/^-|-$/g, ''); // Remover guiones al inicio y final
}

// Función para asegurar unicidad del slug
async function generateUniqueSlug(Tenant, baseSlug) {
  let slug = baseSlug;
  let counter = 1;
  
  while (await Tenant.findOne({ slug })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return slug;
}

async function addSlugsToTenants() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smartops_dev');
    console.log('✅ Conectado a MongoDB');

    // Obtener modelo de Tenant
    const Tenant = mongoose.model('Tenant', new mongoose.Schema({}, { strict: false }));

    // Buscar todos los tenants sin slug
    const tenantsWithoutSlug = await Tenant.find({ slug: { $exists: false } });
    console.log(`📊 Encontrados ${tenantsWithoutSlug.length} tenants sin slug`);

    if (tenantsWithoutSlug.length === 0) {
      console.log('✅ Todos los tenants ya tienen slug');
      return;
    }

    // Procesar cada tenant
    for (const tenant of tenantsWithoutSlug) {
      console.log(`\n🔄 Procesando tenant: ${tenant.name}`);
      
      // Generar slug base
      const baseSlug = generateSlug(tenant.name);
      console.log(`   Slug base generado: ${baseSlug}`);
      
      // Asegurar unicidad
      const uniqueSlug = await generateUniqueSlug(Tenant, baseSlug);
      console.log(`   Slug único: ${uniqueSlug}`);
      
      // Actualizar tenant
      await Tenant.updateOne(
        { _id: tenant._id },
        { $set: { slug: uniqueSlug } }
      );
      
      console.log(`   ✅ Slug actualizado para ${tenant.name}: ${uniqueSlug}`);
    }

    console.log('\n🎉 Migración completada exitosamente');
    console.log(`📈 ${tenantsWithoutSlug.length} tenants actualizados con slugs`);
    
    // Verificar que todos tengan slug ahora
    const remainingWithoutSlug = await Tenant.countDocuments({ slug: { $exists: false } });
    if (remainingWithoutSlug === 0) {
      console.log('✅ Verificación exitosa: Todos los tenants tienen slug');
    } else {
      console.log(`⚠️  Aún quedan ${remainingWithoutSlug} tenants sin slug`);
    }

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar migración si se llama directamente
if (require.main === module) {
  addSlugsToTenants()
    .then(() => {
      console.log('\n✅ Migración finalizada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Error en migración:', error);
      process.exit(1);
    });
}

module.exports = addSlugsToTenants; 