import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    return NextResponse.json(
      { data: { message: 'User status toggled' } },
      { status: 200 }
    );
  } catch (error) {
    console.error('Toggle active error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
