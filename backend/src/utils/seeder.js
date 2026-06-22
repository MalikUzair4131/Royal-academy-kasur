require('dotenv').config();
const mongoose = require('mongoose');
const { User } = require('../models/User');
const { Branch } = require('../models/AuditLog');
const { Course } = require('../models/Course');

const seed = async () => {
  try {
    console.log('🔄 Attempting to connect to MongoDB Atlas...');
    console.log(`📍 URI: ${process.env.MONGODB_URI.replace(/:[^:]*@/, ':****@')}`);
    
    await mongoose.connect(process.env.MONGODB_URI, {
      retryWrites: process.env.MONGODB_RETRY_WRITES === 'true',
      w: process.env.MONGODB_W || 'majority',
      journal: process.env.MONGODB_JOURNAL === 'true',
      maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE) || 10,
      minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE) || 2,
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: parseInt(process.env.MONGODB_CONNECT_TIMEOUT_MS) || 15000,
      socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT_MS) || 45000,
      maxIdleTimeMS: parseInt(process.env.MONGODB_MAX_IDLE_TIME_MS) || 60000,
      heartbeatFrequencyMS: parseInt(process.env.MONGODB_HEARTBEAT_FREQUENCY_MS) || 10000,
      serverMonitoringMode: 'auto',
    });
    console.log('✅ Connected to MongoDB Atlas...');

    // Clear existing
    await User.deleteMany({});
    await Branch.deleteMany({});
    await Course.deleteMany({});
    console.log('🗑️  Cleared existing data.');

    // Create main branch
    const branch = await Branch.create({
      name: 'Royal Academy - Main Campus',
      code: 'RA-MAIN',
      address: 'Lahore, Punjab, Pakistan',
      city: 'Lahore',
      phone: '+92-42-1234567',
      email: 'info@royalacademy.com',
      type: 'both'
    });

    // Create Owner (super admin, protected)
    const owner = await User.create({
      name: 'Academy Owner',
      email: 'owner@royalacademy.com',
      password: 'Owner@2024!',
      role: 'super_admin',
      isOwner: true,
      isActive: true,
      branch: branch._id,
    });

    // Super Admin
    const superAdmin = await User.create({
      name: 'Super Admin',
      email: 'superadmin@royalacademy.com',
      password: 'Admin@2024!',
      role: 'super_admin',
      isActive: true,
      branch: branch._id,
    });

    // Branch Admin
    const branchAdmin = await User.create({
      name: 'Branch Admin',
      email: 'admin@royalacademy.com',
      password: 'Admin@2024!',
      role: 'branch_admin',
      isActive: true,
      branch: branch._id,
    });

    // Update branch admin
    await Branch.findByIdAndUpdate(branch._id, { admin: branchAdmin._id });

    // Teacher (fixed salary)
    await User.create({
      name: 'Ahmed Ali',
      email: 'teacher@royalacademy.com',
      password: 'Teacher@2024!',
      role: 'teacher',
      isActive: true,
      branch: branch._id,
    });

    // Student
    await User.create({
      name: 'Sara Khan',
      email: 'student@royalacademy.com',
      password: 'Student@2024!',
      role: 'student',
      isActive: true,
      branch: branch._id,
    });

    // Parent
    await User.create({
      name: 'Bilal Khan',
      email: 'parent@royalacademy.com',
      password: 'Parent@2024!',
      role: 'parent',
      isActive: true,
      branch: branch._id,
    });

    // Seed Courses with unique codes
    const coursesData = [
      { name: 'Web Development Bootcamp', type: 'training', branch: branch._id, admissionFee: 2000, monthlyFee: 5000, durationMonths: 6, category: 'IT', isActive: true },
      { name: 'Graphic Design', type: 'training', branch: branch._id, admissionFee: 1500, monthlyFee: 4000, durationMonths: 3, category: 'Design', isActive: true },
      { name: 'English Language Course', type: 'training', branch: branch._id, admissionFee: 1000, monthlyFee: 3000, durationMonths: 4, category: 'Language', isActive: true },
      { name: 'Grade 10 Science', type: 'school', branch: branch._id, admissionFee: 3000, monthlyFee: 2500, isActive: true },
    ];

    // Generate unique codes for each course
    const coursesWithCodes = coursesData.map((course, index) => ({
      ...course,
      code: `CRS-${String(index + 1).padStart(3, '0')}`,
    }));

    await Course.insertMany(coursesWithCodes);

    console.log('✅ Seed data created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('Owner:        owner@royalacademy.com     / Owner@2024!');
    console.log('Super Admin:  superadmin@royalacademy.com / Admin@2024!');
    console.log('Branch Admin: admin@royalacademy.com      / Admin@2024!');
    console.log('Teacher:      teacher@royalacademy.com    / Teacher@2024!');
    console.log('Student:      student@royalacademy.com    / Student@2024!');
    console.log('Parent:       parent@royalacademy.com     / Parent@2024!');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    if (err.code === 'ECONNREFUSED') {
      console.error('\n⚠️  Connection Refused - Please check:');
      console.error('  1. MongoDB Atlas cluster is running');
      console.error('  2. Network access is allowed from 0.0.0.0/0');
      console.error('  3. Username and password are correct');
      console.error('  4. Connection string format is correct');
      console.error('  5. Internet connection is stable');
    }
    console.error('\nFull error:', err);
    process.exit(1);
  }
};

seed();
