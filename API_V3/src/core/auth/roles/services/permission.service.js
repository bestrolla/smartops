const Permission = require('../models/permission.model');

class PermissionService {
  static async createPermission(data) {
    const permission = new Permission(data);
    return permission.save();
  }

  static async getPermissionByCode(code) {
    return Permission.findOne({ code, isActive: true });
  }

  static async getPermissionsByResource(resource) {
    return Permission.find({ resource, isActive: true });
  }

  static async getPermissionsByAction(action) {
    return Permission.find({ action, isActive: true });
  }

  static async getAllPermissions() {
    return Permission.find({ isActive: true });
  }

  static async validatePermissions(permissionCodes) {
    const permissions = await Permission.find({
      code: { $in: permissionCodes },
      isActive: true
    });

    const validCodes = permissions.map(p => p.code);
    const invalidCodes = permissionCodes.filter(code => !validCodes.includes(code));

    return {
      valid: invalidCodes.length === 0,
      validPermissions: permissions,
      invalidCodes
    };
  }

  static async generateDefaultPermissions() {
    const defaultPermissions = [];
    const resources = Permission.schema.path('resource').enumValues;
    const actions = Permission.schema.path('action').enumValues;

    for (const resource of resources) {
      for (const action of actions) {
        defaultPermissions.push({
          name: `${action.charAt(0).toUpperCase() + action.slice(1)} ${resource}`,
          action,
          resource,
          description: `Permite ${action} ${resource}`,
          code: `${action}:${resource}`
        });
      }
    }

    return Permission.insertMany(defaultPermissions, { ordered: false })
      .catch(error => {
        // Ignorar errores de duplicados
        if (error.code !== 11000) {
          throw error;
        }
        return defaultPermissions;
      });
  }

  static async deactivatePermission(code) {
    return Permission.findOneAndUpdate(
      { code },
      { isActive: false },
      { new: true }
    );
  }

  static async activatePermission(code) {
    return Permission.findOneAndUpdate(
      { code },
      { isActive: true },
      { new: true }
    );
  }

  static async updatePermission(code, data) {
    return Permission.findOneAndUpdate(
      { code },
      { ...data, code }, // Asegurar que el código no se modifique
      { new: true }
    );
  }
}

module.exports = PermissionService; 