import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Student } from '@/lib/models/Student';
import { User } from '@/lib/models/User';
import { Branch } from '@/lib/models/Branch';
import { Class } from '@/lib/models/Class';
import mongoose from 'mongoose';
import { withAuth, authError } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request as any);
    if (!user) return authError(request as any);
    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page   = Math.max(1, parseInt(searchParams.get('page')  || '1'));
    const limit  = Math.min(100, parseInt(searchParams.get('limit') || '20'));

    const query: any = { isActive: { $ne: false } };
    if (search) {
      query.$or = [
        { firstName:  { $regex: search, $options: 'i' } },
        { lastName:   { $regex: search, $options: 'i' } },
        { studentId:  { $regex: search, $options: 'i' } },
        { phone:      { $regex: search, $options: 'i' } },
        { email:      { $regex: search, $options: 'i' } },
      ];
    }

    const [students, total] = await Promise.all([
      Student.find(query)
        .populate('branch', 'name')
        .populate('class',  'name code')
        .populate('enrollments.batch', 'name code')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Student.countDocuments(query),
    ]);

    return NextResponse.json({ data: students, total, page, limit }, { status: 200 });
  } catch (err: any) {
    console.error('GET /students error:', err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await withAuth(request as any);
    if (!authUser) return authError(request as any);
    await connectDB();

    const body = await request.json().catch(() => ({}));

    // ── Only real requirement: a name ──────────────────────────────────────────
    const firstName = (body.firstName || body.name || '').trim();
    if (!firstName) {
      return NextResponse.json({ message: 'Student first name is required' }, { status: 400 });
    }

    // ── Auto-resolve branch (never reject because of this) ────────────────────
    let branch: any = body.branch || null;
    if (!branch || !mongoose.Types.ObjectId.isValid(String(branch))) {
      const dbUser = await User.findById(authUser._id).select('branch').lean() as any;
      branch = dbUser?.branch || null;
    }
    if (!branch) {
      const fb = await Branch.findOne().sort({ createdAt: 1 }).lean() as any;
      branch = fb?._id || null;
    }
    // If still no branch — create one on the fly so form never fails
    if (!branch) {
      const nb = await Branch.create({ name: 'Main Campus', code: `MC-${Date.now()}`, isActive: true });
      branch = nb._id;
    }

    // ── Resolve class (ObjectId or name string — both accepted) ───────────────
    let classId: any = body.class || body.classId || null;
    if (classId && !mongoose.Types.ObjectId.isValid(String(classId))) {
      // It's a name string — find or create
      const cName = String(classId).trim();
      let cls: any = await Class.findOne({ name: cName }).lean();
      if (!cls) cls = await Class.create({ name: cName, branch, isActive: true });
      classId = cls._id;
    }

    // ── Auto-generate unique studentId ────────────────────────────────────────
    const count = await Student.countDocuments({});
    const studentId = `STU-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    // ── Auto-create User account (silently, never block form save) ────────────
    let userId: any = body.userId || null;
    if (!userId) {
      try {
        const emailRaw = (body.email || '').trim().toLowerCase();
        const emailForUser = emailRaw || `${studentId.toLowerCase()}@student.local`;
        let ua: any = emailRaw ? await User.findOne({ email: emailRaw }).lean() : null;
        if (!ua) {
          ua = await User.create({
            name: [firstName, body.lastName || ''].join(' ').trim(),
            firstName, lastName: body.lastName || '',
            email: emailForUser,
            password: body.password || 'student123',
            role: 'student', branch, isActive: true,
            permissions: [
              { module: 'dashboard',  actions: ['view'] },
              { module: 'fees',       actions: ['view'] },
              { module: 'attendance', actions: ['view'] },
            ],
          });
        }
        userId = ua._id;
      } catch {
        // User creation failed (e.g. duplicate email) — student still saves
      }
    }

    // ── Build enrollments (only valid ObjectIds, never throw) ──────────────────
    const enrollments: any[] = [];
    if (Array.isArray(body.enrollments)) {
      for (const en of body.enrollments) {
        const entry: any = { status: en.status || 'enrolled', enrollDate: en.enrollDate || new Date() };
        if (en.batch  && mongoose.Types.ObjectId.isValid(String(en.batch)))  entry.batch  = en.batch;
        if (en.course && mongoose.Types.ObjectId.isValid(String(en.course))) entry.course = en.course;
        if (en.batch || en.course) enrollments.push(entry);
      }
    } else if (body.sessionId && mongoose.Types.ObjectId.isValid(String(body.sessionId))) {
      enrollments.push({ batch: body.sessionId, status: 'enrolled', enrollDate: new Date() });
    }

    // ── Save student — strip only undefined, keep everything else ─────────────
    const doc: any = {
      studentId, branch, firstName,
      lastName:   body.lastName   || '',
      email:      (body.email || '').trim().toLowerCase() || undefined,
      phone:      body.phone      || undefined,
      dateOfBirth:body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
      admissionDate: body.admissionDate ? new Date(body.admissionDate) : new Date(),
      gender:     body.gender     || undefined,
      cnic:       body.cnic       || undefined,
      address:    body.address    || undefined,
      city:       body.city       || undefined,
      section:    body.section    || undefined,
      rollNumber: body.rollNumber || undefined,
      fatherName: body.fatherName || undefined,
      motherName: body.motherName || undefined,
      scholarshipType:       body.scholarshipType       || 'none',
      scholarshipPercentage: Number(body.scholarshipPercentage) || 0,
      notes:      body.notes      || undefined,
      guardians:  Array.isArray(body.guardians) ? body.guardians : [],
      enrollments,
      isActive:   true,
    };
    if (classId) doc.class = classId;
    if (userId)  doc.userId = userId;

    const student = await Student.create(doc);
    return NextResponse.json({ data: student }, { status: 201 });

  } catch (err: any) {
    // Duplicate studentId race condition — retry once with new ID
    if (err.code === 11000 && err.keyPattern?.studentId) {
      try {
        const body2 = {}; // already parsed above but err is from create — can't retry cleanly
        // Just return a helpful error
        return NextResponse.json({ message: 'Duplicate ID — please try again' }, { status: 409 });
      } catch {}
    }
    console.error('POST /students error:', err);
    return NextResponse.json({ message: err.message || 'Failed to save student' }, { status: 500 });
  }
}
