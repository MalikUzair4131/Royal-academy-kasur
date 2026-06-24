import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Salary } from '@/lib/models/Salary';
import { withAuth, unauthorized, serverError } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request as any);
    if (!user) return unauthorized();

    await connectDB();

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');

    const query: any = {};
    if (month) {
      const monthDate = new Date(month);
      query.month = {
        $gte: new Date(monthDate.getFullYear(), monthDate.getMonth(), 1),
        $lt: new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1),
      };
    }

    const salaries = await Salary.find(query)
      .populate('employee', 'name email role')
      .sort({ createdAt: -1 });

    return NextResponse.json(
      {
        data: salaries,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Salary list error:', error);
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request as any);
    if (!user) return unauthorized();

    await connectDB();

    const body = await request.json();
    const salary = await Salary.create(body);

    return NextResponse.json(
      {
        data: salary,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Salary create error:', error);
    return serverError();
  }
}
