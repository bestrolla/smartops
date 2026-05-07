const { Role, Permission } = require('../models');
const createError = require('../../../../shared/errors.utils');
const logger = require('../../../../shared/logger');
const mongoose = require('mongoose');

class RoleService {
  async create(roleData) {
    try {
      const existingRole = await Role.findOne({
        name: roleData.name,
        tenantId: roleData.tenantId
      });
      
      if (existingRole) {
        throw createError(400, 'Role already exists for this tenant');
      }

      const role = new Role(roleData);
      await role.save();
      return role;
    } catch (error) {
      logger.error('Error creating role:', error);
      throw createError(400, 'Error creating role');
    }
  }

  async findById(roleId) {
    try {
      const role = await Role.findOne({ _id: roleId });
      if (!role) throw createError(404, 'Role not found');
      return role;
    } catch (error) {
      logger.error('Error finding role:', error);
      throw error;
    }
  }

  async findAllByTenant(tenantId) {
    try {
      return await Role.find({ tenantId });
    } catch (error) {
      logger.error('Error finding roles by tenant:', error);
      throw createError(500, 'Error retrieving roles');
    }
  }

  async update(roleId, updateData) {
    try {
      const role = await Role.findByIdAndUpdate(
        roleId,
        { $set: updateData },
        { new: true, runValidators: true }
      );
      
      if (!role) throw createError(404, 'Role not found');
      return role;
    } catch (error) {
      logger.error('Error updating role:', error);
      throw error;
    }
  }

  async delete(roleId) {
    try {
      const role = await Role.findByIdAndDelete(roleId);
      if (!role) throw createError(404, 'Role not found');
      return role;
    } catch (error) {
      logger.error('Error deleting role:', error);
      throw error;
    }
  }

  async getDefaultRoles() {
    try {
      return await Role.find({ isDefault: true });
    } catch (error) {
      logger.error('Error getting default roles:', error);
      throw createError(500, 'Error retrieving default roles');
    }
  }

  async getDefaultRoleForTenant(tenantId) {
    const role = await Role.findOne({ 
      tenantId, 
      name: 'user',
      isDefault: true 
    });
    return role?._id;
  }

  async getUserPermissions(userId) {
    const user = await User.findById(userId)
      .populate('roles', 'permissions');
      
    return user.roles.flatMap(role => role.permissions);
  }

  async verifyRolesExist(roleIds, tenantId) {
    try {
      // Convertir a ObjectId usando new
      const objectIds = roleIds.map(id => new mongoose.Types.ObjectId(id));
      
      const roles = await Role.find({
        _id: { $in: objectIds },
        tenantId: new mongoose.Types.ObjectId(tenantId)
      });
      
      if (roles.length !== roleIds.length) {
        logger.error(`Roles no encontrados o tenant mismatch. Solicitados: ${roleIds}, Encontrados: ${roles.map(r => r._id)}`);
        throw createError(404, 'One or more roles not found or tenant mismatch');
      }
      
      return roles;
    } catch (error) {
      logger.error('Error in verifyRolesExist:', error);
      throw createError(400, 'Invalid role IDs format');
    }
  }

  async getRolesByIds(roleIds) {
    try {
      return await Role.find({ _id: { $in: roleIds } });
    } catch (error) {
      logger.error('Error getting roles by IDs:', error);
      throw createError(500, 'Error retrieving roles');
    }
  }

  async userHasRole(userRoles, roleName) {
    const roles = await this.getRolesByIds(userRoles);
    return roles.some(role => role.name === roleName);
  }
}

module.exports = new RoleService();