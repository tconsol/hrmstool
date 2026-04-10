const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
require('dotenv').config();

const SuperAdmin = require('../models/SuperAdmin');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Clear all existing data
    console.log('🗑️  Clearing existing data...');
    await SuperAdmin.deleteMany({});
    console.log('✓ All existing data cleared');

    // ==================== SUPER ADMIN ====================
    console.log('🛡️  Creating super admin...');
    const superAdmin = new SuperAdmin({
      name: 'Apparao',
      email: 'apparao.p@tconsolutions.com',
      password: 'Apparao@tconsol4u',
      phone: '9999999999',
      status: 'active',
    });
    await superAdmin.save();
    console.log('✓ Super admin created');

    // ==================== SUMMARY ====================
    console.log('\n✅ Seed data created successfully!\n');
    console.log('🔐 Super Admin Credentials:');
    console.log('   Email:    apparao.p@tconsolutions.com');
    console.log('   Password: Apparao@tconsol4u');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedData();
