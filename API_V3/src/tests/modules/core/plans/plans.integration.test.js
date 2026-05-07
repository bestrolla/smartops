const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../../../app');
const Plan = require('../../../../core/plans/models/plan.model');

describe('Plans Integration Tests', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Plan.deleteMany({});
  });

  describe('GET /api/plans', () => {
    beforeEach(async () => {
      await Plan.create([
        {
          name: 'Basic Plan',
          price: 29.99,
          features: ['feature1'],
          isActive: true
        },
        {
          name: 'Pro Plan',
          price: 59.99,
          features: ['feature1', 'feature2'],
          isActive: true
        },
        {
          name: 'Enterprise Plan',
          price: 99.99,
          features: ['feature1', 'feature2', 'feature3'],
          isActive: false
        }
      ]);
    });

    test('should get all active plans', async () => {
      const response = await request(app)
        .get('/api/plans')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every(plan => plan.isActive)).toBe(true);
    });

    test('should get all plans including inactive', async () => {
      const response = await request(app)
        .get('/api/plans?includeInactive=true')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
    });

    test('should filter plans by price range', async () => {
      const response = await request(app)
        .get('/api/plans?maxPrice=50')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].price).toBeLessThanOrEqual(50);
    });
  });

  describe('GET /api/plans/:id', () => {
    let plan;

    beforeEach(async () => {
      plan = await Plan.create({
        name: 'Test Plan',
        price: 29.99,
        features: ['feature1', 'feature2'],
        description: 'A test plan'
      });
    });

    test('should get plan by id', async () => {
      const response = await request(app)
        .get(`/api/plans/${plan._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(plan._id.toString());
      expect(response.body.data.name).toBe(plan.name);
      expect(response.body.data.price).toBe(plan.price);
    });

    test('should return 404 for non-existent plan', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/plans/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Plan not found');
    });

    test('should return 400 for invalid id format', async () => {
      const response = await request(app)
        .get('/api/plans/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid plan ID');
    });
  });

  describe('POST /api/plans', () => {
    test('should create a new plan', async () => {
      const planData = {
        name: 'New Plan',
        price: 39.99,
        currency: 'USD',
        features: ['feature1', 'feature2', 'feature3'],
        description: 'A new test plan'
      };

      const response = await request(app)
        .post('/api/plans')
        .send(planData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(planData.name);
      expect(response.body.data.price).toBe(planData.price);
      expect(response.body.data.features).toEqual(planData.features);
      expect(response.body.data.isActive).toBe(true);
    });

    test('should fail when name is missing', async () => {
      const planData = {
        price: 39.99,
        features: ['feature1']
      };

      const response = await request(app)
        .post('/api/plans')
        .send(planData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('name');
    });

    test('should fail when price is missing', async () => {
      const planData = {
        name: 'No Price Plan',
        features: ['feature1']
      };

      const response = await request(app)
        .post('/api/plans')
        .send(planData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('price');
    });

    test('should fail when price is negative', async () => {
      const planData = {
        name: 'Negative Price Plan',
        price: -10,
        features: ['feature1']
      };

      const response = await request(app)
        .post('/api/plans')
        .send(planData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should fail when name already exists', async () => {
      await Plan.create({
        name: 'Duplicate Plan',
        price: 29.99
      });

      const planData = {
        name: 'Duplicate Plan',
        price: 39.99
      };

      const response = await request(app)
        .post('/api/plans')
        .send(planData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('PUT /api/plans/:id', () => {
    let plan;

    beforeEach(async () => {
      plan = await Plan.create({
        name: 'Update Test Plan',
        price: 29.99,
        features: ['feature1']
      });
    });

    test('should update plan', async () => {
      const updateData = {
        name: 'Updated Plan',
        price: 39.99,
        features: ['feature1', 'feature2'],
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/plans/${plan._id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.price).toBe(updateData.price);
      expect(response.body.data.features).toEqual(updateData.features);
      expect(response.body.data.description).toBe(updateData.description);
    });

    test('should partially update plan', async () => {
      const updateData = {
        price: 49.99
      };

      const response = await request(app)
        .put(`/api/plans/${plan._id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(plan.name); // Unchanged
      expect(response.body.data.price).toBe(updateData.price); // Changed
    });

    test('should return 404 for non-existent plan', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/plans/${fakeId}`)
        .send({ name: 'Updated' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Plan not found');
    });

    test('should fail when updating with duplicate name', async () => {
      await Plan.create({
        name: 'Another Plan',
        price: 19.99
      });

      const response = await request(app)
        .put(`/api/plans/${plan._id}`)
        .send({ name: 'Another Plan' })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('DELETE /api/plans/:id', () => {
    let plan;

    beforeEach(async () => {
      plan = await Plan.create({
        name: 'Delete Test Plan',
        price: 29.99
      });
    });

    test('should delete plan', async () => {
      const response = await request(app)
        .delete(`/api/plans/${plan._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');

      // Verify plan is deleted
      const deletedPlan = await Plan.findById(plan._id);
      expect(deletedPlan).toBeNull();
    });

    test('should return 404 for non-existent plan', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/plans/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Plan not found');
    });
  });

  describe('PATCH /api/plans/:id/status', () => {
    let plan;

    beforeEach(async () => {
      plan = await Plan.create({
        name: 'Status Test Plan',
        price: 29.99,
        isActive: true
      });
    });

    test('should activate plan', async () => {
      // First deactivate
      await Plan.findByIdAndUpdate(plan._id, { isActive: false });

      const response = await request(app)
        .patch(`/api/plans/${plan._id}/status`)
        .send({ isActive: true })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isActive).toBe(true);
    });

    test('should deactivate plan', async () => {
      const response = await request(app)
        .patch(`/api/plans/${plan._id}/status`)
        .send({ isActive: false })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isActive).toBe(false);
    });

    test('should return 404 for non-existent plan', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .patch(`/api/plans/${fakeId}/status`)
        .send({ isActive: false })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Plan not found');
    });
  });
}); 