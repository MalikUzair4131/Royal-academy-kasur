import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models/User';
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .populate('branch', 'name code city');

    if (!user || !(await user.comparePassword(password))) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json({ message: 'Account is inactive. Contact your administrator.' }, { status: 403 });
    }

    const tokenPayload = {
      _id: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    const response = NextResponse.json({
      data: {
        accessToken,
        user: {
          _id: user._id,
          id: user._id,
          name: user.name,
          firstName: (user as any).firstName,
          lastName: (user as any).lastName,
          email: user.email,
          role: user.role,
          branch: user.branch,          // ← included now
          permissions: user.permissions || [],
        },
      },
    }, { status: 200 });

    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
