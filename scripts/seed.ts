import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';

// Load env manually before any imports
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach(line => {
    const t = line.trim();
    if (!t || t.startsWith('#')) return;
    const [k, ...rest] = t.split('=');
    if (k && rest.length && !process.env[k.trim()]) process.env[k.trim()] = rest.join('=').trim();
  });
}
loadEnv();

import { connectDB } from '../lib/db';
import { User } from '../lib/models/User';
import { Branch } from '../lib/models/Branch';
import { Course } from '../lib/models/Course';
import { Batch } from '../lib/models/Batch';
import { Student } from '../lib/models/Student';
import { Class } from '../lib/models/Class';
import { Fee } from '../lib/models/Fee';
import { Attendance } from '../lib/models/Attendance';

async function seed() {
  try {
    await connectDB();
    console.log('✓ Connected to MongoDB');

    // ── 1. Clear all collections ───────────────────────────────────────────────
    await Promise.all([
      User.deleteMany({}), Branch.deleteMany({}), Course.deleteMany({}),
      Batch.deleteMany({}), Student.deleteMany({}), Class.deleteMany({}),
      Fee.deleteMany({}), Attendance.deleteMany({}),
    ]);
    console.log('✓ Cleared existing data');

    // ── 2. Create branch ───────────────────────────────────────────────────────
    const [mainBranch] = await Branch.insertMany([{
      name: 'Main Campus',
      code: 'MAIN-001',
      address: 'Royal Academy, Kasur, Punjab',
      phone: '+92-42-12345678',
      email: 'main@royalacademy.edu.pk',
      city: 'Kasur',
      state: 'Punjab',
      isActive: true,
    }]);
    console.log('✓ Created branch: Main Campus');

    // ── 3. Create users (passwords pre-hashed) ────────────────────────────────
    const hash = (p: string) => bcrypt.hash(p, 10);

    const [superAdmin, manager, teacher1, teacher2] = await User.insertMany([
      {
        name: 'Super Admin',
        firstName: 'Super', lastName: 'Admin',
        email: 'superadmin@royalacademy.com',
        password: await hash('SuperAdmin@123'),
        role: 'super_admin',
        branch: mainBranch._id,  // give branch so student creation works
        isActive: true,
        permissions: [{ module: '*', actions: ['manage'] }],
      },
      {
        name: 'Branch Manager',
        firstName: 'Branch', lastName: 'Manager',
        email: 'manager@royalacademy.com',
        password: await hash('Manager@123'),
        role: 'branch_admin',
        branch: mainBranch._id,  // FIXED: was undefined before
        isActive: true,
        permissions: [
          { module: 'dashboard', actions: ['view'] },
          { module: 'students',  actions: ['view', 'create', 'edit', 'delete'] },
          { module: 'teachers',  actions: ['view', 'create', 'edit', 'delete'] },
          { module: 'courses',   actions: ['view', 'create', 'edit', 'delete'] },
          { module: 'attendance',actions: ['view', 'create', 'edit'] },
          { module: 'fees',      actions: ['view', 'create', 'edit', 'delete'] },
          { module: 'salary',    actions: ['view', 'create', 'edit'] },
          { module: 'reports',   actions: ['view'] },
          { module: 'users',     actions: ['view', 'create', 'edit'] },
        ],
      },
      {
        name: 'Mr. Ahmed Khan',
        firstName: 'Ahmed', lastName: 'Khan',
        email: 'ahmed.khan@royalacademy.com',
        password: await hash('Teacher@123'),
        role: 'teacher',
        branch: mainBranch._id,
        teacherId: 'TEA-2026-0001',
        salaryType: 'fixed', fixedSalary: 30000,
        qualification: 'MSc Mathematics',
        specialization: 'Mathematics',
        joiningDate: new Date('2024-01-01'),
        isActive: true,
        permissions: [
          { module: 'dashboard',  actions: ['view'] },
          { module: 'students',   actions: ['view'] },
          { module: 'attendance', actions: ['view', 'create', 'edit'] },
          { module: 'courses',    actions: ['view'] },
        ],
      },
      {
        name: 'Mrs. Fatima Ali',
        firstName: 'Fatima', lastName: 'Ali',
        email: 'fatima.ali@royalacademy.com',
        password: await hash('Teacher@123'),
        role: 'teacher',
        branch: mainBranch._id,
        teacherId: 'TEA-2026-0002',
        salaryType: 'fixed', fixedSalary: 28000,
        qualification: 'MSc Physics',
        specialization: 'Physics',
        joiningDate: new Date('2024-03-01'),
        isActive: true,
        permissions: [
          { module: 'dashboard',  actions: ['view'] },
          { module: 'students',   actions: ['view'] },
          { module: 'attendance', actions: ['view', 'create', 'edit'] },
          { module: 'courses',    actions: ['view'] },
        ],
      },
    ]);
    console.log('✓ Created 4 users (admin, manager, 2 teachers)');

    // ── 4. Create school classes ───────────────────────────────────────────────
    const classNames = ['Junior Grade', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'Supplementary Students'];
    const classes = await Class.insertMany(classNames.map((name, i) => ({
      name, code: `CL-${100 + i}`, description: `${name} class`,
      branch: mainBranch._id, isActive: true,
    })));
    console.log(`✓ Created ${classes.length} classes`);

    // ── 5. Create sessions (batches) for each class ────────────────────────────
    const batchDocs: any[] = [];
    classes.forEach((c: any) => {
      ['2026', '2027'].forEach(year => {
        batchDocs.push({
          name: `${c.name} – ${year} Session`,
          code: `${c.code}-${year}`,
          class: c._id,
          startDate: new Date(`${year}-01-15`),
          endDate: new Date(`${year}-12-31`),
          schedule: 'Mon–Fri 8:00 AM – 2:00 PM',
          maxStudents: 60,
          instructor: teacher1._id,
          branch: mainBranch._id,
          status: year === '2026' ? 'active' : 'upcoming',
          isActive: true,
        });
      });
    });
    const batches = await Batch.insertMany(batchDocs);
    console.log(`✓ Created ${batches.length} sessions`);

    // ── 6. Create compatibility course (required by Student.enrollments.course) ─
    const [compatCourse] = await Course.insertMany([{
      name: 'General Studies',
      code: 'GS-2026',
      type: 'school',
      description: 'General school curriculum',
      instructor: teacher1._id,
      branch: mainBranch._id,
      isActive: true,
    }]);

    // ── 7. Create demo student user account ───────────────────────────────────
    const [demoStudentUser] = await User.insertMany([{
      name: 'Ali Ahmed',
      firstName: 'Ali', lastName: 'Ahmed',
      email: 'student@royalacademy.edu.pk',
      password: await hash('Student@123'),
      role: 'student',
      branch: mainBranch._id,
      isActive: true,
      permissions: [
        { module: 'dashboard',  actions: ['view'] },
        { module: 'attendance', actions: ['view'] },
        { module: 'fees',       actions: ['view'] },
      ],
    }]);

    const grade9Class = classes.find((c: any) => c.name === 'Grade 9')!;
    const grade9Session2026 = batches.find((b: any) =>
      String(b.class) === String(grade9Class._id) && b.code.endsWith('2026')
    )!;

    const demoStudent = await Student.create({
      userId: demoStudentUser._id,
      studentId: 'STU-2026-0001',
      firstName: 'Ali', lastName: 'Ahmed',
      email: 'student@royalacademy.edu.pk',
      phone: '03001234567',
      admissionDate: new Date(),
      branch: mainBranch._id,
      class: grade9Class._id,
      section: 'A',
      rollNumber: 'G9-001',
      gender: 'male',
      city: 'Kasur',
      guardians: [{ name: 'Ahmed Senior', phone: '03009876543', relationship: 'father' }],
      enrollments: [{
        course: compatCourse._id,
        batch: grade9Session2026._id,
        status: 'enrolled',
        enrollDate: new Date(),
      }],
      scholarshipType: 'none',
      scholarshipPercentage: 0,
      isActive: true,
    });
    console.log('✓ Created demo student: Ali Ahmed (Grade 9)');

    // ── 8. Create demo fee record ──────────────────────────────────────────────
    const now = new Date();
    await Fee.create({
      receiptNo: `FEE-SEED-${Date.now()}`,
      student: demoStudent._id,
      batch: grade9Session2026._id,
      feeType: 'monthly',
      month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
      originalAmount: 20000,
      netAmount: 20000,
      amount: 20000,
      dueDate: new Date(now.getFullYear(), now.getMonth() + 1, 10),
      description: 'Monthly tuition – June 2026',
      status: 'pending',
      paidAmount: 0,
      payments: [],
    });
    console.log('✓ Created demo fee record (PKR 20,000)');

    // ── 9. Create demo attendance ──────────────────────────────────────────────
    await Attendance.create({
      student: demoStudent._id,
      batch: grade9Session2026._id,
      class: grade9Class._id,
      date: new Date(),
      status: 'present',
      type: 'student',
    });
    console.log('✓ Created demo attendance record');

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅  Seeding completed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Super Admin  → superadmin@royalacademy.com  / SuperAdmin@123');
    console.log('  Branch Mgr   → manager@royalacademy.com     / Manager@123');
    console.log('  Teacher      → ahmed.khan@royalacademy.com  / Teacher@123');
    console.log('  Student      → student@royalacademy.edu.pk  / Student@123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
}

seed();
