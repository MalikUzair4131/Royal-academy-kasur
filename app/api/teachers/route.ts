import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models/User';
import { withAuth, unauthorized, badRequest, serverError } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request as any);
    if (!user) return unauthorized();

    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const isActive = searchParams.get('isActive');

    const query: any = { role: 'teacher' };
    if (isActive !== null && isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const teachers = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    return NextResponse.json({ data: teachers }, { status: 200 });
  } catch (error) {
    console.error('Teachers list error:', error);
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request as any);
    if (!user) return unauthorized();

    await connectDB();

    const body = await request.json();

    // Support both `name` (legacy) and `firstName`+`lastName` (form)
    const firstName = (body.firstName || '').trim();
    const lastName = (body.lastName || '').trim();
    const fullName = body.name || [firstName, lastName].filter(Boolean).join(' ');

    const email = (body.email || '').trim().toLowerCase();
    const password = body.password || 'teacher123';

    if (!firstName && !fullName) {
      return badRequest('First name is required');
    }
    if (!email) {
      return badRequest('Email is required');
    }

    // Check email duplicate
    const existing = await User.findOne({ email });
    if (existing) {
      return badRequest('A user with this email already exists');
    }

    // Auto-generate teacherId
    const teacherCount = await User.countDocuments({ role: 'teacher' });
    const teacherId = `TEA-${new Date().getFullYear()}-${String(teacherCount + 1).padStart(4, '0')}`;

    const teacher = await User.create({
      ...body,
      name: fullName,
      firstName,
      lastName,
      email,
      password,
      role: 'teacher',
      teacherId,
      isActive: true,
    });

    return NextResponse.json(
      {
        data: {
          _id: teacher._id,
          name: teacher.name,
          firstName: (teacher as any).firstName,
          lastName: (teacher as any).lastName,
          email: teacher.email,
          role: teacher.role,
          teacherId,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Teacher create error:', error);
    return serverError();
  }
}
