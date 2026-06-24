import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Fee } from '@/lib/models/Fee';
import { withAuth, unauthorized, serverError } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request as any);
    if (!user) return unauthorized();

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const studentId = searchParams.get('studentId');

    const query: any = {};
    if (status) query.status = status;
    if (studentId) query.student = studentId;

    const fees = await Fee.find(query)
      .populate('student', 'firstName lastName studentId')
      .populate('batch', 'name code')
      .sort({ createdAt: -1 });

    const summary = {
      total: fees.length,
      pending: fees.filter(f => f.status === 'pending').length,
      paid: fees.filter(f => f.status === 'paid').length,
      totalAmount: fees.reduce((sum, f) => sum + f.amount, 0),
      collectedAmount: fees.reduce((sum, f) => sum + f.paidAmount, 0),
    };

    return NextResponse.json(
      {
        data: fees,
        summary,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Fees list error:', error);
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request as any);
    if (!user) return unauthorized();

    await connectDB();

    const body = await request.json();
    const fee = await Fee.create(body);

    return NextResponse.json(
      {
        data: fee,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Fee create error:', error);
    return serverError();
  }
}
