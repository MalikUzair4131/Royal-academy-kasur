import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Student } from '@/lib/models/Student';
import { User } from '@/lib/models/User';
import { Class } from '@/lib/models/Class';
import { withAuth, unauthorized, notFound, serverError } from '@/lib/middleware';
import mongoose from 'mongoose';

async function resolveClassId(classValue: any, branchId: any) {
  if (!classValue) return classValue;
  if (mongoose.Types.ObjectId.isValid(String(classValue))) return classValue;

  const className = String(classValue).trim();
  let cls = await Class.findOne({ name: className, branch: branchId });
  if (!cls) {
    const cleaned = className.replace(/[^a-zA-Z0-9]+/g, '-').replace(/-+/g, '-').toUpperCase();
    const code = `${cleaned}-${Math.floor(100 + Math.random() * 900)}`;
    cls = await Class.create({ name: className, code, branch: branchId, isActive: true });
  }
  return cls._id;
}

async function resolveEnrollments(body: any, branchId: any) {
  if (!Array.isArray(body.enrollments)) return;

  for (const en of body.enrollments) {
    if (en.course && !mongoose.Types.ObjectId.isValid(String(en.course))) {
      const courseName = String(en.course).trim();
      const { Course } = await import('@/lib/models/Course');
      let c = await Course.findOne({ name: courseName, branch: branchId });
      if (!c) {
        const cleaned = courseName.replace(/[^a-zA-Z0-9]+/g, '-').replace(/-+/g, '-').toUpperCase();
        const code = `${cleaned}-${Math.floor(100 + Math.random() * 900)}`;
        c = await Course.create({ name: courseName, code, branch: branchId });
      }
      en.course = c._id;
    }

    if (en.batch && !mongoose.Types.ObjectId.isValid(String(en.batch))) {
      const batchName = String(en.batch).trim();
      const { Batch } = await import('@/lib/models/Batch');
      let b = await Batch.findOne({ name: batchName, branch: branchId });
      if (!b) {
        const cleaned = batchName.replace(/[^a-zA-Z0-9]+/g, '-').replace(/-+/g, '-').toUpperCase();
        const code = `${cleaned}-${Math.floor(100 + Math.random() * 900)}`;
        const payload: any = { name: batchName, code, branch: branchId };
        if (body.class) payload.class = body.class;
        b = await Batch.create(payload);
      }
      en.batch = b._id;
    }

    if (en.course) {
      const { Course } = await import('@/lib/models/Course');
      const c = await Course.findById(en.course);
      if (!c) throw new Error(`Course ${en.course} not found`);
    }
    if (en.batch) {
      const { Batch } = await import('@/lib/models/Batch');
      const b = await Batch.findById(en.batch);
      if (!b) throw new Error(`Batch ${en.batch} not found`);
    }
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(request as any);
    if (!user) return unauthorized();

    await connectDB();

    const { id } = await params;
    const student = await Student.findById(id)
      .populate('userId', 'email name')
      .populate('branch', 'name')
      .populate('enrollments.course', 'name code')
      .populate('enrollments.batch', 'name code');

    if (!student) return notFound();

    return NextResponse.json(
      {
        data: student,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Student get error:', error);
    return NextResponse.json({ success: false, message: (error as any).message || 'Failed to get student' }, { status: 400 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(request as any);
    if (!user) return unauthorized();

    await connectDB();

    const { id } = await params;
    const body = await request.json();
    const existingStudent = await Student.findById(id);
    if (!existingStudent) return notFound();

    const branch = existingStudent.branch;

    if (body.email) {
      const emailLower = String(body.email).toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailLower)) {
        return NextResponse.json({ success: false, message: 'Invalid email format' }, { status: 400 });
      }
      const existingUser = await User.findOne({ email: emailLower, _id: { $ne: existingStudent.userId } });
      if (existingUser) {
        return NextResponse.json({ success: false, message: 'Email already exists' }, { status: 400 });
      }
      body.email = emailLower;
      if (existingStudent.userId) {
        await User.findByIdAndUpdate(existingStudent.userId, { email: emailLower });
      }
    }

    if (body.class) {
      body.class = await resolveClassId(body.class, branch);
    }

    if (body.enrollments) {
      await resolveEnrollments(body, branch);
    }

    if (body.rollNumber) {
      const classIdToCheck = body.class || existingStudent.class || null;
      const duplicate = await Student.findOne({
        _id: { $ne: existingStudent._id },
        rollNumber: body.rollNumber,
        class: classIdToCheck,
        branch,
      });
      if (duplicate) {
        return NextResponse.json({ success: false, message: 'Roll number already exists for this class/branch' }, { status: 400 });
      }
    }

    const student = await Student.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true }
    ).populate('userId', 'email name').populate('branch', 'name');

    if (!student) return notFound();

    return NextResponse.json(
      {
        data: student,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Student update error:', error);
    return NextResponse.json({ success: false, message: (error as any).message || 'Failed to update student' }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(request as any);
    if (!user) return unauthorized();

    await connectDB();

    const { id } = await params;
    const student = await Student.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!student) return notFound();

    return NextResponse.json(
      {
        data: { message: 'Student deactivated' },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Student delete error:', error);
    return NextResponse.json({ success: false, message: (error as any).message || 'Failed to delete student' }, { status: 400 });
  }
}
