import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Fee } from '@/lib/models/Fee';
import { withAuth, authError } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request as any);
    if (!user) return authError(request as any);
    await connectDB();
    const { searchParams } = new URL(request.url);
    const q: any = {};
    if (searchParams.get('student')) q.student = searchParams.get('student');
    if (searchParams.get('status'))  q.status  = searchParams.get('status');
    const fees = await Fee.find(q)
      .populate('student', 'firstName lastName studentId')
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    return NextResponse.json({ data: fees, total: fees.length }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request as any);
    if (!user) return authError(request as any);
    await connectDB();

    const body = await request.json().catch(() => ({}));
    if (!body.student) return NextResponse.json({ message: 'Student is required' }, { status: 400 });

    const orig = Number(body.originalAmount) || Number(body.amount) || 0;
    const disc = Number(body.discountPercentage) || 0;
    const net  = Number(body.netAmount) || Math.round(orig - orig * disc / 100);
    const fee  = await Fee.create({
      ...body,
      originalAmount: orig,
      netAmount: net,
      amount: net,
      paidAmount: 0,
      status: 'pending',
      payments: [],
    });
    return NextResponse.json({ data: fee }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
