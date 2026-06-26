import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Fee } from '@/lib/models/Fee';
import { withAuth, authError, unauthorized, serverError } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request as any);
    if (!user) return authError(request as any);
    await connectDB();
    const agg = await Fee.aggregate([{
      $group: {
        _id: null,
        totalDue: { $sum: '$netAmount' },
        totalCollected: { $sum: '$paidAmount' },
        totalRecords: { $sum: 1 },
        paid: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } },
        pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
      }
    }]);
    return NextResponse.json({ data: agg[0] || { totalDue: 0, totalCollected: 0, totalRecords: 0, paid: 0, pending: 0 } }, { status: 200 });
  } catch (error) { return serverError(); }
}
