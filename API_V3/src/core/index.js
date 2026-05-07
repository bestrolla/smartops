const express = require('express');
const router = express.Router();
const tenantRoutes = require('./tenant/routes');
const authRoutes = require('./auth');
const paymentRoutes = require('./payments/routes');
const profileRoutes = require("./profiles/routes");
const subscriptionRoutes = require('./subscriptions/routes');
const planRoutes = require('./plans/routes');

// Montar rutas sin prefijo (se agregará /api en app.js)
router.use('/tenants', tenantRoutes);
router.use('/auth', authRoutes);
router.use('/payments', paymentRoutes);
router.use('/profiles', profileRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/plans', planRoutes);

module.exports = router;