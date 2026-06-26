import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Fee } from '@/lib/models/Fee';
import { withAuth, authError, unauthorized, badRequest, serverError } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request as any);
    if (!user) return authError(request as any);

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const studentId = searchParams.get('studentId');
    const page = Number(searchParams.get('page') || '1');
    const limit = Number(searchParams.get('limit') || '20');

    const query: any = {};
    if (status) query.status = status;
    if (studentId) query.student = studentId;

    const total = await Fee.countDocuments(query);
    const fees = await Fee.find(query)
      .populate('student', 'firstName lastName studentId')
      .populate('batch', 'name code')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const summaryAggregation = await Fee.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalDue: { $sum: { $ifNull: ['$netAmount', '$amount'] } },
          totalCollected: { $sum: { $ifNull: ['$paidAmount', 0] } },
          totalPaid: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] },
          },
          totalPending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
          },
          overdueCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$status', 'paid'] },
                    { $lt: ['$dueDate', new Date()] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const summaryData = summaryAggregation[0] || {
      totalDue: 0,
      totalCollected: 0,
      totalPaid: 0,
      totalPending: 0,
      overdueCount: 0,
    };

    const totalDue = summaryData.totalDue;
    const totalCollected = summaryData.totalCollected;
    const totalPending = summaryData.totalPending;
    const overdueCount = summaryData.overdueCount;

    const summary = {
      total: total,
      pending: totalPending,
      paid: summaryData.totalPaid,
      totalAmount: totalDue,
      collectedAmount: totalCollected,
      totalDue,
      totalCollected,
      overdueCount,
    };

    return NextResponse.json(
      {
        data: fees,
        total,
        stats: summary,
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
    if (!user) return authError(request as any);

    await connectDB();

    const body = await request.json();
    const { student, dueDate, feeType = 'monthly', originalAmount = 0, netAmount, amount, paidAmount = 0 } = body;

    if (!student || !dueDate) {
      return badRequest('Student and due date are required');
    }

    const finalOriginal = Number(originalAmount) || 0;
    const finalNet = Number(netAmount ?? finalOriginal) || 0;
    // `amount` should equal netAmount (the payable amount). Legacy field kept for compatibility.
    const finalAmount = Number(amount ?? finalNet) || finalNet;
    const finalPaid = Number(paidAmount) || 0;

    const receiptNo = body.receiptNo || `FEE-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const status = body.status || (finalPaid >= finalNet && finalNet > 0 ? 'paid' : finalPaid > 0 ? 'partial' : 'pending');

    const fee = await Fee.create({
      ...body,
      receiptNo,
      feeType,
      originalAmount: finalOriginal,
      netAmount: finalNet,
      amount: finalAmount,
      dueDate: new Date(dueDate),
      paidAmount: finalPaid,
      status,
    });

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
