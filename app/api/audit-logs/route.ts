import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { AuditLog } from '@/lib/models/AuditLog';
import { withAuth, unauthorized, serverError } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request as any);
    if (!user) return unauthorized();

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const logs = await AuditLog.find()
      .populate('user', 'name email')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await AuditLog.countDocuments();

    return NextResponse.json(
      {
        data: logs,
        total,
        page,
        limit,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Audit logs error:', error);
    return serverError();
  }
}
