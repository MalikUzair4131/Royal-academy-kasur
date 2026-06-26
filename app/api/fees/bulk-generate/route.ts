import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Fee } from '@/lib/models/Fee';
import { Student } from '@/lib/models/Student';
import { withAuth, authError, unauthorized, badRequest, serverError } from '@/lib/middleware';

export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request as any);
    if (!user) return authError(request as any);
    await connectDB();
    const body = await request.json();
    const { amount, feeType = 'monthly', month, dueDate, description } = body;
    if (!amount || !dueDate) return badRequest('Amount and due date are required');
    const students = await Student.find({ isActive: true });
    const fees = [];
    for (const student of students) {
      const existing = feeType === 'monthly' && month
        ? await Fee.findOne({ student: student._id, feeType, month })
        : null;
      if (existing) continue;
      const receiptNo = `FEE-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      fees.push({
        receiptNo, student: student._id, feeType, month,
        originalAmount: amount, netAmount: amount, amount,
        dueDate: new Date(dueDate), description, status: 'pending', paidAmount: 0, payments: [],
      });
    }
    const created = fees.length > 0 ? await Fee.insertMany(fees) : [];
    return NextResponse.json({ data: created, count: created.length, skipped: students.length - fees.length }, { status: 201 });
  } catch (error) {
    console.error('Bulk generate error:', error);
    return serverError();
  }
}
