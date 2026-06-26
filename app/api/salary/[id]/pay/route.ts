import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Salary } from '@/lib/models/Salary';
import { withAuth, authError, unauthorized, notFound, serverError } from '@/lib/middleware';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(request as any);
    if (!user) return authError(request as any);

    await connectDB();
    const { id } = await params;

    const salary = await Salary.findById(id);
    if (!salary) return notFound();

    salary.status = 'paid';
    (salary as any).paidDate = new Date();
    await salary.save();

    return NextResponse.json({ data: salary }, { status: 200 });
  } catch (error) {
    console.error('Salary pay error:', error);
    return serverError();
  }
}
