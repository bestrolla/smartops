const mongoose = require('mongoose');
const logger = require('../shared/logger');

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    await mongoose.connect(process.env.MONGO_URI);
    logger.info('MongoDB Connected...');
  } catch (err) {
    logger.error('MongoDB Connection Error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;