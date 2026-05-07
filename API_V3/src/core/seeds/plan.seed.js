require('dotenv').config();
const mongoose = require('mongoose');
const config = require('../../config');
const Plan = require('../plans/models/plan.model');

const PLAN_DEFINITIONS = [
  {
    name: 'Trial (14 días)',
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
      automation: true
    },
    description: 'Prueba gratuita de 14 días con acceso completo y automatización básica. Limitantes de uso se definirán.',
    isActive: true
  },
  {
    name: 'Plan E-commerce',
    price: 29.99,
    currency: 'USD',
    features: {
      // Dominio e-commerce: catálogo, pedidos/checkout, stock
      products: true,
      orders: true,        // representa checkout/flujo de pedidos
      ecommerce: true,
      inventory: true,
      // No incluye servicios ni profesionales
      services: false,
      professionals: false,
      // Otros módulos
      appointments: false,
      crm: false,
      customDomain: false,
      // Automatización básica
      automation: true
    },
    description: 'E-commerce: catálogo, pedidos/checkout e inventario con automatización básica',
    isActive: true
  },
  {
    name: 'Plan Profesional',
    price: 29.99,
    currency: 'USD',
    features: {
      // Dominio profesional: servicios y agenda/equipo
      services: true,
      professionals: true,
      appointments: true,
      // No incluye e-commerce
      products: false,
      orders: false,
      ecommerce: false,
      inventory: false,
      // Otros módulos
      crm: false,
      customDomain: false,
      // Automatización básica
      automation: true
    },
    description: 'Profesional: servicios, agenda y equipo con automatización básica',
    isActive: true
  },
  {
    name: 'Plan Custom (modular)',
    price: 0.01,
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
    description: 'Precio según módulos seleccionados. Se activa por configuración del cliente.',
    isActive: true
  }
];

async function seedPlans() {
  try {
    const uri = config.MONGO_URI;
    if (!uri) throw new Error('MONGO_URI no está definido');

    await mongoose.connect(uri);
    console.log('✅ Conectado a MongoDB');

    const planNames = PLAN_DEFINITIONS.map(p => p.name);

    // Upsert por nombre
    for (const def of PLAN_DEFINITIONS) {
      const updated = await Plan.findOneAndUpdate(
        { name: def.name },
        { $set: def },
        { new: true, upsert: true }
      );
      console.log(`➡️  Plan aplicado: ${updated.name}`);
    }

    // Desactivar otros planes no listados
    const { modifiedCount } = await Plan.updateMany(
      { name: { $nin: planNames } },
      { $set: { isActive: false } }
    );
    console.log(`🪫 Planes desactivados (no listados): ${modifiedCount}`);

    console.log('🌱 Seed de planes completado');
  } catch (err) {
    console.error('❌ Error en seed de planes:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexión cerrada');
  }
}

if (require.main === module) {
  seedPlans();
}

module.exports = { seedPlans };