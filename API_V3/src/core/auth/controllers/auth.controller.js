const AuthService = require('../services/auth.service');

class AuthController {
  async signUp(req, res, next) {
    try {
      const user = await AuthService.signUp(req.body);
      
      res.status(201).json({
        status: 'success',
        data: {
          user,
          message: 'User registered successfully'
        }
      });

    } catch (error) {
      // Mejor manejo de errores
      if (error.message.includes('already in use')) {
        error.status = 409; // Conflict
      }
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      // Permitir login con username o email
      const usernameOrEmail = req.body.username || req.body.email;
      const { user, token } = await AuthService.login(
        usernameOrEmail,
        req.body.password
      );
      res.json({
        status: 'success',
        data: { user, token }
      });
    } catch (error) {
      next(error);
    }
  }

  async getCurrentUser(req, res, next) {
    
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const user = await AuthService.getCurrentUser(req.user.userId);
      res.json({
        status: 'success',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();