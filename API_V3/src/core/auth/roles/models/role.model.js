const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  displayName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['system', 'custom'],
    default: 'custom'
  },
  permissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Permission',
    required: true
  }],
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  level: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 1
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { 
  timestamps: true,
  versionKey: false
});

// Índices para mejor rendimiento
roleSchema.index({ name: 1, tenantId: 1 }, { unique: true });
roleSchema.index({ type: 1 });
roleSchema.index({ level: 1 });
roleSchema.index({ isActive: 1 });

// Middleware para validación
roleSchema.pre('save', function(next) {
  if (this.type === 'system' && this.level < 50) {
    next(new Error('System roles must have level >= 50'));
    return;
  }
  next();
});

// --- MÉTODOS DE INSTANCIA --- //

/**
 * Verifica si el rol tiene un permiso específico
 * @param {String} permissionCode - Código del permiso (ej: 'create:users')
 * @returns {Promise<Boolean>}
 */
roleSchema.methods.hasPermission = async function(permissionCode) {
  await this.populate('permissions');
  return this.permissions.some(p => 
    p.isActive && (p.code === permissionCode || p.code === 'all')
  );
};

/**
 * Obtiene los permisos simplificados del rol
 * @returns {Promise<Array>} - Array de permisos con código, recurso y acción
 */
roleSchema.methods.getSimplifiedPermissions = async function() {
  await this.populate('permissions', 'code resource action isActive');
  return this.permissions
    .filter(p => p.isActive)
    .map(p => ({
      code: p.code,
      resource: p.resource,
      action: p.action
    }));
};

// --- MÉTODOS ESTÁTICOS --- //

/**
 * Obtiene roles por tipo
 * @param {String} type - Tipo de rol ('system' o 'custom')
 * @param {ObjectId} tenantId - ID del tenant
 * @returns {Promise<Array>} - Array de roles
 */
roleSchema.statics.findByType = function(type, tenantId) {
  return this.find({ type, tenantId, isActive: true })
    .populate('permissions', 'code resource action');
};

/**
 * Obtiene roles por nivel máximo
 * @param {Number} maxLevel - Nivel máximo a incluir
 * @param {ObjectId} tenantId - ID del tenant
 * @returns {Promise<Array>} - Array de roles
 */
roleSchema.statics.findByMaxLevel = function(maxLevel, tenantId) {
  return this.find({ 
    level: { $lte: maxLevel },
    tenantId,
    isActive: true 
  }).populate('permissions', 'code resource action');
};

/**
 * Verifica si un usuario tiene los permisos requeridos
 * @param {ObjectId} userId - ID del usuario
 * @param {Array<String>} requiredPermissions - Permisos requeridos
 * @returns {Promise<Boolean>} - True si tiene acceso
 */
roleSchema.statics.checkUserAccess = async function(userId, requiredPermissions) {
  if (!requiredPermissions || requiredPermissions.length === 0) return true;
  
  // Importar dinámicamente el modelo User para evitar dependencias circulares
  const User = require('../../users/models/user.model');
  const user = await User.findById(userId)
    .populate({
      path: 'roles',
      populate: {
        path: 'permissions',
        select: 'code resource action isActive'
      }
    });
  
  if (!user || !user.isActive) return false;
  
  // Superadmin tiene acceso completo
  if (user.roles.some(role => role.name === 'superadmin')) {
    return true;
  }
  
  // Verificar cada permiso requerido
  return requiredPermissions.every(requiredPerm => {
    return user.roles.some(role => {
      return role.permissions.some(p => {
        return p.isActive && (
          p.code === 'all' ||
          p.code === requiredPerm ||
          (p.resource === requiredPerm.split(':')[1] && 
           p.action === requiredPerm.split(':')[0])
        );
      });
    });
  });
};

module.exports = mongoose.model('Role', roleSchema);