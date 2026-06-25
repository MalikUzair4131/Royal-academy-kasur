import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Student } from '@/lib/models/Student';
import { User } from '@/lib/models/User';
import { Course } from '@/lib/models/Course';
import { Batch } from '@/lib/models/Batch';
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

    // Determine branch from the authenticated user (if set) otherwise fall back to request body
    const authUser = await User.findById((user as any)._id).select('branch');
    const branch = authUser?.branch || (body as any).branch;

    // Validate branch id
    if (!branch || !mongoose.Types.ObjectId.isValid(String(branch))) {
      return NextResponse.json({ success: false, message: 'Branch is required and must be a valid id' }, { status: 400 });
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

    // Roll number duplicate check (within same class & branch)
    if (rollNumber) {
      const exists = await Student.findOne({ rollNumber: rollNumber, class: (body as any).class || null, branch });
      if (exists) return NextResponse.json({ success: false, message: 'Roll number already exists for this class/branch' }, { status: 400 });
    }

    // Normalize scholarshipPercentage
    const scholarshipPercentage = Number((body as any).scholarshipPercentage || 0);
    (body as any).scholarshipPercentage = Number.isNaN(scholarshipPercentage) ? 0 : scholarshipPercentage;

    // Validate enrollments (course/batch ids)
    if (Array.isArray((body as any).enrollments)) {
      for (const en of (body as any).enrollments) {
        if (en.course && !mongoose.Types.ObjectId.isValid(String(en.course))) {
          return NextResponse.json({ success: false, message: 'Invalid course id in enrollments' }, { status: 400 });
        }
        if (en.batch && !mongoose.Types.ObjectId.isValid(String(en.batch))) {
          return NextResponse.json({ success: false, message: 'Invalid batch id in enrollments' }, { status: 400 });
        }
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

    const payload = {
      ...body,
      userId: (user as any)._id,
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
