const mongoose = require('mongoose');
const Tenant = require('../../../core/tenant/models/tenant.model');
const User = require('../../../core/auth/users/models/user.model');
const Professional = require('../../../features/professionals/models/Professional.model');
const ProfessionalType = require('../../../features/professionals/models/ProfessionalType.model');

describe('Professionals Module Model Tests', () => {
  let testTenant, testUser;

  beforeEach(async () => {
    testTenant = new Tenant({
      name: 'Test Tenant Professionals',
      isActive: true,
      publicProfile: { displayName: 'Test Tenant Professionals', description: 'Professional tenant', contactEmail: 'pro@example.com' }
    });
    await testTenant.save();

    testUser = new User({
      username: 'testpro',
      email: 'testpro@example.com',
      password: 'Test1234!',
      firstName: 'Test',
      lastName: 'Pro',
      status: 'active',
      isActive: true,
      tenantId: testTenant._id,
      roles: []
    });
    await testUser.save();
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Tenant.deleteMany({});
    await Professional.deleteMany({});
    await ProfessionalType.deleteMany({});
  });

  describe('Professional Model', () => {
    it('should require tenantId, userId, professionalType', async () => {
      const pro = new Professional({});
      let err;
      try { await pro.save(); } catch (e) { err = e; }
      expect(err).toBeDefined();
      expect(err.errors.tenantId).toBeDefined();
      expect(err.errors.userId).toBeDefined();
      expect(err.errors.professionalType).toBeDefined();
    });
    it('should not allow duplicate userId', async () => {
      await Professional.create({
        tenantId: testTenant._id,
        userId: testUser._id,
        professionalType: 'doctor',
        licenseNumber: 'ABC123'
      });
      let err;
      try {
        await Professional.create({
          tenantId: testTenant._id,
          userId: testUser._id,
          professionalType: 'mechanic'
        });
      } catch (e) { err = e; }
      expect(err).toBeDefined();
    });
    it('should only allow valid professionalType', async () => {
      let err;
      try {
        await Professional.create({
          tenantId: testTenant._id,
          userId: testUser._id,
          professionalType: 'invalid'
        });
      } catch (e) { err = e; }
      expect(err).toBeDefined();
    });
    it('should require licenseNumber for doctor/therapist', async () => {
      let err;
      try {
        await Professional.create({
          tenantId: testTenant._id,
          userId: testUser._id,
          professionalType: 'doctor'
        });
      } catch (e) { err = e; }
      expect(err).toBeDefined();
      err = undefined;
      try {
        await Professional.create({
          tenantId: testTenant._id,
          userId: testUser._id,
          professionalType: 'therapist'
        });
      } catch (e) { err = e; }
      expect(err).toBeDefined();
    });
    it('should allow no licenseNumber for mechanic', async () => {
      const pro = await Professional.create({
        tenantId: testTenant._id,
        userId: testUser._id,
        professionalType: 'mechanic'
      });
      expect(pro._id).toBeDefined();
    });
    it('should set default isActive and rating', async () => {
      const pro = await Professional.create({
        tenantId: testTenant._id,
        userId: testUser._id,
        professionalType: 'mechanic'
      });
      expect(pro.isActive).toBe(true);
      expect(pro.rating).toBe(0);
    });
    it('should not allow experienceYears < 0 or > 100', async () => {
      let err;
      try {
        await Professional.create({
          tenantId: testTenant._id,
          userId: testUser._id,
          professionalType: 'mechanic',
          experienceYears: -1
        });
      } catch (e) { err = e; }
      expect(err).toBeDefined();
      err = undefined;
      try {
        await Professional.create({
          tenantId: testTenant._id,
          userId: testUser._id,
          professionalType: 'mechanic',
          experienceYears: 101
        });
      } catch (e) { err = e; }
      expect(err).toBeDefined();
    });
    it('should not allow rating < 0 or > 5', async () => {
      let err;
      try {
        await Professional.create({
          tenantId: testTenant._id,
          userId: testUser._id,
          professionalType: 'mechanic',
          rating: -1
        });
      } catch (e) { err = e; }
      expect(err).toBeDefined();
      err = undefined;
      try {
        await Professional.create({
          tenantId: testTenant._id,
          userId: testUser._id,
          professionalType: 'mechanic',
          rating: 6
        });
      } catch (e) { err = e; }
      expect(err).toBeDefined();
    });
    it('should allow specialties and customFields', async () => {
      const pro = await Professional.create({
        tenantId: testTenant._id,
        userId: testUser._id,
        professionalType: 'mechanic',
        specialties: ['brakes', 'engine'],
        customFields: { foo: 'bar' }
      });
      expect(pro.specialties).toContain('brakes');
      expect(pro.customFields.get('foo')).toBe('bar');
    });
  });

  describe('ProfessionalType Model', () => {
    it('should require tenantId, name', async () => {
      const pt = new ProfessionalType({});
      let err;
      try { await pt.save(); } catch (e) { err = e; }
      expect(err).toBeDefined();
      expect(err.errors.tenantId).toBeDefined();
      expect(err.errors.name).toBeDefined();
    });
    it('should not allow duplicate name for same tenant', async () => {
      await ProfessionalType.create({
        tenantId: testTenant._id,
        name: 'doctor'
      });
      let err;
      try {
        await ProfessionalType.create({
          tenantId: testTenant._id,
          name: 'doctor'
        });
      } catch (e) { err = e; }
      expect(err).toBeDefined();
    });
    it('should set default requiresLicense and isActive', async () => {
      const pt = await ProfessionalType.create({
        tenantId: testTenant._id,
        name: 'trainer'
      });
      expect(pt.requiresLicense).toBe(false);
      expect(pt.isActive).toBe(true);
    });
    it('should only allow valid customFields.fieldType', async () => {
      let err;
      try {
        await ProfessionalType.create({
          tenantId: testTenant._id,
          name: 'custom',
          customFields: [{ fieldName: 'f', fieldType: 'InvalidType' }]
        });
      } catch (e) { err = e; }
      expect(err).toBeDefined();
    });
  });
}); 