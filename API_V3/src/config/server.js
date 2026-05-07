const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const { createError } = require('http-errors');
const logger = require('../shared/logger');
const { identifyTenant } = require('../core/tenant/middlewares/tenant.middleware');

const initializeServer = () => {
  const app = express();

  // Middlewares
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan('combined', { stream: logger.stream }));

  // Tenant middleware global
  app.use(identifyTenant);

  // Routes will be added here

  // 404 handler
  app.use((req, res, next) => {
    next(createError(404, 'Not Found'));
  });

  // Error handler
  app.use((err, req, res, next) => {
    logger.error(err);
    res.status(err.status || 500).json({
      error: {
        status: err.status || 500,
        message: err.message || 'Internal Server Error',
      },
    });
  });

  return app;
};

module.exports = initializeServer;



const express = require('express');
const app = express();
const swagger = require('./path/to/swagger');

swagger.setup(app);

app.listen(3000, () => console.log('Server running on port 3000'));