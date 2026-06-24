import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Student } from '@/lib/models/Student';
import { Fee } from '@/lib/models/Fee';
import { Attendance } from '@/lib/models/Attendance';
import { User } from '@/lib/models/User';
import { withAuth, unauthorized, serverError } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request as any);
    if (!user) return unauthorized();

    await connectDB();

    // Get dashboard stats
    const [totalStudents, totalTeachers, totalFees, avgAttendance] = await Promise.all([
      Student.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'teacher', isActive: true }),
      Fee.countDocuments({ status: 'paid' }),
      Attendance.aggregate([
        { $match: { status: 'present' } },
        { $group: { _id: null, count: { $sum: 1 } } },
      ]),
    ]);

    const pendingFees = await Fee.countDocuments({ status: 'pending' });
    const totalFeesAmount = await Fee.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    return NextResponse.json(
      {
        data: {
          students: totalStudents,
          teachers: totalTeachers,
          fees: {
            collected: totalFees,
            pending: pendingFees,
            totalAmount: totalFeesAmount[0]?.total || 0,
          },
          attendance: avgAttendance[0]?.count || 0,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Dashboard error:', error);
    return serverError();
  }
}
