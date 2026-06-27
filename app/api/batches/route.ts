import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Batch } from '@/lib/models/Batch';
import { Class } from '@/lib/models/Class';
import { User } from '@/lib/models/User';
import { Branch } from '@/lib/models/Branch';
import mongoose from 'mongoose';
import { withAuth, authError } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request as any);
    if (!user) return authError(request as any);
    await connectDB();
    const { searchParams } = new URL(request.url);
    const q: any = { isActive: { $ne: false } };
    if (searchParams.get('classId')) q.class = searchParams.get('classId');
    const batches = await Batch.find(q)
      .populate('class', 'name code')
      .populate('instructor', 'firstName lastName name')
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({ data: batches, total: batches.length }, { status: 200 });
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
    if (!body.name) return NextResponse.json({ message: 'Session name is required' }, { status: 400 });

    // Auto-resolve branch
    let branch: any = body.branch;
    if (!branch) {
      const dbUser = await User.findById(authUser._id).select('branch').lean() as any;
      branch = dbUser?.branch;
    }
    if (!branch) { const fb = await Branch.findOne().lean() as any; branch = fb?._id; }

    // Resolve class
    let classId: any = body.class || body.classId;
    if (classId && !mongoose.Types.ObjectId.isValid(String(classId))) {
      let cls: any = await Class.findOne({ name: String(classId).trim() }).lean();
      if (!cls) cls = await Class.create({ name: String(classId).trim(), branch, isActive: true });
      classId = cls._id;
    }

    const payload: any = { ...body, branch, isActive: true };
    if (classId) payload.class = classId;
    delete payload.classId; delete payload.className;
    if (body.instructor && !mongoose.Types.ObjectId.isValid(String(body.instructor))) delete payload.instructor;

    const batch = await Batch.create(payload);
    return NextResponse.json({ data: batch }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
