import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Student } from '@/lib/models/Student';
import { User } from '@/lib/models/User';
import { Branch } from '@/lib/models/Branch';
import { Class } from '@/lib/models/Class';
import mongoose from 'mongoose';
import { withAuth, authError, unauthorized, badRequest } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request as any);
    if (!user) return authError(request as any);
    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const query: any = { isActive: true };
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const [students, total] = await Promise.all([
      Student.find(query)
        .populate('userId', 'email name')
        .populate('branch', 'name')
        .populate('class', 'name code')
        .populate('enrollments.batch', 'name code')
        .skip(skip).limit(limit).sort({ createdAt: -1 }),
      Student.countDocuments(query),
    ]);

    return NextResponse.json({ data: students, total, page, limit }, { status: 200 });
  } catch (error: any) {
    console.error('Students list error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await withAuth(request as any);
    if (!authUser) return unauthorized();
    await connectDB();

    const body = await request.json();
    const { firstName, email, password } = body;

    if (!firstName?.trim()) return badRequest('First name is required');

    // ── 1. Resolve branch (auth user → first branch in DB) ───────────────────
    const dbUser = await User.findById((authUser as any)._id).select('branch');
    let branch = dbUser?.branch;
    if (!branch) {
      const firstBranch = await Branch.findOne({ isActive: true });
      branch = firstBranch?._id;
    }
    if (!branch) return NextResponse.json({ success: false, message: 'No branch found. Run the seed script first (npm run seed).' }, { status: 400 });

    // ── 2. Email duplicate check ──────────────────────────────────────────────
    if (email) {
      const emailLower = String(email).toLowerCase().trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailLower)) return badRequest('Invalid email format');
      const exists = await User.findOne({ email: emailLower });
      if (exists) return NextResponse.json({ success: false, message: 'This email is already registered' }, { status: 400 });
    }

    // ── 3. Resolve `class` field ──────────────────────────────────────────────
    // If sent as ObjectId → use directly. If sent as string name → find or create.
    let classId = body.class;
    if (classId && !mongoose.Types.ObjectId.isValid(String(classId))) {
      const className = String(classId).trim();
      let cls = await Class.findOne({ name: className, branch });
      if (!cls) {
        const code = className.replace(/[^a-zA-Z0-9]+/g, '-').toUpperCase().slice(0, 15) + '-' + Math.floor(100 + Math.random() * 900);
        cls = await Class.create({ name: className, code, branch, isActive: true });
      }
      classId = cls._id;
    }

    // ── 4. Auto-generate studentId ────────────────────────────────────────────
    const count = await Student.countDocuments({});
    const studentId = `STU-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    // ── 5. Auto-create User account ───────────────────────────────────────────
    const emailForUser = email?.trim().toLowerCase() || `${studentId.toLowerCase()}@royalacademy.edu.pk`;
    let userId = body.userId;
    if (!userId) {
      let userAccount = await User.findOne({ email: emailForUser });
      if (!userAccount) {
        userAccount = await User.create({
          name: [firstName, body.lastName].filter(Boolean).join(' '),
          firstName: firstName.trim(),
          lastName: body.lastName?.trim() || '',
          email: emailForUser,
          password: password || 'student123',
          role: 'student',
          branch,
          isActive: true,
          permissions: [
            { module: 'dashboard', actions: ['view'] },
            { module: 'fees', actions: ['view'] },
            { module: 'attendance', actions: ['view'] },
          ],
        });
      }
      userId = userAccount._id;
    }

    // ── 6. Build clean enrollments ────────────────────────────────────────────
    const enrollments = [];
    if (Array.isArray(body.enrollments)) {
      for (const en of body.enrollments) {
        const entry: any = { status: en.status || 'enrolled', enrollDate: en.enrollDate || new Date() };
        if (en.batch && mongoose.Types.ObjectId.isValid(String(en.batch))) entry.batch = en.batch;
        if (en.course && mongoose.Types.ObjectId.isValid(String(en.course))) entry.course = en.course;
        if (entry.batch || entry.course) enrollments.push(entry);
      }
    }

    // ── 7. Create student ─────────────────────────────────────────────────────
    const studentData: any = {
      userId,
      studentId,
      branch,
      firstName: firstName.trim(),
      lastName: body.lastName?.trim() || '',
      email: email?.trim().toLowerCase() || undefined,
      phone: body.phone || undefined,
      dateOfBirth: body.dateOfBirth || undefined,
      admissionDate: body.admissionDate || new Date(),
      gender: body.gender || undefined,
      cnic: body.cnic || undefined,
      address: body.address || undefined,
      city: body.city || undefined,
      section: body.section || undefined,
      rollNumber: body.rollNumber || undefined,
      scholarshipType: body.scholarshipType || 'none',
      scholarshipPercentage: Number(body.scholarshipPercentage) || 0,
      notes: body.notes || undefined,
      guardians: Array.isArray(body.guardians) ? body.guardians : [],
      enrollments,
      isActive: true,
    };
    if (classId) studentData.class = classId;

    const student = await Student.create(studentData);

    return NextResponse.json({ data: student }, { status: 201 });
  } catch (error: any) {
    console.error('Student create error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to create student' }, { status: 400 });
  }
}
