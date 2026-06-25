import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models/User';
import { Branch } from '@/lib/models/Branch';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models/User';
import { Branch } from '@/lib/models/Branch';
import { Course } from '@/lib/models/Course';
import { Batch } from '@/lib/models/Batch';
import { Student } from '@/lib/models/Student';
import { Class } from '@/lib/models/Class';
import { Fee } from '@/lib/models/Fee';
import { Attendance } from '@/lib/models/Attendance';

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
    await Class.deleteMany({});
    await Fee.deleteMany({});
    await Attendance.deleteMany({});
    console.log('✓ Cleared existing data');

    // Create branch
    const branches = await Branch.insertMany(demoBranches);
    console.log(`✓ Created ${branches.length} branch`);

    // Create users with hashed passwords
    const usersWithBranch = await hashPasswords(
      demoUsers.map((user) => ({
        ...user,
        branch: user.role === 'teacher' ? branches[0]._id : undefined,
      }))
    );

    const users = await User.insertMany(usersWithBranch);
    console.log(`✓ Created ${users.length} users`);

    // Create classes (Grades)
    const classNames = [
      'Junior Grade',
      'Grade 9',
      'Grade 10',
      'Grade 11',
      'Grade 12',
      'Supplementary Students',
    ];

    const classes = await Class.insertMany(classNames.map((name, idx) => ({
      name,
      code: `CL-${100 + idx}`,
      description: `${name} class`,
      branch: branches[0]._id,
      isActive: true,
    })));
    console.log(`✓ Created ${classes.length} classes`);

    // Create batches for each class for 2026 and 2027
    const batchesToCreate: any[] = [];
    classes.forEach((c: any) => {
      ['2026', '2027'].forEach((year) => {
        batchesToCreate.push({
          name: `${c.name} Batch ${year}`,
          code: `${c.code}-${year}`,
          class: c._id,
          startDate: new Date(`${year}-01-01`),
          endDate: new Date(`${year}-12-31`),
          schedule: 'Mon-Fri 9:00 AM - 1:00 PM',
          maxStudents: 100,
          instructor: users.find((u) => u.role === 'teacher')?._id,
          branch: branches[0]._id,
          isActive: true,
        });
      });
    });

    const batches = await Batch.insertMany(batchesToCreate);
    console.log(`✓ Created ${batches.length} class batches`);

    // Create a simple course to keep compatibility
    const courses = await Course.insertMany([
      {
        name: 'Intro Course',
        code: 'INTRO-001',
        description: 'Compatibility course',
        instructor: users.find((u) => u.role === 'teacher')?._id,
        duration: 4,
        fee: 1000,
        branch: branches[0]._id,
        isActive: true,
      },
    ]);

    // Create demo student user
    const [demoUser] = await User.insertMany(await hashPasswords([
      {
        name: 'Demo Student',
        email: 'student@royalacademy.edu.pk',
        password: 'Student@123',
        role: 'student',
        isActive: true,
        permissions: [
          { module: 'dashboard', actions: ['view'] },
          { module: 'attendance', actions: ['view'] },
          { module: 'fees', actions: ['view'] },
        ],
      },
    ]));

    const grade9 = classes.find((c: any) => c.name === 'Grade 9');
    const grade9Batch2026 = batches.find((b: any) => String(b.class) === String(grade9._id) && b.code.endsWith('2026'));

    const studentCount = await Student.countDocuments({});
    const demoStudent = await Student.create({
      userId: demoUser._id,
      studentId: `STU-${2026001 + studentCount}`,
      firstName: 'Demo',
      lastName: 'Student',
      email: 'student@royalacademy.edu.pk',
      phone: '03001234567',
      admissionDate: new Date(),
      branch: branches[0]._id,
      class: grade9._id,
      rollNumber: 'G9-001',
      enrollments: [
        {
          course: courses[0]._id,
          batch: grade9Batch2026?._id,
          status: 'enrolled',
          enrollDate: new Date(),
        },
      ],
      scholarshipType: 'none',
      scholarshipPercentage: 0,
      guardians: [{ name: 'Parent Demo', phone: '03009876543', relationship: 'father' }],
      isActive: true,
    });

    // Create fee record
    if (grade9Batch2026) {
      await Fee.create({
        student: demoStudent._id,
        batch: grade9Batch2026._id,
        amount: 20000,
        dueDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        description: 'Demo tuition fee',
        status: 'pending',
        paidAmount: 0,
        payments: [],
      });

      // Create attendance
      await Attendance.create({
        student: demoStudent._id,
        batch: grade9Batch2026._id,
        date: new Date(),
        status: 'present',
        remarks: 'Seed attendance',
      });
    }

    console.log('✓ Created demo student and linked records');

    console.log('\n✅ Seeding completed successfully!\n');
    console.log('Demo login: student@royalacademy.edu.pk / Student@123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

seed();
    console.log('');
