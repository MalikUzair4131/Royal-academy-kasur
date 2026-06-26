import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models/User';
import { withAuth, authError, unauthorized, notFound, serverError } from '@/lib/middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(request as any);
    if (!user) return authError(request as any);

    await connectDB();

    const { id } = await params;
    const teacher = await User.findOne({ _id: id, role: 'teacher' }).select('-password');

    if (!teacher) return notFound();

    return NextResponse.json({ data: teacher }, { status: 200 });
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
    if (!user) return authError(request as any);

    await connectDB();

    const { id } = await params;
    const body = await request.json();

    // Merge firstName/lastName into name if provided
    const updateData: any = { ...body };
    const firstName = (body.firstName || '').trim();
    const lastName = (body.lastName || '').trim();
    if (firstName || lastName) {
      updateData.name = [firstName, lastName].filter(Boolean).join(' ');
      updateData.firstName = firstName;
      updateData.lastName = lastName;
    }

    // Never allow changing role or password through this route
    delete updateData.role;
    delete updateData.password;

    const teacher = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).select('-password');

    if (!teacher) return notFound();

    return NextResponse.json({ data: teacher }, { status: 200 });
  } catch (error) {
    console.error('Teacher update error:', error);
    return serverError();
  }
}
