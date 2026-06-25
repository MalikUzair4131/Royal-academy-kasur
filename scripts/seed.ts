import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models/User';
import { Branch } from '@/lib/models/Branch';
import { Course } from '@/lib/models/Course';
import { Batch } from '@/lib/models/Batch';
import { Student } from '@/lib/models/Student';

async function hashPasswords<T extends { password: string }>(items: T[]) {
  return Promise.all(items.map(async (item) => ({
    ...item,
    password: await bcrypt.hash(item.password, 10),
  })));
}

const demoUsers = [
  {
    name: 'Super Admin',
    email: 'superadmin@royalacademy.com',
    password: 'SuperAdmin@123',
    role: 'super_admin',
    isActive: true,
    permissions: [{ module: '*', actions: ['manage'] }],
  },
  {
    name: 'Branch Manager - Main Branch',
    email: 'manager@royalacademy.com',
    password: 'Manager@123',
    role: 'branch_admin',
    isActive: true,
    permissions: [
      { module: 'dashboard', actions: ['view'] },
      { module: 'students', actions: ['view', 'create', 'edit', 'delete'] },
      { module: 'teachers', actions: ['view', 'create', 'edit', 'delete'] },
      { module: 'courses', actions: ['view', 'create', 'edit', 'delete'] },
      { module: 'attendance', actions: ['view', 'create', 'edit'] },
      { module: 'fees', actions: ['view', 'create', 'edit', 'delete'] },
      { module: 'salary', actions: ['view', 'create', 'edit'] },
    ],
  },
  {
    name: 'Mr. Ahmed Khan',
    email: 'ahmed.khan@royalacademy.com',
    password: 'Teacher@123',
    role: 'teacher',
    isActive: true,
    permissions: [
      { module: 'dashboard', actions: ['view'] },
      { module: 'students', actions: ['view'] },
      { module: 'attendance', actions: ['view', 'create', 'edit'] },
      { module: 'courses', actions: ['view'] },
    ],
  },
  {
    name: 'Mrs. Fatima Ali',
    email: 'fatima.ali@royalacademy.com',
    password: 'Teacher@123',
    role: 'teacher',
    isActive: true,
    permissions: [
      { module: 'dashboard', actions: ['view'] },
      { module: 'students', actions: ['view'] },
      { module: 'attendance', actions: ['view', 'create', 'edit'] },
      { module: 'courses', actions: ['view'] },
    ],
  },
];

const demoBranches = [
  {
    name: 'Main Campus',
    code: 'MAIN-001',
    address: 'Karachi, Sindh',
    phone: '+92-21-12345678',
    email: 'main@royalacademy.com',
    city: 'Karachi',
    state: 'Sindh',
    isActive: true,
  },
  {
    name: 'North Branch',
    code: 'NORTH-002',
    address: 'Islamabad, ICT',
    phone: '+92-51-87654321',
    email: 'north@royalacademy.com',
    city: 'Islamabad',
    state: 'ICT',
    isActive: true,
  },
];

