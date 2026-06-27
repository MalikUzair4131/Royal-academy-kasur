import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Student } from '@/lib/models/Student';
import { withAuth, authError } from '@/lib/middleware';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request as any);
    if (!user) return authError(request as any);
    await connectDB();
    const { id } = await params;
    const student = await Student.findById(id)
      .populate('branch', 'name')
      .populate('class', 'name code')
      .populate('enrollments.batch', 'name code')
      .lean();
    if (!student) return NextResponse.json({ message: 'Student not found' }, { status: 404 });
    return NextResponse.json({ data: student }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request as any);
    if (!user) return authError(request as any);
    await connectDB();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    // Never reject — just update whatever was sent
    const updated = await Student.findByIdAndUpdate(id, { $set: body }, { new: true, runValidators: false });
    if (!updated) return NextResponse.json({ message: 'Student not found' }, { status: 404 });
    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request as any);
    if (!user) return authError(request as any);
    await connectDB();
    const { id } = await params;
    await Student.findByIdAndUpdate(id, { isActive: false }, { runValidators: false });
    return NextResponse.json({ data: { message: 'Student deactivated' } }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
