const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Role = require('../auth/roles/models/role.model');
const Permission = require('../auth/roles/models/permission.model');
const User = require('../auth/users/models/user.model');
const Tenant = require('../tenant/models/tenant.model');
const Plan = require('../plans/models/plan.model');
const Subscription = require('../subscriptions/models/subscription.model');
const PermissionService = require('../auth/roles/services/permission.service');
const Product = require('../../features/products/models/Product');
const ProductVariant = require('../../features/products/models/ProductVariant');
const Inventory = require('../../features/inventory/models/Inventory');
// Importar modelos de los otros módulos
let Appointment, CRM, Order, Professional, Service;
try { Appointment = require('../../features/appointments/models/Appointment.model'); } catch {}
try { CRM = require('../../features/crm/models/Customer'); } catch {}
try { Order = require('../../features/orders/models/Order'); } catch {}
try { Professional = require('../../features/professionals/models/Professional.model'); } catch {}
try { Service = require('../../features/services/models/Service.model'); } catch {}

// Limpiar la base de datos antes de crear datos
const cleanDatabase = require('./clean');

const createInitialData = async () => {
  try {
    await cleanDatabase();
    console.log('🌱 Iniciando creación de datos iniciales...');

    // PLANES: Trial (7 días), Básico, Emprendedor, Custom modular
    const trialPlan = await Plan.create({
      name: 'Trial (7 días)',
      price: 0.0,
      currency: 'USD',
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
        automation: false
      },
      description: 'Prueba gratuita de 7 días con todo menos automatizaciones'
    });

    const basicPlan = await Plan.create({
      name: 'Plan Básico',
      price: 29.99,
      currency: 'USD',
      features: {
        appointments: false,
        crm: false,
        ecommerce: false,
        inventory: false,
        orders: false,
        products: true,
        professionals: false,
        services: true,
        customDomain: false,
        automation: true
      },
      description: 'Productos y servicios con automatizaciones'
    });

    const entrepreneurPlan = await Plan.create({
      name: 'Plan Emprendedor',
      price: 59.99,
      currency: 'USD',
      features: {
        appointments: false,
        crm: false,
        ecommerce: false,
        inventory: false,
        orders: false,
        products: true,
        professionals: true, // agentes
        services: true,
        customDomain: false,
        automation: true
      },
      description: 'Productos, servicios, automatizaciones y agentes (profesionales)'
    });

    const customPlan = await Plan.create({
      name: 'Plan Custom (modular)',
      price: 0.01, // evitar colisión con Trial como más barato
      currency: 'USD',
      features: {
        appointments: false,
        crm: false,
        ecommerce: false,
        inventory: false,
        orders: false,
        products: false,
        professionals: false,
        services: false,
        customDomain: false,
        automation: false
      },
      description: 'Precio según módulos seleccionados'
    });

    // Crear tenant de prueba con plan Básico
    const tenant = await Tenant.create({
      name: 'SmartOps',
      domain: 'smartops.com',
      publicProfile: {
        displayName: 'SmartOps Technology',
        description: 'Soluciones tecnológicas innovadoras',
        contactEmail: 'info@smartops.com'
      },
      features: basicPlan.features
    });

    // Suscripción activa al plan Básico
    await Subscription.create({
      tenant_id: tenant._id,
      plan: basicPlan._id,
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    // Generar permisos por defecto
    console.log('🔐 Generando permisos por defecto...');
    const permissions = await PermissionService.generateDefaultPermissions();
    console.log('✅ Permisos generados:', permissions.length);

    // Crear roles del sistema
    console.log('👥 Creando roles del sistema...');
    
    // Superadmin - Nivel máximo, todos los permisos
    const superadminRole = await Role.create({
      name: 'superadmin',
      displayName: 'Super Administrador',
      description: 'Control total del sistema',
      type: 'system',
      permissions: permissions.map(p => p._id),
      tenantId: tenant._id,
      level: 100,
      isActive: true
    });

    // Admin - Nivel alto, mayoría de permisos excepto algunos críticos
    const adminPermissions = permissions.filter(p => 
      !(p.code.includes('delete:roles') || 
        p.code.includes('delete:tenants') ||
        p.code.includes('manage:system'))
    );

    const adminRole = await Role.create({
      name: 'admin',
      displayName: 'Administrador',
      description: 'Administrador de la plataforma',
      type: 'system',
      permissions: adminPermissions.map(p => p._id),
      tenantId: tenant._id,
      level: 80,
      isActive: true
    });

    // Manager - Nivel medio-alto, gestión operativa
    const managerPermissions = permissions.filter(p => 
      (p.action === 'read' || 
       p.action === 'create' || 
       p.action === 'update' ||
       p.code.includes('manage:inventory') ||
       p.code.includes('manage:orders') ||
       p.code.includes('view:reports'))
    );

    const managerRole = await Role.create({
      name: 'manager',
      displayName: 'Gerente',
      description: 'Gerente con acceso a gestión operativa',
      type: 'custom',
      permissions: managerPermissions.map(p => p._id),
      tenantId: tenant._id,
      level: 60,
      isActive: true
    });

    // Inventory Manager - Gestión de productos e inventario
    const inventoryPermissions = permissions.filter(p => 
      p.resource === 'products' ||
      p.resource === 'inventory' ||
      p.resource === 'variants' ||
      (p.resource === 'orders' && p.action === 'read')
    );

    const inventoryRole = await Role.create({
      name: 'inventory_manager',
      displayName: 'Gestor de Inventario',
      description: 'Gestión de productos e inventario',
      type: 'custom',
      permissions: inventoryPermissions.map(p => p._id),
      tenantId: tenant._id,
      level: 40,
      isActive: true
    });

    // Sales - Ventas y atención al cliente
    const salesPermissions = permissions.filter(p => 
      (p.resource === 'orders' && ['create', 'read', 'update'].includes(p.action)) ||
      (p.resource === 'customers' && ['create', 'read', 'update'].includes(p.action)) ||
      (p.resource === 'products' && p.action === 'read') ||
      (p.resource === 'inventory' && p.action === 'read')
    );

    const salesRole = await Role.create({
      name: 'sales',
      displayName: 'Ventas',
      description: 'Equipo de ventas',
      type: 'custom',
      permissions: salesPermissions.map(p => p._id),
      tenantId: tenant._id,
      level: 30,
      isActive: true
    });

    // Customer - Cliente final
    const customerPermissions = permissions.filter(p => 
      (p.resource === 'products' && p.action === 'read') ||
      (p.resource === 'orders' && ['create', 'read'].includes(p.action)) ||
      (p.resource === 'cart' && ['create', 'read', 'update', 'delete'].includes(p.action))
    );

    const customerRole = await Role.create({
      name: 'customer',
      displayName: 'Cliente',
      description: 'Cliente final con acceso a compras',
      type: 'custom',
      permissions: customerPermissions.map(p => p._id),
      tenantId: tenant._id,
      level: 5,
      isActive: true
    });

    // Usuario básico - Acceso mínimo
    const userPermissions = permissions.filter(p => 
      (p.resource === 'products' && p.action === 'read') ||
      (p.resource === 'orders' && p.action === 'read')
    );

    const userRole = await Role.create({
      name: 'user',
      displayName: 'Usuario',
      description: 'Usuario con acceso básico',
      type: 'custom',
      permissions: userPermissions.map(p => p._id),
      tenantId: tenant._id,
      level: 10,
      isActive: true
    });

    console.log('✅ Roles creados:', [
      superadminRole.name,
      adminRole.name,
      managerRole.name,
      inventoryRole.name,
      salesRole.name,
      customerRole.name,
      userRole.name
    ].join(', '));

    // Crear usuarios de ejemplo
    console.log('👤 Creando usuarios de ejemplo...');
    
    const adminUser = await User.create({
      username: 'vmontoya',
      email: 'vmontoya@smartops.com',
      password: 'Admin123!',
      firstName: 'Victor',
      lastName: 'Montoya',
      status: 'active',
      roles: [adminRole._id],
      tenantId: tenant._id,
      isActive: true
    });

    const managerUser = await User.create({
      username: 'maria.garcia',
      email: 'maria.garcia@smartops.com',
      password: 'Manager123!',
      firstName: 'María',
      lastName: 'García',
      status: 'active',
      roles: [managerRole._id],
      tenantId: tenant._id,
      isActive: true
    });

    const inventoryUser = await User.create({
      username: 'carlos.lopez',
      email: 'carlos.lopez@smartops.com',
      password: 'Inventory123!',
      firstName: 'Carlos',
      lastName: 'López',
      status: 'active',
      roles: [inventoryRole._id],
      tenantId: tenant._id,
      isActive: true
    });

    const salesUser = await User.create({
      username: 'ana.rodriguez',
      email: 'ana.rodriguez@smartops.com',
      password: 'Sales123!',
      firstName: 'Ana',
      lastName: 'Rodríguez',
      status: 'active',
      roles: [salesRole._id],
      tenantId: tenant._id,
      isActive: true
    });

    const customerUser = await User.create({
      username: 'juan.perez',
      email: 'juan.perez@example.com',
      password: 'Customer123!',
      firstName: 'Juan',
      lastName: 'Pérez',
      status: 'active',
      roles: [customerRole._id],
      tenantId: tenant._id,
      isActive: true
    });

    console.log('✅ Usuarios creados:', [
      adminUser.username,
      managerUser.username,
      inventoryUser.username,
      salesUser.username,
      customerUser.username
    ].join(', '));

    // Crear productos de ejemplo
    console.log('📦 Creando productos de ejemplo...');

    // Producto con variantes - Laptop
    const laptopProduct = await Product.create({
      tenantId: tenant._id.toString(),
      name: 'Laptop Gaming Pro',
      description: 'Laptop de alto rendimiento para gaming y trabajo profesional',
      sku: 'LAPTOP-GAMING-001',
      basePrice: 1200.00,
      baseCost: 800.00,
      hasVariants: true,
      isActive: true,
      categories: [],
      isDigital: false,
      images: [
        'https://example.com/laptop-1.jpg',
        'https://example.com/laptop-2.jpg'
      ],
      variantOptions: [
        { name: 'Color', values: ['Rojo', 'Azul', 'Negro'] },
        { name: 'RAM', values: ['16GB', '32GB'] }
      ],
      attributes: new Map([
        ['brand', 'TechPro'],
        ['processor', 'Intel i7'],
        ['ram', '16GB'],
        ['storage', '512GB SSD']
      ])
    });

    // Variantes de laptop
    const laptopVariants = await ProductVariant.create([
      {
        tenantId: tenant._id.toString(),
        productId: laptopProduct._id,
        sku: 'LAPTOP-GAMING-001-RED',
        options: [
          { name: 'Color', value: 'Rojo' },
          { name: 'RAM', value: '16GB' }
        ],
        price: 1250.00,
        stock: 15,
        isActive: true,
        skipInventoryCreation: true
      },
      {
        tenantId: tenant._id.toString(),
        productId: laptopProduct._id,
        sku: 'LAPTOP-GAMING-001-BLUE',
        options: [
          { name: 'Color', value: 'Azul' },
          { name: 'RAM', value: '16GB' }
        ],
        price: 1250.00,
        stock: 12,
        isActive: true,
        skipInventoryCreation: true
      },
      {
        tenantId: tenant._id.toString(),
        productId: laptopProduct._id,
        sku: 'LAPTOP-GAMING-001-32GB',
        options: [
          { name: 'Color', value: 'Negro' },
          { name: 'RAM', value: '32GB' }
        ],
        price: 1400.00,
        stock: 8,
        isActive: true,
        skipInventoryCreation: true
      }
    ]);

    // Producto simple - Mouse
    const mouseProduct = await Product.create({
      tenantId: tenant._id.toString(),
      name: 'Mouse Gaming RGB',
      description: 'Mouse ergonómico con iluminación RGB para gaming',
      sku: 'MOUSE-GAMING-001',
      basePrice: 45.00,
      baseCost: 25.00,
      hasVariants: false,
      isActive: true,
      categories: [],
      isDigital: false,
      images: [
        'https://example.com/mouse-1.jpg'
      ],
      attributes: new Map([
        ['brand', 'TechPro'],
        ['dpi', '16000'],
        ['buttons', '6'],
        ['rgb', 'true']
      ])
    });

    // Producto digital - Software
    const softwareProduct = await Product.create({
      tenantId: tenant._id.toString(),
      name: 'Software de Gestión Empresarial',
      description: 'Solución completa para gestión de empresas',
      sku: 'SOFTWARE-GESTION-001',
      basePrice: 299.00,
      baseCost: 50.00,
      hasVariants: false,
      isActive: true,
      categories: [],
      isDigital: true,
      digitalDetails: {
        downloadUrl: 'https://downloads.example.com/software-gestion-v2.0.zip',
        fileSize: '150MB',
        fileType: 'ZIP'
      },
      images: [
        'https://example.com/software-1.jpg'
      ],
      attributes: new Map([
        ['version', '2.0'],
        ['platform', 'Windows/Mac/Linux'],
        ['license', 'Perpetua'],
        ['support', '1 año']
      ])
    });

    console.log('✅ Productos creados:', [
      laptopProduct.name,
      mouseProduct.name,
      softwareProduct.name
    ].join(', '));

    // Crear inventario
    console.log('📊 Creando inventario...');

    const inventoryItems = await Inventory.create([
      // Inventario para variantes de laptop
      {
        tenant_id: tenant._id.toString(),
        product_id: laptopProduct._id,
        variant_id: laptopVariants[0]._id, // Rojo 16GB
        current_stock: 15,
        reserved_stock: 0,
        min_stock: 5,
        max_stock: 50
      },
      {
        tenant_id: tenant._id.toString(),
        product_id: laptopProduct._id,
        variant_id: laptopVariants[1]._id, // Azul 16GB
        current_stock: 12,
        reserved_stock: 0,
        min_stock: 5,
        max_stock: 50
      },
      {
        tenant_id: tenant._id.toString(),
        product_id: laptopProduct._id,
        variant_id: laptopVariants[2]._id, // Negro 32GB
        current_stock: 8,
        reserved_stock: 0,
        min_stock: 3,
        max_stock: 30
      },
      // Inventario para mouse
      {
        tenant_id: tenant._id.toString(),
        product_id: mouseProduct._id,
        variant_id: null,
        current_stock: 50,
        reserved_stock: 0,
        min_stock: 10,
        max_stock: 100
      }
      // No se crea inventario para productos digitales
    ]);

    console.log('✅ Inventario creado para', inventoryItems.length, 'productos');

    // Verificar que el usuario admin se creó correctamente
    const verifyUser = await User.findByCredentials('vmontoya', 'Admin123!');
    if (!verifyUser) {
      throw new Error('Error al verificar las credenciales del usuario creado');
    }

    console.log('✅ Usuario admin verificado:', adminUser.username);

    // --- DECLARACIÓN DE VARIABLES DE RESUMEN ---
    let createdProfessionalTypes = [];
    let createdProfessionalUsers = [];
    let createdProfessionals = [];
    let createdServices = [];
    let createdAppointments = [];

    if (CRM) {
      createdCustomers = await CRM.create([
        {
          tenantId: tenant._id,
          firstName: 'Cliente',
          lastName: 'Ejemplo',
          email: 'cliente.ejemplo@demo.com',
          phone: '+58 412 0000000',
          company: 'Demo S.A.'
        },
        {
          tenantId: tenant._id,
          firstName: 'María',
          lastName: 'González',
          email: 'maria.gonzalez@demo.com',
          phone: '+58 414 7654321',
          company: 'Soluciones XYZ'
        },
        {
          tenantId: tenant._id,
          firstName: 'Pedro',
          lastName: 'Pérez',
          email: 'pedro.perez@demo.com',
          phone: '+58 424 1112233',
          company: 'Servicios ABC'
        }
      ]);
      console.log('✅ Clientes CRM de ejemplo creados');
    }

    if (Order && createdCustomers.length > 0) {
      createdOrders = [];
      const ordersData = [
        {
          tenant_id: tenant._id.toString(),
          customer: createdCustomers[0]._id,
          items: [
            {
              product: laptopProduct._id,
              quantity: 1,
              price: laptopProduct.basePrice
            }
          ],
          status: 'pending',
          paymentMethod: 'cash',
          subtotal: laptopProduct.basePrice,
          tax: laptopProduct.basePrice * 0.16,
          total: laptopProduct.basePrice * 1.16
        },
        {
          tenant_id: tenant._id.toString(),
          customer: createdCustomers[1]._id,
          items: [
            {
              product: mouseProduct._id,
              quantity: 2,
              price: mouseProduct.basePrice
            }
          ],
          status: 'completed',
          paymentMethod: 'credit_card',
          subtotal: mouseProduct.basePrice * 2,
          tax: mouseProduct.basePrice * 2 * 0.16,
          total: mouseProduct.basePrice * 2 * 1.16
        }
      ];
      for (const orderData of ordersData) {
        const order = await Order.create(orderData);
        createdOrders.push(order);
      }
      console.log('✅ Órdenes de ejemplo creadas');
    }

    if (Professional && Service && Appointment) {
      // 1. Crear tipos de profesional
      const ProfessionalType = require('../../features/professionals/models/ProfessionalType.model');
      createdProfessionalTypes = await ProfessionalType.create([
        {
          tenantId: tenant._id,
          name: 'Médico General',
          description: 'Atención médica general',
          requiresLicense: true
        },
        {
          tenantId: tenant._id,
          name: 'Ingeniero de Software',
          description: 'Desarrollo de software',
          requiresLicense: false
        },
        {
          tenantId: tenant._id,
          name: 'Psicólogo',
          description: 'Atención psicológica',
          requiresLicense: true
        }
      ]);

      // 2. Crear usuarios para profesionales
      createdProfessionalUsers = await User.create([
        {
          tenantId: tenant._id,
          username: 'medico.general',
          email: 'medico.general@demo.com',
          password: 'Medico123!',
          firstName: 'Carlos',
          lastName: 'Médico',
          roles: [managerRole._id],
          isActive: true
        },
        {
          tenantId: tenant._id,
          username: 'ingeniero.software',
          email: 'ingeniero.software@demo.com',
          password: 'Ingeniero123!',
          firstName: 'Ana',
          lastName: 'Ingeniera',
          roles: [managerRole._id],
          isActive: true
        },
        {
          tenantId: tenant._id,
          username: 'psicologo.demo',
          email: 'psicologo.demo@demo.com',
          password: 'Psicologo123!',
          firstName: 'Laura',
          lastName: 'Psicóloga',
          roles: [managerRole._id],
          isActive: true
        }
      ]);

      // 3. Crear profesionales asociados a usuarios y tipos
      createdProfessionals = await Professional.create([
        {
          tenantId: tenant._id,
          userId: createdProfessionalUsers[0]._id,
          professionalType: createdProfessionalTypes[0]._id,
          specialties: ['Medicina General'],
          licenseNumber: 'MED12345',
          experienceYears: 10,
          rating: 4.7
        },
        {
          tenantId: tenant._id,
          userId: createdProfessionalUsers[1]._id,
          professionalType: createdProfessionalTypes[1]._id,
          specialties: ['Desarrollo Web', 'Backend'],
          experienceYears: 7,
          rating: 4.5
        },
        {
          tenantId: tenant._id,
          userId: createdProfessionalUsers[2]._id,
          professionalType: createdProfessionalTypes[2]._id,
          specialties: ['Psicología Clínica'],
          licenseNumber: 'PSI67890',
          experienceYears: 5,
          rating: 4.8
        }
      ]);

      // 4. Crear servicios asociados a profesionales
      createdServices = await Service.create([
        {
          tenantId: tenant._id,
          name: 'Consulta General',
          description: 'Consulta médica general',
          duration: 30,
          price: 25,
          currency: 'USD',
          professionals: [createdProfessionals[0]._id]
        },
        {
          tenantId: tenant._id,
          name: 'Desarrollo Web',
          description: 'Servicio de desarrollo web a medida',
          duration: 120,
          price: 300,
          currency: 'USD',
          professionals: [createdProfessionals[1]._id]
        },
        {
          tenantId: tenant._id,
          name: 'Terapia Psicológica',
          description: 'Sesión de terapia psicológica',
          duration: 60,
          price: 50,
          currency: 'USD',
          professionals: [createdProfessionals[2]._id]
        }
      ]);

      // 5. Crear citas asociadas a usuarios, profesionales y servicios
      createdAppointments = await Appointment.create([
        {
          tenantId: tenant._id,
          professionalId: createdProfessionals[0]._id,
          userId: createdCustomers[0]?._id || adminUser._id,
          start: new Date(Date.now() + 3600 * 1000),
          end: new Date(Date.now() + 2 * 3600 * 1000),
          status: 'confirmed',
          type: 'in_person',
          serviceId: createdServices[0]._id,
          notes: 'Consulta médica de rutina'
        },
        {
          tenantId: tenant._id,
          professionalId: createdProfessionals[1]._id,
          userId: createdCustomers[1]?._id || adminUser._id,
          start: new Date(Date.now() + 3 * 3600 * 1000),
          end: new Date(Date.now() + 5 * 3600 * 1000),
          status: 'pending',
          type: 'virtual',
          serviceId: createdServices[1]._id,
          notes: 'Reunión para desarrollo web'
        },
        {
          tenantId: tenant._id,
          professionalId: createdProfessionals[2]._id,
          userId: createdCustomers[2]?._id || adminUser._id,
          start: new Date(Date.now() + 6 * 3600 * 1000),
          end: new Date(Date.now() + 7 * 3600 * 1000),
          status: 'confirmed',
          type: 'in_person',
          serviceId: createdServices[2]._id,
          notes: 'Sesión de terapia psicológica'
        }
      ]);
      console.log('✅ Tipos de profesional, usuarios, profesionales, servicios y citas de ejemplo creados');
    }

    // --- RESUMEN MEJORADO ---
    console.log('🎉 Datos iniciales creados exitosamente!');
    console.log('📋 Resumen:');
    console.log(`   - Tenant: ${tenant.name}`);
    console.log(`   - Permisos: ${permissions.length}`);
    console.log(`   - Roles: 7 creados`);
    console.log(`   - Usuarios: 5 + ${createdProfessionalUsers.length} profesionales creados`);
    console.log(`   - Productos: 3 creados (${laptopVariants.length} variantes)`);
    console.log(`   - Inventario: ${inventoryItems.length} registros`);
    console.log(`   - Clientes CRM: ${createdCustomers.length}`);
    console.log(`   - Órdenes: ${createdOrders.length}`);
    console.log(`   - Tipos de profesional: ${createdProfessionalTypes.length}`);
    console.log(`   - Profesionales: ${createdProfessionals.length}`);
    console.log(`   - Servicios: ${createdServices.length}`);
    console.log(`   - Citas: ${createdAppointments.length}`);

    return {
      tenant,
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
      users: {
        admin: adminUser,
        manager: managerUser,
        inventory: inventoryUser,
        sales: salesUser,
        customer: customerUser
      },
      products: {
        laptop: laptopProduct,
        mouse: mouseProduct,
        software: softwareProduct,
        laptopVariants
      },
      inventory: inventoryItems
    };

  } catch (error) {
    console.error('❌ Error creando datos iniciales:', error);
    throw error;
  }
};

if (require.main === module) {
  const mongoose = require('mongoose');
  const { MONGO_URI } = require('../../config');

  mongoose.connect(MONGO_URI)
    .then(async () => {
      await mongoose.connection.asPromise();
      await createInitialData();
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch(err => {
      console.error('Error conectando a MongoDB:', err);
      process.exit(1);
    });
}

module.exports = {
  createInitialData
};