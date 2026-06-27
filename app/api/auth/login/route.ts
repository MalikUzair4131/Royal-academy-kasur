import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models/User';
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json().catch(() => ({}));
    const email    = (body.email    || '').toLowerCase().trim();
    const password = (body.password || '');

    if (!email || !password) return NextResponse.json({ message: 'Email and password required' }, { status: 400 });

    const user = await User.findOne({ email }).populate('branch', 'name code city');
    if (!user) return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    if (!user.isActive) return NextResponse.json({ message: 'Account is disabled. Contact admin.' }, { status: 403 });

    const ok = await user.comparePassword(password);
    if (!ok) return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });

    const payload = { _id: user._id.toString(), email: user.email, role: user.role };
    const accessToken  = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    const res = NextResponse.json({
      data: {
        accessToken,
        user: {
          _id: user._id, id: user._id,
          name: user.name, firstName: (user as any).firstName, lastName: (user as any).lastName,
          email: user.email, role: user.role,
          branch: user.branch,
          permissions: user.permissions || [],
        },
      },
    }, { status: 200 });

    res.cookies.set('refreshToken', refreshToken, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', maxAge: 7 * 24 * 60 * 60, path: '/',
    });

    return res;
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
