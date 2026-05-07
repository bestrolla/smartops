const express = require('express');
const router = express.Router();
const { authenticate } = require('../core/auth/middlewares/auth.middleware');
const logger = require('../shared/logger');

// Middleware de autenticación para todas las rutas de features
router.use(authenticate);

// Middleware para logging de rutas
router.use((req, res, next) => {
  logger.debug('Accediendo a ruta de features', {
    path: req.path,
    method: req.method,
    originalUrl: req.originalUrl
  });
  next();
});

// Importar rutas de cada módulo
const productsRoutes = require('./products/routes');
const inventoryRoutes = require('./inventory/routes');
const ordersRoutes = require('./orders/routes');
const cartRoutes = require('./ecommerce/cartRoutes');
const checkoutRoutes = require('./ecommerce/checkoutRoutes');
const crmRoutes = require('./crm/routes');
const appointmentsRoutes = require('./appointments/routes');
const professionalsRoutes = require('./professionals/routes');
const servicesRoutes = require('./services/routes');
const automationRoutes = require('./automation/routes');

// Montar rutas con sus respectivos prefijos
router.use('/products', (req, res, next) => {
  logger.debug('Accediendo a ruta de productos', {
    path: req.path,
    method: req.method,
    params: req.params,
    originalUrl: req.originalUrl
  });
  next();
}, productsRoutes);

router.use('/orders', (req, res, next) => {
  logger.debug('Accediendo a ruta de órdenes', {
    path: req.path,
    method: req.method,
    params: req.params,
    originalUrl: req.originalUrl
  });
  next();
}, ordersRoutes);

router.use('/inventory', inventoryRoutes);
router.use('/cart', cartRoutes);
router.use('/checkout', checkoutRoutes);
router.use('/appointments', appointmentsRoutes);
router.use('/professionals', professionalsRoutes);
router.use('/services', servicesRoutes);
router.use('/automation', automationRoutes);

module.exports = router;