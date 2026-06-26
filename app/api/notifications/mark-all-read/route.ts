import { NextRequest, NextResponse } from 'next/server';
export async function PATCH(request: NextRequest) {
  return NextResponse.json({ data: { message: 'All marked as read' } }, { status: 200 });
}
