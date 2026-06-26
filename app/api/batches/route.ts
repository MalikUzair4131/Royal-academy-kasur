import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Batch } from '@/lib/models/Batch';
import { Class } from '@/lib/models/Class';
import { User } from '@/lib/models/User';
import mongoose from 'mongoose';
import { withAuth, authError, unauthorized, badRequest, serverError } from '@/lib/middleware';

function generateBatchCode(name: string) {
  const cleaned = name
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '')
    .toUpperCase();
  return `${cleaned}-${Math.floor(100 + Math.random() * 900)}`;
}

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request as any);
    if (!user) return authError(request as any);

    await connectDB();

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const courseId = searchParams.get('courseId');
    const search = searchParams.get('search');
    const isActive = searchParams.get('isActive');

    const query: any = {};
    if (isActive !== null && isActive !== undefined) query.isActive = isActive === 'true';
    if (classId) query.class = classId;
    if (courseId) query.course = courseId;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }

    const batches = await Batch.find(query)
      .populate('class', 'name code')
      .populate('course', 'name code')
      .populate('instructor', 'name firstName lastName email')
      .populate('branch', 'name code')
      .sort({ createdAt: -1 });

    const total = await Batch.countDocuments(query);

    return NextResponse.json({ data: batches, total }, { status: 200 });
  } catch (error) {
    console.error('Batches list error:', error);
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request as any);
    if (!user) return authError(request as any);

    await connectDB();

    const body = await request.json();
    const { name } = body;

    if (!name) {
      return badRequest('Batch name is required');
    }

    // Resolve branch from auth user or body
    const authUser = await User.findById((user as any)._id).select('branch');
    const branch = body.branch || authUser?.branch;
    if (!branch) {
      return badRequest('Branch could not be determined. Please contact an administrator.');
    }

    // Auto-generate code
    const batchCode = body.code || generateBatchCode(name);

    const payload: any = {
      ...body,
      branch,
      code: batchCode,
    };

    // Resolve class: prefer ObjectId, fall back to human-readable className string
    if (body.class && mongoose.Types.ObjectId.isValid(String(body.class))) {
      payload.class = body.class;
    } else if (body.className) {
      const className = String(body.className).trim();
      let cls = await Class.findOne({ name: className, branch });
      if (!cls) {
        const cleaned = className.replace(/[^a-zA-Z0-9]+/g, '-').toUpperCase();
        const code = `${cleaned.slice(0, 10)}-${Math.floor(100 + Math.random() * 900)}`;
        cls = await Class.create({ name: className, code, branch, isActive: true });
      }
      payload.class = cls._id;
    }

    // Remove className from DB payload
    delete payload.className;

    const batch = await Batch.create(payload);

    return NextResponse.json({ data: batch }, { status: 201 });
  } catch (error) {
    console.error('Batch create error:', error);
    return serverError();
  }
}
