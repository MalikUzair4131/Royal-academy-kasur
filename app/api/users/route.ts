import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models/User';
import { withAuth, unauthorized, badRequest, serverError, notFound } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request as any);
    if (!user) return unauthorized();

    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');

    const query: any = { role: { $ne: 'super_admin' } };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    return NextResponse.json(
      {
        data: users,
        total,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Users list error:', error);
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request as any);
    if (!user) return unauthorized();

    if (user.role !== 'super_admin' && user.role !== 'branch_admin') {
      return NextResponse.json(
        { message: 'Only admins can create users' },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { name, email, password, role, phone } = body;

    if (!name || !email || !password) {
      return badRequest('Name, email and password are required');
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return badRequest('Email already exists');
    }

    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: role || 'teacher',
      permissions: [],
    });

    return NextResponse.json(
      {
        data: {
          _id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('User create error:', error);
    return serverError();
  }
}
