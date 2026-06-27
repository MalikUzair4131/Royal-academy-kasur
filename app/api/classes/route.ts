import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Class } from '@/lib/models/Class';
import { User } from '@/lib/models/User';
import { Branch } from '@/lib/models/Branch';
import { withAuth, authError } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request as any);
    if (!user) return authError(request as any);
    await connectDB();
    const search = new URL(request.url).searchParams.get('search') || '';
    const q: any = {};
    if (search) q.name = { $regex: search, $options: 'i' };
    const classes = await Class.find(q).sort({ name: 1 }).lean();
    return NextResponse.json({ data: classes, total: classes.length }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await withAuth(request as any);
    if (!authUser) return authError(request as any);
    await connectDB();
    const body = await request.json().catch(() => ({}));
    if (!body.name) return NextResponse.json({ message: 'Class name is required' }, { status: 400 });

    let branch: any = body.branch;
    if (!branch) { const dbUser = await User.findById(authUser._id).select('branch').lean() as any; branch = dbUser?.branch; }
    if (!branch) { const fb = await Branch.findOne().lean() as any; branch = fb?._id; }

    // Allow duplicate names — just create with unique code
    const cls = await Class.create({ name: body.name.trim(), description: body.description, branch, isActive: true });
    return NextResponse.json({ data: cls }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
