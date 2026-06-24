import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken, generateAccessToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refreshToken')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { message: 'Refresh token not found', code: 'TOKEN_EXPIRED' },
        { status: 401 }
      );
    }

    const payload = verifyRefreshToken(refreshToken);

    if (!payload) {
      return NextResponse.json(
        { message: 'Invalid or expired refresh token', code: 'TOKEN_EXPIRED' },
        { status: 401 }
      );
    }

    const newAccessToken = generateAccessToken({
      _id: payload._id,
      email: payload.email,
      role: payload.role,
    });

    return NextResponse.json(
      {
        data: {
          accessToken: newAccessToken,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Refresh token error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
