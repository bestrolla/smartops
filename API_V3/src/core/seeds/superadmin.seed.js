require('dotenv').config();
const mongoose = require('mongoose');
const config = require('../../config');

const Tenant = require('../tenant/models/tenant.model');
const PermissionService = require('../auth/roles/services/permission.service');
const Permission = require('../auth/roles/models/permission.model');
// Asegúrate de tener estos imports
const Role = require('../auth/roles/models/role.model');
const User = require('../auth/users/models/user.model');
const ProfileService = require('../profiles/services/profile.service');

// Ajuste: eliminar índice legado en users y sincronizar índices
async function ensureUserIndexes() {
  try {
    const indexes = await User.collection.indexes();
    const hasBadUserIdUnique = indexes.some(idx => idx.name === 'userId_1' && idx.unique);
    if (hasBadUserIdUnique) {
      await User.collection.dropIndex('userId_1');
      console.log('🔧 Índice incorrecto userId_1 eliminado en users');
    }
    await User.syncIndexes();
    console.log('🔧 Índices de usuarios sincronizados');
  } catch (err) {
    console.warn('⚠️ No se pudo ajustar índices de usuarios:', err.message);
  }
}

async function ensureRoleIndexes() {
  try {
    const indexes = await Role.collection.indexes();
    const hasBadUniqueOnName = indexes.some(idx => idx.name === 'name_1' && idx.unique);
    if (hasBadUniqueOnName) {
      await Role.collection.dropIndex('name_1');
      console.log('🔧 Índice incorrecto name_1 eliminado');
    }
    await Role.syncIndexes();
    console.log('🔧 Índices de roles sincronizados (unique {name, tenantId})');
  } catch (err) {
    console.warn('⚠️ No se pudo ajustar índices de roles:', err.message);
  }
}

