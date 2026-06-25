import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models/User';
import { withAuth, unauthorized, notFound, serverError } from '@/lib/middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(request as any);
    if (!user) return unauthorized();

    await connectDB();

    const { id } = await params;
    const teacher = await User.findOne({
      _id: id,
      role: 'teacher',
    }).select('-password');

    if (!teacher) return notFound();

    return NextResponse.json(
      {
        data: teacher,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Teacher get error:', error);
    return serverError();
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
    const teacher = await User.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true }
    ).select('-password');

    if (!teacher) return notFound();

    return NextResponse.json(
      {
        data: teacher,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Teacher update error:', error);
    return serverError();
  }
}
