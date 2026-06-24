import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(
      {
        data: {
          reports: [
            { id: '1', name: 'Attendance Report', status: 'ready' },
            { id: '2', name: 'Fee Collection Report', status: 'ready' },
            { id: '3', name: 'Student Progress Report', status: 'ready' },
            { id: '4', name: 'Teacher Performance', status: 'ready' },
          ],
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reports error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
