const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { createError } = require('http-errors');
const logger = require('../../shared/logger');

class AuthService {
  async register(userData) {
    try {
      const user = new User(userData);
      await user.save();
      return this.sanitizeUser(user);
    } catch (error) {
      logger.error('Registration error:', error);
      throw createError(400, 'Registration failed');
    }
  }

  async login(username, password) {
    try {
      const user = await User.findOne({ username });
      if (!user || !user.isActive) throw createError(401, 'Invalid credentials');
      
      const isMatch = await user.comparePassword(password);
      if (!isMatch) throw createError(401, 'Invalid credentials');
      
      const token = this.generateToken(user);
      return { user: this.sanitizeUser(user), token };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  generateToken(user) {
    return jwt.sign(
      {
        userId: user.userId,
        tenantId: user.tenantId,
        roles: user.roles,
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
  }

  sanitizeUser(user) {
    const userObj = user.toObject();
    delete userObj.password;
    return userObj;
  }

  async validateToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      logger.error('Token validation error:', error);
      throw createError(401, 'Invalid token');
    }
  }
}

module.exports = new AuthService();