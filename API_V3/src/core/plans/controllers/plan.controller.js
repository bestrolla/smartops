const PlanService = require('../services/plan.service');

class PlanController {
  static async createPlan(req, res) {
    try {
      const newPlan = await PlanService.createPlan(req.body);
      res.status(201).json(newPlan);
    } catch (error) {
      console.error('Error creating plan:', error);
      res.status(500).json({ message: 'Error creating plan', error: error.message });
    }
  }

  static async getPlan(req, res) {
    try {
      const plan = await PlanService.getPlanById(req.params.id);
      if (!plan) {
        return res.status(404).json({ message: 'Plan no encontrado' });
      }
      res.status(200).json(plan);
    } catch (error) {
      console.error('Error fetching plan:', error);
      res.status(500).json({ message: 'Error fetching plan', error: error.message });
    }
  }

  static async getAllPlans(req, res) {
    try {
      const { page, limit } = req.query;
      const { plans, total } = await PlanService.getAllPlans(parseInt(page), parseInt(limit));
      res.status(200).json({ plans, total });
    } catch (error) {
      console.error('Error fetching all plans:', error);
      res.status(500).json({ message: 'Error fetching plans', error: error.message });
    }
  }

  static async updatePlan(req, res) {
    try {
      const updatedPlan = await PlanService.updatePlan(req.params.id, req.body);
      res.status(200).json(updatedPlan);
    } catch (error) {
      console.error('Error updating plan:', error);
      if (error.message.includes('Plan no encontrado')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: 'Error updating plan', error: error.message });
    }
  }

  static async deletePlan(req, res) {
    try {
      const result = await PlanService.deletePlan(req.params.id);
      res.status(200).json(result);
    } catch (error) {
      console.error('Error deleting plan:', error);
      if (error.message.includes('Plan no encontrado')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: 'Error deleting plan', error: error.message });
    }
  }
}

module.exports = PlanController; 