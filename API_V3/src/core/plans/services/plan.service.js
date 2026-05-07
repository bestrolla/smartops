const Plan = require('../models/plan.model');

class PlanService {
  static async createPlan(planData) {
    const newPlan = await Plan.create(planData);
    return newPlan;
  }

  static async getPlanById(planId) {
    return Plan.findById(planId);
  }

  static async getAllPlans(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const plans = await Plan.find().skip(skip).limit(limit);
    const total = await Plan.countDocuments();
    return { plans, total };
  }

  static async updatePlan(planId, updateData) {
    const updatedPlan = await Plan.findByIdAndUpdate(planId, { $set: updateData }, { new: true });
    if (!updatedPlan) {
      throw new Error('Plan no encontrado');
    }
    return updatedPlan;
  }

  static async deletePlan(planId) {
    const deletedPlan = await Plan.findByIdAndDelete(planId);
    if (!deletedPlan) {
      throw new Error('Plan no encontrado');
    }
    return { message: 'Plan eliminado exitosamente' };
  }

  // NUEVO: obtener el plan activo más económico
  static async getCheapestActivePlan() {
    const plan = await Plan.find({ isActive: true }).sort({ price: 1 }).limit(1);
    return plan[0] || null;
  }
}

module.exports = PlanService;