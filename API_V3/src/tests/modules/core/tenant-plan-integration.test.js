const mongoose = require('mongoose');
const Tenant = require('../../../core/tenant/models/tenant.model');
const Plan = require('../../../core/plans/models/plan.model');
const Subscription = require('../../../core/subscriptions/models/subscription.model');

describe('Integración Tenant-Plan-Subscription', () => {
  let tenant;
  let basicPlan;
  let premiumPlan;

  beforeEach(async () => {
    // Crear planes de prueba
    basicPlan = await Plan.create({
      name: 'Plan Básico',
      price: 29.99,
      currency: 'USD',
      features: {
        appointments: true,
        crm: true,
        products: true,
        services: true,
        inventory: false,
        ecommerce: false,
        orders: false,
        professionals: false,
        customDomain: false
      },
      description: 'Plan básico para pequeños negocios'
    });

    premiumPlan = await Plan.create({
      name: 'Plan Premium',
      price: 99.99,
      currency: 'USD',
      features: {
        appointments: true,
        crm: true,
        products: true,
        services: true,
        inventory: true,
        ecommerce: true,
        orders: true,
        professionals: true,
        customDomain: true
      },
      description: 'Plan premium con todas las características'
    });

    // Crear tenant de prueba
    tenant = await Tenant.create({
      name: 'Test Tenant',
      domain: 'test.smartopsve.com',
      publicProfile: {
        displayName: 'Test Company',
        description: 'Empresa de prueba',
        contactEmail: 'test@test.com'
      }
    });
  });

  describe('Activación de Features', () => {
    it('debe activar los features correctos al crear una suscripción básica', async () => {
      // Crear suscripción al plan básico
      const subscription = await Subscription.create({
        tenant_id: tenant._id,
        plan: basicPlan._id,
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días
      });

      // Recargar el tenant para obtener los cambios
      const updatedTenant = await Tenant.findById(tenant._id);

      // Verificar features activados
      expect(updatedTenant.features.appointments).toBe(true);
      expect(updatedTenant.features.crm).toBe(true);
      expect(updatedTenant.features.products).toBe(true);
      expect(updatedTenant.features.services).toBe(true);

      // Verificar features desactivados
      expect(updatedTenant.features.inventory).toBe(false);
      expect(updatedTenant.features.ecommerce).toBe(false);
      expect(updatedTenant.features.orders).toBe(false);
      expect(updatedTenant.features.professionals).toBe(false);
      expect(updatedTenant.features.customDomain).toBe(false);
    });

    it('debe activar todos los features al actualizar a plan premium', async () => {
      // Crear suscripción al plan premium
      const subscription = await Subscription.create({
        tenant_id: tenant._id,
        plan: premiumPlan._id,
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      // Recargar el tenant
      const updatedTenant = await Tenant.findById(tenant._id);

      // Verificar que todos los features estén activados
      Object.keys(updatedTenant.features).forEach(feature => {
        expect(updatedTenant.features[feature]).toBe(true);
      });
    });
  });

  describe('Desactivación de Features', () => {
    it('debe desactivar todos los features al cancelar la suscripción', async () => {
      // Crear suscripción activa
      const subscription = await Subscription.create({
        tenant_id: tenant._id,
        plan: premiumPlan._id,
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      // Cancelar la suscripción
      await Subscription.findByIdAndUpdate(subscription._id, {
        status: 'cancelled'
      });

      // Recargar el tenant
      const updatedTenant = await Tenant.findById(tenant._id);

      // Verificar que todos los features estén desactivados
      Object.keys(updatedTenant.features).forEach(feature => {
        expect(updatedTenant.features[feature]).toBe(false);
      });
    });

    it('debe desactivar todos los features al expirar la suscripción', async () => {
      // Crear suscripción activa
      const subscription = await Subscription.create({
        tenant_id: tenant._id,
        plan: premiumPlan._id,
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      // Marcar la suscripción como expirada
      await Subscription.findByIdAndUpdate(subscription._id, {
        status: 'expired'
      });

      // Recargar el tenant
      const updatedTenant = await Tenant.findById(tenant._id);

      // Verificar que todos los features estén desactivados
      Object.keys(updatedTenant.features).forEach(feature => {
        expect(updatedTenant.features[feature]).toBe(false);
      });
    });
  });

  describe('Validaciones del Plan', () => {
    it('debe permitir verificar si un plan tiene un feature específico', () => {
      expect(basicPlan.hasFeature('appointments')).toBe(true);
      expect(basicPlan.hasFeature('ecommerce')).toBe(false);
      
      expect(premiumPlan.hasFeature('appointments')).toBe(true);
      expect(premiumPlan.hasFeature('ecommerce')).toBe(true);
    });
  });
}); 