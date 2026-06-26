import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models/User';
import { withAuth, authError, unauthorized, notFound, badRequest, serverError } from '@/lib/middleware';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(request as any);
    if (!user) return authError(request as any);
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const newPassword = body.newPassword || body.password;
    if (!newPassword || newPassword.length < 6) return badRequest('Password must be at least 6 characters');
    const targetUser = await User.findById(id);
    if (!targetUser) return notFound();
    targetUser.password = newPassword;
    await targetUser.save();
    return NextResponse.json({ data: { message: 'Password reset successfully' } }, { status: 200 });
  } catch (error) {
    console.error('Password reset error:', error);
    return serverError();
  }
}
