import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Class } from '@/lib/models/Class';
import { withAuth, unauthorized, badRequest, notFound, serverError } from '@/lib/middleware';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request as any);
    if (!user) return unauthorized();

    await connectDB();
    const { id } = await params;
    const cls = await Class.findById(id);
    if (!cls) return notFound();
    return NextResponse.json({ data: cls }, { status: 200 });
  } catch (error) {
    console.error('Class get error:', error);
    return serverError();
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request as any);
    if (!user) return unauthorized();

    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const cls = await Class.findByIdAndUpdate(id, body, { new: true });
    if (!cls) return notFound();
    return NextResponse.json({ data: cls }, { status: 200 });
  } catch (error) {
    console.error('Class update error:', error);
    return serverError();
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await withAuth(request as any);
    if (!user) return unauthorized();

    await connectDB();
    const { id } = await params;
    await Class.findByIdAndDelete(id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Class delete error:', error);
    return serverError();
  }
}
