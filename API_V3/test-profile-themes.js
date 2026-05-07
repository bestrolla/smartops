const mongoose = require('mongoose');
const ProfileTheme = require('./src/core/profiles/models/profileTheme.model');
require('dotenv').config();

// Configuración de MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/smartops';

async function testProfileThemes() {
  try {
    console.log('🚀 Conectando a MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB');

    console.log('\n📊 === TEST PROFILE THEMES ===');
    
    // Contar total de temas
    const totalThemes = await ProfileTheme.countDocuments();
    console.log('📊 Total de temas en DB:', totalThemes);
    
    // Contar temas activos y públicos
    const activeThemes = await ProfileTheme.countDocuments({ isActive: true, isPublic: true });
    console.log('📊 Temas activos y públicos:', activeThemes);
    
    // Obtener todos los temas
    const themes = await ProfileTheme.find({ isActive: true, isPublic: true })
      .sort({ 'usage.rating': -1, 'usage.total_profiles': -1 });
    
    console.log('\n📋 Temas disponibles:');
    themes.forEach((theme, index) => {
      console.log(`${index + 1}. ${theme.name} (${theme.category})`);
      console.log(`   - Estilo: ${theme.style}`);
      console.log(`   - Profesión: ${theme.profession}`);
      console.log(`   - Uso: ${theme.usage.total_profiles} perfiles`);
      console.log(`   - Rating: ${theme.usage.rating}/5`);
      console.log(`   - Colores: ${theme.colors.primary}, ${theme.colors.secondary}, ${theme.colors.accent}`);
      console.log(`   - Layout: ${theme.layout.header} header, ${theme.layout.stats} stats`);
      console.log('');
    });

    // Probar búsqueda por categoría
    console.log('🔍 Probando búsqueda por categoría "designer":');
    const designerThemes = await ProfileTheme.getByCategory('designer');
    console.log(`   Encontrados: ${designerThemes.length} temas`);
    designerThemes.forEach(t => console.log(`   - ${t.name}`));

    // Probar búsqueda por texto
    console.log('\n🔍 Probando búsqueda por texto "web":');
    const searchResults = await ProfileTheme.search('web');
    console.log(`   Encontrados: ${searchResults.length} temas`);
    searchResults.forEach(t => console.log(`   - ${t.name} (${t.profession})`));

    // Probar temas populares
    console.log('\n🏆 Temas más populares:');
    const popularThemes = await ProfileTheme.getPopular(3);
    popularThemes.forEach((theme, index) => {
      console.log(`${index + 1}. ${theme.name} - ${theme.usage.total_profiles} usos`);
    });

    // Probar incremento de uso
    if (themes.length > 0) {
      const testTheme = themes[0];
      console.log(`\n📈 Probando incremento de uso para "${testTheme.name}":`);
      console.log(`   Uso antes: ${testTheme.usage.total_profiles}`);
      
      await testTheme.incrementUsage();
      
      const updatedTheme = await ProfileTheme.findOne({ id: testTheme.id });
      console.log(`   Uso después: ${updatedTheme.usage.total_profiles}`);
    }

    // Probar agregar review
    if (themes.length > 0) {
      const testTheme = themes[0];
      console.log(`\n⭐ Probando agregar review para "${testTheme.name}":`);
      console.log(`   Rating antes: ${testTheme.usage.rating}`);
      
      const review = {
        user_id: new mongoose.Types.ObjectId(),
        rating: 5,
        comment: 'Excelente tema, muy profesional',
        date: new Date()
      };
      
      await testTheme.addReview(review);
      
      const updatedTheme = await ProfileTheme.findOne({ id: testTheme.id });
      console.log(`   Rating después: ${updatedTheme.usage.rating}`);
      console.log(`   Total reviews: ${updatedTheme.usage.reviews.length}`);
    }

    // Estadísticas generales
    console.log('\n📊 Estadísticas generales:');
    const totalUsage = await ProfileTheme.aggregate([
      { $match: { isActive: true, isPublic: true } },
      { $group: { _id: null, total: { $sum: '$usage.total_profiles' } } }
    ]);
    console.log(`   Total de usos: ${totalUsage[0]?.total || 0}`);

    const categoryStats = await ProfileTheme.aggregate([
      { $match: { isActive: true, isPublic: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    console.log('   Temas por categoría:');
    categoryStats.forEach(stat => {
      console.log(`     ${stat._id}: ${stat.count} temas`);
    });

    console.log('\n🎉 ¡Test completado exitosamente!');
    
  } catch (error) {
    console.error('❌ Error en el test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar el test
if (require.main === module) {
  testProfileThemes();
}

module.exports = { testProfileThemes };
