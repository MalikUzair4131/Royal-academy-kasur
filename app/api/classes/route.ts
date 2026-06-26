import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Class } from '@/lib/models/Class';
import { User } from '@/lib/models/User';
import { withAuth, authError, unauthorized, badRequest, serverError } from '@/lib/middleware';
import mongoose from 'mongoose';

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
    if (!user) return authError(request as any);

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
    if (!user) return authError(request as any);

    await connectDB();

    const body = await request.json();
    const { name, code, description } = body;

    if (!name) return badRequest('Name is required');

    // Resolve branch: from body first, then from logged-in user's branch
    const authUser = await User.findById((user as any)._id).select('branch');
    const branch = body.branch || authUser?.branch;
    if (!branch) return badRequest('Branch could not be determined. Please contact an administrator.');

    // Auto-generate code if not supplied
    const classCode = code || generateClassCode(name);

    // Avoid duplicate name in same branch
    const existing = await Class.findOne({ name: name.trim(), branch });
    if (existing) {
      return NextResponse.json({ success: false, message: `A class named "${name}" already exists` }, { status: 400 });
    }

    const cls = await Class.create({ name: name.trim(), code: classCode, description, branch, isActive: true });

    return NextResponse.json({ data: cls }, { status: 201 });
  } catch (error) {
    console.error('Class create error:', error);
    return serverError();
  }
}
