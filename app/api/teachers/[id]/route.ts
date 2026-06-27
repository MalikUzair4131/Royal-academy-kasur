import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models/User';
import { withAuth, authError } from '@/lib/middleware';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request as any);
    if (!user) return authError(request as any);
    await connectDB();
    const { id } = await params;
    const teacher = await User.findOne({ _id: id, role: 'teacher' }).select('-password').lean();
    if (!teacher) return NextResponse.json({ message: 'Not found' }, { status: 404 });
    return NextResponse.json({ data: teacher }, { status: 200 });
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
    const firstName = (body.firstName || '').trim();
    const lastName  = (body.lastName  || '').trim();
    const update: any = { ...body };
    if (firstName || lastName) update.name = [firstName, lastName].filter(Boolean).join(' ');
    delete update.password; delete update.role; delete update.email;
    const updated = await User.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: false }).select('-password');
    if (!updated) return NextResponse.json({ message: 'Not found' }, { status: 404 });
    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
