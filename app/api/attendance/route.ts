import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Attendance } from '@/lib/models/Attendance';
import { withAuth, authError, unauthorized, serverError } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request as any);
    if (!user) return authError(request as any);

    await connectDB();

    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId');
    const date = searchParams.get('date');

    const query: any = {};
    if (batchId) query.batch = batchId;
    if (date) {
      const dateObj = new Date(date);
      query.date = {
        $gte: new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()),
        $lt: new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate() + 1),
      };
    }

    const attendance = await Attendance.find(query)
      .populate('student', 'firstName lastName studentId')
      .populate('batch', 'name code')
      .sort({ date: -1 });

    return NextResponse.json(
      {
        data: attendance,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Attendance list error:', error);
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request as any);
    if (!user) return authError(request as any);

    await connectDB();

    const body = await request.json();
    const attendance = await Attendance.create(body);

    return NextResponse.json(
      {
        data: attendance,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Attendance create error:', error);
    return serverError();
  }
}
