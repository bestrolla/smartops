const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { swaggerUi, specs, setup } = require('./config/swagger');
const logger = require('./shared/logger');
const errorHandler = require('./shared/error.handler');
const coreModule = require('./core');
const modulesRoutes = require('./features');
const { identifyTenant } = require('./core/tenant/middlewares/tenant.middleware');

// Load environment variables
dotenv.config();

const app = express();

// Middlewares básicos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Configuración de CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:4500',
  'http://localhost:5001',
  'http://localhost:5173',
  'https://admin.smartopsve.com',
  'https://smartopsve.com',
  'https://www.smartopsve.com',
  'https://api.smartopsve.com',
  'https://smartops-lake.vercel.app',
  'https://www.smartops-lake.vercel.app',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
  ...(process.env.PUBLIC_SITE_URL ? [process.env.PUBLIC_SITE_URL] : [])
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  if (
    !origin ||
    allowedOrigins.includes(origin) ||
    /vercel\.app$/i.test(origin) ||
    /smartopsve\.com$/i.test(origin) ||
    /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
    process.env.NODE_ENV !== 'production'
  ) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  } else {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    req.headers['access-control-request-headers'] ||
      'Content-Type, Authorization, X-Requested-With, x-requested-with, X-Tenant-Name, x-tenant-name, X-Tenant-ID, x-tenant-id, X-Tenant-Slug, x-tenant-slug, Accept, Origin'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
});

// Middleware mejorado para detectar tenant desde la URL
const { enhancedTenantDetection } = require('./middleware/enhanced-tenant.middleware');
app.use(enhancedTenantDetection);

// Configurar Swagger
setup(app);

// Servir archivos estáticos
app.use('/static', express.static(path.join(__dirname, 'public')));

// Servir archivos de uploads con CORS mejorado
app.use('/uploads', (req, res, next) => {
  // Configurar CORS específicamente para imágenes
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  
  // Para solicitudes OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
}, express.static(path.join(__dirname, '..', 'uploads')));

// Rutas públicas para planes (sin autenticación)
const publicPlansRoutes = require('./routes/public-plans.routes');
app.use('/api/public/plans', publicPlansRoutes);
const publicTenantRoutes = require('./core/tenant/public.routes');
app.use('/api/public', publicTenantRoutes);

// Rutas para servir imágenes (sin autenticación)
const imageRoutes = require('./core/file-uploads/routes');
app.use('/api', imageRoutes);

const publicProfileRoutes = require('./routes/public-profile.routes');
app.use('/api/profile', publicProfileRoutes);

// Rutas de la aplicación (con autenticación)
app.use('/api', coreModule);
app.use('/api', modulesRoutes);

// Ruta de health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Iniciar servidor solo después de conectar a MongoDB (evita timeouts en auth)
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 15000,
      maxPoolSize: 50
    });
    logger.info('MongoDB Connected Successfully');
  } catch (err) {
    logger.error('MongoDB connection error:', err);
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }

  app.listen(PORT, HOST, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`API documentation available at http://localhost:${PORT}/api-docs`);
  });
}

startServer();

// Ruta principal que maneja diferentes casos
app.get('/', (req, res) => {
  // Si hay un tenant detectado y es área administrativa
  if (req.tenant && req.isAdminArea) {
    return res.redirect(`/${req.tenant.name}/dashboard`);
  }
  
  // Si hay un tenant detectado y es perfil público, ya se manejó en las rutas de perfil
  if (req.tenant && req.isPublicProfile) {
    // Esto no debería llegar aquí, pero por seguridad redirigimos
    return res.redirect(`/${req.tenant.slug}`);
  }
  
  // Si no hay tenant, mostrar landing page
  res.sendFile(path.join(__dirname, 'public', 'landing.html'));
});

// Error handler para rutas no encontradas
app.use((req, res, next) => {
  logger.warn('Ruta no encontrada', {
    path: req.originalPath,
    method: req.method,
    tenantName: req.tenantName
  });
  
  if (req.tenantName) {
    return res.status(404).sendFile(path.join(__dirname, 'public', 'tenant-404.html'));
  }
  
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// Error handler general
app.use(errorHandler);

module.exports = app;