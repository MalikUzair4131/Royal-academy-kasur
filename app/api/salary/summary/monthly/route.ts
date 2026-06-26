import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Salary } from '@/lib/models/Salary';
import { withAuth, authError, unauthorized, serverError } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request as any);
    if (!user) return authError(request as any);
    await connectDB();
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const query: any = {};
    if (month) {
      const d = new Date(month + '-01');
      query.month = { $gte: d, $lt: new Date(d.getFullYear(), d.getMonth() + 1, 1) };
    }
    const salaries = await Salary.find(query).populate('employee', 'name firstName lastName email teacherId');
    const totalPaid = salaries.filter(s => s.status === 'paid').reduce((a, s) => a + (s.totalSalary || 0), 0);
    const totalPending = salaries.filter(s => s.status !== 'paid').reduce((a, s) => a + (s.totalSalary || 0), 0);
    return NextResponse.json({ data: { salaries, totalPaid, totalPending, count: salaries.length } }, { status: 200 });
  } catch (error) {
    return serverError();
  }
}
