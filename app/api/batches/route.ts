import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Batch } from '@/lib/models/Batch';
import { User } from '@/lib/models/User';
import { withAuth, unauthorized, badRequest, serverError } from '@/lib/middleware';

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
    if (!user) return unauthorized();

    await connectDB();

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const search = searchParams.get('search');
    const isActive = searchParams.get('isActive');

    const query: any = {};
    if (isActive !== null) query.isActive = isActive === 'true';
    if (courseId) query.course = courseId;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }

    const batches = await Batch.find(query)
      .populate('course', 'name code')
      .populate('instructor', 'name email')
      .populate('branch', 'name code')
      .sort({ createdAt: -1 });

    const total = await Batch.countDocuments(query);

    return NextResponse.json(
      {
        data: batches,
        total,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Batches list error:', error);
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request as any);
    if (!user) return unauthorized();

    await connectDB();

    const body = await request.json();
    const { name, course, branch } = body;

    if (!name || !course) {
      return badRequest('Name and course are required');
    }

    const authUser = await User.findById((user as any)._id).select('branch');
    const batchBranch = branch || authUser?.branch;
    if (!batchBranch) {
      return badRequest('Branch is required');
    }

    const batchCode = body.code || generateBatchCode(name);

    const batch = await Batch.create({
      ...body,
      branch: batchBranch,
      code: batchCode,
    });

    return NextResponse.json(
      {
        data: batch,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Batch create error:', error);
    return serverError();
  }
}
