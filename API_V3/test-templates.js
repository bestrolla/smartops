require('dotenv').config();
const mongoose = require('mongoose');
const Template = require('./src/features/automation/models/Template');

async function testTemplates() {
  try {
    console.log('=== TEST TEMPLATES EN MONGODB ===');
    
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB');
    
    // Contar total de templates
    const totalTemplates = await Template.countDocuments();
    console.log('📊 Total de templates en DB:', totalTemplates);
    
    // Contar templates activos y públicos
    const activeTemplates = await Template.countDocuments({ isActive: true, isPublic: true });
    console.log('📊 Templates activos y públicos:', activeTemplates);
    
    // Obtener algunos templates
    const templates = await Template.find({ isActive: true, isPublic: true })
      .select('name description category difficulty createdAt')
      .limit(5);
    
    console.log('📋 Primeros 5 templates:');
    templates.forEach((template, index) => {
      console.log(`${index + 1}. ${template.name} (${template.category})`);
    });
    
    // Simular la consulta exacta del controlador
    console.log('\n🔍 Simulando consulta del controlador...');
    
    const filters = { isActive: true, isPublic: true };
    const page = 1;
    const limit = 20;
    const skip = (page - 1) * limit;
    
    const result = await Template.find(filters)
      .select('-n8nWorkflowId')
      .sort({ 'usage.rating': -1, 'usage.totalClones': -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'name email');
    
    console.log('✅ Consulta exitosa. Resultados:', result.length);
    
    if (result.length > 0) {
      console.log('📋 Primer resultado:', {
        id: result[0]._id,
        name: result[0].name,
        category: result[0].category
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
    process.exit(0);
  }
}

testTemplates(); 