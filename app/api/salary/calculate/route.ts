import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models/User';
import { Salary } from '@/lib/models/Salary';
import { Fee } from '@/lib/models/Fee';
import { withAuth, authError, unauthorized, serverError } from '@/lib/middleware';

export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request as any);
    if (!user) return authError(request as any);

    await connectDB();

    const body = await request.json();
    const { month } = body;

    const monthDate = month ? new Date(month + '-01') : new Date();
    const startOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const endOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

    // Get all active teachers
    const teachers = await User.find({ role: 'teacher', isActive: true });

    const results = [];
    for (const teacher of teachers) {
      // Check if salary already calculated for this month
      const existing = await Salary.findOne({
        employee: teacher._id,
        month: { $gte: startOfMonth, $lte: endOfMonth },
      });
      if (existing) { results.push(existing); continue; }

      let baseSalary = (teacher as any).fixedSalary || 0;

      // Revenue share calculation
      if ((teacher as any).salaryType === 'revenue_share') {
        const pct = (teacher as any).revenueSharePercentage || 0;
        const feesCollected = await Fee.aggregate([
          {
            $match: {
              createdAt: { $gte: startOfMonth, $lte: endOfMonth },
              status: { $in: ['paid', 'partial'] },
            },
          },
          { $group: { _id: null, total: { $sum: '$paidAmount' } } },
        ]);
        const totalFees = feesCollected[0]?.total || 0;
        baseSalary = Math.round((totalFees * pct) / 100);
      }

      const salary = await Salary.create({
        employee: teacher._id,
        month: startOfMonth,
        baseSalary,
        deductions: 0,
        bonuses: 0,
        totalSalary: baseSalary,
        status: 'processed',
      });
      results.push(salary);
    }

    return NextResponse.json({ data: results, count: results.length }, { status: 201 });
  } catch (error) {
    console.error('Salary calculate error:', error);
    return serverError();
  }
}
