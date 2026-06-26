import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models/User';
import { withAuth, authError, unauthorized, notFound, serverError } from '@/lib/middleware';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(request as any);
    if (!user) return authError(request as any);

    await connectDB();

    const { id } = await params;
    const body = await request.json();

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return notFound();
    }

    return NextResponse.json(
      {
        data: updatedUser,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('User update error:', error);
    return serverError();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(request as any);
    if (!user) return authError(request as any);

    await connectDB();

    const { id } = await params;
    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return notFound();
    }

    return NextResponse.json(
      {
        data: { message: 'User deleted' },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('User delete error:', error);
    return serverError();
  }
}

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
    const pathname = request.nextUrl.pathname;

    if (pathname.includes('toggle-active')) {
      const targetUser = await User.findById(id);
      if (!targetUser) return notFound();

      targetUser.isActive = !targetUser.isActive;
      await targetUser.save();

      return NextResponse.json(
        {
          data: { message: 'User status updated', isActive: targetUser.isActive },
        },
        { status: 200 }
      );
    }

    if (pathname.includes('reset-password')) {
      const { newPassword } = body;
      if (!newPassword) {
        return NextResponse.json(
          { message: 'New password is required' },
          { status: 400 }
        );
      }

      const targetUser = await User.findById(id);
      if (!targetUser) return notFound();

      targetUser.password = newPassword;
      await targetUser.save();

      return NextResponse.json(
        {
          data: { message: 'Password reset successfully' },
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { message: 'Invalid operation' },
      { status: 400 }
    );
  } catch (error) {
    console.error('User patch error:', error);
    return serverError();
  }
}
