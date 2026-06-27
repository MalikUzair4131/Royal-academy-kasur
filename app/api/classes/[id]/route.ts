import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Class } from '@/lib/models/Class';
import { withAuth, authError } from '@/lib/middleware';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request as any);
    if (!user) return authError(request as any);
    await connectDB();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const updated = await Class.findByIdAndUpdate(id, { $set: body }, { new: true, runValidators: false });
    if (!updated) return NextResponse.json({ message: 'Not found' }, { status: 404 });
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
    await Class.findByIdAndUpdate(id, { isActive: false }, { runValidators: false });
    return NextResponse.json({ data: { message: 'Deleted' } }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
