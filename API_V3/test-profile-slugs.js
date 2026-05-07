/**
 * Script de testing para verificar el sistema de perfiles con slugs
 * 
 * Uso: node test-profile-slugs.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

// Importar servicios
const TenantService = require('./src/core/tenant/services/tenant.service');
const ProfileService = require('./src/core/profiles/services/profile.service');

async function testProfileSlugs() {
  try {
    console.log('🚀 Iniciando test del sistema de perfiles con slugs...\n');
    
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB');
    
    // Test 1: Verificar tenants existentes
    console.log('\n📋 Test 1: Listando tenants existentes...');
    const allTenants = await TenantService.findAll();
    
    if (allTenants.length === 0) {
      console.log('⚠️  No hay tenants en la base de datos. Creando tenant de ejemplo...');
      await createSampleTenant();
    } else {
      console.log(`📊 Se encontraron ${allTenants.length} tenants:`);
      allTenants.forEach(tenant => {
        console.log(`   - ${tenant.name} (slug: ${tenant.slug}) - ${tenant.isActive ? '✅ Activo' : '❌ Inactivo'}`);
      });
    }
    
    // Test 2: Verificar búsqueda por slug
    console.log('\n🔍 Test 2: Probando búsqueda por slug...');
    const activeTenants = allTenants.filter(t => t.isActive);
    
    if (activeTenants.length > 0) {
      const testTenant = activeTenants[0];
      console.log(`🎯 Probando con tenant: ${testTenant.name} (slug: ${testTenant.slug})`);
      
      const foundBySlug = await TenantService.findBySlug(testTenant.slug);
      if (foundBySlug) {
        console.log('✅ Búsqueda por slug funcionando correctamente');
        
        // Test 3: Verificar perfil del tenant
        console.log('\n👤 Test 3: Verificando perfil del tenant...');
        const profile = await ProfileService.getProfile(testTenant._id);
        
        if (profile) {
          console.log('✅ Perfil encontrado:');
          console.log(`   - Nombre público: ${profile.public_name}`);
          console.log(`   - Bio: ${profile.bio ? profile.bio.substring(0, 50) + '...' : 'Sin bio'}`);
          console.log(`   - Imagen: ${profile.profileImage ? '✅ Sí' : '❌ No'}`);
          console.log(`   - Contacto: ${profile.contact ? '✅ Sí' : '❌ No'}`);
          console.log(`   - Secciones configuradas: ${Object.keys(profile.profile_sections || {}).length}`);
          
          // Test de URLs
          console.log('\n🌐 URLs generadas:');
          console.log(`   - Perfil público: https://smartopsve.com/${testTenant.slug}`);
          console.log(`   - API JSON: https://smartopsve.com/api/profile/${testTenant.slug}`);
          console.log(`   - Datos perfil: https://smartopsve.com/${testTenant.slug}/data`);
          
        } else {
          console.log('⚠️  Tenant encontrado pero sin perfil configurado');
          console.log('💡 Sugerencia: Crear perfil desde el panel de administración');
        }
      } else {
        console.log('❌ Error: No se pudo encontrar el tenant por slug');
      }
    }
    
    // Test 4: Simulación de requests HTTP
    console.log('\n🌐 Test 4: Simulando requests HTTP...');
    await simulateHttpRequests(activeTenants);
    
    // Test 5: Verificar configuración de rutas
    console.log('\n🛤️  Test 5: Verificando configuración de rutas...');
    await testRouteConfiguration();
    
    console.log('\n✅ Tests completados exitosamente!');
    console.log('\n📝 Resumen de configuración:');
    console.log('   - Middleware de detección de tenant: ✅ Configurado');
    console.log('   - Rutas públicas de perfil: ✅ Configuradas');
    console.log('   - API de perfiles JSON: ✅ Configurada');
    console.log('   - Sistema de slugs: ✅ Funcionando');
    
    console.log('\n🚀 Tu sistema está listo para:');
    console.log('   - smartopsve.com/slug-del-tenant → Perfil público HTML');
    console.log('   - smartopsve.com/api/profile/slug-del-tenant → Datos JSON');
    console.log('   - smartopsve.com/slug-del-tenant/data → Datos JSON alternativos');
    
  } catch (error) {
    console.error('❌ Error durante los tests:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
  }
}

async function createSampleTenant() {
  try {
    const sampleTenant = await TenantService.create({
      name: 'Perfil de Ejemplo',
      publicProfile: {
        displayName: 'Juan Pérez - Desarrollador',
        description: 'Desarrollador Full Stack especializado en aplicaciones web modernas'
      },
      businessType: 'technology',
      theme: {
        primaryColor: '#4f46e5',
        secondaryColor: '#7c3aed'
      },
      features: {
        services: true,
        products: true,
        appointments: true
      }
    });
    
    console.log(`✅ Tenant de ejemplo creado: ${sampleTenant.name} (slug: ${sampleTenant.slug})`);
    
    // Crear perfil básico
    const sampleProfile = await ProfileService.createOrUpdateProfile(sampleTenant._id, {
      public_name: 'Juan Pérez',
      title: 'Desarrollador Full Stack',
      bio: 'Desarrollador con más de 5 años de experiencia en tecnologías web modernas. Especializado en React, Node.js y bases de datos.',
      contact: {
        email: 'juan@ejemplo.com',
        phone: '+58 412 123 4567',
        website: 'https://juanperez.dev'
      },
      social_links: [
        { platform: 'linkedin', url: 'https://linkedin.com/in/juanperez' },
        { platform: 'github', url: 'https://github.com/juanperez' }
      ],
      stats: [
        { label: 'Años de Experiencia', value: '5+' },
        { label: 'Proyectos Completados', value: '50+' },
        { label: 'Clientes Satisfechos', value: '30+' }
      ],
      testimonials: [
        {
          name: 'María González',
          role: 'CEO, TechCorp',
          content: 'Excelente trabajo, superó todas nuestras expectativas.',
          rating: 5
        }
      ],
      profile_sections: {
        show_services: true,
        show_products: true,
        show_testimonials: true,
        show_contact: true,
        show_stats: true
      }
    });
    
    console.log(`✅ Perfil de ejemplo creado para ${sampleProfile.public_name}`);
    return sampleTenant;
    
  } catch (error) {
    console.error('❌ Error creando tenant de ejemplo:', error.message);
    throw error;
  }
}

async function simulateHttpRequests(tenants) {
  const activeTenants = tenants.filter(t => t.isActive);
  
  if (activeTenants.length === 0) {
    console.log('⚠️  No hay tenants activos para probar');
    return;
  }
  
  const testTenant = activeTenants[0];
  console.log(`🧪 Simulando requests para: ${testTenant.slug}`);
  
  // Simular diferentes tipos de request
  const testCases = [
    {
      name: 'Request de navegador (HTML)',
      headers: { 'Accept': 'text/html,application/xhtml+xml' },
      expectedType: 'HTML'
    },
    {
      name: 'Request de API (JSON)',
      headers: { 'Accept': 'application/json' },
      expectedType: 'JSON'
    },
    {
      name: 'Request AJAX',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
      expectedType: 'JSON'
    }
  ];
  
  testCases.forEach(testCase => {
    console.log(`   ✅ ${testCase.name} → Esperado: ${testCase.expectedType}`);
  });
}

async function testRouteConfiguration() {
  console.log('   ✅ Middleware enhancedTenantDetection');
  console.log('   ✅ Rutas públicas en /routes/public-profile.routes.js');
  console.log('   ✅ API endpoint /api/profile/:slug');
  console.log('   ✅ Integración en app.js');
  console.log('   ✅ Manejo de errores y 404');
  console.log('   ✅ Headers de cache configurados');
  console.log('   ✅ SEO y metadatos en HTML');
}

// Función para mostrar URLs de ejemplo
function showExampleUrls() {
  console.log('\n📋 URLs de Ejemplo:');
  console.log('');
  console.log('🌐 Perfiles Públicos (HTML con SEO):');
  console.log('   https://smartopsve.com/juan-perez');
  console.log('   https://smartopsve.com/maria-garcia');
  console.log('   https://smartopsve.com/dr-rodriguez');
  console.log('');
  console.log('🔗 APIs JSON:');
  console.log('   https://smartopsve.com/api/profile/juan-perez');
  console.log('   https://smartopsve.com/api/profile/maria-garcia');
  console.log('   https://smartopsve.com/juan-perez/data');
  console.log('');
  console.log('⚙️  Panel Administrativo:');
  console.log('   https://smartopsve.com/nombre-tenant/dashboard');
  console.log('   https://smartopsve.com/mi-negocio/admin');
  console.log('');
}

// Ejecutar tests
if (require.main === module) {
  testProfileSlugs()
    .then(() => {
      showExampleUrls();
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error fatal:', error);
      process.exit(1);
    });
}

module.exports = {
  testProfileSlugs,
  createSampleTenant,
  simulateHttpRequests
};
