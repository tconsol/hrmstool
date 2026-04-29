const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
require('dotenv').config();

const SuperAdmin = require('../models/SuperAdmin');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    // Clear all existing data
    await SuperAdmin.deleteMany({});
    // ==================== SUPER ADMIN ====================
    const superAdmin = new SuperAdmin({
      name: 'Apparao',
      email: 'apparao.p@tconsolutions.com',
      password: 'Apparao@tconsol4u',
      phone: '9999999999',
      status: 'active',
    });
    await superAdmin.save();
    // ==================== SUMMARY ====================
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedData();
