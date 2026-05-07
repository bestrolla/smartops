const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, ...rest }) => {
      const logMessage = `${timestamp} [${level}]: ${message}`;
      const details = Object.keys(rest).length ? `\n${JSON.stringify(rest, null, 2)}` : '';
      return `${logMessage}${details}`;
    })
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});

// Agregar stream para Morgan
logger.stream = {
  write: (message) => logger.info(message.trim())
};

module.exports = logger;