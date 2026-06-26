import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Fee } from '@/lib/models/Fee';
import { withAuth, authError, unauthorized, notFound, badRequest, serverError } from '@/lib/middleware';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(request as any);
    if (!user) return authError(request as any);

    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const amount = Number(body.amount || body.payAmount || 0);
    if (amount <= 0) {
      return badRequest('Amount must be greater than zero');
    }

    const fee = await Fee.findById(id);
    if (!fee) return notFound();

    fee.paidAmount = (fee.paidAmount || 0) + amount;
    fee.payments = fee.payments || [];
    fee.payments.push({
      amount,
      date: new Date(),
      method: body.method || 'cash',
      reference: body.reference || '',
    });
    fee.status = fee.paidAmount >= fee.netAmount ? 'paid' : 'partial';

    await fee.save();

    return NextResponse.json({ data: fee }, { status: 200 });
  } catch (error) {
    console.error('Fee payment error:', error);
    return serverError();
  }
}
