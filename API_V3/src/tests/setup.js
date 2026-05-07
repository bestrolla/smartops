const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

// Importar todos los modelos para asegurar que estén registrados
require('../features/products/models/Product');
require('../features/products/models/ProductVariant');
require('../features/products/models/Category');
require('../features/inventory/models/Inventory');
require('../core/tenant/models/tenant.model');

// Configurar timeout global para tests
jest.setTimeout(30000);

// Configurar MongoDB para tests
beforeAll(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Conectado a MongoDB para tests');
    if (mongoose.connection.db) {
      console.log(`📊 Base de datos: ${mongoose.connection.db.databaseName}`);
    }
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    throw error;
  }
});

afterAll(async () => {
  try {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  } catch (error) {
    console.error('❌ Error desconectando de MongoDB:', error);
  }
});

// Limpiar datos después de cada test
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
}); 