# Royal Academy ERP System

A complete, production-ready Educational Resource Planning (ERP) system built with **Next.js 16**, **MongoDB**, and **TypeScript**. Designed for modern educational institutions with multi-branch, multi-role support and comprehensive management features.

## 🚀 Features

### Core Functionality
- **Multi-Role Authentication**: Super Admin, Branch Admin, Teachers, Students, Parents
- **Student Management**: Complete student profiles, enrollments, and progress tracking
- **Course & Batch Management**: Course creation, batch scheduling, and enrollment management
- **Attendance Tracking**: Daily attendance marking with analytics
- **Fee Management**: Fee collection, payment tracking, overdue notifications
- **Salary Management**: Employee salary calculation and payment processing
- **Audit Logging**: Complete audit trail for all operations
- **Real-time Notifications**: System notifications for important events
- **Dashboard Analytics**: Key metrics and KPIs at a glance

### Technical Highlights
- **Next.js 16 App Router**: Modern React framework with server components
- **TypeScript**: Full type safety across the application
- **MongoDB**: Flexible, scalable NoSQL database
- **Mongoose ODM**: Schema validation and data modeling
- **JWT Authentication**: Secure token-based authentication
- **Responsive Design**: Mobile-first UI with Tailwind CSS
- **API-First Architecture**: RESTful APIs for all operations
- **Vercel Ready**: Optimized for serverless deployment

## 📦 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- npm or yarn

### Local Setup

```bash
# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Create .env.local with MongoDB connection
# MONGODB_URI=your_mongodb_connection_string
# JWT_SECRET=your-secret-key
# JWT_REFRESH_SECRET=your-refresh-secret

# 3. Seed database with test data
npm run seed

# 4. Start development server
npm run dev
```

Visit `http://localhost:3000` and login with test credentials below.

## 🧪 Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@royalacademy.com | SuperAdmin@123 |
| Branch Manager | manager@royalacademy.com | Manager@123 |
| Teacher | ahmed.khan@royalacademy.com | Teacher@123 |
| Student | ali.ahmed@student.royalacademy.com | Student@123 |

## 🏗️ Project Structure

```
app/
├── api/                    # API routes
│   ├── auth/               # Authentication
│   ├── users/              # User management
│   ├── students/           # Student operations
│   ├── teachers/           # Teacher management
│   ├── courses/            # Course management
│   ├── batches/            # Batch management
│   ├── attendance/         # Attendance tracking
│   ├── fees/               # Fee management
│   ├── salary/             # Salary management
│   └── dashboard/          # Dashboard stats
├── (auth)/                 # Auth pages
└── (dashboard)/            # Dashboard pages

components/
├── auth/                   # Auth components
├── layout/                 # Layout components
├── pages/                  # Feature components
└── ui/                     # Reusable components

lib/
├── db.ts                   # MongoDB connection
├── jwt.ts                  # JWT utilities
├── middleware.ts           # API middleware
├── models/                 # Database schemas
└── utils.ts                # Helpers
```

## 📚 Technology Stack

| Category | Technology |
|----------|-----------|
| Frontend | React 19, Next.js 16 |
| Styling | Tailwind CSS, Radix UI |
| Backend | Node.js, Next.js API Routes |
| Database | MongoDB, Mongoose |
| Auth | JWT, bcryptjs |
| Language | TypeScript |
| Deployment | Vercel |

## 🚀 Deployment

### Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com)
   - Click "Add New Project"
   - Select your GitHub repository

3. **Add Environment Variables**
   - `MONGODB_URI` - Your MongoDB Atlas connection string
   - `JWT_SECRET` - Random secret for JWT
   - `JWT_REFRESH_SECRET` - Random secret for refresh tokens

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete

5. **Seed Production Database**
   ```bash
   npm run seed
   ```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment guide.

## 🛠️ Available Scripts

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm start                # Start production server
npm run seed             # Seed database with test data
npm run lint             # Run ESLint
```

## 📋 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `PUT /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Delete user
- `PATCH /api/users/[id]/toggle-active` - Toggle status
- `PATCH /api/users/[id]/reset-password` - Reset password

### Students
- `GET /api/students` - List students
- `POST /api/students` - Create student
- `PUT /api/students/[id]` - Update student
- `DELETE /api/students/[id]` - Deactivate student

### Teachers
- `GET /api/teachers` - List teachers
- `POST /api/teachers` - Create teacher
- `PUT /api/teachers/[id]` - Update teacher

### Other Endpoints
- `GET /api/courses` - List courses
- `GET /api/batches` - List batches
- `GET /api/attendance` - Mark attendance
- `GET /api/fees` - Manage fees
- `GET /api/salary` - Manage salaries
- `GET /api/dashboard` - Dashboard statistics
- `GET /api/notifications` - Notifications
- `GET /api/audit-logs` - Audit logs

## 🔒 Security

- **JWT Authentication** with automatic refresh
- **Password Hashing** using bcryptjs
- **CORS Protection** for API security
- **Audit Logging** of all operations
- **Role-Based Access Control** with granular permissions
- **HttpOnly Cookies** for secure tokens
- **Environment Variables** for sensitive data

## 🐛 Troubleshooting

### MongoDB Connection Error
- Verify `MONGODB_URI` in `.env.local`
- Check MongoDB Atlas IP whitelist
- Verify database user credentials

### API Returns 401 Unauthorized
- Token may be expired
- Try logging in again
- Check browser console for error details

### "npm install" Fails
- Use `npm install --legacy-peer-deps`
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and try again

## 📖 Documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Vercel deployment guide
- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Initial setup instructions

## 🎯 Next Steps

1. ✅ Deploy to Vercel (see DEPLOYMENT.md)
2. ✅ Run seed script to populate data
3. ✅ Test all features
4. ✅ Customize styling and branding
5. ✅ Add your academy's logo and colors
6. ✅ Configure email notifications
7. ✅ Setup monitoring and backups

## 📞 Support

For issues and questions:
- Check documentation files
- Review error messages in console
- Check MongoDB connection
- Verify environment variables

## 🎉 Production Ready

Your Royal Academy ERP system is production-ready and includes:

✅ Complete authentication system
✅ Full CRUD APIs for all modules
✅ Real-time data management
✅ Responsive mobile-first UI
✅ Scalable MongoDB backend
✅ Audit logging and compliance
✅ Multi-role permission system
✅ Optimized for Vercel deployment

**Start deploying now!** See [DEPLOYMENT.md](./DEPLOYMENT.md)
