const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const UserService = require('../users/services/user.service');
const User = require('../users/models/user.model');
const Tenant = require('../../tenant/models/tenant.model');
const Role = require('../roles/models/role.model');
const { createError } = require('../../../shared/errors.utils');
const logger = require('../../../shared/logger');
const PlanService = require('../../plans/services/plan.service');
const SubscriptionService = require('../../subscriptions/services/subscription.service');

class AuthService {
  async signUp(signUpData) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Crear Tenant
      const tenantData = {
        name: signUpData.organizationName,
        isActive: true,
        // Forzamos todos los módulos desactivados en el registro
        features: {
          appointments: false,
          crm: false,
          ecommerce: false,
          inventory: false,
          orders: false,
          products: false,
          professionals: false,
          services: false,
          customDomain: false
        }
      };

      // Configurar slug personalizado si se proporciona domain
      if (signUpData.domain && signUpData.domain.trim()) {
        tenantData.slug = signUpData.domain.trim().toLowerCase();
      }
      // Si no se proporciona domain, el modelo generará automáticamente el slug

      // Agregar información del perfil si se proporciona
      if (signUpData.profile) {
        tenantData.publicProfile = {
          displayName: signUpData.profile.public_name || signUpData.organizationName,
          description: signUpData.profile.bio || '',
        };
        
        // Solo agregar contactEmail si existe
        if (signUpData.profile.contact && signUpData.profile.contact.email) {
          tenantData.publicProfile.contactEmail = signUpData.profile.contact.email;
        }
      }

      // Agregar características si se proporcionan
      // Eliminar mezcla de features enviados por el cliente
      // if (signUpData.features) { ... }  // ya no permitido

      const tenant = new Tenant(tenantData);
      await tenant.save({ session });

      // 2. Buscar permisos del sistema para crear el rol de admin del tenant
      const permissions = await require('../roles/models/permission.model').find({ isActive: true });
      if (permissions.length === 0) {
        throw new Error('Permisos del sistema no encontrados. Ejecute primero el script de configuración de roles.');
      }

      // Crear rol de admin específico para este tenant
      const adminRole = await Role.findOneAndUpdate(
        { name: 'admin', tenantId: tenant._id },
        {
          name: 'admin',
          displayName: 'Administrador',
          description: 'Administrador del tenant con acceso completo',
          type: 'system',
          permissions: permissions.map(p => p._id),
          tenantId: tenant._id,
          level: 80,
          isActive: true
        },
        { upsert: true, new: true, session }
      );

      // 3. Crear Usuario Admin
      const adminUser = new User({
        firstName: signUpData.firstName,
        lastName: signUpData.lastName,
        email: signUpData.email,
        password: signUpData.password,
        username: signUpData.username,
        tenantId: tenant._id,
        roles: [adminRole._id], 
        isActive: true
      });

      await adminUser.save({ session });

      await session.commitTransaction();

      // 4. Crear suscripción según selección: trial (7 días) o plan elegido
      let subscription;
      if (signUpData.trial === true) {
        subscription = await SubscriptionService.createTrialSubscription(tenant._id);
      } else if (signUpData.planId) {
        subscription = await SubscriptionService.createSubscription(tenant._id, signUpData.planId);
      } else {
        // Este caso no debería ocurrir por la validación .xor, pero por seguridad:
        logger.warn('Signup sin trial ni planId - no se creó suscripción');
      }

      return {
        tenant: tenant.toObject(),
        user: {
          ...adminUser.toObject(),
          password: undefined
        },
        subscription
      };

    } catch (error) {
      await session.abortTransaction();
      logger.error('Error during signup:', {
        message: error.message,
        stack: error.stack,
        signUpData: {
          ...signUpData,
          password: '[REDACTED]'
        }
      });
      
      // Proporcionar mensaje de error más específico
      let errorMessage = 'Registration failed';
      if (error.code === 11000) {
        if (error.keyPattern?.slug) {
          errorMessage = 'Domain already taken. Please choose a different domain.';
        } else if (error.keyPattern?.email) {
          errorMessage = 'Email already registered. Please use a different email.';
        } else if (error.keyPattern?.username) {
          errorMessage = 'Username already taken. Please choose a different username.';
        } else {
          errorMessage = 'Some information is already in use. Please check your data.';
        }
      } else if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(err => err.message);
        errorMessage = `Validation error: ${validationErrors.join(', ')}`;
      }
      
      throw createError(400, errorMessage, { originalError: error.message });
    } finally {
      session.endSession();
    }
  }

  async login(usernameOrEmail, password) {
    try {
      logger.info('Iniciando proceso de login para:', usernameOrEmail);
      
      // Buscar usuario por username o email incluyendo la contraseña
      const user = await User.findOne({
        $or: [
          { username: usernameOrEmail },
          { email: usernameOrEmail }
        ]
      })
        .select('+password')
        .populate({
          path: 'roles',
          select: 'name displayName level',
          populate: {
            path: 'permissions',
            select: 'code resource action'
          }
        });
      
      logger.info('Usuario encontrado:', user ? 'Sí' : 'No');

      if (!user) {
        logger.warn('Usuario no encontrado:', usernameOrEmail);
        throw createError(401, 'Credenciales inválidas');
      }

      // Verificar si el usuario está activo
      if (!user.isActive) {
        logger.warn('Usuario inactivo:', usernameOrEmail);
        throw createError(401, 'Usuario inactivo');
      }

      // Verificar contraseña
      const isPasswordValid = await bcrypt.compare(password, user.password);
      logger.info('Contraseña válida:', isPasswordValid);

      if (!isPasswordValid) {
        logger.warn('Contraseña inválida para usuario:', usernameOrEmail);
        throw createError(401, 'Credenciales inválidas');
      }

      // Generar token
      const token = this.generateToken(user);
      logger.info('Token generado exitosamente para usuario:', usernameOrEmail);

      // Sanitizar la respuesta del usuario
      const sanitizedUser = user.toObject();
      delete sanitizedUser.password;

      return {
        user: {
          id: sanitizedUser._id,
          username: sanitizedUser.username,
          email: sanitizedUser.email,
          firstName: sanitizedUser.firstName,
          lastName: sanitizedUser.lastName,
          roles: sanitizedUser.roles.map(role => ({
            id: role._id,
            name: role.name,
            displayName: role.displayName,
            level: role.level,
            permissions: role.permissions.map(p => ({
              code: p.code,
              resource: p.resource,
              action: p.action
            }))
          })),
          tenantId: sanitizedUser.tenantId
        },
        token
      };
    } catch (error) {
      logger.error('Error en login:', error);
      throw error;
    }
  }

  async getCurrentUser(userId) {
    try {
      return await User.findById(userId)
        .populate({
          path: 'roles',
          select: 'name permissions'
        })
        .lean();
    } catch (error) {
      logger.error('Error getting current user:', error);
      throw createError(500, 'Error retrieving user');
    }
  }

  generateToken(user) {
    const roleNames = user.roles.map(role => role.name);
    
    return jwt.sign(
      {
        userId: user._id,
        tenantId: user.tenantId,
        roles: roleNames
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );
  }

  // Nuevo método para extraer permisos
  getUserPermissions(user) {
    return user.roles.reduce((perms, role) => {
      return [...perms, ...role.permissions];
    }, []);
  }

  async verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      logger.error('Token verification error:', error);
      throw createError(401, 'Invalid token');
    }
  }
}
module.exports = new AuthService();