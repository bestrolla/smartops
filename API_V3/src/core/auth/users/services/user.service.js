const User = require('../models/user.model');
const createError = require('../../../../shared/errors.utils');
const logger = require('../../../../shared/logger');
const Role = require('../../roles/models/role.model');
const mongoose = require('mongoose');
class UserService {
  async create(userData) {
    try {
      // Validación básica
      if (!userData.tenantId || !userData.username || !userData.email || !userData.password) {
        throw createError(400, 'Faltan campos requeridos');
      }

      // Verificar si el usuario ya existe
      const existingUser = await User.findOne({
        $or: [
          { username: userData.username },
          { email: userData.email }
        ]
      });
      if (existingUser) throw createError(400, 'Usuario o email ya existen');

      // Procesar roles si existen
      if (userData.roles) {
        if (userData.roles.some(r => typeof r === 'string')) {
          // Buscar IDs de roles por nombre
          const roles = await Role.find({ name: { $in: userData.roles } });
          if (roles.length !== userData.roles.length) {
            throw createError(400, 'Uno o más roles no existen');
          }
          userData.roles = roles.map(r => r._id);
        }
      }

      const user = new User(userData);
      await user.save();
      return this.sanitizeUser(user);

    } catch (error) {
      logger.error('Error detallado:', { 
        error: error.message, 
        stack: error.stack,
        inputData: userData 
      });
      throw error;
    }
  }

  async findById(userId) {
    try {
      const user = await User.findOne({ _id: userId }); // Búsqueda directa por string
      if (!user) throw createError(404, 'User not found');
      return this.sanitizeUser(user);
    } catch (error) {
      logger.error('Error finding user:', error);
      throw error;
    }
  }

  async findByUsername(username) {
    try {
      // Asegúrate de incluir el password con select('+password')
      const user = await User.findOne({ username }).select('+password');
      
      if (!user) {
        throw createError(404, 'User not found');
      }
      
      return user;
    } catch (error) {
      logger.error('Error finding user by username:', error);
      throw error;
    }
  }

  async findAllByTenant(tenantId) {
    try {
      const users = await User.find({ tenantId });
      console.log(users)
      return users.map(user => this.sanitizeUser(user));
    } catch (error) {
      logger.error('Error finding users by tenant:', error);
      throw createError(500, 'Error retrieving users');
    }
  }

  async update(id, updateData) {
    try {
      // Verifica si se están actualizando roles y si son strings
      if (updateData.roles && Array.isArray(updateData.roles)) {
        // Filtra solo los strings (nombres de roles)
        const roleNames = updateData.roles.filter(r => typeof r === 'string');
        
        if (roleNames.length > 0) {
          // Busca los IDs de los roles correspondientes
          const roles = await Role.find({ name: { $in: roleNames } });
          
          if (roles.length !== roleNames.length) {
            throw createError(400, 'Uno o más roles no existen');
          }
          
          // Combina los IDs existentes con los nuevos
          const existingIds = updateData.roles.filter(r => typeof r !== 'string');
          updateData.roles = [...existingIds, ...roles.map(r => r._id)];
        }
      }

      const updatedUser = await User.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate('roles');

      if (!updatedUser) throw createError(404, 'User not found');
      return this.sanitizeUser(updatedUser);
    } catch (error) {
      logger.error('Update error:', error);
      throw error;
    }
  }
  async deactivate(userIdentifier) {
    try {
      if (!userIdentifier) throw createError(400, 'Identifier is required');

      const filter = mongoose.Types.ObjectId.isValid(userIdentifier)
        ? { _id: userIdentifier }
        : {
            $or: [
              { username: userIdentifier },
              { email: userIdentifier }
            ]
          };

      const user = await User.findOneAndUpdate(
        filter,
        { 
          $set: { 
            isActive: false,
            updatedAt: new Date() 
          } 
        },
        { new: true }
      );
      
      if (!user) throw createError(404, 'User not found');
      return this.sanitizeUser(user);
    } catch (error) {
      logger.error('Deactivation failed:', { 
        identifier: userIdentifier,
        error: error.message 
      });
      throw error;
    }
  }

  sanitizeUser(user) {
    const userObj = user.toObject();
    delete userObj.password;
    return userObj;
  }

  async addRoles(userId, roleIds) {
    const user = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { roles: { $each: roleIds } } },
      { new: true, runValidators: true }
    ).populate('roles');
    
    if (!user) throw createError(404, 'User not found');
    return user;
  }

  async removeRoles(userId, roleIds) {
    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { roles: { $in: roleIds } } },
      { new: true }
    ).populate('roles');
    
    if (!user) throw createError(404, 'User not found');
    return user;
  }
}

module.exports = new UserService();