const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');
const logger = require('../shared/logger');

const isProd = process.env.NODE_ENV === 'production';
const port = process.env.PORT || 5001;
const localServer = { url: `http://localhost:${port}`, description: 'Local API' };
const prodServer = { url: 'https://api.smartopsve.com', description: 'Production' };

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SmartOpsVE Multi-Tenant API',
      version: '3.0.0',
      description: 'API documentation for the Multi-Tenant System',
      contact: {
        name: 'SmartOpsVE Team',
        email: 'support@smartopsve.com',
        url: 'https://smartopsve.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    // IMPORTANTE:
    // Tus paths JSDoc ya incluyen el prefijo '/api/...'.
    // Por eso el 'servers.url' DEBE ser solo el host (sin '/api')
    // para evitar '.../api/api/...'.
    servers: isProd ? [prodServer, localServer] : [localServer, prodServer],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        // --- Schemas completos ---
        Plan: { /* tu definición de Plan */ },
        PlanInput: { /* tu definición de PlanInput */ },
        PlanUpdateInput: { /* tu definición de PlanUpdateInput */ },
        Automation: { /* tu definición de Automation */ },
        AutomationInput: { /* tu definición de AutomationInput */ },
        QAFlow: { /* tu definición de QAFlow */ },
        QAFlowInput: { /* tu definición de QAFlowInput */ },
        AutomationStats: { /* tu definición de AutomationStats */ },
        Template: { /* tu definición de Template */ },
        TemplateCloneInput: { /* tu definición de TemplateCloneInput */ },
        TemplateCategory: { /* tu definición de TemplateCategory */ },
        TemplateReviewInput: { /* tu definición de TemplateReviewInput */ },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Rutas de autenticación y usuarios' },
      { name: 'Tenant', description: 'Gestión de tenants' },
      { name: 'Plans', description: 'Gestión de planes' },
      { name: 'Products', description: 'Gestión de productos' },
      { name: 'Automation', description: 'Automatizaciones y flujos' },
      { name: 'Templates', description: 'Templates y clonación' },
      { name: 'Orders', description: 'Gestión de pedidos y carrito' },
      { name: 'CRM', description: 'CRM y contactos' },
      { name: 'Appointments', description: 'Agendamiento de citas' },
      { name: 'E-commerce', description: 'Checkout y carrito' },
    ],
  },
  apis: [
    // Core routes
    path.join(__dirname, '../core/tenant/routes.js'),
    path.join(__dirname, '../core/tenant/public.routes.js'),
    path.join(__dirname, '../core/auth/index.js'),
    path.join(__dirname, '../core/auth/users/routes.js'),
    path.join(__dirname, '../core/auth/roles/routes.js'),
    path.join(__dirname, '../core/payments/routes.js'),
    path.join(__dirname, '../core/profiles/routes.js'),
    path.join(__dirname, '../core/subscriptions/routes.js'),
    path.join(__dirname, '../core/plans/routes.js'),

    // Modules routes
    path.join(__dirname, '../features/products/routes.js'),
    path.join(__dirname, '../features/inventory/routes.js'),
    path.join(__dirname, '../features/orders/routes.js'),
    path.join(__dirname, '../features/ecommerce/cartRoutes.js'),
    path.join(__dirname, '../features/ecommerce/checkoutRoutes.js'),
    path.join(__dirname, '../features/crm/routes.js'),
    path.join(__dirname, '../features/professionals/routes.js'),
    path.join(__dirname, '../features/appointments/routes.js'),
    path.join(__dirname, '../features/automation/routes.js'),
  ],
};

logger.info('Initializing Swagger documentation...');
const specs = swaggerJsdoc(options);
logger.info('Swagger documentation generated successfully');

module.exports = {
  swaggerUi,
  specs,
  setup: (app) => {
    logger.info('Setting up Swagger UI...');
    app.use(
      '/api-docs',
      (req, res, next) => {
        logger.info(`Swagger UI request: ${req.method} ${req.path}`);
        next();
      },
      swaggerUi.serve,
      swaggerUi.setup(specs, { explorer: true })
    );
    logger.info('Swagger UI setup complete');
  },
};