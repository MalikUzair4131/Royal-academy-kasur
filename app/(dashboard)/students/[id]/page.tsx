'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { studentsApi } from '@/services/api';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Edit2 } from 'lucide-react';

export default function StudentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string | undefined;
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    studentsApi.get(id)
      .then(res => setStudent(res.data.data))
      .catch(() => toast.error('Failed to load student details'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="py-16 text-center text-gray-500">
        <p>Student not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Details</h1>
          <p className="text-gray-500 text-sm">View student information and academic assignment.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">
            <ArrowLeft className="inline-block w-4 h-4 mr-1" /> Back
          </button>
          <button onClick={() => router.push(`/students/${student._id}/edit`)} className="px-4 py-2 rounded-xl bg-amber-500 text-white text-sm hover:bg-amber-600">
            <Edit2 className="inline-block w-4 h-4 mr-1" /> Edit
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
          <dl className="grid gap-3">
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500">Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{student.firstName} {student.lastName}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{student.email || student.user?.email || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500">Phone</dt>
              <dd className="mt-1 text-sm text-gray-900">{student.phone || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500">Gender</dt>
              <dd className="mt-1 text-sm text-gray-900">{student.gender || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500">CNIC / B-Form</dt>
              <dd className="mt-1 text-sm text-gray-900">{student.cnic || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500">Date of Birth</dt>
              <dd className="mt-1 text-sm text-gray-900">{student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : '—'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500">Address</dt>
              <dd className="mt-1 text-sm text-gray-900">{student.address || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500">City</dt>
              <dd className="mt-1 text-sm text-gray-900">{student.city || '—'}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Academic Information</h2>
          <dl className="grid gap-3">
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500">Student ID</dt>
              <dd className="mt-1 text-sm text-gray-900">{student.studentId || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500">Admission Date</dt>
              <dd className="mt-1 text-sm text-gray-900">{student.admissionDate ? new Date(student.admissionDate).toLocaleDateString() : '—'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500">Class</dt>
              <dd className="mt-1 text-sm text-gray-900">{student.class?.name || student.class || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500">Section</dt>
              <dd className="mt-1 text-sm text-gray-900">{student.section || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500">Roll Number</dt>
              <dd className="mt-1 text-sm text-gray-900">{student.rollNumber || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500">Scholarship</dt>
              <dd className="mt-1 text-sm text-gray-900">{student.scholarshipType || 'none'} {student.scholarshipPercentage ? `(${student.scholarshipPercentage}%)` : ''}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500">Status</dt>
              <dd className="mt-1 text-sm text-gray-900">{student.isActive ? 'Active' : 'Inactive'}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Guardian Information</h2>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-gray-500">Name</dt>
            <dd className="mt-1 text-sm text-gray-900">{student.guardians?.[0]?.name || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-gray-500">Phone</dt>
            <dd className="mt-1 text-sm text-gray-900">{student.guardians?.[0]?.phone || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-gray-500">Relationship</dt>
            <dd className="mt-1 text-sm text-gray-900">{student.guardians?.[0]?.relationship || '—'}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
