import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Attendance } from '@/lib/models/Attendance';
import { withAuth, authError, unauthorized, serverError } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request as any);
    if (!user) return authError(request as any);
    await connectDB();
    const records = await Attendance.find({})
      .populate('student', 'firstName lastName studentId')
      .sort({ date: -1 }).limit(200);
    return NextResponse.json({ data: records, total: records.length }, { status: 200 });
  } catch (error) { return serverError(); }
}
