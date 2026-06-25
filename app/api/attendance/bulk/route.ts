import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Attendance } from '@/lib/models/Attendance';
import { withAuth, unauthorized, serverError } from '@/lib/middleware';

export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request as any);
    if (!user) return unauthorized();

    await connectDB();

    const body = await request.json();
    const { records, date, type } = body; // Array of attendance records

    if (!Array.isArray(records)) {
      return NextResponse.json(
        { message: 'Records must be an array' },
        { status: 400 }
      );
    }

    // Apply shared fields (date/type) to each record so backend-required fields are present
    const normalized = records.map((r: any) => ({
      ...r,
      date: r.date ? new Date(r.date) : date ? new Date(date) : new Date(),
      type: r.type || type || 'student',
    }));

    const result = await Attendance.insertMany(normalized);

    return NextResponse.json(
      {
        data: {
          message: `${result.length} attendance records created`,
          count: result.length,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Bulk attendance error:', error);
    return serverError();
  }
}
