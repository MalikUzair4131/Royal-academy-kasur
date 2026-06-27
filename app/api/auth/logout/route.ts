import { NextResponse } from 'next/server';
export async function POST() {
  const res = NextResponse.json({ data: { message: 'Logged out' } }, { status: 200 });
  res.cookies.delete('refreshToken');
  return res;
}
