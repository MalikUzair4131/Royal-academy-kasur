import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Student } from '@/lib/models/Student';
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
    const student = await Student.findById(id)
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
    return NextResponse.json({ success: false, message: (error as any).message || 'Failed to get student' }, { status: 400 });
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
    const student = await Student.findByIdAndUpdate(
      id,
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
    return NextResponse.json({ success: false, message: (error as any).message || 'Failed to update student' }, { status: 400 });
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
    const student = await Student.findByIdAndUpdate(
      id,
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
    return NextResponse.json({ success: false, message: (error as any).message || 'Failed to delete student' }, { status: 400 });
  }
}
