# Vercel Deployment Guide - Royal Academy ERP

## ✅ Pre-Deployment Checklist

- [x] Database models created
- [x] API routes implemented
- [x] Authentication system setup
- [x] Component fixes applied
- [x] Test data seeding script ready
- [x] Environment configuration ready
- [x] .gitignore configured properly

---

## 📋 Step 1: Setup MongoDB Atlas Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create or use existing cluster
3. Get your connection string from: **Connect → Connect your application**
4. Format: `mongodb+srv://username:password@cluster.mongodb.net/dbname`

---

## 🔐 Step 2: Environment Variables for Vercel

Add these to Vercel Dashboard → Settings → Environment Variables:

```
MONGODB_URI=mongodb+srv://sabeenali1022:YOUR_PASSWORD@ac-cm4heit...
JWT_SECRET=generate-a-random-strong-secret-here
JWT_REFRESH_SECRET=generate-another-random-strong-secret-here
NEXT_PUBLIC_API_URL=/api
NODE_ENV=production
```

**Generate Strong Secrets:**
```bash
# Run this locally to generate secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🚀 Step 3: Deploy to Vercel

### Option A: Using Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### Option B: Using GitHub Integration (Recommended)
1. Push code to GitHub repository
2. Go to [Vercel Dashboard](https://vercel.com)
3. Click "Add New Project"
4. Select your GitHub repository
5. Add environment variables in the "Environment Variables" section
6. Click "Deploy"

---

## 📦 Step 4: Initialize Database on Vercel

After deployment, seed your database:

```bash
# Run locally (this connects to your production database)
npm run seed
```

---

## 🧪 Step 5: Test Your Deployment

1. Go to your Vercel URL (e.g., `https://your-app.vercel.app`)
2. Test login with seed credentials:
   - Email: `superadmin@royalacademy.com`
   - Password: `SuperAdmin@123`

---

## 📋 Test Credentials After Seeding

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@royalacademy.com | SuperAdmin@123 |
| Branch Manager | manager@royalacademy.com | Manager@123 |
| Teacher | ahmed.khan@royalacademy.com | Teacher@123 |
| Student | ali.ahmed@student.royalacademy.com | Student@123 |

---

## 🔧 Vercel Configuration

Your `vercel.json` is already configured:
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install"
}
```

---

## 📊 Important Vercel Limits

| Item | Limit |
|------|-------|
| Function timeout | 60s (Pro plan: 900s) |
| Payload size | 4.5MB |
| Cold start time | Optimize with serverless config |

---

## 🎯 Production Best Practices

### 1. **API Routes Optimization**
- All API routes are in `/app/api/`
- Each route uses Next.js 13+ App Router
- Authentication middleware implemented

### 2. **Database Connection**
- Connection pooling via mongoose
- Cached connections for performance
- Automatic reconnection on failure

### 3. **Security**
- JWT tokens for authentication
- HttpOnly cookies for refresh tokens
- Environment variables for secrets
- CORS configured properly

### 4. **Performance**
- Image optimization via Next.js
- CSS bundling with Tailwind
- API response compression
- Database indexes should be created

---

## 🐛 Troubleshooting

### "MONGODB_URI is undefined"
- Verify environment variable is set in Vercel
- Check variable name exactly matches

### "Function cold start is slow"
- Normal for first request
- Consider upgrading Vercel Pro

### "404 on API endpoints"
- Verify file structure: `/app/api/[route]/route.ts`
- Check dynamic routes have `[id]` in square brackets

---

## 📱 Frontend Configuration

API base URL is set to `/api` (relative path) - this works for both dev and production:

```typescript
// services/api.ts
const API_BASE = '/api'; // ✅ Works on Vercel automatically
```

---

## 🔄 Continuous Deployment

After setup, your app will:
1. Automatically redeploy on git push
2. Run build command: `npm run build`
3. Deploy new version to Vercel URL
4. Keep previous deployments for rollback

---

## 📞 Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [MongoDB Atlas Documentation](https://www.mongodb.com/docs/atlas)
- [Mongoose Documentation](https://mongoosejs.com)

---

## ⚙️ Local Development vs Production

### Local (`npm run dev`)
- Uses `.env.local` file
- `MONGODB_URI=...your-local-string`
- Hot reload enabled
- Source maps available

### Production (Vercel)
- Uses Vercel environment variables
- `MONGODB_URI=...your-production-string`
- Optimized build
- Edge functions enabled

---

## 🎉 You're Ready!

Your Royal Academy ERP is now production-ready. The system includes:

✅ Complete SAAS architecture
✅ Multi-role authentication (Super Admin, Branch Admin, Teacher, Student)
✅ Full CRUD APIs for all modules
✅ Real-time data management
✅ Scalable MongoDB backend
✅ Professional UI with Tailwind CSS

**Next Steps:**
1. Deploy to Vercel
2. Run seed script to populate data
3. Test all features
4. Customize for your academy's needs
5. Add your branding and colors
