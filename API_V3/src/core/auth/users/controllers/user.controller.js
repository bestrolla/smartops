const UserService = require('../services/user.service');

class UserController {
  async create(req, res, next) {
    try {
      const user = await UserService.create(req.body);
      res.status(201).json({
        status: 'success',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const users = await UserService.findAllByTenant(req.user.tenantId);
      res.json({
        status: 'success',
        data: users
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const user = await UserService.findById(req.params.id);
      res.json({
        status: 'success',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const user = await UserService.update(req.params.id, req.body);
      res.json({
        status: 'success',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  async deactivate(req, res, next) {
    try {
      const user = await UserService.deactivate(req.params.id);
      res.json({
        status: 'success',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();