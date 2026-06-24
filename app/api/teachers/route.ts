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

    const query: any = { role: 'teacher', isActive: true };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const teachers = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    return NextResponse.json(
      {
        data: teachers,
      },
      { status: 200 }
    );
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
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return badRequest('Name, email and password are required');
    }

    const teacher = await User.create({
      ...body,
      role: 'teacher',
      email: email.toLowerCase(),
    });

    return NextResponse.json(
      {
        data: {
          _id: teacher._id,
          name: teacher.name,
          email: teacher.email,
          role: teacher.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Teacher create error:', error);
    return serverError();
  }
}
