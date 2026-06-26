import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Fee } from '@/lib/models/Fee';
import { withAuth, authError, unauthorized, serverError } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request as any);
    if (!user) return authError(request as any);
    await connectDB();
    const fees = await Fee.find({})
      .populate('student', 'firstName lastName studentId')
      .sort({ createdAt: -1 }).limit(100);
    return NextResponse.json({ data: fees, total: fees.length }, { status: 200 });
  } catch (error) { return serverError(); }
}
