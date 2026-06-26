import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models/User';
import { withAuth, authError, unauthorized, notFound, serverError } from '@/lib/middleware';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(request as any);
    if (!user) return authError(request as any);
    await connectDB();
    const { id } = await params;
    const { permissions } = await request.json();
    const targetUser = await User.findByIdAndUpdate(id, { $set: { permissions } }, { new: true }).select('-password');
    if (!targetUser) return notFound();
    return NextResponse.json({ data: targetUser }, { status: 200 });
  } catch (error) {
    return serverError();
  }
}
