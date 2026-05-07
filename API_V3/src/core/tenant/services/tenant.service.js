const Tenant = require('../models/tenant.model');
const { createError } = require('../../../shared/errors.utils');
const logger = require('../../../shared/logger');
const mongoose = require('mongoose');

class TenantService {
  async validateUniqueName(name) {
    if (!name) throw createError(400, 'Nombre de tenant requerido');
    
    const exists = await Tenant.exists({ 
      name: name.toLowerCase() 
    });
    
    if (exists) throw createError(400, 'Nombre de tenant ya en uso');
    return true;
  }

  async create(tenantData) {
    try {
      await this.validateUniqueName(tenantData.name);
      
      const tenant = new Tenant({
        ...tenantData,
        name: tenantData.name.toLowerCase()
      });
      
      await tenant.save();
      logger.info(`Tenant creado: ${tenant.name}`);
      return tenant;
    } catch (error) {
      logger.error('Error creando tenant', {
        error: error.message,
        data: tenantData
      });
      throw error;
    }
  }

  async findById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw createError(400, 'ID de tenant inválido');
    }

    const tenant = await Tenant.findById(id);
    if (!tenant) throw createError(404, 'Tenant no encontrado');
    return tenant;
  }

  async findByName(name) {
    if (!name) throw createError(400, 'Nombre de tenant requerido');
    
    const tenant = await Tenant.findOne({ 
      name: name.toLowerCase(),
      isActive: true
    });
    
    if (!tenant) throw createError(404, 'Tenant no encontrado');
    return tenant;
  }

  async findBySlug(slug) {
    if (!slug) throw createError(400, 'Slug de tenant requerido');
    
    const tenant = await Tenant.findBySlug(slug);
    if (!tenant) throw createError(404, 'Tenant no encontrado');
    return tenant;
  }

  async checkSlugAvailability(slug, excludeId = null) {
    if (!slug) throw createError(400, 'Slug requerido');
    
    // Validar formato del slug
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      throw createError(400, 'Slug solo puede contener letras minúsculas, números y guiones');
    }
    
    const isAvailable = await Tenant.isSlugAvailable(slug, excludeId);
    return { available: isAvailable, slug: slug.toLowerCase() };
  }

  async generateSlug(name) {
    if (!name) throw createError(400, 'Nombre requerido para generar slug');
    
    const baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remover caracteres especiales
      .replace(/\s+/g, '-') // Reemplazar espacios con guiones
      .replace(/-+/g, '-') // Remover guiones múltiples
      .replace(/^-|-$/g, ''); // Remover guiones al inicio y final
    
    return await Tenant.generateUniqueSlug(baseSlug);
  }

  async update(id, updateData) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw createError(400, 'ID de tenant inválido');
    }

    try {
      // Validar unicidad del nombre si se está actualizando
      if (updateData.name) {
        await this.validateUniqueName(updateData.name);
        updateData.name = updateData.name.toLowerCase();
      }

      const tenant = await Tenant.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      );
      
      if (!tenant) throw createError(404, 'Tenant no encontrado');
      
      logger.info(`Tenant actualizado: ${tenant.name}`);
      return tenant;
    } catch (error) {
      logger.error('Error actualizando tenant', {
        tenantId: id,
        error: error.message
      });
      throw error;
    }
  }

  async updateTheme(tenantId, themeData) {
    const allowedFields = ['primaryColor', 'secondaryColor', 'darkMode'];
    const update = {};
    
    Object.keys(themeData).forEach(key => {
      if (allowedFields.includes(key)) {
        update[`theme.${key}`] = themeData[key];
      }
    });

    return this.update(tenantId, update);
  }

  async getPublicProfile(name) {
    const tenant = await this.findByName(name);
    
    return {
      name: tenant.name,
      displayName: tenant.displayName,
      description: tenant.publicProfile?.description,
      logoUrl: tenant.publicProfile?.logoUrl,
      contactEmail: tenant.publicProfile?.contactEmail,
      theme: tenant.theme,
      isActive: tenant.isActive
    };
  }

  async deactivate(id) {
    const tenant = await this.update(id, { isActive: false });
    logger.warn(`Tenant desactivado: ${tenant.name}`);
    return tenant;
  }

  async findAll() {
    try {
      return await Tenant.find({});
    } catch (error) {
      logger.error('Error al obtener todos los tenants:', error);
      throw createError(500, 'Error al recuperar tenants');
    }
  }
}

module.exports = new TenantService();