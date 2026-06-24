import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Return empty notifications array
    return NextResponse.json(
      {
        data: {
          notifications: [
            {
              _id: '1',
              message: 'Welcome to Royal Academy',
              type: 'info',
              read: false,
              createdAt: new Date(),
            },
          ],
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Notifications error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
