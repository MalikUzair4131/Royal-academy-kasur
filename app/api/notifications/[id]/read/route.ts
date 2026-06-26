import { NextRequest, NextResponse } from 'next/server';
export async function PATCH(request: NextRequest) {
  // Placeholder — returns success (notifications not stored in DB yet)
  return NextResponse.json({ data: { message: 'Marked as read' } }, { status: 200 });
}
