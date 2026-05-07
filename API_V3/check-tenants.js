const mongoose = require('mongoose');
require('dotenv').config();

async function checkTenants() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smartops_dev');
    console.log('✅ Conectado a MongoDB');

    const Tenant = mongoose.model('Tenant', new mongoose.Schema({}, { strict: false }));
    const tenants = await Tenant.find({});
    
    console.log(`📊 Total de tenants: ${tenants.length}`);
    
    if (tenants.length === 0) {
      console.log('🔍 No hay tenants en la base de datos');
      console.log('💡 Necesitas crear al menos un tenant para probar');
    } else {
      console.log('\n📋 Lista de tenants:');
      tenants.forEach((tenant, index) => {
        console.log(`${index + 1}. Nombre: ${tenant.name}`);
        console.log(`   Slug: ${tenant.slug || '❌ SIN SLUG'}`);
        console.log(`   Activo: ${tenant.isActive ? '✅' : '❌'}`);
        console.log(`   Display: ${tenant.displayName || tenant.publicProfile?.displayName || tenant.name}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

checkTenants(); 