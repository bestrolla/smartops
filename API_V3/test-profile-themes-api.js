const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001/api';

// Función para hacer peticiones HTTP
async function makeRequest(method, url, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${url}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    console.log(`🌐 Haciendo petición: ${method} ${config.url}`);
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`❌ Error en ${method} ${url}:`);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    } else if (error.request) {
      console.error(`   No se recibió respuesta del servidor`);
      console.error(`   Error:`, error.message);
    } else {
      console.error(`   Error:`, error.message);
    }
    return null;
  }
}

// Función para probar los endpoints
async function testProfileThemesAPI() {
  console.log('🧪 Probando endpoints de temas de perfil...\n');

  // 1. Obtener todos los temas
  console.log('1️⃣ Obteniendo todos los temas...');
  const allThemes = await makeRequest('GET', '/profiles/themes');
  if (allThemes?.success) {
    console.log(`✅ Temas encontrados: ${allThemes.data.themes.length}`);
    allThemes.data.themes.forEach((theme, index) => {
      console.log(`   ${index + 1}. ${theme.name} (${theme.category}) - ${theme.style}`);
    });
  }

  // 2. Obtener temas por categoría
  console.log('\n2️⃣ Obteniendo temas por categoría (designer)...');
  const designerThemes = await makeRequest('GET', '/profiles/themes?category=designer');
  if (designerThemes?.success) {
    console.log(`✅ Temas de diseñador encontrados: ${designerThemes.data.themes.length}`);
  }

  // 3. Buscar temas
  console.log('\n3️⃣ Buscando temas con "web"...');
  const searchResults = await makeRequest('GET', '/profiles/themes/search?q=web');
  if (searchResults?.success) {
    console.log(`✅ Resultados de búsqueda: ${searchResults.data.length}`);
  }

  // 4. Obtener tema específico
  console.log('\n4️⃣ Obteniendo tema específico (carlos-carrasco)...');
  const specificTheme = await makeRequest('GET', '/profiles/themes/carlos-carrasco');
  if (specificTheme?.success) {
    console.log(`✅ Tema encontrado: ${specificTheme.data.name}`);
    console.log(`   Colores: ${specificTheme.data.colors.primary}, ${specificTheme.data.colors.secondary}`);
  }

  // 5. Obtener temas populares
  console.log('\n5️⃣ Obteniendo temas populares...');
  const popularThemes = await makeRequest('GET', '/profiles/themes/popular?limit=3');
  if (popularThemes?.success) {
    console.log(`✅ Temas populares: ${popularThemes.data.length}`);
  }

  // 6. Obtener estadísticas
  console.log('\n6️⃣ Obteniendo estadísticas de temas...');
  const stats = await makeRequest('GET', '/profiles/themes/stats');
  if (stats?.success) {
    console.log(`✅ Estadísticas obtenidas:`);
    console.log(`   Total de temas: ${stats.data.total_themes}`);
    console.log(`   Total de uso: ${stats.data.total_usage}`);
    console.log(`   Categorías: ${stats.data.category_stats.length}`);
  }

  // 7. Probar endpoint de temas para tenant específico
  console.log('\n7️⃣ Probando endpoint de temas para tenant...');
  const tenantThemes = await makeRequest('GET', '/profiles/507f1f77bcf86cd799439011/themes');
  if (tenantThemes?.success) {
    console.log(`✅ Temas disponibles para tenant: ${tenantThemes.data.themes.length}`);
  }

  // 8. Probar aplicación de tema (simulado)
  console.log('\n8️⃣ Probando aplicación de tema (simulado)...');
  const applyTheme = await makeRequest('POST', '/profiles/507f1f77bcf86cd799439011/themes/apply', {
    theme_id: 'carlos-carrasco'
  });
  if (applyTheme?.success) {
    console.log(`✅ Tema aplicado exitosamente: ${applyTheme.data.theme.name}`);
  }

  console.log('\n🎉 Pruebas completadas!');
}

// Ejecutar las pruebas
if (require.main === module) {
  testProfileThemesAPI().catch(console.error);
}

module.exports = { testProfileThemesAPI };
