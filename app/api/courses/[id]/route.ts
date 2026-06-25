import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Course } from '@/lib/models/Course';
import { User } from '@/lib/models/User';
import { withAuth, unauthorized, notFound, badRequest, serverError } from '@/lib/middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(request as any);
    if (!user) return unauthorized();

    await connectDB();
    const { id } = await params;

    const course = await Course.findById(id)
      .populate('instructor', 'name email')
      .populate('branch', 'name code');

    if (!course) return notFound();

    return NextResponse.json({ data: course }, { status: 200 });
  } catch (error) {
    console.error('Course fetch error:', error);
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

    if (!body.name) {
      return badRequest('Course name is required');
    }

    const authUser = await User.findById((user as any)._id).select('branch');
    const courseBranch = body.branch || authUser?.branch;
    if (!courseBranch) {
      return badRequest('Branch is required');
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      id,
      {
        $set: {
          ...body,
          branch: courseBranch,
        },
      },
      { new: true }
    );

    if (!updatedCourse) return notFound();

    return NextResponse.json({ data: updatedCourse }, { status: 200 });
  } catch (error) {
    console.error('Course update error:', error);
    return serverError();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(request as any);
    if (!user) return unauthorized();

    await connectDB();
    const { id } = await params;

    const course = await Course.findById(id);
    if (!course) return notFound();

    course.isActive = false;
    await course.save();

    return NextResponse.json({ data: { message: 'Course deactivated' } }, { status: 200 });
  } catch (error) {
    console.error('Course delete error:', error);
    return serverError();
  }
}
