import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Batch } from '@/lib/models/Batch';
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

    const batch = await Batch.findById(id)
      .populate('course', 'name code')
      .populate('instructor', 'firstName lastName email')
      .populate('branch', 'name code');

    if (!batch) return notFound();

    return NextResponse.json({ data: batch }, { status: 200 });
  } catch (error) {
    console.error('Batch fetch error:', error);
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

    if (!body.name || !body.course) {
      return badRequest('Batch name and course are required');
    }

    const authUser = await User.findById((user as any)._id).select('branch');
    const batchBranch = body.branch || authUser?.branch;
    if (!batchBranch) {
      return badRequest('Branch is required');
    }

    const updatedBatch = await Batch.findByIdAndUpdate(
      id,
      {
        $set: {
          ...body,
          branch: batchBranch,
        },
      },
      { new: true }
    );

    if (!updatedBatch) return notFound();

    return NextResponse.json({ data: updatedBatch }, { status: 200 });
  } catch (error) {
    console.error('Batch update error:', error);
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

    const batch = await Batch.findById(id);
    if (!batch) return notFound();

    batch.isActive = false;
    await batch.save();

    return NextResponse.json({ data: { message: 'Batch deactivated' } }, { status: 200 });
  } catch (error) {
    console.error('Batch delete error:', error);
    return serverError();
  }
}
