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
    const type = searchParams.get('type');
    const month = searchParams.get('month');

    const query: any = {};
    if (type) query.type = type;

    if (month) {
      const [year, monthPart] = month.split('-').map(Number);
      if (!Number.isNaN(year) && !Number.isNaN(monthPart)) {
        query.date = {
          $gte: new Date(year, monthPart - 1, 1),
          $lt: new Date(year, monthPart, 1),
        };
      }
    }

    const records = await Attendance.find(query).sort({ date: -1 });
    const summary = records.reduce(
      (acc: any, record) => {
        acc.total += 1;
        acc[record.status] = (acc[record.status] || 0) + 1;
        return acc;
      },
      { total: 0, present: 0, absent: 0, late: 0, leave: 0 }
    );

    return NextResponse.json(
      {
        data: { summary, records },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Attendance analytics error:', error);
    return serverError();
  }
}
