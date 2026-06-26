import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models/User';
import { verifyAccessTokenWithReason } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Missing authorization header' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const { payload, isExpired } = verifyAccessTokenWithReason(token);

    if (!payload) {
      const code = isExpired ? 'TOKEN_EXPIRED' : undefined;
      return NextResponse.json({ message: 'Invalid or expired token', ...(code && { code }) }, { status: 401 });
    }

    const user = await User.findById(payload._id)
      .select('-password')
      .populate('branch', 'name code city');

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        _id: user._id,
        name: user.name,
        firstName: (user as any).firstName,
        lastName: (user as any).lastName,
        email: user.email,
        role: user.role,
        branch: user.branch,
        permissions: user.permissions || [],
        isActive: user.isActive,
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Me endpoint error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
