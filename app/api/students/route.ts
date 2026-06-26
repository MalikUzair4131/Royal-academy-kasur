import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Student } from '@/lib/models/Student';
import { User } from '@/lib/models/User';
import { Course } from '@/lib/models/Course';
import { Batch } from '@/lib/models/Batch';
import { Class } from '@/lib/models/Class';
import mongoose from 'mongoose';
import { withAuth, unauthorized, badRequest, notFound } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request as any);
    if (!user) return unauthorized();

    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const query: any = { isActive: true };
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const students = await Student.find(query)
      .populate('userId', 'email name')
      .populate('branch', 'name')
      .populate('enrollments.course', 'name')
      .populate('enrollments.batch', 'name')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Student.countDocuments(query);

    return NextResponse.json(
      {
        data: students,
        total,
        page,
        limit,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Students list error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to list students' }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request as any);
    if (!user) return unauthorized();

    await connectDB();

    const body = await request.json();
    console.log('Incoming Student Data:', body);

    const { firstName, lastName, phone, email, rollNumber } = body as any;

    if (!firstName) return badRequest('First name is required');
    if (!lastName) return badRequest('Last name is required');
    if (!email) return badRequest('Email is required');

    // Determine branch from the authenticated user (if set) otherwise fall back to request body
    const authUser = await User.findById((user as any)._id).select('branch');
    let branch = authUser?.branch || (body as any).branch;

    // Last resort: use first active branch in DB (single-branch schools)
    if (!branch || !mongoose.Types.ObjectId.isValid(String(branch))) {
      const { Branch } = await import('@/lib/models/Branch');
      const firstBranch = await Branch.findOne({ isActive: true });
      if (firstBranch) branch = firstBranch._id;
    }

    // Validate branch id
    if (!branch || !mongoose.Types.ObjectId.isValid(String(branch))) {
      return NextResponse.json({ success: false, message: 'No branch found in the system. Run the seed script first.' }, { status: 400 });
    }

    // Email validation & duplicate check
    if (email) {
      const emailLower = String(email).toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailLower)) {
        return NextResponse.json({ success: false, message: 'Invalid email format' }, { status: 400 });
      }
      const existingUser = await User.findOne({ email: emailLower });
      if (existingUser) {
        return NextResponse.json({ success: false, message: 'Email already exists' }, { status: 400 });
      }
      (body as any).email = emailLower;
    }

    // Normalize scholarshipPercentage
    const scholarshipPercentage = Number((body as any).scholarshipPercentage || 0);
    (body as any).scholarshipPercentage = Number.isNaN(scholarshipPercentage) ? 0 : scholarshipPercentage;

    // Resolve `class` when provided as a human-friendly name instead of ObjectId
    if ((body as any).class && !mongoose.Types.ObjectId.isValid(String((body as any).class))) {
      const className = String((body as any).class).trim();
      let cls = await Class.findOne({ name: className, branch });
      if (!cls) {
        // generate a code for the class
        const cleaned = className.replace(/[^a-zA-Z0-9]+/g, '-').replace(/-+/g, '-').toUpperCase();
        const code = `${cleaned}-${Math.floor(100 + Math.random() * 900)}`;
        cls = await Class.create({ name: className, code, branch });
      }
      (body as any).class = cls._id;
    }

    // Roll number duplicate check (within same class & branch)
    if (rollNumber) {
      const exists = await Student.findOne({ rollNumber: rollNumber, class: (body as any).class || null, branch });
      if (exists) return NextResponse.json({ success: false, message: 'Roll number already exists for this class/branch' }, { status: 400 });
    }
    // Validate enrollments (course/batch ids)
    if (Array.isArray((body as any).enrollments)) {
      for (const en of (body as any).enrollments) {
        // allow human-friendly names: try to resolve or create Course/Batch by name
        if (en.course && !mongoose.Types.ObjectId.isValid(String(en.course))) {
          const courseName = String(en.course).trim();
          let c = await Course.findOne({ name: courseName, branch });
          if (!c) {
            const cleaned = courseName.replace(/[^a-zA-Z0-9]+/g, '-').replace(/-+/g, '-').toUpperCase();
            const code = `${cleaned}-${Math.floor(100 + Math.random() * 900)}`;
            c = await Course.create({ name: courseName, code, branch });
          }
          en.course = c._id;
        }

        if (en.batch && !mongoose.Types.ObjectId.isValid(String(en.batch))) {
          const batchName = String(en.batch).trim();
          let b = await Batch.findOne({ name: batchName, branch });
          if (!b) {
            const cleaned = batchName.replace(/[^a-zA-Z0-9]+/g, '-').replace(/-+/g, '-').toUpperCase();
            const code = `${cleaned}-${Math.floor(100 + Math.random() * 900)}`;
            const payload: any = { name: batchName, code, branch };
            // if class provided in body, link it to batch
            if ((body as any).class) payload.class = (body as any).class;
            b = await Batch.create(payload);
          }
          en.batch = b._id;
        }
        // verify ids now
        if (en.course) {
          const c = await Course.findById(en.course);
          if (!c) return NextResponse.json({ success: false, message: `Course ${en.course} not found` }, { status: 400 });
        }
        if (en.batch) {
          const b = await Batch.findById(en.batch);
          if (!b) return NextResponse.json({ success: false, message: `Batch ${en.batch} not found` }, { status: 400 });
        }
      }
    }

    // Generate a simple sequential studentId based on current count.
    const count = await Student.countDocuments({});
    const studentId = `STU-${2026000 + count + 1}`;

    // Auto-create a User account for this student (required by userId foreign key)
    let userId = (body as any).userId;
    if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) {
      const emailForUser = email || `${studentId.toLowerCase()}@royalacademy.edu.pk`;
      let existingUser = email ? await User.findOne({ email: emailForUser }) : null;
      if (!existingUser) {
        existingUser = await User.create({
          name: `${firstName} ${lastName || ''}`.trim(),
          firstName,
          lastName: lastName || '',
          email: emailForUser,
          password: (body as any).password || 'student123',
          role: 'student',
          branch,
          isActive: true,
          permissions: [
            { module: 'dashboard', actions: ['view'] },
            { module: 'fees', actions: ['view'] },
            { module: 'attendance', actions: ['view'] },
          ],
        });
      }
      userId = existingUser._id;
    }

    const payload = {
      ...body,
      userId,
      studentId,
      branch,
      enrollments: (body as any).enrollments || [],
    } as any;

    const newStudent = await Student.create(payload);

    return NextResponse.json(
      {
        data: newStudent,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Student create error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to create student' }, { status: 400 });
  }
}
