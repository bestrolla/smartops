const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const User = require('./src/core/auth/users/models/user.model');
const Tenant = require('./src/core/tenant/models/tenant.model');

async function fixUserTenants() {
  try {
    console.log('🔍 Verificando usuarios sin tenant...');
    
    // Buscar usuarios sin tenantId
    const usersWithoutTenant = await User.find({
      $or: [
        { tenantId: null },
        { tenantId: undefined },
        { tenantId: { $exists: false } }
      ]
    });

    console.log(`📊 Encontrados ${usersWithoutTenant.length} usuarios sin tenant`);

    if (usersWithoutTenant.length === 0) {
      console.log('✅ Todos los usuarios ya tienen tenant asignado');
      return;
    }

    // Buscar o crear tenant por defecto
    let defaultTenant = await Tenant.findOne({ name: 'Default Tenant' });
    
    if (!defaultTenant) {
      console.log('🏢 Creando tenant por defecto...');
      defaultTenant = new Tenant({
        name: 'Default Tenant',
        slug: 'default',
        domain: 'default.smartops.com',
        isActive: true,
        settings: {
          theme: {
            primaryColor: '#0066CC',
            secondaryColor: '#FF6B35'
          },
          features: {
            ecommerce: true,
            appointments: true,
            crm: true,
            inventory: true
          }
        }
      });
      await defaultTenant.save();
      console.log('✅ Tenant por defecto creado:', defaultTenant._id);
    }

    // Asignar tenant por defecto a usuarios sin tenant
    console.log('🔄 Asignando tenant por defecto a usuarios...');
    
    for (const user of usersWithoutTenant) {
      user.tenantId = defaultTenant._id;
      await user.save();
      console.log(`✅ Usuario ${user.email} ahora tiene tenant: ${defaultTenant._id}`);
    }

    console.log('🎉 ¡Proceso completado exitosamente!');
    console.log(`📈 ${usersWithoutTenant.length} usuarios actualizados`);

  } catch (error) {
    console.error('❌ Error al procesar usuarios:', error);
  } finally {
    mongoose.disconnect();
  }
}

fixUserTenants(); 