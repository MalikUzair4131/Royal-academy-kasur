import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Student } from '@/lib/models/Student';
import { Fee } from '@/lib/models/Fee';
import { Attendance } from '@/lib/models/Attendance';
import { User } from '@/lib/models/User';
import { Course } from '@/lib/models/Course';
import { Batch } from '@/lib/models/Batch';
import { Salary } from '@/lib/models/Salary';
import { withAuth, unauthorized, serverError } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request as any);
    if (!user) return unauthorized();

    await connectDB();

    // Get all required stats in parallel
    const [
      totalStudents,
      totalTeachers,
      activeCourses,
      activeBatches,
      paidFees,
      pendingFees,
      overdueCount,
      unpaidSalaries
    ] = await Promise.all([
      Student.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'teacher', isActive: true }),
      Course.countDocuments({ isActive: true }),
      Batch.countDocuments({ isActive: true }),
      Fee.countDocuments({ status: 'paid' }),
      Fee.countDocuments({ status: 'pending' }),
      Fee.countDocuments({ status: 'pending', dueDate: { $lt: new Date() } }),
      Salary.aggregate([
        { $match: { status: 'pending' } },
        { $group: { _id: null, amount: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
    ]);

    // Get today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAttendanceData = await Attendance.aggregate([
      { $match: { date: { $gte: today, $lt: tomorrow } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const todayAttendance = {
      present: todayAttendanceData.find(a => a._id === 'present')?.count || 0,
      absent: todayAttendanceData.find(a => a._id === 'absent')?.count || 0,
      late: todayAttendanceData.find(a => a._id === 'late')?.count || 0,
      leave: todayAttendanceData.find(a => a._id === 'leave')?.count || 0,
    };

    // Get today's fee collection
    const todayCollection = await Fee.aggregate([
      {
        $match: {
          status: 'paid',
          paidDate: {
            $gte: today,
            $lt: tomorrow,
          },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    // Get monthly collection for chart
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const monthlyCollection = await Fee.aggregate([
      {
        $match: {
          status: 'paid',
          paidDate: { $gte: currentMonth },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    // Get monthly chart data (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyChart = await Fee.aggregate([
      {
        $match: {
          status: 'paid',
          paidDate: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$paidDate' },
            month: { $month: '$paidDate' },
          },
          collected: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          _id: { $concat: [{ $toString: '$_id.year' }, '-', { $toString: '$_id.month' }] },
          collected: 1,
        },
      },
    ]);

    const totalFeesAmount = await Fee.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    return NextResponse.json(
      {
        data: {
          totalStudents,
          totalTeachers,
          activeCourses,
          activeBatches,
          todayCollection: todayCollection[0]?.total || 0,
          monthlyCollection: monthlyCollection[0]?.total || 0,
          pendingFees: totalFeesAmount[0]?.total || 0,
          overdueCount,
          unpaidSalaries: unpaidSalaries[0] || { amount: 0, count: 0 },
          todayAttendance,
          monthlyChart,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Dashboard error:', error);
    return serverError();
  }
}
