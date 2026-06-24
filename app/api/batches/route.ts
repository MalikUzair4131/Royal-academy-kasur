import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Batch } from '@/lib/models/Batch';
import { withAuth, unauthorized, badRequest, serverError } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request as any);
    if (!user) return unauthorized();

    await connectDB();

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const search = searchParams.get('search');

    const query: any = { isActive: true };
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

    return NextResponse.json(
      {
        data: batches,
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
    const { name, code, course, branch } = body;

    if (!name || !code || !course || !branch) {
      return badRequest('Name, code, course and branch are required');
    }

    const batch = await Batch.create(body);

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
