import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Course } from '@/lib/models/Course';
import { User } from '@/lib/models/User';
import { withAuth, authError, unauthorized, badRequest, serverError } from '@/lib/middleware';

function generateCourseCode(name: string) {
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
    const search = searchParams.get('search');
    const isActive = searchParams.get('isActive');

    const query: any = {};
    if (isActive !== null) query.isActive = isActive === 'true';
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

    const total = await Course.countDocuments(query);

    return NextResponse.json(
      {
        data: courses,
        total,
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
    if (!user) return authError(request as any);

    await connectDB();

    const body = await request.json();
    const { name, code, branch } = body;

    if (!name) {
      return badRequest('Name is required');
    }

    const authUser = await User.findById((user as any)._id).select('branch');
    const courseBranch = branch || authUser?.branch;
    if (!courseBranch) {
      return badRequest('Branch is required');
    }

    const courseCode = code || generateCourseCode(name);

    const course = await Course.create({
      ...body,
      branch: courseBranch,
      code: courseCode,
    });

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
