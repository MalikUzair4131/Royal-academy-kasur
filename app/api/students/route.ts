import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Student } from '@/lib/models/Student';
import { User } from '@/lib/models/User';
import { withAuth, unauthorized, badRequest, serverError, notFound } from '@/lib/middleware';

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
  } catch (error) {
    console.error('Students list error:', error);
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request as any);
    if (!user) return unauthorized();

    await connectDB();

      const body = await request.json();
      const { firstName, lastName, phone } = body;

      if (!firstName) return badRequest('First name is required');

      // Determine branch from the authenticated user (if set) otherwise fall back to request body
      const authUser = await User.findById((user as any)._id).select('branch');
      const branch = authUser?.branch || (body as any).branch;

      // Generate a simple sequential studentId based on current count.
      const count = await Student.countDocuments({});
      const studentId = `STU-${2026000 + count + 1}`;

      const newStudent = await Student.create({
        userId: (user as any)._id,
        studentId,
        firstName,
        lastName,
        phone,
        branch,
        enrollments: [],
      });

    return NextResponse.json(
      {
        data: newStudent,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Student create error:', error);
    return serverError();
  }
}
