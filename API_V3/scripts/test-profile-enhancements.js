const axios = require('axios');

// Configuración
const BASE_URL = 'http://localhost:3000/api';
const TENANT_ID = '64f8a1b2c3d4e5f6a7b8c9d0'; // Reemplazar con un tenant_id válido
const AUTH_TOKEN = 'your-auth-token-here'; // Reemplazar con un token válido

// Headers para las peticiones
const headers = {
  'Authorization': `Bearer ${AUTH_TOKEN}`,
  'Content-Type': 'application/json'
};

// Función para hacer peticiones con manejo de errores
async function makeRequest(method, url, data = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers,
      ...(data && { data })
    };
    
    const response = await axios(config);
    console.log(`✅ ${method.toUpperCase()} ${url}:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ Error en ${method.toUpperCase()} ${url}:`, {
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });
    return null;
  }
}

// Función principal para probar todas las funcionalidades
async function testProfileEnhancements() {
  console.log('🚀 Iniciando pruebas de mejoras del perfil...\n');

  // 1. Probar gestión de colores
  console.log('🎨 Probando gestión de colores...');
  
  // Obtener colores actuales
  await makeRequest('GET', `/profiles/${TENANT_ID}/colors`);
  
  // Actualizar colores
  await makeRequest('PUT', `/profiles/${TENANT_ID}/colors`, {
    primary_color: '#ff6b6b',
    secondary_color: '#4ecdc4',
    accent_color: '#ffffff',
    font_family: 'Roboto'
  });
  
  // Verificar colores actualizados
  await makeRequest('GET', `/profiles/${TENANT_ID}/colors`);

  console.log('\n📞 Probando gestión de información de contacto...');
  
  // Obtener información de contacto actual
  await makeRequest('GET', `/profiles/${TENANT_ID}/contact`);
  
  // Actualizar información de contacto
  await makeRequest('PUT', `/profiles/${TENANT_ID}/contact`, {
    email: 'nuevo@ejemplo.com',
    phone: '+584141234567',
    website: 'https://miempresa.com'
  });
  
  // Verificar información actualizada
  await makeRequest('GET', `/profiles/${TENANT_ID}/contact`);

  console.log('\n📋 Probando ordenamiento de secciones...');
  
  // Obtener orden actual de secciones
  await makeRequest('GET', `/profiles/${TENANT_ID}/sections/order`);
  
  // Obtener configuración completa de secciones
  await makeRequest('GET', `/profiles/${TENANT_ID}/sections/config`);
  
  // Actualizar orden de secciones
  await makeRequest('PUT', `/profiles/${TENANT_ID}/sections/order`, {
    section_order: [
      'header',
      'contact',
      'stats',
      'services',
      'testimonials',
      'social'
    ]
  });
  
  // Verificar orden actualizado
  await makeRequest('GET', `/profiles/${TENANT_ID}/sections/order`);

  console.log('\n✅ Pruebas completadas!');
}

// Función para probar casos de error
async function testErrorCases() {
  console.log('\n🧪 Probando casos de error...\n');

  // Probar color inválido
  await makeRequest('PUT', `/profiles/${TENANT_ID}/colors`, {
    primary_color: 'invalid-color'
  });

  // Probar email inválido
  await makeRequest('PUT', `/profiles/${TENANT_ID}/contact`, {
    email: 'invalid-email'
  });

  // Probar orden de secciones inválido
  await makeRequest('PUT', `/profiles/${TENANT_ID}/sections/order`, {
    section_order: ['invalid-section']
  });

  // Probar tenant_id inválido
  await makeRequest('GET', '/profiles/invalid-tenant-id/colors');
}

// Función para mostrar ejemplos de uso
function showUsageExamples() {
  console.log('\n📚 Ejemplos de uso:\n');

  console.log('1. Actualizar solo el color primario:');
  console.log(`PUT ${BASE_URL}/profiles/${TENANT_ID}/colors`);
  console.log('Body: { "primary_color": "#ff6b6b" }\n');

  console.log('2. Actualizar solo el email:');
  console.log(`PUT ${BASE_URL}/profiles/${TENANT_ID}/contact`);
  console.log('Body: { "email": "nuevo@email.com" }\n');

  console.log('3. Reordenar secciones (mover contacto al principio):');
  console.log(`PUT ${BASE_URL}/profiles/${TENANT_ID}/sections/order`);
  console.log('Body: { "section_order": ["header", "contact", "stats", "services", "testimonials", "social"] }\n');

  console.log('4. Obtener configuración completa:');
  console.log(`GET ${BASE_URL}/profiles/${TENANT_ID}/sections/config\n`);
}

// Ejecutar pruebas
async function main() {
  if (TENANT_ID === '64f8a1b2c3d4e5f6a7b8c9d0' || AUTH_TOKEN === 'your-auth-token-here') {
    console.log('⚠️  Por favor, actualiza TENANT_ID y AUTH_TOKEN en el script antes de ejecutar las pruebas.\n');
    showUsageExamples();
    return;
  }

  await testProfileEnhancements();
  await testErrorCases();
  showUsageExamples();
}

// Ejecutar si el script se ejecuta directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testProfileEnhancements,
  testErrorCases,
  showUsageExamples
};
