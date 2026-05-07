const mongoose = require('mongoose');
const Plan = require('../../../../core/plans/models/plan.model');

describe('Plan Model Test', () => {
  beforeEach(async () => {
    await Plan.deleteMany({});
  });

  describe('Plan Schema Validation', () => {
    test('should create a valid plan', async () => {
      const validPlan = new Plan({
        name: 'Basic Plan',
        price: 29.99,
        currency: 'USD',
        features: ['feature1', 'feature2'],
        description: 'A basic plan for small businesses',
        isActive: true
      });

      const savedPlan = await validPlan.save();
      expect(savedPlan._id).toBeDefined();
      expect(savedPlan.name).toBe(validPlan.name);
      expect(savedPlan.price).toBe(validPlan.price);
      expect(savedPlan.currency).toBe(validPlan.currency);
      expect(savedPlan.features).toEqual(validPlan.features);
      expect(savedPlan.description).toBe(validPlan.description);
      expect(savedPlan.isActive).toBe(validPlan.isActive);
      expect(savedPlan.createdAt).toBeDefined();
      expect(savedPlan.updatedAt).toBeDefined();
    });

    test('should create plan with default values', async () => {
      const planWithDefaults = new Plan({
        name: 'Default Plan',
        price: 19.99
      });

      const savedPlan = await planWithDefaults.save();
      expect(savedPlan.currency).toBe('USD');
      expect(savedPlan.features).toEqual([]);
      expect(savedPlan.description).toBe('');
      expect(savedPlan.isActive).toBe(true);
    });

    test('should fail when name is missing', async () => {
      const planWithoutName = new Plan({
        price: 29.99
      });

      let err;
      try {
        await planWithoutName.save();
      } catch (error) {
        err = error;
      }
      expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
      expect(err.errors.name).toBeDefined();
    });

    test('should fail when price is missing', async () => {
      const planWithoutPrice = new Plan({
        name: 'No Price Plan'
      });

      let err;
      try {
        await planWithoutPrice.save();
      } catch (error) {
        err = error;
      }
      expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
      expect(err.errors.price).toBeDefined();
    });

    test('should fail when price is negative', async () => {
      const planWithNegativePrice = new Plan({
        name: 'Negative Price Plan',
        price: -10
      });

      let err;
      try {
        await planWithNegativePrice.save();
      } catch (error) {
        err = error;
      }
      expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
      expect(err.errors.price).toBeDefined();
    });

    test('should fail when name is not unique', async () => {
      const plan1 = new Plan({
        name: 'Duplicate Plan',
        price: 29.99
      });
      await plan1.save();

      const plan2 = new Plan({
        name: 'Duplicate Plan',
        price: 39.99
      });

      let err;
      try {
        await plan2.save();
      } catch (error) {
        err = error;
      }
      expect(err).toBeDefined();
      expect(err.code).toBe(11000); // MongoDB duplicate key error
    });

    test('should trim name and description', async () => {
      const planWithSpaces = new Plan({
        name: '  Trimmed Plan  ',
        price: 29.99,
        description: '  Description with spaces  '
      });

      const savedPlan = await planWithSpaces.save();
      expect(savedPlan.name).toBe('Trimmed Plan');
      expect(savedPlan.description).toBe('Description with spaces');
    });

    test('should trim currency', async () => {
      const planWithCurrencySpaces = new Plan({
        name: 'Currency Plan',
        price: 29.99,
        currency: '  EUR  '
      });

      const savedPlan = await planWithCurrencySpaces.save();
      expect(savedPlan.currency).toBe('EUR');
    });
  });

  describe('Plan Queries', () => {
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

    test('should find active plans', async () => {
      const activePlans = await Plan.find({ isActive: true });
      expect(activePlans).toHaveLength(2);
      expect(activePlans.every(plan => plan.isActive)).toBe(true);
    });

    test('should find plans by price range', async () => {
      const affordablePlans = await Plan.find({ price: { $lte: 50 } });
      expect(affordablePlans).toHaveLength(1);
      expect(affordablePlans[0].name).toBe('Basic Plan');
    });

    test('should find plans with specific features', async () => {
      const plansWithFeature2 = await Plan.find({ features: 'feature2' });
      expect(plansWithFeature2).toHaveLength(2);
      expect(plansWithFeature2.every(plan => plan.features.includes('feature2'))).toBe(true);
    });

    test('should sort plans by price', async () => {
      const sortedPlans = await Plan.find().sort({ price: 1 });
      expect(sortedPlans[0].name).toBe('Basic Plan');
      expect(sortedPlans[1].name).toBe('Pro Plan');
      expect(sortedPlans[2].name).toBe('Enterprise Plan');
    });
  });

  describe('Plan Updates', () => {
    let plan;

    beforeEach(async () => {
      plan = await Plan.create({
        name: 'Test Plan',
        price: 29.99,
        features: ['feature1']
      });
    });

    test('should update plan price', async () => {
      const updatedPlan = await Plan.findByIdAndUpdate(
        plan._id,
        { price: 39.99 },
        { new: true }
      );
      expect(updatedPlan.price).toBe(39.99);
    });

    test('should add features to plan', async () => {
      const updatedPlan = await Plan.findByIdAndUpdate(
        plan._id,
        { $push: { features: 'feature2' } },
        { new: true }
      );
      expect(updatedPlan.features).toContain('feature1');
      expect(updatedPlan.features).toContain('feature2');
    });

    test('should deactivate plan', async () => {
      const updatedPlan = await Plan.findByIdAndUpdate(
        plan._id,
        { isActive: false },
        { new: true }
      );
      expect(updatedPlan.isActive).toBe(false);
    });
  });

  describe('Plan Deletion', () => {
    let plan;

    beforeEach(async () => {
      plan = await Plan.create({
        name: 'Delete Test Plan',
        price: 29.99
      });
    });

    test('should delete plan', async () => {
      await Plan.findByIdAndDelete(plan._id);
      const deletedPlan = await Plan.findById(plan._id);
      expect(deletedPlan).toBeNull();
    });
  });

  describe('Plan Indexes', () => {
    test('should have name index', async () => {
      const indexes = await Plan.collection.indexes();
      const nameIndex = indexes.find(index => 
        index.key && index.key.name === 1
      );
      expect(nameIndex).toBeDefined();
    });
  });
}); 