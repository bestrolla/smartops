const RoleService = require('../services/role.service');
const UserService = require('../../users/services/user.service');
const createError = require('../../../../shared/errors.utils');

class RoleController {
  async create(req, res, next) {
    try {
      const roleData = { ...req.body, tenantId: req.user.tenantId };
      const role = await RoleService.create(roleData);
      res.status(201).json({
        status: 'success',
        data: role
      });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const roles = await RoleService.findAllByTenant(req.user.tenantId);
      res.json({
        status: 'success',
        data: roles
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const role = await RoleService.findById(req.params.id);
      
      console.log('RoleController - getById - req.user.roles:', req.user.roles.map(r => r.name));

      // Allow superadmin to access roles from any tenant
      const isSuperAdmin = req.user.roles.some(r => r.name === 'superadmin');

      // Verify the role belongs to the tenant, unless user is superadmin
      if (!isSuperAdmin && role.tenantId.toString() !== req.user.tenantId.toString()) {
        throw createError(403, 'Unauthorized access to role');
      }
      
      res.json({
        status: 'success',
        data: role
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const role = await RoleService.findById(req.params.id);
      
      // Allow superadmin to update roles from any tenant
      const isSuperAdmin = req.user.roles.some(r => r.name === 'superadmin');

      // Verify the role belongs to the tenant, unless user is superadmin
      if (!isSuperAdmin && role.tenantId.toString() !== req.user.tenantId.toString()) {
        throw createError(403, 'Unauthorized access to role');
      }
      
      const updatedRole = await RoleService.update(req.params.id, req.body);
      res.json({
        status: 'success',
        data: updatedRole
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const role = await RoleService.findById(req.params.id);
      
      // Allow superadmin to delete roles from any tenant
      const isSuperAdmin = req.user.roles.some(r => r.name === 'superadmin');

      // Verify the role belongs to the tenant, unless user is superadmin
      if (!isSuperAdmin && role.tenantId.toString() !== req.user.tenantId.toString()) {
        throw createError(403, 'Unauthorized access to role');
      }
      
      await RoleService.delete(req.params.id);
      res.json({
        status: 'success',
        data: null
      });
    } catch (error) {
      next(error);
    }
  }

  async assignRoles(req, res, next) {
    try {
      const { userId } = req.params;
      const { roleIds } = req.body;
      const { tenantId } = req.user;

      console.log(`Asignando roles ${roleIds} al usuario ${userId} en tenant ${tenantId}`);

      // Verificar que los roles existen y pertenecen al mismo tenant
      await RoleService.verifyRolesExist(roleIds, tenantId);
      
      // Asignar roles al usuario
      const user = await UserService.addRoles(userId, roleIds);
      
      res.json({
        status: 'success',
        data: {
          userId: user._id,
          assignedRoles: roleIds,
          currentRoles: user.roles
        }
      });
    } catch (error) {
      console.error('Error en assignRoles:', error);
      next(error);
    }
  }

  async removeRoles(req, res, next) {
    try {
      const { userId } = req.params;
      const { roleIds } = req.body;
      const { tenantId } = req.user;

      console.log(`Removiendo roles ${roleIds} del usuario ${userId} en tenant ${tenantId}`);

      // Verificar que los roles existen y pertenecen al mismo tenant
      await RoleService.verifyRolesExist(roleIds, tenantId);
      
      // Remover roles del usuario
      const user = await UserService.removeRoles(userId, roleIds);
      
      res.json({
        status: 'success',
        data: {
          userId: user._id,
          removedRoles: roleIds,
          currentRoles: user.roles
        }
      });
    } catch (error) {
      console.error('Error en removeRoles:', error);
      next(error);
    }
  }
}

module.exports = new RoleController();