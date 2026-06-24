import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Fee } from '@/lib/models/Fee';
import { withAuth, unauthorized, serverError } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request as any);
    if (!user) return unauthorized();

    await connectDB();

    const overdueFees = await Fee.find({
      status: { $in: ['pending', 'partial'] },
      dueDate: { $lt: new Date() },
    })
      .populate('student', 'firstName lastName studentId')
      .populate('batch', 'name code')
      .sort({ dueDate: 1 });

    return NextResponse.json(
      {
        data: overdueFees,
        total: overdueFees.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Overdue fees error:', error);
    return serverError();
  }
}
