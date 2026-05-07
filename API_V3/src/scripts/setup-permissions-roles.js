const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Role = require('../core/auth/roles/models/role.model');
const Permission = require('../core/auth/roles/models/permission.model');
const User = require('../core/auth/users/models/user.model');
const Tenant = require('../core/tenant/models/tenant.model');
const PermissionService = require('../core/auth/roles/services/permission.service');
dotenv.config();

const setupPermissionsAndRoles = async () => {
  try {
    console.log('🔐 Iniciando configuración de permisos y roles globales del sistema...');

    // Crear/obtener tenant del sistema
    console.log('🏢 Configurando tenant del sistema...');
    let systemTenant = await Tenant.findOne({ slug: 'system' });
    if (!systemTenant) {
      systemTenant = await Tenant.create({
        name: 'Sistema Global',
        slug: 'system',
        domain: 'system.smartops.local',
        publicProfile: {
          description: 'Tenant especial para roles y permisos del sistema'
        }
      });
      console.log('✅ Tenant del sistema creado');
    } else {
      console.log('✅ Tenant del sistema encontrado');
    }

    // Generar permisos por defecto si no existen
    console.log('🔐 Generando permisos por defecto...');
    let permissions = await Permission.find({ isActive: true });
    
    if (permissions.length === 0) {
      permissions = await PermissionService.generateDefaultPermissions();
      console.log('✅ Permisos generados:', permissions.length);
    } else {
      console.log('✅ Permisos existentes encontrados:', permissions.length);
    }

    // Verificar si los roles del sistema ya existen
    const existingRoles = await Role.find({ tenantId: systemTenant._id, type: 'system' });
    if (existingRoles.length > 0) {
      console.log('⚠️  Ya existen roles del sistema. Actualizando...');
    }

    // Crear/actualizar roles del sistema
    console.log('👥 Configurando roles del sistema...');
    
    // Superadmin - Nivel máximo, todos los permisos
    const superadminRole = await Role.findOneAndUpdate(
      { name: 'superadmin', tenantId: systemTenant._id },
      {
        name: 'superadmin',
        displayName: 'Super Administrador',
        description: 'Control total del sistema',
        type: 'system',
        permissions: permissions.map(p => p._id),
        tenantId: systemTenant._id,
        level: 100,
        isActive: true
      },
      { upsert: true, new: true }
    );

    // Admin - Nivel alto, mayoría de permisos excepto algunos críticos
    const adminPermissions = permissions.filter(p => 
      !(p.code.includes('delete:roles') || 
        p.code.includes('delete:tenants') ||
        p.code.includes('manage:system'))
    );

    const adminRole = await Role.findOneAndUpdate(
      { name: 'admin', tenantId: systemTenant._id },
      {
        name: 'admin',
        displayName: 'Administrador',
        description: 'Administrador de la plataforma',
        type: 'system',
        permissions: adminPermissions.map(p => p._id),
        tenantId: systemTenant._id,
        level: 80,
        isActive: true
      },
      { upsert: true, new: true }
    );

    // Manager - Nivel medio-alto, gestión operativa
    const managerPermissions = permissions.filter(p => 
      (p.action === 'read' || 
       p.action === 'create' || 
       p.action === 'update' ||
       p.code.includes('manage:inventory') ||
       p.code.includes('manage:orders') ||
       p.code.includes('view:reports'))
    );

    const managerRole = await Role.findOneAndUpdate(
      { name: 'manager', tenantId: systemTenant._id },
      {
        name: 'manager',
        displayName: 'Gerente',
        description: 'Gerente con acceso a gestión operativa',
        type: 'system',
        permissions: managerPermissions.map(p => p._id),
        tenantId: systemTenant._id,
        level: 60,
        isActive: true
      },
      { upsert: true, new: true }
    );

    // Inventory Manager - Gestión de productos e inventario
    const inventoryPermissions = permissions.filter(p => 
      p.resource === 'products' ||
      p.resource === 'inventory' ||
      p.resource === 'variants' ||
      (p.resource === 'orders' && p.action === 'read')
    );

    const inventoryRole = await Role.findOneAndUpdate(
      { name: 'inventory_manager', tenantId: systemTenant._id },
      {
        name: 'inventory_manager',
        displayName: 'Gestor de Inventario',
        description: 'Gestión de productos e inventario',
        type: 'system',
        permissions: inventoryPermissions.map(p => p._id),
        tenantId: systemTenant._id,
        level: 40,
        isActive: true
      },
      { upsert: true, new: true }
    );

    // Sales - Ventas y atención al cliente
    const salesPermissions = permissions.filter(p => 
      (p.resource === 'orders' && ['create', 'read', 'update'].includes(p.action)) ||
      (p.resource === 'customers' && ['create', 'read', 'update'].includes(p.action)) ||
      (p.resource === 'products' && p.action === 'read') ||
      (p.resource === 'inventory' && p.action === 'read')
    );

    const salesRole = await Role.findOneAndUpdate(
      { name: 'sales', tenantId: systemTenant._id },
      {
        name: 'sales',
        displayName: 'Ventas',
        description: 'Equipo de ventas',
        type: 'system',
        permissions: salesPermissions.map(p => p._id),
        tenantId: systemTenant._id,
        level: 30,
        isActive: true
      },
      { upsert: true, new: true }
    );

    // Customer - Cliente final
    const customerPermissions = permissions.filter(p => 
      (p.resource === 'products' && p.action === 'read') ||
      (p.resource === 'orders' && ['create', 'read'].includes(p.action)) ||
      (p.resource === 'appointments' && ['create', 'read'].includes(p.action))
    );

    const customerRole = await Role.findOneAndUpdate(
      { name: 'customer', tenantId: systemTenant._id },
      {
        name: 'customer',
        displayName: 'Cliente',
        description: 'Cliente final con acceso a compras',
        type: 'system',
        permissions: customerPermissions.map(p => p._id),
        tenantId: systemTenant._id,
        level: 5,
        isActive: true
      },
      { upsert: true, new: true }
    );

    // Usuario básico - Acceso mínimo
    const userPermissions = permissions.filter(p => 
      (p.resource === 'products' && p.action === 'read') ||
      (p.resource === 'orders' && p.action === 'read')
    );

    const userRole = await Role.findOneAndUpdate(
      { name: 'user', tenantId: systemTenant._id },
      {
        name: 'user',
        displayName: 'Usuario',
        description: 'Usuario con acceso básico',
        type: 'system',
        permissions: userPermissions.map(p => p._id),
        tenantId: systemTenant._id,
        level: 10,
        isActive: true
      },
      { upsert: true, new: true }
    );

    console.log('✅ Roles configurados:', [
      superadminRole.name,
      adminRole.name,
      managerRole.name,
      inventoryRole.name,
      salesRole.name,
      customerRole.name,
      userRole.name
    ].join(', '));

    // Verificar usuarios existentes sin roles y asignar rol básico
    console.log('👤 Verificando usuarios sin roles...');
    const usersWithoutRoles = await User.find({
      $or: [
        { roles: { $exists: false } },
        { roles: { $size: 0 } }
      ]
    });

    if (usersWithoutRoles.length > 0) {
      console.log(`📝 Asignando rol 'user' a ${usersWithoutRoles.length} usuarios sin roles...`);
      await User.updateMany(
        {
          _id: { $in: usersWithoutRoles.map(u => u._id) }
        },
        {
          $addToSet: { roles: userRole._id }
        }
      );
      console.log('✅ Roles asignados a usuarios existentes');
    }

    // Resumen final
    console.log('🎉 Configuración de permisos y roles globales completada!');
    console.log('📋 Resumen:');
    console.log(`   - Permisos globales: ${permissions.length}`);
    console.log(`   - Roles del sistema: 7`);
    console.log(`   - Usuarios actualizados: ${usersWithoutRoles.length}`);
    console.log(`   - Tenant del sistema: ${systemTenant.name}`);
    console.log('ℹ️  Los tenants individuales ahora pueden agregar roles y permisos personalizados adicionales');

    return {
      systemTenant: systemTenant,
      permissions,
      roles: {
        superadmin: superadminRole,
        admin: adminRole,
        manager: managerRole,
        inventory: inventoryRole,
        sales: salesRole,
        customer: customerRole,
        user: userRole
      },
      usersUpdated: usersWithoutRoles.length
    };

  } catch (error) {
    console.error('❌ Error configurando permisos y roles:', error);
    throw error;
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  const MONGO_URI = 'mongodb+srv://vmontoya:gdvggDiLkVaklac4@smartops.9xzlihu.mongodb.net/smartops_admin_v3?retryWrites=true&w=majority&appName=SmartOps';

  if (!MONGO_URI) {
    console.error('❌ Error: MONGO_URI no está definido en la configuración');
    process.exit(1);
  }

  mongoose.connect(MONGO_URI)
    .then(async () => {
      console.log('🔗 Conectado a MongoDB');
      await setupPermissionsAndRoles();
      await mongoose.disconnect();
      console.log('🔌 Desconectado de MongoDB');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Error conectando a MongoDB:', err);
      process.exit(1);
    });
}

module.exports = {
  setupPermissionsAndRoles
};
