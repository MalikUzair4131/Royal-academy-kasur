import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Fee } from '@/lib/models/Fee';
import { withAuth, authError } from '@/lib/middleware';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request as any);
    if (!user) return authError(request as any);
    await connectDB();
    const { id } = await params;
    const { amount, method = 'cash', reference = '' } = await request.json().catch(() => ({}));
    const fee: any = await Fee.findById(id);
    if (!fee) return NextResponse.json({ message: 'Fee not found' }, { status: 404 });
    const paid = Number(amount) || 0;
    fee.payments.push({ amount: paid, date: new Date(), method, reference });
    fee.paidAmount = (fee.paidAmount || 0) + paid;
    fee.status = fee.paidAmount >= fee.netAmount ? 'paid' : fee.paidAmount > 0 ? 'partial' : 'pending';
    await fee.save();
    return NextResponse.json({ data: fee }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
