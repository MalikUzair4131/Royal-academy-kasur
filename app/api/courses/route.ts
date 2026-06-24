import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Course } from '@/lib/models/Course';
import { withAuth, unauthorized, badRequest, serverError } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request as any);
    if (!user) return unauthorized();

    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    const query: any = { isActive: true };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }

    const courses = await Course.find(query)
      .populate('instructor', 'name email')
      .populate('branch', 'name code')
      .sort({ createdAt: -1 });

    return NextResponse.json(
      {
        data: courses,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Courses list error:', error);
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request as any);
    if (!user) return unauthorized();

    await connectDB();

    const body = await request.json();
    const { name, code, description, fee, branch } = body;

    if (!name || !code || !branch) {
      return badRequest('Name, code and branch are required');
    }

    const course = await Course.create(body);

    return NextResponse.json(
      {
        data: course,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Course create error:', error);
    return serverError();
  }
}
