const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('\n📊 Connecting to MongoDB...');
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 2,
    });
    console.log(`✅ MongoDB Connected Successfully!`);
    console.log(`   🔗 Host: ${conn.connection.host}`);
    console.log(`   🗄️  Database: ${conn.connection.name}`);
    console.log(`   👥 Pool Size: ${conn.connection.getClient().options.maxPoolSize}\n`);
  } catch (error) {
    console.error('\n❌ MongoDB Connection Failed!');
    console.error(`   📝 Error: ${error.message}\n`);
    process.exit(1);
  }
};

module.exports = connectDB;
