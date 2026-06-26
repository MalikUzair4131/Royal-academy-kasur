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
    const body = await request.json();

    const salary = await Salary.findById(id);
    if (!salary) return notFound();

    const pathname = request.nextUrl.pathname;

    if (pathname.includes('/pay')) {
      salary.status = 'paid';
      salary.paidDate = new Date();
      await salary.save();
      return NextResponse.json({ data: salary }, { status: 200 });
    }

    const updated = await Salary.findByIdAndUpdate(id, { $set: body }, { new: true });
    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (error) {
    console.error('Salary update error:', error);
    return serverError();
  }
}
