import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Batch } from '@/lib/models/Batch';
import { withAuth, authError } from '@/lib/middleware';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request as any);
    if (!user) return authError(request as any);
    await connectDB();
    const { id } = await params;
    const batch = await Batch.findById(id).populate('class', 'name code').populate('instructor', 'firstName lastName name').lean();
    if (!batch) return NextResponse.json({ message: 'Not found' }, { status: 404 });
    return NextResponse.json({ data: batch }, { status: 200 });
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
    const updated = await Batch.findByIdAndUpdate(id, { $set: body }, { new: true, runValidators: false });
    if (!updated) return NextResponse.json({ message: 'Not found' }, { status: 404 });
    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
