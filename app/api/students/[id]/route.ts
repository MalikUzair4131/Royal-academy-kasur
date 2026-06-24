import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Student } from '@/lib/models/Student';
import { withAuth, unauthorized, notFound, serverError } from '@/lib/middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await withAuth(request as any);
    if (!user) return unauthorized();

    await connectDB();

    const student = await Student.findById(params.id)
      .populate('userId', 'email name')
      .populate('branch', 'name')
      .populate('enrollments.course', 'name code')
      .populate('enrollments.batch', 'name code');

    if (!student) return notFound();

    return NextResponse.json(
      {
        data: student,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Student get error:', error);
    return serverError();
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await withAuth(request as any);
    if (!user) return unauthorized();

    await connectDB();

    const body = await request.json();
    const student = await Student.findByIdAndUpdate(
      params.id,
      { $set: body },
      { new: true }
    ).populate('userId', 'email name').populate('branch', 'name');

    if (!student) return notFound();

    return NextResponse.json(
      {
        data: student,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Student update error:', error);
    return serverError();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await withAuth(request as any);
    if (!user) return unauthorized();

    await connectDB();

    const student = await Student.findByIdAndUpdate(
      params.id,
      { isActive: false },
      { new: true }
    );

    if (!student) return notFound();

    return NextResponse.json(
      {
        data: { message: 'Student deactivated' },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Student delete error:', error);
    return serverError();
  }
}
