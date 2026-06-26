import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Batch } from '@/lib/models/Batch';
import { Class } from '@/lib/models/Class';
import { User } from '@/lib/models/User';
import mongoose from 'mongoose';
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
      .populate('class', 'name code')
      .populate('course', 'name code')
      .populate('instructor', 'firstName lastName name email')
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

    if (!body.name) {
      return badRequest('Batch name is required');
    }

    const authUser = await User.findById((user as any)._id).select('branch');
    const batchBranch = body.branch || authUser?.branch;

    const updateData: any = { ...body, branch: batchBranch };
    delete updateData.className;

    // Resolve className to class ObjectId
    if (body.className) {
      const className = String(body.className).trim();
      let cls = await Class.findOne({ name: className, branch: batchBranch });
      if (!cls) {
        const cleaned = className.replace(/[^a-zA-Z0-9]+/g, '-').toUpperCase();
        const code = `${cleaned.slice(0, 10)}-${Math.floor(100 + Math.random() * 900)}`;
        cls = await Class.create({ name: className, code, branch: batchBranch, isActive: true });
      }
      updateData.class = cls._id;
    } else if (body.class && mongoose.Types.ObjectId.isValid(String(body.class))) {
      updateData.class = body.class;
    }

    const updatedBatch = await Batch.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).populate('class', 'name code');

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
