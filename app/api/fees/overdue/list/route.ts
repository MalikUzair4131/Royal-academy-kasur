import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Fee } from '@/lib/models/Fee';
import { withAuth, authError } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request as any);
    if (!user) return authError(request as any);
    await connectDB();
    const fees = await Fee.find({ status: { $in: ['pending', 'partial'] }, dueDate: { $lt: new Date() } })
      .populate('student', 'firstName lastName studentId guardians phone')
      .sort({ dueDate: 1 })
      .lean();
    return NextResponse.json({ data: fees }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
