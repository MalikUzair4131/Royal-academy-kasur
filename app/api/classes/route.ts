import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Class } from '@/lib/models/Class';
import { User } from '@/lib/models/User';
import { withAuth, unauthorized, badRequest, serverError } from '@/lib/middleware';

function generateClassCode(name: string) {
  const cleaned = name
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '')
    .toUpperCase();
  return `${cleaned}-${Math.floor(100 + Math.random() * 900)}`;
}

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request as any);
    if (!user) return unauthorized();

    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const branch = searchParams.get('branch');

    const query: any = {};
    if (branch) query.branch = branch;
    if (search) query.name = { $regex: search, $options: 'i' };

    const classes = await Class.find(query).sort({ createdAt: -1 });

    return NextResponse.json({ data: classes }, { status: 200 });
  } catch (error) {
    console.error('Classes list error:', error);
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request as any);
    if (!user) return unauthorized();

    await connectDB();

    const body = await request.json();
    const { name, code, branch } = body;

    if (!name) return badRequest('Name is required');

    const classCode = code || generateClassCode(name);

    const cls = await Class.create({ name, code: classCode, branch });

    return NextResponse.json({ data: cls }, { status: 201 });
  } catch (error) {
    console.error('Class create error:', error);
    return serverError();
  }
}
