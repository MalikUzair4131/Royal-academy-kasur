import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models/User';
import { verifyRefreshToken, generateAccessToken, generateRefreshToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('refreshToken')?.value;
    if (!token) return NextResponse.json({ message: 'No refresh token', code: 'NO_REFRESH_TOKEN' }, { status: 401 });

    const payload = verifyRefreshToken(token);
    if (!payload) return NextResponse.json({ message: 'Invalid refresh token', code: 'INVALID_REFRESH_TOKEN' }, { status: 401 });

    await connectDB();
    const user = await User.findById(payload._id).select('-password').lean() as any;
    if (!user || !user.isActive) return NextResponse.json({ message: 'User not found' }, { status: 401 });

    const newPayload = { _id: user._id.toString(), email: user.email, role: user.role };
    const accessToken  = generateAccessToken(newPayload);
    const refreshToken = generateRefreshToken(newPayload);

    const res = NextResponse.json({ data: { accessToken } }, { status: 200 });
    res.cookies.set('refreshToken', refreshToken, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', maxAge: 7 * 24 * 60 * 60, path: '/',
    });
    return res;
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
