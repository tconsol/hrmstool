const mongoose = require('mongoose');

const connectDB = async () => {
  try {    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 2,
    });.options.maxPoolSize}\n`);
  } catch (error) {    process.exit(1);
  }
};

module.exports = connectDB;
