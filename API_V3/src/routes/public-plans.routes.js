const express = require('express');
const router = express.Router();
const Plan = require('../core/plans/models/plan.model');

// GET /api/public/plans?limit=10&page=1
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const skip = (page - 1) * limit;

    const [plans, total] = await Promise.all([
      Plan.find({ isActive: true }).skip(skip).limit(limit),
      Plan.countDocuments({ isActive: true })
    ]);

    res.json({ plans, total });
  } catch (error) {
    next(error);
  }
});

module.exports = router;