async function seedSuperAdminsAndProfile() {
  try {
    const uri = config.MONGO_URI;
    if (!uri) throw new Error('MONGO_URI no está definido');

    await mongoose.connect(uri);
    console.log('✅ Conectado a MongoDB');

    // 1) Tenant SmartOps (upsert)
    const tenantDef = {
      name: 'SmartOps',
      slug: 'smartops',
      domain: 'smartopsve.com',
      isActive: true,
      publicProfile: {
        displayName: 'SmartOps Technology',
        description: 'Soluciones tecnológicas innovadoras',
        contactEmail: 'info@smartops.com',
        logoUrl: 'https://example.com/logo.png'
      },
      businessType: 'general',
      theme: {
        primaryColor: '#4f46e5',
        secondaryColor: '#f43f5e',
        darkMode: false
      },
      // Activamos todas las features para poder probar todos los módulos
      features: {
        appointments: true,
        crm: true,
        ecommerce: true,
        inventory: true,
        orders: true,
        products: true,
        professionals: true,
        services: true,
        customDomain: true,
        automation: true
      }
    };

    const tenant = await Tenant.findOneAndUpdate(
      { slug: tenantDef.slug },
      { $set: tenantDef },
      { new: true, upsert: true }
    );
    console.log(`🏢 Tenant aplicado: ${tenant.name} (${tenant._id})`);

    // Asegurar slug del tenant si no existe
    if (!tenant.slug || tenant.slug.trim().length === 0) {
      const baseSlug = (tenant.name || 'tenant').toLowerCase().trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      const uniqueSlug = await Tenant.generateUniqueSlug(baseSlug);
      tenant.slug = uniqueSlug;
      await tenant.save();
      console.log(`🔧 Slug generado para tenant: ${tenant.slug}`);
    }

    // 2) Permisos por defecto (si ya existen, ignora duplicados)
    console.log('🔐 Generando permisos por defecto...');
    await PermissionService.generateDefaultPermissions();
    const allPermissions = await Permission.find({ isActive: true });
    console.log(`✅ Permisos activos: ${allPermissions.length}`);

    // Consultar rol superadmin preferentemente por tenant; fallback global por nombre
    let superadminRole = await Role.findOne({ name: 'superadmin', tenantId: tenant._id });
    if (!superadminRole) {
      superadminRole = await Role.findOne({ name: 'superadmin' });
    }
    if (!superadminRole) {
      throw new Error('Rol "superadmin" no existe. Ejecuta src/core/scripts/setup-permissions-roles.js antes de este seed.');
    }
  
    // Asegurar metadatos del rol y tenantId requerido
    if (!superadminRole.tenantId) {
      superadminRole.tenantId = tenant._id;
    }
    if (!superadminRole.displayName) superadminRole.displayName = 'Super Admin';
    if (!superadminRole.type) superadminRole.type = 'system';
    if (typeof superadminRole.level !== 'number' || superadminRole.level < 50) superadminRole.level = 100;
  
    // Asignar todos los permisos activos al rol
    const allPermissionIds = allPermissions.map(p => p._id);
    superadminRole.permissions = allPermissionIds;
    await superadminRole.save();
  
    console.log(`👑 Rol aplicado: ${superadminRole.displayName} (${superadminRole.permissions.length} permisos)`);
  
    // Asegurar índices correctos en usuarios antes de crear/actualizar
    await ensureUserIndexes();
  
    // 4) Usuarios superadmin (2 cuentas)
    const usersDef = [
      { username: 'vmontoya', email: 'superadmin@smartops.com', password: 'SuperAdmin123!', firstName: 'Super', lastName: 'Admin' },
      { username: 'etorres', email: 'superadmin2@smartops.com', password: 'SuperAdmin123!', firstName: 'Super', lastName: 'Admin2' }
    ];
  
    for (const u of usersDef) {
      let user = await User.findOne({ username: u.username, tenantId: tenant._id });
      if (!user) {
        user = new User({
          tenantId: tenant._id,
          username: u.username,
          email: u.email,
          password: u.password,
          firstName: u.firstName,
          lastName: u.lastName,
          roles: [superadminRole._id],
          isActive: true
        });
        await user.save();
        console.log(`👤 Usuario creado: ${u.username}`);
      } else {
        const rolesSet = new Set(user.roles.map(r => r.toString()));
        rolesSet.add(superadminRole._id.toString());
        user.roles = Array.from(rolesSet);
        user.isActive = true;
        await user.save();
        console.log(`👤 Usuario actualizado: ${u.username}`);
      }
    }

    // 5) Perfil por defecto del tenant SmartOps
    console.log('🖼️ Creando perfil por defecto para SmartOps...');
    const profileData = {
      public_name: 'SmartOps Technology',
      title: 'Soluciones Tecnológicas',
      specialty: 'Automatización y E-commerce',
      bio: 'Perfil de ejemplo para demostración de módulos y permisos en SmartOps.',
      contact: {
        emails: [{ email: 'contact@smartops.com', type: 'business', label: 'Soporte' }],
        phones: [{ phone: '+58 000-0000000', type: 'whatsapp', label: 'Atención' }],
        website: 'https://smartopsve.com'
      },
      social_links: [
        { platform: 'linkedin', url: 'https://linkedin.com/company/smartops' },
        { platform: 'twitter', url: 'https://twitter.com/smartops' }
      ],
      stats: [
        { label: 'Clientes', value: '120+' },
        { label: 'Automatizaciones', value: '350+' }
      ],
      profile_sections: {
        show_services: true,
        show_products: true,
        show_appointments: true,
        show_stats: true,
        show_testimonials: true,
        show_contact: true,
        show_location: true,
        show_social: true
      },
      section_order: ['header', 'stats', 'services', 'products', 'testimonials', 'contact', 'location', 'social', 'appointments'],
      theme: {
        colors: { primary: '#4f46e5', secondary: '#f43f5e' },
        layout: 'default'
      },
      location: {
        address: 'Caracas, Venezuela',
        city: 'Caracas',
        country: 'VE'
      }
    };

    await ProfileService.createOrUpdateProfile(tenant._id, profileData, null);
    console.log('✅ Perfil por defecto creado/actualizado');

    console.log('🌱 Seed de superadmins y perfil completado');
  } catch (err) {
    console.error('❌ Error en seed de superadmins:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexión cerrada');
  }
}

// Al final del archivo, limpiar bloque duplicado y evitar await a nivel superior
if (require.main === module) {
  seedSuperAdminsAndProfile();
}

module.exports = { seedSuperAdminsAndProfile };