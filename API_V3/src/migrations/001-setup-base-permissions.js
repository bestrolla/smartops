const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Role = require('../core/auth/roles/models/role.model');
const logger = require('../shared/logger');

dotenv.config();

// Permisos base por módulo (organizados por contexto)
const MODULE_PERMISSIONS = {
  ecommerce: {
    products: ['create', 'view', 'update', 'delete', 'manage'],
    categories: ['create', 'view', 'update', 'delete'],
    orders: ['view', 'update', 'cancel']
  },
  services: {
    services: ['create', 'view', 'update', 'delete'],
    categories: ['create', 'view', 'update', 'delete'],
    packages: ['create', 'view', 'update', 'delete']
  },
  professionals: {
    professionals: ['create', 'view', 'update', 'delete'],
    types: ['create', 'view', 'update', 'delete']
  },
  appointments: {
    appointments: ['create', 'view', 'update', 'delete', 'cancel']
  },
  inventory: {
    inventory: ['create', 'view', 'update', 'delete']
  },
  users: {
    profile: ['view', 'update'],
    tenant_users: ['view', 'create', 'update']
  }
};

// Generar permisos completos (module:entity:action)
function generatePermissions(modules) {
  const permissions = [];
  for (const [module, entities] of Object.entries(modules)) {
    for (const [entity, actions] of Object.entries(entities)) {
      actions.forEach(action => {
        permissions.push(`${module}:${entity}:${action}`);
      });
    }
  }
  return permissions;
}

// Roles base del sistema
const BASE_ROLES = [
  {
    name: 'superadmin',
    description: 'Acceso completo a todo el sistema (solo para equipo de la plataforma)',
    permissions: ['all'],
    isSystemRole: true,
    isDefault: false
  },
  {
    name: 'platform_admin',
    description: 'Administrador de la plataforma (soporte técnico)',
    permissions: generatePermissions({
      ecommerce: MODULE_PERMISSIONS.ecommerce,
      users: MODULE_PERMISSIONS.users
    }).filter(p => !p.includes('delete')), // Ejemplo: no pueden eliminar
    isSystemRole: true,
    isDefault: false
  },
  {
    name: 'tenant_owner',
    description: 'Dueño del tenant (máximos privilegios dentro de su organización)',
    permissions: [
      ...generatePermissions(MODULE_PERMISSIONS),
      'tenant:manage',
      'billing:manage'
    ],
    isSystemRole: false,
    isDefault: false
  },
  {
    name: 'tenant_admin',
    description: 'Administrador del tenant (gestión diaria)',
    permissions: [
      ...generatePermissions({
        ecommerce: MODULE_PERMISSIONS.ecommerce,
        users: { 
          profile: MODULE_PERMISSIONS.users.profile,
          tenant_users: ['view', 'create'] // Sin capacidad de actualizar
        }
      }),
      'reports:view'
    ],
    isSystemRole: false,
    isDefault: false
  },
  {
    name: 'tenant_seller',
    description: 'Vendedor (operaciones comerciales)',
    permissions: [
      'ecommerce:products:view',
      'ecommerce:products:manage', // Permiso especial para manejar inventario
      'ecommerce:orders:view',
      'ecommerce:orders:update',
      'users:profile:view'
    ],
    isSystemRole: false,
    isDefault: false
  },
  {
    name: 'customer',
    description: 'Cliente final (rol por defecto)',
    permissions: [
      'ecommerce:products:view',
      'users:profile:view',
      'users:profile:update'
    ],
    isSystemRole: false,
    isDefault: true
  }
];

async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    logger.info('✅ Conectado a MongoDB');
  } catch (error) {
    logger.error('❌ Error conectando a MongoDB:', error);
    process.exit(1);
  }
}

async function createTenantRoles() {
  try {
    const result = await Role.bulkWrite(
      BASE_ROLES.map(role => ({
        updateOne: {
          filter: { name: role.name },
          update: { $setOnInsert: role }, // Solo establece en inserción
          upsert: true
        }
      })),
      { ordered: false }
    );

    logger.info('🚀 Migración completada:', {
      creados: result.upsertedCount,
      actualizados: result.modifiedCount
    });

    // Mostrar resumen
    const roles = await Role.find({}).lean();
    logger.info('📋 Roles disponibles:');
    roles.forEach(role => {
      logger.info(`\n🏷️  ${role.name} (${role.isSystemRole ? 'Sistema' : 'Tenant'}):`);
      logger.info(`📝 ${role.description}`);
      logger.info(`🔑 Permisos (${role.permissions.length}):`, 
        role.permissions.length > 5 ? 
          `${role.permissions.slice(0, 5).join(', ')}...` : 
          role.permissions.join(', '));
    });
  } catch (error) {
    logger.error('❌ Error en migración:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Ejecución
(async () => {
  await connectToDatabase();
  await createTenantRoles();
})();