module.exports = (err, req, res, next) => {
  // 1. Normalizar el error
  const error = {
    message: typeof err === 'string' ? err : err.message,
    statusCode: parseInt(err.statusCode ?? err.status, 10) || 500
  };

  // 2. Validar status code
  if (error.statusCode < 100 || error.statusCode >= 600) {
    error.statusCode = 500;
    error.message = 'Internal Server Error';
  }

  // 3. Preparar respuesta
  const response = {
    status: error.statusCode >= 400 && error.statusCode < 500 ? 'fail' : 'error',
    message: error.statusCode >= 500 ? 'Internal Server Error' : error.message
  };

  // 4. Debug en desarrollo
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    if (err.details) response.details = err.details;
  }

  console.log('Error Handler - Final Status Code:', error.statusCode, 'Final Message:', response.message);

  res.status(error.statusCode).json(response);
};