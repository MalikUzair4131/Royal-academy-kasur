# 🏫 Royal Academy ERP System

A production-grade, full-stack MERN ERP for school management and multi-course training institutes.

## ✅ Features Implemented

### 🔐 Authentication & Security
- JWT access tokens (15min) + refresh tokens (7 days) with auto-rotation
- bcrypt password hashing (12 salt rounds)
- Account lockout after 5 failed login attempts (2hr lock)
- Rate limiting (20 auth reqs / 500 API reqs per 15min)
- CORS configured for specific frontend URL
- Helmet security headers
- HTTP-only cookie for refresh token

### 👥 User Roles & RBAC
| Role | Capabilities |
|------|-------------|
| **Owner** | God mode — cannot be touched by anyone except self |
| **Super Admin** | Full control over all users, branches, permissions |
| **Branch Admin** | Manage their branch — students, teachers, fees, attendance |
| **Teacher** | View students, mark attendance, view own salary |
| **Student** | View own fees, attendance, courses |
| **Parent** | View child's fees and attendance |

- Custom per-user permission overrides (super admin can assign)
- All actions gate-checked via `hasPermission(module, action)`

### 🎓 Student Management
- Full profiles with guardians, documents, academic history
- Course enrollment with scholarship discounts
- Auto-generated student ID (RA-0001 format)
- Bulk operations

### 👨‍🏫 Teacher Management
- **Fixed Salary** — monthly with attendance-based deductions
- **Revenue Sharing** — configurable % of collected student fees
- Auto-calculation of teacher earning vs academy share

### 💰 Fee Management
- Admission / Monthly / Exam / Certificate / Custom fees
- Partial payments tracking
- Scholarship discounts per student
- Overdue detection with days counter
- Auto receipt number generation
- Bulk fee generation for entire course/batch
- Revenue sharing calculation per course

### 💵 Salary System
- One-click salary processing for all teachers
- Fixed: gross − absence deductions + bonus − other deductions
- Revenue share: auto-aggregates paid fees from teacher's courses
- Mark as paid with payment reference

### 📅 Attendance
- Bulk mark attendance for entire class
- Mark all as present/absent/late/leave buttons
- Student + Teacher attendance
- Monthly analytics with daily breakdown

### 📊 Dashboard & Reports
- Today's collection, monthly collection
- Pending fees, overdue count
- Today's attendance donut chart
- 6-month revenue trend chart
- Profit & Loss report
- Fee collection by type (bar + pie charts)
- Attendance report

### 🔍 Audit Logs
- Every significant action logged (login, CRUD, payments, etc.)
- IP address, user agent, timestamps
- Viewable by super_admin and branch_admin

### 🏫 Training Institute
- Multiple courses with fee structures
- Batch management with timetables
- Instructor assignment per batch
- Student enrollment per batch

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + shadcn/ui components |
| Charts | Recharts |
| State | React Context + hooks |
| HTTP | Axios with auto refresh token interceptor |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Validation | express-validator |
| Logging | Winston |
| Security | helmet, cors, express-rate-limit |

## 📁 Structure

```
royal-academy-erp/
├── frontend/                    # Netlify
│   ├── src/
│   │   ├── App.tsx              # Routes
│   │   ├── main.tsx
│   │   ├── styles/globals.css
│   │   └── app/
│   │       ├── components/
│   │       │   ├── auth/Login.tsx
│   │       │   ├── layout/Layout.tsx
│   │       │   └── pages/      # Dashboard, Students, Teachers, Fees...
│   │       ├── contexts/AuthContext.tsx
│   │       └── services/api.ts  # All API calls
│   ├── netlify.toml
│   └── package.json
│
├── backend/                     # Render.com
│   ├── src/
│   │   ├── server.js
│   │   ├── models/              # User, Student, Teacher, Fee, Salary...
│   │   ├── routes/              # auth, users, students, fees, salary...
│   │   ├── middleware/auth.js   # protect, restrictTo, checkPermission
│   │   └── utils/              # logger, auth helpers, seeder
│   ├── .env.example
│   └── package.json
│
├── DEPLOYMENT.md                # Full deployment guide
└── README.md
```

## 🚀 Quick Start

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for full instructions.

```bash
# Seed database with demo data
cd backend && npm run seed
```
