import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models/User';
import { verifyAccessTokenWithReason } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  try {
    const header = request.headers.get('Authorization') || '';
    if (!header.startsWith('Bearer ')) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { payload, isExpired } = verifyAccessTokenWithReason(header.slice(7));
    if (!payload) {
      return NextResponse.json(
        { message: isExpired ? 'Token expired' : 'Invalid token', code: isExpired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN' },
        { status: 401 }
      );
    }

    await connectDB();
    const user = await User.findById(payload._id).select('-password').populate('branch', 'name code city').lean() as any;
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    return NextResponse.json({
      data: { _id: user._id, id: user._id, name: user.name, firstName: user.firstName, lastName: user.lastName,
              email: user.email, role: user.role, branch: user.branch, permissions: user.permissions || [] },
    }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
