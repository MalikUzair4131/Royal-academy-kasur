import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models/User';
import { Branch } from '@/lib/models/Branch';
import { withAuth, authError } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request as any);
    if (!user) return authError(request as any);
    await connectDB();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const q: any = { role: 'teacher' };
    if (search) q.$or = [
      { name:      { $regex: search, $options: 'i' } },
      { firstName: { $regex: search, $options: 'i' } },
      { email:     { $regex: search, $options: 'i' } },
    ];
    const teachers = await User.find(q).select('-password').sort({ createdAt: -1 }).lean();
    return NextResponse.json({ data: teachers, total: teachers.length }, { status: 200 });
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
    const firstName = (body.firstName || '').trim();
    const lastName  = (body.lastName  || '').trim();
    const fullName  = body.name || [firstName, lastName].filter(Boolean).join(' ') || 'Teacher';
    const email     = (body.email || '').toLowerCase().trim();

    if (!email) return NextResponse.json({ message: 'Email is required for teachers' }, { status: 400 });

    // Check duplicate email — return clear message
    const existing = await User.findOne({ email }).lean();
    if (existing) return NextResponse.json({ message: `Email ${email} is already registered` }, { status: 400 });

    // Auto-resolve branch
    let branch: any = body.branch;
    if (!branch) {
      const dbUser = await User.findById(authUser._id).select('branch').lean() as any;
      branch = dbUser?.branch;
    }
    if (!branch) {
      const fb = await Branch.findOne().lean() as any;
      branch = fb?._id;
    }

    const count = await User.countDocuments({ role: 'teacher' });
    const teacherId = `TEA-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const teacher = await User.create({
      ...body,
      name: fullName, firstName, lastName, email,
      password: body.password || 'teacher123',
      role: 'teacher', teacherId, branch, isActive: true,
      permissions: [
        { module: 'dashboard',  actions: ['view'] },
        { module: 'attendance', actions: ['view', 'create', 'edit'] },
        { module: 'courses',    actions: ['view'] },
        { module: 'students',   actions: ['view'] },
      ],
    });

    const t = teacher.toObject() as any;
    delete t.password;
    return NextResponse.json({ data: t }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
