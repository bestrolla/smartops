require('dotenv').config();

module.exports = {
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/smartops_admin_v3',
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development'
}; 