const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../../../app');
const Subscription = require('../../../../core/subscriptions/models/subscription.model');
const Plan = require('../../../../core/plans/models/plan.model');

describe('Subscriptions Integration Tests', () => {
  let testPlan;
  let testTenantId;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Subscription.deleteMany({});
    await Plan.deleteMany({});
    
    testPlan = await Plan.create({
      name: 'Test Plan',
      price: 29.99,
      features: ['feature1', 'feature2']
    });

    testTenantId = new mongoose.Types.ObjectId();
  });

  describe('GET /api/subscriptions', () => {
    beforeEach(async () => {
      await Subscription.create([
        {
          tenant_id: new mongoose.Types.ObjectId(),
          plan: testPlan._id,
          status: 'active',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-02-01')
        },
        {
          tenant_id: new mongoose.Types.ObjectId(),
          plan: testPlan._id,
          status: 'pending',
          startDate: new Date('2024-01-15'),
          endDate: new Date('2024-02-15')
        },
        {
          tenant_id: new mongoose.Types.ObjectId(),
          plan: testPlan._id,
          status: 'expired',
          startDate: new Date('2023-12-01'),
          endDate: new Date('2024-01-01')
        }
      ]);
    });

    test('should get all subscriptions', async () => {
      const response = await request(app)
        .get('/api/subscriptions')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
    });

    test('should filter subscriptions by status', async () => {
      const response = await request(app)
        .get('/api/subscriptions?status=active')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe('active');
    });

    test('should filter subscriptions by tenant', async () => {
      const tenantId = new mongoose.Types.ObjectId();
      await Subscription.create({
        tenant_id: tenantId,
        plan: testPlan._id,
        status: 'active'
      });

      const response = await request(app)
        .get(`/api/subscriptions?tenant_id=${tenantId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].tenant_id).toBe(tenantId.toString());
    });

    test('should populate plan details', async () => {
      const response = await request(app)
        .get('/api/subscriptions?populate=plan')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data[0].plan).toBeDefined();
      expect(response.body.data[0].plan.name).toBe(testPlan.name);
      expect(response.body.data[0].plan.price).toBe(testPlan.price);
    });
  });

  describe('GET /api/subscriptions/:id', () => {
    let subscription;

    beforeEach(async () => {
      subscription = await Subscription.create({
        tenant_id: testTenantId,
        plan: testPlan._id,
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
    });

    test('should get subscription by id', async () => {
      const response = await request(app)
        .get(`/api/subscriptions/${subscription._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(subscription._id.toString());
      expect(response.body.data.tenant_id).toBe(testTenantId.toString());
      expect(response.body.data.plan.toString()).toBe(testPlan._id.toString());
      expect(response.body.data.status).toBe('active');
    });

    test('should return 404 for non-existent subscription', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/subscriptions/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Subscription not found');
    });

    test('should return 400 for invalid id format', async () => {
      const response = await request(app)
        .get('/api/subscriptions/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid subscription ID');
    });

    test('should populate plan when requested', async () => {
      const response = await request(app)
        .get(`/api/subscriptions/${subscription._id}?populate=plan`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.plan).toBeDefined();
      expect(response.body.data.plan.name).toBe(testPlan.name);
      expect(response.body.data.plan.price).toBe(testPlan.price);
    });
  });

  describe('POST /api/subscriptions', () => {
    test('should create a new subscription', async () => {
      const subscriptionData = {
        tenant_id: testTenantId,
        plan: testPlan._id,
        status: 'active',
        metadata: { source: 'api' }
      };

      const response = await request(app)
        .post('/api/subscriptions')
        .send(subscriptionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tenant_id).toBe(testTenantId.toString());
      expect(response.body.data.plan.toString()).toBe(testPlan._id.toString());
      expect(response.body.data.status).toBe('active');
      expect(response.body.data.startDate).toBeDefined();
      expect(response.body.data.endDate).toBeDefined();
      expect(response.body.data.metadata).toEqual(subscriptionData.metadata);
    });

    test('should create subscription with custom dates', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-02-01');
      
      const subscriptionData = {
        tenant_id: testTenantId,
        plan: testPlan._id,
        startDate,
        endDate,
        status: 'pending'
      };

      const response = await request(app)
        .post('/api/subscriptions')
        .send(subscriptionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(new Date(response.body.data.startDate).getTime()).toBe(startDate.getTime());
      expect(new Date(response.body.data.endDate).getTime()).toBe(endDate.getTime());
    });

    test('should fail when tenant_id is missing', async () => {
      const subscriptionData = {
        plan: testPlan._id
      };

      const response = await request(app)
        .post('/api/subscriptions')
        .send(subscriptionData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('tenant_id');
    });

    test('should fail when plan is missing', async () => {
      const subscriptionData = {
        tenant_id: testTenantId
      };

      const response = await request(app)
        .post('/api/subscriptions')
        .send(subscriptionData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('plan');
    });

    test('should fail when status is invalid', async () => {
      const subscriptionData = {
        tenant_id: testTenantId,
        plan: testPlan._id,
        status: 'invalid_status'
      };

      const response = await request(app)
        .post('/api/subscriptions')
        .send(subscriptionData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should fail when tenant already has active subscription', async () => {
      await Subscription.create({
        tenant_id: testTenantId,
        plan: testPlan._id,
        status: 'active'
      });

      const subscriptionData = {
        tenant_id: testTenantId,
        plan: testPlan._id,
        status: 'active'
      };

      const response = await request(app)
        .post('/api/subscriptions')
        .send(subscriptionData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already has an active subscription');
    });

    test('should allow creating subscription for tenant with expired subscription', async () => {
      await Subscription.create({
        tenant_id: testTenantId,
        plan: testPlan._id,
        status: 'expired',
        endDate: new Date('2023-12-01')
      });

      const subscriptionData = {
        tenant_id: testTenantId,
        plan: testPlan._id,
        status: 'active'
      };

      const response = await request(app)
        .post('/api/subscriptions')
        .send(subscriptionData)
        .expect(201);

      expect(response.body.success).toBe(true);
    });
  });

  describe('PUT /api/subscriptions/:id', () => {
    let subscription;

    beforeEach(async () => {
      subscription = await Subscription.create({
        tenant_id: testTenantId,
        plan: testPlan._id,
        status: 'pending'
      });
    });

    test('should update subscription', async () => {
      const updateData = {
        status: 'active',
        metadata: { updated: true }
      };

      const response = await request(app)
        .put(`/api/subscriptions/${subscription._id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(updateData.status);
      expect(response.body.data.metadata).toEqual(updateData.metadata);
    });

    test('should update subscription dates', async () => {
      const newStartDate = new Date('2024-02-01');
      const newEndDate = new Date('2024-03-01');
      
      const updateData = {
        startDate: newStartDate,
        endDate: newEndDate
      };

      const response = await request(app)
        .put(`/api/subscriptions/${subscription._id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(new Date(response.body.data.startDate).getTime()).toBe(newStartDate.getTime());
      expect(new Date(response.body.data.endDate).getTime()).toBe(newEndDate.getTime());
    });

    test('should return 404 for non-existent subscription', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/subscriptions/${fakeId}`)
        .send({ status: 'active' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Subscription not found');
    });

    test('should fail when updating with invalid status', async () => {
      const response = await request(app)
        .put(`/api/subscriptions/${subscription._id}`)
        .send({ status: 'invalid_status' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/subscriptions/:id', () => {
    let subscription;

    beforeEach(async () => {
      subscription = await Subscription.create({
        tenant_id: testTenantId,
        plan: testPlan._id,
        status: 'active'
      });
    });

    test('should cancel subscription', async () => {
      const response = await request(app)
        .delete(`/api/subscriptions/${subscription._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('cancelled successfully');

      // Verify subscription is cancelled
      const cancelledSubscription = await Subscription.findById(subscription._id);
      expect(cancelledSubscription.status).toBe('cancelled');
    });

    test('should return 404 for non-existent subscription', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/subscriptions/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Subscription not found');
    });
  });

  describe('PATCH /api/subscriptions/:id/status', () => {
    let subscription;

    beforeEach(async () => {
      subscription = await Subscription.create({
        tenant_id: testTenantId,
        plan: testPlan._id,
        status: 'pending'
      });
    });

    test('should activate subscription', async () => {
      const response = await request(app)
        .patch(`/api/subscriptions/${subscription._id}/status`)
        .send({ status: 'active' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('active');
    });

    test('should expire subscription', async () => {
      const response = await request(app)
        .patch(`/api/subscriptions/${subscription._id}/status`)
        .send({ status: 'expired' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('expired');
    });

    test('should return 404 for non-existent subscription', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .patch(`/api/subscriptions/${fakeId}/status`)
        .send({ status: 'active' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Subscription not found');
    });

    test('should fail when status is invalid', async () => {
      const response = await request(app)
        .patch(`/api/subscriptions/${subscription._id}/status`)
        .send({ status: 'invalid_status' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/subscriptions/tenant/:tenant_id', () => {
    let tenantId;

    beforeEach(async () => {
      tenantId = new mongoose.Types.ObjectId();
      await Subscription.create([
        {
          tenant_id: tenantId,
          plan: testPlan._id,
          status: 'active',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-02-01')
        },
        {
          tenant_id: tenantId,
          plan: testPlan._id,
          status: 'expired',
          startDate: new Date('2023-12-01'),
          endDate: new Date('2024-01-01')
        }
      ]);
    });

    test('should get all subscriptions for tenant', async () => {
      const response = await request(app)
        .get(`/api/subscriptions/tenant/${tenantId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every(sub => sub.tenant_id === tenantId.toString())).toBe(true);
    });

    test('should filter tenant subscriptions by status', async () => {
      const response = await request(app)
        .get(`/api/subscriptions/tenant/${tenantId}?status=active`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe('active');
    });

    test('should return 404 for non-existent tenant', async () => {
      const fakeTenantId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/subscriptions/tenant/${fakeTenantId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No subscriptions found');
    });
  });

  describe('POST /api/subscriptions/:id/renew', () => {
    let subscription;

    beforeEach(async () => {
      subscription = await Subscription.create({
        tenant_id: testTenantId,
        plan: testPlan._id,
        status: 'active',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-02-01')
      });
    });

    test('should renew subscription', async () => {
      const response = await request(app)
        .post(`/api/subscriptions/${subscription._id}/renew`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('active');
      
      // Check that end date is extended
      const originalEndDate = new Date('2024-02-01');
      const newEndDate = new Date(response.body.data.endDate);
      expect(newEndDate.getTime()).toBeGreaterThan(originalEndDate.getTime());
    });

    test('should return 404 for non-existent subscription', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .post(`/api/subscriptions/${fakeId}/renew`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Subscription not found');
    });

    test('should fail to renew cancelled subscription', async () => {
      await Subscription.findByIdAndUpdate(subscription._id, { status: 'cancelled' });

      const response = await request(app)
        .post(`/api/subscriptions/${subscription._id}/renew`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('cannot be renewed');
    });
  });
}); 