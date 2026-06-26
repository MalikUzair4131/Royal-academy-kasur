import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Student } from '@/lib/models/Student';
import { Fee } from '@/lib/models/Fee';
import { Attendance } from '@/lib/models/Attendance';
import { User } from '@/lib/models/User';
import { Class } from '@/lib/models/Class';
import { Batch } from '@/lib/models/Batch';
import { withAuth, authError, serverError } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request as any);
    if (!user) return authError(request as any);

    await connectDB();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalStudents,
      totalTeachers,
      activeClasses,
      activeSessions,
      paidFeesCount,
      pendingFeesCount,
      overdueCount,
    ] = await Promise.all([
      Student.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'teacher', isActive: true }),
      Class.countDocuments({ isActive: true }),
      Batch.countDocuments({ isActive: true }),
      Fee.countDocuments({ status: 'paid' }),
      Fee.countDocuments({ status: 'pending' }),
      Fee.countDocuments({ status: 'pending', dueDate: { $lt: new Date() } }),
    ]);

    // Today's attendance
    const todayAttendanceData = await Attendance.aggregate([
      { $match: { date: { $gte: today, $lt: tomorrow } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const todayAttendance = {
      present: todayAttendanceData.find(a => a._id === 'present')?.count || 0,
      absent:  todayAttendanceData.find(a => a._id === 'absent')?.count  || 0,
      late:    todayAttendanceData.find(a => a._id === 'late')?.count    || 0,
      leave:   todayAttendanceData.find(a => a._id === 'leave')?.count   || 0,
    };

    // Fee totals — use payments[].date for "today's collection"
    const [feeTotals, todayPayments] = await Promise.all([
      Fee.aggregate([
        { $group: { _id: null, totalDue: { $sum: '$netAmount' }, totalPaid: { $sum: '$paidAmount' } } }
      ]),
      Fee.aggregate([
        { $unwind: '$payments' },
        { $match: { 'payments.date': { $gte: today, $lt: tomorrow } } },
        { $group: { _id: null, total: { $sum: '$payments.amount' } } },
      ]),
    ]);

    // Monthly chart: fees created (not paid) per month for last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyChart = await Fee.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo }, status: 'paid' } },
      { $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          collected: { $sum: '$paidAmount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    return NextResponse.json({
      data: {
        totalStudents,
        totalTeachers,
        activeClasses,
        activeSessions,
        paidFeesCount,
        pendingFeesCount,
        overdueCount,
        todayCollection: todayPayments[0]?.total || 0,
        totalDue: feeTotals[0]?.totalDue || 0,
        totalCollected: feeTotals[0]?.totalPaid || 0,
        todayAttendance,
        monthlyChart,
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Dashboard error:', error);
    return serverError();
  }
}
