import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Fee } from '@/lib/models/Fee';
import { Salary } from '@/lib/models/Salary';
import { withAuth, authError, unauthorized, serverError } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request as any);
    if (!user) return authError(request as any);
    await connectDB();
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') || new Date().getFullYear().toString();
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31`);

    const feeAgg = await Fee.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, totalRevenue: { $sum: '$paidAmount' } } }
    ]);
    const salaryAgg = await Salary.aggregate([
      { $match: { month: { $gte: startDate, $lte: endDate }, status: 'paid' } },
      { $group: { _id: null, totalExpenses: { $sum: '$totalSalary' } } }
    ]);
    const revenue = feeAgg[0]?.totalRevenue || 0;
    const expenses = salaryAgg[0]?.totalExpenses || 0;
    return NextResponse.json({ data: { revenue, expenses, profit: revenue - expenses, year } }, { status: 200 });
  } catch (error) { return serverError(); }
}