async function seed() {
  try {
    await connectDB();
    console.log('✓ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Branch.deleteMany({});
    await Course.deleteMany({});
    await Batch.deleteMany({});
    await Student.deleteMany({});
    console.log('✓ Cleared existing data');

    // Create branches
    const branches = await Branch.insertMany(demoBranches);
    console.log(`✓ Created ${branches.length} branches`);

    // Create users with hashed passwords
    const usersWithBranch = await hashPasswords(
      demoUsers.map((user, idx) => ({
        ...user,
        branch: user.role === 'teacher' ? branches[0]._id : undefined,
      }))
    );

    const users = await User.insertMany(usersWithBranch);
    console.log(`✓ Created ${users.length} users`);

    // Create courses
    const courses = await Course.insertMany([
      {
        name: 'Web Development Bootcamp',
        code: 'WEB-101',
        description: 'Learn HTML, CSS, JavaScript and React',
        instructor: users.find(u => u.role === 'teacher')?._id,
        duration: 12,
        fee: 50000,
        branch: branches[0]._id,
        isActive: true,
      },
      {
        name: 'Data Science Fundamentals',
        code: 'DS-101',
        description: 'Python, Data Analysis and Machine Learning',
        instructor: users.find(u => u.email === 'fatima.ali@royalacademy.com')?._id,
        duration: 16,
        fee: 60000,
        branch: branches[0]._id,
        isActive: true,
      },
      {
        name: 'Graphic Design Course',
        code: 'GD-101',
        description: 'Learn Adobe Suite and Design Principles',
        instructor: users.find(u => u.role === 'teacher')?._id,
        duration: 8,
        fee: 35000,
        branch: branches[1]._id,
        isActive: true,
      },
    ]);
    console.log(`✓ Created ${courses.length} courses`);

    // Create batches
    const batches = await Batch.insertMany([
      {
        name: 'Web Dev Batch - Spring 2026',
        code: 'WEB-S26',
        course: courses[0]._id,
        startDate: new Date('2026-03-01'),
        endDate: new Date('2026-06-01'),
        schedule: 'Mon-Wed-Fri 9:00 AM - 11:00 AM',
        maxStudents: 30,
        instructor: users.find(u => u.role === 'teacher')?._id,
        branch: branches[0]._id,
        isActive: true,
      },
      {
        name: 'Data Science Batch - Spring 2026',
        code: 'DS-S26',
        course: courses[1]._id,
        startDate: new Date('2026-03-15'),
        endDate: new Date('2026-07-15'),
        schedule: 'Tue-Thu 2:00 PM - 4:00 PM',
        maxStudents: 25,
        instructor: users.find(u => u.email === 'fatima.ali@royalacademy.com')?._id,
        branch: branches[0]._id,
        isActive: true,
      },
    ]);
    console.log(`✓ Created ${batches.length} batches`);

    // Create demo students
    const studentUsers = await User.insertMany(
      await hashPasswords([
        {
          name: 'Ali Ahmed',
          email: 'ali.ahmed@student.royalacademy.com',
          password: 'Student@123',
          role: 'student',
          isActive: true,
          permissions: [
            { module: 'dashboard', actions: ['view'] },
            { module: 'attendance', actions: ['view'] },
            { module: 'fees', actions: ['view'] },
          ],
        },
        {
          name: 'Sara Khan',
          email: 'sara.khan@student.royalacademy.com',
          password: 'Student@123',
          role: 'student',
          isActive: true,
          permissions: [
            { module: 'dashboard', actions: ['view'] },
            { module: 'attendance', actions: ['view'] },
            { module: 'fees', actions: ['view'] },
          ],
        },
        {
          name: 'Hassan Malik',
          email: 'hassan.malik@student.royalacademy.com',
          password: 'Student@123',
          role: 'student',
          isActive: true,
          permissions: [
            { module: 'dashboard', actions: ['view'] },
            { module: 'attendance', actions: ['view'] },
            { module: 'fees', actions: ['view'] },
          ],
        },
      ])
    );

    const students = await Student.insertMany(
      studentUsers.map((user, idx) => ({
        userId: user._id,
        studentId: `STU-${2026001 + idx}`,
        firstName: user.name.split(' ')[0],
        lastName: user.name.split(' ')[1],
        phone: '+92-3001234567',
        admissionDate: new Date(),
        branch: branches[0]._id,
        enrollments: [
          {
            course: courses[0]._id,
            batch: batches[0]._id,
            status: 'enrolled',
            enrollDate: new Date(),
          },
        ],
        isActive: true,
      }))
    );

    console.log(`✓ Created ${students.length} students`);

    console.log('\n✅ Seeding completed successfully!\n');
    console.log('📝 Test Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Super Admin:');
    console.log('  Email: superadmin@royalacademy.com');
    console.log('  Password: SuperAdmin@123');
    console.log('');
    console.log('Branch Manager:');
    console.log('  Email: manager@royalacademy.com');
    console.log('  Password: Manager@123');
    console.log('');
    console.log('Teacher:');
    console.log('  Email: ahmed.khan@royalacademy.com');
    console.log('  Password: Teacher@123');
    console.log('');
    console.log('Student:');
    console.log('  Email: ali.ahmed@student.royalacademy.com');
    console.log('  Password: Student@123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

seed();
